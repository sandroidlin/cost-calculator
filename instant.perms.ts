import type { InstantRules } from '@dorilama/instantdb-vue'

const rules = {
  "ingredients": {
    "allow": {
      "view": "isOwner",
      "create": "auth.id != null",
      "update": "isOwner",
      "delete": "isOwner",
    },
    "bind": [
      "isOwner", "auth.id != null && auth.id in data.ref('$user.id')"
    ]
  },
  "compound_ingredients": {
    "allow": {
      "view": "isIngredientOwner",
      "create": "auth.id != null",
      "update": "isIngredientOwner",
      "delete": "isIngredientOwner",
    },
    "bind": [
      "isIngredientOwner", "auth.id != null && auth.id in data.ref('ingredient.$user.id')"
    ]
  },
  "recipes": {
    "allow": {
      "view": "isOwner",
      "create": "auth.id != null",
      "update": "isOwner",
      "delete": "isOwner",
    },
    "bind": [
      "isOwner", "auth.id != null && auth.id in data.ref('$user.id')"
    ]
  },
  "recipe_ingredients": {
    "allow": {
      "view": "isRecipeOwner",
      "create": "auth.id != null",
      "update": "isRecipeOwner",
      "delete": "isRecipeOwner",
    },
    "bind": [
      "isRecipeOwner", "auth.id != null && auth.id in data.ref('recipe.$user.id')"
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