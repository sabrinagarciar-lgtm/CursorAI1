import React, { useState } from 'react';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
} from 'lucide-react';
import { Post, User } from './types';
import UserAvatar from './UserAvatar';
import CommentSection from './CommentSection';

interface Props {
  post: Post;
  currentUser: User;
  onToggleLike: (postId: string) => void;
  onAddComment: (postId: string, content: string) => void;
  onToggleCommentLike: (postId: string, commentId: string) => void;
  onShare: (postId: string) => void;
  onToggleBookmark: (postId: string) => void;
}

const PostCard: React.FC<Props> = ({
  post,
  currentUser,
  onToggleLike,
  onAddComment,
  onToggleCommentLike,
  onShare,
  onToggleBookmark,
}) => {
  const [showComments, setShowComments] = useState(false);
  const [shareFlash, setShareFlash] = useState(false);

  const handleShare = () => {
    onShare(post.id);
    setShareFlash(true);
    setTimeout(() => setShareFlash(false), 2000);
  };

  const hasStats = post.likes > 0 || post.comments.length > 0 || post.shares > 0;

  return (
    <article className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <UserAvatar user={post.user} size="md" />
          <div>
            <p className="font-semibold text-gray-900 text-sm leading-tight">
              {post.user.name}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              @{post.user.username} · {post.timestamp}
            </p>
          </div>
        </div>
        <button
          className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="More options"
        >
          <MoreHorizontal size={18} />
        </button>
      </div>

      {/* Post content */}
      <div className="px-4 pb-3">
        <p className="text-gray-800 text-[15px] leading-relaxed whitespace-pre-wrap">
          {post.content}
        </p>
      </div>

      {/* Post image */}
      {post.imageUrl && (
        <div className="mx-4 mb-3 rounded-xl overflow-hidden border border-gray-100">
          <img
            src={post.imageUrl}
            alt="Post attachment"
            className="w-full object-cover max-h-96"
            loading="lazy"
          />
        </div>
      )}

      {/* Stats row */}
      {hasStats && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            {post.likes > 0 && (
              <span className="flex items-center gap-1">
                <span className="inline-flex items-center justify-center w-4 h-4 bg-red-500 rounded-full">
                  <Heart size={9} fill="white" className="text-white" />
                </span>
                {post.likes}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {post.comments.length > 0 && (
              <button
                onClick={() => setShowComments(v => !v)}
                className="hover:text-gray-700 transition-colors"
              >
                {post.comments.length} comment{post.comments.length !== 1 ? 's' : ''}
              </button>
            )}
            {post.shares > 0 && <span>{post.shares} shares</span>}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center border-t border-gray-100 px-2 py-0.5">
        <ActionButton
          icon={<Heart size={18} fill={post.likedByMe ? 'currentColor' : 'none'} />}
          label={post.likedByMe ? 'Liked' : 'Like'}
          active={post.likedByMe}
          activeClass="text-red-500"
          onClick={() => onToggleLike(post.id)}
        />
        <ActionButton
          icon={<MessageCircle size={18} />}
          label="Comment"
          active={showComments}
          activeClass="text-indigo-600"
          onClick={() => setShowComments(v => !v)}
        />
        <ActionButton
          icon={<Share2 size={18} />}
          label={shareFlash ? 'Shared!' : 'Share'}
          active={shareFlash}
          activeClass="text-green-600"
          onClick={handleShare}
        />
        <div className="flex-1" />
        <ActionButton
          icon={
            <Bookmark
              size={18}
              fill={post.bookmarked ? 'currentColor' : 'none'}
            />
          }
          label=""
          active={post.bookmarked}
          activeClass="text-indigo-600"
          onClick={() => onToggleBookmark(post.id)}
        />
      </div>

      {/* Comment section */}
      {showComments && (
        <div className="border-t border-gray-100">
          <CommentSection
            comments={post.comments}
            currentUser={currentUser}
            onAddComment={content => onAddComment(post.id, content)}
            onToggleCommentLike={commentId =>
              onToggleCommentLike(post.id, commentId)
            }
          />
        </div>
      )}
    </article>
  );
};

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  activeClass?: string;
  onClick?: () => void;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  icon,
  label,
  active,
  activeClass = '',
  onClick,
}) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-gray-100 ${
      active ? activeClass : 'text-gray-500'
    }`}
  >
    {icon}
    {label && <span>{label}</span>}
  </button>
);

export default PostCard;
