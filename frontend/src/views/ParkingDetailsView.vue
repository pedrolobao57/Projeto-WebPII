<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { PhArrowLeft, PhMapPin, PhLightning, PhShieldCheck, PhHouseLine, PhClock, PhWheelchair, PhMotorcycle, PhInfo, PhWarning } from '@phosphor-icons/vue'
import { getParkDetails, getParkSpots } from '../api/parks'
import { reportSensorError } from '../api/sensors'

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

// Report sensor state
const showReportModal = ref(false)
const selectedSpotId = ref('')
const reportDescription = ref('')
const reporting = ref(false)
const reportErrorMsg = ref('')
const reportSuccessMsg = ref('')

const allSpots = computed(() => {
  const list = []
  levels.value.forEach(level => {
    level.spots.forEach(spot => {
      list.push({
        id: spot.id,
        name: `${level.name} - Vaga ${spot.name}`
      })
    })
  })
  return list
})

const openReportModal = () => {
  showReportModal.value = true
  selectedSpotId.value = ''
  reportDescription.value = ''
  reportErrorMsg.value = ''
  reportSuccessMsg.value = ''
}

const closeReportModal = () => {
  showReportModal.value = false
}

const submitReport = async () => {
  if (!selectedSpotId.value) {
    reportErrorMsg.value = 'Por favor, selecione uma vaga.'
    return
  }
  if (!reportDescription.value.trim()) {
    reportErrorMsg.value = 'Por favor, descreva o problema.'
    return
  }

  reporting.value = true
  reportErrorMsg.value = ''
  reportSuccessMsg.value = ''

  try {
    await reportSensorError({
      id_vaga: Number(selectedSpotId.value),
      descricao_problema: reportDescription.value
    })
    reportSuccessMsg.value = 'Problema de sensor reportado com sucesso!'
    selectedSpotId.value = ''
    reportDescription.value = ''
    setTimeout(() => {
      closeReportModal()
    }, 2000)
  } catch (err) {
    reportErrorMsg.value = err.message || 'Erro ao submeter o reporte.'
  } finally {
    reporting.value = false
  }
}

onMounted(async () => {
  try {
    const details = await getParkDetails(parkId)
    parkDetails.value = details
    
    const spotsData = await getParkSpots(parkId)
    levels.value = spotsData
  } catch (err) {
    console.error('Erro ao carregar detalhes do parque:', err)
  }
})

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
        <button class="back-btn" @click="openReportModal" title="Report Sensor Issue" style="color: var(--color-status-occupied);">
          <PhWarning :size="24" />
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

    <!-- Report Issue Modal -->
    <transition name="fade">
      <div v-if="showReportModal" class="modal-overlay" @click.self="closeReportModal">
        <div class="modal-content bg-card radius-lg border-primary">
          <div class="modal-header">
            <h3>Report Sensor Issue</h3>
            <button class="close-btn" @click="closeReportModal">&times;</button>
          </div>
          
          <div class="modal-body">
            <p class="description-text">
              If you notice a physical spot state doesn't match the display, or suspect a sensor error, report it below.
            </p>
            
            <div class="form-group">
              <label for="spot-select">Select Spot / Space</label>
              <select id="spot-select" v-model="selectedSpotId" class="form-control bg-base border-primary text-primary">
                <option value="" disabled>-- Choose a Spot --</option>
                <option v-for="spot in allSpots" :key="spot.id" :value="spot.id">
                  {{ spot.name }}
                </option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="issue-desc">Describe the Problem</label>
              <textarea 
                id="issue-desc" 
                v-model="reportDescription" 
                rows="4" 
                class="form-control bg-base border-primary text-primary" 
                placeholder="E.g., Spot is empty but marked red, or sensor light is blinking red..."
              ></textarea>
            </div>

            <div v-if="reportErrorMsg" class="alert-msg error-msg">
              {{ reportErrorMsg }}
            </div>
            <div v-if="reportSuccessMsg" class="alert-msg success-msg">
              {{ reportSuccessMsg }}
            </div>
          </div>
          
          <div class="modal-footer">
            <button class="btn-cancel" @click="closeReportModal" :disabled="reporting">Cancel</button>
            <button class="btn-submit" @click="submitReport" :disabled="reporting">
              {{ reporting ? 'Sending...' : 'Submit Report' }}
            </button>
          </div>
        </div>
      </div>
    </transition>
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

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: var(--spacing-4);
}

.modal-content {
  width: 100%;
  max-width: 480px;
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

.modal-header {
  padding: var(--spacing-4);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  font-size: 1.2rem;
  font-weight: 700;
  margin: 0;
  color: var(--color-text-primary);
}

.close-btn {
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  font-size: 1.5rem;
  cursor: pointer;
  line-height: 1;
}

.close-btn:hover {
  color: var(--color-text-primary);
}

.modal-body {
  padding: var(--spacing-4);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.description-text {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  line-height: 1.4;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.form-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.form-control {
  padding: var(--spacing-3);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background-color: var(--color-bg-base);
  color: var(--color-text-primary);
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s ease;
}

.form-control:focus {
  border-color: var(--color-accent-cyan);
}

textarea.form-control {
  resize: vertical;
}

.alert-msg {
  padding: var(--spacing-3);
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  font-weight: 500;
}

.error-msg {
  background-color: rgba(239, 68, 68, 0.15);
  color: var(--color-status-occupied);
  border: 1px solid var(--color-status-occupied);
}

.success-msg {
  background-color: rgba(34, 197, 94, 0.15);
  color: var(--color-status-free);
  border: 1px solid var(--color-status-free);
}

.modal-footer {
  padding: var(--spacing-4);
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-3);
}

.btn-cancel {
  padding: 0.6rem 1.2rem;
  background-color: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-cancel:hover {
  background-color: var(--color-bg-card-lighter);
  color: var(--color-text-primary);
}

.btn-submit {
  padding: 0.6rem 1.2rem;
  background-color: var(--color-accent-cyan);
  color: var(--color-bg-base);
  border: none;
  border-radius: var(--radius-md);
  font-weight: 700;
  cursor: pointer;
  transition: filter 0.2s ease;
}

.btn-submit:hover {
  filter: brightness(1.1);
}

.btn-submit:disabled, .btn-cancel:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Fade animation */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
