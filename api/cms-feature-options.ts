import { neon } from '@neondatabase/serverless';

type VercelRequest = { method?: string; body?: unknown };
type VercelResponse = { status: (code: number) => VercelResponse; json: (body: unknown) => void; setHeader: (name: string, value: string) => void };

type FeatureCategoryRecord = { id: number; title: string; description: string; sortOrder: number; active: boolean; comments: string; customerVisible?: boolean; status?: string };
type FeatureOptionRecord = { id: number; categoryId: number; title: string; description: string; sortOrder: number; active: boolean; imageExt: string; imageUrl?: string; requiresDocument?: boolean; status?: string; notes?: string };
type FeatureContractRule = { id: string; contractId: string; categoryId: number | null; optionId: number | null; chassisId: string; certificationId: string; wheelbaseId: string; busTypeId: string; ruleType: 'available' | 'hidden' | 'required' | 'recommended'; autoSelect: boolean; requiresDocument: boolean; active: boolean; notes: string };
type FeatureOptionsPayload = { categories?: FeatureCategoryRecord[]; options?: FeatureOptionRecord[]; contractRules?: FeatureContractRule[] };

const seedFeatureOptions = {
  categories: [
    { id: 1, title: 'Layout', description: 'Customer-facing layout intent and floorplan reference.', sortOrder: 1, active: false, customerVisible: false, status: 'inactive', comments: 'Handled by Seats and Floorplan Intent.' },
    { id: 17, title: 'Seats', description: 'Seat layout, material, color, and seat type requirements.', sortOrder: 2, active: false, customerVisible: false, status: 'inactive', comments: 'Handled by Seats and Floorplan Intent.' },
    { id: 9, title: 'Interior Features', description: 'Interior materials, grab rails, wall/ceiling finish, lighting, and flooring.', sortOrder: 3, active: true, customerVisible: true, status: 'active', comments: '' },
    { id: 7, title: 'Doors and Accessibility', description: 'Entry door, wheelchair lift/ramp, securement, handrails, and accessibility aids.', sortOrder: 4, active: true, customerVisible: true, status: 'active', comments: '' },
    { id: 2, title: 'Climate and Comfort', description: 'A/C, heating, defrost, comfort package, and passenger climate requirements.', sortOrder: 5, active: true, customerVisible: true, status: 'active', comments: '' },
    { id: 10, title: 'Safety Systems', description: 'Safety equipment, camera, emergency equipment, and driver visibility aids.', sortOrder: 6, active: true, customerVisible: true, status: 'active', comments: '' },
    { id: 11, title: 'Powertrain', description: 'Powertrain intent, fuel type, and drivetrain-related commercial requirements.', sortOrder: 7, active: true, customerVisible: true, status: 'active', comments: '' },
    { id: 12, title: 'Exterior and Branding', description: 'Exterior paint, decals, destination signs, graphics, and customer branding.', sortOrder: 8, active: true, customerVisible: true, status: 'active', comments: '' },
    { id: 18, title: 'Quote Response', description: 'Expected quote urgency and special bid response timing.', sortOrder: 9, active: true, customerVisible: true, status: 'active', comments: '' }
  ] as FeatureCategoryRecord[],
  options: [
    { id: 101, categoryId: 2, title: 'A/C - Light Duty', description: 'Compact A/C system for basic cooling needs.', sortOrder: 1, active: true, imageExt: 'aclightduty.png', status: 'active' },
    { id: 102, categoryId: 2, title: 'A/C - Standard', description: 'Mid-capacity A/C with front or rear evaporator and condenser.', sortOrder: 2, active: true, imageExt: 'acstandard.png', status: 'active' },
    { id: 103, categoryId: 2, title: 'A/C - High Capacity', description: 'High-output A/C system for larger passenger volumes.', sortOrder: 3, active: true, imageExt: 'achighcapacity.png', status: 'active' },
    { id: 104, categoryId: 2, title: 'Heater - Rear', description: 'Rear heating package for passenger comfort.', sortOrder: 4, active: true, imageExt: 'heaterrear.png', status: 'active' },
    { id: 201, categoryId: 9, title: 'Altro Non-Slip Flooring', description: 'Durable non-slip flooring for commercial and accessible applications.', sortOrder: 1, active: true, imageExt: 'altro.png', status: 'active' },
    { id: 202, categoryId: 9, title: 'Grab Rails', description: 'Passenger grab rails and stanchion support.', sortOrder: 2, active: true, imageExt: 'grabrails.png', status: 'active' },
    { id: 203, categoryId: 9, title: 'Wall / Ceiling Finish', description: 'Interior finish selection for customer-facing quote intent.', sortOrder: 3, active: true, imageExt: 'wallfinish.png', status: 'active' },
    { id: 204, categoryId: 9, title: 'Interior LED Lighting', description: 'LED passenger-area lighting package.', sortOrder: 4, active: true, imageExt: 'ledinterior.png', status: 'active' },
    { id: 301, categoryId: 7, title: 'Wheelchair Lift / Ramp', description: 'Lift or ramp requirement for accessible vehicles.', sortOrder: 1, active: true, imageExt: 'lift.png', status: 'active' },
    { id: 302, categoryId: 7, title: 'Wheelchair Restraint', description: 'Wheelchair restraint system requirement.', sortOrder: 2, active: true, imageExt: 'restraint.png', status: 'active' },
    { id: 303, categoryId: 7, title: 'Entry Door', description: 'Entry door type and customer access preference.', sortOrder: 3, active: true, imageExt: 'entrydoor.png', status: 'active' },
    { id: 304, categoryId: 7, title: 'Handrails', description: 'Handrail finish and placement intent.', sortOrder: 4, active: true, imageExt: 'handrails.png', status: 'active' },
    { id: 401, categoryId: 10, title: 'Backup Camera', description: 'Rear-view camera package.', sortOrder: 1, active: true, imageExt: 'backupcamera.png', status: 'active' },
    { id: 402, categoryId: 10, title: 'Fire Extinguisher', description: 'Fire extinguisher requirement.', sortOrder: 2, active: true, imageExt: 'extinguisher.png', status: 'active' },
    { id: 403, categoryId: 10, title: 'First Aid Kit', description: 'First aid kit requirement.', sortOrder: 3, active: true, imageExt: 'firstaid.png', status: 'active' },
    { id: 501, categoryId: 11, title: 'Gasoline Powertrain', description: 'Standard gasoline powertrain intent.', sortOrder: 1, active: true, imageExt: 'gas.png', status: 'active' },
    { id: 502, categoryId: 11, title: 'Propane Prep / LPG', description: 'Propane or LPG-related powertrain interest.', sortOrder: 2, active: true, imageExt: 'lpg.png', status: 'active' },
    { id: 601, categoryId: 12, title: 'Exterior Color', description: 'Standard white or requested exterior color.', sortOrder: 1, active: true, imageExt: 'exteriorcolor.png', status: 'active' },
    { id: 602, categoryId: 12, title: 'Graphics / Decals', description: 'Graphics, decals, logo, or branding request.', sortOrder: 2, active: true, imageExt: 'decals.png', status: 'active' },
    { id: 603, categoryId: 12, title: 'Destination Signage', description: 'Destination sign or customer signage requirement.', sortOrder: 3, active: true, imageExt: 'signage.png', status: 'active' },
    { id: 701, categoryId: 18, title: 'Standard Quote Timing', description: 'Normal quote response timing.', sortOrder: 1, active: true, imageExt: '', status: 'active' },
    { id: 702, categoryId: 18, title: 'Bid / Urgent Response', description: 'Bid contract or urgent deadline request.', sortOrder: 2, active: true, imageExt: '', status: 'active' }
  ] as FeatureOptionRecord[],
  contractRules: [] as FeatureContractRule[]
};

function getPayload(body: unknown) {
  if (!body) return {} as FeatureOptionsPayload;
  if (typeof body === 'string') return JSON.parse(body) as FeatureOptionsPayload;
  return body as FeatureOptionsPayload;
}
function jsonError(res: VercelResponse, status: number, message: string, extra: Record<string, unknown> = {}) { return res.status(status).json({ ok: false, error: message, ...extra }); }
function normalizeRule(rule: Partial<FeatureContractRule> & Pick<FeatureContractRule, 'id' | 'contractId' | 'ruleType' | 'autoSelect' | 'requiresDocument' | 'active' | 'notes'>): FeatureContractRule {
  return { id: rule.id, contractId: rule.contractId, categoryId: rule.categoryId ?? null, optionId: rule.optionId ?? null, chassisId: rule.chassisId ?? 'any', certificationId: rule.certificationId ?? 'any', wheelbaseId: rule.wheelbaseId ?? 'any', busTypeId: rule.busTypeId ?? 'any', ruleType: rule.ruleType, autoSelect: rule.autoSelect, requiresDocument: rule.requiresDocument, active: rule.active, notes: rule.notes };
}

async function ensureSchema(sql: ReturnType<typeof neon>) {
  await sql`CREATE TABLE IF NOT EXISTS cms_feature_categories (category_id integer PRIMARY KEY, title text NOT NULL, description text NOT NULL DEFAULT '', sort_order integer NOT NULL DEFAULT 100, active boolean NOT NULL DEFAULT true, customer_visible boolean NOT NULL DEFAULT true, status text NOT NULL DEFAULT 'active', comments text NOT NULL DEFAULT '', updated_at timestamptz NOT NULL DEFAULT now())`;
  await sql`CREATE TABLE IF NOT EXISTS cms_feature_options (option_id integer PRIMARY KEY, category_id integer NOT NULL, title text NOT NULL, description text NOT NULL DEFAULT '', image_ext text NOT NULL DEFAULT '', image_url text NOT NULL DEFAULT '', requires_document boolean NOT NULL DEFAULT false, sort_order integer NOT NULL DEFAULT 100, active boolean NOT NULL DEFAULT true, status text NOT NULL DEFAULT 'active', notes text NOT NULL DEFAULT '', updated_at timestamptz NOT NULL DEFAULT now())`;
  await sql`CREATE TABLE IF NOT EXISTS cms_feature_contract_rules (id text PRIMARY KEY, contract_id text NOT NULL, category_id integer, option_id integer, chassis_id text NOT NULL DEFAULT 'any', certification_id text NOT NULL DEFAULT 'any', wheelbase_id text NOT NULL DEFAULT 'any', bus_type_id text NOT NULL DEFAULT 'any', rule_type text NOT NULL DEFAULT 'available', auto_select boolean NOT NULL DEFAULT false, requires_document boolean NOT NULL DEFAULT false, active boolean NOT NULL DEFAULT true, notes text NOT NULL DEFAULT '', updated_at timestamptz NOT NULL DEFAULT now())`;
  await sql`ALTER TABLE cms_feature_contract_rules ADD COLUMN IF NOT EXISTS chassis_id text NOT NULL DEFAULT 'any'`;
  await sql`ALTER TABLE cms_feature_contract_rules ADD COLUMN IF NOT EXISTS certification_id text NOT NULL DEFAULT 'any'`;
  await sql`ALTER TABLE cms_feature_contract_rules ADD COLUMN IF NOT EXISTS wheelbase_id text NOT NULL DEFAULT 'any'`;
  await sql`ALTER TABLE cms_feature_contract_rules ADD COLUMN IF NOT EXISTS bus_type_id text NOT NULL DEFAULT 'any'`;
}
function mapCategory(row: Record<string, unknown>): FeatureCategoryRecord { return { id: Number(row.category_id), title: String(row.title ?? ''), description: String(row.description ?? ''), sortOrder: Number(row.sort_order ?? 100), active: Boolean(row.active ?? true), customerVisible: Boolean(row.customer_visible ?? true), status: String(row.status ?? 'active'), comments: String(row.comments ?? '') }; }
function mapOption(row: Record<string, unknown>): FeatureOptionRecord { return { id: Number(row.option_id), categoryId: Number(row.category_id), title: String(row.title ?? ''), description: String(row.description ?? ''), imageExt: String(row.image_ext ?? ''), imageUrl: String(row.image_url ?? ''), requiresDocument: Boolean(row.requires_document ?? false), sortOrder: Number(row.sort_order ?? 100), active: Boolean(row.active ?? true), status: String(row.status ?? 'active'), notes: String(row.notes ?? '') }; }
function mapRule(row: Record<string, unknown>): FeatureContractRule {
  const ruleType = String(row.rule_type ?? 'available');
  return normalizeRule({ id: String(row.id), contractId: String(row.contract_id), categoryId: row.category_id === null ? null : Number(row.category_id), optionId: row.option_id === null ? null : Number(row.option_id), chassisId: String(row.chassis_id ?? 'any'), certificationId: String(row.certification_id ?? 'any'), wheelbaseId: String(row.wheelbase_id ?? 'any'), busTypeId: String(row.bus_type_id ?? 'any'), ruleType: ['available', 'hidden', 'required', 'recommended'].includes(ruleType) ? ruleType as FeatureContractRule['ruleType'] : 'available', autoSelect: Boolean(row.auto_select ?? false), requiresDocument: Boolean(row.requires_document ?? false), active: Boolean(row.active ?? true), notes: String(row.notes ?? '') });
}
function validatePayload(payload: Required<FeatureOptionsPayload>) { for (const category of payload.categories) if (!category.id || !category.title) throw new Error('Every feature category requires id and title.'); for (const option of payload.options) if (!option.id || !option.categoryId || !option.title) throw new Error('Every feature option requires id, category, and title.'); }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).json({ ok: true });
  if (!process.env.DATABASE_URL) return jsonError(res, 500, 'DATABASE_URL is not configured.', { source: 'seed-fallback', ...seedFeatureOptions });
  try {
    const sql = neon(process.env.DATABASE_URL);
    try { await ensureSchema(sql); } catch (error) { const message = error instanceof Error ? error.message : 'Unable to initialize feature options schema.'; if (req.method === 'GET') return res.status(200).json({ ok: true, source: 'schema-fallback', warning: message, ...seedFeatureOptions }); return jsonError(res, 500, message); }
    if (req.method === 'GET') {
      const categoryRows = await sql`SELECT category_id, title, description, sort_order, active, customer_visible, status, comments FROM cms_feature_categories ORDER BY sort_order, title`;
      const optionRows = await sql`SELECT option_id, category_id, title, description, image_ext, image_url, requires_document, sort_order, active, status, notes FROM cms_feature_options ORDER BY category_id, sort_order, title`;
      const ruleRows = await sql`SELECT id, contract_id, category_id, option_id, chassis_id, certification_id, wheelbase_id, bus_type_id, rule_type, auto_select, requires_document, active, notes FROM cms_feature_contract_rules ORDER BY contract_id, chassis_id, wheelbase_id, bus_type_id, category_id, option_id`;
      if (categoryRows.length === 0) return res.status(200).json({ ok: true, source: 'empty-neon', ...seedFeatureOptions });
      return res.status(200).json({ ok: true, source: 'neon', categories: categoryRows.map((row) => mapCategory(row as Record<string, unknown>)), options: optionRows.map((row) => mapOption(row as Record<string, unknown>)), contractRules: ruleRows.map((row) => mapRule(row as Record<string, unknown>)) });
    }
    if (req.method === 'PUT') {
      const payload = getPayload(req.body);
      const next = { categories: payload.categories ?? [], options: payload.options ?? [], contractRules: (payload.contractRules ?? []).map((rule) => normalizeRule(rule)) };
      validatePayload(next);
      await sql`DELETE FROM cms_feature_contract_rules`; await sql`DELETE FROM cms_feature_options`; await sql`DELETE FROM cms_feature_categories`;
      for (const item of next.categories) await sql`INSERT INTO cms_feature_categories (category_id, title, description, sort_order, active, customer_visible, status, comments, updated_at) VALUES (${item.id}, ${item.title}, ${item.description}, ${item.sortOrder}, ${item.active}, ${item.customerVisible ?? item.active}, ${item.status ?? (item.active ? 'active' : 'inactive')}, ${item.comments ?? ''}, now())`;
      for (const item of next.options) await sql`INSERT INTO cms_feature_options (option_id, category_id, title, description, image_ext, image_url, requires_document, sort_order, active, status, notes, updated_at) VALUES (${item.id}, ${item.categoryId}, ${item.title}, ${item.description}, ${item.imageExt ?? ''}, ${item.imageUrl ?? ''}, ${item.requiresDocument ?? false}, ${item.sortOrder}, ${item.active}, ${item.status ?? (item.active ? 'active' : 'inactive')}, ${item.notes ?? ''}, now())`;
      for (const item of next.contractRules) await sql`INSERT INTO cms_feature_contract_rules (id, contract_id, category_id, option_id, chassis_id, certification_id, wheelbase_id, bus_type_id, rule_type, auto_select, requires_document, active, notes, updated_at) VALUES (${item.id}, ${item.contractId}, ${item.categoryId}, ${item.optionId}, ${item.chassisId}, ${item.certificationId}, ${item.wheelbaseId}, ${item.busTypeId}, ${item.ruleType}, ${item.autoSelect}, ${item.requiresDocument}, ${item.active}, ${item.notes}, now())`;
      return res.status(200).json({ ok: true, source: 'neon', ...next, counts: { categories: next.categories.length, options: next.options.length, contractRules: next.contractRules.length } });
    }
    return jsonError(res, 405, 'Method not allowed.');
  } catch (error) { return jsonError(res, 500, error instanceof Error ? error.message : 'Feature Options CMS function failed.'); }
}
