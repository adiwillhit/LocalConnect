import { MapPin, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CreatePostBox } from '../components/CreatePostBox';
import { PostCard } from '../components/PostCard';
import { SkeletonCard } from '../components/SkeletonCard';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';
import { communityService } from '../services/communityService';

export const CommunityDetailsPage = () => {
  const { id } = useParams();
  const { user, isAuthenticated, refreshUser } = useAuth();
  const toast = useToast();

  const [community, setCommunity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [members, setMembers] = useState([]);
  const [tab, setTab] = useState('posts');
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [comm, postsRes, membersRes] = await Promise.all([
        communityService.getById(id),
        communityService.getPosts(id, { limit: 20 }),
        communityService.getMembers(id, { limit: 50 }),
      ]);
      setCommunity(comm);
      setPosts(postsRes.data || []);
      setMembers(membersRes.data || []);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load community'));
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const isMember = Boolean(
    user && community?.members?.some((m) => m === user._id || m?._id === user._id)
  );

  const handleToggleJoin = async () => {
    setJoining(true);
    try {
      if (isMember) {
        await communityService.leave(id);
        toast.success('Left community');
      } else {
        await communityService.join(id);
        toast.success('Joined community!');
      }
      await refreshUser();
      await loadData();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update membership'));
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (!community) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-slate-600">
        Community not found.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900">{community.name}</h1>
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-brand-50 text-brand-700">
              <MapPin className="w-3 h-3" />
              {community.location}
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-600">{community.description}</p>
          <div className="mt-3 flex items-center gap-4 text-xs font-medium text-slate-500">
            <span className="inline-flex items-center gap-1">
              <Users className="w-4 h-4" />
              {community.membersCount ?? members.length} members
            </span>
          </div>
        </div>

        {isAuthenticated && (
          <button
            onClick={handleToggleJoin}
            disabled={joining}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shrink-0 disabled:opacity-50 ${
              isMember
                ? 'bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-600'
                : 'bg-brand-600 text-white hover:bg-brand-700'
            }`}
          >
            {isMember ? 'Leave Community' : 'Join Community'}
          </button>
        )}
      </div>

      {isAuthenticated && (
        <CreatePostBox defaultCommunityId={id} onCreated={loadData} />
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setTab('posts')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            tab === 'posts'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Posts ({posts.length})
        </button>
        <button
          onClick={() => setTab('members')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            tab === 'members'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Members ({members.length})
        </button>
      </div>

      {tab === 'posts' ? (
        posts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500">
            No posts in this community yet.
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                onPostUpdated={(updated) =>
                  setPosts((prev) => prev.map((p) => (p._id === updated._id ? updated : p)))
                }
                onPostDeleted={(deletedId) =>
                  setPosts((prev) => prev.filter((p) => p._id !== deletedId))
                }
              />
            ))}
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {members.map((member) => (
            <Link
              key={member._id}
              to={`/profile/${member._id}`}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 font-semibold flex items-center justify-center">
                {member.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">{member.name}</div>
                <div className="text-xs text-slate-500">{member.location}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

