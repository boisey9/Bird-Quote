import { useMemo, useState, type CSSProperties } from 'react';
import { Copy, Download, Grid3X3, Save } from 'lucide-react';
import {
  floorPlanCompatibilityRules,
  floorPlanMaster,
  floorPlanSeatTypes,
  getFloorPlanSeatTypeName,
  getFloorPlanZones,
  type FloorPlanMaster,
  type FloorPlanSide,
  type FloorPlanZone
} from '../../data/floorPlanGrid';
import './FloorPlanAdminEditor.css';

type FloorPlanFrameStyle = CSSProperties & { '--row-count': number };

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

export function FloorPlanAdminEditor() {
  const [plans, setPlans] = useState(floorPlanMaster);
  const [selectedFloorPlanId, setSelectedFloorPlanId] = useState(floorPlanMaster[0]?.floorPlanId ?? '');
  const selectedPlan = plans.find((plan) => plan.floorPlanId === selectedFloorPlanId) ?? plans[0];
  const zones = useMemo(() => getFloorPlanZones(selectedPlan.floorPlanId), [selectedPlan.floorPlanId]);
  const rules = floorPlanCompatibilityRules.filter((rule) => rule.floorPlanId === selectedPlan.floorPlanId);
  const seatZones = zones.filter((zone) => ['seat', 'foldaway'].includes(zone.zoneType));
  const wheelchairZones = zones.filter((zone) => zone.zoneType === 'wheelchair');
  const lockedZones = zones.filter((zone) => zone.locked);
  const rowSpanTotal = zones.reduce((sum, zone) => sum + (zone.rowEnd - zone.rowStart + 1), 0);

  function updateSelectedPlan(updates: Partial<FloorPlanMaster>) {
    setPlans((current) => current.map((plan) => plan.floorPlanId === selectedPlan.floorPlanId ? { ...plan, ...updates } : plan));
  }

  function duplicatePlan() {
    const nextId = `${selectedPlan.floorPlanId}-copy-${Date.now()}`;
    const copy = { ...selectedPlan, floorPlanId: nextId, floorPlanName: `${selectedPlan.floorPlanName} Copy`, status: 'draft' as const, dealerVisible: false };
    setPlans((current) => [...current, copy]);
    setSelectedFloorPlanId(nextId);
  }

  function exportJson() {
    const payload = {
      floorPlanMaster: plans,
      floorPlanZones: zones,
      floorPlanSeatTypes,
      floorPlanCompatibilityRules: rules
    };
    navigator.clipboard?.writeText(JSON.stringify(payload, null, 2));
  }

  return (
    <div className="floorPlanAdminEditor">
      <aside className="floorPlanList">
        <strong>Floor Plan Templates</strong>
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
            <button type="button" className="btn btn-secondary btn-sm" onClick={duplicatePlan}><Copy size={14} /> Duplicate</button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={exportJson}><Download size={14} /> Export JSON</button>
            <button type="button" className="btn btn-primary btn-sm" disabled title="DB persistence is handled in the seat layout API patch"><Save size={14} /> Save Later</button>
          </div>
        </div>

        <div className="floorPlanMetaGrid">
          <label><span>Name</span><input value={selectedPlan.floorPlanName} onChange={(event) => updateSelectedPlan({ floorPlanName: event.target.value })} /></label>
          <label><span>Market</span><select value={selectedPlan.market} onChange={(event) => updateSelectedPlan({ market: event.target.value as FloorPlanMaster['market'] })}><option value="commercial">Commercial</option><option value="school">School</option><option value="mfsab">MFSAB</option><option value="any">Any</option></select></label>
          <label><span>Shell</span><select value={selectedPlan.shellType} onChange={(event) => updateSelectedPlan({ shellType: event.target.value as FloorPlanMaster['shellType'] })}><option value="standard">Standard</option><option value="rear_lift">Rear Lift</option><option value="mid_door">Mid Door</option></select></label>
          <label><span>Rows</span><input type="number" min="1" max="14" value={selectedPlan.rowCount} onChange={(event) => updateSelectedPlan({ rowCount: Number(event.target.value) })} /></label>
          <label><span>Entrance</span><select value={selectedPlan.entranceType} onChange={(event) => updateSelectedPlan({ entranceType: event.target.value as FloorPlanMaster['entranceType'] })}><option value="front">Front</option><option value="mid">Mid</option><option value="front_mid">Front + Mid</option></select></label>
          <label><span>Lift</span><select value={selectedPlan.liftType} onChange={(event) => updateSelectedPlan({ liftType: event.target.value as FloorPlanMaster['liftType'] })}><option value="none">None</option><option value="rear">Rear</option><option value="side">Side</option></select></label>
          <label><span>Capacity Hint</span><input type="number" min="0" value={selectedPlan.capacityHint} onChange={(event) => updateSelectedPlan({ capacityHint: Number(event.target.value) })} /></label>
          <label><span>Dealer Visible</span><select value={selectedPlan.dealerVisible ? 'yes' : 'no'} onChange={(event) => updateSelectedPlan({ dealerVisible: event.target.value === 'yes' })}><option value="yes">Yes</option><option value="no">No</option></select></label>
        </div>

        <div className="floorPlanStats">
          <FloorPlanStat label="Zones" value={zones.length} />
          <FloorPlanStat label="Seat Zones" value={seatZones.length} />
          <FloorPlanStat label="Wheelchair Zones" value={wheelchairZones.length} />
          <FloorPlanStat label="Locked / Row Span" value={`${lockedZones.length} / ${rowSpanTotal}`} />
        </div>

        <FloorPlanCanvas floorPlan={selectedPlan} zones={zones} />

        <div className="floorPlanTables">
          <div className="floorPlanTable">
            <h4><Grid3X3 size={16} /> FloorPlanZones</h4>
            <div className="floorPlanTableGrid zones">
              <div className="head"><span>Zone</span><span>Side</span><span>Start</span><span>End</span><span>Type</span><span>Seat Type</span><span>Locked</span></div>
              {zones.map((zone) => <div key={zone.zoneId}><strong>{zone.label}</strong><span>{zone.side}</span><span>{zone.rowStart}</span><span>{zone.rowEnd}</span><span>{zone.zoneType}</span><span>{getFloorPlanSeatTypeName(zone.seatTypeId)}</span><em>{zone.locked ? 'Yes' : 'No'}</em></div>)}
            </div>
          </div>
          <div className="floorPlanTable">
            <h4>CompatibilityRules</h4>
            <div className="floorPlanTableGrid compatibility">
              <div className="head"><span>Contract</span><span>Chassis</span><span>Wheelbase</span><span>Certification</span><span>Bus Type</span><span>Allowed</span></div>
              {rules.map((rule, index) => <div key={`${rule.floorPlanId}-${index}`}><span>{rule.contractId}</span><span>{rule.chassis}</span><span>{rule.wheelbase}</span><span>{rule.certification}</span><span>{rule.busType}</span><em>{rule.allowed ? 'Yes' : 'No'}</em></div>)}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
