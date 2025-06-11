<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'
import { storeToRefs } from 'pinia'
import { useRecipesStore } from '@/stores/recipes'
import type { Recipe } from '@/stores/recipes'

const props = defineProps<{
  recipe: Recipe
}>()

const emit = defineEmits<{
  close: []
  edit: [recipe: Recipe]
  delete: [id: number]
}>()

const recipesStore = useRecipesStore()
</script>

<template>
  <div class="dialog-overlay">
    <div class="dialog">
      <div class="dialog-header">
        <div class="header-content">
          <h2>{{ recipe.name }}</h2>
          <div class="bartender">{{ recipe.bartenderName }}</div>
        </div>
        <button class="close-btn" @click="emit('close')">✕</button>
      </div>
      
      <div class="dialog-content">
        <div class="section">
          <h3>酒體材料</h3>
          <div class="content-card">
            <div class="ingredients-list">
              <div 
                v-for="ingredient in recipe.ingredients" 
                :key="ingredient.id"
                class="ingredient-item"
              >
                <span class="ingredient-name">{{ ingredient.name }}</span>
                <span class="ingredient-amount">{{ ingredient.amount }} {{ ingredient.unit }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="section">
          <h3>作法</h3>
          <div class="content-card">
            <div class="method-value">{{ recipe.method }}</div>
          </div>
        </div>

        <div class="section">
          <h3>呈現</h3>
          <div class="content-card">
            <div class="presentation-list">
              <div class="detail-item">
                <span class="label">杯子</span>
                <span>{{ recipe.glass }}</span>
              </div>
              <div class="detail-item">
                <span class="label">冰塊</span>
                <span>{{ recipe.ice }}</span>
              </div>
              <div class="detail-item">
                <span class="label">裝飾物</span>
                <div class="garnishes-list">
                  <div 
                    v-for="garnish in recipe.garnishes" 
                    :key="garnish.id"
                    class="garnish-item"
                  >
                    {{ garnish.name }} {{ garnish.amount }} {{ garnish.unit }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="dialog-footer">
        <div class="total-cost">
          <span class="total-cost-label">總成本：</span>
          <span class="total-cost-value">${{ recipe.totalCost.toFixed(2) }}</span>
        </div>
        <div class="button-group">
          <button 
            class="edit-btn" 
            @click="emit('edit', recipe)"
          >
            修改內容
          </button>
          <button 
            class="delete-btn" 
            @click="emit('delete', recipe.id)"
          >
            刪除酒譜
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
  align-items: flex-start;
}

.header-content {
  flex: 1;
}

.dialog-header h2 {
  color: white;
  margin: 0;
  font-size: 1.25rem;
  font-weight: 500;
}

.bartender {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.875rem;
  margin-top: 0.25rem;
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
  background: #f9f9f9;
}

.section {
  margin-bottom: 1.5rem;
}

.section:last-child {
  margin-bottom: 0;
}

.section h3 {
  font-size: 0.875rem;
  color: #333;
  margin: 0 0 0.75rem 0;
  font-weight: 500;
}

.content-card {
  background: white;
  border-radius: 12px;
  padding: 0.5rem 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.ingredients-list,
.presentation-list {
  display: flex;
  flex-direction: column;
}

.ingredient-item,
.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #eee;
}

.ingredient-item:last-child,
.detail-item:last-child {
  border-bottom: none;
}

.ingredient-name,
.label {
  color: #333;
  font-size: 0.875rem;
}

.ingredient-amount {
  color: #666;
  font-size: 0.875rem;
}

.method-value {
  color: #333;
  font-size: 0.875rem;
  padding: 0.5rem 0;
}

.garnishes-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.garnish-item {
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

.total-cost {
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
}

.total-cost-label {
  color: #666;
  font-size: 0.875rem;
}

.total-cost-value {
  color: var(--primary-color);
  font-weight: 500;
  font-size: 1.25rem;
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