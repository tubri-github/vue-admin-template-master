<template>
  <div class="locality-catalog">
    <!-- Search Controls -->
    <div class="search-container">
      <el-form ref="form" :model="searchForm" label-width="120px" class="search-form">
        <div class="search-form-row">
          <el-input
            v-model="searchForm.query"
            class="field-search"
            placeholder="Keyword search across all fields"
            prefix-icon="el-icon-search"
          />

          <el-input
            v-model="searchForm.field_no"
            class="field-search"
            placeholder="Field number"
            prefix-icon="el-icon-search"
          />

          <el-button type="primary" icon="el-icon-search" class="search-button" @click="onSubmit">
            Search
          </el-button>
        </div>

        <!-- Advanced Search Panel -->
        <el-collapse class="advanced-search-panel">
          <el-collapse-item title="Advanced Search" name="1">
            <div class="advanced-search-content">
              <div class="advanced-search-section">
                <h3>Locality Information</h3>
                <div class="advanced-search-grid">
                  <el-form-item label="Locality">
                    <el-input v-model="searchForm.locality_string" placeholder="Location description" class="full-width" />
                  </el-form-item>

                  <el-form-item label="Country">
                    <el-select
                      v-model="searchForm.country"
                      placeholder="Select country"
                      filterable
                      clearable
                      class="full-width"
                    >
                      <el-option
                        v-for="item in filterOptions.country"
                        :key="item.value"
                        :label="item.value"
                        :value="item.value"
                      />
                    </el-select>
                  </el-form-item>

                  <el-form-item label="State/Province">
                    <el-select
                      v-model="searchForm.state"
                      placeholder="Select state"
                      filterable
                      clearable
                      class="full-width"
                    >
                      <el-option
                        v-for="item in filterOptions.state"
                        :key="item.value"
                        :label="item.value"
                        :value="item.value"
                      />
                    </el-select>
                  </el-form-item>

                  <el-form-item label="County">
                    <el-input v-model="searchForm.county" placeholder="County" class="full-width" />
                  </el-form-item>

                  <el-form-item label="Continent">
                    <el-input v-model="searchForm.continent" placeholder="Continent" class="full-width" />
                  </el-form-item>

                  <el-form-item label="Drainage">
                    <el-input v-model="searchForm.drainage" placeholder="Drainage" class="full-width" />
                  </el-form-item>

                  <el-form-item label="Water Body">
                    <el-input v-model="searchForm.waterbody" placeholder="Water body" class="full-width" />
                  </el-form-item>

                  <el-form-item label="Island">
                    <el-input v-model="searchForm.island" placeholder="Island" class="full-width" />
                  </el-form-item>

                  <el-form-item label="Island Group">
                    <el-input v-model="searchForm.island_group" placeholder="Island group" class="full-width" />
                  </el-form-item>

                  <el-form-item label="Date">
                    <el-input v-model="searchForm.start_date" placeholder="Date" class="full-width" />
                  </el-form-item>

                  <el-form-item label="Collectors">
                    <el-input v-model="searchForm.verbatim_collectors" placeholder="Collectors" class="full-width" />
                  </el-form-item>

                  <el-form-item label="Fuzzy Matching">
                    <el-switch
                      v-model="searchForm.fuzzy"
                      active-text="Enable fuzzy matching"
                    />
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
        <h2 class="section-title">Locality Records</h2>

        <!-- Action Toolbar -->
        <div class="action-toolbar">
          <el-tooltip content="Export Data" placement="top">
            <el-button type="info" class="action-icon-btn" @click="exportData">
              <i class="el-icon-download" />
            </el-button>
          </el-tooltip>

        </div>
      </div>

      <el-table
        :key="tableKey"
        v-loading="listLoading"
        :data="localityList"
        border
        fit
        highlight-current-row
        class="locality-table"
        show-overflow-tooltip="true"
        @sort-change="sortChange"
        @filter-change="handleFilterChange"
      >
        <el-table-column
          v-for="column in dynamicColumns"
          :key="column.prop"
          :label="column.label"
          :prop="column.prop"
          :sortable="column.sortable"
          :align="column.align"
          :min-width="column.width"
          :filters="column.filters"
          :filter-method="column.filterMethod"
        >
          <template slot-scope="{row}">
            <div v-if="column.prop === 'field_no'" class="field-number-container">
              <span class="field-number">{{ row.field_no }}</span>
              <div class="row-actions">
                <el-button type="text" class="action-icon edit-icon">
                  <i class="el-icon-edit" />
                </el-button>
                <el-button type="text" class="action-icon view-icon">
                  <i class="el-icon-view" />
                </el-button>
              </div>
            </div>
            <span v-else-if="column.date">{{ formatDate(row[column.prop]) }}</span>
            <span v-else-if="column.prop === 'coordinates' && row.lon && row.lat">
              {{ row.lon }}, {{ row.lat }}
            </span>
            <el-tag v-else-if="column.tag" :type="row[column.prop] | statusFilter">
              {{ row[column.prop] }}
            </el-tag>
            <span v-else>{{ row[column.prop] }}</span>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <pagination
        v-show="total>0"
        :total="total"
        :page.sync="listQuery.page"
        :limit.sync="listQuery.limit"
        class="pagination-container"
        @pagination="getLocalities"
      />
    </div>
  </div>
</template>
<script>
import waves from '@/directive/waves' // waves directive
import { parseTime } from '@/utils'
import Pagination from '@/components/Pagination'
import _ from 'lodash'
import {getLocalityes} from "@/api/table"; // secondary package based on el-pagination

export default {
  name: 'SearchLocality',
  components: { Pagination },
  directives: { waves },
  filters: {
    statusFilter(status) {
      if (!status || status.trim() === '') return 'default'

      const lower = status?.toLowerCase() || ''

      if (lower.includes('unknown')) return 'default'
      if (lower === 'f') return 'info'
      if (lower === 'u') return 'success'
      if (lower === '4oz') return 'info'
      if (lower === '16oz') return 'danger'

      return 'default'
    }
  },
  data() {
    return {
      searchForm: {
        query: '',
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
        fuzzy: true
      },
      tableKey: 0,
      localityList: [],
      filterOptions: {
        country: [],
        state: [],
        county: [],
        drainage: [],
        continent: [],
        waterbody: [],
        island: [],
        island_group: [],
        verbatim_collectors: []
      },
      total: 0,
      listLoading: false,
      listQuery: {
        page: 1,
        limit: 20
      },
      activeFilters: {}
    }
  },
  computed: {
    dynamicColumns() {
      // 根据API返回的数据动态生成表格列
      const defaultColumns = [
        {
          prop: 'field_no',
          label: 'Field No',
          sortable: true,
          align: 'center',
          width: '200',
          filters: this.getColumnFilters('field_no')
        },
        {
          prop: 'locality_string',
          label: 'Locality String',
          sortable: false,
          align: 'left',
          width: '250',
          filters: this.getColumnFilters('locality_string')
        },
        {
          prop: 'drainage',
          label: 'Drainage',
          sortable: false,
          align: 'left',
          width: '150',
          filters: this.getColumnFilters('drainage')
        },
        {
          prop: 'start_date',
          label: 'Collection Date',
          sortable: true,
          align: 'center',
          width: '135',
          date: true,
          filters: this.getColumnFilters('start_date')
        },
        {
          prop: 'country',
          label: 'Country',
          sortable: false,
          align: 'left',
          width: '120',
          filters: this.getColumnFilters('country')
        },
        {
          prop: 'state',
          label: 'State',
          sortable: false,
          align: 'center',
          width: '120',
          filters: this.getColumnFilters('state')
        },
        {
          prop: 'county',
          label: 'County',
          sortable: false,
          align: 'left',
          width: '120',
          filters: this.getColumnFilters('county')
        },
        {
          prop: 'waterbody',
          label: 'Water Body',
          sortable: false,
          align: 'left',
          width: '120',
          filters: this.getColumnFilters('waterbody')
        },
        {
          prop: 'elevation_method',
          label: 'Elevation Method',
          sortable: false,
          align: 'center',
          width: '150',
          tag: true,
          filters: this.getColumnFilters('elevation_method')
        },
        {
          prop: 'coordinates',
          label: 'Coordinates',
          sortable: false,
          align: 'left',
          width: '160',
          custom: true
        },
        {
          prop: 'inventory',
          label: 'Inventory',
          sortable: false,
          align: 'center',
          width: '120',
          tag: true,
          filters: this.getColumnFilters('inventory')
        },
        {
          prop: 'verbatim_collectors',
          label: 'Collectors',
          sortable: false,
          align: 'left',
          width: '180',
          filters: this.getColumnFilters('verbatim_collectors')
        }
      ]

      return defaultColumns
    }
  },
  created() {
    // 初始化数据
    this.getLocalities()
  },
  methods: {
    formatDate(dateStr) {
      if (!dateStr) return '-'
      const date = new Date(dateStr)
      return isNaN(date.getTime()) ? dateStr : parseTime(date, '{y}-{m}-{d}')
    },
    onSubmit() {
      this.listQuery.page = 1  // 重置到第一页
      this.getLocalities()
      this.$message({
        message: 'Search submitted successfully!',
        type: 'success'
      })
    },
    async getLocalities() {
      this.listLoading = true

      // 准备搜索参数
      const searchParams = {
        'query': this.searchForm.query || '',
        'field_no': this.searchForm.field_no || '',
        'locality_string': this.searchForm.locality_string || '',
        'drainage': this.searchForm.drainage || '',
        'waterbody': this.searchForm.waterbody || '',
        'country': this.searchForm.country || '',
        'state': this.searchForm.state || '',
        'county': this.searchForm.county || '',
        'continent': this.searchForm.continent || '',
        'island': this.searchForm.island || '',
        'island_group': this.searchForm.island_group || '',
        'start_date': this.searchForm.start_date || '',
        'verbatim_collectors': this.searchForm.verbatim_collectors || '',
        'fuzzy': this.searchForm.fuzzy,
        'page': this.listQuery.page,
        'limit': this.listQuery.limit
      }

      // 添加活跃的表格筛选条件
      if (Object.keys(this.activeFilters).length > 0) {
        Object.assign(searchParams, this.activeFilters)
      }

      await getLocalityes(searchParams)
        .then(response => {
          this.localityList = response.data.items
          this.total = response.data.total

          // 更新表格筛选选项
          if (response.data.filter_options) {
            for (const [key, values] of Object.entries(response.data.filter_options)) {
              if (Array.isArray(values)) {
                this.filterOptions[key] = values
              }
            }
          }

          // 更新表格列
          if (response.data.columns && response.data.columns.length > 0) {
            // 可能需要调整表格列显示
            this.tableKey = Date.now() // 强制重新渲染表格
          }

          setTimeout(() => {
            this.listLoading = false
          }, 300)
        })
        .catch(error => {
          console.error('Error fetching locality data:', error)
          this.$message.error('Failed to load locality data')
          this.listLoading = false
        })
    },
    getColumnFilters(field) {
      // 为表格列创建过滤器选项
      if (!this.filterOptions[field] || !this.filterOptions[field].length) {
        return null
      }

      return this.filterOptions[field].map(item => ({
        text: `${item.value} (${item.count})`,
        value: item.value
      }))
    },
    handleFilterChange(filters) {
      // 处理表格列筛选
      this.activeFilters = {}

      // 构建筛选条件
      for (const [field, values] of Object.entries(filters)) {
        if (values && values.length) {
          this.activeFilters[field] = values[0] // 目前只支持单选筛选
        }
      }

      // 使用激活的筛选条件重新搜索
      this.listQuery.page = 1 // 重置到第一页
      this.getLocalities()
    },
    async getLocalitiesWithFilters() {
      this.listLoading = true

      try {
        // 合并搜索条件和表格筛选条件
        const params = {
          ...this.searchForm,
          ...this.activeFilters,
          page: this.listQuery.page,
          limit: this.listQuery.limit
        }

        // 发送请求
        const response = await this.$axios.get('/api/locality', { params })

        if (response.data.code === 20000) {
          const data = response.data.data
          this.localityList = data.items
          this.total = data.total
        } else {
          this.$message.error('Failed to load filtered data')
        }
      } catch (error) {
        console.error('Error fetching filtered data:', error)
        this.$message.error('Failed to load filtered data')
      } finally {
        setTimeout(() => {
          this.listLoading = false
        }, 300)
      }
    },
    sortChange(data) {
      const { prop, order } = data

      // 添加排序逻辑，如果API支持的话
      this.getLocalities()
    },
    exportData() {
      // 导出数据功能
      this.$message({
        message: 'Export functionality would be implemented here',
        type: 'info'
      })
    }
  }
}
</script>

<style scoped>
/* Main Container Styles */
.locality-catalog {
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

.field-search {
  flex: 1;
  min-width: 200px;
}

.locality-search {
  flex: 2;
  min-width: 300px;
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
  gap: 10px;
}

.action-icon-btn {
  width: 40px !important;
  height: 40px !important;
  padding: 0 !important;
  border-radius: 50% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.action-icon-btn i {
  font-size: 16px;
  margin: 0 !important;
}

/* Field Number Container */
.field-number-container {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

/* Table Row Actions */
.row-actions {
  opacity: 0;
  position: absolute;
  right: -5px;
  display: flex;
  align-items: center;
  gap: 0px;
  transition: all 0.3s ease;
}

.el-table__row:hover .row-actions {
  opacity: 1;
  right: 5px;
}

/* Style field number */
.field-number {
  margin-right: 10px;
  font-weight: 600;
  color: #409EFF;
}

.edit-icon:hover {
  color: #409EFF !important;
}

.view-icon:hover {
  color: #67c23a !important;
}

/* Locality Table */
.locality-table {
  margin-bottom: 20px;
}

.locality-table >>> .el-table__header th {
  background-color: #f2f6fc;
  color: #606266;
  font-weight: 600;
}

.locality-table >>> .el-table__row {
  transition: background-color 0.2s ease;
}

.locality-table >>> .el-table__row:hover {
  background-color: #ecf5ff;
}

/* Pagination */
.pagination-container {
  text-align: right;
  padding-top: 15px;
}

/* Responsive Adjustments */
@media (max-width: 768px) {
  .search-form-row {
    flex-direction: column;
  }

  .field-search,
  .locality-search {
    width: 100%;
  }

  .results-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .action-toolbar {
    width: 100%;
    justify-content: flex-end;
  }

  .advanced-search-grid {
    grid-template-columns: 1fr;
  }

  .row-actions {
    opacity: 1; /* Always show on mobile */
    position: static; /* Reset the position for mobile */
    margin-left: 10px;
  }

  .field-number-container {
    flex-direction: column;
  }
}
</style>
