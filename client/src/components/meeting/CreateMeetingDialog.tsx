import { useState, useEffect } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useMeetingStore } from '@/store/meeting.store';
import { CreateMeetingData } from '@/types/meeting';
import { User } from '@/types/user';
import { getOrganizationMembers } from '@/services/meeting.service';

interface CreateMeetingDialogProps {
  children: React.ReactNode;
}

export function CreateMeetingDialog({ children }: CreateMeetingDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<CreateMeetingData>({
    title: '',
    description: '',
    invitedUsers: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orgMembers, setOrgMembers] = useState<User[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const { createMeeting } = useMeetingStore();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch organization members when dialog opens
  useEffect(() => {
    if (open) {
      fetchOrgMembers();
    }
  }, [open]);

  const fetchOrgMembers = async () => {
    try {
      setIsLoadingMembers(true);
      const members = await getOrganizationMembers();
      setOrgMembers(members);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load organization members',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUserSelection = (userId: string, checked: boolean) => {
    setFormData((prev) => {
      const currentUsers = prev.invitedUsers || [];

      if (checked) {
        // Add user to invited list
        return {
          ...prev,
          invitedUsers: [...currentUsers, userId],
        };
      } else {
        // Remove user from invited list
        return {
          ...prev,
          invitedUsers: currentUsers.filter((id) => id !== userId),
        };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast({
        title: 'Error',
        description: 'Meeting title is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const meeting = await createMeeting(formData);
      setOpen(false);

      // Reset form
      setFormData({
        title: '',
        description: '',
        invitedUsers: [],
      });

      toast({
        title: 'Success',
        description: 'Meeting created successfully',
      });
      // Navigate to the meeting page
      navigate(`/meeting/${meeting._id}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create meeting';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Meeting</DialogTitle>
            <DialogDescription>Fill in the details to create a new meeting.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                placeholder="Weekly Team Meeting"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Discuss project updates and upcoming tasks"
                value={formData.description}
                onChange={handleChange}
              />
            </div>
            <div className="grid gap-2">
              <Label>Invite Members</Label>
              {isLoadingMembers ? (
                <div className="text-sm text-muted-foreground">Loading organization members...</div>
              ) : orgMembers.length > 0 ? (
                <div className="max-h-[200px] overflow-y-auto rounded-md border p-4">
                  <div className="space-y-4">
                    {orgMembers.map((member) => (
                      <div key={member._id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`user-${member._id}`}
                          checked={formData.invitedUsers?.includes(member._id)}
                          onChange={(e) => handleUserSelection(member._id, e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <label
                          htmlFor={`user-${member._id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {member.name} ({member.email})
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No other organization members found
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Meeting'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
