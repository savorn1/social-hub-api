export const JWT_SECRET = 'JWT_SECRET';
export const ROLES_KEY = 'roles';
export const PERMISSIONS_KEY = 'permissions';
export const IS_PUBLIC_KEY = 'isPublic';

export const QUEUE_NAMES = {
  MESSAGE: 'message',
  NOTIFICATION: 'notification',
  AI: 'ai',
  WEBHOOK: 'webhook',
} as const;

export const CACHE_KEYS = {
  DASHBOARD_STATS: 'dashboard:stats',
  USER_PERMISSIONS: (userId: string) => `user:${userId}:permissions`,
} as const;
