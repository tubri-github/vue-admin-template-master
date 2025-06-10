<!--
  CreateSpeciesForm.vue
  创建新物种表单组件 - 更新版本
-->
<template>
  <div class="create-species-form">
    <!-- Verbatim 数据提示 -->
    <el-alert
      v-if="verbatimData"
      type="info"
      :closable="false"
      class="verbatim-info"
    >
      <div slot="title" class="verbatim-title">
        <i class="el-icon-document" />
        Based on verbatim data:
      </div>
      <div class="verbatim-details">
        <div class="verbatim-item">
          <span class="verbatim-label">Family:</span>
          <span class="verbatim-value">{{ verbatimData.family || 'Not specified' }}</span>
        </div>
        <div class="verbatim-item">
          <span class="verbatim-label">Genus:</span>
          <span class="verbatim-value">{{ verbatimData.genus || 'Not specified' }}</span>
        </div>
        <div class="verbatim-item">
          <span class="verbatim-label">Species:</span>
          <span class="verbatim-value">{{ verbatimData.species || 'Not specified' }}</span>
        </div>
      </div>
    </el-alert>

    <el-form
      ref="speciesForm"
      :model="speciesData"
      :rules="formRules"
      label-width="140px"
    >

      <!-- 基础分类信息 -->
      <el-card class="form-section">
        <div slot="header">Taxonomic Information</div>

        <el-form-item label="Family" prop="familyID">
          <el-select
            v-model="speciesData.familyID"
            placeholder="Please search family name"
            filterable
            remote
            clearable
            class="w-full"
            :remote-method="(query) => remoteMethod(query, 'family')"
            :loading="remoteLoading"
            no-match-text="No matched results found."
          >
            <el-option
              v-for="item in familyOptions"
              :key="item.FamilyID"
              :label="item.FamilyName"
              :value="item.FamilyID"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="Genus" prop="Genus">
          <el-input
            v-model="speciesData.Genus"
            placeholder="e.g., Cyprinus"
            @input="updateFullName"
          />
        </el-form-item>

        <el-form-item label="Species" prop="Species">
          <el-input
            v-model="speciesData.Species"
            placeholder="e.g., carpio"
            @input="updateFullName"
          />
        </el-form-item>

        <el-form-item label="Subspecies">
          <el-input
            v-model="speciesData.Subspecies"
            placeholder="Optional subspecies"
            @input="updateFullName"
          />
        </el-form-item>

        <el-form-item label="Remarks">
          <el-input
            v-model="speciesData.Remarks"
            type="textarea"
            :rows="3"
            placeholder="Additional notes about this species"
          />
        </el-form-item>
      </el-card>

      <!-- 预览生成的全名 -->
      <el-card class="form-section">
        <div slot="header">Generated Full Scientific Name</div>
        <div class="full-name-preview">
          <el-input
            v-model="speciesData.FullScientificName"
            placeholder="Full scientific name will be generated automatically"
            readonly
            class="full-name-input"
          />
        </div>
      </el-card>

      <!-- 表单操作 -->
      <div class="form-actions">
        <el-button @click="cancelForm">Cancel</el-button>
        <el-button @click="resetForm">Reset</el-button>
        <el-button
          type="primary"
          :loading="submitting"
          @click="submitForm"
        >
          Create Species
        </el-button>
      </div>
    </el-form>
  </div>
</template>

<script>
import _ from 'lodash'
import { getFamily } from '@/api/table'

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
        familyID: '',
        Genus: '',
        Species: '',
        Subspecies: '',
        Remarks: '',
        FullScientificName: ''
      },

      // Family 选项
      familyOptions: [],
      remoteLoading: false,
      keyWord: '',

      // 表单验证规则
      formRules: {
        familyID: [
          { required: true, message: 'Family is required', trigger: 'change' }
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
        ]
      }
    }
  },
  computed: {
    queryParams() {
      return {
        pageSize: -1, // query all data
        pageNumber: 1,
        keyWord: this.keyWord
      }
    }
  },
  created() {
    // 如果有 verbatim 数据，预填充表单
    if (this.verbatimData) {
      this.prefillFromVerbatim()
    }
  },
  methods: {
    // 从 verbatim 数据预填充表单
    prefillFromVerbatim() {
      if (this.verbatimData.genus) {
        this.speciesData.Genus = this.capitalizeFirst(this.verbatimData.genus)
      }
      if (this.verbatimData.species) {
        this.speciesData.Species = this.verbatimData.species.toLowerCase()
      }

      // 更新全名
      this.updateFullName()
    },

    // 首字母大写
    capitalizeFirst(str) {
      if (!str) return ''
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
    },

    // 更新全名
    updateFullName() {
      let fullName = ''

      if (this.speciesData.Genus) {
        fullName += this.speciesData.Genus
      }

      if (this.speciesData.Species) {
        fullName += (fullName ? ' ' : '') + this.speciesData.Species
      }

      if (this.speciesData.Subspecies) {
        fullName += ' ' + this.speciesData.Subspecies
      }

      this.speciesData.FullScientificName = fullName
    },

    // 远程搜索方法
    remoteMethod(searchKey, type) {
      if (searchKey !== '') {
        this.remoteLoading = true
        this.keyWord = searchKey
        this.getRemote(type)
      } else {
        this.familyOptions = []
      }
    },

    // 防抖的远程搜索
    getRemote: _.debounce(function(type) {
      if (type === 'family') {
        this.getFamilyList(this.queryParams)
      }
    }, 300),

    // 获取 Family 列表
    async getFamilyList(params) {
      try {
        const response = await getFamily(params)
        this.familyOptions = []
        response.data.items.forEach((item) => {
          this.familyOptions.push({
            FamilyName: item.FamilyName,
            FamilyID: item.FamilyID
          })
        })
        this.remoteLoading = false
      } catch (error) {
        console.error('Error fetching family data:', error)
        this.$message.error('Failed to load family data')
        this.remoteLoading = false
      }
    },

    // 提交表单
    async submitForm() {
      // 验证表单
      const valid = await new Promise(resolve => {
        this.$refs.speciesForm.validate(resolve)
      })

      if (!valid) {
        this.$message.error('Please correct the form errors')
        return
      }

      // 检查是否存在重复
      if (await this.checkDuplicateSpecies()) {
        return
      }

      this.submitting = true
      try {
        // 准备提交数据，映射到后端期望的格式
        const submitData = {
          genus: this.speciesData.Genus,
          species: this.speciesData.Species,
          subspecies: this.speciesData.Subspecies || null,
          remarks: this.speciesData.Remarks || null,
          fullScientificName: this.speciesData.FullScientificName,
          familyID: this.speciesData.familyID
        }

        // 触发提交事件，传递格式化的数据
        this.$emit('submit', submitData)
      } catch (error) {
        this.$message.error('Failed to create species')
        console.error(error)
      } finally {
        this.submitting = false
      }
    },

    // 检查重复物种
    async checkDuplicateSpecies() {
      try {
        // 如果有检查重复的API，在这里调用
        // const response = await this.$api.checkSpeciesExists({
        //   genus: this.speciesData.Genus,
        //   species: this.speciesData.Species,
        //   subspecies: this.speciesData.Subspecies
        // });

        // if (response.code === 20000 && response.data.exists) {
        //   const result = await this.$confirm(
        //     `A species with name "${this.speciesData.FullScientificName}" already exists. Do you want to proceed anyway?`,
        //     'Duplicate Species',
        //     { type: 'warning' }
        //   );
        //   return !result;
        // }
      } catch (error) {
        console.error('Error checking for duplicate species:', error)
      }
      return false
    },

    // 重置表单
    resetForm() {
      this.$refs.speciesForm.resetFields()
      if (this.verbatimData) {
        this.prefillFromVerbatim()
      }
    },

    // 取消表单
    cancelForm() {
      this.$emit('cancel')
    }
  }
}
</script>

<style scoped>
.create-species-form {
  max-width: 600px;
  margin: 0 auto;
}

.verbatim-info {
  margin-bottom: 20px;
  border: 2px solid #409EFF;
}

.verbatim-title {
  font-weight: 600;
  font-size: 16px;
  color: #409EFF;
  margin-bottom: 15px;
}

.verbatim-title i {
  margin-right: 8px;
}

.verbatim-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
}

.verbatim-item {
  background: white;
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid #e0f2fe;
}

.verbatim-label {
  font-weight: 500;
  color: #666;
  font-size: 12px;
  display: block;
  margin-bottom: 4px;
}

.verbatim-value {
  color: #333;
  font-style: italic;
  font-size: 14px;
  font-weight: 500;
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
}

.full-name-input .el-input__inner {
  background: white;
  font-weight: 500;
  font-style: italic;
  font-size: 16px;
  color: #1976d2;
  text-align: center;
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

  .verbatim-details {
    grid-template-columns: 1fr;
  }
}
</style>
