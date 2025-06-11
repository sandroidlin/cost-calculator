import { defineStore } from 'pinia'
import { useIngredientsStore } from './ingredients'
import { useRecipesStore } from './recipes'
import type { Ingredient } from './ingredients'
import type { Recipe } from './recipes'

interface GoogleSheetsConfig {
  serviceAccountEmail: string
  privateKey: string
  sheetId: string
}

export const useGoogleSheetsStore = defineStore('googleSheets', {
  state: () => ({
    isConfigured: false,
    error: null as string | null,
  }),

  actions: {
    getConfig(): GoogleSheetsConfig | null {
      const email = import.meta.env.VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL
      const key = import.meta.env.VITE_GOOGLE_PRIVATE_KEY
      const sheetId = import.meta.env.VITE_GOOGLE_SHEET_ID

      if (!email || !key || !sheetId) {
        this.error = 'Google Sheets credentials not found in environment variables'
        return null
      }

      return {
        serviceAccountEmail: email,
        privateKey: key,
        sheetId: sheetId
      }
    },

    async syncToSheets() {
      const config = this.getConfig()
      if (!config) return

      const ingredientsStore = useIngredientsStore()
      const recipesStore = useRecipesStore()

      try {
        // Here you would implement the actual Google Sheets API calls
        // using the credentials from environment variables
        const data = {
          ingredients: ingredientsStore.ingredients,
          recipes: recipesStore.recipes
        }

        // Example of how you would use the config:
        // const auth = new google.auth.JWT(
        //   config.serviceAccountEmail,
        //   null,
        //   config.privateKey,
        //   ['https://www.googleapis.com/auth/spreadsheets']
        // )
        
        this.error = null
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to sync with Google Sheets'
      }
    },

    async syncFromSheets() {
      const config = this.getConfig()
      if (!config) return

      const ingredientsStore = useIngredientsStore()
      const recipesStore = useRecipesStore()

      try {
        // Here you would implement the actual Google Sheets API calls
        // using the credentials from environment variables
        
        // Example:
        // const auth = new google.auth.JWT(...)
        // const sheets = google.sheets({ version: 'v4', auth })
        // const response = await sheets.spreadsheets.values.get({
        //   spreadsheetId: config.sheetId,
        //   range: 'Sheet1!A1:Z1000'
        // })

        this.error = null
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to sync with Google Sheets'
      }
    }
  }
}) 