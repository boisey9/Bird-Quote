import { Database, Lock, Route, Settings, Timer, Users } from 'lucide-react';
import { busSpecMatrixData } from '../../data/busSpecMatrix';
import { featureOptionCategories, featureOptions, seatCmsConfig } from '../../data/featureOptionMatrix';

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

function ConfigStat({ label, value }: { label: string; value: number | string }) {
  return <div className="configStat"><strong>{value}</strong><span>{label}</span></div>;
}

function ConfigSection({ icon, title, description, children }: { icon: React.ReactNode; title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="panel configSection">
      <div className="configSectionHeader">
        <span>{icon}</span>
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <em>Read-only V2 seed config</em>
      </div>
      {children}
    </section>
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

      <ConfigSection icon={<Database size={22} />} title="Seat Configuration" description="CMS-ready seat layout templates, rules, and option lists used by the customer-facing Seats module.">
        <div className="configCardsGrid seatConfigCards">
          {seatCmsConfig.layouts.map((layout) => (
            <div className="configMiniCard" key={layout.id}>
              <strong>{layout.title}</strong>
              <span>{layout.description}</span>
              <em>Max hint: {layout.maxSeats} • {layout.layoutType}</em>
            </div>
          ))}
        </div>
        <div className="configPillRow">
          {seatCmsConfig.materials.map((item) => <span key={item}>Material: {item}</span>)}
          {seatCmsConfig.colors.map((item) => <span key={item}>Color: {item}</span>)}
          {seatCmsConfig.restraintTypes.map((item) => <span key={item}>Restraint: {item}</span>)}
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
