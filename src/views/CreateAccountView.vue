<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { PhArrowLeft, PhUser, PhEnvelopeSimple, PhLockKey, PhPhone, PhCar, PhCheckSquare, PhSquare, PhPlus, PhTrash } from '@phosphor-icons/vue'
import { createUser, loginUser } from '../api/users'
import brands from '../api/brands'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const ALLOWED_BRANDS = brands
const { saveSession } = useAuth()

const form = ref({
  fullName: '',
  email: '',
  password: '',
  phone: '',
  vehicles: [
    { plate: '', brand: '', model: '', color: '' }
  ],
  agreeTerms: false
})

const errorMessage = ref('')

const goBack = () => {
  router.back()
}

const addVehicle = () => {
  form.value.vehicles.push({ plate: '', brand: '', model: '', color: '' })
}

const removeVehicle = (index) => {
  if (form.value.vehicles.length > 1) {
    form.value.vehicles.splice(index, 1)
  }
}

const isEmailValid = computed(() => form.value.email.includes('@'))
const isPasswordValid = computed(() => form.value.password.length >= 6)

const handleSignup = async () => {
  if (!isEmailValid.value || !isPasswordValid.value) return

  try {
    errorMessage.value = ''
    const payload = {
      name: form.value.fullName,
      email: form.value.email,
      password: form.value.password,
      phone: form.value.phone,
      vehicles: form.value.vehicles
    }

    // 1. Criar a conta
    await createUser(payload)

    // 2. Login automático após registo
    const response = await loginUser({ email: form.value.email, password: form.value.password })
    saveSession(response.token, response.user)

    router.push('/dashboard')
  } catch (err) {
    errorMessage.value = err.message || 'Erro ao criar conta'
  }
}

const login = () => {
  router.push('/login')
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
      <div class="title-section">
        <h1>Create Account</h1>
        <p class="subtitle">Sign up to start parking smarter.</p>
      </div>

      <div v-if="errorMessage" class="error-banner">{{ errorMessage }}</div>

      <form @submit.prevent="handleSignup" class="signup-form">
        <section class="form-section">
          <h3 class="section-title">Personal Information</h3>
          
          <div class="input-group">
            <PhUser class="input-icon" :size="20" />
            <input type="text" placeholder="Full Name" v-model="form.fullName" required />
          </div>

          <div class="input-group">
            <PhEnvelopeSimple class="input-icon" :size="20" />
            <input type="email" placeholder="Email Address" v-model="form.email" :class="{ invalid: form.email && !isEmailValid }" required />
          </div>

          <div class="input-group">
            <PhLockKey class="input-icon" :size="20" />
            <input type="password" placeholder="Password" v-model="form.password" required />
            <span class="input-hint" :class="{ valid: isPasswordValid }">Mínimo 6 caracteres</span>
          </div>

          <div class="input-group">
            <PhPhone class="input-icon" :size="20" />
            <input type="tel" placeholder="Phone Number" v-model="form.phone" required />
          </div>
        </section>

        <section class="form-section">
          <div class="section-header">
            <h3 class="section-title">Vehicle Information</h3>
            <button type="button" class="btn-add" @click="addVehicle">
              <PhPlus :size="16" /> Add Vehicle
            </button>
          </div>
          
          <div v-for="(vehicle, index) in form.vehicles" :key="index" class="vehicle-card">
            <div class="vehicle-card-header" v-if="form.vehicles.length > 1">
              <span>Vehicle #{{ index + 1 }}</span>
              <button type="button" class="btn-remove" @click="removeVehicle(index)"><PhTrash :size="18" /></button>
            </div>

            <div class="input-group">
              <PhCar class="input-icon" :size="20" />
              <input type="text" placeholder="License Plate" v-model="vehicle.plate" />
            </div>

            <div class="input-group">
              <PhCar class="input-icon" :size="20" />
              <select v-model="vehicle.brand" class="select-brand">
                <option value="" disabled>Select a brand</option>
                <option v-for="brand in ALLOWED_BRANDS" :key="brand" :value="brand">
                  {{ brand }}
                </option>
              </select>
             
              
              <span class="input-hint">Selecione a marca do veículo</span>
            </div>

            <div class="row">
              <div class="input-group half">
                <input type="text" placeholder="Model" v-model="vehicle.model" />
              </div>
              <div class="input-group half">
                <input type="text" placeholder="Color" v-model="vehicle.color" />
              </div>
            </div>
          </div>
        </section>

        <div class="terms-checkbox" @click="form.agreeTerms = !form.agreeTerms">
          <PhCheckSquare v-if="form.agreeTerms" :size="20" color="var(--color-accent-cyan)" weight="fill" />
          <PhSquare v-else :size="20" color="var(--color-text-secondary)" />
          <span class="terms-text">I agree to the <a href="#" @click.stop>Terms of Service</a> and <a href="#" @click.stop>Privacy Policy</a></span>
        </div>

        <button type="submit" class="btn-primary w-full mt-4" :disabled="!form.agreeTerms">
          Create Account
        </button>
      </form>

      <div class="login-prompt">
        Already have an account? <a href="#" @click.prevent="login">Sign in</a>
      </div>
    </main>
  </div>
</template>

<style scoped>
.content {
  padding: 0 var(--spacing-4) var(--spacing-8);
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

.form-section {
  margin-bottom: var(--spacing-6);
}

.section-title {
  font-size: 1rem;
  font-weight: 500;
  color: var(--color-text-primary);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-4);
}

.btn-add {
  background: none;
  border: none;
  color: var(--color-accent-cyan);
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  cursor: pointer;
}

.vehicle-card {
  background-color: rgba(255, 255, 255, 0.03);
  padding: var(--spacing-4);
  border-radius: var(--radius-lg);
  border: 1px dashed var(--color-border);
  margin-bottom: var(--spacing-4);
}

.vehicle-card-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-3);
}

.btn-remove {
  background: none;
  border: none;
  color: #ff4d4d;
  cursor: pointer;
}

.input-group {
  position: relative;
  margin-bottom: var(--spacing-4);
}

.input-icon {
  position: absolute;
  left: 1rem;
  top: 1rem;
  color: var(--color-text-secondary);
  pointer-events: none;
}

input {
  width: 100%;
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1rem;
  color: var(--color-text-primary);
  font-size: 0.95rem;
  transition: all 0.2s ease;
}

.input-group:has(.input-icon) input,
.input-group:has(.input-icon) .select-brand {
  padding-left: 3rem;
}

input:focus,
.select-brand:focus {
  outline: none;
  border-color: var(--color-accent-cyan);
  background-color: var(--color-bg-card-hover);
}

input.invalid {
  border-color: #ff4d4d;
}

.input-hint {
  display: block;
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  margin-top: 0.25rem;
  margin-left: 0.5rem;
}

.input-hint.valid {
  color: #4ade80;
}

.select-brand {
  width: 100%;
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1rem;
  color: var(--color-text-primary);
  font-size: 0.95rem;
  transition: all 0.2s ease;
  appearance: none; /* Remove default browser styling for select */
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E"); /* Custom arrow */
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 1em;
}
.error-banner {
  background-color: rgba(255, 77, 77, 0.1);
  color: #ff4d4d;
  padding: 0.75rem;
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-4);
  font-size: 0.9rem;
  text-align: center;
}
.row {
  display: flex;
  gap: var(--spacing-4);
}

.half {
  flex: 1;
}

.section-note {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: -0.5rem;
}

.info-icon {
  font-size: 0.7rem;
  background-color: var(--color-border);
  width: 16px;
  height: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.terms-checkbox {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  cursor: pointer;
  margin-bottom: var(--spacing-6);
}

.terms-text {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  line-height: 1.4;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.login-prompt {
  text-align: center;
  margin-top: var(--spacing-8);
  font-size: 0.9rem;
  color: var(--color-text-secondary);
}

.w-full {
  width: 100%;
}
</style>
