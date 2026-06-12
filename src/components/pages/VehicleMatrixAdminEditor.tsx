import { useEffect, useMemo, useState } from 'react';
import { Copy, Download, Plus, RefreshCw, Save, Trash2 } from 'lucide-react';
import { saveVehicleMatrixCms, seedVehicleMatrixCms, toVehicleMatrixCmsData, type VehicleContractRule, type VehicleMatrixCmsData } from '../../hooks/useVehicleMatrixCms';
import { useActiveContractPrograms } from '../../hooks/useContractPrograms';
import type { BusTypeCompatibility, BusTypeOption, CertificationOption, ChassisOption, WheelbaseOption } from '../../types/rfq';
import './AdminCms.css';

type VehicleEditorTab = 'chassis' | 'certifications' | 'wheelbases' | 'busTypes' | 'compatibility' | 'contractRules';

type VehicleMatrixCmsPayload = Partial<VehicleMatrixCmsData> & {
  ok?: boolean;
  source?: string;
  error?: string;
  counts?: Record<string, number>;
};

const tabs: { id: VehicleEditorTab; label: string }[] = [
  { id: 'chassis', label: 'Chassis' },
  { id: 'certifications', label: 'Certifications' },
  { id: 'wheelbases', label: 'Wheelbases' },
  { id: 'busTypes', label: 'Bus Types' },
  { id: 'compatibility', label: 'Compatibility' },
  { id: 'contractRules', label: 'Contract Rules' }
];

async function parseVehicleMatrixResponse(response: Response): Promise<VehicleMatrixCmsPayload> {
  const text = await response.text();
  let payload: VehicleMatrixCmsPayload;
  try {
    payload = text ? JSON.parse(text) as VehicleMatrixCmsPayload : {};
  } catch {
    const preview = text.replace(/\s+/g, ' ').slice(0, 180);
    throw new Error(`Vehicle Matrix CMS returned non-JSON (${response.status}). ${preview || response.statusText}`);
  }
  if (!response.ok || payload.ok === false) throw new Error(payload.error ?? `Vehicle Matrix CMS request failed (${response.status}).`);
  return payload;
}

function normalizeKey(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function MatrixStat({ label, value }: { label: string; value: number }) {
  return <div className="floorPlanStat"><strong>{value}</strong><span>{label}</span></div>;
}

export function VehicleMatrixAdminEditor() {
  const [matrix, setMatrix] = useState<VehicleMatrixCmsData>(() => seedVehicleMatrixCms());
  const [activeTab, setActiveTab] = useState<VehicleEditorTab>('chassis');
  const [status, setStatus] = useState('Loading Vehicle Matrix CMS...');
  const contractCms = useActiveContractPrograms();

  const activeChassis = useMemo(() => matrix.chassis.filter((item) => item.active), [matrix.chassis]);
  const chassisOptions = useMemo(() => [{ id: 'any', name: 'Any / All' }, ...matrix.chassis], [matrix.chassis]);
  const certificationOptions = useMemo(() => [{ id: 'any', name: 'Any / All', chassisId: 'any' }, ...matrix.certifications], [matrix.certifications]);
  const wheelbaseOptions = useMemo(() => [{ id: 'any', name: 'Any / All', chassisId: 'any' }, ...matrix.wheelbases], [matrix.wheelbases]);
  const busTypeOptions = useMemo(() => [{ id: 'any', name: 'Any / All' }, ...matrix.busTypes], [matrix.busTypes]);
  const contractOptions = useMemo(() => [{ id: 'any', label: 'Any Contract / All' }, ...contractCms.contracts], [contractCms.contracts]);

  async function loadMatrix() {
    setStatus('Loading Vehicle Matrix CMS...');
    try {
      const payload = await parseVehicleMatrixResponse(await fetch('/api/cms-vehicle-matrix'));
      setMatrix(toVehicleMatrixCmsData(payload));
      setStatus(payload.source === 'empty-neon' ? 'No saved Vehicle Matrix CMS records yet. Showing seed matrix; click Save to initialize backend.' : 'Loaded Vehicle Matrix CMS from Neon.');
    } catch (error) {
      setMatrix(seedVehicleMatrixCms());
      setStatus(error instanceof Error ? `${error.message} Showing seed matrix.` : 'Unable to load Vehicle Matrix CMS. Showing seed matrix.');
    }
  }

  useEffect(() => { loadMatrix(); }, []);

  function updateMatrix(updates: Partial<VehicleMatrixCmsData>) {
    setMatrix((current) => ({ ...current, ...updates }));
    setStatus('Unsaved vehicle matrix changes.');
  }

  async function saveMatrix() {
    setStatus('Saving Vehicle Matrix CMS...');
    try {
      const result = await saveVehicleMatrixCms(matrix);
      setMatrix(toVehicleMatrixCmsData(result));
      const counts = result.counts;
      setStatus(`Saved. ${counts?.chassis ?? matrix.chassis.length} chassis, ${counts?.certifications ?? matrix.certifications.length} certifications, ${counts?.wheelbases ?? matrix.wheelbases.length} wheelbases, ${counts?.busTypes ?? matrix.busTypes.length} bus types.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to save Vehicle Matrix CMS.');
    }
  }

  function exportJson() {
    navigator.clipboard?.writeText(JSON.stringify(matrix, null, 2));
    setStatus('Vehicle Matrix CMS JSON copied to clipboard.');
  }

  function addChassis() {
    const id = `chassis-${Date.now()}`;
    updateMatrix({ chassis: [...matrix.chassis, { id, name: 'New Chassis', description: 'New chassis platform.', badge: 'New', sortOrder: matrix.chassis.length * 10 + 10, active: false }] });
  }

  function updateChassis(id: string, updates: Partial<ChassisOption>) {
    updateMatrix({ chassis: matrix.chassis.map((item) => item.id === id ? { ...item, ...updates } : item) });
  }

  function deleteChassis(id: string) {
    updateMatrix({
      chassis: matrix.chassis.filter((item) => item.id !== id),
      certifications: matrix.certifications.filter((item) => item.chassisId !== id),
      wheelbases: matrix.wheelbases.filter((item) => item.chassisId !== id),
      compatibility: matrix.compatibility.filter((item) => item.chassisId !== id),
      vehicleContractRules: matrix.vehicleContractRules.filter((item) => item.chassisId !== id)
    });
  }

  function addCertification() {
    const chassisId = activeChassis[0]?.id ?? matrix.chassis[0]?.id ?? 'any';
    const id = `${chassisId}-cert-${Date.now()}`;
    updateMatrix({ certifications: [...matrix.certifications, { id, chassisId, name: 'New Certification', description: 'New certification package.', sortOrder: matrix.certifications.length * 10 + 10, active: false }] });
  }

  function updateCertification(id: string, updates: Partial<CertificationOption>) {
    updateMatrix({ certifications: matrix.certifications.map((item) => item.id === id ? { ...item, ...updates } : item) });
  }

  function deleteCertification(id: string) {
    updateMatrix({ certifications: matrix.certifications.filter((item) => item.id !== id), vehicleContractRules: matrix.vehicleContractRules.filter((item) => item.certificationId !== id) });
  }

  function addWheelbase() {
    const chassisId = activeChassis[0]?.id ?? matrix.chassis[0]?.id ?? 'any';
    const id = `${chassisId}-wb-${Date.now()}`;
    updateMatrix({ wheelbases: [...matrix.wheelbases, { id, chassisId, name: 'New Wheelbase', description: 'New wheelbase option.', certificationScope: 'school_commercial', sortOrder: matrix.wheelbases.length * 10 + 10, active: false }] });
  }

  function updateWheelbase(id: string, updates: Partial<WheelbaseOption>) {
    updateMatrix({ wheelbases: matrix.wheelbases.map((item) => item.id === id ? { ...item, ...updates } : item) });
  }

  function deleteWheelbase(id: string) {
    updateMatrix({ wheelbases: matrix.wheelbases.filter((item) => item.id !== id), compatibility: matrix.compatibility.filter((item) => item.wheelbaseId !== id), vehicleContractRules: matrix.vehicleContractRules.filter((item) => item.wheelbaseId !== id) });
  }

  function addBusType() {
    const id = `bus-type-${Date.now()}`;
    updateMatrix({ busTypes: [...matrix.busTypes, { id, name: 'New Bus Type', description: 'New bus type.', sortOrder: matrix.busTypes.length * 10 + 10, active: false }] });
  }

  function updateBusType(id: string, updates: Partial<BusTypeOption>) {
    updateMatrix({ busTypes: matrix.busTypes.map((item) => item.id === id ? { ...item, ...updates } : item) });
  }

  function deleteBusType(id: string) {
    updateMatrix({ busTypes: matrix.busTypes.filter((item) => item.id !== id), compatibility: matrix.compatibility.filter((item) => item.busTypeId !== id), vehicleContractRules: matrix.vehicleContractRules.filter((item) => item.busTypeId !== id) });
  }

  function addCompatibility() {
    const chassisId = matrix.chassis[0]?.id ?? 'any';
    const wheelbaseId = matrix.wheelbases.find((item) => item.chassisId === chassisId)?.id ?? matrix.wheelbases[0]?.id ?? 'any';
    const busTypeId = matrix.busTypes[0]?.id ?? 'any';
    updateMatrix({ compatibility: [...matrix.compatibility, { chassisId, wheelbaseId, busTypeId }] });
  }

  function updateCompatibility(index: number, updates: Partial<BusTypeCompatibility>) {
    updateMatrix({ compatibility: matrix.compatibility.map((item, itemIndex) => itemIndex === index ? { ...item, ...updates } : item) });
  }

  function deleteCompatibility(index: number) {
    updateMatrix({ compatibility: matrix.compatibility.filter((_, itemIndex) => itemIndex !== index) });
  }

  function addContractRule() {
    updateMatrix({ vehicleContractRules: [...matrix.vehicleContractRules, { id: `vehicle-rule-${Date.now()}`, contractId: 'any', chassisId: 'any', certificationId: 'any', wheelbaseId: 'any', busTypeId: 'any', allowed: true, required: false, active: true, notes: '' }] });
  }

  function updateContractRule(id: string, updates: Partial<VehicleContractRule>) {
    updateMatrix({ vehicleContractRules: matrix.vehicleContractRules.map((item) => item.id === id ? { ...item, ...updates } : item) });
  }

  function deleteContractRule(id: string) {
    updateMatrix({ vehicleContractRules: matrix.vehicleContractRules.filter((item) => item.id !== id) });
  }

  return (
    <div className="vehicleMatrixEditor">
      <div className="floorPlanHeader vehicleEditorHeader">
        <div>
          <small>Vehicle Matrix CMS</small>
          <strong>Vehicle / Chassis Matrix Management</strong>
          <p>Manage chassis, certifications, wheelbases, bus types, compatibility rows, and contract vehicle rules.</p>
        </div>
        <div className="floorPlanAdminActions">
          <button type="button" className="btn btn-secondary btn-sm" onClick={loadMatrix}><RefreshCw size={14} /> Reload</button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={exportJson}><Download size={14} /> Export JSON</button>
          <button type="button" className="btn btn-primary btn-sm" onClick={saveMatrix}><Save size={14} /> Save</button>
        </div>
      </div>

      <div className="submitStatus cmsSaveStatus">{status}</div>

      <div className="floorPlanStats">
        <MatrixStat label="Chassis" value={matrix.chassis.length} />
        <MatrixStat label="Certifications" value={matrix.certifications.length} />
        <MatrixStat label="Wheelbases" value={matrix.wheelbases.length} />
        <MatrixStat label="Bus Types" value={matrix.busTypes.length} />
        <MatrixStat label="Compatibility Rows" value={matrix.compatibility.length} />
        <MatrixStat label="Contract Rules" value={matrix.vehicleContractRules.length} />
      </div>

      <div className="vehicleEditorTabs">
        {tabs.map((tab) => <button type="button" className={activeTab === tab.id ? 'active' : ''} key={tab.id} onClick={() => setActiveTab(tab.id)}>{tab.label}</button>)}
      </div>

      {activeTab === 'chassis' && (
        <div className="vehicleEditorTable chassisTable">
          <div className="vehicleEditorTableHeader"><h4>Chassis</h4><button type="button" className="btn btn-secondary btn-sm" onClick={addChassis}><Plus size={14} /> Add Chassis</button></div>
          <div className="vehicleGrid head"><span>ID</span><span>Name</span><span>Description</span><span>Badge</span><span>Sort</span><span>Active</span><span>Action</span></div>
          {matrix.chassis.map((item) => <div className="vehicleGrid" key={item.id}><input value={item.id} onChange={(event) => updateChassis(item.id, { id: normalizeKey(event.target.value) })} /><input value={item.name} onChange={(event) => updateChassis(item.id, { name: event.target.value })} /><input value={item.description} onChange={(event) => updateChassis(item.id, { description: event.target.value })} /><input value={item.badge} onChange={(event) => updateChassis(item.id, { badge: event.target.value })} /><input type="number" value={item.sortOrder} onChange={(event) => updateChassis(item.id, { sortOrder: Number(event.target.value) })} /><select value={item.active ? 'yes' : 'no'} onChange={(event) => updateChassis(item.id, { active: event.target.value === 'yes' })}><option value="yes">Yes</option><option value="no">No</option></select><button type="button" className="iconMiniButton danger" onClick={() => deleteChassis(item.id)}><Trash2 size={14} /></button></div>)}
        </div>
      )}

      {activeTab === 'certifications' && (
        <div className="vehicleEditorTable certificationTable">
          <div className="vehicleEditorTableHeader"><h4>Certifications</h4><button type="button" className="btn btn-secondary btn-sm" onClick={addCertification}><Plus size={14} /> Add Certification</button></div>
          <div className="vehicleGrid head"><span>ID</span><span>Chassis</span><span>Name</span><span>Description</span><span>Sort</span><span>Active</span><span>Action</span></div>
          {matrix.certifications.map((item) => <div className="vehicleGrid" key={item.id}><input value={item.id} onChange={(event) => updateCertification(item.id, { id: normalizeKey(event.target.value) })} /><select value={item.chassisId} onChange={(event) => updateCertification(item.id, { chassisId: event.target.value })}>{matrix.chassis.map((chassis) => <option key={chassis.id} value={chassis.id}>{chassis.name}</option>)}</select><input value={item.name} onChange={(event) => updateCertification(item.id, { name: event.target.value })} /><input value={item.description} onChange={(event) => updateCertification(item.id, { description: event.target.value })} /><input type="number" value={item.sortOrder} onChange={(event) => updateCertification(item.id, { sortOrder: Number(event.target.value) })} /><select value={item.active ? 'yes' : 'no'} onChange={(event) => updateCertification(item.id, { active: event.target.value === 'yes' })}><option value="yes">Yes</option><option value="no">No</option></select><button type="button" className="iconMiniButton danger" onClick={() => deleteCertification(item.id)}><Trash2 size={14} /></button></div>)}
        </div>
      )}

      {activeTab === 'wheelbases' && (
        <div className="vehicleEditorTable wheelbaseTable">
          <div className="vehicleEditorTableHeader"><h4>Wheelbases</h4><button type="button" className="btn btn-secondary btn-sm" onClick={addWheelbase}><Plus size={14} /> Add Wheelbase</button></div>
          <div className="vehicleGrid head"><span>ID</span><span>Chassis</span><span>Name</span><span>Description</span><span>Scope</span><span>Sort</span><span>Active</span><span>Action</span></div>
          {matrix.wheelbases.map((item) => <div className="vehicleGrid eight" key={item.id}><input value={item.id} onChange={(event) => updateWheelbase(item.id, { id: normalizeKey(event.target.value) })} /><select value={item.chassisId} onChange={(event) => updateWheelbase(item.id, { chassisId: event.target.value })}>{matrix.chassis.map((chassis) => <option key={chassis.id} value={chassis.id}>{chassis.name}</option>)}</select><input value={item.name} onChange={(event) => updateWheelbase(item.id, { name: event.target.value })} /><input value={item.description} onChange={(event) => updateWheelbase(item.id, { description: event.target.value })} /><select value={item.certificationScope} onChange={(event) => updateWheelbase(item.id, { certificationScope: event.target.value as WheelbaseOption['certificationScope'] })}><option value="school_commercial">School + Commercial</option><option value="commercial_only">Commercial Only</option><option value="school_only">School Only</option></select><input type="number" value={item.sortOrder} onChange={(event) => updateWheelbase(item.id, { sortOrder: Number(event.target.value) })} /><select value={item.active ? 'yes' : 'no'} onChange={(event) => updateWheelbase(item.id, { active: event.target.value === 'yes' })}><option value="yes">Yes</option><option value="no">No</option></select><button type="button" className="iconMiniButton danger" onClick={() => deleteWheelbase(item.id)}><Trash2 size={14} /></button></div>)}
        </div>
      )}

      {activeTab === 'busTypes' && (
        <div className="vehicleEditorTable busTypeTable">
          <div className="vehicleEditorTableHeader"><h4>Bus Types</h4><button type="button" className="btn btn-secondary btn-sm" onClick={addBusType}><Plus size={14} /> Add Bus Type</button></div>
          <div className="vehicleGrid busTypes head"><span>ID</span><span>Name</span><span>Description</span><span>Sort</span><span>Active</span><span>Action</span></div>
          {matrix.busTypes.map((item) => <div className="vehicleGrid busTypes" key={item.id}><input value={item.id} onChange={(event) => updateBusType(item.id, { id: normalizeKey(event.target.value) })} /><input value={item.name} onChange={(event) => updateBusType(item.id, { name: event.target.value })} /><input value={item.description} onChange={(event) => updateBusType(item.id, { description: event.target.value })} /><input type="number" value={item.sortOrder} onChange={(event) => updateBusType(item.id, { sortOrder: Number(event.target.value) })} /><select value={item.active ? 'yes' : 'no'} onChange={(event) => updateBusType(item.id, { active: event.target.value === 'yes' })}><option value="yes">Yes</option><option value="no">No</option></select><button type="button" className="iconMiniButton danger" onClick={() => deleteBusType(item.id)}><Trash2 size={14} /></button></div>)}
        </div>
      )}

      {activeTab === 'compatibility' && (
        <div className="vehicleEditorTable compatibilityMatrixTable">
          <div className="vehicleEditorTableHeader"><h4>Compatibility Matrix</h4><button type="button" className="btn btn-secondary btn-sm" onClick={addCompatibility}><Plus size={14} /> Add Compatibility</button></div>
          <div className="vehicleGrid compatibility head"><span>Chassis</span><span>Wheelbase</span><span>Bus Type</span><span>Action</span></div>
          {matrix.compatibility.map((item, index) => {
            const wheelbases = matrix.wheelbases.filter((wheelbase) => wheelbase.chassisId === item.chassisId);
            return <div className="vehicleGrid compatibility" key={`${item.chassisId}-${item.wheelbaseId}-${item.busTypeId}-${index}`}><select value={item.chassisId} onChange={(event) => updateCompatibility(index, { chassisId: event.target.value, wheelbaseId: matrix.wheelbases.find((wheelbase) => wheelbase.chassisId === event.target.value)?.id ?? item.wheelbaseId })}>{matrix.chassis.map((chassis) => <option key={chassis.id} value={chassis.id}>{chassis.name}</option>)}</select><select value={item.wheelbaseId} onChange={(event) => updateCompatibility(index, { wheelbaseId: event.target.value })}>{wheelbases.map((wheelbase) => <option key={wheelbase.id} value={wheelbase.id}>{wheelbase.name}</option>)}</select><select value={item.busTypeId} onChange={(event) => updateCompatibility(index, { busTypeId: event.target.value })}>{matrix.busTypes.map((busType) => <option key={busType.id} value={busType.id}>{busType.name}</option>)}</select><button type="button" className="iconMiniButton danger" onClick={() => deleteCompatibility(index)}><Trash2 size={14} /></button></div>;
          })}
        </div>
      )}

      {activeTab === 'contractRules' && (
        <div className="vehicleEditorTable vehicleContractRuleTable">
          <div className="vehicleEditorTableHeader"><h4>Contract Vehicle Rules</h4><button type="button" className="btn btn-secondary btn-sm" onClick={addContractRule}><Plus size={14} /> Add Rule</button></div>
          <div className="vehicleGrid contractRules head"><span>Contract</span><span>Chassis</span><span>Certification</span><span>Wheelbase</span><span>Bus Type</span><span>Allowed</span><span>Required</span><span>Active</span><span>Notes</span><span>Action</span></div>
          {matrix.vehicleContractRules.map((item) => <div className="vehicleGrid contractRules" key={item.id}><select value={item.contractId} onChange={(event) => updateContractRule(item.id, { contractId: event.target.value })}>{contractOptions.map((contract) => <option key={contract.id} value={contract.id}>{contract.label}</option>)}</select><select value={item.chassisId} onChange={(event) => updateContractRule(item.id, { chassisId: event.target.value, certificationId: 'any', wheelbaseId: 'any' })}>{chassisOptions.map((chassis) => <option key={chassis.id} value={chassis.id}>{chassis.name}</option>)}</select><select value={item.certificationId} onChange={(event) => updateContractRule(item.id, { certificationId: event.target.value })}>{certificationOptions.filter((certification) => item.chassisId === 'any' || certification.chassisId === 'any' || certification.chassisId === item.chassisId).map((certification) => <option key={certification.id} value={certification.id}>{certification.name}</option>)}</select><select value={item.wheelbaseId} onChange={(event) => updateContractRule(item.id, { wheelbaseId: event.target.value })}>{wheelbaseOptions.filter((wheelbase) => item.chassisId === 'any' || wheelbase.chassisId === 'any' || wheelbase.chassisId === item.chassisId).map((wheelbase) => <option key={wheelbase.id} value={wheelbase.id}>{wheelbase.name}</option>)}</select><select value={item.busTypeId} onChange={(event) => updateContractRule(item.id, { busTypeId: event.target.value })}>{busTypeOptions.map((busType) => <option key={busType.id} value={busType.id}>{busType.name}</option>)}</select><select value={item.allowed ? 'yes' : 'no'} onChange={(event) => updateContractRule(item.id, { allowed: event.target.value === 'yes' })}><option value="yes">Yes</option><option value="no">No</option></select><select value={item.required ? 'yes' : 'no'} onChange={(event) => updateContractRule(item.id, { required: event.target.value === 'yes' })}><option value="no">No</option><option value="yes">Yes</option></select><select value={item.active ? 'yes' : 'no'} onChange={(event) => updateContractRule(item.id, { active: event.target.value === 'yes' })}><option value="yes">Yes</option><option value="no">No</option></select><input value={item.notes} onChange={(event) => updateContractRule(item.id, { notes: event.target.value })} /><button type="button" className="iconMiniButton danger" onClick={() => deleteContractRule(item.id)}><Trash2 size={14} /></button></div>)}
        </div>
      )}
    </div>
  );
}
