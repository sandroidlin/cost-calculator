import { i } from '@dorilama/instantdb-vue'

// Define the schema for our cost calculator data model
const schema = i.schema({
  entities: {
    $users: i.entity({
      email: i.string().unique().indexed(),
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
  },
})

export default schema
export type AppSchema = typeof schema