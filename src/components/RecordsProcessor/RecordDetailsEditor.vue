<!--
  RecordDetailsEditor.vue
  记录详情编辑器 - 修正版本
-->
<template>
  <div class="record-details-editor">
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
            <el-form-item label="Collection Date" prop="collectionDate">
              <el-date-picker
                v-model="localRecord.collectionDate"
                type="date"
                placeholder="Select collection date"
                format="yyyy-MM-dd"
                value-format="yyyy-MM-dd"
                @change="handleFieldChange"
                class="w-full">
              </el-date-picker>
            </el-form-item>
          </el-col>
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
                class="w-full">
                <el-option label="Unknown" value="Unknown"></el-option>
                <el-option label="0.5L" value="0.5L"></el-option>
                <el-option label="0.75L" value="0.75L"></el-option>
                <el-option label="1.0L" value="1.0L"></el-option>
                <el-option label="1L" value="1L"></el-option>
                <el-option label="2L" value="2L"></el-option>
                <el-option label="3L" value="3L"></el-option>
                <el-option label="1oz" value="1oz"></el-option>
                <el-option label="2oz" value="2oz"></el-option>
                <el-option label="4oz" value="4oz"></el-option>
                <el-option label="8oz" value="8oz"></el-option>
                <el-option label="12oz" value="12oz"></el-option>
                <el-option label="16oz" value="16oz"></el-option>
                <el-option label="32oz" value="32oz"></el-option>
                <el-option label="64oz" value="64oz"></el-option>
                <el-option label="1gal" value="1gal"></el-option>
                <el-option label="2 gal Jug" value="2 gal Jug"></el-option>
                <el-option label="3 gal Jug" value="3 gal Jug"></el-option>
                <el-option label="5 gal Jug" value="5 gal Jug"></el-option>
                <el-option label="Steel Tank" value="Steel Tank"></el-option>
                <el-option label="vial" value="vial"></el-option>
                <el-option label="Titan Bin" value="Titan Bin"></el-option>
                <el-option label="Multiple Jars <see remarks>" value="Multiple Jars <see remarks>"></el-option>
              </el-select>
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
          <el-col :span="8">
            <el-form-item label="Overall Status">
              <el-tag
                :type="getOverallStatusType()"
                size="medium">
                <i :class="getOverallStatusIcon()"></i>
                {{getOverallStatusText()}}
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
        <el-button @click="validateForm">
          <i class="el-icon-check"></i>
          Validate
        </el-button>
      </div>
    </el-form>

    <!-- 变更历史 -->
    <el-card v-if="changeHistory.length > 0" class="history-section">
      <div slot="header" class="section-header">
        <i class="el-icon-time"></i>
        Change History
      </div>

      <el-timeline>
        <el-timeline-item
          v-for="(change, index) in changeHistory"
          :key="index"
          :timestamp="formatTimestamp(change.timestamp)"
          placement="top">

          <div class="change-item">
            <div class="change-field">
              <strong>{{change.field}}</strong>
            </div>
            <div class="change-values">
              <span class="old-value">{{change.oldValue || 'Empty'}}</span>
              <i class="el-icon-right"></i>
              <span class="new-value">{{change.newValue || 'Empty'}}</span>
            </div>
          </div>
        </el-timeline-item>
      </el-timeline>
    </el-card>
  </div>
</template>

<script>
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
      changeHistory: [],

      // 表单验证规则
      formRules: {
        totalNumber: [
          { required: true, message: 'Total number is required', trigger: 'blur' },
          { type: 'number', min: 1, message: 'Total number must be at least 1', trigger: 'blur' }
        ],
        collectionDate: [
          { type: 'date', message: 'Invalid date format', trigger: 'change' }
        ]
      }
    }
  },
  computed: {
    hasRecordChanges() {
      const recordFields = [
        'collectionDate', 'totalNumber', 'storage', 'jarSize',
        'prevNumber', 'inventory', 'remarks', 'recordVerificationStatus'
      ]

      return recordFields.some(field =>
        this.localRecord[field] !== this.originalRecord[field]
      )
    }
  },
  watch: {
    record: {
      immediate: true,
      deep: true,
      handler(newRecord) {
        console.log('RecordDetailsEditor received record:', newRecord);

        // 从record中获取验证状态信息
        this.localRecord = {
          catalogNumber: newRecord.catalogNumber || '',
          fieldNumber: newRecord.fieldNumber || '',
          collectionDate: newRecord.collectionDate || null,
          totalNumber: typeof newRecord.totalNumber === 'number' ? newRecord.totalNumber : 1,
          storage: newRecord.storage || '',
          jarSize: newRecord.jarSize || '',
          prevNumber: newRecord.prevNumber || '',
          inventory: newRecord.inventory || '',
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
      }
    }
  },
  methods: {
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
      console.log('Record verification status changed to:', this.localRecord.recordVerificationStatus);

      // 记录变更历史
      this.recordChanges();

      // 通知父组件
      this.$emit('record-updated', this.getUpdateData());
    },

    // 获取更新数据
    getUpdateData() {
      return {
        collectionDate: this.localRecord.collectionDate,
        totalNumber: this.localRecord.totalNumber,
        storage: this.localRecord.storage,
        jarSize: this.localRecord.jarSize,
        prevNumber: this.localRecord.prevNumber,
        inventory: this.localRecord.inventory,
        remarks: this.localRecord.remarks,
        recordVerificationStatus: this.localRecord.recordVerificationStatus
      };
    },

    // 记录变更历史
    recordChanges() {
      const changes = [];
      const fieldsToTrack = [
        'collectionDate', 'totalNumber', 'storage', 'jarSize',
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

      // 更新变更历史
      this.changeHistory = changes;
    },

    // 获取字段显示名称
    getFieldDisplayName(field) {
      const fieldNames = {
        collectionDate: 'Collection Date',
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
      this.changeHistory = [];
      this.$message.info('Form reset to original values');
    },

    // 验证表单
    validateForm() {
      this.$refs.recordForm.validate((valid) => {
        if (valid) {
          this.$message.success('Form validation passed');
        } else {
          this.$message.error('Please correct the form errors');
        }
      });
    },

    // 获取物种状态相关方法 - 使用实时状态
    getSpeciesStatusType() {
      const status = this.localRecord.speciesVerificationStatus;
      switch(status) {
        case 'verified': return 'success';
        case 'needs_review': return 'warning';
        case 'rejected': return 'danger';
        default: return 'info';
      }
    },

    getSpeciesStatusIcon() {
      const status = this.localRecord.speciesVerificationStatus;
      switch(status) {
        case 'verified': return 'el-icon-check';
        case 'needs_review': return 'el-icon-warning';
        case 'rejected': return 'el-icon-close';
        default: return 'el-icon-minus';
      }
    },

    getSpeciesStatusText() {
      const status = this.localRecord.speciesVerificationStatus;
      switch(status) {
        case 'verified': return 'Verified';
        case 'needs_review': return 'Needs Review';
        case 'rejected': return 'Rejected';
        default: return 'Pending';
      }
    },

    // 获取地点状态相关方法 - 使用实时状态
    getLocalityStatusType() {
      const status = this.localRecord.localityVerificationStatus;
      switch(status) {
        case 'verified': return 'success';
        case 'needs_review': return 'warning';
        case 'rejected': return 'danger';
        default: return 'info';
      }
    },

    getLocalityStatusIcon() {
      const status = this.localRecord.localityVerificationStatus;
      switch(status) {
        case 'verified': return 'el-icon-check';
        case 'needs_review': return 'el-icon-warning';
        case 'rejected': return 'el-icon-close';
        default: return 'el-icon-minus';
      }
    },

    getLocalityStatusText() {
      const status = this.localRecord.localityVerificationStatus;
      switch(status) {
        case 'verified': return 'Verified';
        case 'needs_review': return 'Needs Review';
        case 'rejected': return 'Rejected';
        default: return 'Pending';
      }
    },

    // 获取整体状态相关方法
    getOverallStatusType() {
      const speciesStatus = this.localRecord.speciesVerificationStatus;
      const localityStatus = this.localRecord.localityVerificationStatus;
      const recordStatus = this.localRecord.recordVerificationStatus;

      // 如果三个都是verified，则为completed
      if (speciesStatus === 'verified' && localityStatus === 'verified' && recordStatus === 'verified') {
        return 'success';
      }
      // 如果有任何一个是rejected或needs_review
      if ([speciesStatus, localityStatus, recordStatus].some(status =>
        status === 'rejected' || status === 'needs_review')) {
        return 'warning';
      }
      // 如果有verified的
      if ([speciesStatus, localityStatus, recordStatus].some(status => status === 'verified')) {
        return 'primary';
      }
      return 'info';
    },

    getOverallStatusIcon() {
      const speciesStatus = this.localRecord.speciesVerificationStatus;
      const localityStatus = this.localRecord.localityVerificationStatus;
      const recordStatus = this.localRecord.recordVerificationStatus;

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
      const speciesStatus = this.localRecord.speciesVerificationStatus;
      const localityStatus = this.localRecord.localityVerificationStatus;
      const recordStatus = this.localRecord.recordVerificationStatus;

      if (speciesStatus === 'verified' && localityStatus === 'verified' && recordStatus === 'verified') {
        return 'Completed';
      }
      if ([speciesStatus, localityStatus, recordStatus].some(status =>
        status === 'rejected' || status === 'needs_review')) {
        return 'Needs Review';
      }
      if ([speciesStatus, localityStatus, recordStatus].some(status => status === 'verified')) {
        return 'Partially Verified';
      }
      return 'Pending';
    },

    // 获取完成度百分比
    getCompletionPercentage() {
      let completed = 0;
      let total = 3;

      if (this.localRecord.speciesVerificationStatus === 'verified') completed++;
      if (this.localRecord.localityVerificationStatus === 'verified') completed++;
      if (this.localRecord.recordVerificationStatus === 'verified') completed++;

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

    // 格式化时间戳
    formatTimestamp(timestamp) {
      return new Date(timestamp).toLocaleString();
    }
  }
};
</script>

<style scoped>
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

/* 变更历史样式 */
.history-section {
  margin-top: 30px;
}

.change-item {
  padding: 10px;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 3px solid #409EFF;
}

.change-field {
  font-weight: 500;
  color: #333;
  margin-bottom: 5px;
}

.change-values {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
}

.old-value {
  color: #f56565;
  text-decoration: line-through;
  background: #fed7d7;
  padding: 2px 6px;
  border-radius: 3px;
}

.new-value {
  color: #38a169;
  background: #c6f6d5;
  padding: 2px 6px;
  border-radius: 3px;
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
