<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'
import type { SingleIngredient } from '@/stores/ingredients'

defineProps<{
  ingredient: SingleIngredient
}>()

const emit = defineEmits<{
  close: []
  delete: [id: number]
  edit: [ingredient: SingleIngredient]
}>()
</script>

<template>
  <div class="dialog-overlay">
    <div class="dialog">
      <div class="dialog-header">
        <div class="header-content">
          <h2>{{ ingredient.name }}</h2>
          <span class="type-pill">單一材料</span>
        </div>
        <button class="close-btn" @click="emit('close')">✕</button>
      </div>
      
      <div class="dialog-content">
        <div class="detail-section">
          <div class="detail-row">
            <span class="label">分類</span>
            <span class="value">{{ ingredient.category }}</span>
          </div>
          <div class="detail-row">
            <span class="label">數量</span>
            <span class="value">{{ ingredient.amount }} {{ ingredient.unit }}</span>
          </div>
          <div class="detail-row">
            <span class="label">單價</span>
            <span class="value">${{ ingredient.totalPrice }}</span>
          </div>
          <div class="detail-row">
            <span class="label">成本</span>
            <span class="value">${{ ingredient.unitPrice }}/{{ ingredient.unit }}</span>
          </div>
        </div>

        <div class="dialog-actions">
          <button 
            class="edit-btn"
            @click="emit('edit', ingredient)"
          >
            修改材料
          </button>
          <button 
            class="delete-btn"
            @click="emit('delete', ingredient.id)"
          >
            刪除材料
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
  background: #f9f9f9;
}

.detail-section {
  background: white;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 1.5rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
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
  margin-top: 1.5rem;
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