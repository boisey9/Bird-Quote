import { useRef, useState } from 'react';
import { FileSpreadsheet, Upload } from 'lucide-react';
import { exportCmsExcel, importCmsExcel, sheetRows, type CmsExcelWorkbook } from '../../utils/excelCms';

type SheetMap = Record<string, string>;
type SectionConfig = { label: string; endpoint: string; sheets: SheetMap };

type CmsPayload = Record<string, unknown> & { ok?: boolean; error?: string };

const sections: SectionConfig[] = [
  { label: 'Contracts', endpoint: '/api/cms-contracts', sheets: { ContractPrograms: 'contractPrograms', ContractRuleIndex: 'contractRuleIndex' } },
  { label: 'Vehicle Matrix', endpoint: '/api/cms-vehicle-matrix', sheets: { VehicleChassis: 'chassis', VehicleCertifications: 'certifications', VehicleWheelbases: 'wheelbases', VehicleBusTypes: 'busTypes', VehicleCompatibility: 'compatibility', VehicleContractRules: 'vehicleContractRules' } },
  { label: 'Features & Options', endpoint: '/api/cms-feature-options', sheets: { FeatureCategories: 'categories', FeatureOptions: 'options', FeatureContractRules: 'contractRules' } },
  { label: 'Floorplans', endpoint: '/api/cms-floor-plans', sheets: { FloorPlanMaster: 'floorPlanMaster', FloorPlanZones: 'floorPlanZones', FloorPlanSeatTypes: 'floorPlanSeatTypes', FloorPlanCompatibilityRules: 'floorPlanCompatibilityRules' } },
  { label: 'Seat Option Lists', endpoint: '/api/cms-seat-options', sheets: { SeatOptionValues: 'values' } },
  { label: 'Weight & Balance', endpoint: '/api/cms-weight-balance', sheets: { VehicleProfiles: 'vehicleWeightProfiles', OptionWeights: 'optionWeightItems', BalanceZones: 'balanceZones' } },
  { label: 'Routing / SLA', endpoint: '/api/cms-routing-sla', sheets: { RoutingRules: 'routingRules', SlaRules: 'slaRules' } },
  { label: 'Portal Profiles', endpoint: '/api/cms-user-profiles', sheets: { PortalProfiles: 'profiles' } },
  { label: 'Roles & Permissions', endpoint: '/api/cms-roles-permissions', sheets: { Roles: 'roles', Permissions: 'permissions', RolePermissions: 'rolePermissions' } }
];

async function parseResponse(response: Response, label: string): Promise<CmsPayload> {
  const text = await response.text();
  let payload: CmsPayload;
  try { payload = text ? JSON.parse(text) as CmsPayload : {}; }
  catch { throw new Error(`${label} returned invalid response (${response.status}).`); }
  if (!response.ok || payload.ok === false) throw new Error(payload.error ?? `${label} request failed (${response.status}).`);
  return payload;
}

function getSheetsForSection(payload: CmsPayload, section: SectionConfig) {
  return Object.entries(section.sheets).reduce<Record<string, Record<string, unknown>[]>>((result, [sheetName, payloadKey]) => {
    const rows = payload[payloadKey];
    result[sheetName] = Array.isArray(rows) ? rows as Record<string, unknown>[] : [];
    return result;
  }, {});
}

function hasSectionSheets(workbook: CmsExcelWorkbook, section: SectionConfig) {
  return Object.keys(section.sheets).some((sheetName) => sheetRows(workbook, sheetName).length > 0);
}

function buildPayloadFromWorkbook(base: CmsPayload, workbook: CmsExcelWorkbook, section: SectionConfig) {
  return Object.entries(section.sheets).reduce<CmsPayload>((payload, [sheetName, payloadKey]) => {
    const rows = sheetRows(workbook, sheetName);
    if (rows.length > 0) payload[payloadKey] = rows;
    return payload;
  }, { ...base });
}

export function AdminConfigExcelHub() {
  const [status, setStatus] = useState('Excel import/export is available for the full Admin Config data set.');
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function exportAll() {
    setBusy(true);
    setStatus('Building full Admin Config Excel workbook...');
    try {
      const workbook: CmsExcelWorkbook = {};
      for (const section of sections) {
        const payload = await parseResponse(await fetch(section.endpoint), section.label);
        Object.assign(workbook, getSheetsForSection(payload, section));
      }
      exportCmsExcel('rfq-admin-config-export.xlsx', workbook);
      setStatus('Full Admin Config Excel workbook exported.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to export Admin Config Excel workbook.');
    } finally {
      setBusy(false);
    }
  }

  async function importAll(file: File | null) {
    if (!file) return;
    setBusy(true);
    setStatus('Importing Admin Config Excel workbook...');
    try {
      const workbook = await importCmsExcel(file);
      let updatedSections = 0;
      for (const section of sections) {
        if (!hasSectionSheets(workbook, section)) continue;
        const current = await parseResponse(await fetch(section.endpoint), section.label);
        const payload = buildPayloadFromWorkbook(current, workbook, section);
        await parseResponse(await fetch(section.endpoint, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }), section.label);
        updatedSections += 1;
      }
      if (!updatedSections) throw new Error('Workbook did not contain any recognized Admin Config sheets.');
      setStatus(`Imported and saved ${updatedSections} Admin Config section(s). Reload the active editor to view changes.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to import Admin Config Excel workbook.');
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return <div className="configNotice adminExcelHub"><FileSpreadsheet size={18} /><div><p><strong>Excel Admin Config:</strong> export or import all CMS tables in one workbook. Import saves recognized sheets directly to Neon.</p><small>{status}</small></div><input ref={fileInputRef} type="file" accept=".xlsx,.xls" hidden onChange={(event) => importAll(event.target.files?.[0] ?? null)} /><div className="adminExcelActions"><button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={exportAll}><FileSpreadsheet size={14} /> Export All Excel</button><button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={() => fileInputRef.current?.click()}><Upload size={14} /> Import All Excel</button></div></div>;
}
