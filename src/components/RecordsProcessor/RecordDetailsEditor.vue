<!--
  RecordDetailsEditor.vue
  记录详情编辑器 - 编辑 Primary 表的其他字段
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
<!--            <el-form-item label="Field Number" prop="fieldNumber">-->
<!--              <el-input-->
<!--                v-model="localRecord.fieldNumber"-->
<!--                placeholder="Enter field number"-->
<!--                @change="handleFieldChange">-->
<!--                <template slot="append">-->
<!--                  <el-button @click="generateFieldNumber" size="mini">-->
<!--                    <i class="el-icon-refresh"></i>-->
<!--                  </el-button>-->
<!--                </template>-->
<!--              </el-input>-->
<!--            </el-form-item>-->
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

      <!-- 状态信息 -->
      <el-card class="form-section">
        <div slot="header" class="section-header">
          <i class="el-icon-warning-outline"></i>
          Processing Status
        </div>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="Species Status">
              <el-tag
                :type="record.taxonId ? 'success' : 'warning'"
                size="medium">
                <i :class="record.taxonId ? 'el-icon-check' : 'el-icon-warning'"></i>
                {{record.taxonId ? 'Verified' : 'Pending'}}
              </el-tag>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="Locality Status">
              <el-tag
                :type="record.localityId ? 'success' : 'warning'"
                size="medium">
                <i :class="record.localityId ? 'el-icon-check' : 'el-icon-warning'"></i>
                {{record.localityId ? 'Verified' : 'Pending'}}
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
        <el-button type="primary" @click="quickSave" :loading="saving">
          <i class="el-icon-upload"></i>
          Quick Save
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
        fieldNumber: [
          { required: false, message: 'Field number is required', trigger: 'blur' } // Changed to false if optional
        ],
        totalNumber: [
          { required: true, message: 'Total number is required', trigger: 'blur' },
          { type: 'number', min: 0, message: 'Total number must be at least 0', trigger: 'blur' } // Changed minimum to 0
        ],
        collectionDate: [
          { type: 'date', message: 'Invalid date format', trigger: 'change' }
        ]
      }
    }
  },
  watch: {
    record: {
      immediate: true,
      deep: true,
      handler(newRecord) {
        console.log('RecordDetailsEditor received record:', newRecord);

        // Make sure we have valid data
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

          // Add IDs for status checks
          taxonId: newRecord.taxonId,
          localityId: newRecord.localityId,

          // Processing status
          processingStatus: newRecord.processingStatus,

          // Reference to original record
          _apiData: newRecord._apiData
        };

        this.originalRecord = { ...this.localRecord };

        console.log('RecordDetailsEditor initialized localRecord:', this.localRecord);
      }
    }
  },
  methods: {
    // 处理字段变更
    handleFieldChange() {
      // 记录变更历史
      this.recordChanges();

      // 通知父组件
      this.$emit('record-updated', this.localRecord);
    },

    // 记录变更历史
    recordChanges() {
      const changes = [];
      const fieldsToTrack = [
        'fieldNumber', 'collectionDate', 'totalNumber',
        'storage', 'jarSize', 'prevNumber', 'inventory', 'remarks'
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
        fieldNumber: 'Field Number',
        collectionDate: 'Collection Date',
        totalNumber: 'Total Number',
        storage: 'Storage Location',
        jarSize: 'Jar Size',
        prevNumber: 'Previous Number',
        inventory: 'Inventory Number',
        remarks: 'Remarks'
      };
      return fieldNames[field] || field;
    },

    // // 生成字段编号
    // async generateFieldNumber() {
    //   try {
    //     const response = await this.$api.generateFieldNumber();
    //     if (response.code === 20000) {
    //       this.localRecord.fieldNumber = response.data.fieldNumber;
    //       this.handleFieldChange();
    //       this.$message.success('Field number generated');
    //     }
    //   } catch (error) {
    //     this.$message.error('Failed to generate field number');
    //     console.error(error);
    //   }
    // },

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

    // 快速保存
    async quickSave() {
      // 先验证表单
      const valid = await new Promise(resolve => {
        this.$refs.recordForm.validate(resolve);
      });

      if (!valid) {
        this.$message.error('Please correct form errors before saving');
        return;
      }

      this.saving = true;
      try {
        const response = await this.$api.updateRecordDetails(this.localRecord);
        if (response.code === 20000) {
          this.originalRecord = { ...this.localRecord };
          this.changeHistory = [];
          this.$message.success('Record details saved successfully');

          // 通知父组件
          this.$emit('record-updated', this.localRecord);
        }
      } catch (error) {
        this.$message.error('Failed to save record details');
        console.error(error);
      } finally {
        this.saving = false;
      }
    },

// 获取整体状态类型
    getOverallStatusType() {
      // First check for processing status
      if (this.record.processingStatus) {
        const status = this.record.processingStatus.overall;
        if (status === 'complete') {
          return 'success';
        } else if (status === 'in_progress') {
          return 'warning';
        } else {
          return 'info';
        }
      }

      // Fallback to ID-based checks
      if (this.record.taxonId && this.record.localityId) {
        return 'success';
      } else if (this.record.taxonId || this.record.localityId) {
        return 'warning';
      } else {
        return 'info';
      }
    },

// 获取整体状态图标
    getOverallStatusIcon() {
      // First check for processing status
      if (this.record.processingStatus) {
        const status = this.record.processingStatus.overall;
        if (status === 'complete') {
          return 'el-icon-check';
        } else if (status === 'in_progress') {
          return 'el-icon-warning';
        } else {
          return 'el-icon-minus';
        }
      }

      // Fallback to ID-based checks
      if (this.record.taxonId && this.record.localityId) {
        return 'el-icon-check';
      } else if (this.record.taxonId || this.record.localityId) {
        return 'el-icon-warning';
      } else {
        return 'el-icon-minus';
      }
    },

// 获取整体状态文本
    getOverallStatusText() {
      // First check for processing status
      if (this.record.processingStatus) {
        const status = this.record.processingStatus.overall;
        if (status === 'complete') {
          return 'Complete';
        } else if (status === 'in_progress') {
          return 'In Progress';
        } else if (status === 'pending') {
          return 'Pending';
        } else {
          return 'Incomplete';
        }
      }

      // Fallback to ID-based checks
      if (this.record.taxonId && this.record.localityId) {
        return 'Complete';
      } else if (this.record.taxonId || this.record.localityId) {
        return 'Partial';
      } else {
        return 'Incomplete';
      }
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
