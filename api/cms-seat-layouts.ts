import { neon } from '@neondatabase/serverless';
import { seatCmsConfig } from '../src/data/featureOptionMatrix';
import type { SeatLayoutRow, SeatLayoutTemplate } from '../src/types/rfq';

type VercelRequest = {
  method?: string;
  body?: unknown;
};

type VercelResponse = {
  status: (code: number) => VercelResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
};

type CmsPayload = {
  layouts?: SeatLayoutTemplate[];
  rows?: SeatLayoutRow[];
};

function getPayload(body: unknown) {
  if (typeof body === 'string') return JSON.parse(body) as CmsPayload;
  return body as CmsPayload;
}

function normalizeJsonArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

function mapLayout(row: Record<string, unknown>): SeatLayoutTemplate {
  return {
    id: String(row.id),
    title: String(row.title ?? ''),
    description: String(row.description ?? ''),
    maxSeats: Number(row.max_seats ?? 0),
    layoutType: String(row.layout_type ?? 'front_facing'),
    market: String(row.market ?? 'any') as SeatLayoutTemplate['market'],
    rearLiftCompatible: Boolean(row.rear_lift_compatible),
    maxWheelchairPositions: Number(row.max_wheelchair_positions ?? 0),
    contractIds: normalizeJsonArray(row.contract_ids),
    modelTypes: normalizeJsonArray(row.model_types)
  };
}

function mapSeatRow(row: Record<string, unknown>): SeatLayoutRow {
  return {
    id: String(row.id),
    layoutId: String(row.layout_id),
    rowNumber: Number(row.row_number ?? 0),
    zone: String(row.zone ?? 'mid') as SeatLayoutRow['zone'],
    leftPositionType: String(row.left_position_type ?? 'passenger-seat') as SeatLayoutRow['leftPositionType'],
    rightPositionType: String(row.right_position_type ?? 'passenger-seat') as SeatLayoutRow['rightPositionType'],
    seatCountLeft: Number(row.seat_count_left ?? 0),
    seatCountRight: Number(row.seat_count_right ?? 0),
    allowedSeatStyles: normalizeJsonArray(row.allowed_seat_styles),
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
      const layoutRows = await sql`
        SELECT id, title, description, max_seats, layout_type, market, rear_lift_compatible, max_wheelchair_positions, contract_ids, model_types
        FROM cms_seat_layout_templates
        WHERE is_active = true
        ORDER BY title
      `;
      const seatRows = await sql`
        SELECT id, layout_id, row_number, zone, left_position_type, right_position_type, seat_count_left, seat_count_right, allowed_seat_styles, notes
        FROM cms_seat_layout_rows
        ORDER BY layout_id, row_number
      `;

      return res.status(200).json({
        ok: true,
        source: 'neon',
        layouts: layoutRows.length ? layoutRows.map((row) => mapLayout(row as Record<string, unknown>)) : seatCmsConfig.layouts,
        rows: seatRows.length ? seatRows.map((row) => mapSeatRow(row as Record<string, unknown>)) : seatCmsConfig.rows
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ ok: false, error: message });
    }
  }

  if (req.method === 'PUT') {
    try {
      const payload = getPayload(req.body);
      const layouts = payload.layouts ?? [];
      const rows = payload.rows ?? [];

      for (const layout of layouts) {
        await sql`
          INSERT INTO cms_seat_layout_templates (
            id, title, description, max_seats, layout_type, market, rear_lift_compatible, max_wheelchair_positions, contract_ids, model_types, is_active, updated_at
          ) VALUES (
            ${layout.id},
            ${layout.title},
            ${layout.description},
            ${layout.maxSeats},
            ${layout.layoutType},
            ${layout.market ?? 'any'},
            ${Boolean(layout.rearLiftCompatible)},
            ${Number(layout.maxWheelchairPositions ?? 0)},
            ${JSON.stringify(layout.contractIds ?? [])}::jsonb,
            ${JSON.stringify(layout.modelTypes ?? [])}::jsonb,
            true,
            now()
          )
          ON CONFLICT (id) DO UPDATE SET
            title = EXCLUDED.title,
            description = EXCLUDED.description,
            max_seats = EXCLUDED.max_seats,
            layout_type = EXCLUDED.layout_type,
            market = EXCLUDED.market,
            rear_lift_compatible = EXCLUDED.rear_lift_compatible,
            max_wheelchair_positions = EXCLUDED.max_wheelchair_positions,
            contract_ids = EXCLUDED.contract_ids,
            model_types = EXCLUDED.model_types,
            is_active = true,
            updated_at = now()
        `;
      }

      const layoutIds = layouts.map((layout) => layout.id);
      if (layoutIds.length > 0) {
        await sql`DELETE FROM cms_seat_layout_rows WHERE layout_id = ANY(${layoutIds})`;
      }

      for (const row of rows) {
        await sql`
          INSERT INTO cms_seat_layout_rows (
            id, layout_id, row_number, zone, left_position_type, right_position_type, seat_count_left, seat_count_right, allowed_seat_styles, notes, updated_at
          ) VALUES (
            ${row.id},
            ${row.layoutId},
            ${row.rowNumber},
            ${row.zone},
            ${row.leftPositionType},
            ${row.rightPositionType},
            ${row.seatCountLeft},
            ${row.seatCountRight},
            ${JSON.stringify(row.allowedSeatStyles ?? [])}::jsonb,
            ${row.notes ?? ''},
            now()
          )
          ON CONFLICT (id) DO UPDATE SET
            row_number = EXCLUDED.row_number,
            zone = EXCLUDED.zone,
            left_position_type = EXCLUDED.left_position_type,
            right_position_type = EXCLUDED.right_position_type,
            seat_count_left = EXCLUDED.seat_count_left,
            seat_count_right = EXCLUDED.seat_count_right,
            allowed_seat_styles = EXCLUDED.allowed_seat_styles,
            notes = EXCLUDED.notes,
            updated_at = now()
        `;
      }

      return res.status(200).json({ ok: true, layoutCount: layouts.length, rowCount: rows.length });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ ok: false, error: message });
    }
  }

  return res.status(405).json({ ok: false, error: 'Method not allowed.' });
}
