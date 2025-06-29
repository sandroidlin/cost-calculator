import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
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

  // Query all workspaces where user is owner or member  
  const { data: workspacesData, isLoading: workspacesLoading, error: workspacesError } = db.useQuery({
    workspaces: {
      members: {
        $user: {}
      }
    },
    workspace_members: {
      workspace: {},
      $user: {}
    }
  })

  const workspaces = computed(() => {
    if (!workspacesData.value || !authStore.user.value) return []
    
    const ownedWorkspaces = workspacesData.value.workspaces || []
    const memberWorkspaces = (workspacesData.value.workspace_members || [])
      .filter((member: WorkspaceMember & { $user?: { id: string } }) => member.$user?.id === authStore.user.value?.id)  
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
    if (!authStore.user.value) throw new Error('Must be authenticated')
    
    try {
      isLoading.value = true
      error.value = null

      const workspace = await db.transact([
        db.tx.workspaces[db.id()].update({
          name,
          description: description || '',
          createdAt: new Date(),
          updatedAt: new Date()
        }).link({
          $user: authStore.user.value.id
        })
      ])

      return workspace
    } catch (err: unknown) {
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
    if (!authStore.user.value) throw new Error('Must be authenticated')

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
          inviter: authStore.user.value.id
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
    if (!authStore.user.value) throw new Error('Must be authenticated')

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
          $user: authStore.user.value.id
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

  // Initialize workspace from localStorage
  const initializeWorkspace = () => {
    const savedWorkspaceId = localStorage.getItem('currentWorkspaceId')
    if (savedWorkspaceId) {
      currentWorkspaceId.value = savedWorkspaceId
    }
  }

  // Migrate user data to workspace
  const migrateDataToWorkspace = async (workspaceId: string) => {
    if (!authStore.user.value) throw new Error('Must be authenticated')

    try {
      isLoading.value = true
      error.value = null

      // Get user's personal ingredients and recipes
      const { data } = await db.queryOnce({
        ingredients: {
          $: { where: { '$user.id': authStore.user.value.id, workspaceId: null } }
        },
        recipes: {
          $: { where: { '$user.id': authStore.user.value.id, workspaceId: null } }
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
    isLoading: computed(() => workspacesLoading.value || isLoading.value),
    error: computed(() => workspacesError.value?.message || error.value),

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
    clearError
  }
})