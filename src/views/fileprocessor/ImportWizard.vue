<!--
  ImportWizard.vue
  Master component that integrates all steps of the import process
-->
<template>
  <div class="import-wizard">
    <el-card class="wizard-container">
      <div slot="header" class="wizard-header">
        <h2 class="text-xl font-medium">ULM Data Batch Import</h2>

        <!-- Step indicator -->
        <step-indicator
          :steps="steps"
          :current-step="currentStep"
        />
      </div>

      <!-- File Upload Step -->
      <div v-show="currentStep === 1" class="step-content">
        <upload-drop
          :action="uploadAction"
          :headers="uploadHeaders"
          :file-size="fileSize"
          :hint="uploadHint"
          :accept="acceptedFileTypes"
          :auto-upload="false"
          :multiple="false"
          @success="handleFileUploadSuccess"
          @error="handleFileUploadError"
          @file-change="handleFileChange"
        >
          <template #uploadTip>
            <el-button size="small" @click="downloadTemplate">
              <i class="el-icon-download" />
              Download Template
            </el-button>
          </template>
        </upload-drop>

        <!-- Upload button for manual upload -->
        <div v-if="selectedFile" class="upload-actions">
          <el-button
            type="primary"
            :loading="isUploading"
            icon="el-icon-upload2"
            @click="startUpload"
          >
            Upload File
          </el-button>
          <el-button @click="clearSelectedFile">
            Cancel
          </el-button>
        </div>
      </div>

      <!-- Field Mapping Step -->
      <div v-show="currentStep === 2" class="step-content">
        <field-mapping
          :file-name="fileName"
          :source-columns="sourceColumns"
          :initial-mappings="mappings"
          @back="goToStep(1)"
          @confirm="handleMappingConfirm"
        />
      </div>

      <!-- Data Validation Step -->
      <div v-show="currentStep === 3" class="step-content">
        <div v-if="isValidating" class="validation-loading">
          <el-card>
            <div class="text-center py-8">
              <i class="el-icon-loading text-2xl text-blue-500 mb-4" />
              <div class="text-lg font-medium mb-2">Validating Data...</div>
              <div class="text-sm text-gray-500">
                Please wait while we validate your data and match species names
              </div>
            </div>
          </el-card>
        </div>

        <data-validation
          v-else
          :file-name="fileName"
          :validation-data="validationData"
          :field-mappings="mappings"
          :field-no-option="fieldNoOption"
          @back="goToStep(2)"
          @confirm="handleValidationConfirm"
          @export-issues="exportIssuesList"
          @import-mode-change="handleImportModeChange"
        />
      </div>

      <!-- Import Progress Step -->
      <div v-show="currentStep === 4" class="step-content">
        <import-progress
          v-if="importInProgress"
          :file-id="fileId"
          :import-mode="importMode"
          @complete="handleImportComplete"
          @error="handleImportError"
        />

        <import-complete
          v-else
          :import-result="importResult"
          @goto-field-number-management="goToFieldNumberManagement"
          @view-records="viewImportedRecords"
          @import-more="resetWizard"
        />
      </div>
    </el-card>
  </div>
</template>

<script>
import StepIndicator from '../../components/FileProcessor/StepIndicator.vue'
import UploadDrop from '../../components/FileProcessor/UploadDrop.vue'
import FieldMapping from '../../components/FileProcessor/FieldMapping.vue'
import DataValidation from '../../components/FileProcessor/DataValidation.vue'
import ImportProgress from '../../components/FileProcessor/ImportProgress.vue'
import ImportComplete from '../../components/FileProcessor/ImportComplete.vue'
import {
  uploadFile,
  validateMapping,
  confirmImport,
  exportIssuesList as exportIssuesAPI,
  downloadTemplate as downloadTemplateAPI
} from '@/api/fileprocessor'

export default {
  name: 'ImportWizard',
  components: {
    StepIndicator,
    UploadDrop,
    FieldMapping,
    DataValidation,
    ImportProgress,
    ImportComplete
  },
  data() {
    return {
      // Steps configuration
      steps: ['Upload File', 'Map Fields', 'Validate Data', 'Complete Import'],
      currentStep: 1,

      // File data
      fileName: '',
      fileData: null,
      fileId: '',
      selectedFile: null,
      isUploading: false,

      // Upload configuration
      uploadAction: '/api/upload/upload', // Not used when calling API directly
      fileSize: 10, // MB
      uploadHint: 'Support Excel or CSV format, please ensure it contains the necessary ULM data fields',
      acceptedFileTypes: '.csv,.xlsx,.xls',

      // Mapping data
      sourceColumns: [],
      mappings: {},
      fieldNoOption: '',

      // Validation data
      validationData: {
        totalRecords: 0,
        validRecords: 0,
        invalidRecords: 0,
        issues: [],
        speciesMatching: {},
        validationSummary: {}
      },
      isValidating: false,

      // Import data
      importMode: 'direct',
      importInProgress: false,
      importResult: null,

      // Upload headers
      uploadHeaders: {
        Authorization: 'Bearer ' + this.$store.getters.token
      }
    }
  },
  methods: {
    // Navigate to a specific step
    goToStep(step) {
      this.currentStep = step
    },

    // Handle file selection (before upload)
    handleFileChange(fileList) {
      if (fileList && fileList.length > 0) {
        this.selectedFile = fileList[0]
        this.fileName = this.selectedFile.name
      } else {
        this.selectedFile = null
        this.fileName = ''
      }
    },

    // Start upload when user clicks upload button
    startUpload() {
      if (!this.selectedFile) {
        this.$message.error('Please select a file first')
        return
      }

      this.isUploading = true

      uploadFile(this.selectedFile.raw)
        .then(response => {
          this.isUploading = false

          if (response.code === 20000) {
            this.handleFileUploadSuccess(response.data)
          } else {
            this.$message.error(response.message || 'Upload failed')
          }
        })
        .catch(error => {
          this.isUploading = false
          console.error('Upload error:', error)
          this.$message.error('Failed to upload file: ' + (error.message || error))
        })
    },

    // Handle successful upload response
    handleFileUploadSuccess(data) {
      this.fileId = data.fileId
      this.fileName = data.fileName
      this.sourceColumns = data.columns || []

      // Initialize with default mappings based on available columns
      this.mappings = this.createDefaultMappings(data.columns)

      this.$message.success(`File uploaded successfully! ${data.rowCount} records found.`)

      // Go to field mapping step
      this.goToStep(2)
    },

    // Create default mappings based on column names
    createDefaultMappings(columns) {
      const mappings = {}
      const fieldMappings = {
        family: ['family'],
        genus: ['genus'],
        species: ['species'],
        collectionDate: ['collection_date', 'date_collected', 'date', 'collection date'],
        localityId: ['locality_id', 'locality id', 'location_id'],
        fieldNumber: ['field_number', 'field number', 'field_no', 'ulm number', 'ulm_number'],
        totalNumber: ['total_number', 'total number', 'count', 'number'],
        storage: ['storage', 'tank', 'location'],
        jarSize: ['jar_size', 'jar size', 'jar_size_type', 'jar'],
        prevNumber: ['prev_number', 'previous_number', 'old_number'],
        inventory: ['inventory', 'inventory_number'],
        remarks: ['remarks', 'notes', 'comment', 'comments'],
        localityString: ['locality_string', 'locality string', 'locality', 'location'],
        country: ['country'],
        state: ['state', 'province'],
        county: ['county'],
        latitude: ['latitude', 'lat'],
        longitude: ['longitude', 'lng', 'lon']
      }

      Object.keys(fieldMappings).forEach(fieldKey => {
        const possibleNames = fieldMappings[fieldKey]
        for (let i = 0; i < possibleNames.length; i++) {
          const found = columns.find(col =>
            col.toLowerCase().includes(possibleNames[i]) ||
            possibleNames[i].includes(col.toLowerCase())
          )
          if (found) {
            mappings[fieldKey] = found
            break
          }
        }
      })

      return mappings
    },

    // Handle file upload error
    handleFileUploadError(error) {
      this.$message.error(`Failed to upload file: ${error}`)
    },

    // Clear selected file
    clearSelectedFile() {
      this.selectedFile = null
      this.fileName = ''
    },

    // Handle field mapping confirmation
    handleMappingConfirm(mappings) {
      this.mappings = mappings

      // Start validation
      this.performValidation()
    },

    // Perform data validation
    async performValidation() {
      this.isValidating = true
      this.goToStep(3)

      try {
        const validationResponse = await validateMapping({
          fileId: this.fileId,
          mappings: this.mappings,
          fieldNoOption: this.fieldNoOption
        })

        if (validationResponse.code === 20000) {
          this.validationData = validationResponse.data
          console.log('Validation data received:', this.validationData) // Debug log
          this.$message.success('Data validation completed')
        } else {
          this.$message.error(validationResponse.message || 'Validation failed')
          this.goToStep(2) // Go back to mapping
        }
      } catch (error) {
        console.error('Validation error:', error)
        this.$message.error('Failed to validate data: ' + (error.message || error))
        this.goToStep(2) // Go back to mapping
      } finally {
        this.isValidating = false
      }
    },

    // Handle validation confirmation
    handleValidationConfirm(importData) {
      this.importMode = importData.importMode
      this.startImport()
    },

    // Handle import mode change
    handleImportModeChange(mode) {
      this.importMode = mode
    },

    // Start import process
    async startImport() {
      this.importInProgress = true
      this.goToStep(4)

      try {
        const importResponse = await confirmImport({
          fileId: this.fileId,
          verbatimImport: this.importMode === 'verbatim'
        })

        if (importResponse.code === 20000) {
          this.$message.success('Import started successfully')
          // ImportProgress component will handle status polling
        } else {
          this.$message.error(importResponse.message || 'Failed to start import')
          this.importInProgress = false
        }
      } catch (error) {
        console.error('Import error:', error)
        this.$message.error('Failed to start import: ' + (error.message || error))
        this.importInProgress = false
      }
    },

    // Handle import completion
    handleImportComplete(result) {
      this.importInProgress = false
      this.importResult = result
    },

    // Handle import error
    handleImportError(error) {
      this.importInProgress = false
      this.$message.error('Import failed: ' + error)
    },

    // Export issues list
    async exportIssuesList() {
      try {
        const response = await exportIssuesAPI(this.fileId)

        // Create download link
        const blob = new Blob([response], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `issues_list_${this.fileId}.xlsx`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        this.$message.success('Issues list downloaded successfully')
      } catch (error) {
        console.error('Export error:', error)
        this.$message.error('Failed to export issues list')
      }
    },

    // Download template
    async downloadTemplate() {
      try {
        const response = await downloadTemplateAPI()

        // Create download link
        const blob = new Blob([response], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'ulm_import_template.xlsx'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        this.$message.success('Template downloaded successfully')
      } catch (error) {
        console.error('Download error:', error)
        this.$message.error('Failed to download template')
      }
    },

    // Navigate to Field Number Management
    goToFieldNumberManagement() {
      this.$message.info('Redirecting to Field Number Management Center...')
      // In a real application, this would redirect to another page
    },

    // View imported records
    viewImportedRecords() {
      this.$message.info('Viewing imported records...')
      // In a real application, this would redirect to records list
    },

    // Reset wizard to start a new import
    resetWizard() {
      this.currentStep = 1
      this.fileName = ''
      this.fileData = null
      this.fileId = ''
      this.selectedFile = null
      this.isUploading = false
      this.sourceColumns = []
      this.mappings = {}
      this.fieldNoOption = ''
      this.validationData = {
        totalRecords: 0,
        validRecords: 0,
        invalidRecords: 0,
        issues: [],
        speciesMatching: {},
        validationSummary: {}
      }
      this.isValidating = false
      this.importMode = 'direct'
      this.importInProgress = false
      this.importResult = null
      this.clearSelectedFile()
    }
  }
}
</script>

<style scoped>
.import-wizard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.wizard-container {
  margin-bottom: 40px;
}

.wizard-header {
  padding-bottom: 20px;
}

.step-content {
  padding: 24px;
}

.upload-actions {
  margin-top: 20px;
  text-align: center;
}

.upload-actions .el-button {
  margin: 0 8px;
}

.validation-loading {
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
