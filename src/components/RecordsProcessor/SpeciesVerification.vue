<!--
  SpeciesVerification.vue
  物种验证组件 - 修复显示问题
-->
<template>
  <div class="species-verification">
    <!-- 原始数据展示 -->
    <el-card class="verbatim-card">
      <div slot="header" class="card-header">
        <span><i class="el-icon-document" /> Original Verbatim Data</span>
      </div>

      <div v-if="verbatimData" class="verbatim-content">
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="verbatim-field">
              <label>Family:</label>
              <span>{{ verbatimData.family || '-' }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="verbatim-field">
              <label>Genus:</label>
              <span>{{ verbatimData.genus || '-' }}</span>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="verbatim-field">
              <label>Species:</label>
              <span>{{ verbatimData.species || '-' }}</span>
            </div>
          </el-col>
        </el-row>
      </div>

      <div v-else class="no-verbatim">
        <i class="el-icon-warning" />
        No verbatim taxonomic data available
      </div>
    </el-card>

    <!-- Family-only 建议展示 -->
    <el-card v-if="isFamilyOnlyRecord" class="family-suggestion-card">
      <div slot="header" class="card-header">
        <span><i class="el-icon-collection-tag" /> Family Suggestion (from Verbatim)</span>
        <el-tag :type="familyOnly.existsInDb ? 'success' : 'warning'" size="small">
          {{ familyOnly.existsInDb ? 'Family in DB' : 'Family not in DB' }}
        </el-tag>
      </div>

      <div class="suggestion-content">
        <div class="suggestion-info">
          <div class="suggestion-name">{{ familyOnly.verbatimFamilyName }}</div>
          <div class="suggestion-details">
            <span v-if="familyOnly.existsInDb" class="detail-item">FamilyID: {{ familyOnly.matchedFamilyId }}</span>
            <span class="detail-item">Verbatim has family only — no genus/species to match</span>
          </div>
          <div class="suggestion-actions">
            <template v-if="familyOnly.existsInDb">
              <el-button
                v-if="!isFamilyApplied"
                type="primary"
                size="small"
                :loading="applyingFamily"
                @click="applyFamilySuggestion"
              >
                <i class="el-icon-check" />
                Apply
              </el-button>
              <template v-else>
                <el-button type="success" size="small" disabled>
                  <i class="el-icon-check" />
                  Applied
                </el-button>
                <el-button
                  type="text"
                  size="small"
                  class="cancel-link"
                  :loading="cancellingFamily"
                  @click="cancelFamilySuggestion"
                >
                  Cancel
                </el-button>
              </template>
            </template>
            <span v-else class="family-not-in-db-hint">
              <i class="el-icon-warning-outline" />
              Family "<b>{{ familyOnly.verbatimFamilyName }}</b>" not found in DB.
              <br>
              <el-button
                type="primary"
                size="small"
                style="margin-top: 8px"
                @click="openAddFamilyDialog"
              >
                <i class="el-icon-plus" /> Add as new Family
              </el-button>
              <span class="hint-or">or correct the spelling above</span>
            </span>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 用户在本面板新建的 Family，独立于 verbatim 自动匹配的 -->
    <el-card v-if="manuallyCreatedFamily" class="manual-family-card">
      <div slot="header" class="card-header">
        <span><i class="el-icon-plus" /> Newly Created Family</span>
        <el-tag type="warning" size="small">Added in this session</el-tag>
      </div>
      <div class="suggestion-content">
        <div class="suggestion-info">
          <div class="suggestion-name">{{ manuallyCreatedFamily.familyName }}</div>
          <div class="suggestion-details">
            <span class="detail-item">FamilyID: {{ manuallyCreatedFamily.familyId }}</span>
            <span class="detail-item">Created via reviewer "Add New Family"</span>
          </div>
          <div class="suggestion-actions">
            <el-button
              v-if="!isManualFamilyApplied"
              type="primary"
              size="small"
              :loading="applyingManualFamily"
              @click="applyManuallyCreatedFamily"
            >
              <i class="el-icon-check" />
              Apply
            </el-button>
            <template v-else>
              <el-button type="success" size="small" disabled>
                <i class="el-icon-check" />
                Applied
              </el-button>
              <el-button
                type="text"
                size="small"
                class="cancel-link"
                :loading="cancellingManualFamily"
                @click="cancelManuallyCreatedFamilyApply"
              >
                Cancel
              </el-button>
            </template>
            <el-button
              v-if="!isManualFamilyApplied"
              type="text"
              size="small"
              class="cancel-link"
              @click="dismissManuallyCreatedFamily"
            >
              Dismiss
            </el-button>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 系统建议展示 -->
    <el-card v-if="hasValidSuggestion" class="suggestion-card">
      <div slot="header" class="card-header">
        <span><i class="el-icon-magic-stick" /> System Suggestion</span>
        <el-tag :type="getSuggestionTagType()" size="small">
          {{ matchSuggestions.status }} ({{ matchSuggestions.confidence }}%)
        </el-tag>
      </div>

      <div class="suggestion-content">
        <div class="suggestion-info">
          <div class="suggestion-name">{{ getSuggestedSpeciesName() }}</div>
          <div class="suggestion-details">
            <span class="detail-item">ID: {{ getSuggestedTaxonId() }}</span>
            <span v-if="getSuggestedFamily()" class="detail-item">Family: {{ getSuggestedFamily() }}</span>
            <span class="detail-item">Confidence: {{ matchSuggestions.confidence }}%</span>
            <span class="detail-item">Type: {{ matchSuggestions.status }}</span>
          </div>
          <div class="suggestion-actions">
            <el-button
              v-if="!isSystemSuggestionApplied"
              type="primary"
              size="small"
              :loading="applyingSuggestion"
              @click="applySuggestion"
            >
              <i class="el-icon-check" />
              Apply Suggestion
            </el-button>
            <template v-else>
              <el-button type="success" size="small" disabled>
                <i class="el-icon-check" />
                Applied
              </el-button>
              <el-button
                type="text"
                size="small"
                :loading="cancellingSuggestion"
                class="cancel-link"
                @click="cancelSuggestion"
              >
                Cancel
              </el-button>
            </template>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 当前匹配状态 -->
    <el-card class="current-match-card">
      <div slot="header" class="card-header">
        <span><i class="el-icon-check" /> Current Match</span>
        <el-button
          v-if="currentMatchedSpecies"
          size="mini"
          type="danger"
          :loading="clearingMatch"
          @click="clearMatch"
        >
          Clear Match
        </el-button>
      </div>

      <div v-if="currentMatchedSpecies" class="current-match">
        <div class="match-info">
          <div class="match-name">
            <template v-if="isFamilyLevelMatch">
              Family: {{ currentMatchedSpecies.Family }}
              <el-tag size="mini" type="info" class="match-level-tag">Family-level</el-tag>
            </template>
            <template v-else>
              {{ currentMatchedSpecies.FullName }}
              <el-tag size="mini" type="success" class="match-level-tag">Genus + Species</el-tag>
            </template>
          </div>
          <div class="match-details">
            <span class="detail-item">ID: {{ currentMatchedSpecies.TaxonID }}</span>
            <span v-if="!isFamilyLevelMatch && currentMatchedSpecies.Family" class="detail-item">Family: {{ currentMatchedSpecies.Family }}</span>
            <span v-if="currentMatchedSpecies.Author" class="detail-item">Author: {{ currentMatchedSpecies.Author }}</span>
          </div>
          <!-- 科不是这条记录的字段，是 taxon 的。写在科旁边，因为 curator 想改的时候
               看的就是这里，而"为什么这里改不了"只有在这里说才有用。 -->
          <div v-if="!isFamilyLevelMatch && currentMatchedSpecies.TaxonID" class="family-fix">
            <el-button type="text" size="mini" @click="$emit('fix-family', currentMatchedSpecies.TaxonID)">
              Family wrong? Re-file this taxon
            </el-button>
            <span class="family-fix-hint">
              The family belongs to the taxon, not to this record — changing it affects every
              record using it. Recorded, and undoable.
            </span>
          </div>
        </div>
      </div>

      <div v-else class="no-match">
        <i class="el-icon-warning-outline" />
        No species matched yet
      </div>
    </el-card>

    <!-- 搜索和匹配区域 -->
    <el-card class="search-card">
      <div slot="header" class="card-header">
        <span><i class="el-icon-search" /> Search Species</span>
        <div class="header-actions">
          <el-button
            size="medium"
            class="add-family-cta"
            @click="openAddFamilyDialog(searchQuery && searchQuery.trim() ? searchQuery.trim() : null)"
          >
            <i class="el-icon-collection-tag" />
            Add New Family
          </el-button>
          <el-button
            size="medium"
            type="primary"
            class="create-species-cta"
            @click="showCreateSpeciesDialog"
          >
            <i class="el-icon-plus" />
            Create New Species
          </el-button>
        </div>
      </div>

      <!-- 搜索输入 -->
      <div class="search-section">
        <el-input
          v-model="searchQuery"
          placeholder="Search by family, genus, species, or full name..."
          prefix-icon="el-icon-search"
          clearable
          @input="handleSearchInput"
          @keyup.enter.native="performSearch"
        >
          <el-button
            slot="append"
            :loading="searching"
            @click="performSearch"
          >
            Search
          </el-button>
        </el-input>
      </div>

      <!-- 搜索结果 -->
      <div v-if="searchResults.length > 0" class="search-results">
        <div class="results-header">
          <span>{{ searchResults.length }} results found</span>
          <el-pagination
            v-if="searchResults.length > pageSize"
            :current-page="currentPage"
            :page-size="pageSize"
            :total="searchResults.length"
            layout="prev, pager, next"
            small
            @current-change="handlePageChange"
          />
        </div>

        <div class="results-list">
          <div
            v-for="species in paginatedResults"
            :key="species.TaxonID"
            class="result-item"
            :class="{'selected': selectedSpecies && selectedSpecies.TaxonID === species.TaxonID}"
            @click="selectSpecies(species)"
          >

            <div class="result-content">
              <div class="result-name">
                <span class="full-name">{{ species.FullScientificName }}</span>
                <el-tag
                  v-if="isFamilyLevel(species)"
                  size="mini"
                  type="info"
                  class="result-level-tag"
                >Family-level</el-tag>
              </div>

              <div class="result-details">
                <span v-if="species.FamilyName" class="detail">Family: {{ species.FamilyName }}</span>
                <span v-if="species.TaxonID != null" class="detail">ID: {{ species.TaxonID }}</span>
                <span v-else class="detail virtual-tag">Will be created on Select</span>
              </div>

              <div class="result-actions">
                <el-button
                  size="mini"
                  type="primary"
                  :loading="confirmingMatch != null && confirmingMatch === species.TaxonID"
                  @click.stop="confirmMatch(species)"
                >
                  <i class="el-icon-check" />
                  Select
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 无搜索结果或者搜索提示 -->
      <div v-if="hasSearched && !searching && searchResults.length === 0" class="no-results">
        <i class="el-icon-warning-outline" />
        <div class="no-results-text">
          No matching species found for "{{ searchQuery }}".
          <br>
          <el-button type="text" @click="showCreateSpeciesDialog">
            <i class="el-icon-plus" />
            Create New Species
          </el-button>
        </div>
      </div>

      <!-- 搜索提示（未搜索时显示） -->
      <div v-if="!hasSearched && !searching" class="search-prompt">
        <div class="search-prompt-content">
          <i class="el-icon-search" />
          <p>Enter a scientific name, genus, or family to search for species.</p>
          <p class="search-prompt-sub">
            Can't find what you're looking for?
            <el-button type="text" class="create-link" @click="showCreateSpeciesDialog">
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
      width="500px"
      :append-to-body="true"
    >

      <create-species-form
        :verbatim-data="enhancedVerbatimData"
        @submit="handleCreateSpecies"
        @cancel="showCreateDialog = false"
      />
    </el-dialog>

    <!-- 新建 Family 对话框 -->
    <el-dialog
      title="Add New Family"
      :visible.sync="showAddFamilyDialog"
      width="440px"
      :append-to-body="true"
      :close-on-click-modal="false"
    >
      <el-form
        ref="addFamilyForm"
        :model="newFamilyForm"
        :rules="addFamilyRules"
        label-width="120px"
        size="small"
      >
        <el-form-item label="Family Name" prop="family_name">
          <el-input
            v-model="newFamilyForm.family_name"
            placeholder="e.g., Cyprinidae"
            clearable
          />
        </el-form-item>
        <el-form-item label="Family Number">
          <el-input
            v-model="newFamilyForm.family_number"
            placeholder="Optional (reviewer-only reference)"
            clearable
          />
        </el-form-item>
        <el-form-item label="Alias2">
          <el-input
            v-model="newFamilyForm.alias2"
            placeholder="Optional"
            clearable
          />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button size="small" @click="showAddFamilyDialog = false">Cancel</el-button>
        <el-button
          type="primary"
          size="small"
          :loading="creatingFamily"
          @click="submitNewFamily"
        >
          Create
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import CreateSpeciesForm from '@/components/RecordsProcessor/CreateSpeciesForm.vue'
import { addTaxon, getTaxon } from '@/api/table'
import { updateVerbatimRecord, applyFamilyTaxon, createFamily } from '@/api/verbatimworkspace'
import { decideTaxon } from '@/utils/taxonDecision'

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
    // 同名批量应用要用它定位批次
    batchSerialId: {
      type: String,
      default: ''
    },
    verbatimData: {
      type: Object,
      default: null
    },
    matchSuggestions: {
      type: Object,
      default: null
    },
    familyOnly: {
      type: Object,
      default: null
    },
    // 用户在本面板里 "Add New Family" 创建的新 family（独立于 verbatim 自动匹配的）
    // 形如 { familyId, familyName }
    manuallyCreatedFamily: {
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

      // Family-only Apply 状态
      familyApplied: false,
      applyingFamily: false,
      cancellingFamily: false,

      // System Suggestion Apply 本地状态（覆盖 prop）
      suggestionAppliedLocal: null,
      applyingSuggestion: false,
      cancellingSuggestion: false,

      // 搜索结果里 Select / Clear Match 的落库状态
      confirmingMatch: null,
      clearingMatch: false,

      // 去抖计时器
      searchDebouncer: null,

      // 新建 Family 对话框
      showAddFamilyDialog: false,
      creatingFamily: false,
      newFamilyForm: {
        family_name: '',
        family_number: '',
        alias2: ''
      },
      addFamilyRules: {
        family_name: [
          { required: true, message: 'Family name is required', trigger: 'blur' },
          { min: 2, max: 100, message: '2-100 characters', trigger: 'blur' }
        ]
      },

      // "Newly Created Family" 卡的 Apply / Cancel 本地状态
      manualFamilyAppliedLocal: false,
      applyingManualFamily: false,
      cancellingManualFamily: false
    }
  },
  computed: {
    paginatedResults() {
      const start = (this.currentPage - 1) * this.pageSize
      const end = start + this.pageSize
      return this.searchResults.slice(start, end)
    },

    // 判断是否有有效的系统建议
    hasValidSuggestion() {
      return this.matchSuggestions &&
        this.matchSuggestions.hasSuggestion &&
        this.getSuggestedTaxonId()
    },

    // 是否是 family-only 记录（verbatim 只有 family，没 genus/species）
    isFamilyOnlyRecord() {
      return !!(this.familyOnly && this.familyOnly.isFamilyOnly)
    },

    // System Suggestion 是否已应用（本地状态优先于 prop）
    isSystemSuggestionApplied() {
      if (this.suggestionAppliedLocal !== null) return this.suggestionAppliedLocal
      return !!(this.matchSuggestions && this.matchSuggestions.suggestionApplied)
    },

    // 当前 currentMatchedSpecies 是否是 family-level 匹配（FamilyID 设了，Genus/Species 都空）
    isFamilyLevelMatch() {
      const t = this.currentMatchedSpecies
      if (!t) return false
      const hasFamily = !!t.Family
      const noGenus = !t.Genus || String(t.Genus).trim() === ''
      const noSpecies = !t.Species || String(t.Species).trim() === ''
      return hasFamily && noGenus && noSpecies
    },

    // 用户新建的 family 是否已 Apply（用本地状态 + record 状态结合判断）
    // 本地标记优先；否则看 record 当前绑定的 taxon 是否就是这个新 family 的占位
    isManualFamilyApplied() {
      if (this.manualFamilyAppliedLocal) return true
      const t = this.record && this.record.taxonomic
      if (!t || !t.TaxonID || !this.manuallyCreatedFamily) return false
      // family-level 占位的特征：Genus/Species 都空
      const noGenus = !t.Genus || String(t.Genus).trim() === ''
      const noSpecies = !t.Species || String(t.Species).trim() === ''
      // 显示名通常等于 FamilyName
      const sameName = (t.Family || t.FullName || '') === this.manuallyCreatedFamily.familyName
      return noGenus && noSpecies && sameName
    },

    // Family 是否已应用（本地状态优先；否则看记录是否已绑定 family-level taxon）
    isFamilyApplied() {
      if (this.familyApplied) return true
      // 重新进入对话框时根据 record.taxonomic 判定：FamilyID 设了但 Genus/Species 为空
      const t = this.record && this.record.taxonomic
      if (!t || !t.TaxonID) return false
      const hasFamily = !!t.Family
      const noGenus = !t.Genus || String(t.Genus).trim() === ''
      const noSpecies = !t.Species || String(t.Species).trim() === ''
      return hasFamily && noGenus && noSpecies
    },

    // 给 CreateSpeciesForm 用的增强 verbatim 数据（带 familyId 用于预填）
    enhancedVerbatimData() {
      if (!this.verbatimData && !this.familyOnly) return null
      const base = this.verbatimData ? { ...this.verbatimData } : {}
      if (this.familyOnly && this.familyOnly.existsInDb) {
        base.familyId = this.familyOnly.matchedFamilyId
        base.familyName = this.familyOnly.verbatimFamilyName
      }
      return base
    },

    // 当前匹配的物种信息
    currentMatchedSpecies() {
      // 优先显示用户手动选择的物种
      if (this.record.taxonId && this.record.taxonomic) {
        return this.record.taxonomic
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
        }
      }

      return null
    }
  },
  watch: {
    verbatimData: {
      immediate: true,
      handler(newValue) {
        if (newValue && this.shouldInitializeSearch()) {
          this.initializeSearch()
        }
      }
    }
  },
  methods: {
    // 获取建议的物种名
    getSuggestedSpeciesName() {
      // 根据实际数据结构获取
      if (this.matchSuggestions && this.matchSuggestions.match_details && this.matchSuggestions.match_details.db_name) {
        return this.matchSuggestions.match_details.db_name
      }

      // 备选方案：从 suggested_data 获取
      if (this.matchSuggestions && this.matchSuggestions.suggested_data) {
        const genus = this.matchSuggestions.suggested_data.genus
        const species = this.matchSuggestions.suggested_data.species
        if (genus && species) {
          return `${genus} ${species}`
        }
      }

      return 'Unknown species'
    },

    // 获取建议的分类ID
    getSuggestedTaxonId() {
      if (this.matchSuggestions && this.matchSuggestions.suggested_taxon_id) {
        return this.matchSuggestions.suggested_taxon_id
      }
      return null
    },

    // 获取建议的科名
    getSuggestedFamily() {
      if (this.matchSuggestions && this.matchSuggestions.suggested_data && this.matchSuggestions.suggested_data.family) {
        return this.matchSuggestions.suggested_data.family
      }
      return null
    },

    // 获取建议的属名
    getSuggestedGenus() {
      if (this.matchSuggestions && this.matchSuggestions.suggested_data && this.matchSuggestions.suggested_data.genus) {
        return this.matchSuggestions.suggested_data.genus
      }
      return null
    },

    // 获取建议的种名
    getSuggestedSpecies() {
      if (this.matchSuggestions && this.matchSuggestions.suggested_data && this.matchSuggestions.suggested_data.species) {
        return this.matchSuggestions.suggested_data.species
      }
      return null
    },

    // 获取建议的作者
    getSuggestedAuthor() {
      if (this.matchSuggestions && this.matchSuggestions.suggested_data && this.matchSuggestions.suggested_data.author) {
        return this.matchSuggestions.suggested_data.author
      }
      return null
    },

    // 判断是否应该初始化搜索
    shouldInitializeSearch() {
      return !this.record.taxonId && this.verbatimData
    },

    // 初始化搜索
    initializeSearch() {
      if (this.verbatimData) {
        const { verbatimGenus, verbatimSpecies } = this.verbatimData
        if (verbatimGenus && verbatimSpecies) {
          this.searchQuery = `${verbatimGenus} ${verbatimSpecies}`
        } else if (verbatimGenus) {
          this.searchQuery = verbatimGenus
        }
      }
    },

    // 获取建议标签类型
    getSuggestionTagType() {
      if (!this.matchSuggestions) return ''

      const confidence = this.matchSuggestions.confidence || 0
      if (confidence >= 90) return 'success'
      if (confidence >= 70) return 'warning'
      return 'info'
    },

    // 应用系统建议（一键 apply + save）
    async applySuggestion() {
      if (!this.hasValidSuggestion) return

      const suggestedTaxon = {
        TaxonID: this.getSuggestedTaxonId(),
        FullName: this.getSuggestedSpeciesName(),
        Family: this.getSuggestedFamily(),
        Genus: this.getSuggestedGenus(),
        Species: this.getSuggestedSpecies(),
        Author: this.getSuggestedAuthor()
      }

      this.applyingSuggestion = true
      try {
        // decideTaxon 会先问要不要应用到同名的其余记录，再连这一条一起写。署名、
        // verified_by 都在里面：导入时 exact match 自动写的也是 verified + 同一个
        // TaxonID，不带署名事后就分不出哪些是人确认过的。
        const outcome = await decideTaxon(this, {
          batchSerialId: this.batchSerialId,
          recordId: this.record.id,
          verbatim: this.verbatimData,
          samePendingAny: this.record.sameNamePendingAny,
          taxonId: suggestedTaxon.TaxonID,
          notes: 'Applied taxonomic suggestion from edit dialog',
          curator: this.$store.getters.name || 'curator'
        })
        if (outcome.ok) {
          this.suggestionAppliedLocal = true
          this.$emit('species-saved', {
            taxonomic: suggestedTaxon,
            speciesVerificationStatus: 'verified',
            nameGroupHandled: true,
            appliedCount: outcome.count
          })
          this.$message.success(outcome.mode === 'group'
            ? `Suggestion applied to ${outcome.count} record(s)`
            : 'Suggestion applied and saved')
        } else {
          this.$message.error(outcome.message || 'Failed to save suggestion')
        }
      } catch (error) {
        this.$message.error('Failed to apply suggestion')
        console.error(error)
      } finally {
        this.applyingSuggestion = false
      }
    },

    // 取消系统建议（clear + save）
    async cancelSuggestion() {
      this.cancellingSuggestion = true
      try {
        const response = await updateVerbatimRecord({
          id: this.record.id,
          taxon_id: null,
          species_verification_status: 'pending',
          verification_notes: 'Cancelled taxonomic suggestion from edit dialog'
        })
        if (response.code === 20000) {
          this.suggestionAppliedLocal = false
          this.$emit('species-saved', {
            taxonomic: null,
            speciesVerificationStatus: 'pending'
          })
          this.$message.success('Suggestion cancelled')
        } else {
          this.$message.error('Failed to cancel suggestion')
        }
      } catch (error) {
        this.$message.error('Failed to cancel suggestion')
        console.error(error)
      } finally {
        this.cancellingSuggestion = false
      }
    },

    // 处理搜索输入
    handleSearchInput() {
      clearTimeout(this.searchDebouncer)
      this.searchDebouncer = setTimeout(() => {
        if (this.searchQuery.length >= 2) {
          this.performSearch()
        }
      }, 300)
    },

    // 执行搜索
    async performSearch() {
      if (!this.searchQuery.trim()) {
        this.searchResults = []
        this.hasSearched = false
        return
      }

      this.searching = true
      this.hasSearched = true

      try {
        const response = await getTaxon({
          pageSize: 50,
          pageNumber: 1,
          keyWord: this.searchQuery
        })

        if (response && response.data && response.data.items) {
          this.searchResults = response.data.items
          this.currentPage = 1
        } else {
          this.searchResults = []
        }
      } catch (error) {
        this.$message.error('Search failed')
        console.error(error)
        this.searchResults = []
      } finally {
        this.searching = false
      }
    },

    // 选择物种
    selectSpecies(species) {
      this.selectedSpecies = species
    },

    // 判断搜索结果中某条是否是 family-level（Genus/Species 都空 + 有 FamilyName）
    // 同时覆盖两种来源：TaxonomicTable 里的 family-level 占位行，以及
    // 后端 Family 表兜底返回的虚拟项（TaxonID 为 null）
    isFamilyLevel(species) {
      const noGenus = !species.Genus || String(species.Genus).trim() === ''
      const noSpecies = !species.Species || String(species.Species).trim() === ''
      return !!species.FamilyName && noGenus && noSpecies
    },

    // 确认匹配
    // 后端 Family 表兜底返回的虚拟项 TaxonID 为 null，走 applyFamilyTaxon
    // 自动 find-or-create 占位 taxon；普通 taxon 项走原有 species-selected 流程。
    async confirmMatch(species) {
      if (species.TaxonID == null) {
        await this.applyVirtualFamily(species)
        return
      }

      const taxonomicData = {
        TaxonID: species.TaxonID,
        FullName: species.FullScientificName || species.FullName,
        Family: species.FamilyName || species.Family,
        Genus: species.Genus,
        Species: species.Species,
        Author: species.Author
      }

      // 以前这里只 emit species-selected（纯内存）+ 弹一句绿色 "Species matched"，要等
      // curator 再按弹窗底部的 Save 才真的落库 —— 那个 Save 很容易被忽略，看见绿字就关窗
      // 的话这次选择直接丢了。现在走 decideTaxon：先问要不要应用到同名的其余记录，再一次性
      // 写下去（这一条也在那次操作里，所以 Undo 能整批还原）。
      this.confirmingMatch = species.TaxonID
      try {
        const outcome = await decideTaxon(this, {
          batchSerialId: this.batchSerialId,
          recordId: this.record.id,
          verbatim: this.verbatimData,
          samePendingAny: this.record.sameNamePendingAny,
          taxonId: taxonomicData.TaxonID,
          notes: 'Selected taxon from edit dialog search',
          curator: this.$store.getters.name || 'curator'
        })
        if (outcome.ok) {
          this.selectedSpecies = species
          this.$emit('species-saved', {
            taxonomic: taxonomicData,
            speciesVerificationStatus: 'verified',
            // 同名批量已经在这里问过并处理掉了，父组件不要再问一遍
            nameGroupHandled: true,
            appliedCount: outcome.count
          })
          this.$message.success(outcome.mode === 'group'
            ? `${outcome.count} record(s) set to ${taxonomicData.FullName}`
            : `Species matched and saved: ${taxonomicData.FullName}`)
        } else {
          this.$message.error(outcome.message || 'Failed to save the selected species')
        }
      } catch (error) {
        this.$message.error('Failed to save the selected species')
        console.error(error)
      } finally {
        this.confirmingMatch = null
      }
    },

    // 虚拟 family-level 项：调用后端 apply_family_taxon，自动建占位 taxon
    async applyVirtualFamily(species) {
      if (!species.FamilyID) {
        this.$message.error('Missing FamilyID for family-level entry')
        return
      }

      try {
        const response = await applyFamilyTaxon(this.record.id, species.FamilyID)
        if (response.code === 20000) {
          const data = response.data
          this.$emit('species-saved', {
            taxonomic: {
              TaxonID: data.taxon_id,
              FullName: data.full_scientific_name,
              Family: data.family_name,
              Genus: null,
              Species: null,
              Author: null
            },
            speciesVerificationStatus: 'verified'
          })
          this.selectedSpecies = species
          this.$message.success(
            data.was_created
              ? 'Family-level taxon created and applied'
              : 'Family-level taxon applied'
          )
        } else {
          this.$message.error(response.message || 'Failed to apply family')
        }
      } catch (error) {
        this.$message.error('Failed to apply family')
        console.error(error)
      }
    },

    // 清除匹配。跟 confirmMatch 对称：选是立刻存的，清也必须立刻存，否则关掉弹窗之后
    // 库里还挂着刚被"清掉"的 taxon。
    async clearMatch() {
      this.clearingMatch = true
      try {
        const response = await updateVerbatimRecord({
          id: this.record.id,
          taxon_id: null,
          species_verification_status: 'pending',
          verification_notes: 'Cleared taxon match from edit dialog'
        })
        if (response.code === 20000) {
          this.selectedSpecies = null
          this.$emit('species-saved', {
            taxonomic: null,
            speciesVerificationStatus: 'pending'
          })
          this.$message.info('Match cleared')
        } else {
          this.$message.error(response.message || 'Failed to clear the match')
        }
      } catch (error) {
        this.$message.error('Failed to clear the match')
        console.error(error)
      } finally {
        this.clearingMatch = false
      }
    },

    // 显示创建物种对话框
    showCreateSpeciesDialog() {
      this.showCreateDialog = true
    },

    // Family-only 场景：把 family-level taxon 应用到记录（一键 find-or-create + apply + save）
    async applyFamilySuggestion() {
      if (!this.familyOnly || !this.familyOnly.matchedFamilyId) return

      this.applyingFamily = true
      try {
        const response = await applyFamilyTaxon(this.record.id, this.familyOnly.matchedFamilyId)
        if (response.code === 20000) {
          const data = response.data
          this.familyApplied = true
          this.$emit('species-saved', {
            taxonomic: {
              TaxonID: data.taxon_id,
              FullName: data.full_scientific_name,
              Family: data.family_name,
              Genus: null,
              Species: null,
              Author: null
            },
            speciesVerificationStatus: 'verified'
          })
          this.$message.success(
            data.was_created
              ? 'Family-level taxon created and applied'
              : 'Family-level taxon applied'
          )
        } else {
          this.$message.error(response.message || 'Failed to apply family')
        }
      } catch (error) {
        this.$message.error('Failed to apply family')
        console.error(error)
      } finally {
        this.applyingFamily = false
      }
    },

    // 把 "Newly Created Family" 卡里那个 family 应用到记录
    async applyManuallyCreatedFamily() {
      if (!this.manuallyCreatedFamily || !this.manuallyCreatedFamily.familyId) return
      this.applyingManualFamily = true
      try {
        const response = await applyFamilyTaxon(this.record.id, this.manuallyCreatedFamily.familyId)
        if (response.code === 20000) {
          const data = response.data
          this.manualFamilyAppliedLocal = true
          this.$emit('species-saved', {
            taxonomic: {
              TaxonID: data.taxon_id,
              FullName: data.full_scientific_name,
              Family: data.family_name,
              Genus: null,
              Species: null,
              Author: null
            },
            speciesVerificationStatus: 'verified'
          })
          this.$message.success(
            data.was_created
              ? 'Family-level taxon created and applied'
              : 'Family-level taxon applied'
          )
        } else {
          this.$message.error(response.message || 'Failed to apply family')
        }
      } catch (error) {
        this.$message.error('Failed to apply family')
        console.error(error)
      } finally {
        this.applyingManualFamily = false
      }
    },

    // 撤回 "Newly Created Family" 的 Apply（clear taxon_id + save）
    async cancelManuallyCreatedFamilyApply() {
      this.cancellingManualFamily = true
      try {
        const response = await updateVerbatimRecord({
          id: this.record.id,
          taxon_id: null,
          species_verification_status: 'pending',
          verification_notes: 'Cancelled newly-created family apply'
        })
        if (response.code === 20000) {
          this.manualFamilyAppliedLocal = false
          this.$emit('species-saved', {
            taxonomic: null,
            speciesVerificationStatus: 'pending'
          })
          this.$message.info('Family apply cancelled')
        } else {
          this.$message.error('Failed to cancel')
        }
      } catch (error) {
        this.$message.error('Failed to cancel')
        console.error(error)
      } finally {
        this.cancellingManualFamily = false
      }
    },

    // 把整个 "Newly Created Family" 卡去掉（用户决定不用这个新 family 了）
    // 不影响数据库——Family 记录已经创建了，只是不再显示这张卡
    dismissManuallyCreatedFamily() {
      this.manualFamilyAppliedLocal = false
      this.$emit('manually-created-family-cancel')
    },

    // 打开"新建 Family"对话框。预填优先级：
    //   显式传入的 prefillName > 当前搜索框内容 > verbatim 的 family 名 > 空
    // 调用点：
    //   - family-not-in-db 提示按钮：无参，走 verbatim 兜底
    //   - Search Species header 按钮：传搜索框内容，覆盖 verbatim 兜底
    openAddFamilyDialog(prefillName) {
      let initialName = prefillName
      if (!initialName && this.familyOnly && this.familyOnly.verbatimFamilyName) {
        initialName = this.familyOnly.verbatimFamilyName
      }
      this.newFamilyForm = {
        family_name: initialName || '',
        family_number: '',
        alias2: ''
      }
      this.showAddFamilyDialog = true
      // 下一个 tick 清空校验残留
      this.$nextTick(() => {
        if (this.$refs.addFamilyForm) this.$refs.addFamilyForm.clearValidate()
      })
    },

    // 提交新 Family：调后端 createFamily，成功后 emit family-created 给父组件
    submitNewFamily() {
      this.$refs.addFamilyForm.validate(async(valid) => {
        if (!valid) return
        this.creatingFamily = true
        try {
          const response = await createFamily({
            family_name: this.newFamilyForm.family_name.trim(),
            family_number: this.newFamilyForm.family_number ? this.newFamilyForm.family_number.trim() : null,
            alias2: this.newFamilyForm.alias2 ? this.newFamilyForm.alias2.trim() : null
          })
          if (response.code === 20000) {
            this.$emit('family-created', {
              familyId: response.data.family_id,
              familyName: response.data.family_name
            })
            this.$message.success(`Family "${response.data.family_name}" created`)
            this.showAddFamilyDialog = false
          } else if (response.code === 40900) {
            // 已存在 — 也算成功，直接用现有的
            this.$emit('family-created', {
              familyId: response.data.family_id,
              familyName: response.data.family_name
            })
            this.$message.info(response.message || 'Family already exists, using existing one')
            this.showAddFamilyDialog = false
          } else {
            this.$message.error(response.message || 'Failed to create family')
          }
        } catch (error) {
          this.$message.error('Failed to create family')
          console.error(error)
        } finally {
          this.creatingFamily = false
        }
      })
    },

    // 取消 family 应用（清 taxon_id + save，逻辑同 cancelSuggestion）
    async cancelFamilySuggestion() {
      this.cancellingFamily = true
      try {
        const response = await updateVerbatimRecord({
          id: this.record.id,
          taxon_id: null,
          species_verification_status: 'pending',
          verification_notes: 'Cancelled family-level taxon from edit dialog'
        })
        if (response.code === 20000) {
          this.familyApplied = false
          this.$emit('species-saved', {
            taxonomic: null,
            speciesVerificationStatus: 'pending'
          })
          this.$message.info('Family suggestion cancelled')
        } else {
          this.$message.error('Failed to cancel family')
        }
      } catch (error) {
        this.$message.error('Failed to cancel family')
        console.error(error)
      } finally {
        this.cancellingFamily = false
      }
    },

    // 处理创建新物种
    async handleCreateSpecies(speciesData) {
      this.showCreateDialog = false

      try {
        // 调用创建物种API
        const response = await addTaxon(speciesData)

        if (response.code === 20000 && response.data.items && response.data.items.length > 0) {
          const newTaxonId = response.data.items[0].TaxonID

          // 创建物种信息对象
          const newSpecies = {
            TaxonID: newTaxonId,
            FullName: speciesData.fullScientificName,
            Genus: speciesData.genus,
            Species: speciesData.species,
            Subspecies: speciesData.subspecies,
            FamilyID: speciesData.familyID,
            Remarks: speciesData.remarks
          }

          // 自动匹配到 Current Match
          this.confirmMatch(newSpecies)

          this.$message.success(`New species "${speciesData.fullScientificName}" created and matched successfully!`)
        } else {
          this.$message.error('Failed to create species: Invalid response')
        }
      } catch (error) {
        console.error('Error creating species:', error)
        this.$message.error('Failed to create new species. Please try again.')
      }
    },

    // 分页处理
    handlePageChange(page) {
      this.currentPage = page
    }
  }
}
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

/* Family 建议卡片样式 */
.family-suggestion-card {
  border: 2px solid #E6A23C;
}

/* 用户新建的 Family 卡（视觉上区别于 verbatim 自动匹配的 suggestion 卡） */
.manual-family-card {
  border: 2px dashed #67C23A;
  background: #f6fef0;
}

.family-not-in-db-hint {
  display: inline-block;
  font-size: 13px;
  color: #b88230;
  background: #fdf6ec;
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid #faecd8;
}

.match-level-tag {
  margin-left: 8px;
  vertical-align: middle;
}

.cancel-link {
  margin-left: 8px;
  color: #f56c6c !important;
}

.cancel-link:hover {
  color: #f78989 !important;
  text-decoration: underline;
}

.family-not-in-db-hint i {
  margin-right: 4px;
}

.hint-or {
  margin-left: 12px;
  color: #b88230;
  font-size: 12px;
  vertical-align: middle;
}

/* 头部右侧按钮组 */
.header-actions {
  display: flex;
  gap: 8px;
}

/* 突出 Create New Species 按钮 */
.create-species-cta {
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.25);
}

.create-species-cta i {
  margin-right: 4px;
}

.add-family-cta i {
  margin-right: 4px;
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

.family-fix {
  margin-top: 8px;
  text-align: center;
}

.family-fix-hint {
  display: block;
  color: #909399;
  font-size: 11px;
  line-height: 1.4;
  max-width: 420px;
  margin: 0 auto;
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

.virtual-tag {
  background: #fdf6ec !important;
  color: #b88230 !important;
  border: 1px solid #faecd8;
  font-style: italic;
}

.result-level-tag {
  margin-left: 8px;
  vertical-align: middle;
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
