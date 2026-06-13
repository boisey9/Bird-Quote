import { initialDraft } from '../data/initialDraft';
import type { FeatureSelection, RfqDocument, RfqDraft, SeatGroup } from '../types/rfq';
import type { RfqApiRow } from '../services/rfqApi';

type StoredBusSpecs = Partial<RfqDraft['specs']> & { labels?: Record<string, string> };

type StoredRfqPayload = {
  company?: Partial<RfqDraft['company']>;
  busSpecs?: StoredBusSpecs;
  seats?: {
    package?: Partial<RfqDraft['seatPackage']>;
    groups?: SeatGroup[];
  };
  features?: FeatureSelection[];
  documents?: RfqDocument[];
  review?: {
    confirmedAccuracy?: boolean;
    consentToContact?: boolean;
  };
};

function getPayload(row: RfqApiRow): StoredRfqPayload {
  if (!row.payload || typeof row.payload !== 'object') return {};
  return row.payload as StoredRfqPayload;
}

function getBusSpecs(payload: StoredRfqPayload): Partial<RfqDraft['specs']> {
  const source = payload.busSpecs ?? {};
  return {
    chassis: source.chassis,
    certification: source.certification,
    wheelbase: source.wheelbase,
    busType: source.busType,
    quantity: source.quantity,
    seatingCapacity: source.seatingCapacity,
    wheelchairCapacity: source.wheelchairCapacity
  };
}

export function hydrateDraftFromRfqRow(row: RfqApiRow, mode: 'edit' | 'duplicate'): RfqDraft {
  const payload = getPayload(row);
  const next: RfqDraft = {
    ...initialDraft,
    company: {
      ...initialDraft.company,
      ...(payload.company ?? {})
    },
    specs: {
      ...initialDraft.specs,
      ...getBusSpecs(payload)
    },
    seatPackage: {
      ...initialDraft.seatPackage,
      ...(payload.seats?.package ?? {})
    },
    seatGroups: payload.seats?.groups?.length ? payload.seats.groups : initialDraft.seatGroups,
    features: payload.features ?? initialDraft.features,
    documents: payload.documents ?? [],
    confirmedAccuracy: mode === 'edit' ? Boolean(payload.review?.confirmedAccuracy ?? initialDraft.confirmedAccuracy) : false,
    consentToContact: mode === 'edit' ? Boolean(payload.review?.consentToContact ?? initialDraft.consentToContact) : false
  };

  if (mode === 'duplicate') {
    next.company = {
      ...next.company,
      referenceMode: 'new',
      pastQuoteOrOrderNumber: row.id
    };
  }

  return next;
}

export function canDealerEditRfq(row: RfqApiRow) {
  return ['Draft', 'Submitted'].includes(row.status) && (!row.assigned_owner || row.assigned_owner === 'Unassigned');
}
