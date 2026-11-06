import { createRouter, createWebHistory } from 'vue-router'
import AnalyticsView from '../views/AnalyticsView.vue'
import AppsView from '../views/AppsView.vue'
import CustomersView from '../views/CustomersView.vue'
import DashboardView from '../views/DashboardView.vue'
import LoginView from '../views/LoginView.vue'
import PaymentsView from '../views/PaymentsView.vue'
import RegisterView from '../views/RegisterView.vue'
import SettingsView from '../views/SettingsView.vue'
import SystemView from '../views/SystemView.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/dashboard', meta: { requiresAuth: true } },
    { path: '/dashboard', component: DashboardView, meta: { requiresAuth: true } },
    { path: '/apps', component: AppsView, meta: { requiresAuth: true } },
    { path: '/payments', component: PaymentsView, meta: { requiresAuth: true } },
    { path: '/users', component: CustomersView, meta: { requiresAuth: true } },
    { path: '/analytics', component: AnalyticsView, meta: { requiresAuth: true } },
    { path: '/settings', component: SettingsView, meta: { requiresAuth: true } },
    { path: '/system', component: SystemView, meta: { requiresAuth: true } },
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
