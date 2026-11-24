import { Plus, Search, MapPin } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { CommunityCard } from '../components/CommunityCard';
import { SkeletonCard } from '../components/SkeletonCard';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';
import { communityService } from '../services/communityService';

export const CommunitiesPage = ({ myOnly = false }) => {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const toast = useToast();

  const [communities, setCommunities] = useState([]);
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [newComm, setNewComm] = useState({ name: '', description: '', location: '' });
  const [creating, setCreating] = useState(false);

  const loadCommunities = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 50 };
      if (search.trim()) params.search = search.trim();
      if (location.trim()) params.location = location.trim();

      const res = await communityService.getAll(params);
      let list = res.data || [];

      if (myOnly && user) {
        list = list.filter((c) =>
          c.members?.some((m) => m === user._id || m?._id === user._id)
        );
      }
      setCommunities(list);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load communities'));
    } finally {
      setLoading(false);
    }
  }, [search, location, myOnly, user, toast]);

  useEffect(() => {
    loadCommunities();
  }, [loadCommunities]);

  const handleToggleMembership = async (communityId, isMember) => {
    setBusyId(communityId);
    try {
      if (isMember) {
        await communityService.leave(communityId);
        toast.success('Left community');
      } else {
        await communityService.join(communityId);
        toast.success('Joined community!');
      }
      await refreshUser();
      await loadCommunities();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Action failed'));
    } finally {
      setBusyId('');
    }
  };

  const handleCreateCommunity = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await communityService.create(newComm);
      setNewComm({ name: '', description: '', location: '' });
      setShowCreate(false);
      toast.success('Community created!');
      await refreshUser();
      await loadCommunities();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to create community'));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {myOnly ? 'My Communities' : 'Explore Communities'}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {myOnly
              ? 'Communities you have joined.'
              : 'Discover and join hyperlocal communities near you.'}
          </p>
        </div>

        {isAuthenticated && (
          <button
            onClick={() => setShowCreate((prev) => !prev)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors self-start"
          >
            <Plus className="w-4 h-4" />
            Create Community
          </button>
        )}
      </div>

      {showCreate && (
        <form
          onSubmit={handleCreateCommunity}
          className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4"
        >
          <h2 className="text-base font-semibold text-slate-900">Launch a New Community</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Community name (e.g., Srinagar Community)"
              value={newComm.name}
              onChange={(e) => setNewComm((p) => ({ ...p, name: e.target.value }))}
              minLength={2}
              required
              className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <input
              type="text"
              placeholder="City / Location (e.g., Srinagar)"
              value={newComm.location}
              onChange={(e) => setNewComm((p) => ({ ...p, location: e.target.value }))}
              minLength={2}
              required
              className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <textarea
            rows={2}
            placeholder="Describe what this community is about..."
            value={newComm.description}
            onChange={(e) => setNewComm((p) => ({ ...p, description: e.target.value }))}
            minLength={5}
            required
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-5 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      )}

      {/* Search & Location Filter */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search communities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="relative">
          <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter by location (e.g., Delhi, Srinagar)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : communities.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-sm text-slate-500">
          No communities match your filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {communities.map((community) => (
            <CommunityCard
              key={community._id}
              community={community}
              busy={busyId === community._id}
              onToggleMembership={handleToggleMembership}
            />
          ))}
        </div>
      )}
    </div>
  );
};

