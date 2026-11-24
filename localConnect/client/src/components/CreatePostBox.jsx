import { PlusCircle } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';
import { postService } from '../services/postService';
import { POST_CATEGORIES } from '../utils/formatDate';

export const CreatePostBox = ({ communities = [], defaultCommunityId = '', onCreated }) => {
  const toast = useToast();
  const [communityId, setCommunityId] = useState(defaultCommunityId || communities[0]?._id || '');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('General');
  const [submitting, setSubmitting] = useState(false);

  const selectedCommunity = communityId || communities[0]?._id || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCommunity) {
      toast.error('Please select or join a community first');
      return;
    }

    setSubmitting(true);
    try {
      const created = await postService.create({
        communityId: selectedCommunity,
        title: title.trim(),
        content: content.trim(),
        category,
      });
      setTitle('');
      setContent('');
      toast.success('Post published!');
      onCreated?.(created);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to create post'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3"
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
        <PlusCircle className="w-4 h-4 text-brand-600" />
        <span>Share a local update</span>
      </div>

      <input
        type="text"
        placeholder="Post title (e.g., Weekend meetup, Local job opening...)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        minLength={3}
        maxLength={200}
        required
        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
      />

      <textarea
        rows={3}
        placeholder="What is happening in your neighborhood?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {!defaultCommunityId && (
            <select
              value={selectedCommunity}
              onChange={(e) => setCommunityId(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              required
            >
              {communities.length === 0 ? (
                <option value="">No communities available</option>
              ) : (
                communities.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.location})
                  </option>
                ))
              )}
            </select>
          )}

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {POST_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={submitting || !selectedCommunity}
          className="px-5 py-2 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors"
        >
          {submitting ? 'Publishing...' : 'Publish Post'}
        </button>
      </div>
    </form>
  );
};

