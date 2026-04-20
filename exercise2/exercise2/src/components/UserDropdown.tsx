import React, { useEffect, useRef, useState } from 'react';
import { UserDropdownItem, UserDropdownProps } from '../types/navigation';

const DEFAULT_DROPDOWN_ITEMS: UserDropdownItem[] = [
  {
    label: 'Your Profile',
    href: '#profile',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    label: 'Settings',
    href: '#settings',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    dividerAfter: true,
  },
  {
    label: 'Sign out',
    onClick: () => alert('Sign out clicked'),
    danger: true,
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
    ),
  },
];

function Avatar({ name, avatarUrl }: { name: string; avatarUrl?: string }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className="w-8 h-8 rounded-full object-cover ring-2 ring-white"
      />
    );
  }

  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center ring-2 ring-white">
      <span className="text-xs font-semibold text-white">{initials}</span>
    </div>
  );
}

export default function UserDropdown({
  user,
  dropdownItems = DEFAULT_DROPDOWN_ITEMS,
  onClose,
}: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        onClose?.();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false);
        onClose?.();
      }
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="User menu"
      >
        <Avatar name={user.name} avatarUrl={user.avatarUrl} />
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown panel */}
      <div
        className={`absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 z-50
          transition-all duration-200 origin-top-right
          ${isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}
      >
        {/* User info header */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <Avatar name={user.name} avatarUrl={user.avatarUrl} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
              {user.role && (
                <span className="inline-flex items-center px-1.5 py-0.5 mt-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700">
                  {user.role}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Menu items */}
        <div className="py-1">
          {dropdownItems.map((item, index) => (
            <React.Fragment key={index}>
              {item.href ? (
                <a
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors duration-100
                    ${item.danger
                      ? 'text-red-600 hover:bg-red-50'
                      : 'text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  {item.icon && <span className={item.danger ? 'text-red-500' : 'text-gray-400'}>{item.icon}</span>}
                  {item.label}
                </a>
              ) : (
                <button
                  onClick={() => { setIsOpen(false); item.onClick?.(); }}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors duration-100
                    ${item.danger
                      ? 'text-red-600 hover:bg-red-50'
                      : 'text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  {item.icon && <span className={item.danger ? 'text-red-500' : 'text-gray-400'}>{item.icon}</span>}
                  {item.label}
                </button>
              )}
              {item.dividerAfter && <div className="my-1 border-t border-gray-100" />}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
