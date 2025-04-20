import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface VideoPlayerProps {
  stream: MediaStream | null;
  isMuted?: boolean;
  isLocal?: boolean;
  className?: string;
  username?: string;
  isAudioEnabled?: boolean;
  isVideoEnabled?: boolean;
}

export function VideoPlayer({
  stream,
  isMuted = false,
  isLocal = false,
  className,
  username = 'User',
  isAudioEnabled = true,
  isVideoEnabled = true,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !stream) {
      console.log('No video element or stream available', {
        hasVideo: !!videoElement,
        hasStream: !!stream,
      });
      return;
    }

    try {
      console.log('Setting video stream for', username, {
        streamId: stream.id,
        hasVideoTracks: !!stream.getVideoTracks().length,
      });

      // Set stream to video element
      videoElement.srcObject = stream;

      // Define event handlers
      const handleLoadedMetadata = () => {
        console.log('Video metadata loaded for', username);
        videoElement
          .play()
          .then(() => {
            console.log('Video playback started for', username);
            setIsPlaying(true);
          })
          .catch((err) => {
            console.error('Video play error:', err);
            setVideoError(`Play error: ${err.message}`);
          });
      };

      const handleError = (e: Event) => {
        console.error('Video error for', username, e);
        setVideoError('Video element error');
        setIsPlaying(false);
      };

      // Add event listeners
      videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.addEventListener('error', handleError);

      // Clean up
      return () => {
        videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
        videoElement.removeEventListener('error', handleError);
        videoElement.srcObject = null;
      };
    } catch (error) {
      console.error('Error setting up video stream:', error);
      setVideoError(`Setup error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [stream, username]);

  // Check for video tracks and their enabled state
  const videoTracks = stream?.getVideoTracks();
  const hasVideoTracks = !!videoTracks && videoTracks.length > 0;
  const isVideoTrackEnabled = hasVideoTracks && !!videoTracks[0]?.enabled;

  // Handle the case when no video is enabled
  const isNoVideo =
    !stream || !isVideoEnabled || !hasVideoTracks || !isVideoTrackEnabled || !isPlaying;

  return (
    <div className={cn('relative overflow-hidden rounded-lg bg-gray-800', className)}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isMuted}
        className={cn('h-full w-full object-cover', isNoVideo && 'hidden')}
      />

      {isNoVideo && (
        <div className="flex h-full w-full items-center justify-center bg-gray-800">
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl text-white">
              {username.charAt(0).toUpperCase()}
            </div>
            {videoError && <p className="text-xs text-red-400">{videoError}</p>}
          </div>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent p-3 text-white">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {username} {isLocal ? '(You)' : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!isAudioEnabled && (
            <div className="rounded-full bg-red-500 p-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="1" y1="1" x2="23" y2="23"></line>
                <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
                <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
                <line x1="12" y1="19" x2="12" y2="23"></line>
                <line x1="8" y1="23" x2="16" y2="23"></line>
              </svg>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
