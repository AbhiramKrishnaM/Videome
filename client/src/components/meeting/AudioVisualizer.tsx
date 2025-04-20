import { useEffect, useRef, useState } from 'react';

interface AudioVisualizerProps {
  stream: MediaStream | null;
  isActive: boolean;
}

export function AudioVisualizer({ stream, isActive }: AudioVisualizerProps) {
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize audio analyzer
  useEffect(() => {
    if (!stream || !isActive) {
      // Clean up if stream is removed or component is inactive
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    // Create audio context if it doesn't exist
    if (!audioContextRef.current) {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioContext();
        console.log('AudioContext created:', audioContextRef.current.state);
      } catch (err) {
        console.error('Failed to create AudioContext:', err);
        return;
      }
    }

    const audioContext = audioContextRef.current;

    // Resume audio context if suspended (browser autoplay policy)
    if (audioContext.state === 'suspended') {
      audioContext
        .resume()
        .then(() => {
          console.log('AudioContext resumed successfully');
        })
        .catch((err) => {
          console.error('Failed to resume AudioContext:', err);
        });
    }

    // Create analyzer node if it doesn't exist
    if (!analyserRef.current) {
      analyserRef.current = audioContext.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8; // Smoother transitions
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);
      console.log('Analyzer created with buffer length:', bufferLength);
    }

    // Connect stream to analyzer (only if not already connected)
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length > 0 && !sourceRef.current) {
      try {
        // Disconnect old source if it exists
        if (sourceRef.current) {
          (sourceRef.current as MediaStreamAudioSourceNode).disconnect();
        }

        // Create new source
        sourceRef.current = audioContext.createMediaStreamSource(stream);
        sourceRef.current.connect(analyserRef.current);
        console.log('Connected audio track to analyzer:', audioTracks[0].label);

        // Log audio track settings for debugging
        console.log('Audio track settings:', audioTracks[0].getSettings());
      } catch (err) {
        console.error('Failed to connect audio stream to analyzer:', err);
        return;
      }

      // Start audio visualization loop
      const updateAudioLevel = () => {
        if (!analyserRef.current || !dataArrayRef.current) return;

        // Get frequency data
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);

        // Calculate average volume level
        let sum = 0;
        for (let i = 0; i < dataArrayRef.current.length; i++) {
          sum += dataArrayRef.current[i];
        }
        const average = sum / dataArrayRef.current.length;

        // Normalize to 0-100 scale with enhanced sensitivity
        const normalizedLevel = Math.min(100, Math.max(0, average * 2));

        // Only update state if there's an actual change
        if (Math.abs(normalizedLevel - audioLevel) > 2) {
          setAudioLevel(normalizedLevel);
        }

        // Continue loop
        animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
      };

      // Start the visualization loop
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    }

    // Cleanup function
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      // Disconnect source but don't close audio context (might be reused)
      if (sourceRef.current) {
        sourceRef.current.disconnect();
        sourceRef.current = null;
      }
    };
  }, [stream, isActive, audioLevel]);

  // No need to show anything if inactive or no audio detected
  if (!isActive) return null;

  return (
    <div className="absolute bottom-8 left-0 right-0 flex h-6 justify-center overflow-hidden">
      <div className="flex items-end space-x-1 px-2">
        {/* Generate 5 wave bars with height based on audio level */}
        {[...Array(5)].map((_, i) => {
          // Calculate height for each bar to create wave effect
          const barIndex = (i + 1) % 5;
          const baseHeight = audioLevel > 3 ? (audioLevel / 100) * 24 : 3;
          // Apply wave pattern based on bar position
          const height = baseHeight * (0.5 + Math.sin(Date.now() / 500 + barIndex) * 0.5);

          return (
            <div
              key={i}
              className="bg-green-500 rounded-t-sm w-1"
              style={{
                height: `${Math.max(3, height)}px`,
                transition: 'height 0.1s ease-in-out',
                opacity: audioLevel > 3 ? 1 : 0.5,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
