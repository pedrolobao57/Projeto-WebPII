<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { PhArrowLeft, PhMapPin, PhLightning, PhShieldCheck, PhHouseLine, PhClock, PhHeart, PhWheelchair, PhMotorcycle, PhInfo } from '@phosphor-icons/vue'
import { getParkDetails, getParkSpots } from '../api/parks'

const amenityIcon = (name) => {
  const map = {
    'EV Charging': PhLightning,
    'Covered': PhHouseLine,
    'Security': PhShieldCheck,
    '24/7': PhClock,
    'Accessible': PhWheelchair,
    'Motorcycle': PhMotorcycle
  }
  return map[name] || PhInfo
}

const router = useRouter()
const route = useRoute()
const parkId = route.params.id

const goBack = () => router.back()

const parkDetails = ref({
  name: 'Carregando...',
  location: '...',
  availableSpots: 0,
  price: 0,
  totalSpots: 0
})

const levels = ref([])
const isFavorite = ref(false)

onMounted(async () => {
  try {
    const details = await getParkDetails(parkId)
    parkDetails.value = details
    
    const spotsData = await getParkSpots(parkId)
    levels.value = spotsData
  } catch (err) {
    console.error('Erro ao carregar detalhes do parque:', err)
  }

  // Load favorite status
  const favs = JSON.parse(localStorage.getItem('fav_parks') || '[]')
  isFavorite.value = favs.includes(Number(parkId)) || favs.includes(parkId.toString())
})

const toggleFavorite = () => {
  let favs = JSON.parse(localStorage.getItem('fav_parks') || '[]')
  const numericId = Number(parkId)
  if (favs.includes(numericId)) {
    favs = favs.filter(id => id !== numericId)
    isFavorite.value = false
  } else {
    favs.push(numericId)
    isFavorite.value = true
  }
  localStorage.setItem('fav_parks', JSON.stringify(favs))
}

const selectSpot = (spot) => {
  if (spot.status === 'free') {
    router.push(`/reserve/${spot.id}?parkId=${parkId}&spotNumber=${spot.name}&price=${parkDetails.value.price}&parkName=${parkDetails.value.name}`)
  }
}
</script>

<template>
  <div class="page-container">
    <header class="header justify-between">
      <button class="back-btn" @click="goBack">
        <PhArrowLeft :size="24" />
      </button>
      <div style="display: flex; gap: var(--spacing-2);">
        <button class="back-btn" @click="toggleFavorite" :title="isFavorite ? 'Remove from Saved' : 'Save Park'">
          <PhHeart :size="24" :weight="isFavorite ? 'fill' : 'regular'" :color="isFavorite ? 'var(--color-status-occupied)' : 'var(--color-text-primary)'" />
        </button>
        <button class="back-btn" @click="router.push('/dashboard')" title="Home">
          <PhHouseLine :size="24" />
        </button>
      </div>
    </header>

    <main class="content">
      <div class="location-header">
        <h1>{{ parkDetails.name }}</h1>
        <div class="location-details">
          <p><PhMapPin :size="16" /> {{ parkDetails.location }}</p>
        </div>
      </div>

      <div class="top-stats">
        <div class="stat bg-card">
          <span class="value text-cyan">{{ parkDetails.availableSpots }}</span>
          <span class="label">Available</span>
        </div>
        <div class="stat bg-card">
          <span class="value">€{{ parkDetails.price }}</span>
          <span class="label">Per Hour</span>
        </div>
        <div class="stat bg-card">
          <span class="value">{{ parkDetails.totalSpots }}</span>
          <span class="label">Total Spots</span>
        </div>
      </div>

      <div class="amenities-section">
        <h3>Amenities & Information</h3>
        <div class="amenities-grid">
          <div v-for="amenity in parkDetails.amenities" :key="amenity" class="amenity-badge bg-card">
            <component :is="amenityIcon(amenity)" :size="18" class="text-cyan" />
            <span>{{ amenity }}</span>
          </div>
        </div>
      </div>

      <div class="legend">
        <div class="legend-item">
          <div class="legend-color green"></div>
          <span>Available</span>
        </div>
        <div class="legend-item">
          <div class="legend-color red"></div>
          <span>Occupied</span>
        </div>
        <div class="legend-item">
          <div class="legend-color yellow"></div>
          <span>Reserved</span>
        </div>
      </div>

      <div class="levels-container">
        <div v-for="level in levels" :key="level.name" class="level-section">
          <h3 class="level-title">{{ level.name }}</h3>
          <div class="spots-grid">
            <button 
              v-for="spot in level.spots" 
              :key="spot.id"
              class="spot-btn"
              :class="spot.status"
              :disabled="spot.status !== 'free'"
              @click="selectSpot(spot)"
            >
              {{ spot.name }}
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.content {
  padding: 0 var(--spacing-4) var(--spacing-8);
}

.location-header {
  margin-bottom: var(--spacing-6);
}

h1 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.location-details {
  color: var(--color-text-secondary);
  font-size: 0.85rem;
}

.location-details p {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-bottom: 0.25rem;
}

.distance {
  padding-left: 1.25rem;
}

.top-stats {
  display: flex;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-6);
}

.stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-3);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.value {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.label {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.amenities-section {
  margin-bottom: var(--spacing-6);
}

.amenities-section h3 {
  font-size: 1rem;
  margin-bottom: var(--spacing-4);
}

.amenities-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-3);
}

.amenity-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: var(--radius-full);
  font-size: 0.85rem;
  border: 1px solid var(--color-border);
}

.legend {
  display: flex;
  justify-content: center;
  gap: var(--spacing-6);
  margin-bottom: var(--spacing-6);
  font-size: 0.8rem;
  color: var(--color-text-secondary);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.legend-color.green { background-color: var(--color-status-free); }
.legend-color.red { background-color: var(--color-status-occupied); }
.legend-color.yellow { background-color: var(--color-status-reserved); }

.levels-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-8);
}

.level-title {
  font-size: 1rem;
  margin-bottom: var(--spacing-4);
  color: var(--color-text-secondary);
}

.spots-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--spacing-2);
}

.spot-btn {
  aspect-ratio: 1;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 0.9rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  transition: transform 0.1s ease, filter 0.2s ease;
}

.spot-btn.free {
  background-color: var(--color-status-free);
  cursor: pointer;
}

.spot-btn.free:hover {
  filter: brightness(1.1);
  transform: scale(1.05);
}

.spot-btn.free:active {
  transform: scale(0.95);
}

.spot-btn.occupied {
  background-color: var(--color-status-occupied);
  opacity: 0.8;
}

.spot-btn.reserved {
  background-color: var(--color-status-reserved);
  color: #000;
  opacity: 0.9;
}
</style>
