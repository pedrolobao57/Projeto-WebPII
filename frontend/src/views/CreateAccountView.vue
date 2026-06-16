<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { PhArrowLeft, PhUser, PhEnvelopeSimple, PhLockKey, PhPhone, PhCar, PhCheckSquare, PhSquare, PhPlus, PhTrash, PhWarning } from '@phosphor-icons/vue'
import { createUser, loginUser } from '../api/users'
import brands, { brandModels } from '../api/brands'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const ALLOWED_BRANDS = brands
const ALLOWED_COLORS = ['Preto', 'Branco', 'Cinza', 'Vermelho', 'Azul', 'Verde', 'Amarelo', 'Outro']
const { saveSession } = useAuth()

const form = ref({
  fullName: '',
  email: '',
  password: '',
  phone: '',
  tipo_utilizador: 'CLIENTE',
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

// Validations
const isNameValid = computed(() => {
  if (!form.value.fullName) return false
  const noNumbers = !/\d/.test(form.value.fullName)
  return form.value.fullName.trim().length >= 2 && noNumbers
})

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const isEmailValid = computed(() => emailRegex.test(form.value.email))

const isPhoneValid = computed(() => /^9\d{8}$/.test(form.value.phone))
const isPasswordValid = computed(() => form.value.password.length >= 6)

// Password Strength
const passwordStrength = computed(() => {
  const pwd = form.value.password
  if (!pwd) return { label: '', score: 0, color: '' }
  if (pwd.length < 6) return { label: 'Curta (mínimo 6 chars)', score: 1, color: '#ff4d4d' }
  
  let score = 2
  const hasUpper = /[A-Z]/.test(pwd)
  const hasLower = /[a-z]/.test(pwd)
  const hasDigit = /[0-9]/.test(pwd)
  const hasSpecial = /[^A-Za-z0-9]/.test(pwd)
  
  const matches = [hasUpper, hasLower, hasDigit, hasSpecial].filter(Boolean).length
  if (pwd.length >= 10 && matches >= 3) {
    return { label: 'Forte', score: 4, color: '#4ade80' }
  } else if (pwd.length >= 8 && matches >= 2) {
    return { label: 'Média', score: 3, color: '#facc15' }
  }
  return { label: 'Fraca', score: 2, color: '#fb923c' }
})

// Plate validation
const plateRegex = /^(?:[A-Z]{2}-\d{2}-[A-Z]{2}|\d{2}-[A-Z]{2}-[A-Z]{2}|[A-Z]{2}-\d{2}-\d{2}|\d{2}-\d{2}-[A-Z]{2}|\d{2}-[A-Z]{2}-\d{2}|[A-Z]{2}-[A-Z]{2}-\d{2})$/
const isPlateValid = (plate) => plateRegex.test(plate.toUpperCase())

const areVehiclesValid = computed(() => {
  if (form.value.tipo_utilizador !== 'CLIENTE') return true
  if (form.value.vehicles.length === 0) return false
  return form.value.vehicles.every(v => {
    return v.plate && isPlateValid(v.plate) && v.brand && v.model && v.color
  })
})

const isFormValid = computed(() => {
  const basic = isNameValid.value && isEmailValid.value && isPasswordValid.value && isPhoneValid.value && form.value.agreeTerms
  if (form.value.tipo_utilizador === 'CLIENTE') {
    return basic && areVehiclesValid.value
  }
  return basic
})

// Watch brand changes to clear corresponding model
watch(
  () => form.value.vehicles.map(v => v.brand),
  (newBrands, oldBrands) => {
    newBrands.forEach((brand, index) => {
      const oldBrand = oldBrands ? oldBrands[index] : undefined
      if (oldBrand !== undefined && brand !== oldBrand) {
        if (form.value.vehicles[index]) {
          form.value.vehicles[index].model = ''
        }
      }
    })
  },
  { deep: true }
)

const handleSignup = async () => {
  if (!isFormValid.value) return

  try {
    errorMessage.value = ''
    const payload = {
      name: form.value.fullName,
      email: form.value.email,
      password: form.value.password,
      phone: form.value.phone,
      tipo_utilizador: form.value.tipo_utilizador,
      vehicles: form.value.tipo_utilizador === 'CLIENTE' ? form.value.vehicles : []
    }

    // 1. Criar a conta
    await createUser(payload)

    // 2. Login automático após registo
    const response = await loginUser({ email: form.value.email, password: form.value.password })
    saveSession(response.token, response.refreshToken, response.user)

    if (response.user.tipo_utilizador === 'ADMIN') {
      router.push('/admin-dashboard')
    } else {
      router.push('/dashboard')
    }
  } catch (err) {
    errorMessage.value = err.message || 'Erro ao criar conta'
  }
}

const login = () => {
  router.push('/login')
}

const showDocModal = ref(false)
const docType = ref('terms')
const openDoc = (type) => {
  docType.value = type
  showDocModal.value = true
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
            <input 
              type="text" 
              placeholder="Full Name" 
              v-model="form.fullName" 
              required 
              :class="{ invalid: form.fullName && !isNameValid, valid: form.fullName && isNameValid }"
            />
            <div v-if="form.fullName && !isNameValid" class="field-error-msg animate-fade-in">
              <PhWarning :size="14" /> Nome deve ter pelo menos 2 caracteres e sem números.
            </div>
          </div>

          <div class="input-group">
            <PhEnvelopeSimple class="input-icon" :size="20" />
            <input 
              type="email" 
              placeholder="Email Address" 
              v-model="form.email" 
              :class="{ invalid: form.email && !isEmailValid, valid: form.email && isEmailValid }" 
              required 
            />
            <div v-if="form.email && !isEmailValid" class="field-error-msg animate-fade-in">
              <PhWarning :size="14" /> Introduza um email válido.
            </div>
          </div>

          <div class="input-group">
            <PhLockKey class="input-icon" :size="20" />
            <input 
              type="password" 
              placeholder="Password" 
              v-model="form.password" 
              :class="{ invalid: form.password && !isPasswordValid, valid: form.password && isPasswordValid }"
              required 
            />
            <!-- Strength Indicator -->
            <div v-if="form.password" class="password-strength-container animate-fade-in">
              <div class="strength-bar-bg">
                <div 
                  class="strength-bar" 
                  :style="{ 
                    width: (passwordStrength.score * 25) + '%', 
                    backgroundColor: passwordStrength.color 
                  }"
                ></div>
              </div>
              <span class="strength-label" :style="{ color: passwordStrength.color }">
                {{ passwordStrength.label }}
              </span>
            </div>
            <span v-else class="input-hint">Mínimo 6 caracteres</span>
          </div>

          <div class="input-group">
            <PhPhone class="input-icon" :size="20" />
            <input 
              type="tel" 
              placeholder="Phone Number" 
              v-model="form.phone" 
              :class="{ invalid: form.phone && !isPhoneValid, valid: form.phone && isPhoneValid }"
              required 
            />
            <div v-if="form.phone && !isPhoneValid" class="field-error-msg animate-fade-in">
              <PhWarning :size="14" /> Telefone deve começar por 9 e ter 9 dígitos.
            </div>
          </div>

          <div class="input-group">
            <label class="form-label" style="display: block; margin-bottom: 0.5rem;">Account Type</label>
            <div class="role-selector">
              <button 
                type="button" 
                class="role-btn" 
                :class="{ active: form.tipo_utilizador === 'CLIENTE' }" 
                @click="form.tipo_utilizador = 'CLIENTE'"
              >
                Driver (Client)
              </button>
              <button 
                type="button" 
                class="role-btn" 
                :class="{ active: form.tipo_utilizador === 'ADMIN' }" 
                @click="form.tipo_utilizador = 'ADMIN'"
              >
                Administrator
              </button>
            </div>
          </div>
        </section>

        <section v-if="form.tipo_utilizador === 'CLIENTE'" class="form-section">
          <div class="section-header">
            <h3 class="section-title">Vehicle Information</h3>
            <button type="button" class="btn-add" @click="addVehicle">
              <PhPlus :size="16" /> Add Vehicle
            </button>
          </div>
          
          <div v-for="(vehicle, index) in form.vehicles" :key="index" class="vehicle-card animate-fade-in">
            <div class="vehicle-card-header" v-if="form.vehicles.length > 1">
              <span>Vehicle #{{ index + 1 }}</span>
              <button type="button" class="btn-remove" @click="removeVehicle(index)"><PhTrash :size="18" /></button>
            </div>

            <div class="input-group">
              <PhCar class="input-icon" :size="20" />
              <input 
                type="text" 
                placeholder="License Plate" 
                v-model="vehicle.plate" 
                @input="vehicle.plate = vehicle.plate.toUpperCase()"
                :class="{ invalid: vehicle.plate && !isPlateValid(vehicle.plate), valid: vehicle.plate && isPlateValid(vehicle.plate) }"
                required
              />
              <div v-if="vehicle.plate && !isPlateValid(vehicle.plate)" class="field-error-msg animate-fade-in">
                <PhWarning :size="14" /> Formato inválido (ex: AA-00-AA ou 00-AA-00).
              </div>
            </div>

            <div class="input-group">
              <PhCar class="input-icon" :size="20" />
              <select v-model="vehicle.brand" class="select-brand" :class="{ valid: vehicle.brand }" required>
                <option value="" disabled>Select a brand</option>
                <option v-for="brand in ALLOWED_BRANDS" :key="brand" :value="brand">
                  {{ brand }}
                </option>
              </select>
              <span class="input-hint">Selecione a marca do veículo</span>
            </div>

            <div class="row">
              <div class="input-group half">
                <select 
                  v-model="vehicle.model" 
                  class="select-brand" 
                  :disabled="!vehicle.brand"
                  :class="{ valid: vehicle.model }"
                  required
                >
                  <option value="" disabled>{{ vehicle.brand ? 'Select model' : 'Selecione primeiro a marca' }}</option>
                  <option v-for="model in (vehicle.brand ? brandModels[vehicle.brand] : [])" :key="model" :value="model">
                    {{ model }}
                  </option>
                </select>
              </div>
              <div class="input-group half">
                <select v-model="vehicle.color" class="select-brand" :class="{ valid: vehicle.color }" required>
                  <option value="" disabled>Select color</option>
                  <option v-for="color in ALLOWED_COLORS" :key="color" :value="color">
                    {{ color }}
                  </option>
                </select>
              </div>
            </div>
          </div>
        </section>

        <div class="terms-checkbox" @click="form.agreeTerms = !form.agreeTerms">
          <PhCheckSquare v-if="form.agreeTerms" :size="20" color="var(--color-accent-cyan)" weight="fill" />
          <PhSquare v-else :size="20" color="var(--color-text-secondary)" />
          <span class="terms-text">I agree to the <a href="#" @click.stop="openDoc('terms')">Terms of Service</a> and <a href="#" @click.stop="openDoc('privacy')">Privacy Policy</a></span>
        </div>

        <button type="submit" class="btn-primary w-full mt-4" :disabled="!isFormValid">
          Create Account
        </button>
      </form>

      <div class="login-prompt">
        Already have an account? <a href="#" @click.prevent="login">Sign in</a>
      </div>
    </main>

    <!-- Document Modal (Terms & Privacy) -->
    <div v-if="showDocModal" class="modal-overlay" @click.self="showDocModal = false">
      <div class="modal-card bg-card radius-lg doc-modal-card animate-fade-in">
        <h3 class="modal-title">{{ docType === 'terms' ? 'Terms of Service' : 'Privacy Policy' }}</h3>
        
        <div class="doc-content">
          <template v-if="docType === 'terms'">
            <h4>1. Acceptance of Terms</h4>
            <p>By accessing and using ParkSmart, you accept and agree to be bound by the terms and provision of this agreement.</p>
            
            <h4>2. Spot Reservations</h4>
            <p>Reservations are valid only for the specified period and spot number. Overstaying will incur additional charges based on the park's standard tariff.</p>
            
            <h4>3. User Conduct</h4>
            <p>You agree to park only in designated spots and to follow all traffic and safety regulations within the parking facility.</p>
            
            <h4>4. Limitation of Liability</h4>
            <p>ParkSmart is not liable for any theft, damage, or loss of property occurring inside the parking facilities.</p>
          </template>
          <template v-else>
            <h4>1. Information We Collect</h4>
            <p>We collect your personal information (name, email, phone number) and vehicle details (license plate, brand, model) to provide parking services.</p>
            
            <h4>2. Payment Processing</h4>
            <p>Payment information is processed securely through authorized payment gateway partners. We do not store full credit card details on our servers.</p>
            
            <h4>3. Data Sharing</h4>
            <p>We do not sell or share your personal data with third parties except as necessary to fulfill parking reservations or comply with legal requirements.</p>
            
            <h4>4. Your Rights</h4>
            <p>You can request to view, update, or delete your account information at any time by contacting our support team.</p>
          </template>
        </div>
        
        <div class="modal-actions">
          <button type="button" class="btn-primary" @click="showDocModal = false">Close</button>
        </div>
      </div>
    </div>
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

/* Modal Overlay Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-4);
}
.modal-card {
  width: 100%;
  max-width: 400px;
  padding: var(--spacing-6);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-xl);
}
.modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: var(--spacing-4);
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-3);
  margin-top: var(--spacing-4);
}
.btn-primary, .btn-secondary {
  border-radius: var(--radius-md);
  padding: 0.6rem 1.2rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
}
.btn-primary {
  background-color: var(--color-accent-cyan);
  color: var(--color-bg-base);
}
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Document Modal Styles */
.doc-modal-card {
  max-width: 500px;
}
.doc-content {
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: var(--spacing-4);
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  line-height: 1.5;
  padding-right: 0.5rem;
}
.doc-content h4 {
  color: var(--color-text-primary);
  font-weight: 600;
  margin-top: 1rem;
  margin-bottom: 0.25rem;
}
.doc-content p {
  margin-bottom: 1rem;
}
/* Custom Scrollbar for modal content */
.doc-content::-webkit-scrollbar {
  width: 4px;
}
.doc-content::-webkit-scrollbar-track {
  background: transparent;
}
.doc-content::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 2px;
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
.animate-fade-in {
  animation: fadeIn 0.2s ease-out;
}

.role-selector {
  display: flex;
  gap: var(--spacing-2);
  margin-top: 0.25rem;
}
.role-btn {
  flex: 1;
  padding: 0.75rem;
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  border-radius: var(--radius-md);
  font-weight: 600;
  transition: all 0.2s ease;
  cursor: pointer;
}
.role-btn.active {
  background-color: var(--color-accent-cyan-transparent);
  border-color: var(--color-accent-cyan);
  color: var(--color-accent-cyan);
}
.role-btn:hover:not(.active) {
  background-color: var(--color-bg-card-hover);
  color: var(--color-text-primary);
}

input.invalid,
select.invalid {
  border-color: #ff4d4d !important;
}

input.valid,
select.valid {
  border-color: #4ade80 !important;
}

.field-error-msg {
  color: #ff4d4d;
  font-size: 0.75rem;
  margin-top: 0.25rem;
  margin-left: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.password-strength-container {
  margin-top: 0.5rem;
  margin-left: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.strength-bar-bg {
  width: 100px;
  height: 6px;
  background-color: var(--color-border);
  border-radius: 3px;
  overflow: hidden;
}

.strength-bar {
  height: 100%;
  transition: all 0.3s ease;
}

.strength-label {
  font-size: 0.75rem;
  font-weight: 500;
}
</style>
