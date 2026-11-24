import { MapPin, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const CommunityCard = ({ community, onToggleMembership, busy = false }) => {
  const { user, isAuthenticated } = useAuth();
  const isMember = Boolean(
    user &&
      Array.isArray(community.members) &&
      community.members.some((id) => id === user._id || id?._id === user._id)
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between gap-4">
      <div>
        <div className="flex items-start justify-between gap-2">
          <Link
            to={`/communities/${community._id}`}
            className="text-base font-semibold text-slate-900 hover:text-brand-600"
          >
            {community.name}
          </Link>
          <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 shrink-0">
            <MapPin className="w-3 h-3 text-brand-600" />
            {community.location}
          </span>
        </div>
        <p className="mt-2 text-sm text-slate-600 line-clamp-2">{community.description}</p>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <Users className="w-4 h-4" />
          {community.membersCount ?? community.members?.length ?? 0} members
        </span>

        <div className="flex items-center gap-2">
          <Link
            to={`/communities/${community._id}`}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            View
          </Link>
          {isAuthenticated && onToggleMembership && (
            <button
              onClick={() => onToggleMembership(community._id, isMember)}
              disabled={busy}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                isMember
                  ? 'bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-600'
                  : 'bg-brand-600 text-white hover:bg-brand-700'
              }`}
            >
              {isMember ? 'Leave' : 'Join'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

