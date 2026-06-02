<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { 
  PhArrowLeft, 
  PhUser, 
  PhCar, 
  PhCreditCard, 
  PhSlidersHorizontal,
  PhPencilSimple,
  PhEnvelopeSimple,
  PhPhone,
  PhCaretRight,
  PhLockKey,
  PhShieldCheck,
  PhFileText,
  PhSignOut,
  PhHouseLine
} from '@phosphor-icons/vue'
import { useAuth } from '../composables/useAuth'
import apiClient from '../api/client'
import brands from '../api/brands'

const ALLOWED_BRANDS = brands
const ALLOWED_COLORS = ['Preto', 'Branco', 'Cinza', 'Vermelho', 'Azul', 'Verde', 'Amarelo', 'Outro']


const router = useRouter()
const { user, logout } = useAuth()
const activeTab = ref('profile')

const localUser = ref({ ...user.value })

const displayName = computed(() => localUser.value?.name || 'User')
const displayEmail = computed(() => localUser.value?.email || '—')
const displayPhone = computed(() => localUser.value?.phone || '—')

const editingField = ref(null)
const editValue = ref('')

const startEdit = (field, value) => {
  editingField.value = field
  editValue.value = value
}

const cancelEdit = () => {
  editingField.value = null
}

const saveEdit = async () => {
  if (!editValue.value) return
  
  try {
    const payload = {}
    const fieldKey = editingField.value === 'name' ? 'name' : (editingField.value === 'email' ? 'email' : 'phone')
    payload[fieldKey] = editValue.value
    
    const updatedUser = await apiClient.patch('/users/me', payload)
    
    // Update local state and localStorage session
    localUser.value = updatedUser
    localStorage.setItem('user', JSON.stringify(updatedUser))
    
    editingField.value = null
  } catch (err) {
    alert(err.message || 'Erro ao atualizar dados.')
  }
}

// Password change modal state
const showPasswordModal = ref(false)
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const passwordError = ref('')
const passwordSuccess = ref('')
const passwordLoading = ref(false)

const handlePasswordChange = async () => {
  if (newPassword.value !== confirmPassword.value) {
    passwordError.value = 'As passwords não coincidem.'
    return
  }
  if (newPassword.value.length < 6) {
    passwordError.value = 'A nova password deve ter pelo menos 6 caracteres.'
    return
  }
  
  passwordLoading.value = true
  passwordError.value = ''
  passwordSuccess.value = ''
  
  try {
    await apiClient.post('/users/me/change-password', {
      currentPassword: currentPassword.value,
      newPassword: newPassword.value
    })
    passwordSuccess.value = 'Password alterada com sucesso!'
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
    setTimeout(() => {
      showPasswordModal.value = false
      passwordSuccess.value = ''
    }, 1500)
  } catch (err) {
    passwordError.value = err.message || 'Erro ao alterar password.'
  } finally {
    passwordLoading.value = false
  }
}

const showVehicleModal = ref(false)
const vehiclePlate = ref('')
const vehicleBrand = ref('')
const vehicleModel = ref('')
const vehicleColor = ref('')
const vehicleError = ref('')
const vehicleSuccess = ref('')
const vehicleLoading = ref(false)

const handleAddVehicle = async () => {
  if (!vehiclePlate.value) {
    vehicleError.value = 'A matrícula é obrigatória.'
    return
  }
  
  vehicleLoading.value = true
  vehicleError.value = ''
  vehicleSuccess.value = ''
  
  try {
    const newVehicle = await apiClient.post('/users/me/vehicles', {
      plate: vehiclePlate.value,
      brand: vehicleBrand.value,
      model: vehicleModel.value,
      color: vehicleColor.value
    })
    
    if (!localUser.value.vehicles) {
      localUser.value.vehicles = []
    }
    localUser.value.vehicles.push(newVehicle)
    
    localStorage.setItem('user', JSON.stringify(localUser.value))
    
    vehicleSuccess.value = 'Veículo adicionado com sucesso!'
    vehiclePlate.value = ''
    vehicleBrand.value = ''
    vehicleModel.value = ''
    vehicleColor.value = ''
    
    setTimeout(() => {
      showVehicleModal.value = false
      vehicleSuccess.value = ''
    }, 1500)
  } catch (err) {
    vehicleError.value = err.message || 'Erro ao adicionar veículo.'
  } finally {
    vehicleLoading.value = false
  }
}

const showDocModal = ref(false)
const docType = ref('terms')
const openDoc = (type) => {
  docType.value = type
  showDocModal.value = true
}

const goBack = () => router.back()
const handleSignOut = () => {
  logout()
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
      <div class="profile-header">
        <div class="avatar-large">
          <PhUser :size="32" weight="fill" />
        </div>
        <div class="user-info">
          <h2>{{ displayName }}</h2>
          <p>{{ displayEmail }}</p>
        </div>
      </div>

      <div class="profile-tabs">
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'profile' }"
          @click="activeTab = 'profile'"
        >
          <PhUser :size="16" /> Profile
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'vehicles' }"
          @click="activeTab = 'vehicles'"
        >
          <PhCar :size="16" /> Vehicles
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'payment' }"
          @click="activeTab = 'payment'"
        >
          <PhCreditCard :size="16" /> Payment
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'preferences' }"
          @click="activeTab = 'preferences'"
        >
          <PhSlidersHorizontal :size="16" /> Preferences
        </button>
      </div>

      <!-- Profile Tab Panel -->
      <div v-if="activeTab === 'profile'">
        <div class="settings-section">
          <h3 class="section-title">Personal Information</h3>
          
          <div class="settings-card bg-card radius-lg">
            <div class="setting-item">
              <div class="setting-icon">
                <PhUser :size="20" class="text-secondary" />
              </div>
              <div class="setting-content" v-if="editingField !== 'name'">
                <span class="label">Full Name</span>
                <span class="value">{{ displayName }}</span>
              </div>
              <div class="setting-content inline-edit-wrapper" v-else>
                <span class="label">Full Name</span>
                <input type="text" class="inline-edit-input" v-model="editValue" @keyup.enter="saveEdit" />
              </div>
              <button class="edit-btn" v-if="editingField !== 'name'" @click="startEdit('name', displayName)"><PhPencilSimple :size="18" /></button>
              <div class="edit-actions" v-else>
                <button class="action-save" @click="saveEdit">Save</button>
                <button class="action-cancel" @click="cancelEdit">Cancel</button>
              </div>
            </div>

            <div class="divider"></div>

            <div class="setting-item">
              <div class="setting-icon">
                <PhEnvelopeSimple :size="20" class="text-secondary" />
              </div>
              <div class="setting-content" v-if="editingField !== 'email'">
                <span class="label">Email Address</span>
                <span class="value">{{ displayEmail }}</span>
              </div>
              <div class="setting-content inline-edit-wrapper" v-else>
                <span class="label">Email Address</span>
                <input type="email" class="inline-edit-input" v-model="editValue" @keyup.enter="saveEdit" />
              </div>
              <button class="edit-btn" v-if="editingField !== 'email'" @click="startEdit('email', displayEmail)"><PhPencilSimple :size="18" /></button>
              <div class="edit-actions" v-else>
                <button class="action-save" @click="saveEdit">Save</button>
                <button class="action-cancel" @click="cancelEdit">Cancel</button>
              </div>
            </div>

            <div class="divider"></div>

            <div class="setting-item">
              <div class="setting-icon">
                <PhPhone :size="20" class="text-secondary" />
              </div>
              <div class="setting-content" v-if="editingField !== 'phone'">
                <span class="label">Phone Number</span>
                <span class="value">{{ displayPhone }}</span>
              </div>
              <div class="setting-content inline-edit-wrapper" v-else>
                <span class="label">Phone Number</span>
                <input type="tel" class="inline-edit-input" v-model="editValue" @keyup.enter="saveEdit" />
              </div>
              <button class="edit-btn" v-if="editingField !== 'phone'" @click="startEdit('phone', displayPhone)"><PhPencilSimple :size="18" /></button>
              <div class="edit-actions" v-else>
                <button class="action-save" @click="saveEdit">Save</button>
                <button class="action-cancel" @click="cancelEdit">Cancel</button>
              </div>
            </div>
          </div>
        </div>

        <div class="settings-section">
          <h3 class="section-title">Security</h3>
          
          <div class="settings-card bg-card radius-lg clickable" @click="showPasswordModal = true">
            <div class="setting-item">
              <div class="setting-icon">
                <PhLockKey :size="20" class="text-secondary" />
              </div>
              <div class="setting-content">
                <span class="value">Change Password</span>
              </div>
              <PhCaretRight :size="16" class="text-secondary" />
            </div>
          </div>
        </div>
      </div>

      <!-- Vehicles Tab Panel -->
      <div v-if="activeTab === 'vehicles'" class="settings-section">
        <div class="vehicles-header">
          <h3 class="section-title">My Vehicles</h3>
          <button class="add-vehicle-trigger-btn" @click="showVehicleModal = true">
            + Add Vehicle
          </button>
        </div>
        <div class="settings-card bg-card radius-lg">
          <div v-if="!localUser?.vehicles || localUser.vehicles.length === 0" class="setting-item">
            <span class="value text-secondary">No vehicles registered yet.</span>
          </div>
          <template v-else v-for="(v, index) in localUser.vehicles" :key="index">
            <div class="setting-item">
              <div class="setting-icon">
                <PhCar :size="20" class="text-secondary" />
              </div>
              <div class="setting-content">
                <span class="label">{{ v.brand || 'Unknown Brand' }} {{ v.model || 'Unknown Model' }}<span v-if="v.color"> ({{ v.color }})</span></span>
                <span class="value">{{ v.plate }}</span>
              </div>
            </div>
            <div v-if="index < localUser.vehicles.length - 1" class="divider"></div>
          </template>
        </div>
      </div>

      <!-- Payment Tab Panel -->
      <div v-if="activeTab === 'payment'" class="settings-section">
        <h3 class="section-title">Payment Methods</h3>
        <div class="settings-card bg-card radius-lg">
          <div class="setting-item">
            <div class="setting-icon">
              <PhCreditCard :size="20" class="text-secondary" />
            </div>
            <div class="setting-content">
              <span class="label">Visa</span>
              <span class="value">**** 4242</span>
            </div>
          </div>
          <div class="divider"></div>
          <div class="setting-item">
            <div class="setting-icon">
              <PhCreditCard :size="20" class="text-secondary" />
            </div>
            <div class="setting-content">
              <span class="label">MB Way</span>
              <span class="value">Primary payment method</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Preferences Tab Panel -->
      <div v-if="activeTab === 'preferences'" class="settings-section">
        <h3 class="section-title">App Preferences</h3>
        <div class="settings-card bg-card radius-lg">
          <div class="setting-item">
            <div class="setting-content">
              <span class="value">Push Notifications</span>
            </div>
            <span class="label text-cyan">Enabled</span>
          </div>
          <div class="divider"></div>
          <div class="setting-item">
            <div class="setting-content">
              <span class="value">Dark Mode</span>
            </div>
            <span class="label text-cyan">Always On</span>
          </div>
          <div class="divider"></div>
          <div class="setting-item">
            <div class="setting-content">
              <span class="value">Language</span>
            </div>
            <span class="label text-secondary">English</span>
          </div>
        </div>
      </div>

      <div class="settings-section links-section">
        <div class="settings-card bg-card radius-lg clickable mb-2" @click="openDoc('privacy')">
          <div class="setting-item">
            <div class="setting-icon">
              <PhShieldCheck :size="20" class="text-secondary" />
            </div>
            <div class="setting-content">
              <span class="value">Privacy Policy</span>
            </div>
            <PhCaretRight :size="16" class="text-secondary" />
          </div>
        </div>

        <div class="settings-card bg-card radius-lg clickable mb-2" @click="openDoc('terms')">
          <div class="setting-item">
            <div class="setting-icon">
              <PhFileText :size="20" class="text-secondary" />
            </div>
            <div class="setting-content">
              <span class="value">Terms of Service</span>
            </div>
            <PhCaretRight :size="16" class="text-secondary" />
          </div>
        </div>

        <div class="settings-card bg-card radius-lg clickable sign-out" @click="handleSignOut">
          <div class="setting-item">
            <div class="setting-icon">
              <PhSignOut :size="20" color="var(--color-status-occupied)" />
            </div>
            <div class="setting-content">
              <span class="value text-danger">Sign Out</span>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Password Modal -->
    <div v-if="showPasswordModal" class="modal-overlay" @click.self="showPasswordModal = false">
      <div class="modal-card bg-card radius-lg animate-fade-in">
        <h3 class="modal-title">Change Password</h3>
        
        <div v-if="passwordError" class="error-banner mb-3">{{ passwordError }}</div>
        <div v-if="passwordSuccess" class="success-banner mb-3">{{ passwordSuccess }}</div>
        
        <form @submit.prevent="handlePasswordChange" class="modal-form">
          <div class="form-group">
            <label class="form-label">Current Password</label>
            <input type="password" v-model="currentPassword" class="modal-input" required />
          </div>
          <div class="form-group">
            <label class="form-label">New Password</label>
            <input type="password" v-model="newPassword" class="modal-input" required />
          </div>
          <div class="form-group">
            <label class="form-label">Confirm New Password</label>
            <input type="password" v-model="confirmPassword" class="modal-input" required />
          </div>
          
          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="showPasswordModal = false">Cancel</button>
            <button type="submit" class="btn-primary" :disabled="passwordLoading">
              {{ passwordLoading ? 'Changing...' : 'Change Password' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Vehicle Modal -->
    <div v-if="showVehicleModal" class="modal-overlay" @click.self="showVehicleModal = false">
      <div class="modal-card bg-card radius-lg animate-fade-in">
        <h3 class="modal-title">Add Vehicle</h3>
        
        <div v-if="vehicleError" class="error-banner mb-3">{{ vehicleError }}</div>
        <div v-if="vehicleSuccess" class="success-banner mb-3">{{ vehicleSuccess }}</div>
        
        <form @submit.prevent="handleAddVehicle" class="modal-form">
          <div class="form-group">
            <label class="form-label">License Plate *</label>
            <input type="text" v-model="vehiclePlate" placeholder="e.g. AA-00-AA" class="modal-input" required />
          </div>
          <div class="form-group">
            <label class="form-label">Brand</label>
            <select v-model="vehicleBrand" class="modal-select">
              <option value="" disabled>Select a brand</option>
              <option v-for="brand in ALLOWED_BRANDS" :key="brand" :value="brand">
                {{ brand }}
              </option>
            </select>
          </div>
          <div class="row">
            <div class="form-group half">
              <label class="form-label">Model</label>
              <input type="text" v-model="vehicleModel" placeholder="e.g. Model 3" class="modal-input" />
            </div>
            <div class="form-group half">
              <label class="form-label">Color</label>
              <select v-model="vehicleColor" class="modal-select">
                <option value="" disabled>Select color</option>
                <option v-for="color in ALLOWED_COLORS" :key="color" :value="color">
                  {{ color }}
                </option>
              </select>
            </div>
          </div>
          
          <div class="modal-actions">
            <button type="button" class="btn-secondary" @click="showVehicleModal = false">Cancel</button>
            <button type="submit" class="btn-primary" :disabled="vehicleLoading">
              {{ vehicleLoading ? 'Adding...' : 'Add Vehicle' }}
            </button>
          </div>
        </form>
      </div>
    </div>

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
          <button class="btn-primary" @click="showDocModal = false">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.content {
  padding: 0 var(--spacing-4) var(--spacing-8);
}

.profile-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-6);
}

.avatar-large {
  width: 64px;
  height: 64px;
  background-color: var(--color-accent-cyan);
  color: var(--color-bg-base);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-info h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.1rem;
}

.user-info p {
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.profile-tabs {
  display: flex;
  gap: var(--spacing-2);
  overflow-x: auto;
  padding-bottom: var(--spacing-2);
  margin-bottom: var(--spacing-6);
  /* Hide scrollbar */
  scrollbar-width: none; 
}
.profile-tabs::-webkit-scrollbar {
  display: none;
}

.tab-btn {
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  padding: 0.5rem 1rem;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  font-weight: 500;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.tab-btn.active {
  background-color: var(--color-accent-cyan);
  color: var(--color-bg-base);
  border-color: var(--color-accent-cyan);
}

.settings-section {
  margin-bottom: var(--spacing-6);
}

.section-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-3);
}

.settings-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--color-border);
}

.settings-card.clickable {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.settings-card.clickable:hover {
  background-color: var(--color-bg-card-hover);
}

.setting-item {
  display: flex;
  align-items: center;
  padding: 1rem;
  gap: var(--spacing-3);
}

.setting-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
}

.setting-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.label {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.value {
  font-size: 0.95rem;
  color: var(--color-text-primary);
}

.text-danger {
  color: var(--color-status-occupied);
}

.edit-btn {
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: 0.25rem;
}

.edit-btn:hover {
  color: var(--color-text-primary);
}

.divider {
  height: 1px;
  background-color: var(--color-border);
  margin: 0 1rem;
}

.links-section {
  margin-top: var(--spacing-8);
}

/* Inline Edit Styles */
.inline-edit-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
}
.inline-edit-input {
  width: 90%;
  background: var(--color-bg-base);
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
  padding: 0.4rem 0.6rem;
  border-radius: var(--radius-sm);
  font-size: 0.95rem;
  margin-top: 0.25rem;
  outline: none;
}
.inline-edit-input:focus {
  border-color: var(--color-accent-cyan);
}
.edit-actions {
  display: flex;
  gap: 0.5rem;
  font-size: 0.8rem;
}
.action-save {
  background-color: var(--color-accent-cyan);
  color: var(--color-bg-base);
  border: none;
  border-radius: var(--radius-sm);
  padding: 0.3rem 0.6rem;
  font-weight: 600;
  cursor: pointer;
}
.action-cancel {
  background: transparent;
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.3rem 0.6rem;
  cursor: pointer;
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
.modal-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}
.modal-input {
  width: 100%;
  background-color: var(--color-bg-base);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0.8rem 1rem;
  color: var(--color-text-primary);
  font-size: 0.95rem;
  outline: none;
  box-sizing: border-box;
}
.modal-input:focus {
  border-color: var(--color-accent-cyan);
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
.btn-secondary {
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
}
.error-banner {
  background-color: rgba(255, 77, 77, 0.1);
  color: #ff4d4d;
  border: 1px solid rgba(255, 77, 77, 0.2);
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  text-align: center;
  font-size: 0.9rem;
}
.success-banner {
  background-color: rgba(74, 222, 128, 0.1);
  color: #4ade80;
  border: 1px solid rgba(74, 222, 128, 0.2);
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  text-align: center;
  font-size: 0.9rem;
}
.mb-3 { margin-bottom: 0.75rem; }

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

/* Vehicles Header Styles */
.vehicles-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-3);
}
.vehicles-header .section-title {
  margin-bottom: 0;
}
.add-vehicle-trigger-btn {
  background-color: transparent;
  border: 1px solid var(--color-accent-cyan);
  color: var(--color-accent-cyan);
  padding: 0.4rem 0.8rem;
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}
.add-vehicle-trigger-btn:hover {
  background-color: var(--color-accent-cyan);
  color: var(--color-bg-base);
}

.modal-select {
  width: 100%;
  background-color: var(--color-bg-base);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 0.8rem 1rem;
  color: var(--color-text-primary);
  font-size: 0.95rem;
  outline: none;
  box-sizing: border-box;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 1em;
}
.modal-select:focus {
  border-color: var(--color-accent-cyan);
}

.row {
  display: flex;
  gap: var(--spacing-4);
}
.half {
  flex: 1;
}
</style>

