<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { PhMagnifyingGlass, PhMapPin, PhList, PhCrosshair, PhPlus, PhMinus } from '@phosphor-icons/vue'

const router = useRouter()

const filters = ['Price', 'Distance', 'EV Charging', 'Covered']
const activeFilters = ref([])

const toggleFilter = (filter) => {
  if (activeFilters.value.includes(filter)) {
    activeFilters.value = activeFilters.value.filter(f => f !== filter)
  } else {
    activeFilters.value.push(filter)
  }
}

const nearbyLocations = [
  { id: '1', name: 'Downtown Plaza', distance: '0.2 mi', spots: '24/50', price: '$8', isAvailable: true },
  { id: '2', name: 'Central Station', distance: '0.5 mi', spots: '12/40', price: '$6', isAvailable: true },
  { id: '3', name: 'Harbor View', distance: '0.8 mi', spots: '35/60', price: '$10', isAvailable: true },
  { id: '4', name: 'Tech Hub Garage', distance: '1.2 mi', spots: '8/30', price: '$5', isAvailable: false },
]

const openDetails = (id) => {
  router.push(`/parking/${id}`)
}
</script>

<template>
  <div class="map-container">
    <div class="map-header">
      <div class="top-row">
        <h2 class="brand">ParkSmart</h2>
        <button class="profile-btn" @click="router.push('/profile')">
          <PhMapPin :size="20" weight="fill" />
        </button>
      </div>

      <div class="search-bar">
        <PhMagnifyingGlass :size="20" class="search-icon" />
        <input type="text" placeholder="Search for parking..." />
        <button class="filter-btn"><PhList :size="20" /></button>
      </div>

      <div class="filter-chips">
        <button 
          v-for="filter in filters" 
          :key="filter"
          class="chip"
          :class="{ active: activeFilters.includes(filter) }"
          @click="toggleFilter(filter)"
        >
          {{ filter }}
        </button>
      </div>
    </div>

    <div class="map-view">
      <!-- Placeholder Map UI -->
      <div class="mock-map">
        <!-- Roads -->
        <div class="road horizontal" style="top: 30%"></div>
        <div class="road horizontal" style="top: 70%"></div>
        <div class="road vertical" style="left: 40%"></div>
        
        <!-- Blocks -->
        <div class="block" style="top: 10%; left: 10%; width: 25%; height: 15%;"></div>
        <div class="block" style="top: 40%; left: 10%; width: 25%; height: 25%;"></div>
        <div class="block" style="top: 10%; left: 50%; width: 40%; height: 15%;"></div>
        <div class="block" style="top: 40%; left: 50%; width: 40%; height: 25%;"></div>

        <!-- Pins -->
        <div class="pin green" style="top: 25%; left: 35%;" @click="openDetails('1')">
          <PhMapPin weight="fill" />
        </div>
        <div class="pin yellow" style="top: 45%; left: 60%;" @click="openDetails('2')">
          <PhMapPin weight="fill" />
        </div>
        <div class="pin teal" style="top: 65%; left: 20%;" @click="openDetails('3')">
          <div class="pin-inner"><PhMapPin weight="fill" /></div>
        </div>
        <div class="pin green" style="top: 75%; left: 75%;" @click="openDetails('4')">
          <PhMapPin weight="fill" />
        </div>
        <div class="pin red" style="top: 15%; left: 85%;">
          <PhMapPin weight="fill" />
        </div>

        <div class="user-location" style="top: 50%; left: 50%;">
          <div class="pulse"></div>
          <div class="dot"></div>
        </div>

        <!-- Map Controls -->
        <div class="map-controls">
          <button class="control-btn"><PhCrosshair :size="20" /></button>
          <div class="zoom-controls">
            <button class="zoom-btn"><PhPlus :size="20" /></button>
            <div class="divider"></div>
            <button class="zoom-btn"><PhMinus :size="20" /></button>
          </div>
        </div>
      </div>
    </div>

    <div class="bottom-sheet">
      <div class="sheet-handle"></div>
      <h3 class="sheet-title">Nearby Parking</h3>
      
      <div class="locations-scroll">
        <div 
          v-for="loc in nearbyLocations" 
          :key="loc.id" 
          class="location-card bg-card radius-lg"
          @click="openDetails(loc.id)"
        >
          <div class="loc-header">
            <h4>{{ loc.name }}</h4>
            <div class="price">
              <span class="amount">{{ loc.price }}</span>
              <span class="unit">/hour</span>
            </div>
          </div>
          
          <div class="loc-info">
            <span class="distance"><PhCrosshair :size="14" /> {{ loc.distance }}</span>
            <span class="spots" :class="{ 'text-cyan': loc.isAvailable }">
              <span class="dot" :class="{ green: loc.isAvailable, red: !loc.isAvailable }"></span>
              {{ loc.spots }} spots
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.map-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  background-color: #1e2638; /* Slightly lighter base for map contrast */
}

.map-header {
  padding: var(--spacing-4);
  background-color: var(--color-bg-base);
  z-index: 10;
  box-shadow: var(--shadow-md);
}

.top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-4);
}

.brand {
  font-size: 1.25rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.profile-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  color: var(--color-accent-cyan);
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-bar {
  display: flex;
  align-items: center;
  background-color: var(--color-bg-card);
  border-radius: var(--radius-md);
  padding: 0.5rem 1rem;
  margin-bottom: var(--spacing-4);
  border: 1px solid var(--color-border);
}

.search-icon {
  color: var(--color-text-secondary);
  margin-right: 0.5rem;
}

.search-bar input {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--color-text-primary);
  outline: none;
}

.filter-btn {
  background: transparent;
  border: none;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.filter-chips {
  display: flex;
  gap: var(--spacing-2);
  overflow-x: auto;
  scrollbar-width: none;
  padding-bottom: 0.25rem;
}
.filter-chips::-webkit-scrollbar { display: none; }

.chip {
  padding: 0.4rem 1rem;
  border-radius: var(--radius-full);
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  font-size: 0.8rem;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.chip.active {
  background-color: var(--color-accent-cyan-transparent);
  border-color: var(--color-accent-cyan);
  color: var(--color-accent-cyan);
}

.map-view {
  flex: 1;
  position: relative;
  background-color: #f0f4f8; /* Very light color like in the mockup map */
  overflow: hidden;
}

.mock-map {
  width: 100%;
  height: 100%;
  position: relative;
  background-color: #e2e8f0;
}

.road {
  position: absolute;
  background-color: #ffffff;
}
.road.horizontal { width: 100%; height: 20px; }
.road.vertical { width: 20px; height: 100%; }

.block {
  position: absolute;
  background-color: #d1d5db;
  border-radius: 4px;
}

.pin {
  position: absolute;
  font-size: 24px;
  transform: translate(-50%, -100%);
  filter: drop-shadow(0 4px 4px rgba(0,0,0,0.2));
  cursor: pointer;
  transition: transform 0.2s;
  z-index: 5;
}

.pin:hover {
  transform: translate(-50%, -110%) scale(1.1);
}

.pin.green { color: #22c55e; }
.pin.yellow { color: #eab308; }
.pin.red { color: #ef4444; }
.pin.teal { color: #00d4ff; font-size: 32px; z-index: 6; }

.user-location {
  position: absolute;
  transform: translate(-50%, -50%);
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-location .dot {
  width: 12px;
  height: 12px;
  background-color: #3b82f6;
  border: 2px solid white;
  border-radius: 50%;
  z-index: 2;
}

.user-location .pulse {
  position: absolute;
  width: 100%;
  height: 100%;
  background-color: rgba(59, 130, 246, 0.4);
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(3); opacity: 0; }
}

.map-controls {
  position: absolute;
  right: 16px;
  bottom: 30px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.control-btn, .zoom-controls {
  background-color: var(--color-bg-base);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: var(--shadow-md);
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.control-btn {
  width: 40px;
  height: 40px;
}

.zoom-controls {
  flex-direction: column;
  overflow: hidden;
}

.zoom-btn {
  width: 40px;
  height: 40px;
  background: transparent;
  border: none;
  color: var(--color-text-primary);
}

.zoom-controls .divider {
  width: 100%;
  height: 1px;
  background-color: var(--color-border);
}

.bottom-sheet {
  background-color: var(--color-bg-base);
  border-top-left-radius: var(--radius-xl);
  border-top-right-radius: var(--radius-xl);
  padding: var(--spacing-3) var(--spacing-4) var(--spacing-6);
  position: relative;
  box-shadow: 0 -4px 20px rgba(0,0,0,0.2);
}

.sheet-handle {
  width: 40px;
  height: 4px;
  background-color: var(--color-border);
  border-radius: 2px;
  margin: 0 auto var(--spacing-4);
}

.sheet-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: var(--spacing-4);
}

.locations-scroll {
  display: flex;
  gap: var(--spacing-4);
  overflow-x: auto;
  scrollbar-width: none;
  padding-bottom: var(--spacing-2);
}
.locations-scroll::-webkit-scrollbar { display: none; }

.location-card {
  min-width: 240px;
  padding: var(--spacing-4);
  border: 1px solid var(--color-border);
  cursor: pointer;
  transition: transform 0.2s ease;
}

.location-card:hover {
  transform: translateY(-2px);
  border-color: var(--color-accent-cyan);
}

.loc-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--spacing-3);
}

.loc-header h4 {
  font-size: 1rem;
  font-weight: 600;
  width: 60%;
}

.price {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.amount {
  color: var(--color-accent-cyan);
  font-weight: 700;
  font-size: 1.1rem;
}

.unit {
  font-size: 0.7rem;
  color: var(--color-text-secondary);
}

.loc-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  color: var(--color-text-secondary);
}

.distance {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.spots {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.dot.green { background-color: var(--color-status-free); }
.dot.red { background-color: var(--color-status-occupied); }
</style>
