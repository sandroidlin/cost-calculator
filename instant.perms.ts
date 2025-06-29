import type { InstantRules } from '@dorilama/instantdb-vue'

const rules = {
  "workspaces": {
    "allow": {
      "view": "isOwnerOrMember",
      "create": "auth.id != null",
      "update": "isOwner",
      "delete": "isOwner",
    },
    "bind": [
      "isOwner", "auth.id != null && auth.id in data.ref('$user.id')",
      "isOwnerOrMember", "auth.id != null && (auth.id in data.ref('$user.id') || auth.id in data.ref('members.$user.id'))"
    ]
  },
  "workspace_members": {
    "allow": {
      "view": "isWorkspaceMember",
      "create": "canManageWorkspace",
      "update": "canManageWorkspace", 
      "delete": "canRemoveMember",
    },
    "bind": [
      "isWorkspaceMember", "auth.id != null && (auth.id in data.ref('workspace.$user.id') || auth.id in data.ref('workspace.members.$user.id'))",
      "canManageWorkspace", "auth.id != null && auth.id in data.ref('workspace.$user.id')",
      "canRemoveMember", "auth.id != null && (auth.id in data.ref('workspace.$user.id') || auth.id in data.ref('$user.id'))"
    ]
  },
  "workspace_invites": {
    "allow": {
      "view": "canViewInvite",
      "create": "canInvite",
      "update": "canInvite",
      "delete": "canInvite",
    },
    "bind": [
      "canViewInvite", "auth.id != null && (auth.id in data.ref('workspace.$user.id') || auth.id in data.ref('inviter.id'))",
      "canInvite", "auth.id != null && auth.id in data.ref('workspace.$user.id')"
    ]
  },
  "ingredients": {
    "allow": {
      "view": "isOwnerOrWorkspaceMember",
      "create": "auth.id != null",
      "update": "isOwnerOrWorkspaceOwner",
      "delete": "isOwnerOrWorkspaceOwner",
    },
    "bind": [
      "isOwnerOrWorkspaceMember", "auth.id != null && (auth.id in data.ref('$user.id') || auth.id in data.ref('workspace.members.$user.id'))",
      "isOwnerOrWorkspaceOwner", "auth.id != null && (auth.id in data.ref('$user.id') || auth.id in data.ref('workspace.$user.id'))"
    ]
  },
  "compound_ingredients": {
    "allow": {
      "view": "isIngredientOwnerOrMember",
      "create": "auth.id != null",
      "update": "isIngredientOwnerOrMember",
      "delete": "isIngredientOwnerOrMember",
    },
    "bind": [
      "isIngredientOwnerOrMember", "auth.id != null && auth.id in data.ref('ingredient.$user.id')"
    ]
  },
  "recipes": {
    "allow": {
      "view": "isRecipeOwnerOrWorkspaceMember",
      "create": "auth.id != null",
      "update": "isRecipeOwnerOrWorkspaceOwner",
      "delete": "isRecipeOwnerOrWorkspaceOwner",
    },
    "bind": [
      "isRecipeOwnerOrWorkspaceMember", "auth.id != null && (auth.id in data.ref('$user.id') || auth.id in data.ref('workspace.members.$user.id'))",
      "isRecipeOwnerOrWorkspaceOwner", "auth.id != null && (auth.id in data.ref('$user.id') || auth.id in data.ref('workspace.$user.id'))"
    ]
  },
  "recipe_ingredients": {
    "allow": {
      "view": "isRecipeOwnerOrMember",
      "create": "auth.id != null",
      "update": "isRecipeOwnerOrMember",
      "delete": "isRecipeOwnerOrMember",
    },
    "bind": [
      "isRecipeOwnerOrMember", "auth.id != null && auth.id in data.ref('recipe.$user.id')"
    ]
  },
  "$users": {
    "allow": {
      "view": "auth.id != null && auth.id == data.id",
      "create": "false",
      "update": "false",
      "delete": "false",
    }
  },
  "attrs": {
    "allow": {
      "create": "auth.id != null"
    }
  }
} satisfies InstantRules

export default rules