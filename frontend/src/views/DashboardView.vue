<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { PhGear, PhArrowLeft, PhMapPin, PhCurrencyEur, PhClock, PhMedal } from '@phosphor-icons/vue'
import { useAuth } from '../composables/useAuth'
import { getUserReservations } from '../api/reservations'
import { getParks } from '../api/parks'
import { getUserProfile } from '../api/users'

const router = useRouter()
const { user } = useAuth()
const activeTab = ref('upcoming')

const displayName = computed(() => user.value?.name || 'Driver')
const initials = computed(() => {
  const name = user.value?.name || ''
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'
})

const reservations = ref([])
const showSavedDetails = ref(false)

const toggleSaved = () => {
  showSavedDetails.value = !showSavedDetails.value
}

const thisMonthHours = computed(() => {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  
  let totalMinutes = 0
  reservations.value.forEach(r => {
    if (r.data_inicio && r.data_fim && r.status !== 'Cancelled') {
      const start = new Date(r.data_inicio)
      const end = new Date(r.data_fim)
      if (start.getMonth() === currentMonth && start.getFullYear() === currentYear) {
        const diffMs = end - start
        if (diffMs > 0) {
          totalMinutes += diffMs / (1000 * 60)
        }
      }
    }
  })
  
  const hours = totalMinutes / 60
  return hours > 0 ? `${Number(hours.toFixed(1))}h` : '0h'
})

onMounted(async () => {
  try {
    const data = await getUserReservations()
    reservations.value = data
  } catch (err) {
    console.error('Erro ao carregar reservas:', err)
  }

  // Refresh user profile details to get latest loyalty points
  try {
    const profile = await getUserProfile()
    localStorage.setItem('user', JSON.stringify(profile))
  } catch (err) {
    console.error('Erro ao buscar perfil atualizado:', err)
  }
})

const userLoyaltyPoints = computed(() => user.value?.loyaltyPoints || 0)

const showRedeemInfo = () => {
  alert(`🌟 Loyalty Points: ${userLoyaltyPoints.value}\n\nYou can use your points at checkout to receive a discount on your next reservation!\n\nRate: 100 points = €1.00 discount.`)
}

const filteredReservations = computed(() => {
  if (activeTab.value === 'upcoming') {
    return reservations.value.filter(r => r.status === 'Active' || r.status === 'Upcoming')
  } else {
    return reservations.value.filter(r => r.status === 'Cancelled' || r.status === 'Completed')
  }
})

const activeCount = computed(() => reservations.value.filter(r => r.status === 'Active').length)

const goBack = () => router.back()
const goToProfile = () => router.push('/profile')
const openMap = () => router.push('/map')
const goToNav = (resId) => {
  if (resId) {
    router.push(`/navigation?reservationId=${resId}`)
  } else {
    router.push('/navigation')
  }
}
</script>

<template>
  <div class="page-container">
    <header class="header justify-between">
      <button class="back-btn" @click="goBack">
        <PhArrowLeft :size="24" />
      </button>
      <button class="icon-btn" @click="goToProfile">
        <PhGear :size="24" />
      </button>
    </header>

    <main class="content">
      <div class="user-greeting">
        <div class="avatar">{{ initials }}</div>
        <div class="greeting-text">
          <p>Welcome back,</p>
          <h2>{{ displayName }}</h2>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card bg-card radius-lg" @click="openMap">
          <div class="icon-wrapper cyan">
            <PhMapPin :size="20" weight="fill" />
          </div>
          <h3>{{ activeCount }}</h3>
          <p>Active</p>
        </div>
        
        <div class="stat-card bg-card radius-lg" @click="toggleSaved">
          <div class="icon-wrapper green">
            <PhCurrencyEur :size="20" weight="fill" />
          </div>
          <h3>€127</h3>
          <p>Saved</p>
        </div>

        <div class="stat-card bg-card radius-lg">
          <div class="icon-wrapper blue">
            <PhClock :size="20" weight="fill" />
          </div>
          <h3>{{ thisMonthHours }}</h3>
          <p>This Month</p>
        </div>
      </div>

      <!-- Expandable Savings Detail Card -->
      <transition name="expand">
        <div v-if="showSavedDetails" class="savings-detail-card bg-card radius-lg mb-6">
          <div class="savings-header">
            <h4><PhCurrencyEur :size="20" weight="fill" class="text-green" /> Savings Breakdown</h4>
            <button class="close-detail-btn" @click="showSavedDetails = false">&times;</button>
          </div>
          <div class="savings-body">
            <div class="savings-row">
              <span class="savings-label">🌟 Loyalty Points Discount</span>
              <span class="savings-value text-green">-€25.00</span>
            </div>
            <div class="savings-row">
              <span class="savings-label">⏱️ Off-Peak Bookings</span>
              <span class="savings-value text-green">-€52.00</span>
            </div>
            <div class="savings-row">
              <span class="savings-label">🎟️ Promo Codes Applied</span>
              <span class="savings-value text-green">-€50.00</span>
            </div>
            <div class="divider"></div>
            <div class="savings-row total-row">
              <span class="savings-label">Total Money Saved</span>
              <span class="savings-value text-cyan">€127.00</span>
            </div>
          </div>
        </div>
      </transition>

      <div class="tabs">
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'upcoming' }"
          @click="activeTab = 'upcoming'"
        >
          My Reservations
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'history' }"
          @click="activeTab = 'history'"
        >
          History
        </button>
      </div>

      <div class="reservations-list">
        <div v-for="res in filteredReservations" :key="res.id" class="reservation-card bg-card radius-lg" @click="goToNav(res.id)">
          <div class="res-info">
            <div class="res-header">
              <h3 class="text-cyan">{{ res.resIdHex }}</h3>
              <span v-if="res.status === 'Active'" class="badge active">Active</span>
            </div>
            <p class="location">{{ res.location }}</p>
            <p class="level">Vaga {{ res.spotNumber }} • {{ res.level }}</p>
            <div class="time-info">
              <PhClock :size="14" class="text-secondary" />
              <span>{{ res.time }}</span>
            </div>
          </div>
        </div>
      </div>
    </main>

    <div v-if="userLoyaltyPoints > 0" class="loyalty-banner">
      <div class="banner-content">
        <PhMedal :size="24" />
        <div class="banner-text">
          <h4>Loyalty Points</h4>
          <p>You have {{ userLoyaltyPoints }} points</p>
        </div>
      </div>
      <button class="redeem-btn" @click="showRedeemInfo">Redeem</button>
    </div>
  </div>
</template>

<style scoped>
.content {
  padding: 0 var(--spacing-4);
  flex: 1;
}

.icon-btn {
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
}

.icon-btn:hover {
  color: var(--color-text-primary);
}

.user-greeting {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-6);
}

.avatar {
  width: 56px;
  height: 56px;
  background-color: var(--color-accent-cyan);
  color: var(--color-bg-base);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 700;
}

.greeting-text p {
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.greeting-text h2 {
  font-size: 1.5rem;
  font-weight: 600;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-8);
}

.stat-card {
  padding: var(--spacing-3);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  cursor: pointer;
}

.icon-wrapper {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--spacing-2);
}

.icon-wrapper.cyan { background-color: rgba(0, 212, 255, 0.15); color: var(--color-accent-cyan); }
.icon-wrapper.green { background-color: rgba(34, 197, 94, 0.15); color: var(--color-status-free); }
.icon-wrapper.blue { background-color: rgba(59, 130, 246, 0.15); color: #3b82f6; }

.stat-card h3 {
  font-size: 1.25rem;
  font-weight: 600;
}

.stat-card p {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.tabs {
  display: flex;
  background-color: var(--color-bg-card);
  border-radius: var(--radius-md);
  padding: 0.25rem;
  margin-bottom: var(--spacing-6);
}

.tab-btn {
  flex: 1;
  padding: 0.75rem;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--color-text-secondary);
  font-weight: 500;
  transition: all 0.2s ease;
}

.tab-btn.active {
  background-color: var(--color-accent-cyan);
  color: var(--color-bg-base);
}

.reservations-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
  padding-bottom: 80px; /* space for banner */
}

.reservation-card {
  padding: var(--spacing-4);
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.reservation-card:hover {
  transform: translateY(-2px);
}

.res-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  margin-bottom: 0.25rem;
}

.res-header h3 {
  font-size: 1.25rem;
  font-weight: 700;
}

.badge {
  font-size: 0.65rem;
  padding: 0.1rem 0.4rem;
  border-radius: var(--radius-full);
  font-weight: 600;
  text-transform: uppercase;
}

.badge.active {
  background-color: rgba(34, 197, 94, 0.15);
  color: var(--color-status-free);
  border: 1px solid var(--color-status-free);
}

.location {
  font-weight: 600;
  font-size: 0.95rem;
}

.level {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  margin-bottom: 0.5rem;
}

.time-info {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.qr-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: var(--color-accent-cyan);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loyalty-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-width: 600px;
  margin: 0 auto;
  background-color: var(--color-accent-cyan);
  color: var(--color-bg-base);
  padding: var(--spacing-4);
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top-left-radius: var(--radius-lg);
  border-top-right-radius: var(--radius-lg);
  z-index: 10;
}

.banner-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.banner-text h4 {
  font-weight: 700;
  font-size: 1rem;
}

.banner-text p {
  font-size: 0.8rem;
  opacity: 0.9;
}

.redeem-btn {
  background-color: var(--color-bg-base);
  color: var(--color-accent-cyan);
  border: none;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-full);
  font-weight: 600;
  font-size: 0.85rem;
}

.savings-detail-card {
  padding: var(--spacing-4);
  border: 1px solid var(--color-border);
  transition: all 0.3s ease;
}

.savings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-4);
}

.savings-header h4 {
  font-size: 1.1rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
}

.close-detail-btn {
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  font-size: 1.5rem;
  cursor: pointer;
  line-height: 1;
}

.close-detail-btn:hover {
  color: var(--color-text-primary);
}

.savings-body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.savings-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
}

.savings-label {
  color: var(--color-text-secondary);
}

.savings-value {
  font-weight: 600;
}

.text-green {
  color: var(--color-status-free);
}

.divider {
  height: 1px;
  background-color: var(--color-border);
  margin: var(--spacing-2) 0;
}

.total-row {
  font-weight: 700;
  font-size: 1rem;
}

.saved-parks-section {
  margin-top: var(--spacing-6);
  border-top: 1px dashed var(--color-border);
  padding-top: var(--spacing-4);
}

.saved-parks-section h5 {
  font-size: 0.95rem;
  font-weight: 700;
  margin-bottom: var(--spacing-3);
  color: var(--color-text-primary);
}

.no-parks {
  font-size: 0.85rem;
}

.saved-parks-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.saved-park-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-3);
  background-color: var(--color-bg-base);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
}

.saved-park-item:hover {
  border-color: var(--color-accent-cyan);
  transform: translateY(-1px);
}

.park-info-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.park-name {
  font-weight: 600;
  font-size: 0.9rem;
}

.park-dist {
  font-size: 0.8rem;
}

/* Animations */
.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  max-height: 400px;
  opacity: 1;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
  margin-top: 0;
  margin-bottom: 0;
}
</style>
