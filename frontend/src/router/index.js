import { createRouter, createWebHistory } from 'vue-router'
import LandingView from '../views/LandingView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: LandingView,
    },
    {
      path: '/signup',
      name: 'signup',
      component: () => import('../views/CreateAccountView.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../views/DashboardView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/admin-dashboard',
      name: 'adminDashboard',
      component: () => import('../views/AdminDashboardView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/ProfileView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/map',
      name: 'map',
      component: () => import('../views/MapView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/parking/:id',
      name: 'parkingDetails',
      component: () => import('../views/ParkingDetailsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/reserve/:spotId',
      name: 'reserve',
      component: () => import('../views/ReservationView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/payment',
      name: 'payment',
      component: () => import('../views/PaymentView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/navigation',
      name: 'navigation',
      component: () => import('../views/ActiveNavigationView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/forgot-password',
      name: 'forgotPassword',
      component: () => import('../views/ForgotPasswordView.vue'),
    }
  ],
})

// Guarda de navegação — redireciona utilizadores não autenticados e lida com permissões
router.beforeEach((to) => {
  const token = localStorage.getItem('token')
  if (to.meta.requiresAuth && !token) {
    return { path: '/' }
  }

  if (token) {
    let user = null
    try {
      user = JSON.parse(localStorage.getItem('user') || 'null')
    } catch (e) {
      // Ignore
    }

    // Redirect admin trying to access standard dashboard
    if (to.name === 'dashboard' && user?.tipo_utilizador === 'ADMIN') {
      return { path: '/admin-dashboard' }
    }

    // Redirect normal user trying to access admin dashboard
    if (to.meta.requiresAdmin && user?.tipo_utilizador !== 'ADMIN') {
      return { path: '/dashboard' }
    }
  }
})

export default router
