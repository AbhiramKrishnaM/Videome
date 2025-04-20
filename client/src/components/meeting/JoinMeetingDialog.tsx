import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useMeetingStore } from '@/store/meeting.store';
import { JoinMeetingData } from '@/types/meeting';

interface JoinMeetingDialogProps {
  children: React.ReactNode;
}

export function JoinMeetingDialog({ children }: JoinMeetingDialogProps) {
  const [open, setOpen] = useState(false);
  const [meetingCode, setMeetingCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { joinMeeting } = useMeetingStore();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!meetingCode.trim()) {
      toast({
        title: 'Error',
        description: 'Meeting code is required',
        variant: 'destructive',
      });
      return;
    }

    if (isSubmitting) return; // Prevent multiple submissions

    try {
      setIsSubmitting(true);
      const data: JoinMeetingData = { meetingCode: meetingCode.trim() };
      const meeting = await joinMeeting(data);

      toast({
        title: 'Success',
        description: 'Joined meeting successfully',
      });

      // Close dialog before navigation to prevent state updates after unmounting
      setOpen(false);

      // Navigate after a small delay to ensure dialog is closed properly
      setTimeout(() => {
        navigate(`/meeting/${meeting._id}`);
      }, 100);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to join meeting';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Join a Meeting</DialogTitle>
            <DialogDescription>
              Enter the meeting code to join an existing meeting.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="meetingCode">Meeting Code</Label>
              <Input
                id="meetingCode"
                placeholder="Enter meeting code"
                value={meetingCode}
                onChange={(e) => setMeetingCode(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Joining...' : 'Join Meeting'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
