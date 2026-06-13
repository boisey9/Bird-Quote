import { neon } from '@neondatabase/serverless';

type VercelRequest = { method?: string; body?: unknown };
type VercelResponse = { status: (code: number) => VercelResponse; json: (body: unknown) => void; setHeader: (name: string, value: string) => void };

type VehicleWeightProfile = {
  id: string;
  chassisMake: string;
  chassisModel: string;
  wheelbase: string;
  certification: string;
  busModel: string;
  gvwrLbs: number;
  frontGawrLbs: number;
  rearGawrLbs: number;
  baseCurbWeightLbs: number;
  baseFrontAxleWeightLbs: number;
  baseRearAxleWeightLbs: number;
  remainingConfigurableWeightLbs: number;
  source: 'engineering' | 'sales-estimate' | 'imported' | 'manual';
  effectiveDate: string;
  active: boolean;
  notes: string;
};

type OptionWeightItem = {
  id: string;
  optionCode: string;
  optionName: string;
  category: 'seat' | 'lift' | 'door' | 'hvac' | 'electrical' | 'flooring' | 'storage' | 'accessibility' | 'exterior' | 'custom';
  defaultWeightLbs: number;
  quantityBasis: 'each' | 'per-seat' | 'per-position' | 'per-bus';
  defaultBalanceZoneId: string;
  active: boolean;
  source: string;
  notes: string;
};

type BalanceZone = {
  id: string;
  name: string;
  zoneType: 'front' | 'mid' | 'rear' | 'over-rear-axle' | 'behind-rear-axle';
  frontAxlePercent: number;
  rearAxlePercent: number;
  notes: string;
};

type WeightBalancePayload = { vehicleWeightProfiles?: VehicleWeightProfile[]; optionWeightItems?: OptionWeightItem[]; balanceZones?: BalanceZone[] };

const seedBalanceZones: BalanceZone[] = [
  { id: 'front', name: 'Front Zone', zoneType: 'front', frontAxlePercent: 70, rearAxlePercent: 30, notes: 'Sales estimate only.' },
  { id: 'mid', name: 'Mid Zone', zoneType: 'mid', frontAxlePercent: 45, rearAxlePercent: 55, notes: 'Sales estimate only.' },
  { id: 'rear', name: 'Rear Zone', zoneType: 'rear', frontAxlePercent: 20, rearAxlePercent: 80, notes: 'Sales estimate only.' },
  { id: 'behind-rear-axle', name: 'Behind Rear Axle', zoneType: 'behind-rear-axle', frontAxlePercent: -10, rearAxlePercent: 110, notes: 'High risk zone; engineering review required.' }
];

const seedOptionWeights: OptionWeightItem[] = [
  { id: 'seat-commercial-high-back', optionCode: 'SEAT-HB', optionName: 'Commercial High Back Seat', category: 'seat', defaultWeightLbs: 38, quantityBasis: 'per-seat', defaultBalanceZoneId: 'mid', active: true, source: 'sales-estimate', notes: 'Placeholder estimate.' },
  { id: 'seat-foldaway', optionCode: 'SEAT-FOLD', optionName: 'Foldaway Seat', category: 'seat', defaultWeightLbs: 45, quantityBasis: 'each', defaultBalanceZoneId: 'mid', active: true, source: 'sales-estimate', notes: 'Placeholder estimate.' },
  { id: 'wheelchair-lift', optionCode: 'LIFT-WC', optionName: 'Wheelchair Lift', category: 'lift', defaultWeightLbs: 350, quantityBasis: 'each', defaultBalanceZoneId: 'rear', active: true, source: 'sales-estimate', notes: 'Placeholder estimate.' },
  { id: 'roof-ac', optionCode: 'HVAC-ROOF', optionName: 'Roof A/C', category: 'hvac', defaultWeightLbs: 120, quantityBasis: 'each', defaultBalanceZoneId: 'mid', active: true, source: 'sales-estimate', notes: 'Placeholder estimate.' },
  { id: 'luggage-rack', optionCode: 'LUG-RACK', optionName: 'Luggage Rack', category: 'storage', defaultWeightLbs: 80, quantityBasis: 'per-bus', defaultBalanceZoneId: 'rear', active: true, source: 'sales-estimate', notes: 'Placeholder estimate.' }
];

const seedVehicleProfiles: VehicleWeightProfile[] = [
  { id: 'ford-e450-176-commercial-g5', chassisMake: 'Ford', chassisModel: 'E-450', wheelbase: '176', certification: 'Commercial', busModel: 'G5', gvwrLbs: 14500, frontGawrLbs: 5000, rearGawrLbs: 9600, baseCurbWeightLbs: 0, baseFrontAxleWeightLbs: 0, baseRearAxleWeightLbs: 0, remainingConfigurableWeightLbs: 1250, source: 'sales-estimate', effectiveDate: '', active: true, notes: 'Seed placeholder. Replace with engineering-approved values.' }
];

function getPayload(body: unknown) {
  if (!body) return {} as WeightBalancePayload;
  if (typeof body === 'string') return JSON.parse(body) as WeightBalancePayload;
  return body as WeightBalancePayload;
}

async function ensureSchema(sql: ReturnType<typeof neon>) {
  await sql`CREATE TABLE IF NOT EXISTS vehicle_weight_profiles (id text PRIMARY KEY, chassis_make text NOT NULL, chassis_model text NOT NULL, wheelbase text NOT NULL, certification text NOT NULL, bus_model text NOT NULL, gvwr_lbs integer NOT NULL DEFAULT 0, front_gawr_lbs integer NOT NULL DEFAULT 0, rear_gawr_lbs integer NOT NULL DEFAULT 0, base_curb_weight_lbs integer NOT NULL DEFAULT 0, base_front_axle_weight_lbs integer NOT NULL DEFAULT 0, base_rear_axle_weight_lbs integer NOT NULL DEFAULT 0, remaining_configurable_weight_lbs integer NOT NULL DEFAULT 0, source text NOT NULL DEFAULT 'manual', effective_date text NOT NULL DEFAULT '', active boolean NOT NULL DEFAULT true, notes text NOT NULL DEFAULT '', updated_at timestamptz NOT NULL DEFAULT now())`;
  await sql`CREATE TABLE IF NOT EXISTS option_weight_items (id text PRIMARY KEY, option_code text NOT NULL DEFAULT '', option_name text NOT NULL, category text NOT NULL DEFAULT 'custom', default_weight_lbs integer NOT NULL DEFAULT 0, quantity_basis text NOT NULL DEFAULT 'each', default_balance_zone_id text NOT NULL DEFAULT '', active boolean NOT NULL DEFAULT true, source text NOT NULL DEFAULT '', notes text NOT NULL DEFAULT '', updated_at timestamptz NOT NULL DEFAULT now())`;
  await sql`CREATE TABLE IF NOT EXISTS balance_zones (id text PRIMARY KEY, name text NOT NULL, zone_type text NOT NULL, front_axle_percent integer NOT NULL DEFAULT 0, rear_axle_percent integer NOT NULL DEFAULT 0, notes text NOT NULL DEFAULT '', updated_at timestamptz NOT NULL DEFAULT now())`;
}

function mapVehicle(row: Record<string, unknown>): VehicleWeightProfile { return { id: String(row.id), chassisMake: String(row.chassis_make ?? ''), chassisModel: String(row.chassis_model ?? ''), wheelbase: String(row.wheelbase ?? ''), certification: String(row.certification ?? ''), busModel: String(row.bus_model ?? ''), gvwrLbs: Number(row.gvwr_lbs ?? 0), frontGawrLbs: Number(row.front_gawr_lbs ?? 0), rearGawrLbs: Number(row.rear_gawr_lbs ?? 0), baseCurbWeightLbs: Number(row.base_curb_weight_lbs ?? 0), baseFrontAxleWeightLbs: Number(row.base_front_axle_weight_lbs ?? 0), baseRearAxleWeightLbs: Number(row.base_rear_axle_weight_lbs ?? 0), remainingConfigurableWeightLbs: Number(row.remaining_configurable_weight_lbs ?? 0), source: String(row.source ?? 'manual') as VehicleWeightProfile['source'], effectiveDate: String(row.effective_date ?? ''), active: Boolean(row.active ?? true), notes: String(row.notes ?? '') }; }
function mapOption(row: Record<string, unknown>): OptionWeightItem { return { id: String(row.id), optionCode: String(row.option_code ?? ''), optionName: String(row.option_name ?? ''), category: String(row.category ?? 'custom') as OptionWeightItem['category'], defaultWeightLbs: Number(row.default_weight_lbs ?? 0), quantityBasis: String(row.quantity_basis ?? 'each') as OptionWeightItem['quantityBasis'], defaultBalanceZoneId: String(row.default_balance_zone_id ?? ''), active: Boolean(row.active ?? true), source: String(row.source ?? ''), notes: String(row.notes ?? '') }; }
function mapZone(row: Record<string, unknown>): BalanceZone { return { id: String(row.id), name: String(row.name ?? ''), zoneType: String(row.zone_type ?? 'mid') as BalanceZone['zoneType'], frontAxlePercent: Number(row.front_axle_percent ?? 0), rearAxlePercent: Number(row.rear_axle_percent ?? 0), notes: String(row.notes ?? '') }; }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).json({ ok: true });
  if (!process.env.DATABASE_URL) return res.status(500).json({ ok: false, error: 'DATABASE_URL is not configured.', source: 'seed-fallback', vehicleWeightProfiles: seedVehicleProfiles, optionWeightItems: seedOptionWeights, balanceZones: seedBalanceZones });
  const sql = neon(process.env.DATABASE_URL);
  try { await ensureSchema(sql); } catch (error) { return res.status(500).json({ ok: false, error: error instanceof Error ? error.message : 'Unable to initialize weight tables.' }); }
  if (req.method === 'GET') {
    const vehicles = await sql`SELECT * FROM vehicle_weight_profiles ORDER BY chassis_make, chassis_model, wheelbase`;
    const options = await sql`SELECT * FROM option_weight_items ORDER BY category, option_name`;
    const zones = await sql`SELECT * FROM balance_zones ORDER BY name`;
    return res.status(200).json({ ok: true, source: vehicles.length || options.length || zones.length ? 'neon' : 'empty-neon', vehicleWeightProfiles: vehicles.length ? vehicles.map((row) => mapVehicle(row as Record<string, unknown>)) : seedVehicleProfiles, optionWeightItems: options.length ? options.map((row) => mapOption(row as Record<string, unknown>)) : seedOptionWeights, balanceZones: zones.length ? zones.map((row) => mapZone(row as Record<string, unknown>)) : seedBalanceZones });
  }
  if (req.method === 'PUT') {
    const payload = getPayload(req.body);
    const vehicles = payload.vehicleWeightProfiles ?? [];
    const options = payload.optionWeightItems ?? [];
    const zones = payload.balanceZones ?? [];
    await sql`DELETE FROM vehicle_weight_profiles`; await sql`DELETE FROM option_weight_items`; await sql`DELETE FROM balance_zones`;
    for (const item of vehicles) await sql`INSERT INTO vehicle_weight_profiles (id, chassis_make, chassis_model, wheelbase, certification, bus_model, gvwr_lbs, front_gawr_lbs, rear_gawr_lbs, base_curb_weight_lbs, base_front_axle_weight_lbs, base_rear_axle_weight_lbs, remaining_configurable_weight_lbs, source, effective_date, active, notes, updated_at) VALUES (${item.id}, ${item.chassisMake}, ${item.chassisModel}, ${item.wheelbase}, ${item.certification}, ${item.busModel}, ${item.gvwrLbs}, ${item.frontGawrLbs}, ${item.rearGawrLbs}, ${item.baseCurbWeightLbs}, ${item.baseFrontAxleWeightLbs}, ${item.baseRearAxleWeightLbs}, ${item.remainingConfigurableWeightLbs}, ${item.source}, ${item.effectiveDate}, ${item.active}, ${item.notes}, now())`;
    for (const item of options) await sql`INSERT INTO option_weight_items (id, option_code, option_name, category, default_weight_lbs, quantity_basis, default_balance_zone_id, active, source, notes, updated_at) VALUES (${item.id}, ${item.optionCode}, ${item.optionName}, ${item.category}, ${item.defaultWeightLbs}, ${item.quantityBasis}, ${item.defaultBalanceZoneId}, ${item.active}, ${item.source}, ${item.notes}, now())`;
    for (const item of zones) await sql`INSERT INTO balance_zones (id, name, zone_type, front_axle_percent, rear_axle_percent, notes, updated_at) VALUES (${item.id}, ${item.name}, ${item.zoneType}, ${item.frontAxlePercent}, ${item.rearAxlePercent}, ${item.notes}, now())`;
    return res.status(200).json({ ok: true, source: 'neon', vehicleWeightProfiles: vehicles, optionWeightItems: options, balanceZones: zones, counts: { vehicleWeightProfiles: vehicles.length, optionWeightItems: options.length, balanceZones: zones.length } });
  }
  return res.status(405).json({ ok: false, error: 'Method not allowed.' });
}
