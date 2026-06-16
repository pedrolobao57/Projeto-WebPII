<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { 
  PhArrowLeft, 
  PhLightning, 
  PhShieldCheck, 
  PhHouseLine, 
  PhWheelchair,
  PhCalendarBlank,
  PhClock,
  PhWarning,
  PhMotorcycle,
  PhInfo
} from '@phosphor-icons/vue'
import { getParkDetails } from '../api/parks'

const router = useRouter()
const route = useRoute()

const spotId = route.params.spotId || '1'
const spotNumber = computed(() => route.query.spotNumber || 'A-02')
const parkName = computed(() => route.query.parkName || 'Downtown Plaza')
const hourlyRate = computed(() => Number(route.query.price) || 8)

// Date Helpers
const getLocalDateString = (d) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const todayDate = new Date()
const todayStr = computed(() => getLocalDateString(todayDate))
const maxDate = new Date(todayDate.getTime() + 30 * 24 * 60 * 60 * 1000)
const maxDateStr = computed(() => getLocalDateString(maxDate))

// Min start time (rounded to next 30 min)
const getMinStartTime = () => {
  const now = new Date()
  let minutes = now.getMinutes()
  let hours = now.getHours()
  
  if (minutes === 0) {
    // aligned
  } else if (minutes <= 30) {
    minutes = 30
  } else {
    minutes = 0
    hours = (hours + 1) % 24
  }
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

const minStartTimeForToday = computed(() => getMinStartTime())

// Initialize defaults to avoid immediate validation errors on page load
const defaultStart = getMinStartTime()
const [defH, defM] = defaultStart.split(':').map(Number)
const defEndH = (defH + 1) % 24
const defaultEnd = `${String(defEndH).padStart(2, '0')}:${String(defM).padStart(2, '0')}`

const date = ref(todayStr.value)
const startTime = ref(defaultStart)
const endTime = ref(defaultEnd)

const serviceFee = 1.5

// Dynamic duration calculation
const duration = computed(() => {
  if (!startTime.value || !endTime.value) return 0
  const [startH, startM] = startTime.value.split(':').map(Number)
  const [endH, endM] = endTime.value.split(':').map(Number)
  
  const diffMin = (endH * 60 + endM) - (startH * 60 + startM)
  return Number((diffMin / 60).toFixed(1))
})

const total = computed(() => {
  const d = duration.value > 0 ? duration.value : 0
  return (hourlyRate.value * d) + serviceFee
})

const parkAmenities = ref([])

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

onMounted(async () => {
  try {
    const parkId = route.query.parkId || '1'
    const details = await getParkDetails(parkId)
    parkAmenities.value = details.amenities || []
  } catch (err) {
    console.error('Erro ao buscar amenities do parque:', err)
  }
})

// Validators
const isDateValid = computed(() => {
  if (!date.value) return false
  return date.value >= todayStr.value && date.value <= maxDateStr.value
})

const isStartTimeValid = computed(() => {
  if (!startTime.value) return false
  if (date.value === todayStr.value) {
    return startTime.value >= minStartTimeForToday.value
  }
  return true
})

const isEndTimeValid = computed(() => {
  if (!startTime.value || !endTime.value) return false
  return endTime.value > startTime.value
})

const isDurationValid = computed(() => {
  const d = duration.value
  return d >= 0.5 && d <= 24
})

const isFormValid = computed(() => {
  return isDateValid.value && isStartTimeValid.value && isEndTimeValid.value && isDurationValid.value
})

const goBack = () => router.back()
const proceedToPayment = () => {
  if (!isFormValid.value) return
  localStorage.setItem('pending_reservation', JSON.stringify({
    spotId: spotId,
    parkId: route.query.parkId,
    spotNumber: spotNumber.value,
    parkName: parkName.value,
    date: date.value,
    startTime: startTime.value,
    endTime: endTime.value,
    duration: duration.value > 0 ? duration.value : 0,
    hourlyRate: hourlyRate.value,
    total: total.value
  }))
  router.push('/payment')
}
</script>

<template>
  <div class="page-container">
    <header class="header justify-between">
      <button class="back-btn" @click="goBack">
        <PhArrowLeft :size="24" />
      </button>
      <button class="back-btn" @click="router.push('/dashboard')" title="Home">
        <PhHouseLine :size="24" />
      </button>
    </header>

    <main class="content">
      <div class="spot-header">
        <p class="subtitle">Parking Spot</p>
        <h1>{{ spotNumber }}</h1>
        <p class="location-details">{{ parkName }}</p>
        <div class="status-badge">
          <span class="dot green"></span>
          <span class="text-free">Available Now</span>
        </div>
      </div>

      <div class="section">
        <h3 class="section-title">Amenities</h3>
        <div class="amenities-grid">
          <div v-for="amenity in parkAmenities" :key="amenity" class="amenity-badge bg-card">
            <component :is="amenityIcon(amenity)" :size="18" class="text-cyan" />
            <span>{{ amenity }}</span>
          </div>
        </div>
      </div>

      <div class="section">
        <h3 class="section-title">Select Time</h3>
        
        <div class="time-form">
          <div class="form-group">
            <label class="form-label">Date</label>
            <div class="input-wrapper">
              <PhCalendarBlank class="input-icon" :size="20" />
              <input 
                type="date" 
                class="input-field with-icon" 
                v-model="date" 
                :min="todayStr" 
                :max="maxDateStr"
                :class="{ invalid: date && !isDateValid, valid: date && isDateValid }" 
              />
            </div>
            <div v-if="date && !isDateValid" class="field-error-msg animate-fade-in">
              <PhWarning :size="16" /> A data deve ser entre hoje e os próximos 30 dias.
            </div>
          </div>

          <div class="row">
            <div class="form-group half">
              <label class="form-label">Start Time</label>
              <div class="input-wrapper">
                <PhClock class="input-icon" :size="20" />
                <input 
                  type="time" 
                  class="input-field with-icon" 
                  v-model="startTime" 
                  :class="{ invalid: startTime && !isStartTimeValid, valid: startTime && isStartTimeValid }"
                />
              </div>
              <div v-if="startTime && !isStartTimeValid" class="field-error-msg animate-fade-in">
                <PhWarning :size="16" /> A hora de início deve ser posterior à hora atual.
              </div>
            </div>
            
            <div class="form-group half">
              <label class="form-label">End Time</label>
              <div class="input-wrapper">
                <PhClock class="input-icon" :size="20" />
                <input 
                  type="time" 
                  class="input-field with-icon" 
                  v-model="endTime" 
                  :class="{ invalid: endTime && (!isEndTimeValid || !isDurationValid), valid: endTime && isEndTimeValid && isDurationValid }"
                />
              </div>
              <div v-if="endTime && !isEndTimeValid" class="field-error-msg animate-fade-in">
                <PhWarning :size="16" /> A hora de fim deve ser posterior à hora de início.
              </div>
              <div v-else-if="endTime && isEndTimeValid && !isDurationValid" class="field-error-msg animate-fade-in">
                <PhWarning :size="16" />
                <span v-if="duration < 0.5">Duração mínima de 30 minutos.</span>
                <span v-else-if="duration > 24">Duração máxima de 24 horas.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="section price-breakdown">
        <h3 class="section-title">Price Breakdown</h3>
        
        <div class="breakdown-row">
          <span class="text-secondary">Hourly rate × {{ duration }} hours</span>
          <span>€{{ hourlyRate }} × {{ duration }}</span>
        </div>
        
        <div class="breakdown-row">
          <span class="text-secondary">Service fee</span>
          <span>€{{ serviceFee.toFixed(2) }}</span>
        </div>
        
        <div class="divider"></div>
        
        <div class="breakdown-row total-row">
          <span>Total</span>
          <span class="total-price">€{{ total.toFixed(2) }}</span>
        </div>
      </div>
    </main>

    <div class="bottom-action">
      <button class="btn-primary w-full" :disabled="!isFormValid" @click="proceedToPayment">
        Reserve Now
      </button>
    </div>
  </div>
</template>

<style scoped>
.content {
  padding: 0 var(--spacing-4) 100px; /* Padding bottom for sticky action */
}

.spot-header {
  margin-bottom: var(--spacing-6);
}

.subtitle {
  color: var(--color-text-secondary);
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

h1 {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.location-details {
  color: var(--color-text-secondary);
  font-size: 0.95rem;
  margin-bottom: var(--spacing-3);
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.dot.green { background-color: var(--color-status-free); }

.text-free {
  color: var(--color-status-free);
  font-weight: 500;
  font-size: 0.9rem;
}

.section {
  margin-bottom: var(--spacing-8);
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
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
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  font-size: 0.85rem;
}

.time-form {
  background-color: var(--color-bg-card);
  padding: var(--spacing-4);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
}

.row {
  display: flex;
  gap: var(--spacing-4);
}

.half {
  flex: 1;
}

.input-wrapper {
  position: relative;
}

.input-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-secondary);
  pointer-events: none;
}

.with-icon {
  padding-left: 2.75rem;
  background-color: var(--color-bg-base);
}

input[type="date"]::-webkit-calendar-picker-indicator,
input[type="time"]::-webkit-calendar-picker-indicator {
  filter: invert(1);
  opacity: 0.5;
  cursor: pointer;
}

.price-breakdown {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.breakdown-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.95rem;
}

.divider {
  height: 1px;
  background-color: var(--color-border);
  margin: var(--spacing-2) 0;
}

.total-row {
  font-weight: 600;
  font-size: 1.1rem;
}

.total-price {
  color: var(--color-accent-cyan);
  font-size: 1.25rem;
  font-weight: 700;
}

.bottom-action {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-width: 600px;
  margin: 0 auto;
  padding: var(--spacing-4);
  background: linear-gradient(to top, var(--color-bg-base) 80%, transparent);
  z-index: 10;
}

.w-full {
  width: 100%;
}
input.invalid {
  border-color: #ff4d4d !important;
}
input.valid {
  border-color: #4ade80 !important;
}
.field-error-msg {
  color: #ff4d4d;
  font-size: 0.75rem;
  margin-top: 0.25rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
