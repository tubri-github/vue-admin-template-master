<!--
  ImportProgress.vue
  Component for showing import progress and polling status
-->
<template>
  <div class="import-progress">
    <el-card>
      <div slot="header" class="clearfix">
        <span class="font-medium">
          <i class="el-icon-loading text-blue-500 mr-2" />
          Import in Progress
        </span>
      </div>

      <div class="progress-content">
        <!-- Progress indicator -->
        <div class="text-center mb-6">
          <div class="progress-circle mb-4">
            <el-progress
              type="circle"
              :percentage="progressPercentage"
              :width="120"
              :stroke-width="8"
              :status="progressStatus"
            >
              <template slot="default">
                <span class="progress-text">
                  {{ progressPercentage }}%
                </span>
              </template>
            </el-progress>
          </div>

          <div class="progress-info">
            <div class="text-lg font-medium text-gray-900 mb-2">
              {{ statusMessage }}
            </div>
            <div class="text-sm text-gray-500">
              {{ importMode === 'verbatim' ? 'Verbatim Import Mode' : 'Direct Import Mode' }}
            </div>
          </div>
        </div>

        <!-- Import details -->
        <div v-if="importStatus" class="import-details">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="File Name">
              {{ importStatus.fileName || 'Unknown' }}
            </el-descriptions-item>
            <el-descriptions-item label="Total Records">
              {{ importStatus.totalRecords || 0 }}
            </el-descriptions-item>
            <el-descriptions-item label="Status">
              <el-tag :type="getStatusTagType(importStatus.status)">
                {{ getStatusLabel(importStatus.status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="Import Mode">
              <el-tag :type="importMode === 'verbatim' ? 'info' : 'primary'">
                {{ importMode === 'verbatim' ? 'Verbatim' : 'Direct' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item v-if="importStatus.startTime" label="Start Time">
              {{ formatDateTime(importStatus.startTime) }}
            </el-descriptions-item>
            <el-descriptions-item v-if="importStatus.batchSerialId" label="Batch Serial ID">
              {{ importStatus.batchSerialId }}
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- Progress messages -->
        <div class="progress-messages mt-4">
          <div class="flex items-center text-sm text-gray-600">
            <i class="el-icon-info text-blue-500 mr-2" />
            This process may take several minutes depending on the file size and data complexity.
          </div>

          <div v-if="importMode === 'verbatim'" class="flex items-center text-sm text-blue-600 mt-2">
            <i class="el-icon-document-copy mr-2" />
            Verbatim mode: All records will be imported, including invalid ones for manual review.
          </div>

          <div v-else class="flex items-center text-sm text-green-600 mt-2">
            <i class="el-icon-check mr-2" />
            Direct mode: Only valid records will be imported with automatic processing.
          </div>
        </div>

        <!-- Error message -->
        <el-alert
          v-if="errorMessage"
          title="Import Error"
          type="error"
          :description="errorMessage"
          :closable="false"
          show-icon
          class="mt-4"
        />
      </div>
    </el-card>
  </div>
</template>

<script>
import { getImportStatus } from '@/api/fileprocessor'

export default {
  name: 'ImportProgress',
  props: {
    fileId: {
      type: String,
      required: true
    },
    importMode: {
      type: String,
      default: 'direct'
    }
  },
  data() {
    return {
      importStatus: null,
      errorMessage: '',
      pollingInterval: null,
      pollingAttempts: 0,
      maxPollingAttempts: 120 // 5 minutes with 2.5s intervals
    }
  },
  computed: {
    progressPercentage() {
      if (!this.importStatus) return 0

      const status = this.importStatus.status
      if (status === 'in_progress') return 50
      if (status === 'completed') return 100
      if (status === 'failed') return 100

      return 0
    },

    progressStatus() {
      if (!this.importStatus) return null

      const status = this.importStatus.status
      if (status === 'completed') return 'success'
      if (status === 'failed') return 'exception'

      return null // Active state
    },

    statusMessage() {
      if (!this.importStatus) return 'Starting import...'

      const status = this.importStatus.status
      switch (status) {
        case 'in_progress':
          return 'Processing data...'
        case 'completed':
          return 'Import completed successfully!'
        case 'failed':
          return 'Import failed'
        default:
          return 'Processing...'
      }
    }
  },
  mounted() {
    this.startPolling()
  },
  beforeDestroy() {
    this.stopPolling()
  },
  methods: {
    // Start polling for import status
    startPolling() {
      // Initial check
      this.checkImportStatus()

      // Set up polling interval
      this.pollingInterval = setInterval(() => {
        this.checkImportStatus()
      }, 2500) // Check every 2.5 seconds
    },

    // Stop polling
    stopPolling() {
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval)
        this.pollingInterval = null
      }
    },

    // Check import status
    async checkImportStatus() {
      try {
        this.pollingAttempts++

        const response = await getImportStatus(this.fileId)

        if (response.code === 20000) {
          this.importStatus = response.data

          // Check if import is complete
          if (this.importStatus.status === 'completed') {
            this.stopPolling()
            this.$emit('complete', this.importStatus)
          } else if (this.importStatus.status === 'failed') {
            this.stopPolling()
            this.errorMessage = this.importStatus.error || 'Import failed for unknown reason'
            this.$emit('error', this.errorMessage)
          }
        } else {
          console.warn('Failed to get import status:', response.message)
        }
      } catch (error) {
        console.error('Error checking import status:', error)

        // If we've exceeded max attempts, stop polling and emit error
        if (this.pollingAttempts >= this.maxPollingAttempts) {
          this.stopPolling()
          this.errorMessage = 'Import status check timeout - please check manually'
          this.$emit('error', this.errorMessage)
        }
      }
    },

    // Get status tag type for display
    getStatusTagType(status) {
      const types = {
        'in_progress': 'primary',
        'completed': 'success',
        'failed': 'danger'
      }
      return types[status] || 'info'
    },

    // Get status label for display
    getStatusLabel(status) {
      const labels = {
        'in_progress': 'In Progress',
        'completed': 'Completed',
        'failed': 'Failed'
      }
      return labels[status] || status
    },

    // Format date/time string
    formatDateTime(dateTimeString) {
      if (!dateTimeString) return ''

      try {
        const date = new Date(dateTimeString)
        return date.toLocaleString()
      } catch (error) {
        return dateTimeString
      }
    }
  }
}
</script>

<style scoped>
.import-progress {
  max-width: 800px;
  margin: 0 auto;
}

.progress-content {
  padding: 2rem 1rem;
}

.progress-circle {
  display: flex;
  justify-content: center;
}

.progress-text {
  font-size: 1.25rem;
  font-weight: 600;
  color: #374151;
}

.progress-info {
  text-align: center;
}

.import-details {
  background-color: #f9fafb;
  border-radius: 0.5rem;
  padding: 1rem;
}

.progress-messages {
  border-top: 1px solid #e5e7eb;
  padding-top: 1rem;
}

.progress-messages > div {
  display: flex;
  align-items: center;
}
</style>
