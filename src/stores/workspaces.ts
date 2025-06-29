import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { db } from '@/utils/instant'
import { useAuthStore } from './auth'

export interface Workspace {
  id: string
  name: string
  description?: string
  createdAt: Date
  updatedAt: Date
}

export interface WorkspaceMember {
  id: string
  role: 'owner' | 'editor' | 'viewer'
  joinedAt: Date
  $user: { email: string }
}

export interface WorkspaceInvite {
  id: string
  email: string
  role: 'editor' | 'viewer'
  token: string
  expiresAt: Date
  createdAt: Date
}

export const useWorkspacesStore = defineStore('workspaces', () => {
  const authStore = useAuthStore()
  const currentWorkspaceId = ref<string | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Use manual data management instead of reactive queries
  const workspacesData = ref<{
    workspaces: Workspace[]
    workspace_members: (WorkspaceMember & { workspace: Workspace })[]
  }>({
    workspaces: [],
    workspace_members: []
  })

  // Manual loading state
  const dataLoading = ref(false)
  const dataError = ref<string | null>(null)

  // Load workspaces data manually
  const loadWorkspaces = async () => {
    if (!authStore.user?.id) {
      return
    }

    try {
      dataLoading.value = true
      dataError.value = null

      const { data } = await db.queryOnce({
        workspaces: {
          $: { where: { $user: authStore.user.id } }
        },
        workspace_members: {
          $: { where: { $user: authStore.user.id } },
          workspace: {}
        }
      })

      workspacesData.value = {
        workspaces: data?.workspaces || [],
        workspace_members: data?.workspace_members || []
      }

    } catch (err) {
      console.error('Failed to load workspaces:', err)
      dataError.value = (err as Error).message || 'Failed to load workspaces'
    } finally {
      dataLoading.value = false
    }
  }

  const workspaces = computed(() => {
    if (!authStore.user) {
      return []
    }

    const ownedWorkspaces = workspacesData.value.workspaces || []
    const memberWorkspaces = (workspacesData.value.workspace_members || [])
      .map((member: WorkspaceMember & { workspace: Workspace }) => member.workspace)
      .filter(Boolean)

    // Combine and deduplicate
    const allWorkspaces = [...ownedWorkspaces, ...memberWorkspaces]
    const uniqueWorkspaces = allWorkspaces.filter((workspace, index, self) =>
      index === self.findIndex(w => w.id === workspace.id)
    )

    return uniqueWorkspaces
  })

  const currentWorkspace = computed(() => {
    if (!currentWorkspaceId.value) return null
    return workspaces.value.find(w => w.id === currentWorkspaceId.value) || null
  })

  const isWorkspaceMode = computed(() => !!currentWorkspaceId.value)

  // Create new workspace
  const createWorkspace = async (name: string, description?: string) => {
    if (!authStore.isAuthenticated || !authStore.user?.id) {
      throw new Error('Must be authenticated')
    }

    try {
      isLoading.value = true
      error.value = null

      const workspaceId = crypto.randomUUID()

      await db.transact([
        db.tx.workspaces[workspaceId].update({
          name,
          description: description || '',
          createdAt: new Date(),
          updatedAt: new Date()
        }).link({
          $user: authStore.user.id
        })
      ])

      // Reload workspaces to show the new one
      await loadWorkspaces()

      // Return the created workspace object
      return {
        id: workspaceId,
        name,
        description: description || '',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    } catch (err: unknown) {
      console.error('Error creating workspace:', err)
      error.value = (err as Error).message || 'Failed to create workspace'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Update workspace
  const updateWorkspace = async (workspaceId: string, updates: Partial<Pick<Workspace, 'name' | 'description'>>) => {
    try {
      isLoading.value = true
      error.value = null

      await db.transact([
        db.tx.workspaces[workspaceId].update({
          ...updates,
          updatedAt: new Date()
        })
      ])
    } catch (err: unknown) {
      error.value = (err as Error).message || 'Failed to update workspace'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Generate invite token
  const generateInviteToken = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }

  // Send workspace invitation
  const inviteToWorkspace = async (workspaceId: string, email: string, role: 'editor' | 'viewer') => {
    if (!authStore.user) throw new Error('Must be authenticated')

    try {
      isLoading.value = true
      error.value = null

      const token = generateInviteToken()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiry

      await db.transact([
        db.tx.workspace_invites[db.id()].update({
          email,
          role,
          token,
          expiresAt,
          createdAt: new Date()
        }).link({
          workspace: workspaceId,
          inviter: authStore.user.id
        })
      ])

      return token
    } catch (err: unknown) {
      error.value = (err as Error).message || 'Failed to send invitation'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Accept workspace invitation
  const acceptInvite = async (token: string) => {
    if (!authStore.user) throw new Error('Must be authenticated')

    try {
      isLoading.value = true
      error.value = null

      // Find the invite
      const { data: inviteData } = await db.queryOnce({
        workspace_invites: {
          $: { where: { token } },
          workspace: {}
        }
      })

      const invite = inviteData?.workspace_invites?.[0]
      if (!invite) throw new Error('Invalid invitation token')
      if (new Date(invite.expiresAt) < new Date()) throw new Error('Invitation has expired')

      // Add user as member
      await db.transact([
        db.tx.workspace_members[db.id()].update({
          role: invite.role,
          joinedAt: new Date()
        }).link({
          workspace: invite.workspace.id,
          $user: authStore.user.id
        }),
        // Delete the invite
        db.tx.workspace_invites[invite.id].delete()
      ])

      return invite.workspace
    } catch (err: unknown) {
      error.value = (err as Error).message || 'Failed to accept invitation'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Get workspace members
  const getWorkspaceMembers = async (workspaceId: string) => {
    const { data } = await db.queryOnce({
      workspace_members: {
        $: { where: { 'workspace.id': workspaceId } },
        $user: {}
      }
    })

    return data?.workspace_members || []
  }

  // Remove member from workspace
  const removeMember = async (workspaceId: string, memberId: string) => {
    try {
      isLoading.value = true
      error.value = null

      await db.transact([
        db.tx.workspace_members[memberId].delete()
      ])
    } catch (err: unknown) {
      error.value = (err as Error).message || 'Failed to remove member'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // Switch to workspace mode
  const switchToWorkspace = (workspaceId: string | null) => {
    currentWorkspaceId.value = workspaceId
    // Clear any cached data when switching workspaces
    localStorage.setItem('currentWorkspaceId', workspaceId || '')
  }


  // Watch for authentication changes and reload data
  watch(() => authStore.isAuthenticated, async (isAuth) => {
    if (isAuth) {
      // Load workspaces when user logs in
      await loadWorkspaces()
    } else {
      // Clear data when user logs out
      workspacesData.value = { workspaces: [], workspace_members: [] }
      currentWorkspaceId.value = null
      localStorage.removeItem('currentWorkspaceId')
    }
  })

  // Initialize workspace from localStorage and load data
  const initializeWorkspace = async () => {
    if (authStore.isAuthenticated) {
      // Load workspaces first
      await loadWorkspaces()

      // Then restore saved workspace
      const savedWorkspaceId = localStorage.getItem('currentWorkspaceId')
      if (savedWorkspaceId && workspaces.value.some(w => w.id === savedWorkspaceId)) {
        currentWorkspaceId.value = savedWorkspaceId
      }
    }
  }

  // Initialize workspace from URL (called from App.vue)
  const initializeFromUrl = async (urlWorkspaceId?: string) => {
    if (!authStore.isAuthenticated) return

    await loadWorkspaces()

    if (urlWorkspaceId && workspaces.value.some(w => w.id === urlWorkspaceId)) {
      currentWorkspaceId.value = urlWorkspaceId
      localStorage.setItem('currentWorkspaceId', urlWorkspaceId)
    } else {
      // Fallback to localStorage
      const savedWorkspaceId = localStorage.getItem('currentWorkspaceId')
      if (savedWorkspaceId && workspaces.value.some(w => w.id === savedWorkspaceId)) {
        currentWorkspaceId.value = savedWorkspaceId
      }
    }
  }

  // Migrate user data to workspace
  const migrateDataToWorkspace = async (workspaceId: string) => {
    if (!authStore.user) throw new Error('Must be authenticated')

    try {
      isLoading.value = true
      error.value = null

      // Get user's personal ingredients and recipes
      const { data } = await db.queryOnce({
        ingredients: {
          $: { where: { '$user.id': authStore.user.id, workspaceId: null } }
        },
        recipes: {
          $: { where: { '$user.id': authStore.user.id, workspaceId: null } }
        }
      })

      const transactions = []

      // Migrate ingredients
      for (const ingredient of data?.ingredients || []) {
        transactions.push(
          db.tx.ingredients[ingredient.id].update({
            workspaceId
          })
        )
      }

      // Migrate recipes
      for (const recipe of data?.recipes || []) {
        transactions.push(
          db.tx.recipes[recipe.id].update({
            workspaceId
          })
        )
      }

      if (transactions.length > 0) {
        await db.transact(transactions)
      }

    } catch (err: unknown) {
      error.value = (err as Error).message || 'Failed to migrate data'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const clearError = () => {
    error.value = null
  }


  return {
    // State
    currentWorkspaceId,
    currentWorkspace,
    workspaces,
    isWorkspaceMode,
    isLoading: computed(() => dataLoading.value || isLoading.value),
    error: computed(() => dataError.value || error.value),

    // Actions
    createWorkspace,
    updateWorkspace,
    inviteToWorkspace,
    acceptInvite,
    getWorkspaceMembers,
    removeMember,
    switchToWorkspace,
    initializeWorkspace,
    migrateDataToWorkspace,
    clearError,
    loadWorkspaces,
    initializeFromUrl
  }
})
