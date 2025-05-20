<!--
  FieldMapping.vue
  Component for mapping source columns to system fields
-->
<template>
  <div class="field-mapping">
    <div class="space-y-6">
      <!-- File info display -->
      <div class="flex items-center p-4 bg-blue-50 rounded-lg">
        <div class="text-blue-500 mr-3">
          <i class="el-icon-document" />
        </div>
        <div>
          <div class="font-medium">{{ fileName }}</div>
          <div class="text-sm text-gray-500">Please map file columns to system fields</div>
        </div>
      </div>

      <!-- Field mapping section -->
      <div class="space-y-6">
        <!-- Required field section -->
        <div class="field-section">
          <h3 class="section-title required">
            <i class="el-icon-star-on"></i>
            Required Field
          </h3>
          <div class="section-description">
            This field is mandatory for import
          </div>
          <el-card v-for="field in requiredFields" :key="field.key" class="field-card">
            <div class="field-row">
              <div class="field-info">
                <span class="field-label required">{{ field.label }}</span>
                <span class="required-indicator">*</span>
                <div class="field-description">{{ field.description }}</div>
              </div>
              <div class="field-select">
                <el-select
                  v-model="mappings[field.key]"
                  placeholder="Select source column"
                  style="width: 100%"
                  filterable
                  clearable
                  @change="handleFieldChange(field.key, $event)"
                >
                  <el-option
                    v-for="option in getOptionsForField(field)"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                    :disabled="option.disabled"
                  />
                </el-select>
              </div>
            </div>
          </el-card>
        </div>

        <!-- Basic occurrence fields section -->
        <div class="field-section">
          <h3 class="section-title">
            <i class="el-icon-collection"></i>
            Basic Occurrence Information
          </h3>
          <div class="section-description">
            Fundamental specimen collection and identification data
          </div>
          <el-card v-for="field in occurrenceFields" :key="field.key" class="field-card">
            <div class="field-row">
              <div class="field-info">
                <span class="field-label">{{ field.label }}</span>
                <div class="field-description">{{ field.description }}</div>
              </div>
              <div class="field-select">
                <el-select
                  v-model="mappings[field.key]"
                  placeholder="Select source column (optional)"
                  style="width: 100%"
                  filterable
                  clearable
                  @change="handleFieldChange(field.key, $event)"
                >
                  <el-option
                    v-for="option in getOptionsForField(field)"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                    :disabled="option.disabled"
                  />
                </el-select>
              </div>
            </div>
          </el-card>
        </div>

        <div class="field-section">
          <h3 class="section-title">
            <i class="el-icon-box"></i>
            Storage & Management
          </h3>
          <div class="section-description">
            Physical storage and inventory management information
          </div>
          <el-card v-for="field in storageFields" :key="field.key" class="field-card">
            <div class="field-row">
              <div class="field-info">
                <span class="field-label">{{ field.label }}</span>
                <div class="field-description">{{ field.description }}</div>
              </div>
              <div class="field-select">
                <el-select
                  v-model="mappings[field.key]"
                  placeholder="Select source column (optional)"
                  style="width: 100%"
                  filterable
                  clearable
                  @change="handleFieldChange(field.key, $event)"
                >
                  <el-option
                    v-for="option in getOptionsForField(field)"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                    :disabled="option.disabled"
                  />
                </el-select>
              </div>
            </div>
          </el-card>
        </div>

        <!-- Taxonomic fields section -->
        <div class="field-section">
          <h3 class="section-title">
            <i class="el-icon-postcard"></i>
            Taxonomic Information
          </h3>
          <div class="section-description">
            Scientific classification and species identification
          </div>
          <el-card v-for="field in taxonomicFields" :key="field.key" class="field-card">
            <div class="field-row">
              <div class="field-info">
                <span class="field-label">{{ field.label }}</span>
                <div class="field-description">{{ field.description }}</div>
              </div>
              <div class="field-select">
                <el-select
                  v-model="mappings[field.key]"
                  placeholder="Select source column (optional)"
                  style="width: 100%"
                  filterable
                  clearable
                  @change="handleFieldChange(field.key, $event)"
                >
                  <el-option
                    v-for="option in getOptionsForField(field)"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                    :disabled="option.disabled"
                  />
                </el-select>
              </div>
            </div>
          </el-card>
        </div>

        <!-- Locality fields section -->
        <div class="field-section">
          <h3 class="section-title">
            <i class="el-icon-location"></i>
            Location Information
          </h3>
          <div class="section-description">
            Geographic and collection site details
          </div>
          <el-card v-for="field in localityFields" :key="field.key" class="field-card">
            <div class="field-row">
              <div class="field-info">
                <span class="field-label">{{ field.label }}</span>
                <div class="field-description">{{ field.description }}</div>
              </div>
              <div class="field-select">
                <el-select
                  v-model="mappings[field.key]"
                  placeholder="Select source column (optional)"
                  style="width: 100%"
                  filterable
                  clearable
                  @change="handleFieldChange(field.key, $event)"
                >
                  <el-option
                    v-for="option in getOptionsForField(field)"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                    :disabled="option.disabled"
                  />
                </el-select>
              </div>
            </div>
          </el-card>
        </div>

        <!-- Storage and management fields section -->

      </div>

<!--      &lt;!&ndash; Field number configuration alert &ndash;&gt;-->
<!--      <el-alert-->
<!--        v-if="showFieldNumberAlert"-->
<!--        title="Field Number Configuration"-->
<!--        type="info"-->
<!--        :closable="false"-->
<!--        show-icon-->
<!--      >-->
<!--        <template slot>-->
<!--          Field numbers will be handled in the next step based on your mapping selection.-->
<!--        </template>-->
<!--      </el-alert>-->

      <!-- Validation summary -->
      <div v-if="validationSummary" class="validation-summary">
        <el-card>
          <div slot="header" class="clearfix">
            <span>Mapping Summary</span>
          </div>
          <div class="summary-content">
            <div class="summary-item">
              <span class="summary-label">Required fields mapped:</span>
              <span class="summary-value" :class="requiredMapped ? 'success' : 'error'">
                {{ requiredMappedCount }}/{{ requiredFields.length }}
                <i :class="requiredMapped ? 'el-icon-check' : 'el-icon-close'"></i>
              </span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Occurrence fields mapped:</span>
              <span class="summary-value info">{{ occurrenceMappedCount }}/{{ occurrenceFields.length }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Taxonomic fields mapped:</span>
              <span class="summary-value info">{{ taxonomicMappedCount }}/{{ taxonomicFields.length }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Location fields mapped:</span>
              <span class="summary-value info">{{ localityMappedCount }}/{{ localityFields.length }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Storage fields mapped:</span>
              <span class="summary-value info">{{ storageMappedCount }}/{{ storageFields.length }}</span>
            </div>
          </div>
        </el-card>
      </div>

      <!-- Action buttons -->
      <div class="actions">
        <el-button @click="goBack">
          <i class="el-icon-arrow-left" />
          Back
        </el-button>

        <div class="right-actions">
          <el-button @click="previewMapping">
            <i class="el-icon-view" />
            Preview Mapping
          </el-button>

          <el-button @click="autoMapFields">
            <i class="el-icon-magic-stick" />
            Auto Map
          </el-button>

          <el-button
            type="primary"
            :disabled="!isValid"
            @click="confirmMapping"
          >
            Continue to Validation
            <i class="el-icon-arrow-right el-icon--right" />
          </el-button>
        </div>
      </div>
    </div>

    <!-- Preview mapping dialog -->
    <el-dialog
      title="Mapping Preview"
      :visible.sync="showPreviewDialog"
      width="70%"
    >
      <div class="preview-content">
        <el-table :data="mappingPreviewData" style="width: 100%">
          <el-table-column prop="section" label="Section" width="150">
            <template slot-scope="scope">
              <el-tag :type="getSectionTagType(scope.row.section)">
                {{ scope.row.section }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="systemField" label="System Field" width="200">
            <template slot-scope="scope">
              <span :class="{ 'required-field': scope.row.required }">
                {{ scope.row.systemField }}
                <span v-if="scope.row.required" class="required-indicator">*</span>
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="sourceColumn" label="Mapped to Source Column" width="200">
            <template slot-scope="scope">
              <span v-if="scope.row.sourceColumn" class="mapped-value">
                {{ scope.row.sourceColumn }}
              </span>
              <span v-else class="unmapped-value">Not mapped</span>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="Description">
            <template slot-scope="scope">
              <span class="description-text">{{ scope.row.description }}</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="showPreviewDialog = false">Close</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'FieldMapping',
  props: {
    // Filename to display
    fileName: {
      type: String,
      required: true
    },
    // Source columns from uploaded file
    sourceColumns: {
      type: Array,
      required: true
    },
    // Initial mappings (if any)
    initialMappings: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      // Required fields (only prevNumber)
      requiredFields: [
        {
          key: 'prevNumber',
          label: 'Previous Number',
          description: 'Previous catalog or identification number (required)',
          required: true
        }
      ],

      // Basic occurrence fields
      occurrenceFields: [
        {
          key: 'collectionDate',
          label: 'Collection Date',
          description: 'Date when specimen was collected (YYYY-MM-DD format)',
          required: false
        },
        {
          key: 'fieldNumber',
          label: 'Field Number',
          description: 'Original field collection number',
          required: false,
          specialOptions: ['auto-generate']
        },
        {
          key: 'totalNumber',
          label: 'Total Number',
          description: 'Number of specimens in this record',
          required: false
        },
        {
          key: 'remarks',
          label: 'Remarks',
          description: 'Additional notes or comments',
          required: false
        }
      ],

      // Taxonomic fields
      taxonomicFields: [
        {
          key: 'family',
          label: 'Family',
          description: 'Taxonomic family name (e.g., Cyprinidae)',
          required: false
        },
        {
          key: 'genus',
          label: 'Genus',
          description: 'Taxonomic genus name (e.g., Cyprinus)',
          required: false
        },
        {
          key: 'species',
          label: 'Species',
          description: 'Taxonomic species name (e.g., carpio)',
          required: false
        }
      ],

      // Locality fields
      localityFields: [
        {
          key: 'localityId',
          label: 'Locality ID',
          description: 'Reference to existing locality record in system',
          required: false
        },
        {
          key: 'localityString',
          label: 'Locality String',
          description: 'Verbatim locality description',
          required: false
        },
        {
          key: 'country',
          label: 'Country',
          description: 'Country name',
          required: false
        },
        {
          key: 'state',
          label: 'State/Province',
          description: 'State or province name',
          required: false
        },
        {
          key: 'county',
          label: 'County',
          description: 'County or district name',
          required: false
        },
        {
          key: 'drainage',
          label: 'Drainage',
          description: 'Drainage basin information',
          required: false
        },
        {
          key: 'waterbody',
          label: 'Water Body',
          description: 'Name of water body (lake, river, etc.)',
          required: false
        },
        {
          key: 'latitude',
          label: 'Latitude',
          description: 'Decimal degrees latitude',
          required: false
        },
        {
          key: 'longitude',
          label: 'Longitude',
          description: 'Decimal degrees longitude',
          required: false
        }
      ],

      // Storage and management fields
      storageFields: [
        {
          key: 'storage',
          label: 'Storage',
          description: 'Storage location information (e.g., Tank A1)',
          required: false
        },
        {
          key: 'jarSize',
          label: 'Jar Size',
          description: 'Container size information',
          required: false
        },
        {
          key: 'inventory',
          label: 'Inventory',
          description: 'Inventory or accession number',
          required: false
        }
      ],

      // Current mappings
      mappings: {},

      // UI state
      showPreviewDialog: false,
      showFieldNumberAlert: false,
      validationSummary: true
    }
  },
  computed: {
    // Check if all required mappings are selected
    isValid() {
      return this.requiredFields.every(field =>
        this.mappings[field.key] && this.mappings[field.key].length > 0
      )
    },

    // Count required fields mapped
    requiredMappedCount() {
      return this.requiredFields.filter(field =>
        this.mappings[field.key] && this.mappings[field.key].length > 0
      ).length
    },

    // Check if all required fields are mapped
    requiredMapped() {
      return this.requiredMappedCount === this.requiredFields.length
    },

    // Count occurrence fields mapped
    occurrenceMappedCount() {
      return this.occurrenceFields.filter(field =>
        this.mappings[field.key] && this.mappings[field.key].length > 0
      ).length
    },

    // Count taxonomic fields mapped
    taxonomicMappedCount() {
      return this.taxonomicFields.filter(field =>
        this.mappings[field.key] && this.mappings[field.key].length > 0
      ).length
    },

    // Count locality fields mapped
    localityMappedCount() {
      return this.localityFields.filter(field =>
        this.mappings[field.key] && this.mappings[field.key].length > 0
      ).length
    },

    // Count storage fields mapped
    storageMappedCount() {
      return this.storageFields.filter(field =>
        this.mappings[field.key] && this.mappings[field.key].length > 0
      ).length
    },

    // All fields combined
    allFields() {
      return [
        ...this.requiredFields,
        ...this.occurrenceFields,
        ...this.taxonomicFields,
        ...this.localityFields,
        ...this.storageFields
      ]
    },

    // Mapping preview data
    mappingPreviewData() {
      const data = []

      this.requiredFields.forEach(field => {
        data.push({
          section: 'Required',
          systemField: field.label,
          sourceColumn: this.mappings[field.key] || null,
          description: field.description,
          required: true
        })
      })

      this.occurrenceFields.forEach(field => {
        data.push({
          section: 'Occurrence',
          systemField: field.label,
          sourceColumn: this.mappings[field.key] || null,
          description: field.description,
          required: false
        })
      })

      this.taxonomicFields.forEach(field => {
        data.push({
          section: 'Taxonomic',
          systemField: field.label,
          sourceColumn: this.mappings[field.key] || null,
          description: field.description,
          required: false
        })
      })

      this.localityFields.forEach(field => {
        data.push({
          section: 'Location',
          systemField: field.label,
          sourceColumn: this.mappings[field.key] || null,
          description: field.description,
          required: false
        })
      })

      this.storageFields.forEach(field => {
        data.push({
          section: 'Storage',
          systemField: field.label,
          sourceColumn: this.mappings[field.key] || null,
          description: field.description,
          required: false
        })
      })

      return data
    }
  },
  watch: {
    // Watch for changes in initialMappings
    initialMappings: {
      handler(newMappings) {
        this.mappings = { ...newMappings }
      },
      immediate: true,
      deep: true
    }
  },
  created() {
    // Initialize mappings from props
    this.mappings = { ...this.initialMappings }
  },
  methods: {
    // Generate options for each field select
    getOptionsForField(field) {
      const options = []

      // Add "not mapped" option
      options.push({
        value: '',
        label: '-- Not mapped --'
      })

      // Add all source columns
      this.sourceColumns.forEach(column => {
        // Check if this column is already mapped to another field
        const alreadyMapped = Object.keys(this.mappings).find(key =>
          key !== field.key && this.mappings[key] === column
        )

        options.push({
          value: column,
          label: alreadyMapped ? `${column} (mapped to ${alreadyMapped})` : column,
          disabled: !!alreadyMapped
        })
      })

      // Add special options if available
      if (field.specialOptions && field.specialOptions.length) {
        field.specialOptions.forEach(specialOption => {
          const label = specialOption === 'auto-generate'
            ? 'Auto generate field numbers'
            : 'Assign field numbers later'

          options.push({
            value: specialOption,
            label: label
          })
        })
      }

      return options
    },

    // Handle field mapping change
    handleFieldChange(fieldKey, value) {
      // Update field number alert
      this.showFieldNumberAlert = fieldKey === 'fieldNumber' &&
        (value === 'auto-generate' || value === '')

      // Emit change event for parent component
      this.$emit('mapping-change', { field: fieldKey, value: value })
    },

    // Go back to previous step
    goBack() {
      this.$emit('back')
    },

    // Preview mapping
    previewMapping() {
      this.showPreviewDialog = true
    },

    // Get section tag type for preview table
    getSectionTagType(section) {
      const tagTypes = {
        'Required': 'danger',
        'Occurrence': 'primary',
        'Taxonomic': 'success',
        'Location': 'warning',
        'Storage': 'info'
      }
      return tagTypes[section] || ''
    },

    // Confirm mappings and continue
    confirmMapping() {
      if (!this.isValid) {
        this.$message.warning('Please map all required fields before continuing')
        return
      }

      // Clean up empty mappings
      const cleanedMappings = {}
      Object.keys(this.mappings).forEach(key => {
        if (this.mappings[key] && this.mappings[key].length > 0) {
          cleanedMappings[key] = this.mappings[key]
        }
      })

      // Check if field number is set to auto-generate (needs special handling)
      if (cleanedMappings.fieldNumber === 'auto-generate') {
        this.$emit('field-number-options', cleanedMappings)
      } else {
        this.$emit('confirm', cleanedMappings)
      }
    },

    // Reset mappings
    resetMappings() {
      this.mappings = {}
      this.showFieldNumberAlert = false
    },

    // Auto-map fields based on column names
    autoMapFields() {
      const autoMappings = {}

      // Enhanced auto-mapping logic with better matching
      this.allFields.forEach(field => {
        const fieldKey = field.key.toLowerCase()

        // Try exact match first
        let matchingColumn = this.sourceColumns.find(column => {
          const columnLower = column.toLowerCase().replace(/[_\s-]/g, '')
          const fieldLower = fieldKey.replace(/[_\s-]/g, '')
          return columnLower === fieldLower
        })

        // Try partial match if exact match not found
        if (!matchingColumn) {
          matchingColumn = this.sourceColumns.find(column => {
            const columnLower = column.toLowerCase()
            return columnLower.includes(fieldKey) ||
              fieldKey.includes(columnLower.replace(/[_\s-]/g, ''))
          })
        }

        // Try common variations
        if (!matchingColumn) {
          const variations = {
            'prevnumber': ['prev', 'previous', 'old', 'original'],
            'fieldnumber': ['field', 'collection', 'collector'],
            'totalnumber': ['count', 'number', 'total', 'quantity'],
            'collectiondate': ['date', 'collected', 'collection'],
            'localitystring': ['locality', 'location', 'site'],
            'localityid': ['locality_id', 'location_id', 'site_id']
          }

          if (variations[fieldKey]) {
            matchingColumn = this.sourceColumns.find(column => {
              const columnLower = column.toLowerCase()
              return variations[fieldKey].some(variation =>
                columnLower.includes(variation)
              )
            })
          }
        }

        if (matchingColumn && !Object.values(autoMappings).includes(matchingColumn)) {
          autoMappings[field.key] = matchingColumn
        }
      })

      this.mappings = { ...this.mappings, ...autoMappings }

      if (Object.keys(autoMappings).length > 0) {
        this.$message.success(`Auto mapping completed: ${Object.keys(autoMappings).length} fields mapped`)
      } else {
        this.$message.info('No matching fields found for auto mapping')
      }
    }
  }
}
</script>

<style scoped>
.field-mapping {
  max-width: 1000px;
  margin: 0 auto;
}

.space-y-6 > * + * {
  margin-top: 1.5rem;
}

.field-section {
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-title.required {
  color: #dc2626;
}

.section-description {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 1rem;
}

.field-card {
  margin-bottom: 1rem;
}

.field-row {
  display: flex;
  justify-content: between;
  align-items: center;
  gap: 1rem;
}

.field-info {
  flex: 1;
}

.field-label {
  font-weight: 500;
  display: inline-block;
}

.field-label.required {
  color: #dc2626;
}

.required-indicator {
  color: #dc2626;
  margin-left: 0.25rem;
}

.field-description {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.field-select {
  width: 320px;
  flex-shrink: 0;
}

.validation-summary {
  border-left: 4px solid #3b82f6;
  background-color: #f0f9ff;
}

.summary-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.summary-item {
  display: flex;
  justify-content: between;
  align-items: center;
}

.summary-label {
  font-weight: 500;
}

.summary-value {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.summary-value.success {
  color: #059669;
}

.summary-value.error {
  color: #dc2626;
}

.summary-value.info {
  color: #2563eb;
}

.actions {
  display: flex;
  justify-content: between;
  align-items: center;
  margin-top: 2rem;
}

.right-actions {
  display: flex;
  gap: 0.5rem;
}

.preview-content {
  max-height: 600px;
  overflow-y: auto;
}

.required-field {
  font-weight: 600;
  color: #dc2626;
}

.mapped-value {
  color: #059669;
  font-weight: 500;
}

.unmapped-value {
  color: #6b7280;
  font-style: italic;
}

.description-text {
  font-size: 0.875rem;
  color: #6b7280;
}
</style>
