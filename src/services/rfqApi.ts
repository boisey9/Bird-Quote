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
  payload: any;
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

export function mapRfqRowToRequest(row: RfqApiRow): MockRequest {
  const labels = row.payload?.busSpecs?.labels ?? {};
  return {
    id: row.id,
    submittedDate: formatDate(row.submitted_at),
    dealer: row.dealer_name,
    finalCustomer: row.final_customer_name,
    busType: labels.busType ?? row.payload?.busSpecs?.busType ?? 'Not specified',
    chassis: labels.chassis ?? row.payload?.busSpecs?.chassis ?? 'Not specified',
    wheelbase: labels.wheelbase ?? row.payload?.busSpecs?.wheelbase ?? 'Not specified',
    status: row.status,
    owner: row.assigned_owner,
    slaAge: getSlaAge(row.submitted_at),
    lastUpdate: row.payload?.review?.validationIssues?.length ? 'Submitted with validation warnings' : 'RFQ submitted by dealer portal'
  };
}

export async function fetchRfqRequests(): Promise<MockRequest[]> {
  const response = await fetch('/api/rfqs');
  const result = await response.json();
  if (!response.ok || !result.ok) throw new Error(result.error ?? 'Unable to load RFQ requests.');
  return (result.requests as RfqApiRow[]).map(mapRfqRowToRequest);
}
