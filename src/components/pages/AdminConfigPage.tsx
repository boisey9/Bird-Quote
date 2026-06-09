import { useMemo, useState, type ReactNode } from 'react';
import { Database, Lock, Route, Settings, Timer, Users } from 'lucide-react';
import { busSpecMatrixData } from '../../data/busSpecMatrix';
import { featureOptionCategories, featureOptions, getSeatLayoutRows, seatCmsConfig } from '../../data/featureOptionMatrix';
import type { SeatLayoutRow, SeatLayoutTemplate } from '../../types/rfq';

const routingRules = [
  { name: 'Commercial RFQs', rule: 'Default to Sales Ops queue', owner: 'Sales Ops', status: 'Seed / V2' },
  { name: 'Accessibility RFQs', rule: 'Flag when wheelchair capacity or rear lift is requested', owner: 'Estimating Team', status: 'Seed / V2' },
  { name: 'Bid / urgent response', rule: 'Mark priority as High when urgent/bid timing is selected', owner: 'Sales Ops', status: 'Planned' }
];

const slaRules = [
  { name: 'Standard RFQ assignment', target: '8 business hours', status: 'Seed / V2' },
  { name: 'Standard quote turnaround', target: '3 business days', status: 'Seed / V2' },
  { name: 'Urgent bid response', target: '1 business day', status: 'Planned' }
];

const roles = [
  { role: 'Dealer', permissions: 'Create RFQ, view own RFQs, track status, add documents' },
  { role: 'Sales Ops', permissions: 'Review queue, assign owner, update status, view documents' },
  { role: 'Manager', permissions: 'View pipeline, manage priority, monitor SLA' },
  { role: 'Admin', permissions: 'Maintain users, roles, seed config, SLA/routing rules' }
];

const positionLabels: Record<string, string> = {
  'passenger-seat': 'Passenger Seat',
  foldaway: 'Foldaway',
  'wheelchair-space': 'Wheelchair Space',
  empty: 'Empty',
  aisle: 'Aisle',
  lounge: 'Lounge',
  'perimeter-seat': 'Perimeter Seat'
};

function ConfigStat({ label, value }: { label: string; value: number | string }) {
  return <div className="configStat"><strong>{value}</strong><span>{label}</span></div>;
}

function ConfigSection({ icon, title, description, children, status = 'Read-only V2 seed config' }: { icon: ReactNode; title: string; description: string; children: ReactNode; status?: string }) {
  return (
    <section className="panel configSection">
      <div className="configSectionHeader">
        <span>{icon}</span>
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
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
      <div>
        {Array.from({ length: leftMarkers }).map((_, index) => <i className={`adminSeatMarker ${row.leftPositionType}`} key={`left-${index}`} />)}
      </div>
      <span />
      <div>
        {Array.from({ length: rightMarkers }).map((_, index) => <i className={`adminSeatMarker ${row.rightPositionType}`} key={`right-${index}`} />)}
      </div>
    </div>
  );
}

function SeatLayoutBuilder() {
  const [selectedLayoutId, setSelectedLayoutId] = useState(seatCmsConfig.layouts[0]?.id ?? '');
  const selectedLayout = seatCmsConfig.layouts.find((layout) => layout.id === selectedLayoutId) ?? seatCmsConfig.layouts[0];
  const rows = useMemo(() => getSeatLayoutRows(selectedLayout?.id ?? ''), [selectedLayout?.id]);
  const rules = seatCmsConfig.rules.filter((rule) => rule.layoutId === selectedLayout?.id);
  const configuredSeatTotal = rows.reduce((sum, row) => sum + rowSeatTotal(row), 0);
  const wheelchairRows = rows.filter((row) => row.leftPositionType === 'wheelchair-space' || row.rightPositionType === 'wheelchair-space').length;

  if (!selectedLayout) return null;

  return (
    <div className="seatBuilderShell">
      <div className="seatBuilderSidebar">
        <strong>Layout Templates</strong>
        <small>CMS-managed by model, contract, wheelbase, and certification.</small>
        <div className="seatTemplateList">
          {seatCmsConfig.layouts.map((layout) => {
            const rowCount = getSeatLayoutRows(layout.id).length;
            return (
              <button type="button" className={layout.id === selectedLayout.id ? 'active' : ''} key={layout.id} onClick={() => setSelectedLayoutId(layout.id)}>
                <span>{layout.title}</span>
                <em>{rowCount} rows • max {layout.maxSeats}</em>
              </button>
            );
          })}
        </div>
      </div>

      <div className="seatBuilderMain">
        <div className="seatBuilderHeader">
          <div>
            <small>Selected CMS Template</small>
            <h3>{selectedLayout.title}</h3>
            <p>{selectedLayout.description}</p>
          </div>
          <div className="seatBuilderActions">
            <button type="button" className="btn btn-secondary btn-sm" disabled>Duplicate Template</button>
            <button type="button" className="btn btn-primary btn-sm" disabled>Save Template</button>
          </div>
        </div>

        <div className="seatBuilderStats">
          <ConfigStat label="Configured Row Seats" value={configuredSeatTotal} />
          <ConfigStat label="Capacity Hint" value={selectedLayout.maxSeats} />
          <ConfigStat label="Wheelchair Rows" value={wheelchairRows} />
          <ConfigStat label="Rear Lift Compatible" value={selectedLayout.rearLiftCompatible ? 'Yes' : 'No'} />
        </div>

        <div className="seatBuilderRules">
          <h4>Availability Rules</h4>
          {rules.map((rule) => (
            <p key={rule.layoutId}>
              <strong>Chassis</strong><span>{rule.chassisIds.length ? rule.chassisIds.join(', ') : 'Any'}</span>
              <strong>Bus Type</strong><span>{rule.busTypeIds.length ? rule.busTypeIds.join(', ') : 'Any'}</span>
              <strong>Wheelbase</strong><span>{rule.wheelbaseIds.length ? rule.wheelbaseIds.join(', ') : 'Any'}</span>
            </p>
          ))}
        </div>

        <div className="seatRowsBuilder">
          <div className="seatRowsHeader">
            <h4>Configured Rows / Zones</h4>
            <button type="button" className="btn btn-secondary btn-sm" disabled>Add Row</button>
          </div>
          {rows.length === 0 && <div className="configNotice inlineNotice"><p>No configured rows yet for this layout.</p></div>}
          {rows.map((row) => (
            <div className="seatBuilderRow" key={row.id}>
              <div className="rowMeta">
                <strong>Row {row.rowNumber}</strong>
                <span>{row.zone}</span>
              </div>
              <SeatRowVisualizer row={row} />
              <div className="rowConfigGrid">
                <label><span>Left Position</span><select value={row.leftPositionType} disabled><option>{positionLabels[row.leftPositionType]}</option></select></label>
                <label><span>Left Count</span><input value={row.seatCountLeft} disabled /></label>
                <label><span>Right Position</span><select value={row.rightPositionType} disabled><option>{positionLabels[row.rightPositionType]}</option></select></label>
                <label><span>Right Count</span><input value={row.seatCountRight} disabled /></label>
              </div>
              <div className="allowedStyles">
                <strong>Allowed Seat Styles</strong>
                <div>{row.allowedSeatStyles.map((style) => <span key={style}>{style}</span>)}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="configNotice inlineNotice">
          <Lock size={18} />
          <p><strong>Next CMS phase:</strong> enable editable rows, contract selection, model type filters, and save-to-database. V2 currently uses seed configuration so the customer RFQ screen can consume stable templates.</p>
        </div>
      </div>
    </div>
  );
}

export function AdminConfigPage() {
  return (
    <section className="contentCard pageCard adminConfigPage">
      <div className="pageHero adminHero">
        <div>
          <h1>Admin Configuration</h1>
          <p>V2 CMS foundation: read-only seed configuration for chassis, options, seats, routing, SLA, and permissions.</p>
        </div>
        <div className="statusSearch">CMS Foundation</div>
      </div>

      <div className="configNotice">
        <Lock size={18} />
        <p><strong>V2 scope:</strong> this is intentionally a configuration viewer, not a full CMS editor yet. The data structure is being stabilized first so admin-managed rules can be added safely later.</p>
      </div>

      <div className="configStatsGrid">
        <ConfigStat label="Chassis Platforms" value={busSpecMatrixData.chassis.length} />
        <ConfigStat label="Wheelbases" value={busSpecMatrixData.wheelbases.length} />
        <ConfigStat label="Bus Types" value={busSpecMatrixData.busTypes.length} />
        <ConfigStat label="Option Categories" value={featureOptionCategories.length} />
        <ConfigStat label="Feature Options" value={featureOptions.length} />
        <ConfigStat label="Seat Layouts" value={seatCmsConfig.layouts.length} />
      </div>

      <ConfigSection icon={<Database size={22} />} title="Vehicle Matrix" description="Base RFQ selection rules for chassis, certifications, wheelbases, and bus types.">
        <div className="configTable matrixTable">
          <div className="configTableHead"><span>Type</span><span>Name</span><span>Description</span><span>Status</span></div>
          {busSpecMatrixData.chassis.map((item) => <div key={item.id}><strong>Chassis</strong><span>{item.name}</span><span>{item.description}</span><em>{item.active ? 'Active' : 'Inactive'}</em></div>)}
          {busSpecMatrixData.wheelbases.slice(0, 8).map((item) => <div key={item.id}><strong>Wheelbase</strong><span>{item.name}</span><span>{item.description}</span><em>{item.active ? 'Active' : 'Inactive'}</em></div>)}
        </div>
      </ConfigSection>

      <ConfigSection icon={<Settings size={22} />} title="Feature Options" description="Customer-facing V2 option categories and available option records.">
        <div className="configCardsGrid">
          {featureOptionCategories.map((category) => {
            const count = featureOptions.filter((option) => option.categoryId === category.id).length;
            return <div className="configMiniCard" key={category.id}><strong>{category.title}</strong><span>{category.description}</span><em>{count} options</em></div>;
          })}
        </div>
      </ConfigSection>

      <ConfigSection icon={<Database size={22} />} title="Seat Layout Builder" description="Configure reusable row-by-row seat templates that feed the customer-facing Seats RFQ intake." status="CMS builder shell">
        <SeatLayoutBuilder />
      </ConfigSection>

      <ConfigSection icon={<Database size={22} />} title="Seat Option Lists" description="Reusable seat materials, colors, restraints, and seat style values.">
        <div className="configPillRow">
          {seatCmsConfig.materials.map((item) => <span key={item}>Material: {item}</span>)}
          {seatCmsConfig.colors.map((item) => <span key={item}>Color: {item}</span>)}
          {seatCmsConfig.restraintTypes.map((item) => <span key={item}>Restraint: {item}</span>)}
          {seatCmsConfig.seatTypes.map((item) => <span key={item}>Seat Type: {item}</span>)}
        </div>
      </ConfigSection>

      <section className="configTwoColumn">
        <ConfigSection icon={<Route size={22} />} title="Routing Rules" description="Baseline assignment rules prepared for V2 queue management.">
          <div className="configSimpleList">
            {routingRules.map((rule) => <p key={rule.name}><strong>{rule.name}</strong><span>{rule.rule}</span><em>{rule.owner} • {rule.status}</em></p>)}
          </div>
        </ConfigSection>

        <ConfigSection icon={<Timer size={22} />} title="SLA Rules" description="Simple SLA targets for V2 aging and management visibility.">
          <div className="configSimpleList">
            {slaRules.map((rule) => <p key={rule.name}><strong>{rule.name}</strong><span>{rule.target}</span><em>{rule.status}</em></p>)}
          </div>
        </ConfigSection>
      </section>

      <ConfigSection icon={<Users size={22} />} title="Roles & Permissions" description="V2 role model shell for future access-control enforcement.">
        <div className="configCardsGrid roleCards">
          {roles.map((role) => <div className="configMiniCard" key={role.role}><strong>{role.role}</strong><span>{role.permissions}</span><em>V2 permission baseline</em></div>)}
        </div>
      </ConfigSection>
    </section>
  );
}
