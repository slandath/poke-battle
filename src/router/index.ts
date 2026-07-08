import { createRouter, createWebHistory } from 'vue-router'
import Battle from '@/views/Battle.vue'
import Team from '@/views/Team.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Battle },
    { path: '/team', component: Team },
  ],
})

export default router
