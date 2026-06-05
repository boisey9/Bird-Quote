export type RequestStatus = 'Draft' | 'Submitted' | 'In Review' | 'Assigned' | 'Quote In Progress' | 'Quote Sent' | 'Converted to Order';

export type MockRequest = {
  id: string;
  submittedDate: string;
  dealer: string;
  finalCustomer: string;
  busType: string;
  chassis: string;
  wheelbase: string;
  status: RequestStatus;
  owner: string;
  slaAge: string;
  lastUpdate: string;
};

export const mockRequests: MockRequest[] = [
  {
    id: 'R-2026-0007',
    submittedDate: 'Jun 5, 2026',
    dealer: 'A. GIRARDIN INC.',
    finalCustomer: 'Westview Resort & Casino',
    busType: 'Hotel, Casino and Resort',
    chassis: 'Ford',
    wheelbase: '158 in WB DRW',
    status: 'Submitted',
    owner: 'Unassigned',
    slaAge: '0.5 days',
    lastUpdate: 'RFQ submitted by dealer'
  },
  {
    id: 'R-2026-0006',
    submittedDate: 'Jun 4, 2026',
    dealer: 'A. GIRARDIN INC.',
    finalCustomer: 'City Shuttle Program',
    busType: 'Commercial Bus',
    chassis: 'Ford Transit',
    wheelbase: '156 in WB DRW',
    status: 'In Review',
    owner: 'Sales Ops',
    slaAge: '1.2 days',
    lastUpdate: 'Missing floorplan requested'
  },
  {
    id: 'R-2026-0005',
    submittedDate: 'Jun 3, 2026',
    dealer: 'A. GIRARDIN INC.',
    finalCustomer: 'Community Transport',
    busType: 'Church and Community',
    chassis: 'GM',
    wheelbase: '159 in WB DRW',
    status: 'Quote In Progress',
    owner: 'Jason Watson',
    slaAge: '2.1 days',
    lastUpdate: 'Quote build in progress'
  },
  {
    id: 'R-2026-0004',
    submittedDate: 'Jun 1, 2026',
    dealer: 'A. GIRARDIN INC.',
    finalCustomer: 'Airport Transfer Group',
    busType: 'Airport and Off-Airport',
    chassis: 'Ford',
    wheelbase: '176 in WB DRW',
    status: 'Quote Sent',
    owner: 'Melissa Nadeau',
    slaAge: '3.0 days',
    lastUpdate: 'Quote sent to dealer'
  }
];

export const statusSteps: RequestStatus[] = ['Submitted', 'In Review', 'Assigned', 'Quote In Progress', 'Quote Sent', 'Converted to Order'];
