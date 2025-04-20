import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useMeetingStore } from '@/store/meeting.store';
import { useAuthStore } from '@/store/auth.store';

export default function Meeting() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated } = useAuthStore();
  const { getMeeting, currentMeeting, isLoading, error, clearError } = useMeetingStore();
  const [videoActive, setVideoActive] = useState(true);
  const [audioActive, setAudioActive] = useState(true);
  const [screenShareActive, setScreenShareActive] = useState(false);

  // Use ref instead of state to track if meeting is fetched
  const meetingFetchedRef = useRef(false);

  // Clear errors on component mount only
  useEffect(() => {
    clearError();
    // Only clean up on unmount - no need to clear on every render
    return () => {
      clearError();
      // Reset the ref when component unmounts
      meetingFetchedRef.current = false;
    };
  }, []); // Empty dependency array - only run on mount and unmount

  const fetchMeeting = useCallback(async () => {
    // Use ref instead of state to prevent re-renders
    if (!id || meetingFetchedRef.current) return;

    try {
      // Mark as fetched before the async call to prevent duplicate calls
      meetingFetchedRef.current = true;
      await getMeeting(id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch meeting';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, [id, getMeeting, toast]);

  useEffect(() => {
    if (!id) {
      navigate('/');
      toast({
        title: 'Error',
        description: 'Invalid meeting ID',
        variant: 'destructive',
      });
      return;
    }

    fetchMeeting();
  }, [id, fetchMeeting, navigate, toast]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-lg">Loading meeting...</p>
      </div>
    );
  }

  if (error || !currentMeeting) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-lg text-red-500">{error || 'Meeting not found or access denied'}</p>
        <Button onClick={() => navigate('/')}>Return to Home</Button>
      </div>
    );
  }

  const toggleVideo = () => {
    setVideoActive((prev) => !prev);
    // Here you would implement actual video stream toggling
  };

  const toggleAudio = () => {
    setAudioActive((prev) => !prev);
    // Here you would implement actual audio stream toggling
  };

  const toggleScreenShare = () => {
    setScreenShareActive((prev) => !prev);
    // Here you would implement actual screen sharing
  };

  const leaveMeeting = () => {
    // Here you would implement disconnection from the meeting
    navigate('/');
    toast({
      title: 'Success',
      description: 'You have left the meeting',
    });
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Meeting header */}
      <div className="flex items-center justify-between border-b p-4">
        <div>
          <h1 className="text-xl font-bold">{currentMeeting.title}</h1>
          <p className="text-sm text-muted-foreground">Code: {currentMeeting.meetingCode}</p>
        </div>
        <Button variant="destructive" onClick={leaveMeeting}>
          Leave Meeting
        </Button>
      </div>

      {/* Video grid */}
      <div className="flex-1 overflow-hidden p-4">
        <div className="grid h-full gap-4 md:grid-cols-2">
          {/* Main video placeholder - in a real app, this would show actual video streams */}
          <div className="flex items-center justify-center rounded-lg bg-gray-800">
            <p className="text-white">Your Video {videoActive ? 'On' : 'Off'}</p>
          </div>

          <div className="flex items-center justify-center rounded-lg bg-gray-800">
            <p className="text-white">Remote User Video</p>
          </div>
        </div>
      </div>

      {/* Controls bar */}
      <div className="flex items-center justify-center gap-4 border-t p-4">
        <Button variant={videoActive ? 'default' : 'outline'} onClick={toggleVideo}>
          {videoActive ? 'Disable Video' : 'Enable Video'}
        </Button>

        <Button variant={audioActive ? 'default' : 'outline'} onClick={toggleAudio}>
          {audioActive ? 'Mute' : 'Unmute'}
        </Button>

        <Button variant={screenShareActive ? 'default' : 'outline'} onClick={toggleScreenShare}>
          {screenShareActive ? 'Stop Sharing' : 'Share Screen'}
        </Button>
      </div>
    </div>
  );
}
