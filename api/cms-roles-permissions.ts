import { neon } from '@neondatabase/serverless';

type VercelRequest = { method?: string; body?: unknown };
type VercelResponse = { status: (code: number) => VercelResponse; json: (body: unknown) => void; setHeader: (name: string, value: string) => void };

type RoleRecord = {
  id: string;
  name: string;
  description: string;
  accessLevel: number;
  active: boolean;
  sortOrder: number;
  notes: string;
};

type PermissionRecord = {
  id: string;
  name: string;
  description: string;
  category: 'rfq' | 'admin' | 'workflow' | 'reporting' | 'system';
  active: boolean;
  sortOrder: number;
};

type RolePermissionRecord = {
  id: string;
  roleId: string;
  permissionId: string;
  allowed: boolean;
  notes: string;
};

type RolesPermissionsPayload = {
  roles?: RoleRecord[];
  permissions?: PermissionRecord[];
  rolePermissions?: RolePermissionRecord[];
};

const seedRoles: RoleRecord[] = [
  { id: 'dealer', name: 'Dealer', description: 'Create RFQ, view own RFQs, track status, and add documents.', accessLevel: 10, active: true, sortOrder: 10, notes: 'External user baseline.' },
  { id: 'internal', name: 'Sales Ops', description: 'Review queue, assign owner, update status, and view documents.', accessLevel: 50, active: true, sortOrder: 20, notes: 'Internal quote workflow user.' },
  { id: 'manager', name: 'Manager', description: 'View pipeline, manage priority, monitor SLA, and approve contract quotes.', accessLevel: 80, active: true, sortOrder: 30, notes: 'Approval and oversight role.' },
  { id: 'admin', name: 'Admin', description: 'Maintain users, roles, configuration, SLA rules, and CMS setup.', accessLevel: 100, active: true, sortOrder: 40, notes: 'Full configuration access.' }
];

const seedPermissions: PermissionRecord[] = [
  { id: 'rfq.create', name: 'Create RFQ', description: 'Can create a new quote request.', category: 'rfq', active: true, sortOrder: 10 },
  { id: 'rfq.view_own', name: 'View Own RFQs', description: 'Can view quote requests created by the user/dealer.', category: 'rfq', active: true, sortOrder: 20 },
  { id: 'rfq.view_all', name: 'View All RFQs', description: 'Can view all submitted quote requests.', category: 'rfq', active: true, sortOrder: 30 },
  { id: 'rfq.update_status', name: 'Update RFQ Status', description: 'Can update workflow status and queue metadata.', category: 'workflow', active: true, sortOrder: 40 },
  { id: 'rfq.assign_owner', name: 'Assign RFQ Owner', description: 'Can assign an internal owner or queue.', category: 'workflow', active: true, sortOrder: 50 },
  { id: 'rfq.approve_contract', name: 'Approve Contract Quote', description: 'Can approve contract-controlled quote workflow.', category: 'workflow', active: true, sortOrder: 60 },
  { id: 'admin.config.read', name: 'Read Config', description: 'Can view CMS configuration.', category: 'admin', active: true, sortOrder: 70 },
  { id: 'admin.config.write', name: 'Write Config', description: 'Can edit and save CMS configuration.', category: 'admin', active: true, sortOrder: 80 },
  { id: 'reporting.view', name: 'View Reporting', description: 'Can view reporting and SLA dashboards.', category: 'reporting', active: true, sortOrder: 90 }
];

const seedRolePermissions: RolePermissionRecord[] = [
  { id: 'dealer-rfq-create', roleId: 'dealer', permissionId: 'rfq.create', allowed: true, notes: '' },
  { id: 'dealer-rfq-view-own', roleId: 'dealer', permissionId: 'rfq.view_own', allowed: true, notes: '' },
  { id: 'internal-rfq-create', roleId: 'internal', permissionId: 'rfq.create', allowed: true, notes: '' },
  { id: 'internal-rfq-view-all', roleId: 'internal', permissionId: 'rfq.view_all', allowed: true, notes: '' },
  { id: 'internal-rfq-update-status', roleId: 'internal', permissionId: 'rfq.update_status', allowed: true, notes: '' },
  { id: 'internal-rfq-assign-owner', roleId: 'internal', permissionId: 'rfq.assign_owner', allowed: true, notes: '' },
  { id: 'manager-rfq-view-all', roleId: 'manager', permissionId: 'rfq.view_all', allowed: true, notes: '' },
  { id: 'manager-rfq-approve-contract', roleId: 'manager', permissionId: 'rfq.approve_contract', allowed: true, notes: '' },
  { id: 'manager-reporting-view', roleId: 'manager', permissionId: 'reporting.view', allowed: true, notes: '' },
  { id: 'admin-config-read', roleId: 'admin', permissionId: 'admin.config.read', allowed: true, notes: '' },
  { id: 'admin-config-write', roleId: 'admin', permissionId: 'admin.config.write', allowed: true, notes: '' },
  { id: 'admin-all-rfqs', roleId: 'admin', permissionId: 'rfq.view_all', allowed: true, notes: '' },
  { id: 'admin-reporting-view', roleId: 'admin', permissionId: 'reporting.view', allowed: true, notes: '' }
];

function getPayload(body: unknown) {
  if (!body) return {} as RolesPermissionsPayload;
  if (typeof body === 'string') return JSON.parse(body) as RolesPermissionsPayload;
  return body as RolesPermissionsPayload;
}

function jsonError(res: VercelResponse, status: number, message: string, extra: Record<string, unknown> = {}) {
  return res.status(status).json({ ok: false, error: message, ...extra });
}

async function ensureSchema(sql: ReturnType<typeof neon>) {
  await sql`CREATE TABLE IF NOT EXISTS cms_roles (id text PRIMARY KEY, name text NOT NULL, description text NOT NULL DEFAULT '', access_level integer NOT NULL DEFAULT 10, active boolean NOT NULL DEFAULT true, sort_order integer NOT NULL DEFAULT 100, notes text NOT NULL DEFAULT '', updated_at timestamptz NOT NULL DEFAULT now())`;
  await sql`CREATE TABLE IF NOT EXISTS cms_permissions (id text PRIMARY KEY, name text NOT NULL, description text NOT NULL DEFAULT '', category text NOT NULL DEFAULT 'system', active boolean NOT NULL DEFAULT true, sort_order integer NOT NULL DEFAULT 100, updated_at timestamptz NOT NULL DEFAULT now())`;
  await sql`CREATE TABLE IF NOT EXISTS cms_role_permissions (id text PRIMARY KEY, role_id text NOT NULL, permission_id text NOT NULL, allowed boolean NOT NULL DEFAULT true, notes text NOT NULL DEFAULT '', updated_at timestamptz NOT NULL DEFAULT now())`;
}

function mapRole(row: Record<string, unknown>): RoleRecord {
  return { id: String(row.id), name: String(row.name ?? ''), description: String(row.description ?? ''), accessLevel: Number(row.access_level ?? 10), active: Boolean(row.active ?? true), sortOrder: Number(row.sort_order ?? 100), notes: String(row.notes ?? '') };
}

function mapPermission(row: Record<string, unknown>): PermissionRecord {
  return { id: String(row.id), name: String(row.name ?? ''), description: String(row.description ?? ''), category: String(row.category ?? 'system') as PermissionRecord['category'], active: Boolean(row.active ?? true), sortOrder: Number(row.sort_order ?? 100) };
}

function mapRolePermission(row: Record<string, unknown>): RolePermissionRecord {
  return { id: String(row.id), roleId: String(row.role_id), permissionId: String(row.permission_id), allowed: Boolean(row.allowed ?? true), notes: String(row.notes ?? '') };
}

function validate(next: Required<RolesPermissionsPayload>) {
  for (const role of next.roles) if (!role.id || !role.name) throw new Error('Every role requires id and name.');
  for (const permission of next.permissions) if (!permission.id || !permission.name) throw new Error('Every permission requires id and name.');
  for (const assignment of next.rolePermissions) if (!assignment.id || !assignment.roleId || !assignment.permissionId) throw new Error('Every role permission assignment requires id, role, and permission.');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).json({ ok: true });
  if (!process.env.DATABASE_URL) return jsonError(res, 500, 'DATABASE_URL is not configured.', { source: 'seed-fallback', roles: seedRoles, permissions: seedPermissions, rolePermissions: seedRolePermissions });

  try {
    const sql = neon(process.env.DATABASE_URL);
    try {
      await ensureSchema(sql);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to initialize roles/permissions schema.';
      if (req.method === 'GET') return res.status(200).json({ ok: true, source: 'schema-fallback', warning: message, roles: seedRoles, permissions: seedPermissions, rolePermissions: seedRolePermissions });
      return jsonError(res, 500, message);
    }

    if (req.method === 'GET') {
      const roleRows = await sql`SELECT id, name, description, access_level, active, sort_order, notes FROM cms_roles ORDER BY sort_order, name`;
      const permissionRows = await sql`SELECT id, name, description, category, active, sort_order FROM cms_permissions ORDER BY category, sort_order, name`;
      const assignmentRows = await sql`SELECT id, role_id, permission_id, allowed, notes FROM cms_role_permissions ORDER BY role_id, permission_id`;
      if (roleRows.length === 0 && permissionRows.length === 0) return res.status(200).json({ ok: true, source: 'empty-neon', roles: seedRoles, permissions: seedPermissions, rolePermissions: seedRolePermissions });
      return res.status(200).json({ ok: true, source: 'neon', roles: roleRows.map((row) => mapRole(row as Record<string, unknown>)), permissions: permissionRows.map((row) => mapPermission(row as Record<string, unknown>)), rolePermissions: assignmentRows.map((row) => mapRolePermission(row as Record<string, unknown>)) });
    }

    if (req.method === 'PUT') {
      const payload = getPayload(req.body);
      const next = { roles: payload.roles ?? [], permissions: payload.permissions ?? [], rolePermissions: payload.rolePermissions ?? [] };
      validate(next);
      await sql`DELETE FROM cms_role_permissions`;
      await sql`DELETE FROM cms_permissions`;
      await sql`DELETE FROM cms_roles`;
      for (const item of next.roles) await sql`INSERT INTO cms_roles (id, name, description, access_level, active, sort_order, notes, updated_at) VALUES (${item.id}, ${item.name}, ${item.description}, ${item.accessLevel}, ${item.active}, ${item.sortOrder}, ${item.notes}, now())`;
      for (const item of next.permissions) await sql`INSERT INTO cms_permissions (id, name, description, category, active, sort_order, updated_at) VALUES (${item.id}, ${item.name}, ${item.description}, ${item.category}, ${item.active}, ${item.sortOrder}, now())`;
      for (const item of next.rolePermissions) await sql`INSERT INTO cms_role_permissions (id, role_id, permission_id, allowed, notes, updated_at) VALUES (${item.id}, ${item.roleId}, ${item.permissionId}, ${item.allowed}, ${item.notes}, now())`;
      return res.status(200).json({ ok: true, source: 'neon', ...next, counts: { roles: next.roles.length, permissions: next.permissions.length, rolePermissions: next.rolePermissions.length } });
    }

    return jsonError(res, 405, 'Method not allowed.');
  } catch (error) {
    return jsonError(res, 500, error instanceof Error ? error.message : 'Roles/Permissions CMS function failed.');
  }
}
