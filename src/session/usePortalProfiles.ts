import { useEffect, useState } from 'react';
import type { UserRole } from './sessionTypes';

export type PortalProfile = {
  id: string;
  email: string;
  fullName: string;
  initials: string;
  roleId: UserRole;
  companyName: string;
  dealerId: string;
  dealerName: string;
  active: boolean;
  notes: string;
};

type PortalProfileResponse = {
  ok?: boolean;
  source?: string;
  error?: string;
  profiles?: PortalProfile[];
  profile?: PortalProfile;
  counts?: Record<string, number>;
};

export function seedPortalProfiles(): PortalProfile[] {
  return [
    { id: 'user-dealer-agi', email: 'dealer@agirardin.com', fullName: 'Dealer User', initials: 'DU', roleId: 'dealer', companyName: 'A. Girardin Inc.', dealerId: 'AGI', dealerName: 'A. Girardin Inc.', active: true, notes: 'Demo dealer profile.' },
    { id: 'user-sales-ops', email: 'salesops@microbird.com', fullName: 'Sales Ops User', initials: 'SO', roleId: 'internal', companyName: 'Micro Bird', dealerId: '', dealerName: '', active: true, notes: 'Internal profile.' },
    { id: 'user-manager', email: 'manager@microbird.com', fullName: 'Manager User', initials: 'MU', roleId: 'manager', companyName: 'Micro Bird', dealerId: '', dealerName: '', active: true, notes: 'Manager profile.' },
    { id: 'user-admin', email: 'admin@microbird.com', fullName: 'Admin User', initials: 'AU', roleId: 'admin', companyName: 'Micro Bird', dealerId: '', dealerName: '', active: true, notes: 'Admin profile.' }
  ];
}

async function parsePortalProfileResponse(response: Response): Promise<PortalProfileResponse> {
  const text = await response.text();
  let payload: PortalProfileResponse;
  try { payload = text ? JSON.parse(text) as PortalProfileResponse : {}; }
  catch { throw new Error(`Portal profiles returned invalid response (${response.status}).`); }
  if (!response.ok || payload.ok === false) throw new Error(payload.error ?? `Portal profiles request failed (${response.status}).`);
  return payload;
}

export function usePortalProfiles() {
  const [profiles, setProfiles] = useState<PortalProfile[]>(() => seedPortalProfiles());
  const [loadState, setLoadState] = useState<'loading' | 'neon' | 'fallback' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const payload = await parsePortalProfileResponse(await fetch('/api/cms-user-profiles'));
        if (!mounted) return;
        setProfiles(payload.profiles?.length ? payload.profiles : seedPortalProfiles());
        setLoadState(payload.source === 'empty-neon' ? 'fallback' : 'neon');
        setError('');
      } catch (err) {
        if (!mounted) return;
        setProfiles(seedPortalProfiles());
        setLoadState('error');
        setError(err instanceof Error ? err.message : 'Unable to load profiles.');
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  return { profiles, loadState, error };
}

export async function savePortalProfiles(profiles: PortalProfile[]) {
  return parsePortalProfileResponse(await fetch('/api/cms-user-profiles', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profiles })
  }));
}

export async function fetchPortalProfileByEmail(email: string) {
  const payload = await parsePortalProfileResponse(await fetch(`/api/cms-user-profiles?email=${encodeURIComponent(email)}`));
  return payload.profile ?? null;
}
