<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { 
  PhGear, 
  PhArrowLeft, 
  PhMapPin, 
  PhWrench, 
  PhChartLine, 
  PhUsers, 
  PhActivity, 
  PhClock, 
  PhSignOut,
  PhHouseLine,
  PhCheckCircle
} from '@phosphor-icons/vue'
import { useAuth } from '../composables/useAuth'
import { getParks } from '../api/parks'
import { getPendingReports, resolveReport } from '../api/sensors'

const router = useRouter()
const { user, logout } = useAuth()

const displayName = computed(() => user.value?.name || 'Administrator')
const initials = computed(() => {
  const name = user.value?.name || ''
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'AD'
})

const parks = ref([])
const activeSessionsCount = ref(24) 
const activeAlertsCount = ref(0) 
const loading = ref(true)

const maintenanceAlerts = ref([])
const alertsLoading = ref(true)

const fetchPendingAlerts = async () => {
  alertsLoading.value = true
  try {
    const data = await getPendingReports()
    maintenanceAlerts.value = data.map(item => {
      const parkName = item.Sensor?.Vaga?.Zona?.ParqueEstacionamento?.nome || 'N/A'
      const zoneName = item.Sensor?.Vaga?.Zona?.nome_zona || ''
      const spotName = item.Sensor?.Vaga?.numero_vaga || ''
      const reportedBy = item.Utilizador?.nome ? `Reported by ${item.Utilizador.nome}` : 'Reported by Client'
      
      const formattedDate = new Date(item.data_avaria).toLocaleString('pt-PT', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })

      return {
        id: item.id_manutencao,
        sensor: `SN-${item.id_sensor} (${zoneName} - Vaga ${spotName})`,
        park: parkName,
        issue: item.descricao_problema,
        severity: item.estado_manutencao === 'Reportado' ? 'High' : 'Medium',
        date: formattedDate,
        reportedBy
      }
    })
    activeAlertsCount.value = maintenanceAlerts.value.length
  } catch (err) {
    console.error('Error fetching pending alerts:', err)
  } finally {
    alertsLoading.value = false
  }
}

// Fetch real parks data
onMounted(async () => {
  try {
    const data = await getParks()
    parks.value = data
  } catch (err) {
    console.error('Error fetching parks:', err)
  } finally {
    loading.value = false
  }

  fetchPendingAlerts()
})

// Statistics calculations
const totalSpotsCount = computed(() => {
  let count = 0
  parks.value.forEach(p => {
    if (p.spots) {
      const parts = p.spots.split('/')
      if (parts.length === 2) {
        count += parseInt(parts[1], 10) || 0
      }
    }
  })
  return count || 180 
})

const occupiedSpotsCount = computed(() => {
  let total = totalSpotsCount.value
  let available = 0
  parks.value.forEach(p => {
    if (p.spots) {
      const parts = p.spots.split('/')
      if (parts.length === 2) {
        available += parseInt(parts[0], 10) || 0
      }
    }
  })
  return total - available
})

const occupancyRate = computed(() => {
  if (totalSpotsCount.value === 0) return '0%'
  const rate = (occupiedSpotsCount.value / totalSpotsCount.value) * 100
  return `${Math.round(rate)}%`
})

const mockSystemLogs = ref([
  { id: 1, action: 'Gateway Pintos connected successfully', time: '10m ago', type: 'success' },
  { id: 2, action: 'Price configuration set to default standard', time: '1h ago', type: 'info' },
  { id: 3, action: 'Daily occupancy report generated', time: '5h ago', type: 'info' }
])

const handleResolveAlert = async (id) => {
  try {
    const alert = maintenanceAlerts.value.find(a => a.id === id)
    await resolveReport({ id_manutencao: id, novo_estado_sensor: 'LIVRE' })
    
    await fetchPendingAlerts()
    
    mockSystemLogs.value.unshift({
      id: Date.now(),
      action: `Alert for ${alert?.sensor || 'Sensor'} resolved by admin`,
      time: 'Just now',
      type: 'success'
    })
  } catch (err) {
    console.error('Error resolving alert:', err)
    alert('Erro ao resolver alerta de sensor: ' + (err.message || err.error || ''))
  }
}

const handleSignOut = () => {
  logout()
}

const goToProfile = () => {
  router.push('/profile')
}
</script>

<template>
  <div class="page-container">
    <header class="header justify-between">
      <div class="admin-badge">SYSTEM PORTAL</div>
      <div class="header-actions">
        <button class="icon-btn mr-2" @click="goToProfile" title="Profile Settings">
          <PhGear :size="24" />
        </button>
        <button class="icon-btn text-danger" @click="handleSignOut" title="Sign Out">
          <PhSignOut :size="24" />
        </button>
      </div>
    </header>

    <main class="content">
      <div class="user-greeting">
        <div class="avatar admin-avatar">{{ initials }}</div>
        <div class="greeting-text">
          <p>Logged in as Administrator</p>
          <h2>{{ displayName }}</h2>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="stats-grid">
        <div class="stat-card bg-card radius-lg">
          <div class="icon-wrapper cyan">
            <PhChartLine :size="20" weight="bold" />
          </div>
          <h3>{{ occupancyRate }}</h3>
          <p>Occupancy Rate</p>
        </div>
        
        <div class="stat-card bg-card radius-lg">
          <div class="icon-wrapper green">
            <PhActivity :size="20" weight="bold" />
          </div>
          <h3>{{ activeSessionsCount }}</h3>
          <p>Active Bookings</p>
        </div>

        <div class="stat-card bg-card radius-lg">
          <div class="icon-wrapper red">
            <PhWrench :size="20" weight="bold" />
          </div>
          <h3>{{ activeAlertsCount }}</h3>
          <p>Maintenance Alerts</p>
        </div>
      </div>

      <!-- Occupancy Breakdown Section -->
      <div class="dashboard-section">
        <h3 class="section-title">Live Parks Occupancy</h3>
        <div class="parks-list bg-card radius-lg border-primary">
          <div v-if="loading" class="loading-state">
            <span class="spinner"></span> Loading parks data...
          </div>
          <div v-else-if="parks.length === 0" class="no-parks">
            No parking lots found.
          </div>
          <div v-else v-for="(park, index) in parks" :key="park.id" class="park-admin-item">
            <div class="park-detail">
              <div class="park-name-row">
                <PhMapPin :size="16" class="text-cyan" />
                <span class="park-title">{{ park.name }}</span>
              </div>
              <span class="park-sub text-secondary">{{ park.distance }} away • {{ park.price }}/h</span>
            </div>
            
            <div class="park-status-container">
              <span class="spots-badge">{{ park.spots }} spots</span>
              <span class="status-indicator" :class="{ 'avail': park.isAvailable }">
                {{ park.isAvailable ? 'Active' : 'Full' }}
              </span>
            </div>
            
            <div class="divider-full" v-if="index < parks.length - 1"></div>
          </div>
        </div>
      </div>

      <!-- Maintenance Alerts -->
      <div class="dashboard-section mt-6">
        <h3 class="section-title">Critical Sensor Alerts</h3>
        <div class="alerts-list">
          <div v-if="alertsLoading" class="loading-state">
            <span class="spinner"></span> Loading alerts...
          </div>
          <div v-else-if="maintenanceAlerts.length === 0" class="alert-empty bg-card radius-lg">
            <PhCheckCircle :size="24" class="text-green" />
            <span>All parking sensors are fully operational. No alerts.</span>
          </div>
          <div v-else v-for="alert in maintenanceAlerts" :key="alert.id" class="alert-card bg-card radius-lg">
            <div class="alert-header">
              <div class="alert-badge" :class="alert.severity.toLowerCase()">
                {{ alert.severity }} Priority
              </div>
              <span class="alert-time">{{ alert.date }}</span>
            </div>
            <div class="alert-body">
              <strong>Sensor: {{ alert.sensor }}</strong>
              <p>{{ alert.issue }}</p>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-2);">
                <span class="alert-park text-secondary" style="font-size: 0.8rem;">{{ alert.park }}</span>
                <span class="alert-reporter text-cyan" style="font-size: 0.8rem; font-weight: 500;">{{ alert.reportedBy }}</span>
              </div>
            </div>
            <button class="btn-resolve" @click="handleResolveAlert(alert.id)">
              Mark as Resolved
            </button>
          </div>
        </div>
      </div>

      <!-- System Operation Logs -->
      <div class="dashboard-section mt-6 mb-8">
        <h3 class="section-title">System Operations Log</h3>
        <div class="system-logs bg-card radius-lg">
          <div v-for="log in mockSystemLogs" :key="log.id" class="log-item">
            <div class="log-left">
              <span class="log-dot" :class="log.type"></span>
              <span class="log-action">{{ log.action }}</span>
            </div>
            <span class="log-time text-secondary">{{ log.time }}</span>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.content {
  padding: 0 var(--spacing-4) var(--spacing-8);
  flex: 1;
}

.admin-badge {
  background-color: rgba(0, 212, 255, 0.1);
  color: var(--color-accent-cyan);
  border: 1px solid rgba(0, 212, 255, 0.3);
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 1px;
}

.header-actions {
  display: flex;
  align-items: center;
}

.mr-2 {
  margin-right: var(--spacing-2);
}

.icon-btn {
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.icon-btn:hover {
  color: var(--color-text-primary);
  background-color: var(--color-bg-card);
}

.icon-btn.text-danger:hover {
  color: var(--color-status-occupied);
}

.text-danger {
  color: var(--color-text-secondary);
}

.user-greeting {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-6);
}

.avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 700;
}

.admin-avatar {
  background: linear-gradient(135deg, var(--color-accent-cyan), #0077aa);
  color: var(--color-bg-base);
  box-shadow: 0 4px 12px rgba(0, 212, 255, 0.3);
}

.greeting-text p {
  color: var(--color-text-secondary);
  font-size: 0.85rem;
}

.greeting-text h2 {
  font-size: 1.5rem;
  font-weight: 600;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-8);
}

.stat-card {
  padding: var(--spacing-3);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  border: 1px solid var(--color-border);
}

.icon-wrapper {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--spacing-2);
}

.icon-wrapper.cyan { background-color: rgba(0, 212, 255, 0.15); color: var(--color-accent-cyan); }
.icon-wrapper.green { background-color: rgba(34, 197, 94, 0.15); color: var(--color-status-free); }
.icon-wrapper.red { background-color: rgba(239, 68, 68, 0.15); color: var(--color-status-occupied); }

.stat-card h3 {
  font-size: 1.25rem;
  font-weight: 700;
}

.stat-card p {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

/* Dashboard Section */
.dashboard-section {
  display: flex;
  flex-direction: column;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: var(--spacing-3);
  color: var(--color-text-primary);
}

.border-primary {
  border: 1px solid var(--color-border);
}

.parks-list {
  padding: var(--spacing-4);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.park-admin-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  padding: var(--spacing-1) 0;
  position: relative;
}

.park-detail {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.park-name-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.park-title {
  font-weight: 600;
  font-size: 0.95rem;
}

.park-sub {
  font-size: 0.8rem;
  padding-left: 1.5rem;
}

.park-status-container {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.spots-badge {
  font-size: 0.8rem;
  background-color: var(--color-bg-card-lighter);
  border: 1px solid var(--color-border);
  padding: 0.2rem 0.5rem;
  border-radius: var(--radius-sm);
  color: var(--color-text-primary);
}

.status-indicator {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.2rem 0.6rem;
  border-radius: var(--radius-full);
  text-transform: uppercase;
  background-color: rgba(239, 68, 68, 0.15);
  color: var(--color-status-occupied);
  border: 1px solid var(--color-status-occupied);
}

.status-indicator.avail {
  background-color: rgba(34, 197, 94, 0.15);
  color: var(--color-status-free);
  border: 1px solid var(--color-status-free);
}

.divider-full {
  width: 100%;
  height: 1px;
  background-color: var(--color-border);
  margin-top: var(--spacing-3);
}

/* Alerts List */
.alerts-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.alert-empty {
  padding: var(--spacing-4);
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.alert-card {
  padding: var(--spacing-4);
  border: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.alert-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.alert-badge {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.15rem 0.5rem;
  border-radius: var(--radius-sm);
  text-transform: uppercase;
}

.alert-badge.high {
  background-color: rgba(239, 68, 68, 0.15);
  color: var(--color-status-occupied);
  border: 1px solid var(--color-status-occupied);
}

.alert-badge.medium {
  background-color: rgba(234, 179, 8, 0.15);
  color: var(--color-status-reserved);
  border: 1px solid var(--color-status-reserved);
}

.alert-badge.low {
  background-color: rgba(59, 130, 246, 0.15);
  color: #3b82f6;
  border: 1px solid #3b82f6;
}

.alert-time {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.alert-body Strong {
  font-size: 0.9rem;
  display: block;
  margin-bottom: 0.2rem;
}

.alert-body p {
  font-size: 0.85rem;
  color: var(--color-text-primary);
  margin-bottom: 0.25rem;
}

.alert-park {
  font-size: 0.8rem;
}

.btn-resolve {
  width: 100%;
  background-color: var(--color-bg-card-lighter);
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
  padding: 0.5rem;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  font-weight: 600;
  transition: all 0.2s ease;
  cursor: pointer;
}

.btn-resolve:hover {
  background-color: var(--color-status-free);
  color: #000000;
  border-color: var(--color-status-free);
}

/* System Logs */
.system-logs {
  padding: var(--spacing-4);
  border: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  max-height: 250px;
  overflow-y: auto;
}

.log-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
}

.log-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.log-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.log-dot.success { background-color: var(--color-status-free); }
.log-dot.info { background-color: var(--color-accent-cyan); }
.log-dot.warning { background-color: var(--color-status-reserved); }

.log-action {
  color: var(--color-text-primary);
}

.log-time {
  font-size: 0.75rem;
}

.text-green {
  color: var(--color-status-free);
}

.text-cyan {
  color: var(--color-accent-cyan);
}

.loading-state {
  text-align: center;
  padding: var(--spacing-4);
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(0, 212, 255, 0.3);
  border-top-color: var(--color-accent-cyan);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
