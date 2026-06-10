import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Copy, Database, Download, Lock, Plus, RefreshCw, Route, Save, Settings, Timer, Users } from 'lucide-react';
import { busSpecMatrixData } from '../../data/busSpecMatrix';
import { contractOptions } from '../../data/contractConfig';
import { featureOptionCategories, featureOptions, seatCmsConfig } from '../../data/featureOptionMatrix';
import type { SeatLayoutRow, SeatLayoutTemplate, SeatPositionType } from '../../types/rfq';
import './AdminCms.css';

const routingRules = [
  { name: 'Commercial RFQs', rule: 'Default to Sales Ops queue', owner: 'Sales Ops', status: 'Seed / V2' },
  { name: 'Accessibility RFQs', rule: 'Flag when wheelchair capacity or rear lift is requested', owner: 'Estimating Team', status: 'Seed / V2' },
  { name: 'Contract RFQs', rule: 'Contract-controlled quotes route to contract review/approval before final quote release', owner: 'Sales Ops + Manager', status: 'Planned' },
  { name: 'Bid / urgent response', rule: 'Mark priority as High when urgent/bid timing is selected', owner: 'Sales Ops', status: 'Planned' }
];

const slaRules = [
  { name: 'Standard RFQ assignment', target: '8 business hours', status: 'Seed / V2' },
  { name: 'Standard quote turnaround', target: '3 business days', status: 'Seed / V2' },
  { name: 'Contract quote approval', target: 'Approval required before quote release', status: 'Future workflow' },
  { name: 'Urgent bid response', target: '1 business day', status: 'Planned' }
];

const roles = [
  { role: 'Dealer', permissions: 'Create RFQ, view own RFQs, track status, add documents' },
  { role: 'Sales Ops', permissions: 'Review queue, assign owner, update status, view documents' },
  { role: 'Manager', permissions: 'View pipeline, manage priority, monitor SLA, approve contract quotes' },
  { role: 'Admin', permissions: 'Maintain users, roles, seed config, SLA/routing rules' }
];

const positionTypes: SeatPositionType[] = ['passenger-seat', 'foldaway', 'wheelchair-space', 'empty', 'aisle', 'lounge', 'perimeter-seat'];
const zoneTypes: SeatLayoutRow['zone'][] = ['front', 'mid', 'rear', 'curbside', 'streetside'];
const positionLabels: Record<string, string> = {
  'passenger-seat': 'Passenger Seat',
  foldaway: 'Foldaway',
  'wheelchair-space': 'Wheelchair Space',
  empty: 'Empty',
  aisle: 'Aisle',
  lounge: 'Lounge',
  'perimeter-seat': 'Perimeter Seat'
};

type CmsSeatConfig = { layouts: SeatLayoutTemplate[]; rows: SeatLayoutRow[] };

function ConfigStat({ label, value }: { label: string; value: number | string }) {
  return <div className="configStat"><strong>{value}</strong><span>{label}</span></div>;
}

function ConfigSection({ icon, title, description, children, status = 'Read-only V2 seed config' }: { icon: ReactNode; title: string; description: string; children: ReactNode; status?: string }) {
  return (
    <section className="panel configSection">
      <div className="configSectionHeader">
        <span>{icon}</span>
        <div><h2>{title}</h2><p>{description}</p></div>
        <em>{status}</em>
      </div>
      {children}
    </section>
  );
}

function rowSeatTotal(row: SeatLayoutRow) {
  return row.seatCountLeft + row.seatCountRight;
}

function SeatRowVisualizer({ row }: { row: SeatLayoutRow }) {
  const leftMarkers = row.leftPositionType === 'empty' ? 0 : Math.max(1, Math.min(3, row.seatCountLeft || 1));
  const rightMarkers = row.rightPositionType === 'empty' ? 0 : Math.max(1, Math.min(3, row.seatCountRight || 1));
  return (
    <div className="adminSeatRowVisualizer">
      <div>{Array.from({ length: leftMarkers }).map((_, index) => <i className={`adminSeatMarker ${row.leftPositionType}`} key={`left-${index}`} />)}</div>
      <span />
      <div>{Array.from({ length: rightMarkers }).map((_, index) => <i className={`adminSeatMarker ${row.rightPositionType}`} key={`right-${index}`} />)}</div>
    </div>
  );
}

function SeatLayoutBuilder() {
  const [cmsConfig, setCmsConfig] = useState<CmsSeatConfig>({ layouts: seatCmsConfig.layouts, rows: seatCmsConfig.rows });
  const [selectedLayoutId, setSelectedLayoutId] = useState(seatCmsConfig.layouts[0]?.id ?? '');
  const [saveStatus, setSaveStatus] = useState('Loading CMS configuration from Neon...');
  const selectedLayout = cmsConfig.layouts.find((layout) => layout.id === selectedLayoutId) ?? cmsConfig.layouts[0];
  const rows = useMemo(() => cmsConfig.rows.filter((row) => row.layoutId === selectedLayout?.id).sort((a, b) => a.rowNumber - b.rowNumber), [cmsConfig.rows, selectedLayout?.id]);
  const rules = seatCmsConfig.rules.filter((rule) => rule.layoutId === selectedLayout?.id);
  const configuredSeatTotal = rows.reduce((sum, row) => sum + rowSeatTotal(row), 0);
  const wheelchairRows = rows.filter((row) => row.leftPositionType === 'wheelchair-space' || row.rightPositionType === 'wheelchair-space').length;

  async function loadFromDatabase() {
    setSaveStatus('Loading CMS configuration from Neon...');
    try {
      const response = await fetch('/api/cms-seat-layouts');
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error ?? 'Unable to load CMS configuration.');
      const nextConfig = { layouts: result.layouts as SeatLayoutTemplate[], rows: result.rows as SeatLayoutRow[] };
      setCmsConfig(nextConfig);
      setSelectedLayoutId((current) => nextConfig.layouts.some((layout) => layout.id === current) ? current : nextConfig.layouts[0]?.id ?? '');
      setSaveStatus(`CMS configuration loaded from ${result.source ?? 'API'}.`);
    } catch (error) {
      setSaveStatus(error instanceof Error ? `${error.message} Showing seed configuration.` : 'Unable to load CMS configuration. Showing seed configuration.');
      setCmsConfig({ layouts: seatCmsConfig.layouts, rows: seatCmsConfig.rows });
    }
  }

  useEffect(() => { loadFromDatabase(); }, []);

  if (!selectedLayout) return null;

  function updateLayout(updates: Partial<SeatLayoutTemplate>) {
    setCmsConfig((current) => ({ ...current, layouts: current.layouts.map((layout) => layout.id === selectedLayout.id ? { ...layout, ...updates } : layout) }));
    setSaveStatus('Unsaved CMS layout changes.');
  }

  function updateRow(rowId: string, updates: Partial<SeatLayoutRow>) {
    setCmsConfig((current) => ({ ...current, rows: current.rows.map((row) => row.id === rowId ? { ...row, ...updates } : row) }));
    setSaveStatus('Unsaved CMS row changes.');
  }

  function addRow() {
    const nextNumber = rows.length ? Math.max(...rows.map((row) => row.rowNumber)) + 1 : 1;
    const row: SeatLayoutRow = {
      id: `${selectedLayout.id}-row-${Date.now()}`,
      layoutId: selectedLayout.id,
      rowNumber: nextNumber,
      zone: 'mid',
      leftPositionType: 'passenger-seat',
      rightPositionType: 'passenger-seat',
      seatCountLeft: 2,
      seatCountRight: 2,
      allowedSeatStyles: ['High Back Standard']
    };
    setCmsConfig((current) => ({ ...current, rows: [...current.rows, row] }));
    setSaveStatus('New row added. Save to write to Neon.');
  }

  function removeRow(rowId: string) {
    setCmsConfig((current) => ({ ...current, rows: current.rows.filter((row) => row.id !== rowId) }));
    setSaveStatus('Row removed. Save to write to Neon.');
  }

  function duplicateTemplate() {
    const nextId = `${selectedLayout.id}-copy-${Date.now()}`;
    const copiedLayout = { ...selectedLayout, id: nextId, title: `${selectedLayout.title} Copy` };
    const copiedRows = rows.map((row) => ({ ...row, id: `${nextId}-${row.rowNumber}-${Date.now()}`, layoutId: nextId }));
    setCmsConfig((current) => ({ ...current, layouts: [...current.layouts, copiedLayout], rows: [...current.rows, ...copiedRows] }));
    setSelectedLayoutId(nextId);
    setSaveStatus('Template duplicated. Save to write to Neon.');
  }

  async function saveCmsConfig() {
    setSaveStatus('Saving CMS configuration to Neon...');
    try {
      const response = await fetch('/api/cms-seat-layouts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cmsConfig)
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error ?? 'Unable to save CMS configuration.');
      setSaveStatus(`CMS saved to Neon. ${result.layoutCount} layout(s), ${result.rowCount} row(s).`);
    } catch (error) {
      setSaveStatus(error instanceof Error ? error.message : 'Unable to save CMS configuration.');
    }
  }

  function exportCmsJson() {
    navigator.clipboard?.writeText(JSON.stringify(cmsConfig, null, 2));
    setSaveStatus('CMS JSON copied to clipboard.');
  }

  return (
    <div className="seatBuilderShell activeCmsBuilder">
      <div className="seatBuilderSidebar">
        <strong>Layout Templates</strong>
        <small>CMS-managed by model, contract, wheelbase, and certification.</small>
        <div className="seatTemplateList">
          {cmsConfig.layouts.map((layout) => {
            const rowCount = cmsConfig.rows.filter((row) => row.layoutId === layout.id).length;
            return <button type="button" className={layout.id === selectedLayout.id ? 'active' : ''} key={layout.id} onClick={() => setSelectedLayoutId(layout.id)}><span>{layout.title}</span><em>{rowCount} rows • max {layout.maxSeats}</em></button>;
          })}
        </div>
      </div>

      <div className="seatBuilderMain">
        <div className="seatBuilderHeader">
          <div>
            <small>Selected CMS Template</small>
            <input className="cmsTitleInput" value={selectedLayout.title} onChange={(event) => updateLayout({ title: event.target.value })} />
            <textarea className="cmsDescriptionInput" value={selectedLayout.description} onChange={(event) => updateLayout({ description: event.target.value })} />
          </div>
          <div className="seatBuilderActions">
            <button type="button" className="btn btn-secondary btn-sm" onClick={loadFromDatabase}><RefreshCw size={14} /> Reload</button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={duplicateTemplate}><Copy size={14} /> Duplicate</button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={exportCmsJson}><Download size={14} /> Export JSON</button>
            <button type="button" className="btn btn-primary btn-sm" onClick={saveCmsConfig}><Save size={14} /> Save to DB</button>
          </div>
        </div>

        <div className="submitStatus cmsSaveStatus">{saveStatus}</div>

        <div className="seatBuilderStats">
          <ConfigStat label="Configured Row Seats" value={configuredSeatTotal} />
          <ConfigStat label="Capacity Hint" value={selectedLayout.maxSeats} />
          <ConfigStat label="Wheelchair Rows" value={wheelchairRows} />
          <ConfigStat label="Rear Lift Compatible" value={selectedLayout.rearLiftCompatible ? 'Yes' : 'No'} />
        </div>

        <div className="seatBuilderRules">
          <h4>Availability Rules</h4>
          {rules.map((rule) => <p key={rule.layoutId}><strong>Chassis</strong><span>{rule.chassisIds.length ? rule.chassisIds.join(', ') : 'Any'}</span><strong>Bus Type</strong><span>{rule.busTypeIds.length ? rule.busTypeIds.join(', ') : 'Any'}</span><strong>Wheelbase</strong><span>{rule.wheelbaseIds.length ? rule.wheelbaseIds.join(', ') : 'Any'}</span></p>)}
        </div>

        <div className="seatRowsBuilder">
          <div className="seatRowsHeader"><h4>Configured Rows / Zones</h4><button type="button" className="btn btn-secondary btn-sm" onClick={addRow}><Plus size={14} /> Add Row</button></div>
          {rows.length === 0 && <div className="configNotice inlineNotice"><p>No configured rows yet for this layout.</p></div>}
          {rows.map((row) => (
            <div className="seatBuilderRow" key={row.id}>
              <div className="rowMeta"><strong>Row {row.rowNumber}</strong><select value={row.zone} onChange={(event) => updateRow(row.id, { zone: event.target.value as SeatLayoutRow['zone'] })}>{zoneTypes.map((zone) => <option key={zone} value={zone}>{zone}</option>)}</select></div>
              <SeatRowVisualizer row={row} />
              <div className="rowConfigGrid">
                <label><span>Left Position</span><select value={row.leftPositionType} onChange={(event) => updateRow(row.id, { leftPositionType: event.target.value as SeatPositionType })}>{positionTypes.map((type) => <option key={type} value={type}>{positionLabels[type]}</option>)}</select></label>
                <label><span>Left Count</span><input type="number" min="0" max="6" value={row.seatCountLeft} onChange={(event) => updateRow(row.id, { seatCountLeft: Number(event.target.value) })} /></label>
                <label><span>Right Position</span><select value={row.rightPositionType} onChange={(event) => updateRow(row.id, { rightPositionType: event.target.value as SeatPositionType })}>{positionTypes.map((type) => <option key={type} value={type}>{positionLabels[type]}</option>)}</select></label>
                <label><span>Right Count</span><input type="number" min="0" max="6" value={row.seatCountRight} onChange={(event) => updateRow(row.id, { seatCountRight: Number(event.target.value) })} /></label>
              </div>
              <div className="allowedStyles"><strong>Allowed Seat Styles</strong><input value={row.allowedSeatStyles.join(', ')} onChange={(event) => updateRow(row.id, { allowedSeatStyles: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) })} /></div>
              <button type="button" className="btn btn-danger btn-sm rowRemoveButton" onClick={() => removeRow(row.id)}>Remove</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ContractConfigSection() {
  return (
    <ConfigSection icon={<Route size={22} />} title="Contract Programs" description="Contract-controlled RFQs can restrict model choices, required documents, seating templates, workflow, and future approval routing." status="Active DB CMS">
      <div className="contractCmsGrid">
        {contractOptions.map((contract) => <div className={contract.workflowType === 'contract-controlled' ? 'contractCmsCard controlled' : 'contractCmsCard'} key={contract.id}><strong>{contract.label}</strong><span>{contract.agency}</span><p>{contract.description}</p><em>{contract.workflowType}</em><small>Seat layouts: {contract.allowedSeatLayoutIds.length || 'standard matrix'} • Required docs: {contract.requiredDocumentTypes.join(', ') || 'none'}</small></div>)}
      </div>
      <div className="configNotice inlineNotice"><p><strong>Future approval item added:</strong> contract-controlled quotes will require an approval workflow before final quote release. This is tracked for brainstorming and should not block the current CMS activation work.</p></div>
    </ConfigSection>
  );
}

export function AdminConfigPage() {
  return (
    <section className="contentCard pageCard adminConfigPage">
      <div className="pageHero adminHero"><div><h1>Admin Configuration</h1><p>V2 CMS foundation: database-backed CMS controls for seat layouts, contract programs, routing, SLA, and permissions.</p></div><div className="statusSearch">CMS DB Active</div></div>
      <div className="configNotice"><Lock size={18} /><p><strong>V2 CMS activation:</strong> seat layout templates now load from and save to Neon. Contract program seed data is live in the CMS database.</p></div>
      <div className="configStatsGrid"><ConfigStat label="Chassis Platforms" value={busSpecMatrixData.chassis.length} /><ConfigStat label="Wheelbases" value={busSpecMatrixData.wheelbases.length} /><ConfigStat label="Bus Types" value={busSpecMatrixData.busTypes.length} /><ConfigStat label="Option Categories" value={featureOptionCategories.length} /><ConfigStat label="Feature Options" value={featureOptions.length} /><ConfigStat label="Seat Layouts" value={seatCmsConfig.layouts.length} /></div>
      <ContractConfigSection />
      <ConfigSection icon={<Database size={22} />} title="Vehicle Matrix" description="Base RFQ selection rules for chassis, certifications, wheelbases, and bus types."><div className="configTable matrixTable"><div className="configTableHead"><span>Type</span><span>Name</span><span>Description</span><span>Status</span></div>{busSpecMatrixData.chassis.map((item) => <div key={item.id}><strong>Chassis</strong><span>{item.name}</span><span>{item.description}</span><em>{item.active ? 'Active' : 'Inactive'}</em></div>)}{busSpecMatrixData.wheelbases.slice(0, 8).map((item) => <div key={item.id}><strong>Wheelbase</strong><span>{item.name}</span><span>{item.description}</span><em>{item.active ? 'Active' : 'Inactive'}</em></div>)}</div></ConfigSection>
      <ConfigSection icon={<Settings size={22} />} title="Feature Options" description="Customer-facing V2 option categories and available option records."><div className="configCardsGrid">{featureOptionCategories.map((category) => { const count = featureOptions.filter((option) => option.categoryId === category.id).length; return <div className="configMiniCard" key={category.id}><strong>{category.title}</strong><span>{category.description}</span><em>{count} options</em></div>; })}</div></ConfigSection>
      <ConfigSection icon={<Database size={22} />} title="Seat Layout Builder" description="Configure reusable row-by-row seat templates that feed the customer-facing Seats RFQ intake." status="Database-backed CMS"><SeatLayoutBuilder /></ConfigSection>
      <ConfigSection icon={<Database size={22} />} title="Seat Option Lists" description="Reusable seat materials, colors, restraints, and seat style values."><div className="configPillRow">{seatCmsConfig.materials.map((item) => <span key={item}>Material: {item}</span>)}{seatCmsConfig.colors.map((item) => <span key={item}>Color: {item}</span>)}{seatCmsConfig.restraintTypes.map((item) => <span key={item}>Restraint: {item}</span>)}{seatCmsConfig.seatTypes.map((item) => <span key={item}>Seat Type: {item}</span>)}</div></ConfigSection>
      <section className="configTwoColumn"><ConfigSection icon={<Route size={22} />} title="Routing Rules" description="Baseline assignment and future approval rules prepared for V2 queue management."><div className="configSimpleList">{routingRules.map((rule) => <p key={rule.name}><strong>{rule.name}</strong><span>{rule.rule}</span><em>{rule.owner} • {rule.status}</em></p>)}</div></ConfigSection><ConfigSection icon={<Timer size={22} />} title="SLA Rules" description="Simple SLA targets for V2 aging and management visibility."><div className="configSimpleList">{slaRules.map((rule) => <p key={rule.name}><strong>{rule.name}</strong><span>{rule.target}</span><em>{rule.status}</em></p>)}</div></ConfigSection></section>
      <ConfigSection icon={<Users size={22} />} title="Roles & Permissions" description="V2 role model shell for future access-control enforcement."><div className="configCardsGrid roleCards">{roles.map((role) => <div className="configMiniCard" key={role.role}><strong>{role.role}</strong><span>{role.permissions}</span><em>V2 permission baseline</em></div>)}</div></ConfigSection>
    </section>
  );
}
