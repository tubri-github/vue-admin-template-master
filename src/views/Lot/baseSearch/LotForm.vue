<template>
  <div class="lot-form">
    <el-form ref="form" :model="formData" label-width="140px" :rules="rules">
      <!-- Basic Information Section -->
      <div class="form-section">
        <h3 class="section-title">Basic Information</h3>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Catalog Number" prop="catalogNumber">
              <el-input v-model="formData.catalogNumber" />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="Previous Number">
              <el-input v-model="formData.prevNumber" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Date Cataloged">
              <el-date-picker
                v-model="formData.dateCataloged"
                type="date"
                placeholder="Select date"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>

          <el-col :span="12">
            <el-form-item label="Cataloger">
              <el-select v-model="formData.cataloger" style="width: 100%">
                <el-option
                  v-for="item in catalogers"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- Storage Information Section -->
      <div class="form-section">
        <h3 class="section-title">Storage Information</h3>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="Jar Size">
              <el-select v-model="formData.jarSize" style="width: 100%">
                <el-option
                  v-for="(item, index) in jarSizeOptions"
                  :key="'jarSize' + index"
                  :label="item.JarSize"
                  :value="item.JarSize"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="Storage">
              <el-input v-model="formData.storage" />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="Inventory">
              <el-input v-model="formData.inventory" />
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- Taxonomic Information Section -->
      <div class="form-section">
        <h3 class="section-title">Taxonomic Information</h3>

        <div class="table-actions">
          <el-button type="primary" size="small" @click="addDetermination">Add Determination</el-button>
        </div>

        <el-table
          ref="determinationTable"
          :data="formData.determinations"
          border
          style="width: 100%"
        >
          <el-table-column type="selection" width="55" />

          <el-table-column label="Current" width="80">
            <template slot-scope="scope">
              <el-radio
                v-model="currentDeterminationIndex"
                :label="scope.$index"
                @change="updateCurrentDetermination"
              >&nbsp;</el-radio>
            </template>
          </el-table-column>

          <el-table-column label="Scientific Name" min-width="200">
            <template slot-scope="scope">
              <el-autocomplete
                v-model="scope.row.scientificName"
                :fetch-suggestions="querySearchTaxon"
                style="width: 100%"
                placeholder="Enter scientific name"
              />
            </template>
          </el-table-column>

          <el-table-column label="Determiner" min-width="150">
            <template slot-scope="scope">
              <el-autocomplete
                v-model="scope.row.determiner"
                :fetch-suggestions="querySearchDeterminer"
                style="width: 100%"
                placeholder="Enter determiner"
              />
            </template>
          </el-table-column>

          <el-table-column label="Date" width="180">
            <template slot-scope="scope">
              <el-date-picker
                v-model="scope.row.date"
                type="date"
                placeholder="Select date"
                style="width: 100%"
              />
            </template>
          </el-table-column>

          <el-table-column label="Remarks" min-width="150">
            <template slot-scope="scope">
              <el-input v-model="scope.row.remarks" />
            </template>
          </el-table-column>

          <el-table-column label="Actions" width="120">
            <template slot-scope="scope">
              <el-button
                type="danger"
                icon="el-icon-delete"
                size="mini"
                circle
                @click="removeDetermination(scope.$index)"
              />
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- Preparation Section -->
      <div class="form-section">
        <h3 class="section-title">Preparation</h3>

        <div class="table-actions">
          <el-button type="primary" size="small" @click="addPreparation">Add Preparation</el-button>
        </div>

        <el-table
          ref="preparationTable"
          :data="formData.preparations"
          border
          style="width: 100%"
        >
          <el-table-column label="Preparation Type" min-width="200">
            <template slot-scope="scope">
              <el-select v-model="scope.row.type" style="width: 100%">
                <el-option
                  v-for="(item, index) in preparationTypes"
                  :key="'prepType' + index"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
            </template>
          </el-table-column>

          <el-table-column label="Count" width="120">
            <template slot-scope="scope">
              <el-input-number
                v-model="scope.row.count"
                :min="0"
                :max="1000"
                style="width: 100%"
              />
            </template>
          </el-table-column>

          <el-table-column label="Actions" width="120">
            <template slot-scope="scope">
              <el-button
                type="danger"
                icon="el-icon-delete"
                size="mini"
                circle
                @click="removePreparation(scope.$index)"
              />
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- Locality Section -->
      <div class="form-section">
        <h3 class="section-title">Locality Information</h3>

        <el-form-item label="Locality" prop="locality">
          <el-select
            v-model="formData.localityId"
            filterable
            remote
            :remote-method="remoteSearchLocality"
            style="width: 100%"
            placeholder="Search for locality"
          >
            <el-option
              v-for="(item, index) in localityOptions"
              :key="'locality' + index"
              :label="item.localityString"
              :value="item.localityID"
            />
          </el-select>
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="Field No.">
              <el-input v-model="formData.fieldNo" />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="Type Status">
              <el-input v-model="formData.typeStatus" />
            </el-form-item>
          </el-col>

          <el-col :span="8">
            <el-form-item label="Total Number" prop="totalNumber">
              <el-input-number
                v-model="formData.totalNumber"
                :min="0"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </div>

      <!-- Additional Information Section -->
      <div class="form-section">
        <h3 class="section-title">Additional Information</h3>

        <el-form-item label="Remarks">
          <el-input
            type="textarea"
            v-model="formData.remarks"
            :rows="4"
            placeholder="Add any additional notes or remarks"
          />
        </el-form-item>
      </div>

      <!-- Form Actions -->
      <div class="form-actions">
        <el-button @click="cancel">Cancel</el-button>
        <el-button type="primary" @click="submitForm">Save</el-button>
      </div>
    </el-form>
  </div>
</template>

<script>
import { getLot, updateLot, createLot, getTaxon, getLocality, getJarSizes } from '@/api/table'
import _ from 'lodash'

export default {
  name: 'LotForm',
  props: {
    catalogNo: {
      type: String,
      default: null
    },
    primaryId: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      loading: false,
      formData: {
        catalogNumber: '',
        prevNumber: '',
        dateCataloged: null,
        jarSize: '',
        cataloger: '',
        storage: '',
        inventory: '',
        determinations: [],
        preparations: [],
        localityId: null,
        fieldNo: '',
        typeStatus: '',
        totalNumber: 0,
        remarks: ''
      },
      // Form validation rules
      rules: {
        catalogNumber: [
          { required: true, message: 'Catalog Number is required', trigger: 'blur' }
        ],
        totalNumber: [
          { required: true, type: 'number', message: 'Total Number is required', trigger: 'blur' }
        ],
        locality: [
          { required: true, message: 'Locality is required', trigger: 'change' }
        ]
      },
      // Options for select components
      catalogers: [
        { label: 'Mike', value: 'Mike' },
        { label: 'Jack', value: 'Jack' },
        { label: 'Sarah', value: 'Sarah' },
        { label: 'Emily', value: 'Emily' }
      ],
      jarSizeOptions: [],
      preparationTypes: [
        { label: 'Fluid', value: 'Fluid' },
        { label: 'Skeletal', value: 'Skel' },
        { label: 'Cleared and Stained', value: 'C&S' },
        { label: 'Dried', value: 'Dried' }
      ],
      localityOptions: [],

      // For taxonomic determinations
      currentDeterminationIndex: 0,
      taxonOptions: []
    }
  },
  created() {
    this.fetchJarSizes()

    if (this.catalogNo && this.primaryId) {
      this.fetchLotData()
    }
  },
  methods: {
    async fetchLotData() {
      this.loading = true

      try {
        const response = await getLot({
          catalogNo: this.catalogNo,
          primaryId: this.primaryId
        })

        if (response.data) {
          // Map API data to form data
          this.mapDataToForm(response.data)
        }
      } catch (error) {
        this.$message.error('Failed to fetch lot data')
        console.error('Error fetching lot data:', error)
      } finally {
        this.loading = false
      }
    },

    async fetchJarSizes() {
      try {
        const response = await getJarSizes()
        this.jarSizeOptions = response.data.items || []
      } catch (error) {
        console.error('Error fetching jar sizes:', error)
      }
    },

    mapDataToForm(data) {
      // Map the API response data to the form model
      this.formData = {
        catalogNumber: data.CatalogNumber || '',
        prevNumber: data.PrevNumber || '',
        dateCataloged: data.DateCataloged ? new Date(data.DateCataloged) : null,
        jarSize: data.JarSize || '',
        cataloger: data.CatalogerID || '',
        storage: data.Storage || '',
        inventory: data.Inventory || '',
        determinations: this.mapDeterminations(data.Determinations || []),
        preparations: this.mapPreparations(data.Preparations || []),
        localityId: data.LocalityID || null,
        fieldNo: data.FieldNo || '',
        typeStatus: data.TypeStatus || '',
        totalNumber: data.TotalNumber || 0,
        remarks: data.Remarks || ''
      }

      // Set current determination
      if (this.formData.determinations.length > 0) {
        this.currentDeterminationIndex = this.formData.determinations.findIndex(d => d.isCurrent) || 0
      }
    },

    mapDeterminations(determinations) {
      return determinations.map(d => ({
        id: d.DeterminationID || null,
        taxonId: d.TaxonID || null,
        scientificName: d.ScientificName || '',
        determiner: d.Determiner || '',
        date: d.DeterminationDate ? new Date(d.DeterminationDate) : null,
        remarks: d.Remarks || '',
        isCurrent: d.IsCurrent || false
      }))
    },

    mapPreparations(preparations) {
      return preparations.map(p => ({
        id: p.PreparationID || null,
        type: p.PreparationType || '',
        count: p.Count || 0
      }))
    },

    addDetermination() {
      this.formData.determinations.push({
        id: null,
        taxonId: null,
        scientificName: '',
        determiner: '',
        date: new Date(),
        remarks: '',
        isCurrent: false
      })
    },

    removeDetermination(index) {
      this.formData.determinations.splice(index, 1)

      // Update current determination index if needed
      if (this.currentDeterminationIndex === index) {
        this.currentDeterminationIndex = 0
        this.updateCurrentDetermination()
      } else if (this.currentDeterminationIndex > index) {
        this.currentDeterminationIndex--
      }
    },

    updateCurrentDetermination() {
      // Update current flag for all determinations
      this.formData.determinations.forEach((det, idx) => {
        det.isCurrent = idx === this.currentDeterminationIndex
      })
    },

    addPreparation() {
      this.formData.preparations.push({
        id: null,
        type: '',
        count: 0
      })
    },

    removePreparation(index) {
      this.formData.preparations.splice(index, 1)
    },

    // Remote search methods
    querySearchTaxon: _.debounce(async function(query, callback) {
      if (query.length < 2) {
        callback([])
        return
      }

      try {
        const response = await getTaxon({
          pageSize: 10,
          pageNumber: 1,
          keyWord: query
        })

        const suggestions = response.data.items.map(item => ({
          value: item.FullScientificName,
          id: item.TaxonID
        }))

        callback(suggestions)
      } catch (error) {
        console.error('Error searching taxa:', error)
        callback([])
      }
    }, 300),

    querySearchDeterminer(query, callback) {
      // This could be replaced with an API call to get a list of determiners
      const determiners = [
        { value: 'John Smith' },
        { value: 'Jane Doe' },
        { value: 'Michael Johnson' },
        { value: 'Sarah Williams' },
        { value: 'David Brown' }
      ]

      const results = query
        ? determiners.filter(item => item.value.toLowerCase().includes(query.toLowerCase()))
        : determiners

      callback(results)
    },

    remoteSearchLocality: _.debounce(async function(query) {
      if (query.length < 2) {
        this.localityOptions = []
        return
      }

      try {
        const response = await getLocality({
          pageSize: 10,
          pageNumber: 1,
          keyWord: query
        })

        this.localityOptions = response.data.items.map(item => ({
          localityID: item.Locality1ID,
          localityString: item.LocalityString
        }))
      } catch (error) {
        console.error('Error searching localities:', error)
        this.localityOptions = []
      }
    }, 300),

    // Form submission methods
    submitForm() {
      this.$refs.form.validate(async valid => {
        if (!valid) {
          this.$message.error('Please correct the errors in the form')
          return
        }

        this.loading = true

        try {
          // Prepare data for API
          const data = this.prepareFormData()

          // Call API to save data
          if (this.catalogNo && this.primaryId) {
            await updateLot(data)
            this.$message.success('Record updated successfully')
          } else {
            await createLot(data)
            this.$message.success('Record created successfully')
          }

          // Emit event to parent
          this.$emit('saved')
        } catch (error) {
          this.$message.error('Failed to save record')
          console.error('Error saving record:', error)
        } finally {
          this.loading = false
        }
      })
    },

    prepareFormData() {
      // Transform form data to the format expected by the API
      return {
        CatalogNumber: this.formData.catalogNumber,
        PrevNumber: this.formData.prevNumber,
        DateCataloged: this.formData.dateCataloged,
        JarSize: this.formData.jarSize,
        CatalogerID: this.formData.cataloger,
        Storage: this.formData.storage,
        Inventory: this.formData.inventory,
        Determinations: this.formData.determinations.map(d => ({
          DeterminationID: d.id,
          TaxonID: d.taxonId,
          ScientificName: d.scientificName,
          Determiner: d.determiner,
          DeterminationDate: d.date,
          Remarks: d.remarks,
          IsCurrent: d.isCurrent
        })),
        Preparations: this.formData.preparations.map(p => ({
          PreparationID: p.id,
          PreparationType: p.type,
          Count: p.count
        })),
        LocalityID: this.formData.localityId,
        FieldNo: this.formData.fieldNo,
        TypeStatus: this.formData.typeStatus,
        TotalNumber: this.formData.totalNumber,
        Remarks: this.formData.remarks,
        // If this is an update, include the primary ID
        ...(this.primaryId ? { MainPrimaryID: this.primaryId } : {})
      }
    },

    cancel() {
      this.$emit('cancel')
    }
  }
}
</script>

<style scoped>
.lot-form {
  max-width: 100%;
  margin: 0 auto;
}

.form-section {
  margin-bottom: 30px;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.section-title {
  margin-top: 0;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ebeef5;
  font-size: 18px;
  color: #303133;
}

.table-actions {
  margin-bottom: 15px;
  display: flex;
  justify-content: flex-end;
}

.form-actions {
  margin-top: 30px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* Override Element UI styles */
.el-date-editor.el-input,
.el-date-editor.el-input__inner {
  width: 100%;
}

.el-input-number {
  width: 100%;
}

@media (max-width: 768px) {
  .el-form-item__label {
    width: 100% !important;
    text-align: left;
  }

  .el-form-item__content {
    margin-left: 0 !important;
  }
}
</style>
