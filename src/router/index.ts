import { createRouter, createWebHashHistory } from 'vue-router'
import RecipeList from '@/components/RecipeList.vue'
import RecipeCreator from '@/components/RecipeCreator.vue'
import IngredientsManager from '@/components/IngredientsManager.vue'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: RecipeList
    },
    {
      path: '/recipes/new',
      name: 'new-recipe',
      component: RecipeCreator
    },
    {
      path: '/ingredients',
      name: 'ingredients',
      component: IngredientsManager
    }
  ]
})

export default router
