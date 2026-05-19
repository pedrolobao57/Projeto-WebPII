<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { PhMapPin, PhCalendarCheck, PhShieldCheck, PhClock, PhEnvelopeSimple, PhLockKey, PhX } from '@phosphor-icons/vue'
import { loginUser } from '../api/users'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const { saveSession } = useAuth()

// --- Login Modal State ---
const showLoginModal = ref(false)
const loginEmail = ref('')
const loginPassword = ref('')
const loginError = ref('')
const loginLoading = ref(false)

const getStarted = () => {
  router.push('/signup')
}

const openLoginModal = () => {
  loginEmail.value = ''
  loginPassword.value = ''
  loginError.value = ''
  showLoginModal.value = true
}

const closeLoginModal = () => {
  showLoginModal.value = false
}

const handleLogin = async () => {
  if (!loginEmail.value || !loginPassword.value) {
    loginError.value = 'Please fill in all fields.'
    return
  }
  loginLoading.value = true
  loginError.value = ''
  try {
    const response = await loginUser({ email: loginEmail.value, password: loginPassword.value })
    saveSession(response.token, response.user)
    router.push('/dashboard')
  } catch (err) {
    loginError.value = err.message || 'Invalid email or password.'
  } finally {
    loginLoading.value = false
  }
}
</script>

<template>
  <div class="landing-container">
    <header class="top-nav">
      <div class="logo">
        <PhMapPin :size="24" color="var(--color-accent-cyan)" weight="fill" />
        <span>ParkSmart</span>
      </div>
    </header>

    <main>
      <section class="hero">
        <h1>Never Waste Time <br><span class="text-cyan">Looking for Parking</span></h1>
        <p class="subtitle">Find, reserve, and pay for parking spots in seconds. Smart parking made simple.</p>
        
        <div class="mockup-card bg-card radius-lg">
          <div class="mockup-content">
            <div class="dot red"></div>
            <div class="dot green"></div>
            <div class="mockup-info">
              <span class="location-name">Downtown Plaza</span>
              <span class="location-dist">0.2 mi away</span>
            </div>
          </div>
        </div>

        <div class="stats-row">
          <div class="stat-item">
            <h3>50K+</h3>
            <span>Active Users</span>
          </div>
          <div class="divider"></div>
          <div class="stat-item">
            <h3>200+</h3>
            <span>Parking Lots</span>
          </div>
          <div class="divider"></div>
          <div class="stat-item">
            <h3>4.9<span class="star">★</span></h3>
            <span>App Rating</span>
          </div>
        </div>

        <div class="action-buttons">
          <button class="btn-primary w-full" @click="getStarted">
            Get Started <span class="arrow">→</span>
          </button>
          <button class="btn-secondary w-full mt-4" @click="openLoginModal">
            Log In
          </button>
        </div>
      </section>

      <section class="features">
        <h2 class="section-title">Why Choose ParkSmart?</h2>
        <p class="section-subtitle">Everything you need for hassle-free parking.</p>
        
        <div class="features-grid">
          <div class="feature-card bg-card radius-md">
            <div class="icon-wrapper">
              <PhMapPin :size="20" color="var(--color-accent-cyan)" weight="fill" />
            </div>
            <h4>Smart Parking Finder</h4>
            <p>Find available spots in real-time near your destination.</p>
          </div>

          <div class="feature-card bg-card radius-md">
            <div class="icon-wrapper">
              <PhCalendarCheck :size="20" color="var(--color-accent-cyan)" weight="fill" />
            </div>
            <h4>Instant Booking</h4>
            <p>Reserve your spot in seconds with one-tap booking.</p>
          </div>

          <div class="feature-card bg-card radius-md">
            <div class="icon-wrapper">
              <PhShieldCheck :size="20" color="var(--color-accent-cyan)" weight="fill" />
            </div>
            <h4>Secure & Safe</h4>
            <p>24/7 security monitoring and guaranteed spot protection.</p>
          </div>

          <div class="feature-card bg-card radius-md">
            <div class="icon-wrapper">
              <PhClock :size="20" color="var(--color-accent-cyan)" weight="fill" />
            </div>
            <h4>Save Time</h4>
            <p>No more circling around. Navigate directly to your spot.</p>
          </div>
        </div>
      </section>

      <section class="cta-section">
        <h2 class="section-title">Ready to Park Smarter?</h2>
        <p class="section-subtitle">Join thousands of drivers saving time every day.</p>
        
        <button class="btn-primary w-full" @click="getStarted">
          Start Free Trial
        </button>
        <p class="terms-text">No credit card required • Cancel anytime</p>
      </section>
    </main>
    
    <footer>
      <p>Available on iOS and Android</p>
      <p class="copyright">© 2026 ParkSmart. All rights reserved.</p>
    </footer>

    <!-- Login Modal -->
    <Transition name="modal">
      <div v-if="showLoginModal" class="modal-overlay" @click.self="closeLoginModal">
        <div class="modal-sheet">
          <div class="modal-header">
            <h2>Welcome Back</h2>
            <button class="close-btn" @click="closeLoginModal">
              <PhX :size="22" />
            </button>
          </div>
          <p class="modal-subtitle">Sign in to your ParkSmart account</p>

          <div v-if="loginError" class="error-banner">{{ loginError }}</div>

          <form @submit.prevent="handleLogin" class="login-form">
            <div class="input-group">
              <PhEnvelopeSimple class="input-icon" :size="20" />
              <input
                id="login-email"
                type="email"
                placeholder="Email Address"
                v-model="loginEmail"
                autocomplete="email"
              />
            </div>
            <div class="input-group">
              <PhLockKey class="input-icon" :size="20" />
              <input
                id="login-password"
                type="password"
                placeholder="Password"
                v-model="loginPassword"
                autocomplete="current-password"
              />
            </div>
            <button type="submit" class="btn-primary w-full" :disabled="loginLoading">
              {{ loginLoading ? 'Signing in…' : 'Sign In' }}
            </button>
          </form>

          <p class="modal-footer-text">
            Don't have an account?
            <a href="#" @click.prevent="closeLoginModal(); getStarted()">Sign up</a>
          </p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.landing-container {
  max-width: 600px;
  margin: 0 auto;
  min-height: 100vh;
  padding: 0 var(--spacing-4) var(--spacing-8);
  display: flex;
  flex-direction: column;
}

.top-nav {
  padding: var(--spacing-6) 0;
  display: flex;
  justify-content: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.25rem;
  font-weight: 700;
}

.hero {
  text-align: center;
  margin-top: var(--spacing-4);
}

h1 {
  font-size: 2.5rem;
  line-height: 1.2;
  margin-bottom: var(--spacing-4);
  font-weight: 700;
}

.subtitle {
  color: var(--color-text-secondary);
  font-size: 1.05rem;
  margin-bottom: var(--spacing-8);
  padding: 0 var(--spacing-4);
}

.mockup-card {
  height: 200px;
  margin: 0 auto var(--spacing-8);
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: var(--spacing-4);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255,255,255,0.05);
}

.mockup-content {
  width: 80%;
  height: 60px;
  background-color: var(--color-bg-base);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  padding: 0 var(--spacing-4);
  position: relative;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  position: absolute;
}
.dot.red { background-color: var(--color-status-occupied); top: -40px; right: 20px; }
.dot.green { background-color: var(--color-status-free); top: -80px; left: 40px; }

.mockup-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.location-name {
  font-size: 0.9rem;
  font-weight: 600;
}

.location-dist {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.stats-row {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-8);
}

.stat-item h3 {
  font-size: 1.5rem;
  color: var(--color-accent-cyan);
  margin-bottom: 0.25rem;
}

.stat-item span {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.star {
  font-size: 1rem;
  margin-left: 2px;
}

.divider {
  width: 1px;
  height: 40px;
  background-color: var(--color-border);
}

.action-buttons {
  margin-bottom: var(--spacing-12);
}

.w-full {
  width: 100%;
}

.arrow {
  margin-left: 0.5rem;
}

.features {
  margin-bottom: var(--spacing-12);
}

.section-title {
  text-align: center;
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.section-subtitle {
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  margin-bottom: var(--spacing-8);
}

.features-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-4);
}

.feature-card {
  padding: var(--spacing-4);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
}

.icon-wrapper {
  background-color: var(--color-accent-cyan-transparent);
  padding: 0.5rem;
  border-radius: 50%;
  margin-bottom: var(--spacing-4);
}

.feature-card h4 {
  font-size: 0.95rem;
  margin-bottom: 0.5rem;
}

.feature-card p {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  line-height: 1.4;
}

.cta-section {
  text-align: center;
  padding: var(--spacing-8) 0;
  background-color: var(--color-bg-card);
  border-radius: var(--radius-lg);
  margin-bottom: var(--spacing-8);
}

.terms-text {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  margin-top: var(--spacing-4);
}

footer {
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 0.8rem;
  margin-top: auto;
}

.copyright {
  margin-top: 0.25rem;
  opacity: 0.5;
}

@media (max-width: 480px) {
  .features-grid {
    grid-template-columns: 1fr;
  }
}

/* ---- Login Modal ---- */
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-end;
  z-index: 100;
}

.modal-sheet {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  background-color: var(--color-bg-base);
  border-top-left-radius: var(--radius-xl);
  border-top-right-radius: var(--radius-xl);
  padding: var(--spacing-6) var(--spacing-4) var(--spacing-8);
  box-shadow: 0 -8px 40px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
}

.modal-header h2 {
  font-size: 1.5rem;
  font-weight: 700;
}

.close-btn {
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
}

.close-btn:hover {
  color: var(--color-text-primary);
}

.modal-subtitle {
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  margin-bottom: var(--spacing-6);
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.input-group {
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

.login-form input {
  width: 100%;
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1rem 1rem 1rem 3rem;
  color: var(--color-text-primary);
  font-size: 0.95rem;
  transition: border-color 0.2s ease;
  box-sizing: border-box;
}

.login-form input:focus {
  outline: none;
  border-color: var(--color-accent-cyan);
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

.modal-footer-text {
  text-align: center;
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  margin-top: var(--spacing-6);
}

.modal-footer-text a {
  color: var(--color-accent-cyan);
  font-weight: 600;
}

/* Vue Transition for modal slide-up */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.25s ease;
}
.modal-enter-active .modal-sheet,
.modal-leave-active .modal-sheet {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .modal-sheet,
.modal-leave-to .modal-sheet {
  transform: translateY(100%);
}
</style>

