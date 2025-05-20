<!--
  LocalityVerification.vue
  地点验证组件 - 处理 verbatim locality 到正式 locality 的匹配
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
              <label>Locality String:</label>
              <span>{{verbatimData.verbatimLocalityString || '-'}}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="verbatim-field">
              <label>Country:</label>
              <span>{{verbatimData.verbatimCountry || '-'}}</span>
            </div>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <div class="verbatim-field">
              <label>State:</label>
              <span>{{verbatimData.verbatimState || '-'}}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="verbatim-field">
              <label>County:</label>
              <span>{{verbatimData.verbatimCounty || '-'}}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="verbatim-field">
              <label>Drainage:</label>
              <span>{{verbatimData.verbatimDrainage || '-'}}</span>
            </div>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <div class="verbatim-field">
              <label>Waterbody:</label>
              <span>{{verbatimData.verbatimWaterbody || '-'}}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="verbatim-field">
              <label>Latitude:</label>
              <span>{{verbatimData.verbatimLatitude || '-'}}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="verbatim-field">
              <label>Longitude:</label>
              <span>{{verbatimData.verbatimLongitude || '-'}}</span>
            </div>
          </el-col>
        </el-row>

        <div v-if="verbatimData.originalText" class="original-text">
          <label>Original Text:</label>
          <span class="original-text-content">{{verbatimData.originalText}}</span>
        </div>
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
        <el-button
          v-if="record.localityId"
          size="mini"
          type="danger"
          @click="clearMatch">
          Clear Match
        </el-button>
      </div>

      <div v-if="record.localityId && record.locality" class="current-match">
        <div class="match-info">
          <div class="match-name">{{record.locality.LocalityName}}</div>
          <div class="match-details">
            <span class="detail-item">ID: {{record.locality.LocalityID}}</span>
            <span class="detail-item">Country: {{record.locality.Country}}</span>
            <span class="detail-item">State: {{record.locality.State}}</span>
            <span class="detail-item">County: {{record.locality.County}}</span>
            <span v-if="record.locality.Latitude && record.locality.Longitude" class="detail-item">
              Coordinates: {{record.locality.Latitude}}, {{record.locality.Longitude}}
            </span>
          </div>
        </div>
      </div>

      <div v-else class="no-match">
        <i class="el-icon-warning-outline"></i>
        No locality matched yet
      </div>
    </el-card>

    <!-- 搜索和匹配区域 -->
    <el-card class="search-card">
      <div slot="header" class="card-header">
        <span><i class="el-icon-search"></i> Search & Match Locality</span>
        <el-button
          size="mini"
          @click="autoMatch"
          :loading="autoMatching"
          :disabled="!verbatimData">
          <i class="el-icon-magic-stick"></i>
          Auto Match
        </el-button>
      </div>

      <!-- 搜索选项卡 -->
      <el-tabs v-model="searchMode" class="search-tabs">
        <el-tab-pane label="General Search" name="general">
          <div class="search-section">
            <el-input
              v-model="searchQuery"
              placeholder="Search by locality name, country, state, county..."
              @input="handleSearchInput"
              @keyup.enter.native="performSearch"
              prefix-icon="el-icon-search"
              clearable>
              <el-button
                slot="append"
                @click="performSearch"
                :loading="searching">
                Search
              </el-button>
            </el-input>
          </div>
        </el-tab-pane>

        <el-tab-pane label="Advanced Search" name="advanced">
          <div class="advanced-search">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-input
                  v-model="advancedSearch.localityName"
                  placeholder="Locality Name"
                  @keyup.enter.native="performAdvancedSearch">
                </el-input>
              </el-col>
              <el-col :span="12">
                <el-input
                  v-model="advancedSearch.country"
                  placeholder="Country"
                  @keyup.enter.native="performAdvancedSearch">
                </el-input>
              </el-col>
            </el-row>

            <el-row :gutter="20" style="margin-top: 15px;">
              <el-col :span="8">
                <el-input
                  v-model="advancedSearch.state"
                  placeholder="State/Province"
                  @keyup.enter.native="performAdvancedSearch">
                </el-input>
              </el-col>
              <el-col :span="8">
                <el-input
                  v-model="advancedSearch.county"
                  placeholder="County"
                  @keyup.enter.native="performAdvancedSearch">
                </el-input>
              </el-col>
              <el-col :span="8">
                <el-input
                  v-model="advancedSearch.drainage"
                  placeholder="Drainage"
                  @keyup.enter.native="performAdvancedSearch">
                </el-input>
              </el-col>
            </el-row>

            <div style="margin-top: 15px; text-align: right;">
              <el-button @click="clearAdvancedSearch">Clear</el-button>
              <el-button type="primary" @click="performAdvancedSearch" :loading="searching">
                Advanced Search
              </el-button>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="Coordinate Search" name="coordinate">
          <div class="coordinate-search">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-input
                  v-model="coordinateSearch.latitude"
                  placeholder="Latitude"
                  type="number">
                  <template slot="prepend">Lat</template>
                </el-input>
              </el-col>
              <el-col :span="12">
                <el-input
                  v-model="coordinateSearch.longitude"
                  placeholder="Longitude"
                  type="number">
                  <template slot="prepend">Lng</template>
                </el-input>
              </el-col>
            </el-row>

            <div style="margin-top: 15px;">
              <span>Search Radius:</span>
              <el-slider
                v-model="coordinateSearch.radius"
                :min="1"
                :max="100"
                :step="1"
                show-input
                style="margin-top: 10px;">
              </el-slider>
              <span class="radius-label">{{coordinateSearch.radius}} km</span>
            </div>

            <div style="margin-top: 15px; text-align: right;">
              <el-button @click="clearCoordinateSearch">Clear</el-button>
              <el-button
                type="primary"
                @click="performCoordinateSearch"
                :loading="searching"
                :disabled="!coordinateSearch.latitude || !coordinateSearch.longitude">
                Search by Coordinates
              </el-button>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>

      <!-- 搜索结果 -->
      <div v-if="searchResults.length > 0" class="search-results">
        <div class="results-header">
          <span>{{searchResults.length}} results found</span>
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
            v-for="(locality, index) in paginatedResults"
            :key="locality.LocalityID"
            class="result-item"
            :class="{'selected': selectedLocality && selectedLocality.LocalityID === locality.LocalityID}"
            @click="selectLocality(locality)">

            <div class="result-content">
              <div class="result-name">
                <span class="locality-name">{{locality.LocalityName}}</span>
                <span v-if="locality.distance" class="distance-badge">
                  {{locality.distance.toFixed(1)}} km
                </span>
              </div>

              <div class="result-details">
                <span class="detail">Country: {{locality.Country || 'N/A'}}</span>
                <span class="detail">State: {{locality.State || 'N/A'}}</span>
                <span class="detail">County: {{locality.County || 'N/A'}}</span>
                <span v-if="locality.Drainage" class="detail">Drainage: {{locality.Drainage}}</span>
                <span v-if="locality.Latitude && locality.Longitude" class="detail">
                  Coordinates: {{locality.Latitude}}, {{locality.Longitude}}
                </span>
              </div>

              <div class="result-actions">
                <el-button
                  size="mini"
                  type="primary"
                  @click.stop="confirmMatch(locality)">
                  <i class="el-icon-check"></i>
                  Select
                </el-button>
                <el-button
                  size="mini"
                  @click.stop="viewLocalityDetails(locality)">
                  <i class="el-icon-view"></i>
                  Details
                </el-button>
                <el-button
                  v-if="locality.Latitude && locality.Longitude"
                  size="mini"
                  @click.stop="viewOnMap(locality)">
                  <i class="el-icon-location"></i>
                  Map
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
    </el-card>

    <!-- 创建新地点对话框 -->
    <el-dialog
      title="Create New Locality"
      :visible.sync="showCreateDialog"
      width="600px">

      <create-locality-form
        :verbatim-data="verbatimData"
        @submit="handleCreateLocality"
        @cancel="showCreateDialog = false"
      />
    </el-dialog>

    <!-- 地点详情对话框 -->
    <el-dialog
      title="Locality Details"
      :visible.sync="showDetailsDialog"
      width="700px">

      <locality-details-view
        v-if="selectedLocalityForDetails"
        :locality="selectedLocalityForDetails"
      />
    </el-dialog>

    <!-- 地图查看对话框 -->
    <el-dialog
      title="Locality Map"
      :visible.sync="showMapDialog"
      width="800px">

      <locality-map-view
        v-if="selectedLocalityForMap"
        :locality="selectedLocalityForMap"
      />
    </el-dialog>
  </div>
</template>

<script>
import CreateLocalityForm from '@/components/RecordsProcessor/CreateLocalityForm';
import LocalityDetailsView from '@/components/RecordsProcessor/LocalityDetailsView';
import LocalityMapView from '@/components/RecordsProcessor/LocalityMapView';

export default {
  name: 'LocalityVerification',
  components: {
    CreateLocalityForm,
    LocalityDetailsView,
    LocalityMapView
  },
  props: {
    record: {
      type: Object,
      required: true
    },
    verbatimData: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      // 搜索相关
      searchMode: 'general',
      searchQuery: '',
      advancedSearch: {
        localityName: '',
        country: '',
        state: '',
        county: '',
        drainage: ''
      },
      coordinateSearch: {
        latitude: '',
        longitude: '',
        radius: 10
      },
      searchResults: [],
      searching: false,
      hasSearched: false,
      autoMatching: false,

      // 分页
      currentPage: 1,
      pageSize: 5,

      // 选择的地点
      selectedLocality: null,
      selectedLocalityForDetails: null,
      selectedLocalityForMap: null,

      // 对话框
      showCreateDialog: false,
      showDetailsDialog: false,
      showMapDialog: false,

      // 去抖计时器
      searchDebouncer: null
    }
  },
  computed: {
    paginatedResults() {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      return this.searchResults.slice(start, end);
    }
  },
  watch: {
    verbatimData: {
      immediate: true,
      handler(newValue) {
        if (newValue && this.shouldAutoMatch()) {
          this.initializeSearch();
        }
      }
    }
  },
  methods: {
    // 判断是否应该自动匹配
    shouldAutoMatch() {
      return !this.record.localityId && this.verbatimData;
    },

    // 初始化搜索
    initializeSearch() {
      if (this.verbatimData) {
        // 优先使用地点字符串
        if (this.verbatimData.verbatimLocalityString) {
          this.searchQuery = this.verbatimData.verbatimLocalityString;
        } else {
          // 否则组合其他字段
          const parts = [
            this.verbatimData.verbatimCountry,
            this.verbatimData.verbatimState,
            this.verbatimData.verbatimCounty
          ].filter(Boolean);
          this.searchQuery = parts.join(' ');
        }

        // 填充高级搜索字段
        this.advancedSearch = {
          localityName: this.verbatimData.verbatimLocalityString || '',
          country: this.verbatimData.verbatimCountry || '',
          state: this.verbatimData.verbatimState || '',
          county: this.verbatimData.verbatimCounty || '',
          drainage: this.verbatimData.verbatimDrainage || ''
        };

        // 填充坐标搜索
        if (this.verbatimData.verbatimLatitude && this.verbatimData.verbatimLongitude) {
          this.coordinateSearch.latitude = this.verbatimData.verbatimLatitude;
          this.coordinateSearch.longitude = this.verbatimData.verbatimLongitude;
        }
      }
    },

    // 处理搜索输入
    handleSearchInput() {
      if (this.searchDebouncer) {
        clearTimeout(this.searchDebouncer);
      }

      this.searchDebouncer = setTimeout(() => {
        if (this.searchQuery.length >= 2) {
          this.performSearch();
        }
      }, 300);
    },

    // 执行一般搜索
    async performSearch() {
      if (!this.searchQuery.trim()) {
        this.searchResults = [];
        this.hasSearched = false;
        return;
      }

      this.searching = true;
      this.hasSearched = true;

      try {
        const response = await this.$api.searchLocality({
          query: this.searchQuery,
          limit: 50
        });

        if (response.code === 20000) {
          this.searchResults = response.data.items || [];
          this.currentPage = 1;
        }
      } catch (error) {
        this.$message.error('Search failed');
        console.error(error);
        this.searchResults = [];
      } finally {
        this.searching = false;
      }
    },

    // 执行高级搜索
    async performAdvancedSearch() {
      this.searching = true;
      this.hasSearched = true;

      try {
        const response = await this.$api.searchLocalityAdvanced(this.advancedSearch);

        if (response.code === 20000) {
          this.searchResults = response.data.items || [];
          this.currentPage = 1;
        }
      } catch (error) {
        this.$message.error('Advanced search failed');
        console.error(error);
        this.searchResults = [];
      } finally {
        this.searching = false;
      }
    },

    // 执行坐标搜索
    async performCoordinateSearch() {
      this.searching = true;
      this.hasSearched = true;

      try {
        const response = await this.$api.searchLocalityByCoordinates({
          latitude: parseFloat(this.coordinateSearch.latitude),
          longitude: parseFloat(this.coordinateSearch.longitude),
          radius: this.coordinateSearch.radius
        });

        if (response.code === 20000) {
          this.searchResults = response.data.items || [];
          this.currentPage = 1;
        }
      } catch (error) {
        this.$message.error('Coordinate search failed');
        console.error(error);
        this.searchResults = [];
      } finally {
        this.searching = false;
      }
    },

    // 自动匹配
    async autoMatch() {
      if (!this.verbatimData) return;

      this.autoMatching = true;
      try {
        const response = await this.$api.autoMatchLocality({
          localityString: this.verbatimData.verbatimLocalityString,
          country: this.verbatimData.verbatimCountry,
          state: this.verbatimData.verbatimState,
          county: this.verbatimData.verbatimCounty,
          latitude: this.verbatimData.verbatimLatitude,
          longitude: this.verbatimData.verbatimLongitude
        });

        if (response.code === 20000 && response.data.matches && response.data.matches.length > 0) {
          const bestMatch = response.data.matches[0];
          this.confirmMatch(bestMatch.locality);
          this.$message.success(`Auto matched: ${bestMatch.locality.LocalityName} (Confidence: ${Math.round(bestMatch.confidence * 100)}%)`);
        } else {
          this.$message.warning('No suitable auto match found');
          // 如果自动匹配失败，执行手动搜索
          this.performSearch();
        }
      } catch (error) {
        this.$message.error('Auto match failed');
        console.error(error);
      } finally {
        this.autoMatching = false;
      }
    },

    // 清除高级搜索
    clearAdvancedSearch() {
      this.advancedSearch = {
        localityName: '',
        country: '',
        state: '',
        county: '',
        drainage: ''
      };
    },

    // 清除坐标搜索
    clearCoordinateSearch() {
      this.coordinateSearch = {
        latitude: '',
        longitude: '',
        radius: 10
      };
    },

    // 选择地点
    selectLocality(locality) {
      this.selectedLocality = locality;
    },

    // 确认匹配
    confirmMatch(locality) {
      this.$emit('locality-selected', locality);
      this.selectedLocality = locality;
    },

    // 清除匹配
    clearMatch() {
      this.$emit('locality-selected', { LocalityID: null });
    },

    // 查看地点详情
    viewLocalityDetails(locality) {
      this.selectedLocalityForDetails = locality;
      this.showDetailsDialog = true;
    },

    // 在地图上查看
    viewOnMap(locality) {
      this.selectedLocalityForMap = locality;
      this.showMapDialog = true;
    },

    // 显示创建地点对话框
    showCreateLocalityDialog() {
      this.showCreateDialog = true;
    },

    // 处理创建新地点
    handleCreateLocality(localityData) {
      this.$emit('create-new-locality', localityData);
      this.showCreateDialog = false;
    },

    // 分页处理
    handlePageChange(page) {
      this.currentPage = page;
    }
  }
};
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

.original-text {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #e0e0e0;
}

.original-text label {
  font-weight: 500;
  color: #666;
  display: inline-block;
  width: 100px;
}

.original-text-content {
  background: #fff;
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid #d0d0d0;
  font-family: monospace;
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

/* 搜索区域样式 */
.search-tabs {
  margin-bottom: 20px;
}

.search-section {
  margin-bottom: 20px;
}

.advanced-search,
.coordinate-search {
  padding: 15px;
  background: #f8f9fa;
  border-radius: 6px;
}

.radius-label {
  margin-left: 10px;
  color: #666;
  font-size: 12px;
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

.distance-badge {
  background: #e3f2fd;
  color: #1976d2;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
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
</style>
