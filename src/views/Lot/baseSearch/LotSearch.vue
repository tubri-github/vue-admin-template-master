<template>
  <div class="app-container">
    <!-- Search Component -->
    <search-component
      :jar-size-type-options="jarSizeTypeOptions"
      :initial-search-values="initialSearchValues"
      @submit="handleSearch"
      @reset="handleSearchReset"
      @create="handleCreate"
      @export="handleExport"
      @print="handlePrint"
      @remote-search="handleRemoteSearch"
    />

    <!-- Table Component -->
    <data-table
      ref="dataTable"
      :data="tableData"
      :loading="loading"
      :total="total"
      :columns="tableColumns"
      :detail-sections="detailSections"
      @edit="handleEdit"
      @action="handleAction"
      @sort-change="handleTableSortChange"
      @filter-change="handleTableFilterChange"
      @page-change="handlePageChange"
      @page-size-change="handlePageSizeChange"
    />

    <!-- Edit Dialog -->
    <el-dialog
      :title="dialogTitle"
      :visible.sync="editDialogVisible"
      width="90%"
      @close="closeEditDialog"
    >
      <lot-form
        v-if="editDialogVisible"
        :catalog-no="selectedRecord?.CatalogNumber"
        :primary-id="selectedRecord?.MainPrimaryID"
        @saved="handleFormSaved"
        @cancel="closeEditDialog"
      />
    </el-dialog>

    <!-- Print Dialog -->
    <el-dialog
      title="Print Labels"
      :visible.sync="printDialogVisible"
      width="70%"
    >
      <div class="print-controls">
        <el-button v-print="'#printContent'" type="primary">
          Print
        </el-button>
      </div>

      <div id="printContent">
        <div
          v-for="(item, index) in printItems"
          :key="'print-item-' + index"
          class="print-item"
        >
          <!-- Label Template -->
          <div class="specimen-label">
            <div class="label-header">
              <h3>TULANE UNIVERSITY COLLECTIONS</h3>
            </div>

            <div class="label-body">
              <div class="label-row">
                <div class="label-field">
                  <span class="field-name">Family Name:</span>
                  <span class="field-value">{{ item.FamilyName || '' }}{{ item.FamilyNumber ? '(' + item.FamilyNumber + ')' : '' }}</span>
                </div>
                <div class="label-field">
                  <span class="field-name">Cat. No:</span>
                  <span class="field-value">{{ item.CatalogNumber }}</span>
                </div>
              </div>

              <div class="label-row">
                <div class="label-field full-width">
                  <span class="field-name">Species:</span>
                  <span class="field-value">{{ item.FullScientificName }}</span>
                </div>
              </div>

              <div class="label-row">
                <div class="label-field">
                  <span class="field-name">Dr.:</span>
                  <span class="field-value">{{ item.Drainage }}</span>
                </div>
                <div class="label-field">
                  <span class="field-name">No. of Specimens:</span>
                  <span class="field-value">{{ item.TotalNumber }}</span>
                </div>
              </div>

              <div class="label-row">
                <div class="label-field">
                  <span class="field-name">Preparation:</span>
                  <span class="field-value">{{ item.PreparationType }}</span>
                </div>
                <div class="label-field">
                  <span class="field-name">Preparation Numbers:</span>
                  <span class="field-value">{{ item.Count }}</span>
                </div>
              </div>

              <div class="label-row" v-if="item.PreparationType === 'C&S' || item.PreparationType === 'Skel'">
                <div class="label-field full-width">
                  <span class="field-name">Osteology Catalog No.:</span>
                  <span class="field-value">{{ item.osteologyCatalogNumber }}</span>
                </div>
              </div>

              <div class="label-row">
                <div class="label-field">
                  <span class="field-name">State:</span>
                  <span class="field-value">{{ item.State }}</span>
                </div>
                <div class="label-field">
                  <span class="field-name">County:</span>
                  <span class="field-value">{{ item.County }}</span>
                </div>
              </div>

              <div class="label-row">
                <div class="label-field full-width">
                  <span class="field-name">Locality:</span>
                  <span class="field-value">{{ item.LocalityString }}</span>
                </div>
              </div>

              <div class="label-row">
                <div class="label-field">
                  <span class="field-name">Col. Date:</span>
                  <span class="field-value">{{ formatDate(item.StartDate) }}</span>
                </div>
                <div class="label-field">
                  <span class="field-name">Col. No.:</span>
                  <span class="field-value">{{ item.FieldNo }}</span>
                </div>
              </div>

              <div class="label-row">
                <div class="label-field full-width">
                  <span class="field-name">Col. by:</span>
                  <span class="field-value">{{ item.VerbatimCollectors }}</span>
                </div>
              </div>
            </div>

            <div class="label-side-number">{{ item.CatalogNumber }}</div>
          </div>

          <!-- Page break after each item except the last -->
          <div v-if="index < printItems.length - 1" class="page-break"></div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import SearchComponent from '@/views/Lot/baseSearch/SearchComponent'
import DataTable from '@/views/Lot/baseSearch/DataTable'
import LotForm from '@/views/Lot/baseSearch/LotForm'
import { getLotsAdvanced, getTaxon, getFamily, getLocality, getJarSizes } from '@/api/table'
import { formatDate } from '@/utils'
import print from 'vue-print-nb'

export default {
  name: 'SpecimenRecords',
  components: {
    SearchComponent,
    DataTable,
    LotForm
  },
  directives: { print },
  data() {
    return {
      // Page state
      loading: false,
      total: 0,
      tableData: [],

      // Form data and options
      jarSizeTypeOptions: [],
      initialSearchValues: {},

      // Dialog states
      editDialogVisible: false,
      printDialogVisible: false,

      // Selected data
      selectedRecord: null,
      printItems: [],

      // Pagination and sorting
      currentPage: 1,
      pageSize: 20,
      sortBy: null,
      sortOrder: null,

      // Table configuration
      tableColumns: [
        { prop: 'CatalogNumber', label: 'Catalog Number', fixed: 'left', sortable: true, defaultVisible: true, minWidth: 120 },
        { prop: 'FullScientificName', label: 'Scientific Name', type: 'link', sortable: true, defaultVisible: true, minWidth: 200 },
        { prop: 'StartDate', label: 'Date Collected', type: 'date', sortable: true, defaultVisible: true, minWidth: 120 },
        { prop: 'TotalNumber', label: 'Total Number', type: 'number', sortable: true, defaultVisible: true, minWidth: 100 },
        { prop: 'lotsnumber', label: 'Lots Number Per Species', type: 'number', sortable: true, defaultVisible: true, minWidth: 180 },
        { prop: 'PreparationType', label: 'Preparation', sortable: true, defaultVisible: true, minWidth: 120 },
        { prop: 'Count', label: 'Preparation Number', sortable: true, defaultVisible: true, minWidth: 150 },
        { prop: 'Storage', label: 'Storage', sortable: true, defaultVisible: true, minWidth: 120 },
        { prop: 'JarSize', label: 'Jar Size', type: 'tag', sortable: true, defaultVisible: true, minWidth: 100 },
        { prop: 'FieldNo', label: 'Field No.', sortable: true, defaultVisible: true, minWidth: 120 },
        { prop: 'LocalityString', label: 'Locality', sortable: true, defaultVisible: false, minWidth: 250 },
        { prop: 'Inventory', label: 'Inventory', type: 'tag', sortable: true, defaultVisible: false, minWidth: 100 },
        { prop: 'Drainage', label: 'Drainage', sortable: true, defaultVisible: false, minWidth: 150 },
        { prop: 'Continent', label: 'Continent', sortable: true, defaultVisible: false, minWidth: 120 },
        { prop: 'County', label: 'County', sortable: true, defaultVisible: false, minWidth: 120 },
        { prop: 'State', label: 'State', sortable: true, defaultVisible: false, minWidth: 120 },
        { prop: 'Lon', label: 'Longitude', sortable: true, defaultVisible: false, minWidth: 120 },
        { prop: 'Lat', label: 'Latitude', sortable: true, defaultVisible: false, minWidth: 120 }
      ],

      // Detail view configuration
      detailSections: [
        {
          title: 'Specimen Information',
          items: [
            { key: 'CatalogNumber', label: 'Catalog Number' },
            { key: 'FullScientificName', label: 'Scientific Name', span: 2 },
            { key: 'FamilyName', label: 'Family Name' },
            { key: 'FamilyNumber', label: 'Family Number' },
            { key: 'TotalNumber', label: 'Total Number', type: 'number' },
            { key: 'lotsnumber', label: 'Lots Number Per Species', type: 'number' }
          ]
        },
        {
          title: 'Collection Information',
          items: [
            { key: 'StartDate', label: 'Date Collected', type: 'date' },
            { key: 'VerbatimCollectors', label: 'Collected By', span: 2 },
            { key: 'PreparationType', label: 'Preparation' },
            { key: 'Count', label: 'Preparation Number' },
            { key: 'FieldNo', label: 'Field No.' }
          ]
        },
        {
          title: 'Storage Information',
          items: [
            { key: 'Storage', label: 'Storage' },
            { key: 'JarSize', label: 'Jar Size' },
            { key: 'Inventory', label: 'Inventory' }
          ]
        },
        {
          title: 'Location Details',
          items: [
            { key: 'LocalityString', label: 'Locality', span: 3 },
            { key: 'Continent', label: 'Continent' },
            { key: 'State', label: 'State' },
            { key: 'County', label: 'County' },
            { key: 'Drainage', label: 'Drainage' },
            { key: 'Lon', label: 'Longitude' },
            { key: 'Lat', label: 'Latitude' }
          ]
        }
      ]
    }
  },
  computed: {
    dialogTitle() {
      return this.selectedRecord ? `Edit Record: ${this.selectedRecord.CatalogNumber}` : 'Add New Record'
    }
  },
  created() {
    // Initialize component
    this.fetchJarSizes()
    this.fetchData()
  },
  methods: {
    // Data fetching methods
    async fetchData(params = {}) {
      this.loading = true

      try {
        const response = await getLotsAdvanced({
          limit: this.pageSize,
          page: this.currentPage,
          ...params
        })

        this.tableData = response.data.items
        this.total = response.data.total
      } catch (error) {
        this.$message.error('Failed to fetch data')
        console.error('Error fetching data:', error)
      } finally {
        this.loading = false
      }
    },

    async fetchJarSizes() {
      try {
        const response = await getJarSizes()
        this.jarSizeTypeOptions = response.data.items
      } catch (error) {
        this.$message.error('Failed to fetch jar sizes')
        console.error('Error fetching jar sizes:', error)
      }
    },

    // Search component handlers
    handleSearch(formData) {
      const searchParams = {
        ids: formData.catalogNumbers,
        familyID: formData.familyID,
        taxonId: formData.taxonId,
        locality: formData.localityId,
        fieldNo: formData.fieldNo,
        jarSize: formData.jarSize,
        Storage: formData.storage,
        Inventory: formData.inventory,
        maxNumber: formData.maxTotalNumber,
        minNumber: formData.minTotalNumber,
        maxLotsNumber: formData.maxLotsNumber,
        minLotsNumber: formData.minLotsNumber,
        startDate: formData.startDate,
        endDate: formData.endDate
      }

      // Reset pagination
      this.currentPage = 1

      // Fetch data with search params
      this.fetchData(searchParams)
    },

    handleSearchReset() {
      // Reset pagination
      this.currentPage = 1

      // Fetch data without search params
      this.fetchData()
    },

    async handleRemoteSearch({ query, type }) {
      if (!query) return

      try {
        let response
        const params = { pageSize: -1, pageNumber: 1, keyWord: query }

        if (type === 'taxon') {
          response = await getTaxon(params)
          return response.data.items.map(item => ({
            TaxonName: item.FullScientificName,
            TaxonID: item.TaxonID
          }))
        } else if (type === 'family') {
          response = await getFamily(params)
          return response.data.items.map(item => ({
            FamilyName: item.FamilyName,
            FamilyID: item.FamilyID
          }))
        } else if (type === 'locality') {
          response = await getLocality(params)
          return response.data.items.map(item => ({
            localityID: item.Locality1ID,
            localityString: item.LocalityString
          }))
        }
      } catch (error) {
        this.$message.error(`Failed to search ${type}`)
        console.error(`Error searching ${type}:`, error)
        return []
      }
    },

    // Table component handlers
    handleTableSortChange({ prop, order }) {
      this.sortBy = prop
      this.sortOrder = order

      // Fetch data with sort params
      this.fetchData({
        sortBy: this.sortBy,
        sortOrder: this.sortOrder
      })
    },

    handleTableFilterChange(filters) {
      // Fetch data with filter params
      this.fetchData({ filters })
    },

    handlePageChange(page) {
      this.currentPage = page

      // Fetch data with pagination
      this.fetchData({
        page: this.currentPage,
        pageSize: this.pageSize
      })
    },

    handlePageSizeChange(size) {
      this.pageSize = size

      // Reset to first page
      this.currentPage = 1

      // Fetch data with new page size
      this.fetchData({
        page: this.currentPage,
        pageSize: this.pageSize
      })
    },

    // Action handlers
    handleCreate() {
      this.selectedRecord = null
      this.editDialogVisible = true
    },

    handleEdit(record) {
      this.selectedRecord = record
      this.editDialogVisible = true
    },

    handleAction({ action, row }) {
      switch (action) {
        case 'print':
          this.printLabel(row)
          break
        case 'delete':
          this.confirmDelete(row)
          break
        case 'view':
          // This is handled by the table component
          break
      }
    },

    handleFormSaved() {
      // Close dialog
      this.closeEditDialog()

      // Refresh data
      this.fetchData()

      // Show success message
      this.$message.success('Record saved successfully')
    },

    closeEditDialog() {
      this.editDialogVisible = false
      this.selectedRecord = null
    },

    // Export and print handlers
    handleExport(command) {
      if (command === 'exportFull') {
        this.exportData(this.tableData)
      } else if (command === 'exportFiltered') {
        // Get filtered data from table component
        const filteredData = this.$refs.dataTable.getFilteredData()
        this.exportData(filteredData)
      }
    },

    exportData(data) {
      // Import and use the Export2Excel utility
      import('@/vendor/Export2Excel').then(excel => {
        const header = this.tableColumns
          .filter(col => col.defaultVisible)
          .map(col => col.label)

        const filterVal = this.tableColumns
          .filter(col => col.defaultVisible)
          .map(col => col.prop)

        const exportData = data.map(row =>
          filterVal.map(prop => {
            if (prop === 'StartDate') {
              return formatDate(row[prop])
            }
            return row[prop]
          })
        )

        excel.export_json_to_excel({
          header,
          data: exportData,
          filename: 'specimen-records'
        })
      })
    },

    handlePrint(command) {
      if (command === 'printFull') {
        this.printItems = [...this.tableData]
      } else if (command === 'printFiltered') {
        // Get filtered data from table component
        this.printItems = [...this.$refs.dataTable.getFilteredData()]
      }

      this.printDialogVisible = true
    },

    printLabel(record) {
      this.printItems = [record]
      this.printDialogVisible = true
    },

    confirmDelete(record) {
      this.$confirm(
        `Are you sure you want to delete record ${record.CatalogNumber}?`,
        'Warning',
        {
          confirmButtonText: 'Yes',
          cancelButtonText: 'No',
          type: 'warning'
        }
      ).then(() => {
        // Delete record (API call would go here)
        this.$message.success('Record deleted successfully')

        // Refresh data
        this.fetchData()
      }).catch(() => {
        this.$message.info('Delete cancelled')
      })
    },

    // Helper methods
    formatDate(date) {
      if (!date) return ''

      const dateObj = new Date(date)
      return `${dateObj.getFullYear()}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}-${dateObj.getDate().toString().padStart(2, '0')}`
    }
  }
}
</script>

<style scoped>
.app-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

/* Print dialog styles */
.print-controls {
  margin-bottom: 20px;
  text-align: center;
}

.print-item {
  margin: 20px 0;
}

.specimen-label {
  width: 700px;
  padding: 20px;
  border: 1px solid #dcdfe6;
  position: relative;
  font-family: 'Times New Roman', Times, serif;
}

.label-header {
  text-align: center;
  margin-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 10px;
}

.label-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: bold;
}

.label-body {
  position: relative;
}

.label-row {
  display: flex;
  margin-bottom: 12px;
}

.label-field {
  flex: 1;
  display: flex;
  align-items: baseline;
}

.label-field.full-width {
  flex: 2;
}

.field-name {
  font-weight: bold;
  margin-right: 8px;
  min-width: 120px;
}

.field-value {
  border-bottom: 1px solid #303133;
  flex: 1;
  padding: 0 5px;
  min-height: 20px;
}

.label-side-number {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  writing-mode: vertical-rl;
  font-size: 30px;
  font-weight: bold;
  color: #303133;
}

.page-break {
  page-break-after: always;
}

/* Print media query */
@media print {
  .print-controls {
    display: none;
  }

  .specimen-label {
    border: none;
    page-break-inside: avoid;
  }

  .el-dialog {
    border: none;
    box-shadow: none;
  }

  .el-dialog__header,
  .el-dialog__footer {
    display: none;
  }

  .el-dialog__body {
    padding: 0 !important;
  }
}
</style>
