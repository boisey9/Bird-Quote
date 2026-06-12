import { neon } from '@neondatabase/serverless';

type VercelRequest = { method?: string; body?: unknown };
type VercelResponse = { status: (code: number) => VercelResponse; json: (body: unknown) => void; setHeader: (name: string, value: string) => void };

export type SeatOptionListId = 'seatTypes' | 'materials' | 'colors' | 'restraintTypes' | 'armrests' | 'grabTypes' | 'brandingOptions';
type SeatOptionValue = { id: string; listId: SeatOptionListId; label: string; value: string; active: boolean; status: string; sortOrder: number; notes: string };
type SeatOptionsPayload = { values?: SeatOptionValue[] };

const listLabels: Record<SeatOptionListId, string> = {
  seatTypes: 'Seat Types',
  materials: 'Materials',
  colors: 'Colors',
  restraintTypes: 'Restraint Types',
  armrests: 'Armrest / Grab Options',
  grabTypes: 'Grab Types',
  brandingOptions: 'Branding Options'
};

const seedLists: Record<SeatOptionListId, string[]> = {
  seatTypes: ['High Back Standard', 'High Back Premium', 'Low Back Standard', 'Foldaway Seat', 'Integrated Child Seat', 'Perimeter / Lounge Seat'],
  materials: ['Vinyl', 'Cloth', 'Leathermate', 'Combination Vinyl/Cloth'],
  colors: ['Blue', 'Gray', 'Black', 'Brown', 'Customer Specified'],
  restraintTypes: ['Lap Belt', '3-Point', 'Integrated Child Seat', 'None'],
  armrests: ['None', 'Aisle Side', 'Wall Side', 'Both Sides'],
  grabTypes: ['None', 'Standard Grab', 'Wall Grab Rail', 'Seat Back Grab'],
  brandingOptions: ['No Branding', 'Standard Micro Bird', 'Customer Logo / Embroidery']
};

function slug(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function seedValues(): SeatOptionValue[] {
  return Object.entries(seedLists).flatMap(([listId, values]) => values.map((value, index) => ({
    id: `${listId}-${slug(value)}`,
    listId: listId as SeatOptionListId,
    label: value,
    value,
    active: true,
    status: 'active',
    sortOrder: (index + 1) * 10,
    notes: ''
  })));
}

function getPayload(body: unknown) {
  if (!body) return {} as SeatOptionsPayload;
  if (typeof body === 'string') return JSON.parse(body) as SeatOptionsPayload;
  return body as SeatOptionsPayload;
}

function jsonError(res: VercelResponse, status: number, message: string, extra: Record<string, unknown> = {}) {
  return res.status(status).json({ ok: false, error: message, ...extra });
}

async function ensureSchema(sql: ReturnType<typeof neon>) {
  await sql`CREATE TABLE IF NOT EXISTS cms_seat_option_values (id text PRIMARY KEY, list_id text NOT NULL, label text NOT NULL, value text NOT NULL, active boolean NOT NULL DEFAULT true, status text NOT NULL DEFAULT 'active', sort_order integer NOT NULL DEFAULT 100, notes text NOT NULL DEFAULT '', updated_at timestamptz NOT NULL DEFAULT now())`;
}

function mapValue(row: Record<string, unknown>): SeatOptionValue {
  return {
    id: String(row.id),
    listId: String(row.list_id) as SeatOptionListId,
    label: String(row.label ?? ''),
    value: String(row.value ?? ''),
    active: Boolean(row.active ?? true),
    status: String(row.status ?? 'active'),
    sortOrder: Number(row.sort_order ?? 100),
    notes: String(row.notes ?? '')
  };
}

function validate(values: SeatOptionValue[]) {
  for (const item of values) {
    if (!item.id || !item.listId || !item.label || !item.value) throw new Error('Every seat option requires id, list, label, and value.');
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).json({ ok: true });
  if (!process.env.DATABASE_URL) return jsonError(res, 500, 'DATABASE_URL is not configured.', { source: 'seed-fallback', listLabels, values: seedValues() });

  try {
    const sql = neon(process.env.DATABASE_URL);
    try {
      await ensureSchema(sql);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to initialize seat option schema.';
      if (req.method === 'GET') return res.status(200).json({ ok: true, source: 'schema-fallback', warning: message, listLabels, values: seedValues() });
      return jsonError(res, 500, message);
    }

    if (req.method === 'GET') {
      const rows = await sql`SELECT id, list_id, label, value, active, status, sort_order, notes FROM cms_seat_option_values ORDER BY list_id, sort_order, label`;
      if (rows.length === 0) return res.status(200).json({ ok: true, source: 'empty-neon', listLabels, values: seedValues() });
      return res.status(200).json({ ok: true, source: 'neon', listLabels, values: rows.map((row) => mapValue(row as Record<string, unknown>)) });
    }

    if (req.method === 'PUT') {
      const payload = getPayload(req.body);
      const values = payload.values ?? [];
      validate(values);
      await sql`DELETE FROM cms_seat_option_values`;
      for (const item of values) {
        await sql`INSERT INTO cms_seat_option_values (id, list_id, label, value, active, status, sort_order, notes, updated_at) VALUES (${item.id}, ${item.listId}, ${item.label}, ${item.value}, ${item.active}, ${item.status}, ${item.sortOrder}, ${item.notes ?? ''}, now())`;
      }
      return res.status(200).json({ ok: true, source: 'neon', listLabels, values, counts: { values: values.length } });
    }

    return jsonError(res, 405, 'Method not allowed.');
  } catch (error) {
    return jsonError(res, 500, error instanceof Error ? error.message : 'Seat Options CMS function failed.');
  }
}
