import { useState, type ReactNode } from 'react';
import { Database, Grid3X3, Lock, Route, Settings, ShieldCheck, Timer, Users } from 'lucide-react';
import { busSpecMatrixData } from '../../data/busSpecMatrix';
import { contractOptions } from '../../data/contractConfig';
import { featureOptionCategories, featureOptions, seatCmsConfig } from '../../data/featureOptionMatrix';
import { floorPlanMaster, floorPlanSeatTypes, floorPlanZones } from '../../data/floorPlanGrid';
import { ContractProgramAdminEditor } from './ContractProgramAdminEditor';
import { FloorPlanAdminEditor } from './FloorPlanAdminEditor';
import './AdminCms.css';

type CmsPageKey = 'contracts' | 'vehicle' | 'features' | 'floorplans' | 'routing' | 'roles';

type CmsPage = {
  key: CmsPageKey;
  title: string;
  description: string;
  icon: ReactNode;
  status: string;
};

const cmsPages: CmsPage[] = [
  { key: 'contracts', title: 'Contract Program Management', description: 'Manage contract keys, agency rules, required documents, and contract-controlled workflows.', icon: <Route size={20} />, status: 'Foundation' },
  { key: 'vehicle', title: 'Vehicle / Chassis Matrix Management', description: 'Manage chassis, certifications, wheelbases, bus types, and contract eligibility rules.', icon: <Database size={20} />, status: 'Matrix' },
  { key: 'features', title: 'Features & Options Management', description: 'Manage customer-facing options and contract-specific option availability rules.', icon: <Settings size={20} />, status: 'Options' },
  { key: 'floorplans', title: 'Floorplan Management', description: 'Manage floorplan grids, contract rules, seat option lists, and customer-facing layout choices.', icon: <Grid3X3 size={20} />, status: 'Backend CMS' },
  { key: 'routing', title: 'Routing Rules & SLA Rules', description: 'Manage assignment, priority, approval routing, and turnaround targets.', icon: <Timer size={20} />, status: 'Workflow' },
  { key: 'roles', title: 'Roles & Permissions', description: 'Manage access levels for Dealer, Internal, Manager, and Admin users.', icon: <Users size={20} />, status: 'Access' }
];

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

function ConfigSection({ icon, title, description, children, status = 'Config area' }: { icon: ReactNode; title: string; description: string; children: ReactNode; status?: string }) {
  return <section className="panel configSection"><div className="configSectionHeader"><span>{icon}</span><div><h2>{title}</h2><p>{description}</p></div><em>{status}</em></div>{children}</section>;
}

function RulePlaceholder({ title, description }: { title: string; description: string }) {
  return <div className="cmsRulePlaceholder"><ShieldCheck size={18} /><div><strong>{title}</strong><p>{description}</p></div><span>Rule table next</span></div>;
}

function ContractProgramPage() {
  return (
    <div className="cmsPageStack">
      <ConfigSection icon={<Route size={22} />} title="Contract Programs" description="Create, edit, duplicate, delete, retire, and save contract keys used across the RFQ app." status="Backend CMS">
        <ContractProgramAdminEditor />
      </ConfigSection>
      <ConfigSection icon={<Lock size={22} />} title="Contract Rule Coverage" description="Coverage index showing where each contract controls vehicle, options, floorplans, documents, and approvals." status="Sprint 1 foundation">
        <div className="configCardsGrid">
          <RulePlaceholder title="Vehicle eligibility rules" description="Contract-to-chassis, certification, wheelbase, and bus type permissions. Full editor comes in Sprint 2." />
          <RulePlaceholder title="Feature option rules" description="Contract-specific available, required, recommended, or hidden options. Full editor comes in Sprint 3." />
          <RulePlaceholder title="Floorplan rules" description="Contract-specific seating layouts and floorplan eligibility. Already started in Floorplan Management." />
          <RulePlaceholder title="Document rules" description="Required bid, floorplan, signed contract, or agency documents. Contract documents are editable in the contract record now." />
        </div>
      </ConfigSection>
    </div>
  );
}

function VehicleMatrixPage() {
  return (
    <div className="cmsPageStack">
      <ConfigSection icon={<Database size={22} />} title="Vehicle / Chassis Matrix" description="Controlled dropdown source for chassis, certification, wheelbase, and bus type selection." status="Matrix source">
        <div className="configTable matrixTable"><div className="configTableHead"><span>Type</span><span>Name</span><span>Description</span><span>Status</span></div>{busSpecMatrixData.chassis.map((item) => <div key={item.id}><strong>Chassis</strong><span>{item.name}</span><span>{item.description}</span><em>{item.active ? 'Active' : 'Inactive'}</em></div>)}{busSpecMatrixData.certifications.map((item) => <div key={item.id}><strong>Certification</strong><span>{item.name}</span><span>{item.description}</span><em>{item.active ? 'Active' : 'Inactive'}</em></div>)}{busSpecMatrixData.wheelbases.map((item) => <div key={item.id}><strong>Wheelbase</strong><span>{item.name}</span><span>{item.description}</span><em>{item.active ? 'Active' : 'Inactive'}</em></div>)}{busSpecMatrixData.busTypes.map((item) => <div key={item.id}><strong>Bus Type</strong><span>{item.name}</span><span>{item.description}</span><em>{item.active ? 'Active' : 'Inactive'}</em></div>)}</div>
      </ConfigSection>
      <ConfigSection icon={<ShieldCheck size={22} />} title="Contract Vehicle Rules" description="Contract-specific vehicle matrix rules will be managed here." status="Planned backend CRUD">
        <div className="configCardsGrid">
          <RulePlaceholder title="Allowed chassis by contract" description="Example: MnDOT may allow only selected chassis platforms." />
          <RulePlaceholder title="Allowed wheelbases by contract" description="Control wheelbase dropdown visibility by contract key and chassis." />
          <RulePlaceholder title="Certification restrictions" description="Limit certification packages by contract, chassis, and bus type." />
          <RulePlaceholder title="Bus type restrictions" description="Control commercial, school, shuttle, airport, hotel, and specialty applications." />
        </div>
      </ConfigSection>
    </div>
  );
}

function FeaturesOptionsPage() {
  return (
    <div className="cmsPageStack">
      <ConfigSection icon={<Settings size={22} />} title="Feature Categories" description="Customer-facing V2 option categories and available option records." status="Option source">
        <div className="configCardsGrid">{featureOptionCategories.map((category) => { const count = featureOptions.filter((option) => option.categoryId === category.id).length; return <div className="configMiniCard" key={category.id}><strong>{category.title}</strong><span>{category.description}</span><em>{category.active ? `${count} options` : `Hidden • ${count} options`}</em></div>; })}</div>
      </ConfigSection>
      <ConfigSection icon={<Database size={22} />} title="Feature Option Records" description="Individual option records shown in Options & Packages." status="Current static records">
        <div className="configTable optionRecordTable"><div className="configTableHead"><span>Category</span><span>Option</span><span>Description</span><span>Status</span></div>{featureOptions.map((option) => { const category = featureOptionCategories.find((item) => item.id === option.categoryId); return <div key={option.id}><strong>{category?.title ?? 'Unmapped'}</strong><span>{option.title}</span><span>{option.description}</span><em>{option.active ? 'Active' : 'Inactive'}</em></div>; })}</div>
      </ConfigSection>
      <ConfigSection icon={<ShieldCheck size={22} />} title="Contract Feature Rules" description="Contract-specific feature option availability will be managed here." status="Planned backend CRUD">
        <div className="configCardsGrid">
          <RulePlaceholder title="Available options" description="Show or hide option cards by contract key." />
          <RulePlaceholder title="Required options" description="Force required options for specific contract programs." />
          <RulePlaceholder title="Recommended options" description="Pre-highlight recommended options without forcing selection." />
          <RulePlaceholder title="Document-triggering options" description="Require supporting files when certain options are selected." />
        </div>
      </ConfigSection>
    </div>
  );
}

function FloorplanManagementPage() {
  return (
    <div className="cmsPageStack">
      <ConfigSection icon={<Grid3X3 size={22} />} title="Floorplan Grid Editor" description="Admin source of truth for customer-facing Seat Layout Templates. Active dealer-visible grids are converted into seat layout choices at runtime." status="Backend CMS">
        <FloorPlanAdminEditor />
      </ConfigSection>
      <ConfigSection icon={<Database size={22} />} title="Seat Option Lists" description="Reusable seat materials, colors, restraints, grab types, and seat style values used by the Seats step." status="Seat source lists">
        <div className="configPillRow">{seatCmsConfig.materials.map((item) => <span key={item}>Material: {item}</span>)}{seatCmsConfig.colors.map((item) => <span key={item}>Color: {item}</span>)}{seatCmsConfig.restraintTypes.map((item) => <span key={item}>Restraint: {item}</span>)}{seatCmsConfig.armrests.map((item) => <span key={item}>Armrest: {item}</span>)}{seatCmsConfig.grabTypes.map((item) => <span key={item}>Grab: {item}</span>)}{seatCmsConfig.seatTypes.map((item) => <span key={item}>Seat Type: {item}</span>)}</div>
      </ConfigSection>
    </div>
  );
}

function RoutingSlaPage() {
  return (
    <section className="configTwoColumn cmsPageStack"><ConfigSection icon={<Route size={22} />} title="Routing Rules" description="Baseline assignment and future approval rules prepared for V2 queue management." status="Workflow rules"><div className="configSimpleList">{routingRules.map((rule) => <p key={rule.name}><strong>{rule.name}</strong><span>{rule.rule}</span><em>{rule.owner} • {rule.status}</em></p>)}</div></ConfigSection><ConfigSection icon={<Timer size={22} />} title="SLA Rules" description="Simple SLA targets for V2 aging and management visibility." status="SLA rules"><div className="configSimpleList">{slaRules.map((rule) => <p key={rule.name}><strong>{rule.name}</strong><span>{rule.target}</span><em>{rule.status}</em></p>)}</div></ConfigSection></section>
  );
}

function RolesPermissionsPage() {
  return <ConfigSection icon={<Users size={22} />} title="Roles & Permissions" description="V2 role model shell for future access-control enforcement." status="Access model"><div className="configCardsGrid roleCards">{roles.map((role) => <div className="configMiniCard" key={role.role}><strong>{role.role}</strong><span>{role.permissions}</span><em>V2 permission baseline</em></div>)}</div></ConfigSection>;
}

function ActiveCmsPage({ page }: { page: CmsPageKey }) {
  if (page === 'contracts') return <ContractProgramPage />;
  if (page === 'vehicle') return <VehicleMatrixPage />;
  if (page === 'features') return <FeaturesOptionsPage />;
  if (page === 'floorplans') return <FloorplanManagementPage />;
  if (page === 'routing') return <RoutingSlaPage />;
  return <RolesPermissionsPage />;
}

export function AdminConfigPage() {
  const [activePage, setActivePage] = useState<CmsPageKey>('contracts');

  return (
    <section className="contentCard pageCard adminConfigPage cmsManagementPage">
      <div className="pageHero adminHero"><div><h1>Admin Configuration</h1><p>CMS management center for RFQ rules, matrix data, floorplans, workflow, and permissions.</p></div><div className="statusSearch">CMS Management</div></div>
      <div className="configNotice"><Lock size={18} /><p><strong>Management structure:</strong> config is now split into focused CMS pages so each ruleset can become backend-managed without crowding one long admin screen.</p></div>
      <div className="configStatsGrid cmsStatsGrid">
        <ConfigStat label="Contracts" value={contractOptions.length} />
        <ConfigStat label="Vehicle Matrix Items" value={busSpecMatrixData.chassis.length + busSpecMatrixData.certifications.length + busSpecMatrixData.wheelbases.length + busSpecMatrixData.busTypes.length} />
        <ConfigStat label="Feature Options" value={featureOptions.length} />
        <ConfigStat label="Floorplan Seed Grids" value={floorPlanMaster.length} />
        <ConfigStat label="Grid Zones / Seat Types" value={`${floorPlanZones.length} / ${floorPlanSeatTypes.length}`} />
        <ConfigStat label="Roles" value={roles.length} />
      </div>
      <div className="cmsConfigLayout">
        <aside className="cmsConfigNav">
          {cmsPages.map((page) => <button type="button" className={activePage === page.key ? 'active' : ''} key={page.key} onClick={() => setActivePage(page.key)}><span>{page.icon}</span><strong>{page.title}</strong><small>{page.description}</small><em>{page.status}</em></button>)}
        </aside>
        <main className="cmsConfigContent">
          <ActiveCmsPage page={activePage} />
        </main>
      </div>
    </section>
  );
}
