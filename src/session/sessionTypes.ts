export type UserRole = 'dealer' | 'internal' | 'manager' | 'admin';

export type PortalUser = {
  id: string;
  email: string;
  name: string;
  initials: string;
  role: UserRole;
  companyName: string;
  dealerId?: string;
  dealerName?: string;
  permissions: string[];
};

export type PortalSession = {
  user: PortalUser;
  signedInAt: string;
  mode: 'demo' | 'external';
};
