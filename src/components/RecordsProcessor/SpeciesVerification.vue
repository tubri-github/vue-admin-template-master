<!--
  SpeciesVerification.vue
  物种验证组件 - 处理 verbatim taxonomic 到正式 taxonomic 的匹配
-->
<template>
  <div class="species-verification">
    <!-- 原始数据展示 -->
    <el-card class="verbatim-card">
      <div slot="header" class="card-header">
        <span><i class="el-icon-document"></i> Original Verbatim Data</span>
      </div>

      <div v-if="verbatimData" class="verbatim-content">
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="verbatim-field">
              <label>Family:</label>
              <span>{{verbatimData.verbatimFamily || '-'}}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="verbatim-field">
              <label>Genus:</label>
              <span>{{verbatimData.verbatimGenus || '-'}}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="verbatim-field">
              <label>Species:</label>
              <span>{{verbatimData.verbatimSpecies || '-'}}</span>
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
        No verbatim taxonomic data available
      </div>
    </el-card>

    <!-- 当前匹配状态 -->
    <el-card class="current-match-card">
      <div slot="header" class="card-header">
        <span><i class="el-icon-check"></i> Current Match</span>
        <el-button
          v-if="record.taxonId"
          size="mini"
          type="danger"
          @click="clearMatch">
          Clear Match
        </el-button>
      </div>

      <div v-if="record.taxonId && record.taxonomic" class="current-match">
        <div class="match-info">
          <div class="match-name">{{record.taxonomic.FullName}}</div>
          <div class="match-details">
            <span class="detail-item">ID: {{record.taxonomic.TaxonID}}</span>
            <span class="detail-item">Family: {{record.taxonomic.Family}}</span>
            <span class="detail-item">Author: {{record.taxonomic.Author || 'N/A'}}</span>
            <span class="detail-item" :class="{'status-valid': record.taxonomic.Status === 'Valid'}">
              Status: {{record.taxonomic.Status}}
            </span>
          </div>
        </div>
      </div>

      <div v-else class="no-match">
        <i class="el-icon-warning-outline"></i>
        No species matched yet
      </div>
    </el-card>

    <!-- 搜索和匹配区域 -->
    <el-card class="search-card">
      <div slot="header" class="card-header">
        <span><i class="el-icon-search"></i> Search & Match Species</span>
        <el-button
          size="mini"
          @click="autoMatch"
          :loading="autoMatching"
          :disabled="!verbatimData">
          <i class="el-icon-magic-stick"></i>
          Auto Match
        </el-button>
      </div>

      <!-- 搜索输入 -->
      <div class="search-section">
        <el-input
          v-model="searchQuery"
          placeholder="Search by family, genus, species, or full name..."
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

        <!-- 搜索过滤器 -->
        <div class="search-filters">
          <el-checkbox-group v-model="searchFilters" size="small">
            <el-checkbox label="Valid" disabled>Only Valid Species</el-checkbox>
            <el-checkbox label="ExactMatch">Exact Match Only</el-checkbox>
            <el-checkbox label="IncludeAuthor">Include Author in Search</el-checkbox>
          </el-checkbox-group>
        </div>
      </div>

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
            v-for="(species, index) in paginatedResults"
            :key="species.TaxonID"
            class="result-item"
            :class="{'selected': selectedSpecies && selectedSpecies.TaxonID === species.TaxonID}"
            @click="selectSpecies(species)">

            <div class="result-content">
              <div class="result-name">
                <span class="full-name">{{species.FullName}}</span>
                <el-tag
                  :type="species.Status === 'Valid' ? 'success' : 'warning'"
                  size="mini">
                  {{species.Status}}
                </el-tag>
              </div>

              <div class="result-details">
                <span class="detail">Family: {{species.Family}}</span>
                <span class="detail">Genus: {{species.Genus}}</span>
                <span class="detail">Species: {{species.Species}}</span>
                <span v-if="species.Author" class="detail">Author: {{species.Author}}</span>
              </div>

              <div class="result-actions">
                <el-button
                  size="mini"
                  type="primary"
                  @click.stop="confirmMatch(species)">
                  <i class="el-icon-check"></i>
                  Select
                </el-button>
                <el-button
                  size="mini"
                  @click.stop="viewSpeciesDetails(species)">
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
          No matching species found.
          <el-button type="text" @click="showCreateSpeciesDialog">
            Create New Species
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 创建新物种对话框 -->
    <el-dialog
      title="Create New Species"
      :visible.sync="showCreateDialog"
      width="500px">

      <create-species-form
        :verbatim-data="verbatimData"
        @submit="handleCreateSpecies"
        @cancel="showCreateDialog = false"
      />
    </el-dialog>

    <!-- 物种详情对话框 -->
    <el-dialog
      title="Species Details"
      :visible.sync="showDetailsDialog"
      width="600px">

      <species-details-view
        v-if="selectedSpeciesForDetails"
        :species="selectedSpeciesForDetails"
      />
    </el-dialog>
  </div>
</template>

<script>
import CreateSpeciesForm from '@/components/RecordsProcessor/CreateSpeciesForm.vue';
import SpeciesDetailsView from '@/components/RecordsProcessor/SpeciesDetailsView.vue';

export default {
  name: 'SpeciesVerification',
  components: {
    CreateSpeciesForm,
    SpeciesDetailsView
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
      searchQuery: '',
      searchResults: [],
      searchFilters: ['Valid'],
      searching: false,
      hasSearched: false,
      autoMatching: false,

      // 分页
      currentPage: 1,
      pageSize: 5,

      // 选择的物种
      selectedSpecies: null,
      selectedSpeciesForDetails: null,

      // 对话框
      showCreateDialog: false,
      showDetailsDialog: false,

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
      return !this.record.taxonId && this.verbatimData;
    },

    // 初始化搜索
    initializeSearch() {
      if (this.verbatimData) {
        const { verbatimGenus, verbatimSpecies } = this.verbatimData;
        if (verbatimGenus && verbatimSpecies) {
          this.searchQuery = `${verbatimGenus} ${verbatimSpecies}`;
        } else if (verbatimGenus) {
          this.searchQuery = verbatimGenus;
        }
      }
    },

    // 处理搜索输入
    handleSearchInput() {
      // 清除之前的去抖计时器
      if (this.searchDebouncer) {
        clearTimeout(this.searchDebouncer);
      }

      // 设置新的去抖计时器
      this.searchDebouncer = setTimeout(() => {
        if (this.searchQuery.length >= 2) {
          this.performSearch();
        }
      }, 300);
    },

    // 执行搜索
    async performSearch() {
      if (!this.searchQuery.trim()) {
        this.searchResults = [];
        this.hasSearched = false;
        return;
      }

      this.searching = true;
      this.hasSearched = true;

      try {
        const response = await this.$api.searchTaxonomic({
          query: this.searchQuery,
          filters: this.searchFilters,
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

    // 自动匹配
    async autoMatch() {
      if (!this.verbatimData) return;

      this.autoMatching = true;
      try {
        const response = await this.$api.autoMatchSpecies({
          family: this.verbatimData.verbatimFamily,
          genus: this.verbatimData.verbatimGenus,
          species: this.verbatimData.verbatimSpecies
        });

        if (response.code === 20000 && response.data.matches && response.data.matches.length > 0) {
          const bestMatch = response.data.matches[0];
          this.confirmMatch(bestMatch.taxon);
          this.$message.success(`Auto matched: ${bestMatch.taxon.FullName} (Confidence: ${Math.round(bestMatch.confidence * 100)}%)`);
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

    // 选择物种
    selectSpecies(species) {
      this.selectedSpecies = species;
    },

    // 确认匹配
    confirmMatch(species) {
      this.$emit('species-selected', species);
      this.selectedSpecies = species;
    },

    // 清除匹配
    clearMatch() {
      this.$emit('species-selected', { TaxonID: null });
    },

    // 查看物种详情
    viewSpeciesDetails(species) {
      this.selectedSpeciesForDetails = species;
      this.showDetailsDialog = true;
    },

    // 显示创建物种对话框
    showCreateSpeciesDialog() {
      this.showCreateDialog = true;
    },

    // 处理创建新物种
    handleCreateSpecies(speciesData) {
      this.$emit('create-new-species', speciesData);
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
.species-verification {
  padding: 20px;
}

.species-verification .el-card {
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
  width: 80px;
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

.status-valid {
  background: #e8f5e9;
  border-color: #4caf50;
  color: #2e7d32;
}

.no-match {
  text-align: center;
  color: #999;
  padding: 30px;
}

/* 搜索区域样式 */
.search-section {
  margin-bottom: 20px;
}

.search-filters {
  margin-top: 10px;
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

.full-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
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
