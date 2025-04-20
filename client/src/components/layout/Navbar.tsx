import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/mode-toggle';
import { useAuthStore } from '@/store/auth.store';
import { User } from 'lucide-react';
import { NotificationIcon } from '@/components/notifications/NotificationIcon';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold">VideoMe</span>
          </Link>

          {isAuthenticated && (
            <nav className="hidden md:flex">
              <ul className="flex items-center gap-6">
                <li>
                  <Link to="/meetings" className="text-sm font-medium hover:text-primary">
                    Meetings
                  </Link>
                </li>
                {isAdmin && (
                  <li>
                    <Link to="/users" className="text-sm font-medium hover:text-primary">
                      Users
                    </Link>
                  </li>
                )}
              </ul>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <NotificationIcon />

              <Link to="/profile" className="flex items-center gap-2">
                <User className="h-5 w-5" />
                <span className="hidden text-sm font-medium md:inline-block">{user?.name}</span>
              </Link>
              <Button variant="outline" size="sm" onClick={() => logout()}>
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Sign Up</Button>
              </Link>
            </div>
          )}
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}
