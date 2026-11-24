import { MapPin, LogOut, Menu, X, User as UserIcon } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-sm">
            <MapPin className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            Local<span className="text-brand-600">Connect</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="hover:text-brand-600 transition-colors">
                Feed
              </Link>
              <Link to="/communities" className="hover:text-brand-600 transition-colors">
                Communities
              </Link>
              <Link
                to={`/profile/${user._id}`}
                className="flex items-center gap-1.5 hover:text-brand-600 transition-colors"
              >
                <UserIcon className="w-4 h-4" />
                <span>{user.name}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/communities" className="hover:text-brand-600 transition-colors">
                Explore Communities
              </Link>
              <Link to="/login" className="hover:text-brand-600 transition-colors">
                Log in
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors shadow-sm"
              >
                Join LocalConnect
              </Link>
            </>
          )}
        </nav>

        <button
          onClick={() => setMobileOpen((prev) => !prev)}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-2 text-sm font-medium">
          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="block py-2 text-slate-700"
              >
                Home Feed
              </Link>
              <Link
                to="/communities"
                onClick={() => setMobileOpen(false)}
                className="block py-2 text-slate-700"
              >
                Explore Communities
              </Link>
              <Link
                to={`/profile/${user._id}`}
                onClick={() => setMobileOpen(false)}
                className="block py-2 text-slate-700"
              >
                My Profile
              </Link>
              <Link
                to="/settings"
                onClick={() => setMobileOpen(false)}
                className="block py-2 text-slate-700"
              >
                Settings
              </Link>
              <button
                onClick={() => {
                  setMobileOpen(false);
                  handleLogout();
                }}
                className="w-full text-left py-2 text-red-600"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/communities"
                onClick={() => setMobileOpen(false)}
                className="block py-2 text-slate-700"
              >
                Explore Communities
              </Link>
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="block py-2 text-slate-700"
              >
                Log in
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileOpen(false)}
                className="block py-2 text-brand-600 font-semibold"
              >
                Create Account
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
};

