<!--
  DataValidation.vue
  Component for displaying data validation results
-->
<template>
  <div class="data-validation">
    <div class="space-y-6">
      <!-- File info display -->
      <div class="flex items-center p-4 bg-blue-50 rounded-lg">
        <div class="text-blue-500 mr-3">
          <i class="el-icon-document" />
        </div>
        <div>
          <div class="font-medium">{{ fileName }}</div>
          <div class="text-sm text-gray-500">Data validation complete - Review results below</div>
        </div>
      </div>

      <!-- Validation summary cards -->
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="summary-card total">
            <div class="summary-content">
              <div class="summary-icon">
                <i class="el-icon-files" />
              </div>
              <div class="summary-info">
                <div class="summary-value">{{ currentTotalRecords }}</div>
                <div class="summary-label">Total Records</div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :span="6">
          <el-card class="summary-card valid">
            <div class="summary-content">
              <div class="summary-icon">
                <i class="el-icon-check" />
              </div>
              <div class="summary-info">
                <div class="summary-value">{{ currentValidRecords }}</div>
                <div class="summary-label">Valid Records</div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :span="6">
          <el-card class="summary-card invalid">
            <div class="summary-content">
              <div class="summary-icon">
                <i class="el-icon-warning" />
              </div>
              <div class="summary-info">
                <div class="summary-value">{{ currentInvalidRecords }}</div>
                <div class="summary-label">Invalid Records</div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :span="6">
          <el-card class="summary-card percentage">
            <div class="summary-content">
              <div class="summary-icon">
                <i class="el-icon-pie-chart" />
              </div>
              <div class="summary-info">
                <div class="summary-value">{{ validPercentage }}%</div>
                <div class="summary-label">Success Rate</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- Species matching results -->
      <el-card v-if="hasSpeciesMatching" class="species-matching">
        <div slot="header" class="clearfix">
          <span class="font-medium">
            <i class="el-icon-search mr-2" />
            Species Matching Results
          </span>
        </div>

        <el-row :gutter="20">
          <el-col v-for="(matchInfo, matchType) in speciesMatchingSummary" :key="matchType" :span="4">
            <div class="species-match-item">
              <div class="match-count" :class="getMatchTypeClass(matchType)">
                {{ matchInfo.count }}
              </div>
              <div class="match-label">{{ getMatchTypeLabel(matchType) }}</div>
              <div v-if="matchInfo.percentage !== undefined" class="match-percentage">
                {{ matchInfo.percentage }}%
              </div>
            </div>
          </el-col>
        </el-row>

        <!-- Species matching details -->
        <div v-if="speciesMatchingDetails.length > 0" class="mt-4">
          <el-collapse>
            <el-collapse-item name="species-details">
              <template slot="title">
                <span class="text-sm">View matching details ({{ speciesMatchingDetails.length }} entries)</span>
              </template>
              <el-table :data="paginatedMatchingDetails" style="width: 100%" max-height="400">
                <el-table-column prop="matchType" label="Match Type" width="120">
                  <template slot-scope="scope">
                    <el-tag :type="getMatchTagType(scope.row.matchType)">
                      {{ getMatchTypeLabel(scope.row.matchType) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="originalName" label="Original Name" width="200" />
                <el-table-column prop="matchedName" label="Matched Name" width="200" />
                <el-table-column prop="confidence" label="Confidence" width="100">
                  <template slot-scope="scope">
                    <span v-if="scope.row.confidence">{{ scope.row.confidence }}%</span>
                    <span v-else>-</span>
                  </template>
                </el-table-column>
                <el-table-column prop="rowIndex" label="Row" width="80" />
              </el-table>

              <!-- Pagination for matching details -->
              <div v-if="speciesMatchingDetails.length > 10" class="mt-3 text-center">
                <el-pagination
                  :current-page="matchingDetailsPage"
                  :page-size="10"
                  :total="speciesMatchingDetails.length"
                  layout="prev, pager, next"
                  @current-change="handleMatchingDetailsPageChange"
                />
              </div>
            </el-collapse-item>
          </el-collapse>
        </div>
      </el-card>

      <!-- Data validation issues -->
      <el-card v-if="hasValidationIssues" class="validation-issues">
        <div slot="header" class="clearfix">
          <span class="font-medium">
            <i class="el-icon-warning text-orange-500 mr-2" />
            Data Validation Issues
          </span>
          <el-button
            style="float: right; padding: 3px 0"
            type="text"
            @click="exportIssues"
          >
            Export Issue List
          </el-button>
        </div>

        <div class="space-y-3">
          <el-card v-for="(issue, index) in currentValidationIssues" :key="index" class="issue-card">
            <div class="issue-header">
              <span class="issue-type">{{ getIssueTypeLabel(issue.type) }}</span>
              <el-tag type="warning">{{ issue.count }} records</el-tag>
            </div>
            <div class="issue-description">{{ issue.description }}</div>
            <div v-if="issue.examples && issue.examples.length > 0" class="issue-examples">
              <span class="examples-label">Examples:</span>
              <span class="examples-list">{{ issue.examples.join(', ') }}</span>
              <span v-if="issue.count > issue.examples.length" class="more-count">
                and {{ issue.count - issue.examples.length }} more records
              </span>
            </div>
          </el-card>

          <el-alert
            type="info"
            :closable="false"
            show-icon
          >
            <template slot="title">Note about invalid records</template>
            <div class="text-sm">
              Records with validation issues will be handled differently based on your import mode:
              <ul class="mt-2 ml-4 list-disc">
                <li><strong>Direct Import:</strong> Invalid records will be skipped</li>
                <li><strong>Verbatim Import:</strong> All records will be imported, including invalid ones for manual review</li>
              </ul>
            </div>
          </el-alert>
        </div>
      </el-card>

      <!-- Field mapping summary -->
      <el-card class="field-mapping-summary">
        <div slot="header" class="clearfix">
          <span class="font-medium">
            <i class="el-icon-connection mr-2" />
            Field Mapping Summary
          </span>
        </div>

        <el-row :gutter="20">
          <el-col v-for="(mapping, index) in mappingDisplayList" :key="index" :span="12">
            <div class="mapping-item">
              <div class="mapping-field">{{ mapping.label }}</div>
              <div class="mapping-arrow">→</div>
              <div class="mapping-source" :class="mapping.class">{{ mapping.source }}</div>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- Import mode selection -->
      <el-card class="import-mode">
        <div slot="header" class="clearfix">
          <span class="font-medium">
            <i class="el-icon-setting mr-2" />
            Import Mode Selection
          </span>
        </div>

        <el-radio-group v-model="selectedImportMode" @change="handleImportModeChange">
          <el-radio-button label="direct">
            <i class="el-icon-lightning mr-1" />
            Direct Import
          </el-radio-button>
          <el-radio-button label="verbatim">
            <i class="el-icon-document-copy mr-1" />
            Verbatim Import
          </el-radio-button>
        </el-radio-group>

        <div class="import-mode-description">
          <div v-if="selectedImportMode === 'direct'" class="mode-info direct">
            <h4>Direct Import Mode</h4>
            <ul>
              <li>✓ Validates and matches species names against database</li>
              <li>✓ Only imports valid records ({{ currentValidRecords }} records)</li>
              <li>✓ Automatic data processing and cleanup</li>
              <li>⚠ Invalid records will be skipped ({{ currentInvalidRecords }} records)</li>
            </ul>
          </div>
          <div v-else class="mode-info verbatim">
            <h4>Verbatim Import Mode</h4>
            <ul>
              <li>✓ Imports all records including invalid ones ({{ currentTotalRecords }} records)</li>
              <li>✓ Preserves original data for manual review</li>
              <li>✓ Allows later verification and correction</li>
              <li>ℹ Requires manual review after import</li>
            </ul>
          </div>
        </div>
      </el-card>

      <!-- Action buttons -->
      <div class="action-buttons">
        <el-button icon="el-icon-arrow-left" @click="goBack">
          Back to Mapping
        </el-button>

        <div class="right-actions">
          <el-button
            v-if="hasValidationIssues"
            icon="el-icon-download"
            @click="exportIssues"
          >
            Export Issues
          </el-button>

          <el-button
            type="primary"
            :disabled="!canProceedWithImport"
            icon="el-icon-check"
            @click="confirmImport"
          >
            Proceed with {{ selectedImportMode === 'direct' ? 'Direct' : 'Verbatim' }} Import
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DataValidation',
  props: {
    // Filename to display
    fileName: {
      type: String,
      required: true
    },
    // Legacy props for backward compatibility
    totalRecords: {
      type: Number,
      default: 0
    },
    validRecords: {
      type: Number,
      default: 0
    },
    issues: {
      type: Array,
      default: () => []
    },
    // New validation data from API
    validationData: {
      type: Object,
      default: () => ({
        totalRecords: 0,
        validRecords: 0,
        invalidRecords: 0,
        issues: [],
        speciesMatching: {},
        validationSummary: {}
      })
    },
    // Field mappings
    fieldMappings: {
      type: Object,
      required: true
    },
    // Field number option
    fieldNoOption: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      selectedImportMode: 'direct',
      matchingDetailsPage: 1
    }
  },
  computed: {
    // Current total records (prioritize API data)
    currentTotalRecords() {
      if (this.validationData && typeof this.validationData.totalRecords === 'number') {
        return this.validationData.totalRecords
      }
      if (this.validationData && this.validationData.validationSummary) {
        return this.validationData.validationSummary.totalRecords || 0
      }
      return this.totalRecords || 0
    },

    // Current valid records
    currentValidRecords() {
      if (this.validationData && typeof this.validationData.validRecords === 'number') {
        return this.validationData.validRecords
      }
      if (this.validationData && this.validationData.validationSummary) {
        return this.validationData.validationSummary.validRecords || 0
      }
      return this.validRecords || 0
    },

    // Current invalid records
    currentInvalidRecords() {
      if (this.validationData && typeof this.validationData.invalidRecords === 'number') {
        return this.validationData.invalidRecords
      }
      if (this.validationData && this.validationData.validationSummary) {
        return this.validationData.validationSummary.invalidRecords || 0
      }
      return this.currentTotalRecords - this.currentValidRecords
    },

    // Calculate success percentage
    validPercentage() {
      const total = this.currentTotalRecords
      const valid = this.currentValidRecords
      return total > 0 ? Math.round((valid / total) * 100) : 0
    },

    // Check if there are validation issues
    hasValidationIssues() {
      const apiIssues = this.validationData && this.validationData.issues && this.validationData.issues.length > 0
      const legacyIssues = this.issues && this.issues.length > 0
      return apiIssues || legacyIssues
    },

    // Get validation issues (prioritize new format)
    currentValidationIssues() {
      if (this.validationData && this.validationData.issues && this.validationData.issues.length > 0) {
        return this.validationData.issues
      }
      return this.issues || []
    },

    // Check if species matching data is available
    hasSpeciesMatching() {
      return this.validationData &&
        this.validationData.speciesMatching &&
        this.validationData.speciesMatching.matches &&
        Object.keys(this.validationData.speciesMatching.matches).length > 0
    },

    // Species matching summary with proper calculations
    speciesMatchingSummary() {
      if (!this.hasSpeciesMatching) return {}

      const matches = this.validationData.speciesMatching.matches
      const total = this.currentTotalRecords
      const summary = {}

      // Map the API match types to display names
      const matchTypeMapping = {
        'exact': 'exact_match',
        'fuzzy': 'fuzzy_match',
        'spelling_error': 'spelling_error',
        'phonetic': 'phonetic_match',
        'no_match': 'no_match'
      }

      Object.keys(matches).forEach(apiMatchType => {
        const displayType = matchTypeMapping[apiMatchType] || apiMatchType
        const count = matches[apiMatchType].length
        summary[displayType] = {
          count: count,
          percentage: total > 0 ? Math.round((count / total) * 100) : 0
        }
      })

      return summary
    },

    // Species matching details for table display
    speciesMatchingDetails() {
      if (!this.hasSpeciesMatching) return []

      const details = []
      const matches = this.validationData.speciesMatching.matches

      // Process exact matches
      if (matches.exact) {
        matches.exact.forEach(match => {
          details.push({
            matchType: 'exact_match',
            originalName: match.import_name || '',
            matchedName: match.db_name || '',
            confidence: match.similarity ? Math.round(match.similarity) : 100,
            rowIndex: (match.row_index || match.import_index || 0) + 1
          })
        })
      }

      // Process fuzzy matches
      if (matches.fuzzy) {
        matches.fuzzy.forEach(match => {
          details.push({
            matchType: 'fuzzy_match',
            originalName: match.import_name || '',
            matchedName: match.db_name || '',
            confidence: match.similarity ? Math.round(match.similarity) : null,
            rowIndex: (match.row_index || match.import_index || 0) + 1
          })
        })
      }

      // Process spelling error matches
      if (matches.spelling_error) {
        matches.spelling_error.forEach(match => {
          details.push({
            matchType: 'spelling_error',
            originalName: match.import_name || '',
            matchedName: match.db_name || '',
            confidence: null,
            rowIndex: (match.row_index || match.import_index || 0) + 1
          })
        })
      }

      // Process phonetic matches
      if (matches.phonetic) {
        matches.phonetic.forEach(match => {
          const firstPotentialMatch = match.potential_matches && match.potential_matches[0]
          details.push({
            matchType: 'phonetic_match',
            originalName: match.import_name || '',
            matchedName: firstPotentialMatch ? firstPotentialMatch.db_name : 'Multiple candidates',
            confidence: null,
            rowIndex: (match.row_index || match.import_index || 0) + 1
          })
        })
      }

      // Process no matches
      if (matches.no_match) {
        matches.no_match.forEach(match => {
          details.push({
            matchType: 'no_match',
            originalName: match.original_name || '',
            matchedName: '-',
            confidence: null,
            rowIndex: (match.row_index || match.import_index || 0) + 1
          })
        })
      }

      return details.sort((a, b) => a.rowIndex - b.rowIndex)
    },

    // Paginated matching details
    paginatedMatchingDetails() {
      const startIndex = (this.matchingDetailsPage - 1) * 10
      const endIndex = startIndex + 10
      return this.speciesMatchingDetails.slice(startIndex, endIndex)
    },

    // Field mapping display list
    mappingDisplayList() {
      const mappings = []

      Object.keys(this.fieldMappings).forEach(key => {
        const value = this.fieldMappings[key]
        if (value) {
          mappings.push({
            label: this.getFieldLabel(key),
            source: this.formatMappingValue(key, value),
            class: this.getMappingClass(key, value)
          })
        }
      })

      return mappings
    },

    // Check if can proceed with import
    canProceedWithImport() {
      if (this.selectedImportMode === 'verbatim') {
        return true // Verbatim mode can import all records
      }

      // Direct mode requires at least some valid records
      return this.currentValidRecords > 0
    }
  },
  methods: {
    // Handle matching details page change
    handleMatchingDetailsPageChange(page) {
      this.matchingDetailsPage = page
    },

    // Get field label for display
    getFieldLabel(key) {
      const labels = {
        // Required field
        prevNumber: 'Previous Number',

        // Occurrence fields
        collectionDate: 'Collection Date',
        fieldNumber: 'Field Number',
        totalNumber: 'Total Number',
        remarks: 'Remarks',

        // Taxonomic fields
        family: 'Family',
        genus: 'Genus',
        species: 'Species',

        // Locality fields
        localityId: 'Locality ID',
        localityString: 'Locality String',
        country: 'Country',
        state: 'State/Province',
        county: 'County',
        drainage: 'Drainage',
        waterbody: 'Water Body',
        latitude: 'Latitude',
        longitude: 'Longitude',

        // Storage fields
        storage: 'Storage',
        jarSize: 'Jar Size',
        inventory: 'Inventory'
      }

      return labels[key] || key
    },

    // Format mapping value for display
    formatMappingValue(key, value) {
      if (key === 'fieldNumber' && value === 'auto-generate') {
        return 'Auto generate'
      }

      return value
    },

    // Get mapping class for styling
    getMappingClass(key, value) {
      if (value === 'auto-generate') {
        return 'auto-generate'
      }
      return ''
    },

    // Get issue type label
    getIssueTypeLabel(type) {
      const labels = {
        'numeric_totalnumber': 'Invalid Total Number',
        'date_format': 'Invalid Date Format',
        'taxonomic_format': 'Invalid Taxonomic Format',
        'species_not_matched': 'Species Not Found',
        'missing_required': 'Missing Required Fields'
      }

      return labels[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    },

    // Get match type label
    getMatchTypeLabel(type) {
      const labels = {
        'exact_match': 'Exact',
        'fuzzy_match': 'Fuzzy',
        'spelling_error': 'Spelling',
        'phonetic_match': 'Phonetic',
        'no_match': 'No Match'
      }

      return labels[type] || type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    },

    // Get match type class for styling
    getMatchTypeClass(type) {
      const classes = {
        'exact_match': 'exact-match',
        'fuzzy_match': 'fuzzy-match',
        'spelling_error': 'spelling-match',
        'phonetic_match': 'phonetic-match',
        'no_match': 'no-match'
      }

      return classes[type] || ''
    },

    // Get match tag type for table
    getMatchTagType(type) {
      const tagTypes = {
        'exact_match': 'success',
        'fuzzy_match': 'warning',
        'spelling_error': 'info',
        'phonetic_match': 'primary',
        'no_match': 'danger'
      }

      return tagTypes[type] || ''
    },

    // Handle import mode change
    handleImportModeChange(mode) {
      this.$emit('import-mode-change', mode)
    },

    // Export issues list
    exportIssues() {
      this.$emit('export-issues')
    },

    // Go back to edit mappings
    goBack() {
      this.$emit('back')
    },

    // Confirm import
    confirmImport() {
      const importData = {
        importMode: this.selectedImportMode,
        validRecords: this.currentValidRecords,
        totalRecords: this.currentTotalRecords,
        mappings: this.fieldMappings,
        fieldNoOption: this.fieldNoOption
      }

      this.$emit('confirm', importData)
    }
  }
}
</script>

<style scoped>
.data-validation {
  max-width: 1200px;
  margin: 0 auto;
}

.space-y-6 > * + * {
  margin-top: 1.5rem;
}

.space-y-3 > * + * {
  margin-top: 0.75rem;
}

/* Summary cards */
.summary-card {
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.summary-content {
  display: flex;
  align-items: center;
  padding: 1rem;
}

.summary-icon {
  font-size: 2rem;
  margin-right: 1rem;
  width: 3rem;
  text-align: center;
}

.summary-info {
  flex: 1;
}

.summary-value {
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1.2;
}

.summary-label {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.summary-card.total .summary-icon {
  color: #3b82f6;
}

.summary-card.valid .summary-icon {
  color: #10b981;
}

.summary-card.invalid .summary-icon {
  color: #f59e0b;
}

.summary-card.percentage .summary-icon {
  color: #8b5cf6;
}

/* Species matching */
.species-match-item {
  text-align: center;
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
}

.match-count {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.match-count.exact-match {
  color: #10b981;
}

.match-count.fuzzy-match {
  color: #f59e0b;
}

.match-count.spelling-match {
  color: #3b82f6;
}

.match-count.phonetic-match {
  color: #8b5cf6;
}

.match-count.no-match {
  color: #ef4444;
}

.match-label {
  font-size: 0.875rem;
  color: #6b7280;
}

.match-percentage {
  font-size: 0.75rem;
  color: #9ca3af;
  margin-top: 0.25rem;
}

/* Validation issues */
.issue-card {
  border-left: 4px solid #f59e0b;
  margin-bottom: 0.75rem;
}

.issue-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.issue-type {
  font-weight: 600;
  color: #374151;
}

.issue-description {
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.issue-examples {
  font-size: 0.875rem;
}

.examples-label {
  font-weight: 500;
  color: #374151;
}

.examples-list {
  color: #6b7280;
}

.more-count {
  color: #9ca3af;
  font-style: italic;
}

/* Field mapping summary */
.mapping-item {
  display: flex;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f3f4f6;
}

.mapping-field {
  font-weight: 500;
  color: #374151;
  flex: 1;
}

.mapping-arrow {
  margin: 0 1rem;
  color: #9ca3af;
}

.mapping-source {
  color: #6b7280;
  flex: 1;
}

.mapping-source.auto-generate {
  color: #3b82f6;
  font-style: italic;
}

/* Import mode */
.import-mode-description {
  margin-top: 1rem;
}

.mode-info h4 {
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.mode-info ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.mode-info li {
  padding: 0.25rem 0;
  font-size: 0.875rem;
}

.mode-info.direct {
  color: #059669;
}

.mode-info.verbatim {
  color: #3b82f6;
}

/* Action buttons */
.action-buttons {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.right-actions {
  display: flex;
  gap: 0.5rem;
}

/* Responsive design */
@media (max-width: 768px) {
  .action-buttons {
    flex-direction: column;
    gap: 1rem;
  }

  .right-actions {
    justify-content: center;
  }
}
</style>
