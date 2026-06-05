export interface User {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  avatarColor: string;
}

export interface Comment {
  id: string;
  user: User;
  content: string;
  timestamp: string;
  likes: number;
  likedByMe: boolean;
}

export interface Post {
  id: string;
  user: User;
  content: string;
  imageUrl?: string;
  timestamp: string;
  likes: number;
  likedByMe: boolean;
  comments: Comment[];
  shares: number;
  bookmarked: boolean;
}
