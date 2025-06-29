import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRecipesStore } from './recipes'

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
  const ingredients = ref<Ingredient[]>([])

  // Load saved ingredients from localStorage
  const loadSavedIngredients = () => {
    const savedIngredients = localStorage.getItem('ingredients')
    if (savedIngredients) {
      const parsedIngredients = JSON.parse(savedIngredients)
      ingredients.value = parsedIngredients.map((ing: unknown) => {
        const item = ing as any // eslint-disable-line @typescript-eslint/no-explicit-any -- Legacy data needs any for migration
        // Migrate old categories to new ones
        let category = item.category
        if (category === '糖') category = '甜'
        if (category === '香料') category = '調味料'
        
        if (item.type === '複合材料') {
          return {
            id: item.id,
            name: item.name,
            category: category as CategoryType,
            type: '複合材料' as const,
            mainUnit: item.mainUnit as UnitType,
            ingredients: item.ingredients,
            totalAmount: item.totalAmount,
            totalPrice: item.totalPrice,
            unitPrice: item.unitPrice,
            instructions: item.instructions
          }
        } else {
          return {
            id: item.id,
            name: item.name,
            category: category as CategoryType,
            type: '單一材料' as const,
            amount: item.amount,
            unit: item.unit as UnitType,
            totalPrice: item.totalPrice,
            unitPrice: item.unitPrice
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

  // Load saved ingredients when store is created
  loadSavedIngredients()

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
    ingredients.value.push({
      id: Date.now(),
      type: '單一材料',
      ...ingredient,
      unitPrice
    })
    saveIngredients()
  }

  function addCompoundIngredient(ingredient: Omit<CompoundIngredient, 'id' | 'totalAmount' | 'totalPrice' | 'unitPrice' | 'type'> & { totalAmount?: number }) {
    const { totalAmount, totalPrice, unitPrice } = calculateCompoundDetails({
      ...ingredient,
      type: '複合材料'
    })
    
    ingredients.value.push({
      id: Date.now(),
      type: '複合材料',
      ...ingredient,
      totalAmount,
      totalPrice,
      unitPrice,
      instructions: ingredient.instructions
    })
    saveIngredients()
  }

  function removeIngredient(id: number) {
    // Check if the ingredient is used in any compound ingredients
    const isUsedInCompound = ingredients.value.some(ing => 
      ing.type === '複合材料' && 
      ing.ingredients.some(i => i.ingredientId === id)
    )

    if (isUsedInCompound) {
      throw new Error('This ingredient is used in compound ingredients and cannot be deleted')
    }

    ingredients.value = ingredients.value.filter(ing => ing.id !== id)
    saveIngredients()
  }

  // Update recipes that use this ingredient
  function updateRecipesWithIngredient(updatedIngredient: Ingredient) {
    const recipesStore = useRecipesStore()
    recipesStore.recipes.forEach(recipe => {
      let recipeUpdated = false
      
      // Update main ingredients
      recipe.ingredients.forEach(ing => {
        if (ing.ingredientId === updatedIngredient.id) {
          ing.unitPrice = updatedIngredient.unitPrice
          ing.name = updatedIngredient.name
          if (updatedIngredient.type === '單一材料') {
            ing.unit = updatedIngredient.unit
          } else {
            ing.unit = updatedIngredient.mainUnit
          }
          recipeUpdated = true
        }
      })

      // Update garnishes
      recipe.garnishes.forEach(ing => {
        if (ing.ingredientId === updatedIngredient.id) {
          ing.unitPrice = updatedIngredient.unitPrice
          ing.name = updatedIngredient.name
          if (updatedIngredient.type === '單一材料') {
            ing.unit = updatedIngredient.unit
          } else {
            ing.unit = updatedIngredient.mainUnit
          }
          recipeUpdated = true
        }
      })

      // Recalculate total cost if recipe was updated
      if (recipeUpdated) {
        recipe.totalCost = [...recipe.ingredients, ...recipe.garnishes].reduce(
          (total, ing) => total + (ing.amount * ing.unitPrice),
          0
        )
      }
    })

    // Save updated recipes
    recipesStore.saveRecipes()
  }

  function updateIngredient(updatedIngredient: Ingredient) {
    const index = ingredients.value.findIndex(ing => ing.id === updatedIngredient.id)
    if (index === -1) return

    if (updatedIngredient.type === '複合材料') {
      const { totalAmount, totalPrice, unitPrice } = calculateCompoundDetails(updatedIngredient)
      updatedIngredient = {
        ...updatedIngredient,
        totalAmount,
        totalPrice,
        unitPrice
      }
    }

    ingredients.value[index] = updatedIngredient
    saveIngredients()

    // Update recipes that use this ingredient
    updateRecipesWithIngredient(updatedIngredient)
  }

  // Get all single ingredients for use in compound ingredients
  const singleIngredients = computed(() => 
    ingredients.value.filter((ing): ing is SingleIngredient => ing.type === '單一材料')
  )

  return {
    ingredients,
    singleIngredients,
    addSingleIngredient,
    addCompoundIngredient,
    removeIngredient,
    updateIngredient,
    loadSavedIngredients
  }
}) 