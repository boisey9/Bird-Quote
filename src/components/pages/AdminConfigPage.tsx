import { useState, type ReactNode } from 'react';
import { Database, Grid3X3, Lock, Route, Settings, Timer, Users } from 'lucide-react';
import { busSpecMatrixData } from '../../data/busSpecMatrix';
import { contractOptions } from '../../data/contractConfig';
import { featureOptions } from '../../data/featureOptionMatrix';
import { floorPlanMaster, floorPlanSeatTypes, floorPlanZones } from '../../data/floorPlanGrid';
import { ContractProgramAdminEditor } from './ContractProgramAdminEditor';
import { FeatureOptionsAdminEditor } from './FeatureOptionsAdminEditor';
import { FloorPlanAdminEditor } from './FloorPlanAdminEditor';
import { PortalProfilesAdminEditor } from './PortalProfilesAdminEditor';
import { RolesPermissionsAdminEditor } from './RolesPermissionsAdminEditor';
import { RoutingSlaAdminEditor } from './RoutingSlaAdminEditor';
import { SeatOptionListsAdminEditor } from './SeatOptionListsAdminEditor';
import { VehicleMatrixAdminEditor } from './VehicleMatrixAdminEditor';
import { VehicleMediaAdminEditor } from './VehicleMediaAdminEditor';
import { WeightBalanceAdminEditor } from './WeightBalanceAdminEditor';
import './AdminCms.css';

type CmsPageKey = 'contracts' | 'vehicle' | 'features' | 'floorplans' | 'routing' | 'roles';
type CmsPage = { key: CmsPageKey; title: string; description: string; icon: ReactNode; status: string };

const cmsPages: CmsPage[] = [
  { key: 'contracts', title: 'Contract Program Management', description: 'Contract keys and program rules.', icon: <Route size={20} />, status: 'Foundation' },
  { key: 'vehicle', title: 'Vehicle / Chassis Matrix Management', description: 'Chassis, certifications, wheelbases, and bus types.', icon: <Database size={20} />, status: 'Backend CMS' },
  { key: 'features', title: 'Features & Options Management', description: 'Options and compatibility rules.', icon: <Settings size={20} />, status: 'Backend CMS' },
  { key: 'floorplans', title: 'Floorplan Management', description: 'Floorplans, seat lists, and weight estimates.', icon: <Grid3X3 size={20} />, status: 'Backend CMS' },
  { key: 'routing', title: 'Routing Rules & SLA Rules', description: 'Assignment, priority, and SLA targets.', icon: <Timer size={20} />, status: 'Backend CMS' },
  { key: 'roles', title: 'Roles & Permissions', description: 'Profiles, roles, permissions, and assignments.', icon: <Users size={20} />, status: 'Backend CMS' }
];

function ConfigStat({ label, value }: { label: string; value: number | string }) { return <div className="configStat"><strong>{value}</strong><span>{label}</span></div>; }
function ConfigSection({ icon, title, description, children, status = 'Config area' }: { icon: ReactNode; title: string; description: string; children: ReactNode; status?: string }) { return <section className="panel configSection"><div className="configSectionHeader"><span>{icon}</span><div><h2>{title}</h2><p>{description}</p></div><em>{status}</em></div>{children}</section>; }
function ContractProgramPage() { return <div className="cmsPageStack"><ConfigSection icon={<Route size={22} />} title="Contract Programs" description="Manage contract keys used across the RFQ app." status="Backend CMS"><ContractProgramAdminEditor /></ConfigSection></div>; }
function VehicleMatrixPage() { return <div className="cmsPageStack"><ConfigSection icon={<Database size={22} />} title="Vehicle / Chassis Matrix" description="Manage vehicle selection data." status="Backend CMS"><VehicleMatrixAdminEditor /></ConfigSection><ConfigSection icon={<Database size={22} />} title="Vehicle Images / Media" description="Manage image URLs used on selection cards." status="CMS media fields"><VehicleMediaAdminEditor /></ConfigSection></div>; }
function FeaturesOptionsPage() { return <ConfigSection icon={<Settings size={22} />} title="Features & Options CMS" description="Manage feature options and rules." status="Backend CMS"><FeatureOptionsAdminEditor /></ConfigSection>; }
function FloorplanManagementPage() { return <div className="cmsPageStack"><ConfigSection icon={<Grid3X3 size={22} />} title="Floorplan Grid Editor" description="Manage customer-facing seat layout templates." status="Backend CMS"><FloorPlanAdminEditor /></ConfigSection><ConfigSection icon={<Database size={22} />} title="Seat Option Lists" description="Manage reusable seat dropdown values." status="Backend CMS"><SeatOptionListsAdminEditor /></ConfigSection><ConfigSection icon={<Database size={22} />} title="Weight & Balance" description="Manage sales-estimate weight profiles, option weights, and balance zones." status="Backend CMS"><WeightBalanceAdminEditor /></ConfigSection></div>; }
function RoutingSlaPage() { return <ConfigSection icon={<Timer size={22} />} title="Routing Rules & SLA Rules" description="Manage RFQ routing and SLA targets." status="Backend CMS"><RoutingSlaAdminEditor /></ConfigSection>; }
function RolesPermissionsPage() { return <div className="cmsPageStack"><ConfigSection icon={<Users size={22} />} title="Portal Profiles" description="Map login profiles to roles and dealers." status="Backend CMS"><PortalProfilesAdminEditor /></ConfigSection><ConfigSection icon={<Users size={22} />} title="Roles & Permissions" description="Manage roles, permissions, and assignments." status="Backend CMS"><RolesPermissionsAdminEditor /></ConfigSection></div>; }
function ActiveCmsPage({ page }: { page: CmsPageKey }) { if (page === 'contracts') return <ContractProgramPage />; if (page === 'vehicle') return <VehicleMatrixPage />; if (page === 'features') return <FeaturesOptionsPage />; if (page === 'floorplans') return <FloorplanManagementPage />; if (page === 'routing') return <RoutingSlaPage />; return <RolesPermissionsPage />; }

export function AdminConfigPage() {
  const [activePage, setActivePage] = useState<CmsPageKey>('contracts');
  return <section className="contentCard pageCard adminConfigPage cmsManagementPage"><div className="pageHero adminHero"><div><h1>Admin Configuration</h1><p>CMS management center for RFQ rules, matrix data, floorplans, workflow, and permissions.</p></div><div className="statusSearch">CMS Management</div></div><div className="configNotice"><Lock size={18} /><p><strong>Management structure:</strong> config is split into focused CMS pages.</p></div><div className="configStatsGrid cmsStatsGrid"><ConfigStat label="Contracts" value={contractOptions.length} /><ConfigStat label="Vehicle Matrix Items" value={busSpecMatrixData.chassis.length + busSpecMatrixData.certifications.length + busSpecMatrixData.wheelbases.length + busSpecMatrixData.busTypes.length} /><ConfigStat label="Feature Options" value={featureOptions.length} /><ConfigStat label="Floorplan Seed Grids" value={floorPlanMaster.length} /><ConfigStat label="Grid Zones / Seat Types" value={`${floorPlanZones.length} / ${floorPlanSeatTypes.length}`} /><ConfigStat label="Config Areas" value="6" /></div><div className="cmsConfigLayout"><aside className="cmsConfigNav">{cmsPages.map((page) => <button type="button" className={activePage === page.key ? 'active' : ''} key={page.key} onClick={() => setActivePage(page.key)}><span>{page.icon}</span><strong>{page.title}</strong><small>{page.description}</small><em>{page.status}</em></button>)}</aside><main className="cmsConfigContent"><ActiveCmsPage page={activePage} /></main></div></section>;
}
