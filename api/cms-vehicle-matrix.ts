import { neon } from '@neondatabase/serverless';
import { busSpecMatrixData } from '../src/data/busSpecMatrix';

type VercelRequest = { method?: string; body?: unknown };
type VercelResponse = { status: (code: number) => VercelResponse; json: (body: unknown) => void; setHeader: (name: string, value: string) => void };

type ChassisRecord = typeof busSpecMatrixData.chassis[number];
type CertificationRecord = typeof busSpecMatrixData.certifications[number];
type WheelbaseRecord = typeof busSpecMatrixData.wheelbases[number];
type BusTypeRecord = typeof busSpecMatrixData.busTypes[number];
type CompatibilityRecord = typeof busSpecMatrixData.compatibility[number];

type VehicleContractRule = {
  id: string;
  contractId: string;
  chassisId: string;
  certificationId: string;
  wheelbaseId: string;
  busTypeId: string;
  allowed: boolean;
  required: boolean;
  active: boolean;
  notes: string;
};

type VehicleMatrixPayload = {
  chassis?: ChassisRecord[];
  certifications?: CertificationRecord[];
  wheelbases?: WheelbaseRecord[];
  busTypes?: BusTypeRecord[];
  compatibility?: CompatibilityRecord[];
  vehicleContractRules?: VehicleContractRule[];
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
  await sql`ALTER TABLE cms_vehicle_chassis ADD COLUMN IF NOT EXISTS image_url text NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE cms_vehicle_certifications ADD COLUMN IF NOT EXISTS image_url text NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE cms_vehicle_wheelbases ADD COLUMN IF NOT EXISTS image_url text NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE cms_vehicle_bus_types ADD COLUMN IF NOT EXISTS image_url text NOT NULL DEFAULT ''`;
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).json({ ok: true });
  if (!process.env.DATABASE_URL) return res.status(500).json({ ok: false, error: 'DATABASE_URL is not configured.' });

  const sql = neon(process.env.DATABASE_URL);
  await ensureSchema(sql);

  if (req.method === 'GET') {
    try {
      const chassisRows = await sql`SELECT chassis_id, name, description, badge, image_url, sort_order, active FROM cms_vehicle_chassis ORDER BY sort_order, name`;
      const certificationRows = await sql`SELECT certification_id, chassis_id, name, description, image_url, sort_order, active FROM cms_vehicle_certifications ORDER BY chassis_id, sort_order, name`;
      const wheelbaseRows = await sql`SELECT wheelbase_id, chassis_id, name, description, certification_scope, image_url, sort_order, active FROM cms_vehicle_wheelbases ORDER BY chassis_id, sort_order, name`;
      const busTypeRows = await sql`SELECT bus_type_id, name, description, image_url, sort_order, active FROM cms_vehicle_bus_types ORDER BY sort_order, name`;
      const compatibilityRows = await sql`SELECT chassis_id, wheelbase_id, bus_type_id FROM cms_vehicle_compatibility WHERE active = true ORDER BY chassis_id, wheelbase_id, bus_type_id`;
      const contractRuleRows = await sql`SELECT id, contract_id, chassis_id, certification_id, wheelbase_id, bus_type_id, allowed, required, active, notes FROM cms_vehicle_contract_rules ORDER BY contract_id, chassis_id, wheelbase_id, bus_type_id`;

      if (chassisRows.length === 0) {
        return res.status(200).json({ ok: true, source: 'empty-neon', ...busSpecMatrixData, vehicleContractRules: [] });
      }

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
    } catch (error) {
      return res.status(500).json({ ok: false, error: error instanceof Error ? error.message : 'Unable to load vehicle matrix CMS.' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const payload = getPayload(req.body);
      const next = { chassis: payload.chassis ?? [], certifications: payload.certifications ?? [], wheelbases: payload.wheelbases ?? [], busTypes: payload.busTypes ?? [], compatibility: payload.compatibility ?? [], vehicleContractRules: payload.vehicleContractRules ?? [] };
      validatePayload(next);

      await sql`DELETE FROM cms_vehicle_contract_rules`;
      await sql`DELETE FROM cms_vehicle_compatibility`;
      await sql`DELETE FROM cms_vehicle_bus_types`;
      await sql`DELETE FROM cms_vehicle_wheelbases`;
      await sql`DELETE FROM cms_vehicle_certifications`;
      await sql`DELETE FROM cms_vehicle_chassis`;

      for (const item of next.chassis) {
        await sql`INSERT INTO cms_vehicle_chassis (chassis_id, name, description, badge, image_url, sort_order, active, status, updated_at) VALUES (${item.id}, ${item.name}, ${item.description}, ${item.badge ?? ''}, ${item.imageUrl ?? ''}, ${item.sortOrder}, ${item.active}, ${item.active ? 'active' : 'inactive'}, now())`;
      }
      for (const item of next.certifications) {
        await sql`INSERT INTO cms_vehicle_certifications (certification_id, chassis_id, name, description, image_url, sort_order, active, status, updated_at) VALUES (${item.id}, ${item.chassisId}, ${item.name}, ${item.description}, ${item.imageUrl ?? ''}, ${item.sortOrder}, ${item.active}, ${item.active ? 'active' : 'inactive'}, now())`;
      }
      for (const item of next.wheelbases) {
        await sql`INSERT INTO cms_vehicle_wheelbases (wheelbase_id, chassis_id, name, description, certification_scope, image_url, sort_order, active, status, updated_at) VALUES (${item.id}, ${item.chassisId}, ${item.name}, ${item.description}, ${item.certificationScope}, ${item.imageUrl ?? ''}, ${item.sortOrder}, ${item.active}, ${item.active ? 'active' : 'inactive'}, now())`;
      }
      for (const item of next.busTypes) {
        await sql`INSERT INTO cms_vehicle_bus_types (bus_type_id, name, description, image_url, sort_order, active, status, updated_at) VALUES (${item.id}, ${item.name}, ${item.description}, ${item.imageUrl ?? ''}, ${item.sortOrder}, ${item.active}, ${item.active ? 'active' : 'inactive'}, now())`;
      }
      for (const item of next.compatibility) {
        const id = `${item.chassisId}-${item.wheelbaseId}-${item.busTypeId}`;
        await sql`INSERT INTO cms_vehicle_compatibility (id, chassis_id, wheelbase_id, bus_type_id, active, updated_at) VALUES (${id}, ${item.chassisId}, ${item.wheelbaseId}, ${item.busTypeId}, true, now())`;
      }
      for (const item of next.vehicleContractRules) {
        await sql`INSERT INTO cms_vehicle_contract_rules (id, contract_id, chassis_id, certification_id, wheelbase_id, bus_type_id, allowed, required, active, notes, updated_at) VALUES (${item.id}, ${item.contractId}, ${item.chassisId}, ${item.certificationId}, ${item.wheelbaseId}, ${item.busTypeId}, ${item.allowed}, ${item.required}, ${item.active}, ${item.notes}, now())`;
      }

      return res.status(200).json({ ok: true, source: 'neon', ...next, counts: { chassis: next.chassis.length, certifications: next.certifications.length, wheelbases: next.wheelbases.length, busTypes: next.busTypes.length, compatibility: next.compatibility.length, vehicleContractRules: next.vehicleContractRules.length } });
    } catch (error) {
      return res.status(500).json({ ok: false, error: error instanceof Error ? error.message : 'Unable to save vehicle matrix CMS.' });
    }
  }

  return res.status(405).json({ ok: false, error: 'Method not allowed.' });
}
