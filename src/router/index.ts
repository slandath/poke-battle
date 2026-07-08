import { createRouter, createWebHistory } from 'vue-router'
import Battle from '@/views/Battle.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Battle },
  ],
})

export default router
