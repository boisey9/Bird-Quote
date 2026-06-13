import type { AppPage } from '../components/Header';
import type { PortalUser, UserRole } from './sessionTypes';

export const defaultPageByRole: Record<UserRole, AppPage> = {
  dealer: 'new-quote',
  internal: 'rfq-queue',
  manager: 'rfq-queue',
  admin: 'admin-config'
};

export const permittedPagesByRole: Record<UserRole, AppPage[]> = {
  dealer: ['new-quote', 'my-requests', 'quote-status', 'confirmation'],
  internal: ['new-quote', 'my-requests', 'quote-status', 'rfq-queue', 'confirmation'],
  manager: ['my-requests', 'quote-status', 'rfq-queue', 'confirmation'],
  admin: ['new-quote', 'my-requests', 'quote-status', 'rfq-queue', 'admin-config', 'confirmation']
};

export function canAccessPage(user: PortalUser, page: AppPage) {
  return permittedPagesByRole[user.role].includes(page);
}

export function getDefaultPage(user: PortalUser) {
  return defaultPageByRole[user.role];
}

export function hasPermission(user: PortalUser, permission: string) {
  return user.permissions.includes(permission);
}
