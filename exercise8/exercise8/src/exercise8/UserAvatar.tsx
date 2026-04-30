import React from 'react';
import { User } from './types';

type Size = 'xs' | 'sm' | 'md' | 'lg';

interface Props {
  user: User;
  size?: Size;
  className?: string;
}

const SIZES: Record<Size, string> = {
  xs: 'w-7 h-7 text-xs',
  sm: 'w-9 h-9 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
};

const UserAvatar: React.FC<Props> = ({ user, size = 'md', className = '' }) => {
  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const sizeClasses = SIZES[size];

  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.name}
        className={`${sizeClasses} rounded-full object-cover flex-shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 select-none ${className}`}
      style={{ backgroundColor: user.avatarColor }}
    >
      {initials}
    </div>
  );
};

export default UserAvatar;
