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

const importData = async (event: Event) => {
  const fileInput = event.target as HTMLInputElement
  if (!fileInput.files?.length) return

  const file = fileInput.files[0]
  const reader = new FileReader()

  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target?.result as string) as ExportData
      
      // Validate data structure
      if (!data.ingredients || !data.recipes || !Array.isArray(data.ingredients) || !Array.isArray(data.recipes)) {
        throw new Error('無效的資料格式')
      }

      // Import data through store methods to handle both storage backends
      await ingredientsStore.importData(data.ingredients)
      await recipesStore.importData(data.recipes)

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
    <div class="link-group">
      <a href="#" class="export-link" @click.prevent="exportData">
        匯出資料
      </a>
      <label class="import-link">
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
  display: flex;
  align-items: center;
  gap: 1rem;
}

.link-group {
  display: flex;
  gap: 1rem;
}

.export-link,
.import-link {
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-decoration: none;
  cursor: pointer;
  transition: color 0.2s;
}

.export-link:hover,
.import-link:hover {
  color: var(--primary-color);
}

.import-link {
  position: relative;
  display: inline-block;
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
  bottom: 2rem;
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