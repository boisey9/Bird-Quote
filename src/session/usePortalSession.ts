import { useEffect, useState } from 'react';
import { findDemoUser } from './demoUsers';
import { fetchPortalProfileByEmail, type PortalProfile } from './usePortalProfiles';
import type { PortalSession, PortalUser, UserRole } from './sessionTypes';

const SESSION_KEY = 'microBirdPortalSession';

const rolePermissions: Record<UserRole, string[]> = {
  dealer: ['rfq.create', 'rfq.view_own'],
  internal: ['rfq.create', 'rfq.view_all', 'rfq.update_status', 'rfq.assign_owner'],
  manager: ['rfq.view_all', 'rfq.approve_contract', 'reporting.view'],
  admin: ['rfq.create', 'rfq.view_all', 'rfq.update_status', 'rfq.assign_owner', 'rfq.approve_contract', 'admin.config.read', 'admin.config.write', 'reporting.view']
};

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

function profileToPortalUser(profile: PortalProfile): PortalUser {
  return {
    id: profile.id,
    email: profile.email,
    name: profile.fullName,
    initials: profile.initials,
    role: profile.roleId,
    companyName: profile.companyName,
    dealerId: profile.dealerId || undefined,
    dealerName: profile.dealerName || undefined,
    permissions: rolePermissions[profile.roleId]
  };
}

export function usePortalSession() {
  const [session, setSession] = useState<PortalSession | null>(() => readStoredSession());
  const [status, setStatus] = useState('');

  useEffect(() => {
    writeStoredSession(session);
  }, [session]);

  async function signInWithDemoUser(email: string) {
    try {
      const profile = await fetchPortalProfileByEmail(email);
      if (profile && profile.active) {
        setSession({ user: profileToPortalUser(profile), signedInAt: new Date().toISOString(), mode: 'external' });
        setStatus('');
        return true;
      }
      if (profile && !profile.active) {
        setStatus('This portal profile is inactive.');
        return false;
      }
    } catch {
      // Fall back to seed/demo profiles when the backend is not initialized yet.
    }

    const fallbackUser = findDemoUser(email);
    if (!fallbackUser) {
      setStatus('No active portal profile matches that email. Choose an available test profile or create it in Config.');
      return false;
    }
    setSession({ user: fallbackUser, signedInAt: new Date().toISOString(), mode: 'demo' });
    setStatus('Using seed profile fallback. Save Portal Profiles in Config to activate backend profile lookup.');
    return true;
  }

  function signOut() {
    setSession(null);
    setStatus('');
  }

  return { session, user: session?.user ?? null, status, signInWithDemoUser, signOut };
}
