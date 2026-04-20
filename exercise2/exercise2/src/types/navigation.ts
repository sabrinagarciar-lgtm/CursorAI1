export interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  badge?: number;
  children?: NavItem[];
}

export interface UserProfile {
  name: string;
  email: string;
  avatarUrl?: string;
  role?: string;
}

export interface UserDropdownItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  dividerAfter?: boolean;
  danger?: boolean;
}

export interface NavbarProps {
  logo?: React.ReactNode;
  logoText?: string;
  navItems: NavItem[];
  user?: UserProfile;
  onSearch?: (query: string) => void;
  onLogoClick?: () => void;
  className?: string;
}

export interface MobileMenuProps {
  isOpen: boolean;
  navItems: NavItem[];
  activeHref: string;
  user?: UserProfile;
  onClose: () => void;
  onNavClick: (href: string) => void;
  onSearch?: (query: string) => void;
}

export interface UserDropdownProps {
  user: UserProfile;
  dropdownItems?: UserDropdownItem[];
  onClose?: () => void;
}

export interface SearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
  className?: string;
}
