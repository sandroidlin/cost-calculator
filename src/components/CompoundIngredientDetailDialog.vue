<script setup lang="ts">
import { defineProps, defineEmits, computed } from 'vue'
import type { CompoundIngredient } from '@/stores/ingredients'
import { useIngredientsStore } from '@/stores/ingredients'
import { storeToRefs } from 'pinia'

const props = defineProps<{
  ingredient: CompoundIngredient
}>()

const emit = defineEmits<{
  close: []
  delete: [id: number]
  edit: [ingredient: CompoundIngredient]
}>()

const ingredientsStore = useIngredientsStore()
const { ingredients } = storeToRefs(ingredientsStore)

const ingredientDetails = computed(() => {
  return props.ingredient.ingredients
    .map((item) => {
      const ingredient = ingredients.value.find((ing) => ing.id === item.ingredientId)
      if (ingredient?.type === '單一材料') {
        return {
          name: ingredient.name,
          amount: item.amount,
          unit: ingredient.unit,
          totalPrice: (item.amount / ingredient.amount) * ingredient.totalPrice,
        }
      }
      return null
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
})
</script>

<template>
  <div class="dialog-overlay">
    <div class="dialog">
      <div class="dialog-header">
        <div class="header-content">
          <h2>{{ ingredient.name }}</h2>
          <span class="type-pill">{{ $t('ingredient.compoundIngredient') }}</span>
        </div>
        <button class="close-btn" @click="emit('close')">✕</button>
      </div>

      <div class="dialog-content">
        <h4 class="section-title">{{ $t('ingredient.ingredientList') }}</h4>
        <div class="ingredients-list">
          <div v-for="item in ingredientDetails" :key="item.name" class="ingredient-row">
            <span class="ingredient-name">{{ item.name }}</span>
            <span class="ingredient-amount">{{ item.amount }} {{ item.unit }}</span>
          </div>
        </div>

        <div v-if="ingredient.instructions" class="section">
          <h4 class="section-title">{{ $t('ingredient.instructions') }}</h4>
          <div class="instructions-content">
            {{ ingredient.instructions }}
          </div>
        </div>

        <div class="section">
          <h4 class="section-title">{{ $t('ingredient.otherInfo') }}</h4>
          <div class="presentation-details">
            <div class="detail-row">
              <span class="label">{{ $t('ingredient.category') }}</span>
              <span class="value">{{ ingredient.category }}</span>
            </div>
            <div class="detail-row">
              <span class="label">{{ $t('ingredient.mainUnit') }}</span>
              <span class="value">{{ ingredient.mainUnit }}</span>
            </div>
            <div class="detail-row">
              <span class="label">{{ $t('common.cost') }}</span>
              <span class="value"
                >${{ ingredient.unitPrice.toFixed(2) }}/{{ ingredient.mainUnit }}</span
              >
            </div>
          </div>
        </div>

        <div class="dialog-actions">
          <button class="edit-btn" @click="emit('edit', ingredient)">{{ $t('ingredient.editIngredient') }}</button>
          <button class="delete-btn" @click="emit('delete', ingredient.id)">{{ $t('ingredient.deleteIngredient') }}</button>
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

.header-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-content h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 500;
}

.type-pill {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: white;
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

.section-title {
  font-size: 0.875rem;
  color: #666;
  margin: 1.5rem 0 1rem;
  font-weight: 500;
}

.section-title:first-child {
  margin-top: 0;
}

.ingredients-list {
  background: #f9f9f9;
  border-radius: 8px;
  overflow: hidden;
}

.ingredient-row {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #eee;
}

.ingredient-row:last-child {
  border-bottom: none;
}

.ingredient-name {
  color: #333;
  font-weight: 500;
}

.ingredient-amount {
  color: #666;
}

.section {
  margin-top: 1.5rem;
}

.instructions-content {
  background: #f9f9f9;
  border-radius: 8px;
  padding: 1rem;
  white-space: pre-wrap;
  color: #666;
  line-height: 1.5;
}

.presentation-details {
  background: #f9f9f9;
  border-radius: 8px;
  overflow: hidden;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #eee;
}

.detail-row:last-child {
  border-bottom: none;
}

.label {
  color: #666;
}

.value {
  color: #333;
  font-weight: 500;
}

.dialog-actions {
  margin-top: 2rem;
  display: flex;
  gap: 1rem;
}

.edit-btn {
  flex: 1;
  padding: 0.75rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.edit-btn:hover {
  background: #e55a2a;
}

.delete-btn {
  flex: 1;
  padding: 0.75rem;
  background: white;
  border: 1px solid #ff4444;
  color: #ff4444;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.delete-btn:hover {
  background: #fff5f5;
}
</style>
