<!--
  RecordEditorDialog.vue
  单条记录编辑对话框 - 支持完整验证状态
-->
<template>
  <el-dialog
    :title="getDialogTitle()"
    :visible="visible"
    :before-close="handleClose"
    width="90%"
    top="5vh"
    class="record-editor-dialog"
  >

    <div class="editor-container">
      <!-- 未保存变动提示条 -->
      <el-alert
        v-if="hasAnyChanges"
        title="You have unsaved changes"
        type="warning"
        :description="getChangesDescription()"
        show-icon
        :closable="false"
        class="changes-alert">
      </el-alert>
      
      <!-- 标签页切换 -->
      <el-tabs v-model="activeTab" class="editor-tabs">

        <!-- 物种验证标签 -->
        <el-tab-pane name="species">
          <span slot="label">
            <i class="el-icon-search" />
            Species Verification
            <el-tag
              v-if="hasSpeciesChanges"
              type="warning"
              size="mini"
              class="ml-2 changes-indicator"
            >
              UNSAVED
            </el-tag>
            <el-tag
              v-else-if="localRecord.speciesVerificationStatus === 'verified'"
              type="success"
              size="mini"
              class="ml-2"
            >
              ✓
            </el-tag>
            <el-tag
              v-else
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
            :family-only="familyOnly"
            :manually-created-family="manuallyCreatedFamily"
            @species-selected="handleSpeciesSelected"
            @species-saved="handleSpeciesSaved"
            @fix-family="$emit('fix-family', $event)"
            @create-new-species="handleCreateNewSpecies"
            @family-created="handleFamilyCreated"
            @manually-created-family-cancel="handleManuallyCreatedFamilyCancel"
          />
        </el-tab-pane>

        <!-- 地点验证标签 -->
        <el-tab-pane name="locality">
          <span slot="label">
            <i class="el-icon-location" />
            Locality Verification
            <el-tag
              v-if="hasLocalityChanges"
              type="warning"
              size="mini"
              class="ml-2 changes-indicator"
            >
              UNSAVED
            </el-tag>
            <el-tag
              v-else-if="localRecord.localityVerificationStatus === 'verified'"
              type="success"
              size="mini"
              class="ml-2"
            >
              ✓
            </el-tag>
            <el-tag
              v-else
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
              type="warning"
              size="mini"
              class="ml-2 changes-indicator"
            >
              UNSAVED
            </el-tag>
            <el-tag
              v-else-if="localRecord.recordVerificationStatus === 'verified'"
              type="success"
              size="mini"
              class="ml-2"
            >
              ✓
            </el-tag>
            <el-tag
              v-else
              type="warning"
              size="mini"
              class="ml-2"
            >
              !
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
          :type="hasAnyChanges ? 'warning' : 'primary'"
          :loading="saving"
          :disabled="!hasAnyChanges"
          :class="{ 'pulse-button': hasAnyChanges }"
          @click="saveRecord"
        >
          <i class="el-icon-check" />
          {{ hasAnyChanges ? 'Save Changes!' : 'Save Changes' }}
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
      familyOnly: null,
      manuallyCreatedFamily: null,  // 用户从 SpeciesVerification 加的新 family，独立于 familyOnly
      saving: false,
      hasLoaded: false
    }
  },
  computed: {
    hasSpeciesChanges() {
      return this.localRecord.taxonId !== this.originalRecord.taxonId ||
        this.localRecord.speciesVerificationStatus !== this.originalRecord.speciesVerificationStatus
    },

    hasLocalityChanges() {
      return this.localRecord.localityId !== this.originalRecord.localityId ||
        this.localRecord.localityVerificationStatus !== this.originalRecord.localityVerificationStatus
    },

    hasRecordChanges() {
      const recordFields = [
        'collectionDate', 'fieldNumber', 'totalNumber',
        'storage', 'jarSize', 'prevNumber', 'inventory', 'remarks', 'recordVerificationStatus'
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

          // 验证状态信息 - 从API数据中获取
          speciesVerificationStatus: this.getInitialSpeciesStatus(),
          localityVerificationStatus: this.getInitialLocalityStatus(),
          recordVerificationStatus: this.getInitialRecordStatus(),

          // 验证警告信息 - 传递给子组件显示
          verificationInfo: this.record.verificationInfo,

          processingStatus: this.record.processingStatus,
          _apiData: apiRecord
        }

        // 提取 verbatim 数据
        if (this.record._apiData && this.record._apiData.verbatim_data) {
          this.verbatimTaxonomic = this.record._apiData.verbatim_data.taxonomic
          this.verbatimLocality = this.record._apiData.verbatim_data.locality
        } else if (this.record.verbatimData) {
          this.verbatimTaxonomic = this.record.verbatimData.taxonomic
          this.verbatimLocality = this.record.verbatimData.locality
        } else {
          this.verbatimTaxonomic = this.record.verbatimTaxonomic
          this.verbatimLocality = this.record.verbatimLocality
        }

        // 提取匹配建议信息
        this.matchSuggestions = this.record.matchSuggestions
        this.familyOnly = this.record.familyOnly || null

        // 保存原始记录用于变更追踪
        this.originalRecord = { ...this.localRecord }

        console.log('Record Editor Loaded with verification status:', {
          localRecord: this.localRecord,
          verbatimTaxonomic: this.verbatimTaxonomic,
          verbatimLocality: this.verbatimLocality,
          matchSuggestions: this.matchSuggestions
        })

        this.hasLoaded = true
      } catch (error) {
        this.$message.error('Failed to load record data')
        console.error(error)
      }
    },

    // 获取初始验证状态的辅助方法
    getInitialSpeciesStatus() {
      console.log('getInitialSpeciesStatus - verificationInfo:', this.record.verificationInfo);
      console.log('getInitialSpeciesStatus - verificationInfo.species:', this.record.verificationInfo?.species);

      // 优先使用 verification_info 中的状态
      if (this.record.verificationInfo?.species?.status) {
        console.log('✓ Using verificationInfo.species.status:', this.record.verificationInfo.species.status);
        return this.record.verificationInfo.species.status;
      }

      // 其次使用 processingStatus
      if (this.record.processingStatus?.taxonomic) {
        const status = this.record.processingStatus.taxonomic === 'processed' ? 'verified' : 'pending';
        console.log('✓ Using processingStatus.taxonomic:', this.record.processingStatus.taxonomic, '→', status);
        return status;
      }

      // 最后根据是否有 taxonId 判断
      const fallback = this.record.taxonId ? 'verified' : 'pending';
      console.log('✓ Using fallback based on taxonId:', this.record.taxonId, '→', fallback);
      return fallback;
    },

    getInitialLocalityStatus() {
      console.log('getInitialLocalityStatus - verificationInfo:', this.record.verificationInfo);
      console.log('getInitialLocalityStatus - verificationInfo.locality:', this.record.verificationInfo?.locality);

      // 优先使用 verification_info 中的状态
      if (this.record.verificationInfo?.locality?.status) {
        console.log('✓ Using verificationInfo.locality.status:', this.record.verificationInfo.locality.status);
        return this.record.verificationInfo.locality.status;
      }

      // 其次使用 processingStatus
      if (this.record.processingStatus?.locality) {
        const status = this.record.processingStatus.locality === 'processed' ? 'verified' : 'pending';
        console.log('✓ Using processingStatus.locality:', this.record.processingStatus.locality, '→', status);
        return status;
      }

      // 最后根据是否有 localityId 判断
      const fallback = this.record.localityId ? 'verified' : 'pending';
      console.log('✓ Using fallback based on localityId:', this.record.localityId, '→', fallback);
      return fallback;
    },

    getInitialRecordStatus() {
      console.log('getInitialRecordStatus - verificationInfo:', this.record.verificationInfo);
      console.log('getInitialRecordStatus - verificationInfo.record:', this.record.verificationInfo?.record);

      // 优先使用 verification_info 中的状态
      if (this.record.verificationInfo?.record?.status) {
        console.log('✓ Using verificationInfo.record.status:', this.record.verificationInfo.record.status);
        return this.record.verificationInfo.record.status;
      }

      // 其次使用 processingStatus
      if (this.record.processingStatus?.record) {
        console.log('✓ Using processingStatus.record:', this.record.processingStatus.record);
        return this.record.processingStatus.record;
      }

      // 默认 pending (保持一致性)
      console.log('✓ Using default: pending');
      return 'pending';
    },

    // 处理物种选择
    handleSpeciesSelected(taxon) {
      // 处理清除匹配的情况
      if (!taxon.TaxonID || taxon.TaxonID === null) {
        console.log('Clearing species match')
        this.localRecord.taxonId = null
        this.localRecord.taxonomic = null
        this.localRecord.speciesVerificationStatus = 'pending'
        console.log('Species match cleared, status set to pending')
        return
      }

      this.localRecord.taxonId = taxon.TaxonID
      this.localRecord.taxonomic = {
        TaxonID: taxon.TaxonID,
        FullName: taxon.FullName,
        Family: taxon.Family,
        Genus: taxon.Genus,
        Species: taxon.Species,
        Author: taxon.Author
      }
      // 自动设置species验证状态为verified
      this.localRecord.speciesVerificationStatus = 'verified'
      this.$message.success(`Species matched: ${taxon.FullName}`)
    },

    // 物种 Apply / Cancel 已直接持久化：同步 localRecord 和 originalRecord，向上抛事件
    handleSpeciesSaved(payload) {
      const taxon = payload.taxonomic
      if (taxon && taxon.TaxonID) {
        this.localRecord.taxonId = taxon.TaxonID
        this.localRecord.taxonomic = { ...taxon }
      } else {
        this.localRecord.taxonId = null
        this.localRecord.taxonomic = null
      }
      this.localRecord.speciesVerificationStatus = payload.speciesVerificationStatus

      // 同步 originalRecord，让 hasSpeciesChanges 重置为 false（不会再提示"未保存"）
      this.originalRecord = { ...this.originalRecord, ...this.localRecord }

      // 通知父组件（VerbatimWorkspace）刷新行 + 统计
      this.$emit('partial-saved', {
        recordId: this.localRecord.id,
        taxonomic: this.localRecord.taxonomic,
        taxonId: this.localRecord.taxonId,
        speciesVerificationStatus: this.localRecord.speciesVerificationStatus
      })
    },

    // 用户在 Species Verification 创建了新 Family。
    // 不动 familyOnly（那是 verbatim 自动匹配的，需要保留作为对照），
    // 单独存到 manuallyCreatedFamily，子组件渲染独立的"Newly Created"卡。
    // 这样 reviewer 能同时看见两条线索：自动匹配的 vs 自己加的。
    handleFamilyCreated({ familyId, familyName }) {
      this.manuallyCreatedFamily = {
        familyId,
        familyName
      }
    },

    // 用户取消新建 family 卡（清掉，不会影响 verbatim suggestion 卡）
    handleManuallyCreatedFamilyCancel() {
      this.manuallyCreatedFamily = null
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
      console.log('Received locality data:', locality)

      const localityId = locality.LocalityID || locality.Locality1ID

      // 处理清除匹配的情况
      if (!localityId || localityId === null) {
        console.log('Clearing locality match')
        this.localRecord.localityId = null
        this.localRecord.locality = null
        this.localRecord.localityVerificationStatus = 'pending'
        console.log('Locality match cleared, status set to pending')
        return
      }

      this.localRecord.localityId = localityId
      this.localRecord.locality = {
        LocalityID: localityId,
        Locality1ID: localityId,
        LocalityString: locality.LocalityString,
        FieldNo: locality.FieldNo,
        Country: locality.Country,
        State: locality.State,
        County: locality.County,
        Drainage: locality.Drainage,
        WaterBody: locality.WaterBody,
        Lat: locality.Lat,
        Lon: locality.Lon
      }

      // 自动设置locality验证状态为verified
      this.localRecord.localityVerificationStatus = 'verified'

      console.log('Updated localRecord.localityId:', this.localRecord.localityId)
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
      console.log('Record updated with fields:', updatedFields)
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

          // 基本字段更新
          taxon_id: this.localRecord.taxonId,
          locality_id: this.localRecord.localityId,
          collection_date: this.localRecord.collectionDate,
          total_number: this.localRecord.totalNumber,
          storage: this.localRecord.storage,
          jar_size: this.localRecord.jarSize,
          prev_number: this.localRecord.prevNumber,
          inventory: this.localRecord.inventory,
          type_status: this.localRecord.typeStatus,
          collector_name: this.localRecord.collector,
          remarks: this.localRecord.remarks,

          // 验证状态更新 - 确保包含所有三个状态
          species_verification_status: this.getSpeciesVerificationStatus(),
          locality_verification_status: this.getLocalityVerificationStatus(),
          record_verification_status: this.getRecordVerificationStatus(),
          verification_notes: this.getVerificationNotes()
        }

        console.log('Saving record with complete data:', updateData)

        // 发出保存事件给父组件
        this.$emit('save', updateData)
      } catch (error) {
        this.$message.error('Failed to save record')
        console.error(error)
      } finally {
        this.saving = false
      }
    },

    // 获取各个tab的验证状态
    getSpeciesVerificationStatus() {
      // 优先使用用户在species tab中设置的状态
      if (this.localRecord.speciesVerificationStatus) {
        return this.localRecord.speciesVerificationStatus
      }

      // 否则基于数据状态判断
      if (this.localRecord.taxonId) {
        return 'verified'
      } else if (this.localRecord.verbatimTaxonomicId) {
        return 'needs_review'
      }
      return 'pending'
    },

    getLocalityVerificationStatus() {
      // 优先使用用户在locality tab中设置的状态
      if (this.localRecord.localityVerificationStatus) {
        return this.localRecord.localityVerificationStatus
      }

      // 否则基于数据状态判断
      if (this.localRecord.localityId) {
        return 'verified'
      } else if (this.localRecord.verbatimLocalityId) {
        return 'needs_review'
      }
      return 'pending'
    },

    getRecordVerificationStatus() {
      // 优先使用用户在record tab中设置的状态
      if (this.localRecord.recordVerificationStatus) {
        return this.localRecord.recordVerificationStatus
      }

      // 否则检查记录的基本信息是否完整
      const hasBasicInfo = this.localRecord.totalNumber &&
        this.localRecord.totalNumber > 0
      return hasBasicInfo ? 'verified' : 'pending'
    },

    getVerificationNotes() {
      const notes = []

      if (this.hasSpeciesChanges) {
        notes.push('Species information updated')
      }
      if (this.hasLocalityChanges) {
        notes.push('Locality information updated')
      }
      if (this.hasRecordChanges) {
        notes.push('Record details updated')
      }

      return notes.join('; ')
    },

    // 获取对话框标题
    getDialogTitle() {
      return `Edit Record: ${this.record.catalogNumber}`;
    },

    // 获取变动描述
    getChangesDescription() {
      const changes = []
      if (this.hasSpeciesChanges) {
        changes.push('Species verification')
      }
      if (this.hasLocalityChanges) {
        changes.push('Locality verification')
      }
      if (this.hasRecordChanges) {
        changes.push('Record details')
      }
      
      if (changes.length === 1) {
        return `${changes[0]} has been modified. Don't forget to save your changes!`
      } else if (changes.length === 2) {
        return `${changes.join(' and ')} have been modified. Don't forget to save your changes!`
      } else {
        return `${changes.slice(0, -1).join(', ')}, and ${changes[changes.length - 1]} have been modified. Don't forget to save your changes!`
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

/* 变动提示条 */
.changes-alert {
  margin-bottom: 15px;
  border-radius: 6px;
}

/* 未保存变动的警告样式 */
.changes-indicator {
  animation: subtle-pulse 2s infinite;
  font-weight: bold !important;
}

/* 保存按钮的脉冲动画 */
.pulse-button {
  animation: button-pulse 1.5s infinite;
  font-weight: bold !important;
}

@keyframes subtle-pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}

@keyframes button-pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(245, 108, 108, 0.4);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(245, 108, 108, 0);
  }
}
</style>
