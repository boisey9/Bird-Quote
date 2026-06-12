import { neon } from '@neondatabase/serverless';

type VercelRequest = { method?: string; body?: unknown };
type VercelResponse = { status: (code: number) => VercelResponse; json: (body: unknown) => void; setHeader: (name: string, value: string) => void };

type ChassisRecord = { id: string; name: string; description: string; badge: string; sortOrder: number; active: boolean; imageUrl?: string };
type CertificationRecord = { id: string; chassisId: string; name: string; description: string; sortOrder: number; active: boolean; imageUrl?: string };
type WheelbaseRecord = { id: string; chassisId: string; name: string; description: string; certificationScope: 'school_commercial' | 'commercial_only' | 'school_only'; sortOrder: number; active: boolean; imageUrl?: string };
type BusTypeRecord = { id: string; name: string; description: string; sortOrder: number; active: boolean; imageUrl?: string };
type CompatibilityRecord = { chassisId: string; wheelbaseId: string; busTypeId: string };
type VehicleContractRule = { id: string; contractId: string; chassisId: string; certificationId: string; wheelbaseId: string; busTypeId: string; allowed: boolean; required: boolean; active: boolean; notes: string };
type VehicleMatrixPayload = { chassis?: ChassisRecord[]; certifications?: CertificationRecord[]; wheelbases?: WheelbaseRecord[]; busTypes?: BusTypeRecord[]; compatibility?: CompatibilityRecord[]; vehicleContractRules?: VehicleContractRule[] };

const seedVehicleMatrix = {
  chassis: [
    { id: 'gm', name: 'GM', description: 'General Motors chassis platform', badge: 'GM', sortOrder: 10, active: true },
    { id: 'ford', name: 'Ford', description: 'Ford chassis platform', badge: 'Ford', sortOrder: 20, active: true },
    { id: 'ford-transit', name: 'Ford Transit', description: 'Ford Transit chassis platform', badge: 'Ford', sortOrder: 30, active: true }
  ],
  certifications: [
    { id: 'gm-school', chassisId: 'gm', name: 'School Bus Package', description: 'Package to build a School Bus, MFSAB & MPV.', sortOrder: 10, active: true },
    { id: 'gm-shuttle', chassisId: 'gm', name: 'Shuttle Bus Package', description: 'Package to build a commercial vehicle.', sortOrder: 20, active: true },
    { id: 'ford-school', chassisId: 'ford', name: 'School Bus Package', description: 'Package to build a School Bus.', sortOrder: 10, active: true },
    { id: 'ford-mfsab', chassisId: 'ford', name: 'MFSAB Package', description: 'Package to build a Multi-Function School Activity Bus.', sortOrder: 20, active: true },
    { id: 'ford-shuttle', chassisId: 'ford', name: 'Shuttle Bus Package', description: 'Package to build a commercial vehicle.', sortOrder: 30, active: true },
    { id: 'transit-school', chassisId: 'ford-transit', name: 'School Bus Package', description: 'Package to build a School Bus.', sortOrder: 10, active: true },
    { id: 'transit-mfsab', chassisId: 'ford-transit', name: 'MFSAB Package', description: 'Package to build a Multi-Function School Activity Bus.', sortOrder: 20, active: true },
    { id: 'transit-shuttle', chassisId: 'ford-transit', name: 'Shuttle Bus Package', description: 'Package to build a commercial vehicle.', sortOrder: 30, active: true }
  ],
  wheelbases: [
    { id: 'gm-139-drw', chassisId: 'gm', name: '139 in WB DRW', description: '139 in Wheelbase DRW - School and Commercial', certificationScope: 'school_commercial' as const, sortOrder: 10, active: true },
    { id: 'gm-159-drw', chassisId: 'gm', name: '159 in WB DRW', description: '159 in Wheelbase DRW - School and Commercial', certificationScope: 'school_commercial' as const, sortOrder: 20, active: true },
    { id: 'ford-138-srw', chassisId: 'ford', name: '138 in WB SRW', description: '138 in Wheelbase SRW - School and Commercial', certificationScope: 'school_commercial' as const, sortOrder: 10, active: true },
    { id: 'ford-138-drw', chassisId: 'ford', name: '138 in WB DRW', description: '138 in Wheelbase DRW - School and Commercial', certificationScope: 'school_commercial' as const, sortOrder: 20, active: true },
    { id: 'ford-158-drw', chassisId: 'ford', name: '158 in WB DRW', description: '158 in Wheelbase DRW - School and Commercial', certificationScope: 'school_commercial' as const, sortOrder: 30, active: true },
    { id: 'ford-176-drw', chassisId: 'ford', name: '176 in WB DRW', description: '176 in Wheelbase DRW - Commercial only', certificationScope: 'commercial_only' as const, sortOrder: 40, active: true },
    { id: 'ford-190-drw', chassisId: 'ford', name: '190 in WB DRW', description: '190 in Wheelbase DRW - Extended commercial configuration', certificationScope: 'commercial_only' as const, sortOrder: 50, active: true },
    { id: 'ford-216-drw', chassisId: 'ford', name: '216 in WB DRW', description: '216 in Wheelbase DRW - Extended commercial configuration', certificationScope: 'commercial_only' as const, sortOrder: 60, active: true },
    { id: 'transit-138-srw', chassisId: 'ford-transit', name: '138 in WB SRW', description: '138 in Wheelbase SRW - School and MFSAB', certificationScope: 'school_commercial' as const, sortOrder: 10, active: true },
    { id: 'transit-156-srw', chassisId: 'ford-transit', name: '156 in WB SRW', description: '156 in Wheelbase SRW', certificationScope: 'school_commercial' as const, sortOrder: 20, active: true },
    { id: 'transit-156-drw', chassisId: 'ford-transit', name: '156 in WB DRW', description: '156 in Wheelbase DRW', certificationScope: 'school_commercial' as const, sortOrder: 30, active: true }
  ],
  busTypes: [
    { id: 'commercial-special-needs', name: 'Commercial Special Needs', description: 'Commercial bus equipped for special needs passenger transport.', sortOrder: 10, active: true },
    { id: 'commercial', name: 'Commercial Bus', description: 'Standard passenger transport for commercial use.', sortOrder: 20, active: true },
    { id: 'assisted-living', name: 'Assisted Living Special Needs', description: 'Accessible vehicles with low steps and safer boarding features.', sortOrder: 30, active: true },
    { id: 'airport', name: 'Airport and Off-Airport', description: 'Shuttle vehicles for passenger and luggage transfer.', sortOrder: 40, active: true },
    { id: 'hotel', name: 'Hotel, Casino and Resort', description: 'Comfortable shuttle vehicles for resorts and guest transfers.', sortOrder: 50, active: true },
    { id: 'church', name: 'Church and Community', description: 'Reliable vehicles for group transport and community activities.', sortOrder: 60, active: true }
  ],
  compatibility: [
    { chassisId: 'gm', wheelbaseId: 'gm-139-drw', busTypeId: 'commercial' },
    { chassisId: 'gm', wheelbaseId: 'gm-139-drw', busTypeId: 'commercial-special-needs' },
    { chassisId: 'gm', wheelbaseId: 'gm-159-drw', busTypeId: 'commercial' },
    { chassisId: 'gm', wheelbaseId: 'gm-159-drw', busTypeId: 'commercial-special-needs' },
    { chassisId: 'gm', wheelbaseId: 'gm-159-drw', busTypeId: 'assisted-living' },
    { chassisId: 'ford', wheelbaseId: 'ford-138-srw', busTypeId: 'commercial' },
    { chassisId: 'ford', wheelbaseId: 'ford-138-drw', busTypeId: 'commercial' },
    { chassisId: 'ford', wheelbaseId: 'ford-158-drw', busTypeId: 'commercial-special-needs' },
    { chassisId: 'ford', wheelbaseId: 'ford-158-drw', busTypeId: 'commercial' },
    { chassisId: 'ford', wheelbaseId: 'ford-158-drw', busTypeId: 'assisted-living' },
    { chassisId: 'ford', wheelbaseId: 'ford-158-drw', busTypeId: 'airport' },
    { chassisId: 'ford', wheelbaseId: 'ford-158-drw', busTypeId: 'hotel' },
    { chassisId: 'ford', wheelbaseId: 'ford-158-drw', busTypeId: 'church' },
    { chassisId: 'ford', wheelbaseId: 'ford-176-drw', busTypeId: 'commercial' },
    { chassisId: 'ford', wheelbaseId: 'ford-176-drw', busTypeId: 'airport' },
    { chassisId: 'ford', wheelbaseId: 'ford-190-drw', busTypeId: 'commercial' },
    { chassisId: 'ford', wheelbaseId: 'ford-216-drw', busTypeId: 'commercial' },
    { chassisId: 'ford-transit', wheelbaseId: 'transit-138-srw', busTypeId: 'commercial' },
    { chassisId: 'ford-transit', wheelbaseId: 'transit-156-srw', busTypeId: 'commercial' },
    { chassisId: 'ford-transit', wheelbaseId: 'transit-156-drw', busTypeId: 'commercial' },
    { chassisId: 'ford-transit', wheelbaseId: 'transit-156-drw', busTypeId: 'airport' }
  ],
  vehicleContractRules: [] as VehicleContractRule[]
};

function getPayload(body: unknown) {
  if (!body) return {} as VehicleMatrixPayload;
  if (typeof body === 'string') return JSON.parse(body) as VehicleMatrixPayload;
  return body as VehicleMatrixPayload;
}

async function ensureSchema(sql: ReturnType<typeof neon>) {
  await sql`CREATE TABLE IF NOT EXISTS cms_vehicle_chassis (chassis_id text PRIMARY KEY, name text NOT NULL, description text NOT NULL DEFAULT '', badge text NOT NULL DEFAULT '', image_url text NOT NULL DEFAULT '', sort_order integer NOT NULL DEFAULT 100, active boolean NOT NULL DEFAULT true, status text NOT NULL DEFAULT 'active', updated_at timestamptz NOT NULL DEFAULT now())`;
  await sql`CREATE TABLE IF NOT EXISTS cms_vehicle_certifications (certification_id text PRIMARY KEY, chassis_id text NOT NULL, name text NOT NULL, description text NOT NULL DEFAULT '', image_url text NOT NULL DEFAULT '', sort_order integer NOT NULL DEFAULT 100, active boolean NOT NULL DEFAULT true, status text NOT NULL DEFAULT 'active', updated_at timestamptz NOT NULL DEFAULT now())`;
  await sql`CREATE TABLE IF NOT EXISTS cms_vehicle_wheelbases (wheelbase_id text PRIMARY KEY, chassis_id text NOT NULL, name text NOT NULL, description text NOT NULL DEFAULT '', certification_scope text NOT NULL DEFAULT 'school_commercial', image_url text NOT NULL DEFAULT '', sort_order integer NOT NULL DEFAULT 100, active boolean NOT NULL DEFAULT true, status text NOT NULL DEFAULT 'active', updated_at timestamptz NOT NULL DEFAULT now())`;
  await sql`CREATE TABLE IF NOT EXISTS cms_vehicle_bus_types (bus_type_id text PRIMARY KEY, name text NOT NULL, description text NOT NULL DEFAULT '', image_url text NOT NULL DEFAULT '', sort_order integer NOT NULL DEFAULT 100, active boolean NOT NULL DEFAULT true, status text NOT NULL DEFAULT 'active', updated_at timestamptz NOT NULL DEFAULT now())`;
  await sql`CREATE TABLE IF NOT EXISTS cms_vehicle_compatibility (id text PRIMARY KEY, chassis_id text NOT NULL, wheelbase_id text NOT NULL, bus_type_id text NOT NULL, active boolean NOT NULL DEFAULT true, updated_at timestamptz NOT NULL DEFAULT now())`;
  await sql`CREATE TABLE IF NOT EXISTS cms_vehicle_contract_rules (id text PRIMARY KEY, contract_id text NOT NULL, chassis_id text NOT NULL DEFAULT 'any', certification_id text NOT NULL DEFAULT 'any', wheelbase_id text NOT NULL DEFAULT 'any', bus_type_id text NOT NULL DEFAULT 'any', allowed boolean NOT NULL DEFAULT true, required boolean NOT NULL DEFAULT false, active boolean NOT NULL DEFAULT true, notes text NOT NULL DEFAULT '', updated_at timestamptz NOT NULL DEFAULT now())`;
  await sql`ALTER TABLE cms_vehicle_chassis ADD COLUMN IF NOT EXISTS image_url text DEFAULT ''`;
  await sql`ALTER TABLE cms_vehicle_certifications ADD COLUMN IF NOT EXISTS image_url text DEFAULT ''`;
  await sql`ALTER TABLE cms_vehicle_wheelbases ADD COLUMN IF NOT EXISTS image_url text DEFAULT ''`;
  await sql`ALTER TABLE cms_vehicle_bus_types ADD COLUMN IF NOT EXISTS image_url text DEFAULT ''`;
}

function mapChassis(row: Record<string, unknown>): ChassisRecord {
  return { id: String(row.chassis_id), name: String(row.name ?? ''), description: String(row.description ?? ''), badge: String(row.badge ?? ''), imageUrl: String(row.image_url ?? ''), sortOrder: Number(row.sort_order ?? 100), active: Boolean(row.active ?? true) };
}
function mapCertification(row: Record<string, unknown>): CertificationRecord {
  return { id: String(row.certification_id), chassisId: String(row.chassis_id), name: String(row.name ?? ''), description: String(row.description ?? ''), imageUrl: String(row.image_url ?? ''), sortOrder: Number(row.sort_order ?? 100), active: Boolean(row.active ?? true) };
}
function mapWheelbase(row: Record<string, unknown>): WheelbaseRecord {
  return { id: String(row.wheelbase_id), chassisId: String(row.chassis_id), name: String(row.name ?? ''), description: String(row.description ?? ''), certificationScope: String(row.certification_scope ?? 'school_commercial') as WheelbaseRecord['certificationScope'], imageUrl: String(row.image_url ?? ''), sortOrder: Number(row.sort_order ?? 100), active: Boolean(row.active ?? true) };
}
function mapBusType(row: Record<string, unknown>): BusTypeRecord {
  return { id: String(row.bus_type_id), name: String(row.name ?? ''), description: String(row.description ?? ''), imageUrl: String(row.image_url ?? ''), sortOrder: Number(row.sort_order ?? 100), active: Boolean(row.active ?? true) };
}
function mapCompatibility(row: Record<string, unknown>): CompatibilityRecord {
  return { chassisId: String(row.chassis_id), wheelbaseId: String(row.wheelbase_id), busTypeId: String(row.bus_type_id) };
}
function mapContractRule(row: Record<string, unknown>): VehicleContractRule {
  return { id: String(row.id), contractId: String(row.contract_id), chassisId: String(row.chassis_id), certificationId: String(row.certification_id), wheelbaseId: String(row.wheelbase_id), busTypeId: String(row.bus_type_id), allowed: Boolean(row.allowed ?? true), required: Boolean(row.required ?? false), active: Boolean(row.active ?? true), notes: String(row.notes ?? '') };
}
function validatePayload(payload: Required<VehicleMatrixPayload>) {
  for (const chassis of payload.chassis) if (!chassis.id || !chassis.name) throw new Error('Every chassis requires id and name.');
  for (const certification of payload.certifications) if (!certification.id || !certification.chassisId || !certification.name) throw new Error('Every certification requires id, chassis, and name.');
  for (const wheelbase of payload.wheelbases) if (!wheelbase.id || !wheelbase.chassisId || !wheelbase.name) throw new Error('Every wheelbase requires id, chassis, and name.');
  for (const busType of payload.busTypes) if (!busType.id || !busType.name) throw new Error('Every bus type requires id and name.');
}
function jsonError(res: VercelResponse, status: number, message: string, extra: Record<string, unknown> = {}) {
  return res.status(status).json({ ok: false, error: message, ...extra });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).json({ ok: true });
  if (!process.env.DATABASE_URL) return jsonError(res, 500, 'DATABASE_URL is not configured.', { source: 'seed-fallback', ...seedVehicleMatrix });

  try {
    const sql = neon(process.env.DATABASE_URL);

    try {
      await ensureSchema(sql);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to initialize vehicle matrix schema.';
      if (req.method === 'GET') return res.status(200).json({ ok: true, source: 'schema-fallback', warning: message, ...seedVehicleMatrix });
      return jsonError(res, 500, message);
    }

    if (req.method === 'GET') {
      const chassisRows = await sql`SELECT chassis_id, name, description, badge, image_url, sort_order, active FROM cms_vehicle_chassis ORDER BY sort_order, name`;
      const certificationRows = await sql`SELECT certification_id, chassis_id, name, description, image_url, sort_order, active FROM cms_vehicle_certifications ORDER BY chassis_id, sort_order, name`;
      const wheelbaseRows = await sql`SELECT wheelbase_id, chassis_id, name, description, certification_scope, image_url, sort_order, active FROM cms_vehicle_wheelbases ORDER BY chassis_id, sort_order, name`;
      const busTypeRows = await sql`SELECT bus_type_id, name, description, image_url, sort_order, active FROM cms_vehicle_bus_types ORDER BY sort_order, name`;
      const compatibilityRows = await sql`SELECT chassis_id, wheelbase_id, bus_type_id FROM cms_vehicle_compatibility WHERE active = true ORDER BY chassis_id, wheelbase_id, bus_type_id`;
      const contractRuleRows = await sql`SELECT id, contract_id, chassis_id, certification_id, wheelbase_id, bus_type_id, allowed, required, active, notes FROM cms_vehicle_contract_rules ORDER BY contract_id, chassis_id, wheelbase_id, bus_type_id`;

      if (chassisRows.length === 0) return res.status(200).json({ ok: true, source: 'empty-neon', ...seedVehicleMatrix });

      return res.status(200).json({
        ok: true,
        source: 'neon',
        chassis: chassisRows.map((row) => mapChassis(row as Record<string, unknown>)),
        certifications: certificationRows.map((row) => mapCertification(row as Record<string, unknown>)),
        wheelbases: wheelbaseRows.map((row) => mapWheelbase(row as Record<string, unknown>)),
        busTypes: busTypeRows.map((row) => mapBusType(row as Record<string, unknown>)),
        compatibility: compatibilityRows.map((row) => mapCompatibility(row as Record<string, unknown>)),
        vehicleContractRules: contractRuleRows.map((row) => mapContractRule(row as Record<string, unknown>))
      });
    }

    if (req.method === 'PUT') {
      const payload = getPayload(req.body);
      const next = { chassis: payload.chassis ?? [], certifications: payload.certifications ?? [], wheelbases: payload.wheelbases ?? [], busTypes: payload.busTypes ?? [], compatibility: payload.compatibility ?? [], vehicleContractRules: payload.vehicleContractRules ?? [] };
      validatePayload(next);

      await sql`DELETE FROM cms_vehicle_contract_rules`;
      await sql`DELETE FROM cms_vehicle_compatibility`;
      await sql`DELETE FROM cms_vehicle_bus_types`;
      await sql`DELETE FROM cms_vehicle_wheelbases`;
      await sql`DELETE FROM cms_vehicle_certifications`;
      await sql`DELETE FROM cms_vehicle_chassis`;

      for (const item of next.chassis) await sql`INSERT INTO cms_vehicle_chassis (chassis_id, name, description, badge, image_url, sort_order, active, status, updated_at) VALUES (${item.id}, ${item.name}, ${item.description}, ${item.badge ?? ''}, ${item.imageUrl ?? ''}, ${item.sortOrder}, ${item.active}, ${item.active ? 'active' : 'inactive'}, now())`;
      for (const item of next.certifications) await sql`INSERT INTO cms_vehicle_certifications (certification_id, chassis_id, name, description, image_url, sort_order, active, status, updated_at) VALUES (${item.id}, ${item.chassisId}, ${item.name}, ${item.description}, ${item.imageUrl ?? ''}, ${item.sortOrder}, ${item.active}, ${item.active ? 'active' : 'inactive'}, now())`;
      for (const item of next.wheelbases) await sql`INSERT INTO cms_vehicle_wheelbases (wheelbase_id, chassis_id, name, description, certification_scope, image_url, sort_order, active, status, updated_at) VALUES (${item.id}, ${item.chassisId}, ${item.name}, ${item.description}, ${item.certificationScope}, ${item.imageUrl ?? ''}, ${item.sortOrder}, ${item.active}, ${item.active ? 'active' : 'inactive'}, now())`;
      for (const item of next.busTypes) await sql`INSERT INTO cms_vehicle_bus_types (bus_type_id, name, description, image_url, sort_order, active, status, updated_at) VALUES (${item.id}, ${item.name}, ${item.description}, ${item.imageUrl ?? ''}, ${item.sortOrder}, ${item.active}, ${item.active ? 'active' : 'inactive'}, now())`;
      for (const item of next.compatibility) await sql`INSERT INTO cms_vehicle_compatibility (id, chassis_id, wheelbase_id, bus_type_id, active, updated_at) VALUES (${`${item.chassisId}-${item.wheelbaseId}-${item.busTypeId}`}, ${item.chassisId}, ${item.wheelbaseId}, ${item.busTypeId}, true, now()) ON CONFLICT (id) DO NOTHING`;
      for (const item of next.vehicleContractRules) await sql`INSERT INTO cms_vehicle_contract_rules (id, contract_id, chassis_id, certification_id, wheelbase_id, bus_type_id, allowed, required, active, notes, updated_at) VALUES (${item.id}, ${item.contractId}, ${item.chassisId}, ${item.certificationId}, ${item.wheelbaseId}, ${item.busTypeId}, ${item.allowed}, ${item.required}, ${item.active}, ${item.notes}, now())`;

      return res.status(200).json({ ok: true, source: 'neon', ...next, counts: { chassis: next.chassis.length, certifications: next.certifications.length, wheelbases: next.wheelbases.length, busTypes: next.busTypes.length, compatibility: next.compatibility.length, vehicleContractRules: next.vehicleContractRules.length } });
    }

    return jsonError(res, 405, 'Method not allowed.');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Vehicle Matrix CMS function failed.';
    return jsonError(res, 500, message);
  }
}
