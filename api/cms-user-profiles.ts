import { neon } from '@neondatabase/serverless';

type VercelRequest = { method?: string; body?: unknown; query?: Record<string, string | string[]>; url?: string };
type VercelResponse = { status: (code: number) => VercelResponse; json: (body: unknown) => void; setHeader: (name: string, value: string) => void };

type PortalUserProfile = {
  id: string;
  email: string;
  fullName: string;
  initials: string;
  roleId: 'dealer' | 'internal' | 'manager' | 'admin';
  companyName: string;
  dealerId: string;
  dealerName: string;
  active: boolean;
  notes: string;
};

type UserProfilePayload = { profiles?: PortalUserProfile[] };

const seedProfiles: PortalUserProfile[] = [
  { id: 'user-dealer-agi', email: 'dealer@agirardin.com', fullName: 'Dealer User', initials: 'DU', roleId: 'dealer', companyName: 'A. Girardin Inc.', dealerId: 'AGI', dealerName: 'A. Girardin Inc.', active: true, notes: 'Demo dealer profile.' },
  { id: 'user-sales-ops', email: 'salesops@microbird.com', fullName: 'Sales Ops User', initials: 'SO', roleId: 'internal', companyName: 'Micro Bird', dealerId: '', dealerName: '', active: true, notes: 'Internal workflow profile.' },
  { id: 'user-manager', email: 'manager@microbird.com', fullName: 'Manager User', initials: 'MU', roleId: 'manager', companyName: 'Micro Bird', dealerId: '', dealerName: '', active: true, notes: 'Manager profile.' },
  { id: 'user-admin', email: 'admin@microbird.com', fullName: 'Admin User', initials: 'AU', roleId: 'admin', companyName: 'Micro Bird', dealerId: '', dealerName: '', active: true, notes: 'Admin profile.' }
];

function getPayload(body: unknown) {
  if (!body) return {} as UserProfilePayload;
  if (typeof body === 'string') return JSON.parse(body) as UserProfilePayload;
  return body as UserProfilePayload;
}

function getQueryValue(req: VercelRequest, key: string) {
  const direct = req.query?.[key];
  if (Array.isArray(direct)) return direct[0] ?? '';
  if (direct) return direct;
  if (!req.url) return '';
  try { return new URL(req.url, 'https://local.rfq').searchParams.get(key) ?? ''; } catch { return ''; }
}

function jsonError(res: VercelResponse, status: number, message: string, extra: Record<string, unknown> = {}) {
  return res.status(status).json({ ok: false, error: message, ...extra });
}

async function ensureSchema(sql: ReturnType<typeof neon>) {
  await sql`CREATE TABLE IF NOT EXISTS portal_user_profiles (id text PRIMARY KEY, email text NOT NULL UNIQUE, full_name text NOT NULL, initials text NOT NULL DEFAULT '', role_id text NOT NULL DEFAULT 'dealer', company_name text NOT NULL DEFAULT '', dealer_id text NOT NULL DEFAULT '', dealer_name text NOT NULL DEFAULT '', active boolean NOT NULL DEFAULT true, notes text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now())`;
}

function mapProfile(row: Record<string, unknown>): PortalUserProfile {
  return {
    id: String(row.id),
    email: String(row.email ?? ''),
    fullName: String(row.full_name ?? ''),
    initials: String(row.initials ?? ''),
    roleId: String(row.role_id ?? 'dealer') as PortalUserProfile['roleId'],
    companyName: String(row.company_name ?? ''),
    dealerId: String(row.dealer_id ?? ''),
    dealerName: String(row.dealer_name ?? ''),
    active: Boolean(row.active ?? true),
    notes: String(row.notes ?? '')
  };
}

function validate(next: PortalUserProfile[]) {
  for (const profile of next) {
    if (!profile.id || !profile.email || !profile.fullName || !profile.roleId) throw new Error('Every user profile requires id, email, full name, and role.');
    if (profile.roleId === 'dealer' && !profile.dealerId) throw new Error(`Dealer profile ${profile.email} requires a dealer id.`);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).json({ ok: true });
  if (!process.env.DATABASE_URL) return jsonError(res, 500, 'DATABASE_URL is not configured.', { source: 'seed-fallback', profiles: seedProfiles });

  try {
    const sql = neon(process.env.DATABASE_URL);
    try { await ensureSchema(sql); }
    catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to initialize user profile schema.';
      if (req.method === 'GET') return res.status(200).json({ ok: true, source: 'schema-fallback', warning: message, profiles: seedProfiles });
      return jsonError(res, 500, message);
    }

    if (req.method === 'GET') {
      const email = getQueryValue(req, 'email');
      const id = getQueryValue(req, 'id');
      if (email) {
        const rows = await sql`SELECT id, email, full_name, initials, role_id, company_name, dealer_id, dealer_name, active, notes FROM portal_user_profiles WHERE lower(email) = lower(${email}) LIMIT 1`;
        if (!rows.length) return res.status(404).json({ ok: false, error: 'User profile not found.' });
        return res.status(200).json({ ok: true, source: 'neon', profile: mapProfile(rows[0] as Record<string, unknown>) });
      }
      if (id) {
        const rows = await sql`SELECT id, email, full_name, initials, role_id, company_name, dealer_id, dealer_name, active, notes FROM portal_user_profiles WHERE id = ${id} LIMIT 1`;
        if (!rows.length) return res.status(404).json({ ok: false, error: 'User profile not found.' });
        return res.status(200).json({ ok: true, source: 'neon', profile: mapProfile(rows[0] as Record<string, unknown>) });
      }
      const rows = await sql`SELECT id, email, full_name, initials, role_id, company_name, dealer_id, dealer_name, active, notes FROM portal_user_profiles ORDER BY role_id, full_name`;
      if (!rows.length) return res.status(200).json({ ok: true, source: 'empty-neon', profiles: seedProfiles });
      return res.status(200).json({ ok: true, source: 'neon', profiles: rows.map((row) => mapProfile(row as Record<string, unknown>)) });
    }

    if (req.method === 'PUT') {
      const payload = getPayload(req.body);
      const next = payload.profiles ?? [];
      validate(next);
      await sql`DELETE FROM portal_user_profiles`;
      for (const item of next) {
        await sql`INSERT INTO portal_user_profiles (id, email, full_name, initials, role_id, company_name, dealer_id, dealer_name, active, notes, updated_at) VALUES (${item.id}, ${item.email}, ${item.fullName}, ${item.initials}, ${item.roleId}, ${item.companyName}, ${item.dealerId}, ${item.dealerName}, ${item.active}, ${item.notes}, now())`;
      }
      return res.status(200).json({ ok: true, source: 'neon', profiles: next, counts: { profiles: next.length } });
    }

    return jsonError(res, 405, 'Method not allowed.');
  } catch (error) {
    return jsonError(res, 500, error instanceof Error ? error.message : 'User profile CMS function failed.');
  }
}
