import { useEffect, useState } from 'react';
import { findDemoUser } from './demoUsers';
import type { PortalSession } from './sessionTypes';

const SESSION_KEY = 'microBirdPortalSession';

function readStoredSession(): PortalSession | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PortalSession;
  } catch {
    window.localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

function writeStoredSession(session: PortalSession | null) {
  if (typeof window === 'undefined') return;
  if (!session) {
    window.localStorage.removeItem(SESSION_KEY);
    return;
  }
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function usePortalSession() {
  const [session, setSession] = useState<PortalSession | null>(() => readStoredSession());
  const [status, setStatus] = useState('');

  useEffect(() => {
    writeStoredSession(session);
  }, [session]);

  function signInWithDemoUser(email: string) {
    const user = findDemoUser(email);
    if (!user) {
      setStatus('No demo portal user matches that email. Choose one of the demo accounts below.');
      return false;
    }
    setSession({ user, signedInAt: new Date().toISOString(), mode: 'demo' });
    setStatus('');
    return true;
  }

  function signOut() {
    setSession(null);
    setStatus('');
  }

  return { session, user: session?.user ?? null, status, signInWithDemoUser, signOut };
}
