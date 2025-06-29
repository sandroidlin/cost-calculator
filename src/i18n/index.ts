import { createI18n } from 'vue-i18n'
import type { MessageSchema } from './schemas'

import en from './locales/en.json'
import zh from './locales/zh.json'

export default createI18n<[MessageSchema], 'en' | 'zh'>({
  locale: 'zh', // Default to Chinese
  fallbackLocale: 'en',
  messages: {
    en,
    zh,
  },
})