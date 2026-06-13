import { useEffect, useState } from 'react';
import { Download, Plus, RefreshCw, Save, Trash2 } from 'lucide-react';
import { saveWeightBalanceCms, seedWeightBalanceCms, toWeightBalanceData, type BalanceZone, type OptionWeightItem, type VehicleWeightProfile, type WeightBalanceCmsData } from '../../hooks/useWeightBalanceCms';
import './FeatureOptionsAdminEditor.css';

type WeightTab = 'vehicles' | 'options' | 'zones';
type WeightPayload = Partial<WeightBalanceCmsData> & { ok?: boolean; source?: string; error?: string; counts?: Record<string, number> };

async function parseWeightResponse(response: Response): Promise<WeightPayload> {
  const text = await response.text();
  let payload: WeightPayload;
  try { payload = text ? JSON.parse(text) as WeightPayload : {}; }
  catch { throw new Error(`Weight CMS returned invalid response (${response.status}).`); }
  if (!response.ok || payload.ok === false) throw new Error(payload.error ?? `Weight CMS request failed (${response.status}).`);
  return payload;
}

export function WeightBalanceAdminEditor() {
  const [tab, setTab] = useState<WeightTab>('vehicles');
  const [data, setData] = useState<WeightBalanceCmsData>(() => seedWeightBalanceCms());
  const [status, setStatus] = useState('Loading weight and balance CMS...');

  async function loadData() {
    setStatus('Loading weight and balance CMS...');
    try {
      const payload = await parseWeightResponse(await fetch('/api/cms-weight-balance'));
      setData(toWeightBalanceData(payload));
      setStatus(payload.source === 'empty-neon' ? 'No saved weight data yet. Showing seed values; click Save to initialize backend.' : 'Loaded weight and balance data from Neon.');
    } catch (error) {
      setData(seedWeightBalanceCms());
      setStatus(error instanceof Error ? `${error.message} Showing seed values.` : 'Unable to load weight data.');
    }
  }

  useEffect(() => { loadData(); }, []);

  function updateData(next: WeightBalanceCmsData) {
    setData(next);
    setStatus('Unsaved weight and balance changes.');
  }

  function updateVehicle(id: string, updates: Partial<VehicleWeightProfile>) {
    updateData({ ...data, vehicleWeightProfiles: data.vehicleWeightProfiles.map((item) => item.id === id ? { ...item, ...updates } : item) });
  }

  function updateOption(id: string, updates: Partial<OptionWeightItem>) {
    updateData({ ...data, optionWeightItems: data.optionWeightItems.map((item) => item.id === id ? { ...item, ...updates } : item) });
  }

  function updateZone(id: string, updates: Partial<BalanceZone>) {
    updateData({ ...data, balanceZones: data.balanceZones.map((item) => item.id === id ? { ...item, ...updates } : item) });
  }

  function addVehicle() {
    updateData({ ...data, vehicleWeightProfiles: [...data.vehicleWeightProfiles, { id: `profile-${Date.now()}`, chassisMake: '', chassisModel: '', wheelbase: '', certification: '', busModel: '', gvwrLbs: 0, frontGawrLbs: 0, rearGawrLbs: 0, baseCurbWeightLbs: 0, baseFrontAxleWeightLbs: 0, baseRearAxleWeightLbs: 0, remainingConfigurableWeightLbs: 0, source: 'manual', effectiveDate: '', active: false, notes: '' }] });
  }

  function addOption() {
    updateData({ ...data, optionWeightItems: [...data.optionWeightItems, { id: `weight-${Date.now()}`, optionCode: '', optionName: 'New Weight Item', category: 'custom', defaultWeightLbs: 0, quantityBasis: 'each', defaultBalanceZoneId: 'mid', active: true, source: 'manual', notes: '' }] });
  }

  function addZone() {
    updateData({ ...data, balanceZones: [...data.balanceZones, { id: `zone-${Date.now()}`, name: 'New Balance Zone', zoneType: 'mid', frontAxlePercent: 50, rearAxlePercent: 50, notes: '' }] });
  }

  async function save() {
    setStatus('Saving weight and balance CMS...');
    try {
      const result = await saveWeightBalanceCms(data);
      setData(toWeightBalanceData(result));
      setStatus(`Saved. ${result.counts?.vehicleWeightProfiles ?? data.vehicleWeightProfiles.length} vehicle profile(s), ${result.counts?.optionWeightItems ?? data.optionWeightItems.length} weight item(s), ${result.counts?.balanceZones ?? data.balanceZones.length} balance zone(s).`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to save weight data.');
    }
  }

  function exportJson() {
    navigator.clipboard?.writeText(JSON.stringify(data, null, 2));
    setStatus('Weight and balance JSON copied to clipboard.');
  }

  return (
    <div className="featureOptionsEditor weightBalanceEditor">
      <div className="floorPlanHeader featureEditorHeader"><div><small>Weight & Balance</small><strong>RFQ Risk Estimate CMS</strong><p>Manage sales-estimate weights. This does not replace engineering validation.</p></div><div className="floorPlanAdminActions"><button type="button" className="btn btn-secondary btn-sm" onClick={loadData}><RefreshCw size={14} /> Reload</button><button type="button" className="btn btn-secondary btn-sm" onClick={exportJson}><Download size={14} /> Export JSON</button><button type="button" className="btn btn-primary btn-sm" onClick={save}><Save size={14} /> Save</button></div></div>
      <div className="submitStatus cmsSaveStatus">{status}</div>
      <div className="featureCmsStats"><div className="featureCmsStat"><strong>{data.vehicleWeightProfiles.length}</strong><span>Vehicle Profiles</span></div><div className="featureCmsStat"><strong>{data.optionWeightItems.length}</strong><span>Weight Items</span></div><div className="featureCmsStat"><strong>{data.balanceZones.length}</strong><span>Balance Zones</span></div><div className="featureCmsStat"><strong>{data.optionWeightItems.filter((item) => item.category === 'seat').length}</strong><span>Seat Weights</span></div><div className="featureCmsStat"><strong>{data.vehicleWeightProfiles.filter((item) => item.active).length}</strong><span>Active Profiles</span></div></div>
      <div className="featureEditorTabs"><button type="button" className={tab === 'vehicles' ? 'active' : ''} onClick={() => setTab('vehicles')}>Vehicle Profiles</button><button type="button" className={tab === 'options' ? 'active' : ''} onClick={() => setTab('options')}>Option / Seat Weights</button><button type="button" className={tab === 'zones' ? 'active' : ''} onClick={() => setTab('zones')}>Balance Zones</button></div>
      {tab === 'vehicles' && <div className="featureEditorTable"><div className="featureEditorTableHeader"><h4>Vehicle Weight Profiles</h4><button type="button" className="btn btn-secondary btn-sm" onClick={addVehicle}><Plus size={14} /> Add Profile</button></div><div className="featureGrid vehicleWeightRows head"><span>ID</span><span>Chassis</span><span>Model</span><span>WB</span><span>Cert</span><span>Bus</span><span>GVWR</span><span>Remaining</span><span>Source</span><span>Active</span><span>Notes</span><span>Action</span></div>{data.vehicleWeightProfiles.map((item) => <div className="featureGrid vehicleWeightRows" key={item.id}><input value={item.id} onChange={(event) => updateVehicle(item.id, { id: event.target.value })} /><input value={item.chassisMake} onChange={(event) => updateVehicle(item.id, { chassisMake: event.target.value })} /><input value={item.chassisModel} onChange={(event) => updateVehicle(item.id, { chassisModel: event.target.value })} /><input value={item.wheelbase} onChange={(event) => updateVehicle(item.id, { wheelbase: event.target.value })} /><input value={item.certification} onChange={(event) => updateVehicle(item.id, { certification: event.target.value })} /><input value={item.busModel} onChange={(event) => updateVehicle(item.id, { busModel: event.target.value })} /><input type="number" value={item.gvwrLbs} onChange={(event) => updateVehicle(item.id, { gvwrLbs: Number(event.target.value) })} /><input type="number" value={item.remainingConfigurableWeightLbs} onChange={(event) => updateVehicle(item.id, { remainingConfigurableWeightLbs: Number(event.target.value) })} /><select value={item.source} onChange={(event) => updateVehicle(item.id, { source: event.target.value as VehicleWeightProfile['source'] })}><option value="engineering">Engineering</option><option value="sales-estimate">Sales Estimate</option><option value="imported">Imported</option><option value="manual">Manual</option></select><select value={item.active ? 'yes' : 'no'} onChange={(event) => updateVehicle(item.id, { active: event.target.value === 'yes' })}><option value="yes">Yes</option><option value="no">No</option></select><input value={item.notes} onChange={(event) => updateVehicle(item.id, { notes: event.target.value })} /><button type="button" className="iconMiniButton danger" onClick={() => updateData({ ...data, vehicleWeightProfiles: data.vehicleWeightProfiles.filter((profile) => profile.id !== item.id) })}><Trash2 size={14} /></button></div>)}</div>}
      {tab === 'options' && <div className="featureEditorTable"><div className="featureEditorTableHeader"><h4>Option / Seat Weight Library</h4><button type="button" className="btn btn-secondary btn-sm" onClick={addOption}><Plus size={14} /> Add Weight</button></div><div className="featureGrid optionWeightRows head"><span>ID</span><span>Code</span><span>Name</span><span>Category</span><span>Weight</span><span>Basis</span><span>Zone</span><span>Active</span><span>Notes</span><span>Action</span></div>{data.optionWeightItems.map((item) => <div className="featureGrid optionWeightRows" key={item.id}><input value={item.id} onChange={(event) => updateOption(item.id, { id: event.target.value })} /><input value={item.optionCode} onChange={(event) => updateOption(item.id, { optionCode: event.target.value })} /><input value={item.optionName} onChange={(event) => updateOption(item.id, { optionName: event.target.value })} /><select value={item.category} onChange={(event) => updateOption(item.id, { category: event.target.value as OptionWeightItem['category'] })}><option value="seat">Seat</option><option value="lift">Lift</option><option value="door">Door</option><option value="hvac">HVAC</option><option value="electrical">Electrical</option><option value="flooring">Flooring</option><option value="storage">Storage</option><option value="accessibility">Accessibility</option><option value="exterior">Exterior</option><option value="custom">Custom</option></select><input type="number" value={item.defaultWeightLbs} onChange={(event) => updateOption(item.id, { defaultWeightLbs: Number(event.target.value) })} /><select value={item.quantityBasis} onChange={(event) => updateOption(item.id, { quantityBasis: event.target.value as OptionWeightItem['quantityBasis'] })}><option value="each">Each</option><option value="per-seat">Per Seat</option><option value="per-position">Per Position</option><option value="per-bus">Per Bus</option></select><select value={item.defaultBalanceZoneId} onChange={(event) => updateOption(item.id, { defaultBalanceZoneId: event.target.value })}>{data.balanceZones.map((zone) => <option key={zone.id} value={zone.id}>{zone.name}</option>)}</select><select value={item.active ? 'yes' : 'no'} onChange={(event) => updateOption(item.id, { active: event.target.value === 'yes' })}><option value="yes">Yes</option><option value="no">No</option></select><input value={item.notes} onChange={(event) => updateOption(item.id, { notes: event.target.value })} /><button type="button" className="iconMiniButton danger" onClick={() => updateData({ ...data, optionWeightItems: data.optionWeightItems.filter((weight) => weight.id !== item.id) })}><Trash2 size={14} /></button></div>)}</div>}
      {tab === 'zones' && <div className="featureEditorTable"><div className="featureEditorTableHeader"><h4>Balance Zones</h4><button type="button" className="btn btn-secondary btn-sm" onClick={addZone}><Plus size={14} /> Add Zone</button></div><div className="featureGrid balanceZoneRows head"><span>ID</span><span>Name</span><span>Type</span><span>Front %</span><span>Rear %</span><span>Notes</span><span>Action</span></div>{data.balanceZones.map((item) => <div className="featureGrid balanceZoneRows" key={item.id}><input value={item.id} onChange={(event) => updateZone(item.id, { id: event.target.value })} /><input value={item.name} onChange={(event) => updateZone(item.id, { name: event.target.value })} /><select value={item.zoneType} onChange={(event) => updateZone(item.id, { zoneType: event.target.value as BalanceZone['zoneType'] })}><option value="front">Front</option><option value="mid">Mid</option><option value="rear">Rear</option><option value="over-rear-axle">Over Rear Axle</option><option value="behind-rear-axle">Behind Rear Axle</option></select><input type="number" value={item.frontAxlePercent} onChange={(event) => updateZone(item.id, { frontAxlePercent: Number(event.target.value) })} /><input type="number" value={item.rearAxlePercent} onChange={(event) => updateZone(item.id, { rearAxlePercent: Number(event.target.value) })} /><input value={item.notes} onChange={(event) => updateZone(item.id, { notes: event.target.value })} /><button type="button" className="iconMiniButton danger" onClick={() => updateData({ ...data, balanceZones: data.balanceZones.filter((zone) => zone.id !== item.id) })}><Trash2 size={14} /></button></div>)}</div>}
    </div>
  );
}
