import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useAuthStore } from './auth'
import { db } from '@/utils/instant'

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
  method: 'shake' | 'double strain shake' | 'stir' | 'blend' | 'Co2' | 'tap' | 'rolling'
  ingredients: RecipeIngredient[]
  garnishes: RecipeIngredient[]
  totalCost: number
  status: RecipeStatus
}

export const useRecipesStore = defineStore('recipes', () => {
  const authStore = useAuthStore()
  const recipes = ref<Recipe[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Query recipes from InstantDB - direct reactive approach
  const { isLoading: queryLoading, error: queryError, data: instantData } = db.useQuery({
    recipes: {
      recipeIngredients: {}
    }
  })

  console.log('🍸 Recipe query setup complete, current state:', {
    loading: queryLoading.value,
    error: queryError.value,
    data: instantData.value,
    authenticated: authStore.isAuthenticated
  })

  // Watch for InstantDB data changes
  watch(() => instantData.value, (newData) => {
    console.log('🍸 Recipe InstantDB data changed:', newData)
    if (authStore.isAuthenticated && newData) {
      console.log('🔄 Recipe data received, triggering sync')
      syncFromInstant()
    }
  }, { deep: true })

  // Sync InstantDB data to local state
  const syncFromInstant = () => {
    console.log('🍸 Recipe syncFromInstant called, instantData:', instantData.value)
    if (instantData.value?.recipes) {
      console.log('📥 Found recipes data:', instantData.value.recipes.length, 'items')
      recipes.value = instantData.value.recipes.map((item: any) => {
        const ingredients: RecipeIngredient[] = []
        const garnishes: RecipeIngredient[] = []

        if (item.recipeIngredients) {
          item.recipeIngredients.forEach((ri: any) => {
            const ingredient = {
              id: typeof ri.id === 'string' ? parseInt(ri.id) || Date.now() : ri.id,
              ingredientId: ri.ingredientId,
              amount: ri.amount,
              name: ri.name,
              unit: ri.unit,
              unitPrice: ri.unitPrice
            }

            if (ri.type === 'garnish') {
              garnishes.push(ingredient)
            } else {
              ingredients.push(ingredient)
            }
          })
        }

        return {
          id: typeof item.id === 'string' ? parseInt(item.id) || Date.now() : item.id,
          name: item.name,
          bartenderName: item.bartenderName,
          glass: item.glass,
          ice: item.ice as IceType,
          method: item.method as Recipe['method'],
          ingredients,
          garnishes,
          totalCost: item.totalCost,
          status: item.status as RecipeStatus
        }
      })
      console.log('✅ Synced recipes to local state:', recipes.value.length, 'items')
    } else {
      console.log('❌ No recipes data found in instantData')
    }
  }

  // Load saved recipes from localStorage (fallback/offline)
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

  // Save to InstantDB
  const saveToInstant = async (recipe: Recipe) => {
    if (!authStore.isAuthenticated || !authStore.user) return

    try {
      const now = new Date().toISOString()
      
      // Save recipe
      const recipeId = crypto.randomUUID()
      
      await db.transact([
        db.tx.recipes[recipeId].update({
          name: recipe.name,
          bartenderName: recipe.bartenderName,
          glass: recipe.glass,
          ice: recipe.ice,
          method: recipe.method,
          totalCost: recipe.totalCost,
          status: recipe.status,
          createdAt: now,
          updatedAt: now
        }).link({ $user: authStore.user.id }),
        // Save recipe ingredients
        ...recipe.ingredients.map((ingredient, index) =>
          db.tx.recipe_ingredients[crypto.randomUUID()].update({
            ingredientId: ingredient.ingredientId,
            amount: ingredient.amount,
            name: ingredient.name,
            unit: ingredient.unit,
            unitPrice: ingredient.unitPrice,
            type: 'ingredient'
          }).link({ recipe: recipeId })
        ),
        // Save garnishes
        ...recipe.garnishes.map((garnish, index) =>
          db.tx.recipe_ingredients[crypto.randomUUID()].update({
            ingredientId: garnish.ingredientId,
            amount: garnish.amount,
            name: garnish.name,
            unit: garnish.unit,
            unitPrice: garnish.unitPrice,
            type: 'garnish'
          }).link({ recipe: recipeId })
        )
      ])
    } catch (err: any) {
      error.value = err.message || 'Failed to save to database'
      console.error('Failed to save recipe to InstantDB:', err)
      throw err // Re-throw to propagate to import handler
    }
  }

  // Migration function to move localStorage data to InstantDB
  const migrateLocalDataToInstant = async () => {
    const localData = localStorage.getItem('recipes')
    if (localData && authStore.isAuthenticated) {
      try {
        const parsedData = JSON.parse(localData) as Recipe[]
        for (const recipe of parsedData) {
          await saveToInstant(recipe)
        }
      } catch (error) {
        console.error('Failed to migrate recipes to InstantDB:', error)
      }
    }
  }

  // Migration function to cache InstantDB data to localStorage
  const cacheInstantDataLocally = () => {
    if (recipes.value.length > 0) {
      localStorage.setItem('recipes', JSON.stringify(recipes.value))
    }
  }

  // Watch for authentication state changes and handle data migration
  watch(() => authStore.isAuthenticated, async (isAuth, wasAuth) => {
    if (isAuth && !wasAuth) {
      // User just signed in - migrate localStorage data to InstantDB
      await migrateLocalDataToInstant()
      // Then sync from InstantDB to get the latest data
      syncFromInstant()
    } else if (!isAuth && wasAuth) {
      // User just signed out - cache current data to localStorage
      cacheInstantDataLocally()
      // Then load from localStorage
      loadSavedRecipes()
    }
  }, { immediate: false })

  // Initial load based on authentication state
  if (authStore.isAuthenticated) {
    syncFromInstant()
  } else {
    loadSavedRecipes()
  }

  function addRecipe(recipe: Omit<Recipe, 'id' | 'status'> & { status?: RecipeStatus }) {
    const newRecipe: Recipe = {
      ...recipe,
      id: Date.now(),
      status: recipe.status || 'complete'
    }
    
    recipes.value.push(newRecipe)
    saveRecipes()
    
    // Save to InstantDB if authenticated
    if (authStore.isAuthenticated) {
      saveToInstant(newRecipe)
    }
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
    
    // Save to InstantDB if authenticated
    if (authStore.isAuthenticated) {
      saveToInstant(updatedRecipe)
    }
  }

  function removeRecipe(id: number) {
    recipes.value = recipes.value.filter(recipe => recipe.id !== id)
    saveRecipes()
    
    // Delete from InstantDB if authenticated
    if (authStore.isAuthenticated) {
      db.transact(db.tx.recipes[id].delete())
    }
  }

  // Import data method that handles both storage backends
  const importData = async (newRecipes: Recipe[]) => {
    recipes.value = newRecipes

    if (authStore.isAuthenticated) {
      // Save to InstantDB when authenticated
      for (const recipe of newRecipes) {
        await saveToInstant(recipe)
      }
    } else {
      // Save to localStorage when not authenticated
      saveRecipes()
    }
  }

  return {
    recipes,
    isLoading: computed(() => queryLoading.value || isLoading.value),
    error: computed(() => queryError.value?.message || error.value),
    addRecipe,
    updateRecipe,
    removeRecipe,
    loadSavedRecipes,
    saveRecipes,
    importData
  }
})