import { useEffect, useMemo, useState } from 'react';
import { getContractById } from '../data/contractConfig';
import { seatCmsConfig } from '../data/featureOptionMatrix';
import type { RfqDraft, SeatCmsConfig, SeatLayoutRow, SeatLayoutTemplate } from '../types/rfq';

type CmsSeatApiResponse = {
  ok?: boolean;
  source?: string;
  error?: string;
  shells?: SeatCmsConfig['shells'];
  layouts?: SeatLayoutTemplate[];
  rows?: SeatLayoutRow[];
  zones?: SeatCmsConfig['zones'];
};

export type SeatCmsLoadState = 'loading' | 'neon' | 'fallback' | 'error';

export type SeatCmsRuntimeData = SeatCmsConfig & {
  loadState: SeatCmsLoadState;
  sourceLabel: string;
  error?: string;
};

function hasValues(values?: string[]) {
  return Array.isArray(values) && values.length > 0;
}

function valueAllowed(allowedValues: string[] | undefined, selectedValue: string) {
  return !hasValues(allowedValues) || allowedValues.includes(selectedValue);
}

function contractValueAllowed(allowedValues: string[] | undefined, selectedValue: string) {
  return hasValues(allowedValues) && allowedValues.includes(selectedValue);
}

function buildFallbackData(error?: string): SeatCmsRuntimeData {
  return {
    ...seatCmsConfig,
    shells: seatCmsConfig.shells ?? [],
    zones: seatCmsConfig.zones ?? [],
    loadState: error ? 'error' : 'fallback',
    sourceLabel: error ? 'Static fallback - CMS unavailable' : 'Static fallback config',
    error
  };
}

function normalizeApiData(payload: CmsSeatApiResponse): SeatCmsRuntimeData {
  const layouts = payload.layouts?.length ? payload.layouts : seatCmsConfig.layouts;
  const rows = payload.rows?.length ? payload.rows : seatCmsConfig.rows;

  return {
    ...seatCmsConfig,
    layouts,
    rows,
    shells: payload.shells ?? seatCmsConfig.shells ?? [],
    zones: payload.zones ?? seatCmsConfig.zones ?? [],
    loadState: 'neon',
    sourceLabel: 'Neon CMS',
    error: undefined
  };
}

export function useSeatCmsData(): SeatCmsRuntimeData {
  const [cmsData, setCmsData] = useState<SeatCmsRuntimeData>(() => buildFallbackData());

  useEffect(() => {
    let isMounted = true;

    async function loadCmsData() {
      try {
        const response = await fetch('/api/cms-seat-layouts');
        const rawText = await response.text();
        let payload: CmsSeatApiResponse;

        try {
          payload = JSON.parse(rawText) as CmsSeatApiResponse;
        } catch {
          throw new Error(rawText.slice(0, 180) || 'CMS API returned a non-JSON response.');
        }

        if (!response.ok || payload.ok === false) {
          throw new Error(payload.error ?? 'CMS API returned an error.');
        }

        if (isMounted) setCmsData(normalizeApiData(payload));
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
