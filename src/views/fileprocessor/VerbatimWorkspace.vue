<!--
  VerbatimWorkspace.vue
  Verbatim 数据处理工作台 - 批次数据验证和编辑 (服务器端分页版本)
  支持完整的三阶段验证：物种验证、地点验证、记录详情验证
-->
<template>
  <div class="verbatim-workspace">
    <!-- 批次选择器 -->
    <el-card class="batch-selector-card">
      <div slot="header" class="clearfix">
        <span class="text-lg font-medium">Verbatim Data Processing Workspace</span>
      </div>

      <div class="batch-selector">
        <el-row :gutter="20" align="middle">
          <el-col :span="8">
            <el-select
              v-model="selectedBatchId"
              placeholder="Select a batch to process"
              filterable
              clearable
              @change="loadBatchData"
              class="w-full">
              <el-option
                v-for="batch in availableBatches"
                :key="batch.batchSerialId"
                :label="`${batch.batchSerialId} - ${batch.fileName} (${batch.recordCount} records)`"
                :value="batch.batchSerialId">
              </el-option>
            </el-select>
          </el-col>
          <el-col :span="4">
            <el-button
              type="primary"
              :loading="loadingBatch"
              @click="refreshBatchList">
              <i class="el-icon-refresh"></i>
              Refresh
            </el-button>
          </el-col>
          <el-col :span="12" v-if="currentBatch">
            <div class="batch-info">
              <span class="batch-info-item">
                <i class="el-icon-document"></i>
                {{currentBatch.fileName}}
              </span>
              <span class="batch-info-item">
                <i class="el-icon-tickets"></i>
                {{currentBatch.recordCount}} records
              </span>
              <span class="batch-info-item">
                <i class="el-icon-time"></i>
                {{formatDate(currentBatch.importDate)}}
              </span>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-card>

    <!-- 数据处理区域 -->
    <div v-if="currentBatch" class="workspace-content">
      <!-- 进度概览 -->
      <el-card class="progress-overview-card">
        <div slot="header" class="clearfix">
          <span>Processing Progress</span>
          <el-button
            style="float: right; padding: 3px 0; margin-left: 10px;"
            type="text"
            @click="refreshProgress">
            <i class="el-icon-refresh"></i>
          </el-button>
          <el-button
            style="float: right; padding: 3px 0"
            type="text"
            @click="revalidateBatch">
            <i class="el-icon-refresh-right"></i>
            Re-validate
          </el-button>
        </div>

        <el-row :gutter="20">
          <el-col :span="4">
            <div class="progress-item">
              <div class="progress-number">{{progressStats.total}}</div>
              <div class="progress-label">Total Records</div>
            </div>
          </el-col>
          <el-col :span="5">
            <div class="progress-item">
              <div class="progress-number species">{{progressStats.speciesVerified}}</div>
              <div class="progress-label">Species Verified</div>
              <div class="progress-bar">
                <el-progress
                  :percentage="progressStats.speciesPercentage"
                  :stroke-width="8"
                  color="#67C23A">
                </el-progress>
              </div>
            </div>
          </el-col>
          <el-col :span="5">
            <div class="progress-item">
              <div class="progress-number locality">{{progressStats.localityVerified}}</div>
              <div class="progress-label">Locality Verified</div>
              <div class="progress-bar">
                <el-progress
                  :percentage="progressStats.localityPercentage"
                  :stroke-width="8"
                  color="#409EFF">
                </el-progress>
              </div>
            </div>
          </el-col>
          <el-col :span="5">
            <div class="progress-item">
              <div class="progress-number record">{{progressStats.recordVerified}}</div>
              <div class="progress-label">Record Verified</div>
              <div class="progress-bar">
                <el-progress
                  :percentage="progressStats.recordPercentage"
                  :stroke-width="8"
                  color="#E6A23C">
                </el-progress>
              </div>
            </div>
          </el-col>
          <el-col :span="5">
            <div class="progress-item">
              <div class="progress-number complete">{{progressStats.fullyCompleted}}</div>
              <div class="progress-label">Fully Completed</div>
              <div class="progress-bar">
                <el-progress
                  :percentage="progressStats.completionPercentage"
                  :stroke-width="8"
                  color="#F56C6C">
                </el-progress>
              </div>
            </div>
          </el-col>
        </el-row>

        <!-- Warnings & Issues Statistics -->
        <el-divider></el-divider>
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="progress-item warning-stat">
              <div class="progress-number" style="color: #E6A23C;">{{progressStats.hasWarnings || 0}}</div>
              <div class="progress-label">
                <i class="el-icon-warning" style="color: #E6A23C;"></i>
                Records with Warnings
              </div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="progress-item error-stat">
              <div class="progress-number" style="color: #F56C6C;">{{progressStats.hasErrors || 0}}</div>
              <div class="progress-label">
                <i class="el-icon-close" style="color: #F56C6C;"></i>
                Records with Errors
              </div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="progress-item pending-stat">
              <div class="progress-number" style="color: #909399;">{{progressStats.hasPending || 0}}</div>
              <div class="progress-label">
                <i class="el-icon-time" style="color: #909399;"></i>
                Pending Review
              </div>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 记录列表和过滤器 -->
      <el-card class="records-card">
        <div slot="header" class="clearfix">
          <span>Records Management</span>
          <div style="float: right;">
            <el-button-group>
              <el-button
                size="small"
                :type="serverSideFilter === 'all' ? 'primary' : ''"
                @click="setFilter('all')">
                All ({{totalRecords}})
              </el-button>
              <el-button
                size="small"
                :type="serverSideFilter === 'completed' ? 'success' : ''"
                @click="setFilter('completed')">
                ✅ Completed ({{progressStats.fullyCompleted || 0}})
              </el-button>
              <el-button
                size="small"
                :type="serverSideFilter === 'has_errors' ? 'danger' : ''"
                @click="setFilter('has_errors')">
                🔴 Errors ({{progressStats.hasErrors || 0}})
              </el-button>
              <el-button
                size="small"
                :type="serverSideFilter === 'has_warnings' ? 'warning' : ''"
                @click="setFilter('has_warnings')">
                ⚠️ Warnings ({{progressStats.hasWarnings || 0}})
              </el-button>
              <el-button
                size="small"
                :type="serverSideFilter === 'pending_taxonomic' ? 'danger' : ''"
                @click="setFilter('pending_taxonomic')">
                ❌ Species Pending ({{progressStats.pendingTaxonomic || 0}})
              </el-button>
              <el-button
                size="small"
                :type="serverSideFilter === 'pending_locality' ? 'danger' : ''"
                @click="setFilter('pending_locality')">
                ❌ Locality Pending ({{progressStats.pendingLocality || 0}})
              </el-button>
              <el-button
                size="small"
                :type="serverSideFilter === 'pending_record' ? 'danger' : ''"
                @click="setFilter('pending_record')">
                ❌ Record Pending ({{progressStats.pendingRecord || 0}})
              </el-button>
            </el-button-group>
          </div>
        </div>

        <!-- 搜索和操作栏 -->
        <div class="table-toolbar">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-input
                v-model="searchText"
                @input="onSearchChange"
                @clear="onSearchClear"
                placeholder="Search by catalog number, field number, or species..."
                prefix-icon="el-icon-search"
                clearable>
              </el-input>
            </el-col>
            <el-col :span="12" class="text-right">
              <el-dropdown @command="handleBatchAction" style="margin-right: 10px;">
                <el-button>
                  Batch Actions <i class="el-icon-arrow-down el-icon--right"></i>
                </el-button>
                <el-dropdown-menu slot="dropdown">
                  <el-dropdown-item command="verify-completed">Verify All Completed</el-dropdown-item>
                  <el-dropdown-item command="verify-species">Verify All Species</el-dropdown-item>
                  <el-dropdown-item command="verify-locality">Verify All Locality</el-dropdown-item>
                  <el-dropdown-item divided command="mark-review">Mark Selected for Review</el-dropdown-item>
                </el-dropdown-menu>
              </el-dropdown>
              <el-button @click="exportBatchResults">
                <i class="el-icon-download"></i>
                Export Results
              </el-button>
              <el-button type="success" @click="markBatchCompleted">
                <i class="el-icon-check"></i>
                Mark Batch Completed
              </el-button>
            </el-col>
          </el-row>
        </div>

        <!-- 记录表格 -->
        <el-table
          ref="recordsTable"
          :data="batchRecords"
          v-loading="loadingRecords"
          stripe
          height="600"
          @row-click="editRecord"
          @selection-change="handleSelectionChange">

          <el-table-column
            type="selection"
            width="55">
          </el-table-column>

          <el-table-column prop="catalogNumber" label="Catalog # (Temp)" width="180">
            <template slot-scope="scope">
              <span class="catalog-number">
                <span v-if="isTemporaryCatalogNumber(scope.row.catalogNumber)" class="temp-catalog-number">
                  {{scope.row.catalogNumber}}
                </span>
                <span v-else class="normal-catalog-number">
                  {{scope.row.catalogNumber}}
                </span>
                <!-- Error icon (severity: error) -->
                <el-tooltip v-if="hasErrors(scope.row)" placement="top">
                  <div slot="content">
                    <div v-for="(error, idx) in getErrors(scope.row)" :key="`error-${idx}`" style="margin: 4px 0;">
                      🔴 {{ error.message }}
                    </div>
                  </div>
                  <i class="el-icon-close warning-icon" style="color: #F56C6C;"></i>
                </el-tooltip>
                <!-- Warning icon (severity: warning) - 即使有errors也显示warnings -->
                <el-tooltip v-if="hasWarnings(scope.row)" placement="top">
                  <div slot="content">
                    <div v-for="(warning, idx) in getWarnings(scope.row)" :key="`warning-${idx}`" style="margin: 4px 0;">
                      ⚠️ {{ warning.message }}
                    </div>
                  </div>
                  <i class="el-icon-warning warning-icon" style="color: #E6A23C;"></i>
                </el-tooltip>
              </span>
            </template>
          </el-table-column>

          <el-table-column prop="fieldNumber" label="Field #" width="120">
            <template slot-scope="scope">
              <span>{{scope.row.fieldNumber || '-'}}</span>
            </template>
          </el-table-column>

          <el-table-column label="Species Status" width="180">
            <template slot-scope="scope">
              <div class="status-column">
                <el-tag
                  :type="getSpeciesStatusType(scope.row)"
                  size="small">
                  <i :class="getSpeciesStatusIcon(scope.row)"></i>
                  {{getSpeciesStatusText(scope.row)}}
                </el-tag>
                <!-- 显示匹配建议信息 -->
                <div v-if="scope.row.matchSuggestions && scope.row.matchSuggestions.hasSuggestion" class="suggestion-info">
                  <el-tooltip :content="getMatchTooltip(scope.row.matchSuggestions)" placement="top">
                    <el-tag size="mini" :type="getMatchSuggestionType(scope.row.matchSuggestions)">
                      {{scope.row.matchSuggestions.status}} ({{scope.row.matchSuggestions.confidence}}%)
                    </el-tag>
                  </el-tooltip>
                </div>
                <!-- 显示验证者信息 -->
                <div v-if="scope.row.verificationInfo && scope.row.verificationInfo.species.verified_by_name" class="verification-info">
                  <el-tooltip :content="`Verified by ${scope.row.verificationInfo.species.verified_by_name} at ${formatDateTime(scope.row.verificationInfo.species.verified_at)}`" placement="top">
                    <i class="el-icon-user verification-icon"></i>
                  </el-tooltip>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="Verbatim Species" width="200">
            <template slot-scope="scope">
              <div v-if="scope.row.verbatimTaxonomic">
                <div class="verbatim-text">
                  {{scope.row.verbatimTaxonomic.verbatimFamily}}
                  {{scope.row.verbatimTaxonomic.verbatimGenus}}
                  {{scope.row.verbatimTaxonomic.verbatimSpecies}}
                </div>
              </div>
              <span v-else class="text-gray-400">-</span>
            </template>
          </el-table-column>

          <el-table-column label="Matched Species" width="250">
            <template slot-scope="scope">
              <div v-if="scope.row.taxonomic">
                <div class="matched-text">
                  {{scope.row.taxonomic.FullName}}
                </div>
                <div class="text-xs text-gray-500">
                  ID: {{scope.row.taxonomic.TaxonID}}
                </div>
              </div>
              <!-- 显示建议的物种（仅当species未verified时显示Apply按钮） -->
              <div v-else-if="scope.row.suggestedTaxonomic" class="suggested-species">
                <div class="suggested-text-wrapper">
                  <span class="suggested-species-name">{{scope.row.suggestedTaxonomic.FullName}}</span>
                  <el-button
                    v-if="getSpeciesVerificationStatus(scope.row) !== 'verified'"
                    type="success"
                    size="mini"
                    :loading="applyingRecordId === scope.row.id"
                    @click.stop="applySuggestion(scope.row)">
                    <span v-if="applyingRecordId !== scope.row.id">Apply</span>
                  </el-button>
                </div>
                <div class="text-xs text-gray-500">
                  Suggested ID: {{scope.row.suggestedTaxonomic.TaxonID}}
                </div>
              </div>
              <span v-else class="text-gray-400">Not matched</span>
            </template>
          </el-table-column>

          <el-table-column label="Locality Status" width="180">
            <template slot-scope="scope">
              <div class="status-column">
                <el-tag
                  :type="getLocalityStatusType(scope.row)"
                  size="small">
                  <i :class="getLocalityStatusIcon(scope.row)"></i>
                  {{getLocalityStatusText(scope.row)}}
                </el-tag>
                <!-- 显示验证者信息 -->
                <div v-if="scope.row.verificationInfo && scope.row.verificationInfo.locality.verified_by_name" class="verification-info">
                  <el-tooltip :content="`Verified by ${scope.row.verificationInfo.locality.verified_by_name} at ${formatDateTime(scope.row.verificationInfo.locality.verified_at)}`" placement="top">
                    <i class="el-icon-user verification-icon"></i>
                  </el-tooltip>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="Record Status" width="150">
            <template slot-scope="scope">
              <div class="status-column">
                <el-tag
                  :type="getRecordStatusType(scope.row)"
                  size="small">
                  <i :class="getRecordStatusIcon(scope.row)"></i>
                  {{getRecordStatusText(scope.row)}}
                </el-tag>
                <!-- 显示验证者信息 -->
                <div v-if="scope.row.verificationInfo && scope.row.verificationInfo.record.verified_by_name" class="verification-info">
                  <el-tooltip :content="`Verified by ${scope.row.verificationInfo.record.verified_by_name} at ${formatDateTime(scope.row.verificationInfo.record.verified_at)}`" placement="top">
                    <i class="el-icon-user verification-icon"></i>
                  </el-tooltip>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="Overall Status" width="150">
            <template slot-scope="scope">
              <el-tag
                :type="getOverallStatusType(scope.row)"
                size="small">
                <i :class="getOverallStatusIcon(scope.row)"></i>
                {{getOverallStatusText(scope.row)}}
              </el-tag>
            </template>
          </el-table-column>


          <el-table-column label="Total #" width="80">
            <template slot-scope="scope">
              <span>{{scope.row.totalNumber || 1}}</span>
            </template>
          </el-table-column>

          <el-table-column label="Actions" width="120" fixed="right">
            <template slot-scope="scope">
              <el-button
                type="primary"
                size="mini"
                @click.stop="editRecord(scope.row)">
                <i class="el-icon-edit"></i>
                Edit
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-wrapper">
          <el-pagination
            :current-page="currentPage"
            :page-sizes="[10, 25, 50, 100]"
            :page-size="pageSize"
            :total="totalRecords"
            layout="total, sizes, prev, pager, next"
            @current-change="handlePageChange"
            @size-change="handleSizeChange">
          </el-pagination>
        </div>
      </el-card>
    </div>

    <!-- 记录编辑对话框 -->
    <record-editor-dialog
      v-if="showRecordEditor"
      :visible="showRecordEditor"
      :record="editingRecord"
      @close="closeRecordEditor"
      @save="handleRecordSave"
    />

    <!-- 批量操作确认对话框 -->
    <el-dialog
      title="Batch Operation Confirmation"
      :visible.sync="showBatchConfirmDialog"
      width="500px">
      <div class="batch-confirm-content">
        <p>Are you sure you want to <strong>{{batchActionText}}</strong> for {{selectedRecords.length}} selected records?</p>
        <div v-if="batchActionType === 'verify-completed'" class="warning-text">
          <i class="el-icon-warning"></i>
          This will mark all selected records as fully verified if they have both species and locality matched.
        </div>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="showBatchConfirmDialog = false">Cancel</el-button>
        <el-button type="primary" @click="confirmBatchAction" :loading="performingBatchAction">Confirm</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import RecordEditorDialog from '@/components/RecordsProcessor/RecordEditorDialog.vue'
import request from '@/utils/request'
import {
  getVerbatimBatches,
  getBatchRecords,
  getBatchInfo,
  updateVerbatimRecord,
  exportBatchResults,
  markBatchCompleted,
  confirmBatchImport,
  batchUpdateVerificationStatus
} from '@/api/verbatimworkspace'

export default {
  name: 'VerbatimWorkspace',
  components: {
    RecordEditorDialog
  },
  data() {
    return {
      // 批次相关
      selectedBatchId: '',
      availableBatches: [],
      currentBatch: null,
      loadingBatch: false,

      // 记录数据
      batchRecords: [],
      loadingRecords: false,
      totalRecords: 0,

      // 服务器端过滤和搜索
      serverSideFilter: 'all',
      serverSideSearch: '',
      searchText: '',
      searchTimeout: null,
      currentPage: 1,
      pageSize: 25,

      // 进度统计
      progressStats: {
        total: 0,
        speciesVerified: 0,
        localityVerified: 0,
        recordVerified: 0,
        fullyCompleted: 0,
        speciesPercentage: 0,
        localityPercentage: 0,
        recordPercentage: 0,
        completionPercentage: 0,
        needsReview: 0,
        hasErrors: 0,          // 有errors的记录数
        hasWarnings: 0,        // 有warnings的记录数
        hasPending: 0,         // 有pending状态的记录数
        pendingTaxonomic: 0,   // Species pending的记录数
        pendingLocality: 0,    // Locality pending的记录数
        pendingRecord: 0       // Record pending的记录数
      },

      // 编辑对话框
      showRecordEditor: false,
      editingRecord: null,

      // 批量操作
      selectedRecords: [],
      showBatchConfirmDialog: false,
      batchActionType: '',
      batchActionText: '',
      performingBatchAction: false,

      // Apply suggestion loading state
      applyingRecordId: null
    }
  },
  computed: {
    pendingCount() {
      return this.progressStats.total - this.progressStats.fullyCompleted;
    },

    completedCount() {
      return this.progressStats.fullyCompleted;
    },

    needsReviewCount() {
      return this.progressStats.needsReview || 0;
    }
  },
  async mounted() {
    await this.loadAvailableBatches();

    // 检查 URL 参数中是否有 batchId，如果有则自动选择该批次
    const batchIdFromQuery = this.$route.query.batchId;
    if (batchIdFromQuery) {
      this.selectedBatchId = batchIdFromQuery;
      await this.selectBatch(batchIdFromQuery);
    }
  },
  beforeDestroy() {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  },
  methods: {
    // 判断是否为临时catalog number
    isTemporaryCatalogNumber(catalogNumber) {
      return catalogNumber && catalogNumber.toString().startsWith('TEMP_');
    },

    // 加载可用批次列表
    async loadAvailableBatches() {
      this.loadingBatch = true;
      try {
        const response = await getVerbatimBatches();
        if (response.code === 20000) {
          this.availableBatches = response.data.items.map(batch => ({
            batchSerialId: batch.batch_serial_id,
            fileName: batch.file_name || 'Unnamed Batch',
            recordCount: batch.total_records,
            importDate: batch.import_date,
            status: batch.status,
          }))
        }
      } catch (error) {
        this.$message.error('Failed to load available batches');
        console.error(error);
      } finally {
        this.loadingBatch = false;
      }
    },

    // 刷新批次列表
    async refreshBatchList() {
      await this.loadAvailableBatches();
      this.$message.success('Batch list refreshed');
    },

    // 加载批次数据
    async loadBatchData() {
      if (!this.selectedBatchId) {
        this.currentBatch = null;
        this.batchRecords = [];
        this.totalRecords = 0;
        return;
      }

      // 重置分页和搜索
      this.currentPage = 1;
      this.serverSideSearch = '';
      this.serverSideFilter = 'all';
      this.searchText = '';

      try {
        // 获取批次基本信息
        const batchResponse = await getBatchInfo(this.selectedBatchId);
        if (batchResponse.code === 20000) {
          this.currentBatch = {
            batchSerialId: batchResponse.data.batch_serial_id,
            fileName: batchResponse.data.file_name || `Batch ${batchResponse.data.batch_serial_id}`,
            recordCount: batchResponse.data.total_records,
            importDate: batchResponse.data.import_date,
            status: batchResponse.data.status
          };

          // 设置进度统计
          this.updateProgressFromBatchInfo(batchResponse.data.progress);
        }

        // 加载第一页记录
        await this.loadBatchRecords();

        // 获取详细的verification统计 (包括warnings和errors)
        await this.fetchVerificationSummary();
      } catch (error) {
        this.$message.error('Failed to load batch data');
        console.error(error);
      }
    },

    // 加载批次记录
    async loadBatchRecords() {
      if (!this.selectedBatchId) {
        this.batchRecords = [];
        this.totalRecords = 0;
        return;
      }

      this.loadingRecords = true;
      try {
        const recordsResponse = await getBatchRecords(this.selectedBatchId, {
          page: this.currentPage,
          page_size: this.pageSize,
          status: this.serverSideFilter === 'all' ? undefined : this.serverSideFilter,
          search: this.serverSideSearch
        });

        if (recordsResponse.code === 20000) {
          this.totalRecords = recordsResponse.data.total;
          this.batchRecords = recordsResponse.data.items.map(record => {
            return {
              id: record.id,
              catalogNumber: record.catalog_number,
              taxonId: record.matched_data?.taxonomic?.id || null,
              verbatimTaxonomicId: record.verbatim_data?.taxonomic?.id || null,
              localityId: record.matched_data?.locality?.id || null,
              verbatimLocalityId: record.verbatim_data?.locality?.id || null,
              fieldNumber: record.verbatim_data?.locality?.field_number || null,
              collectionDate: record.matched_data?.locality?.collection_date || null,
              totalNumber: record.record_data?.total_number || 1,
              storage: record.record_data?.storage || null,
              jarSize: record.record_data?.jar_size || null,
              prevNumber: record.record_data?.prev_number || null,
              inventory: record.record_data?.inventory || null,
              remarks: record.record_data?.remarks || null,

              verbatimTaxonomic: record.verbatim_data?.taxonomic ? {
                verbatimFamily: record.verbatim_data.taxonomic.family || '',
                verbatimGenus: record.verbatim_data.taxonomic.genus || '',
                verbatimSpecies: record.verbatim_data.taxonomic.species || ''
              } : null,

              verbatimLocality: record.verbatim_data?.locality ? {
                id: record.verbatim_data.locality.id,
                locality_string: record.verbatim_data.locality.locality_string,
                field_number: record.verbatim_data.locality.field_number,
                drainage: record.verbatim_data.locality.drainage,
                country: record.verbatim_data.locality.country,
                state: record.verbatim_data.locality.state,
                county: record.verbatim_data.locality.county,
                waterbody: record.verbatim_data.locality.waterbody,
                latitude: record.verbatim_data.locality.latitude,
                longitude: record.verbatim_data.locality.longitude,
                collect_date: record.verbatim_data.locality.collect_date,
                collector: record.verbatim_data.locality.collector
              } : null,

              taxonomic: record.matched_data?.taxonomic?.id ? {
                FullName: `${record.matched_data.taxonomic.genus || ''} ${record.matched_data.taxonomic.species || ''}`.trim(),
                TaxonID: record.matched_data.taxonomic.id,
                Family: record.matched_data.taxonomic.family,
                Genus: record.matched_data.taxonomic.genus,
                Species: record.matched_data.taxonomic.species,
                Author: record.matched_data.taxonomic.author
              } : null,

              locality: record.matched_data?.locality?.id ? {
                Locality1ID: record.matched_data.locality.id,
                LocalityString: record.matched_data.locality.locality,
                FieldNo: record.matched_data.locality.field_number,
                Country: record.matched_data.locality.country,
                State: record.matched_data.locality.state,
                County: record.matched_data.locality.county
              } : null,

              matchSuggestions: record.match_suggestions?.taxonomic ? {
                status: record.match_suggestions.taxonomic.status,
                confidence: record.match_suggestions.taxonomic.confidence,
                hasSuggestion: record.match_suggestions.taxonomic.has_suggestion,
                suggestionApplied: record.match_suggestions.taxonomic.suggestion_applied,
                suggested_taxon_id: record.match_suggestions.taxonomic.suggested_taxon_id,
                match_details: record.match_suggestions.taxonomic.match_details,
                suggested_data: record.match_suggestions.taxonomic.suggested_data
              } : null,

              suggestedTaxonomic: record.match_suggestions?.taxonomic?.suggested_data ? {
                FullName: record.match_suggestions.taxonomic.suggested_data.full_name ||
                  `${record.match_suggestions.taxonomic.suggested_data.genus || ''} ${record.match_suggestions.taxonomic.suggested_data.species || ''}`.trim(),
                TaxonID: record.match_suggestions.taxonomic.suggested_taxon_id,
                Family: record.match_suggestions.taxonomic.suggested_data.family,
                Genus: record.match_suggestions.taxonomic.suggested_data.genus,
                Species: record.match_suggestions.taxonomic.suggested_data.species,
                Author: record.match_suggestions.taxonomic.suggested_data.author
              } : null,

              verificationInfo: record.verification_info || null,
              processingStatus: record.processing_status,
              _apiData: record
            };
          });

          if (recordsResponse.data.progress) {
            this.updateProgressFromAPI(recordsResponse.data.progress);
          }
        }
      } catch (error) {
        this.$message.error('Failed to load batch records');
        console.error(error);
      } finally {
        this.loadingRecords = false;
      }
    },

    // 更新进度统计 - 只更新基础统计，保留详细的验证统计
    updateProgressFromAPI(progress) {
      // 只更新部分字段，保留 hasErrors, hasWarnings, pendingTaxonomic 等字段
      this.progressStats.total = this.currentBatch?.recordCount || progress.taxonomic?.total || 0;
      this.progressStats.speciesVerified = progress.taxonomic?.verified || 0;
      this.progressStats.localityVerified = progress.locality?.verified || 0;
      this.progressStats.recordVerified = progress.record?.verified || 0;
      this.progressStats.fullyCompleted = progress.overall?.completed || 0;
      this.progressStats.speciesPercentage = progress.taxonomic?.percent || 0;
      this.progressStats.localityPercentage = progress.locality?.percent || 0;
      this.progressStats.recordPercentage = progress.record?.percent || 0;
      this.progressStats.completionPercentage = progress.overall?.percent || 0;
      this.progressStats.needsReview = progress.needs_review?.count || 0;
      // 注意：不覆盖 hasErrors, hasWarnings, pendingTaxonomic 等字段
    },

    updateProgressFromBatchInfo(progress) {
      if (progress) {
        // 只更新部分字段，保留 hasErrors, hasWarnings, pendingTaxonomic 等字段
        this.progressStats.total = progress.taxonomic?.total || 0;
        this.progressStats.speciesVerified = progress.taxonomic?.verified || 0;
        this.progressStats.localityVerified = progress.locality?.verified || 0;
        this.progressStats.recordVerified = progress.record?.verified || 0;
        this.progressStats.fullyCompleted = progress.overall?.completed || 0;
        this.progressStats.speciesPercentage = progress.taxonomic?.percent || 0;
        this.progressStats.localityPercentage = progress.locality?.percent || 0;
        this.progressStats.recordPercentage = progress.record?.percent || 0;
        this.progressStats.completionPercentage = progress.overall?.percent || 0;
        this.progressStats.needsReview = progress.needs_review?.count || 0;
        // 注意：不覆盖 hasErrors, hasWarnings, pendingTaxonomic 等字段
      }
    },

    // 刷新进度
    async refreshProgress() {
      await this.loadBatchData();
    },

    // 设置过滤状态
    async setFilter(status) {
      this.serverSideFilter = status;
      this.currentPage = 1;
      await this.loadBatchRecords();
    },

    // 搜索处理
    onSearchChange() {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(async () => {
        this.serverSideSearch = this.searchText;
        this.currentPage = 1;
        await this.loadBatchRecords();
      }, 500);
    },

    onSearchClear() {
      this.searchText = '';
      this.serverSideSearch = '';
      this.currentPage = 1;
      this.loadBatchRecords();
    },

    // 分页处理
    async handlePageChange(page) {
      this.currentPage = page;
      await this.loadBatchRecords();
    },

    async handleSizeChange(size) {
      this.pageSize = size;
      this.currentPage = 1;
      await this.loadBatchRecords();
    },

    // 获取物种验证状态
    getSpeciesVerificationStatus(record) {
      return record.verificationInfo?.species?.status ||
        record.processingStatus?.taxonomic ||
        (record.taxonId ? 'verified' : 'pending');
    },

    getSpeciesStatusType(record) {
      const status = this.getSpeciesVerificationStatus(record);
      switch(status) {
        case 'verified': return 'success';
        case 'needs_review': return 'warning';
        case 'rejected': return 'danger';
        default: return 'info';
      }
    },

    getSpeciesStatusIcon(record) {
      const status = this.getSpeciesVerificationStatus(record);
      switch(status) {
        case 'verified': return 'el-icon-check';
        case 'needs_review': return 'el-icon-warning';
        case 'rejected': return 'el-icon-close';
        default: return 'el-icon-minus';
      }
    },

    getSpeciesStatusText(record) {
      const status = this.getSpeciesVerificationStatus(record);
      switch(status) {
        case 'verified': return 'Verified';
        case 'needs_review': return 'Needs Review';
        case 'rejected': return 'Rejected';
        default: return 'Pending';
      }
    },

    // 获取地点验证状态
    getLocalityVerificationStatus(record) {
      return record.verificationInfo?.locality?.status ||
        record.processingStatus?.locality ||
        (record.localityId ? 'verified' : 'pending');
    },

    getLocalityStatusType(record) {
      const status = this.getLocalityVerificationStatus(record);
      switch(status) {
        case 'verified': return 'success';
        case 'needs_review': return 'warning';
        case 'rejected': return 'danger';
        default: return 'info';
      }
    },

    getLocalityStatusIcon(record) {
      const status = this.getLocalityVerificationStatus(record);
      switch(status) {
        case 'verified': return 'el-icon-check';
        case 'needs_review': return 'el-icon-warning';
        case 'rejected': return 'el-icon-close';
        default: return 'el-icon-minus';
      }
    },

    getLocalityStatusText(record) {
      const status = this.getLocalityVerificationStatus(record);
      switch(status) {
        case 'verified': return 'Verified';
        case 'needs_review': return 'Needs Review';
        case 'rejected': return 'Rejected';
        default: return 'Pending';
      }
    },

    // 获取记录验证状态
    getRecordVerificationStatus(record) {
      return record.verificationInfo?.record?.status ||
        record.processingStatus?.record ||
        'pending';
    },

    getRecordStatusType(record) {
      const status = this.getRecordVerificationStatus(record);
      switch(status) {
        case 'verified': return 'success';
        case 'needs_review': return 'warning';
        case 'rejected': return 'danger';
        default: return 'info';
      }
    },

    getRecordStatusIcon(record) {
      const status = this.getRecordVerificationStatus(record);
      switch(status) {
        case 'verified': return 'el-icon-check';
        case 'needs_review': return 'el-icon-warning';
        case 'rejected': return 'el-icon-close';
        default: return 'el-icon-minus';
      }
    },

    getRecordStatusText(record) {
      const status = this.getRecordVerificationStatus(record);
      switch(status) {
        case 'verified': return 'Verified';
        case 'needs_review': return 'Needs Review';
        case 'rejected': return 'Rejected';
        default: return 'Pending';
      }
    },

    // 获取整体验证状态
    getOverallVerificationStatus(record) {
      return record.verificationInfo?.overall?.status ||
        record.processingStatus?.overall ||
        'pending';
    },

    getOverallStatusType(record) {
      const status = this.getOverallVerificationStatus(record);
      switch(status) {
        case 'completed': return 'success';
        case 'verified': return 'success';
        case 'needs_review': return 'warning';
        case 'rejected': return 'danger';
        default: return 'info';
      }
    },

    getOverallStatusIcon(record) {
      const status = this.getOverallVerificationStatus(record);
      switch(status) {
        case 'completed': return 'el-icon-check';
        case 'verified': return 'el-icon-check';
        case 'needs_review': return 'el-icon-warning';
        case 'rejected': return 'el-icon-close';
        default: return 'el-icon-minus';
      }
    },

    getOverallStatusText(record) {
      const status = this.getOverallVerificationStatus(record);
      switch(status) {
        case 'completed': return 'Completed';
        case 'verified': return 'Verified';
        case 'needs_review': return 'Needs Review';
        case 'rejected': return 'Rejected';
        default: return 'Pending';
      }
    },

    // 获取匹配建议相关信息
    getMatchSuggestionType(matchSuggestions) {
      if (!matchSuggestions || !matchSuggestions.hasSuggestion) return '';

      const confidence = matchSuggestions.confidence || 0;
      if (confidence >= 90) return 'success';
      if (confidence >= 70) return 'warning';
      return 'info';
    },

    getMatchTooltip(matchSuggestions) {
      if (!matchSuggestions) return '';

      let tooltip = `Match Status: ${matchSuggestions.status}\n`;
      tooltip += `Confidence: ${matchSuggestions.confidence}%\n`;
      if (matchSuggestions.suggestionApplied) {
        tooltip += 'Suggestion has been applied';
      } else if (matchSuggestions.hasSuggestion) {
        tooltip += 'Click "Apply" to use this suggestion';
      } else {
        tooltip += 'No automatic suggestion available';
      }

      return tooltip;
    },

    // 应用分类建议
    async applySuggestion(record) {
      // 检查是否有建议的物种信息
      if (!record.suggestedTaxonomic || !record.suggestedTaxonomic.TaxonID) {
        this.$message.warning('No taxonomic suggestion available');
        return;
      }

      // 设置loading状态
      this.applyingRecordId = record.id;

      try {
        // 构建更新数据，与 RecordEditorDialog 的保存逻辑一致
        const updateData = {
          id: record.id,
          taxon_id: record.suggestedTaxonomic.TaxonID,
          species_verification_status: 'verified',
          verification_notes: 'Applied taxonomic suggestion from workspace'
        };

        const response = await updateVerbatimRecord(updateData);
        if (response.code === 20000) {
          // 直接更新当前行的数据，无需刷新整个列表
          record.taxonId = record.suggestedTaxonomic.TaxonID;
          record.taxonomic = {
            TaxonID: record.suggestedTaxonomic.TaxonID,
            FullName: record.suggestedTaxonomic.FullName,
            Family: record.suggestedTaxonomic.Family,
            Genus: record.suggestedTaxonomic.Genus,
            Species: record.suggestedTaxonomic.Species,
            Author: record.suggestedTaxonomic.Author
          };
          // 更新验证状态
          if (record.verificationInfo) {
            record.verificationInfo.species = {
              ...record.verificationInfo.species,
              status: 'verified'
            };
          }
          if (record.processingStatus) {
            record.processingStatus.taxonomic = 'verified';
          }

          this.$message.success('Taxonomic suggestion applied');
          // 异步更新统计信息，不阻塞UI
          this.fetchVerificationSummary();
        }
      } catch (error) {
        this.$message.error('Failed to apply taxonomic suggestion');
        console.error(error);
      } finally {
        this.applyingRecordId = null;
      }
    },

    // 编辑记录
    editRecord(record) {
      console.log('Editing record:', record);
      this.editingRecord = { ...record };
      this.showRecordEditor = true;
    },

    // 关闭编辑对话框
    closeRecordEditor() {
      this.showRecordEditor = false;
      this.editingRecord = null;
    },

    // 处理记录保存
    async handleRecordSave(updatedRecord) {
      try {
        const response = await updateVerbatimRecord(updatedRecord);
        if (response.code === 20000) {
          this.$message.success('Record updated successfully');
          this.closeRecordEditor();
          await this.loadBatchRecords();
          // 重新获取验证统计信息，反映最新的 errors/warnings 数量
          await this.fetchVerificationSummary();
        }
      } catch (error) {
        this.$message.error('Failed to update record');
        console.error(error);
      }
    },

    // 处理表格选择变化
    handleSelectionChange(selection) {
      this.selectedRecords = selection;
    },

    // 处理批量操作
    handleBatchAction(command) {
      if (this.selectedRecords.length === 0) {
        this.$message.warning('Please select records first');
        return;
      }

      this.batchActionType = command;

      switch(command) {
        case 'verify-completed':
          this.batchActionText = 'verify as completed';
          break;
        case 'verify-species':
          this.batchActionText = 'verify species information';
          break;
        case 'verify-locality':
          this.batchActionText = 'verify locality information';
          break;
        case 'mark-review':
          this.batchActionText = 'mark for review';
          break;
        default:
          this.batchActionText = 'perform batch operation';
      }

      this.showBatchConfirmDialog = true;
    },

    // 确认批量操作
    async confirmBatchAction() {
      this.performingBatchAction = true;

      try {
        const recordIds = this.selectedRecords.map(record => record.id);
        let verificationType = 'all';
        let status = 'verified';

        switch(this.batchActionType) {
          case 'verify-completed':
            const completedRecords = this.selectedRecords.filter(record =>
              record.taxonId && record.localityId
            );
            if (completedRecords.length === 0) {
              this.$message.warning('No completed records found in selection');
              return;
            }
            verificationType = 'all';
            status = 'verified';
            break;
          case 'verify-species':
            verificationType = 'species';
            status = 'verified';
            break;
          case 'verify-locality':
            verificationType = 'locality';
            status = 'verified';
            break;
          case 'mark-review':
            verificationType = 'all';
            status = 'needs_review';
            break;
        }

        const response = await batchUpdateVerificationStatus({
          record_ids: recordIds,
          verification_type: verificationType,
          status: status,
          notes: `Batch ${this.batchActionText} operation`
        });

        if (response.code === 20000) {
          this.$message.success(`Batch operation completed for ${response.data.updated_count} records`);
          await this.loadBatchRecords();
          // 重新获取验证统计信息
          await this.fetchVerificationSummary();
          this.$refs.recordsTable.clearSelection();
        }
      } catch (error) {
        this.$message.error('Batch operation failed');
        console.error(error);
      } finally {
        this.performingBatchAction = false;
        this.showBatchConfirmDialog = false;
      }
    },

    // 导出批次结果
    async exportBatchResults() {
      try {
        const response = await exportBatchResults(this.selectedBatchId);

        const blob = new Blob([response], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `batch_${this.selectedBatchId}_results.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        this.$message.success('Batch results exported successfully');
      } catch (error) {
        this.$message.error('Failed to export batch results');
        console.error(error);
      }
    },

    // 标记批次完成
    async markBatchCompleted() {
      if (this.pendingCount > 0) {
        const result = await this.$confirm(
          `This batch still has ${this.pendingCount} pending records. Are you sure you want to mark it as completed?`,
          'Confirm',
          { type: 'warning' }
        );
        if (!result) return;
      }

      // 二次确认：是否生成正式 catalog number
      try {
        const confirmGenerate = await this.$confirm(
          'This will generate official catalog numbers for all records in this batch. This action cannot be undone. Continue?',
          'Confirm Final Import',
          {
            type: 'warning',
            confirmButtonText: 'Generate Catalog Numbers',
            cancelButtonText: 'Cancel'
          }
        );
        if (!confirmGenerate) return;
      } catch {
        return; // 用户取消
      }

      const loading = this.$loading({
        lock: true,
        text: 'Generating catalog numbers and migrating data...',
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.7)'
      });

      try {
        // 1. 标记批次为完成
        await markBatchCompleted(this.selectedBatchId);

        // 2. 调用 confirmBatchImport 生成正式 catalog number
        const importResult = await confirmBatchImport(this.selectedBatchId);

        loading.close();

        // 显示成功信息
        this.$notify({
          title: 'Success',
          message: `Batch completed! Generated catalog numbers: ${importResult.data.catalog_number_range.start} - ${importResult.data.catalog_number_range.end}`,
          type: 'success',
          duration: 5000
        });

        await this.loadBatchData();
      } catch (error) {
        loading.close();
        this.$message.error('Failed to complete batch import: ' + (error.message || 'Unknown error'));
        console.error(error);
      }
    },

    // 格式化日期
    formatDate(date) {
      if (!date) return '';
      return new Date(date).toLocaleDateString();
    },

    // 格式化日期时间
    formatDateTime(datetime) {
      if (!datetime) return '';
      return new Date(datetime).toLocaleString();
    },

    // 检查记录是否有 errors (severity: error)
    hasErrors(record) {
      if (!record.verificationInfo || !record.verificationInfo.warnings) return false;
      return record.verificationInfo.warnings.some(w => w.severity === 'error');
    },

    // 检查记录是否有 warnings (severity: warning)
    hasWarnings(record) {
      if (!record.verificationInfo || !record.verificationInfo.warnings) return false;
      return record.verificationInfo.warnings.some(w => w.severity === 'warning');
    },

    // 检查记录是否只有 warnings (severity: warning, 没有 error) - 用于只显示warning图标
    hasWarningsOnly(record) {
      if (!record.verificationInfo || !record.verificationInfo.warnings) return false;
      const hasAnyErrors = record.verificationInfo.warnings.some(w => w.severity === 'error');
      const hasAnyWarnings = record.verificationInfo.warnings.some(w => w.severity === 'warning');
      return hasAnyWarnings && !hasAnyErrors;
    },

    // 获取 errors 列表
    getErrors(record) {
      if (!record.verificationInfo || !record.verificationInfo.warnings) return [];
      return record.verificationInfo.warnings.filter(w => w.severity === 'error');
    },

    // 获取 warnings 列表
    getWarnings(record) {
      if (!record.verificationInfo || !record.verificationInfo.warnings) return [];
      return record.verificationInfo.warnings.filter(w => w.severity === 'warning');
    },

    // 获取 error 数量
    getErrorCount(record) {
      return this.getErrors(record).length;
    },

    // 获取 warning 数量
    getWarningCount(record) {
      return this.getWarnings(record).length;
    },

    // 导出issues (warnings/errors/all)
    async exportIssues(issueType) {
      try {
        const url = `${process.env.VUE_APP_BASE_API}/api/file-processor/batches/${this.selectedBatchId}/exportIssues?issue_type=${issueType}`;

        // 创建隐藏的下载链接
        const link = document.createElement('a');
        link.href = url;
        link.download = `batch_${this.selectedBatchId}_issues_${issueType}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.$message.success(`Exporting ${issueType} issues...`);
      } catch (error) {
        this.$message.error('Failed to export issues');
        console.error(error);
      }
    },

    // 获取verification统计信息 (调用新API)
    async fetchVerificationSummary() {
      if (!this.selectedBatchId) return;

      try {
        // 使用request模块 (已在文件顶部导入)
        const response = await request({
          url: `/file/batches/${this.selectedBatchId}/verificationSummary`,
          method: 'get'
        });

        console.log('Verification summary response:', response);

        if (response.code === 20000) {
          const data = response.data;
          const stats = data.statistics;

          console.log('Raw statistics from API:', stats);

          // 更新所有统计数据
          this.progressStats = {
            total: data.total_records,
            speciesVerified: stats.species_verified?.count || 0,
            localityVerified: stats.locality_verified?.count || 0,
            recordVerified: stats.record_verified?.count || 0,
            fullyCompleted: stats.fully_verified?.count || 0,
            speciesPercentage: stats.species_verified?.percentage || 0,
            localityPercentage: stats.locality_verified?.percentage || 0,
            recordPercentage: stats.record_verified?.percentage || 0,
            completionPercentage: stats.fully_verified?.percentage || 0,
            hasErrors: stats.has_errors?.count || 0,
            hasWarnings: stats.has_warnings?.count || 0,
            hasPending: stats.has_pending?.count || 0,
            pendingTaxonomic: stats.pending_taxonomic?.count || 0,
            pendingLocality: stats.pending_locality?.count || 0,
            pendingRecord: stats.pending_record?.count || 0,
            needsReview: 0  // 保留字段
          };

          console.log('Updated progressStats:', this.progressStats);
          console.log('Filter button values:', {
            hasErrors: this.progressStats.hasErrors,
            hasWarnings: this.progressStats.hasWarnings,
            pendingTaxonomic: this.progressStats.pendingTaxonomic,
            pendingLocality: this.progressStats.pendingLocality,
            pendingRecord: this.progressStats.pendingRecord
          });
        }
      } catch (error) {
        console.error('Failed to fetch verification summary:', error);
      }
    },

    // 重新验证批次记录
    async revalidateBatch() {
      if (!this.selectedBatchId) return;

      this.$confirm('This will re-run validation for all records in this batch. Continue?', 'Re-validate Batch', {
        confirmButtonText: 'Yes',
        cancelButtonText: 'Cancel',
        type: 'info'
      }).then(async () => {
        const loading = this.$loading({
          lock: true,
          text: 'Re-validating records...',
          spinner: 'el-icon-loading',
          background: 'rgba(0, 0, 0, 0.7)'
        });

        try {
          const response = await request({
            url: `/file/batches/${this.selectedBatchId}/revalidate`,
            method: 'post'
          });

          loading.close();

          if (response.code === 20000) {
            this.$message.success(`Re-validated ${response.data.records_validated} records`);
            // 刷新数据
            await this.loadBatchData();
          } else {
            this.$message.error('Failed to re-validate: ' + response.message);
          }
        } catch (error) {
          loading.close();
          this.$message.error('Failed to re-validate batch');
          console.error(error);
        }
      }).catch(() => {
        // 用户取消
      });
    }
  }
};
</script>

<style scoped>
.verbatim-workspace {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.batch-selector-card {
  margin-bottom: 20px;
}

.batch-selector {
  padding: 10px 0;
}

.batch-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.batch-info-item {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #666;
  font-size: 14px;
}

.progress-overview-card {
  margin-bottom: 20px;
}

.progress-item {
  text-align: center;
  padding: 20px;
  border-radius: 8px;
  background: #f8f9fa;
}

.progress-number {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 5px;
}

.progress-number.species {
  color: #67C23A;
}

.progress-number.locality {
  color: #409EFF;
}

.progress-number.record {
  color: #E6A23C;
}

.progress-number.complete {
  color: #F56C6C;
}

.progress-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
}

.progress-bar {
  margin-top: 10px;
}

.records-card {
  background: white;
}

.table-toolbar {
  margin-bottom: 20px;
  padding: 15px;
}

.status-column {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.suggestion-info {
  margin-top: 4px;
}

.verification-info {
  margin-top: 4px;
}

.verification-icon {
  color: #67C23A;
  font-size: 12px;
}

.verbatim-text {
  font-style: italic;
  color: #666;
}

.matched-text {
  font-weight: 500;
  color: #333;
}

.suggested-text-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.suggested-species-name {
  color: #E6A23C;
  font-style: italic;
  font-weight: 500;
}

.suggested-text {
  color: #E6A23C;
  font-style: italic;
}

.text-gray-400 {
  color: #9CA3AF;
}

.text-xs {
  font-size: 12px;
}

.text-gray-500 {
  color: #6B7280;
}

.pagination-wrapper {
  margin-top: 20px;
  text-align: center;
}

.batch-confirm-content {
  padding: 20px 0;
}

.warning-text {
  margin-top: 15px;
  padding: 10px;
  background: #fdf6ec;
  border: 1px solid #fbbf24;
  border-radius: 4px;
  color: #92400e;
  font-size: 14px;
}

.warning-text i {
  margin-right: 8px;
}

.catalog-number {
  font-weight: 500;
  color: #1f2937;
}

.temp-catalog-number {
  color: #e6a23c;
  font-style: italic;
  font-weight: 500;
}

.normal-catalog-number {
  color: #1f2937;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .verbatim-workspace {
    max-width: 100%;
    padding: 10px;
  }

  .progress-item {
    padding: 15px 10px;
  }

  .progress-number {
    font-size: 1.5rem;
  }
}

@media (max-width: 768px) {
  .batch-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .table-toolbar .el-row {
    flex-direction: column;
  }

  .table-toolbar .el-col {
    width: 100% !important;
    margin-bottom: 10px;
  }
}

/* Warning icon styling - 简洁的图标显示 */
.warning-icon {
  display: inline-block;
  margin-left: 6px;
  font-size: 14px;
  vertical-align: middle;
  cursor: pointer;
}

.catalog-number {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
</style>
