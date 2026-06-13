import type { PortalUser } from './sessionTypes';

export const demoPortalUsers: PortalUser[] = [
  {
    id: 'user-dealer-agi',
    email: 'dealer@agirardin.com',
    name: 'Dealer User',
    initials: 'DU',
    role: 'dealer',
    companyName: 'A. Girardin Inc.',
    dealerId: 'AGI',
    dealerName: 'A. Girardin Inc.',
    permissions: ['rfq.create', 'rfq.view_own']
  },
  {
    id: 'user-sales-ops',
    email: 'salesops@microbird.com',
    name: 'Sales Ops User',
    initials: 'SO',
    role: 'internal',
    companyName: 'Micro Bird',
    permissions: ['rfq.create', 'rfq.view_all', 'rfq.update_status', 'rfq.assign_owner']
  },
  {
    id: 'user-manager',
    email: 'manager@microbird.com',
    name: 'Manager User',
    initials: 'MU',
    role: 'manager',
    companyName: 'Micro Bird',
    permissions: ['rfq.view_all', 'rfq.approve_contract', 'reporting.view']
  },
  {
    id: 'user-admin',
    email: 'admin@microbird.com',
    name: 'Admin User',
    initials: 'AU',
    role: 'admin',
    companyName: 'Micro Bird',
    permissions: ['rfq.create', 'rfq.view_all', 'rfq.update_status', 'rfq.assign_owner', 'rfq.approve_contract', 'admin.config.read', 'admin.config.write', 'reporting.view']
  }
];

export function findDemoUser(email: string) {
  return demoPortalUsers.find((user) => user.email.toLowerCase() === email.trim().toLowerCase());
}
