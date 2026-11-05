import { createRouter, createWebHistory } from 'vue-router'
import ProjectsView from '../views/ProjectsView.vue'
import ProjectFormView from '../views/ProjectFormView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    // 首页公开
    { path: '/', component: ProjectsView },
    { path: '/login', component: LoginView },
    { path: '/register', component: RegisterView },
    // 后台路由，打上 meta 标记
    { path: '/new', component: ProjectFormView, meta: { requiresAuth: true } },
    { path: '/edit/:slug', component: ProjectFormView, meta: { requiresAuth: true } },
  ],
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('auth_token')
  // 只要匹配到 meta 中要求鉴权的路由，且没有 token
  if (to.meta.requiresAuth && !token) {
    next('/login')
  } else {
    next()
  }
})
