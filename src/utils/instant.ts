import { init } from '@dorilama/instantdb-vue'
import schema from '../../instant.schema'

type AppSchema = typeof schema

// Initialize the database
const APP_ID = import.meta.env.VITE_INSTANT_APP_ID

if (!APP_ID) {
  throw new Error('VITE_INSTANT_APP_ID environment variable is required')
}

export const db = init({ 
  appId: APP_ID, 
  schema 
})

export type { AppSchema }