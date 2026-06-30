// ─── Types ────────────────────────────────────────────────────────────────────

export interface PermissionInfo {
  description: string;
  module: string;
  resource: string;
  action: string;
}

export interface PermissionSeed extends PermissionInfo {
  name: string;
}

export type Permission = string;

// ─── Action types ─────────────────────────────────────────────────────────────

export const Action = {
  Read: 'READ',
  Create: 'CREATE',
  Update: 'UPDATE',
  Delete: 'DELETE',
  Assign: 'ASSIGN',
} as const;
type ActionType = (typeof Action)[keyof typeof Action];

// ─── Resource (module) types ──────────────────────────────────────────────────

export const Resource = {
  Users: 'USER',
  Roles: 'ROLE',
  Permissions: 'PERMISSION',
  Conversations: 'CONVERSATION',
  Messages: 'MESSAGE',
  Inbox: 'INBOX',
  Chatbot: 'CHATBOT',
  Knowledge: 'KNOWLEDGE',
  Prompts: 'PROMPT',
  Dashboard: 'DASHBOARD',
  Integrations: 'INTEGRATION',
  Contacts: 'CONTACT',
  Settings: 'SETTING',
} as const;
type ResourceType = (typeof Resource)[keyof typeof Resource];

// ─── Helper ───────────────────────────────────────────────────────────────────

function p(resource: ResourceType, action: ActionType): Permission {
  return `${resource}_${action}`;
}

// ─── Permission constants ─────────────────────────────────────────────────────

// Users
export const ReadUsers = p(Resource.Users, Action.Read);
export const CreateUsers = p(Resource.Users, Action.Create);
export const UpdateUsers = p(Resource.Users, Action.Update);
export const DeleteUsers = p(Resource.Users, Action.Delete);

// Roles
export const ReadRoles = p(Resource.Roles, Action.Read);
export const CreateRoles = p(Resource.Roles, Action.Create);
export const UpdateRoles = p(Resource.Roles, Action.Update);
export const DeleteRoles = p(Resource.Roles, Action.Delete);

// Permissions
export const ReadPermissions = p(Resource.Permissions, Action.Read);
export const CreatePermissions = p(Resource.Permissions, Action.Create);
export const DeletePermissions = p(Resource.Permissions, Action.Delete);

// Conversations
export const ReadConversations = p(Resource.Conversations, Action.Read);
export const CreateConversations = p(Resource.Conversations, Action.Create);
export const UpdateConversations = p(Resource.Conversations, Action.Update);
export const DeleteConversations = p(Resource.Conversations, Action.Delete);
export const AssignConversations = p(Resource.Conversations, Action.Assign);

// Messages
export const ReadMessages = p(Resource.Messages, Action.Read);
export const CreateMessages = p(Resource.Messages, Action.Create);

// Inbox
export const ReadInbox = p(Resource.Inbox, Action.Read);
export const CreateInbox = p(Resource.Inbox, Action.Create);
export const UpdateInbox = p(Resource.Inbox, Action.Update);
export const DeleteInbox = p(Resource.Inbox, Action.Delete);

// Chatbot
export const ReadChatbot = p(Resource.Chatbot, Action.Read);
export const CreateChatbot = p(Resource.Chatbot, Action.Create);
export const UpdateChatbot = p(Resource.Chatbot, Action.Update);
export const DeleteChatbot = p(Resource.Chatbot, Action.Delete);

// Knowledge
export const ReadKnowledge = p(Resource.Knowledge, Action.Read);
export const CreateKnowledge = p(Resource.Knowledge, Action.Create);
export const UpdateKnowledge = p(Resource.Knowledge, Action.Update);
export const DeleteKnowledge = p(Resource.Knowledge, Action.Delete);

// Prompts
export const ReadPrompts = p(Resource.Prompts, Action.Read);
export const CreatePrompts = p(Resource.Prompts, Action.Create);
export const UpdatePrompts = p(Resource.Prompts, Action.Update);
export const DeletePrompts = p(Resource.Prompts, Action.Delete);

// Dashboard
export const ReadDashboard = p(Resource.Dashboard, Action.Read);

// Integrations
export const ReadIntegrations = p(Resource.Integrations, Action.Read);
export const CreateIntegrations = p(Resource.Integrations, Action.Create);
export const UpdateIntegrations = p(Resource.Integrations, Action.Update);
export const DeleteIntegrations = p(Resource.Integrations, Action.Delete);

// Contacts
export const ReadContacts = p(Resource.Contacts, Action.Read);

// Settings
export const ReadSettings = p(Resource.Settings, Action.Read);
export const UpdateSettings = p(Resource.Settings, Action.Update);

// ─── Resource groups ─────────────────────────────────────────────────────────
// Use these in role-permissions.seed.ts for readable role definitions.
// Spread all(...Group) to grant everything, or pick Group.Read individually.

export const UserPerms = {
  Read: ReadUsers,
  Create: CreateUsers,
  Update: UpdateUsers,
  Delete: DeleteUsers,
} as const;

export const RolePerms = {
  Read: ReadRoles,
  Create: CreateRoles,
  Update: UpdateRoles,
  Delete: DeleteRoles,
} as const;

export const PermissionPerms = {
  Read: ReadPermissions,
  Create: CreatePermissions,
  Delete: DeletePermissions,
} as const;

export const ConversationPerms = {
  Read: ReadConversations,
  Create: CreateConversations,
  Update: UpdateConversations,
  Delete: DeleteConversations,
  Assign: AssignConversations,
} as const;

export const MessagePerms = {
  Read: ReadMessages,
  Create: CreateMessages,
} as const;

export const InboxPerms = {
  Read: ReadInbox,
  Create: CreateInbox,
  Update: UpdateInbox,
  Delete: DeleteInbox,
} as const;

export const ChatbotPerms = {
  Read: ReadChatbot,
  Create: CreateChatbot,
  Update: UpdateChatbot,
  Delete: DeleteChatbot,
} as const;

export const KnowledgePerms = {
  Read: ReadKnowledge,
  Create: CreateKnowledge,
  Update: UpdateKnowledge,
  Delete: DeleteKnowledge,
} as const;

export const PromptPerms = {
  Read: ReadPrompts,
  Create: CreatePrompts,
  Update: UpdatePrompts,
  Delete: DeletePrompts,
} as const;

export const IntegrationPerms = {
  Read: ReadIntegrations,
  Create: CreateIntegrations,
  Update: UpdateIntegrations,
  Delete: DeleteIntegrations,
} as const;

export const SettingPerms = {
  Read: ReadSettings,
  Update: UpdateSettings,
} as const;

// ─── Permissions registry ─────────────────────────────────────────────────────

export const Perms: Record<Permission, PermissionInfo> = {
  // Users
  [ReadUsers]: {
    description: 'View users',
    module: Resource.Users,
    resource: Resource.Users,
    action: Action.Read,
  },
  [CreateUsers]: {
    description: 'Create users',
    module: Resource.Users,
    resource: Resource.Users,
    action: Action.Create,
  },
  [UpdateUsers]: {
    description: 'Update users',
    module: Resource.Users,
    resource: Resource.Users,
    action: Action.Update,
  },
  [DeleteUsers]: {
    description: 'Delete users',
    module: Resource.Users,
    resource: Resource.Users,
    action: Action.Delete,
  },

  // Roles
  [ReadRoles]: {
    description: 'View roles',
    module: Resource.Roles,
    resource: Resource.Roles,
    action: Action.Read,
  },
  [CreateRoles]: {
    description: 'Create roles',
    module: Resource.Roles,
    resource: Resource.Roles,
    action: Action.Create,
  },
  [UpdateRoles]: {
    description: 'Update roles',
    module: Resource.Roles,
    resource: Resource.Roles,
    action: Action.Update,
  },
  [DeleteRoles]: {
    description: 'Delete roles',
    module: Resource.Roles,
    resource: Resource.Roles,
    action: Action.Delete,
  },

  // Permissions
  [ReadPermissions]: {
    description: 'View permissions',
    module: Resource.Permissions,
    resource: Resource.Permissions,
    action: Action.Read,
  },
  [CreatePermissions]: {
    description: 'Create permissions',
    module: Resource.Permissions,
    resource: Resource.Permissions,
    action: Action.Create,
  },
  [DeletePermissions]: {
    description: 'Delete permissions',
    module: Resource.Permissions,
    resource: Resource.Permissions,
    action: Action.Delete,
  },

  // Conversations
  [ReadConversations]: {
    description: 'View conversations',
    module: Resource.Conversations,
    resource: Resource.Conversations,
    action: Action.Read,
  },
  [CreateConversations]: {
    description: 'Create conversations',
    module: Resource.Conversations,
    resource: Resource.Conversations,
    action: Action.Create,
  },
  [UpdateConversations]: {
    description: 'Update conversations',
    module: Resource.Conversations,
    resource: Resource.Conversations,
    action: Action.Update,
  },
  [DeleteConversations]: {
    description: 'Delete conversations',
    module: Resource.Conversations,
    resource: Resource.Conversations,
    action: Action.Delete,
  },
  [AssignConversations]: {
    description: 'Assign conversations to agents',
    module: Resource.Conversations,
    resource: Resource.Conversations,
    action: Action.Assign,
  },

  // Messages
  [ReadMessages]: {
    description: 'View messages',
    module: Resource.Messages,
    resource: Resource.Messages,
    action: Action.Read,
  },
  [CreateMessages]: {
    description: 'Send messages',
    module: Resource.Messages,
    resource: Resource.Messages,
    action: Action.Create,
  },

  // Inbox
  [ReadInbox]: {
    description: 'View inboxes',
    module: Resource.Inbox,
    resource: Resource.Inbox,
    action: Action.Read,
  },
  [CreateInbox]: {
    description: 'Create inboxes',
    module: Resource.Inbox,
    resource: Resource.Inbox,
    action: Action.Create,
  },
  [UpdateInbox]: {
    description: 'Update inboxes',
    module: Resource.Inbox,
    resource: Resource.Inbox,
    action: Action.Update,
  },
  [DeleteInbox]: {
    description: 'Delete inboxes',
    module: Resource.Inbox,
    resource: Resource.Inbox,
    action: Action.Delete,
  },

  // Chatbot
  [ReadChatbot]: {
    description: 'View chatbots',
    module: Resource.Chatbot,
    resource: Resource.Chatbot,
    action: Action.Read,
  },
  [CreateChatbot]: {
    description: 'Create chatbots',
    module: Resource.Chatbot,
    resource: Resource.Chatbot,
    action: Action.Create,
  },
  [UpdateChatbot]: {
    description: 'Update chatbots',
    module: Resource.Chatbot,
    resource: Resource.Chatbot,
    action: Action.Update,
  },
  [DeleteChatbot]: {
    description: 'Delete chatbots',
    module: Resource.Chatbot,
    resource: Resource.Chatbot,
    action: Action.Delete,
  },

  // Knowledge
  [ReadKnowledge]: {
    description: 'View knowledge bases',
    module: Resource.Knowledge,
    resource: Resource.Knowledge,
    action: Action.Read,
  },
  [CreateKnowledge]: {
    description: 'Create knowledge bases',
    module: Resource.Knowledge,
    resource: Resource.Knowledge,
    action: Action.Create,
  },
  [UpdateKnowledge]: {
    description: 'Update knowledge bases',
    module: Resource.Knowledge,
    resource: Resource.Knowledge,
    action: Action.Update,
  },
  [DeleteKnowledge]: {
    description: 'Delete knowledge bases',
    module: Resource.Knowledge,
    resource: Resource.Knowledge,
    action: Action.Delete,
  },

  // Prompts
  [ReadPrompts]: {
    description: 'View prompts',
    module: Resource.Prompts,
    resource: Resource.Prompts,
    action: Action.Read,
  },
  [CreatePrompts]: {
    description: 'Create prompts',
    module: Resource.Prompts,
    resource: Resource.Prompts,
    action: Action.Create,
  },
  [UpdatePrompts]: {
    description: 'Update prompts',
    module: Resource.Prompts,
    resource: Resource.Prompts,
    action: Action.Update,
  },
  [DeletePrompts]: {
    description: 'Delete prompts',
    module: Resource.Prompts,
    resource: Resource.Prompts,
    action: Action.Delete,
  },

  // Dashboard
  [ReadDashboard]: {
    description: 'View dashboard and analytics',
    module: Resource.Dashboard,
    resource: Resource.Dashboard,
    action: Action.Read,
  },

  // Integrations
  [ReadIntegrations]: {
    description: 'View integrations',
    module: Resource.Integrations,
    resource: Resource.Integrations,
    action: Action.Read,
  },
  [CreateIntegrations]: {
    description: 'Connect new integrations',
    module: Resource.Integrations,
    resource: Resource.Integrations,
    action: Action.Create,
  },
  [UpdateIntegrations]: {
    description: 'Update integrations',
    module: Resource.Integrations,
    resource: Resource.Integrations,
    action: Action.Update,
  },
  [DeleteIntegrations]: {
    description: 'Disconnect integrations',
    module: Resource.Integrations,
    resource: Resource.Integrations,
    action: Action.Delete,
  },

  // Contacts
  [ReadContacts]: {
    description: 'View contacts',
    module: Resource.Contacts,
    resource: Resource.Contacts,
    action: Action.Read,
  },

  // Settings
  [ReadSettings]: {
    description: 'View settings',
    module: Resource.Settings,
    resource: Resource.Settings,
    action: Action.Read,
  },
  [UpdateSettings]: {
    description: 'Update settings',
    module: Resource.Settings,
    resource: Resource.Settings,
    action: Action.Update,
  },
};

// ─── Seed array (derived from registry) ──────────────────────────────────────

export const PERMISSIONS: PermissionSeed[] = Object.entries(Perms).map(
  ([name, info]) => ({ name, ...info }),
);
