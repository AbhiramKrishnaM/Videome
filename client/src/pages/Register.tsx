import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/auth.store';
import { getPublicOrganizations, Organization } from '@/services/organization.service';

export default function Register() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { register, error, isLoading } = useAuthStore();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    organization: '',
  });

  // Fetch organizations when component mounts
  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const fetchOrganizations = async () => {
      setIsLoadingOrgs(true);
      try {
        const orgs = await getPublicOrganizations();
        setOrganizations(orgs);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load organizations. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingOrgs(false);
      }
    };

    fetchOrganizations();
  }, []); // Empty dependency array to run only once

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOrganizationChange = (value: string) => {
    setFormData((prev) => ({ ...prev, organization: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await register(formData);
      toast({
        title: 'Registration successful',
        description: 'Your account has been created.',
      });
      navigate('/');
    } catch (error) {
      // Error is already handled in the store
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8 rounded-lg border bg-card p-6 shadow-md">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Create an Account</h1>
          <p className="text-muted-foreground">Sign up to get started with VideoMe</p>
        </div>

        {error && <div className="rounded-md bg-destructive/10 p-3 text-destructive">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="John Doe"
                required
                value={formData.name}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                required
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                value={formData.password}
                onChange={handleChange}
                minLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="organization">Organization</Label>
              <Select
                value={formData.organization}
                onValueChange={handleOrganizationChange}
                disabled={isLoadingOrgs}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an organization" />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org._id} value={org._id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Select your organization. You'll be added as a member once approved.
              </p>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading || isLoadingOrgs}>
            {isLoading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
