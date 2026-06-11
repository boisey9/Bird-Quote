import { type ReactNode } from 'react';
import { Database, Grid3X3, Lock, Route, Settings, Timer, Users } from 'lucide-react';
import { busSpecMatrixData } from '../../data/busSpecMatrix';
import { contractOptions } from '../../data/contractConfig';
import { featureOptionCategories, featureOptions, seatCmsConfig } from '../../data/featureOptionMatrix';
import { floorPlanMaster, floorPlanSeatTypes, floorPlanZones } from '../../data/floorPlanGrid';
import { FloorPlanAdminEditor } from './FloorPlanAdminEditor';
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

function ConfigStat({ label, value }: { label: string; value: number | string }) {
  return <div className="configStat"><strong>{value}</strong><span>{label}</span></div>;
}

function ConfigSection({ icon, title, description, children, status = 'Read-only V2 seed config' }: { icon: ReactNode; title: string; description: string; children: ReactNode; status?: string }) {
  return <section className="panel configSection"><div className="configSectionHeader"><span>{icon}</span><div><h2>{title}</h2><p>{description}</p></div><em>{status}</em></div>{children}</section>;
}

function ContractConfigSection() {
  return (
    <ConfigSection icon={<Route size={22} />} title="Contract Programs" description="Contract-controlled RFQs can restrict model choices, required documents, seating templates, workflow, and future approval routing." status="Active DB CMS">
      <div className="contractCmsGrid">
        {contractOptions.map((contract) => (
          <div className={contract.workflowType === 'contract-controlled' ? 'contractCmsCard controlled' : 'contractCmsCard'} key={contract.id}>
            <strong>{contract.label}</strong>
            <span>{contract.agency}</span>
            <p>{contract.description}</p>
            <em>{contract.workflowType}</em>
            <small>Seat layouts: {contract.allowedSeatLayoutIds.length || 'standard matrix'} • Required docs: {contract.requiredDocumentTypes.join(', ') || 'none'}</small>
          </div>
        ))}
      </div>
      <div className="configNotice inlineNotice"><p><strong>Future approval item added:</strong> contract-controlled quotes will require an approval workflow before final quote release. This is tracked for brainstorming and should not block the current CMS activation work.</p></div>
    </ConfigSection>
  );
}

export function AdminConfigPage() {
  return (
    <section className="contentCard pageCard adminConfigPage">
      <div className="pageHero adminHero"><div><h1>Admin Configuration</h1><p>V2 CMS foundation: seat layout templates, floor plan grid files, contract programs, routing, SLA, and permissions.</p></div><div className="statusSearch">Floor Plan Grid Active</div></div>
      <div className="configNotice"><Lock size={18} /><p><strong>Floor plan grid CMS is active:</strong> layouts are now separated into master templates, zones, seat types, and compatibility rules. Dealer previews remain reference only and final seating is validated by Micro Bird.</p></div>
      <div className="configStatsGrid">
        <ConfigStat label="Chassis Platforms" value={busSpecMatrixData.chassis.length} />
        <ConfigStat label="Wheelbases" value={busSpecMatrixData.wheelbases.length} />
        <ConfigStat label="Bus Types" value={busSpecMatrixData.busTypes.length} />
        <ConfigStat label="Option Categories" value={featureOptionCategories.length} />
        <ConfigStat label="Seat Layouts" value={seatCmsConfig.layouts.length} />
        <ConfigStat label="Floor Plan Grids" value={floorPlanMaster.length} />
        <ConfigStat label="Grid Zones" value={floorPlanZones.length} />
        <ConfigStat label="Grid Seat Types" value={floorPlanSeatTypes.length} />
      </div>

      <ContractConfigSection />

      <ConfigSection icon={<Database size={22} />} title="Vehicle Matrix" description="Base RFQ selection rules for chassis, certifications, wheelbases, and bus types.">
        <div className="configTable matrixTable"><div className="configTableHead"><span>Type</span><span>Name</span><span>Description</span><span>Status</span></div>{busSpecMatrixData.chassis.map((item) => <div key={item.id}><strong>Chassis</strong><span>{item.name}</span><span>{item.description}</span><em>{item.active ? 'Active' : 'Inactive'}</em></div>)}{busSpecMatrixData.wheelbases.slice(0, 8).map((item) => <div key={item.id}><strong>Wheelbase</strong><span>{item.name}</span><span>{item.description}</span><em>{item.active ? 'Active' : 'Inactive'}</em></div>)}</div>
      </ConfigSection>

      <ConfigSection icon={<Settings size={22} />} title="Feature Options" description="Customer-facing V2 option categories and available option records.">
        <div className="configCardsGrid">{featureOptionCategories.map((category) => { const count = featureOptions.filter((option) => option.categoryId === category.id).length; return <div className="configMiniCard" key={category.id}><strong>{category.title}</strong><span>{category.description}</span><em>{count} options</em></div>; })}</div>
      </ConfigSection>

      <ConfigSection icon={<Database size={22} />} title="Seat Layout Templates" description="Reusable seat layout templates that feed the customer-facing Seats RFQ intake." status="Seed CMS">
        <div className="configCardsGrid">{seatCmsConfig.layouts.map((layout) => <div className="configMiniCard" key={layout.id}><strong>{layout.title}</strong><span>{layout.description}</span><em>Max {layout.maxSeats} seats • {layout.market ?? 'any market'}</em></div>)}</div>
      </ConfigSection>

      <ConfigSection icon={<Grid3X3 size={22} />} title="Floor Plan Grid Editor" description="Admin input format for row-span floor plans: FloorPlanMaster, FloorPlanZones, SeatTypes, and CompatibilityRules." status="Grid CMS seed">
        <FloorPlanAdminEditor />
      </ConfigSection>

      <ConfigSection icon={<Database size={22} />} title="Seat Option Lists" description="Reusable seat materials, colors, restraints, and seat style values.">
        <div className="configPillRow">{seatCmsConfig.materials.map((item) => <span key={item}>Material: {item}</span>)}{seatCmsConfig.colors.map((item) => <span key={item}>Color: {item}</span>)}{seatCmsConfig.restraintTypes.map((item) => <span key={item}>Restraint: {item}</span>)}{seatCmsConfig.seatTypes.map((item) => <span key={item}>Seat Type: {item}</span>)}</div>
      </ConfigSection>

      <section className="configTwoColumn"><ConfigSection icon={<Route size={22} />} title="Routing Rules" description="Baseline assignment and future approval rules prepared for V2 queue management."><div className="configSimpleList">{routingRules.map((rule) => <p key={rule.name}><strong>{rule.name}</strong><span>{rule.rule}</span><em>{rule.owner} • {rule.status}</em></p>)}</div></ConfigSection><ConfigSection icon={<Timer size={22} />} title="SLA Rules" description="Simple SLA targets for V2 aging and management visibility."><div className="configSimpleList">{slaRules.map((rule) => <p key={rule.name}><strong>{rule.name}</strong><span>{rule.target}</span><em>{rule.status}</em></p>)}</div></ConfigSection></section>
      <ConfigSection icon={<Users size={22} />} title="Roles & Permissions" description="V2 role model shell for future access-control enforcement."><div className="configCardsGrid roleCards">{roles.map((role) => <div className="configMiniCard" key={role.role}><strong>{role.role}</strong><span>{role.permissions}</span><em>V2 permission baseline</em></div>)}</div></ConfigSection>
    </section>
  );
}
