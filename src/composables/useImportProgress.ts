import { reactive } from 'vue'

interface ImportProgress {
  visible: boolean
  title: string
  percentage: number
  subtitle?: string
  current: number
  total: number
}

const progressState = reactive<ImportProgress>({
  visible: false,
  title: '',
  percentage: 0,
  subtitle: '',
  current: 0,
  total: 0,
})

export function useImportProgress() {
  const startImport = (title: string, total: number) => {
    progressState.visible = true
    progressState.title = title
    progressState.total = total
    progressState.current = 0
    progressState.percentage = 0
    progressState.subtitle = `0 of ${total} items`
  }

  const updateProgress = (current: number, itemName?: string) => {
    progressState.current = current
    progressState.percentage = (current / progressState.total) * 100

    if (itemName) {
      progressState.subtitle = `${current} of ${progressState.total} items - ${itemName}`
    } else {
      progressState.subtitle = `${current} of ${progressState.total} items`
    }
  }

  const completeImport = (successMessage?: string) => {
    progressState.percentage = 100
    progressState.subtitle = successMessage || `Completed ${progressState.total} items`

    // Hide after a short delay to show completion
    setTimeout(() => {
      progressState.visible = false
    }, 1500)
  }

  const hideProgress = () => {
    progressState.visible = false
  }

  return {
    progressState,
    startImport,
    updateProgress,
    completeImport,
    hideProgress,
  }
}
