<script setup lang="ts">
import { RouterLink, RouterView, useRoute } from 'vue-router'
import { computed } from 'vue'
import IngredientsManager from './components/IngredientsManager.vue'
import DataImportExport from './components/DataImportExport.vue'

const route = useRoute()
const showNav = computed(() => route.path !== '/')
</script>

<template>
  <div class="app">
    <header>
      <div class="header-content">
        <h1>酒譜資料庫</h1>
        <nav v-if="showNav">
          <div class="nav-links">
            <RouterLink to="/recipes" class="nav-link">酒譜一覽</RouterLink>
            <RouterLink to="/ingredients" class="nav-link">材料一覽</RouterLink>
            <DataImportExport />
          </div>
        </nav>
      </div>
    </header>

    <div class="main-container">
      <RouterView />
    </div>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  background: white;
  color: #333;
  width: 100%;
  display: flex;
  flex-direction: column;
}

header {
  background: white;
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 0;
  z-index: 100;
  margin-bottom: 2rem;
  width: 100%;
}

.header-content {
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 24px;
}

@media (min-width: 768px) {
  .header-content {
    padding-left: 32px;
    padding-right: 32px;
  }
}

@media (min-width: 1024px) {
  .header-content {
    padding-left: 40px;
    padding-right: 40px;
  }
}

h1 {
  color: #333;
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
}

nav {
  flex-shrink: 0;
}

.nav-links {
  display: flex;
  gap: 2rem;
  align-items: center;
}

.nav-link {
  color: #333;
  text-decoration: none;
  font-size: 1rem;
  padding: 0.5rem 0;
  position: relative;
  transition: color 0.3s ease;
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: var(--primary-color);
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.nav-link:hover {
  color: var(--primary-color);
}

.nav-link:hover::after {
  transform: scaleX(0.5);
}

.nav-link.router-link-active {
  color: var(--primary-color);
}

.nav-link.router-link-active::after {
  transform: scaleX(1);
}

/* Add styles for the import/export component */
:deep(.data-import-export) {
  padding: 0;
  margin-left: 1rem;
}

:deep(.data-import-export .button-group) {
  display: flex;
  gap: 0.5rem;
}

:deep(.data-import-export .export-btn),
:deep(.data-import-export .import-btn) {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

.main-container {
  flex: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.main-container > :deep(*) {
  max-width: 880px;
  width: 100%;
  margin: 0 auto;
  padding: 0 24px;
}

@media (min-width: 768px) {
  .main-container > :deep(*) {
    padding: 0 32px;
  }
}

@media (min-width: 1024px) {
  .main-container > :deep(*) {
    padding: 0 40px;
  }
}

/* Reset styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  line-height: 1.6;
  color: #333;
  background: white;
}

/* Global styles */
h1, h2, h3, h4, h5, h6 {
  color: #333;
  line-height: 1.2;
}

button {
  cursor: pointer;
}

.container {
  width: 100%;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
</style>

<style>
/* Global styles */
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background: white;
  color: #333;
}

* {
  box-sizing: border-box;
}

:root {
  --primary-color: #FF6B35;
  --text-color: #333;
  --text-secondary: #666;
  --border-color: #eee;
  --background-color: white;
}
</style>
