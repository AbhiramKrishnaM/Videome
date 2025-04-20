import { useEffect, useRef, useState } from 'react';

interface AudioVisualizerProps {
  stream: MediaStream | null;
  isActive: boolean;
}

export function AudioVisualizer({ stream, isActive }: AudioVisualizerProps) {
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize audio analyzer
  useEffect(() => {
    if (!stream || !isActive) {
      // Clean up if stream is removed or component is inactive
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current?.state === 'running') {
        audioContextRef.current.suspend();
      }
      return;
    }

    // Create audio context and analyzer if they don't exist
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    const audioContext = audioContextRef.current;

    // Create analyzer node
    if (!analyserRef.current) {
      analyserRef.current = audioContext.createAnalyser();
      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);
    }

    // Connect stream to analyzer
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length > 0) {
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      // Start audio visualization loop
      const updateAudioLevel = () => {
        if (!analyserRef.current || !dataArrayRef.current) return;

        analyserRef.current.getByteFrequencyData(dataArrayRef.current);

        // Calculate average volume level
        let sum = 0;
        for (let i = 0; i < dataArrayRef.current.length; i++) {
          sum += dataArrayRef.current[i];
        }
        const average = sum / dataArrayRef.current.length;
        // Normalize to 0-100 scale
        const normalizedLevel = Math.min(100, Math.max(0, average * 1.5));

        setAudioLevel(normalizedLevel);
        animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
      };

      updateAudioLevel();
    }

    // Cleanup function
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [stream, isActive]);

  // No need to show anything if inactive
  if (!isActive) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 flex h-6 justify-center overflow-hidden">
      <div className="flex items-end space-x-1 px-2">
        {/* Generate 5 wave bars with height based on audio level */}
        {[...Array(5)].map((_, i) => {
          // Calculate height for each bar to create wave effect
          const barIndex = (i + 1) % 5;
          const baseHeight = audioLevel > 5 ? (audioLevel / 100) * 24 : 3;
          // Apply wave pattern based on bar position
          const height = baseHeight * (0.5 + Math.sin(Date.now() / 500 + barIndex) * 0.5);

          return (
            <div
              key={i}
              className="bg-green-500 rounded-t-sm w-1"
              style={{
                height: `${Math.max(3, height)}px`,
                transition: 'height 0.1s ease-in-out',
                opacity: audioLevel > 5 ? 1 : 0.5,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
