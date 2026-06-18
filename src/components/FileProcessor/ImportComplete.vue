<!--
  ImportComplete.vue
  Component for displaying import completion status
-->
<template>
  <div class="import-complete">
    <el-card>
      <div slot="header" class="clearfix">
        <span class="font-medium" :class="headerClass">
          <i :class="headerIcon + ' mr-2'" />
          {{ headerTitle }}
        </span>
      </div>

      <div class="completion-content">
        <!-- Success icon and message -->
        <div class="text-center mb-6">
          <div class="completion-icon mb-4" :class="iconClass">
            <i :class="iconName" />
          </div>

          <h3 class="text-xl font-semibold mb-2" :class="titleClass">
            {{ completionTitle }}
          </h3>

          <p class="text-gray-600 completion-description">
            {{ completionDescription }}
          </p>
        </div>

        <!-- Import statistics -->
        <div class="import-statistics mb-6">
          <el-row :gutter="20">
            <el-col :span="8">
              <div class="stat-card total">
                <div class="stat-icon">
                  <i class="el-icon-files" />
                </div>
                <div class="stat-content">
                  <div class="stat-value">{{ totalRecords }}</div>
                  <div class="stat-label">Total Records</div>
                </div>
              </div>
            </el-col>

            <el-col :span="8">
              <div class="stat-card success">
                <div class="stat-icon">
                  <i class="el-icon-check" />
                </div>
                <div class="stat-content">
                  <div class="stat-value">{{ importedRecords }}</div>
                  <div class="stat-label">{{ importMode === 'verbatim' ? 'All Imported' : 'Imported' }}</div>
                </div>
              </div>
            </el-col>

            <el-col :span="8">
              <div v-if="importMode !== 'verbatim' && skippedRecords > 0" class="stat-card warning">
                <div class="stat-icon">
                  <i class="el-icon-warning" />
                </div>
                <div class="stat-content">
                  <div class="stat-value">{{ skippedRecords }}</div>
                  <div class="stat-label">Skipped</div>
                </div>
              </div>
              <div v-else class="stat-card info">
                <div class="stat-icon">
                  <i class="el-icon-info" />
                </div>
                <div class="stat-content">
                  <div class="stat-value">{{ importMode === 'verbatim' ? 'Yes' : successRate + '%' }}</div>
                  <div class="stat-label">{{ importMode === 'verbatim' ? 'Review Needed' : 'Success Rate' }}</div>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>

        <!-- Import details -->
        <div class="import-details mb-6">
          <el-descriptions :column="2" size="small" border>
            <el-descriptions-item label="File Name">
              {{ importResult.fileName || 'Unknown' }}
            </el-descriptions-item>
            <el-descriptions-item label="Import Mode">
              <el-tag :type="importMode === 'verbatim' ? 'info' : 'primary'">
                {{ importMode === 'verbatim' ? 'Verbatim Import' : 'Direct Import' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item v-if="importResult.batchSerialId" label="Batch Serial ID">
              {{ importResult.batchSerialId }}
            </el-descriptions-item>
            <el-descriptions-item label="Import Date">
              {{ formatDate(new Date()) }}
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- Import mode specific information -->
        <el-alert
          v-if="importMode === 'verbatim'"
          title="Verbatim Import Completed"
          type="info"
          :closable="false"
          show-icon
          class="mb-6"
        >
          <template slot>
            All records have been imported as-is. Please review and verify the data in the system.
            Invalid records will need manual correction.
          </template>
        </el-alert>

        <el-alert
          v-else-if="skippedRecords > 0"
          title="Some Records Were Skipped"
          type="warning"
          :closable="false"
          show-icon
          class="mb-6"
        >
          <template slot>
            {{ skippedRecords }} records were skipped due to validation issues.
            Consider using Verbatim Import mode to import all records for manual review.
          </template>
        </el-alert>

        <!-- Action buttons -->
        <div class="action-buttons">
          <el-button
            type="primary"
            size="medium"
            icon="el-icon-view"
            class="action-button primary"
            @click="viewRecords"
          >
            View Imported Records
          </el-button>

          <el-button
            v-if="importMode === 'verbatim'"
            type="success"
            size="medium"
            icon="el-icon-s-check"
            class="action-button"
            @click="goToBatchReview"
          >
            Go to Batch Review
          </el-button>

          <el-button
            size="medium"
            icon="el-icon-upload2"
            class="action-button secondary"
            @click="importMore"
          >
            Import More Data
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'ImportComplete',
  props: {
    // Legacy props for backward compatibility
    validRecords: {
      type: Number,
      default: 0
    },
    problemRecords: {
      type: Number,
      default: 0
    },
    // New prop for complete import result
    importResult: {
      type: Object,
      default: () => ({
        status: 'completed',
        fileName: '',
        totalRecords: 0,
        importedCount: 0,
        skippedCount: 0,
        success: true,
        importMode: 'direct',
        batchSerialId: '',
        error: null
      })
    }
  },
  computed: {
    // Determine import mode
    importMode() {
      return this.importResult.importMode || 'direct'
    },

    // Calculate total records
    totalRecords() {
      return this.importResult.totalRecords ||
        (this.validRecords + this.problemRecords) || 0
    },

    // Calculate imported records
    importedRecords() {
      return this.importResult.importedCount || this.validRecords || 0
    },

    // Calculate skipped records
    skippedRecords() {
      return this.importResult.skippedCount || this.problemRecords || 0
    },

    // Calculate success rate
    successRate() {
      if (this.totalRecords === 0) return 100
      return Math.round((this.importedRecords / this.totalRecords) * 100)
    },

    // Determine if import was successful
    isSuccess() {
      return this.importResult.success !== false &&
        this.importResult.status !== 'failed'
    },

    // Header styling based on status
    headerClass() {
      return this.isSuccess ? 'text-green-600' : 'text-red-600'
    },

    headerIcon() {
      return this.isSuccess ? 'el-icon-circle-check' : 'el-icon-circle-close'
    },

    headerTitle() {
      return this.isSuccess ? 'Import Completed' : 'Import Failed'
    },

    // Icon styling
    iconClass() {
      return this.isSuccess ? 'success-icon' : 'error-icon'
    },

    iconName() {
      return this.isSuccess ? 'el-icon-success' : 'el-icon-error'
    },

    // Title styling
    titleClass() {
      return this.isSuccess ? 'text-green-600' : 'text-red-600'
    },

    completionTitle() {
      if (!this.isSuccess) {
        return 'Import Failed!'
      }

      if (this.importMode === 'verbatim') {
        return 'Verbatim Import Successful!'
      }

      if (this.skippedRecords > 0) {
        return 'Import Completed with Issues!'
      }

      return 'Import Successful!'
    },

    completionDescription() {
      if (!this.isSuccess) {
        return this.importResult.error || 'The import process encountered an error.'
      }

      if (this.importMode === 'verbatim') {
        return `Successfully imported all ${this.importedRecords} records in verbatim mode. Please review the data for validation.`
      }

      if (this.skippedRecords > 0) {
        return `Successfully imported ${this.importedRecords} valid records. ${this.skippedRecords} records were skipped due to validation issues.`
      }

      return `Successfully imported all ${this.importedRecords} records with no issues.`
    }
  },
  methods: {
    goToBatchReview() {
      // 跳转到 VerbatimWorkspace (Batch Review) 并带上 batchSerialId
      // 路由实际是 /fileprocessor/review（name: reviewulm），之前写成 verbatim-workspace 导致跳转失败
      this.$router.push({
        name: 'reviewulm',
        query: {
          batchId: this.importResult.batchSerialId
        }
      })
    },

    viewRecords() {
      this.$emit('view-records')
    },

    importMore() {
      this.$emit('import-more')
    },

    formatDate(date) {
      return date.toLocaleString()
    }
  }
}
</script>

<style scoped>
.import-complete {
  max-width: 800px;
  margin: 0 auto;
}

.completion-content {
  padding: 2rem 1rem;
}

.completion-icon {
  width: 80px;
  height: 80px;
  font-size: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}

.success-icon {
  background-color: #f0f9eb;
  color: #67c23a;
}

.error-icon {
  background-color: #fef0f0;
  color: #f56c6c;
}

.completion-description {
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

/* Statistics cards */
.import-statistics {
  margin: 2rem 0;
}

.stat-card {
  display: flex;
  align-items: center;
  padding: 1rem;
  border-radius: 0.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  background: white;
  border: 1px solid #e5e7eb;
}

.stat-icon {
  font-size: 1.5rem;
  margin-right: 1rem;
  width: 2.5rem;
  text-align: center;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1.2;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.stat-card.total .stat-icon {
  color: #3b82f6;
}

.stat-card.success .stat-icon {
  color: #10b981;
}

.stat-card.warning .stat-icon {
  color: #f59e0b;
}

.stat-card.info .stat-icon {
  color: #6b7280;
}

/* Import details */
.import-details {
  background-color: #f9fafb;
  border-radius: 0.5rem;
  padding: 1rem;
}

/* Action buttons */
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-width: 400px;
  margin: 0 auto;
}

.action-button {
  width: 100%;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-button.primary {
  background-color: #1f2937;
  border-color: #1f2937;
}

.action-button.primary:hover {
  background-color: #111827;
  border-color: #111827;
}

.action-button.secondary {
  background-color: #f3f4f6;
  border-color: #d1d5db;
  color: #374151;
}

.action-button.secondary:hover {
  background-color: #e5e7eb;
  border-color: #9ca3af;
}

/* Responsive design */
@media (max-width: 768px) {
  .completion-content {
    padding: 1rem 0.5rem;
  }

  .action-buttons {
    max-width: 100%;
  }
}
</style>
