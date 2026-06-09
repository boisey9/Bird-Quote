import { Clock, FileText, HelpCircle, Menu, Plus, Settings } from 'lucide-react';
import { microBirdLogo } from '../assets/microBirdLogo';

export type AppPage = 'new-quote' | 'my-requests' | 'quote-status' | 'rfq-queue' | 'admin-config';

type HeaderProps = {
  page: AppPage;
  onNavigate: (page: AppPage) => void;
};

export function Header({ page, onNavigate }: HeaderProps) {
  return (
    <header className="topbar">
      <div className="brand">
        <img src={microBirdLogo} alt="Micro Bird" className="brandLogo" />
      </div>
      <nav className="tabs">
        <button className={page === 'new-quote' ? 'active' : ''} onClick={() => onNavigate('new-quote')}><Plus size={18} /> New Quote</button>
        <button className={page === 'my-requests' ? 'active' : ''} onClick={() => onNavigate('my-requests')}><FileText size={18} /> My Requests</button>
        <button className={page === 'quote-status' ? 'active' : ''} onClick={() => onNavigate('quote-status')}><Clock size={18} /> Quote Status</button>
        <button className={page === 'rfq-queue' ? 'active' : ''} onClick={() => onNavigate('rfq-queue')}><FileText size={18} /> RFQ Queue</button>
        <button className={page === 'admin-config' ? 'active' : ''} onClick={() => onNavigate('admin-config')}><Settings size={18} /> Config</button>
      </nav>
      <div className="profile">
        <HelpCircle size={22} />
        <div className="avatar">EB</div>
        <div>
          <strong>Erik Boisvert</strong>
          <small>A. Girardin Inc.</small>
        </div>
        <Menu className="mobileMenu" />
      </div>
    </header>
  );
}
