<template>
  <div class="loan-catalog">
    <!-- Search Controls -->
    <div class="search-container">
      <el-form ref="form" :model="searchForm" label-width="120px" class="search-form">
        <div class="search-form-row">
          <el-input
            v-model="searchForm.loanId"
            class="loan-search"
            placeholder="Loan number"
            prefix-icon="el-icon-search"
          />

          <el-input
            v-model="searchForm.lowCatalogNumber"
            class="catalog-search"
            placeholder="Catalog numbers (use comma to separate)"
            prefix-icon="el-icon-document"
          />

          <el-select
            v-model="searchForm.taxonId"
            filterable
            remote
            clearable
            class="scientific-name-search"
            placeholder="Search scientific name"
            :remote-method="(query) => remoteMethod(query,'taxon')"
            :loading="remoteLoading"
            no-match-text="No matches found"
          >
            <el-option
              v-for="(item,index) in taxonOptions"
              :key="'taxonOption' + index"
              :label="item.TaxonName"
              :value="item.TaxonID"
            />
          </el-select>

          <el-button type="primary" icon="el-icon-search" class="search-button" @click="onSubmit">
            Search
          </el-button>
        </div>

        <!-- Advanced Search Panel -->
        <el-collapse class="advanced-search-panel">
          <el-collapse-item title="Advanced Search" name="1">
            <div class="advanced-search-content">
              <div class="advanced-search-section">
                <h3>Loan Information</h3>
                <div class="advanced-search-grid">
                  <el-form-item label="Open Date">
                    <div class="date-range-picker">
                      <el-date-picker
                        v-model="searchForm.loanOpenStartDate"
                        type="date"
                        placeholder="Start date"
                        class="date-picker"
                      />
                      <span class="range-separator">-</span>
                      <el-date-picker
                        v-model="searchForm.loanOpenEndDate"
                        type="date"
                        placeholder="End date"
                        class="date-picker"
                      />
                    </div>
                  </el-form-item>

                  <el-form-item label="Closed Date">
                    <div class="date-range-picker">
                      <el-date-picker
                        v-model="searchForm.loanClosedStartDate"
                        type="date"
                        placeholder="Start date"
                        class="date-picker"
                      />
                      <span class="range-separator">-</span>
                      <el-date-picker
                        v-model="searchForm.loanClosedEndDate"
                        type="date"
                        placeholder="End date"
                        class="date-picker"
                      />
                    </div>
                  </el-form-item>

                  <el-form-item label="Loan People">
                    <el-select
                      v-model="searchForm.loanPplID"
                      filterable
                      placeholder="Select loan people"
                      class="full-width"
                    >
                      <el-option
                        v-for="item in loanPeople"
                        :key="item.LoanPeopleID"
                        :label="item.FirstName + ' ' + item.LastName"
                        :value="item.LoanPeopleID"
                      />
                    </el-select>
                  </el-form-item>

                  <el-form-item label="Family">
                    <el-select
                      v-model="searchForm.familyID"
                      filterable
                      remote
                      clearable
                      class="full-width"
                      placeholder="Search family name"
                      :remote-method="(query) => remoteMethod(query,'family')"
                      :loading="remoteLoading"
                      no-match-text="No matches found"
                    >
                      <el-option
                        v-for="(item,index) in familyOptions"
                        :key="'familyOption' + index"
                        :label="item.FamilyName"
                        :value="item.FamilyID"
                      />
                    </el-select>
                  </el-form-item>
                </div>
              </div>

              <div class="advanced-search-section">
                <h3>Specimen Information</h3>
                <div class="advanced-search-grid">
                  <el-form-item label="Jar Size">
                    <el-select v-model="searchForm.jarSize" placeholder="Select jar size" class="full-width">
                      <el-option
                        v-for="(item,index) in jarSizeTypeOptions"
                        :key="'jarsizeoption' + index"
                        :label="item.JarSize"
                        :value="item.JarSize"
                      />
                    </el-select>
                  </el-form-item>

                  <el-form-item label="Inventory">
                    <el-input v-model="searchForm.inventory" class="full-width" />
                  </el-form-item>

                  <el-form-item label="Storage">
                    <el-input v-model="searchForm.storage" class="full-width" />
                  </el-form-item>

                  <el-form-item label="Total Number">
                    <div class="range-input">
                      <el-input v-model.number="searchForm.minTotalNumber" type="number" placeholder="Min" />
                      <span class="range-separator">-</span>
                      <el-input v-model.number="searchForm.maxTotalNumber" type="number" placeholder="Max" />
                    </div>
                  </el-form-item>
                </div>
              </div>

              <div class="advanced-search-section">
                <h3>Catalog Information</h3>
                <div class="advanced-search-grid">
                  <el-form-item label="Field No">
                    <el-input v-model="searchForm.fieldNo" placeholder="Field number" class="full-width" />
                  </el-form-item>

                  <el-form-item label="Catalog Date">
                    <div class="date-range-picker">
                      <el-date-picker
                        v-model="searchForm.catalogStartDate"
                        type="date"
                        placeholder="Start date"
                        class="date-picker"
                      />
                      <span class="range-separator">-</span>
                      <el-date-picker
                        v-model="searchForm.catalogEndDate"
                        type="date"
                        placeholder="End date"
                        class="date-picker"
                      />
                    </div>
                  </el-form-item>

                  <el-form-item label="Locality">
                    <el-select
                      v-model="searchForm.localityId"
                      placeholder="Select locality"
                      filterable
                      clearable
                      remote
                      class="full-width"
                      :remote-method="(query) => remoteMethod(query,'locality')"
                      :loading="remoteLoading"
                      no-match-text="No matches found"
                    >
                      <el-option
                        v-for="(item,index) in localityList"
                        :key="'local'+ index"
                        :label="item.localityString"
                        :value="item.localityID"
                      />
                    </el-select>
                  </el-form-item>
                </div>
              </div>
            </div>
          </el-collapse-item>
        </el-collapse>
      </el-form>
    </div>

    <!-- Results Container -->
    <div class="results-container">
      <div class="results-header">
        <h2 class="section-title">Loan Records</h2>

        <!-- Action Toolbar -->
        <div class="action-toolbar">
          <el-tooltip content="Add New" placement="top">
            <el-button type="primary" class="action-icon-btn" @click="handleCreate">
              <i class="el-icon-plus" />
            </el-button>
          </el-tooltip>

          <el-tooltip content="Export" placement="top">
            <el-button type="info" class="action-icon-btn" @click="handleDownload">
              <i class="el-icon-download" />
            </el-button>
          </el-tooltip>
        </div>
      </div>

      <vxe-table
        :key="tableKey"
        v-loading="listLoading"
        :data="loanList"
        :column-config="{isHover: true}"
        :sort-config="{multiple: true, trigger: 'cell'}"
        border
        fit
        highlight-current-row
        class="loan-table"
        @sort-change="sortChange"
      >
        <vxe-column title="Loan Number" field="LoanNumber" sortable align="center" fixed="left" min-width="140">
          <template slot-scope="{row}">
            <div class="loan-number-container">
              <span class="loan-number">{{ row.LoanNumber }}</span>
              <div class="row-actions">
                <el-button type="text" class="action-icon edit-icon" @click="handleUpdate(row)">
                  <i class="el-icon-edit" />
                </el-button>
              </div>
            </div>
          </template>
        </vxe-column>

        <vxe-column title="Transaction Type" field="TransactionType" sortable min-width="140">
          <template slot-scope="{row}">
            <span>{{ row.TransactionType }}</span>
          </template>
        </vxe-column>

        <vxe-column title="Loan Date" field="LoanDate" sortable align="center" min-width="135">
          <template slot-scope="{row}">
            <span>{{ row.LoanDate | parseTime('{y}-{m}-{d}') }}</span>
          </template>
        </vxe-column>

        <vxe-column title="Closed Date" field="DateClosed" sortable align="center" min-width="135">
          <template slot-scope="{row}">
            <span>{{ row.DateClosed | parseTime('{y}-{m}-{d}') }}</span>
          </template>
        </vxe-column>

        <vxe-column title="Loan People" field="FullName" sortable min-width="180">
          <template slot-scope="{row}">
            <span>{{ row.FullName }}</span>
          </template>
        </vxe-column>

        <vxe-column title="Agent ID" field="AgentID" sortable min-width="100">
          <template slot-scope="{row}">
            <span>{{ row.AgentID }}</span>
          </template>
        </vxe-column>

        <vxe-column title="Loan Agents" field="LoanAgents" sortable min-width="180">
          <template slot-scope="{row}">
            <span>{{ row.LoanAgents }}</span>
          </template>
        </vxe-column>
      </vxe-table>

      <!-- Pagination -->
      <pagination
        v-show="total>0"
        :total="total"
        :page.sync="listQuery.page"
        :limit.sync="listQuery.limit"
        class="pagination-container"
        @pagination="getLoans"
      />
    </div>

    <!-- Edit Dialog -->
    <el-dialog :width="dialogWidth" :visible.sync="dialogFormVisible" @close="closeDialog" :append-to-body="true">
      <loanForm :external-loan-id="dialogLoanId" ref="child"></loanForm>
    </el-dialog>
  </div>
</template>
<script>
import print from 'vue-print-nb'
import {
  getLoansAdvanced,
  getJarSizes,
  getTaxon,
  getLocality,
  getLoanPeople,
  getFamily
} from '@/api/table'
import waves from '@/directive/waves' // waves directive
import { parseTime } from '@/utils'
import Pagination from '@/components/Pagination'
import loanForm from '@/views/loanform/index'
import * as printJS from 'print-js'
import _ from 'lodash'

// Calendar Type Options
const calendarTypeOptions = [
  { key: 'CN', display_name: 'China' },
  { key: 'US', display_name: 'USA' },
  { key: 'JP', display_name: 'Japan' },
  { key: 'EU', display_name: 'Eurozone' }
]

export default {
  name: 'LoanComplexTable',
  components: { loanForm, Pagination },
  directives: { waves, print },

  filters: {
    statusFilter(status) {
      const statusMap = {
        published: 'success',
        draft: 'info',
        deleted: 'danger',
        F: 'info',
        U: 'success',
        '4oz': 'info',
        '16oz': 'danger'
      }
      return statusMap[status]
    },
    parseTime(time, cFormat) {
      if (time === undefined || time === null || time === '') {
        return ''
      }
      let date = new Date(Date.parse(time))
      return parseTime(date, cFormat)
    }
  },

  data() {
    return {
      searchForm: {
        loanId: '',
        loanOpenStartDate: '',
        loanOpenEndDate: '',
        loanClosedStartDate: '',
        loanClosedEndDate: '',
        lowCatalogNumber: '',
        taxonId: '',
        familyID: '',
        loanPplID: '',
        jarSize: '',
        inventory: '',
        storage: '',
        maxTotalNumber: '',
        minTotalNumber: '',
        fieldNo: '',
        localityId: '',
        catalogStartDate: '',
        catalogEndDate: ''
      },
      dialogLoanId: '',
      dialogWidth: '80%',
      remoteLoading: false,
      keyWord: '',
      localityList: [],
      taxonOptions: [],
      familyOptions: [],
      allLocalityList: [],
      allTaxonOptions: [],
      allFamilyOptions: [],
      tableKey: 0,
      list: null,
      loanPeople: [],
      loanList: [],
      total: 0,
      listLoading: false,
      listQuery: {
        page: 1,
        limit: 20,
        importance: undefined,
        title: undefined,
        type: undefined,
        sort: '+id'
      },
      importanceOptions: [1, 2, 3],
      calendarTypeOptions,
      jarSizeTypeOptions: [],
      sortOptions: [
        { label: 'ID Ascending', key: '+id' },
        { label: 'ID Descending', key: '-id' }
      ],
      statusOptions: ['published', 'draft', 'deleted', '4oz', 'U', 'F', '16oz'],
      showReviewer: true,
      temp: {
        id: undefined,
        importance: 1,
        remark: '',
        timestamp: new Date(),
        title: '',
        type: '',
        status: 'published'
      },
      dialogFormVisible: false,
      dialogStatus: '',
      textMap: {
        update: 'Edit',
        create: 'Create'
      },
      dialogPvVisible: false,
      pvData: [],
      rules: {
        type: [{ required: true, message: 'type is required', trigger: 'change' }],
        timestamp: [{ type: 'date', required: true, message: 'timestamp is required', trigger: 'change' }],
        title: [{ required: true, message: 'title is required', trigger: 'blur' }]
      },
      downloadLoading: false
    }
  },

  created() {
    // Initialize data on component creation
  },

  mounted() {
    this.getLoanPeople()
    this.getJarSizes()
  },

  computed: {
    queryParams() {
      return {
        pageSize: -1, // query all data
        pageNumber: 1,
        keyWord: this.keyWord
      }
    }
  },

  methods: {
    closeDialog() {
      this.dialogFormVisible = false
    },

    onSubmit() {
      this.getLoans()
      this.$message({
        message: 'Search submitted successfully!',
        type: 'success'
      })
    },

    printSingleLoan(row) {
      // Implementation for printing a single loan
      this.$message({
        message: 'Printing loan ' + row.LoanNumber,
        type: 'info'
      })
    },

    getJarSizes() {
      this.listLoading = true
      this.$message({
        message: 'Loading jar size data...',
        type: 'info'
      })

      getJarSizes().then(response => {
        this.jarSizeTypeOptions = []
        response.data.items.forEach((item) => {
          this.jarSizeTypeOptions.push({
            JarSizeID: item.JarSizeID,
            JarSize: item.JarSize
          })
        })
        this.listLoading = false
      }).catch(error => {
        console.error('Error fetching jar sizes:', error)
        this.$message.error('Failed to load jar size data')
        this.listLoading = false
      })
    },

    getLoanPeople() {
      getLoanPeople({}).then(response => {
        response.data.items.sort((person1, person2) => {
          return person2.LoanPeopleID - person1.LoanPeopleID
        })
        this.loanPeople = response.data.items // get Loan People sort Descending by AgentID
        this.listLoading = false
      }).catch(error => {
        console.error('Error fetching loan people:', error)
        this.$message.error('Failed to load loan people data')
        this.listLoading = false
      })
    },

    async getLocalityList(params) {
      try {
        const response = await getLocality(params)
        this.localityList = []
        response.data.items.forEach((item) => {
          this.localityList.push({
            localityID: item.Locality1ID,
            localityString: item.LocalityString
          })
        })
        this.remoteLoading = false
      } catch (error) {
        console.error('Error fetching locality data:', error)
        this.$message.error('Failed to load locality data')
        this.remoteLoading = false
      }
    },

    remoteMethod(searchKey, type) {
      if (searchKey !== '') {
        this.remoteLoading = true
        this.keyWord = searchKey
        this.getRemote(type)
      } else {
        this.taxonOptions = this.allTaxonOptions
        this.localityList = this.allLocalityList
        this.familyOptions = this.allFamilyOptions
      }
    },

    getRemote: _.debounce(function(type) {
      if (type === 'taxon') {
        this.getTaxonList(this.queryParams)
      } else if (type === 'family') {
        this.getFamilyList(this.queryParams)
      } else if (type === 'locality') {
        this.getLocalityList(this.queryParams)
      }
    }, 300),

    async getTaxonList(params) {
      try {
        const response = await getTaxon(params)
        this.taxonOptions = []
        response.data.items.forEach((item) => {
          this.taxonOptions.push({
            TaxonName: item.FullScientificName,
            TaxonID: item.TaxonID
          })
        })
        this.remoteLoading = false
      } catch (error) {
        console.error('Error fetching taxon data:', error)
        this.$message.error('Failed to load taxon data')
        this.remoteLoading = false
      }
    },

    async getFamilyList(params) {
      try {
        const response = await getFamily(params)
        this.familyOptions = []
        response.data.items.forEach((item) => {
          this.familyOptions.push({
            FamilyName: item.FamilyName,
            FamilyID: item.FamilyID
          })
        })
        this.remoteLoading = false
      } catch (error) {
        console.error('Error fetching family data:', error)
        this.$message.error('Failed to load family data')
        this.remoteLoading = false
      }
    },

    getLoans(limit) {
      this.listLoading = true

      this.$message({
        message: 'Searching loan information...',
        type: 'info'
      })

      // Prepare search parameters
      const rawParams = {
        'loanNumber': this.searchForm.loanId,
        'loanOpenStartDate': this.searchForm.loanOpenStartDate,
        'loanOpenEndDate': this.searchForm.loanOpenEndDate,
        'loanClosedStartDate': this.searchForm.loanClosedStartDate,
        'loanClosedEndDate': this.searchForm.loanClosedEndDate,
        'ids': this.searchForm.lowCatalogNumber,
        'taxonId': this.searchForm.taxonId,
        'familyID': this.searchForm.familyID,
        'loanPplID': this.searchForm.loanPplID,
        'jarSize': this.searchForm.jarSize,
        'inventory': this.searchForm.inventory,
        'storage': this.searchForm.storage,
        'maxNumber': this.searchForm.maxTotalNumber,
        'minNumber': this.searchForm.minTotalNumber,
        'fieldNo': this.searchForm.fieldNo,
        'localityId': this.searchForm.localityId,
        'catalogStartDate': this.searchForm.catalogStartDate,
        'catalogEndDate': this.searchForm.catalogEndDate,
        'page': this.listQuery.page,
        'page_size': this.listQuery.limit || limit
      }

      // Filter out empty parameters
      const searchParams = Object.fromEntries(
        Object.entries(rawParams).filter(([_, v]) => v !== '' && v !== null && v !== undefined)
      )

      getLoansAdvanced(searchParams).then(response => {
        this.loanList = response.data.items
        this.total = response.data.total

        setTimeout(() => {
          this.listLoading = false
        }, 1000)
      }).catch(error => {
        console.error('Error fetching loan data:', error)
        this.$message.error('Failed to load loan data')
        this.listLoading = false
      })
    },

    sortChange(data) {
      const { prop, order } = data
      if (prop === 'id') {
        this.sortByID(order)
      }
    },

    sortByID(order) {
      if (order === 'ascending') {
        this.listQuery.sort = '+id'
      } else {
        this.listQuery.sort = '-id'
      }
      this.getLoans()
    },

    handleCreate() {
      this.dialogStatus = 'create'
      this.dialogLoanId = ''
      this.dialogFormVisible = true
    },

    handleUpdate(row) {
      this.dialogLoanId = row.LoanNumber
      console.log(row.LoanNumber)
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs.child.loadLoanFromExternal()
      })
    },
    handleDownload() {
      this.downloadLoading = true

      import('@/vendor/Export2Excel').then(excel => {
        const tHeader = [
          'Loan Number', 'Transaction Type', 'Loan Date', 'Closed Date',
          'Loan People', 'Agent ID', 'Loan Agents'
        ]

        const filterVal = [
          'LoanNumber', 'TransactionType', 'LoanDate', 'DateClosed',
          'FullName', 'AgentID', 'LoanAgents'
        ]

        const data = this.formatJson(filterVal)

        excel.export_json_to_excel({
          header: tHeader,
          data,
          filename: 'Loan-Records-' + new Date().toISOString().split('T')[0]
        })

        this.downloadLoading = false

        this.$notify({
          title: 'Success',
          message: 'Export completed successfully',
          type: 'success',
          duration: 2000
        })
      }).catch(error => {
        console.error('Error exporting data:', error)
        this.$message.error('Failed to export data')
        this.downloadLoading = false
      })
    },

    formatJson(filterVal) {
      return this.loanList.map(v => filterVal.map(j => {
        if (j === 'LoanDate' || j === 'DateClosed') {
          if (v[j]) {
            const tempDate = new Date(Date.parse(v[j]))
            return parseTime(tempDate, '{y}-{m}-{d}')
          }
          return ''
        } else {
          return v[j]
        }
      }))
    },

    printTable() {
      const loansToPrint = this.loanList

      if (loansToPrint.length === 0) {
        this.$message.warning('No loan records to print')
        return
      }

      let rawHtml = ''
      let template_style = `
        .loan-print-container {
          font-family: "Times New Roman", serif;
          margin: 0 0 4em 0;
          width: 650px;
        }
        .loan-print-header {
          text-align: center;
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 20px;
        }
        .loan-print-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 15px;
        }
        .loan-print-row {
          display: flex;
          width: 100%;
        }
        .loan-print-col {
          flex: 1;
        }
        .loan-print-label {
          font-weight: bold;
          margin-right: 10px;
        }
        .loan-print-value {
          border-bottom: 1px solid #000;
          padding-bottom: 2px;
          min-height: 20px;
        }
        .loan-print-field {
          margin-bottom: 10px;
        }
        .loan-print-footer {
          margin-top: 40px;
          display: flex;
          justify-content: space-between;
        }
        .loan-print-signature {
          width: 40%;
          border-top: 1px solid #000;
          text-align: center;
          padding-top: 5px;
        }
      `

      loansToPrint.forEach((loan) => {
        rawHtml += `
          <div class="loan-print-container">
            <div class="loan-print-header">TULANE UNIVERSITY COLLECTIONS - LOAN RECORD</div>

            <div class="loan-print-grid">
              <div class="loan-print-row">
                <div class="loan-print-col">
                  <div class="loan-print-field">
                    <span class="loan-print-label">Loan Number:</span>
                    <span class="loan-print-value">${loan.LoanNumber || ''}</span>
                  </div>
                </div>
                <div class="loan-print-col">
                  <div class="loan-print-field">
                    <span class="loan-print-label">Transaction Type:</span>
                    <span class="loan-print-value">${loan.TransactionType || ''}</span>
                  </div>
                </div>
              </div>

              <div class="loan-print-row">
                <div class="loan-print-col">
                  <div class="loan-print-field">
                    <span class="loan-print-label">Loan Date:</span>
                    <span class="loan-print-value">${loan.LoanDate ? parseTime(new Date(Date.parse(loan.LoanDate)), '{y}-{m}-{d}') : ''}</span>
                  </div>
                </div>
                <div class="loan-print-col">
                  <div class="loan-print-field">
                    <span class="loan-print-label">Closed Date:</span>
                    <span class="loan-print-value">${loan.DateClosed ? parseTime(new Date(Date.parse(loan.DateClosed)), '{y}-{m}-{d}') : ''}</span>
                  </div>
                </div>
              </div>

              <div class="loan-print-row">
                <div class="loan-print-col">
                  <div class="loan-print-field">
                    <span class="loan-print-label">Loan People:</span>
                    <span class="loan-print-value">${loan.FullName || ''}</span>
                  </div>
                </div>
              </div>

              <div class="loan-print-row">
                <div class="loan-print-col">
                  <div class="loan-print-field">
                    <span class="loan-print-label">Agent ID:</span>
                    <span class="loan-print-value">${loan.AgentID || ''}</span>
                  </div>
                </div>
                <div class="loan-print-col">
                  <div class="loan-print-field">
                    <span class="loan-print-label">Loan Agents:</span>
                    <span class="loan-print-value">${loan.LoanAgents || ''}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="loan-print-footer">
              <div class="loan-print-signature">Loaned By</div>
              <div class="loan-print-signature">Received By</div>
            </div>

            <div style="page-break-after: always;"></div>
          </div>
        `
      })

      printJS({
        printable: rawHtml,
        type: 'raw-html',
        style: template_style,
        targetStyles: ['*']
      })
    }
  }
}
</script>
<style scoped>
/* Main Container Styles */
.loan-catalog {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  color: #2c3e50;
  background-color: #f5f7fa;
  min-height: 100vh;
  padding-bottom: 40px;
}

/* Search Container */
.search-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  margin: 0 20px 20px;
  padding: 20px;
}

.search-form {
  margin-bottom: 15px;
}

.search-form-row {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 15px;
}

.loan-search,
.catalog-search {
  flex: 1;
  min-width: 200px;
}

.scientific-name-search {
  flex: 1.5;
  min-width: 250px;
}

.search-button {
  min-width: 100px;
}

/* Advanced Search Panel */
.advanced-search-panel {
  margin-top: 15px;
  border: none;
}

.advanced-search-panel >>> .el-collapse-item__header {
  font-size: 16px;
  color: #409EFF;
  border: none;
  font-weight: 500;
}

.advanced-search-content {
  padding: 10px 0;
}

.advanced-search-section {
  margin-bottom: 20px;
}

.advanced-search-section h3 {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 15px;
  color: #606266;
  border-left: 3px solid #409EFF;
  padding-left: 10px;
}

.advanced-search-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.full-width {
  width: 100%;
}

.range-input {
  display: flex;
  align-items: center;
}

.range-separator {
  margin: 0 10px;
  color: #909399;
}

.date-range-picker {
  display: flex;
  align-items: center;
}

.date-picker {
  width: calc(50% - 10px);
}

/* Results Container */
.results-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  margin: 0 20px;
  padding: 20px;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-title {
  font-size: 18px;
  font-weight: 500;
  margin: 0;
  color: #303133;
}

/* Action Toolbar */
.action-toolbar {
  display: flex;
  gap: 5px;
}

.action-icon-btn {
  width: 40px !important;
  height: 40px !important;
  padding: 0 !important;
  border-radius: 50% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding-right: 20px;
}

.action-icon-btn i {
  font-size: 16px;
  margin: 0 !important;
}

/* Loan Number Container */
.loan-number-container {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

/* Table Row Actions */
.row-actions {
  opacity: 0;
  position: absolute;
  right: -20px;
  display: flex;
  align-items: center;
  gap: 0px;
  transition: all 0.3s ease;
}

.vxe-body--row:hover .row-actions,
.loan-number-container:hover .row-actions {
  opacity: 1;
  right: 5px;
}

.action-icon {
  padding: 4px !important;
  margin: 0 !important;
  color: #909399;
}

/* Ensure loan number stays aligned properly */
.loan-number {
  margin-right: 30px; /* Increased space to accommodate the action buttons */
  font-weight: 600;
  color: #409EFF;
}

.edit-icon:hover {
  color: #409EFF !important;

}

.print-icon:hover {
  color: #67c23a !important;
}

/* Alternative approach for showing actions on hover */
.loan-number-container {
  position: relative;
  display: inline-flex;
  align-items: center;
}
.loan-table {
  margin-bottom: 20px;
}

.loan-table >>> .vxe-table--header-wrapper th {
  background-color: #f2f6fc;
  color: #606266;
  font-weight: 600;
}

.loan-table >>> .vxe-table--body-wrapper tr {
  transition: background-color 0.2s ease;
}

.loan-table >>> .vxe-table--body-wrapper tr:hover {
  background-color: #ecf5ff;
}

/* Pagination */
.pagination-container {
  text-align: right;
  padding-top: 15px;
}

/* Animation for row actions */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.row-actions {
  animation: slideIn 0.3s ease;
}

/* Responsive Adjustments */
@media (max-width: 768px) {
  .search-form-row {
    flex-direction: column;
  }

  .loan-search,
  .catalog-search,
  .scientific-name-search {
    width: 100%;
  }

  .results-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .action-toolbar {
    width: 100%;
    justify-content: space-between;
  }

  .advanced-search-grid {
    grid-template-columns: 1fr;
  }

  .row-actions {
    opacity: 1; /* Always show on mobile */
    position: static; /* Reset the position for mobile */
    margin-left: 10px;
  }

  .loan-number-container {
    flex-direction: column;
  }
}
</style>
