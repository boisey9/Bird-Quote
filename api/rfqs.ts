import { neon } from '@neondatabase/serverless';

type VercelRequest = {
  method?: string;
  body?: unknown;
};

type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
};

function generateRfqId() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const suffix = String(Date.now()).slice(-5);
  return `R-${year}${month}${day}-${suffix}`;
}

function getPayload(body: unknown) {
  if (typeof body === 'string') return JSON.parse(body);
  return body as Record<string, any>;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).json({ ok: true });
  }

  if (!process.env.DATABASE_URL) {
    return res.status(500).json({ ok: false, error: 'DATABASE_URL is not configured.' });
  }

  const sql = neon(process.env.DATABASE_URL);

  if (req.method === 'GET') {
    const rows = await sql`
      SELECT
        id,
        dealer_name,
        dealer_contact,
        final_customer_name,
        final_customer_phone,
        province_state,
        status,
        assigned_owner,
        priority,
        source,
        submitted_at,
        updated_at,
        payload
      FROM rfq_requests
      ORDER BY submitted_at DESC
      LIMIT 50
    `;
    return res.status(200).json({ ok: true, requests: rows });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  }

  try {
    const payload = getPayload(req.body);
    const rfqId = generateRfqId();
    const company = payload.company ?? {};

    await sql`
      INSERT INTO rfq_requests (
        id,
        dealer_name,
        dealer_contact,
        final_customer_name,
        final_customer_phone,
        province_state,
        status,
        assigned_owner,
        priority,
        source,
        payload
      ) VALUES (
        ${rfqId},
        ${company.dealerName ?? ''},
        ${company.dealerContact ?? ''},
        ${company.finalCustomerName ?? ''},
        ${company.finalCustomerPhone ?? ''},
        ${company.provinceState ?? ''},
        'Submitted',
        'Unassigned',
        'Normal',
        'bird-quote-web',
        ${JSON.stringify(payload)}::jsonb
      )
    `;

    await sql`
      INSERT INTO rfq_status_history (rfq_id, status, note, actor)
      VALUES (${rfqId}, 'Submitted', 'RFQ submitted by dealer portal', 'dealer')
    `;

    return res.status(201).json({ ok: true, rfqId, status: 'Submitted' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ ok: false, error: message });
  }
}
