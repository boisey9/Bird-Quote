import { neon } from '@neondatabase/serverless';

type VercelRequest = { method?: string; body?: unknown };
type VercelResponse = { status: (code: number) => VercelResponse; json: (body: unknown) => void; setHeader: (name: string, value: string) => void };

type RoutingRule = {
  id: string;
  name: string;
  triggerType: 'market' | 'accessibility' | 'contract' | 'urgency' | 'document' | 'manual';
  condition: string;
  assignedQueue: string;
  ownerRole: string;
  priority: 'Low' | 'Normal' | 'High' | 'Urgent';
  active: boolean;
  sortOrder: number;
  notes: string;
};

type SlaRule = {
  id: string;
  name: string;
  appliesTo: 'standard' | 'urgent' | 'contract' | 'accessibility' | 'all';
  targetHours: number;
  businessHoursOnly: boolean;
  escalationHours: number;
  ownerRole: string;
  active: boolean;
  sortOrder: number;
  notes: string;
};

type RoutingSlaPayload = { routingRules?: RoutingRule[]; slaRules?: SlaRule[] };

const seedRoutingRules: RoutingRule[] = [
  { id: 'route-commercial-standard', name: 'Commercial RFQs', triggerType: 'market', condition: 'Commercial bus type or commercial seating intent', assignedQueue: 'Sales Ops Queue', ownerRole: 'Sales Ops', priority: 'Normal', active: true, sortOrder: 10, notes: 'Default commercial routing.' },
  { id: 'route-accessibility-review', name: 'Accessibility RFQs', triggerType: 'accessibility', condition: 'Wheelchair capacity, lift/ramp, or accessibility option requested', assignedQueue: 'Estimating Queue', ownerRole: 'Estimating Team', priority: 'High', active: true, sortOrder: 20, notes: 'Accessibility review before quoting.' },
  { id: 'route-contract-review', name: 'Contract RFQs', triggerType: 'contract', condition: 'Contract-controlled workflow selected', assignedQueue: 'Contract Review Queue', ownerRole: 'Sales Ops + Manager', priority: 'High', active: true, sortOrder: 30, notes: 'Future approval workflow hook.' },
  { id: 'route-urgent-bid', name: 'Bid / urgent response', triggerType: 'urgency', condition: 'Bid / Urgent Response option selected', assignedQueue: 'Priority Quote Queue', ownerRole: 'Sales Ops', priority: 'Urgent', active: true, sortOrder: 40, notes: 'Expedite urgent bid requests.' }
];

const seedSlaRules: SlaRule[] = [
  { id: 'sla-assignment-standard', name: 'Standard RFQ assignment', appliesTo: 'standard', targetHours: 8, businessHoursOnly: true, escalationHours: 12, ownerRole: 'Sales Ops', active: true, sortOrder: 10, notes: 'Initial owner assignment target.' },
  { id: 'sla-quote-standard', name: 'Standard quote turnaround', appliesTo: 'standard', targetHours: 24, businessHoursOnly: true, escalationHours: 32, ownerRole: 'Sales Ops', active: true, sortOrder: 20, notes: '3 business days based on 8-hour day.' },
  { id: 'sla-contract-approval', name: 'Contract quote approval', appliesTo: 'contract', targetHours: 16, businessHoursOnly: true, escalationHours: 24, ownerRole: 'Manager', active: true, sortOrder: 30, notes: 'Approval required before quote release.' },
  { id: 'sla-urgent-bid', name: 'Urgent bid response', appliesTo: 'urgent', targetHours: 8, businessHoursOnly: true, escalationHours: 10, ownerRole: 'Sales Ops', active: true, sortOrder: 40, notes: 'One business day target.' }
];

function getPayload(body: unknown) {
  if (!body) return {} as RoutingSlaPayload;
  if (typeof body === 'string') return JSON.parse(body) as RoutingSlaPayload;
  return body as RoutingSlaPayload;
}

function jsonError(res: VercelResponse, status: number, message: string, extra: Record<string, unknown> = {}) {
  return res.status(status).json({ ok: false, error: message, ...extra });
}

async function ensureSchema(sql: ReturnType<typeof neon>) {
  await sql`CREATE TABLE IF NOT EXISTS cms_routing_rules (id text PRIMARY KEY, name text NOT NULL, trigger_type text NOT NULL DEFAULT 'manual', condition text NOT NULL DEFAULT '', assigned_queue text NOT NULL DEFAULT '', owner_role text NOT NULL DEFAULT '', priority text NOT NULL DEFAULT 'Normal', active boolean NOT NULL DEFAULT true, sort_order integer NOT NULL DEFAULT 100, notes text NOT NULL DEFAULT '', updated_at timestamptz NOT NULL DEFAULT now())`;
  await sql`CREATE TABLE IF NOT EXISTS cms_sla_rules (id text PRIMARY KEY, name text NOT NULL, applies_to text NOT NULL DEFAULT 'standard', target_hours integer NOT NULL DEFAULT 8, business_hours_only boolean NOT NULL DEFAULT true, escalation_hours integer NOT NULL DEFAULT 12, owner_role text NOT NULL DEFAULT '', active boolean NOT NULL DEFAULT true, sort_order integer NOT NULL DEFAULT 100, notes text NOT NULL DEFAULT '', updated_at timestamptz NOT NULL DEFAULT now())`;
}

function mapRoutingRule(row: Record<string, unknown>): RoutingRule {
  return { id: String(row.id), name: String(row.name ?? ''), triggerType: String(row.trigger_type ?? 'manual') as RoutingRule['triggerType'], condition: String(row.condition ?? ''), assignedQueue: String(row.assigned_queue ?? ''), ownerRole: String(row.owner_role ?? ''), priority: String(row.priority ?? 'Normal') as RoutingRule['priority'], active: Boolean(row.active ?? true), sortOrder: Number(row.sort_order ?? 100), notes: String(row.notes ?? '') };
}

function mapSlaRule(row: Record<string, unknown>): SlaRule {
  return { id: String(row.id), name: String(row.name ?? ''), appliesTo: String(row.applies_to ?? 'standard') as SlaRule['appliesTo'], targetHours: Number(row.target_hours ?? 8), businessHoursOnly: Boolean(row.business_hours_only ?? true), escalationHours: Number(row.escalation_hours ?? 12), ownerRole: String(row.owner_role ?? ''), active: Boolean(row.active ?? true), sortOrder: Number(row.sort_order ?? 100), notes: String(row.notes ?? '') };
}

function validate(next: Required<RoutingSlaPayload>) {
  for (const rule of next.routingRules) if (!rule.id || !rule.name) throw new Error('Every routing rule requires id and name.');
  for (const rule of next.slaRules) if (!rule.id || !rule.name) throw new Error('Every SLA rule requires id and name.');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).json({ ok: true });
  if (!process.env.DATABASE_URL) return jsonError(res, 500, 'DATABASE_URL is not configured.', { source: 'seed-fallback', routingRules: seedRoutingRules, slaRules: seedSlaRules });

  try {
    const sql = neon(process.env.DATABASE_URL);
    try {
      await ensureSchema(sql);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to initialize routing/SLA schema.';
      if (req.method === 'GET') return res.status(200).json({ ok: true, source: 'schema-fallback', warning: message, routingRules: seedRoutingRules, slaRules: seedSlaRules });
      return jsonError(res, 500, message);
    }

    if (req.method === 'GET') {
      const routingRows = await sql`SELECT id, name, trigger_type, condition, assigned_queue, owner_role, priority, active, sort_order, notes FROM cms_routing_rules ORDER BY sort_order, name`;
      const slaRows = await sql`SELECT id, name, applies_to, target_hours, business_hours_only, escalation_hours, owner_role, active, sort_order, notes FROM cms_sla_rules ORDER BY sort_order, name`;
      if (routingRows.length === 0 && slaRows.length === 0) return res.status(200).json({ ok: true, source: 'empty-neon', routingRules: seedRoutingRules, slaRules: seedSlaRules });
      return res.status(200).json({ ok: true, source: 'neon', routingRules: routingRows.map((row) => mapRoutingRule(row as Record<string, unknown>)), slaRules: slaRows.map((row) => mapSlaRule(row as Record<string, unknown>)) });
    }

    if (req.method === 'PUT') {
      const payload = getPayload(req.body);
      const next = { routingRules: payload.routingRules ?? [], slaRules: payload.slaRules ?? [] };
      validate(next);
      await sql`DELETE FROM cms_routing_rules`;
      await sql`DELETE FROM cms_sla_rules`;
      for (const item of next.routingRules) await sql`INSERT INTO cms_routing_rules (id, name, trigger_type, condition, assigned_queue, owner_role, priority, active, sort_order, notes, updated_at) VALUES (${item.id}, ${item.name}, ${item.triggerType}, ${item.condition}, ${item.assignedQueue}, ${item.ownerRole}, ${item.priority}, ${item.active}, ${item.sortOrder}, ${item.notes}, now())`;
      for (const item of next.slaRules) await sql`INSERT INTO cms_sla_rules (id, name, applies_to, target_hours, business_hours_only, escalation_hours, owner_role, active, sort_order, notes, updated_at) VALUES (${item.id}, ${item.name}, ${item.appliesTo}, ${item.targetHours}, ${item.businessHoursOnly}, ${item.escalationHours}, ${item.ownerRole}, ${item.active}, ${item.sortOrder}, ${item.notes}, now())`;
      return res.status(200).json({ ok: true, source: 'neon', ...next, counts: { routingRules: next.routingRules.length, slaRules: next.slaRules.length } });
    }

    return jsonError(res, 405, 'Method not allowed.');
  } catch (error) {
    return jsonError(res, 500, error instanceof Error ? error.message : 'Routing/SLA CMS function failed.');
  }
}
