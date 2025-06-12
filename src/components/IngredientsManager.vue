<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useIngredientsStore } from '@/stores/ingredients'
import type { Ingredient, SingleIngredient, CompoundIngredient, UnitType, CategoryType } from '@/stores/ingredients'
import { UNIT_STEPS, CATEGORIES } from '@/stores/ingredients'
import SingleIngredientForm from './SingleIngredientForm.vue'
import CompoundIngredientForm from './CompoundIngredientForm.vue'
import SingleIngredientDetailDialog from './SingleIngredientDetailDialog.vue'
import CompoundIngredientDetailDialog from './CompoundIngredientDetailDialog.vue'

const ingredientsStore = useIngredientsStore()
const { ingredients } = storeToRefs(ingredientsStore)

onMounted(() => {
  ingredientsStore.loadSavedIngredients()
})

const selectedIngredient = ref<Ingredient | null>(null)
const showDialog = ref(false)
const showCreateDialog = ref(false)
const showCompoundIngredientForm = ref(false)
const showEditDialog = ref(false)
const showNotification = ref(false)
const notificationMessage = ref('')

const formData = ref<Omit<SingleIngredient, 'id' | 'type' | 'unitPrice'>>({
  name: '',
  category: '基酒',
  amount: 0,
  unit: 'ml',
  totalPrice: 0
})

const editingIngredient = ref<Ingredient>({
  id: 0,
  name: '',
  category: '基酒',
  type: '單一材料',
  amount: 0,
  unit: 'ml',
  totalPrice: 0,
  unitPrice: 0
})

const unitOptions: UnitType[] = ['ml', 'g', 'dash', '份']

const calculatedUnitPrice = computed(() => {
  if (!formData.value.amount || !formData.value.totalPrice) return 0
  return Math.round((formData.value.totalPrice / formData.value.amount) * 100) / 100
})

const searchQuery = ref('')
const selectedCategory = ref<CategoryType | '全部'>('全部')
const currentPage = ref(1)
const itemsPerPage = 20

const filteredIngredients = computed(() => {
  let filtered = ingredients.value

  if (selectedCategory.value !== '全部') {
    filtered = filtered.filter(ing => ing.category === selectedCategory.value)
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(ing => ing.name.toLowerCase().includes(query))
  }

  return filtered
})

const paginatedIngredients = computed(() => {
  const startIndex = (currentPage.value - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  return filteredIngredients.value.slice(startIndex, endIndex)
})

const totalPages = computed(() => 
  Math.ceil(filteredIngredients.value.length / itemsPerPage)
)

const getPageButtons = computed(() => {
  const totalPagesCount = totalPages.value
  const current = currentPage.value
  const buttons = []

  // Always show first page
  buttons.push(1)

  if (totalPagesCount <= 5) {
    // If 5 or fewer pages, show all
    for (let i = 2; i <= totalPagesCount; i++) {
      buttons.push(i)
    }
  } else {
    // Show dots after first page if needed
    if (current > 3) {
      buttons.push('...')
    }

    // Show current page and one page before and after
    for (let i = Math.max(2, current - 1); i <= Math.min(current + 1, totalPagesCount - 1); i++) {
      buttons.push(i)
    }

    // Show dots before last page if needed
    if (current < totalPagesCount - 2) {
      buttons.push('...')
    }

    // Always show last page
    if (totalPagesCount > 1) {
      buttons.push(totalPagesCount)
    }
  }

  return buttons
})

const changePage = (page: number) => {
  currentPage.value = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const getIngredientUnit = (ingredient: Ingredient): string => {
  return ingredient.type === '單一材料' ? ingredient.unit : ingredient.mainUnit
}

const getIngredientAmount = (ingredient: Ingredient): number => {
  return ingredient.type === '單一材料' ? ingredient.amount : ingredient.totalAmount
}

const handleSubmit = (ingredient: SingleIngredient | CompoundIngredient) => {
  if (ingredient.type === '單一材料') {
    const { id, type, unitPrice, ...rest } = ingredient
    ingredientsStore.addSingleIngredient(rest)
  } else {
    const { id, type, totalAmount, totalPrice, unitPrice, ...rest } = ingredient
    ingredientsStore.addCompoundIngredient(rest)
  }
  
  notificationMessage.value = `${ingredient.name}已成功加入材料資料庫`
  showNotification.value = true
  setTimeout(() => {
    showNotification.value = false
  }, 3000)

  showCreateDialog.value = false
  showCompoundIngredientForm.value = false
}

const handleDelete = (id: number) => {
  try {
    ingredientsStore.removeIngredient(id)
    showDialog.value = false
    notificationMessage.value = '材料已成功刪除'
    showNotification.value = true
    setTimeout(() => {
      showNotification.value = false
    }, 3000)
  } catch (error) {
    if (error instanceof Error) {
      notificationMessage.value = error.message
      showNotification.value = true
      setTimeout(() => {
        showNotification.value = false
      }, 3000)
    }
  }
}

const handleEdit = (ingredient: Ingredient) => {
  ingredientsStore.updateIngredient(ingredient)
  showDialog.value = false
  notificationMessage.value = '材料已成功更新'
  showNotification.value = true
  setTimeout(() => {
    showNotification.value = false
  }, 3000)
}

const incrementAmount = () => {
  formData.value.amount += UNIT_STEPS[formData.value.unit]
}

const decrementAmount = () => {
  const newAmount = formData.value.amount - UNIT_STEPS[formData.value.unit]
  formData.value.amount = Math.max(0, newAmount)
}

const incrementTotalPrice = () => {
  formData.value.totalPrice = Math.round((formData.value.totalPrice + 10) * 100) / 100
}

const decrementTotalPrice = () => {
  const newPrice = Math.round((formData.value.totalPrice - 10) * 100) / 100
  formData.value.totalPrice = Math.max(0, newPrice)
}

const openIngredientDialog = (ingredient: Ingredient) => {
  selectedIngredient.value = ingredient
  showDialog.value = true
}

const closeDialog = () => {
  selectedIngredient.value = null
  showDialog.value = false
}

const closeCreateDialog = () => {
  showCreateDialog.value = false
  formData.value = {
    name: '',
    category: '基酒',
    amount: 0,
    unit: 'ml',
    totalPrice: 0
  }
}

const openEditDialog = () => {
  if (!selectedIngredient.value) return
  
  editingIngredient.value = { ...selectedIngredient.value }
  showEditDialog.value = true
  showDialog.value = false
}

const closeEditDialog = () => {
  showEditDialog.value = false
  editingIngredient.value = {
    id: 0,
    name: '',
    category: '基酒',
    type: '單一材料',
    amount: 0,
    unit: 'ml',
    totalPrice: 0,
    unitPrice: 0
  }
}

const saveEdit = (updatedIngredient: Ingredient) => {
  if (updatedIngredient.type === '單一材料') {
    if (!updatedIngredient.name || !updatedIngredient.amount || !updatedIngredient.totalPrice) {
      return
    }
  } else {
    if (!updatedIngredient.name) {
      return
    }
  }

  ingredientsStore.updateIngredient(updatedIngredient)

  notificationMessage.value = `${updatedIngredient.name}已成功更新`
  showNotification.value = true
  setTimeout(() => {
    showNotification.value = false
  }, 3000)

  closeEditDialog()
}

const closeCompoundForm = () => {
  showCompoundIngredientForm.value = false
}

const handleEditIngredient = (ingredient: Ingredient) => {
  selectedIngredient.value = ingredient
  showDialog.value = false
  showEditDialog.value = true
}
</script>

<template>
  <div class="ingredients-manager">
    <div class="header">
      <h2>材料一覽</h2>
      <div class="button-group">
        <button class="add-btn" @click="showCompoundIngredientForm = true">
            <span class="plus-icon">+</span> 新增複合材料 
        </button>
        <button class="add-btn" @click="showCreateDialog = true">
            <span class="plus-icon">+</span> 新增單一材料 
        </button>
      </div>
    </div>

    <div class="search-bar">
      <input 
        type="text"
        v-model="searchQuery"
        placeholder="搜尋材料..."
        class="search-input"
      >
    </div>

    <div class="category-tabs">
      <button 
        :class="['tab-btn', { active: selectedCategory === '全部' }]"
        @click="selectedCategory = '全部'"
      >
        全部
      </button>
      <button 
        v-for="category in CATEGORIES" 
        :key="category"
        :class="['tab-btn', { active: selectedCategory === category }]"
        @click="selectedCategory = category"
      >
        {{ category }}
      </button>
    </div>

    <div class="ingredients-grid">
      <div 
        v-for="ingredient in paginatedIngredients" 
        :key="ingredient.id"
        class="ingredient-item"
        @click="openIngredientDialog(ingredient)"
      >
        <h3 class="ingredient-name">{{ ingredient.name }}</h3>
        <div class="ingredient-details">
          <span class="type-tag">{{ ingredient.type }}</span>
          <span class="unit-price">
            ${{ ingredient.unitPrice.toFixed(2) }}/{{ getIngredientUnit(ingredient) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Update pagination controls -->
    <div v-if="totalPages > 1" class="pagination">
      <button 
        class="page-btn nav-btn"
        :disabled="currentPage === 1"
        @click="changePage(currentPage - 1)"
        aria-label="Previous page"
      >
        ←
      </button>
      <button 
        v-for="pageNum in getPageButtons" 
        :key="pageNum"
        :class="[
          'page-btn',
          {
            'active': currentPage === pageNum,
            'ellipsis': pageNum === '...'
          }
        ]"
        @click="pageNum !== '...' && changePage(pageNum as number)"
        :disabled="pageNum === '...'"
      >
        {{ pageNum }}
      </button>
      <button 
        class="page-btn nav-btn"
        :disabled="currentPage === totalPages"
        @click="changePage(currentPage + 1)"
        aria-label="Next page"
      >
        →
      </button>
    </div>

    <!-- Single Ingredient Form -->
    <SingleIngredientForm
      v-if="showCreateDialog"
      mode="create"
      @save="handleSubmit"
      @cancel="closeCreateDialog"
    />

    <!-- Compound Ingredient Form -->
    <CompoundIngredientForm
      v-if="showCompoundIngredientForm"
      mode="create"
      @save="handleSubmit"
      @cancel="closeCompoundForm"
    />

    <!-- Detail Dialogs -->
    <SingleIngredientDetailDialog
      v-if="selectedIngredient?.type === '單一材料' && showDialog"
      :ingredient="selectedIngredient"
      @close="closeDialog"
      @delete="handleDelete"
      @edit="handleEditIngredient"
    />

    <CompoundIngredientDetailDialog
      v-if="selectedIngredient?.type === '複合材料' && showDialog"
      :ingredient="selectedIngredient"
      @close="closeDialog"
      @delete="handleDelete"
      @edit="handleEditIngredient"
    />

    <!-- Edit Forms -->
    <SingleIngredientForm
      v-if="showEditDialog && selectedIngredient?.type === '單一材料'"
      :initial-ingredient="selectedIngredient"
      mode="edit"
      @save="saveEdit"
      @cancel="closeEditDialog"
    />

    <CompoundIngredientForm
      v-if="showEditDialog && selectedIngredient?.type === '複合材料'"
      :initial-ingredient="selectedIngredient"
      mode="edit"
      @save="saveEdit"
      @cancel="closeEditDialog"
    />

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
.ingredients-manager {
  width: 100%;
}

.header {
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  width: 100%;
  flex-wrap: wrap;
  gap: 1rem;
}

.header h2 {
  font-size: 1.25rem;
  font-weight: 500;
  margin: 0;
}

.button-group {
  display: flex;
  gap: 0.5rem;
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

.search-bar {
  margin: 1rem 0;
  width: 100%;
  position: relative;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #eee;
  border-radius: 8px;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  background: white;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(255, 107, 53, 0.1);
}

.search-input::placeholder {
  color: #999;
}

.category-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 2rem;
  width: 100%;
}

.tab-btn {
  background: #f5f5f5;
  border: none;
  padding: 0.375rem 0.75rem;
  color: #666;
  cursor: pointer;
  font-size: 0.875rem;
  border-radius: 100px;
  transition: all 0.2s ease;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.tab-btn:hover {
  background: #eeeeee;
  color: #333;
}

.tab-btn.active {
  color: white;
  background: var(--primary-color);
}

.tab-btn.active::after {
  display: none;
}

.badge {
  font-size: 0.75rem;
  padding: 0.125rem 0.375rem;
}

.ingredients-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 2rem;
  width: 100%;
}

.ingredient-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: white;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
}

.ingredient-item:hover {
  transform: translateX(4px);
  border-color: var(--primary-color);
}

.ingredient-name {
  color: #333;
  font-size: 0.875rem;
  margin: 0;
  font-weight: 500;
}

.ingredient-details {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.type-tag {
  font-size: 0.75rem;
  color: var(--primary-color);
  border: 1px solid var(--primary-color);
  padding: 0.125rem 0.75rem;
  border-radius: 999px;
  background: white;
  white-space: nowrap;
}

.unit-price {
  color: #666;
  font-size: 0.9rem;
  margin: 0;
  white-space: nowrap;
}

@media (min-width: 640px) {
  .ingredient-item {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
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

.pagination {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin: 2rem 0;
  flex-wrap: wrap;
}

.page-btn {
  min-width: 2.5rem;
  height: 2.5rem;
  padding: 0 0.75rem;
  border: 1px solid #eee;
  background: white;
  color: #666;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
}

.page-btn:hover:not(:disabled) {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.page-btn.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-btn.ellipsis {
  border: none;
  background: none;
  cursor: default;
  padding: 0 0.25rem;
}

.page-btn.ellipsis:hover {
  border: none;
  color: #666;
}

.nav-btn {
  font-weight: bold;
}

@media (max-width: 480px) {
  .pagination {
    gap: 0.25rem;
  }

  .page-btn {
    min-width: 2rem;
    height: 2rem;
    padding: 0 0.5rem;
    font-size: 0.75rem;
  }
}

.plus-icon {
  font-size: 1.125rem;
  font-weight: bold;
  line-height: 1;
}
</style> 