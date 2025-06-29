import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useRecipesStore } from './recipes'
import { useAuthStore } from './auth'
import { db } from '@/utils/instant'
import type { Recipe } from './recipes'

export type UnitType = 'ml' | 'g' | 'dash' | '份'
export type CategoryType = '基酒' | '利口酒' | '裝飾' | '果汁果泥' | '苦精' | '酸' | '甜' | '調味料' | '其他'
export type IngredientType = '單一材料' | '複合材料'

// Base interface for common properties
interface BaseIngredient {
  id: number
  name: string
  category: CategoryType
  type: IngredientType
  unitPrice: number
  totalPrice: number
}

// Interface for single ingredients
export interface SingleIngredient extends BaseIngredient {
  type: '單一材料'
  amount: number
  unit: UnitType
}

// Interface for compound ingredients
export interface CompoundIngredient extends BaseIngredient {
  type: '複合材料'
  mainUnit: UnitType
  ingredients: {
    ingredientId: number
    amount: number
  }[]
  totalAmount: number
  instructions: string
}

export type Ingredient = SingleIngredient | CompoundIngredient

export const UNIT_STEPS = {
  'ml': 50,
  'g': 10,
  'dash': 1,
  '份': 1
} as const

export const CATEGORIES: CategoryType[] = ['基酒', '利口酒', '裝飾', '果汁果泥', '苦精', '酸', '甜', '調味料', '其他']

export const useIngredientsStore = defineStore('ingredients', () => {
  const authStore = useAuthStore()
  const ingredients = ref<Ingredient[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Query ingredients from InstantDB - direct reactive approach
  const { isLoading: queryLoading, error: queryError, data: instantData } = db.useQuery({
    ingredients: {
      compoundIngredients: {}
    }
  })

  console.log('📊 Query setup complete, current state:', {
    loading: queryLoading.value,
    error: queryError.value,
    data: instantData.value,
    authenticated: authStore.isAuthenticated
  })

  // Sync InstantDB data to local state
  const syncFromInstant = () => {
    console.log('🔄 syncFromInstant called, instantData:', instantData.value)
    if (instantData.value?.ingredients) {
      console.log('📥 Found ingredients data:', instantData.value.ingredients.length, 'items')
      ingredients.value = instantData.value.ingredients.map((item: any) => {
        const baseIngredient = {
          id: parseInt(item.id),
          name: item.name,
          category: item.category as CategoryType,
          type: item.type as IngredientType,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice
        }

        if (item.type === '複合材料') {
          return {
            ...baseIngredient,
            type: '複合材料' as const,
            mainUnit: item.mainUnit as UnitType,
            ingredients: item.compoundIngredients?.map((ci: any) => ({
              ingredientId: ci.ingredientId,
              amount: ci.amount
            })) || [],
            totalAmount: item.totalAmount,
            instructions: item.instructions || ''
          }
        } else {
          return {
            ...baseIngredient,
            type: '單一材料' as const,
            amount: item.amount,
            unit: item.unit as UnitType
          }
        }
      })
      console.log('✅ Synced ingredients to local state:', ingredients.value.length, 'items')
    } else {
      console.log('❌ No ingredients data found in instantData')
    }
  }

  // Load saved ingredients from localStorage (fallback/offline)
  const loadSavedIngredients = () => {
    const savedIngredients = localStorage.getItem('ingredients')
    if (savedIngredients) {
      const parsedIngredients = JSON.parse(savedIngredients)
      ingredients.value = parsedIngredients.map((ing: any) => {
        // Migrate old categories to new ones
        let category = ing.category
        if (category === '糖') category = '甜'
        if (category === '香料') category = '調味料'

        if (ing.type === '複合材料') {
          return {
            id: ing.id,
            name: ing.name,
            category: category as CategoryType,
            type: '複合材料' as const,
            mainUnit: ing.mainUnit as UnitType,
            ingredients: ing.ingredients,
            totalAmount: ing.totalAmount,
            totalPrice: ing.totalPrice,
            unitPrice: ing.unitPrice,
            instructions: ing.instructions
          }
        } else {
          return {
            id: ing.id,
            name: ing.name,
            category: category as CategoryType,
            type: '單一材料' as const,
            amount: ing.amount,
            unit: ing.unit as UnitType,
            totalPrice: ing.totalPrice,
            unitPrice: ing.unitPrice
          }
        }
      })
      saveIngredients()
    }
  }

  // Save ingredients to localStorage
  const saveIngredients = () => {
    localStorage.setItem('ingredients', JSON.stringify(ingredients.value))
  }

  // Save to InstantDB
  const saveToInstant = async (ingredient: Ingredient) => {
    if (!authStore.isAuthenticated || !authStore.user) return

    try {
      const now = new Date().toISOString()
      const baseData = {
        name: ingredient.name,
        category: ingredient.category,
        type: ingredient.type,
        unitPrice: ingredient.unitPrice,
        totalPrice: ingredient.totalPrice,
        updatedAt: now
      }

      const ingredientId = crypto.randomUUID()

      if (ingredient.type === '單一材料') {
        await db.transact(
          db.tx.ingredients[ingredientId].update({
            ...baseData,
            amount: ingredient.amount,
            unit: ingredient.unit,
            createdAt: now
          }).link({ $user: authStore.user.id })
        )
      } else {
        await db.transact([
          db.tx.ingredients[ingredientId].update({
            ...baseData,
            mainUnit: ingredient.mainUnit,
            totalAmount: ingredient.totalAmount,
            instructions: ingredient.instructions,
            createdAt: now
          }).link({ $user: authStore.user.id }),
          // Handle compound ingredients separately
          ...ingredient.ingredients.map(comp =>
            db.tx.compound_ingredients[crypto.randomUUID()].update({
              ingredientId: comp.ingredientId,
              amount: comp.amount
            }).link({ ingredient: ingredientId })
          )
        ])
      }
    } catch (err: any) {
      error.value = err.message || 'Failed to save to database'
      console.error('Failed to save ingredient to InstantDB:', err)
      throw err // Re-throw to propagate to import handler
    }
  }

  // Migration function to move localStorage data to InstantDB
  const migrateLocalDataToInstant = async () => {
    const localData = localStorage.getItem('ingredients')
    if (localData && authStore.isAuthenticated) {
      try {
        const parsedData = JSON.parse(localData) as Ingredient[]
        for (const ingredient of parsedData) {
          await saveToInstant(ingredient)
        }
      } catch (error) {
        console.error('Failed to migrate ingredients to InstantDB:', error)
      }
    }
  }

  // Migration function to cache InstantDB data to localStorage
  const cacheInstantDataLocally = () => {
    if (ingredients.value.length > 0) {
      localStorage.setItem('ingredients', JSON.stringify(ingredients.value))
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
      loadSavedIngredients()
    }
  }, { immediate: false })

  // Initial load based on authentication state
  if (authStore.isAuthenticated) {
    syncFromInstant()
  } else {
    loadSavedIngredients()
  }

  // Helper function to calculate compound ingredient details
  const calculateCompoundDetails = (
    compoundIngredient: Omit<CompoundIngredient, 'totalAmount' | 'totalPrice' | 'unitPrice' | 'id' | 'type'> & { type: '複合材料', totalAmount?: number }
  ) => {
    let calculatedTotalAmount = 0
    let totalPrice = 0

    compoundIngredient.ingredients.forEach(({ ingredientId, amount }) => {
      const ingredient = ingredients.value.find(ing => ing.id === ingredientId)
      if (!ingredient || ingredient.type !== '單一材料') return

      // Only add to totalAmount if the unit matches mainUnit
      if (ingredient.unit === compoundIngredient.mainUnit) {
        calculatedTotalAmount += amount
      }

      // Always add to total price
      totalPrice += ingredient.unitPrice * amount
    })

    // Use override total amount if provided, otherwise use calculated amount
    const totalAmount = compoundIngredient.totalAmount || calculatedTotalAmount

    const unitPrice = totalAmount > 0 ? totalPrice / totalAmount : 0

    return {
      totalAmount,
      totalPrice,
      unitPrice
    }
  }

  function addSingleIngredient(ingredient: Omit<SingleIngredient, 'id' | 'type' | 'unitPrice'>) {
    const unitPrice = ingredient.totalPrice / ingredient.amount
    const newIngredient: SingleIngredient = {
      id: Date.now(),
      type: '單一材料',
      ...ingredient,
      unitPrice
    }

    ingredients.value.push(newIngredient)
    saveIngredients()

    // Save to InstantDB if authenticated
    if (authStore.isAuthenticated) {
      saveToInstant(newIngredient)
    }
  }

  function addCompoundIngredient(ingredient: Omit<CompoundIngredient, 'id' | 'totalAmount' | 'totalPrice' | 'unitPrice' | 'type'> & { totalAmount?: number }) {
    const { totalAmount, totalPrice, unitPrice } = calculateCompoundDetails({
      ...ingredient,
      type: '複合材料'
    })

    const newIngredient: CompoundIngredient = {
      id: Date.now(),
      type: '複合材料',
      ...ingredient,
      totalAmount,
      totalPrice,
      unitPrice,
      instructions: ingredient.instructions
    }

    ingredients.value.push(newIngredient)
    saveIngredients()

    // Save to InstantDB if authenticated
    if (authStore.isAuthenticated) {
      saveToInstant(newIngredient)
    }
  }

  function updateIngredient(updatedIngredient: Ingredient) {
    const index = ingredients.value.findIndex(ingredient => ingredient.id === updatedIngredient.id)
    if (index === -1) return

    // Recalculate details if it's a compound ingredient
    if (updatedIngredient.type === '複合材料') {
      const details = calculateCompoundDetails(updatedIngredient)
      updatedIngredient.totalAmount = details.totalAmount
      updatedIngredient.totalPrice = details.totalPrice
      updatedIngredient.unitPrice = details.unitPrice
    } else {
      // Recalculate unit price for single ingredients
      updatedIngredient.unitPrice = updatedIngredient.totalPrice / updatedIngredient.amount
    }

    ingredients.value[index] = updatedIngredient
    saveIngredients()

    // Save to InstantDB if authenticated
    if (authStore.isAuthenticated) {
      saveToInstant(updatedIngredient)
    }
  }

  function removeIngredient(id: number) {
    // Check if this ingredient is used in any recipes
    const recipesStore = useRecipesStore()
    const isUsedInRecipes = recipesStore.recipes.some(recipe =>
      recipe.ingredients.some(ing => ing.ingredientId === id) ||
      recipe.garnishes.some(ing => ing.ingredientId === id)
    )

    if (isUsedInRecipes) {
      throw new Error('Cannot delete ingredient that is used in recipes')
    }

    // Check if this ingredient is used in any compound ingredients
    const isUsedInCompounds = ingredients.value.some(ingredient =>
      ingredient.type === '複合材料' &&
      ingredient.ingredients.some(ing => ing.ingredientId === id)
    )

    if (isUsedInCompounds) {
      throw new Error('Cannot delete ingredient that is used in compound ingredients')
    }

    ingredients.value = ingredients.value.filter(ingredient => ingredient.id !== id)
    saveIngredients()

    // Delete from InstantDB if authenticated
    if (authStore.isAuthenticated) {
      db.transact(db.tx.ingredients[id].delete())
    }
  }

  // Computed properties
  const sortedIngredients = computed(() => {
    return [...ingredients.value].sort((a, b) => a.name.localeCompare(b.name))
  })

  const getIngredientById = computed(() => {
    return (id: number) => ingredients.value.find(ingredient => ingredient.id === id)
  })

  // Import data method that handles both storage backends
  const importData = async (newIngredients: Ingredient[]) => {
    ingredients.value = newIngredients

    if (authStore.isAuthenticated) {
      // Save to InstantDB when authenticated
      for (const ingredient of newIngredients) {
        await saveToInstant(ingredient)
      }
    } else {
      // Save to localStorage when not authenticated
      saveIngredients()
    }
  }

  // Watch for authentication state changes and handle data sync
  watch(() => authStore.isAuthenticated, async (isAuth, wasAuth) => {
    console.log('🔐 Auth state changed:', { isAuth, wasAuth })
    if (isAuth && !wasAuth) {
      // User just signed in - sync from InstantDB to get the latest data
      console.log('👤 User signed in, syncing from InstantDB')
      syncFromInstant()
    } else if (!isAuth && wasAuth) {
      // User just signed out - load from localStorage
      console.log('👤 User signed out, loading from localStorage')
      loadSavedIngredients()
    }
  }, { immediate: false })

  // Also watch for data changes from InstantDB
  watch(() => instantData.value, (newData) => {
    console.log('📡 InstantDB data changed:', newData)
    if (authStore.isAuthenticated) {
      console.log('🔄 Authenticated, triggering sync')
      syncFromInstant()
    } else {
      console.log('❌ Not authenticated, skipping sync')
    }
  }, { deep: true })

  // Initial load based on authentication state
  console.log('🚀 Initial load, auth state:', authStore.isAuthenticated)
  if (authStore.isAuthenticated) {
    console.log('👤 Authenticated on init, syncing from InstantDB')
    syncFromInstant()
  } else {
    console.log('👤 Not authenticated on init, loading from localStorage')
    loadSavedIngredients()
  }

  // Add reactive logging for ingredients count
  watch(() => ingredients.value.length, (newCount) => {
    console.log('📊 Ingredients count changed:', newCount)
  })

  return {
    ingredients,
    isLoading: computed(() => queryLoading.value || isLoading.value),
    error: computed(() => queryError.value?.message || error.value),
    sortedIngredients,
    getIngredientById,
    addSingleIngredient,
    addCompoundIngredient,
    updateIngredient,
    removeIngredient,
    loadSavedIngredients,
    saveIngredients,
    importData
  }
})
