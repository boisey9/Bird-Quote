import { useEffect, useState } from 'react';
import { Download, Plus, RefreshCw, Save, Trash2 } from 'lucide-react';
import { saveRoutingSlaCms, seedRoutingSlaCms, toRoutingSlaCmsData, type RoutingRule, type RoutingSlaCmsData, type SlaRule } from '../../hooks/useRoutingSlaCms';
import './FeatureOptionsAdminEditor.css';

type RoutingSlaPayload = Partial<RoutingSlaCmsData> & { ok?: boolean; source?: string; error?: string; counts?: Record<string, number> };
type EditorTab = 'routing' | 'sla';

async function parseRoutingSlaResponse(response: Response): Promise<RoutingSlaPayload> {
  const text = await response.text();
  let payload: RoutingSlaPayload;
  try { payload = text ? JSON.parse(text) as RoutingSlaPayload : {}; }
  catch { throw new Error(`Routing/SLA CMS returned non-JSON (${response.status}). ${text.replace(/\s+/g, ' ').slice(0, 180) || response.statusText}`); }
  if (!response.ok || payload.ok === false) throw new Error(payload.error ?? `Routing/SLA CMS request failed (${response.status}).`);
  return payload;
}

function slug(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function RoutingSlaAdminEditor() {
  const [data, setData] = useState<RoutingSlaCmsData>(() => seedRoutingSlaCms());
  const [activeTab, setActiveTab] = useState<EditorTab>('routing');
  const [status, setStatus] = useState('Loading Routing/SLA CMS...');

  async function loadData() {
    setStatus('Loading Routing/SLA CMS...');
    try {
      const payload = await parseRoutingSlaResponse(await fetch('/api/cms-routing-sla'));
      setData(toRoutingSlaCmsData(payload));
      setStatus(payload.source === 'empty-neon' ? 'No saved Routing/SLA records yet. Showing seed rules; click Save to initialize backend.' : 'Loaded Routing/SLA CMS from Neon.');
    } catch (error) {
      setData(seedRoutingSlaCms());
      setStatus(error instanceof Error ? `${error.message} Showing seed rules.` : 'Unable to load Routing/SLA CMS.');
    }
  }

  useEffect(() => { loadData(); }, []);

  function updateData(updates: Partial<RoutingSlaCmsData>) {
    setData((current) => ({ ...current, ...updates }));
    setStatus('Unsaved routing/SLA changes.');
  }

  async function save() {
    setStatus('Saving Routing/SLA CMS...');
    try {
      const result = await saveRoutingSlaCms(data);
      setData(toRoutingSlaCmsData(result));
      setStatus(`Saved. ${result.counts?.routingRules ?? data.routingRules.length} routing rule(s), ${result.counts?.slaRules ?? data.slaRules.length} SLA rule(s).`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to save Routing/SLA CMS.');
    }
  }

  function exportJson() {
    navigator.clipboard?.writeText(JSON.stringify(data, null, 2));
    setStatus('Routing/SLA CMS JSON copied to clipboard.');
  }

  function addRoutingRule() {
    const name = 'New Routing Rule';
    updateData({ routingRules: [...data.routingRules, { id: `route-${Date.now()}-${slug(name)}`, name, triggerType: 'manual', condition: '', assignedQueue: 'Sales Ops Queue', ownerRole: 'Sales Ops', priority: 'Normal', active: false, sortOrder: data.routingRules.length * 10 + 10, notes: '' }] });
  }

  function updateRoutingRule(id: string, updates: Partial<RoutingRule>) {
    updateData({ routingRules: data.routingRules.map((item) => item.id === id ? { ...item, ...updates } : item) });
  }

  function deleteRoutingRule(id: string) {
    updateData({ routingRules: data.routingRules.filter((item) => item.id !== id) });
  }

  function addSlaRule() {
    const name = 'New SLA Rule';
    updateData({ slaRules: [...data.slaRules, { id: `sla-${Date.now()}-${slug(name)}`, name, appliesTo: 'standard', targetHours: 8, businessHoursOnly: true, escalationHours: 12, ownerRole: 'Sales Ops', active: false, sortOrder: data.slaRules.length * 10 + 10, notes: '' }] });
  }

  function updateSlaRule(id: string, updates: Partial<SlaRule>) {
    updateData({ slaRules: data.slaRules.map((item) => item.id === id ? { ...item, ...updates } : item) });
  }

  function deleteSlaRule(id: string) {
    updateData({ slaRules: data.slaRules.filter((item) => item.id !== id) });
  }

  return (
    <div className="featureOptionsEditor routingSlaEditor">
      <div className="floorPlanHeader featureEditorHeader">
        <div>
          <small>Workflow CMS</small>
          <strong>Routing Rules & SLA Rules</strong>
          <p>Manage RFQ assignment routing, priority, queues, SLA targets, escalation timing, and active workflow rules.</p>
        </div>
        <div className="floorPlanAdminActions">
          <button type="button" className="btn btn-secondary btn-sm" onClick={loadData}><RefreshCw size={14} /> Reload</button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={exportJson}><Download size={14} /> Export JSON</button>
          <button type="button" className="btn btn-primary btn-sm" onClick={save}><Save size={14} /> Save</button>
        </div>
      </div>
      <div className="submitStatus cmsSaveStatus">{status}</div>
      <div className="featureCmsStats">
        <div className="featureCmsStat"><strong>{data.routingRules.length}</strong><span>Routing Rules</span></div>
        <div className="featureCmsStat"><strong>{data.routingRules.filter((item) => item.active).length}</strong><span>Active Routing</span></div>
        <div className="featureCmsStat"><strong>{data.slaRules.length}</strong><span>SLA Rules</span></div>
        <div className="featureCmsStat"><strong>{data.slaRules.filter((item) => item.active).length}</strong><span>Active SLA</span></div>
        <div className="featureCmsStat"><strong>{Math.min(...data.slaRules.map((item) => item.targetHours)) || 0}</strong><span>Fastest Target Hours</span></div>
      </div>
      <div className="featureEditorTabs">
        <button type="button" className={activeTab === 'routing' ? 'active' : ''} onClick={() => setActiveTab('routing')}>Routing Rules</button>
        <button type="button" className={activeTab === 'sla' ? 'active' : ''} onClick={() => setActiveTab('sla')}>SLA Rules</button>
      </div>

      {activeTab === 'routing' && (
        <div className="featureEditorTable routingRuleTable">
          <div className="featureEditorTableHeader"><h4>Routing Rules</h4><button type="button" className="btn btn-secondary btn-sm" onClick={addRoutingRule}><Plus size={14} /> Add Routing Rule</button></div>
          <div className="featureGrid routingRules head"><span>ID</span><span>Name</span><span>Trigger</span><span>Condition</span><span>Queue</span><span>Owner</span><span>Priority</span><span>Sort</span><span>Active</span><span>Notes</span><span>Action</span></div>
          {data.routingRules.map((item) => <div className="featureGrid routingRules" key={item.id}><input value={item.id} onChange={(event) => updateRoutingRule(item.id, { id: event.target.value })} /><input value={item.name} onChange={(event) => updateRoutingRule(item.id, { name: event.target.value })} /><select value={item.triggerType} onChange={(event) => updateRoutingRule(item.id, { triggerType: event.target.value as RoutingRule['triggerType'] })}><option value="market">Market</option><option value="accessibility">Accessibility</option><option value="contract">Contract</option><option value="urgency">Urgency</option><option value="document">Document</option><option value="manual">Manual</option></select><input value={item.condition} onChange={(event) => updateRoutingRule(item.id, { condition: event.target.value })} /><input value={item.assignedQueue} onChange={(event) => updateRoutingRule(item.id, { assignedQueue: event.target.value })} /><input value={item.ownerRole} onChange={(event) => updateRoutingRule(item.id, { ownerRole: event.target.value })} /><select value={item.priority} onChange={(event) => updateRoutingRule(item.id, { priority: event.target.value as RoutingRule['priority'] })}><option value="Low">Low</option><option value="Normal">Normal</option><option value="High">High</option><option value="Urgent">Urgent</option></select><input type="number" value={item.sortOrder} onChange={(event) => updateRoutingRule(item.id, { sortOrder: Number(event.target.value) })} /><select value={item.active ? 'yes' : 'no'} onChange={(event) => updateRoutingRule(item.id, { active: event.target.value === 'yes' })}><option value="yes">Yes</option><option value="no">No</option></select><input value={item.notes} onChange={(event) => updateRoutingRule(item.id, { notes: event.target.value })} /><button type="button" className="iconMiniButton danger" onClick={() => deleteRoutingRule(item.id)}><Trash2 size={14} /></button></div>)}
        </div>
      )}

      {activeTab === 'sla' && (
        <div className="featureEditorTable slaRuleTable">
          <div className="featureEditorTableHeader"><h4>SLA Rules</h4><button type="button" className="btn btn-secondary btn-sm" onClick={addSlaRule}><Plus size={14} /> Add SLA Rule</button></div>
          <div className="featureGrid slaRules head"><span>ID</span><span>Name</span><span>Applies To</span><span>Target Hrs</span><span>Business Hrs</span><span>Escalate Hrs</span><span>Owner</span><span>Sort</span><span>Active</span><span>Notes</span><span>Action</span></div>
          {data.slaRules.map((item) => <div className="featureGrid slaRules" key={item.id}><input value={item.id} onChange={(event) => updateSlaRule(item.id, { id: event.target.value })} /><input value={item.name} onChange={(event) => updateSlaRule(item.id, { name: event.target.value })} /><select value={item.appliesTo} onChange={(event) => updateSlaRule(item.id, { appliesTo: event.target.value as SlaRule['appliesTo'] })}><option value="standard">Standard</option><option value="urgent">Urgent</option><option value="contract">Contract</option><option value="accessibility">Accessibility</option><option value="all">All</option></select><input type="number" value={item.targetHours} onChange={(event) => updateSlaRule(item.id, { targetHours: Number(event.target.value) })} /><select value={item.businessHoursOnly ? 'yes' : 'no'} onChange={(event) => updateSlaRule(item.id, { businessHoursOnly: event.target.value === 'yes' })}><option value="yes">Yes</option><option value="no">No</option></select><input type="number" value={item.escalationHours} onChange={(event) => updateSlaRule(item.id, { escalationHours: Number(event.target.value) })} /><input value={item.ownerRole} onChange={(event) => updateSlaRule(item.id, { ownerRole: event.target.value })} /><input type="number" value={item.sortOrder} onChange={(event) => updateSlaRule(item.id, { sortOrder: Number(event.target.value) })} /><select value={item.active ? 'yes' : 'no'} onChange={(event) => updateSlaRule(item.id, { active: event.target.value === 'yes' })}><option value="yes">Yes</option><option value="no">No</option></select><input value={item.notes} onChange={(event) => updateSlaRule(item.id, { notes: event.target.value })} /><button type="button" className="iconMiniButton danger" onClick={() => deleteSlaRule(item.id)}><Trash2 size={14} /></button></div>)}
        </div>
      )}
    </div>
  );
}
