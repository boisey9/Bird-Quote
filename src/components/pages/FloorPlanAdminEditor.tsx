import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Copy, Download, Grid3X3, Plus, RefreshCw, Save, Trash2 } from 'lucide-react';
import { busSpecMatrixData } from '../../data/busSpecMatrix';
import { contractOptions } from '../../data/contractConfig';
import {
  floorPlanCompatibilityRules as seedCompatibilityRules,
  floorPlanMaster as seedFloorPlanMaster,
  floorPlanSeatTypes as seedFloorPlanSeatTypes,
  floorPlanZones as seedFloorPlanZones,
  getFloorPlanSeatTypeName,
  type FloorPlanCompatibilityRule,
  type FloorPlanMaster,
  type FloorPlanSide,
  type FloorPlanZone
} from '../../data/floorPlanGrid';
import './FloorPlanAdminEditor.css';

type FloorPlanFrameStyle = CSSProperties & { '--row-count': number };
type FloorPlanCmsPayload = {
  ok?: boolean;
  error?: string;
  source?: string;
  floorPlanCount?: number;
  zoneCount?: number;
  seatTypeCount?: number;
  ruleCount?: number;
  floorPlanMaster?: FloorPlanMaster[];
  floorPlanZones?: FloorPlanZone[];
  floorPlanSeatTypes?: typeof seedFloorPlanSeatTypes;
  floorPlanCompatibilityRules?: FloorPlanCompatibilityRule[];
};

const defaultFloorPlan = seedFloorPlanMaster[0]!;
const sideOptions: FloorPlanSide[] = ['curb', 'street', 'center', 'full'];
const zoneTypeOptions: FloorPlanZone['zoneType'][] = ['seat', 'wheelchair', 'foldaway', 'entrance', 'mid-door', 'rear-lift', 'luggage', 'aisle', 'empty', 'driver', 'clearance'];
const anyOption = { id: 'any', name: 'Any / All' };
const contractRuleOptions = [{ id: 'any', label: 'Any Contract / All' }, ...contractOptions];
const chassisRuleOptions = [anyOption, ...busSpecMatrixData.chassis.filter((item) => item.active).map((item) => ({ id: item.id, name: item.name }))];
const certificationRuleOptions = [anyOption, ...busSpecMatrixData.certifications.filter((item) => item.active).map((item) => ({ id: item.id, name: item.name }))];
const wheelbaseRuleOptions = [anyOption, ...busSpecMatrixData.wheelbases.filter((item) => item.active).map((item) => ({ id: item.id, name: item.name }))];
const busTypeRuleOptions = [anyOption, ...busSpecMatrixData.busTypes.filter((item) => item.active).map((item) => ({ id: item.id, name: item.name }))];

async function parseFloorPlanResponse(response: Response): Promise<FloorPlanCmsPayload> {
  const text = await response.text();
  let payload: FloorPlanCmsPayload;
  try {
    payload = text ? JSON.parse(text) as FloorPlanCmsPayload : {};
  } catch {
    const preview = text.replace(/\s+/g, ' ').slice(0, 180);
    throw new Error(`Floor plan CMS returned non-JSON (${response.status}). ${preview || response.statusText}`);
  }
  if (!response.ok || !payload.ok) throw new Error(payload.error ?? `Floor plan CMS request failed (${response.status}).`);
  return payload;
}

function FloorPlanStat({ label, value }: { label: string; value: number | string }) {
  return <div className="floorPlanStat"><strong>{value}</strong><span>{label}</span></div>;
}

function zoneForCell(zones: FloorPlanZone[], side: FloorPlanSide, rowNumber: number) {
  return zones.find((zone) => zone.side === side && rowNumber >= zone.rowStart && rowNumber <= zone.rowEnd)
    ?? zones.find((zone) => zone.side === 'full' && rowNumber >= zone.rowStart && rowNumber <= zone.rowEnd);
}

function FloorPlanCell({ zone }: { zone?: FloorPlanZone }) {
  if (!zone) return <div className="floorPlanCell empty">Open</div>;
  return <div className={`floorPlanCell ${zone.zoneType}`} title={zone.notes ?? zone.label}>{zone.label}</div>;
}

function FloorPlanCanvas({ floorPlan, zones }: { floorPlan: FloorPlanMaster; zones: FloorPlanZone[] }) {
  const rows = Array.from({ length: floorPlan.rowCount }, (_, index) => index + 1);
  const frameStyle: FloorPlanFrameStyle = { '--row-count': floorPlan.rowCount };

  return (
    <div className="floorPlanCanvas">
      <div className="floorPlanBusFrame" style={frameStyle}>
        <div className="floorPlanCab">FRONT</div>
        {rows.map((rowNumber) => {
          const curbZone = zoneForCell(zones, 'curb', rowNumber);
          const streetZone = zoneForCell(zones, 'street', rowNumber);
          return (
            <div className="floorPlanColumn" key={rowNumber}>
              <FloorPlanCell zone={streetZone} />
              <div className="floorPlanAisle">R{rowNumber}</div>
              <FloorPlanCell zone={curbZone} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function matchesChassisScope(item: { chassisId?: string }, chassisId: string) {
  return chassisId === 'any' || !item.chassisId || item.chassisId === chassisId;
}

export function FloorPlanAdminEditor() {
  const [plans, setPlans] = useState<FloorPlanMaster[]>(seedFloorPlanMaster);
  const [zones, setZones] = useState<FloorPlanZone[]>(seedFloorPlanZones);
  const [seatTypes, setSeatTypes] = useState(seedFloorPlanSeatTypes);
  const [rules, setRules] = useState<FloorPlanCompatibilityRule[]>(seedCompatibilityRules);
  const [selectedFloorPlanId, setSelectedFloorPlanId] = useState(defaultFloorPlan.floorPlanId);
  const [status, setStatus] = useState('Loading floor plan CMS...');

  const selectedPlan = plans.find((plan) => plan.floorPlanId === selectedFloorPlanId) ?? plans[0] ?? defaultFloorPlan;
  const selectedZones = useMemo(() => zones.filter((zone) => zone.floorPlanId === selectedPlan.floorPlanId).sort((a, b) => a.rowStart - b.rowStart || a.side.localeCompare(b.side)), [zones, selectedPlan.floorPlanId]);
  const selectedRules = rules.filter((rule) => rule.floorPlanId === selectedPlan.floorPlanId);
  const seatZones = selectedZones.filter((zone) => ['seat', 'foldaway'].includes(zone.zoneType));
  const wheelchairZones = selectedZones.filter((zone) => zone.zoneType === 'wheelchair');
  const lockedZones = selectedZones.filter((zone) => zone.locked);
  const rowSpanTotal = selectedZones.reduce((sum, zone) => sum + (zone.rowEnd - zone.rowStart + 1), 0);

  async function loadFromDatabase() {
    setStatus('Loading floor plan CMS...');
    try {
      const result = await parseFloorPlanResponse(await fetch('/api/cms-floor-plans'));
      const nextPlans = result.floorPlanMaster?.length ? result.floorPlanMaster : seedFloorPlanMaster;
      setPlans(nextPlans);
      setZones(result.floorPlanZones?.length ? result.floorPlanZones : seedFloorPlanZones);
      setSeatTypes(result.floorPlanSeatTypes?.length ? result.floorPlanSeatTypes : seedFloorPlanSeatTypes);
      setRules(result.floorPlanCompatibilityRules?.length ? result.floorPlanCompatibilityRules : seedCompatibilityRules);
      setSelectedFloorPlanId((current) => nextPlans.some((plan) => plan.floorPlanId === current) ? current : nextPlans[0]?.floorPlanId ?? defaultFloorPlan.floorPlanId);
      setStatus(result.source === 'empty-neon' ? 'No saved floor plans yet. Showing seed templates; click Save to initialize the backend.' : `Loaded floor plan CMS from ${result.source ?? 'API'}.`);
    } catch (error) {
      setStatus(error instanceof Error ? `${error.message} Showing seed templates.` : 'Unable to load floor plan CMS. Showing seed templates.');
      setPlans(seedFloorPlanMaster);
      setZones(seedFloorPlanZones);
      setSeatTypes(seedFloorPlanSeatTypes);
      setRules(seedCompatibilityRules);
    }
  }

  useEffect(() => { loadFromDatabase(); }, []);

  function updateSelectedPlan(updates: Partial<FloorPlanMaster>) {
    setPlans((current) => current.map((plan) => plan.floorPlanId === selectedPlan.floorPlanId ? { ...plan, ...updates } : plan));
    setStatus('Unsaved floor plan changes.');
  }

  function createPlan() {
    const nextId = `fp-new-${Date.now()}`;
    const newPlan: FloorPlanMaster = {
      floorPlanId: nextId,
      floorPlanName: 'New Floor Plan Grid',
      market: 'commercial',
      shellType: 'standard',
      entranceType: 'front',
      liftType: 'none',
      rowCount: 8,
      status: 'draft',
      dealerVisible: false,
      capacityHint: 0,
      wheelchairCapacityHint: 0,
      notes: 'New admin-created floor plan grid for testing.'
    };
    setPlans((current) => [...current, newPlan]);
    setZones((current) => [...current, { floorPlanId: nextId, zoneId: `${nextId}-entry`, side: 'curb', rowStart: 1, rowEnd: 1, zoneType: 'entrance', label: 'Entrance', locked: true }]);
    setRules((current) => [...current, { floorPlanId: nextId, contractId: 'none', chassis: 'any', wheelbase: 'any', certification: 'any', busType: 'any', allowed: true }]);
    setSelectedFloorPlanId(nextId);
    setStatus('New floor plan created. Save to persist to backend.');
  }

  function duplicatePlan() {
    const nextId = `${selectedPlan.floorPlanId}-copy-${Date.now()}`;
    const copy: FloorPlanMaster = { ...selectedPlan, floorPlanId: nextId, floorPlanName: `${selectedPlan.floorPlanName} Copy`, status: 'draft', dealerVisible: false };
    setPlans((current) => [...current, copy]);
    setZones((current) => [...current, ...selectedZones.map((zone) => ({ ...zone, floorPlanId: nextId, zoneId: `${nextId}-${zone.zoneId}-${Date.now()}` }))]);
    setRules((current) => [...current, ...selectedRules.map((rule) => ({ ...rule, floorPlanId: nextId }))]);
    setSelectedFloorPlanId(nextId);
    setStatus('Floor plan duplicated. Save to persist to backend.');
  }

  function deletePlan() {
    if (plans.length <= 1) {
      setStatus('At least one floor plan is required for testing. Create another before deleting this one.');
      return;
    }
    const nextPlans = plans.filter((plan) => plan.floorPlanId !== selectedPlan.floorPlanId);
    setPlans(nextPlans);
    setZones((current) => current.filter((zone) => zone.floorPlanId !== selectedPlan.floorPlanId));
    setRules((current) => current.filter((rule) => rule.floorPlanId !== selectedPlan.floorPlanId));
    setSelectedFloorPlanId(nextPlans[0]?.floorPlanId ?? defaultFloorPlan.floorPlanId);
    setStatus('Floor plan deleted locally. Save to persist deletion to backend.');
  }

  function updateZone(zoneId: string, updates: Partial<FloorPlanZone>) {
    setZones((current) => current.map((zone) => zone.zoneId === zoneId ? { ...zone, ...updates } : zone));
    setStatus('Unsaved zone changes.');
  }

  function addZone() {
    const nextRow = Math.min(selectedPlan.rowCount, Math.max(1, selectedZones.length + 1));
    const zone: FloorPlanZone = { floorPlanId: selectedPlan.floorPlanId, zoneId: `${selectedPlan.floorPlanId}-zone-${Date.now()}`, side: 'curb', rowStart: nextRow, rowEnd: nextRow, zoneType: 'seat', seatTypeId: seatTypes[0]?.seatTypeId, label: 'New Zone', locked: false };
    setZones((current) => [...current, zone]);
    setStatus('Zone added. Save to persist to backend.');
  }

  function deleteZone(zoneId: string) {
    setZones((current) => current.filter((zone) => zone.zoneId !== zoneId));
    setStatus('Zone deleted locally. Save to persist deletion to backend.');
  }

  function addRule() {
    setRules((current) => [...current, { floorPlanId: selectedPlan.floorPlanId, contractId: 'none', chassis: 'any', wheelbase: 'any', certification: 'any', busType: 'any', allowed: true }]);
    setStatus('Compatibility rule added. Save to persist to backend.');
  }

  function updateRule(index: number, updates: Partial<FloorPlanCompatibilityRule>) {
    let selectedIndex = -1;
    setRules((current) => current.map((rule) => {
      if (rule.floorPlanId !== selectedPlan.floorPlanId) return rule;
      selectedIndex += 1;
      const nextRule = selectedIndex === index ? { ...rule, ...updates } : rule;
      if (selectedIndex === index && updates.chassis) {
        return { ...nextRule, wheelbase: 'any', certification: 'any' };
      }
      return nextRule;
    }));
    setStatus('Unsaved compatibility rule changes.');
  }

  function deleteRule(index: number) {
    let selectedIndex = -1;
    setRules((current) => current.filter((rule) => {
      if (rule.floorPlanId !== selectedPlan.floorPlanId) return true;
      selectedIndex += 1;
      return selectedIndex !== index;
    }));
    setStatus('Compatibility rule deleted locally. Save to persist deletion to backend.');
  }

  async function saveToDatabase() {
    setStatus('Saving floor plan CMS to backend...');
    try {
      const payload = { floorPlanMaster: plans, floorPlanZones: zones, floorPlanSeatTypes: seatTypes, floorPlanCompatibilityRules: rules };
      const result = await parseFloorPlanResponse(await fetch('/api/cms-floor-plans', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }));
      setStatus(`Saved. ${result.floorPlanCount ?? plans.length} floor plan(s), ${result.zoneCount ?? zones.length} zone(s), ${result.ruleCount ?? rules.length} rule(s).`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to save floor plan CMS.');
    }
  }

  function exportJson() {
    const payload = { floorPlanMaster: plans, floorPlanZones: zones, floorPlanSeatTypes: seatTypes, floorPlanCompatibilityRules: rules };
    navigator.clipboard?.writeText(JSON.stringify(payload, null, 2));
    setStatus('Floor plan CMS JSON copied to clipboard.');
  }

  return (
    <div className="floorPlanAdminEditor">
      <aside className="floorPlanList">
        <div className="floorPlanListHeader"><strong>Floor Plan Templates</strong><button type="button" className="btn btn-secondary btn-sm" onClick={createPlan}><Plus size={14} /> New</button></div>
        <small>Admin grid source for dealer-visible reference layouts.</small>
        {plans.map((plan) => (
          <button type="button" className={plan.floorPlanId === selectedPlan.floorPlanId ? 'active' : ''} key={plan.floorPlanId} onClick={() => setSelectedFloorPlanId(plan.floorPlanId)}>
            <strong>{plan.floorPlanName}</strong>
            <span>{plan.shellType} • {plan.market} • {plan.rowCount} rows</span>
            <em>{plan.dealerVisible ? 'Dealer visible' : 'Internal only'} • {plan.status}</em>
          </button>
        ))}
      </aside>

      <section className="floorPlanMain">
        <div className="floorPlanHeader">
          <div>
            <small>Selected Floor Plan Grid</small>
            <strong>{selectedPlan.floorPlanName}</strong>
            <p>{selectedPlan.notes}</p>
          </div>
          <div className="floorPlanAdminActions">
            <span className="floorPlanStatus">{selectedPlan.status}</span>
            <button type="button" className="btn btn-secondary btn-sm" onClick={loadFromDatabase}><RefreshCw size={14} /> Reload</button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={duplicatePlan}><Copy size={14} /> Duplicate</button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={exportJson}><Download size={14} /> Export JSON</button>
            <button type="button" className="btn btn-danger btn-sm" onClick={deletePlan}><Trash2 size={14} /> Delete</button>
            <button type="button" className="btn btn-primary btn-sm" onClick={saveToDatabase}><Save size={14} /> Save</button>
          </div>
        </div>
        <div className="submitStatus cmsSaveStatus">{status}</div>

        <div className="floorPlanMetaGrid">
          <label><span>Name</span><input value={selectedPlan.floorPlanName} onChange={(event) => updateSelectedPlan({ floorPlanName: event.target.value })} /></label>
          <label><span>Market</span><select value={selectedPlan.market} onChange={(event) => updateSelectedPlan({ market: event.target.value as FloorPlanMaster['market'] })}><option value="commercial">Commercial</option><option value="school">School</option><option value="mfsab">MFSAB</option><option value="any">Any</option></select></label>
          <label><span>Shell</span><select value={selectedPlan.shellType} onChange={(event) => updateSelectedPlan({ shellType: event.target.value as FloorPlanMaster['shellType'] })}><option value="standard">Standard</option><option value="rear_lift">Rear Lift</option><option value="mid_door">Mid Door</option></select></label>
          <label><span>Rows</span><input type="number" min="1" max="14" value={selectedPlan.rowCount} onChange={(event) => updateSelectedPlan({ rowCount: Number(event.target.value) })} /></label>
          <label><span>Entrance</span><select value={selectedPlan.entranceType} onChange={(event) => updateSelectedPlan({ entranceType: event.target.value as FloorPlanMaster['entranceType'] })}><option value="front">Front</option><option value="mid">Mid</option><option value="front_mid">Front + Mid</option></select></label>
          <label><span>Lift</span><select value={selectedPlan.liftType} onChange={(event) => updateSelectedPlan({ liftType: event.target.value as FloorPlanMaster['liftType'] })}><option value="none">None</option><option value="rear">Rear</option><option value="side">Side</option></select></label>
          <label><span>Capacity Hint</span><input type="number" min="0" value={selectedPlan.capacityHint} onChange={(event) => updateSelectedPlan({ capacityHint: Number(event.target.value) })} /></label>
          <label><span>Dealer Visible</span><select value={selectedPlan.dealerVisible ? 'yes' : 'no'} onChange={(event) => updateSelectedPlan({ dealerVisible: event.target.value === 'yes' })}><option value="yes">Yes</option><option value="no">No</option></select></label>
          <label className="wideField"><span>Notes</span><input value={selectedPlan.notes} onChange={(event) => updateSelectedPlan({ notes: event.target.value })} /></label>
        </div>

        <div className="floorPlanStats">
          <FloorPlanStat label="Zones" value={selectedZones.length} />
          <FloorPlanStat label="Seat Zones" value={seatZones.length} />
          <FloorPlanStat label="Wheelchair Zones" value={wheelchairZones.length} />
          <FloorPlanStat label="Locked / Row Span" value={`${lockedZones.length} / ${rowSpanTotal}`} />
        </div>

        <FloorPlanCanvas floorPlan={selectedPlan} zones={selectedZones} />

        <div className="floorPlanTables">
          <div className="floorPlanTable">
            <div className="floorPlanTableHeader"><h4><Grid3X3 size={16} /> FloorPlanZones</h4><button type="button" className="btn btn-secondary btn-sm" onClick={addZone}><Plus size={14} /> Add Zone</button></div>
            <div className="floorPlanTableGrid zones editable">
              <div className="head"><span>Zone</span><span>Side</span><span>Start</span><span>End</span><span>Type</span><span>Seat Type</span><span>Locked</span><span>Action</span></div>
              {selectedZones.map((zone) => <div key={zone.zoneId}><input value={zone.label} onChange={(event) => updateZone(zone.zoneId, { label: event.target.value })} /><select value={zone.side} onChange={(event) => updateZone(zone.zoneId, { side: event.target.value as FloorPlanSide })}>{sideOptions.map((side) => <option key={side} value={side}>{side}</option>)}</select><input type="number" min="1" max={selectedPlan.rowCount} value={zone.rowStart} onChange={(event) => updateZone(zone.zoneId, { rowStart: Number(event.target.value) })} /><input type="number" min="1" max={selectedPlan.rowCount} value={zone.rowEnd} onChange={(event) => updateZone(zone.zoneId, { rowEnd: Number(event.target.value) })} /><select value={zone.zoneType} onChange={(event) => updateZone(zone.zoneId, { zoneType: event.target.value as FloorPlanZone['zoneType'] })}>{zoneTypeOptions.map((type) => <option key={type} value={type}>{type}</option>)}</select><select value={zone.seatTypeId ?? ''} onChange={(event) => updateZone(zone.zoneId, { seatTypeId: event.target.value || undefined })}><option value="">N/A</option>{seatTypes.map((seatType) => <option key={seatType.seatTypeId} value={seatType.seatTypeId}>{getFloorPlanSeatTypeName(seatType.seatTypeId)}</option>)}</select><select value={zone.locked ? 'yes' : 'no'} onChange={(event) => updateZone(zone.zoneId, { locked: event.target.value === 'yes' })}><option value="yes">Yes</option><option value="no">No</option></select><button type="button" className="iconMiniButton danger" onClick={() => deleteZone(zone.zoneId)}><Trash2 size={14} /></button></div>)}
            </div>
          </div>
          <div className="floorPlanTable">
            <div className="floorPlanTableHeader"><h4>CompatibilityRules</h4><button type="button" className="btn btn-secondary btn-sm" onClick={addRule}><Plus size={14} /> Add Rule</button></div>
            <div className="floorPlanTableGrid compatibility editable">
              <div className="head"><span>Contract</span><span>Chassis</span><span>Wheelbase</span><span>Certification</span><span>Bus Type</span><span>Allowed</span><span>Action</span></div>
              {selectedRules.map((rule, index) => {
                const wheelbaseOptions = wheelbaseRuleOptions.filter((item) => item.id === 'any' || matchesChassisScope(item, rule.chassis));
                const certificationOptions = certificationRuleOptions.filter((item) => item.id === 'any' || matchesChassisScope(item, rule.chassis));
                return <div key={`${rule.floorPlanId}-${index}`}><select value={rule.contractId} onChange={(event) => updateRule(index, { contractId: event.target.value })}>{contractRuleOptions.map((contract) => <option key={contract.id} value={contract.id}>{contract.label}</option>)}</select><select value={rule.chassis} onChange={(event) => updateRule(index, { chassis: event.target.value })}>{chassisRuleOptions.map((chassis) => <option key={chassis.id} value={chassis.id}>{chassis.name}</option>)}</select><select value={rule.wheelbase} onChange={(event) => updateRule(index, { wheelbase: event.target.value })}>{wheelbaseOptions.map((wheelbase) => <option key={wheelbase.id} value={wheelbase.id}>{wheelbase.name}</option>)}</select><select value={rule.certification} onChange={(event) => updateRule(index, { certification: event.target.value })}>{certificationOptions.map((certification) => <option key={certification.id} value={certification.id}>{certification.name}</option>)}</select><select value={rule.busType} onChange={(event) => updateRule(index, { busType: event.target.value })}>{busTypeRuleOptions.map((busType) => <option key={busType.id} value={busType.id}>{busType.name}</option>)}</select><select value={rule.allowed ? 'yes' : 'no'} onChange={(event) => updateRule(index, { allowed: event.target.value === 'yes' })}><option value="yes">Yes</option><option value="no">No</option></select><button type="button" className="iconMiniButton danger" onClick={() => deleteRule(index)}><Trash2 size={14} /></button></div>;
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
