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
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../views/DashboardView.vue'),
      meta: { requiresAuth: true },
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
    }
  ],
})

// Guarda de navegação — redireciona utilizadores não autenticados
router.beforeEach((to) => {
  if (to.meta.requiresAuth && !localStorage.getItem('token')) {
    return { path: '/' }
  }
})

export default router
