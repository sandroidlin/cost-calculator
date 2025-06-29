<script setup lang="ts">
import { ref, computed, defineProps, defineEmits } from 'vue'
import type { CompoundIngredient, UnitType, Ingredient } from '@/stores/ingredients'
import { CATEGORIES } from '@/stores/ingredients'
import { useIngredientsStore } from '@/stores/ingredients'
import { storeToRefs } from 'pinia'
import IngredientInput from './IngredientInput.vue'

const props = defineProps<{
  initialIngredient?: CompoundIngredient
  mode: 'create' | 'edit'
}>()

const emit = defineEmits<{
  save: [ingredient: CompoundIngredient]
  cancel: []
}>()

const ingredientsStore = useIngredientsStore()
const { ingredients } = storeToRefs(ingredientsStore)

// Change this to allow all ingredients
const availableIngredients = computed(() => ingredients.value)

const ingredient = ref<Omit<CompoundIngredient, 'id' | 'type' | 'totalAmount' | 'totalPrice' | 'unitPrice'>>({
  name: props.initialIngredient?.name || '',
  mainUnit: props.initialIngredient?.mainUnit || 'ml',
  category: props.initialIngredient?.category || '其他',
  ingredients: props.initialIngredient?.ingredients || [],
  instructions: props.initialIngredient?.instructions || ''
})

const unitOptions: UnitType[] = ['ml', 'g', 'dash', '份']
const categoryOptions = CATEGORIES

const ingredientInputs = ref<Array<{ id: number, ingredient: Ingredient | null, amount: number }>>([
  { id: Date.now(), ingredient: null, amount: 0 }
])

const overrideTotalAmount = ref(props.initialIngredient?.totalAmount || 0)

// Initialize ingredient inputs if editing an existing compound ingredient
if (props.initialIngredient && props.mode === 'edit') {
  ingredientInputs.value = props.initialIngredient.ingredients.map(ing => {
    const ingredient = availableIngredients.value.find(i => i.id === ing.ingredientId)
    return {
      id: ing.ingredientId,
      ingredient: ingredient || null,
      amount: ing.amount
    }
  })
  
  // Add an empty input if there are no ingredients
  if (ingredientInputs.value.length === 0) {
    ingredientInputs.value.push({ id: Date.now(), ingredient: null, amount: 0 })
  }
}

const calculatedTotalAmount = computed(() => {
  return ingredientInputs.value.reduce((total, input) => {
    if (!input.ingredient || !input.amount) return total
    const unit = input.ingredient.type === '單一材料' ? input.ingredient.unit : input.ingredient.mainUnit
    if (unit !== ingredient.value.mainUnit) return total
    return total + input.amount
  }, 0)
})

const totalAmount = computed(() => {
  return overrideTotalAmount.value || calculatedTotalAmount.value
})

const totalCost = computed(() => {
  return ingredientInputs.value.reduce((total, input) => {
    if (!input.ingredient || !input.amount) return total
    return total + (input.amount * input.ingredient.unitPrice)
  }, 0)
})

const unitPrice = computed(() => {
  if (!totalAmount.value || !totalCost.value) return 0
  return totalCost.value / totalAmount.value
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

const saveIngredient = () => {
  if (!ingredient.value.name) return

  const validIngredients = ingredientInputs.value
    .filter(input => input.ingredient && input.amount)
    .map(input => ({
      ingredientId: input.ingredient!.id,
      amount: input.amount
    }))

  if (validIngredients.length === 0) return

  emit('save', {
    ...ingredient.value,
    type: '複合材料' as const,
    id: props.initialIngredient?.id || Date.now(),
    ingredients: validIngredients,
    totalAmount: totalAmount.value,
    totalPrice: totalCost.value,
    unitPrice: unitPrice.value
  })
}
</script>

<template>
  <div class="dialog-overlay">
    <div class="dialog">
      <div class="dialog-header">
        <h2>{{ mode === 'create' ? '新增複合材料' : '編輯複合材料' }}</h2>
        <button class="close-btn" @click="emit('cancel')">✕</button>
      </div>
      
      <div class="dialog-content">
        <div class="section">
          <h3 class="section-title">基本資料</h3>
          <div class="form-section">
            <div class="form-group">
              <label>名稱</label>
              <input v-model="ingredient.name" type="text" required>
            </div>

            <div class="form-group">
              <label>分類</label>
              <select v-model="ingredient.category">
                <option v-for="category in categoryOptions" :key="category" :value="category">
                  {{ category }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label>主要單位</label>
              <select v-model="ingredient.mainUnit">
                <option v-for="unit in unitOptions" :key="unit" :value="unit">
                  {{ unit }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label>總量（若與材料總和不同）</label>
              <div class="amount-input">
                <input 
                  v-model.number="overrideTotalAmount"
                  type="number"
                  min="0"
                  step="0.1"
                  :placeholder="'輸入總' + ingredient.mainUnit + '數'"
                >
                <span class="unit">{{ ingredient.mainUnit }}</span>
              </div>
              <div class="help-text" v-if="calculatedTotalAmount">
                材料總和: {{ calculatedTotalAmount.toFixed(2) }}{{ ingredient.mainUnit }}
              </div>
            </div>
          </div>
        </div>

        <div class="section">
          <h3 class="section-title">材料清單</h3>
          <div class="form-section">
            <div class="ingredients-list">
              <div 
                v-for="input in ingredientInputs" 
                :key="input.id"
                class="ingredient-input"
              >
                <IngredientInput
                  :ingredients="availableIngredients"
                  :show-delete="ingredientInputs.length > 1"
                  :initial-ingredient="input.ingredient"
                  :initial-amount="input.amount"
                  @update="(data) => updateIngredient(input.id, data)"
                  @remove="() => removeIngredientInput(input.id)"
                />
              </div>
              <button 
                type="button"
                class="add-ingredient-btn"
                @click="addNewIngredientInput"
              >
                + 新增其他材料
              </button>
            </div>
          </div>
        </div>

        <div class="section">
          <h3 class="section-title">作法</h3>
          <div class="form-section">
            <div class="form-group">
              <textarea 
                v-model="ingredient.instructions" 
                rows="4" 
                placeholder="請輸入製作步驟..."
              ></textarea>
            </div>
          </div>
        </div>
      </div>

      <div class="dialog-footer">
        <div class="cost-info">
          <div class="info-item">
            <span class="label">總量</span>
            <span class="highlight-value">{{ totalAmount.toFixed(2) }}{{ ingredient.mainUnit }}</span>
          </div>
          <div class="info-item">
            <span class="label">平均成本</span>
            <span class="value">${{ unitPrice.toFixed(2) }}/{{ ingredient.mainUnit }}</span>
          </div>
        </div>
        <div class="button-group">
          <button class="cancel-btn" @click="emit('cancel')">取消</button>
          <button 
            class="save-btn" 
            @click="saveIngredient"
            :disabled="!ingredient.name || !ingredientInputs.some(input => input.ingredient && input.amount)"
          >
            {{ mode === 'create' ? '新增複合材料' : '儲存變更' }}
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

.section {
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 0.875rem;
  color: #666;
  margin: 0 0 0.75rem 0;
  font-weight: 500;
}

.form-section {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
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
  gap: 0.25rem;
}

.add-ingredient-btn {
  width: 100%;
  padding: 0.75rem;
  background: white;
  border: 1px solid var(--primary-color);
  color: var(--primary-color);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 0.5rem;
  font-size: 0.875rem;
}

.add-ingredient-btn:hover {
  background: #fff1ec;
}

.dialog-footer {
  padding: 1.25rem;
  border-top: 1px solid #eee;
  background: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cost-info {
  display: flex;
  gap: 1.5rem;
}

.info-item {
  display: flex;
  gap: 0.5rem;
  align-items: flex-end;
  line-height: 1;
}

.label {
  color: #666;
  font-size: 0.875rem;
}

.value {
  color: #666;
  font-size: 0.875rem;
}

.highlight-value {
  color: var(--primary-color);
  font-size: 1.125rem;
  font-weight: 500;
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

.save-btn {
  padding: 0.75rem 1.5rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.save-btn:hover:not(:disabled) {
  background: #e55a2a;
}

.save-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #eee;
  border-radius: 6px;
  font-size: 0.875rem;
  background: white;
  transition: all 0.2s ease;
  resize: vertical;
  min-height: 100px;
}

.form-group textarea:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(255, 107, 53, 0.1);
}

.amount-input {
  position: relative;
  display: flex;
  align-items: center;
}

.amount-input input {
  width: 100%;
  padding: 0.75rem;
  padding-right: 3rem;
  border: 1px solid #eee;
  border-radius: 6px;
  font-size: 0.875rem;
}

.amount-input .unit {
  position: absolute;
  right: 0.75rem;
  color: #666;
  font-size: 0.875rem;
}

.help-text {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #666;
}
</style> 