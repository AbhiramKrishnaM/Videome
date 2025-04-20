import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

export function CameraTest() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStarted, setIsStarted] = useState(false);

  const startCamera = async () => {
    try {
      setError(null);
      setIsStarted(true);

      console.log('Requesting camera access...');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: true,
      });

      console.log('Camera access granted:', {
        videoTracks: mediaStream.getVideoTracks().length,
        audioTracks: mediaStream.getAudioTracks().length,
      });

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        console.log('Stream attached to video element');
      } else {
        console.error('Video ref is null');
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError(`Camera access error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => {
        console.log(`Stopping track: ${track.kind}`);
        track.stop();
      });

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      setStream(null);
      setIsStarted(false);
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  return (
    <div className="flex flex-col items-center gap-4 p-4 border rounded-lg">
      <h2 className="text-xl font-bold">Camera Test</h2>

      <div
        className="relative bg-gray-800 rounded-lg overflow-hidden"
        style={{ width: '320px', height: '240px' }}
      >
        {isStarted ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            onLoadedMetadata={() => console.log('Video metadata loaded')}
            onPlay={() => console.log('Video playback started')}
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-white">
            Camera Off
          </div>
        )}
      </div>

      {error && <div className="text-red-500 text-sm">{error}</div>}

      <div className="flex gap-2">
        {!isStarted ? (
          <Button onClick={startCamera}>Start Camera</Button>
        ) : (
          <Button variant="destructive" onClick={stopCamera}>
            Stop Camera
          </Button>
        )}
      </div>
    </div>
  );
}
