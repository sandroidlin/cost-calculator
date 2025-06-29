<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useIngredientsStore } from '@/stores/ingredients'
import { useRecipesStore } from '@/stores/recipes'
import type { Ingredient, UnitType } from '@/stores/ingredients'
import type { RecipeIngredient, IceType } from '@/stores/recipes'
import { ICE_PRICES } from '@/stores/recipes'

const ingredientsStore = useIngredientsStore()
const recipesStore = useRecipesStore()
const { ingredients } = storeToRefs(ingredientsStore)

const unitOptions: UnitType[] = ['ml', 'g', 'dash', '份']
const iceOptions = Object.keys(ICE_PRICES) as IceType[]

const newRecipe = ref({
  name: '',
  bartenderName: '',
  glass: '',
  ice: '' as IceType,
  method: 'shake' as const,
  garnishes: [] as RecipeIngredient[],
  ingredients: [] as RecipeIngredient[],
})

const searchQuery = ref('')
const showDropdown = ref(false)
const selectedIngredient = ref(null as number | null)
const amount = ref('')
const selectedUnit = ref(unitOptions[0])

const filteredIngredients = computed(() => {
  return ingredients.value.filter((ing: Ingredient) =>
    ing.name.toLowerCase().includes(searchQuery.value.toLowerCase()),
  )
})

const recipeTotalCost = computed(() => {
  const ingredientsCost = newRecipe.value.ingredients.reduce((total, ing) => {
    return total + ing.unitPrice * ing.amount
  }, 0)

  const iceCost = newRecipe.value.ice ? ICE_PRICES[newRecipe.value.ice] : 0
  return ingredientsCost + iceCost
})

const getIngredientUnit = (ingredient: Ingredient): string => {
  return ingredient.type === '單一材料' ? ingredient.unit : ingredient.mainUnit
}

const addIngredientToRecipe = () => {
  if (!selectedIngredient.value || !amount.value) return

  const ingredient = ingredients.value.find((i: Ingredient) => i.id === selectedIngredient.value)
  if (!ingredient) return

  const unit = getIngredientUnit(ingredient)

  newRecipe.value.ingredients.push({
    id: Date.now(),
    ingredientId: ingredient.id,
    amount: parseFloat(amount.value),
    name: ingredient.name,
    unit,
    unitPrice: ingredient.unitPrice,
  })

  // Reset selection
  selectedIngredient.value = null
  amount.value = ''
  searchQuery.value = ''
  showDropdown.value = false
}

const removeIngredientFromRecipe = (id: number) => {
  newRecipe.value.ingredients = newRecipe.value.ingredients.filter((ing) => ing.id !== id)
}

const saveRecipe = () => {
  if (!newRecipe.value.name || newRecipe.value.ingredients.length === 0) return

  recipesStore.addRecipe({
    name: newRecipe.value.name,
    bartenderName: newRecipe.value.bartenderName,
    glass: newRecipe.value.glass,
    ice: newRecipe.value.ice as IceType,
    method: newRecipe.value.method,
    ingredients: [...newRecipe.value.ingredients],
    garnishes: [...newRecipe.value.garnishes],
    totalCost: recipeTotalCost.value,
  })

  // Reset form
  newRecipe.value = {
    name: '',
    bartenderName: '',
    glass: '',
    ice: '' as IceType,
    method: 'shake',
    garnishes: [],
    ingredients: [],
  }
}
</script>

<template>
  <div class="recipe-creator">
    <h2>新增酒譜</h2>

    <form @submit.prevent="saveRecipe" class="recipe-form">
      <div class="basic-info">
        <h3>基本資訊</h3>
        <div class="form-group">
          <label for="recipeName">酒名：</label>
          <input
            id="recipeName"
            v-model="newRecipe.name"
            type="text"
            required
            placeholder="請輸入姓名"
          />
        </div>

        <div class="form-group">
          <label for="bartenderName">調酒師名：</label>
          <input
            id="bartenderName"
            v-model="newRecipe.bartenderName"
            type="text"
            required
            placeholder="請輸入姓名"
          />
        </div>
      </div>

      <div class="ingredients-section">
        <h3>酒體材料</h3>

        <div class="ingredient-selector">
          <div class="form-group ingredient-search">
            <label>材料：</label>
            <div class="dropdown-container">
              <input
                v-model="searchQuery"
                @focus="showDropdown = true"
                type="text"
                placeholder="請選擇材料"
              />
              <div v-if="showDropdown" class="dropdown-list">
                <div
                  v-for="ingredient in filteredIngredients"
                  :key="ingredient.id"
                  class="dropdown-item"
                  :class="{ selected: selectedIngredient === ingredient.id }"
                  @click="
                    selectedIngredient = ingredient.id
                    showDropdown = false
                    searchQuery = ingredient.name
                  "
                >
                  {{ ingredient.name }}
                </div>
              </div>
            </div>
          </div>

          <div class="form-group amount-input">
            <input v-model="amount" type="number" step="0.01" min="0" placeholder="輸入數量" />
          </div>

          <div class="form-group unit-select">
            <select v-model="selectedUnit">
              <option v-for="unit in unitOptions" :key="unit" :value="unit">
                {{ unit }}
              </option>
            </select>
          </div>

          <button
            type="button"
            @click="addIngredientToRecipe"
            :disabled="!selectedIngredient || !amount"
            class="add-ingredient-btn"
          >
            新增材料
          </button>
        </div>

        <div class="selected-ingredients">
          <table v-if="newRecipe.ingredients.length">
            <thead>
              <tr>
                <th>材料</th>
                <th>數量</th>
                <th>成本</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="ingredient in newRecipe.ingredients" :key="ingredient.id">
                <td>{{ ingredient.name }}</td>
                <td>{{ ingredient.amount }} {{ ingredient.unit }}</td>
                <td>${{ (ingredient.amount * ingredient.unitPrice).toFixed(2) }}</td>
                <td>
                  <button
                    @click="removeIngredientFromRecipe(ingredient.id)"
                    class="delete-btn"
                    type="button"
                  >
                    刪除
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <p v-else>No ingredients added to recipe yet.</p>
        </div>
      </div>

      <div class="style-section">
        <h3>造型</h3>
        <div class="form-group">
          <label for="glass">杯子：</label>
          <input id="glass" v-model="newRecipe.glass" type="text" required />
        </div>

        <div class="form-group">
          <label for="ice">冰塊：</label>
          <select id="ice" v-model="newRecipe.ice" required>
            <option value="">請選擇冰塊大小</option>
            <option v-for="ice in iceOptions" :key="ice" :value="ice">
              {{ ice }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label for="garnish">裝飾物：</label>
          <input id="garnish" v-model="newRecipe.garnishes[0].name" type="text" />
        </div>
      </div>

      <div class="sticky-footer">
        <div class="total-cost">
          成本：<strong>${{ recipeTotalCost.toFixed(2) }}</strong>
        </div>
        <button
          type="submit"
          class="save-recipe-btn"
          :disabled="!newRecipe.name || newRecipe.ingredients.length === 0"
        >
          新增酒譜
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.recipe-creator {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

h2 {
  color: #333;
  margin-bottom: 2rem;
}

.recipe-form {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 2rem;
}

.basic-info,
.ingredients-section,
.style-section {
  margin-bottom: 2.5rem;
}

h3 {
  color: #333;
  font-size: 1.2rem;
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #eee;
}

.form-group {
  margin-bottom: 1.5rem;
}

.ingredient-selector {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr auto;
  gap: 1rem;
  align-items: flex-end;
  margin-bottom: 1.5rem;
}

.dropdown-container {
  position: relative;
}

.dropdown-list {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  max-height: 200px;
  overflow-y: auto;
  background: white;
  border: 1px solid #eee;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.dropdown-item {
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dropdown-item:hover,
.dropdown-item.selected {
  background: #f5f5f5;
  color: var(--primary-color);
}

label {
  display: block;
  margin-bottom: 0.5rem;
  color: #666;
  font-size: 0.9rem;
}

input,
select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #eee;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s ease;
}

input:focus,
select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(255, 107, 53, 0.1);
}

select {
  background: white;
  cursor: pointer;
}

.add-ingredient-btn {
  background: var(--primary-color);
  color: white;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.add-ingredient-btn:hover:not(:disabled) {
  background: #e55a2a;
  transform: translateY(-1px);
}

.add-ingredient-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1.5rem;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

th,
td {
  padding: 1rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

th {
  background: #f5f5f5;
  color: #666;
  font-weight: 500;
  font-size: 0.9rem;
}

td {
  color: #333;
}

.delete-btn {
  background: white;
  color: #ff4444;
  border: 1px solid #ff4444;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.delete-btn:hover {
  background: #fff1f1;
}

.sticky-footer {
  position: sticky;
  bottom: 0;
  background: white;
  padding: 1rem 2rem;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 2rem -2rem -2rem;
  border-radius: 0 0 12px 12px;
}

.total-cost {
  color: #333;
  font-size: 1.1rem;
}

.total-cost strong {
  color: var(--primary-color);
  font-size: 1.2rem;
}

.save-recipe-btn {
  background: var(--primary-color);
  color: white;
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.save-recipe-btn:hover:not(:disabled) {
  background: #e55a2a;
  transform: translateY(-1px);
}

.save-recipe-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
