<!--
  SpeciesVerification.vue
  物种验证组件 - 修复显示问题
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
      </div>

      <div v-else class="no-verbatim">
        <i class="el-icon-warning"></i>
        No verbatim taxonomic data available
      </div>
    </el-card>

    <!-- 系统建议展示 -->
    <el-card v-if="hasValidSuggestion" class="suggestion-card">
      <div slot="header" class="card-header">
        <span><i class="el-icon-magic-stick"></i> System Suggestion</span>
        <el-tag :type="getSuggestionTagType()" size="small">
          {{matchSuggestions.status}} ({{matchSuggestions.confidence}}%)
        </el-tag>
      </div>

      <div class="suggestion-content">
        <div class="suggestion-info">
          <div class="suggestion-name">{{getSuggestedSpeciesName()}}</div>
          <div class="suggestion-details">
            <span class="detail-item">ID: {{getSuggestedTaxonId()}}</span>
            <span class="detail-item">Confidence: {{matchSuggestions.confidence}}%</span>
            <span class="detail-item">Type: {{matchSuggestions.status}}</span>
          </div>
          <div class="suggestion-actions">
            <el-button
              type="primary"
              size="small"
              @click="applySuggestion"
              :disabled="matchSuggestions.suggestionApplied">
              <i class="el-icon-check"></i>
              {{matchSuggestions.suggestionApplied ? 'Applied' : 'Apply Suggestion'}}
            </el-button>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 当前匹配状态 -->
    <el-card class="current-match-card">
      <div slot="header" class="card-header">
        <span><i class="el-icon-check"></i> Current Match</span>
        <el-button
          v-if="currentMatchedSpecies"
          size="mini"
          type="danger"
          @click="clearMatch">
          Clear Match
        </el-button>
      </div>

      <div v-if="currentMatchedSpecies" class="current-match">
        <div class="match-info">
          <div class="match-name">{{currentMatchedSpecies.FullName}}</div>
          <div class="match-details">
            <span class="detail-item">ID: {{currentMatchedSpecies.TaxonID}}</span>
            <span class="detail-item" v-if="currentMatchedSpecies.Family">Family: {{currentMatchedSpecies.Family}}</span>
            <span class="detail-item" v-if="currentMatchedSpecies.Author">Author: {{currentMatchedSpecies.Author}}</span>
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
        <span><i class="el-icon-search"></i> Search Species</span>
        <el-button
          size="mini"
          type="success"
          @click="showCreateSpeciesDialog">
          <i class="el-icon-plus"></i>
          Create New Species
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
            v-for="species in paginatedResults"
            :key="species.TaxonID"
            class="result-item"
            :class="{'selected': selectedSpecies && selectedSpecies.TaxonID === species.TaxonID}"
            @click="selectSpecies(species)">

            <div class="result-content">
              <div class="result-name">
                <span class="full-name">{{species.FullScientificName}}</span>
              </div>

              <div class="result-details">
                <span class="detail" v-if="species.FamilyName">Family: {{species.FamilyName}}</span>
                <span class="detail">ID: {{species.TaxonID}}</span>
              </div>

              <div class="result-actions">
                <el-button
                  size="mini"
                  type="primary"
                  @click.stop="confirmMatch(species)">
                  <i class="el-icon-check"></i>
                  Select
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 无搜索结果或者搜索提示 -->
      <div v-if="hasSearched && !searching && searchResults.length === 0" class="no-results">
        <i class="el-icon-warning-outline"></i>
        <div class="no-results-text">
          No matching species found for "{{searchQuery}}".
          <br>
          <el-button type="text" @click="showCreateSpeciesDialog">
            <i class="el-icon-plus"></i>
            Create New Species
          </el-button>
        </div>
      </div>

      <!-- 搜索提示（未搜索时显示） -->
      <div v-if="!hasSearched && !searching" class="search-prompt">
        <div class="search-prompt-content">
          <i class="el-icon-search"></i>
          <p>Enter a scientific name, genus, or family to search for species.</p>
          <p class="search-prompt-sub">
            Can't find what you're looking for?
            <el-button type="text" @click="showCreateSpeciesDialog" class="create-link">
              Create a new species
            </el-button>
          </p>
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
  </div>
</template>

<script>
import CreateSpeciesForm from '@/components/RecordsProcessor/CreateSpeciesForm.vue';
import { addTaxon, getTaxon } from '@/api/table';

export default {
  name: 'SpeciesVerification',
  components: {
    CreateSpeciesForm
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
    matchSuggestions: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      // 搜索相关
      searchQuery: '',
      searchResults: [],
      searching: false,
      hasSearched: false,

      // 分页
      currentPage: 1,
      pageSize: 5,

      // 选择的物种
      selectedSpecies: null,

      // 对话框
      showCreateDialog: false,

      // 去抖计时器
      searchDebouncer: null
    }
  },
  computed: {
    paginatedResults() {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      return this.searchResults.slice(start, end);
    },

    // 判断是否有有效的系统建议
    hasValidSuggestion() {
      return this.matchSuggestions &&
        this.matchSuggestions.hasSuggestion &&
        this.getSuggestedTaxonId();
    },

    // 当前匹配的物种信息
    currentMatchedSpecies() {
      // 优先显示用户手动选择的物种
      if (this.record.taxonId && this.record.taxonomic) {
        return this.record.taxonomic;
      }

      // 如果没有手动选择，但有系统建议，显示建议的物种
      if (this.hasValidSuggestion) {
        return {
          TaxonID: this.getSuggestedTaxonId(),
          FullName: this.getSuggestedSpeciesName(),
          Family: this.getSuggestedFamily(),
          Genus: this.getSuggestedGenus(),
          Species: this.getSuggestedSpecies(),
          Author: this.getSuggestedAuthor()
        };
      }

      return null;
    }
  },
  watch: {
    verbatimData: {
      immediate: true,
      handler(newValue) {
        if (newValue && this.shouldInitializeSearch()) {
          this.initializeSearch();
        }
      }
    }
  },
  methods: {
    // 获取建议的物种名
    getSuggestedSpeciesName() {
      // 根据实际数据结构获取
      if (this.matchSuggestions && this.matchSuggestions.match_details && this.matchSuggestions.match_details.db_name) {
        return this.matchSuggestions.match_details.db_name;
      }

      // 备选方案：从 suggested_data 获取
      if (this.matchSuggestions && this.matchSuggestions.suggested_data) {
        const genus = this.matchSuggestions.suggested_data.genus;
        const species = this.matchSuggestions.suggested_data.species;
        if (genus && species) {
          return `${genus} ${species}`;
        }
      }

      return 'Unknown species';
    },

    // 获取建议的分类ID
    getSuggestedTaxonId() {
      if (this.matchSuggestions && this.matchSuggestions.suggested_taxon_id) {
        return this.matchSuggestions.suggested_taxon_id;
      }
      return null;
    },

    // 获取建议的科名
    getSuggestedFamily() {
      if (this.matchSuggestions && this.matchSuggestions.suggested_data && this.matchSuggestions.suggested_data.family) {
        return this.matchSuggestions.suggested_data.family;
      }
      return null;
    },

    // 获取建议的属名
    getSuggestedGenus() {
      if (this.matchSuggestions && this.matchSuggestions.suggested_data && this.matchSuggestions.suggested_data.genus) {
        return this.matchSuggestions.suggested_data.genus;
      }
      return null;
    },

    // 获取建议的种名
    getSuggestedSpecies() {
      if (this.matchSuggestions && this.matchSuggestions.suggested_data && this.matchSuggestions.suggested_data.species) {
        return this.matchSuggestions.suggested_data.species;
      }
      return null;
    },

    // 获取建议的作者
    getSuggestedAuthor() {
      if (this.matchSuggestions && this.matchSuggestions.suggested_data && this.matchSuggestions.suggested_data.author) {
        return this.matchSuggestions.suggested_data.author;
      }
      return null;
    },

    // 判断是否应该初始化搜索
    shouldInitializeSearch() {
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

    // 获取建议标签类型
    getSuggestionTagType() {
      if (!this.matchSuggestions) return '';

      const confidence = this.matchSuggestions.confidence || 0;
      if (confidence >= 90) return 'success';
      if (confidence >= 70) return 'warning';
      return 'info';
    },

    // 应用系统建议
    applySuggestion() {
      if (this.hasValidSuggestion) {
        const suggestedTaxon = {
          TaxonID: this.getSuggestedTaxonId(),
          FullName: this.getSuggestedSpeciesName(),
          Family: this.getSuggestedFamily(),
          Genus: this.getSuggestedGenus(),
          Species: this.getSuggestedSpecies(),
          Author: this.getSuggestedAuthor()
        };

        this.confirmMatch(suggestedTaxon);
      }
    },

    // 处理搜索输入
    handleSearchInput() {
      clearTimeout(this.searchDebouncer);
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
        const response = await getTaxon({
          pageSize: 50,
          pageNumber: 1,
          keyWord: this.searchQuery
        });

        if (response && response.data && response.data.items) {
          this.searchResults = response.data.items;
          this.currentPage = 1;
        } else {
          this.searchResults = [];
        }
      } catch (error) {
        this.$message.error('Search failed');
        console.error(error);
        this.searchResults = [];
      } finally {
        this.searching = false;
      }
    },

    // 选择物种
    selectSpecies(species) {
      this.selectedSpecies = species;
    },

    // 确认匹配
    confirmMatch(species) {
      const taxonomicData = {
        TaxonID: species.TaxonID,
        FullName: species.FullScientificName || species.FullName,
        Family: species.FamilyName || species.Family,
        Genus: species.Genus,
        Species: species.Species,
        Author: species.Author
      };

      this.$emit('species-selected', taxonomicData);
      this.selectedSpecies = species;
    },

    // 清除匹配
    clearMatch() {
      this.$emit('species-selected', { TaxonID: null });
    },

    // 显示创建物种对话框
    showCreateSpeciesDialog() {
      this.showCreateDialog = true;
    },

    // 处理创建新物种
    async handleCreateSpecies(speciesData) {
      this.showCreateDialog = false;

      try {
        // 调用创建物种API
        const response = await addTaxon(speciesData);

        if (response.code === 20000 && response.data.items && response.data.items.length > 0) {
          const newTaxonId = response.data.items[0].TaxonID;

          // 创建物种信息对象
          const newSpecies = {
            TaxonID: newTaxonId,
            FullName: speciesData.fullScientificName,
            Genus: speciesData.genus,
            Species: speciesData.species,
            Subspecies: speciesData.subspecies,
            FamilyID: speciesData.familyID,
            Remarks: speciesData.remarks
          };

          // 自动匹配到 Current Match
          this.confirmMatch(newSpecies);

          this.$message.success(`New species "${speciesData.fullScientificName}" created and matched successfully!`);
        } else {
          this.$message.error('Failed to create species: Invalid response');
        }
      } catch (error) {
        console.error('Error creating species:', error);
        this.$message.error('Failed to create new species. Please try again.');
      }
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

.no-verbatim {
  text-align: center;
  color: #999;
  padding: 40px;
}

/* 建议卡片样式 */
.suggestion-card {
  border: 2px solid #409EFF;
}

.suggestion-content {
  background: #f0f9ff;
  padding: 15px;
  border-radius: 6px;
}

.suggestion-info {
  text-align: center;
}

.suggestion-name {
  font-size: 18px;
  font-weight: bold;
  color: #1976d2;
  margin-bottom: 10px;
  font-style: italic;
}

.suggestion-details {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 15px;
}

.suggestion-actions {
  text-align: center;
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
  font-style: italic;
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
.search-section {
  margin-bottom: 20px;
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
  font-style: italic;
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
  line-height: 1.6;
}

/* 搜索提示样式 */
.search-prompt {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.search-prompt-content {
  max-width: 400px;
  margin: 0 auto;
}

.search-prompt i {
  font-size: 48px;
  color: #ddd;
  margin-bottom: 20px;
  display: block;
}

.search-prompt p {
  margin: 10px 0;
  font-size: 14px;
}

.search-prompt-sub {
  color: #999;
  font-size: 13px;
  margin-top: 20px !important;
  margin-bottom: 15px !important;
}

.create-link {
  color: #409EFF !important;
  padding: 0 !important;
  font-size: 13px !important;
  text-decoration: underline;
  margin-left: 2px;
}

.create-link:hover {
  color: #66b1ff !important;
}
</style>
