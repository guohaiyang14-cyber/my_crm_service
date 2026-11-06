import { createRouter, createWebHistory } from 'vue-router'
import CustomersView from '../views/CustomersView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: CustomersView, meta: { requiresAuth: true } },
    { path: '/login', component: LoginView },
    { path: '/register', component: RegisterView },
  ],
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('auth_token')
  if (to.meta.requiresAuth && !token) {
    next('/login')
  } else {
    next()
  }
})
