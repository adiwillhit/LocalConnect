import { useCallback, useEffect, useState } from 'react';
import { CreatePostBox } from '../components/CreatePostBox';
import { PostCard } from '../components/PostCard';
import { SkeletonCard } from '../components/SkeletonCard';
import { useToast } from '../context/ToastContext';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { getErrorMessage } from '../services/api';
import { communityService } from '../services/communityService';
import { postService } from '../services/postService';
import { POST_CATEGORIES } from '../utils/formatDate';

export const DashboardPage = () => {
  const toast = useToast();
  const [posts, setPosts] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false });
  const [communities, setCommunities] = useState([]);
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('latest');
  const [personalized, setPersonalized] = useState('true');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadFeed = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 10, sort, personalized };
      if (category) params.category = category;
      const res = await postService.getFeed(params);
      setPosts(res.data || []);
      setMeta(res.meta || { page: 1, totalPages: 1 });
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to load feed');
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [page, category, sort, personalized, toast]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  useEffect(() => {
    const loadCommunities = async () => {
      try {
        const res = await communityService.getAll({ limit: 50 });
        setCommunities(res.data || []);
      } catch {
        // Ignore
      }
    };
    loadCommunities();
  }, []);

  const handleCategoryChange = (cat) => {
    setCategory(cat);
    setPage(1);
  };

  return (
    <DashboardLayout>
      <CreatePostBox
        communities={communities}
        onCreated={() => {
          setPage(1);
          loadFeed();
        }}
      />

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setPersonalized('true');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                personalized === 'true'
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Personalized Feed
            </button>
            <button
              onClick={() => {
                setPersonalized('false');
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                personalized === 'false'
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Posts
            </button>
          </div>

          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium bg-white"
          >
            <option value="latest">Latest</option>
            <option value="popular">Most Popular</option>
            <option value="oldest">Oldest</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => handleCategoryChange('')}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
              category === ''
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All
          </button>
          {POST_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                category === cat
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Feed List */}
      {loading ? (
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : error ? (
        <div className="bg-white rounded-2xl border border-red-200 p-6 text-center space-y-3">
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={loadFeed}
            className="px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-medium"
          >
            Retry
          </button>
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-2">
          <p className="text-base font-semibold text-slate-800">No posts found</p>
          <p className="text-sm text-slate-500">
            Join a community or switch to &ldquo;All Posts&rdquo; to explore updates across LocalConnect.
          </p>
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

          {/* Pagination */}
          <div className="flex items-center justify-between pt-2">
            <button
              disabled={!meta.hasPreviousPage}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 disabled:opacity-40 hover:bg-slate-50"
            >
              Previous
            </button>
            <span className="text-xs font-medium text-slate-500">
              Page {meta.page} of {meta.totalPages}
            </span>
            <button
              disabled={!meta.hasNextPage}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 disabled:opacity-40 hover:bg-slate-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

