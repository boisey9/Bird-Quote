import { useEffect, useMemo, useState } from 'react';
import { Download, Plus, RefreshCw, Save, Trash2 } from 'lucide-react';
import { saveRolesPermissionsCms, seedRolesPermissionsCms, toRolesPermissionsCmsData, type PermissionRecord, type RolePermissionRecord, type RoleRecord, type RolesPermissionsCmsData } from '../../hooks/useRolesPermissionsCms';
import './FeatureOptionsAdminEditor.css';

type RolesPermissionsPayload = Partial<RolesPermissionsCmsData> & { ok?: boolean; source?: string; error?: string; counts?: Record<string, number> };
type EditorTab = 'roles' | 'permissions' | 'assignments';

async function parseRolesPermissionsResponse(response: Response): Promise<RolesPermissionsPayload> {
  const text = await response.text();
  let payload: RolesPermissionsPayload;
  try { payload = text ? JSON.parse(text) as RolesPermissionsPayload : {}; }
  catch { throw new Error(`Roles/Permissions CMS returned non-JSON (${response.status}). ${text.replace(/\s+/g, ' ').slice(0, 180) || response.statusText}`); }
  if (!response.ok || payload.ok === false) throw new Error(payload.error ?? `Roles/Permissions CMS request failed (${response.status}).`);
  return payload;
}

function slug(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9.]+/g, '-').replace(/(^-|-$)/g, ''); }

export function RolesPermissionsAdminEditor() {
  const [data, setData] = useState<RolesPermissionsCmsData>(() => seedRolesPermissionsCms());
  const [activeTab, setActiveTab] = useState<EditorTab>('roles');
  const [status, setStatus] = useState('Loading Roles/Permissions CMS...');

  const activeRoles = useMemo(() => data.roles.filter((item) => item.active), [data.roles]);
  const activePermissions = useMemo(() => data.permissions.filter((item) => item.active), [data.permissions]);

  async function loadData() {
    setStatus('Loading Roles/Permissions CMS...');
    try {
      const payload = await parseRolesPermissionsResponse(await fetch('/api/cms-roles-permissions'));
      setData(toRolesPermissionsCmsData(payload));
      setStatus(payload.source === 'empty-neon' ? 'No saved Roles/Permissions records yet. Showing seed access model; click Save to initialize backend.' : 'Loaded Roles/Permissions CMS from Neon.');
    } catch (error) {
      setData(seedRolesPermissionsCms());
      setStatus(error instanceof Error ? `${error.message} Showing seed access model.` : 'Unable to load Roles/Permissions CMS.');
    }
  }

  useEffect(() => { loadData(); }, []);

  function updateData(updates: Partial<RolesPermissionsCmsData>) { setData((current) => ({ ...current, ...updates })); setStatus('Unsaved roles/permissions changes.'); }

  async function save() {
    setStatus('Saving Roles/Permissions CMS...');
    try {
      const result = await saveRolesPermissionsCms(data);
      setData(toRolesPermissionsCmsData(result));
      setStatus(`Saved. ${result.counts?.roles ?? data.roles.length} role(s), ${result.counts?.permissions ?? data.permissions.length} permission(s), ${result.counts?.rolePermissions ?? data.rolePermissions.length} assignment(s).`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to save Roles/Permissions CMS.');
    }
  }

  function exportJson() { navigator.clipboard?.writeText(JSON.stringify(data, null, 2)); setStatus('Roles/Permissions CMS JSON copied to clipboard.'); }

  function addRole() {
    const name = 'New Role';
    updateData({ roles: [...data.roles, { id: `role-${Date.now()}`, name, description: 'New application role.', accessLevel: 10, active: false, sortOrder: data.roles.length * 10 + 10, notes: '' }] });
  }
  function updateRole(id: string, updates: Partial<RoleRecord>) { updateData({ roles: data.roles.map((item) => item.id === id ? { ...item, ...updates } : item) }); }
  function deleteRole(id: string) { updateData({ roles: data.roles.filter((item) => item.id !== id), rolePermissions: data.rolePermissions.filter((item) => item.roleId !== id) }); }

  function addPermission() {
    const name = 'New Permission';
    updateData({ permissions: [...data.permissions, { id: `permission.${Date.now()}`, name, description: 'New permission.', category: 'system', active: false, sortOrder: data.permissions.length * 10 + 10 }] });
  }
  function updatePermission(id: string, updates: Partial<PermissionRecord>) { updateData({ permissions: data.permissions.map((item) => item.id === id ? { ...item, ...updates } : item) }); }
  function deletePermission(id: string) { updateData({ permissions: data.permissions.filter((item) => item.id !== id), rolePermissions: data.rolePermissions.filter((item) => item.permissionId !== id) }); }

  function addAssignment() {
    const roleId = activeRoles[0]?.id ?? data.roles[0]?.id ?? 'dealer';
    const permissionId = activePermissions[0]?.id ?? data.permissions[0]?.id ?? 'rfq.create';
    updateData({ rolePermissions: [...data.rolePermissions, { id: `${roleId}-${slug(permissionId)}-${Date.now()}`, roleId, permissionId, allowed: true, notes: '' }] });
  }
  function updateAssignment(id: string, updates: Partial<RolePermissionRecord>) { updateData({ rolePermissions: data.rolePermissions.map((item) => item.id === id ? { ...item, ...updates } : item) }); }
  function deleteAssignment(id: string) { updateData({ rolePermissions: data.rolePermissions.filter((item) => item.id !== id) }); }

  return (
    <div className="featureOptionsEditor rolesPermissionsEditor">
      <div className="floorPlanHeader featureEditorHeader">
        <div><small>Access CMS</small><strong>Roles & Permissions</strong><p>Manage application roles, permission definitions, and role-to-permission assignments for the RFQ portal.</p></div>
        <div className="floorPlanAdminActions"><button type="button" className="btn btn-secondary btn-sm" onClick={loadData}><RefreshCw size={14} /> Reload</button><button type="button" className="btn btn-secondary btn-sm" onClick={exportJson}><Download size={14} /> Export JSON</button><button type="button" className="btn btn-primary btn-sm" onClick={save}><Save size={14} /> Save</button></div>
      </div>
      <div className="submitStatus cmsSaveStatus">{status}</div>
      <div className="featureCmsStats"><div className="featureCmsStat"><strong>{data.roles.length}</strong><span>Roles</span></div><div className="featureCmsStat"><strong>{activeRoles.length}</strong><span>Active Roles</span></div><div className="featureCmsStat"><strong>{data.permissions.length}</strong><span>Permissions</span></div><div className="featureCmsStat"><strong>{activePermissions.length}</strong><span>Active Permissions</span></div><div className="featureCmsStat"><strong>{data.rolePermissions.length}</strong><span>Assignments</span></div></div>
      <div className="featureEditorTabs"><button type="button" className={activeTab === 'roles' ? 'active' : ''} onClick={() => setActiveTab('roles')}>Roles</button><button type="button" className={activeTab === 'permissions' ? 'active' : ''} onClick={() => setActiveTab('permissions')}>Permissions</button><button type="button" className={activeTab === 'assignments' ? 'active' : ''} onClick={() => setActiveTab('assignments')}>Assignments</button></div>

      {activeTab === 'roles' && <div className="featureEditorTable rolesTable"><div className="featureEditorTableHeader"><h4>Roles</h4><button type="button" className="btn btn-secondary btn-sm" onClick={addRole}><Plus size={14} /> Add Role</button></div><div className="featureGrid rolesRows head"><span>ID</span><span>Name</span><span>Description</span><span>Access</span><span>Sort</span><span>Active</span><span>Notes</span><span>Action</span></div>{data.roles.map((item) => <div className="featureGrid rolesRows" key={item.id}><input value={item.id} onChange={(event) => updateRole(item.id, { id: event.target.value })} /><input value={item.name} onChange={(event) => updateRole(item.id, { name: event.target.value })} /><input value={item.description} onChange={(event) => updateRole(item.id, { description: event.target.value })} /><input type="number" value={item.accessLevel} onChange={(event) => updateRole(item.id, { accessLevel: Number(event.target.value) })} /><input type="number" value={item.sortOrder} onChange={(event) => updateRole(item.id, { sortOrder: Number(event.target.value) })} /><select value={item.active ? 'yes' : 'no'} onChange={(event) => updateRole(item.id, { active: event.target.value === 'yes' })}><option value="yes">Yes</option><option value="no">No</option></select><input value={item.notes} onChange={(event) => updateRole(item.id, { notes: event.target.value })} /><button type="button" className="iconMiniButton danger" onClick={() => deleteRole(item.id)}><Trash2 size={14} /></button></div>)}</div>}

      {activeTab === 'permissions' && <div className="featureEditorTable permissionsTable"><div className="featureEditorTableHeader"><h4>Permissions</h4><button type="button" className="btn btn-secondary btn-sm" onClick={addPermission}><Plus size={14} /> Add Permission</button></div><div className="featureGrid permissionsRows head"><span>ID</span><span>Name</span><span>Description</span><span>Category</span><span>Sort</span><span>Active</span><span>Action</span></div>{data.permissions.map((item) => <div className="featureGrid permissionsRows" key={item.id}><input value={item.id} onChange={(event) => updatePermission(item.id, { id: event.target.value })} /><input value={item.name} onChange={(event) => updatePermission(item.id, { name: event.target.value })} /><input value={item.description} onChange={(event) => updatePermission(item.id, { description: event.target.value })} /><select value={item.category} onChange={(event) => updatePermission(item.id, { category: event.target.value as PermissionRecord['category'] })}><option value="rfq">RFQ</option><option value="admin">Admin</option><option value="workflow">Workflow</option><option value="reporting">Reporting</option><option value="system">System</option></select><input type="number" value={item.sortOrder} onChange={(event) => updatePermission(item.id, { sortOrder: Number(event.target.value) })} /><select value={item.active ? 'yes' : 'no'} onChange={(event) => updatePermission(item.id, { active: event.target.value === 'yes' })}><option value="yes">Yes</option><option value="no">No</option></select><button type="button" className="iconMiniButton danger" onClick={() => deletePermission(item.id)}><Trash2 size={14} /></button></div>)}</div>}

      {activeTab === 'assignments' && <div className="featureEditorTable assignmentsTable"><div className="featureEditorTableHeader"><h4>Role Permission Assignments</h4><button type="button" className="btn btn-secondary btn-sm" onClick={addAssignment}><Plus size={14} /> Add Assignment</button></div><div className="featureGrid assignmentRows head"><span>ID</span><span>Role</span><span>Permission</span><span>Allowed</span><span>Notes</span><span>Action</span></div>{data.rolePermissions.map((item) => <div className="featureGrid assignmentRows" key={item.id}><input value={item.id} onChange={(event) => updateAssignment(item.id, { id: event.target.value })} /><select value={item.roleId} onChange={(event) => updateAssignment(item.id, { roleId: event.target.value })}>{data.roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select><select value={item.permissionId} onChange={(event) => updateAssignment(item.id, { permissionId: event.target.value })}>{data.permissions.map((permission) => <option key={permission.id} value={permission.id}>{permission.name}</option>)}</select><select value={item.allowed ? 'yes' : 'no'} onChange={(event) => updateAssignment(item.id, { allowed: event.target.value === 'yes' })}><option value="yes">Yes</option><option value="no">No</option></select><input value={item.notes} onChange={(event) => updateAssignment(item.id, { notes: event.target.value })} /><button type="button" className="iconMiniButton danger" onClick={() => deleteAssignment(item.id)}><Trash2 size={14} /></button></div>)}</div>}
    </div>
  );
}
