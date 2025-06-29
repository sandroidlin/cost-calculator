<template>
  <div v-if="visible" class="progress-toast">
    <div class="progress-content">
      <div class="progress-text">
        <span class="progress-title">{{ title }}</span>
        <span class="progress-percentage">{{ Math.round(percentage) }}%</span>
      </div>
      <div class="progress-bar-container">
        <div 
          class="progress-bar" 
          :style="{ width: `${percentage}%` }"
        ></div>
      </div>
      <div v-if="subtitle" class="progress-subtitle">{{ subtitle }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  visible: boolean
  title: string
  percentage: number
  subtitle?: string
}

defineProps<Props>()
</script>

<style scoped>
.progress-toast {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  background: white;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 2000;
  min-width: 300px;
  max-width: 400px;
  animation: slideInUp 0.3s ease;
}

@keyframes slideInUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.progress-content {
  padding: 1rem;
}

.progress-text {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.progress-title {
  font-weight: 500;
  color: var(--text-color);
  font-size: 0.9rem;
}

.progress-percentage {
  font-weight: 600;
  color: var(--primary-color);
  font-size: 0.9rem;
}

.progress-bar-container {
  width: 100%;
  height: 8px;
  background-color: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color), #ff8f65);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-subtitle {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-top: 0.5rem;
}

@media (max-width: 768px) {
  .progress-toast {
    bottom: 1rem;
    right: 1rem;
    left: 1rem;
    min-width: auto;
    max-width: none;
  }
}
</style>