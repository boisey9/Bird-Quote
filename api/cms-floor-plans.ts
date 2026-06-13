import { neon } from '@neondatabase/serverless';

type VercelRequest = { method?: string; body?: unknown };
type VercelResponse = { status: (code: number) => VercelResponse; json: (body: unknown) => void; setHeader: (name: string, value: string) => void };

type FloorPlanMaster = { floorPlanId: string; floorPlanName: string; market: string; shellType: string; entranceType: string; liftType: string; rowCount: number; status: string; dealerVisible: boolean; capacityHint: number; wheelchairCapacityHint: number; notes: string };
type FloorPlanZone = { floorPlanId: string; zoneId: string; side: string; rowStart: number; rowEnd: number; zoneType: string; seatTypeId?: string; label: string; locked: boolean; passengerCapacity?: number; wheelchairCapacity?: number; seatPositionsConsumed?: number; countsAsPassenger?: boolean; canConvertToWheelchair?: boolean; requiresFoldawaySeats?: boolean; notes?: string };
type FloorPlanSeatType = { seatTypeId: string; seatTypeName: string; category: string; colorToken: string; defaultWidth: number; defaultRowSpan: number };
type FloorPlanCompatibilityRule = { floorPlanId: string; contractId: string; chassis: string; wheelbase: string; certification: string; busType: string; allowed: boolean };
type FloorPlanPayload = { floorPlanMaster?: FloorPlanMaster[]; floorPlanZones?: FloorPlanZone[]; floorPlanSeatTypes?: FloorPlanSeatType[]; floorPlanCompatibilityRules?: FloorPlanCompatibilityRule[] };

function getPayload(body: unknown) { if (!body) return {} as FloorPlanPayload; if (typeof body === 'string') return JSON.parse(body) as FloorPlanPayload; return body as FloorPlanPayload; }

async function ensureSchema(sql: ReturnType<typeof neon>) {
  await sql`CREATE TABLE IF NOT EXISTS cms_floor_plan_master (floor_plan_id text PRIMARY KEY, floor_plan_name text NOT NULL, market text NOT NULL DEFAULT 'any', shell_type text NOT NULL DEFAULT 'standard', entrance_type text NOT NULL DEFAULT 'front', lift_type text NOT NULL DEFAULT 'none', row_count integer NOT NULL DEFAULT 8, status text NOT NULL DEFAULT 'draft', dealer_visible boolean NOT NULL DEFAULT false, capacity_hint integer NOT NULL DEFAULT 0, wheelchair_capacity_hint integer NOT NULL DEFAULT 0, notes text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now())`;
  await sql`CREATE TABLE IF NOT EXISTS cms_floor_plan_zones (zone_id text PRIMARY KEY, floor_plan_id text NOT NULL REFERENCES cms_floor_plan_master(floor_plan_id) ON DELETE CASCADE, side text NOT NULL DEFAULT 'curb', row_start integer NOT NULL DEFAULT 1, row_end integer NOT NULL DEFAULT 1, zone_type text NOT NULL DEFAULT 'seat', seat_type_id text, label text NOT NULL DEFAULT '', locked boolean NOT NULL DEFAULT false, passenger_capacity integer NOT NULL DEFAULT 0, wheelchair_capacity integer NOT NULL DEFAULT 0, seat_positions_consumed integer NOT NULL DEFAULT 0, counts_as_passenger boolean NOT NULL DEFAULT false, can_convert_to_wheelchair boolean NOT NULL DEFAULT false, requires_foldaway_seats boolean NOT NULL DEFAULT false, notes text NOT NULL DEFAULT '', updated_at timestamptz NOT NULL DEFAULT now())`;
  await sql`ALTER TABLE cms_floor_plan_zones ADD COLUMN IF NOT EXISTS passenger_capacity integer NOT NULL DEFAULT 0`;
  await sql`ALTER TABLE cms_floor_plan_zones ADD COLUMN IF NOT EXISTS wheelchair_capacity integer NOT NULL DEFAULT 0`;
  await sql`ALTER TABLE cms_floor_plan_zones ADD COLUMN IF NOT EXISTS seat_positions_consumed integer NOT NULL DEFAULT 0`;
  await sql`ALTER TABLE cms_floor_plan_zones ADD COLUMN IF NOT EXISTS counts_as_passenger boolean NOT NULL DEFAULT false`;
  await sql`ALTER TABLE cms_floor_plan_zones ADD COLUMN IF NOT EXISTS can_convert_to_wheelchair boolean NOT NULL DEFAULT false`;
  await sql`ALTER TABLE cms_floor_plan_zones ADD COLUMN IF NOT EXISTS requires_foldaway_seats boolean NOT NULL DEFAULT false`;
  await sql`CREATE TABLE IF NOT EXISTS cms_floor_plan_seat_types (seat_type_id text PRIMARY KEY, seat_type_name text NOT NULL, category text NOT NULL DEFAULT 'passenger', color_token text NOT NULL DEFAULT 'blue', default_width integer NOT NULL DEFAULT 1, default_row_span integer NOT NULL DEFAULT 1, updated_at timestamptz NOT NULL DEFAULT now())`;
  await sql`CREATE TABLE IF NOT EXISTS cms_floor_plan_compatibility_rules (id bigserial PRIMARY KEY, floor_plan_id text NOT NULL REFERENCES cms_floor_plan_master(floor_plan_id) ON DELETE CASCADE, contract_id text NOT NULL DEFAULT 'none', chassis text NOT NULL DEFAULT 'any', wheelbase text NOT NULL DEFAULT 'any', certification text NOT NULL DEFAULT 'any', bus_type text NOT NULL DEFAULT 'any', allowed boolean NOT NULL DEFAULT true, updated_at timestamptz NOT NULL DEFAULT now())`;
}

function mapMaster(row: Record<string, unknown>): FloorPlanMaster { return { floorPlanId: String(row.floor_plan_id), floorPlanName: String(row.floor_plan_name ?? ''), market: String(row.market ?? 'any'), shellType: String(row.shell_type ?? 'standard'), entranceType: String(row.entrance_type ?? 'front'), liftType: String(row.lift_type ?? 'none'), rowCount: Number(row.row_count ?? 8), status: String(row.status ?? 'draft'), dealerVisible: Boolean(row.dealer_visible), capacityHint: Number(row.capacity_hint ?? 0), wheelchairCapacityHint: Number(row.wheelchair_capacity_hint ?? 0), notes: String(row.notes ?? '') }; }
function mapZone(row: Record<string, unknown>): FloorPlanZone { return { floorPlanId: String(row.floor_plan_id), zoneId: String(row.zone_id), side: String(row.side ?? 'curb'), rowStart: Number(row.row_start ?? 1), rowEnd: Number(row.row_end ?? 1), zoneType: String(row.zone_type ?? 'seat'), seatTypeId: row.seat_type_id ? String(row.seat_type_id) : undefined, label: String(row.label ?? ''), locked: Boolean(row.locked), passengerCapacity: Number(row.passenger_capacity ?? 0), wheelchairCapacity: Number(row.wheelchair_capacity ?? 0), seatPositionsConsumed: Number(row.seat_positions_consumed ?? 0), countsAsPassenger: Boolean(row.counts_as_passenger), canConvertToWheelchair: Boolean(row.can_convert_to_wheelchair), requiresFoldawaySeats: Boolean(row.requires_foldaway_seats), notes: String(row.notes ?? '') }; }
function mapSeatType(row: Record<string, unknown>): FloorPlanSeatType { return { seatTypeId: String(row.seat_type_id), seatTypeName: String(row.seat_type_name ?? ''), category: String(row.category ?? 'passenger'), colorToken: String(row.color_token ?? 'blue'), defaultWidth: Number(row.default_width ?? 1), defaultRowSpan: Number(row.default_row_span ?? 1) }; }
function mapRule(row: Record<string, unknown>): FloorPlanCompatibilityRule { return { floorPlanId: String(row.floor_plan_id), contractId: String(row.contract_id ?? 'none'), chassis: String(row.chassis ?? 'any'), wheelbase: String(row.wheelbase ?? 'any'), certification: String(row.certification ?? 'any'), busType: String(row.bus_type ?? 'any'), allowed: Boolean(row.allowed ?? true) }; }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).json({ ok: true });
  if (!process.env.DATABASE_URL) return res.status(500).json({ ok: false, error: 'DATABASE_URL is not configured.' });
  const sql = neon(process.env.DATABASE_URL);
  try { await ensureSchema(sql); } catch (error) { return res.status(500).json({ ok: false, error: error instanceof Error ? error.message : 'Unable to initialize floor plan CMS tables.' }); }

  if (req.method === 'GET') {
    try {
      const masterRows = await sql`SELECT floor_plan_id, floor_plan_name, market, shell_type, entrance_type, lift_type, row_count, status, dealer_visible, capacity_hint, wheelchair_capacity_hint, notes FROM cms_floor_plan_master ORDER BY floor_plan_name`;
      const zoneRows = await sql`SELECT floor_plan_id, zone_id, side, row_start, row_end, zone_type, seat_type_id, label, locked, passenger_capacity, wheelchair_capacity, seat_positions_consumed, counts_as_passenger, can_convert_to_wheelchair, requires_foldaway_seats, notes FROM cms_floor_plan_zones ORDER BY floor_plan_id, row_start, side, zone_type`;
      const seatTypeRows = await sql`SELECT seat_type_id, seat_type_name, category, color_token, default_width, default_row_span FROM cms_floor_plan_seat_types ORDER BY seat_type_name`;
      const ruleRows = await sql`SELECT floor_plan_id, contract_id, chassis, wheelbase, certification, bus_type, allowed FROM cms_floor_plan_compatibility_rules ORDER BY floor_plan_id, chassis, wheelbase`;
      return res.status(200).json({ ok: true, source: masterRows.length ? 'neon' : 'empty-neon', floorPlanMaster: masterRows.map((row) => mapMaster(row as Record<string, unknown>)), floorPlanZones: zoneRows.map((row) => mapZone(row as Record<string, unknown>)), floorPlanSeatTypes: seatTypeRows.map((row) => mapSeatType(row as Record<string, unknown>)), floorPlanCompatibilityRules: ruleRows.map((row) => mapRule(row as Record<string, unknown>)) });
    } catch (error) { return res.status(500).json({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }); }
  }

  if (req.method === 'PUT') {
    try {
      const payload = getPayload(req.body); const masters = payload.floorPlanMaster ?? []; const zones = payload.floorPlanZones ?? []; const seatTypes = payload.floorPlanSeatTypes ?? []; const rules = payload.floorPlanCompatibilityRules ?? []; const floorPlanIds = masters.map((plan) => plan.floorPlanId);
      await sql`DELETE FROM cms_floor_plan_compatibility_rules`; await sql`DELETE FROM cms_floor_plan_zones`;
      if (floorPlanIds.length > 0) await sql`DELETE FROM cms_floor_plan_master WHERE floor_plan_id <> ALL(${floorPlanIds})`; else await sql`DELETE FROM cms_floor_plan_master`;
      for (const plan of masters) await sql`INSERT INTO cms_floor_plan_master (floor_plan_id, floor_plan_name, market, shell_type, entrance_type, lift_type, row_count, status, dealer_visible, capacity_hint, wheelchair_capacity_hint, notes, updated_at) VALUES (${plan.floorPlanId}, ${plan.floorPlanName}, ${plan.market}, ${plan.shellType}, ${plan.entranceType}, ${plan.liftType}, ${plan.rowCount}, ${plan.status}, ${plan.dealerVisible}, ${plan.capacityHint}, ${plan.wheelchairCapacityHint}, ${plan.notes}, now()) ON CONFLICT (floor_plan_id) DO UPDATE SET floor_plan_name = EXCLUDED.floor_plan_name, market = EXCLUDED.market, shell_type = EXCLUDED.shell_type, entrance_type = EXCLUDED.entrance_type, lift_type = EXCLUDED.lift_type, row_count = EXCLUDED.row_count, status = EXCLUDED.status, dealer_visible = EXCLUDED.dealer_visible, capacity_hint = EXCLUDED.capacity_hint, wheelchair_capacity_hint = EXCLUDED.wheelchair_capacity_hint, notes = EXCLUDED.notes, updated_at = now()`;
      await sql`DELETE FROM cms_floor_plan_seat_types`;
      for (const seatType of seatTypes) await sql`INSERT INTO cms_floor_plan_seat_types (seat_type_id, seat_type_name, category, color_token, default_width, default_row_span, updated_at) VALUES (${seatType.seatTypeId}, ${seatType.seatTypeName}, ${seatType.category}, ${seatType.colorToken}, ${seatType.defaultWidth}, ${seatType.defaultRowSpan}, now()) ON CONFLICT (seat_type_id) DO UPDATE SET seat_type_name = EXCLUDED.seat_type_name, category = EXCLUDED.category, color_token = EXCLUDED.color_token, default_width = EXCLUDED.default_width, default_row_span = EXCLUDED.default_row_span, updated_at = now()`;
      for (const zone of zones.filter((zone) => floorPlanIds.includes(zone.floorPlanId))) await sql`INSERT INTO cms_floor_plan_zones (zone_id, floor_plan_id, side, row_start, row_end, zone_type, seat_type_id, label, locked, passenger_capacity, wheelchair_capacity, seat_positions_consumed, counts_as_passenger, can_convert_to_wheelchair, requires_foldaway_seats, notes, updated_at) VALUES (${zone.zoneId}, ${zone.floorPlanId}, ${zone.side}, ${zone.rowStart}, ${zone.rowEnd}, ${zone.zoneType}, ${zone.seatTypeId ?? null}, ${zone.label}, ${zone.locked}, ${zone.passengerCapacity ?? 0}, ${zone.wheelchairCapacity ?? 0}, ${zone.seatPositionsConsumed ?? 0}, ${zone.countsAsPassenger ?? false}, ${zone.canConvertToWheelchair ?? false}, ${zone.requiresFoldawaySeats ?? false}, ${zone.notes ?? ''}, now())`;
      for (const rule of rules.filter((rule) => floorPlanIds.includes(rule.floorPlanId))) await sql`INSERT INTO cms_floor_plan_compatibility_rules (floor_plan_id, contract_id, chassis, wheelbase, certification, bus_type, allowed, updated_at) VALUES (${rule.floorPlanId}, ${rule.contractId}, ${rule.chassis}, ${rule.wheelbase}, ${rule.certification}, ${rule.busType}, ${rule.allowed}, now())`;
      return res.status(200).json({ ok: true, source: 'neon', floorPlanCount: masters.length, zoneCount: zones.length, seatTypeCount: seatTypes.length, ruleCount: rules.length });
    } catch (error) { return res.status(500).json({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }); }
  }

  return res.status(405).json({ ok: false, error: 'Method not allowed.' });
}
