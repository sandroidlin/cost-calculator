import { defineStore } from 'pinia'
import { ref } from 'vue'

export const ICE_PRICES = {
  '大冰': 5,
  '4x4冰': 3,
  '小冰': 0,
  'no冰': 0
} as const

export type IceType = keyof typeof ICE_PRICES
export type RecipeStatus = 'draft' | 'complete'

export interface RecipeIngredient {
  id: number
  ingredientId: number
  amount: number
  name: string
  unit: string
  unitPrice: number
}

export interface Recipe {
  id: number
  name: string
  bartenderName: string
  glass: string
  ice: IceType
  method: 'shake' | 'double strain shake' | 'stir' | 'blend' | 'Co2' | 'tap'
  ingredients: RecipeIngredient[]
  garnishes: RecipeIngredient[]
  totalCost: number
  status: RecipeStatus
}

export const useRecipesStore = defineStore('recipes', () => {
  const recipes = ref<Recipe[]>([])

  // Load saved recipes from localStorage
  const loadSavedRecipes = () => {
    const savedRecipes = localStorage.getItem('recipes')
    if (savedRecipes) {
      recipes.value = JSON.parse(savedRecipes).map((recipe: any) => ({
        ...recipe,
        // Add status field to existing recipes if not present
        status: recipe.status || 'complete'
      }))
      saveRecipes()
    }
  }

  // Save recipes to localStorage
  const saveRecipes = () => {
    localStorage.setItem('recipes', JSON.stringify(recipes.value))
  }

  // Load saved recipes when store is created
  loadSavedRecipes()

  function addRecipe(recipe: Omit<Recipe, 'id' | 'status'> & { status?: RecipeStatus }) {
    recipes.value.push({
      ...recipe,
      id: Date.now(),
      status: recipe.status || 'complete'
    })
    saveRecipes()
  }

  function updateRecipe(updatedRecipe: Recipe) {
    const index = recipes.value.findIndex(recipe => recipe.id === updatedRecipe.id)
    if (index === -1) return

    // Don't allow changing status from complete to draft
    if (recipes.value[index].status === 'complete' && updatedRecipe.status === 'draft') {
      updatedRecipe.status = 'complete'
    }

    recipes.value[index] = updatedRecipe
    saveRecipes()
  }

  function removeRecipe(id: number) {
    recipes.value = recipes.value.filter(recipe => recipe.id !== id)
    saveRecipes()
  }

  return {
    recipes,
    addRecipe,
    updateRecipe,
    removeRecipe,
    loadSavedRecipes,
    saveRecipes
  }
}) 