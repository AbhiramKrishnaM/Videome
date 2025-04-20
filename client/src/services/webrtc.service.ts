import { Meeting } from '@/types/meeting';

// Define stream types for easier management
export type LocalStream = MediaStream;
export type RemoteStream = MediaStream;

// Define media constraints type for better type checking
export interface MediaConstraints {
  video: boolean | MediaTrackConstraints;
  audio: boolean | MediaTrackConstraints;
}

// Store active connections
const peerConnections: Record<string, RTCPeerConnection> = {};

// Configuration for STUN/TURN servers
const rtcConfig: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }],
};

/**
 * Get user media with specified constraints
 */
export const getUserMedia = async (constraints: MediaConstraints): Promise<LocalStream> => {
  try {
    console.log('Requesting media access with constraints:', constraints);
    return await navigator.mediaDevices.getUserMedia(constraints);
  } catch (error) {
    console.error('Error accessing media devices:', error);
    throw error;
  }
};

/**
 * Get local media stream (webcam and microphone)
 */
export const getLocalStream = async (video = true, audio = true): Promise<LocalStream> => {
  try {
    console.log('Requesting media access with constraints:', { video, audio });

    // Build more detailed constraints
    const constraints = {
      video: video
        ? {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user', // Front camera for mobile devices
          }
        : false,
      audio: audio
        ? {
            echoCancellation: true,
            noiseSuppression: true,
          }
        : false,
    };

    // First check if we have permissions
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      console.log('Available media devices:', devices);
    } catch (error) {
      console.warn('Could not enumerate devices:', error);
    }

    // Request the stream
    const stream = await getUserMedia(constraints);

    // Log information about the stream
    console.log('Media stream obtained:', {
      streamId: stream.id,
      videoTracks: stream.getVideoTracks().map((track) => ({
        id: track.id,
        label: track.label,
        enabled: track.enabled,
        settings: track.getSettings(),
      })),
      audioTracks: stream.getAudioTracks().map((track) => ({
        id: track.id,
        label: track.label,
        enabled: track.enabled,
      })),
    });

    return stream;
  } catch (error) {
    console.error('Error accessing media devices:', error);

    // Try with just audio if video fails
    if (video && audio) {
      console.log('Retrying with audio only');
      try {
        return await getLocalStream(false, true);
      } catch (audioError) {
        console.error('Failed even with audio only:', audioError);
        throw error; // Throw the original error
      }
    }

    throw error;
  }
};

/**
 * Get screen sharing stream
 */
export const getScreenShareStream = async (): Promise<LocalStream> => {
  try {
    // TypeScript doesn't have complete types for getDisplayMedia
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: false,
    });
    return stream;
  } catch (error) {
    console.error('Error sharing screen:', error);
    throw error;
  }
};

/**
 * Toggle video track in a stream
 */
export const toggleVideoTrack = (stream: LocalStream, enabled: boolean): void => {
  const videoTracks = stream.getVideoTracks();
  videoTracks.forEach((track) => {
    track.enabled = enabled;

    // If disabling video, also stop the track to turn off camera light
    if (!enabled) {
      // Clone the current stream without video tracks for internal reference
      const audioOnlyStream = new MediaStream();
      stream.getAudioTracks().forEach((audioTrack) => {
        audioOnlyStream.addTrack(audioTrack);
      });

      // Stop the video track to turn off camera light
      track.stop();

      console.log('Video track stopped:', track.label);
    }
  });

  // If we're enabling video and there are no video tracks (previously stopped),
  // we'll need to get a new stream with video
  if (enabled && videoTracks.length === 0) {
    console.log('Re-acquiring video track after previous stop');
    // This will be handled by the parent component by getting a new local stream
  }
};

/**
 * Toggle audio track in a stream
 */
export const toggleAudioTrack = (stream: LocalStream, enabled: boolean): void => {
  stream.getAudioTracks().forEach((track) => {
    track.enabled = enabled;
  });
};

/**
 * Replace video track with screen share track
 */
export const replaceTrackWithScreenShare = async (
  stream: LocalStream,
  peerConnection: RTCPeerConnection,
): Promise<LocalStream> => {
  try {
    const screenStream = await getScreenShareStream();
    const videoTrack = screenStream.getVideoTracks()[0];

    // Get all senders from the peer connection
    const senders = peerConnection.getSenders();

    // Find the sender that's sending the video track
    const videoSender = senders.find((sender) => sender.track && sender.track.kind === 'video');

    if (videoSender) {
      await videoSender.replaceTrack(videoTrack);
    }

    // Listen for when screen sharing stops
    videoTrack.onended = async () => {
      // Get a new camera stream
      const newStream = await getLocalStream();
      const newVideoTrack = newStream.getVideoTracks()[0];

      if (videoSender) {
        await videoSender.replaceTrack(newVideoTrack);
      }

      // Return the updated stream with camera
      return newStream;
    };

    return screenStream;
  } catch (error) {
    console.error('Error replacing track with screen share:', error);
    throw error;
  }
};

/**
 * Create a peer connection for a given user
 */
export const createPeerConnection = (
  userId: string,
  onIceCandidate: (candidate: RTCIceCandidate) => void,
  onTrack: (stream: RemoteStream) => void,
): RTCPeerConnection => {
  // Create new connection
  const peerConnection = new RTCPeerConnection(rtcConfig);

  // Store connection
  peerConnections[userId] = peerConnection;

  // Set up event listeners
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      onIceCandidate(event.candidate);
    }
  };

  peerConnection.ontrack = (event) => {
    onTrack(event.streams[0]);
  };

  return peerConnection;
};

/**
 * Add local stream to peer connection
 */
export const addLocalStreamToPeerConnection = (
  peerConnection: RTCPeerConnection,
  stream: LocalStream,
): void => {
  stream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, stream);
  });
};

/**
 * Create offer for peer connection
 */
export const createOffer = async (
  peerConnection: RTCPeerConnection,
): Promise<RTCSessionDescriptionInit> => {
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  return offer;
};

/**
 * Create answer for peer connection
 */
export const createAnswer = async (
  peerConnection: RTCPeerConnection,
  offer: RTCSessionDescriptionInit,
): Promise<RTCSessionDescriptionInit> => {
  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  return answer;
};

/**
 * Set remote description for peer connection
 */
export const setRemoteDescription = async (
  peerConnection: RTCPeerConnection,
  description: RTCSessionDescriptionInit,
): Promise<void> => {
  await peerConnection.setRemoteDescription(new RTCSessionDescription(description));
};

/**
 * Add ICE candidate to peer connection
 */
export const addIceCandidate = async (
  peerConnection: RTCPeerConnection,
  candidate: RTCIceCandidateInit,
): Promise<void> => {
  await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
};

/**
 * Close and clean up peer connection
 */
export const closePeerConnection = (userId: string): void => {
  if (peerConnections[userId]) {
    peerConnections[userId].close();
    delete peerConnections[userId];
  }
};

/**
 * Close all peer connections
 */
export const closeAllPeerConnections = (): void => {
  Object.keys(peerConnections).forEach((userId) => {
    peerConnections[userId].close();
    delete peerConnections[userId];
  });
};
