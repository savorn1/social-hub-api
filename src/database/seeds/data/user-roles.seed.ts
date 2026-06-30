// Maps each user email to the role names they should be assigned.
export const USER_ROLES: Record<string, string[]> = {
  'admin@socialhub.com': ['super_admin'],
  'manager@socialhub.com': ['manager'],
  'agent1@socialhub.com': ['agent'],
  'agent2@socialhub.com': ['agent'],
  'viewer@socialhub.com': ['viewer'],
};
