<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { PhGlobe } from '@phosphor-icons/vue'

const { locale, availableLocales } = useI18n()

const switchLanguage = (lang: string) => {
  locale.value = lang
  localStorage.setItem('preferred-language', lang)
}

// Load preferred language from localStorage on mount
const savedLang = localStorage.getItem('preferred-language')
if (savedLang && availableLocales.includes(savedLang)) {
  locale.value = savedLang
}
</script>

<template>
  <div class="language-switcher">
    <button
      class="language-btn"
      @click="switchLanguage(locale === 'zh' ? 'en' : 'zh')"
      :title="locale === 'zh' ? 'Switch to English' : '切換至中文'"
    >
      <PhGlobe :size="18" />
      <span>{{ locale === 'zh' ? 'EN' : '中' }}</span>
    </button>
  </div>
</template>

<style scoped>
.language-switcher {
  display: flex;
  align-items: center;
}

.language-btn {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  background: none;
  border: 1px solid var(--border-color);
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--text-color);
  transition: all 0.2s;
}

.language-btn:hover {
  background: var(--background-color);
  border-color: var(--primary-color);
}

.language-btn span {
  font-weight: 500;
  min-width: 1.5rem;
  text-align: center;
}
</style>
