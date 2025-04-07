<template>
  <div class="search-container">
    <!-- Simple Search Section -->
    <div class="simple-search">
      <el-row :gutter="20" type="flex" align="middle">
        <el-col :span="8">
          <el-input
            v-model="searchForm.catalogNumbers"
            placeholder="Catalog Numbers (Use ',' to separate multiple)"
            clearable
          >
            <template slot="prepend">Catalog</template>
          </el-input>
        </el-col>

        <el-col :span="8">
          <el-select
            v-model="searchForm.taxonId"
            placeholder="Scientific Name"
            filterable
            remote
            clearable
            :remote-method="(query) => remoteMethod(query, 'taxon')"
            :loading="remoteLoading"
            style="width: 100%"
          >
            <el-option
              v-for="(item, index) in taxonOptions"
              :key="'taxonOption' + index"
              :label="item.TaxonName"
              :value="item.TaxonID"
            />
          </el-select>
        </el-col>

        <el-col :span="8">
          <el-select
            v-model="searchForm.familyID"
            placeholder="Family Name"
            filterable
            remote
            clearable
            :remote-method="(query) => remoteMethod(query, 'family')"
            :loading="remoteLoading"
            style="width: 100%"
          >
            <el-option
              v-for="(item, index) in familyOptions"
              :key="'familyOption' + index"
              :label="item.FamilyName"
              :value="item.FamilyID"
            />
          </el-select>
        </el-col>
      </el-row>

      <el-row :gutter="20" type="flex" justify="end" class="action-buttons">
        <el-col :xs="24" :sm="12" :md="6" :lg="4">
          <el-button type="primary" icon="el-icon-search" @click="onSubmit">Search</el-button>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6" :lg="4">
          <el-button plain @click="resetSearch">Clear</el-button>
        </el-col>
      </el-row>
    </div>

    <!-- Advanced Search Section -->
    <el-collapse class="advanced-search">
      <el-collapse-item title="Advanced Search" name="advanced">
        <div class="advanced-section">
          <el-divider content-position="left">Specimen Details</el-divider>

          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="Jar Size">
                <el-select
                  v-model="searchForm.jarSize"
                  placeholder="Select Jar Size"
                  clearable
                  style="width: 100%"
                >
                  <el-option
                    v-for="(item, index) in jarSizeTypeOptions"
                    :key="'jarsizeoption' + index"
                    :label="item.JarSize"
                    :value="item.JarSize"
                  />
                </el-select>
              </el-form-item>
            </el-col>

            <el-col :span="8">
              <el-form-item label="Inventory">
                <el-input v-model="searchForm.inventory" clearable />
              </el-form-item>
            </el-col>

            <el-col :span="8">
              <el-form-item label="Storage">
                <el-input v-model="searchForm.storage" clearable />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="Total Number">
                <el-row :gutter="10">
                  <el-col :span="11">
                    <el-input
                      type="number"
                      v-model.number="searchForm.minTotalNumber"
                      placeholder="Min"
                      :min="0"
                    />
                  </el-col>
                  <el-col :span="2" class="range-separator">
                    <span>-</span>
                  </el-col>
                  <el-col :span="11">
                    <el-input
                      type="number"
                      v-model.number="searchForm.maxTotalNumber"
                      placeholder="Max"
                      :max="10000"
                    />
                  </el-col>
                </el-row>
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="Lots Number Per Species">
                <el-row :gutter="10">
                  <el-col :span="11">
                    <el-input
                      type="number"
                      v-model.number="searchForm.minLotsNumber"
                      placeholder="Min"
                      :min="0"
                    />
                  </el-col>
                  <el-col :span="2" class="range-separator">
                    <span>-</span>
                  </el-col>
                  <el-col :span="11">
                    <el-input
                      type="number"
                      v-model.number="searchForm.maxLotsNumber"
                      placeholder="Max"
                      :max="10000"
                    />
                  </el-col>
                </el-row>
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="Date Range">
            <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="To"
              start-placeholder="Start date"
              end-placeholder="End date"
              style="width: 100%"
              @change="handleDateRangeChange"
            />
          </el-form-item>

          <el-divider content-position="left">Locality Information</el-divider>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="Field No">
                <el-input v-model="searchForm.fieldNo" placeholder="Field No." clearable />
              </el-form-item>
            </el-col>

            <el-col :span="12">
              <el-form-item label="Locality">
                <el-select
                  v-model="searchForm.localityId"
                  placeholder="Select locality"
                  filterable
                  clearable
                  remote
                  style="width: 100%"
                  :remote-method="(query) => remoteMethod(query, 'locality')"
                  :loading="remoteLoading"
                >
                  <el-option
                    v-for="(item, index) in localityList"
                    :key="'local' + index"
                    :label="item.localityString"
                    :value="item.localityID"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </div>
      </el-collapse-item>
    </el-collapse>

    <!-- Action Buttons -->
    <div class="action-buttons-container">
      <el-row :gutter="20">
        <el-col :xs="24" :md="12" :lg="8">
          <div class="left-buttons">
            <el-button
              type="primary"
              icon="el-icon-plus"
              @click="handleCreate"
            >
              Add
            </el-button>
          </div>
        </el-col>

        <el-col :xs="24" :md="12" :lg="16">
          <div class="right-buttons">
            <el-dropdown split-button type="primary" @command="handleExport">
              Export
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item command="exportFull">
                  <i class="el-icon-download"></i> Export Full Results
                </el-dropdown-item>
                <el-dropdown-item command="exportFiltered" :disabled="!isFiltering">
                  <i class="el-icon-download"></i> Export Filtered Results
                </el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>

            <el-dropdown split-button type="info" @command="handlePrint">
              Print
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item command="printFull">
                  <i class="el-icon-printer"></i> Print Full Results
                </el-dropdown-item>
                <el-dropdown-item command="printFiltered" :disabled="!isFiltering">
                  <i class="el-icon-printer"></i> Print Filtered Results
                </el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
          </div>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script>
import _ from 'lodash'

export default {
  name: 'SearchComponent',
  props: {
    // Receive options for various select components
    jarSizeTypeOptions: {
      type: Array,
      default: () => []
    },
    // Initial values for the search form
    initialSearchValues: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      searchForm: {
        catalogNumbers: '',
        taxonId: null,
        familyID: null,
        localityId: null,
        fieldNo: '',
        jarSize: '',
        inventory: '',
        storage: '',
        minTotalNumber: null,
        maxTotalNumber: null,
        minLotsNumber: null,
        maxLotsNumber: null,
        startDate: null,
        endDate: null
      },
      dateRange: null,
      remoteLoading: false,
      taxonOptions: [],
      familyOptions: [],
      localityList: [],
      isFiltering: false
    }
  },
  created() {
    // Initialize form with any provided initial values
    if (this.initialSearchValues) {
      this.searchForm = { ...this.searchForm, ...this.initialSearchValues }
    }
  },
  methods: {
    onSubmit() {
      this.$emit('submit', this.searchForm)
    },
    resetSearch() {
      this.searchForm = {
        catalogNumbers: '',
        taxonId: null,
        familyID: null,
        localityId: null,
        fieldNo: '',
        jarSize: '',
        inventory: '',
        storage: '',
        minTotalNumber: null,
        maxTotalNumber: null,
        minLotsNumber: null,
        maxLotsNumber: null,
        startDate: null,
        endDate: null
      }
      this.dateRange = null
      this.$emit('reset')
    },
    handleCreate() {
      this.$emit('create')
    },
    handleExport(command) {
      this.$emit('export', command)
    },
    handlePrint(command) {
      this.$emit('print', command)
    },
    handleDateRangeChange(value) {
      if (value) {
        this.searchForm.startDate = value[0]
        this.searchForm.endDate = value[1]
      } else {
        this.searchForm.startDate = null
        this.searchForm.endDate = null
      }
    },
    remoteMethod: _.debounce(function(query, type) {
      if (query === '') {
        return
      }

      this.remoteLoading = true
      this.$emit('remote-search', { query, type })
    }, 300)
  }
}
</script>

<style scoped>
.search-container {
  margin-bottom: 20px;
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.simple-search {
  padding: 20px;
  border-bottom: 1px solid #ebeef5;
}

.advanced-search {
  margin-top: 5px;
}

.advanced-section {
  padding: 0 20px;
}

.action-buttons {
  margin-top: 15px;
}

.action-buttons-container {
  padding: 15px 20px;
  background-color: #f9f9f9;
  border-top: 1px solid #ebeef5;
}

.left-buttons, .right-buttons {
  display: flex;
  align-items: center;
}

.left-buttons {
  justify-content: flex-start;
}

.right-buttons {
  justify-content: flex-end;
  gap: 10px;
}

.range-separator {
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 768px) {
  .simple-search .el-col {
    margin-bottom: 10px;
  }

  .right-buttons, .left-buttons {
    justify-content: flex-start;
    margin-top: 10px;
  }
}
</style>
