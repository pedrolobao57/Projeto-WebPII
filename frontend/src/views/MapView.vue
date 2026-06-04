<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { PhMagnifyingGlass, PhMapPin, PhList, PhCrosshair, PhPlus, PhMinus, PhHouseLine, PhUser } from '@phosphor-icons/vue'
import { getParks } from '../api/parks'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const router = useRouter()

const filters = ['Price', 'Distance', 'EV Charging', 'Covered']
const activeFilters = ref([])
const searchQuery = ref('')
const nearbyLocations = ref([])

const toggleFilter = (filter) => {
  if (activeFilters.value.includes(filter)) {
    activeFilters.value = activeFilters.value.filter(f => f !== filter)
  } else {
    activeFilters.value.push(filter)
  }
}

// User location coords (Porto, Portugal center)
const userCoords = ref({ lat: 41.1579, lng: -8.6291 })
const mapInstance = ref(null)
const markers = ref([])

// Static coordinates for seeded parks to display them in Porto
const PARK_COORDS = {
  1: { lat: 41.156232, lng: -8.627649}, // Parque Pintos
  2: { lat: 41.1600696, lng: -8.6319006 }, // Parque estacionamento SABA - Casa da Música
  3: { lat: 41.1616038, lng: -8.6321563 }  // Parking 5 Outubro
}

const getCoordsForPark = (park, idx) => {
  const predefined = PARK_COORDS[park.id]
  if (predefined) return predefined
  
  // Generate deterministic offsets around Porto center
  const angle = (idx * 2 * Math.PI) / 5
  const r = 0.006 + (idx * 0.002)
  return {
    lat: userCoords.value.lat + r * Math.sin(angle),
    lng: userCoords.value.lng + r * Math.cos(angle)
  }
}

// Custom DivIcon for user position
const userIcon = L.divIcon({
  className: 'custom-user-marker',
  html: `
    <div class="user-marker-container">
      <div class="pulse"></div>
      <div class="dot"></div>
    </div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
})

// Custom DivIcon for parking pins showing the hourly rate
const createParkIcon = (loc) => {
  const colorClass = loc.isAvailable ? 'green' : 'red'
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div class="custom-leaflet-pin ${colorClass}">
        <div class="pin-ring"></div>
        <div class="pin-dot"></div>
        <span class="pin-price">${loc.price}</span>
      </div>
    `,
    iconSize: [40, 45],
    iconAnchor: [20, 45],
    popupAnchor: [0, -45]
  })
}

// Computes filtered and sorted locations
const filteredLocations = computed(() => {
  let list = nearbyLocations.value

  // Filter by search query
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(l => 
      l.name.toLowerCase().includes(q) || 
      (l.location && l.location.toLowerCase().includes(q))
    )
  }

  // Apply filters
  activeFilters.value.forEach(filter => {
    if (filter === 'Price') {
      // Sort by price ascending
      list = [...list].sort((a, b) => {
        const valA = parseFloat(a.price.replace(/[^0-9.]/g, ''))
        const valB = parseFloat(b.price.replace(/[^0-9.]/g, ''))
        return valA - valB
      })
    } else if (filter === 'Distance') {
      // Sort by distance ascending
      list = [...list].sort((a, b) => {
        const valA = parseFloat(a.distance.replace(/[^0-9.]/g, ''))
        const valB = parseFloat(b.distance.replace(/[^0-9.]/g, ''))
        return valA - valB
      })
    } else if (filter === 'EV Charging') {
      // Show only parks that have electric charging spots (simulate by park id % 2 === 1)
      list = list.filter(l => l.id % 2 === 1)
    } else if (filter === 'Covered') {
      // Show only covered parks (simulate by park id % 2 === 0)
      list = list.filter(l => l.id % 2 === 0)
    }
  })

  return list
})

const updateMapMarkers = () => {
  if (!mapInstance.value) return

  // Remove existing markers
  markers.value.forEach(m => m.remove())
  markers.value = []

  // Add new markers
  filteredLocations.value.forEach((loc, idx) => {
    const coords = getCoordsForPark(loc, idx)
    const marker = L.marker([coords.lat, coords.lng], {
      icon: createParkIcon(loc)
    }).addTo(mapInstance.value)

    marker.bindPopup(`
      <div class="map-popup-card">
        <h3>${loc.name}</h3>
        <p class="popup-address">${loc.location || 'Porto, Portugal'}</p>
        <div class="popup-meta">
          <span class="popup-spots ${loc.isAvailable ? 'text-cyan' : 'text-danger'}">${loc.spots} spots</span>
          <span class="popup-price"><strong>${loc.price}</strong>/h</span>
        </div>
        <button class="popup-btn" onclick="window.navigateToPark(${loc.id})">View Details</button>
      </div>
    `, { closeButton: false, className: 'custom-leaflet-popup' })

    // Center map on marker on click
    marker.on('click', () => {
      mapInstance.value.setView([coords.lat, coords.lng], 15)
    })

    markers.value.push(marker)
  })
}

// Watch filtered list and update map markers automatically
watch(filteredLocations, () => {
  updateMapMarkers()
}, { deep: true })

const zoomIn = () => {
  if (mapInstance.value) mapInstance.value.zoomIn()
}

const zoomOut = () => {
  if (mapInstance.value) mapInstance.value.zoomOut()
}

const centerOnUser = () => {
  if (mapInstance.value) {
    mapInstance.value.setView([userCoords.value.lat, userCoords.value.lng], 14)
  }
}

onMounted(async () => {
  try {
    const data = await getParks()
    nearbyLocations.value = data
  } catch (err) {
    console.error('Erro ao carregar parques:', err)
  }

  // Bind routing navigation globally for popup actions
  window.navigateToPark = (id) => {
    router.push(`/parking/${id}`)
  }

  // Initialize Map
  mapInstance.value = L.map('map', {
    zoomControl: false,
    attributionControl: false
  }).setView([userCoords.value.lat, userCoords.value.lng], 14)

  // Load dark theme tiles
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19
  }).addTo(mapInstance.value)

  // User location marker
  L.marker([userCoords.value.lat, userCoords.value.lng], {
    icon: userIcon
  }).addTo(mapInstance.value)

  // Draw markers
  updateMapMarkers()
})

onUnmounted(() => {
  if (window.navigateToPark) {
    delete window.navigateToPark
  }
  if (mapInstance.value) {
    mapInstance.value.remove()
  }
})

const openDetails = (id) => {
  router.push(`/parking/${id}`)
}
</script>

<template>
  <div class="map-container">
    <div class="map-header">
      <div class="top-row">
        <h2 class="brand" @click="router.push('/dashboard')" style="cursor: pointer;">
          <PhMapPin :size="20" color="var(--color-accent-cyan)" weight="fill" />
          <span>ParkSmart</span>
        </h2>
        <div style="display: flex; gap: var(--spacing-2);">
          <button class="profile-btn" @click="router.push('/dashboard')" title="Home">
            <PhHouseLine :size="20" />
          </button>
          <button class="profile-btn" @click="router.push('/profile')" title="Profile">
            <PhUser :size="20" weight="fill" />
          </button>
        </div>
      </div>

      <div class="search-bar">
        <PhMagnifyingGlass :size="20" class="search-icon" />
        <input type="text" placeholder="Search for parking..." v-model="searchQuery" />
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
      <!-- Real Map UI -->
      <div id="map"></div>

      <!-- Map Controls -->
      <div class="map-controls">
        <button class="control-btn" @click="centerOnUser"><PhCrosshair :size="20" /></button>
        <div class="zoom-controls">
          <button class="zoom-btn" @click="zoomIn"><PhPlus :size="20" /></button>
          <div class="divider"></div>
          <button class="zoom-btn" @click="zoomOut"><PhMinus :size="20" /></button>
        </div>
      </div>
    </div>

    <div class="bottom-sheet">
      <h3 class="sheet-title">Nearby Parking</h3>
      
      <div class="locations-scroll">
        <div 
          v-for="loc in filteredLocations" 
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
  background-color: var(--color-bg-base);
}

.map-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1010;
  background-color: rgba(11, 17, 30, 0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--color-border);
  box-shadow: var(--shadow-lg);
  padding: var(--spacing-4);
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
  height: 80%;
  width: 100%;
  position: relative;
  z-index: 1;
}

#map {
  width: 100%;
  height: 100%;
  background-color: #000000;
}

/* Custom Leaflet Marker Styling */
.custom-leaflet-marker {
  background: transparent;
  border: none;
}
.custom-leaflet-pin {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}
.custom-leaflet-pin .pin-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid #ffffff;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  z-index: 2;
}
.custom-leaflet-pin.green .pin-dot {
  background-color: var(--color-status-free);
  box-shadow: 0 0 8px var(--color-status-free);
}
.custom-leaflet-pin.red .pin-dot {
  background-color: var(--color-status-occupied);
  box-shadow: 0 0 8px var(--color-status-occupied);
}

.custom-leaflet-pin .pin-ring {
  position: absolute;
  top: -4px;
  left: 10px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.3);
  animation: pulsePin 2s infinite;
  z-index: 1;
}
@keyframes pulsePin {
  0% { transform: scale(0.8); opacity: 1; }
  100% { transform: scale(2.2); opacity: 0; }
}

.custom-leaflet-pin .pin-price {
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
  font-size: 0.7rem;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 8px;
  margin-top: 3px;
  white-space: nowrap;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  transition: all 0.2s;
  z-index: 3;
}
.custom-leaflet-pin:hover .pin-price {
  background-color: var(--color-accent-cyan);
  color: var(--color-bg-base);
  border-color: var(--color-accent-cyan);
  transform: scale(1.1);
}

/* User marker styles */
.custom-user-marker {
  background: transparent;
  border: none;
}
.user-marker-container {
  width: 20px;
  height: 20px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.user-marker-container .dot {
  width: 10px;
  height: 10px;
  background-color: #3b82f6;
  border: 2px solid white;
  border-radius: 50%;
  z-index: 2;
  box-shadow: 0 0 8px #3b82f6;
}
.user-marker-container .pulse {
  position: absolute;
  width: 100%;
  height: 100%;
  background-color: rgba(59, 130, 246, 0.4);
  border-radius: 50%;
  animation: pulse 2s infinite;
  z-index: 1;
}

/* Custom Popup Styles */
.custom-leaflet-popup :deep(.leaflet-popup-content-wrapper) {
  background-color: var(--color-bg-card) !important;
  color: var(--color-text-primary) !important;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 4px;
  box-shadow: var(--shadow-xl);
}
.custom-leaflet-popup :deep(.leaflet-popup-tip) {
  background-color: var(--color-bg-card) !important;
  border-left: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
}
.custom-leaflet-popup :deep(.leaflet-popup-content) {
  margin: 8px 12px !important;
}
.map-popup-card {
  padding: 2px;
  width: 160px;
}
.map-popup-card h3 {
  font-size: 0.9rem;
  font-weight: 700;
  margin-bottom: 2px;
  color: var(--color-text-primary);
}
.map-popup-card .popup-address {
  font-size: 0.7rem;
  color: var(--color-text-secondary);
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.map-popup-card .popup-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.map-popup-card .popup-spots {
  font-size: 0.75rem;
  font-weight: 600;
}
.map-popup-card .popup-price {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}
.map-popup-card .popup-price strong {
  color: var(--color-accent-cyan);
  font-size: 0.85rem;
}
.map-popup-card .popup-btn {
  width: 100%;
  background-color: var(--color-accent-cyan);
  color: #000000;
  border: none;
  padding: 5px;
  font-size: 0.75rem;
  font-weight: 700;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: opacity 0.2s;
  text-align: center;
}
.map-popup-card .popup-btn:hover {
  opacity: 0.9;
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(2.5); opacity: 0; }
}

.map-controls {
  z-index: 1010;
  position: absolute;
  right: 16px;
  bottom: 16px;
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
  height: 20%;
  background-color: var(--color-bg-base);
  border-top: 1px solid var(--color-border);
  padding: var(--spacing-3) var(--spacing-4);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  z-index: 10;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
}

.sheet-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0;
  width: 100%;
  text-align: left;
}

.locations-scroll {
  display: flex;
  gap: var(--spacing-3);
  overflow-x: auto;
  scrollbar-width: none;
  flex: 1;
  align-items: center;
}
.locations-scroll::-webkit-scrollbar { display: none; }

.location-card {
  min-width: 220px;
  height: 85px;
  padding: var(--spacing-3);
  border: 1px solid var(--color-border);
  cursor: pointer;
  transition: transform 0.2s ease;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
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
  font-size: 0.9rem;
  font-weight: 600;
  width: 60%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
