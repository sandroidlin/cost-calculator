<script setup lang="ts">
import { defineProps, defineEmits, computed } from 'vue'
import type { Ingredient } from '@/stores/ingredients'

const props = defineProps<{
  ingredient: Ingredient
}>()

const emit = defineEmits<{
  close: []
  edit: [ingredient: Ingredient]
  delete: [id: number]
}>()

const displayAmount = computed(() => {
  if (props.ingredient.type === '單一材料') {
    return `${props.ingredient.amount} ${props.ingredient.unit}`
  } else {
    return `${props.ingredient.totalAmount} ${props.ingredient.mainUnit}`
  }
})

const displayUnit = computed(() => {
  if (props.ingredient.type === '單一材料') {
    return props.ingredient.unit
  } else {
    return props.ingredient.mainUnit
  }
})
</script>

<template>
  <div class="dialog-overlay">
    <div class="dialog">
      <div class="dialog-header">
        <h2>{{ ingredient.name }}</h2>
        <button class="close-btn" @click="emit('close')">✕</button>
      </div>

      <div class="dialog-content">
        <div class="detail-list">
          <div class="detail-item">
            <span class="label">{{ $t('ingredient.totalAmount') }}</span>
            <span>{{ displayAmount }}</span>
          </div>
          <div class="detail-item">
            <span class="label">{{ $t('ingredient.price') }}</span>
            <span>${{ ingredient.totalPrice }}</span>
          </div>
          <div class="detail-item">
            <span class="label">{{ $t('ingredient.category') }}</span>
            <span>{{ ingredient.category }}</span>
          </div>
          <div class="detail-item">
            <span class="label">{{ $t('ingredient.type') }}</span>
            <span>{{ ingredient.type }}</span>
          </div>
        </div>
      </div>

      <div class="dialog-footer">
        <div class="unit-price-display">
          ${{ ingredient.unitPrice.toFixed(2) }}/{{ displayUnit }}
        </div>
        <div class="button-group">
          <button class="edit-btn" @click="emit('edit', ingredient)">{{ $t('ingredient.editContent') }}</button>
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
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
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
}

.dialog-header {
  background: #333;
  padding: 1rem 1.5rem;
  border-radius: 12px 12px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dialog-header h2 {
  color: white;
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
  transition: color 0.2s ease;
}

.close-btn:hover {
  color: white;
}

.dialog-content {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.detail-list {
  display: flex;
  flex-direction: column;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid #eee;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-item .label {
  color: #666;
  font-size: 0.875rem;
}

.dialog-footer {
  position: sticky;
  bottom: 0;
  background: white;
  padding: 1.25rem;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 0 0 12px 12px;
}

.unit-price-display {
  color: var(--primary-color);
  font-weight: 500;
  font-size: 0.875rem;
}

.button-group {
  display: flex;
  gap: 0.75rem;
}

.edit-btn {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 0.75rem 1.25rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.edit-btn:hover {
  background: #e55a2a;
}

.delete-btn {
  background: white;
  border: 1px solid var(--primary-color);
  color: var(--primary-color);
  padding: 0.75rem 1.25rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.delete-btn:hover {
  background: #fff1ec;
}
</style>
