<!--
  VerbatimWorkspace.vue
  Verbatim 数据处理工作台 - 批次数据验证和编辑 (服务器端分页版本)
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
            style="float: right; padding: 3px 0"
            type="text"
            @click="refreshProgress">
            <i class="el-icon-refresh"></i>
          </el-button>
        </div>

        <el-row :gutter="20">
          <el-col :span="6">
            <div class="progress-item">
              <div class="progress-number">{{progressStats.total}}</div>
              <div class="progress-label">Total Records</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="progress-item">
              <div class="progress-number species">{{progressStats.speciesCompleted}}</div>
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
          <el-col :span="6">
            <div class="progress-item">
              <div class="progress-number locality">{{progressStats.localityCompleted}}</div>
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
          <el-col :span="6">
            <div class="progress-item">
              <div class="progress-number complete">{{progressStats.fullyCompleted}}</div>
              <div class="progress-label">Fully Completed</div>
              <div class="progress-bar">
                <el-progress
                  :percentage="progressStats.completionPercentage"
                  :stroke-width="8"
                  color="#E6A23C">
                </el-progress>
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
                :type="serverSideFilter === 'pending_any' ? 'warning' : ''"
                @click="setFilter('pending_any')">
                Pending ({{pendingCount}})
              </el-button>
              <el-button
                size="small"
                :type="serverSideFilter === 'completed' ? 'success' : ''"
                @click="setFilter('completed')">
                Completed ({{completedCount}})
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
          :data="batchRecords"
          v-loading="loadingRecords"
          stripe
          @row-click="editRecord">

          <el-table-column prop="catalogNumber" label="Catalog #" width="120">
            <template slot-scope="scope">
              <span class="catalog-number">{{scope.row.catalogNumber}}</span>
            </template>
          </el-table-column>

          <el-table-column prop="fieldNumber" label="Field #" width="120">
            <template slot-scope="scope">
              <span>{{scope.row.fieldNumber || '-'}}</span>
            </template>
          </el-table-column>

          <el-table-column label="Species Status" width="150">
            <template slot-scope="scope">
              <el-tag
                :type="getSpeciesStatusType(scope.row)"
                size="small">
                <i :class="getSpeciesStatusIcon(scope.row)"></i>
                {{getSpeciesStatusText(scope.row)}}
              </el-tag>
              <!-- 显示匹配建议信息 -->
              <div v-if="scope.row.matchSuggestions" class="suggestion-info">
                <el-tooltip :content="getMatchTooltip(scope.row.matchSuggestions)" placement="top">
                  <el-tag size="mini" :type="getMatchSuggestionType(scope.row.matchSuggestions)">
                    {{scope.row.matchSuggestions.status}} ({{scope.row.matchSuggestions.confidence}}%)
                  </el-tag>
                </el-tooltip>
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
              <!-- 显示建议的物种 -->
              <div v-else-if="scope.row.suggestedTaxonomic" class="suggested-species">
                <div class="suggested-text">
                  {{scope.row.suggestedTaxonomic.FullName}}
                  <el-button
                    type="text"
                    size="mini"
                    @click.stop="applySuggestion(scope.row)"
                    style="color: #409EFF;">
                    Apply
                  </el-button>
                </div>
                <div class="text-xs text-gray-500">
                  Suggested ID: {{scope.row.suggestedTaxonomic.TaxonID}}
                </div>
              </div>
              <span v-else class="text-gray-400">Not matched</span>
            </template>
          </el-table-column>

          <el-table-column label="Locality Status" width="150">
            <template slot-scope="scope">
              <el-tag
                :type="getLocalityStatusType(scope.row)"
                size="small">
                <i :class="getLocalityStatusIcon(scope.row)"></i>
                {{getLocalityStatusText(scope.row)}}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="Collection Date" width="120">
            <template slot-scope="scope">
              <span>{{formatDate(scope.row.collectionDate) || '-'}}</span>
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
  </div>
</template>

<script>
import RecordEditorDialog from '@/components/RecordsProcessor/RecordEditorDialog.vue'
import {
  getVerbatimBatches,
  getBatchRecords,
  getBatchInfo,
  updateVerbatimRecord,
  exportBatchResults,
  markBatchCompleted,
  applyTaxonomicSuggestion
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
      totalRecords: 0, // 服务器端总记录数

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
        speciesCompleted: 0,
        localityCompleted: 0,
        fullyCompleted: 0,
        speciesPercentage: 0,
        localityPercentage: 0,
        completionPercentage: 0
      },

      // 编辑对话框
      showRecordEditor: false,
      editingRecord: null
    }
  },
  computed: {
    pendingCount() {
      return this.progressStats.total - this.progressStats.fullyCompleted;
    },

    completedCount() {
      return this.progressStats.fullyCompleted;
    }
  },
  async mounted() {
    await this.loadAvailableBatches();
  },
  beforeDestroy() {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  },
  methods: {
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
      } catch (error) {
        this.$message.error('Failed to load batch data');
        console.error(error);
      }
    },

    // 加载批次记录 - 支持分页和过滤
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
          // Map the records to match component's expected format
          this.batchRecords = recordsResponse.data.items.map(record => {
            return {
              // Keep basic ID and catalog number
              id: record.id,
              catalogNumber: record.catalog_number,

              // Extract taxonomic information
              taxonId: record.matched_data?.taxonomic?.id || null,
              verbatimTaxonomicId: record.verbatim_data?.taxonomic?.id || null,

              // Extract locality information
              localityId: record.matched_data?.locality?.id || null,
              verbatimLocalityId: record.verbatim_data?.locality?.id || null,

              // Extract field number
              fieldNumber: record.verbatim_data?.locality?.field_number || null,

              // Extract collection date
              collectionDate: record.matched_data?.locality?.collection_date || null,

              // Extract record data
              totalNumber: record.record_data?.total_number || 1,
              storage: record.record_data?.storage || null,
              jarSize: record.record_data?.jar_size || null,
              prevNumber: record.record_data?.prev_number || null,
              inventory: record.record_data?.inventory || null,
              remarks: record.record_data?.remarks || null,

              // Extract verbatim taxonomic data
              verbatimTaxonomic: record.verbatim_data?.taxonomic ? {
                verbatimFamily: record.verbatim_data.taxonomic.family || '',
                verbatimGenus: record.verbatim_data.taxonomic.genus || '',
                verbatimSpecies: record.verbatim_data.taxonomic.species || ''
              } : null,

              // Extract matched taxonomic data
              taxonomic: record.matched_data?.taxonomic?.id ? {
                FullName: `${record.matched_data.taxonomic.genus || ''} ${record.matched_data.taxonomic.species || ''}`.trim(),
                TaxonID: record.matched_data.taxonomic.id,
                Family: record.matched_data.taxonomic.family,
                Genus: record.matched_data.taxonomic.genus,
                Species: record.matched_data.taxonomic.species,
                Author: record.matched_data.taxonomic.author
              } : null,

              // Extract match suggestions - 根据实际数据结构
              matchSuggestions: record.match_suggestions?.taxonomic ? {
                status: record.match_suggestions.taxonomic.status,
                confidence: record.match_suggestions.taxonomic.confidence,
                hasSuggestion: record.match_suggestions.taxonomic.has_suggestion,
                suggestionApplied: record.match_suggestions.taxonomic.suggestion_applied,
                suggested_taxon_id: record.match_suggestions.taxonomic.suggested_taxon_id,
                match_details: record.match_suggestions.taxonomic.match_details,
                suggested_data: record.match_suggestions.taxonomic.suggested_data
              } : null,

              // 为了向后兼容，保留 suggestedTaxonomic 字段
              suggestedTaxonomic: record.match_suggestions?.taxonomic?.suggested_data ? {
                FullName: record.match_suggestions.taxonomic.suggested_data.full_name ||
                  `${record.match_suggestions.taxonomic.suggested_data.genus || ''} ${record.match_suggestions.taxonomic.suggested_data.species || ''}`.trim(),
                TaxonID: record.match_suggestions.taxonomic.suggested_taxon_id,
                Family: record.match_suggestions.taxonomic.suggested_data.family,
                Genus: record.match_suggestions.taxonomic.suggested_data.genus,
                Species: record.match_suggestions.taxonomic.suggested_data.species,
                Author: record.match_suggestions.taxonomic.suggested_data.author
              } : null,

              // Save the processing status
              processingStatus: record.processing_status,

              // Store the original API record for reference
              _apiData: record
            };
          });
          // Update progress from API response if available
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

    // 更新进度统计
    updateProgressFromAPI(progress) {
      this.progressStats = {
        total: this.currentBatch?.recordCount || progress.taxonomic?.total || 0,
        speciesCompleted: progress.taxonomic?.processed || 0,
        localityCompleted: progress.locality?.processed || 0,
        fullyCompleted: progress.overall?.processed || 0,
        speciesPercentage: progress.taxonomic?.percent || 0,
        localityPercentage: progress.locality?.percent || 0,
        completionPercentage: progress.overall?.percent || 0
      };
    },

    updateProgressFromBatchInfo(progress) {
      if (progress) {
        this.progressStats = {
          total: progress.taxonomic?.total || 0,
          speciesCompleted: progress.taxonomic?.processed || 0,
          localityCompleted: progress.locality?.processed || 0,
          fullyCompleted: progress.overall?.processed || 0,
          speciesPercentage: progress.taxonomic?.percent || 0,
          localityPercentage: progress.locality?.percent || 0,
          completionPercentage: progress.overall?.percent || 0
        };
      }
    },

    // 刷新进度
    async refreshProgress() {
      await this.loadBatchData();
    },

    // 设置过滤状态 - 需要调用服务器
    async setFilter(status) {
      this.serverSideFilter = status;
      this.currentPage = 1;
      await this.loadBatchRecords();
    },

    // 搜索处理 - 添加防抖
    onSearchChange() {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(async () => {
        this.serverSideSearch = this.searchText;
        this.currentPage = 1;
        await this.loadBatchRecords();
      }, 500); // 500ms 防抖
    },

    onSearchClear() {
      this.searchText = '';
      this.serverSideSearch = '';
      this.currentPage = 1;
      this.loadBatchRecords();
    },

    // 分页处理 - 需要调用服务器
    async handlePageChange(page) {
      this.currentPage = page;
      await this.loadBatchRecords();
    },

    async handleSizeChange(size) {
      this.pageSize = size;
      this.currentPage = 1;
      await this.loadBatchRecords();
    },

    // 获取物种状态
    getSpeciesStatusType(record) {
      if (record.taxonId) return 'success';
      if (record.verbatimTaxonomicId) return 'warning';
      return 'info';
    },

    getSpeciesStatusIcon(record) {
      if (record.taxonId) return 'el-icon-check';
      if (record.verbatimTaxonomicId) return 'el-icon-warning';
      return 'el-icon-minus';
    },

    getSpeciesStatusText(record) {
      if (record.taxonId) return 'Verified';
      if (record.verbatimTaxonomicId) return 'Pending';
      return 'None';
    },

    // 获取地点状态
    getLocalityStatusType(record) {
      if (record.localityId) return 'success';
      if (record.verbatimLocalityId) return 'warning';
      return 'info';
    },

    getLocalityStatusIcon(record) {
      if (record.localityId) return 'el-icon-check';
      if (record.verbatimLocalityId) return 'el-icon-warning';
      return 'el-icon-minus';
    },

    getLocalityStatusText(record) {
      if (record.localityId) return 'Verified';
      if (record.verbatimLocalityId) return 'Pending';
      return 'None';
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
      try {
        const response = await applyTaxonomicSuggestion(record.id);
        if (response.code === 20000) {
          this.$message.success('Taxonomic suggestion applied successfully');
          await this.loadBatchRecords(); // 重新加载当前页数据
        }
      } catch (error) {
        this.$message.error('Failed to apply taxonomic suggestion');
        console.error(error);
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
          await this.loadBatchRecords(); // 重新加载当前页数据
        }
      } catch (error) {
        this.$message.error('Failed to update record');
        console.error(error);
      }
    },

    // 导出批次结果
    async exportBatchResults() {
      try {
        const response = await exportBatchResults(this.selectedBatchId);

        // 创建下载链接
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

      try {
        await markBatchCompleted(this.selectedBatchId);
        this.$message.success('Batch marked as completed');
        await this.loadBatchData();
      } catch (error) {
        this.$message.error('Failed to mark batch as completed');
        console.error(error);
      }
    },

    // 格式化日期
    formatDate(date) {
      if (!date) return '';
      return new Date(date).toLocaleDateString();
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

.progress-number.complete {
  color: #E6A23C;
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
  padding: 15px
}
</style>
