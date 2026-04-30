import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, Rss } from 'lucide-react';
import { Post, User, Comment } from './types';
import CreatePost from './CreatePost';
import PostCard from './PostCard';
import UserAvatar from './UserAvatar';

const CURRENT_USER: User = {
  id: 'me',
  name: 'Alex Morgan',
  username: 'alex_morgan',
  avatarColor: '#6366f1',
};

const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Sarah Chen', username: 'sarah_chen', avatarColor: '#ec4899' },
  { id: 'u2', name: 'Marcus Reid', username: 'marcus_reid', avatarColor: '#f59e0b' },
  { id: 'u3', name: 'Priya Patel', username: 'priya_patel', avatarColor: '#10b981' },
  { id: 'u4', name: 'Tom Kowalski', username: 'tom_k', avatarColor: '#3b82f6' },
];

const INITIAL_POSTS: Post[] = [
  {
    id: 'p1',
    user: MOCK_USERS[0],
    content:
      "Just finished building my new React component library! After months of work, it's finally ready for production. Huge thanks to everyone who gave feedback during the beta phase.",
    imageUrl: 'https://picsum.photos/seed/react-library/600/350',
    timestamp: '2h ago',
    likes: 142,
    likedByMe: true,
    shares: 23,
    bookmarked: false,
    comments: [
      {
        id: 'c1',
        user: MOCK_USERS[1],
        content: 'This looks absolutely amazing! Would love to try it out.',
        timestamp: '1h ago',
        likes: 5,
        likedByMe: false,
      },
      {
        id: 'c2',
        user: MOCK_USERS[2],
        content: 'Can you share the GitHub link? Would love to contribute!',
        timestamp: '45m ago',
        likes: 3,
        likedByMe: true,
      },
    ],
  },
  {
    id: 'p2',
    user: MOCK_USERS[1],
    content:
      'Hot take: The best code is the code you delete. Spent today removing 2,000 lines of legacy code and the app runs 40% faster. Simplicity always wins.',
    timestamp: '4h ago',
    likes: 89,
    likedByMe: false,
    shares: 31,
    bookmarked: true,
    comments: [
      {
        id: 'c3',
        user: MOCK_USERS[0],
        content: 'Absolutely agree. Deletion is underrated as a skill.',
        timestamp: '3h ago',
        likes: 12,
        likedByMe: false,
      },
    ],
  },
  {
    id: 'p3',
    user: MOCK_USERS[2],
    content:
      'Morning run along the coast — 10 km personal best! The early light was incredible today. Nothing like starting the day with a clear head.',
    imageUrl: 'https://picsum.photos/seed/coastal-run/600/400',
    timestamp: '6h ago',
    likes: 204,
    likedByMe: false,
    shares: 8,
    bookmarked: false,
    comments: [],
  },
  {
    id: 'p4',
    user: MOCK_USERS[3],
    content:
      "Working on something exciting with AI and music generation. Can't say too much yet, but the early demos are genuinely mind-blowing. Stay tuned.",
    timestamp: '8h ago',
    likes: 67,
    likedByMe: true,
    shares: 14,
    bookmarked: false,
    comments: [
      {
        id: 'c4',
        user: MOCK_USERS[1],
        content: 'Is this what you were hinting at last week?',
        timestamp: '7h ago',
        likes: 2,
        likedByMe: false,
      },
      {
        id: 'c5',
        user: CURRENT_USER,
        content: "Can't wait to see this!",
        timestamp: '6h ago',
        likes: 4,
        likedByMe: false,
      },
    ],
  },
];

const MORE_POST_CONTENTS = [
  "Design systems are only as good as the decisions they encode. Documenting the 'why' matters more than documenting the 'what'.",
  "Revisiting 'Thinking, Fast and Slow' for the second time. Different book entirely when you've made a few more decisions in life. Highly recommend.",
  'Three things I wish I knew earlier in my career: ship early, ask for feedback often, and protect your deep work blocks fiercely.',
  "The gap between knowing what to build and knowing how to build it is where most of the interesting work happens.",
  'Had the most productive day in months — no Slack, no meetings, just headphones and a clear task list. Reminder that focus is a superpower.',
  'Reading papers again after a long break. The density of ideas per page in a good research paper is unmatched.',
];

const MORE_POST_IMAGES = [
  'https://picsum.photos/seed/design-tokens/600/350',
  undefined,
  undefined,
  'https://picsum.photos/seed/deep-work/600/350',
  undefined,
  'https://picsum.photos/seed/research/600/350',
];

let postIdCounter = 1000;

const makeExtraPosts = (page: number): Post[] => {
  const offset = (page - 1) * 2;
  return [0, 1].map(i => {
    const idx = (offset + i) % MORE_POST_CONTENTS.length;
    return {
      id: `extra-${postIdCounter++}`,
      user: MOCK_USERS[(offset + i) % MOCK_USERS.length],
      content: MORE_POST_CONTENTS[idx],
      imageUrl: MORE_POST_IMAGES[idx],
      timestamp: `${(page + 1) * 4 + i * 2}h ago`,
      likes: Math.floor(Math.random() * 120 + 10),
      likedByMe: false,
      shares: Math.floor(Math.random() * 25),
      bookmarked: false,
      comments: [],
    };
  });
};

const MAX_PAGES = 4;

const Feed: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(1);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);

    // Simulate network delay
    setTimeout(() => {
      const next = pageRef.current + 1;
      pageRef.current = next;
      if (next >= MAX_PAGES) setHasMore(false);
      setPosts(current => [...current, ...makeExtraPosts(next)]);
      setIsLoadingMore(false);
    }, 1200);
  }, [isLoadingMore, hasMore]);

  // IntersectionObserver-based infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) loadMore();
      },
      { threshold: 0.1 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  const handleCreatePost = (content: string, imageUrl?: string) => {
    const newPost: Post = {
      id: `new-${++postIdCounter}`,
      user: CURRENT_USER,
      content,
      imageUrl,
      timestamp: 'Just now',
      likes: 0,
      likedByMe: false,
      shares: 0,
      bookmarked: false,
      comments: [],
    };
    setPosts(prev => [newPost, ...prev]);
  };

  const handleToggleLike = (postId: string) => {
    setPosts(prev =>
      prev.map(p =>
        p.id === postId
          ? {
              ...p,
              likedByMe: !p.likedByMe,
              likes: p.likedByMe ? p.likes - 1 : p.likes + 1,
            }
          : p,
      ),
    );
  };

  const handleAddComment = (postId: string, content: string) => {
    const comment: Comment = {
      id: `comment-${Date.now()}`,
      user: CURRENT_USER,
      content,
      timestamp: 'Just now',
      likes: 0,
      likedByMe: false,
    };
    setPosts(prev =>
      prev.map(p =>
        p.id === postId ? { ...p, comments: [...p.comments, comment] } : p,
      ),
    );
  };

  const handleToggleCommentLike = (postId: string, commentId: string) => {
    setPosts(prev =>
      prev.map(p =>
        p.id === postId
          ? {
              ...p,
              comments: p.comments.map(c =>
                c.id === commentId
                  ? {
                      ...c,
                      likedByMe: !c.likedByMe,
                      likes: c.likedByMe ? c.likes - 1 : c.likes + 1,
                    }
                  : c,
              ),
            }
          : p,
      ),
    );
  };

  const handleShare = (postId: string) => {
    setPosts(prev =>
      prev.map(p => (p.id === postId ? { ...p, shares: p.shares + 1 } : p)),
    );
  };

  const handleToggleBookmark = (postId: string) => {
    setPosts(prev =>
      prev.map(p =>
        p.id === postId ? { ...p, bookmarked: !p.bookmarked } : p,
      ),
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky header */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Rss size={20} className="text-indigo-600" />
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Feed</h1>
          </div>
          <UserAvatar user={CURRENT_USER} size="sm" />
        </div>
      </header>

      {/* Main feed */}
      <main className="max-w-xl mx-auto px-4 py-4 space-y-3">
        <CreatePost currentUser={CURRENT_USER} onCreatePost={handleCreatePost} />

        {posts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            currentUser={CURRENT_USER}
            onToggleLike={handleToggleLike}
            onAddComment={handleAddComment}
            onToggleCommentLike={handleToggleCommentLike}
            onShare={handleShare}
            onToggleBookmark={handleToggleBookmark}
          />
        ))}

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="h-4" />

        {isLoadingMore && (
          <div className="flex justify-center py-6">
            <Loader2 size={22} className="animate-spin text-indigo-500" />
          </div>
        )}

        {!hasMore && !isLoadingMore && (
          <p className="text-center py-8 text-sm text-gray-400">
            You're all caught up!
          </p>
        )}
      </main>
    </div>
  );
};

export default Feed;
