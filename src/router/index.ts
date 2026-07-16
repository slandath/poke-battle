import { createRouter, createWebHistory } from 'vue-router'
import Search from '@/views/Search.vue'
import Team from '@/views/Team.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Search },
    { path: '/team', component: Team },
  ],
})

export default router
