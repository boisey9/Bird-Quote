import { useEffect, useState } from 'react';
import { Download, Plus, RefreshCw, Save, Trash2 } from 'lucide-react';
import { saveSeatOptionListsCms, seedSeatOptionListsCms, toSeatOptionListsCmsData, type SeatOptionListId, type SeatOptionListsCmsData, type SeatOptionValue } from '../../hooks/useSeatOptionListsCms';
import './FeatureOptionsAdminEditor.css';

type SeatOptionsPayload = Partial<SeatOptionListsCmsData> & { ok?: boolean; source?: string; error?: string; counts?: Record<string, number> };
const listOrder: SeatOptionListId[] = ['seatTypes', 'materials', 'colors', 'restraintTypes', 'armrests', 'grabTypes', 'brandingOptions'];

async function parseSeatOptionsResponse(response: Response): Promise<SeatOptionsPayload> {
  const text = await response.text();
  let payload: SeatOptionsPayload;
  try { payload = text ? JSON.parse(text) as SeatOptionsPayload : {}; }
  catch { throw new Error(`Seat Options CMS returned non-JSON (${response.status}). ${text.replace(/\s+/g, ' ').slice(0, 180) || response.statusText}`); }
  if (!response.ok || payload.ok === false) throw new Error(payload.error ?? `Seat Options CMS request failed (${response.status}).`);
  return payload;
}

function slug(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function SeatOptionListsAdminEditor() {
  const [data, setData] = useState<SeatOptionListsCmsData>(() => seedSeatOptionListsCms());
  const [activeList, setActiveList] = useState<SeatOptionListId>('seatTypes');
  const [status, setStatus] = useState('Loading Seat Option Lists CMS...');

  async function loadData() {
    setStatus('Loading Seat Option Lists CMS...');
    try {
      const payload = await parseSeatOptionsResponse(await fetch('/api/cms-seat-options'));
      setData(toSeatOptionListsCmsData(payload));
      setStatus(payload.source === 'empty-neon' ? 'No saved Seat Option Lists yet. Showing seed lists; click Save to initialize backend.' : 'Loaded Seat Option Lists CMS from Neon.');
    } catch (error) {
      setData(seedSeatOptionListsCms());
      setStatus(error instanceof Error ? `${error.message} Showing seed lists.` : 'Unable to load Seat Option Lists CMS.');
    }
  }

  useEffect(() => { loadData(); }, []);

  function updateData(values: SeatOptionValue[]) {
    setData((current) => ({ ...current, values }));
    setStatus('Unsaved seat option list changes.');
  }

  function addValue() {
    const count = data.values.filter((item) => item.listId === activeList).length;
    const label = 'New Option Value';
    updateData([...data.values, { id: `${activeList}-${Date.now()}`, listId: activeList, label, value: label, active: false, status: 'draft', sortOrder: (count + 1) * 10, notes: '' }]);
  }

  function updateValue(id: string, updates: Partial<SeatOptionValue>) {
    updateData(data.values.map((item) => item.id === id ? { ...item, ...updates } : item));
  }

  function deleteValue(id: string) {
    updateData(data.values.filter((item) => item.id !== id));
  }

  async function save() {
    setStatus('Saving Seat Option Lists CMS...');
    try {
      const normalized = { ...data, values: data.values.map((item) => ({ ...item, id: item.id || `${item.listId}-${slug(item.value)}` })) };
      const result = await saveSeatOptionListsCms(normalized);
      setData(toSeatOptionListsCmsData(result));
      setStatus(`Saved. ${result.counts?.values ?? normalized.values.length} seat option value(s).`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to save Seat Option Lists CMS.');
    }
  }

  function exportJson() {
    navigator.clipboard?.writeText(JSON.stringify(data, null, 2));
    setStatus('Seat Option Lists CMS JSON copied to clipboard.');
  }

  const visibleValues = data.values.filter((item) => item.listId === activeList).sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label));

  return (
    <div className="featureOptionsEditor seatOptionsListEditor">
      <div className="floorPlanHeader featureEditorHeader">
        <div>
          <small>Seat Option Lists CMS</small>
          <strong>Seat dropdown source lists</strong>
          <p>Manage the dropdown values used in Seat Package and Seat Type Details without code changes.</p>
        </div>
        <div className="floorPlanAdminActions">
          <button type="button" className="btn btn-secondary btn-sm" onClick={loadData}><RefreshCw size={14} /> Reload</button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={exportJson}><Download size={14} /> Export JSON</button>
          <button type="button" className="btn btn-primary btn-sm" onClick={save}><Save size={14} /> Save</button>
        </div>
      </div>
      <div className="submitStatus cmsSaveStatus">{status}</div>
      <div className="featureEditorTabs">
        {listOrder.map((listId) => <button type="button" key={listId} className={activeList === listId ? 'active' : ''} onClick={() => setActiveList(listId)}>{data.listLabels[listId]}</button>)}
      </div>
      <div className="featureEditorTable seatOptionValueTable">
        <div className="featureEditorTableHeader"><h4>{data.listLabels[activeList]}</h4><button type="button" className="btn btn-secondary btn-sm" onClick={addValue}><Plus size={14} /> Add Value</button></div>
        <div className="featureGrid seatOptionValues head"><span>ID</span><span>Label</span><span>Value</span><span>Sort</span><span>Active</span><span>Status</span><span>Notes</span><span>Action</span></div>
        {visibleValues.map((item) => <div className="featureGrid seatOptionValues" key={item.id}><input value={item.id} onChange={(event) => updateValue(item.id, { id: event.target.value })} /><input value={item.label} onChange={(event) => updateValue(item.id, { label: event.target.value })} /><input value={item.value} onChange={(event) => updateValue(item.id, { value: event.target.value })} /><input type="number" value={item.sortOrder} onChange={(event) => updateValue(item.id, { sortOrder: Number(event.target.value) })} /><select value={item.active ? 'yes' : 'no'} onChange={(event) => updateValue(item.id, { active: event.target.value === 'yes' })}><option value="yes">Yes</option><option value="no">No</option></select><select value={item.status} onChange={(event) => updateValue(item.id, { status: event.target.value })}><option value="draft">Draft</option><option value="active">Active</option><option value="inactive">Inactive</option><option value="retired">Retired</option></select><input value={item.notes} onChange={(event) => updateValue(item.id, { notes: event.target.value })} /><button type="button" className="iconMiniButton danger" onClick={() => deleteValue(item.id)}><Trash2 size={14} /></button></div>)}
      </div>
    </div>
  );
}
