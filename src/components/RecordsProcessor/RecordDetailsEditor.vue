<!--
  RecordDetailsEditor.vue
  记录详情编辑器 - 修正版本
-->
<template>
  <div class="record-details-editor">
    <!-- Verification Warnings/Errors Display -->
    <el-card v-if="hasWarnings || hasErrors" class="warnings-card" shadow="never">
      <div slot="header" class="warnings-header">
        <i class="el-icon-warning"></i>
        <span>Validation Issues</span>
      </div>

      <div class="warnings-content">
        <!-- Errors -->
        <div v-if="errorWarnings.length > 0" class="issue-section error-section">
          <div class="issue-header">
            <i class="el-icon-close"></i>
            <strong>Errors ({{ errorWarnings.length }})</strong>
          </div>
          <el-alert
            v-for="(warning, idx) in errorWarnings"
            :key="'error-' + idx"
            :title="warning.message"
            type="error"
            :closable="false"
            show-icon
            class="issue-item">
            <div class="issue-details">
              <el-tag size="mini" type="info">{{ warning.field }}</el-tag>
              <el-tag size="mini" type="danger">{{ warning.issue_type }}</el-tag>
            </div>
          </el-alert>
        </div>

        <!-- Warnings -->
        <div v-if="warningWarnings.length > 0" class="issue-section warning-section">
          <div class="issue-header">
            <i class="el-icon-warning"></i>
            <strong>Warnings ({{ warningWarnings.length }})</strong>
          </div>
          <el-alert
            v-for="(warning, idx) in warningWarnings"
            :key="'warning-' + idx"
            :title="warning.message"
            type="warning"
            :closable="false"
            show-icon
            class="issue-item">
            <div class="issue-details">
              <el-tag size="mini" type="info">{{ warning.field }}</el-tag>
              <el-tag size="mini" type="warning">{{ warning.issue_type }}</el-tag>
            </div>
          </el-alert>
        </div>
      </div>
    </el-card>

    <el-form
      ref="recordForm"
      :model="localRecord"
      :rules="formRules"
      label-width="150px"
      class="record-form">

      <!-- 基础信息 -->
      <el-card class="form-section">
        <div slot="header" class="section-header">
          <i class="el-icon-info"></i>
          Basic Information
        </div>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Catalog Number" prop="catalogNumber">
              <el-input
                v-model="localRecord.catalogNumber"
                disabled
                placeholder="Auto-generated">
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Field Number" prop="fieldNumber">
              <el-input
                v-model="localRecord.fieldNumber"
                placeholder="Field number from locality"
                disabled>
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <!-- 采集信息 -->
      <el-card class="form-section">
        <div slot="header" class="section-header">
          <i class="el-icon-date"></i>
          Collection Information
        </div>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Total Number" prop="totalNumber">
              <el-input-number
                v-model="localRecord.totalNumber"
                :min="1"
                :max="9999"
                @change="handleFieldChange"
                class="w-full">
              </el-input-number>
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <!-- 存储信息 -->
      <el-card class="form-section">
        <div slot="header" class="section-header">
          <i class="el-icon-box"></i>
          Storage Information
        </div>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Storage Location" prop="storage">
              <el-input
                v-model="localRecord.storage"
                placeholder="e.g., Tank A1, Freezer B2"
                @change="handleFieldChange">
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Jar Size" prop="jarSize">
              <el-select
                v-model="localRecord.jarSize"
                placeholder="Select jar size"
                @change="handleFieldChange"
                clearable
                filterable
                class="w-full">
                <el-option
                  v-for="item in jarSizeTypeOptions"
                  :key="item.JarSizeID"
                  :label="item.JarSize"
                  :value="item.JarSize" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Type Status" prop="typeStatus">
              <el-input
                v-model="localRecord.typeStatus"
                placeholder="e.g., Holotype, Paratype"
                @change="handleFieldChange">
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <!-- 追踪信息 -->
      <el-card class="form-section">
        <div slot="header" class="section-header">
          <i class="el-icon-files"></i>
          Tracking Information
        </div>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Previous Number" prop="prevNumber">
              <el-input
                v-model="localRecord.prevNumber"
                placeholder="Previous catalog/field number"
                @change="handleFieldChange">
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Inventory Number" prop="inventory">
              <el-input
                v-model="localRecord.inventory"
                placeholder="Internal inventory number"
                @change="handleFieldChange">
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Collector" prop="collector">
              <el-input
                v-model="localRecord.collector"
                placeholder="Collector name(s)"
                @change="handleFieldChange">
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <!-- 备注信息 -->
      <el-card class="form-section">
        <div slot="header" class="section-header">
          <i class="el-icon-edit-outline"></i>
          Additional Information
        </div>

        <el-form-item label="Remarks" prop="remarks">
          <el-input
            v-model="localRecord.remarks"
            type="textarea"
            :rows="4"
            placeholder="Enter any additional notes or remarks..."
            @change="handleFieldChange">
          </el-input>
        </el-form-item>
      </el-card>

      <!-- 验证状态信息 -->
      <el-card class="form-section">
        <div slot="header" class="section-header">
          <i class="el-icon-warning-outline"></i>
          Verification Status
        </div>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="Species Status">
              <el-tag
                :type="getSpeciesStatusType()"
                size="medium">
                <i :class="getSpeciesStatusIcon()"></i>
                {{getSpeciesStatusText()}}
              </el-tag>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="Locality Status">
              <el-tag
                :type="getLocalityStatusType()"
                size="medium">
                <i :class="getLocalityStatusIcon()"></i>
                {{getLocalityStatusText()}}
              </el-tag>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="Record Verification Status">
              <el-radio-group v-model="localRecord.recordVerificationStatus" @change="handleVerificationStatusChange">
                <el-radio label="verified">
                  <i class="el-icon-check" style="color: #67C23A;"></i>
                  Verified - Record details are complete and accurate
                </el-radio>
                <el-radio label="needs_review">
                  <i class="el-icon-warning" style="color: #E6A23C;"></i>
                  Needs Review - Record details need further verification
                </el-radio>
                <el-radio label="pending">
                  <i class="el-icon-minus" style="color: #909399;"></i>
                  Pending - Record details not yet verified
                </el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Completeness">
              <el-progress
                :percentage="getCompletionPercentage()"
                :stroke-width="10"
                :color="getProgressColor()">
              </el-progress>
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <!-- 操作按钮 -->
      <div class="form-actions">
        <el-button @click="resetForm">
          <i class="el-icon-refresh"></i>
          Reset
        </el-button>
      </div>
    </el-form>

  </div>
</template>

<script>
import { getJarSizes } from '@/api/table'

export default {
  name: 'RecordDetailsEditor',
  props: {
    record: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      localRecord: {},
      originalRecord: {},
      saving: false,
      isInitializing: false, // 标志防止用户操作时被watch覆盖
      jarSizeTypeOptions: [],

      // 表单验证规则
      formRules: {
        totalNumber: [
          { required: true, message: 'Total number is required', trigger: 'blur' },
          { type: 'number', min: 1, message: 'Total number must be at least 1', trigger: 'blur' }
        ]
      }
    }
  },
  created() {
    this.loadJarSizes()
  },
  computed: {
    hasRecordChanges() {
      const recordFields = [
        'totalNumber', 'storage', 'jarSize',
        'prevNumber', 'inventory', 'remarks', 'recordVerificationStatus'
      ]

      return recordFields.some(field =>
        this.localRecord[field] !== this.originalRecord[field]
      )
    },

    // 解析warnings
    allWarnings() {
      console.log('RecordDetailsEditor - allWarnings computed:', {
        record: this.record,
        verificationInfo: this.record.verificationInfo,
        warnings: this.record.verificationInfo?.warnings
      });
      if (this.record.verificationInfo && this.record.verificationInfo.warnings) {
        return this.record.verificationInfo.warnings
      }
      return []
    },

    // 按severity分类: errors
    errorWarnings() {
      return this.allWarnings.filter(w => w.severity === 'error')
    },

    // 按severity分类: warnings
    warningWarnings() {
      return this.allWarnings.filter(w => w.severity === 'warning')
    },

    hasWarnings() {
      return this.warningWarnings.length > 0
    },

    hasErrors() {
      return this.errorWarnings.length > 0
    }
  },
  watch: {
    record: {
      immediate: true,
      handler(newRecord) {
        console.log('RecordDetailsEditor received record:', newRecord);

        this.isInitializing = true; // 设置初始化标志

        // 从record中获取验证状态信息
        this.localRecord = {
          catalogNumber: newRecord.catalogNumber || '',
          fieldNumber: newRecord.fieldNumber || '',
          totalNumber: typeof newRecord.totalNumber === 'number' ? newRecord.totalNumber : 1,
          storage: newRecord.storage || '',
          jarSize: newRecord.jarSize || '',
          prevNumber: newRecord.prevNumber || '',
          inventory: newRecord.inventory || '',
          // TypeStatus (record_data) + Collector (verbatim locality): read from the full
          // nested _apiData so they bind reliably regardless of the flattened shape.
          typeStatus: (newRecord._apiData && newRecord._apiData.record_data && newRecord._apiData.record_data.type_status) || newRecord.typeStatus || '',
          collector: (newRecord._apiData && newRecord._apiData.verbatim_data && newRecord._apiData.verbatim_data.locality && newRecord._apiData.verbatim_data.locality.collector) || '',
          remarks: newRecord.remarks || '',

          // 从父组件获取实际的验证状态
          taxonId: newRecord.taxonId,
          localityId: newRecord.localityId,
          speciesVerificationStatus: this.getInitialSpeciesStatus(newRecord),
          localityVerificationStatus: this.getInitialLocalityStatus(newRecord),
          recordVerificationStatus: this.getInitialRecordStatus(newRecord),

          // Processing status
          processingStatus: newRecord.processingStatus,
          verificationInfo: newRecord.verificationInfo,

          // Reference to original record
          _apiData: newRecord._apiData
        };

        this.originalRecord = { ...this.localRecord };

        console.log('RecordDetailsEditor initialized localRecord:', this.localRecord);

        // 在下一个tick清除初始化标志
        this.$nextTick(() => {
          this.isInitializing = false;
        });
      }
    }
  },
  methods: {
    // 从后端拉 JarSize 选项（与 lotform / Loan 等其他下拉保持单一数据源）
    async loadJarSizes() {
      try {
        const response = await getJarSizes()
        if (response && response.data && response.data.items) {
          this.jarSizeTypeOptions = response.data.items.map(item => ({
            JarSizeID: item.JarSizeID,
            JarSize: item.JarSize
          }))
        }
      } catch (error) {
        console.error('Failed to load jar sizes:', error)
      }
    },

    // 获取初始验证状态 - 从父组件传递的数据中获取
    getInitialSpeciesStatus(record) {
      return record.verificationInfo?.species?.status ||
        record.processingStatus?.taxonomic ||
        (record.taxonId ? 'verified' : 'pending');
    },

    getInitialLocalityStatus(record) {
      return record.verificationInfo?.locality?.status ||
        record.processingStatus?.locality ||
        (record.localityId ? 'verified' : 'pending');
    },

    getInitialRecordStatus(record) {
      return record.verificationInfo?.record?.status ||
        record.processingStatus?.record ||
        'pending'; // 默认为pending，而不是verified
    },

    // 处理字段变更
    handleFieldChange() {
      // 记录变更历史
      this.recordChanges();

      // 通知父组件
      this.$emit('record-updated', this.getUpdateData());
    },

    // 处理验证状态变更
    handleVerificationStatusChange() {
      // 如果正在初始化，跳过事件处理
      if (this.isInitializing) {
        return;
      }

      console.log('Record verification status changed to:', this.localRecord.recordVerificationStatus);

      // 记录变更历史
      this.recordChanges();

      // 使用nextTick确保DOM更新完成后再通知父组件
      this.$nextTick(() => {
        this.$emit('record-updated', this.getUpdateData());
      });
    },

    // 获取更新数据
    getUpdateData() {
      return {
        totalNumber: this.localRecord.totalNumber,
        storage: this.localRecord.storage,
        jarSize: this.localRecord.jarSize,
        prevNumber: this.localRecord.prevNumber,
        inventory: this.localRecord.inventory,
        typeStatus: this.localRecord.typeStatus,
        collector: this.localRecord.collector,
        remarks: this.localRecord.remarks,
        recordVerificationStatus: this.localRecord.recordVerificationStatus
      };
    },

    // 记录变更历史
    recordChanges() {
      const changes = [];
      const fieldsToTrack = [
        'totalNumber', 'storage', 'jarSize',
        'prevNumber', 'inventory', 'remarks', 'recordVerificationStatus'
      ];

      fieldsToTrack.forEach(field => {
        if (this.localRecord[field] !== this.originalRecord[field]) {
          changes.push({
            field: this.getFieldDisplayName(field),
            oldValue: this.originalRecord[field],
            newValue: this.localRecord[field],
            timestamp: new Date()
          });
        }
      });

    },

    // 获取字段显示名称
    getFieldDisplayName(field) {
      const fieldNames = {
        totalNumber: 'Total Number',
        storage: 'Storage Location',
        jarSize: 'Jar Size',
        prevNumber: 'Previous Number',
        inventory: 'Inventory Number',
        remarks: 'Remarks',
        recordVerificationStatus: 'Record Verification Status'
      };
      return fieldNames[field] || field;
    },

    // 重置表单
    resetForm() {
      this.localRecord = { ...this.originalRecord };
      this.$message.info('Form reset to original values');
    },


    // 获取物种状态相关方法 - 基于实际数据状态
    getSpeciesStatusType() {
      const status = this.getCurrentSpeciesStatus();
      switch(status) {
        case 'verified': return 'success';
        case 'needs_review': return 'warning';
        case 'rejected': return 'danger';
        default: return 'info';
      }
    },

    getSpeciesStatusIcon() {
      const status = this.getCurrentSpeciesStatus();
      switch(status) {
        case 'verified': return 'el-icon-check';
        case 'needs_review': return 'el-icon-warning';
        case 'rejected': return 'el-icon-close';
        default: return 'el-icon-minus';
      }
    },

    getSpeciesStatusText() {
      const status = this.getCurrentSpeciesStatus();
      switch(status) {
        case 'verified': return 'Verified';
        case 'needs_review': return 'Needs Review';
        case 'rejected': return 'Rejected';
        default: return 'Pending';
      }
    },

    // 实时计算当前物种验证状态
    getCurrentSpeciesStatus() {
      if (this.localRecord.taxonId) {
        return 'verified';
      } else if (this.localRecord.verbatimTaxonomicId) {
        return 'needs_review';
      }
      return 'pending';
    },

    // 获取地点状态相关方法 - 基于实际数据状态
    getLocalityStatusType() {
      const status = this.getCurrentLocalityStatus();
      switch(status) {
        case 'verified': return 'success';
        case 'needs_review': return 'warning';
        case 'rejected': return 'danger';
        default: return 'info';
      }
    },

    getLocalityStatusIcon() {
      const status = this.getCurrentLocalityStatus();
      switch(status) {
        case 'verified': return 'el-icon-check';
        case 'needs_review': return 'el-icon-warning';
        case 'rejected': return 'el-icon-close';
        default: return 'el-icon-minus';
      }
    },

    getLocalityStatusText() {
      const status = this.getCurrentLocalityStatus();
      switch(status) {
        case 'verified': return 'Verified';
        case 'needs_review': return 'Needs Review';
        case 'rejected': return 'Rejected';
        default: return 'Pending';
      }
    },

    // 实时计算当前地点验证状态
    getCurrentLocalityStatus() {
      if (this.localRecord.localityId) {
        return 'verified';
      } else if (this.localRecord.verbatimLocalityId) {
        return 'needs_review';
      }
      return 'pending';
    },

    // 获取整体状态相关方法 - 基于实时状态
    getOverallStatusType() {
      const speciesStatus = this.getCurrentSpeciesStatus();
      const localityStatus = this.getCurrentLocalityStatus();
      const recordStatus = this.getCurrentRecordStatus();

      // 如果三个都是verified，则为completed
      if (speciesStatus === 'verified' && localityStatus === 'verified' && recordStatus === 'verified') {
        return 'success';
      }
      // 如果有任何一个是rejected或needs_review
      if ([speciesStatus, localityStatus, recordStatus].some(status =>
        status === 'rejected' || status === 'needs_review')) {
        return 'warning';
      }
      // 如果有部分verified的，显示为success（绿色）
      if ([speciesStatus, localityStatus, recordStatus].some(status => status === 'verified')) {
        return 'success';
      }
      return 'info';
    },

    getOverallStatusIcon() {
      const speciesStatus = this.getCurrentSpeciesStatus();
      const localityStatus = this.getCurrentLocalityStatus();
      const recordStatus = this.getCurrentRecordStatus();

      if (speciesStatus === 'verified' && localityStatus === 'verified' && recordStatus === 'verified') {
        return 'el-icon-check';
      }
      if ([speciesStatus, localityStatus, recordStatus].some(status =>
        status === 'rejected' || status === 'needs_review')) {
        return 'el-icon-warning';
      }
      if ([speciesStatus, localityStatus, recordStatus].some(status => status === 'verified')) {
        return 'el-icon-check';
      }
      return 'el-icon-minus';
    },

    getOverallStatusText() {
      const speciesStatus = this.getCurrentSpeciesStatus();
      const localityStatus = this.getCurrentLocalityStatus();
      const recordStatus = this.getCurrentRecordStatus();

      if (speciesStatus === 'verified' && localityStatus === 'verified' && recordStatus === 'verified') {
        return 'Completed';
      }
      if ([speciesStatus, localityStatus, recordStatus].some(status =>
        status === 'rejected' || status === 'needs_review')) {
        return 'Needs Review';
      }
      if ([speciesStatus, localityStatus, recordStatus].some(status => status === 'verified')) {
        return 'Verified';
      }
      return 'Pending';
    },

    // 实时计算当前Record状态
    getCurrentRecordStatus() {
      // Record Details状态应该基于用户的手动验证状态，不是自动判断
      return this.localRecord.recordVerificationStatus || 'pending';
    },

    // Record Details Status显示方法
    getRecordDetailsStatusType() {
      const status = this.getCurrentRecordStatus();
      switch(status) {
        case 'verified': return 'success';
        case 'needs_review': return 'warning';
        case 'rejected': return 'danger';
        default: return 'info';
      }
    },

    getRecordDetailsStatusIcon() {
      const status = this.getCurrentRecordStatus();
      switch(status) {
        case 'verified': return 'el-icon-check';
        case 'needs_review': return 'el-icon-warning';
        case 'rejected': return 'el-icon-close';
        default: return 'el-icon-minus';
      }
    },

    getRecordDetailsStatusText() {
      const status = this.getCurrentRecordStatus();
      switch(status) {
        case 'verified': return 'Verified';
        case 'needs_review': return 'Needs Review';
        case 'rejected': return 'Rejected';
        default: return 'Pending';
      }
    },

    // 获取完成度百分比 - 基于实时状态
    getCompletionPercentage() {
      let completed = 0;
      let total = 3;

      // 使用实时计算的状态
      if (this.getCurrentSpeciesStatus() === 'verified') completed++;
      if (this.getCurrentLocalityStatus() === 'verified') completed++;
      if (this.getCurrentRecordStatus() === 'verified') completed++;

      return Math.round((completed / total) * 100);
    },

    // 获取进度条颜色
    getProgressColor() {
      const percentage = this.getCompletionPercentage();
      if (percentage === 100) return '#67C23A';
      if (percentage >= 66) return '#E6A23C';
      if (percentage >= 33) return '#409EFF';
      return '#F56C6C';
    },

  }
};
</script>

<style scoped>
.record-details-editor {
  padding: 20px;
}

/* Warnings Card */
.warnings-card {
  margin-bottom: 20px;
  border-left: 4px solid #E6A23C;
}

.warnings-card.has-errors {
  border-left-color: #F56C6C;
}

.warnings-header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #E6A23C;
  font-weight: 600;
}

.warnings-content {
  padding: 10px 0;
}

.issue-section {
  margin-bottom: 20px;
}

.issue-section:last-child {
  margin-bottom: 0;
}

.issue-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding: 8px 12px;
  border-radius: 4px;
}

.error-section .issue-header {
  background-color: #FEF0F0;
  color: #F56C6C;
}

.warning-section .issue-header {
  background-color: #FDF6EC;
  color: #E6A23C;
}

.issue-item {
  margin-bottom: 10px;
}

.issue-details {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.record-details-editor {
  padding: 20px;
}

.record-form {
  max-width: 100%;
}

.form-section {
  margin-bottom: 20px;
}

.section-header {
  font-weight: 500;
  color: #333;
}

.section-header i {
  margin-right: 8px;
  color: #409EFF;
}

.w-full {
  width: 100%;
}

.form-actions {
  text-align: center;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
}

.form-actions .el-button {
  margin: 0 10px;
}


/* 状态标签样式 */
.el-tag {
  font-size: 14px;
  padding: 8px 12px;
}

.el-tag i {
  margin-right: 5px;
}

/* 验证状态单选框样式 */
.el-radio-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.el-radio {
  margin-right: 0;
  margin-bottom: 10px;
}

.el-radio__label {
  display: flex;
  align-items: center;
  padding-left: 10px;
}

.el-radio__label i {
  margin-right: 8px;
}

/* 表单项样式微调 */
.el-form-item {
  margin-bottom: 20px;
}

.el-form-item__label {
  font-weight: 500;
  color: #333;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .record-details-editor {
    padding: 10px;
  }

  .el-form--label-width-150px .el-form-item__label {
    width: 120px !important;
  }
}
</style>
