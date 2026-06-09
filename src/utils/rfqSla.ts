import type { MockRequest, RequestStatus } from '../data/mockRequests';

export type SlaStatus = 'On Track' | 'At Risk' | 'Past Due' | 'Completed';

export function parseSlaDays(slaAge: string) {
  const days = Number.parseFloat(slaAge);
  return Number.isNaN(days) ? 0 : days;
}

export function getSlaStatus(request: Pick<MockRequest, 'slaAge' | 'status'>): SlaStatus {
  if (request.status === 'Quote Sent' || request.status === 'Converted to Order') return 'Completed';
  const days = parseSlaDays(request.slaAge);
  if (days >= 3) return 'Past Due';
  if (days >= 2) return 'At Risk';
  return 'On Track';
}

export function getSlaPriority(request: Pick<MockRequest, 'slaAge' | 'status'>) {
  const status = getSlaStatus(request);
  if (status === 'Past Due') return 'High';
  if (status === 'At Risk') return 'Watch';
  return 'Normal';
}

export function canMoveToStatus(current: { owner: string; status: RequestStatus }, nextStatus: RequestStatus) {
  if ((nextStatus === 'In Review' || nextStatus === 'Quote In Progress') && current.owner === 'Unassigned') {
    return 'Assign an owner before moving this RFQ into review.';
  }
  return '';
}
