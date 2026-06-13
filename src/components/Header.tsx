import { useState } from 'react';
import { Clock, FileText, HelpCircle, LogOut, Menu, Plus, Settings, X } from 'lucide-react';
import { permittedPagesByRole } from '../session/permissionRules';
import type { PortalUser, UserRole } from '../session/sessionTypes';

export type AppPage = 'new-quote' | 'my-requests' | 'quote-status' | 'rfq-queue' | 'admin-config' | 'confirmation';
export type { UserRole };

const microBirdLogo = '/assets/micro-bird-logo.png';

type HeaderProps = {
  page: AppPage;
  user: PortalUser;
  onNavigate: (page: AppPage) => void;
  onSignOut: () => void;
  onHelp: () => void;
};

function pageLabel(page: AppPage) {
  if (page === 'new-quote') return 'New RFQ';
  if (page === 'my-requests') return 'My Requests';
  if (page === 'quote-status') return 'Quote Status';
  if (page === 'rfq-queue') return 'RFQ Queue';
  if (page === 'admin-config') return 'Admin Config';
  return 'Confirmation';
}

function pageIcon(page: AppPage) {
  if (page === 'new-quote') return <Plus size={18} />;
  if (page === 'quote-status') return <Clock size={18} />;
  if (page === 'admin-config') return <Settings size={18} />;
  return <FileText size={18} />;
}

function roleLabel(role: UserRole) {
  if (role === 'dealer') return 'Dealer';
  if (role === 'internal') return 'Internal';
  if (role === 'manager') return 'Manager';
  return 'Admin';
}

export function Header({ page, user, onNavigate, onSignOut, onHelp }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const visiblePages = permittedPagesByRole[user.role].filter((target) => target !== 'confirmation');

  const navigate = (target: AppPage) => {
    onNavigate(target);
    setMobileMenuOpen(false);
  };

  return (
    <header className="topbar productionTopbar">
      <button type="button" className="brand logoBrand" onClick={() => navigate('new-quote')} aria-label="Go to New RFQ">
        <img src={microBirdLogo} alt="Micro Bird" />
      </button>

      <nav className="tabs desktopTabs" aria-label="Primary navigation">
        {visiblePages.map((target) => <button key={target} className={page === target ? 'active' : ''} onClick={() => navigate(target)}>{pageIcon(target)} {pageLabel(target)}</button>)}
      </nav>

      <div className="profile signedInProfile">
        <button type="button" className="iconButton" onClick={onHelp} aria-label="Open help"><HelpCircle size={22} /></button>
        <div className="avatar">{user.initials}</div>
        <div className="profileText">
          <strong>{user.name}</strong>
          <small>{user.companyName} • {roleLabel(user.role)}</small>
        </div>
        <button type="button" className="signOutButton" onClick={onSignOut}><LogOut size={16} /> Sign out</button>
        <button type="button" className="mobileMenuButton" onClick={() => setMobileMenuOpen((current) => !current)} aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'} aria-expanded={mobileMenuOpen}>
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="mobileNavPanel">
          <nav className="mobileTabs" aria-label="Mobile navigation">
            {visiblePages.map((target) => <button key={target} className={page === target ? 'active' : ''} type="button" onClick={() => navigate(target)}>{pageIcon(target)}<span>{pageLabel(target)}</span></button>)}
          </nav>
          <div className="mobileRoleBlock">
            <span>Signed in as</span>
            <strong>{user.name}</strong>
            <small>{user.companyName} • {roleLabel(user.role)}</small>
            <button type="button" onClick={onSignOut}><LogOut size={16} /> Sign out</button>
          </div>
        </div>
      )}
    </header>
  );
}
