<!--
  CreateSpeciesForm.vue
  创建新物种表单组件
-->
<template>
  <div class="create-species-form">
    <el-form
      ref="speciesForm"
      :model="speciesData"
      :rules="formRules"
      label-width="120px">

      <!-- 基础信息提示 -->
      <el-alert
        v-if="verbatimData"
        type="info"
        :closable="false"
        class="verbatim-info">
        <div slot="title">
          Based on verbatim data:
          {{verbatimData.verbatimFamily}} {{verbatimData.verbatimGenus}} {{verbatimData.verbatimSpecies}}
        </div>
      </el-alert>

      <!-- 分类信息 -->
      <el-card class="form-section">
        <div slot="header">Taxonomic Information</div>

        <el-form-item label="Family" prop="Family">
          <el-input
            v-model="speciesData.Family"
            placeholder="e.g., Cyprinidae">
          </el-input>
        </el-form-item>

        <el-form-item label="Genus" prop="Genus">
          <el-input
            v-model="speciesData.Genus"
            placeholder="e.g., Cyprinus">
          </el-input>
        </el-form-item>

        <el-form-item label="Species" prop="Species">
          <el-input
            v-model="speciesData.Species"
            placeholder="e.g., carpio">
          </el-input>
        </el-form-item>

        <el-form-item label="Subspecies">
          <el-input
            v-model="speciesData.Subspecies"
            placeholder="Optional subspecies">
          </el-input>
        </el-form-item>

        <el-form-item label="Author">
          <el-input
            v-model="speciesData.Author"
            placeholder="e.g., Linnaeus, 1758">
          </el-input>
        </el-form-item>
      </el-card>

      <!-- 状态信息 -->
      <el-card class="form-section">
        <div slot="header">Status Information</div>

        <el-form-item label="Status" prop="Status">
          <el-select v-model="speciesData.Status" class="w-full">
            <el-option label="Valid" value="Valid"></el-option>
            <el-option label="Invalid" value="Invalid"></el-option>
            <el-option label="Synonym" value="Synonym"></el-option>
            <el-option label="Uncertain" value="Uncertain"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item v-if="speciesData.Status === 'Synonym'" label="Valid Name">
          <el-input
            v-model="speciesData.ValidName"
            placeholder="Valid taxonomic name if this is a synonym">
          </el-input>
        </el-form-item>
      </el-card>

      <!-- 分类等级信息 -->
      <el-card class="form-section">
        <div slot="header">Higher Taxonomy (Optional)</div>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Order">
              <el-input v-model="speciesData.Order"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Class">
              <el-input v-model="speciesData.Class"></el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Phylum">
              <el-input v-model="speciesData.Phylum"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Kingdom">
              <el-input v-model="speciesData.Kingdom"></el-input>
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <!-- 附加信息 -->
      <el-card class="form-section">
        <div slot="header">Additional Information</div>

        <el-form-item label="Common Name">
          <el-input
            v-model="speciesData.CommonName"
            placeholder="Common name in English">
          </el-input>
        </el-form-item>

        <el-form-item label="Notes">
          <el-input
            v-model="speciesData.Notes"
            type="textarea"
            :rows="3"
            placeholder="Additional notes about this species">
          </el-input>
        </el-form-item>
      </el-card>

      <!-- 预览生成的全名 -->
      <el-card class="form-section">
        <div slot="header">Generated Full Name</div>
        <div class="full-name-preview">
          <span class="full-name">{{generateFullName()}}</span>
          <el-tag v-if="speciesData.Status" :type="getStatusType()" size="small">
            {{speciesData.Status}}
          </el-tag>
        </div>
      </el-card>

      <!-- 表单操作 -->
      <div class="form-actions">
        <el-button @click="cancelForm">Cancel</el-button>
        <el-button @click="resetForm">Reset</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">
          Create Species
        </el-button>
      </div>
    </el-form>
  </div>
</template>

<script>
export default {
  name: 'CreateSpeciesForm',
  props: {
    verbatimData: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      submitting: false,
      speciesData: {
        Family: '',
        Genus: '',
        Species: '',
        Subspecies: '',
        Author: '',
        Status: 'Valid',
        ValidName: '',
        Order: '',
        Class: '',
        Phylum: '',
        Kingdom: '',
        CommonName: '',
        Notes: ''
      },

      // 表单验证规则
      formRules: {
        Family: [
          { required: true, message: 'Family is required', trigger: 'blur' },
          { min: 2, max: 100, message: 'Family name should be 2-100 characters', trigger: 'blur' }
        ],
        Genus: [
          { required: true, message: 'Genus is required', trigger: 'blur' },
          { min: 2, max: 100, message: 'Genus name should be 2-100 characters', trigger: 'blur' },
          { pattern: /^[A-Z][a-z]+$/, message: 'Genus should start with capital letter', trigger: 'blur' }
        ],
        Species: [
          { required: true, message: 'Species is required', trigger: 'blur' },
          { min: 2, max: 100, message: 'Species name should be 2-100 characters', trigger: 'blur' },
          { pattern: /^[a-z]+$/, message: 'Species should be lowercase', trigger: 'blur' }
        ],
        Status: [
          { required: true, message: 'Status is required', trigger: 'change' }
        ]
      }
    }
  },
  created() {
    // 如果有 verbatim 数据，预填充表单
    if (this.verbatimData) {
      this.prefillFromVerbatim();
    }
  },
  methods: {
    // 从 verbatim 数据预填充表单
    prefillFromVerbatim() {
      if (this.verbatimData.verbatimFamily) {
        this.speciesData.Family = this.capitalizeFirst(this.verbatimData.verbatimFamily);
      }
      if (this.verbatimData.verbatimGenus) {
        this.speciesData.Genus = this.capitalizeFirst(this.verbatimData.verbatimGenus);
      }
      if (this.verbatimData.verbatimSpecies) {
        this.speciesData.Species = this.verbatimData.verbatimSpecies.toLowerCase();
      }
    },

    // 首字母大写
    capitalizeFirst(str) {
      if (!str) return '';
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    },

    // 生成全名
    generateFullName() {
      let fullName = '';

      if (this.speciesData.Genus) {
        fullName += this.speciesData.Genus;
      }

      if (this.speciesData.Species) {
        fullName += (fullName ? ' ' : '') + this.speciesData.Species;
      }

      if (this.speciesData.Subspecies) {
        fullName += ' ' + this.speciesData.Subspecies;
      }

      if (this.speciesData.Author) {
        fullName += ' ' + this.speciesData.Author;
      }

      return fullName || 'Preview will appear here...';
    },

    // 获取状态类型
    getStatusType() {
      const typeMap = {
        'Valid': 'success',
        'Invalid': 'danger',
        'Synonym': 'warning',
        'Uncertain': 'info'
      };
      return typeMap[this.speciesData.Status] || '';
    },

    // 提交表单
    async submitForm() {
      // 验证表单
      const valid = await new Promise(resolve => {
        this.$refs.speciesForm.validate(resolve);
      });

      if (!valid) {
        this.$message.error('Please correct the form errors');
        return;
      }

      // 检查是否存在重复
      if (await this.checkDuplicateSpecies()) {
        return;
      }

      this.submitting = true;
      try {
        // 生成 FullName
        this.speciesData.FullName = this.generateFullName();

        // 触发提交事件
        this.$emit('submit', this.speciesData);
      } catch (error) {
        this.$message.error('Failed to create species');
        console.error(error);
      } finally {
        this.submitting = false;
      }
    },

    // 检查重复物种
    async checkDuplicateSpecies() {
      try {
        const response = await this.$api.checkSpeciesExists({
          genus: this.speciesData.Genus,
          species: this.speciesData.Species,
          subspecies: this.speciesData.Subspecies
        });

        if (response.code === 20000 && response.data.exists) {
          const result = await this.$confirm(
            `A species with name "${this.generateFullName()}" already exists. Do you want to proceed anyway?`,
            'Duplicate Species',
            { type: 'warning' }
          );
          return !result;
        }
      } catch (error) {
        console.error('Error checking for duplicate species:', error);
      }
      return false;
    },

    // 重置表单
    resetForm() {
      this.$refs.speciesForm.resetFields();
      if (this.verbatimData) {
        this.prefillFromVerbatim();
      }
    },

    // 取消表单
    cancelForm() {
      this.$emit('cancel');
    }
  }
};
</script>

<style scoped>
.create-species-form {
  max-width: 800px;
  margin: 0 auto;
}

.verbatim-info {
  margin-bottom: 20px;
}

.form-section {
  margin-bottom: 20px;
}

.form-section .el-card__header {
  font-weight: 500;
  color: #333;
}

.full-name-preview {
  padding: 15px;
  background: #f8f9fa;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.full-name {
  font-size: 18px;
  font-weight: 500;
  font-style: italic;
  color: #333;
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

.w-full {
  width: 100%;
}

/* 表单样式增强 */
.el-form-item {
  margin-bottom: 18px;
}

.el-form-item__label {
  font-weight: 500;
  color: #333;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .create-species-form {
    padding: 10px;
  }
}
</style>
