import { useEffect, useState } from 'react';
import { busSpecMatrixData } from '../data/busSpecMatrix';
import type { BusSpecMatrixData } from '../types/rfq';

export type VehicleContractRule = {
  id: string;
  contractId: string;
  chassisId: string;
  certificationId: string;
  wheelbaseId: string;
  busTypeId: string;
  allowed: boolean;
  required: boolean;
  active: boolean;
  notes: string;
};

export type VehicleMatrixCmsData = BusSpecMatrixData & {
  vehicleContractRules: VehicleContractRule[];
};

type VehicleMatrixCmsPayload = Partial<VehicleMatrixCmsData> & {
  ok?: boolean;
  source?: string;
  error?: string;
  counts?: Record<string, number>;
};

export type VehicleMatrixRuntimeData = {
  matrix: VehicleMatrixCmsData;
  sourceLabel: string;
  loadState: 'loading' | 'neon' | 'fallback' | 'error';
  error?: string;
};

export function seedVehicleMatrixCms(): VehicleMatrixCmsData {
  return { ...busSpecMatrixData, vehicleContractRules: [] };
}

function fallbackVehicleMatrix(error?: string): VehicleMatrixRuntimeData {
  return {
    matrix: seedVehicleMatrixCms(),
    sourceLabel: error ? 'Static fallback - Vehicle Matrix CMS unavailable' : 'Static vehicle matrix',
    loadState: error ? 'error' : 'fallback',
    error
  };
}

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

export function toVehicleMatrixCmsData(payload: VehicleMatrixCmsPayload): VehicleMatrixCmsData {
  return {
    chassis: payload.chassis?.length ? payload.chassis : busSpecMatrixData.chassis,
    certifications: payload.certifications?.length ? payload.certifications : busSpecMatrixData.certifications,
    wheelbases: payload.wheelbases?.length ? payload.wheelbases : busSpecMatrixData.wheelbases,
    busTypes: payload.busTypes?.length ? payload.busTypes : busSpecMatrixData.busTypes,
    compatibility: payload.compatibility?.length ? payload.compatibility : busSpecMatrixData.compatibility,
    vehicleContractRules: payload.vehicleContractRules ?? []
  };
}

export function useVehicleMatrixCms(): VehicleMatrixRuntimeData {
  const [runtimeData, setRuntimeData] = useState<VehicleMatrixRuntimeData>(() => fallbackVehicleMatrix());

  useEffect(() => {
    let isMounted = true;

    async function loadMatrix() {
      try {
        const payload = await parseVehicleMatrixResponse(await fetch('/api/cms-vehicle-matrix'));
        if (!isMounted) return;
        setRuntimeData({
          matrix: toVehicleMatrixCmsData(payload),
          sourceLabel: payload.source === 'empty-neon' ? 'Seed vehicle matrix - click Save to initialize backend' : 'Neon Vehicle Matrix CMS',
          loadState: payload.source === 'empty-neon' ? 'fallback' : 'neon'
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to load Vehicle Matrix CMS.';
        if (isMounted) setRuntimeData(fallbackVehicleMatrix(message));
      }
    }

    loadMatrix();

    return () => { isMounted = false; };
  }, []);

  return runtimeData;
}

export async function saveVehicleMatrixCms(matrix: VehicleMatrixCmsData) {
  return parseVehicleMatrixResponse(await fetch('/api/cms-vehicle-matrix', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(matrix)
  }));
}
