import type { InstantRules } from '@dorilama/instantdb-vue'

const rules = {
  "ingredients": {
    "allow": {
      "view": "isOwner",
      "create": "isOwner",
      "update": "isOwner && isStillOwner",
      "delete": "isOwner",
    },
    "bind": [
      "isOwner", "auth.id != null && auth.id == data.ref('$user.id')",
      "isStillOwner", "auth.id != null && auth.id == newData.ref('$user.id')"
    ]
  },
  "compound_ingredients": {
    "allow": {
      "view": "isIngredientOwner",
      "create": "isIngredientOwner",
      "update": "isIngredientOwner",
      "delete": "isIngredientOwner",
    },
    "bind": [
      "isIngredientOwner", "auth.id != null && auth.id == data.ref('ingredient.$user.id')"
    ]
  },
  "recipes": {
    "allow": {
      "view": "isOwner",
      "create": "isOwner", 
      "update": "isOwner && isStillOwner",
      "delete": "isOwner",
    },
    "bind": [
      "isOwner", "auth.id != null && auth.id == data.ref('$user.id')",
      "isStillOwner", "auth.id != null && auth.id == newData.ref('$user.id')"
    ]
  },
  "recipe_ingredients": {
    "allow": {
      "view": "isRecipeOwner",
      "create": "isRecipeOwner",
      "update": "isRecipeOwner", 
      "delete": "isRecipeOwner",
    },
    "bind": [
      "isRecipeOwner", "auth.id != null && auth.id == data.ref('recipe.$user.id')"
    ]
  },
  "$users": {
    "allow": {
      "view": "auth.id != null && auth.id == data.id",
      "create": "false", // Users are created automatically by auth
      "update": "auth.id != null && auth.id == data.id",
      "delete": "false", // Prevent user deletion
    }
  },
  // Allow authenticated users to create attributes during development
  "attrs": {
    "allow": {
      "create": "auth.id != null"
    }
  }
} satisfies InstantRules

export default rules