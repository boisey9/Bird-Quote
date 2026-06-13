import { neon } from '@neondatabase/serverless';

type VercelRequest = {
  method?: string;
  body?: unknown;
  query?: Record<string, string | string[]>;
  url?: string;
};

type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
};

const allowedStatuses = new Set(['Draft', 'Submitted', 'In Review', 'Assigned', 'Quote In Progress', 'Quote Sent', 'Converted to Order', 'Cancelled']);

type SubmittedDocument = {
  fileName?: string;
  fileType?: string;
  fileSize?: string;
  documentType?: string;
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
  return body as Record<string, unknown>;
}

function getQueryValue(req: VercelRequest, key: string) {
  const direct = req.query?.[key];
  if (Array.isArray(direct)) return direct[0] ?? '';
  if (direct) return direct;
  if (!req.url) return '';
  try {
    const url = new URL(req.url, 'https://local.rfq');
    return url.searchParams.get(key) ?? '';
  } catch {
    return '';
  }
}

async function ensureOwnershipColumns(sql: ReturnType<typeof neon>) {
  await sql`ALTER TABLE rfq_requests ADD COLUMN IF NOT EXISTS user_id text NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE rfq_requests ADD COLUMN IF NOT EXISTS dealer_id text NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE rfq_requests ADD COLUMN IF NOT EXISTS submitted_by text NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE rfq_requests ADD COLUMN IF NOT EXISTS submitted_by_name text NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE rfq_requests ADD COLUMN IF NOT EXISTS dealer_company_name text NOT NULL DEFAULT ''`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).json({ ok: true });

  if (!process.env.DATABASE_URL) return res.status(500).json({ ok: false, error: 'DATABASE_URL is not configured.' });

  const sql = neon(process.env.DATABASE_URL);

  try {
    await ensureOwnershipColumns(sql);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to initialize RFQ ownership columns.';
    return res.status(500).json({ ok: false, error: message });
  }

  if (req.method === 'GET') {
    const scope = getQueryValue(req, 'scope');
    const userId = getQueryValue(req, 'userId');
    const dealerId = getQueryValue(req, 'dealerId');

    if (scope === 'dealer') {
      const rows = await sql`
        SELECT id, user_id, dealer_id, submitted_by, submitted_by_name, dealer_company_name, dealer_name, dealer_contact, final_customer_name, final_customer_phone, province_state, status, assigned_owner, priority, source, submitted_at, updated_at, payload
        FROM rfq_requests
        WHERE ((${userId} <> '' AND user_id = ${userId}) OR (${dealerId} <> '' AND dealer_id = ${dealerId}))
        ORDER BY submitted_at DESC
        LIMIT 50
      `;
      return res.status(200).json({ ok: true, scope: 'dealer', requests: rows });
    }

    const rows = await sql`
      SELECT id, user_id, dealer_id, submitted_by, submitted_by_name, dealer_company_name, dealer_name, dealer_contact, final_customer_name, final_customer_phone, province_state, status, assigned_owner, priority, source, submitted_at, updated_at, payload
      FROM rfq_requests
      ORDER BY submitted_at DESC
      LIMIT 50
    `;
    return res.status(200).json({ ok: true, scope: 'all', requests: rows });
  }

  if (req.method === 'PATCH') {
    try {
      const payload = getPayload(req.body);
      const rfqId = String(payload.rfqId ?? '');
      const nextStatus = payload.status ? String(payload.status) : undefined;
      const nextOwner = payload.assignedOwner ? String(payload.assignedOwner) : undefined;
      const actor = String(payload.actor ?? 'sales-ops');

      if (!rfqId) return res.status(400).json({ ok: false, error: 'rfqId is required.' });
      if (nextStatus && !allowedStatuses.has(nextStatus)) return res.status(400).json({ ok: false, error: 'Invalid RFQ status.' });

      const existingRows = await sql`SELECT id, status, assigned_owner FROM rfq_requests WHERE id = ${rfqId} LIMIT 1`;
      if (!existingRows.length) return res.status(404).json({ ok: false, error: 'RFQ not found.' });

      const existing = existingRows[0] as { status: string; assigned_owner: string };
      const statusToSave = nextStatus ?? existing.status;
      const ownerToSave = nextOwner ?? existing.assigned_owner;
      const notes: string[] = [];

      if (statusToSave !== existing.status) notes.push(`Status changed from ${existing.status} to ${statusToSave}`);
      if (ownerToSave !== existing.assigned_owner) notes.push(`Owner changed from ${existing.assigned_owner} to ${ownerToSave}`);

      await sql`UPDATE rfq_requests SET status = ${statusToSave}, assigned_owner = ${ownerToSave}, updated_at = CURRENT_TIMESTAMP WHERE id = ${rfqId}`;

      if (notes.length > 0) await sql`INSERT INTO rfq_status_history (rfq_id, status, note, actor) VALUES (${rfqId}, ${statusToSave}, ${notes.join(' | ')}, ${actor})`;

      return res.status(200).json({ ok: true, rfqId, status: statusToSave, assignedOwner: ownerToSave });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ ok: false, error: message });
    }
  }

  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed.' });

  try {
    const payload = getPayload(req.body);
    const rfqId = generateRfqId();
    const company = (payload.company ?? {}) as Record<string, string>;
    const documents = Array.isArray(payload.documents) ? payload.documents as SubmittedDocument[] : [];
    const userId = String(payload.userId ?? '');
    const dealerId = String(payload.dealerId ?? company.dealerId ?? '');
    const submittedBy = String(payload.submittedBy ?? company.dealerContact ?? '');
    const submittedByName = String(payload.submittedByName ?? company.dealerContact ?? submittedBy);
    const dealerCompanyName = String(payload.dealerCompanyName ?? company.dealerName ?? '');

    await sql`
      INSERT INTO rfq_requests (id, user_id, dealer_id, submitted_by, submitted_by_name, dealer_company_name, dealer_name, dealer_contact, final_customer_name, final_customer_phone, province_state, status, assigned_owner, priority, source, payload)
      VALUES (${rfqId}, ${userId}, ${dealerId}, ${submittedBy}, ${submittedByName}, ${dealerCompanyName}, ${company.dealerName ?? ''}, ${company.dealerContact ?? ''}, ${company.finalCustomerName ?? ''}, ${company.finalCustomerPhone ?? ''}, ${company.provinceState ?? ''}, 'Submitted', 'Unassigned', 'Normal', 'bird-quote-web', ${JSON.stringify(payload)}::jsonb)
    `;

    for (const document of documents) {
      await sql`INSERT INTO rfq_documents (rfq_id, file_name, file_type, file_size, document_type) VALUES (${rfqId}, ${document.fileName ?? ''}, ${document.fileType ?? ''}, ${document.fileSize ?? ''}, ${document.documentType ?? 'supporting'})`;
    }

    await sql`INSERT INTO rfq_status_history (rfq_id, status, note, actor) VALUES (${rfqId}, 'Submitted', ${`RFQ submitted by ${submittedBy || 'dealer portal'}`}, ${submittedBy || 'dealer'})`;

    if (documents.length > 0) await sql`INSERT INTO rfq_status_history (rfq_id, status, note, actor) VALUES (${rfqId}, 'Submitted', ${`${documents.length} document metadata record(s) attached`}, ${submittedBy || 'dealer'})`;

    return res.status(201).json({ ok: true, rfqId, status: 'Submitted' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ ok: false, error: message });
  }
}
