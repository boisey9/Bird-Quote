import { initialDraft } from '../data/initialDraft';
import type { FeatureSelection, RfqDocument, RfqDraft, SeatGroup } from '../types/rfq';
import type { RfqApiRow } from '../services/rfqApi';

type RfqPayload = {
  company?: Partial<RfqDraft['company']>;
  busSpecs?: Partial<RfqDraft['specs']> & { labels?: Record<string, string> };
  seats?: { package?: Partial<RfqDraft['seatPackage']>; groups?: SeatGroup[] };
  features?: FeatureSelection[];
  documents?: RfqDocument[];
  review?: { confirmedAccuracy?: boolean; consentToContact?: boolean };
};

function asPayload(row: RfqApiRow): RfqPayload {
  if (!row.payload || typeof row.payload !== 'object') return {};
  return row.payload as RfqPayload;
}

export function hydrateDraftFromRfqRow(row: RfqApiRow, mode: 'edit' | 'duplicate'): RfqDraft {
  const payload = asPayload(row);
  const next: RfqDraft = {
    ...initialDraft,
    company: { ...initialDraft.company, ...(payload.company ?? {}) },
    specs: { ...initialDraft.specs, ...(payload.busSpecs ?? {}) },
    seatPackage: { ...initialDraft.seatPackage, ...(payload.seats?.package ?? {}) },
    seatGroups: payload.seats?.groups?.length ? payload.seats.groups : initialDraft.seatGroups,
    features: payload.features ?? initialDraft.features,
    documents: payload.documents ?? [],
    confirmedAccuracy: mode === 'edit' ? Boolean(payload.review?.confirmedAccuracy ?? initialDraft.confirmedAccuracy) : false,
    consentToContact: mode === 'edit' ? Boolean(payload.review?.consentToContact ?? initialDraft.consentToContact) : false
  };

  delete (next.specs as Record<string, unknown>).labels;
  if (mode === 'duplicate') {
    next.company = {
      ...next.company,
      referenceMode: 'new',
      pastQuoteOrOrderNumber: row.id,
      additionalInfo: `${next.company.additionalInfo ? `${next.company.additionalInfo}\n\n` : ''}Duplicated from RFQ ${row.id}.`.trim()
    };
  }
  return next;
}

export function canDealerEditRfq(row: RfqApiRow) {
  return ['Draft', 'Submitted'].includes(row.status) && (!row.assigned_owner || row.assigned_owner === 'Unassigned');
}
