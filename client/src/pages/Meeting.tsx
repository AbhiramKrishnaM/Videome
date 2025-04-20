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
import { LocalStream, RemoteStream } from '@/services/webrtc.service';
import { SocketEvents } from '@/services/socket.service';

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

interface User {
  _id: string;
  name: string;
  email: string;
  id?: string;
}

type Socket = any; // Use any for Socket type to avoid importing socket.io types

export default function Meeting() {
  const { id } = useParams<{ id: string }>();
  const { user, token } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getMeeting, currentMeeting, isLoading, error, clearError } = useMeetingStore();

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
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const newState = !isVideoEnabled;
      webrtcService.toggleVideoTrack(localStreamRef.current, newState);
      setIsVideoEnabled(newState);
    }
  }, [isVideoEnabled]);

  // Toggle screen sharing
  const toggleScreenSharing = useCallback(async () => {
    if (!localStreamRef.current || peerConnectionsRef.current.size === 0) return;

    try {
      if (!isScreenSharing) {
        // Start screen sharing
        const firstPeerConnection = peerConnectionsRef.current.values().next().value;
        const screenStream = await webrtcService.getScreenShareStream();
        localStreamRef.current = screenStream;
        setLocalStream(screenStream);
        setIsScreenSharing(true);
      } else {
        // Stop screen sharing
        const stream = await webrtcService.getLocalStream();
        localStreamRef.current = stream;
        setLocalStream(stream);
        setIsScreenSharing(false);
      }
    } catch (err) {
      console.error('Error toggling screen share:', err);
    }
  }, [isScreenSharing]);

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
  const remoteStreamsArray = Array.from(remoteStreams.entries()).map(([userId, stream]) => ({
    userId,
    stream,
  }));

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
          className={`grid h-full gap-4 ${remoteStreamsArray.length > 0 ? 'md:grid-cols-2' : ''}`}
        >
          {/* Local video */}
          <VideoPlayer
            stream={localStream}
            isMuted={true}
            isLocal={true}
            username={user?.name || 'You'}
            isVideoEnabled={isVideoEnabled}
            isAudioEnabled={isAudioEnabled}
            className="h-full"
          />

          {/* Remote videos */}
          {remoteStreamsArray.map(({ userId, stream }) => (
            <VideoPlayer key={userId} stream={stream} username="Remote User" className="h-full" />
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
