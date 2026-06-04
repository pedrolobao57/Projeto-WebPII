<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { 
  PhArrowLeft, 
  PhArrowUpRight,
  PhMapPin,
  PhQrCode,
  PhCheckCircle,
  PhHouseLine
} from '@phosphor-icons/vue'
import { getReservation, getUserReservations, cancelReservation } from '../api/reservations'
import apiClient from '../api/client'

const router = useRouter()
const route = useRoute()
const reservationId = route.query.reservationId

const activeReservation = ref({
  spotNumber: 'A-12',
  location: 'Downtown Plaza',
  level: 'Level 2'
})

const mapUrl = computed(() => {
  const query = activeReservation.value?.address || activeReservation.value?.location || 'Porto'
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&t=&z=16&ie=UTF8&iwloc=&output=embed`
})

onMounted(async () => {
  try {
    let resId = reservationId
    if (!resId) {
      const list = await getUserReservations()
      const active = list.find(r => r.status === 'Active') || list[0]
      if (active) {
        resId = active.id
      }
    }
    if (resId) {
      const data = await getReservation(resId)
      activeReservation.value = data
    }
  } catch (err) {
    console.error('Erro ao carregar detalhes de navegacao:', err)
  }
})

const goBack = () => router.back()
const showQR = () => {
  // Logic to show QR code modal
}
const arrive = async () => {
  try {
    const payload = {
      id_veiculo: Number(activeReservation.value.id_veiculo),
      id_vaga: Number(activeReservation.value.spotId || activeReservation.value.id_vaga),
      id_reserva: Number(activeReservation.value.id || activeReservation.value.id_reserva)
    }

    if (!payload.id_veiculo || !payload.id_vaga || !payload.id_reserva) {
      throw new Error('Detalhes da reserva incompletos para registar a entrada do veículo.')
    }

    await apiClient.post('/estacionamentos/entrada', payload)
    alert('Entrada no parque registada com sucesso!')
    router.push('/dashboard')
  } catch (err) {
    alert(err.error || err.message || 'Erro ao registar a entrada no parque.')
    console.error('Erro ao registar entrada:', err)
  }
}
const handleCancel = async () => {
  if (confirm('Are you sure you want to cancel this reservation?')) {
    try {
      const resId = reservationId || activeReservation.value.id
      if (!resId) throw new Error('No reservation ID found.')
      await cancelReservation(resId)
      alert('Reservation cancelled successfully.')
      router.push('/dashboard')
    } catch (err) {
      alert(err.message || 'Error cancelling reservation.')
    }
  }
}
</script>

<template>
  <div class="navigation-container">
    <header class="header transparent justify-between">
      <button class="back-btn" @click="goBack">
        <PhArrowLeft :size="24" />
      </button>
      <button class="back-btn" @click="router.push('/dashboard')" title="Home">
        <PhHouseLine :size="24" />
      </button>
    </header>

    <!-- Map Background -->
    <div class="map-bg">
      <iframe
        v-if="activeReservation.address || activeReservation.location"
        :src="mapUrl"
        width="100%"
        height="100%"
        style="border:0;"
        allowfullscreen=""
        loading="lazy"
        referrerpolicy="no-referrer-when-downgrade"
      ></iframe>
      <div v-else class="route-visualization">
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
        <span class="distance">Driving Directions</span>
        <h2>Navigate to {{ activeReservation.location }}</h2>
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

      <button class="btn-danger w-full mt-2" @click="handleCancel">
        Cancel Reservation
      </button>
      
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

.map-bg iframe {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
  filter: invert(90%) hue-rotate(180deg) brightness(85%) contrast(115%);
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

.btn-danger {
  width: 100%;
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid var(--color-status-occupied);
  color: var(--color-status-occupied);
  border-radius: var(--radius-md);
  padding: 0.75rem;
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  box-sizing: border-box;
}

.btn-danger:hover {
  background-color: var(--color-status-occupied);
  color: #ffffff;
}

.w-full {
  width: 100%;
}

.mt-2 {
  margin-top: 0.5rem;
}
</style>
