<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { 
  PhArrowLeft,
  PhCreditCard,
  PhDeviceMobile,
  PhPlus,
  PhTag,
  PhHouseLine
} from '@phosphor-icons/vue'
import { createReservation } from '../api/reservations'
import { payReservation, getPaymentMethods } from '../api/payments'

const router = useRouter()

const pendingRes = ref(JSON.parse(localStorage.getItem('pending_reservation') || '{}'))

const paymentMethods = ref([
  { id: 'visa', name: 'Visa', details: '**** 4242', icon: PhCreditCard },
  { id: 'applepay', name: 'Apple Pay', details: '', icon: PhDeviceMobile },
  { id: 'mbway', name: 'MB Way', details: '', icon: PhDeviceMobile }
])

const selectedMethod = ref('visa')
const promoCode = ref('')
const isPromoApplied = ref(false)
const loading = ref(false)
const errorMessage = ref('')

const finalTotal = computed(() => {
  return isPromoApplied.value ? 0.67 : (pendingRes.value.total || 0)
})

const applyPromo = () => {
  if (promoCode.value === 'Codigo VSKI') {
    isPromoApplied.value = true
    errorMessage.value = ''
  } else {
    isPromoApplied.value = false
    errorMessage.value = 'Promo code inválido.'
  }
}

onMounted(async () => {
  try {
    const methods = await getPaymentMethods()
    if (methods && methods.length > 0) {
      paymentMethods.value = methods.map(m => ({
        id: m.id,
        name: m.name,
        details: m.details,
        icon: m.id === 'visa' ? PhCreditCard : PhDeviceMobile
      }))
    }
  } catch (err) {
    console.error('Erro ao buscar metodos de pagamento:', err)
  }
})

const goBack = () => router.back()
const handlePayment = async () => {
  if (!pendingRes.value.spotId) {
    errorMessage.value = 'Sem reserva pendente encontrada.'
    return
  }
  
  loading.value = true
  errorMessage.value = ''
  
  try {
    const dateStr = pendingRes.value.date
    const startStr = `${dateStr}T${pendingRes.value.startTime}:00`
    const endStr = `${dateStr}T${pendingRes.value.endTime}:00`
    
    // 1. Criar a reserva
    const resResponse = await createReservation({
      id_vaga: Number(pendingRes.value.spotId),
      data_inicio: startStr,
      data_fim: endStr
    })
    
    const reservationId = resResponse.novaReserva.id_reserva
    
    // 2. Criar o pagamento
    await payReservation(reservationId, {
      method: selectedMethod.value,
      amount: finalTotal.value,
      promoCode: isPromoApplied.value ? promoCode.value : null
    })
    
    // Limpar localStorage
    localStorage.removeItem('pending_reservation')
    
    // Redirecionar para navegacao com id da reserva
    router.push(`/navigation?reservationId=${reservationId}`)
  } catch (err) {
    console.error(err)
    errorMessage.value = err.message || err.error || 'Erro ao processar pagamento.'
  } finally {
    loading.value = false
  }
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
      <div class="title-section">
        <h1>Payment</h1>
        <p class="subtitle">Complete your reservation</p>
      </div>

      <div v-if="errorMessage" class="error-banner">{{ errorMessage }}</div>

      <div class="section">
        <h3 class="section-title">Order Summary</h3>
        <div class="summary-card bg-card radius-lg">
          <div class="spot-info">
            <h4>Spot {{ pendingRes.spotNumber }}</h4>
            <p>{{ pendingRes.parkName }}</p>
          </div>
          
          <div class="reservation-details">
            <div class="detail-row">
              <span class="label">Date</span>
              <span class="value">{{ pendingRes.date }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Time</span>
              <span class="value">{{ pendingRes.startTime }} - {{ pendingRes.endTime }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Duration</span>
              <span class="value">{{ pendingRes.duration }} hours</span>
            </div>
          </div>
          
          <div class="divider"></div>
          
          <div class="price-details">
            <div class="detail-row">
              <span class="label">Parking fee</span>
              <span class="value">${{ ((pendingRes.hourlyRate || 8) * (pendingRes.duration || 0)).toFixed(2) }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Service fee</span>
              <span class="value">$1.50</span>
            </div>
          </div>
          
          <div class="total-row">
            <span>Total</span>
            <span class="total-amount text-cyan">${{ finalTotal.toFixed(2) }}</span>
          </div>
        </div>
      </div>

      <div class="section">
        <h3 class="section-title">Payment Method</h3>
        <div class="payment-methods">
          <div 
            v-for="method in paymentMethods" 
            :key="method.id"
            class="payment-option bg-card radius-md"
            :class="{ selected: selectedMethod === method.id }"
            @click="selectedMethod = method.id"
          >
            <div class="option-left">
              <component :is="method.icon" :size="24" class="method-icon text-secondary" />
              <div class="method-info">
                <span class="method-name">{{ method.name }}</span>
                <span v-if="method.details" class="method-details">{{ method.details }}</span>
              </div>
            </div>
            <div class="radio-circle" :class="{ active: selectedMethod === method.id }">
              <div v-if="selectedMethod === method.id" class="inner-circle"></div>
            </div>
          </div>

          <button class="add-card-btn">
            <PhPlus :size="20" class="text-cyan" />
            <span>Add New Card</span>
          </button>
        </div>
      </div>

      <div class="section">
        <h3 class="section-title">Promo Code</h3>
        <div class="promo-input-wrapper">
          <PhTag class="promo-icon" :size="20" />
          <input type="text" v-model="promoCode" placeholder="Enter code" class="promo-input" />
          <button type="button" class="apply-btn" :disabled="!promoCode" @click="applyPromo">Apply</button>
        </div>
        <div v-if="isPromoApplied" style="color: #4ade80; font-size: 0.85rem; margin-top: 0.5rem; font-weight: 500;">
          Promo code "Codigo VSKI" applied successfully! Price set to $0.67.
        </div>
      </div>

      <p class="cancellation-policy">
        Free cancellation up to 1 hour before your reservation
      </p>
    </main>

    <div class="bottom-action">
      <button class="btn-primary w-full" :disabled="loading" @click="handlePayment">
        {{ loading ? 'Processing Payment...' : `Confirm & Pay $${finalTotal.toFixed(2)}` }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.content {
  padding: 0 var(--spacing-4) 120px;
}

.title-section {
  margin-bottom: var(--spacing-6);
}

h1 {
  font-size: 1.75rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.subtitle {
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.section {
  margin-bottom: var(--spacing-6);
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: var(--spacing-3);
}

.summary-card {
  padding: var(--spacing-4);
  border: 1px solid var(--color-border);
}

.spot-info {
  margin-bottom: var(--spacing-4);
}

.spot-info h4 {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.spot-info p {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
}

.detail-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.85rem;
}

.detail-row .label {
  color: var(--color-text-secondary);
}

.divider {
  height: 1px;
  background-color: var(--color-border);
  margin: var(--spacing-3) 0;
}

.total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: var(--spacing-4);
  font-weight: 600;
  font-size: 1.1rem;
}

.total-amount {
  font-size: 1.5rem;
  font-weight: 700;
}

.payment-methods {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.payment-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border: 1px solid var(--color-border);
  cursor: pointer;
  transition: all 0.2s ease;
}

.payment-option.selected {
  border-color: var(--color-accent-cyan);
  background-color: var(--color-bg-card-hover);
}

.option-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.method-info {
  display: flex;
  flex-direction: column;
}

.method-name {
  font-weight: 500;
  font-size: 0.95rem;
}

.method-details {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.radio-circle {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
}

.radio-circle.active {
  border-color: var(--color-accent-cyan);
}

.inner-circle {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: var(--color-accent-cyan);
}

.add-card-btn {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: transparent;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-primary);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.add-card-btn:hover {
  border-color: var(--color-accent-cyan);
  background-color: rgba(0, 212, 255, 0.05);
}

.promo-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.promo-icon {
  position: absolute;
  left: 1rem;
  color: var(--color-text-secondary);
  pointer-events: none;
}

.promo-input {
  width: 100%;
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1rem 5rem 1rem 3rem; /* Space for icon and button */
  color: var(--color-text-primary);
  font-size: 0.95rem;
}

.promo-input:focus {
  outline: none;
  border-color: var(--color-accent-cyan);
}

.apply-btn {
  position: absolute;
  right: 0.5rem;
  background-color: var(--color-bg-card-lighter);
  color: var(--color-accent-cyan);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.4rem 0.8rem;
  font-size: 0.8rem;
  font-weight: 600;
}

.apply-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-banner {
  background-color: rgba(255, 77, 77, 0.1);
  color: #ff4d4d;
  border: 1px solid rgba(255, 77, 77, 0.2);
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-4);
  font-size: 0.9rem;
  text-align: center;
}

.cancellation-policy {
  text-align: center;
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  margin-top: var(--spacing-4);
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
</style>
