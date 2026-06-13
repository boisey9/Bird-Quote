import { neon } from '@neondatabase/serverless';

type VercelRequest = { method?: string; query?: Record<string, string | string[] | undefined>; url?: string };
type VercelResponse = { status: (code: number) => VercelResponse; json: (body: unknown) => void; setHeader: (name: string, value: string) => void };

function getQueryValue(req: VercelRequest, key: string) {
  const value = req.query?.[key];
  if (Array.isArray(value)) return value[0] ?? '';
  if (value) return value;
  if (!req.url) return '';
  try { return new URL(req.url, 'https://local.rfq').searchParams.get(key) ?? ''; } catch { return ''; }
}

async function ensureOwnershipColumns(sql: ReturnType<typeof neon>) {
  await sql`ALTER TABLE rfq_requests ADD COLUMN IF NOT EXISTS user_id text NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE rfq_requests ADD COLUMN IF NOT EXISTS dealer_id text NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE rfq_requests ADD COLUMN IF NOT EXISTS submitted_by text NOT NULL DEFAULT ''`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).json({ ok: true });
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  if (!process.env.DATABASE_URL) return res.status(500).json({ ok: false, error: 'DATABASE_URL is not configured.' });

  const rfqId = getQueryValue(req, 'rfqId');
  const scope = getQueryValue(req, 'scope');
  const userId = getQueryValue(req, 'userId');
  const dealerId = getQueryValue(req, 'dealerId');
  if (!rfqId) return res.status(400).json({ ok: false, error: 'rfqId is required.' });

  const sql = neon(process.env.DATABASE_URL);
  try {
    await ensureOwnershipColumns(sql);

    const requestRows = await sql`SELECT id, user_id, dealer_id FROM rfq_requests WHERE id = ${rfqId} LIMIT 1`;
    if (!requestRows.length) return res.status(404).json({ ok: false, error: 'RFQ not found.' });
    const request = requestRows[0] as { user_id: string; dealer_id: string };

    if (scope === 'dealer') {
      const ownsRequest = (userId && request.user_id === userId) || (dealerId && request.dealer_id === dealerId);
      if (!ownsRequest) return res.status(403).json({ ok: false, error: 'You do not have access to this RFQ history.' });
    }

    const history = await sql`SELECT id, rfq_id, status, note, actor, created_at FROM rfq_status_history WHERE rfq_id = ${rfqId} ORDER BY created_at DESC LIMIT 50`;
    const documents = await sql`SELECT id, rfq_id, file_name, file_type, file_size, document_type, created_at FROM rfq_documents WHERE rfq_id = ${rfqId} ORDER BY created_at DESC LIMIT 50`;
    return res.status(200).json({ ok: true, history, documents });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ ok: false, error: message });
  }
}
