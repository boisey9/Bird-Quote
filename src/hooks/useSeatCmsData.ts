import { useEffect, useMemo, useState } from 'react';
import { getContractById } from '../data/contractConfig';
import { seatCmsConfig } from '../data/featureOptionMatrix';
import type { FloorPlanCompatibilityRule, FloorPlanMaster, FloorPlanZone } from '../data/floorPlanGrid';
import type { RfqDraft, SeatCmsConfig, SeatLayoutRow, SeatLayoutTemplate, SeatPositionType } from '../types/rfq';

type CmsSeatApiResponse = {
  ok?: boolean;
  source?: string;
  error?: string;
  shells?: SeatCmsConfig['shells'];
  layouts?: SeatLayoutTemplate[];
  rows?: SeatLayoutRow[];
  zones?: SeatCmsConfig['zones'];
};

type FloorPlanApiResponse = {
  ok?: boolean;
  error?: string;
  floorPlanMaster?: FloorPlanMaster[];
  floorPlanZones?: FloorPlanZone[];
  floorPlanCompatibilityRules?: FloorPlanCompatibilityRule[];
};

export type SeatCmsLoadState = 'loading' | 'neon' | 'fallback' | 'error';

export type SeatCmsRuntimeData = SeatCmsConfig & {
  loadState: SeatCmsLoadState;
  sourceLabel: string;
  error?: string;
  floorPlanRules?: FloorPlanCompatibilityRule[];
};

function hasValues(values?: string[]) {
  return Array.isArray(values) && values.length > 0;
}

function valueAllowed(allowedValues: string[] | undefined, selectedValue: string) {
  if (!hasValues(allowedValues)) return true;
  return allowedValues!.includes(selectedValue);
}

function contractValueAllowed(allowedValues: string[] | undefined, selectedValue: string) {
  if (!hasValues(allowedValues)) return false;
  return allowedValues!.includes(selectedValue);
}

function valueMatches(ruleValue: string | undefined, selectedValue: string) {
  return !ruleValue || ruleValue === 'any' || ruleValue === selectedValue;
}

function contractRuleMatches(ruleValue: string | undefined, selectedContractId: string) {
  if (!ruleValue || ruleValue === 'any') return true;
  if (ruleValue === 'none') return selectedContractId === 'none';
  return ruleValue === selectedContractId;
}

function buildFallbackData(error?: string): SeatCmsRuntimeData {
  return {
    ...seatCmsConfig,
    shells: seatCmsConfig.shells ?? [],
    zones: seatCmsConfig.zones ?? [],
    loadState: error ? 'error' : 'fallback',
    sourceLabel: error ? 'Static fallback - CMS unavailable' : 'Static fallback config',
    error,
    floorPlanRules: []
  };
}

function parseApiJson<T>(response: Response, rawText: string, label: string): T {
  try {
    return JSON.parse(rawText) as T;
  } catch {
    throw new Error(`${label} returned a non-JSON response: ${rawText.slice(0, 180)}`);
  }
}

function positionTypeFromZone(zone?: FloorPlanZone): SeatPositionType {
  if (!zone) return 'empty';
  if (zone.zoneType === 'seat') return 'passenger-seat';
  if (zone.zoneType === 'wheelchair') return 'wheelchair-space';
  if (zone.zoneType === 'foldaway') return 'foldaway';
  if (zone.zoneType === 'luggage') return 'empty';
  if (zone.zoneType === 'aisle') return 'aisle';
  return 'empty';
}

function seatCountFromZone(zone?: FloorPlanZone) {
  if (!zone) return 0;
  if (zone.zoneType === 'wheelchair') return 0;
  if (zone.zoneType === 'foldaway') return 2;
  if (zone.zoneType !== 'seat') return 0;
  if (zone.seatTypeId?.includes('school-bench-3') || zone.label.includes('3')) return 3;
  if (zone.seatTypeId?.includes('school-bench-2') || zone.label.includes('2')) return 2;
  return 2;
}

function layoutTypeFromPlan(plan: FloorPlanMaster) {
  if (plan.market === 'school') return 'school';
  if (plan.liftType !== 'none' || plan.shellType === 'rear_lift' || plan.wheelchairCapacityHint > 0) return 'accessible';
  if (plan.shellType === 'mid_door') return 'front_facing';
  return 'front_facing';
}

function shellIdFromPlan(plan: FloorPlanMaster) {
  if (plan.shellType === 'rear_lift' || plan.liftType !== 'none') return 'shell-rear-lift';
  if (plan.shellType === 'mid_door') return 'shell-mid-door';
  return 'shell-standard';
}

function buildRowsFromFloorPlan(plan: FloorPlanMaster, zones: FloorPlanZone[]): SeatLayoutRow[] {
  const rows = Array.from({ length: Math.max(1, plan.rowCount) }, (_, index) => index + 1);
  return rows.map((rowNumber) => {
    const rowZones = zones.filter((zone) => rowNumber >= zone.rowStart && rowNumber <= zone.rowEnd);
    const curb = rowZones.find((zone) => zone.side === 'curb') ?? rowZones.find((zone) => zone.side === 'full');
    const street = rowZones.find((zone) => zone.side === 'street') ?? rowZones.find((zone) => zone.side === 'full');
    return {
      id: `${plan.floorPlanId}-row-${rowNumber}`,
      layoutId: plan.floorPlanId,
      rowNumber,
      rowLabel: `Row ${rowNumber}`,
      zone: rowNumber === 1 ? 'front' : rowNumber === plan.rowCount ? 'rear' : 'mid',
      leftPositionType: positionTypeFromZone(street),
      rightPositionType: positionTypeFromZone(curb),
      seatCountLeft: seatCountFromZone(street),
      seatCountRight: seatCountFromZone(curb),
      allowedSeatStyles: [],
      notes: rowZones.map((zone) => zone.label).filter(Boolean).join(' / ')
    } satisfies SeatLayoutRow;
  });
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter((value) => value && value !== 'any')));
}

function buildLayoutsFromFloorPlans(payload?: FloorPlanApiResponse) {
  const activePlans = (payload?.floorPlanMaster ?? []).filter((plan) => plan.status === 'active' && plan.dealerVisible);
  const allZones = payload?.floorPlanZones ?? [];
  const allRules = payload?.floorPlanCompatibilityRules ?? [];
  const layouts: SeatLayoutTemplate[] = activePlans.map((plan) => {
    const planRules = allRules.filter((rule) => rule.floorPlanId === plan.floorPlanId && rule.allowed);
    return {
      id: plan.floorPlanId,
      title: plan.floorPlanName,
      description: plan.notes || 'Admin-managed floor plan grid. Reference only; final seating will be validated by Micro Bird.',
      shellId: shellIdFromPlan(plan),
      maxSeats: plan.capacityHint,
      layoutType: layoutTypeFromPlan(plan),
      layoutFamily: layoutTypeFromPlan(plan),
      market: plan.market,
      rearLiftCompatible: plan.liftType !== 'none' || plan.shellType === 'rear_lift',
      maxWheelchairPositions: plan.wheelchairCapacityHint,
      defaultCapacity: plan.capacityHint,
      defaultWheelchairPositions: plan.wheelchairCapacityHint,
      allowedContractIds: unique(planRules.map((rule) => rule.contractId).filter((id) => id !== 'none')),
      allowedChassisIds: unique(planRules.map((rule) => rule.chassis)),
      allowedWheelbaseIds: unique(planRules.map((rule) => rule.wheelbase)),
      allowedBusTypeIds: unique(planRules.map((rule) => rule.busType))
    };
  });

  const rows = activePlans.flatMap((plan) => buildRowsFromFloorPlan(plan, allZones.filter((zone) => zone.floorPlanId === plan.floorPlanId)));
  return { layouts, rows, rules: allRules };
}

function normalizeApiData(payload: CmsSeatApiResponse, floorPlanPayload?: FloorPlanApiResponse): SeatCmsRuntimeData {
  const floorPlanData = buildLayoutsFromFloorPlans(floorPlanPayload);
  const baseLayouts = payload.layouts?.length ? payload.layouts : [];
  const baseRows = payload.rows?.length ? payload.rows : [];
  const layouts = [...baseLayouts, ...floorPlanData.layouts];
  const rows = [...baseRows, ...floorPlanData.rows];

  return {
    ...seatCmsConfig,
    layouts: layouts.length ? layouts : seatCmsConfig.layouts,
    rows: rows.length ? rows : seatCmsConfig.rows,
    shells: payload.shells ?? seatCmsConfig.shells ?? [],
    zones: payload.zones ?? seatCmsConfig.zones ?? [],
    loadState: 'neon',
    sourceLabel: floorPlanData.layouts.length ? 'Neon CMS + active floor plan grids' : 'Neon CMS',
    error: undefined,
    floorPlanRules: floorPlanData.rules
  };
}

export function useSeatCmsData(): SeatCmsRuntimeData {
  const [cmsData, setCmsData] = useState<SeatCmsRuntimeData>(() => buildFallbackData());

  useEffect(() => {
    let isMounted = true;

    async function loadCmsData() {
      try {
        const seatResponse = await fetch('/api/cms-seat-layouts');
        const seatRawText = await seatResponse.text();
        const seatPayload = parseApiJson<CmsSeatApiResponse>(seatResponse, seatRawText, 'Seat CMS API');

        if (!seatResponse.ok || seatPayload.ok === false) {
          throw new Error(seatPayload.error ?? 'CMS API returned an error.');
        }

        let floorPlanPayload: FloorPlanApiResponse | undefined;
        try {
          const floorPlanResponse = await fetch('/api/cms-floor-plans');
          const floorPlanRawText = await floorPlanResponse.text();
          floorPlanPayload = parseApiJson<FloorPlanApiResponse>(floorPlanResponse, floorPlanRawText, 'Floor plan CMS API');
          if (!floorPlanResponse.ok || floorPlanPayload.ok === false) floorPlanPayload = undefined;
        } catch {
          floorPlanPayload = undefined;
        }

        if (isMounted) setCmsData(normalizeApiData(seatPayload, floorPlanPayload));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to load CMS seat layouts.';
        if (isMounted) setCmsData(buildFallbackData(message));
      }
    }

    loadCmsData();

    return () => {
      isMounted = false;
    };
  }, []);

  return cmsData;
}

export function getSeatLayoutRowsFromCms(rows: SeatLayoutRow[], layoutId: string) {
  return rows.filter((row) => row.layoutId === layoutId).sort((a, b) => a.rowNumber - b.rowNumber);
}

export function getSeatLayoutById(layouts: SeatLayoutTemplate[], layoutId: string) {
  return layouts.find((layout) => layout.id === layoutId);
}

export function filterSeatLayoutsForDraft(cmsData: SeatCmsRuntimeData, draft: RfqDraft) {
  const contract = getContractById(draft.company.contractId);

  return cmsData.layouts.filter((layout) => {
    const floorPlanRules = cmsData.floorPlanRules?.filter((rule) => rule.floorPlanId === layout.id && rule.allowed) ?? [];
    if (floorPlanRules.length > 0) {
      return floorPlanRules.some((rule) => {
        const contractOk = contractRuleMatches(rule.contractId, draft.company.contractId);
        const chassisOk = valueMatches(rule.chassis, draft.specs.chassis);
        const wheelbaseOk = valueMatches(rule.wheelbase, draft.specs.wheelbase);
        const certificationOk = valueMatches(rule.certification, draft.specs.certification);
        const busTypeOk = valueMatches(rule.busType, draft.specs.busType);
        return contractOk && chassisOk && wheelbaseOk && certificationOk && busTypeOk;
      });
    }

    const fallbackRule = seatCmsConfig.rules.find((rule) => rule.layoutId === layout.id);
    const chassisIds = hasValues(layout.allowedChassisIds) ? layout.allowedChassisIds : fallbackRule?.chassisIds;
    const wheelbaseIds = hasValues(layout.allowedWheelbaseIds) ? layout.allowedWheelbaseIds : fallbackRule?.wheelbaseIds;
    const busTypeIds = hasValues(layout.allowedBusTypeIds) ? layout.allowedBusTypeIds : fallbackRule?.busTypeIds;
    const contractIds = hasValues(layout.allowedContractIds) ? layout.allowedContractIds : layout.contractIds;
    const certificationIds = fallbackRule?.certificationIds;

    const chassisOk = valueAllowed(chassisIds, draft.specs.chassis);
    const wheelbaseOk = valueAllowed(wheelbaseIds, draft.specs.wheelbase);
    const busTypeOk = valueAllowed(busTypeIds, draft.specs.busType);
    const certificationOk = valueAllowed(certificationIds, draft.specs.certification);
    const contractOk = contract.workflowType === 'standard'
      || contract.allowedSeatLayoutIds.includes(layout.id)
      || contractValueAllowed(contractIds, draft.company.contractId);

    return chassisOk && wheelbaseOk && busTypeOk && certificationOk && contractOk;
  });
}

export function useAvailableSeatLayouts(draft: RfqDraft) {
  const cmsData = useSeatCmsData();

  return useMemo(() => ({
    ...cmsData,
    availableLayouts: filterSeatLayoutsForDraft(cmsData, draft)
  }), [cmsData, draft]);
}
