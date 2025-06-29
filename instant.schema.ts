import { i } from '@dorilama/instantdb-vue'

// Define the schema for our cost calculator data model
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const schema: any = i.schema({
  entities: {
    $users: i.entity({
      email: i.string().unique().indexed(),
    }),
    workspaces: i.entity({
      name: i.string(),
      description: i.string().optional(),
      createdAt: i.date(),
      updatedAt: i.date(),
    }),
    workspace_members: i.entity({
      role: i.string().indexed(), // 'owner' | 'editor' | 'viewer'
      joinedAt: i.date(),
    }),
    workspace_invites: i.entity({
      email: i.string().indexed(),
      role: i.string(), // 'editor' | 'viewer'
      token: i.string().unique().indexed(),
      expiresAt: i.date(),
      createdAt: i.date(),
    }),
    ingredients: i.entity({
      name: i.string(),
      category: i.string().indexed(),
      type: i.string().indexed(), // '單一材料' | '複合材料'
      unitPrice: i.number(),
      totalPrice: i.number(),
      // For single ingredients
      amount: i.number().optional(),
      unit: i.string().optional(),
      // For compound ingredients
      mainUnit: i.string().optional(),
      totalAmount: i.number().optional(),
      instructions: i.string().optional(),
      createdAt: i.date(),
      updatedAt: i.date(),
      workspaceId: i.string().optional().indexed(),
    }),
    compound_ingredients: i.entity({
      ingredientId: i.number(),
      amount: i.number(),
    }),
    recipes: i.entity({
      name: i.string(),
      bartenderName: i.string(),
      glass: i.string(),
      ice: i.string(),
      method: i.string(),
      totalCost: i.number(),
      status: i.string().indexed(), // 'draft' | 'complete'
      createdAt: i.date(),
      updatedAt: i.date(),
      workspaceId: i.string().optional().indexed(),
    }),
    recipe_ingredients: i.entity({
      ingredientId: i.number(),
      amount: i.number(),
      name: i.string(),
      unit: i.string(),
      unitPrice: i.number(),
      type: i.string(), // 'ingredient' | 'garnish'
    }),
  },
  links: {
    compoundIngredientLink: {
      forward: { on: 'compound_ingredients', has: 'one', label: 'ingredient' },
      reverse: { on: 'ingredients', has: 'many', label: 'compoundIngredients' },
    },
    recipeIngredientLink: {
      forward: { on: 'recipe_ingredients', has: 'one', label: 'recipe' },
      reverse: { on: 'recipes', has: 'many', label: 'recipeIngredients' },
    },
    userIngredients: {
      forward: { on: 'ingredients', has: 'one', label: '$user' },
      reverse: { on: '$users', has: 'many', label: 'ingredients' },
    },
    userRecipes: {
      forward: { on: 'recipes', has: 'one', label: '$user' },
      reverse: { on: '$users', has: 'many', label: 'recipes' },
    },
    workspaceOwner: {
      forward: { on: 'workspaces', has: 'one', label: '$user' },
      reverse: { on: '$users', has: 'many', label: 'ownedWorkspaces' },
    },
    workspaceMember: {
      forward: { on: 'workspace_members', has: 'one', label: '$user' },
      reverse: { on: '$users', has: 'many', label: 'workspaceMemberships' },
    },
    workspaceMemberWorkspace: {
      forward: { on: 'workspace_members', has: 'one', label: 'workspace' },
      reverse: { on: 'workspaces', has: 'many', label: 'members' },
    },
    workspaceInviteWorkspace: {
      forward: { on: 'workspace_invites', has: 'one', label: 'workspace' },
      reverse: { on: 'workspaces', has: 'many', label: 'invites' },
    },
    workspaceInviteInviter: {
      forward: { on: 'workspace_invites', has: 'one', label: 'inviter' },
      reverse: { on: '$users', has: 'many', label: 'sentInvites' },
    },
    workspaceIngredients: {
      forward: { on: 'ingredients', has: 'one', label: 'workspace' },
      reverse: { on: 'workspaces', has: 'many', label: 'ingredients' },
    },
    workspaceRecipes: {
      forward: { on: 'recipes', has: 'one', label: 'workspace' },
      reverse: { on: 'workspaces', has: 'many', label: 'recipes' },
    },
  },
})

export default schema
export type AppSchema = typeof schema