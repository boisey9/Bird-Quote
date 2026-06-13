import { Clock, FileText, Inbox, Plus, Settings } from 'lucide-react';
import type { ComponentType } from 'react';
import type { AppPage } from '../components/Header';
import type { UserRole } from '../session/sessionTypes';

export type NavItem = {
  page: AppPage;
  label: string;
  icon: ComponentType<{ size?: number }>;
  allowedFor: UserRole[];
  order: number;
};

export const navItems: NavItem[] = [
  { page: 'new-quote', label: 'New RFQ', icon: Plus, allowedFor: ['dealer', 'internal', 'admin'], order: 10 },
  { page: 'my-requests', label: 'My Requests', icon: FileText, allowedFor: ['dealer', 'internal', 'manager', 'admin'], order: 20 },
  { page: 'quote-status', label: 'Quote Status', icon: Clock, allowedFor: ['dealer', 'internal', 'manager', 'admin'], order: 30 },
  { page: 'rfq-queue', label: 'RFQ Queue', icon: Inbox, allowedFor: ['internal', 'manager', 'admin'], order: 40 },
  { page: 'admin-config', label: 'Admin Config', icon: Settings, allowedFor: ['admin'], order: 50 }
];

export function getNavItems(role: UserRole) {
  return navItems.filter((item) => item.allowedFor.includes(role)).sort((a, b) => a.order - b.order);
}

export function getNavLabel(page: AppPage) {
  return navItems.find((item) => item.page === page)?.label ?? 'Confirmation';
}
