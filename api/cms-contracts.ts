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

type ContractWorkflowType = 'standard' | 'contract-controlled';

type ContractProgram = {
  id: string;
  label: string;
  agency: string;
  description: string;
  workflowType: ContractWorkflowType;
  allowedChassisIds: string[];
  allowedWheelbaseIds: string[];
  allowedBusTypeIds: string[];
  allowedSeatLayoutIds: string[];
  requiredDocumentTypes: string[];
  adminNotes: string;
  status: string;
  active: boolean;
  sortOrder: number;
};

type ContractRuleIndex = {
  id: string;
  contractId: string;
  ruleArea: string;
  summary: string;
  active: boolean;
};

type ContractPayload = {
  contractPrograms?: ContractProgram[];
  contractRuleIndex?: ContractRuleIndex[];
};

const seedContracts: ContractProgram[] = [
  {
    id: 'none',
    label: 'No Contract / Standard RFQ',
    agency: 'Standard',
    description: 'Standard dealer RFQ workflow. Vehicle model and seat layout choices follow normal matrix rules.',
    workflowType: 'standard',
    allowedChassisIds: [],
    allowedWheelbaseIds: [],
    allowedBusTypeIds: [],
    allowedSeatLayoutIds: [],
    requiredDocumentTypes: [],
    adminNotes: 'Default V2 workflow.',
    status: 'active',
    active: true,
    sortOrder: 1
  },
  {
    id: 'mndot',
    label: 'MnDOT',
    agency: 'Minnesota DOT',
    description: 'Contract-controlled RFQ. Admin rules control eligible models, wheelbases, seat layouts, and required documents.',
    workflowType: 'contract-controlled',
    allowedChassisIds: ['ford', 'gm'],
    allowedWheelbaseIds: ['ford-158-drw', 'ford-176-drw'],
    allowedBusTypeIds: ['commercial', 'commercial-special-needs', 'assisted-living'],
    allowedSeatLayoutIds: ['front-facing-2x2', 'front-facing-2x1', 'wheelchair-foldaway'],
    requiredDocumentTypes: ['bid', 'floorplan'],
    adminNotes: 'Use contract seating templates and accessibility rules when selected.',
    status: 'active',
    active: true,
    sortOrder: 2
  },
  {
    id: 'cdot',
    label: 'CDOT',
    agency: 'Colorado DOT',
    description: 'Contract-controlled RFQ for CDOT purchasing and quote response rules.',
    workflowType: 'contract-controlled',
    allowedChassisIds: ['ford', 'ford-transit'],
    allowedWheelbaseIds: ['ford-158-drw', 'ford-176-drw', 'transit-156-drw'],
    allowedBusTypeIds: ['commercial', 'hotel', 'airport'],
    allowedSeatLayoutIds: ['front-facing-2x2', 'front-facing-2x1', 'perimeter', 'rear-lounge'],
    requiredDocumentTypes: ['bid'],
    adminNotes: 'CDOT may use commercial shuttle templates and quote timing controls.',
    status: 'active',
    active: true,
    sortOrder: 3
  },
  {
    id: 'modot',
    label: 'MoDOT',
    agency: 'Missouri DOT',
    description: 'Contract-controlled RFQ for MoDOT purchasing requirements.',
    workflowType: 'contract-controlled',
    allowedChassisIds: ['ford', 'gm'],
    allowedWheelbaseIds: [],
    allowedBusTypeIds: ['commercial', 'church', 'commercial-special-needs'],
    allowedSeatLayoutIds: ['front-facing-2x2', 'school-2x2', 'school-3x2', 'wheelchair-foldaway'],
    requiredDocumentTypes: ['bid', 'spec-sheet'],
    adminNotes: 'MoDOT rules should control available model and seat layout templates.',
    status: 'active',
    active: true,
    sortOrder: 4
  }
];

function getPayload(body: unknown) {
  if (!body) return {} as ContractPayload;
  if (typeof body === 'string') return JSON.parse(body) as ContractPayload;
  return body as ContractPayload;
}

function normalizeList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item)).filter(Boolean);
  if (typeof value === 'string') return value.split(',').map((item) => item.trim()).filter(Boolean);
  return [];
}

async function ensureSchema(sql: ReturnType<typeof neon>) {
  await sql`
    CREATE TABLE IF NOT EXISTS cms_contract_programs (
      contract_id text PRIMARY KEY,
      label text NOT NULL,
      agency text NOT NULL DEFAULT '',
      description text NOT NULL DEFAULT '',
      workflow_type text NOT NULL DEFAULT 'standard',
      allowed_chassis_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
      allowed_wheelbase_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
      allowed_bus_type_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
      allowed_seat_layout_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
      required_document_types jsonb NOT NULL DEFAULT '[]'::jsonb,
      admin_notes text NOT NULL DEFAULT '',
      status text NOT NULL DEFAULT 'active',
      active boolean NOT NULL DEFAULT true,
      sort_order integer NOT NULL DEFAULT 100,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS cms_contract_rule_index (
      id text PRIMARY KEY,
      contract_id text NOT NULL REFERENCES cms_contract_programs(contract_id) ON DELETE CASCADE,
      rule_area text NOT NULL DEFAULT 'vehicle',
      summary text NOT NULL DEFAULT '',
      active boolean NOT NULL DEFAULT true,
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `;
}

function mapContract(row: Record<string, unknown>): ContractProgram {
  return {
    id: String(row.contract_id),
    label: String(row.label ?? ''),
    agency: String(row.agency ?? ''),
    description: String(row.description ?? ''),
    workflowType: String(row.workflow_type ?? 'standard') === 'contract-controlled' ? 'contract-controlled' : 'standard',
    allowedChassisIds: normalizeList(row.allowed_chassis_ids),
    allowedWheelbaseIds: normalizeList(row.allowed_wheelbase_ids),
    allowedBusTypeIds: normalizeList(row.allowed_bus_type_ids),
    allowedSeatLayoutIds: normalizeList(row.allowed_seat_layout_ids),
    requiredDocumentTypes: normalizeList(row.required_document_types),
    adminNotes: String(row.admin_notes ?? ''),
    status: String(row.status ?? 'active'),
    active: Boolean(row.active ?? true),
    sortOrder: Number(row.sort_order ?? 100)
  };
}

function mapRule(row: Record<string, unknown>): ContractRuleIndex {
  return {
    id: String(row.id),
    contractId: String(row.contract_id),
    ruleArea: String(row.rule_area ?? 'vehicle'),
    summary: String(row.summary ?? ''),
    active: Boolean(row.active ?? true)
  };
}

function validateContracts(contracts: ContractProgram[]) {
  const ids = new Set<string>();
  for (const contract of contracts) {
    if (!contract.id?.trim()) throw new Error('Every contract requires a contract key.');
    if (!contract.label?.trim()) throw new Error(`Contract ${contract.id} requires a label.`);
    if (ids.has(contract.id)) throw new Error(`Duplicate contract key: ${contract.id}`);
    ids.add(contract.id);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).json({ ok: true });
  if (!process.env.DATABASE_URL) return res.status(500).json({ ok: false, error: 'DATABASE_URL is not configured.' });

  const sql = neon(process.env.DATABASE_URL);

  try {
    await ensureSchema(sql);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to initialize contract CMS tables.';
    return res.status(500).json({ ok: false, error: message });
  }

  if (req.method === 'GET') {
    try {
      const contractRows = await sql`SELECT contract_id, label, agency, description, workflow_type, allowed_chassis_ids, allowed_wheelbase_ids, allowed_bus_type_ids, allowed_seat_layout_ids, required_document_types, admin_notes, status, active, sort_order FROM cms_contract_programs ORDER BY sort_order, label`;
      const ruleRows = await sql`SELECT id, contract_id, rule_area, summary, active FROM cms_contract_rule_index ORDER BY contract_id, rule_area`;

      if (contractRows.length === 0) {
        return res.status(200).json({
          ok: true,
          source: 'empty-neon',
          contractPrograms: seedContracts,
          contractRuleIndex: []
        });
      }

      return res.status(200).json({
        ok: true,
        source: 'neon',
        contractPrograms: contractRows.map((row) => mapContract(row as Record<string, unknown>)),
        contractRuleIndex: ruleRows.map((row) => mapRule(row as Record<string, unknown>))
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ ok: false, error: message });
    }
  }

  if (req.method === 'PUT') {
    try {
      const payload = getPayload(req.body);
      const contracts = payload.contractPrograms ?? [];
      const rules = payload.contractRuleIndex ?? [];
      validateContracts(contracts);

      const contractIds = contracts.map((contract) => contract.id);
      await sql`DELETE FROM cms_contract_rule_index`;
      if (contractIds.length > 0) {
        await sql`DELETE FROM cms_contract_programs WHERE contract_id <> ALL(${contractIds})`;
      } else {
        await sql`DELETE FROM cms_contract_programs`;
      }

      for (const contract of contracts) {
        await sql`
          INSERT INTO cms_contract_programs (contract_id, label, agency, description, workflow_type, allowed_chassis_ids, allowed_wheelbase_ids, allowed_bus_type_ids, allowed_seat_layout_ids, required_document_types, admin_notes, status, active, sort_order, updated_at)
          VALUES (${contract.id}, ${contract.label}, ${contract.agency}, ${contract.description}, ${contract.workflowType}, ${JSON.stringify(contract.allowedChassisIds ?? [])}::jsonb, ${JSON.stringify(contract.allowedWheelbaseIds ?? [])}::jsonb, ${JSON.stringify(contract.allowedBusTypeIds ?? [])}::jsonb, ${JSON.stringify(contract.allowedSeatLayoutIds ?? [])}::jsonb, ${JSON.stringify(contract.requiredDocumentTypes ?? [])}::jsonb, ${contract.adminNotes ?? ''}, ${contract.status ?? 'active'}, ${contract.active ?? true}, ${contract.sortOrder ?? 100}, now())
          ON CONFLICT (contract_id) DO UPDATE SET
            label = EXCLUDED.label,
            agency = EXCLUDED.agency,
            description = EXCLUDED.description,
            workflow_type = EXCLUDED.workflow_type,
            allowed_chassis_ids = EXCLUDED.allowed_chassis_ids,
            allowed_wheelbase_ids = EXCLUDED.allowed_wheelbase_ids,
            allowed_bus_type_ids = EXCLUDED.allowed_bus_type_ids,
            allowed_seat_layout_ids = EXCLUDED.allowed_seat_layout_ids,
            required_document_types = EXCLUDED.required_document_types,
            admin_notes = EXCLUDED.admin_notes,
            status = EXCLUDED.status,
            active = EXCLUDED.active,
            sort_order = EXCLUDED.sort_order,
            updated_at = now()
        `;
      }

      for (const rule of rules) {
        if (!contractIds.includes(rule.contractId)) continue;
        await sql`
          INSERT INTO cms_contract_rule_index (id, contract_id, rule_area, summary, active, updated_at)
          VALUES (${rule.id}, ${rule.contractId}, ${rule.ruleArea}, ${rule.summary}, ${rule.active}, now())
          ON CONFLICT (id) DO UPDATE SET
            contract_id = EXCLUDED.contract_id,
            rule_area = EXCLUDED.rule_area,
            summary = EXCLUDED.summary,
            active = EXCLUDED.active,
            updated_at = now()
        `;
      }

      return res.status(200).json({
        ok: true,
        source: 'neon',
        contractCount: contracts.length,
        ruleCount: rules.length,
        contractPrograms: contracts,
        contractRuleIndex: rules
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save contract CMS.';
      return res.status(500).json({ ok: false, error: message });
    }
  }

  return res.status(405).json({ ok: false, error: 'Method not allowed.' });
}
