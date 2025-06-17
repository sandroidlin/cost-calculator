<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import Footer from './components/Footer.vue'
import AuthLogin from './components/AuthLogin.vue'

const authStore = useAuthStore()
</script>

<template>
  <div class="app">
    <header>
      <div class="header-content">
        <h1>酒譜資料庫</h1>
        <nav>
          <div class="nav-links">
            <RouterLink to="/" class="nav-link">酒譜一覽</RouterLink>
            <RouterLink to="/ingredients" class="nav-link">材料一覽</RouterLink>
          </div>
          <div v-if="authStore.isAuthenticated" class="user-info">
            <span class="user-email">{{ authStore.user?.email }}</span>
            <button @click="authStore.signOut()" class="sign-out-btn">Sign Out</button>
          </div>
        </nav>
      </div>
    </header>

    <div class="main-container">
      <div v-if="authStore.isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading...</p>
      </div>
      
      <div v-else-if="!authStore.isAuthenticated" class="auth-required">
        <AuthLogin />
      </div>
      
      <div v-else>
        <RouterView />
      </div>
    </div>

    <Footer />
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
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.875rem;
}

.user-email {
  color: #666;
}

.sign-out-btn {
  padding: 0.25rem 0.75rem;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background-color 0.2s;
}

.sign-out-btn:hover {
  background: #d32f2f;
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

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  gap: 1rem;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #2196f3;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.auth-required {
  min-height: 60vh;
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
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 0 24px;
}

@media (min-width: 768px) {
  .main-container {
    padding-left: 32px;
    padding-right: 32px;
  }
}

@media (min-width: 1024px) {
  .main-container {
    padding-left: 40px;
    padding-right: 40px;
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
