import React, { useState } from 'react';
import { Heart, Send } from 'lucide-react';
import { Comment, User } from './types';
import UserAvatar from './UserAvatar';

interface Props {
  comments: Comment[];
  currentUser: User;
  onAddComment: (content: string) => void;
  onToggleCommentLike: (commentId: string) => void;
}

const CommentSection: React.FC<Props> = ({
  comments,
  currentUser,
  onAddComment,
  onToggleCommentLike,
}) => {
  const [newComment, setNewComment] = useState('');
  const [showAll, setShowAll] = useState(false);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newComment.trim()) return;
    onAddComment(newComment.trim());
    setNewComment('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const PREVIEW_COUNT = 2;
  const visibleComments = showAll ? comments : comments.slice(0, PREVIEW_COUNT);
  const hiddenCount = comments.length - PREVIEW_COUNT;

  return (
    <div className="pt-2">
      {/* Comment list */}
      <div className="space-y-3 px-4 pb-2">
        {visibleComments.map(comment => (
          <div key={comment.id} className="flex gap-2.5">
            <UserAvatar user={comment.user} size="xs" />
            <div className="flex-1 min-w-0">
              <div className="bg-gray-50 rounded-2xl px-3 py-2">
                <p className="text-xs font-semibold text-gray-900 leading-tight">
                  {comment.user.name}
                </p>
                <p className="text-sm text-gray-700 mt-0.5 leading-snug">
                  {comment.content}
                </p>
              </div>
              <div className="flex items-center gap-3 mt-1 ml-2">
                <span className="text-xs text-gray-400">{comment.timestamp}</span>
                <button
                  onClick={() => onToggleCommentLike(comment.id)}
                  className={`flex items-center gap-1 text-xs font-medium transition-colors ${
                    comment.likedByMe
                      ? 'text-red-500'
                      : 'text-gray-400 hover:text-red-400'
                  }`}
                  aria-label={comment.likedByMe ? 'Unlike' : 'Like'}
                >
                  <Heart
                    size={11}
                    fill={comment.likedByMe ? 'currentColor' : 'none'}
                  />
                  {comment.likes > 0 && <span>{comment.likes}</span>}
                </button>
              </div>
            </div>
          </div>
        ))}

        {hiddenCount > 0 && !showAll && (
          <button
            onClick={() => setShowAll(true)}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-700 ml-9 transition-colors"
          >
            View {hiddenCount} more comment{hiddenCount > 1 ? 's' : ''}
          </button>
        )}
      </div>

      {/* New comment input */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2.5 px-4 pb-3"
      >
        <UserAvatar user={currentUser} size="xs" />
        <div className="flex-1 flex items-center gap-2 bg-gray-50 rounded-full px-4 py-2 border border-transparent focus-within:border-indigo-200 transition-colors">
          <input
            type="text"
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write a comment…"
            className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 focus:outline-none"
          />
          {newComment.trim() && (
            <button
              type="submit"
              className="text-indigo-600 hover:text-indigo-700 transition-colors flex-shrink-0"
              aria-label="Submit comment"
            >
              <Send size={14} />
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default CommentSection;
