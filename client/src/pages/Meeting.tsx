import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useMeetingStore } from '@/store/meeting.store';
import { useAuthStore } from '@/store/auth.store';
import { VideoPlayer } from '@/components/meeting/VideoPlayer';
import { CameraTest } from '@/components/meeting/CameraTest';
import { Mic, MicOff, Video, VideoOff, ScreenShare, PhoneOff, Bug } from 'lucide-react';
import * as webrtcService from '@/services/webrtc.service';
import * as socketService from '@/services/socket.service';
import { LocalStream, RemoteStream, getUserMedia } from '@/services/webrtc.service';
import { SocketEvents } from '@/services/socket.service';
import { cn } from '@/lib/utils';
import { Meeting as IMeeting } from '@/types/meeting';

// Define the types we need
interface MeetingWithUsers {
  _id: string;
  title: string;
  meetingCode: string;
  host: string | any; // Update the type to accommodate both string and User object
  participants: string[] | any[]; // Update type to accommodate both string[] and User[]
  createdAt: string;
  updatedAt: string;
}

type Socket = any; // Use any for Socket type to avoid importing socket.io types

// Update the remoteStreamsArray parsing
type RemoteStreamInfo = {
  userId: string;
  stream: MediaStream;
  isScreenShare?: boolean;
};

export default function Meeting() {
  const { id } = useParams<{ id: string }>();
  const { user, token } = useAuthStore();
  const navigate = useNavigate();
  const { clearError } = useMeetingStore();
  const { toast } = useToast();

  // Meeting state
  const [meeting, setMeeting] = useState<any | null>(null);
  const [localError, setError] = useState<string | null>(null);
  const [localLoading, setIsLoading] = useState<boolean>(true);

  // Media state
  const [localStream, setLocalStream] = useState<LocalStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, RemoteStream>>(new Map());
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState<boolean>(true);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const [isCameraOn, setIsCameraOn] = useState<boolean>(true);

  // Debug mode
  const [isDebugMode, setIsDebugMode] = useState(false);

  // Refs to prevent unnecessary rerenders
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<LocalStream | null>(null);
  const remoteStreamsRef = useRef<Map<string, RemoteStream>>(new Map());
  const meetingRef = useRef<MeetingWithUsers | null>(null);
  const hasFetchedMeetingRef = useRef<boolean>(false);
  const socketInitializedRef = useRef<boolean>(false);

  // Clear errors on component mount only
  useEffect(() => {
    clearError();
    // Only clean up on unmount - no need to clear on every render
    return () => {
      clearError();
      // Reset the ref when component unmounts
      hasFetchedMeetingRef.current = false;
    };
  }, []); // Empty dependency array - only run on mount and unmount

  // Function to fetch meeting details
  const fetchMeeting = useCallback(async () => {
    if (!id || !token || !user || hasFetchedMeetingRef.current) return;

    try {
      setIsLoading(true);
      // Use the meeting service function instead of direct fetch
      const data = await useMeetingStore.getState().getMeeting(id);
      setMeeting(data as any);
      meetingRef.current = data as any; // Cast to any to avoid type issues
      hasFetchedMeetingRef.current = true;
    } catch (err) {
      console.error('Error fetching meeting:', err);
      setError('Failed to load meeting details');
    } finally {
      setIsLoading(false);
    }
  }, [id, token, user]);

  // Initialize media and socket when component mounts
  useEffect(() => {
    if (!id || !user || !token) return;

    // Only fetch meeting once
    if (!hasFetchedMeetingRef.current) {
      fetchMeeting();
    }

    // Initialize socket and local stream only once
    if (!socketInitializedRef.current) {
      const setupMeeting = async () => {
        try {
          // Initialize socket
          const socket = socketService.initializeSocket(token);
          socketInitializedRef.current = true;

          // Get local media stream
          const stream = await webrtcService.getLocalStream();
          setLocalStream(stream);
          localStreamRef.current = stream;

          // Join meeting room
          socketService.joinMeeting(id, user);

          // Set up socket event listeners
          setupSocketListeners(socket, id);
        } catch (err) {
          console.error('Error setting up meeting:', err);
          setError('Failed to set up video call');
          setIsLoading(false);
        }
      };

      setupMeeting();
    }

    // Cleanup function
    return () => {
      webrtcService.closeAllPeerConnections();

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      socketService.disconnectSocket();
      socketInitializedRef.current = false;
      hasFetchedMeetingRef.current = false;
    };
  }, [id, token, user, fetchMeeting]);

  // Setup socket listeners - extracted to reduce complexity in main useEffect
  const setupSocketListeners = useCallback(
    (socket: Socket, meetingId: string) => {
      // User joined event
      socketService.onEvent(SocketEvents.USER_JOINED, async ({ user: joinedUser }) => {
        console.log('User joined:', joinedUser);

        if (joinedUser._id === user?._id) return;

        // Create peer connection for the new user
        const peerConnection = webrtcService.createPeerConnection(
          joinedUser._id,
          (candidate) => {
            socketService.sendIceCandidate(joinedUser._id, candidate, user!._id);
          },
          (stream) => {
            console.log('Received remote stream from:', joinedUser._id);
            const updatedStreams = new Map(remoteStreamsRef.current);
            updatedStreams.set(joinedUser._id, stream);
            remoteStreamsRef.current = updatedStreams;
            setRemoteStreams(updatedStreams);
          },
        );

        peerConnectionsRef.current.set(joinedUser._id, peerConnection);

        // Add local stream to peer connection
        if (localStreamRef.current) {
          webrtcService.addLocalStreamToPeerConnection(peerConnection, localStreamRef.current);
        }

        // Create and send offer
        webrtcService
          .createOffer(peerConnection)
          .then((offer) => {
            socketService.sendOffer(joinedUser._id, offer, user!._id);
          })
          .catch(console.error);
      });

      // User left event
      socketService.onEvent(SocketEvents.USER_LEFT, ({ userId }) => {
        console.log('User left:', userId);

        // Remove peer connection and remote stream
        webrtcService.closePeerConnection(userId);
        peerConnectionsRef.current.delete(userId);

        const updatedStreams = new Map(remoteStreamsRef.current);
        updatedStreams.delete(userId);
        remoteStreamsRef.current = updatedStreams;
        setRemoteStreams(updatedStreams);
      });

      // Offer received event
      socketService.onEvent(SocketEvents.OFFER, async ({ offer, from }) => {
        console.log('Received offer from:', from);

        // Create peer connection for the user who sent the offer
        let peerConnection = peerConnectionsRef.current.get(from);
        if (!peerConnection) {
          peerConnection = webrtcService.createPeerConnection(
            from,
            (candidate) => {
              if (!user) return;
              socketService.sendIceCandidate(from, candidate, user._id);
            },
            (stream) => {
              console.log('Received remote stream from:', from);
              const updatedStreams = new Map(remoteStreamsRef.current);
              updatedStreams.set(from, stream);
              remoteStreamsRef.current = updatedStreams;
              setRemoteStreams(updatedStreams);
            },
          );
        }

        peerConnectionsRef.current.set(from, peerConnection);

        // Add local stream to peer connection
        if (localStreamRef.current) {
          webrtcService.addLocalStreamToPeerConnection(peerConnection, localStreamRef.current);
        }

        // Create and send answer
        webrtcService
          .createAnswer(peerConnection, offer)
          .then((answer) => {
            if (!user) return;
            socketService.sendAnswer(from, answer, user._id);
          })
          .catch(console.error);
      });

      // Answer received event
      socketService.onEvent(SocketEvents.ANSWER, async ({ answer, from }) => {
        console.log('Received answer from:', from);

        const peerConnection = peerConnectionsRef.current.get(from);
        if (peerConnection) {
          webrtcService.setRemoteDescription(peerConnection, answer).catch(console.error);
        }
      });

      // ICE candidate received event
      socketService.onEvent(SocketEvents.ICE_CANDIDATE, async ({ candidate, from }) => {
        console.log('Received ICE candidate from:', from);

        const peerConnection = peerConnectionsRef.current.get(from);
        if (peerConnection) {
          webrtcService.addIceCandidate(peerConnection, candidate).catch(console.error);
        }
      });

      // Meeting ended event
      socketService.onEvent(SocketEvents.MEETING_ENDED, () => {
        console.log('Meeting ended');
        navigate('/dashboard');
      });
    },
    [user, navigate],
  );

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const newState = !isAudioEnabled;
      webrtcService.toggleAudioTrack(localStreamRef.current, newState);
      setIsAudioEnabled(newState);
    }
  }, [isAudioEnabled]);

  // Toggle video
  const toggleVideo = async () => {
    try {
      const newVideoState = !isVideoEnabled;
      setIsVideoEnabled(newVideoState);

      if (localStream) {
        if (!newVideoState) {
          // Simply disable video tracks
          webrtcService.toggleVideoTrack(localStream, false);
        } else {
          // If turning on, first check if we need to re-acquire the camera
          const videoTracks = localStream.getVideoTracks();

          if (videoTracks.length === 0 || videoTracks[0].readyState === 'ended') {
            // Need to re-acquire camera
            console.log('Re-acquiring camera for video toggle...');
            const hasAudio = localStream.getAudioTracks().some((track) => track.enabled);

            const newStream = await webrtcService.getUserMedia({
              video: true,
              audio: hasAudio,
            });

            // Replace the stream
            setLocalStream(newStream);
            localStreamRef.current = newStream;

            // Update all peer connections with the new stream
            peerConnectionsRef.current.forEach((pc) => {
              webrtcService.addLocalStreamToPeerConnection(pc, newStream);
            });
          } else {
            // Just enable existing tracks
            webrtcService.toggleVideoTrack(localStream, true);
          }
        }
      } else {
        // No stream exists, get a new one
        const newStream = await webrtcService.getLocalStream(true, isAudioEnabled);
        setLocalStream(newStream);
        localStreamRef.current = newStream;
      }
    } catch (error) {
      console.error('Error toggling video:', error);
      toast({
        title: 'Video Error',
        description: 'Could not toggle video. Please check permissions.',
        variant: 'destructive',
      });
      // Revert the video state
      setIsVideoEnabled(isVideoEnabled);
    }
  };

  // Toggle screen sharing
  const toggleScreenSharing = useCallback(async () => {
    try {
      if (!isScreenSharing) {
        // Start screen sharing
        const screenStream = await webrtcService.getScreenShareStream();

        // Handle the case when user cancels the screen sharing dialog
        if (!screenStream) {
          console.log('Screen sharing was cancelled');
          return;
        }

        // Store the original stream to restore later
        const originalStream = localStreamRef.current;

        // For each peer connection, replace the video track with screen share
        for (const [userId, peerConnection] of peerConnectionsRef.current.entries()) {
          try {
            // Get the video track from screen share stream
            const screenVideoTrack = screenStream.getVideoTracks()[0];

            // Find the sender for video in this peer connection
            const senders = peerConnection.getSenders();
            const videoSender = senders.find(
              (sender) => sender.track && sender.track.kind === 'video',
            );

            if (videoSender && screenVideoTrack) {
              // Replace the track in the peer connection
              await videoSender.replaceTrack(screenVideoTrack);
              console.log(`Replaced video track with screen share for peer: ${userId}`);
            }
          } catch (err) {
            console.error(`Failed to replace track for peer ${userId}:`, err);
          }
        }

        // Add listener for when screen sharing stops (user clicks "Stop sharing")
        screenStream.getVideoTracks()[0].addEventListener('ended', async () => {
          console.log('Screen sharing stopped by user');
          await handleStopScreenSharing();
        });

        // Update refs and state
        localStreamRef.current = screenStream;
        setLocalStream(screenStream);
        setIsScreenSharing(true);
      } else {
        // Stop screen sharing
        await handleStopScreenSharing();
      }
    } catch (err) {
      console.error('Error toggling screen share:', err);
    }
  }, [isScreenSharing]);

  // Helper for stopping screen sharing
  const handleStopScreenSharing = async () => {
    try {
      // Get a new camera stream
      const cameraStream = await webrtcService.getLocalStream();

      // For each peer connection, replace screen share track with camera track
      for (const [userId, peerConnection] of peerConnectionsRef.current.entries()) {
        try {
          // Get the video track from camera stream
          const cameraVideoTrack = cameraStream.getVideoTracks()[0];

          // Find the sender for video in this peer connection
          const senders = peerConnection.getSenders();
          const videoSender = senders.find(
            (sender) => sender.track && sender.track.kind === 'video',
          );

          if (videoSender && cameraVideoTrack) {
            // Replace the track in the peer connection
            await videoSender.replaceTrack(cameraVideoTrack);
            console.log(`Replaced screen share with camera for peer: ${userId}`);
          }
        } catch (err) {
          console.error(`Failed to replace track for peer ${userId}:`, err);
        }
      }

      // Stop all tracks in the current stream
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      // Update refs and state
      localStreamRef.current = cameraStream;
      setLocalStream(cameraStream);
      setIsScreenSharing(false);
    } catch (err) {
      console.error('Error stopping screen share:', err);
    }
  };

  // End meeting
  const handleEndMeeting = useCallback(() => {
    if (id && user) {
      // First notify other participants via socket
      socketService.leaveMeeting(id, user._id);

      // Clean up resources
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      webrtcService.closeAllPeerConnections();
      socketService.disconnectSocket();

      // Navigate back to dashboard or home
      navigate('/');
    }
  }, [id, navigate, user]);

  // Toggle debug mode
  const toggleDebugMode = () => {
    setIsDebugMode(!isDebugMode);
  };

  const toggleCamera = async () => {
    try {
      setIsLoading(true);

      // Toggle the camera state
      const newCameraState = !isCameraOn;
      setIsCameraOn(newCameraState);

      if (localStream) {
        // If turning off, just disable existing tracks
        if (!newCameraState) {
          webrtcService.toggleVideoTrack(localStream, false);
        } else {
          // If turning on, first check if we need to re-acquire the camera
          const videoTracks = localStream.getVideoTracks();

          if (videoTracks.length === 0 || videoTracks[0].readyState === 'ended') {
            // We need to re-acquire the camera
            console.log('Re-acquiring camera...');
            // Get only video, keep audio state as is
            const hasAudio = localStream.getAudioTracks().some((track) => track.enabled);

            const newStream = await webrtcService.getUserMedia({
              video: true,
              audio: hasAudio,
            });

            // Replace the stream
            setLocalStream(newStream);

            // Update all peer connections with the new stream
            peerConnectionsRef.current.forEach((pc) => {
              webrtcService.addLocalStreamToPeerConnection(pc, newStream);
            });
          } else {
            // Just enable existing tracks
            webrtcService.toggleVideoTrack(localStream, true);
          }
        }
      } else {
        // If no stream exists at all, get a new one
        const newStream = await webrtcService.getLocalStream(newCameraState, isAudioEnabled);
        setLocalStream(newStream);

        // Update all peer connections with the new stream
        peerConnectionsRef.current.forEach((pc) => {
          webrtcService.addLocalStreamToPeerConnection(pc, newStream);
        });
      }
    } catch (error) {
      console.error('Error toggling camera:', error);
      toast({
        title: 'Camera Error',
        description: 'Could not toggle camera. Please check permissions.',
        variant: 'destructive',
      });
      // Revert the camera state since we failed
      setIsCameraOn(isCameraOn);
    } finally {
      setIsLoading(false);
    }
  };

  // Clean up when leaving meeting
  useEffect(() => {
    // Return function that gets called when component unmounts
    return () => {
      console.log('Cleaning up meeting resources...');

      // Stop all tracks in local stream
      if (localStream) {
        localStream.getTracks().forEach((track) => {
          track.stop();
        });
      }

      // Stop all remote tracks
      remoteStreams.forEach((stream) => {
        stream.getTracks().forEach((track) => {
          track.stop();
        });
      });

      // Close all peer connections
      peerConnectionsRef.current.forEach((pc) => {
        pc.close();
      });

      // Disconnect socket
      socketService.disconnectSocket();

      console.log('Meeting cleanup complete');
    };
  }, []);

  if (localLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-lg">Loading meeting...</p>
      </div>
    );
  }

  if (localError || !meeting) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-lg text-red-500">{localError || 'Meeting not found or access denied'}</p>
        <Button onClick={() => navigate('/')}>Return to Home</Button>
      </div>
    );
  }

  // Convert remote streams map to array for rendering
  const remoteStreamsArray: RemoteStreamInfo[] = Array.from(remoteStreams.entries()).map(
    ([userId, stream]) => {
      // Check if this stream is a screen share
      const isScreenShare = stream
        .getVideoTracks()
        .some(
          (track) =>
            track.label.toLowerCase().includes('screen') ||
            track.label.toLowerCase().includes('display'),
        );

      return {
        userId,
        stream,
        isScreenShare,
      };
    },
  );

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Meeting header */}
      <div className="flex items-center justify-between border-b p-4">
        <div>
          <h1 className="text-xl font-bold">{meeting.title}</h1>
          <p className="text-sm text-muted-foreground">Code: {meeting.meetingCode}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={toggleDebugMode} title="Debug Mode">
            <Bug size={20} />
          </Button>
          <Button variant="destructive" onClick={handleEndMeeting}>
            End Meeting
          </Button>
        </div>
      </div>

      {/* Debug section */}
      {isDebugMode && (
        <div className="border-b p-4 bg-gray-100 dark:bg-gray-800">
          <h2 className="text-lg font-bold mb-2">Debug Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-md font-semibold">Local Stream Info:</h3>
              <pre className="text-xs overflow-auto bg-gray-200 dark:bg-gray-900 p-2 rounded max-h-32">
                {JSON.stringify(
                  {
                    hasLocalStream: !!localStream,
                    videoTracks: localStream?.getVideoTracks().length || 0,
                    audioTracks: localStream?.getAudioTracks().length || 0,
                    videoEnabled: isVideoEnabled,
                    audioEnabled: isAudioEnabled,
                    screenSharing: isScreenSharing,
                  },
                  null,
                  2,
                )}
              </pre>
            </div>
            <CameraTest />
          </div>
        </div>
      )}

      {/* Video grid */}
      <div className="flex-1 overflow-hidden p-4">
        <div
          className={`grid h-full gap-4 ${
            remoteStreamsArray.length > 0
              ? isScreenSharing || remoteStreamsArray.some((s) => s.isScreenShare)
                ? 'grid-cols-1 md:grid-cols-2 md:grid-rows-2' // Grid layout for screen share
                : 'md:grid-cols-2' // Regular grid
              : ''
          }`}
        >
          {/* Local video, show first if not screen sharing, else show after remote screen share */}
          <VideoPlayer
            stream={localStream}
            isMuted={true}
            isLocal={true}
            username={user?.name || 'You'}
            isVideoEnabled={isVideoEnabled}
            isAudioEnabled={isAudioEnabled}
            isScreenShare={isScreenSharing}
            className={cn('h-full', isScreenSharing ? 'md:col-span-2 md:row-span-1' : '')}
          />

          {/* Remote videos */}
          {remoteStreamsArray.map(({ userId, stream, isScreenShare }) => (
            <VideoPlayer
              key={userId}
              stream={stream}
              username={
                // Try to find user info from meeting participants
                meeting.participants?.find((p: any) => p.user && p.user._id === userId)?.user
                  ?.name || 'Remote User'
              }
              isScreenShare={isScreenShare}
              className={cn('h-full', isScreenShare ? 'md:col-span-2 md:row-span-1' : '')}
            />
          ))}
        </div>
      </div>

      {/* Controls bar */}
      <div className="flex items-center justify-center gap-4 border-t p-4">
        <Button
          variant="outline"
          size="icon"
          className={!isAudioEnabled ? 'bg-red-500 text-white hover:bg-red-600' : ''}
          onClick={toggleAudio}
        >
          {isAudioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
        </Button>

        <Button
          variant="outline"
          size="icon"
          className={!isVideoEnabled ? 'bg-red-500 text-white hover:bg-red-600' : ''}
          onClick={toggleVideo}
        >
          {isVideoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
        </Button>

        <Button
          variant="outline"
          size="icon"
          className={isScreenSharing ? 'bg-blue-500 text-white hover:bg-blue-600' : ''}
          onClick={toggleScreenSharing}
        >
          <ScreenShare size={20} />
        </Button>

        <Button variant="destructive" size="icon" onClick={handleEndMeeting}>
          <PhoneOff size={20} />
        </Button>
      </div>
    </div>
  );
}
