import { Heart, MessageSquare, MapPin, Pencil, Trash2, Send } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';
import { postService } from '../services/postService';
import { formatRelativeTime, POST_CATEGORIES } from '../utils/formatDate';

export const PostCard = ({ post, onPostUpdated, onPostDeleted }) => {
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();

  const author = post.userId || {};
  const community = post.communityId || {};
  const authorId = typeof author === 'object' ? author._id : author;
  const isOwner = user && (user._id === authorId || user.role === 'ADMIN');

  const initialLiked = Boolean(
    user && Array.isArray(post.likes) && post.likes.some((id) => id === user._id || id?._id === user._id)
  );

  const [liked, setLiked] = useState(initialLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount ?? post.likes?.length ?? 0);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount ?? 0);

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title);
  const [editContent, setEditContent] = useState(post.content);
  const [editCategory, setEditCategory] = useState(post.category);
  const [saving, setSaving] = useState(false);

  const handleToggleLike = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to like posts');
      return;
    }

    try {
      if (liked) {
        const res = await postService.unlike(post._id);
        setLiked(false);
        setLikesCount(res.likesCount);
      } else {
        const res = await postService.like(post._id);
        setLiked(true);
        setLikesCount(res.likesCount);
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update like'));
    }
  };

  const handleToggleComments = async () => {
    const next = !showComments;
    setShowComments(next);
    if (next && comments.length === 0) {
      setCommentsLoading(true);
      try {
        const res = await postService.getComments(post._id);
        setComments(res.data || []);
      } catch (err) {
        toast.error(getErrorMessage(err, 'Failed to load comments'));
      } finally {
        setCommentsLoading(false);
      }
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const created = await postService.addComment(post._id, commentText.trim());
      setComments((prev) => [{ ...created, userId: { _id: user._id, name: user.name } }, ...prev]);
      setCommentsCount((c) => c + 1);
      setCommentText('');
      toast.success('Comment added');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to add comment'));
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await postService.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      setCommentsCount((c) => Math.max(0, c - 1));
      toast.success('Comment deleted');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete comment'));
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await postService.update(post._id, {
        title: editTitle,
        content: editContent,
        category: editCategory,
      });
      setIsEditing(false);
      toast.success('Post updated');
      onPostUpdated?.({ ...post, ...updated });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update post'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePost = async () => {
    try {
      await postService.remove(post._id);
      toast.success('Post deleted');
      onPostDeleted?.(post._id);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete post'));
    }
  };

  return (
    <article className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 font-semibold flex items-center justify-center shrink-0">
            {(author.name || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to={`/profile/${authorId}`}
                className="font-semibold text-slate-900 hover:text-brand-600 text-sm"
              >
                {author.name || 'Community Member'}
              </Link>
              {community._id && (
                <Link
                  to={`/communities/${community._id}`}
                  className="text-xs font-medium text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full hover:bg-brand-100"
                >
                  {community.name}
                </Link>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              <span>{formatRelativeTime(post.createdAt)}</span>
              {(post.location || community.location) && (
                <span className="inline-flex items-center gap-0.5">
                  · <MapPin className="w-3 h-3" /> {post.location || community.location}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
            {post.category}
          </span>
          {isOwner && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsEditing((prev) => !prev)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100"
                title="Edit post"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={handleDeletePost}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                title="Delete post"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {isEditing ? (
        <form onSubmit={handleSaveEdit} className="mt-4 space-y-3">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            required
          />
          <textarea
            rows={3}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            required
          />
          <div className="flex items-center justify-between gap-3">
            <select
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm bg-white"
            >
              {POST_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-1.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="mt-3.5">
          <h3 className="text-base font-semibold text-slate-900">{post.title}</h3>
          <p className="mt-1.5 text-sm text-slate-600 whitespace-pre-line leading-relaxed">
            {post.content}
          </p>
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-5 text-sm">
        <button
          onClick={handleToggleLike}
          className={`inline-flex items-center gap-1.5 font-medium transition-colors ${
            liked ? 'text-rose-600' : 'text-slate-500 hover:text-rose-600'
          }`}
        >
          <Heart className={`w-4 h-4 ${liked ? 'fill-rose-600' : ''}`} />
          <span>{likesCount}</span>
        </button>

        <button
          onClick={handleToggleComments}
          className="inline-flex items-center gap-1.5 font-medium text-slate-500 hover:text-brand-600 transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          <span>{commentsCount} Comments</span>
        </button>
      </div>

      {showComments && (
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
          {isAuthenticated && (
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl bg-brand-600 text-white hover:bg-brand-700 inline-flex items-center gap-1 text-sm font-medium"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}

          {commentsLoading ? (
            <p className="text-xs text-slate-400">Loading comments...</p>
          ) : comments.length === 0 ? (
            <p className="text-xs text-slate-400">No comments yet. Be the first to reply!</p>
          ) : (
            <div className="space-y-2.5">
              {comments.map((comment) => {
                const cUser = comment.userId || {};
                const canDelete = user && (user._id === cUser._id || user.role === 'ADMIN');
                return (
                  <div
                    key={comment._id}
                    className="bg-slate-50 rounded-xl px-3.5 py-2.5 text-sm flex items-start justify-between gap-2"
                  >
                    <div>
                      <span className="font-semibold text-slate-800 mr-2">
                        {cUser.name || 'User'}
                      </span>
                      <span className="text-slate-600">{comment.content}</span>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {formatRelativeTime(comment.createdAt)}
                      </div>
                    </div>
                    {canDelete && (
                      <button
                        onClick={() => handleDeleteComment(comment._id)}
                        className="text-slate-400 hover:text-red-600 p-1"
                        title="Delete comment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </article>
  );
};

