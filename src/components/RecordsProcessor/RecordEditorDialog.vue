<!--
  RecordEditorDialog.vue
  单条记录编辑对话框 - 修复版本
-->
<template>
  <el-dialog
    :title="`Edit Record: ${record.catalogNumber}`"
    :visible="visible"
    :before-close="handleClose"
    width="90%"
    top="5vh"
    class="record-editor-dialog"
  >

    <div class="editor-container">
      <!-- 标签页切换 -->
      <el-tabs v-model="activeTab" class="editor-tabs">

        <!-- 物种验证标签 -->
        <el-tab-pane name="species">
          <span slot="label">
            <i class="el-icon-search" />
            Species Verification
            <el-tag
              v-if="localRecord.taxonId"
              type="success"
              size="mini"
              class="ml-2"
            >
              ✓
            </el-tag>
            <el-tag
              v-else-if="localRecord.verbatimTaxonomicId"
              type="warning"
              size="mini"
              class="ml-2"
            >
              !
            </el-tag>
          </span>

          <!-- 物种验证内容 -->
          <species-verification
            :record="localRecord"
            :verbatim-data="verbatimTaxonomic"
            :match-suggestions="matchSuggestions"
            @species-selected="handleSpeciesSelected"
            @create-new-species="handleCreateNewSpecies"
          />
        </el-tab-pane>

        <!-- 地点验证标签 -->
        <el-tab-pane name="locality">
          <span slot="label">
            <i class="el-icon-location" />
            Locality Verification
            <el-tag
              v-if="localRecord.localityId"
              type="success"
              size="mini"
              class="ml-2"
            >
              ✓
            </el-tag>
            <el-tag
              v-else-if="localRecord.verbatimLocalityId"
              type="warning"
              size="mini"
              class="ml-2"
            >
              !
            </el-tag>
          </span>

          <!-- 地点验证内容 -->
          <locality-verification
            :record="localRecord"
            :verbatim-data="verbatimLocality"
            @locality-selected="handleLocalitySelected"
            @create-new-locality="handleCreateNewLocality"
          />
        </el-tab-pane>

        <!-- 记录编辑标签 -->
        <el-tab-pane name="record">
          <span slot="label">
            <i class="el-icon-edit" />
            Record Details
            <el-tag
              v-if="hasRecordChanges"
              type="info"
              size="mini"
              class="ml-2"
            >
              *
            </el-tag>
          </span>

          <!-- 记录编辑内容 -->
          <record-details-editor
            :record="localRecord"
            @record-updated="handleRecordUpdated"
          />
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 对话框底部按钮 -->
    <div slot="footer" class="dialog-footer">
      <div class="footer-left">
        <el-button :disabled="!hasAnyChanges" @click="resetChanges">
          <i class="el-icon-refresh" />
          Reset Changes
        </el-button>
      </div>

      <div class="footer-right">
        <el-button @click="handleClose">
          Cancel
        </el-button>
        <el-button
          type="primary"
          :loading="saving"
          :disabled="!hasAnyChanges"
          @click="saveRecord"
        >
          <i class="el-icon-check" />
          Save Changes
        </el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script>
import SpeciesVerification from '@/components/RecordsProcessor/SpeciesVerification'
import LocalityVerification from '@/components/RecordsProcessor/LocalityVerification'
import RecordDetailsEditor from '@/components/RecordsProcessor/RecordDetailsEditor'

export default {
  name: 'RecordEditorDialog',
  components: {
    SpeciesVerification,
    LocalityVerification,
    RecordDetailsEditor
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    record: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      activeTab: 'species',
      localRecord: {},
      originalRecord: {},
      verbatimTaxonomic: null,
      verbatimLocality: null,
      matchSuggestions: null,
      saving: false,
      hasLoaded: false
    }
  },
  computed: {
    hasSpeciesChanges() {
      return this.localRecord.taxonId !== this.originalRecord.taxonId
    },

    hasLocalityChanges() {
      return this.localRecord.localityId !== this.originalRecord.localityId
    },

    hasRecordChanges() {
      const recordFields = [
        'collectionDate', 'fieldNumber', 'totalNumber',
        'storage', 'jarSize', 'prevNumber', 'inventory', 'remarks'
      ]

      return recordFields.some(field =>
        this.localRecord[field] !== this.originalRecord[field]
      )
    },

    hasAnyChanges() {
      return this.hasSpeciesChanges || this.hasLocalityChanges || this.hasRecordChanges
    }
  },
  watch: {
    visible: {
      immediate: true,
      async handler(newValue) {
        if (newValue && !this.hasLoaded) {
          await this.loadRecordData()
        }
      }
    }
  },
  methods: {
    // 加载记录详细数据
    async loadRecordData() {
      try {
        const apiRecord = this.record._apiData || this.record

        this.localRecord = {
          id: this.record.id,
          catalogNumber: this.record.catalogNumber,
          taxonId: this.record.taxonId,
          verbatimTaxonomicId: this.record.verbatimTaxonomicId,
          localityId: this.record.localityId,
          verbatimLocalityId: this.record.verbatimLocalityId,
          fieldNumber: this.record.fieldNumber,
          collectionDate: this.record.collectionDate,
          totalNumber: this.record.totalNumber || 1,
          storage: this.record.storage,
          jarSize: this.record.jarSize,
          prevNumber: this.record.prevNumber,
          inventory: this.record.inventory,
          remarks: this.record.remarks,
          // 当前匹配的物种和地点信息
          taxonomic: this.record.taxonomic,
          locality: this.record.locality,
          processingStatus: this.record.processingStatus,
          _apiData: apiRecord
        }

        // 修复：正确提取 verbatim 数据
        // 从 API 返回的数据结构中提取
        if (this.record._apiData && this.record._apiData.verbatim_data) {
          // 新的API数据结构
          this.verbatimTaxonomic = this.record._apiData.verbatim_data.taxonomic
          this.verbatimLocality = this.record._apiData.verbatim_data.locality
        } else if (this.record.verbatimData) {
          // 备选：如果数据在verbatimData中
          this.verbatimTaxonomic = this.record.verbatimData.taxonomic
          this.verbatimLocality = this.record.verbatimData.locality
        } else {
          // 兼容旧格式
          this.verbatimTaxonomic = this.record.verbatimTaxonomic
          this.verbatimLocality = this.record.verbatimLocality
        }

        // 提取匹配建议信息
        this.matchSuggestions = this.record.matchSuggestions

        // 保存原始记录用于变更追踪
        this.originalRecord = { ...this.localRecord }

        console.log('Record Editor Loaded:', {
          localRecord: this.localRecord,
          verbatimTaxonomic: this.verbatimTaxonomic,
          verbatimLocality: this.verbatimLocality,
          matchSuggestions: this.matchSuggestions,
          originalRecord: this.record
        })

        this.hasLoaded = true
      } catch (error) {
        this.$message.error('Failed to load record data')
        console.error(error)
      }
    },

    // 处理物种选择
    handleSpeciesSelected(taxon) {
      this.localRecord.taxonId = taxon.TaxonID
      this.localRecord.taxonomic = {
        TaxonID: taxon.TaxonID,
        FullName: taxon.FullName,
        Family: taxon.Family,
        Genus: taxon.Genus,
        Species: taxon.Species,
        Author: taxon.Author
      }
      this.$message.success(`Species matched: ${taxon.FullName}`)
    },

    // 处理创建新物种
    async handleCreateNewSpecies(speciesData) {
      try {
        const response = await this.$api.createTaxonomic(speciesData)
        if (response.code === 20000) {
          this.handleSpeciesSelected(response.data)
          this.$message.success('New species created and matched')
        }
      } catch (error) {
        this.$message.error('Failed to create new species')
        console.error(error)
      }
    },

    // 处理地点选择
    handleLocalitySelected(locality) {
      this.localRecord.localityId = locality.LocalityID
      this.localRecord.locality = locality
      this.$message.success(`Locality matched: ${locality.LocalityString}`)
    },

    // 处理创建新地点
    async handleCreateNewLocality(localityData) {
      try {
        const response = await this.$api.createLocality(localityData)
        if (response.code === 20000) {
          this.handleLocalitySelected(response.data)
          this.$message.success('New locality created and matched')
        }
      } catch (error) {
        this.$message.error('Failed to create new locality')
        console.error(error)
      }
    },

    // 处理记录字段更新
    handleRecordUpdated(updatedFields) {
      Object.assign(this.localRecord, updatedFields)
    },

    // 重置更改
    resetChanges() {
      this.localRecord = { ...this.originalRecord }
      this.$message.info('Changes reset')
    },

    // 保存记录
    async saveRecord() {
      this.saving = true
      try {
        // 准备API更新数据
        const updateData = {
          id: this.localRecord.id,
          taxon_id: this.localRecord.taxonId,
          locality_id: this.localRecord.localityId,
          collection_date: this.localRecord.collectionDate,
          total_number: this.localRecord.totalNumber,
          storage: this.localRecord.storage,
          jar_size: this.localRecord.jarSize,
          prev_number: this.localRecord.prevNumber,
          inventory: this.localRecord.inventory,
          remarks: this.localRecord.remarks,
          // 如果物种和地点都已匹配，取消审核标志
          review_flag: !(this.localRecord.taxonId && this.localRecord.localityId)
        }

        // 发出保存事件给父组件
        this.$emit('save', updateData)
      } catch (error) {
        this.$message.error('Failed to save record')
        console.error(error)
      } finally {
        this.saving = false
      }
    },

    // 处理关闭
    async handleClose() {
      if (this.hasAnyChanges) {
        try {
          await this.$confirm(
            'You have unsaved changes. Are you sure you want to close?',
            'Unsaved Changes',
            { type: 'warning' }
          )
        } catch {
          return // 用户取消关闭
        }
      }

      this.hasLoaded = false
      this.$emit('close')
    }
  }
}
</script>

<style scoped>
.record-editor-dialog .el-dialog {
  border-radius: 8px;
}

.record-editor-dialog .el-dialog__body {
  padding: 20px 30px;
  max-height: 70vh;
  overflow-y: auto;
}

.editor-container {
  min-height: 500px;
}

.editor-tabs {
  height: 100%;
}

.editor-tabs .el-tab-pane {
  height: 100%;
  overflow-y: auto;
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
}

.footer-left,
.footer-right {
  display: flex;
  gap: 10px;
}

.ml-2 {
  margin-left: 8px;
}
</style>
