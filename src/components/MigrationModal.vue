<template>
  <div v-if="show" class="modal-overlay" @click="handleCancel">
    <div class="modal" @click.stop>
      <div class="modal-header">
        <h3>Local Data Found</h3>
      </div>

      <div class="modal-content">
        <p>
          You have <strong>{{ itemCount }}</strong> {{ itemType }} stored locally.
        </p>
        <p>What would you like to do with this data?</p>

        <div class="options">
          <div class="option">
            <strong>Merge with online data</strong>
            <p class="option-description">Add your local {{ itemType }} to your cloud storage</p>
          </div>
          <div class="option">
            <strong>Use only online data</strong>
            <p class="option-description">Discard local {{ itemType }} and use only cloud data</p>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" @click="handleCancel">Use Online Only</button>
        <button class="btn btn-primary" @click="handleMerge">Merge Data</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  show: boolean
  itemCount: number
  itemType: string
}

interface Emits {
  (e: 'merge'): void
  (e: 'discard'): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const handleMerge = () => {
  emit('merge')
}

const handleCancel = () => {
  emit('discard')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.modal-header {
  padding: 1.5rem 1.5rem 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
}

.modal-content {
  padding: 1.5rem;
  flex: 1;
}

.modal-content p {
  margin: 0 0 1rem 0;
  color: #666;
  line-height: 1.5;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1.5rem;
}

.option {
  padding: 1rem;
  border: 1px solid #eee;
  border-radius: 8px;
  background: #f9f9f9;
}

.option strong {
  display: block;
  color: #333;
  margin-bottom: 0.5rem;
}

.option-description {
  margin: 0;
  font-size: 0.875rem;
  color: #666;
}

.modal-footer {
  padding: 1rem 1.5rem 1.5rem;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  border-top: 1px solid #eee;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary {
  background: white;
  color: #666;
  border: 1px solid #ddd;
}

.btn-secondary:hover {
  background: #f5f5f5;
  color: #333;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover {
  background: #e55a2a;
}
</style>
