import { useState } from 'react';
import { Clock, FileText, HelpCircle, Menu, Plus, Settings, X } from 'lucide-react';
import microBirdLogo from '../assets/micro-bird-logo.png';

export type AppPage = 'new-quote' | 'my-requests' | 'quote-status' | 'rfq-queue' | 'admin-config' | 'confirmation';
export type UserRole = 'dealer' | 'internal' | 'admin';

type HeaderProps = {
  page: AppPage;
  role: UserRole;
  onNavigate: (page: AppPage) => void;
  onRoleChange: (role: UserRole) => void;
  onHelp: () => void;
};

const rolePages: Record<UserRole, AppPage[]> = {
  dealer: ['new-quote', 'my-requests', 'quote-status', 'confirmation'],
  internal: ['new-quote', 'my-requests', 'quote-status', 'rfq-queue', 'confirmation'],
  admin: ['new-quote', 'my-requests', 'quote-status', 'rfq-queue', 'admin-config', 'confirmation']
};

function pageLabel(page: AppPage) {
  if (page === 'new-quote') return 'New Quote';
  if (page === 'my-requests') return 'My Requests';
  if (page === 'quote-status') return 'Quote Status';
  if (page === 'rfq-queue') return 'RFQ Queue';
  if (page === 'admin-config') return 'Config';
  return 'Confirmation';
}

function pageIcon(page: AppPage) {
  if (page === 'new-quote') return <Plus size={18} />;
  if (page === 'quote-status') return <Clock size={18} />;
  if (page === 'admin-config') return <Settings size={18} />;
  return <FileText size={18} />;
}

export function Header({ page, role, onNavigate, onRoleChange, onHelp }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const canSee = (target: AppPage) => rolePages[role].includes(target);
  const visiblePages = rolePages[role].filter((target) => target !== 'confirmation');

  const navigate = (target: AppPage) => {
    onNavigate(target);
    setMobileMenuOpen(false);
  };

  const changeRole = (nextRole: UserRole) => {
    onRoleChange(nextRole);
    setMobileMenuOpen(false);
  };

  return (
    <header className="topbar productionTopbar">
      <button type="button" className="brand logoBrand" onClick={() => navigate('new-quote')} aria-label="Go to New Quote">
        <img src={microBirdLogo} alt="Micro Bird" />
      </button>

      <nav className="tabs desktopTabs" aria-label="Primary navigation">
        {canSee('new-quote') && <button className={page === 'new-quote' ? 'active' : ''} onClick={() => navigate('new-quote')}><Plus size={18} /> New Quote</button>}
        {canSee('my-requests') && <button className={page === 'my-requests' ? 'active' : ''} onClick={() => navigate('my-requests')}><FileText size={18} /> My Requests</button>}
        {canSee('quote-status') && <button className={page === 'quote-status' ? 'active' : ''} onClick={() => navigate('quote-status')}><Clock size={18} /> Quote Status</button>}
        {canSee('rfq-queue') && <button className={page === 'rfq-queue' ? 'active' : ''} onClick={() => navigate('rfq-queue')}><FileText size={18} /> RFQ Queue</button>}
        {canSee('admin-config') && <button className={page === 'admin-config' ? 'active' : ''} onClick={() => navigate('admin-config')}><Settings size={18} /> Config</button>}
      </nav>

      <div className="profile">
        <button type="button" className="iconButton" onClick={onHelp} aria-label="Open help"><HelpCircle size={22} /></button>
        <div className="avatar">EB</div>
        <div className="profileText">
          <strong>Erik Boisvert</strong>
          <small>A. Girardin Inc.</small>
        </div>
        <select className="roleSelect" value={role} onChange={(event) => changeRole(event.target.value as UserRole)} aria-label="Select current role">
          <option value="dealer">Dealer</option>
          <option value="internal">Internal</option>
          <option value="admin">Admin</option>
        </select>
        <button type="button" className="mobileMenuButton" onClick={() => setMobileMenuOpen((current) => !current)} aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'} aria-expanded={mobileMenuOpen}>
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="mobileNavPanel">
          <nav className="mobileTabs" aria-label="Mobile navigation">
            {visiblePages.map((target) => (
              <button key={target} className={page === target ? 'active' : ''} type="button" onClick={() => navigate(target)}>
                {pageIcon(target)}
                <span>{pageLabel(target)}</span>
              </button>
            ))}
          </nav>
          <div className="mobileRoleBlock">
            <span>Current view</span>
            <select value={role} onChange={(event) => changeRole(event.target.value as UserRole)} aria-label="Select current role mobile">
              <option value="dealer">Dealer</option>
              <option value="internal">Internal</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
      )}
    </header>
  );
}
