<script setup>
import { useRouter } from 'vue-router'
import { PhMapPin, PhCalendarCheck, PhShieldCheck, PhClock } from '@phosphor-icons/vue'

const router = useRouter()

const getStarted = () => router.push('/signup')
const login = () => router.push('/login')
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
          <button class="btn-secondary w-full mt-4" @click="login">
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
</style>

