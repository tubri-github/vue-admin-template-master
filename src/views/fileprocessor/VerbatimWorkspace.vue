<!--
  VerbatimWorkspace.vue
  Verbatim 数据处理工作台 - 批次数据验证和编辑
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
                :type="filterStatus === 'all' ? 'primary' : ''"
                @click="setFilter('all')">
                All ({{filteredRecords.length}})
              </el-button>
              <el-button
                size="small"
                :type="filterStatus === 'pending' ? 'warning' : ''"
                @click="setFilter('pending')">
                Pending ({{pendingCount}})
              </el-button>
              <el-button
                size="small"
                :type="filterStatus === 'completed' ? 'success' : ''"
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
          :data="paginatedRecords"
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

          <el-table-column label="Matched Species" width="200">
            <template slot-scope="scope">
              <div v-if="scope.row.taxonomic">
                <div class="matched-text">
                  {{scope.row.taxonomic.FullName}}
                </div>
                <div class="text-xs text-gray-500">
                  ID: {{scope.row.taxonomic.TaxonID}}
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
            :total="filteredRecords.length"
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
import { getVerbatimBatches, getBatchRecords, getBatchInfo } from '@/api/verbatimworkspace'

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

      // 过滤和搜索
      filterStatus: 'all',
      searchText: '',
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
    filteredRecords() {
      let records = this.batchRecords;

      // 状态过滤
      if (this.filterStatus === 'pending') {
        records = records.filter(record =>
          !record.taxonId || !record.localityId
        );
      } else if (this.filterStatus === 'completed') {
        records = records.filter(record =>
          record.taxonId && record.localityId
        );
      }

      // 文本搜索
      if (this.searchText) {
        const searchTerm = this.searchText.toLowerCase();
        records = records.filter(record => {
          return (
            (record.catalogNumber && record.catalogNumber.toLowerCase().includes(searchTerm)) ||
            (record.fieldNumber && record.fieldNumber.toLowerCase().includes(searchTerm)) ||
            (record.verbatimTaxonomic &&
              (record.verbatimTaxonomic.verbatimGenus + ' ' + record.verbatimTaxonomic.verbatimSpecies)
                .toLowerCase().includes(searchTerm)) ||
            (record.taxonomic && record.taxonomic.FullName.toLowerCase().includes(searchTerm))
          );
        });
      }

      return records;
    },

    paginatedRecords() {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      return this.filteredRecords.slice(start, end);
    },

    pendingCount() {
      return this.batchRecords.filter(record =>
        !record.taxonId || !record.localityId
      ).length;
    },

    completedCount() {
      return this.batchRecords.filter(record =>
        record.taxonId && record.localityId
      ).length;
    }
  },
  async mounted() {
    await this.loadAvailableBatches();
  },
  methods: {
    // 加载可用批次列表
    async loadAvailableBatches() {
      this.loadingBatch = true;
      try {
        // API 调用获取 verbatim 模式导入的批次
        const response = await getVerbatimBatches();
        if (response.code === 20000) {
          this.availableBatches = response.data.items.map(batch => ({
            batchSerialId: batch.batch_serial_id,
            fileName: batch.file_name || 'Unnamed Batch', // Add fallback if file_name is missing
            recordCount: batch.total_records,
            importDate: batch.import_date,
            status: batch.status,
            // Map other properties as needed
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
// 加载批次数据
    async loadBatchData() {
      if (!this.selectedBatchId) {
        this.currentBatch = null;
        this.batchRecords = [];
        return;
      }

      this.loadingRecords = true;
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
        }

        // 获取批次记录
        const recordsResponse = await getBatchRecords(this.selectedBatchId);
        if (recordsResponse.code === 20000) {
          // Map the records to match your component's expected format
          this.batchRecords = recordsResponse.data.items.map(record => {
            // Create the component-friendly record format
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
                TaxonID: record.matched_data.taxonomic.id
              } : null,

              // Save the processing status
              processingStatus: record.processing_status,

              // Store the original API record for reference
              _apiData: record
            };
          });
          this.calculateProgress();
        }
      } catch (error) {
        this.$message.error('Failed to load batch data');
        console.error(error);
      } finally {
        this.loadingRecords = false;
      }
    },
    // 计算进度统计
    calculateProgress() {
      if (!this.batchRecords || this.batchRecords.length === 0) {
        this.progressStats = {
          total: 0,
          speciesCompleted: 0,
          localityCompleted: 0,
          fullyCompleted: 0,
          speciesPercentage: 0,
          localityPercentage: 0,
          completionPercentage: 0
        };
        return;
      }

      const total = this.batchRecords.length;
      // Count records with taxonId (species completed)
      const speciesCompleted = this.batchRecords.filter(r => r.taxonId).length;
      // Count records with localityId (locality completed)
      const localityCompleted = this.batchRecords.filter(r => r.localityId).length;
      // Count records with both taxonId and localityId (fully completed)
      const fullyCompleted = this.batchRecords.filter(r => r.taxonId && r.localityId).length;

      this.progressStats = {
        total,
        speciesCompleted,
        localityCompleted,
        fullyCompleted,
        speciesPercentage: total > 0 ? Math.round((speciesCompleted / total) * 100) : 0,
        localityPercentage: total > 0 ? Math.round((localityCompleted / total) * 100) : 0,
        completionPercentage: total > 0 ? Math.round((fullyCompleted / total) * 100) : 0
      };
    },
    // 刷新进度
    async refreshProgress() {
      await this.loadBatchData();
    },

    // 设置过滤状态
    setFilter(status) {
      this.filterStatus = status;
      this.currentPage = 1;
    },

    // 分页处理
    handlePageChange(page) {
      this.currentPage = page;
    },

    handleSizeChange(size) {
      this.pageSize = size;
      this.currentPage = 1;
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
          // 更新本地记录
          const index = this.batchRecords.findIndex(r => r.id === updatedRecord.id);
          if (index !== -1) {
            this.batchRecords.splice(index, 1, response.data);
          }
          this.calculateProgress();
          this.$message.success('Record updated successfully');
          this.closeRecordEditor();
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
        await this.$api.markBatchCompleted(this.selectedBatchId);
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
  padding: 15px 0;
  border-bottom: 1px solid #eee;
}

.catalog-number {
  font-family: monospace;
  font-weight: bold;
}

.verbatim-text {
  font-style: italic;
  color: #666;
  font-size: 13px;
}

.matched-text {
  font-weight: 500;
  color: #333;
  font-size: 13px;
}

.pagination-wrapper {
  margin-top: 20px;
  text-align: center;
}

.text-right {
  text-align: right;
}

.text-gray-400 {
  color: #ccc;
}

.text-gray-500 {
  color: #999;
}

.text-xs {
  font-size: 12px;
}

.w-full {
  width: 100%;
}

.text-lg {
  font-size: 18px;
}

.font-medium {
  font-weight: 500;
}
</style>
