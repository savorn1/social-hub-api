export interface RoleSeed {
  name: string;
  code: string;
  description: string;
  isDefault: boolean;
}

export const ROLES: RoleSeed[] = [
  {
    name: 'super_admin',
    code: 'SUPER_ADMIN',
    description: 'Full system access including permission management',
    isDefault: false,
  },
  {
    name: 'admin',
    code: 'ADMIN',
    description: 'Full access except raw permission management',
    isDefault: false,
  },
  {
    name: 'manager',
    code: 'MANAGER',
    description: 'Manage conversations, inboxes, AI tools, and team settings',
    isDefault: false,
  },
  {
    name: 'agent',
    code: 'AGENT',
    description: 'Handle and reply to conversations',
    isDefault: true,
  },
  {
    name: 'viewer',
    code: 'VIEWER',
    description: 'Read-only access across the platform',
    isDefault: false,
  },
];
