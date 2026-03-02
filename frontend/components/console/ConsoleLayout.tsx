import Link from 'next/link';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import {
  IconMenuClose,
  IconMenuOpen,
  IconNavBilling,
  IconLogout,
  IconNavAnalytics,
  IconNavDashboard,
  IconNavSettings,
  IconUser
} from './icons';

type ConsoleRoute = 'dashboard' | 'analytics' | 'account' | 'billing';

type ConsoleLayoutProps = {
  activeRoute: ConsoleRoute;
  children: ReactNode;
};

type NavItemProps = {
  href: string;
  icon: ReactNode;
  label: string;
  hideLabel?: boolean;
  isActive?: boolean;
};

type SessionUser = {
  account_type?: 'company' | 'personal';
  email?: string;
  first_name?: string;
  id?: number;
  last_name?: string;
  profile_photo?: string;
};

function userInitials(user: SessionUser | null) {
  const first = (user?.first_name || '').trim();
  const last = (user?.last_name || '').trim();
  if (first || last) {
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || 'U';
  }
  if (user?.email) {
    return user.email.charAt(0).toUpperCase();
  }
  return 'U';
}

function NavItem({ href, icon, label, hideLabel = false, isActive = false }: NavItemProps) {
  return (
    <Link className={`console-nav-item ${isActive ? 'console-nav-item-active' : ''} ${hideLabel ? 'is-compact' : ''}`} href={href}>
      <span className="console-nav-icon" aria-hidden="true">
        {icon}
      </span>
      {!hideLabel && <span>{label}</span>}
    </Link>
  );
}

function Sidebar({ activeRoute, compact = false }: { activeRoute: ConsoleRoute; compact?: boolean }) {
  return (
    <aside className="console-sidebar">
      <Link className={`console-sidebar-brand ${compact ? 'is-compact' : ''}`} href="/dashboard">
        <img alt="MultiPaas" className="console-sidebar-brand-logo" src="/MultiPaasLogo.png" />
        {!compact && <span className="console-sidebar-brand-text">MPConsole</span>}
      </Link>

      <div className="console-sidebar-group">
        {!compact && <p className="console-sidebar-title">Services</p>}
        <NavItem
          href="/dashboard"
          icon={<IconNavDashboard />}
          label="Dashboard"
          hideLabel={compact}
          isActive={activeRoute === 'dashboard'}
        />
      </div>

      <div className="console-sidebar-group">
        {!compact && <p className="console-sidebar-title">Resources</p>}
        <NavItem
          href="/analytics"
          icon={<IconNavAnalytics />}
          label="Analytics"
          hideLabel={compact}
          isActive={activeRoute === 'analytics'}
        />
      </div>

      <div className="console-sidebar-group">
        {!compact && <p className="console-sidebar-title">Support</p>}
        <NavItem
          href="/account"
          icon={<IconNavSettings />}
          label="Settings"
          hideLabel={compact}
          isActive={activeRoute === 'account'}
        />
        <NavItem
          href="/billing"
          icon={<IconNavBilling />}
          label="Billing"
          hideLabel={compact}
          isActive={activeRoute === 'billing'}
        />
      </div>
    </aside>
  );
}

type HeaderProps = {
  compactSidebar: boolean;
  initials: string;
  onAvatarClick: () => void;
  onLogout: () => void;
  onToggleSidebar: () => void;
  profilePhoto: string;
};

function Header({ compactSidebar, initials, onAvatarClick, onLogout, onToggleSidebar, profilePhoto }: HeaderProps) {
  return (
    <header className="console-header">
      <div className="console-brand-wrap">
        <button
          className="icon-button"
          aria-label={compactSidebar ? 'Open sidebar' : 'Close sidebar'}
          onClick={onToggleSidebar}
          type="button"
        >
          {compactSidebar ? <IconMenuOpen /> : <IconMenuClose />}
        </button>

        <div className="console-brand">
          <div className="console-brand-badge">MP</div>
          <span className="console-brand-text">MPConsole</span>
        </div>
      </div>

      <div className="console-header-actions">
        <button className="text-button" onClick={onLogout} type="button">
          <IconLogout />
          <span>Logout</span>
        </button>
        <button className="avatar-button" aria-label="Account" onClick={onAvatarClick} type="button">
          {profilePhoto ? (
            <img alt="Profile" className="avatar-image" src={profilePhoto} />
          ) : (
            <span className="avatar-fallback">{initials || <IconUser />}</span>
          )}
        </button>
      </div>
    </header>
  );
}

export default function ConsoleLayout({ activeRoute, children }: ConsoleLayoutProps) {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const rawUser = window.localStorage.getItem('mpconsole_user');
    if (!rawUser) {
      return;
    }
    try {
      setSessionUser(JSON.parse(rawUser) as SessionUser);
    } catch (_error) {
      setSessionUser(null);
    }
  }, []);

  const initials = useMemo(() => userInitials(sessionUser), [sessionUser]);

  function handleLogout() {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('mpconsole_user');
    }
    router.push('/login');
  }

  function handleAvatarClick() {
    router.push('/account');
  }

  return (
    <main className={`console-page ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar activeRoute={activeRoute} compact={sidebarCollapsed} />
      <section className="console-main">
        <Header
          compactSidebar={sidebarCollapsed}
          initials={initials}
          onAvatarClick={handleAvatarClick}
          onLogout={handleLogout}
          onToggleSidebar={() => setSidebarCollapsed((value) => !value)}
          profilePhoto={sessionUser?.profile_photo || ''}
        />
        <div className="console-content">{children}</div>
      </section>
    </main>
  );
}
