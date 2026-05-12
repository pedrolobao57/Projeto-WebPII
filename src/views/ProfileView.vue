<script setup>
import { ref } from 'vue'
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
  PhSignOut
} from '@phosphor-icons/vue'

const router = useRouter()
const activeTab = ref('profile')

const goBack = () => router.back()
const handleSignOut = () => {
  router.push('/')
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
      <div class="profile-header">
        <div class="avatar-large">
          <PhUser :size="32" weight="fill" />
        </div>
        <div class="user-info">
          <h2>John Doe</h2>
          <p>john.doe@example.com</p>
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

      <div class="settings-section">
        <h3 class="section-title">Personal Information</h3>
        
        <div class="settings-card bg-card radius-lg">
          <div class="setting-item">
            <div class="setting-icon">
              <PhUser :size="20" class="text-secondary" />
            </div>
            <div class="setting-content">
              <span class="label">Full Name</span>
              <span class="value">John Doe</span>
            </div>
            <button class="edit-btn"><PhPencilSimple :size="18" /></button>
          </div>

          <div class="divider"></div>

          <div class="setting-item">
            <div class="setting-icon">
              <PhEnvelopeSimple :size="20" class="text-secondary" />
            </div>
            <div class="setting-content">
              <span class="label">Email Address</span>
              <span class="value">john.doe@example.com</span>
            </div>
            <button class="edit-btn"><PhPencilSimple :size="18" /></button>
          </div>

          <div class="divider"></div>

          <div class="setting-item">
            <div class="setting-icon">
              <PhPhone :size="20" class="text-secondary" />
            </div>
            <div class="setting-content">
              <span class="label">Phone Number</span>
              <span class="value">+1 (555) 123-4567</span>
            </div>
            <button class="edit-btn"><PhPencilSimple :size="18" /></button>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <h3 class="section-title">Security</h3>
        
        <div class="settings-card bg-card radius-lg clickable">
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

      <div class="settings-section links-section">
        <div class="settings-card bg-card radius-lg clickable mb-2">
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

        <div class="settings-card bg-card radius-lg clickable mb-2">
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
</style>
