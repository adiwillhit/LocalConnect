import { Compass, Flame, Home, Settings, User, Users, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { communityService } from '../services/communityService';
import { postService } from '../services/postService';

export const DashboardLayout = ({ children }) => {
  const { user } = useAuth();
  const [trendingCommunities, setTrendingCommunities] = useState([]);
  const [popularPosts, setPopularPosts] = useState([]);

  useEffect(() => {
    let active = true;
    const loadSidebar = async () => {
      try {
        const [commRes, popRes] = await Promise.all([
          communityService.getAll({ limit: 4 }),
          postService.getPopular(4),
        ]);
        if (active) {
          setTrendingCommunities(commRes.data || []);
          setPopularPosts(popRes || []);
        }
      } catch {
        // Sidebar widgets fail silently if unavailable
      }
    };
    loadSidebar();
    return () => {
      active = false;
    };
  }, []);

  const navItems = [
    { to: '/dashboard', label: 'Home', icon: Home },
    { to: '/communities', label: 'Explore Communities', icon: Compass },
    { to: '/my-communities', label: 'My Communities', icon: Users },
    { to: `/profile/${user?._id}`, label: 'My Profile', icon: User },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar */}
        <aside className="hidden lg:block lg:col-span-3">
          <div className="sticky top-24 bg-white rounded-2xl border border-slate-200 p-3 shadow-sm space-y-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        </aside>

        {/* Main Section */}
        <main className="lg:col-span-6 space-y-5 min-w-0">{children}</main>

        {/* Right Sidebar */}
        <aside className="hidden lg:block lg:col-span-3 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 mb-3">
              <TrendingUp className="w-4 h-4 text-brand-600" />
              <span>Trending Communities</span>
            </div>
            {trendingCommunities.length === 0 ? (
              <p className="text-xs text-slate-400">No communities yet.</p>
            ) : (
              <div className="space-y-2.5">
                {trendingCommunities.map((c) => (
                  <Link
                    key={c._id}
                    to={`/communities/${c._id}`}
                    className="block p-2.5 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <div className="text-sm font-medium text-slate-800">{c.name}</div>
                    <div className="text-xs text-slate-500">
                      {c.location} · {c.membersCount ?? 0} members
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 mb-3">
              <Flame className="w-4 h-4 text-rose-500" />
              <span>Popular Posts</span>
            </div>
            {popularPosts.length === 0 ? (
              <p className="text-xs text-slate-400">No popular posts yet.</p>
            ) : (
              <div className="space-y-2.5">
                {popularPosts.map((p) => (
                  <Link
                    key={p._id}
                    to={`/communities/${p.communityId?._id || p.communityId}`}
                    className="block p-2.5 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <div className="text-sm font-medium text-slate-800 line-clamp-1">{p.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {p.likesCount ?? 0} likes · {p.category}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

