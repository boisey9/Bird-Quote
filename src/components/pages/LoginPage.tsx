import { useState } from 'react';
import { ArrowRight, LockKeyhole, ShieldCheck, Users } from 'lucide-react';
import { demoPortalUsers } from '../../session/demoUsers';
import './LoginPage.css';

type LoginPageProps = {
  status: string;
  onSignIn: (email: string) => boolean;
};

export function LoginPage({ status, onSignIn }: LoginPageProps) {
  const [email, setEmail] = useState('dealer@agirardin.com');

  function submit(event: React.FormEvent) {
    event.preventDefault();
    onSignIn(email);
  }

  return (
    <main className="loginShell">
      <section className="loginHeroPanel">
        <div className="loginBrandBlock">
          <span className="loginLogoMark">MB</span>
          <div>
            <small>Micro Bird RFQ Portal</small>
            <h1>Sign in to continue</h1>
            <p>Secure dealer and internal access for quote intake, RFQ tracking, queue review, and CMS configuration.</p>
          </div>
        </div>
        <div className="loginFeatureGrid">
          <span><ShieldCheck size={18} /> Role-aware navigation</span>
          <span><Users size={18} /> Dealer ownership ready</span>
          <span><LockKeyhole size={18} /> Supabase-ready foundation</span>
        </div>
      </section>

      <section className="loginCard">
        <div className="loginCardHeader">
          <LockKeyhole size={26} />
          <div>
            <strong>Portal Login</strong>
            <span>Demo mode now, production auth-ready next.</span>
          </div>
        </div>
        <form onSubmit={submit} className="loginForm">
          <label>
            <span>Email</span>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="dealer@agirardin.com" />
          </label>
          {status && <p className="loginStatus">{status}</p>}
          <button type="submit" className="primary loginButton">Sign In <ArrowRight size={18} /></button>
        </form>
        <div className="demoUserList">
          <strong>Demo accounts</strong>
          {demoPortalUsers.map((user) => <button type="button" key={user.id} onClick={() => setEmail(user.email)}><span>{user.name}</span><small>{user.email} • {user.role}</small></button>)}
        </div>
      </section>
    </main>
  );
}
