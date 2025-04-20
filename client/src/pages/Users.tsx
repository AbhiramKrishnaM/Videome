import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUsersStore } from '@/store/users.store';
import { useAuthStore } from '@/store/auth.store';
import { useToast } from '@/hooks/use-toast';
import { User } from '@/types/user';
import { Badge } from '@/components/ui/badge';

export default function Users() {
  const { users, fetchUsers, deleteUser, isLoading, error } = useUsersStore();
  const { user: currentUser } = useAuthStore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Filter users based on search term and organization (for org_admin)
  const filteredUsers = users.filter((user) => {
    // Basic search filter
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.organization?.name || '').toLowerCase().includes(searchTerm.toLowerCase());

    // Organization filter for org_admin
    const organizationFilter =
      currentUser?.role === 'org_admin'
        ? user.organization?._id === currentUser.organization
        : true;

    return matchesSearch && organizationFilter;
  });

  const handleDelete = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUser(userId);
        toast({
          title: 'User deleted',
          description: 'The user has been deleted successfully.',
        });
      } catch (error) {
        // Error is handled in the store
      }
    }
  };

  // Determine if current user can delete the target user
  const canDeleteUser = (targetUser: User) => {
    if (currentUser?.role === 'super_admin') {
      return true; // Super admin can delete any user
    } else if (currentUser?.role === 'org_admin') {
      // Org admin can only delete users in their org and with lower roles
      return (
        targetUser.organization?._id === currentUser.organization &&
        targetUser.role !== 'super_admin' &&
        targetUser.role !== 'org_admin'
      );
    }
    return false;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'org_admin':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'admin':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="container py-8">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold">Users Management</h1>
        <p className="text-muted-foreground">
          {currentUser?.role === 'org_admin'
            ? 'View and manage users in your organization'
            : 'View and manage all user accounts'}
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-destructive/10 p-3 text-destructive">{error}</div>
      )}

      <div className="mb-6">
        <Input
          placeholder="Search users by name, email, or organization..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="p-3 text-left font-medium">Name</th>
                <th className="p-3 text-left font-medium">Email</th>
                <th className="p-3 text-left font-medium">Organization</th>
                <th className="p-3 text-left font-medium">Role</th>
                <th className="p-3 text-left font-medium">Joined On</th>
                <th className="p-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center">
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user: User) => (
                  <tr key={user._id} className="border-b hover:bg-muted/40">
                    <td className="p-3 font-medium">{user.name}</td>
                    <td className="p-3">{user.email}</td>
                    <td className="p-3">
                      {user.organization ? (
                        <div className="flex items-center gap-2">
                          {user.organization.logo && (
                            <img
                              src={user.organization.logo}
                              alt={user.organization.name}
                              className="h-5 w-5 rounded-full"
                            />
                          )}
                          <span>{user.organization.name}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">None</span>
                      )}
                    </td>
                    <td className="p-3">
                      <Badge className={getRoleBadgeColor(user.role)}>{user.role}</Badge>
                    </td>
                    <td className="p-3">{formatDate(user.createdAt)}</td>
                    <td className="p-3">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => alert('Edit user: ' + user._id)}
                          disabled={!canDeleteUser(user)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(user._id)}
                          disabled={!canDeleteUser(user)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
