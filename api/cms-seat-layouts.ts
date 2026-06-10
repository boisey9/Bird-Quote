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

type SeatLayoutZone = {
  id: string;
  layoutId: string;
  zoneType: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  isRequiredClearance: boolean;
  notes?: string;
};

type SeatShell = {
  id: string;
  name: string;
  shellType: string;
  imageKey: string;
  description: string;
  hasRearLift: boolean;
  hasMidDoor: boolean;
  doorPosition: string;
  defaultBlockedZones: SeatLayoutZone[];
  defaultReferenceZones: SeatLayoutZone[];
  isActive: boolean;
};

type SeatLayoutTemplate = {
  id: string;
  title: string;
  description: string;
  shellId?: string;
  maxSeats: number;
  layoutType: string;
  layoutFamily?: string;
  market?: string;
  rearLiftCompatible?: boolean;
  maxWheelchairPositions?: number;
  allowedContractIds?: string[];
  allowedChassisIds?: string[];
  allowedWheelbaseIds?: string[];
  allowedBusTypeIds?: string[];
  contractIds?: string[];
  modelTypes?: string[];
  defaultCapacity?: number;
  defaultWheelchairPositions?: number;
};

type SeatLayoutRow = {
  id: string;
  layoutId: string;
  rowNumber: number;
  rowLabel?: string;
  zone: string;
  leftPositionType: string;
  rightPositionType: string;
  seatCountLeft: number;
  seatCountRight: number;
  allowedSeatStyles: string[];
  xPosition?: number;
  yPosition?: number;
  rowWidth?: number;
  isBlocked?: boolean;
  positionGroup?: string;
  notes?: string;
};

type CmsPayload = {
  shells?: SeatShell[];
  layouts?: SeatLayoutTemplate[];
  rows?: SeatLayoutRow[];
  zones?: SeatLayoutZone[];
};

function getPayload(body: unknown) {
  if (!body) return {} as CmsPayload;
  if (typeof body === 'string') return JSON.parse(body) as CmsPayload;
  return body as CmsPayload;
}

function toJsonb(value: unknown) {
  return JSON.stringify(value ?? []);
}

function normalizeJsonArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function normalizeZones(value: unknown, fallbackLayoutId = ''): SeatLayoutZone[] {
  let source = value;
  if (typeof value === 'string') {
    try { source = JSON.parse(value); } catch { source = []; }
  }
  if (!Array.isArray(source)) return [];
  return source.map((zone, index) => {
    const record = zone as Record<string, unknown>;
    return {
      id: String(record.id ?? `${fallbackLayoutId}-zone-${index}`),
      layoutId: String(record.layoutId ?? record.layout_id ?? fallbackLayoutId),
      zoneType: String(record.zoneType ?? record.zone_type ?? record.type ?? 'blocked'),
      label: String(record.label ?? ''),
      x: Number(record.x ?? 0),
      y: Number(record.y ?? 0),
      w: Number(record.w ?? 0),
      h: Number(record.h ?? 0),
      isRequiredClearance: Boolean(record.isRequiredClearance ?? record.is_required_clearance ?? false),
      notes: String(record.notes ?? '')
    };
  });
}

function mapShell(row: Record<string, unknown>): SeatShell {
  return {
    id: String(row.id),
    name: String(row.name ?? ''),
    shellType: String(row.shell_type ?? 'standard'),
    imageKey: String(row.image_key ?? 'shellStd'),
    description: String(row.description ?? ''),
    hasRearLift: Boolean(row.has_rear_lift),
    hasMidDoor: Boolean(row.has_mid_door),
    doorPosition: String(row.door_position ?? 'front'),
    defaultBlockedZones: normalizeZones(row.default_blocked_zones),
    defaultReferenceZones: normalizeZones(row.default_reference_zones),
    isActive: Boolean(row.is_active ?? true)
  };
}

function mapLayout(row: Record<string, unknown>): SeatLayoutTemplate {
  return {
    id: String(row.id),
    title: String(row.title ?? ''),
    description: String(row.description ?? ''),
    shellId: String(row.shell_id ?? 'shell-standard'),
    maxSeats: Number(row.max_seats ?? 0),
    layoutType: String(row.layout_type ?? 'front_facing'),
    layoutFamily: String(row.layout_family ?? row.layout_type ?? 'front_facing'),
    market: String(row.market ?? 'any'),
    rearLiftCompatible: Boolean(row.rear_lift_compatible),
    maxWheelchairPositions: Number(row.max_wheelchair_positions ?? 0),
    allowedContractIds: normalizeJsonArray(row.allowed_contract_ids),
    allowedChassisIds: normalizeJsonArray(row.allowed_chassis_ids),
    allowedWheelbaseIds: normalizeJsonArray(row.allowed_wheelbase_ids),
    allowedBusTypeIds: normalizeJsonArray(row.allowed_bus_type_ids),
    contractIds: normalizeJsonArray(row.contract_ids),
    modelTypes: normalizeJsonArray(row.model_types),
    defaultCapacity: Number(row.default_capacity ?? row.max_seats ?? 0),
    defaultWheelchairPositions: Number(row.default_wheelchair_positions ?? 0)
  };
}

function mapSeatRow(row: Record<string, unknown>): SeatLayoutRow {
  return {
    id: String(row.id),
    layoutId: String(row.layout_id),
    rowNumber: Number(row.row_number ?? 0),
    rowLabel: String(row.row_label ?? ''),
    zone: String(row.zone ?? 'mid'),
    leftPositionType: String(row.left_position_type ?? 'passenger-seat'),
    rightPositionType: String(row.right_position_type ?? 'passenger-seat'),
    seatCountLeft: Number(row.seat_count_left ?? 0),
    seatCountRight: Number(row.seat_count_right ?? 0),
    allowedSeatStyles: normalizeJsonArray(row.allowed_seat_styles),
    xPosition: Number(row.x_position ?? 0),
    yPosition: Number(row.y_position ?? 0),
    rowWidth: Number(row.row_width ?? 100),
    isBlocked: Boolean(row.is_blocked ?? false),
    positionGroup: String(row.position_group ?? 'main'),
    notes: String(row.notes ?? '')
  };
}

function mapZone(row: Record<string, unknown>): SeatLayoutZone {
  return {
    id: String(row.id),
    layoutId: String(row.layout_id),
    zoneType: String(row.zone_type ?? 'blocked'),
    label: String(row.label ?? ''),
    x: Number(row.x ?? 0),
    y: Number(row.y ?? 0),
    w: Number(row.w ?? 0),
    h: Number(row.h ?? 0),
    isRequiredClearance: Boolean(row.is_required_clearance ?? false),
    notes: String(row.notes ?? '')
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).json({ ok: true });
  if (!process.env.DATABASE_URL) return res.status(500).json({ ok: false, error: 'DATABASE_URL is not configured.' });

  const sql = neon(process.env.DATABASE_URL);

  if (req.method === 'GET') {
    try {
      const shellRows = await sql`SELECT id, name, shell_type, image_key, description, has_rear_lift, has_mid_door, door_position, default_blocked_zones, default_reference_zones, is_active FROM cms_seat_shells WHERE is_active = true ORDER BY name`;
      const layoutRows = await sql`SELECT id, title, description, shell_id, max_seats, layout_type, layout_family, market, rear_lift_compatible, max_wheelchair_positions, contract_ids, model_types, allowed_chassis_ids, allowed_wheelbase_ids, allowed_bus_type_ids, allowed_contract_ids, default_capacity, default_wheelchair_positions FROM cms_seat_layout_templates WHERE is_active = true ORDER BY title`;
      const seatRows = await sql`SELECT id, layout_id, row_number, zone, left_position_type, right_position_type, seat_count_left, seat_count_right, allowed_seat_styles, notes, x_position, y_position, row_width, row_label, is_blocked, position_group FROM cms_seat_layout_rows ORDER BY layout_id, row_number`;
      const zoneRows = await sql`SELECT id, layout_id, zone_type, label, x, y, w, h, is_required_clearance, notes FROM cms_seat_layout_zones ORDER BY layout_id, zone_type, label`;

      return res.status(200).json({
        ok: true,
        source: 'neon',
        shells: shellRows.map((row) => mapShell(row as Record<string, unknown>)),
        layouts: layoutRows.map((row) => mapLayout(row as Record<string, unknown>)),
        rows: seatRows.map((row) => mapSeatRow(row as Record<string, unknown>)),
        zones: zoneRows.map((row) => mapZone(row as Record<string, unknown>))
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ ok: false, error: message });
    }
  }

  if (req.method === 'PUT') {
    try {
      const payload = getPayload(req.body);
      const shells = payload.shells ?? [];
      const layouts = payload.layouts ?? [];
      const rows = payload.rows ?? [];
      const zones = payload.zones ?? [];

      for (const shell of shells) {
        await sql`INSERT INTO cms_seat_shells (id, name, shell_type, image_key, description, has_rear_lift, has_mid_door, door_position, default_blocked_zones, default_reference_zones, is_active, updated_at) VALUES (${shell.id}, ${shell.name}, ${shell.shellType}, ${shell.imageKey}, ${shell.description}, ${shell.hasRearLift}, ${shell.hasMidDoor}, ${shell.doorPosition}, ${toJsonb(shell.defaultBlockedZones)}::jsonb, ${toJsonb(shell.defaultReferenceZones)}::jsonb, ${shell.isActive}, now()) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, shell_type = EXCLUDED.shell_type, image_key = EXCLUDED.image_key, description = EXCLUDED.description, has_rear_lift = EXCLUDED.has_rear_lift, has_mid_door = EXCLUDED.has_mid_door, door_position = EXCLUDED.door_position, default_blocked_zones = EXCLUDED.default_blocked_zones, default_reference_zones = EXCLUDED.default_reference_zones, is_active = EXCLUDED.is_active, updated_at = now()`;
      }

      for (const layout of layouts) {
        await sql`INSERT INTO cms_seat_layout_templates (id, title, description, shell_id, max_seats, layout_type, layout_family, market, rear_lift_compatible, max_wheelchair_positions, contract_ids, model_types, allowed_chassis_ids, allowed_wheelbase_ids, allowed_bus_type_ids, allowed_contract_ids, default_capacity, default_wheelchair_positions, is_active, updated_at) VALUES (${layout.id}, ${layout.title}, ${layout.description}, ${layout.shellId ?? 'shell-standard'}, ${layout.maxSeats}, ${layout.layoutType}, ${layout.layoutFamily ?? layout.layoutType}, ${layout.market ?? 'any'}, ${Boolean(layout.rearLiftCompatible)}, ${Number(layout.maxWheelchairPositions ?? 0)}, ${toJsonb(layout.contractIds)}, ${toJsonb(layout.modelTypes)}, ${toJsonb(layout.allowedChassisIds)}, ${toJsonb(layout.allowedWheelbaseIds)}, ${toJsonb(layout.allowedBusTypeIds)}, ${toJsonb(layout.allowedContractIds)}, ${Number(layout.defaultCapacity ?? layout.maxSeats)}, ${Number(layout.defaultWheelchairPositions ?? 0)}, true, now()) ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, shell_id = EXCLUDED.shell_id, max_seats = EXCLUDED.max_seats, layout_type = EXCLUDED.layout_type, layout_family = EXCLUDED.layout_family, market = EXCLUDED.market, rear_lift_compatible = EXCLUDED.rear_lift_compatible, max_wheelchair_positions = EXCLUDED.max_wheelchair_positions, contract_ids = EXCLUDED.contract_ids, model_types = EXCLUDED.model_types, allowed_chassis_ids = EXCLUDED.allowed_chassis_ids, allowed_wheelbase_ids = EXCLUDED.allowed_wheelbase_ids, allowed_bus_type_ids = EXCLUDED.allowed_bus_type_ids, allowed_contract_ids = EXCLUDED.allowed_contract_ids, default_capacity = EXCLUDED.default_capacity, default_wheelchair_positions = EXCLUDED.default_wheelchair_positions, is_active = true, updated_at = now()`;
      }

      const layoutIds = layouts.map((layout) => layout.id);
      if (layoutIds.length > 0) {
        await sql`DELETE FROM cms_seat_layout_rows WHERE layout_id = ANY(${layoutIds})`;
        await sql`DELETE FROM cms_seat_layout_zones WHERE layout_id = ANY(${layoutIds})`;
      }

      for (const row of rows) {
        await sql`INSERT INTO cms_seat_layout_rows (id, layout_id, row_number, zone, left_position_type, right_position_type, seat_count_left, seat_count_right, allowed_seat_styles, notes, x_position, y_position, row_width, row_label, is_blocked, position_group, updated_at) VALUES (${row.id}, ${row.layoutId}, ${row.rowNumber}, ${row.zone}, ${row.leftPositionType}, ${row.rightPositionType}, ${row.seatCountLeft}, ${row.seatCountRight}, ${toJsonb(row.allowedSeatStyles)}, ${row.notes ?? ''}, ${Number(row.xPosition ?? 0)}, ${Number(row.yPosition ?? 0)}, ${Number(row.rowWidth ?? 100)}, ${row.rowLabel ?? ''}, ${Boolean(row.isBlocked)}, ${row.positionGroup ?? 'main'}, now()) ON CONFLICT (id) DO UPDATE SET row_number = EXCLUDED.row_number, zone = EXCLUDED.zone, left_position_type = EXCLUDED.left_position_type, right_position_type = EXCLUDED.right_position_type, seat_count_left = EXCLUDED.seat_count_left, seat_count_right = EXCLUDED.seat_count_right, allowed_seat_styles = EXCLUDED.allowed_seat_styles, notes = EXCLUDED.notes, x_position = EXCLUDED.x_position, y_position = EXCLUDED.y_position, row_width = EXCLUDED.row_width, row_label = EXCLUDED.row_label, is_blocked = EXCLUDED.is_blocked, position_group = EXCLUDED.position_group, updated_at = now()`;
      }

      for (const zone of zones) {
        await sql`INSERT INTO cms_seat_layout_zones (id, layout_id, zone_type, label, x, y, w, h, is_required_clearance, notes, updated_at) VALUES (${zone.id}, ${zone.layoutId}, ${zone.zoneType}, ${zone.label}, ${zone.x}, ${zone.y}, ${zone.w}, ${zone.h}, ${zone.isRequiredClearance}, ${zone.notes ?? ''}, now()) ON CONFLICT (id) DO UPDATE SET zone_type = EXCLUDED.zone_type, label = EXCLUDED.label, x = EXCLUDED.x, y = EXCLUDED.y, w = EXCLUDED.w, h = EXCLUDED.h, is_required_clearance = EXCLUDED.is_required_clearance, notes = EXCLUDED.notes, updated_at = now()`;
      }

      return res.status(200).json({ ok: true, shellCount: shells.length, layoutCount: layouts.length, rowCount: rows.length, zoneCount: zones.length });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ ok: false, error: message });
    }
  }

  return res.status(405).json({ ok: false, error: 'Method not allowed.' });
}
