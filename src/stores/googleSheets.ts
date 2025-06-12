import { defineStore } from 'pinia'
// import { useIngredientsStore } from './ingredients'
// import { useRecipesStore } from './recipes'
// import type { Ingredient } from './ingredients'
// import type { Recipe } from './recipes'
// import { google } from 'googleapis'
// import { JWT } from 'google-auth-library'

interface GoogleSheetsConfig {
  serviceAccountEmail: string
  privateKey: string
  sheetId: string
}

export const useGoogleSheetsStore = defineStore('googleSheets', {
  state: () => ({
    isConfigured: false,
    error: 'Google Sheets integration temporarily disabled',
  }),

  actions: {
    getConfig(): GoogleSheetsConfig | null {
      return null
    },

    async getAuthClient() {
      return null
    },

    async syncToSheets() {
      this.error = 'Google Sheets integration temporarily disabled'
    },

    async syncFromSheets() {
      this.error = 'Google Sheets integration temporarily disabled'
    }
  }
}) 