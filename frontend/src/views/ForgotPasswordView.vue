<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { PhArrowLeft, PhEnvelopeSimple, PhLockKey, PhKey, PhMapPin } from '@phosphor-icons/vue'
import { forgotPassword, resetPassword } from '../api/users'

const router = useRouter()

const email = ref('')
const token = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

const step = ref(1) // 1: Request Code, 2: Reset Password
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const goBack = () => {
  if (step.value === 2) {
    step.value = 1
    errorMessage.value = ''
    successMessage.value = ''
  } else {
    router.push('/login')
  }
}

const handleRequestCode = async () => {
  if (!email.value) {
    errorMessage.value = 'Please enter your email address.'
    return
  }
  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    const res = await forgotPassword(email.value)
    successMessage.value = res.message || 'Recovery code generated! Check the backend console.'
    step.value = 2
  } catch (err) {
    errorMessage.value = err.message || 'Failed to request recovery code.'
  } finally {
    loading.value = false
  }
}

const handleResetPassword = async () => {
  if (!token.value || !newPassword.value || !confirmPassword.value) {
    errorMessage.value = 'Please fill in all fields.'
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match.'
    return
  }
  if (newPassword.value.length < 6) {
    errorMessage.value = 'Password must be at least 6 characters long.'
    return
  }
  
  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    await resetPassword({
      email: email.value,
      token: token.value,
      newPassword: newPassword.value
    })
    successMessage.value = 'Password updated successfully! Redirecting to login...'
    setTimeout(() => {
      router.push('/login')
    }, 2000)
  } catch (err) {
    errorMessage.value = err.message || 'Failed to reset password. Check the code.'
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
        <h1>Recover Password</h1>
        <p class="subtitle" v-if="step === 1">Enter your email to receive a 6-digit verification code</p>
        <p class="subtitle" v-else>Enter the verification code and your new password</p>
      </div>

      <!-- Messages Banner -->
      <div v-if="errorMessage" class="error-banner">{{ errorMessage }}</div>
      <div v-if="successMessage" class="success-banner">{{ successMessage }}</div>

      <!-- Step 1: Enter Email -->
      <form v-if="step === 1" @submit.prevent="handleRequestCode" class="login-form">
        <div class="form-group">
          <label class="form-label">Email Address</label>
          <div class="input-wrapper">
            <PhEnvelopeSimple class="input-icon" :size="20" />
            <input
              id="recovery-email"
              type="email"
              class="input-field with-icon"
              placeholder="you@example.com"
              v-model="email"
              required
            />
          </div>
        </div>

        <button type="submit" class="btn-primary w-full" :disabled="loading">
          <span v-if="loading" class="spinner"></span>
          {{ loading ? 'Sending Code...' : 'Send Recovery Code' }}
        </button>
      </form>

      <!-- Step 2: Enter Pin & New Password -->
      <form v-else @submit.prevent="handleResetPassword" class="login-form">
        <div class="form-group">
          <label class="form-label">Verification Code (6 digits)</label>
          <div class="input-wrapper">
            <PhKey class="input-icon" :size="20" />
            <input
              id="recovery-code"
              type="text"
              class="input-field with-icon"
              placeholder="Enter 6-digit code"
              v-model="token"
              maxlength="6"
              required
            />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">New Password</label>
          <div class="input-wrapper">
            <PhLockKey class="input-icon" :size="20" />
            <input
              id="new-password"
              type="password"
              class="input-field with-icon"
              placeholder="Min. 6 characters"
              v-model="newPassword"
              required
            />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Confirm New Password</label>
          <div class="input-wrapper">
            <PhLockKey class="input-icon" :size="20" />
            <input
              id="confirm-password"
              type="password"
              class="input-field with-icon"
              placeholder="Repeat your password"
              v-model="confirmPassword"
              required
            />
          </div>
        </div>

        <button type="submit" class="btn-primary w-full" :disabled="loading">
          <span v-if="loading" class="spinner"></span>
          {{ loading ? 'Resetting Password...' : 'Reset Password' }}
        </button>
      </form>

      <p class="signup-prompt" style="margin-top: 1rem;">
        Remember your password?
        <a href="#" @click.prevent="router.push('/login')">Log in</a>
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

/* Error/Success Banners */
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

.success-banner {
  background-color: rgba(74, 222, 128, 0.1);
  color: #4ade80;
  border: 1px solid rgba(74, 222, 128, 0.2);
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

/* Prompt link */
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
