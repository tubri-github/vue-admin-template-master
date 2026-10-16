<template>
  <div class="app-container">
    <!-- Search Form -->
    <el-card class="search-card">
      <el-form ref="form" :model="searchForm" label-width="110px" label-position="right" size="small">
        <el-row :gutter="16">
          <el-col :span="6">
            <el-form-item label="Catalog No.">
              <el-input v-model="searchForm.ostcatalogs" placeholder="Comma separated" clearable @keyup.enter.native="onSearch" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="Scientific Name">
              <el-input v-model="searchForm.scientificname" clearable @keyup.enter.native="onSearch" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <!-- ostelogy 没有 family 列：后端按学名首词（属名）推断，拼错的属名推不出 -->
            <el-form-item label="Family (inferred)" label-width="125px">
              <el-input v-model="searchForm.family" clearable @keyup.enter.native="onSearch" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="Field Number">
              <el-input v-model="searchForm.fieldnumber" clearable @keyup.enter.native="onSearch" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="Locality">
              <el-input v-model="searchForm.locality" clearable @keyup.enter.native="onSearch" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="Collector">
              <el-input v-model="searchForm.collector" clearable @keyup.enter.native="onSearch" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="Prep. Remarks">
              <el-input v-model="searchForm.remarks" clearable @keyup.enter.native="onSearch" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="5">
            <el-form-item label="Preparation" label-width="95px">
              <el-select v-model="searchForm.type" placeholder="All" clearable style="width: 100%;">
                <el-option label="Skel" value="Skel" />
                <el-option label="C&S" value="C&S" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="Inventory" label-width="70px">
              <el-select v-model="searchForm.inventory" placeholder="All" clearable style="width: 100%;">
                <el-option label="F" value="F" />
                <el-option label="M" value="M" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="3">
            <el-form-item label="Review" label-width="60px">
              <el-select v-model="searchForm.recheckedrequried" placeholder="All" clearable style="width: 100%;">
                <el-option label="Yes" value="true" />
                <el-option label="No" value="false" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="Date From" label-width="80px">
              <el-date-picker v-model="searchForm.startdate" type="date" placeholder="Select" value-format="yyyy-MM-dd" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="Date To" label-width="70px">
              <el-date-picker v-model="searchForm.enddate" type="date" placeholder="Select" value-format="yyyy-MM-dd" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16">
          <el-col :span="6">
            <el-form-item label="Count" label-width="60px">
              <div class="range-inputs">
                <el-input v-model.number="searchForm.countMin" type="number" placeholder="Min" @keyup.enter.native="onSearch" />
                <span class="range-separator">-</span>
                <el-input v-model.number="searchForm.countMax" type="number" placeholder="Max" @keyup.enter.native="onSearch" />
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="TL" label-width="40px">
              <div class="range-inputs">
                <el-input v-model.number="searchForm.tlMin" type="number" placeholder="Min" @keyup.enter.native="onSearch" />
                <span class="range-separator">-</span>
                <el-input v-model.number="searchForm.tlMax" type="number" placeholder="Max" @keyup.enter.native="onSearch" />
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="SL" label-width="40px">
              <div class="range-inputs">
                <el-input v-model.number="searchForm.slMin" type="number" placeholder="Min" @keyup.enter.native="onSearch" />
                <span class="range-separator">-</span>
                <el-input v-model.number="searchForm.slMax" type="number" placeholder="Max" @keyup.enter.native="onSearch" />
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="FL" label-width="40px">
              <div class="range-inputs">
                <el-input v-model.number="searchForm.flMin" type="number" placeholder="Min" @keyup.enter.native="onSearch" />
                <span class="range-separator">-</span>
                <el-input v-model.number="searchForm.flMax" type="number" placeholder="Max" @keyup.enter.native="onSearch" />
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row>
          <el-col :span="24" style="text-align: right;">
            <el-button type="primary" icon="el-icon-search" @click="onSearch">Search</el-button>
            <el-button icon="el-icon-refresh" @click="resetForm">Reset</el-button>
            <el-button
              v-waves
              :loading="downloadLoading"
              type="success"
              icon="el-icon-download"
              @click="handleDownload"
              :disabled="total === 0"
            >
              Export All ({{ total }})
            </el-button>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- Results Info -->
    <div v-if="total > 0" class="results-info">
      Found <strong>{{ total }}</strong> record(s)
    </div>

    <!-- Results Table -->
    <el-table
      v-loading="listLoading"
      :data="list"
      border
      fit
      highlight-current-row
      style="width: 100%;"
      size="small"
      :row-class-name="tableRowClassName"
    >
      <el-table-column label="Catalog No." prop="ostcatalog" width="100" sortable>
        <template slot-scope="scope">
          <span class="link-type" @click="goToDetail(scope.row.ostcatalog)">{{ scope.row.ostcatalog }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Scientific Name" prop="scientificname" min-width="140" show-overflow-tooltip />
      <el-table-column label="Verified Taxon" prop="TaxonName" min-width="140" show-overflow-tooltip />
      <!-- 推断值（非原始数据），单独配色与原始列区分 -->
      <el-table-column
        label="Family (inferred)"
        prop="InferredFamily"
        min-width="120"
        show-overflow-tooltip
        class-name="inferred-col"
        label-class-name="inferred-col"
      />
      <el-table-column label="Locality" prop="locality" min-width="150" show-overflow-tooltip />
      <el-table-column label="Field No." prop="fieldnumber" width="90" />
      <el-table-column label="Collector" prop="collector" width="100" show-overflow-tooltip />
      <el-table-column label="Date" width="90">
        <template slot-scope="scope">
          {{ formatDate(scope.row.datecollected) }}
        </template>
      </el-table-column>
      <el-table-column label="Count" prop="count" width="55" align="center" />
      <el-table-column label="Prep." prop="type" width="60" align="center" />
      <el-table-column label="TL" prop="tl" width="50" align="center" />
      <el-table-column label="SL" prop="sl" width="50" align="center" />
      <el-table-column label="FL" prop="fl" width="50" align="center" />
      <el-table-column label="Inv." prop="inventory" width="45" align="center" />
      <el-table-column label="Sci. Remarks" prop="scientificnameremarks" min-width="120" show-overflow-tooltip />
      <el-table-column label="Prep. Remarks" prop="remarks" min-width="120" show-overflow-tooltip />
      <el-table-column label="Review" width="60" align="center">
        <template slot-scope="scope">
          <el-tag v-if="scope.row.recheckedrequried" type="warning" size="mini">Yes</el-tag>
          <span v-else>-</span>
        </template>
      </el-table-column>
    </el-table>

    <!-- Pagination -->
    <div v-if="total > 0" class="pagination-container">
      <el-pagination
        background
        :current-page="currentPage"
        :page-sizes="[50, 100, 200]"
        :page-size="pageSize"
        layout="total, sizes, prev, pager, next"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- Empty State -->
    <div v-if="list && list.length === 0 && !listLoading" class="empty-state">
      <i class="el-icon-folder-opened"></i>
      <p>No results found</p>
    </div>
  </div>
</template>

<script>
import { searchOst } from '@/api/table'
import { parseTime } from '@/utils'
import waves from '@/directive/waves'

export default {
  name: 'OsteologySearch',
  directives: { waves },
  data() {
    return {
      list: null,
      total: 0,
      listLoading: false,
      downloadLoading: false,
      currentPage: 1,
      pageSize: 50,
      searchForm: {
        ostcatalogs: '',
        type: '',
        inventory: '',
        scientificname: '',
        family: '',
        locality: '',
        fieldnumber: '',
        collector: '',
        startdate: '',
        enddate: '',
        recheckedrequried: '',
        remarks: '',
        countMin: null,
        countMax: null,
        tlMin: null,
        tlMax: null,
        slMin: null,
        slMax: null,
        flMin: null,
        flMax: null
      }
    }
  },
  methods: {
    formatDate(date) {
      if (!date || date === '') return ''
      const d = new Date(date)
      if (isNaN(d.getTime())) return date // Return original if can't parse
      return parseTime(d, '{y}-{m}-{d}')
    },
    resetForm() {
      this.searchForm = {
        ostcatalogs: '',
        type: '',
        inventory: '',
        scientificname: '',
        family: '',
        locality: '',
        fieldnumber: '',
        collector: '',
        startdate: '',
        enddate: '',
        recheckedrequried: '',
        remarks: '',
        countMin: null,
        countMax: null,
        tlMin: null,
        tlMax: null,
        slMin: null,
        slMax: null,
        flMin: null,
        flMax: null
      }
      this.list = null
      this.total = 0
    },
    getSearchParams(forExport = false) {
      const params = {
        ostcatalogs: this.searchForm.ostcatalogs,
        type: this.searchForm.type,
        inventory: this.searchForm.inventory,
        scientificname: this.searchForm.scientificname,
        family: this.searchForm.family,
        locality: this.searchForm.locality,
        fieldnumber: this.searchForm.fieldnumber,
        collector: this.searchForm.collector,
        startdate: this.searchForm.startdate,
        enddate: this.searchForm.enddate,
        recheckedrequried: this.searchForm.recheckedrequried,
        remarks: this.searchForm.remarks,
        countMin: this.searchForm.countMin,
        countMax: this.searchForm.countMax,
        tlMin: this.searchForm.tlMin,
        tlMax: this.searchForm.tlMax,
        slMin: this.searchForm.slMin,
        slMax: this.searchForm.slMax,
        flMin: this.searchForm.flMin,
        flMax: this.searchForm.flMax
      }
      if (forExport) {
        params.exportAll = 'true'
      } else {
        params.limit = this.pageSize
        params.page = this.currentPage
      }
      return params
    },
    onSearch() {
      this.currentPage = 1
      this.fetchData()
    },
    fetchData() {
      this.listLoading = true
      searchOst(this.getSearchParams(false)).then(response => {
        this.list = response.data.items
        this.total = response.data.total
        this.listLoading = false
      }).catch(() => {
        this.listLoading = false
        this.$message.error('Failed to fetch data')
      })
    },
    handleSizeChange(val) {
      this.pageSize = val
      this.fetchData()
    },
    handleCurrentChange(val) {
      this.currentPage = val
      this.fetchData()
    },
    tableRowClassName({ row }) {
      if (row.recheckedrequried) {
        return 'warning-row'
      }
      return ''
    },
    goToDetail(ostcatalog) {
      this.$router.push({
        path: '/ost/ost',
        query: { ostcatalog }
      })
    },
    handleDownload() {
      this.downloadLoading = true
      // Fetch all data from API without pagination
      searchOst(this.getSearchParams(true)).then(response => {
        const allData = response.data.items
        import('@/vendor/Export2Excel').then(excel => {
          // Export ALL database columns
          const tHeader = [
            'Osteology ID', 'Catalog No.', 'TU Catalog', 'Other Catalog',
            'Preparation', 'Count', 'Inventory',
            'Scientific Name', 'Verified Taxon', 'Family (inferred)', 'Taxon ID', 'Sci. Name Remarks',
            'Locality', 'Locality1ID', 'Field No.', 'Collector', 'Identify By',
            'Date Collected', 'Updated Collect Date', 'Recorded Date',
            'TL', 'SL', 'FL', 'GM',
            'Preparation Remarks', 'Review Required', 'Reviewer', 'Review Comment',
            'Timestamp Modified'
          ]
          const filterVal = [
            'ostelogyid', 'ostcatalog', 'tucatalog', 'othercatalog',
            'type', 'count', 'inventory',
            'scientificname', 'TaxonName', 'InferredFamily', 'taxonid', 'scientificnameremarks',
            'locality', 'Locality1ID', 'fieldnumber', 'collector', 'identifyby',
            'datecollected', 'updatecollectdate', 'recordeddate',
            'tl', 'sl', 'fl', 'gm',
            'remarks', 'recheckedrequried', 'reviewer', 'recheckcomment',
            'timestampmodified'
          ]
          const data = this.formatJson(filterVal, allData)
          excel.export_json_to_excel({
            header: tHeader,
            data,
            filename: 'osteology-export-' + parseTime(new Date(), '{y}{m}{d}')
          })
          this.downloadLoading = false
        })
      }).catch(() => {
        this.downloadLoading = false
        this.$message.error('Failed to export data')
      })
    },
    formatJson(filterVal, jsonData) {
      return jsonData.map(v => filterVal.map(j => {
        if (j === 'recheckedrequried') {
          return v[j] ? 'Yes' : 'No'
        } else if (j === 'timestampmodified' && v[j]) {
          return parseTime(new Date(v[j]), '{y}-{m}-{d} {h}:{i}:{s}')
        } else {
          return v[j] !== null && v[j] !== undefined ? v[j] : ''
        }
      }))
    }
  }
}
</script>

<style scoped>
.search-card {
  margin-bottom: 20px;
}

.search-card /deep/ .el-card__body {
  padding-bottom: 2px;
}

.results-info {
  margin-bottom: 12px;
  color: #606266;
  font-size: 14px;
}

.link-type {
  color: #409EFF;
  cursor: pointer;
}

.link-type:hover {
  text-decoration: underline;
}

.pagination-container {
  margin-top: 16px;
  text-align: right;
}

.empty-state {
  text-align: center;
  padding: 60px 0;
  color: #909399;
}

.empty-state i {
  font-size: 48px;
}

.empty-state p {
  margin-top: 12px;
}

/* 推断列：浅蓝底 + 灰蓝斜体，提示这是系统推断、不是原始著录 */
/deep/ .el-table td.inferred-col,
/deep/ .el-table th.inferred-col {
  background: #f0f7ff;
}

/deep/ .el-table td.inferred-col .cell {
  color: #5a7ea8;
  font-style: italic;
}

/deep/ .el-table .warning-row {
  background: #fef0f0;
}

/deep/ .el-form-item {
  margin-bottom: 16px;
}

/deep/ .el-form-item__label {
  font-weight: 500;
}

/deep/ .el-table th {
  background-color: #f5f7fa;
}

.range-inputs {
  display: flex;
  align-items: center;
  gap: 6px;
}

.range-inputs .el-input {
  flex: 1;
  min-width: 0;
}

.range-inputs /deep/ input {
  text-align: center;
  padding-left: 8px;
  padding-right: 8px;
}

.range-separator {
  color: #909399;
  flex-shrink: 0;
}
</style>
