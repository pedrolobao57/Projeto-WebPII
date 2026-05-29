<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { 
  PhArrowLeft, 
  PhArrowUpRight,
  PhMapPin,
  PhQrCode,
  PhCheckCircle
} from '@phosphor-icons/vue'
import { getReservation, getUserReservations } from '../api/reservations'

const router = useRouter()
const route = useRoute()
const reservationId = route.query.reservationId

const activeReservation = ref({
  spotNumber: 'A-12',
  location: 'Downtown Plaza',
  level: 'Level 2'
})

onMounted(async () => {
  try {
    if (reservationId) {
      const data = await getReservation(reservationId)
      activeReservation.value = data
    } else {
      const list = await getUserReservations()
      const active = list.find(r => r.status === 'Active') || list[0]
      if (active) {
        activeReservation.value = active
      }
    }
  } catch (err) {
    console.error('Erro ao carregar detalhes de navegacao:', err)
  }
})

const goBack = () => router.back()
const showQR = () => {
  // Logic to show QR code modal
}
const arrive = () => {
  router.push('/dashboard')
}
</script>

<template>
  <div class="navigation-container">
    <header class="header transparent">
      <button class="back-btn" @click="goBack">
        <PhArrowLeft :size="24" />
      </button>
    </header>

    <!-- Map Background -->
    <div class="map-bg">
      <div class="route-visualization">
        <div class="entrance-label">Entrance →</div>
        <svg class="route-path" viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg">
          <path d="M 20,130 Q 100,10 180,50" fill="none" stroke="var(--color-accent-cyan)" stroke-width="4" stroke-dasharray="8 8" />
        </svg>
        <div class="destination-pin">
          <PhMapPin weight="fill" />
        </div>
        <div class="level-indicator">+ Level 2</div>
      </div>
    </div>

    <!-- Direction Instructions -->
    <div class="direction-card">
      <div class="direction-icon bg-cyan">
        <PhArrowUpRight :size="24" color="var(--color-bg-base)" weight="bold" />
      </div>
      <div class="direction-text">
        <span class="distance">In 150m</span>
        <h2>Turn right onto Main Street</h2>
      </div>
    </div>

    <!-- Bottom Sheet -->
    <div class="bottom-sheet">
      <div class="sheet-handle"></div>
      
      <div class="spot-info">
        <div class="spot-badge">{{ activeReservation.spotNumber }}</div>
        <div class="spot-details">
          <h3>Your Parking Spot</h3>
          <p>{{ activeReservation.location }} • {{ activeReservation.level }}</p>
        </div>
      </div>

      <div class="trip-stats">
        <div class="stat-box bg-card">
          <span class="stat-value">2 min</span>
          <span class="stat-label">Est. time</span>
        </div>
        <div class="stat-box bg-card">
          <span class="stat-value">45m</span>
          <span class="stat-label">Distance</span>
        </div>
        <div class="stat-box bg-card">
          <span class="stat-value">{{ activeReservation.level.replace('Level ', 'L').replace('Piso ', 'L') }}</span>
          <span class="stat-label">Floor</span>
        </div>
      </div>

      <div class="action-buttons">
        <button class="btn-secondary qr-btn" @click="showQR">
          <PhQrCode :size="20" />
          <span>Show QR</span>
        </button>
        <button class="btn-primary arrive-btn" @click="arrive">
          <PhCheckCircle :size="20" />
          <span>I've Arrived</span>
        </button>
      </div>
      
      <div class="footer-note">
        Follow GPS directions to navigate to your parking spot
      </div>
    </div>
  </div>
</template>

<style scoped>
.navigation-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  background-color: #1e2638; /* Base map color */
  overflow: hidden;
}

.header.transparent {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 20;
  background: transparent;
}

.map-bg {
  flex: 1;
  position: relative;
  background-color: #1a2235; /* Darker map tone */
}

.route-visualization {
  position: absolute;
  top: 40%;
  left: 10%;
  width: 80%;
  height: 200px;
}

.entrance-label {
  position: absolute;
  left: 0;
  bottom: 0;
  font-size: 0.8rem;
  color: var(--color-text-secondary);
}

.route-path {
  width: 100%;
  height: 100%;
}

.destination-pin {
  position: absolute;
  right: 5%;
  top: 20%;
  color: var(--color-status-occupied);
  font-size: 32px;
  filter: drop-shadow(0 4px 4px rgba(0,0,0,0.3));
}

.level-indicator {
  position: absolute;
  right: 0;
  bottom: 20%;
  font-size: 0.8rem;
  color: var(--color-text-secondary);
}

.direction-card {
  position: absolute;
  top: 80px;
  left: var(--spacing-4);
  right: var(--spacing-4);
  background-color: var(--color-bg-base);
  border-radius: var(--radius-lg);
  padding: var(--spacing-4);
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
  box-shadow: var(--shadow-lg);
  z-index: 10;
}

.direction-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.bg-cyan {
  background-color: var(--color-accent-cyan);
}

.direction-text {
  flex: 1;
}

.distance {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.direction-text h2 {
  font-size: 1.1rem;
  font-weight: 700;
  margin-top: 0.25rem;
  line-height: 1.2;
}

.bottom-sheet {
  background-color: var(--color-bg-base);
  border-top-left-radius: var(--radius-xl);
  border-top-right-radius: var(--radius-xl);
  padding: var(--spacing-3) var(--spacing-4) var(--spacing-6);
  position: relative;
  box-shadow: 0 -4px 20px rgba(0,0,0,0.3);
  z-index: 10;
}

.sheet-handle {
  width: 40px;
  height: 4px;
  background-color: var(--color-border);
  border-radius: 2px;
  margin: 0 auto var(--spacing-4);
}

.spot-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-6);
}

.spot-badge {
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

.spot-details h3 {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.spot-details p {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
}

.trip-stats {
  display: flex;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-6);
}

.stat-box {
  flex: 1;
  padding: var(--spacing-3);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border);
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.action-buttons {
  display: flex;
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-4);
}

.qr-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.arrive-btn {
  flex: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.footer-note {
  text-align: center;
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}
</style>
