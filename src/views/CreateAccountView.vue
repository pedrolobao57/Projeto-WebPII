<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { PhArrowLeft, PhUser, PhEnvelopeSimple, PhLockKey, PhPhone, PhCar, PhCheckSquare, PhSquare } from '@phosphor-icons/vue'

const router = useRouter()

const form = ref({
  fullName: '',
  email: '',
  password: '',
  phone: '',
  licensePlate: '',
  brand: '',
  model: '',
  color: '',
  agreeTerms: false
})

const goBack = () => {
  router.back()
}

const handleSignup = () => {
  // Mock registration
  router.push('/dashboard')
}

const login = () => {
  router.push('/dashboard')
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

      <form @submit.prevent="handleSignup" class="signup-form">
        <section class="form-section">
          <h3 class="section-title">Personal Information</h3>
          
          <div class="input-group">
            <PhUser class="input-icon" :size="20" />
            <input type="text" placeholder="Full Name" v-model="form.fullName" required />
          </div>

          <div class="input-group">
            <PhEnvelopeSimple class="input-icon" :size="20" />
            <input type="email" placeholder="Email Address" v-model="form.email" required />
          </div>

          <div class="input-group">
            <PhLockKey class="input-icon" :size="20" />
            <input type="password" placeholder="Password" v-model="form.password" required />
            <span class="input-hint">Must be at least 8 characters</span>
          </div>

          <div class="input-group">
            <PhPhone class="input-icon" :size="20" />
            <input type="tel" placeholder="Phone Number" v-model="form.phone" required />
          </div>
        </section>

        <section class="form-section">
          <h3 class="section-title">Vehicle Information</h3>
          
          <div class="input-group">
            <PhCar class="input-icon" :size="20" />
            <input type="text" placeholder="License Plate Number" v-model="form.licensePlate" />
          </div>

          <div class="row">
            <div class="input-group half">
              <input type="text" placeholder="Brand" v-model="form.brand" />
            </div>
            <div class="input-group half">
              <input type="text" placeholder="Model" v-model="form.model" />
            </div>
          </div>

          <div class="input-group">
            <input type="text" placeholder="Vehicle Color" v-model="form.color" />
          </div>
          <p class="section-note"><span class="info-icon">ℹ</span> You can add more vehicles later in your profile settings.</p>
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
  margin-bottom: var(--spacing-4);
  color: var(--color-text-primary);
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

.input-group:has(.input-icon) input {
  padding-left: 3rem;
}

input:focus {
  outline: none;
  border-color: var(--color-accent-cyan);
  background-color: var(--color-bg-card-hover);
}

.input-hint {
  display: block;
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  margin-top: 0.25rem;
  margin-left: 0.5rem;
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
