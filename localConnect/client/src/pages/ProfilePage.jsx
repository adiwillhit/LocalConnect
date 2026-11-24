import { MapPin, Pencil, UserCheck, UserPlus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PostCard } from '../components/PostCard';
import { SkeletonCard } from '../components/SkeletonCard';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';
import { postService } from '../services/postService';
import { userService } from '../services/userService';

export const ProfilePage = () => {
  const { id } = useParams();
  const { user: currentUser, isAuthenticated, refreshUser } = useAuth();
  const toast = useToast();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [tab, setTab] = useState('posts');
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', bio: '', location: '' });

  const isOwnProfile = currentUser?._id === id;
  const isFollowing = Boolean(
    currentUser &&
      profile?.followers?.some((f) => f === currentUser._id || f?._id === currentUser._id)
  );

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const [prof, postsRes, followersRes, followingRes] = await Promise.all([
        userService.getProfile(id),
        postService.getAll({ userId: id, limit: 20 }),
        userService.getFollowers(id, { limit: 50 }),
        userService.getFollowing(id, { limit: 50 }),
      ]);
      setProfile(prof);
      setEditForm({ name: prof.name || '', bio: prof.bio || '', location: prof.location || '' });
      setPosts(postsRes.data || []);
      setFollowers(followersRes.data || []);
      setFollowing(followingRes.data || []);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load profile'));
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleToggleFollow = async () => {
    try {
      if (isFollowing) {
        await userService.unfollow(id);
        toast.success('Unfollowed user');
      } else {
        await userService.follow(id);
        toast.success('Followed user!');
      }
      await refreshUser();
      await loadProfile();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Action failed'));
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      await userService.updateMe(editForm);
      setEditing(false);
      toast.success('Profile updated!');
      await refreshUser();
      await loadProfile();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update profile'));
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

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-slate-600">
        User not found.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-brand-100 text-brand-700 text-2xl font-bold flex items-center justify-center shrink-0">
              {profile.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{profile.name}</h1>
              <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-1">
                <MapPin className="w-4 h-4 text-brand-600" />
                <span>{profile.location}</span>
              </div>
              {profile.bio && <p className="mt-2 text-sm text-slate-600">{profile.bio}</p>}

              <div className="mt-3 flex items-center gap-5 text-sm font-medium text-slate-700">
                <span>
                  <strong>{profile.followersCount ?? followers.length}</strong>{' '}
                  <span className="text-slate-500">Followers</span>
                </span>
                <span>
                  <strong>{profile.followingCount ?? following.length}</strong>{' '}
                  <span className="text-slate-500">Following</span>
                </span>
                <span>
                  <strong>{posts.length}</strong>{' '}
                  <span className="text-slate-500">Posts</span>
                </span>
              </div>
            </div>
          </div>

          {isOwnProfile ? (
            <button
              onClick={() => setEditing((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 self-start"
            >
              <Pencil className="w-4 h-4" />
              Edit Profile
            </button>
          ) : (
            isAuthenticated && (
              <button
                onClick={handleToggleFollow}
                className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors self-start ${
                  isFollowing
                    ? 'bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-600'
                    : 'bg-brand-600 text-white hover:bg-brand-700'
                }`}
              >
                {isFollowing ? (
                  <>
                    <UserCheck className="w-4 h-4" /> Following
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" /> Follow
                  </>
                )}
              </button>
            )
          )}
        </div>

        {editing && (
          <form onSubmit={handleSaveProfile} className="mt-6 pt-6 border-t border-slate-100 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Name"
                required
                className="px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
              />
              <input
                type="text"
                value={editForm.location}
                onChange={(e) => setEditForm((p) => ({ ...p, location: e.target.value }))}
                placeholder="Location"
                required
                className="px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>
            <textarea
              rows={2}
              value={editForm.bio}
              onChange={(e) => setEditForm((p) => ({ ...p, bio: e.target.value }))}
              placeholder="Short bio..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {[
          { key: 'posts', label: `Posts (${posts.length})` },
          { key: 'followers', label: `Followers (${followers.length})` },
          { key: 'following', label: `Following (${following.length})` },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              tab === t.key
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'posts' && (
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500">
              No posts published yet.
            </div>
          ) : (
            posts.map((post) => (
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
            ))
          )}
        </div>
      )}

      {tab === 'followers' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {followers.length === 0 ? (
            <p className="text-sm text-slate-500">No followers yet.</p>
          ) : (
            followers.map((u) => (
              <Link
                key={u._id}
                to={`/profile/${u._id}`}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 font-semibold flex items-center justify-center">
                  {u.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">{u.name}</div>
                  <div className="text-xs text-slate-500">{u.location}</div>
                </div>
              </Link>
            ))
          )}
        </div>
      )}

      {tab === 'following' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {following.length === 0 ? (
            <p className="text-sm text-slate-500">Not following anyone yet.</p>
          ) : (
            following.map((u) => (
              <Link
                key={u._id}
                to={`/profile/${u._id}`}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 font-semibold flex items-center justify-center">
                  {u.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">{u.name}</div>
                  <div className="text-xs text-slate-500">{u.location}</div>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
};

