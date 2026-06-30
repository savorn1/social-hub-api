import * as P from './permissions.seed';

// Spread all values of a resource group to grant every action in it.
const all = (group: Record<string, string>): string[] => Object.values(group);

const ALL = Object.keys(P.Perms);
const omit = (...names: string[]): string[] =>
  ALL.filter((n) => !names.includes(n));

// Maps each role name to the permission constants it holds.
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  // super_admin can do everything
  super_admin: ALL,

  // admin has full access except managing raw permissions and deleting roles
  admin: omit(P.CreatePermissions, P.DeletePermissions, P.DeleteRoles),

  // manager oversees operations: inboxes, conversations, AI tools, integrations, settings
  manager: [
    P.UserPerms.Read,
    P.RolePerms.Read,
    ...all(P.ConversationPerms),
    ...all(P.MessagePerms),
    ...all(P.InboxPerms),
    ...all(P.ChatbotPerms),
    ...all(P.KnowledgePerms),
    ...all(P.PromptPerms),
    P.ReadDashboard,
    ...all(P.IntegrationPerms),
    P.ReadContacts,
    ...all(P.SettingPerms),
  ],

  // agent handles day-to-day customer conversations
  agent: [
    P.ConversationPerms.Read,
    P.ConversationPerms.Create,
    P.ConversationPerms.Update,
    P.ConversationPerms.Assign,
    P.MessagePerms.Read,
    P.MessagePerms.Create,
    P.InboxPerms.Read,
    P.ChatbotPerms.Read,
    P.KnowledgePerms.Read,
    P.PromptPerms.Read,
    P.ReadDashboard,
    P.ReadContacts,
  ],

  // viewer can only read, no writes
  viewer: [
    P.ConversationPerms.Read,
    P.MessagePerms.Read,
    P.InboxPerms.Read,
    P.KnowledgePerms.Read,
    P.PromptPerms.Read,
    P.ReadDashboard,
    P.ReadContacts,
  ],
};
