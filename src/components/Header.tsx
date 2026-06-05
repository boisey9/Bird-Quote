import { Clock, FileText, HelpCircle, Menu, Plus } from 'lucide-react';

export function Header() {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="logoMark">MB</div>
        <span>MICRO BIRD</span>
      </div>
      <nav className="tabs">
        <button className="active"><Plus size={18} /> New Quote</button>
        <button><FileText size={18} /> My Requests</button>
        <button><Clock size={18} /> Quote Status</button>
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
