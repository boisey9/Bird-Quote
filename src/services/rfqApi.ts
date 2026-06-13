import type { MockRequest, RequestStatus } from '../data/mockRequests';
import type { PortalUser } from '../session/sessionTypes';

export type RfqApiRow = {
  id: string;
  user_id?: string;
  dealer_id?: string;
  submitted_by?: string;
  submitted_by_name?: string;
  dealer_company_name?: string;
  dealer_name: string;
  dealer_contact: string;
  final_customer_name: string;
  final_customer_phone: string | null;
  province_state: string;
  status: RequestStatus;
  assigned_owner: string;
  priority: string;
  source: string;
  submitted_at: string;
  updated_at: string;
  payload: unknown;
};

export type RfqHistoryRow = { id: number; rfq_id: string; status: string; note: string; actor: string; created_at: string };
export type RfqDocumentRow = { id: number; rfq_id: string; file_name: string; file_type: string; file_size: string; document_type: string; created_at: string };

type RfqFetchScope = { scope?: 'all' | 'dealer'; user?: PortalUser };

function buildRfqUrl(input?: RfqFetchScope) {
  const params = new URLSearchParams();
  if (input?.scope === 'dealer' && input.user) {
    params.set('scope', 'dealer');
    params.set('userId', input.user.id);
    if (input.user.dealerId) params.set('dealerId', input.user.dealerId);
  }
  const query = params.toString();
  return query ? `/api/rfqs?${query}` : '/api/rfqs';
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function getSlaAge(value: string) {
  const created = new Date(value).getTime();
  if (Number.isNaN(created)) return '-';
  const days = Math.max(0, (Date.now() - created) / 86400000);
  return `${days.toFixed(1)} days`;
}

function getPayloadLabels(payload: unknown) {
  if (!payload || typeof payload !== 'object') return {} as Record<string, string>;
  const record = payload as { busSpecs?: { labels?: Record<string, string>; busType?: string; chassis?: string; wheelbase?: string }; review?: { validationIssues?: unknown[] } };
  return record.busSpecs?.labels ?? {};
}

export function mapRfqRowToRequest(row: RfqApiRow): MockRequest {
  const labels = getPayloadLabels(row.payload);
  const payload = row.payload as { busSpecs?: { busType?: string; chassis?: string; wheelbase?: string }; review?: { validationIssues?: unknown[] } } | null;
  return {
    id: row.id,
    submittedDate: formatDate(row.submitted_at),
    dealer: row.dealer_company_name || row.dealer_name,
    finalCustomer: row.final_customer_name,
    busType: labels.busType ?? payload?.busSpecs?.busType ?? 'Not specified',
    chassis: labels.chassis ?? payload?.busSpecs?.chassis ?? 'Not specified',
    wheelbase: labels.wheelbase ?? payload?.busSpecs?.wheelbase ?? 'Not specified',
    status: row.status,
    owner: row.assigned_owner,
    slaAge: getSlaAge(row.submitted_at),
    lastUpdate: payload?.review?.validationIssues?.length ? 'Submitted with validation warnings' : `Submitted by ${row.submitted_by || 'dealer portal'}`
  };
}

export async function fetchRfqRequests(input?: RfqFetchScope): Promise<MockRequest[]> {
  const response = await fetch(buildRfqUrl(input));
  const result = await response.json();
  if (!response.ok || !result.ok) throw new Error(result.error ?? 'Unable to load RFQ requests.');
  return (result.requests as RfqApiRow[]).map(mapRfqRowToRequest);
}

export async function fetchRfqRows(input?: RfqFetchScope): Promise<RfqApiRow[]> {
  const response = await fetch(buildRfqUrl(input));
  const result = await response.json();
  if (!response.ok || !result.ok) throw new Error(result.error ?? 'Unable to load RFQ requests.');
  return result.requests as RfqApiRow[];
}

export async function fetchRfqHistory(rfqId: string): Promise<{ history: RfqHistoryRow[]; documents: RfqDocumentRow[] }> {
  const response = await fetch(`/api/rfq-history?rfqId=${encodeURIComponent(rfqId)}`);
  const result = await response.json();
  if (!response.ok || !result.ok) throw new Error(result.error ?? 'Unable to load RFQ history.');
  return { history: result.history as RfqHistoryRow[], documents: result.documents as RfqDocumentRow[] };
}

export async function updateRfqRequest(input: { rfqId: string; status?: RequestStatus; assignedOwner?: string; actor?: string }) {
  const response = await fetch('/api/rfqs', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
  const result = await response.json();
  if (!response.ok || !result.ok) throw new Error(result.error ?? 'Unable to update RFQ.');
  return result as { ok: true; rfqId: string; status: RequestStatus; assignedOwner: string };
}
