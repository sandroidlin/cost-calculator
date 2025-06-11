<script setup lang="ts">
import { ref } from 'vue'
import { useIngredientsStore } from '@/stores/ingredients'
import { useRecipesStore } from '@/stores/recipes'
import type { Ingredient } from '@/stores/ingredients'
import type { Recipe } from '@/stores/recipes'

const ingredientsStore = useIngredientsStore()
const recipesStore = useRecipesStore()

const showNotification = ref(false)
const notificationMessage = ref('')

interface ExportData {
  ingredients: Ingredient[]
  recipes: Recipe[]
  version: string
  exportDate: string
}

const exportData = () => {
  const data: ExportData = {
    ingredients: ingredientsStore.ingredients,
    recipes: recipesStore.recipes,
    version: '1.0',
    exportDate: new Date().toISOString()
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `chocolate-list-backup-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  notificationMessage.value = '資料已成功匯出'
  showNotification.value = true
  setTimeout(() => {
    showNotification.value = false
  }, 3000)
}

const importData = (event: Event) => {
  const fileInput = event.target as HTMLInputElement
  if (!fileInput.files?.length) return

  const file = fileInput.files[0]
  const reader = new FileReader()

  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target?.result as string) as ExportData
      
      // Validate data structure
      if (!data.ingredients || !data.recipes || !Array.isArray(data.ingredients) || !Array.isArray(data.recipes)) {
        throw new Error('無效的資料格式')
      }

      // Import data
      localStorage.setItem('ingredients', JSON.stringify(data.ingredients))
      localStorage.setItem('recipes', JSON.stringify(data.recipes))
      
      // Reload data in stores
      ingredientsStore.loadSavedIngredients()
      recipesStore.loadSavedRecipes()

      notificationMessage.value = '資料已成功匯入'
      showNotification.value = true
      setTimeout(() => {
        showNotification.value = false
      }, 3000)

      // Reset file input
      fileInput.value = ''
    } catch (error) {
      notificationMessage.value = '匯入失敗：無效的資料格式'
      showNotification.value = true
      setTimeout(() => {
        showNotification.value = false
      }, 3000)
    }
  }

  reader.readAsText(file)
}
</script>

<template>
  <div class="data-import-export">
    <div class="button-group">
      <button class="export-btn" @click="exportData">
        匯出資料
      </button>
      <label class="import-btn">
        匯入資料
        <input
          type="file"
          accept=".json"
          @change="importData"
          class="file-input"
        >
      </label>
    </div>

    <div v-if="showNotification" class="notification">
      {{ notificationMessage }}
    </div>
  </div>
</template>

<style scoped>
.data-import-export {
  padding: 1rem;
}

.button-group {
  display: flex;
  gap: 1rem;
}

.export-btn,
.import-btn {
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.export-btn {
  background: var(--primary-color);
  color: white;
  border: none;
}

.export-btn:hover {
  background: #e55a2a;
}

.import-btn {
  background: white;
  color: var(--primary-color);
  border: 1px solid var(--primary-color);
  position: relative;
  overflow: hidden;
}

.import-btn:hover {
  background: #fff1ec;
}

.file-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
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
</style> 