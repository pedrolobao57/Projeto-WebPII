<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { PhGear, PhArrowLeft, PhMapPin, PhCurrencyDollar, PhClock, PhQrCode, PhMedal } from '@phosphor-icons/vue'
import { useAuth } from '../composables/useAuth'
import { getUserReservations } from '../api/reservations'

const router = useRouter()
const { user } = useAuth()
const activeTab = ref('upcoming')

const displayName = computed(() => user.value?.name || 'Driver')
const initials = computed(() => {
  const name = user.value?.name || ''
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'
})

const reservations = ref([])

onMounted(async () => {
  try {
    const data = await getUserReservations()
    reservations.value = data
  } catch (err) {
    console.error('Erro ao carregar reservas:', err)
  }
})

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
        
        <div class="stat-card bg-card radius-lg">
          <div class="icon-wrapper green">
            <PhCurrencyDollar :size="20" weight="fill" />
          </div>
          <h3>$127</h3>
          <p>Saved</p>
        </div>

        <div class="stat-card bg-card radius-lg">
          <div class="icon-wrapper blue">
            <PhClock :size="20" weight="fill" />
          </div>
          <h3>42h</h3>
          <p>This Month</p>
        </div>
      </div>

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
          <button class="qr-btn" @click.stop="goToNav(res.id)">
            <PhQrCode :size="24" color="var(--color-bg-base)" />
          </button>
        </div>
      </div>
    </main>

    <div class="loyalty-banner">
      <div class="banner-content">
        <PhMedal :size="24" />
        <div class="banner-text">
          <h4>Loyalty Points</h4>
          <p>You have 1,240 points</p>
        </div>
      </div>
      <button class="redeem-btn">Redeem</button>
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
</style>
