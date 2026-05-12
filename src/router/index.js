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
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/ProfileView.vue'),
    },
    {
      path: '/map',
      name: 'map',
      component: () => import('../views/MapView.vue'),
    },
    {
      path: '/parking/:id',
      name: 'parkingDetails',
      component: () => import('../views/ParkingDetailsView.vue'),
    },
    {
      path: '/reserve/:spotId',
      name: 'reserve',
      component: () => import('../views/ReservationView.vue'),
    },
    {
      path: '/payment',
      name: 'payment',
      component: () => import('../views/PaymentView.vue'),
    },
    {
      path: '/navigation',
      name: 'navigation',
      component: () => import('../views/ActiveNavigationView.vue'),
    }
  ],
})

export default router
