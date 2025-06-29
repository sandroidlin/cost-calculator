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
  <div class="auth-container">
    <div class="auth-card">
      <div v-if="authStore.isLoading" class="loading">Loading...</div>

      <div v-else-if="authStore.error" class="error">
        {{ authStore.error }}
        <button @click="authStore.clearError()" class="retry-btn">Try Again</button>
      </div>

      <div v-else-if="authStore.isAuthenticated" class="authenticated">
        <h2>Welcome, {{ authStore.user?.email }}!</h2>
        <button @click="authStore.signOut()" class="sign-out-btn">{{ $t('nav.signOut') }}</button>
      </div>

      <div v-else-if="!authStore.sentEmail" class="email-step">
        <form @submit="handleEmailSubmit">
          <h2>Let's log you in</h2>
          <p>Enter your email, and we'll send you a verification code.</p>
          <input
            type="email"
            placeholder="Enter your email"
            required
            autofocus
            class="email-input"
          />
          <button type="submit" class="submit-btn">Send Code</button>
        </form>
      </div>

      <div v-else class="code-step">
        <form @submit="handleCodeSubmit">
          <h2>Enter your code</h2>
          <p>
            We sent an email to <strong>{{ authStore.sentEmail }}</strong
            >. Check your email and paste the code you see.
          </p>
          <input
            ref="inputRef"
            type="text"
            placeholder="123456..."
            required
            autofocus
            class="code-input"
          />
          <button type="submit" class="submit-btn">Verify Code</button>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 50vh;
  padding: 2rem;
}

.auth-card {
  max-width: 400px;
  width: 100%;
  padding: 2rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.loading {
  text-align: center;
  padding: 2rem;
}

.error {
  text-align: center;
  color: #d32f2f;
  padding: 1rem;
}

.retry-btn {
  display: block;
  margin: 1rem auto 0;
  padding: 0.5rem 1rem;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.authenticated {
  text-align: center;
}

.sign-out-btn {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

h2 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

p {
  margin: 0 0 1rem 0;
  color: #666;
  line-height: 1.5;
}

.email-input,
.code-input {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.submit-btn {
  padding: 0.75rem;
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.submit-btn:hover {
  background: #1976d2;
}

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
