import { Clock, FileText, HelpCircle, Menu, Plus, Settings } from 'lucide-react';
import { microBirdLogo } from '../assets/microBirdLogo';

export type AppPage = 'new-quote' | 'my-requests' | 'quote-status' | 'rfq-queue' | 'admin-config';
export type UserRole = 'dealer' | 'internal' | 'admin';

type HeaderProps = {
  page: AppPage;
  role: UserRole;
  onNavigate: (page: AppPage) => void;
  onRoleChange: (role: UserRole) => void;
  onHelp: () => void;
};

const rolePages: Record<UserRole, AppPage[]> = {
  dealer: ['new-quote', 'my-requests', 'quote-status'],
  internal: ['new-quote', 'my-requests', 'quote-status', 'rfq-queue'],
  admin: ['new-quote', 'my-requests', 'quote-status', 'rfq-queue', 'admin-config']
};

export function Header({ page, role, onNavigate, onRoleChange, onHelp }: HeaderProps) {
  const canSee = (target: AppPage) => rolePages[role].includes(target);

  return (
    <header className="topbar">
      <div className="brand">
        <img src={microBirdLogo} alt="Micro Bird" className="brandLogo" />
      </div>
      <nav className="tabs">
        {canSee('new-quote') && <button className={page === 'new-quote' ? 'active' : ''} onClick={() => onNavigate('new-quote')}><Plus size={18} /> New Quote</button>}
        {canSee('my-requests') && <button className={page === 'my-requests' ? 'active' : ''} onClick={() => onNavigate('my-requests')}><FileText size={18} /> My Requests</button>}
        {canSee('quote-status') && <button className={page === 'quote-status' ? 'active' : ''} onClick={() => onNavigate('quote-status')}><Clock size={18} /> Quote Status</button>}
        {canSee('rfq-queue') && <button className={page === 'rfq-queue' ? 'active' : ''} onClick={() => onNavigate('rfq-queue')}><FileText size={18} /> RFQ Queue</button>}
        {canSee('admin-config') && <button className={page === 'admin-config' ? 'active' : ''} onClick={() => onNavigate('admin-config')}><Settings size={18} /> Config</button>}
      </nav>
      <div className="profile">
        <button type="button" className="iconButton" onClick={onHelp} aria-label="Open help"><HelpCircle size={22} /></button>
        <div className="avatar">EB</div>
        <div className="profileText">
          <strong>Erik Boisvert</strong>
          <small>A. Girardin Inc.</small>
        </div>
        <select className="roleSelect" value={role} onChange={(event) => onRoleChange(event.target.value as UserRole)} aria-label="Select current role">
          <option value="dealer">Dealer</option>
          <option value="internal">Internal</option>
          <option value="admin">Admin</option>
        </select>
        <Menu className="mobileMenu" />
      </div>
    </header>
  );
}
