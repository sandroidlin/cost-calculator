<script setup lang="ts">
import { ref, computed, defineProps, defineEmits } from 'vue'
import type { SingleIngredient, UnitType, CategoryType } from '@/stores/ingredients'
import { UNIT_STEPS, CATEGORIES } from '@/stores/ingredients'

const props = defineProps<{
  initialIngredient?: SingleIngredient
  mode: 'create' | 'edit'
}>()

const emit = defineEmits<{
  save: [ingredient: SingleIngredient]
  cancel: []
}>()

const ingredient = ref<Omit<SingleIngredient, 'id' | 'type' | 'unitPrice'>>({
  name: props.initialIngredient?.name || '',
  unit: props.initialIngredient?.unit || 'ml',
  amount: props.initialIngredient?.amount || 0,
  totalPrice: props.initialIngredient?.totalPrice || 0,
  category: props.initialIngredient?.category || '其他'
})

const unitOptions: UnitType[] = ['ml', 'g', 'dash', '份']
const categoryOptions = CATEGORIES

const calculatedUnitPrice = computed(() => {
  if (!ingredient.value.amount || !ingredient.value.totalPrice) return 0
  return Math.round((ingredient.value.totalPrice / ingredient.value.amount) * 100) / 100
})

const saveIngredient = () => {
  if (!ingredient.value.name || !ingredient.value.amount || !ingredient.value.totalPrice) return

  emit('save', {
    ...ingredient.value,
    type: '單一材料' as const,
    id: props.initialIngredient?.id || Date.now(),
    unitPrice: calculatedUnitPrice.value
  })
}
</script>

<template>
  <div class="dialog-overlay">
    <div class="dialog">
      <div class="dialog-header">
        <h2>{{ mode === 'create' ? '新增單一材料' : '編輯單一材料' }}</h2>
        <button class="close-btn" @click="emit('cancel')">✕</button>
      </div>
      
      <div class="dialog-content">
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
          <label>數量與單位</label>
          <div class="amount-unit-group">
            <input 
              v-model.number="ingredient.amount"
              type="number"
              min="0"
              step="1"
              required
            >
            <select v-model="ingredient.unit">
              <option v-for="unit in unitOptions" :key="unit" :value="unit">
                {{ unit }}
              </option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label>總價</label>
          <div class="price-input">
            <span class="currency">$</span>
            <input 
              v-model.number="ingredient.totalPrice"
              type="number"
              min="0"
              step="0.1"
              required
            >
          </div>
        </div>
      </div>

      <div class="dialog-footer">
        <div class="cost-info">
          <div class="info-item">
            <span class="label">成本</span>
            <span class="highlight-value">${{ calculatedUnitPrice.toFixed(2) }}/{{ ingredient.unit }}</span>
          </div>
        </div>
        <div class="button-group">
          <button class="cancel-btn" @click="emit('cancel')">取消</button>
          <button 
            class="save-btn" 
            @click="saveIngredient"
            :disabled="!ingredient.name || !ingredient.amount || !ingredient.totalPrice"
          >
            {{ mode === 'create' ? '新增材料' : '儲存變更' }}
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
  max-width: 500px;
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
  background: white;
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

.amount-unit-group {
  display: flex;
  gap: 0.5rem;
}

.amount-unit-group input {
  flex: 2;
}

.amount-unit-group select {
  flex: 1;
  min-width: 80px;
}

.price-input {
  position: relative;
}

.currency {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
}

.price-input input {
  padding-left: 1.5rem;
}

.calculated-price {
  padding: 0.75rem;
  background: #f9f9f9;
  border: 1px solid #eee;
  border-radius: 6px;
  color: var(--primary-color);
  font-weight: 500;
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
  align-items: baseline;
}

.label {
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
</style> 