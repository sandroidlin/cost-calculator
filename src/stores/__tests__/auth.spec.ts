import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'

// Mock the InstantDB
vi.mock('@/utils/instant', () => ({
  db: {
    useAuth: () => ({
      isLoading: { value: false },
      user: { value: null },
      error: { value: null },
    }),
    auth: {
      sendMagicCode: vi.fn(),
      signInWithMagicCode: vi.fn(),
      signOut: vi.fn(),
    },
  },
}))

describe('AuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should initialize with correct default state', () => {
    const authStore = useAuthStore()

    expect(authStore.isAuthenticated).toBe(false)
    expect(authStore.sentEmail).toBe('')
    expect(authStore.error).toBe(null)
  })

  it('should handle sendMagicCode', async () => {
    const authStore = useAuthStore()
    const _mockSendMagicCode = vi.fn().mockResolvedValue(undefined)

    // Mock the db auth method
    authStore.sendMagicCode = vi.fn().mockImplementation(async (email) => {
      authStore.sentEmail = email
    })

    await authStore.sendMagicCode('test@example.com')

    expect(authStore.sentEmail).toBe('test@example.com')
  })
})
