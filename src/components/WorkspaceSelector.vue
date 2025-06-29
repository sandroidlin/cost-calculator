<template>
  <div class="workspace-selector">
    <div class="workspace-header">
      <h3>{{ currentWorkspace ? currentWorkspace.name : 'Personal Workspace' }}</h3>
      <div class="workspace-actions">
        <button class="btn-secondary" @click="showWorkspaceDialog = true" :disabled="isLoading">
          Switch Workspace
        </button>
        <button class="btn-primary" @click="showCreateDialog = true" :disabled="isLoading">
          Create Workspace
        </button>
      </div>
    </div>

    <!-- Workspace Selection Dialog -->
    <div v-if="showWorkspaceDialog" class="dialog-overlay" @click="closeWorkspaceDialog">
      <div class="dialog" @click.stop>
        <div class="dialog-header">
          <h3>Select Workspace</h3>
          <button class="btn-icon" @click="closeWorkspaceDialog">×</button>
        </div>

        <div class="dialog-content">
          <div class="workspace-list">
            <div
              class="workspace-item"
              :class="{ active: !currentWorkspaceId }"
              @click="switchToPersonal"
            >
              <div class="workspace-info">
                <h4>Personal Workspace</h4>
                <p>Your private ingredients and recipes</p>
              </div>
              <div class="workspace-role">Owner</div>
            </div>

            <div
              v-for="workspace in workspaces"
              :key="workspace.id"
              class="workspace-item"
              :class="{ active: currentWorkspaceId === workspace.id }"
              @click="switchToWorkspace(workspace.id)"
            >
              <div class="workspace-info">
                <h4>{{ workspace.name }}</h4>
                <p>{{ workspace.description || 'Collaborative workspace' }}</p>
              </div>
              <div class="workspace-role">Member</div>
            </div>
          </div>

          <div class="dialog-actions">
            <button class="btn-secondary" @click="showJoinDialog = true">Join Workspace</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Workspace Dialog -->
    <div v-if="showCreateDialog" class="dialog-overlay" @click="closeCreateDialog">
      <div class="dialog" @click.stop>
        <div class="dialog-header">
          <h3>Create New Workspace</h3>
          <button class="btn-icon" @click="closeCreateDialog">×</button>
        </div>

        <form @submit.prevent="handleCreateWorkspace" class="dialog-content">
          <div class="form-group">
            <label for="workspace-name">Workspace Name *</label>
            <input
              id="workspace-name"
              v-model="newWorkspace.name"
              type="text"
              required
              placeholder="Enter workspace name"
            />
          </div>

          <div class="form-group">
            <label for="workspace-description">Description</label>
            <textarea
              id="workspace-description"
              v-model="newWorkspace.description"
              placeholder="Optional workspace description"
              rows="3"
            ></textarea>
          </div>

          <div class="form-group">
            <label>
              <input type="checkbox" v-model="migratePersonalData" />
              Transfer my personal data to this workspace
            </label>
            <p class="form-help">
              This will move your existing ingredients and recipes to the new workspace
            </p>
          </div>

          <div class="dialog-actions">
            <button
              type="button"
              class="btn-secondary"
              @click="closeCreateDialog"
              :disabled="isLoading"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="btn-primary"
              :disabled="isLoading || !newWorkspace.name.trim()"
            >
              {{ isLoading ? 'Creating...' : 'Create Workspace' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Join Workspace Dialog -->
    <div v-if="showJoinDialog" class="dialog-overlay" @click="closeJoinDialog">
      <div class="dialog" @click.stop>
        <div class="dialog-header">
          <h3>Join Workspace</h3>
          <button class="btn-icon" @click="closeJoinDialog">×</button>
        </div>

        <form @submit.prevent="handleAcceptInvite" class="dialog-content">
          <div class="form-group">
            <label for="invite-token">Invitation Token *</label>
            <input
              id="invite-token"
              v-model="inviteToken"
              type="text"
              required
              placeholder="Enter invitation token"
            />
            <p class="form-help">Ask a workspace member for an invitation token</p>
          </div>

          <div class="dialog-actions">
            <button
              type="button"
              class="btn-secondary"
              @click="closeJoinDialog"
              :disabled="isLoading"
            >
              Cancel
            </button>
            <button type="submit" class="btn-primary" :disabled="isLoading || !inviteToken.trim()">
              {{ isLoading ? 'Joining...' : 'Join Workspace' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Error Display -->
    <div v-if="error" class="error-message">
      {{ error }}
      <button @click="clearError">×</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useWorkspacesStore } from '@/stores/workspaces'

const workspacesStore = useWorkspacesStore()
const {
  workspaces,
  currentWorkspace,
  currentWorkspaceId,
  isLoading,
  error,
  createWorkspace,
  switchToWorkspace: switchWorkspace,
  acceptInvite,
  migrateDataToWorkspace,
  clearError,
} = workspacesStore

// Dialog states
const showWorkspaceDialog = ref(false)
const showCreateDialog = ref(false)
const showJoinDialog = ref(false)

// Form data
const newWorkspace = ref({
  name: '',
  description: '',
})
const migratePersonalData = ref(false)
const inviteToken = ref('')

// Dialog handlers
const closeWorkspaceDialog = () => {
  showWorkspaceDialog.value = false
}

const closeCreateDialog = () => {
  showCreateDialog.value = false
  newWorkspace.value = { name: '', description: '' }
  migratePersonalData.value = false
}

const closeJoinDialog = () => {
  showJoinDialog.value = false
  inviteToken.value = ''
}

// Workspace actions
const switchToPersonal = () => {
  switchWorkspace(null)
  closeWorkspaceDialog()
}

const switchToWorkspace = (workspaceId: string) => {
  switchWorkspace(workspaceId)
  closeWorkspaceDialog()
}

const handleCreateWorkspace = async () => {
  try {
    const workspace = await createWorkspace(
      newWorkspace.value.name.trim(),
      newWorkspace.value.description.trim(),
    )

    if (migratePersonalData.value && workspace?.id) {
      await migrateDataToWorkspace(workspace.id)
    }

    closeCreateDialog()

    if (workspace?.id) {
      switchWorkspace(workspace.id)
    }
  } catch (err) {
    console.error('Failed to create workspace:', err)
  }
}

const handleAcceptInvite = async () => {
  try {
    const workspace = await acceptInvite(inviteToken.value.trim())
    closeJoinDialog()

    if (workspace?.id) {
      switchWorkspace(workspace.id)
    }
  } catch (err) {
    console.error('Failed to accept invitation:', err)
  }
}

onMounted(() => {
  workspacesStore.initializeWorkspace()
})
</script>

<style scoped>
.workspace-selector {
  margin-bottom: 2rem;
}

.workspace-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--color-background-mute);
  border-radius: 8px;
  margin-bottom: 1rem;
}

.workspace-header h3 {
  margin: 0;
  color: var(--color-heading);
}

.workspace-actions {
  display: flex;
  gap: 0.5rem;
}

.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background: var(--color-background);
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid var(--color-border);
}

.dialog-header h3 {
  margin: 0;
}

.btn-icon {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.25rem;
  color: var(--color-text-soft);
}

.dialog-content {
  padding: 1rem;
}

.workspace-list {
  space-y: 0.5rem;
}

.workspace-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.workspace-item:hover {
  background: var(--color-background-mute);
}

.workspace-item.active {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
}

.workspace-info h4 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
}

.workspace-info p {
  margin: 0;
  color: var(--color-text-soft);
  font-size: 0.875rem;
}

.workspace-role {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  background: var(--color-background-soft);
  border-radius: 4px;
  color: var(--color-text-soft);
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  font-size: 1rem;
}

.form-group input[type='checkbox'] {
  width: auto;
  margin-right: 0.5rem;
}

.form-help {
  margin: 0.25rem 0 0 0;
  font-size: 0.75rem;
  color: var(--color-text-soft);
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}

.btn-primary,
.btn-secondary {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.btn-secondary {
  background: var(--color-background-mute);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--color-background-soft);
}

.btn-primary:disabled,
.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  background: var(--color-error-light);
  color: var(--color-error);
  padding: 0.75rem;
  border-radius: 4px;
  margin-top: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.error-message button {
  background: none;
  border: none;
  color: var(--color-error);
  cursor: pointer;
  font-size: 1.25rem;
  padding: 0;
}
</style>
