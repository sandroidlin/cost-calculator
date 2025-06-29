import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useAuthStore } from './auth'
import { db } from '@/utils/instant'
import { useImportProgress } from '@/composables/useImportProgress'

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

// InstantDB data types
interface InstantDBRecipeIngredient {
  ingredientId: number
  amount: number
  name: string
  unit: string
  unitPrice: number
}

interface InstantDBRecipe {
  id: string | number
  name: string
  bartenderName: string
  glass: string
  ice: string
  totalCost: number
  status: string
  recipeIngredients: InstantDBRecipeIngredient[]
}

export const useRecipesStore = defineStore('recipes', () => {
  const authStore = useAuthStore()
  const recipes = ref<Recipe[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  
  // Migration modal state
  const showMigrationModal = ref(false)
  const migrationData = ref<Recipe[]>([])

  // Query recipes from InstantDB - direct reactive approach
  const { isLoading: queryLoading, error: queryError, data: instantData } = db.useQuery({
    recipes: {
      $: { where: { $user: authStore.user?.id } },
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
      recipes.value = instantData.value.recipes.map((item: InstantDBRecipe) => {
        const ingredients: RecipeIngredient[] = []
        const garnishes: RecipeIngredient[] = []

        if (item.recipeIngredients) {
          item.recipeIngredients.forEach((ri: InstantDBRecipeIngredient) => {
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
      recipes.value = JSON.parse(savedRecipes).map((recipe: unknown) => {
        const item = recipe as any // eslint-disable-line @typescript-eslint/no-explicit-any -- Legacy data needs any for migration
        return {
          ...item,
          // Add status field to existing recipes if not present
          status: item.status || 'complete'
        }
      })
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
        ...recipe.ingredients.map((ingredient) =>
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
        ...recipe.garnishes.map((garnish) =>
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
    } catch (err: unknown) {
      error.value = (err as Error).message || 'Failed to save to database'
      console.error('Failed to save recipe to InstantDB:', err)
      throw err // Re-throw to propagate to import handler
    }
  }

  // Migration function to check for localStorage data and show modal
  const migrateLocalDataToInstant = async () => {
    const localData = localStorage.getItem('recipes')
    if (localData && authStore.isAuthenticated) {
      try {
        const parsedData = JSON.parse(localData) as Recipe[]
        if (parsedData.length > 0) {
          migrationData.value = parsedData
          showMigrationModal.value = true
          // Return a promise that resolves when user makes a choice
          return new Promise<void>((resolve) => {
            const unwatch = watch(showMigrationModal, (show) => {
              if (!show) {
                unwatch()
                resolve()
              }
            })
          })
        }
      } catch (error) {
        console.error('Failed to parse local recipes data:', error)
      }
    }
  }
  
  // Handle migration modal actions
  const handleMigrationMerge = async () => {
    const { startImport, updateProgress, completeImport } = useImportProgress()
    
    if (migrationData.value.length > 0) {
      startImport('Migrating recipes to InstantDB', migrationData.value.length)
      
      try {
        for (let i = 0; i < migrationData.value.length; i++) {
          const recipe = migrationData.value[i]
          await saveToInstant(recipe)
          updateProgress(i + 1, recipe.name)
        }
        completeImport('Migration completed successfully!')
      } catch (error) {
        console.error('Failed to migrate recipes to InstantDB:', error)
        completeImport('Migration completed with some errors')
      }
    }
    
    localStorage.removeItem('recipes')
    migrationData.value = []
    showMigrationModal.value = false
  }
  
  const handleMigrationDiscard = () => {
    localStorage.removeItem('recipes')
    migrationData.value = []
    showMigrationModal.value = false
  }

  // Migration function to cache InstantDB data to localStorage
  const _cacheInstantDataLocally = () => {
    if (recipes.value.length > 0) {
      localStorage.setItem('recipes', JSON.stringify(recipes.value))
    }
  }

  // Watch for authentication state changes and handle data migration
  watch(() => authStore.isAuthenticated, async (isAuth, wasAuth) => {
    if (isAuth && !wasAuth) {
      // User just signed in - first migrate local data if any, then sync from InstantDB
      await migrateLocalDataToInstant()
      syncFromInstant()
    } else if (!isAuth && wasAuth) {
      // User just signed out - clear ALL data including localStorage for security
      recipes.value = [] // Clear reactive state immediately
      localStorage.removeItem('recipes') // Clear localStorage for security
    }
  }, { immediate: false })

  // Initial load based on authentication state
  if (authStore.isAuthenticated) {
    // Check for local data migration on initial load too
    migrateLocalDataToInstant().then(() => {
      syncFromInstant()
    })
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
    const { startImport, updateProgress, completeImport } = useImportProgress()
    
    recipes.value = newRecipes

    if (authStore.isAuthenticated && newRecipes.length > 0) {
      // Show progress for InstantDB import
      startImport('Importing recipes to InstantDB', newRecipes.length)
      
      try {
        // Save to InstantDB when authenticated
        for (let i = 0; i < newRecipes.length; i++) {
          const recipe = newRecipes[i]
          await saveToInstant(recipe)
          updateProgress(i + 1, recipe.name)
        }
        
        completeImport('All recipes imported successfully!')
      } catch (error) {
        console.error('Error importing recipes:', error)
        completeImport('Import completed with some errors')
      }
    } else {
      // Save to localStorage when not authenticated (no progress needed)
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
    importData,
    // Migration modal
    showMigrationModal,
    migrationData,
    handleMigrationMerge,
    handleMigrationDiscard
  }
})