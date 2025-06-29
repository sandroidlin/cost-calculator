<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const inputRef = ref<HTMLInputElement | null>(null)

const handleEmailSubmit = (e: Event) => {
  e.preventDefault()
  const form = e.target as HTMLFormElement
  const email = (form.querySelector('input[type="email"]') as HTMLInputElement).value
  authStore.sendMagicCode(email)
}

const handleCodeSubmit = (e: Event) => {
  e.preventDefault()
  const form = e.target as HTMLFormElement
  const code = (form.querySelector('input[type="text"]') as HTMLInputElement).value
  authStore.signInWithMagicCode(authStore.sentEmail, code)
}
</script>

<template>
  <div class="auth-content">
    <div v-if="authStore.isLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>{{ $t('auth.loading') }}</p>
    </div>

    <div v-else-if="authStore.error" class="error-state">
      <div class="error-icon">⚠️</div>
      <p class="error-message">{{ authStore.error }}</p>
      <button @click="authStore.clearError()" class="retry-btn">{{ $t('auth.retry') }}</button>
    </div>

    <div v-else-if="authStore.isAuthenticated" class="success-state">
      <div class="success-icon">✅</div>
      <h2>{{ $t('auth.welcome', { email: authStore.user?.email }) }}</h2>
      <button @click="authStore.signOut()" class="sign-out-btn">{{ $t('nav.signOut') }}</button>
    </div>

    <div v-else-if="!authStore.sentEmail" class="email-step">
      <div class="auth-header">
        <h2>{{ $t('auth.loginTitle') }}</h2>
        <p>{{ $t('auth.loginPrompt') }}</p>
      </div>
      
      <form @submit="handleEmailSubmit" class="auth-form">
        <div class="input-group">
          <input
            type="email"
            :placeholder="$t('auth.emailPlaceholder')"
            required
            autofocus
            class="auth-input"
          />
        </div>
        <button type="submit" class="auth-submit-btn" :disabled="authStore.isLoading">
          {{ $t('auth.sendCode') }}
        </button>
      </form>
    </div>

    <div v-else class="code-step">
      <div class="auth-header">
        <h2>{{ $t('auth.codeTitle') }}</h2>
        <p v-html="$t('auth.codePrompt', { email: authStore.sentEmail })"></p>
      </div>
      
      <form @submit="handleCodeSubmit" class="auth-form">
        <div class="input-group">
          <input
            ref="inputRef"
            type="text"
            :placeholder="$t('auth.codePlaceholder')"
            required
            autofocus
            class="auth-input"
            maxlength="6"
          />
        </div>
        <button type="submit" class="auth-submit-btn" :disabled="authStore.isLoading">
          {{ $t('auth.verifyCode') }}
        </button>
        <button 
          type="button" 
          @click="authStore.sentEmail = ''" 
          class="back-btn"
        >
          ← Back to email
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.auth-content {
  width: 100%;
  max-width: 100%;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem 0;
  text-align: center;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Error State */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem 0;
  text-align: center;
}

.error-icon {
  font-size: 2rem;
}

.error-message {
  color: #dc3545;
  font-weight: 500;
  margin: 0;
}

.retry-btn {
  padding: 0.75rem 1.5rem;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.retry-btn:hover {
  background: #c82333;
  transform: translateY(-1px);
}

/* Success State */
.success-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem 0;
  text-align: center;
}

.success-icon {
  font-size: 2rem;
}

.success-state h2 {
  color: #28a745;
  margin: 0;
  font-size: 1.25rem;
}

.sign-out-btn {
  padding: 0.75rem 1.5rem;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.sign-out-btn:hover {
  background: #5a6268;
  transform: translateY(-1px);
}

/* Auth Steps */
.email-step,
.code-step {
  width: 100%;
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}

.auth-header h2 {
  color: #333;
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 0.75rem 0;
}

.auth-header p {
  color: #666;
  font-size: 0.95rem;
  line-height: 1.5;
  margin: 0;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.input-group {
  position: relative;
}

.auth-input {
  width: 100%;
  padding: 1rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.2s;
  background: #fff;
}

.auth-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.1);
}

.auth-input::placeholder {
  color: #adb5bd;
}

.auth-submit-btn {
  width: 100%;
  padding: 1rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.auth-submit-btn:hover:not(:disabled) {
  background: #e55a2e;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
}

.auth-submit-btn:disabled {
  background: #adb5bd;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.back-btn {
  width: 100%;
  padding: 0.75rem;
  background: none;
  color: #6c757d;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: #f8f9fa;
  border-color: #dee2e6;
  color: #495057;
}
</style>
