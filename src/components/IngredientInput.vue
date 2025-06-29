<script setup lang="ts">
import { ref, computed, defineProps, defineEmits } from 'vue'
import type { Ingredient } from '@/stores/ingredients'

const props = defineProps<{
  ingredients: Ingredient[]
  initialIngredient?: Ingredient | null
  initialAmount?: number
  showDelete?: boolean
}>()

const emit = defineEmits<{
  update: [data: { ingredient: Ingredient | null; amount: number }]
  remove: []
}>()

const selectedIngredient = ref<Ingredient | null>(props.initialIngredient || null)
const amount = ref(props.initialAmount || 0)
const showDropdown = ref(false)
const searchQuery = ref(selectedIngredient.value?.name || '')

const filteredIngredients = computed(() => {
  if (!searchQuery.value) return props.ingredients
  const query = searchQuery.value.toLowerCase()
  return props.ingredients.filter((ing) => ing.name.toLowerCase().includes(query))
})

const getIngredientUnit = (ingredient: Ingredient): string => {
  return ingredient.type === '單一材料' ? ingredient.unit : ingredient.mainUnit
}

const selectIngredient = (ingredient: Ingredient) => {
  selectedIngredient.value = ingredient
  showDropdown.value = false
  searchQuery.value = ingredient.name
  emit('update', { ingredient, amount: amount.value })
}

const updateAmount = (event: Event) => {
  const target = event.target as HTMLInputElement
  const newAmount = parseFloat(target.value)
  amount.value = newAmount
  if (selectedIngredient.value) {
    emit('update', { ingredient: selectedIngredient.value, amount: newAmount })
  }
}

const subtotalCost = computed(() => {
  if (!selectedIngredient.value || !amount.value) return 0
  return selectedIngredient.value.unitPrice * amount.value
})
</script>

<template>
  <div class="ingredient-input">
    <div class="input-group">
      <div class="search-container">
        <input
          v-model="searchQuery"
          @focus="showDropdown = true"
          type="text"
          placeholder="選擇材料"
        />
        <div v-if="showDropdown" class="dropdown">
          <div
            v-for="ingredient in filteredIngredients"
            :key="ingredient.id"
            class="dropdown-item"
            @click="selectIngredient(ingredient)"
          >
            <span class="ingredient-name">{{ ingredient.name }}</span>
            <span class="ingredient-type">{{ ingredient.type }}</span>
          </div>
        </div>
      </div>

      <div class="amount-input">
        <input
          v-model.number="amount"
          type="number"
          min="0"
          step="1"
          @input="updateAmount($event)"
          :placeholder="
            selectedIngredient ? '輸入' + getIngredientUnit(selectedIngredient) + '數' : '數量'
          "
        />
        <span v-if="selectedIngredient" class="unit">{{
          getIngredientUnit(selectedIngredient)
        }}</span>
      </div>

      <button v-if="props.showDelete" type="button" class="remove-btn" @click="emit('remove')">
        ✕
      </button>
    </div>
    <div v-if="selectedIngredient && amount > 0" class="subtotal">
      小計: ${{ subtotalCost.toFixed(2) }}
    </div>
  </div>
</template>

<style scoped>
.ingredient-input {
  width: 100%;
}

.input-group {
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;
}

.search-container {
  flex: 2;
  position: relative;
}

.search-container input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #eee;
  border-radius: 6px;
  font-size: 0.875rem;
}

.dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  max-height: 200px;
  overflow-y: auto;
  background: white;
  border: 1px solid #eee;
  border-radius: 6px;
  margin-top: 0.25rem;
  z-index: 100;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.dropdown-item {
  padding: 0.75rem;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background-color 0.2s;
}

.dropdown-item:hover {
  background: #f9f9f9;
}

.ingredient-name {
  color: #333;
}

.ingredient-type {
  font-size: 0.75rem;
  color: #666;
  background: #f5f5f5;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.amount-input {
  flex: 1;
  position: relative;
}

.amount-input input {
  width: 100%;
  padding: 0.75rem;
  padding-right: 2.5rem;
  border: 1px solid #eee;
  border-radius: 6px;
  font-size: 0.875rem;
}

.unit {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
  font-size: 0.875rem;
}

.remove-btn {
  padding: 0.75rem;
  background: white;
  border: 1px solid #ff4444;
  color: #ff4444;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-btn:hover {
  background: #fff5f5;
}

input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(255, 107, 53, 0.1);
}

.subtotal {
  font-size: 0.75rem;
  color: #666;
  margin-top: 0.25rem;
  padding-left: 0.25rem;
}
</style>
