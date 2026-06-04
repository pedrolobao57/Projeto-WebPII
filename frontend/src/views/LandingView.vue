<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { PhMapPin, PhCalendarCheck, PhShieldCheck, PhClock } from '@phosphor-icons/vue'
import { getParks } from '../api/parks'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const router = useRouter()

const getStarted = () => router.push('/signup')
const login = () => router.push('/login')

const mapInstance = ref(null)
const parksList = ref([])

const PARK_COORDS = {
  1: { lat: 41.156232, lng: -8.627649 }, // Parque Pintos
  2: { lat: 41.1600696, lng: -8.6319006 }, // Parque estacionamento SABA - Casa da Música
  3: { lat: 41.1616038, lng: -8.6321563 }  // Parking 5 Outubro
}

const userCoords = { lat: 41.1579, lng: -8.6291 } // Porto, Portugal center

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

onMounted(async () => {
  try {
    const data = await getParks()
    parksList.value = data
  } catch (err) {
    console.error('Error fetching parks for landing page:', err)
  }

  // Initialize Map
  mapInstance.value = L.map('landing-map', {
    zoomControl: false,
    attributionControl: false
  }).setView([userCoords.lat, userCoords.lng], 14)

  // Load dark theme tiles
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19
  }).addTo(mapInstance.value)

  // User location marker
  L.marker([userCoords.lat, userCoords.lng], {
    icon: userIcon
  }).addTo(mapInstance.value)

  // Define custom DivIcon for parking pin
  const createParkPinIcon = (loc) => {
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

  // Add markers
  parksList.value.forEach((park, idx) => {
    const coords = PARK_COORDS[park.id] || {
      lat: userCoords.lat + (idx * 0.003 - 0.003),
      lng: userCoords.lng + (idx * 0.003 - 0.003)
    }
    
    const marker = L.marker([coords.lat, coords.lng], {
      icon: createParkPinIcon(park)
    }).addTo(mapInstance.value)

    marker.bindPopup(`
      <div class="map-popup-card">
        <h3>${park.name}</h3>
        <p class="popup-address">${park.distance} away</p>
        <div class="popup-meta">
          <span class="popup-spots ${park.isAvailable ? 'text-cyan' : 'text-danger'}">${park.spots} spots</span>
          <span class="popup-price"><strong>${park.price}</strong>/h</span>
        </div>
        <button class="popup-btn" style="width: 100%; border-radius: 4px;" id="landing-btn-${park.id}">Book Spot</button>
      </div>
    `, { closeButton: false, className: 'custom-leaflet-popup' })

    // On popup open, bind the button click to sign up
    marker.on('popupopen', () => {
      const btn = document.getElementById(`landing-btn-${park.id}`)
      if (btn) {
        btn.addEventListener('click', () => {
          router.push('/signup')
        })
      }
    })
  })
})

onUnmounted(() => {
  if (mapInstance.value) {
    mapInstance.value.remove()
  }
})
</script>

<template>
  <div class="landing-container">
    <header class="top-nav">
      <div class="logo">
        <PhMapPin :size="24" color="var(--color-accent-cyan)" weight="fill" />
        <span>ParkSmart</span>
      </div>
    </header>

    <main>
      <section class="hero">
        <h1>Never Waste Time <br><span class="text-cyan">Looking for Parking</span></h1>
        <p class="subtitle">Find, reserve, and pay for parking spots in seconds. Smart parking made simple.</p>
        
        <div class="map-wrapper radius-lg">
          <div id="landing-map" class="landing-map-element"></div>
        </div>

        <div class="stats-row">
          <div class="stat-item">
            <h3>50K+</h3>
            <span>Active Users</span>
          </div>
          <div class="divider"></div>
          <div class="stat-item">
            <h3>200+</h3>
            <span>Parking Lots</span>
          </div>
          <div class="divider"></div>
          <div class="stat-item">
            <h3>4.9<span class="star">★</span></h3>
            <span>App Rating</span>
          </div>
        </div>

        <div class="action-buttons">
          <button class="btn-primary w-full" @click="getStarted">
            Get Started <span class="arrow">→</span>
          </button>
          <button class="btn-secondary w-full mt-4" @click="login">
            Log In
          </button>
        </div>
      </section>

      <section class="features">
        <h2 class="section-title">Why Choose ParkSmart?</h2>
        <p class="section-subtitle">Everything you need for hassle-free parking.</p>
        
        <div class="features-grid">
          <div class="feature-card bg-card radius-md">
            <div class="icon-wrapper">
              <PhMapPin :size="20" color="var(--color-accent-cyan)" weight="fill" />
            </div>
            <h4>Smart Parking Finder</h4>
            <p>Find available spots in real-time near your destination.</p>
          </div>

          <div class="feature-card bg-card radius-md">
            <div class="icon-wrapper">
              <PhCalendarCheck :size="20" color="var(--color-accent-cyan)" weight="fill" />
            </div>
            <h4>Instant Booking</h4>
            <p>Reserve your spot in seconds with one-tap booking.</p>
          </div>

          <div class="feature-card bg-card radius-md">
            <div class="icon-wrapper">
              <PhShieldCheck :size="20" color="var(--color-accent-cyan)" weight="fill" />
            </div>
            <h4>Secure & Safe</h4>
            <p>24/7 security monitoring and guaranteed spot protection.</p>
          </div>

          <div class="feature-card bg-card radius-md">
            <div class="icon-wrapper">
              <PhClock :size="20" color="var(--color-accent-cyan)" weight="fill" />
            </div>
            <h4>Save Time</h4>
            <p>No more circling around. Navigate directly to your spot.</p>
          </div>
        </div>
      </section>

      <section class="cta-section">
        <h2 class="section-title">Ready to Park Smarter?</h2>
        <p class="section-subtitle">Join thousands of drivers saving time every day.</p>
        
        <button class="btn-primary w-full" @click="getStarted">
          Start Free Trial
        </button>
        <p class="terms-text">No credit card required • Cancel anytime</p>
      </section>
    </main>
    
    <footer>
      <p>Available on iOS and Android</p>
      <p class="copyright">© 2026 ParkSmart. All rights reserved.</p>
    </footer>
  </div>
</template>

<style scoped>
.landing-container {
  max-width: 600px;
  margin: 0 auto;
  min-height: 100vh;
  padding: 0 var(--spacing-4) var(--spacing-8);
  display: flex;
  flex-direction: column;
}

.top-nav {
  padding: var(--spacing-6) 0;
  display: flex;
  justify-content: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.25rem;
  font-weight: 700;
}

.hero {
  text-align: center;
  margin-top: var(--spacing-4);
}

h1 {
  font-size: 2.5rem;
  line-height: 1.2;
  margin-bottom: var(--spacing-4);
  font-weight: 700;
}

.subtitle {
  color: var(--color-text-secondary);
  font-size: 1.05rem;
  margin-bottom: var(--spacing-8);
  padding: 0 var(--spacing-4);
}

.map-wrapper {
  height: 320px;
  margin: 0 auto var(--spacing-8);
  position: relative;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.05);
  overflow: hidden;
  background-color: var(--color-bg-card);
}

.landing-map-element {
  width: 100%;
  height: 100%;
  border-radius: var(--radius-lg);
  z-index: 1;
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
@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(2.5); opacity: 0; }
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

.stats-row {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-8);
}

.stat-item h3 {
  font-size: 1.5rem;
  color: var(--color-accent-cyan);
  margin-bottom: 0.25rem;
}

.stat-item span {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.star {
  font-size: 1rem;
  margin-left: 2px;
}

.divider {
  width: 1px;
  height: 40px;
  background-color: var(--color-border);
}

.action-buttons {
  margin-bottom: var(--spacing-12);
}

.w-full {
  width: 100%;
}

.arrow {
  margin-left: 0.5rem;
}

.features {
  margin-bottom: var(--spacing-12);
}

.section-title {
  text-align: center;
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.section-subtitle {
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  margin-bottom: var(--spacing-8);
}

.features-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-4);
}

.feature-card {
  padding: var(--spacing-4);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
}

.icon-wrapper {
  background-color: var(--color-accent-cyan-transparent);
  padding: 0.5rem;
  border-radius: 50%;
  margin-bottom: var(--spacing-4);
}

.feature-card h4 {
  font-size: 0.95rem;
  margin-bottom: 0.5rem;
}

.feature-card p {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  line-height: 1.4;
}

.cta-section {
  text-align: center;
  padding: var(--spacing-8) 0;
  background-color: var(--color-bg-card);
  border-radius: var(--radius-lg);
  margin-bottom: var(--spacing-8);
}

.terms-text {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  margin-top: var(--spacing-4);
}

footer {
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 0.8rem;
  margin-top: auto;
}

.copyright {
  margin-top: 0.25rem;
  opacity: 0.5;
}

@media (max-width: 480px) {
  .features-grid {
    grid-template-columns: 1fr;
  }
}
</style>

