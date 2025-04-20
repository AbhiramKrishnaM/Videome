import { useEffect, useRef, useState } from 'react';

interface AudioVisualizerProps {
  stream: MediaStream | null;
  isActive: boolean;
  size?: 'small' | 'medium' | 'large';
  style?: 'bottom' | 'avatar';
}

export function AudioVisualizer({
  stream,
  isActive,
  size = 'small',
  style = 'bottom',
}: AudioVisualizerProps) {
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

  // No need to show anything if inactive
  if (!isActive) return null;

  // Different visualizer styles
  if (style === 'avatar') {
    // Size values for the avatar circle style
    const circleSize = size === 'large' ? 22 : size === 'medium' ? 18 : 14;
    const barWidth = size === 'large' ? 3 : size === 'medium' ? 2 : 1;
    const barCount = 12; // Number of bars around the circle

    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="absolute" style={{ width: '120px', height: '120px' }}>
          {/* Generate circular bars around the avatar */}
          {[...Array(barCount)].map((_, i) => {
            const angle = (i / barCount) * 2 * Math.PI;
            const baseHeight = audioLevel > 5 ? (audioLevel / 100) * circleSize : 2;
            // Dynamic height based on audio level and position
            const height = Math.max(
              2,
              baseHeight + Math.sin(Date.now() / 500 + i) * (baseHeight / 2),
            );

            // Calculate position around the circle (22px radius + height variation)
            const radius = 24 + height;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            return (
              <div
                key={i}
                className="absolute bg-green-500 rounded-full"
                style={{
                  width: `${barWidth}px`,
                  height: `${height}px`,
                  opacity: 0.7,
                  transform: `translate(${60 + x}px, ${60 + y}px) rotate(${angle + Math.PI / 2}rad)`,
                  transition: 'height 0.1s ease-in-out',
                }}
              />
            );
          })}
        </div>
      </div>
    );
  }

  // Default bottom style
  return (
    <div className="absolute bottom-0 left-0 right-0 flex h-6 justify-center">
      <div className={`flex items-end space-x-1 px-2 ${audioLevel > 10 ? 'animate-pulse' : ''}`}>
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
