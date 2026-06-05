import { Clock, FileText, HelpCircle, Menu, Plus } from 'lucide-react';

export type AppPage = 'new-quote' | 'my-requests' | 'quote-status';

type HeaderProps = {
  page: AppPage;
  onNavigate: (page: AppPage) => void;
};

export function Header({ page, onNavigate }: HeaderProps) {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="logoMark">MB</div>
        <span>MICRO BIRD</span>
      </div>
      <nav className="tabs">
        <button className={page === 'new-quote' ? 'active' : ''} onClick={() => onNavigate('new-quote')}><Plus size={18} /> New Quote</button>
        <button className={page === 'my-requests' ? 'active' : ''} onClick={() => onNavigate('my-requests')}><FileText size={18} /> My Requests</button>
        <button className={page === 'quote-status' ? 'active' : ''} onClick={() => onNavigate('quote-status')}><Clock size={18} /> Quote Status</button>
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
