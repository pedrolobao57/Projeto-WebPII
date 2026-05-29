<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { PhMapPin, PhEnvelopeSimple, PhLockKey, PhArrowLeft } from '@phosphor-icons/vue'
import { loginUser } from '../api/users'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const { saveSession } = useAuth()

const email = ref('')
const password = ref('')
const errorMessage = ref('')
const loading = ref(false)

const goBack = () => router.back()
const goToSignup = () => router.push('/signup')

const handleLogin = async () => {
  if (!email.value || !password.value) {
    errorMessage.value = 'Please fill in all fields.'
    return
  }
  loading.value = true
  errorMessage.value = ''
  try {
    const response = await loginUser({ email: email.value, password: password.value })
    saveSession(response.token, response.refreshToken, response.user)
    router.push('/dashboard')
  } catch (err) {
    errorMessage.value = err.message || 'Invalid email or password.'
  } finally {
    loading.value = false
  }
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
      <!-- Logo -->
      <div class="logo-section">
        <div class="logo-icon">
          <PhMapPin :size="32" color="var(--color-bg-base)" weight="fill" />
        </div>
        <h1>Welcome Back</h1>
        <p class="subtitle">Sign in to your ParkSmart account</p>
      </div>

      <!-- Error Banner -->
      <div v-if="errorMessage" class="error-banner">{{ errorMessage }}</div>

      <!-- Login Form -->
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label class="form-label">Email Address</label>
          <div class="input-wrapper">
            <PhEnvelopeSimple class="input-icon" :size="20" />
            <input
              id="login-email"
              type="email"
              class="input-field with-icon"
              placeholder="you@example.com"
              v-model="email"
              autocomplete="email"
              required
            />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Password</label>
          <div class="input-wrapper">
            <PhLockKey class="input-icon" :size="20" />
            <input
              id="login-password"
              type="password"
              class="input-field with-icon"
              placeholder="Your password"
              v-model="password"
              autocomplete="current-password"
              required
            />
          </div>
        </div>

        <button type="submit" class="btn-primary w-full" :disabled="loading">
          <span v-if="loading" class="spinner"></span>
          {{ loading ? 'Signing in…' : 'Sign In' }}
        </button>
      </form>

      <p class="signup-prompt">
        Don't have an account?
        <a href="#" @click.prevent="goToSignup">Create one</a>
      </p>
    </main>
  </div>
</template>

<style scoped>
.content {
  padding: 0 var(--spacing-4) var(--spacing-8);
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 72px);
  justify-content: center;
}

/* Logo / Heading */
.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: var(--spacing-8);
}

.logo-icon {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, var(--color-accent-cyan), #0077aa);
  border-radius: var(--radius-xl);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--spacing-4);
  box-shadow: 0 8px 24px rgba(0, 212, 255, 0.3);
}

h1 {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 0.4rem;
}

.subtitle {
  color: var(--color-text-secondary);
  font-size: 0.95rem;
}

/* Form */
.login-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-5);
  margin-bottom: var(--spacing-6);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--color-text-secondary);
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

.input-field {
  width: 100%;
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1rem;
  color: var(--color-text-primary);
  font-size: 0.95rem;
  transition: border-color 0.2s ease, background-color 0.2s ease;
  box-sizing: border-box;
}

.input-field.with-icon {
  padding-left: 3rem;
}

.input-field:focus {
  outline: none;
  border-color: var(--color-accent-cyan);
  background-color: var(--color-bg-card-hover);
}

/* Error */
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

/* Submit */
.w-full {
  width: 100%;
}

.btn-primary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Sign up link */
.signup-prompt {
  text-align: center;
  font-size: 0.9rem;
  color: var(--color-text-secondary);
}

.signup-prompt a {
  color: var(--color-accent-cyan);
  font-weight: 600;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
