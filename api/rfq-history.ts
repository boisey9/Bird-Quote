import { neon } from '@neondatabase/serverless';

type VercelRequest = {
  method?: string;
  query?: Record<string, string | string[] | undefined>;
};

type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
};

function getQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).json({ ok: true });
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  if (!process.env.DATABASE_URL) return res.status(500).json({ ok: false, error: 'DATABASE_URL is not configured.' });

  const rfqId = getQueryValue(req.query?.rfqId);
  if (!rfqId) return res.status(400).json({ ok: false, error: 'rfqId is required.' });

  const sql = neon(process.env.DATABASE_URL);

  try {
    const history = await sql`
      SELECT id, rfq_id, status, note, actor, created_at
      FROM rfq_status_history
      WHERE rfq_id = ${rfqId}
      ORDER BY created_at DESC
      LIMIT 50
    `;

    const documents = await sql`
      SELECT id, rfq_id, file_name, file_type, file_size, document_type, created_at
      FROM rfq_documents
      WHERE rfq_id = ${rfqId}
      ORDER BY created_at DESC
      LIMIT 50
    `;

    return res.status(200).json({ ok: true, history, documents });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ ok: false, error: message });
  }
}
