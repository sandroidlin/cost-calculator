<script setup lang="ts">
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useRecipesStore } from '@/stores/recipes'
import { useIngredientsStore } from '@/stores/ingredients'
import type { RecipeIngredient, Recipe, IceType, RecipeStatus } from '@/stores/recipes'
import { ICE_PRICES } from '@/stores/recipes'
import type { Ingredient } from '@/stores/ingredients'
import RecipeDetailDialog from './RecipeDetailDialog.vue'
import RecipeForm from './RecipeForm.vue'

const recipesStore = useRecipesStore()
const ingredientsStore = useIngredientsStore()
const { recipes } = storeToRefs(recipesStore)
const { ingredients } = storeToRefs(ingredientsStore)

const showCreateDialog = ref(false)
const showRecipeDialog = ref(false)
const showEditDialog = ref(false)
const selectedRecipe = ref<Recipe | null>(null)
const showNotification = ref(false)
const notificationMessage = ref('')

const selectedStatus = ref<RecipeStatus>('complete')

const filteredRecipes = computed(() => {
  return recipes.value.filter(recipe => recipe.status === selectedStatus.value)
})

const recipeCounts = computed(() => ({
  draft: recipes.value.filter(recipe => recipe.status === 'draft').length,
  complete: recipes.value.filter(recipe => recipe.status === 'complete').length
}))

interface IngredientInput {
  id: number
  ingredient: null | Ingredient
  amount: number
}

const newRecipe = ref({
  name: '',
  bartenderName: '',
  glass: '',
  ice: 'no冰' as IceType,
  method: 'shake' as 'shake' | 'double strain shake' | 'stir' | 'blend' | 'Co2' | 'tap',
  ingredients: [] as RecipeIngredient[],
  garnishes: [] as RecipeIngredient[],
  totalCost: 0
})

const preparationMethods = ['shake', 'double strain shake', 'stir', 'blend', 'Co2', 'tap'] as const
type PreparationMethod = typeof preparationMethods[number]

const ingredientInputs = ref<IngredientInput[]>([
  { id: Date.now(), ingredient: null, amount: 0 }
])

const iceOptions = Object.keys(ICE_PRICES) as IceType[]

const ingredientSearchQuery = ref('')
const showIngredientDropdown = ref<number | null>(null)

const filteredIngredients = computed(() => {
  if (!ingredientSearchQuery.value) return ingredients.value
  const query = ingredientSearchQuery.value.toLowerCase()
  return ingredients.value.filter(ing => 
    ing.name.toLowerCase().includes(query)
  )
})

const selectIngredient = (inputId: number, ingredient: typeof ingredients.value[0]) => {
  const input = ingredientInputs.value.find(i => i.id === inputId)
  if (input) {
    input.ingredient = ingredient
  }
  showIngredientDropdown.value = null
  ingredientSearchQuery.value = ''
}

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

const calculateTotalCost = computed(() => {
  return ingredientInputs.value.reduce((total, input) => {
    if (!input.ingredient || !input.amount) return total
    return total + (input.amount * input.ingredient.unitPrice)
  }, 0)
})

const getIngredientUnit = (ingredient: Ingredient): string => {
  return ingredient.type === '單一材料' ? ingredient.unit : ingredient.mainUnit
}

const addRecipe = () => {
  if (!newRecipe.value.name || !newRecipe.value.bartenderName) return

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

  if (recipeIngredients.length === 0) return

  recipesStore.addRecipe({
    ...newRecipe.value,
    ingredients: recipeIngredients,
    totalCost: calculateTotalCost.value
  })

  // Show notification
  notificationMessage.value = `${newRecipe.value.name}已成功加入資料庫`
  showNotification.value = true
  setTimeout(() => {
    showNotification.value = false
  }, 3000)

  // Close dialog and reset form
  closeCreateDialog()
}

const closeCreateDialog = () => {
  showCreateDialog.value = false
  // Reset form
  newRecipe.value = {
    name: '',
    bartenderName: '',
    glass: '',
    ice: 'no冰',
    method: 'shake',
    ingredients: [],
    garnishes: [],
    totalCost: 0
  }
  ingredientInputs.value = [{ id: Date.now(), ingredient: null, amount: 0 }]
}

const getSearchValue = (input: IngredientInput) => {
  if (showIngredientDropdown.value === input.id) {
    return ingredientSearchQuery.value
  }
  return input.ingredient?.name || ''
}

const searchInputValue = computed({
  get: () => ingredientSearchQuery.value,
  set: (value: string) => {
    ingredientSearchQuery.value = value
  }
})

const openRecipeDialog = (recipe: Recipe) => {
  if (recipe.status === 'draft') {
    // Directly open draft recipes in edit mode
    openEditDialog(recipe)
  } else {
    selectedRecipe.value = recipe
    showRecipeDialog.value = true
  }
}

const closeRecipeDialog = () => {
  showRecipeDialog.value = false
  selectedRecipe.value = null
}

const openEditDialog = (recipe: Recipe) => {
  selectedRecipe.value = recipe
  showEditDialog.value = true
  showRecipeDialog.value = false
}

const handleSaveRecipe = (recipe: Recipe) => {
  if (recipe.id && recipes.value.find(r => r.id === recipe.id)) {
    // Update existing recipe
    const index = recipes.value.findIndex(r => r.id === recipe.id)
    if (index !== -1) {
      recipes.value[index] = recipe
      recipesStore.saveRecipes()
      notificationMessage.value = `${recipe.name}的內容已被更新`
    }
  } else {
    // Add new recipe
    recipesStore.addRecipe(recipe)
    notificationMessage.value = `${recipe.name}已成功加入資料庫`
  }

  showNotification.value = true
  setTimeout(() => {
    showNotification.value = false
  }, 3000)

  closeCreateDialog()
  closeEditDialog()
}

const handleDeleteRecipe = (id: number) => {
  recipesStore.removeRecipe(id)
  closeRecipeDialog()
}

const closeEditDialog = () => {
  showEditDialog.value = false
  selectedRecipe.value = null
}

// Add this computed property for edit form cost calculation
const editFormTotalCost = computed(() => {
  return ingredientInputs.value.reduce((total, input) => {
    if (!input.ingredient || !input.amount) return total
    return total + (input.amount * input.ingredient.unitPrice)
  }, 0)
})
</script>

<template>
  <div class="recipe-list">
    <div class="header">
      <h2>酒譜一覽</h2>
      <button class="add-btn" @click="showCreateDialog = true">
        <span class="plus-icon">+</span> 新增酒譜 
      </button>
    </div>

    <div class="tab-container">
      <div class="tabs">
        <button 
          class="tab-btn"
          :class="{ active: selectedStatus === 'complete' }"
          @click="selectedStatus = 'complete'"
        >
          完成區
          <span class="badge">{{ recipeCounts.complete }}</span>
        </button>
        <button 
          class="tab-btn"
          :class="{ active: selectedStatus === 'draft' }"
          @click="selectedStatus = 'draft'"
        >
          暫存區
          <span class="badge">{{ recipeCounts.draft }}</span>
        </button>
      </div>
    </div>

    <div v-if="recipes.length === 0" class="empty-state">
      <p>尚未新增任何酒譜</p>
      <button class="add-recipe-btn" @click="showCreateDialog = true">
        立即新增第一個酒譜
      </button>
    </div>
    
    <template v-else>
      <div v-if="filteredRecipes.length > 0" class="recipes-grid">
        <div 
          v-for="recipe in filteredRecipes" 
          :key="recipe.id"
          class="recipe-card"
          @click="openRecipeDialog(recipe)"
        >
          <div class="recipe-info">
            <div class="recipe-main-info">
              <span class="recipe-name">{{ recipe.name }}</span>
              <span class="bartender-tag">{{ recipe.bartenderName }}</span>
            </div>
            <div class="recipe-cost">
              <span class="cost-label">成本</span>
              <span class="cost-value">${{ recipe.totalCost.toFixed(2) }}</span>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <p>此分類中尚無酒譜</p>
        <button class="add-recipe-btn" @click="showCreateDialog = true">
          新增酒譜
        </button>
      </div>
    </template>

    <!-- Recipe Detail Dialog -->
    <RecipeDetailDialog
      v-if="showRecipeDialog && selectedRecipe"
      :recipe="selectedRecipe"
      @close="closeRecipeDialog"
      @edit="openEditDialog"
      @delete="handleDeleteRecipe"
    />

    <!-- Create Recipe Dialog -->
    <div v-if="showCreateDialog" class="dialog-overlay" @click="closeCreateDialog">
      <div class="dialog" @click.stop>
        <div class="dialog-header">
          <h2>新增酒譜</h2>
          <button class="close-btn" @click="closeCreateDialog">✕</button>
        </div>
        
        <RecipeForm
          :ingredients="ingredients"
          mode="create"
          @save="handleSaveRecipe"
          @cancel="closeCreateDialog"
        />
      </div>
    </div>

    <!-- Edit Recipe Dialog -->
    <div v-if="showEditDialog && selectedRecipe" class="dialog-overlay" @click="closeEditDialog">
      <div class="dialog" @click.stop>
        <div class="dialog-header">
          <h2>修改酒譜</h2>
          <button class="close-btn" @click="closeEditDialog">✕</button>
        </div>
        
        <RecipeForm
          :ingredients="ingredients"
          :initial-recipe="selectedRecipe"
          mode="edit"
          @save="handleSaveRecipe"
          @cancel="closeEditDialog"
        />
      </div>
    </div>

    <!-- Notification -->
    <div 
      v-if="showNotification" 
      class="notification"
      @click="showNotification = false"
    >
      {{ notificationMessage }}
    </div>
  </div>
</template>

<style scoped>
.recipe-list {
  width: 100%;
}

.header {
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.header h2 {
  font-size: 1.25rem;
  font-weight: 500;
  margin: 0;
}

.add-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--primary-color);
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  cursor: pointer;
}

.add-btn:hover {
  background: #e55a2a;
  transform: translateY(-1px);
}

.tab-container {
  margin: 2rem 0;
  border-bottom: 1px solid #eee;
  width: 100%;
}

.tabs {
  display: flex;
  gap: 2rem;
}

.recipes-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 2rem;
  width: 100%;
}

.recipe-card {
  width: 100%;
  background: white;
  border: 1px solid #eee;
  border-radius: 12px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.recipe-card:hover {
  transform: translateY(-2px);
  border-color: var(--primary-color);
  background: #fff8f6;
  box-shadow: 0 4px 8px rgba(255, 107, 53, 0.1);
}

.recipe-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.recipe-main-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.recipe-name {
  font-size: 0.875rem;
  color: #333;
  font-weight: 500;
}

.bartender-tag {
  font-size: 0.75rem;
  color: var(--primary-color);
  border: 1px solid var(--primary-color);
  padding: 0.125rem 0.5rem;
  border-radius: 999px;
  background: white;
  display: inline-block;
}

.recipe-cost {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.cost-label {
  color: #666;
  font-size: 0.875rem;
}

.cost-value {
  color: var(--primary-color);
  font-size: 0.875rem;
  font-weight: 500;
}

.empty-state {
  text-align: center;
  padding: 4rem 0;
  background: white;
  border-radius: 12px;
  border: 2px dashed #eee;
  margin: 2rem 0;
}

.empty-state p {
  color: #666;
  margin-bottom: 1.5rem;
  font-size: 1.1rem;
}

.add-recipe-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--primary-color);
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  cursor: pointer;
}

.add-recipe-btn:hover {
  background: #e55a2a;
  transform: translateY(-1px);
}

/* Dialog Styles */
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
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  background: #333;
  padding: 1.25rem 1.5rem;
  border-radius: 12px 12px 0 0;
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

.recipe-details {
  background: #f9f9f9;
  border-radius: 8px;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #eee;
}

.detail-item:last-child {
  border-bottom: none;
}

.ingredients-list {
  margin-top: 1.5rem;
}

.ingredients-list h4 {
  margin: 0 0 1rem;
  color: #333;
}

.ingredients-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.ingredients-list li {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem;
  background: white;
  border: 1px solid #eee;
  border-radius: 6px;
  margin-bottom: 0.5rem;
}

.ingredient-cost {
  color: #666;
  font-size: 0.875rem;
}

.recipe-footer {
  margin-top: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1.5rem;
  border-top: 1px solid #eee;
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

.dialog-footer {
  position: sticky;
  bottom: 0;
  background: white;
  padding: 1.25rem;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  border-radius: 0 0 12px 12px;
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

.save-btn {
  padding: 0.75rem 1.5rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 100px;
}

.save-btn:hover:not(:disabled) {
  background: #e55a2a;
}

.save-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.notification {
  position: fixed;
  top: 2rem;
  right: 2rem;
  background: var(--primary-color);
  color: white;
  padding: 1rem 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  z-index: 2000;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.method-select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.875rem;
  background: white;
  color: #333;
}

.method-select:focus {
  outline: none;
  border-color: var(--primary-color);
}

.search-select {
  position: relative;
  width: 100%;
}

.ingredient-search {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #eee;
  border-radius: 6px;
  font-size: 0.875rem;
  background: white;
  transition: all 0.2s ease;
  color: #333;
}

.ingredient-search::placeholder {
  color: #999;
}

.ingredient-search:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(255, 107, 53, 0.1);
}

.search-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #eee;
  border-radius: 6px;
  margin-top: 4px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.dropdown-item {
  padding: 0.75rem;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background-color 0.2s ease;
}

.dropdown-item:hover {
  background-color: #f9f9f9;
}

.dropdown-item:not(:last-child) {
  border-bottom: 1px solid #eee;
}

.item-name {
  color: #333;
  font-weight: 500;
}

.item-price {
  color: #666;
  font-size: 0.875rem;
}

.no-results {
  padding: 0.75rem;
  text-align: center;
  color: #666;
  font-size: 0.875rem;
}

.form-section {
  background: white;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.form-section h3 {
  font-size: 1rem;
  color: #333;
  margin: 0 0 1.25rem 0;
  font-weight: 500;
}

.detail-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem;
  background: #f9f9f9;
  border: 1px solid #eee;
  border-radius: 6px;
}

.ingredient-info {
  display: flex;
  gap: 1rem;
  align-items: center;
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

.form-section {
  background: white;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.form-section h3 {
  font-size: 1rem;
  color: #333;
  margin: 0 0 1.25rem 0;
  font-weight: 500;
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

.ingredient-row {
  margin-bottom: 1rem;
  display: grid;
  grid-template-columns: 2fr 1fr auto;
  gap: 1rem;
  align-items: center;
}

.ingredient-row:last-child {
  margin-bottom: 0;
}

.ingredient-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.search-select {
  flex: 2;
}

.amount-input {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.amount-input input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #eee;
  border-radius: 6px;
  font-size: 0.875rem;
}

.amount-input input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(255, 107, 53, 0.1);
}

.unit {
  color: #666;
  font-size: 0.875rem;
  white-space: nowrap;
}

.remove-ingredient-btn {
  padding: 0.5rem 1rem;
  color: #ff4444;
  background: white;
  border: 1px solid #ff4444;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.remove-ingredient-btn:hover {
  background: #fff1ec;
  color: #cc0000;
  border-color: #cc0000;
}

.add-more-btn {
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
  margin-top: 1rem;
  font-size: 0.875rem;
}

.add-more-btn:hover {
  background: #fff1ec;
}

.plus-icon {
  font-size: 1.125rem;
  font-weight: bold;
  line-height: 1;
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

.recipe-title {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.recipe-title h2 {
  margin: 0;
  font-size: 1.5rem;
  color: white;
  font-weight: 500;
}

.bartender-name {
  margin: 0;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.875rem;
}

.detail-section {
  margin-bottom: 2rem;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.detail-section h3 {
  font-size: 1rem;
  color: #333;
  margin: 0 0 1rem 0;
  font-weight: 500;
}

.ingredients-list {
  display: flex;
  flex-direction: column;
}

.ingredient-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #f9f9f9;
}

.ingredient-item:not(:last-child) {
  border-bottom: 1px solid #eee;
}

.ingredient-name {
  font-weight: 500;
  color: #333;
}

.ingredient-amount {
  color: #666;
}

.presentation-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.presentation-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #f9f9f9;
}

.presentation-item .label {
  color: #666;
  font-size: 0.875rem;
}

.tab-container {
  margin: 2rem 0;
  border-bottom: 1px solid #eee;
}

.tabs {
  display: flex;
  gap: 2rem;
}

.tab-btn {
  position: relative;
  padding: 0.75rem 0;
  background: none;
  border: none;
  color: #666;
  font-size: 0.875rem;
  cursor: pointer;
  transition: color 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tab-btn::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 100%;
  height: 2px;
  background: var(--primary-color);
  transform: scaleX(0);
  transition: transform 0.2s;
}

.tab-btn:hover {
  color: var(--primary-color);
}

.tab-btn.active {
  color: var(--primary-color);
}

.tab-btn.active::after {
  transform: scaleX(1);
}

.badge {
  background: #f5f5f5;
  color: #666;
  padding: 0.125rem 0.5rem;
  border-radius: 999px;
  font-size: 0.75rem;
  min-width: 1.5rem;
  text-align: center;
}

.tab-btn.active .badge {
  background: var(--primary-color);
  color: white;
}
</style> 