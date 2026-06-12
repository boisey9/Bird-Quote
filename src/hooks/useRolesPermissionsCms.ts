import { useEffect, useState } from 'react';

export type RoleRecord = { id: string; name: string; description: string; accessLevel: number; active: boolean; sortOrder: number; notes: string };
export type PermissionRecord = { id: string; name: string; description: string; category: 'rfq' | 'admin' | 'workflow' | 'reporting' | 'system'; active: boolean; sortOrder: number };
export type RolePermissionRecord = { id: string; roleId: string; permissionId: string; allowed: boolean; notes: string };
export type RolesPermissionsCmsData = { roles: RoleRecord[]; permissions: PermissionRecord[]; rolePermissions: RolePermissionRecord[] };
type RolesPermissionsPayload = Partial<RolesPermissionsCmsData> & { ok?: boolean; source?: string; error?: string; counts?: Record<string, number> };

export function seedRolesPermissionsCms(): RolesPermissionsCmsData {
  return {
    roles: [
      { id: 'dealer', name: 'Dealer', description: 'Create RFQ, view own RFQs, track status, and add documents.', accessLevel: 10, active: true, sortOrder: 10, notes: 'External user baseline.' },
      { id: 'internal', name: 'Sales Ops', description: 'Review queue, assign owner, update status, and view documents.', accessLevel: 50, active: true, sortOrder: 20, notes: 'Internal quote workflow user.' },
      { id: 'manager', name: 'Manager', description: 'View pipeline, manage priority, monitor SLA, and approve contract quotes.', accessLevel: 80, active: true, sortOrder: 30, notes: 'Approval and oversight role.' },
      { id: 'admin', name: 'Admin', description: 'Maintain users, roles, configuration, SLA rules, and CMS setup.', accessLevel: 100, active: true, sortOrder: 40, notes: 'Full configuration access.' }
    ],
    permissions: [
      { id: 'rfq.create', name: 'Create RFQ', description: 'Can create a new quote request.', category: 'rfq', active: true, sortOrder: 10 },
      { id: 'rfq.view_own', name: 'View Own RFQs', description: 'Can view quote requests created by the user/dealer.', category: 'rfq', active: true, sortOrder: 20 },
      { id: 'rfq.view_all', name: 'View All RFQs', description: 'Can view all submitted quote requests.', category: 'rfq', active: true, sortOrder: 30 },
      { id: 'rfq.update_status', name: 'Update RFQ Status', description: 'Can update workflow status and queue metadata.', category: 'workflow', active: true, sortOrder: 40 },
      { id: 'rfq.assign_owner', name: 'Assign RFQ Owner', description: 'Can assign an internal owner or queue.', category: 'workflow', active: true, sortOrder: 50 },
      { id: 'rfq.approve_contract', name: 'Approve Contract Quote', description: 'Can approve contract-controlled quote workflow.', category: 'workflow', active: true, sortOrder: 60 },
      { id: 'admin.config.read', name: 'Read Config', description: 'Can view CMS configuration.', category: 'admin', active: true, sortOrder: 70 },
      { id: 'admin.config.write', name: 'Write Config', description: 'Can edit and save CMS configuration.', category: 'admin', active: true, sortOrder: 80 },
      { id: 'reporting.view', name: 'View Reporting', description: 'Can view reporting and SLA dashboards.', category: 'reporting', active: true, sortOrder: 90 }
    ],
    rolePermissions: [
      { id: 'dealer-rfq-create', roleId: 'dealer', permissionId: 'rfq.create', allowed: true, notes: '' },
      { id: 'dealer-rfq-view-own', roleId: 'dealer', permissionId: 'rfq.view_own', allowed: true, notes: '' },
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
    ]
  };
}

async function parseRolesPermissionsResponse(response: Response): Promise<RolesPermissionsPayload> {
  const text = await response.text();
  let payload: RolesPermissionsPayload;
  try { payload = text ? JSON.parse(text) as RolesPermissionsPayload : {}; }
  catch { throw new Error(`Roles/Permissions CMS returned non-JSON (${response.status}). ${text.replace(/\s+/g, ' ').slice(0, 180) || response.statusText}`); }
  if (!response.ok || payload.ok === false) throw new Error(payload.error ?? `Roles/Permissions CMS request failed (${response.status}).`);
  return payload;
}

export function toRolesPermissionsCmsData(payload: RolesPermissionsPayload): RolesPermissionsCmsData {
  const seed = seedRolesPermissionsCms();
  return { roles: payload.roles?.length ? payload.roles : seed.roles, permissions: payload.permissions?.length ? payload.permissions : seed.permissions, rolePermissions: payload.rolePermissions ?? seed.rolePermissions };
}

export function useRolesPermissionsCms() {
  const [data, setData] = useState<RolesPermissionsCmsData>(() => seedRolesPermissionsCms());
  const [loadState, setLoadState] = useState<'loading' | 'neon' | 'fallback' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const payload = await parseRolesPermissionsResponse(await fetch('/api/cms-roles-permissions'));
        if (!mounted) return;
        setData(toRolesPermissionsCmsData(payload));
        setLoadState(payload.source === 'empty-neon' ? 'fallback' : 'neon');
        setError('');
      } catch (err) {
        if (!mounted) return;
        setData(seedRolesPermissionsCms());
        setLoadState('error');
        setError(err instanceof Error ? err.message : 'Unable to load Roles/Permissions CMS.');
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  return { data, loadState, error };
}

export async function saveRolesPermissionsCms(data: RolesPermissionsCmsData) {
  return parseRolesPermissionsResponse(await fetch('/api/cms-roles-permissions', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }));
}
