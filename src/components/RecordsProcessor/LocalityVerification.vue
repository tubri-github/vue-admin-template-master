<!--
  LocalityVerification.vue
  地点验证组件 - 增强版本，支持精确搜索和模糊搜索
-->
<template>
  <div class="locality-verification">
    <!-- 原始数据展示 -->
    <el-card class="verbatim-card">
      <div slot="header" class="card-header">
        <span><i class="el-icon-location-outline"></i> Original Verbatim Data</span>
      </div>

      <div v-if="verbatimData" class="verbatim-content">
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="verbatim-field">
              <label>Field No:</label>
              <span>{{ getVerbatimField('field_number') || '-' }}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="verbatim-field">
              <label>Locality String:</label>
              <span>{{ getVerbatimField('locality_string') || '-' }}</span>
            </div>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <div class="verbatim-field">
              <label>Country:</label>
              <span>{{ getVerbatimField('country') || '-' }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="verbatim-field">
              <label>State:</label>
              <span>{{ getVerbatimField('state') || '-' }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="verbatim-field">
              <label>County:</label>
              <span>{{ getVerbatimField('county') || '-' }}</span>
            </div>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <div class="verbatim-field">
              <label>Drainage:</label>
              <span>{{ getVerbatimField('drainage') || '-' }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="verbatim-field">
              <label>Waterbody:</label>
              <span>{{ getVerbatimField('waterbody') || '-' }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="verbatim-field">
              <label>Date:</label>
              <span>{{ formatDate(getVerbatimField('collect_date')) || '-' }}</span>
            </div>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <div class="verbatim-field">
              <label>Collector:</label>
              <span>{{ getVerbatimField('collector') || '-' }}</span>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="verbatim-field">
              <label>Latitude:</label>
              <span>{{ getVerbatimField('latitude') || '-' }}</span>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="verbatim-field">
              <label>Longitude:</label>
              <span>{{ getVerbatimField('longitude') || '-' }}</span>
            </div>
          </el-col>
        </el-row>
      </div>

      <div v-else class="no-verbatim">
        <i class="el-icon-warning"></i>
        No verbatim locality data available
      </div>
    </el-card>

    <!-- 当前匹配状态 -->
    <el-card class="current-match-card">
      <div slot="header" class="card-header">
        <span><i class="el-icon-check"></i> Current Match</span>
        <div style="float: right;">
          <el-button
            v-if="currentMatchedLocality"
            size="mini"
            type="danger"
            @click="clearMatch">
            Clear Match
          </el-button>
          <el-button
            v-if="verbatimData && getVerbatimField('field_number')"
            size="mini"
            type="primary"
            :loading="autoSearchLoading"
            @click="searchByFieldNo">
            <i class="el-icon-magic-stick"></i>
            Find by Field No
          </el-button>
        </div>
      </div>

      <div v-if="currentMatchedLocality" class="current-match">
        <div class="match-info">
          <div class="match-name">{{ currentMatchedLocality.FieldNo || currentMatchedLocality.LocalityString }}</div>
          <div class="match-details">
            <span class="detail-item">ID: {{ currentMatchedLocality.Locality1ID }}</span>
            <span class="detail-item">Field No: {{ currentMatchedLocality.FieldNo || 'N/A' }}</span>
            <span class="detail-item">Country: {{ currentMatchedLocality.Country }}</span>
            <span class="detail-item">State: {{ currentMatchedLocality.State }}</span>
            <span class="detail-item">County: {{ currentMatchedLocality.County }}</span>
            <span v-if="currentMatchedLocality.Lat && currentMatchedLocality.Lon" class="detail-item">
              Coordinates: {{ currentMatchedLocality.Lat }}, {{ currentMatchedLocality.Lon }}
            </span>
          </div>
          <div class="match-actions" style="margin-top: 10px;">
            <el-button
              size="mini"
              type="success"
              @click="confirmCurrentMatch">
              <i class="el-icon-check"></i>
              Confirm Match
            </el-button>
            <el-button
              size="mini"
              @click="viewLocalityDetails(currentMatchedLocality)">
              <i class="el-icon-view"></i>
              View Details
            </el-button>
          </div>
        </div>
      </div>

      <div v-else class="no-match">
        <div v-if="autoSearchLoading" class="auto-search-loading">
          <i class="el-icon-loading"></i>
          Searching by Field No...
        </div>
        <div v-else-if="autoSearchNotFound && verbatimData && getVerbatimField('field_number')" class="auto-search-not-found">
          <i class="el-icon-info"></i>
          No existing locality found for Field No: {{ getVerbatimField('field_number') }}
        </div>
        <div v-else class="no-match-text">
          <i class="el-icon-warning-outline"></i>
          No locality matched yet
        </div>
      </div>
    </el-card>

    <!-- 搜索区域 -->
    <el-card class="search-card">
      <div slot="header" class="card-header">
        <span><i class="el-icon-search"></i> Search Localities</span>
        <el-radio-group v-model="searchMode" size="mini">
          <el-radio-button label="simple">Simple</el-radio-button>
          <el-radio-button label="advanced">Advanced</el-radio-button>
        </el-radio-group>
      </div>

      <!-- 简单搜索 -->
      <div v-if="searchMode === 'simple'" class="search-section">
        <el-input
          v-model="searchQuery"
          @input="handleSearchInput"
          @keyup.enter.native="performSearch"
          placeholder="Search by field number, locality name, country, state..."
          prefix-icon="el-icon-search"
          clearable>
          <el-button
            slot="append"
            @click="performSearch"
            :loading="searching">
            Search
          </el-button>
        </el-input>

        <div class="search-options">
          <el-checkbox v-model="fuzzySearch">Enable fuzzy search</el-checkbox>
        </div>
      </div>

      <!-- 高级搜索 -->
      <div v-if="searchMode === 'advanced'" class="advanced-search">
        <el-form :model="advancedSearch" label-width="100px" size="small">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="Field No">
                <el-input
                  v-model="advancedSearch.fieldNo"
                  placeholder="Exact field number"
                  @keyup.enter.native="performAdvancedSearch">
                </el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="Locality ID">
                <el-input
                  v-model="advancedSearch.localityId"
                  placeholder="Exact locality ID"
                  style="width: 100%">
                </el-input>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="Country">
                <el-input
                  v-model="advancedSearch.country"
                  placeholder="Country name"
                  @keyup.enter.native="performAdvancedSearch">
                </el-input>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="State">
                <el-input
                  v-model="advancedSearch.state"
                  placeholder="State/Province"
                  @keyup.enter.native="performAdvancedSearch">
                </el-input>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="County">
                <el-input
                  v-model="advancedSearch.county"
                  placeholder="County"
                  @keyup.enter.native="performAdvancedSearch">
                </el-input>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="Drainage">
                <el-input
                  v-model="advancedSearch.drainage"
                  placeholder="Drainage system"
                  @keyup.enter.native="performAdvancedSearch">
                </el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="General">
                <el-input
                  v-model="advancedSearch.query"
                  placeholder="General search term"
                  @keyup.enter.native="performAdvancedSearch">
                </el-input>
              </el-form-item>
            </el-col>
          </el-row>

<!--          <el-form-item>-->
<!--            <el-checkbox v-model="advancedSearch.fuzzy">Enable fuzzy search</el-checkbox>-->
<!--          </el-form-item>-->

          <el-form-item>
            <el-button @click="clearAdvancedSearch">Clear</el-button>
            <el-button type="primary" @click="performAdvancedSearch" :loading="searching">
              Search
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 搜索结果 -->
      <div v-if="searchResults.length > 0" class="search-results">
        <div class="results-header">
          <span>{{ searchResults.length }} results found ({{ searchType }})</span>
          <el-pagination
            v-if="searchResults.length > pageSize"
            :current-page="currentPage"
            :page-size="pageSize"
            :total="searchResults.length"
            layout="prev, pager, next"
            @current-change="handlePageChange"
            small>
          </el-pagination>
        </div>

        <div class="results-list">
          <div
            v-for="locality in paginatedResults"
            :key="locality.Locality1ID"
            class="result-item"
            :class="{'selected': selectedLocality && selectedLocality.Locality1ID === locality.Locality1ID}"
            @click="selectLocality(locality)">

            <div class="result-content">
              <div class="result-name">
                <span class="locality-name">{{ locality.FieldNo || locality.LocalityString || 'Unnamed Locality' }}</span>
                <span class="locality-id">ID: {{ locality.Locality1ID }}</span>
              </div>

              <div class="result-details">
                <span class="detail">Field No: {{ locality.FieldNo || 'N/A' }}</span>
                <span class="detail">Country: {{ locality.Country || 'N/A' }}</span>
                <span class="detail">State: {{ locality.State || 'N/A' }}</span>
                <span class="detail">County: {{ locality.County || 'N/A' }}</span>
                <span v-if="locality.Drainage" class="detail">Drainage: {{ locality.Drainage }}</span>
                <span v-if="locality.Lat && locality.Lon" class="detail">
                  Coordinates: {{ locality.Lat }}, {{ locality.Lon }}
                </span>
              </div>

              <div class="result-actions">
                <el-button
                  size="mini"
                  type="primary"
                  @click.stop="setAsCurrentMatch(locality)">
                  <i class="el-icon-check"></i>
                  Use This
                </el-button>
                <el-button
                  size="mini"
                  @click.stop="viewLocalityDetails(locality)">
                  <i class="el-icon-view"></i>
                  Details
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 无搜索结果 -->
      <div v-else-if="hasSearched && !searching" class="no-results">
        <i class="el-icon-warning-outline"></i>
        <div class="no-results-text">
          No matching localities found.
          <el-button type="text" @click="showCreateLocalityDialog">
            Create New Locality
          </el-button>
        </div>
      </div>

      <!-- 添加新地点按钮 -->
      <div class="create-locality-section">
        <el-divider content-position="center">Or Create New</el-divider>
        <div style="text-align: center;">
          <el-button type="success" @click="showCreateLocalityDialog">
            <i class="el-icon-plus"></i>
            Create New Locality
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 创建新地点对话框 -->
    <el-dialog
      title="Create New Locality"
      :visible.sync="showCreateDialog"
      width="80%"
      :close-on-click-modal="false"
      :append-to-body="true">

      <create-locality-form
        :verbatim-data="verbatimData"
        :google-maps-api-key="googleMapsApiKey"
        @submit="handleCreateLocality"
        @cancel="showCreateDialog = false"
      />
    </el-dialog>

    <!-- 地点详情对话框 -->
    <el-dialog
      title="Locality Details"
      :visible.sync="showDetailsDialog"
      width="70%"
      :append-to-body="true">

      <locality-details-view
        v-if="selectedLocalityForDetails"
        :locality="selectedLocalityForDetails"
      />
    </el-dialog>
  </div>
</template>

<script>
import CreateLocalityForm from '@/components/RecordsProcessor/CreateLocalityForm'
import LocalityDetailsView from '@/components/RecordsProcessor/LocalityDetailsView'
import { searchLocalities, getLocalityDetails, createLocality } from "@/api/table";

export default {
  name: 'LocalityVerification',
  components: {
    CreateLocalityForm,
    LocalityDetailsView
  },
  props: {
    record: {
      type: Object,
      required: true
    },
    verbatimData: {
      type: Object,
      default: null
    },
    googleMapsApiKey: {
      type: String,
      default: () => process.env.VUE_APP_GOOGLE_MAPS_API_KEY || ''
    }
  },
  data() {
    return {
      // 当前匹配的locality
      currentMatchedLocality: null,

      // 搜索相关
      searchMode: 'simple',
      searchQuery: '',
      searchResults: [],
      searchType: '',
      searching: false,
      hasSearched: false,
      fuzzySearch: true,

      // 高级搜索
      advancedSearch: {
        fieldNo: '',
        localityId: null,
        country: '',
        state: '',
        county: '',
        drainage: '',
        query: '',
        fuzzy: true
      },

      // 自动搜索相关
      autoSearchLoading: false,
      autoSearchNotFound: false,

      // 分页
      currentPage: 1,
      pageSize: 5,

      // 选择的地点
      selectedLocality: null,
      selectedLocalityForDetails: null,

      // 对话框
      showCreateDialog: false,
      showDetailsDialog: false,

      // 去抖计时器
      searchDebouncer: null
    }
  },
  computed: {
    paginatedResults() {
      const start = (this.currentPage - 1) * this.pageSize
      const end = start + this.pageSize
      return this.searchResults.slice(start, end)
    }
  },
  watch: {
    verbatimData: {
      immediate: true,
      handler(newValue) {
        console.log('LocalityVerification - verbatimData changed:', newValue)
        if (newValue && this.shouldAutoSearchByFieldNo()) {
          this.initializeAutoSearch()
        }
      }
    },
    record: {
      immediate: true,
      handler(newValue) {
        console.log('LocalityVerification - record changed:', newValue)
        if (newValue && newValue.locality) {
          this.currentMatchedLocality = newValue.locality
        }
      }
    }
  },
  methods: {
    // 判断是否应该自动搜索
    shouldAutoSearchByFieldNo() {
      return !this.record.localityId && this.verbatimData && this.getVerbatimField('field_number')
    },

    // 获取verbatim字段的辅助方法
    getVerbatimField(fieldName) {
      if (!this.verbatimData) {
        return null
      }

      // 新格式：直接字段访问
      if (this.verbatimData[fieldName] !== undefined) {
        return this.verbatimData[fieldName]
      }

      // 兼容旧格式
      const oldFieldMap = {
        'field_number': 'verbatim_fieldno',
        'locality_string': 'verbatim_locality_string',
        'country': 'verbatim_country',
        'state': 'verbatim_state',
        'county': 'verbatim_county',
        'drainage': 'verbatim_drainage',
        'waterbody': 'verbatim_waterbody',
        'latitude': 'verbatim_lat',
        'longitude': 'verbatim_lon',
        'collect_date': 'verbatim_collect_date',
        'collector': 'verbatim_collector'
      }

      return this.verbatimData[oldFieldMap[fieldName]] || null
    },

    // 初始化自动搜索
    initializeAutoSearch() {
      if (this.verbatimData && this.getVerbatimField('field_number')) {
        this.searchByFieldNo()
      }
    },

    // 基于FieldNo搜索
    async searchByFieldNo() {
      const fieldNo = this.getVerbatimField('field_number')
      if (!fieldNo) {
        this.$message.warning('No Field No available for matching')
        return
      }

      this.autoSearchLoading = true
      this.autoSearchNotFound = false

      try {
        const response = await searchLocalities({
          field_no: fieldNo,
          limit: 5
        })

        if (response.code === 20000 && response.data.items && response.data.items.length > 0) {
          const matchedLocality = response.data.items[0]
          this.setAsCurrentMatch(matchedLocality)
          this.$message.success(`Found matching locality for Field No: ${fieldNo}`)
        } else {
          this.autoSearchNotFound = true
          this.$message.info(`No existing locality found for Field No: ${fieldNo}`)
        }
      } catch (error) {
        this.$message.error('Failed to search by Field No')
        console.error(error)
        this.autoSearchNotFound = true
      } finally {
        this.autoSearchLoading = false
      }
    },

    // 处理搜索输入
    handleSearchInput() {
      if (this.searchDebouncer) {
        clearTimeout(this.searchDebouncer)
      }

      this.searchDebouncer = setTimeout(() => {
        if (this.searchQuery.length >= 2) {
          this.performSearch()
        } else if (this.searchQuery.length === 0) {
          this.searchResults = []
          this.hasSearched = false
        }
      }, 300)
    },

    // 执行简单搜索
    async performSearch() {
      if (!this.searchQuery.trim()) {
        this.searchResults = []
        this.hasSearched = false
        return
      }

      this.searching = true
      this.hasSearched = true

      try {
        const response = await searchLocalities({
          query: this.searchQuery,
          fuzzy: this.fuzzySearch,
          limit: 50
        })

        if (response.code === 20000) {
          this.searchResults = response.data.items || []
          this.searchType = 'simple_search'
          this.currentPage = 1
        }
      } catch (error) {
        this.$message.error('Search failed')
        console.error(error)
        this.searchResults = []
      } finally {
        this.searching = false
      }
    },

    // 执行高级搜索
    async performAdvancedSearch() {
      this.searching = true
      this.hasSearched = true

      try {
        const searchParams = { limit: 50 }

        // 只添加非空参数
        if (this.advancedSearch.fieldNo) {
          searchParams.field_no = this.advancedSearch.fieldNo
        }
        if (this.advancedSearch.localityId) {
          searchParams.locality_id = this.advancedSearch.localityId
        }
        if (this.advancedSearch.country) {
          searchParams.country = this.advancedSearch.country
        }
        if (this.advancedSearch.state) {
          searchParams.state = this.advancedSearch.state
        }
        if (this.advancedSearch.county) {
          searchParams.county = this.advancedSearch.county
        }
        if (this.advancedSearch.drainage) {
          searchParams.drainage = this.advancedSearch.drainage
        }
        if (this.advancedSearch.query) {
          searchParams.query = this.advancedSearch.query
        }

        searchParams.fuzzy = this.advancedSearch.fuzzy

        const response = await searchLocalities(searchParams)

        if (response.code === 20000) {
          this.searchResults = response.data.items || []
          this.searchType = 'advanced_search'
          this.currentPage = 1
        }
      } catch (error) {
        this.$message.error('Advanced search failed')
        console.error(error)
        this.searchResults = []
      } finally {
        this.searching = false
      }
    },

    // 清除高级搜索
    clearAdvancedSearch() {
      this.advancedSearch = {
        fieldNo: '',
        localityId: null,
        country: '',
        state: '',
        county: '',
        drainage: '',
        query: '',
        fuzzy: true
      }
      this.searchResults = []
      this.hasSearched = false
    },

    // 选择地点
    selectLocality(locality) {
      this.selectedLocality = locality
    },

    // 设置为当前匹配
    setAsCurrentMatch(locality) {
      this.currentMatchedLocality = {
        Locality1ID: locality.Locality1ID,
        FieldNo: locality.FieldNo,
        LocalityString: locality.LocalityString,
        Country: locality.Country,
        State: locality.State,
        County: locality.County,
        Drainage: locality.Drainage,
        WaterBody: locality.WaterBody,
        Lat: locality.Lat,
        Lon: locality.Lon
      }
      this.selectedLocality = locality
      this.$message.success('Locality set as current match')
    },

    // 确认当前匹配
    confirmCurrentMatch() {
      if (this.currentMatchedLocality) {
        this.$emit('locality-selected', this.currentMatchedLocality)
        this.$message.success('Locality match confirmed')
      }
    },

    // 清除匹配
    clearMatch() {
      this.currentMatchedLocality = null
      this.selectedLocality = null
      this.autoSearchNotFound = false
      this.$emit('locality-selected', { Locality1ID: null })
      this.$message.info('Locality match cleared')
    },

    // 查看地点详情
    async viewLocalityDetails(locality) {
      try {
        const response = await getLocalityDetails(locality.Locality1ID)
        if (response.code === 20000 && response.data.items && response.data.items.length > 0) {
          this.selectedLocalityForDetails = response.data.items[0]
          this.showDetailsDialog = true
        } else {
          this.$message.error('Failed to load locality details')
        }
      } catch (error) {
        this.$message.error('Failed to load locality details')
        console.error(error)
      }
    },

    // 显示创建地点对话框
    showCreateLocalityDialog() {
      this.showCreateDialog = true
    },

    // 处理创建新地点
    async handleCreateLocality(localityData) {
      try {
        const response = await createLocality(localityData)

        if (response.code === 20000) {
          // 创建成功，构造新的locality对象
          const newLocality = {
            Locality1ID: response.data.Locality1ID,
            FieldNo: response.data.FieldNo,
            LocalityString: response.data.LocalityString,
            Country: localityData.Country,
            State: localityData.State,
            County: localityData.County,
            Drainage: localityData.Drainage,
            WaterBody: localityData.WaterBody,
            Lat: localityData.Lat,
            Lon: localityData.Lon
          }

          // 自动设置为当前匹配
          this.setAsCurrentMatch(newLocality)
          this.showCreateDialog = false

          // 自动确认匹配
          this.confirmCurrentMatch()

          this.$message.success('New locality created and automatically matched!')
        } else {
          this.$message.error(response.message || 'Failed to create locality')
        }
      } catch (error) {
        this.$message.error('Failed to create new locality')
        console.error(error)
      }
    },

    // 分页处理
    handlePageChange(page) {
      this.currentPage = page
    },

    // 格式化日期
    formatDate(date) {
      if (!date) return ''
      try {
        return new Date(date).toLocaleDateString()
      } catch (error) {
        return date
      }
    }
  }
}
</script>

<style scoped>
.locality-verification {
  padding: 20px;
}

.locality-verification .el-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
}

/* 原始数据样式 */
.verbatim-content {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
}

.verbatim-field {
  margin-bottom: 10px;
}

.verbatim-field label {
  font-weight: 500;
  color: #666;
  display: inline-block;
  width: 100px;
}

.verbatim-field span {
  color: #333;
  font-style: italic;
}

.no-verbatim {
  text-align: center;
  color: #999;
  padding: 40px;
}

/* 当前匹配样式 */
.current-match {
  background: #f0f9ff;
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #e0f2fe;
}

.match-info {
  text-align: center;
}

.match-name {
  font-size: 18px;
  font-weight: bold;
  color: #1976d2;
  margin-bottom: 10px;
}

.match-details {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 10px;
}

.detail-item {
  background: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  border: 1px solid #e0e0e0;
}

.no-match {
  text-align: center;
  color: #999;
  padding: 30px;
}

.no-match-text {
  font-size: 14px;
}

.auto-search-loading,
.auto-search-not-found {
  margin-top: 10px;
  font-size: 14px;
}

.auto-search-loading {
  color: #409EFF;
}

.auto-search-not-found {
  color: #E6A23C;
}

/* 搜索区域样式 */
.search-section {
  margin-bottom: 20px;
}

.search-options {
  margin-top: 10px;
}

.advanced-search {
  padding: 15px;
  background: #f8f9fa;
  border-radius: 6px;
}

/* 搜索结果样式 */
.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e0e0e0;
}

.results-list {
  max-height: 400px;
  overflow-y: auto;
}

.result-item {
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.result-item:hover {
  border-color: #409EFF;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.result-item.selected {
  border-color: #409EFF;
  background: #f0f9ff;
}

.result-content {
  padding: 15px;
}

.result-name {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.locality-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.locality-id {
  font-size: 12px;
  color: #666;
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 3px;
}

.result-details {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 10px;
}

.detail {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 12px;
  color: #666;
}

.result-actions {
  text-align: right;
}

.no-results {
  text-align: center;
  padding: 40px;
  color: #999;
}

.no-results-text {
  margin-top: 10px;
}

.create-locality-section {
  margin-top: 30px;
}

.match-actions {
  text-align: center;
}
</style>
