import React, { useCallback, useEffect, useRef, useState } from 'react';
import { NavbarProps } from '../types/navigation';
import MobileMenu from './MobileMenu';
import UserDropdown from './UserDropdown';

function SearchBar({
  onSearch,
  placeholder = 'Search...',
  className = '',
}: {
  onSearch?: (query: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) onSearch?.(query.trim());
  }

  return (
    <form onSubmit={handleSubmit} className={className} role="search">
      <div className={`relative flex items-center transition-all duration-200 ${isFocused ? 'w-64' : 'w-44'}`}>
        <svg
          className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none transition-colors duration-150"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="w-full pl-9 pr-4 py-2 text-sm bg-gray-100 border border-transparent rounded-lg
            placeholder-gray-400 text-gray-900
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white
            hover:bg-gray-200 transition-all duration-200"
          aria-label="Search"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-3 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Clear search"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </form>
  );
}

function HamburgerButton({
  isOpen,
  onClick,
}: {
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700
        transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      aria-label={isOpen ? 'Close menu' : 'Open menu'}
      aria-expanded={isOpen}
    >
      <div className="w-5 h-4 flex flex-col justify-between">
        <span
          className={`block h-0.5 bg-current rounded-full transform transition-all duration-300
            ${isOpen ? 'rotate-45 translate-y-[7px]' : ''}`}
        />
        <span
          className={`block h-0.5 bg-current rounded-full transition-all duration-200
            ${isOpen ? 'opacity-0 scale-x-0' : ''}`}
        />
        <span
          className={`block h-0.5 bg-current rounded-full transform transition-all duration-300
            ${isOpen ? '-rotate-45 -translate-y-[9px]' : ''}`}
        />
      </div>
    </button>
  );
}

export default function Navbar({
  logo,
  logoText = 'Brand',
  navItems,
  user,
  onSearch,
  onLogoClick,
  className = '',
}: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeHref, setActiveHref] = useState(navItems[0]?.href ?? '#');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navbarRef = useRef<HTMLElement>(null);

  // Sticky + shadow on scroll
  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 10);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Sync active link with hash
  useEffect(() => {
    function handleHashChange() {
      setActiveHref(window.location.hash || navItems[0]?.href);
    }
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [navItems]);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 1024) setIsMobileMenuOpen(false);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNavClick = useCallback((href: string) => {
    setActiveHref(href);
    setIsMobileMenuOpen(false);

    // Smooth scroll to section
    const sectionId = href.replace('#', '');
    const el = document.getElementById(sectionId);
    if (el) {
      const navbarHeight = navbarRef.current?.offsetHeight ?? 64;
      const top = el.getBoundingClientRect().top + window.scrollY - navbarHeight - 8;
      window.scrollTo({ top, behavior: 'smooth' });
    } else {
      window.location.hash = href;
    }
  }, []);

  return (
    <>
      <header
        ref={navbarRef}
        className={`fixed top-0 left-0 right-0 z-30 transition-all duration-300
          ${isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-md py-2'
            : 'bg-white py-3'
          }
          ${className}`}
        role="banner"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">

            {/* Logo */}
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); onLogoClick?.(); }}
              className="flex items-center gap-2.5 flex-shrink-0 group focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg"
              aria-label={`${logoText} - go to homepage`}
            >
              {logo ?? (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600
                  flex items-center justify-center shadow-sm group-hover:shadow-indigo-200
                  transition-all duration-200 group-hover:scale-105">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd"
                      d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                      clipRule="evenodd" />
                  </svg>
                </div>
              )}
              <span className="text-base font-bold text-gray-900 tracking-tight
                group-hover:text-indigo-600 transition-colors duration-150">
                {logoText}
              </span>
            </a>

            {/* Desktop nav links */}
            <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
              {navItems.map((item) => {
                const isActive = activeHref === item.href;
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={(e) => { e.preventDefault(); handleNavClick(item.href); }}
                    className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium
                      transition-all duration-150 group
                      ${isActive
                        ? 'text-indigo-700 bg-indigo-50'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {item.icon && (
                      <span className={`w-4 h-4 transition-colors duration-150
                        ${isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'}`}>
                        {item.icon}
                      </span>
                    )}
                    {item.label}
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[1.125rem] h-[1.125rem]
                        px-1 text-[10px] font-bold rounded-full bg-indigo-600 text-white leading-none">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                    {/* Active indicator line */}
                    <span
                      className={`absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-indigo-600
                        transform transition-all duration-200
                        ${isActive ? 'scale-x-100 opacity-100' : 'scale-x-0 opacity-0'}`}
                    />
                  </a>
                );
              })}
            </nav>

            {/* Right side: search + user + hamburger */}
            <div className="flex items-center gap-2">
              {/* Desktop search */}
              <SearchBar
                onSearch={onSearch}
                className="hidden md:block"
              />

              {/* Notification bell placeholder */}
              <button
                className="hidden lg:flex items-center justify-center w-9 h-9 rounded-lg
                  text-gray-500 hover:bg-gray-100 hover:text-gray-700
                  transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 relative"
                aria-label="Notifications"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {/* Notification dot */}
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
              </button>

              {/* User dropdown */}
              {user && (
                <div className="hidden lg:block">
                  <UserDropdown user={user} />
                </div>
              )}

              {/* Hamburger (mobile) */}
              <HamburgerButton
                isOpen={isMobileMenuOpen}
                onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              />
            </div>
          </div>
        </div>

        {/* Scroll progress bar */}
        <ScrollProgressBar />
      </header>

      {/* Mobile menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        navItems={navItems}
        activeHref={activeHref}
        user={user}
        onClose={() => setIsMobileMenuOpen(false)}
        onNavClick={handleNavClick}
        onSearch={onSearch}
      />

      {/* Spacer so content doesn't hide under sticky navbar */}
      <div className="h-16" aria-hidden="true" />
    </>
  );
}

function ScrollProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function handleScroll() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      setProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500
        transition-all duration-100 ease-out"
      style={{ width: `${progress}%` }}
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Page scroll progress"
    />
  );
}
