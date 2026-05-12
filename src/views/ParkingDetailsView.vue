<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { PhArrowLeft, PhMapPin, PhLightning, PhShieldCheck, PhHouseLine, PhClock } from '@phosphor-icons/vue'

const router = useRouter()

const goBack = () => router.back()

// Generate mock spots for 3 levels
const generateSpots = (level, count, startId) => {
  const spots = []
  for (let i = 0; i < count; i++) {
    const id = startId + i
    // Randomly assign statuses for visual variety
    let status = 'free'
    if (i % 7 === 0) status = 'reserved'
    else if (i % 3 === 0 || i % 4 === 0) status = 'occupied'
    
    spots.push({
      id: `${id < 10 ? '0' + id : id}`,
      status
    })
  }
  return spots
}

const levels = ref([
  { name: 'Level 1', spots: generateSpots(1, 10, 1) },
  { name: 'Level 2', spots: generateSpots(2, 10, 11) },
  { name: 'Level 3', spots: generateSpots(3, 10, 21) },
])

const selectSpot = (spot) => {
  if (spot.status === 'free') {
    router.push(`/reserve/${spot.id}`)
  }
}
</script>

<template>
  <div class="page-container">
    <header class="header">
      <button class="back-btn" @click="goBack">
        <PhArrowLeft :size="24" />
      </button>
    </header>

    <main class="content">
      <div class="location-header">
        <h1>Downtown Plaza</h1>
        <div class="location-details">
          <p><PhMapPin :size="16" /> 123 Main Street, Downtown</p>
          <p class="distance">0.2 mi away</p>
        </div>
      </div>

      <div class="top-stats">
        <div class="stat bg-card">
          <span class="value text-cyan">45</span>
          <span class="label">Available</span>
        </div>
        <div class="stat bg-card">
          <span class="value">$8</span>
          <span class="label">Per Hour</span>
        </div>
        <div class="stat bg-card">
          <span class="value">120</span>
          <span class="label">Total Spots</span>
        </div>
      </div>

      <div class="amenities-section">
        <h3>Amenities & Information</h3>
        <div class="amenities-grid">
          <div class="amenity-badge bg-card">
            <PhLightning :size="18" class="text-cyan" />
            <span>EV Charging</span>
          </div>
          <div class="amenity-badge bg-card">
            <PhHouseLine :size="18" class="text-cyan" />
            <span>Covered</span>
          </div>
          <div class="amenity-badge bg-card">
            <PhShieldCheck :size="18" class="text-cyan" />
            <span>Security</span>
          </div>
          <div class="amenity-badge bg-card">
            <PhClock :size="18" class="text-cyan" />
            <span>24/7</span>
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
              {{ spot.id }}
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
