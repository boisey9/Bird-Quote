import { useEffect, useMemo, useState } from 'react';
import type { FeatureSelection, RfqDraft } from '../types/rfq';

export type VehicleWeightProfile = {
  id: string;
  chassisMake: string;
  chassisModel: string;
  wheelbase: string;
  certification: string;
  busModel: string;
  gvwrLbs: number;
  frontGawrLbs: number;
  rearGawrLbs: number;
  baseCurbWeightLbs: number;
  baseFrontAxleWeightLbs: number;
  baseRearAxleWeightLbs: number;
  remainingConfigurableWeightLbs: number;
  source: 'engineering' | 'sales-estimate' | 'imported' | 'manual';
  effectiveDate: string;
  active: boolean;
  notes: string;
};

export type OptionWeightItem = {
  id: string;
  optionCode: string;
  optionName: string;
  category: 'seat' | 'lift' | 'door' | 'hvac' | 'electrical' | 'flooring' | 'storage' | 'accessibility' | 'exterior' | 'custom';
  defaultWeightLbs: number;
  quantityBasis: 'each' | 'per-seat' | 'per-position' | 'per-bus';
  defaultBalanceZoneId: string;
  active: boolean;
  source: string;
  notes: string;
};

export type BalanceZone = {
  id: string;
  name: string;
  zoneType: 'front' | 'mid' | 'rear' | 'over-rear-axle' | 'behind-rear-axle';
  frontAxlePercent: number;
  rearAxlePercent: number;
  notes: string;
};

export type WeightBalanceCmsData = {
  vehicleWeightProfiles: VehicleWeightProfile[];
  optionWeightItems: OptionWeightItem[];
  balanceZones: BalanceZone[];
};

type WeightBalanceCmsPayload = Partial<WeightBalanceCmsData> & {
  ok?: boolean;
  source?: string;
  error?: string;
  counts?: Record<string, number>;
};

export type RfqWeightLine = {
  sourceType: 'seat' | 'option' | 'unknown';
  description: string;
  quantity: number;
  unitWeightLbs: number;
  totalWeightLbs: number;
  balanceZoneId: string;
};

export type RfqWeightEstimate = {
  profile?: VehicleWeightProfile;
  baseRemainingWeightLbs: number;
  selectedOptionsWeightLbs: number;
  selectedSeatsWeightLbs: number;
  estimatedRemainingWeightLbs: number;
  status: 'ok' | 'warning' | 'overweight' | 'review-required' | 'unknown';
  hasUnknownWeights: boolean;
  requiresEngineeringReview: boolean;
  lines: RfqWeightLine[];
};

export function seedWeightBalanceCms(): WeightBalanceCmsData {
  return {
    vehicleWeightProfiles: [
      { id: 'ford-e450-176-commercial-g5', chassisMake: 'Ford', chassisModel: 'E-450', wheelbase: '176', certification: 'Commercial', busModel: 'G5', gvwrLbs: 14500, frontGawrLbs: 5000, rearGawrLbs: 9600, baseCurbWeightLbs: 0, baseFrontAxleWeightLbs: 0, baseRearAxleWeightLbs: 0, remainingConfigurableWeightLbs: 1250, source: 'sales-estimate', effectiveDate: '', active: true, notes: 'Seed placeholder. Replace with engineering-approved values.' }
    ],
    optionWeightItems: [
      { id: 'seat-commercial-high-back', optionCode: 'SEAT-HB', optionName: 'Commercial High Back Seat', category: 'seat', defaultWeightLbs: 38, quantityBasis: 'per-seat', defaultBalanceZoneId: 'mid', active: true, source: 'sales-estimate', notes: 'Placeholder estimate.' },
      { id: 'seat-foldaway', optionCode: 'SEAT-FOLD', optionName: 'Foldaway Seat', category: 'seat', defaultWeightLbs: 45, quantityBasis: 'each', defaultBalanceZoneId: 'mid', active: true, source: 'sales-estimate', notes: 'Placeholder estimate.' },
      { id: 'wheelchair-lift', optionCode: 'LIFT-WC', optionName: 'Wheelchair Lift', category: 'lift', defaultWeightLbs: 350, quantityBasis: 'each', defaultBalanceZoneId: 'rear', active: true, source: 'sales-estimate', notes: 'Placeholder estimate.' },
      { id: 'roof-ac', optionCode: 'HVAC-ROOF', optionName: 'Roof A/C', category: 'hvac', defaultWeightLbs: 120, quantityBasis: 'each', defaultBalanceZoneId: 'mid', active: true, source: 'sales-estimate', notes: 'Placeholder estimate.' },
      { id: 'luggage-rack', optionCode: 'LUG-RACK', optionName: 'Luggage Rack', category: 'storage', defaultWeightLbs: 80, quantityBasis: 'per-bus', defaultBalanceZoneId: 'rear', active: true, source: 'sales-estimate', notes: 'Placeholder estimate.' }
    ],
    balanceZones: [
      { id: 'front', name: 'Front Zone', zoneType: 'front', frontAxlePercent: 70, rearAxlePercent: 30, notes: 'Sales estimate only.' },
      { id: 'mid', name: 'Mid Zone', zoneType: 'mid', frontAxlePercent: 45, rearAxlePercent: 55, notes: 'Sales estimate only.' },
      { id: 'rear', name: 'Rear Zone', zoneType: 'rear', frontAxlePercent: 20, rearAxlePercent: 80, notes: 'Sales estimate only.' },
      { id: 'behind-rear-axle', name: 'Behind Rear Axle', zoneType: 'behind-rear-axle', frontAxlePercent: -10, rearAxlePercent: 110, notes: 'High risk zone; engineering review required.' }
    ]
  };
}

async function parseWeightResponse(response: Response): Promise<WeightBalanceCmsPayload> {
  const text = await response.text();
  let payload: WeightBalanceCmsPayload;
  try { payload = text ? JSON.parse(text) as WeightBalanceCmsPayload : {}; }
  catch { throw new Error(`Weight CMS returned invalid response (${response.status}).`); }
  if (!response.ok || payload.ok === false) throw new Error(payload.error ?? `Weight CMS request failed (${response.status}).`);
  return payload;
}

export function toWeightBalanceData(payload: WeightBalanceCmsPayload): WeightBalanceCmsData {
  const seed = seedWeightBalanceCms();
  return {
    vehicleWeightProfiles: payload.vehicleWeightProfiles?.length ? payload.vehicleWeightProfiles : seed.vehicleWeightProfiles,
    optionWeightItems: payload.optionWeightItems?.length ? payload.optionWeightItems : seed.optionWeightItems,
    balanceZones: payload.balanceZones?.length ? payload.balanceZones : seed.balanceZones
  };
}

export function useWeightBalanceCms() {
  const [data, setData] = useState<WeightBalanceCmsData>(() => seedWeightBalanceCms());
  const [loadState, setLoadState] = useState<'loading' | 'neon' | 'fallback' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const payload = await parseWeightResponse(await fetch('/api/cms-weight-balance'));
        if (!mounted) return;
        setData(toWeightBalanceData(payload));
        setLoadState(payload.source === 'empty-neon' ? 'fallback' : 'neon');
        setError('');
      } catch (err) {
        if (!mounted) return;
        setData(seedWeightBalanceCms());
        setLoadState('error');
        setError(err instanceof Error ? err.message : 'Unable to load weight data.');
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  return { ...data, loadState, error };
}

export async function saveWeightBalanceCms(data: WeightBalanceCmsData) {
  return parseWeightResponse(await fetch('/api/cms-weight-balance', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }));
}

function normalize(value: string | number | undefined) {
  return String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function featureMatchesWeight(feature: FeatureSelection, item: OptionWeightItem) {
  const featureText = normalize(`${feature.label} ${feature.value} ${feature.category}`);
  return Boolean(item.active) && (featureText.includes(normalize(item.optionName)) || featureText.includes(normalize(item.optionCode)) || normalize(item.optionName).includes(featureText));
}

function seatMatchesWeight(seatStyle: string, item: OptionWeightItem) {
  const style = normalize(seatStyle);
  return item.active && item.category === 'seat' && (normalize(item.optionName).includes(style) || style.includes(normalize(item.optionName)) || normalize(item.id).includes(style));
}

export function estimateRfqWeight(draft: RfqDraft, data: WeightBalanceCmsData): RfqWeightEstimate {
  const activeProfiles = data.vehicleWeightProfiles.filter((profile) => profile.active);
  const profile = activeProfiles.find((item) => [item.chassisModel, item.wheelbase, item.certification, item.busModel].some(Boolean)) ?? activeProfiles[0];
  const baseRemainingWeightLbs = profile?.remainingConfigurableWeightLbs ?? 0;
  const lines: RfqWeightLine[] = [];
  let hasUnknownWeights = !profile;

  for (const group of draft.seatGroups) {
    const match = data.optionWeightItems.find((item) => seatMatchesWeight(group.seatStyle, item));
    if (!match) { hasUnknownWeights = true; continue; }
    const quantity = Math.max(0, Number(group.quantity || 0));
    lines.push({ sourceType: 'seat', description: group.name || match.optionName, quantity, unitWeightLbs: match.defaultWeightLbs, totalWeightLbs: quantity * match.defaultWeightLbs, balanceZoneId: match.defaultBalanceZoneId });
  }

  for (const feature of draft.features) {
    const match = data.optionWeightItems.find((item) => featureMatchesWeight(feature, item));
    if (!match) continue;
    const quantity = match.quantityBasis === 'per-seat' ? Math.max(1, draft.specs.seatingCapacity || draft.seatPackage.estimatedPassengerSeats || 1) : match.quantityBasis === 'per-position' ? Math.max(1, draft.specs.wheelchairCapacity || draft.seatPackage.wheelchairPositions || 1) : 1;
    lines.push({ sourceType: 'option', description: feature.label, quantity, unitWeightLbs: match.defaultWeightLbs, totalWeightLbs: quantity * match.defaultWeightLbs, balanceZoneId: match.defaultBalanceZoneId });
  }

  const selectedSeatsWeightLbs = lines.filter((line) => line.sourceType === 'seat').reduce((sum, line) => sum + line.totalWeightLbs, 0);
  const selectedOptionsWeightLbs = lines.filter((line) => line.sourceType === 'option').reduce((sum, line) => sum + line.totalWeightLbs, 0);
  const estimatedRemainingWeightLbs = baseRemainingWeightLbs - selectedSeatsWeightLbs - selectedOptionsWeightLbs;
  const warningBuffer = Math.max(250, Math.round(baseRemainingWeightLbs * 0.1));
  let status: RfqWeightEstimate['status'] = 'unknown';
  if (hasUnknownWeights) status = 'review-required';
  else if (estimatedRemainingWeightLbs < 0) status = 'overweight';
  else if (estimatedRemainingWeightLbs <= warningBuffer) status = 'warning';
  else status = 'ok';

  return { profile, baseRemainingWeightLbs, selectedOptionsWeightLbs, selectedSeatsWeightLbs, estimatedRemainingWeightLbs, status, hasUnknownWeights, requiresEngineeringReview: status !== 'ok', lines };
}

export function useRfqWeightEstimate(draft: RfqDraft) {
  const cms = useWeightBalanceCms();
  const estimate = useMemo(() => estimateRfqWeight(draft, { vehicleWeightProfiles: cms.vehicleWeightProfiles, optionWeightItems: cms.optionWeightItems, balanceZones: cms.balanceZones }), [draft, cms.vehicleWeightProfiles, cms.optionWeightItems, cms.balanceZones]);
  return { ...cms, estimate };
}
