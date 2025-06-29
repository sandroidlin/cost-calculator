import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '@/utils/instant'

export const useAuthStore = defineStore('auth', () => {
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const sentEmail = ref('')

  // Get auth state from InstantDB
  const { isLoading: authLoading, user, error: authError } = db.useAuth()

  const isAuthenticated = computed(() => !!user.value)

  const sendMagicCode = async (email: string) => {
    try {
      isLoading.value = true
      error.value = null
      await db.auth.sendMagicCode({ email })
      sentEmail.value = email
    } catch (err: unknown) {
      error.value = (err as { body?: { message?: string } }).body?.message || 'Failed to send magic code'
      sentEmail.value = ''
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const signInWithMagicCode = async (email: string, code: string) => {
    try {
      isLoading.value = true
      error.value = null
      await db.auth.signInWithMagicCode({ email, code })
      sentEmail.value = ''
    } catch (err: unknown) {
      error.value = (err as { body?: { message?: string } }).body?.message || 'Invalid code'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const signOut = async () => {
    try {
      await db.auth.signOut()
      sentEmail.value = ''
      error.value = null
    } catch (err: unknown) {
      error.value = (err as { body?: { message?: string } }).body?.message || 'Failed to sign out'
      throw err
    }
  }

  const clearError = () => {
    error.value = null
  }

  return {
    // State from InstantDB
    isLoading: computed(() => authLoading.value || isLoading.value),
    user,
    error: computed(() => authError.value?.message || error.value),
    sentEmail,
    isAuthenticated,
    
    // Actions
    sendMagicCode,
    signInWithMagicCode,
    signOut,
    clearError
  }
})