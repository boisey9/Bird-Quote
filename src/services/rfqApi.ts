import type { MockRequest, RequestStatus } from '../data/mockRequests';

export type RfqApiRow = {
  id: string;
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
    dealer: row.dealer_name,
    finalCustomer: row.final_customer_name,
    busType: labels.busType ?? payload?.busSpecs?.busType ?? 'Not specified',
    chassis: labels.chassis ?? payload?.busSpecs?.chassis ?? 'Not specified',
    wheelbase: labels.wheelbase ?? payload?.busSpecs?.wheelbase ?? 'Not specified',
    status: row.status,
    owner: row.assigned_owner,
    slaAge: getSlaAge(row.submitted_at),
    lastUpdate: payload?.review?.validationIssues?.length ? 'Submitted with validation warnings' : 'RFQ submitted by dealer portal'
  };
}

export async function fetchRfqRequests(): Promise<MockRequest[]> {
  const response = await fetch('/api/rfqs');
  const result = await response.json();
  if (!response.ok || !result.ok) throw new Error(result.error ?? 'Unable to load RFQ requests.');
  return (result.requests as RfqApiRow[]).map(mapRfqRowToRequest);
}

export async function updateRfqRequest(input: { rfqId: string; status?: RequestStatus; assignedOwner?: string }) {
  const response = await fetch('/api/rfqs', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  });
  const result = await response.json();
  if (!response.ok || !result.ok) throw new Error(result.error ?? 'Unable to update RFQ.');
  return result as { ok: true; rfqId: string; status: RequestStatus; assignedOwner: string };
}
