import { Button } from '@/components/ui/button';
import { CreateMeetingDialog } from '@/components/meeting/CreateMeetingDialog';
import { JoinMeetingDialog } from '@/components/meeting/JoinMeetingDialog';
import { useAuthStore } from '@/store/auth.store';
import { useEffect } from 'react';
import { useMeetingStore } from '@/store/meeting.store';

export default function Home() {
  const { isAuthenticated } = useAuthStore();
  const { fetchMeetings, meetings } = useMeetingStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchMeetings();
    }
  }, [isAuthenticated, fetchMeetings]);

  return (
    <div className="container flex flex-col items-center justify-center space-y-8 py-16 md:py-24">
      <h1 className="text-center text-4xl font-bold tracking-tight md:text-6xl">
        Welcome to <span className="text-primary">VideoMe</span>
      </h1>
      <p className="max-w-[42rem] text-center text-lg text-muted-foreground md:text-xl">
        A modern video conferencing platform for seamless communication
      </p>
      <div className="flex gap-4">
        <CreateMeetingDialog>
          <Button size="lg">Start a Meeting</Button>
        </CreateMeetingDialog>

        <JoinMeetingDialog>
          <Button size="lg" variant="outline">
            Join a Meeting
          </Button>
        </JoinMeetingDialog>
      </div>

      {isAuthenticated && meetings.length > 0 && (
        <div className="mt-12 w-full max-w-3xl">
          <h2 className="mb-4 text-2xl font-bold">Your Meetings</h2>
          <div className="grid gap-4">
            {meetings.map((meeting) => (
              <div
                key={meeting._id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div>
                  <h3 className="font-medium">{meeting.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {meeting.description || 'No description'}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Code: {meeting.meetingCode}</p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href={`/meeting/${meeting._id}`}>Join</a>
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
