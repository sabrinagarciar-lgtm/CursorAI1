import React, { useEffect, useRef, useState } from 'react';
import { MobileMenuProps } from '../types/navigation';

export default function MobileMenu({
  isOpen,
  navItems,
  activeHref,
  user,
  onClose,
  onNavClick,
  onSearch,
}: MobileMenuProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => searchInputRef.current?.focus(), 300);
    } else {
      document.body.style.overflow = '';
      setSearchQuery('');
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch?.(searchQuery.trim());
      onClose();
    }
  }

  const initials = user
    ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '';

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 lg:hidden
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-in panel */}
      <div
        ref={menuRef}
        className={`fixed top-0 right-0 h-full w-80 max-w-full bg-white z-50 shadow-2xl
          flex flex-col transform transition-transform duration-300 ease-in-out lg:hidden
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation menu"
      >
        {/* Panel header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <span className="text-base font-semibold text-gray-900">Menu</span>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-4 border-b border-gray-100">
          <form onSubmit={handleSearchSubmit}>
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={searchInputRef}
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg
                  placeholder-gray-400 text-gray-900
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white
                  transition-all duration-150"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = activeHref === item.href;
              return (
                <li key={item.href}>
                  <a
                    href={item.href}
                    onClick={(e) => {
                      e.preventDefault();
                      onNavClick(item.href);
                    }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium
                      transition-all duration-150
                      ${isActive
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                  >
                    {item.icon && (
                      <span className={isActive ? 'text-indigo-600' : 'text-gray-400'}>
                        {item.icon}
                      </span>
                    )}
                    <span className="flex-1">{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5
                        text-xs font-semibold rounded-full bg-indigo-600 text-white">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                    {isActive && (
                      <svg className="w-4 h-4 text-indigo-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd"
                          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                          clipRule="evenodd" />
                      </svg>
                    )}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User profile footer */}
        {user && (
          <div className="px-5 py-4 border-t border-gray-100 bg-gray-50">
            <div className="flex items-center gap-3">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-white" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600
                  flex items-center justify-center ring-2 ring-white flex-shrink-0">
                  <span className="text-sm font-semibold text-white">{initials}</span>
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
              <button
                className="ml-auto p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50
                  transition-colors duration-150 flex-shrink-0"
                aria-label="Sign out"
                onClick={() => alert('Sign out clicked')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
