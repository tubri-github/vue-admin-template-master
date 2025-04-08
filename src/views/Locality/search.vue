<template>
  <div class="locality-search">
    <!-- Search Container -->
    <div class="search-container">
      <div class="search-tabs">
        <div
          class="search-tab"
          :class="{ active: activeTab === 'simple' }"
          @click="activeTab = 'simple'"
        >
          Simple Search
        </div>
        <div
          class="search-tab"
          :class="{ active: activeTab === 'advanced' }"
          @click="activeTab = 'advanced'"
        >
          Advanced Search
        </div>
      </div>

      <!-- Simple Search Form -->
      <el-form v-if="activeTab === 'simple'" id="simple-search" class="search-form">
        <div class="form-group">
          <el-form-item label="Keyword Search">
            <el-input v-model="searchForm.query" placeholder="Enter search terms" />
          </el-form-item>
        </div>
        <el-button type="primary" icon="el-icon-search" @click="onSubmit">Search</el-button>
      </el-form>

      <!-- Advanced Search Form -->
      <el-form v-if="activeTab === 'advanced'" id="advanced-search" class="search-form">
        <div class="form-row">
          <div class="form-col">
            <el-form-item label="Location Description">
              <el-input v-model="searchForm.locality_string" />
            </el-form-item>
            <el-form-item label="Field No#">
              <el-input v-model="searchForm.field_no" />
            </el-form-item>
            <el-form-item label="Drainage">
              <el-input v-model="searchForm.drainage" />
            </el-form-item>
            <el-form-item label="Waterbody">
              <el-input v-model="searchForm.waterbody" />
            </el-form-item>
          </div>

          <div class="form-col">
            <el-form-item label="Country">
              <el-input v-model="searchForm.country" />
            </el-form-item>
            <el-form-item label="State/Province">
              <el-input v-model="searchForm.state" />
            </el-form-item>
            <el-form-item label="County">
              <el-input v-model="searchForm.county" />
            </el-form-item>
            <el-form-item label="Continent">
              <el-input v-model="searchForm.continent" />
            </el-form-item>
          </div>

          <div class="form-col">
            <el-form-item label="Island">
              <el-input v-model="searchForm.island" />
            </el-form-item>
            <el-form-item label="Island Group">
              <el-input v-model="searchForm.island_group" />
            </el-form-item>
            <el-form-item label="Date">
              <el-date-picker v-model="searchForm.start_date" type="date" placeholder="Pick a date" style="width: 100%;" />
            </el-form-item>
            <el-form-item label="Collectors">
              <el-input v-model="searchForm.verbatim_collectors" />
            </el-form-item>
          </div>
        </div>

        <el-form-item>
          <el-checkbox v-model="searchForm.fuzzy">Enable Fuzzy Matching</el-checkbox>
        </el-form-item>

        <el-button type="primary" icon="el-icon-search" @click="onSubmit">Advanced Search</el-button>
      </el-form>
    </div>

    <!-- Loading Indicator -->
    <div v-if="listLoading" id="loading">
      <p>Searching...</p>
    </div>

    <!-- Results Section -->
    <div v-if="!listLoading && showResults" class="results-wrapper">
      <!-- Filters Sidebar -->
      <div v-if="totalResults > 0" id="filters-container">
        <h3>Filter Results</h3>

        <div v-if="filterOptions.country && filterOptions.country.length > 0" id="country-filters">
          <div class="filter-title">Country</div>
          <div id="country-list">
            <div
              v-for="(item, index) in filterOptions.country"
              :key="'country-' + index"
              class="filter-item"
              :class="{ active: currentFilters.country === item.value }"
              @click="applyFilter('country', item.value)"
            >
              <span>{{ item.text }}</span>
              <span class="filter-count">{{ item.count }}</span>
            </div>
            <div
              v-if="currentFilters.country"
              class="filter-item"
              @click="clearFilter('country')"
            >
              <span><strong>Clear Filter</strong></span>
            </div>
          </div>
        </div>

        <div v-if="filterOptions.state && filterOptions.state.length > 0" id="state-filters">
          <div class="filter-title">State/Province</div>
          <div id="state-list">
            <div
              v-for="(item, index) in filterOptions.state"
              :key="'state-' + index"
              class="filter-item"
              :class="{ active: currentFilters.state === item.value }"
              @click="applyFilter('state', item.value)"
            >
              <span>{{ item.text }}</span>
              <span class="filter-count">{{ item.count }}</span>
            </div>
            <div
              v-if="currentFilters.state"
              class="filter-item"
              @click="clearFilter('state')"
            >
              <span><strong>Clear Filter</strong></span>
            </div>
          </div>
        </div>

        <div v-if="filterOptions.drainage && filterOptions.drainage.length > 0" id="drainage-filters">
          <div class="filter-title">Drainage</div>
          <div id="drainage-list">
            <div
              v-for="(item, index) in filterOptions.drainage"
              :key="'drainage-' + index"
              class="filter-item"
              :class="{ active: currentFilters.drainage === item.value }"
              @click="applyFilter('drainage', item.value)"
            >
              <span>{{ item.text }}</span>
              <span class="filter-count">{{ item.count }}</span>
            </div>
            <div
              v-if="currentFilters.drainage"
              class="filter-item"
              @click="clearFilter('drainage')"
            >
              <span><strong>Clear Filter</strong></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Results Container -->
      <div id="results-container">
        <h2>Search Results</h2>
        <div v-if="totalResults > 0" id="results-count">Found {{ totalResults }} results</div>
        <div v-else id="results-count">No matching results found</div>

        <!-- Results Table -->
        <el-table
          v-if="totalResults > 0"
          :data="list"
          border
          fit
          highlight-current-row
          id="results-list"
          @row-click="handleRowClick"
        >
          <el-table-column
            label="Name"
            min-width="180"
          >
            <template slot-scope="{row}">
              <div class="result-title">
                {{ row.name || row.locality_string || 'Unnamed Location' }}
              </div>
            </template>
          </el-table-column>

          <el-table-column
            label="Field No#"
            min-width="120"
          >
            <template slot-scope="{row}">
              <span>{{ row.field_no || '-' }}</span>
            </template>
          </el-table-column>

          <el-table-column
            label="Location"
            min-width="200"
          >
            <template slot-scope="{row}">
              <div class="location-cell">
                {{ row.county ? row.county + ', ' : '' }}
                {{ row.state ? row.state + ', ' : '' }}
                {{ row.country || '' }}
              </div>
            </template>
          </el-table-column>

          <el-table-column
            label="Drainage"
            min-width="150"
          >
            <template slot-scope="{row}">
              <span>{{ row.drainage || '-' }}</span>
            </template>
          </el-table-column>

          <el-table-column
            label="Date"
            min-width="120"
          >
            <template slot-scope="{row}">
              <span>{{ formatDate(row.start_date) || '-' }}</span>
            </template>
          </el-table-column>

          <el-table-column
            label="Waterbody"
            min-width="150"
          >
            <template slot-scope="{row}">
              <span>{{ row.waterbody || '-' }}</span>
            </template>
          </el-table-column>
        </el-table>

        <!-- Pagination -->
        <div v-if="totalResults > 0" id="pagination">
          <el-pagination
            background
            layout="prev, pager, next"
            :total="totalResults"
            :page-size="pageSize"
            :current-page.sync="currentPage"
            @current-change="handlePageChange"
          />
        </div>
      </div>
    </div>

    <!-- Location Details Dialog -->
    <el-dialog
      :title="dialogTitle"
      :visible.sync="detailsVisible"
      width="70%"
      class="details-dialog"
    >
      <div v-if="currentLocation" class="location-details">
        <div class="detail-section">
          <h3>Basic Information</h3>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="label">Name:</span>
              <span class="value">{{ currentLocation.name || currentLocation.locality_string || 'Unnamed Location' }}</span>
            </div>

            <div class="detail-item">
              <span class="label">Field No#:</span>
              <span class="value">{{ currentLocation.field_no || '-' }}</span>
            </div>

            <div class="detail-item">
              <span class="label">Date:</span>
              <span class="value">{{ formatDate(currentLocation.start_date) || '-' }}</span>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h3>Location Details</h3>
          <div class="detail-grid">
            <div class="detail-item full-width">
              <span class="label">Location Description:</span>
              <span class="value">{{ currentLocation.locality_string || '-' }}</span>
            </div>

            <div class="detail-item">
              <span class="label">Continent:</span>
              <span class="value">{{ currentLocation.continent || '-' }}</span>
            </div>

            <div class="detail-item">
              <span class="label">Country:</span>
              <span class="value">{{ currentLocation.country || '-' }}</span>
            </div>

            <div class="detail-item">
              <span class="label">State/Province:</span>
              <span class="value">{{ currentLocation.state || '-' }}</span>
            </div>

            <div class="detail-item">
              <span class="label">County:</span>
              <span class="value">{{ currentLocation.county || '-' }}</span>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h3>Water Features</h3>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="label">Drainage:</span>
              <span class="value">{{ currentLocation.drainage || '-' }}</span>
            </div>

            <div class="detail-item">
              <span class="label">Waterbody:</span>
              <span class="value">{{ currentLocation.waterbody || '-' }}</span>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h3>Island Information</h3>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="label">Island:</span>
              <span class="value">{{ currentLocation.island || '-' }}</span>
            </div>

            <div class="detail-item">
              <span class="label">Island Group:</span>
              <span class="value">{{ currentLocation.island_group || '-' }}</span>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h3>Collection Information</h3>
          <div class="detail-grid">
            <div class="detail-item full-width">
              <span class="label">Collectors:</span>
              <span class="value">{{ currentLocation.verbatim_collectors || '-' }}</span>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h3>Coordinates</h3>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="label">Latitude:</span>
              <span class="value">{{ currentLocation.lat || '-' }}</span>
            </div>

            <div class="detail-item">
              <span class="label">Longitude:</span>
              <span class="value">{{ currentLocation.lon || '-' }}</span>
            </div>
          </div>
        </div>
      </div>

      <span slot="footer" class="dialog-footer">
        <el-button @click="detailsVisible = false">Close</el-button>
        <el-button type="primary" @click="handleEdit(currentLocation)">Edit</el-button>
      </span>
    </el-dialog>

    <!-- Edit Location Dialog -->
    <el-dialog
      :title="dialogTitle"
      :visible.sync="dialogVisible"
      width="80%"
      class="edit-dialog"
    >
      <el-form ref="editForm" :model="editForm" label-width="120px">
        <div class="edit-form-grid">
          <!-- Basic Information -->
          <div class="edit-section">
            <h3>Basic Information</h3>

            <el-form-item label="Name">
              <el-input v-model="editForm.name" />
            </el-form-item>

            <el-form-item label="Field No#">
              <el-input v-model="editForm.field_no" />
            </el-form-item>

            <el-form-item label="Date">
              <el-date-picker
                v-model="editForm.start_date"
                type="date"
                placeholder="Select date"
                style="width: 100%"
              />
            </el-form-item>
          </div>

          <!-- Location Information -->
          <div class="edit-section">
            <h3>Location Information</h3>

            <el-form-item label="Location Description">
              <el-input v-model="editForm.locality_string" type="textarea" :rows="3" />
            </el-form-item>

            <div class="form-row">
              <el-form-item label="Continent">
                <el-input v-model="editForm.continent" />
              </el-form-item>

              <el-form-item label="Country">
                <el-input v-model="editForm.country" />
              </el-form-item>
            </div>

            <div class="form-row">
              <el-form-item label="State/Province">
                <el-input v-model="editForm.state" />
              </el-form-item>

              <el-form-item label="County">
                <el-input v-model="editForm.county" />
              </el-form-item>
            </div>
          </div>

          <!-- Water Features -->
          <div class="edit-section">
            <h3>Water Features</h3>

            <el-form-item label="Drainage">
              <el-input v-model="editForm.drainage" />
            </el-form-item>

            <el-form-item label="Waterbody">
              <el-input v-model="editForm.waterbody" />
            </el-form-item>
          </div>

          <!-- Island Information -->
          <div class="edit-section">
            <h3>Island Information</h3>

            <el-form-item label="Island">
              <el-input v-model="editForm.island" />
            </el-form-item>

            <el-form-item label="Island Group">
              <el-input v-model="editForm.island_group" />
            </el-form-item>
          </div>

          <!-- Collectors Information -->
          <div class="edit-section">
            <h3>Collectors</h3>

            <el-form-item label="Collectors">
              <el-input v-model="editForm.verbatim_collectors" />
            </el-form-item>
          </div>

          <!-- Coordinates -->
          <div class="edit-section">
            <h3>Coordinates</h3>

            <div class="form-row">
              <el-form-item label="Latitude">
                <el-input v-model="editForm.lat" type="number" />
              </el-form-item>

              <el-form-item label="Longitude">
                <el-input v-model="editForm.lon" type="number" />
              </el-form-item>
            </div>
          </div>
        </div>
      </el-form>

      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="saveLocation">Save</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { getLocality, saveLocality, deleteLocality } from '@/api/table'

export default {
  name: 'LocalitySearch',

  data() {
    return {
      activeTab: 'simple',
      searchForm: {
        query: '',
        locality_string: '',
        field_no: '',
        drainage: '',
        waterbody: '',
        country: '',
        state: '',
        county: '',
        continent: '',
        island: '',
        island_group: '',
        start_date: '',
        verbatim_collectors: '',
        fuzzy: true
      },
      listLoading: false,
      showResults: false,
      list: [],
      totalResults: 0,
      currentPage: 1,
      pageSize: 10,
      lastSearchParams: {},
      filterOptions: {
        country: [],
        state: [],
        drainage: []
      },
      currentFilters: {},
      currentLocation: null,
      detailsVisible: false,
      dialogVisible: false,
      dialogTitle: 'Add New Location',
      isEdit: false,
      editForm: {
        id: null,
        name: '',
        field_no: '',
        locality_string: '',
        drainage: '',
        waterbody: '',
        country: '',
        state: '',
        county: '',
        continent: '',
        island: '',
        island_group: '',
        start_date: '',
        verbatim_collectors: '',
        lat: null,
        lon: null
      }
    }
  },

  computed: {
    hasActiveFilters() {
      return Object.keys(this.currentFilters).length > 0
    }
  },

  methods: {
    // Search and result handling
    onSubmit() {
      this.currentPage = 1
      this.performSearch()
    },

    performSearch() {
      this.listLoading = true
      this.showResults = true

      // Build search parameters based on active tab
      const params = { ...this.activeTab === 'simple'
          ? { query: this.searchForm.query }
          : this.searchForm
      }

      // Add pagination
      params.page = this.currentPage
      params.limit = this.pageSize

      // Add current filters
      const searchParams = {
        ...params,
        ...this.currentFilters
      }

      // Store for pagination/filtering
      this.lastSearchParams = { ...searchParams }

      // Call API
      this.fetchResults(searchParams)
    },

    fetchResults(params) {
      // In a real app, this would call your API
      getLocality(params)
        .then(response => {
          this.list = response.data.items
          this.totalResults = response.data.total
          this.updateFilterOptions(response.data.aggregations)
          this.listLoading = false
        })
        .catch(error => {
          console.error('Error fetching locality data:', error)
          this.$message.error('Failed to fetch locality data')
          this.listLoading = false
        })
    },

    // Filter handling
    updateFilterOptions(aggregations) {
      // Process aggregation results into filter options
      if (aggregations) {
        // Country filters
        if (aggregations.countries && aggregations.countries.buckets) {
          this.filterOptions.country = aggregations.countries.buckets
            .filter(bucket => bucket.key)
            .map(bucket => ({
              text: bucket.key,
              value: bucket.key,
              count: bucket.doc_count
            }))
        }

        // State filters
        if (aggregations.states && aggregations.states.buckets) {
          this.filterOptions.state = aggregations.states.buckets
            .filter(bucket => bucket.key)
            .map(bucket => ({
              text: bucket.key,
              value: bucket.key,
              count: bucket.doc_count
            }))
        }

        // Drainage filters
        if (aggregations.drainages && aggregations.drainages.buckets) {
          this.filterOptions.drainage = aggregations.drainages.buckets
            .filter(bucket => bucket.key)
            .map(bucket => ({
              text: bucket.key,
              value: bucket.key,
              count: bucket.doc_count
            }))
        }
      }
    },

    applyFilter(field, value) {
      if (this.currentFilters[field] === value) {
        // If clicking on already selected filter, remove it
        this.clearFilter(field)
      } else {
        // Apply new filter
        this.$set(this.currentFilters, field, value)
        this.currentPage = 1
        this.performSearch()
      }
    },

    clearFilter(field) {
      this.$delete(this.currentFilters, field)
      this.currentPage = 1
      this.performSearch()
    },

    // Pagination
    handlePageChange(page) {
      this.currentPage = page
      this.performSearch()
      // Scroll to top of results
      this.$nextTick(() => {
        const container = document.querySelector('#results-container')
        if (container) {
          container.scrollIntoView({ behavior: 'smooth' })
        }
      })
    },

    // Row click handler
    handleRowClick(row) {
      this.currentLocation = row
      this.detailsVisible = true
    },

    // Edit/Create operations
    handleCreate() {
      this.isEdit = false
      this.dialogTitle = 'Add New Location'
      this.resetEditForm()
      this.dialogVisible = true
    },

    handleEdit(item) {
      this.isEdit = true
      this.dialogTitle = 'Edit Location'
      this.resetEditForm()

      // Populate form with item data
      Object.keys(this.editForm).forEach(key => {
        if (item[key] !== undefined) {
          this.editForm[key] = item[key]
        }
      })

      this.editForm.id = item.id || item._id
      this.detailsVisible = false  // Close details dialog if open
      this.dialogVisible = true
    },

    handleDelete(item, index) {
      this.$confirm('Are you sure you want to delete this location?', 'Warning', {
        confirmButtonText: 'Confirm',
        cancelButtonText: 'Cancel',
        type: 'warning'
      }).then(() => {
        const id = item.id || item._id

        deleteLocality(id)
          .then(() => {
            this.list.splice(index, 1)
            this.totalResults -= 1
            this.$message.success('Location deleted successfully')
          })
          .catch(error => {
            console.error('Delete error:', error)
            this.$message.error('Failed to delete location')
          })
      }).catch(() => {
        // User canceled operation
      })
    },

    saveLocation() {
      // Validate form
      this.$refs.editForm.validate(valid => {
        if (valid) {
          saveLocality(this.editForm)
            .then(() => {
              this.dialogVisible = false
              this.$message.success(`Location ${this.isEdit ? 'updated' : 'created'} successfully`)
              this.performSearch() // Refresh results
            })
            .catch(error => {
              console.error('Save error:', error)
              this.$message.error(`Failed to ${this.isEdit ? 'update' : 'create'} location`)
            })
        }
      })
    },

    resetEditForm() {
      this.editForm = {
        id: null,
        name: '',
        field_no: '',
        locality_string: '',
        drainage: '',
        waterbody: '',
        country: '',
        state: '',
        county: '',
        continent: '',
        island: '',
        island_group: '',
        start_date: '',
        verbatim_collectors: '',
        lat: null,
        lon: null
      }
    },

    // Utility methods
    formatDate(date) {
      if (!date) return ''

      // Handle both Date objects and strings
      const dateObj = typeof date === 'string' ? new Date(date) : date

      if (isNaN(dateObj.getTime())) return ''

      return dateObj.toISOString().split('T')[0]
    },

    getFieldDisplayName(field) {
      const fieldNames = {
        'locality_string': 'Location Description',
        'field_no': 'Field No',
        'drainage': 'Drainage',
        'waterbody': 'Waterbody',
        'country': 'Country',
        'state': 'State/Province',
        'county': 'County',
        'continent': 'Continent',
        'island': 'Island',
        'island_group': 'Island Group',
        'start_date': 'Date',
        'verbatim_collectors': 'Collectors'
      }

      return fieldNames[field] || field
    }
  }
}
</script>

<style scoped>
/* Main container */
.locality-search {
  font-family: Arial, sans-serif;
  line-height: 1.6;
  margin: 0 auto;
  padding: 20px;
  max-width: 1200px;
  background-color: #f9f9f9;
}

/* Search container */
.search-container {
  background: white;
  padding: 20px;
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  margin-bottom: 20px;
}

/* Search tabs */
.search-tabs {
  display: flex;
  margin-bottom: 15px;
  border-bottom: 1px solid #ddd;
}

.search-tab {
  padding: 8px 15px;
  cursor: pointer;
  background: #f1f1f1;
  border: 1px solid #ddd;
  border-bottom: none;
  border-radius: 3px 3px 0 0;
  margin-right: 5px;
}

.search-tab.active {
  background: white;
  border-bottom: 1px solid white;
  margin-bottom: -1px;
  font-weight: bold;
}

/* Form styling */
.search-form {
  margin-bottom: 15px;
}

.form-group {
  margin-bottom: 15px;
}

.form-row {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.form-col {
  flex: 1;
  min-width: 200px;
}

/* Loading indicator */
#loading {
  text-align: center;
  padding: 20px;
}

/* Results wrapper with filter sidebar */
.results-wrapper {
  display: flex;
  gap: 20px;
}

#filters-container {
  background: white;
  padding: 15px;
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  flex: 0 0 250px;
  align-self: flex-start;
}

.filter-title {
  font-weight: bold;
  margin-bottom: 8px;
  padding-bottom: 5px;
  border-bottom: 1px solid #eee;
}

.filter-item {
  display: flex;
  justify-content: space-between;
  padding: 5px 0;
  cursor: pointer;
}

.filter-item:hover {
  background-color: #f5f5f5;
}

.filter-item.active {
  background-color: #f0f7ff;
  font-weight: bold;
}

.filter-count {
  background-color: #e0e0e0;
  border-radius: 10px;
  padding: 2px 8px;
  font-size: 12px;
}

/* Results container */
#results-container {
  background: white;
  padding: 20px;
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  flex: 1;
}

#results-count {
  margin-bottom: 15px;
}

/* Table styling */
#results-list {
  margin-bottom: 20px;
}

.result-title {
  color: #1a73e8;
  cursor: pointer;
}

.result-title:hover {
  text-decoration: underline;
}

.location-cell {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Pagination */
#pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.page-btn {
  margin: 0 5px;
  padding: 5px 10px;
  border: 1px solid #ddd;
  background-color: white;
  cursor: pointer;
  border-radius: 3px;
}

.page-btn.active {
  background-color: #4285f4;
  color: white;
  border-color: #4285f4;
}

/* Details dialog */
.details-dialog .el-dialog__body {
  padding: 20px 30px;
}

.location-details {
  max-height: 60vh;
  overflow-y: auto;
}

.detail-section {
  margin-bottom: 20px;
}

.detail-section h3 {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 10px;
  color: #606266;
  border-left: 3px solid #4285f4;
  padding-left: 10px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 15px;
}

.detail-item {
  display: flex;
  flex-direction: column;
}

.detail-item.full-width {
  grid-column: 1 / -1;
}

.label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 5px;
}

.value {
  font-size: 14px;
  color: #303133;
}

/* Edit dialog */
.edit-dialog .el-dialog__body {
  padding: 20px 30px;
}

.edit-form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 30px;
}

.edit-section {
  margin-bottom: 20px;
}

.edit-section h3 {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 15px;
  color: #606266;
  border-left: 3px solid #4285f4;
  padding-left: 10px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .results-wrapper {
    flex-direction: column;
  }

  #filters-container {
    width: 100%;
  }

  .form-row {
    flex-direction: column;
  }

  .form-col {
    width: 100%;
  }

  .edit-form-grid {
    grid-template-columns: 1fr;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
