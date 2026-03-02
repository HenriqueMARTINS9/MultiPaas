import Link from 'next/link';
import { ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useState } from 'react';
import {
  IconNavBilling,
  IconLogout,
  IconNavAnalytics,
  IconNavDashboard,
  IconNavSettings,
  IconSidebar,
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
  isActive?: boolean;
};

function NavItem({ href, icon, label, isActive = false }: NavItemProps) {
  return (
    <Link className={`console-nav-item ${isActive ? 'console-nav-item-active' : ''}`} href={href}>
      <span className="console-nav-icon" aria-hidden="true">
        {icon}
      </span>
      <span>{label}</span>
    </Link>
  );
}

function Sidebar({ activeRoute }: { activeRoute: ConsoleRoute }) {
  return (
    <aside className="console-sidebar">
      <div className="console-sidebar-group">
        <p className="console-sidebar-title">Services</p>
        <NavItem
          href="/dashboard"
          icon={<IconNavDashboard />}
          label="Dashboard"
          isActive={activeRoute === 'dashboard'}
        />
      </div>

      <div className="console-sidebar-group">
        <p className="console-sidebar-title">Resources</p>
        <NavItem
          href="/analytics"
          icon={<IconNavAnalytics />}
          label="Analytics"
          isActive={activeRoute === 'analytics'}
        />
      </div>

      <div className="console-sidebar-group">
        <p className="console-sidebar-title">Support</p>
        <NavItem
          href="/account"
          icon={<IconNavSettings />}
          label="Settings"
          isActive={activeRoute === 'account'}
        />
        <NavItem
          href="/billing"
          icon={<IconNavBilling />}
          label="Billing"
          isActive={activeRoute === 'billing'}
        />
      </div>
    </aside>
  );
}

type HeaderProps = {
  onAvatarClick: () => void;
  onLogout: () => void;
  onToggleSidebar: () => void;
};

function Header({ onAvatarClick, onLogout, onToggleSidebar }: HeaderProps) {
  return (
    <header className="console-header">
      <div className="console-brand-wrap">
        <button className="icon-button" aria-label="Open sidebar" onClick={onToggleSidebar} type="button">
          <IconSidebar />
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
          <IconUser />
        </button>
      </div>
    </header>
  );
}

export default function ConsoleLayout({ activeRoute, children }: ConsoleLayoutProps) {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

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
      <Sidebar activeRoute={activeRoute} />
      <section className="console-main">
        <Header
          onAvatarClick={handleAvatarClick}
          onLogout={handleLogout}
          onToggleSidebar={() => setSidebarCollapsed((value) => !value)}
        />
        <div className="console-content">{children}</div>
      </section>
    </main>
  );
}
