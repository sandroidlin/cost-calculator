<script setup lang="ts">
import { ref, computed, defineProps, defineEmits, onMounted } from 'vue'
import type { Recipe, RecipeIngredient, IceType, RecipeStatus } from '@/stores/recipes'
import { ICE_PRICES } from '@/stores/recipes'
import type { Ingredient } from '@/stores/ingredients'
import IngredientInput from './IngredientInput.vue'

const props = defineProps<{
  ingredients: Ingredient[]
  initialRecipe?: Recipe
  mode: 'create' | 'edit'
}>()

const emit = defineEmits<{
  save: [recipe: Recipe]
  cancel: []
}>()

const recipe = ref({
  name: props.initialRecipe?.name || '',
  bartenderName: props.initialRecipe?.bartenderName || '',
  glass: props.initialRecipe?.glass || '',
  ice: props.initialRecipe?.ice || 'no冰' as IceType,
  method: props.initialRecipe?.method || 'shake' as const,
  ingredients: [] as RecipeIngredient[],
  garnishes: [] as RecipeIngredient[],
  totalCost: 0,
  status: props.initialRecipe?.status || 'draft' as RecipeStatus
})

const ingredientInputs = ref<Array<{ id: number, ingredient: Ingredient | null, amount: number }>>([])
const garnishInputs = ref<Array<{ id: number, ingredient: Ingredient | null, amount: number }>>([])

const decorationIngredients = computed(() => {
  return props.ingredients.filter(ing => ing.category === '裝飾')
})

const selectedGarnish = computed(() => {
  if (!recipe.value.garnishes.length) return null
  return props.ingredients.find(ing => ing.id === recipe.value.garnishes[0].ingredientId)
})

// Initialize ingredient inputs
onMounted(() => {
  if (props.initialRecipe && props.mode === 'edit') {
    // Load existing ingredients when editing
    ingredientInputs.value = props.initialRecipe.ingredients.map(recipeIng => {
      const ingredient = props.ingredients.find(ing => ing.id === recipeIng.ingredientId)
      return {
        id: recipeIng.id,
        ingredient: ingredient || null,
        amount: recipeIng.amount
      }
    })

    // Load existing garnishes when editing
    garnishInputs.value = props.initialRecipe.garnishes?.map(garnish => {
      const ingredient = props.ingredients.find(ing => ing.id === garnish.ingredientId)
      return {
        id: garnish.id,
        ingredient: ingredient || null,
        amount: garnish.amount
      }
    }) || []
  }
  
  // If no ingredients or creating new recipe, add one empty input
  if (ingredientInputs.value.length === 0) {
    ingredientInputs.value.push({
      id: Date.now(),
      ingredient: null,
      amount: 0
    })
  }

  // Add one empty garnish input if none exist
  if (garnishInputs.value.length === 0) {
    garnishInputs.value.push({
      id: Date.now() + 1,
      ingredient: null,
      amount: 0
    })
  }
})

const preparationMethods = ['shake', 'double strain shake', 'stir', 'blend', 'Co2', 'tap', 'rolling'] as const
const iceOptions = Object.keys(ICE_PRICES) as IceType[]

const totalCost = computed(() => {
  const ingredientsCost = ingredientInputs.value.reduce((total, input) => {
    if (!input.ingredient || !input.amount) return total
    return total + (input.amount * input.ingredient.unitPrice)
  }, 0)

  const garnishesCost = garnishInputs.value.reduce((total, input) => {
    if (!input.ingredient || !input.amount) return total
    return total + (input.amount * input.ingredient.unitPrice)
  }, 0)

  const iceCost = recipe.value.ice ? ICE_PRICES[recipe.value.ice] : 0

  return ingredientsCost + garnishesCost + iceCost
})

const addNewIngredientInput = () => {
  ingredientInputs.value.push({
    id: Date.now(),
    ingredient: null,
    amount: 0
  })
}

const removeIngredientInput = (id: number) => {
  ingredientInputs.value = ingredientInputs.value.filter(input => input.id !== id)
}

const updateIngredient = (id: number, data: { ingredient: Ingredient | null, amount: number }) => {
  const input = ingredientInputs.value.find(i => i.id === id)
  if (input) {
    input.ingredient = data.ingredient
    input.amount = data.amount
  }
}

const addNewGarnishInput = () => {
  garnishInputs.value.push({
    id: Date.now(),
    ingredient: null,
    amount: 0
  })
}

const removeGarnishInput = (id: number) => {
  garnishInputs.value = garnishInputs.value.filter(input => input.id !== id)
}

const updateGarnish = (id: number, data: { ingredient: Ingredient | null, amount: number }) => {
  const input = garnishInputs.value.find(i => i.id === id)
  if (input) {
    input.ingredient = data.ingredient
    input.amount = data.amount
  }
}

const getIngredientUnit = (ingredient: Ingredient): string => {
  return ingredient.type === '單一材料' ? ingredient.unit : ingredient.mainUnit
}

const saveRecipe = (status: RecipeStatus = 'draft') => {
  if (!recipe.value.name || !recipe.value.bartenderName) return

  const recipeIngredients: RecipeIngredient[] = ingredientInputs.value
    .filter(input => input.ingredient && input.amount)
    .map(input => ({
      id: input.id,
      ingredientId: input.ingredient!.id,
      name: input.ingredient!.name,
      amount: input.amount,
      unit: getIngredientUnit(input.ingredient!),
      unitPrice: input.ingredient!.unitPrice
    }))

  const recipeGarnishes: RecipeIngredient[] = garnishInputs.value
    .filter(input => input.ingredient && input.amount)
    .map(input => ({
      id: input.id,
      ingredientId: input.ingredient!.id,
      name: input.ingredient!.name,
      amount: input.amount,
      unit: getIngredientUnit(input.ingredient!),
      unitPrice: input.ingredient!.unitPrice
    }))

  // Only check for ingredients if saving as complete
  if (status === 'complete' && recipeIngredients.length === 0) return

  // Don't allow changing status from complete to draft
  const finalStatus = props.initialRecipe?.status === 'complete' ? 'complete' : status

  emit('save', {
    ...recipe.value,
    id: props.initialRecipe?.id || Date.now(),
    ingredients: recipeIngredients,
    garnishes: recipeGarnishes,
    totalCost: totalCost.value,
    status: finalStatus
  })
}
</script>

<template>
  <div class="dialog-overlay">
    <div class="dialog">
      <div class="dialog-header">
        <h2>{{ mode === 'create' ? '新增酒譜' : '修改酒譜' }}</h2>
        <button class="close-btn" @click="emit('cancel')">✕</button>
      </div>
      <div class="dialog-content">
        <!-- Basic Info Section -->
        <section class="form-section">
          <h3>基本資訊</h3>
          <div class="form-card">
            <div class="form-group">
              <label>酒名</label>
              <input 
                v-model="recipe.name"
                type="text"
                placeholder="請輸入酒名"
              >
            </div>

            <div class="form-group">
              <label>調酒師名</label>
              <input 
                v-model="recipe.bartenderName"
                type="text"
                placeholder="請輸入調酒師名"
              >
            </div>
          </div>
        </section>

        <!-- Ingredients Section -->
        <section class="form-section">
          <h3>酒體材料</h3>
          <div class="form-card">
            <div class="ingredients-list">
              <IngredientInput
                v-for="input in ingredientInputs"
                :key="input.id"
                :ingredients="ingredients"
                :show-delete="ingredientInputs.length > 1"
                :initial-ingredient="input.ingredient"
                :initial-amount="input.amount"
                @update="data => updateIngredient(input.id, data)"
                @remove="removeIngredientInput(input.id)"
              />
            </div>
            
            <button 
              class="add-more-btn"
              @click="addNewIngredientInput"
              type="button"
            >
              <span class="plus-icon">+</span> 新增其他材料
            </button>
          </div>
        </section>

        <!-- Preparation Method Section -->
        <section class="form-section">
          <h3>作法</h3>
          <div class="form-card">
            <div class="form-group">
              <label>調製方式</label>
              <select v-model="recipe.method" class="method-select">
                <option v-for="method in preparationMethods" :key="method" :value="method">
                  {{ method }}
                </option>
              </select>
            </div>
          </div>
        </section>

        <!-- Presentation Section -->
        <section class="form-section">
          <h3>呈現</h3>
          <div class="form-card">
            <div class="form-group">
              <label>杯子</label>
              <input 
                v-model="recipe.glass"
                type="text"
                placeholder="請輸入杯子種類"
              >
            </div>

            <div class="form-group">
              <label>冰塊</label>
              <div class="ice-options">
                <label class="radio-label" v-for="ice in iceOptions" :key="ice">
                  <input 
                    type="radio" 
                    :value="ice" 
                    v-model="recipe.ice"
                    name="ice-type"
                  >
                  <span class="radio-text">{{ ice }}</span>
                </label>
              </div>
            </div>

            <div class="form-group">
              <label>裝飾物</label>
              <div class="garnishes-list">
                <IngredientInput
                  v-for="input in garnishInputs"
                  :key="input.id"
                  :ingredients="decorationIngredients"
                  :show-delete="garnishInputs.length > 1"
                  :initial-ingredient="input.ingredient"
                  :initial-amount="input.amount"
                  @update="data => updateGarnish(input.id, data)"
                  @remove="removeGarnishInput(input.id)"
                />
              </div>
              
              <button 
                class="add-more-btn"
                @click="addNewGarnishInput"
                type="button"
              >
                <span class="plus-icon">+</span> 新增其他裝飾物
              </button>
            </div>
          </div>
        </section>
      </div>

      <div class="dialog-footer">
        <div class="cost-display">
          成本 <span class="cost-amount">${{ totalCost.toFixed(2) }}</span>
        </div>
        <div class="button-group">
          <button 
            v-if="mode === 'create' || (mode === 'edit' && initialRecipe?.status === 'draft')"
            class="draft-btn" 
            @click="saveRecipe('draft')"
          >
            {{ mode === 'edit' && initialRecipe?.status === 'draft' ? '暫存' : '暫存' }}
          </button>
          <button 
            class="submit-btn" 
            @click="saveRecipe('complete')"
          >
            {{ mode === 'edit' && initialRecipe?.status === 'draft' ? '完成酒譜' : (mode === 'create' ? '新增' : '更新') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.dialog {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.dialog-header {
  padding: 1rem 1.5rem;
  background: #333;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 12px 12px 0 0;
}

.dialog-header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 500;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.125rem;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  padding: 0.25rem;
  line-height: 1;
}

.dialog-content {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
  background: #f9f9f9;
}

.form-section {
  margin-bottom: 1.5rem;
}

.form-section:last-child {
  margin-bottom: 0;
}

.form-section h3 {
  font-size: 1rem;
  color: #333;
  margin: 0 0 0.75rem 0;
  font-weight: 500;
}

.form-card {
  background: white;
  border-radius: 8px;
  padding: 1.25rem;
  border: 1px solid #eee;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  color: #666;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #eee;
  border-radius: 6px;
  font-size: 0.875rem;
  background: white;
  transition: all 0.2s ease;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(255, 107, 53, 0.1);
}

.ingredients-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.garnishes-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;
}

.method-select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #eee;
  border-radius: 6px;
  font-size: 0.875rem;
  background: white;
  color: #333;
}

.method-select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(255, 107, 53, 0.1);
}

.ice-options {
  display: flex;
  gap: 1.5rem;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.radio-label input[type="radio"] {
  appearance: none;
  width: 1.125rem;
  height: 1.125rem;
  border: 2px solid #ddd;
  border-radius: 50%;
  margin: 0;
  position: relative;
  cursor: pointer;
}

.radio-label input[type="radio"]:checked {
  border-color: var(--primary-color);
}

.radio-label input[type="radio"]:checked::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 0.5rem;
  height: 0.5rem;
  background: var(--primary-color);
  border-radius: 50%;
}

.radio-text {
  color: #333;
  font-size: 0.875rem;
}

.add-more-btn {
  margin-top: 1rem;
  width: 100%;
  padding: 0.75rem;
  background: white;
  border: 1px solid var(--primary-color);
  color: var(--primary-color);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.add-more-btn:hover {
  background: #fff1ec;
}

.plus-icon {
  font-size: 1.125rem;
  font-weight: bold;
}

.dialog-footer {
  padding: 1.25rem;
  border-top: 1px solid #eee;
  background: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cost-display {
  font-size: 1rem;
  color: #333;
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.cost-amount {
  color: var(--primary-color);
  font-weight: 500;
  font-size: 1.25rem;
}

.button-group {
  display: flex;
  gap: 0.75rem;
}

.cancel-btn {
  padding: 0.75rem 1.5rem;
  background: white;
  border: 1px solid #ddd;
  color: #666;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn:hover {
  background: #f9f9f9;
  border-color: #ccc;
}

.draft-btn {
  padding: 0.75rem 1.5rem;
  background: white;
  border: 1px solid var(--primary-color);
  color: var(--primary-color);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.draft-btn:hover {
  background: #fff1ec;
}

.submit-btn {
  padding: 0.75rem 1.5rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.submit-btn:hover {
  background: #e55a2a;
}

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.garnish-input {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}

.garnish-select {
  flex: 2;
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #eee;
  border-radius: 6px;
  font-size: 0.875rem;
  background: white;
  color: #333;
}

.garnish-amount {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.garnish-amount input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #eee;
  border-radius: 6px;
  font-size: 0.875rem;
}

.unit {
  color: #666;
  font-size: 0.875rem;
  white-space: nowrap;
}

.garnish-select:focus,
.garnish-amount input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(255, 107, 53, 0.1);
}
</style> 