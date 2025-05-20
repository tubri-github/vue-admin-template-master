<!--
  RecordEditorDialog.vue
  单条记录编辑对话框 - 包含物种验证、地点验证和记录编辑三个区域
-->
<template>
  <el-dialog
    :title="`Edit Record: ${record.catalogNumber}`"
    :visible="visible"
    :before-close="handleClose"
    width="90%"
    top="5vh"
    class="record-editor-dialog">

    <div class="editor-container">
      <!-- 标签页切换 -->
      <el-tabs v-model="activeTab" class="editor-tabs">

        <!-- 物种验证标签 -->
        <el-tab-pane name="species">
          <span slot="label">
            <i class="el-icon-search"></i>
            Species Verification
            <el-tag
              v-if="localRecord.taxonId"
              type="success"
              size="mini"
              class="ml-2">
              ✓
            </el-tag>
            <el-tag
              v-else-if="localRecord.verbatimTaxonomicId"
              type="warning"
              size="mini"
              class="ml-2">
              !
            </el-tag>
          </span>

          <!-- 物种验证内容 -->
          <species-verification
            :record="localRecord"
            :verbatim-data="verbatimTaxonomic"
            @species-selected="handleSpeciesSelected"
            @create-new-species="handleCreateNewSpecies"
          />
        </el-tab-pane>

        <!-- 地点验证标签 -->
        <el-tab-pane name="locality">
          <span slot="label">
            <i class="el-icon-location"></i>
            Locality Verification
            <el-tag
              v-if="localRecord.localityId"
              type="success"
              size="mini"
              class="ml-2">
              ✓
            </el-tag>
            <el-tag
              v-else-if="localRecord.verbatimLocalityId"
              type="warning"
              size="mini"
              class="ml-2">
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
            <i class="el-icon-edit"></i>
            Record Details
            <el-tag
              v-if="hasRecordChanges"
              type="info"
              size="mini"
              class="ml-2">
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
        <el-button @click="resetChanges" :disabled="!hasAnyChanges">
          <i class="el-icon-refresh"></i>
          Reset Changes
        </el-button>
      </div>

      <div class="footer-right">
        <el-button @click="handleClose">
          Cancel
        </el-button>
        <el-button
          type="primary"
          @click="saveRecord"
          :loading="saving"
          :disabled="!hasAnyChanges">
          <i class="el-icon-check"></i>
          Save Changes
        </el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script>
import SpeciesVerification from '@/components/RecordsProcessor/SpeciesVerification';
import LocalityVerification from '@/components/RecordsProcessor/LocalityVerification';
import RecordDetailsEditor from '@/components/RecordsProcessor/RecordDetailsEditor';

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
      saving: false,
      hasLoaded: false
    }
  },
  computed: {
    hasSpeciesChanges() {
      return this.localRecord.taxonId !== this.originalRecord.taxonId;
    },

    hasLocalityChanges() {
      return this.localRecord.localityId !== this.originalRecord.localityId;
    },

    hasRecordChanges() {
      const recordFields = [
        'collectionDate', 'fieldNumber', 'totalNumber',
        'storage', 'jarSize', 'prevNumber', 'inventory', 'remarks'
      ];

      return recordFields.some(field =>
        this.localRecord[field] !== this.originalRecord[field]
      );
    },

    hasAnyChanges() {
      return this.hasSpeciesChanges || this.hasLocalityChanges || this.hasRecordChanges;
    }
  },
  watch: {
    visible: {
      immediate: true,
      async handler(newValue) {
        if (newValue && !this.hasLoaded) {
          await this.loadRecordData();
        }
      }
    }
  },
  methods: {
    // 加载记录详细数据
// 加载记录详细数据
    async loadRecordData() {
      try {
        // Use either the already-transformed data or the original API data
        const apiRecord = this.record._apiData || this.record;

        this.localRecord = {
          id: this.record.id,
          catalogNumber: this.record.catalogNumber,

          // Use the pre-mapped properties if they exist
          taxonId: this.record.taxonId,
          verbatimTaxonomicId: this.record.verbatimTaxonomicId,
          localityId: this.record.localityId,
          verbatimLocalityId: this.record.verbatimLocalityId,

          // Record details - use pre-mapped if they exist
          fieldNumber: this.record.fieldNumber,
          collectionDate: this.record.collectionDate,
          totalNumber: this.record.totalNumber || 1,
          storage: this.record.storage,
          jarSize: this.record.jarSize,
          prevNumber: this.record.prevNumber,
          inventory: this.record.inventory,
          remarks: this.record.remarks,

          // Taxonomy and locality objects
          taxonomic: this.record.taxonomic,
          locality: this.record.locality,

          // Processing status
          processingStatus: this.record.processingStatus,

          // Store reference to original data
          _apiData: apiRecord
        };

        // Make a copy for tracking changes
        this.originalRecord = { ...this.localRecord };

        // Set verbatim data directly
        this.verbatimTaxonomic = this.record.verbatimTaxonomic;
        this.verbatimLocality = this.record.verbatimLocality;

        // Log for debugging
        console.log('Record Editor Data:', {
          original: this.record,
          local: this.localRecord
        });

        this.hasLoaded = true;
      } catch (error) {
        this.$message.error('Failed to load record data');
        console.error(error);
      }
    },

    // 处理物种选择
    handleSpeciesSelected(taxon) {
      this.localRecord.taxonId = taxon.TaxonID;
      this.localRecord.taxonomic = taxon;
      this.$message.success(`Species matched: ${taxon.FullName}`);
    },

    // 处理创建新物种
    async handleCreateNewSpecies(speciesData) {
      try {
        const response = await this.$api.createTaxonomic(speciesData);
        if (response.code === 20000) {
          this.handleSpeciesSelected(response.data);
          this.$message.success('New species created and matched');
        }
      } catch (error) {
        this.$message.error('Failed to create new species');
        console.error(error);
      }
    },

    // 处理地点选择
    handleLocalitySelected(locality) {
      this.localRecord.localityId = locality.LocalityID;
      this.localRecord.locality = locality;
      this.$message.success(`Locality matched: ${locality.LocalityName}`);
    },

    // 处理创建新地点
    async handleCreateNewLocality(localityData) {
      try {
        const response = await this.$api.createLocality(localityData);
        if (response.code === 20000) {
          this.handleLocalitySelected(response.data);
          this.$message.success('New locality created and matched');
        }
      } catch (error) {
        this.$message.error('Failed to create new locality');
        console.error(error);
      }
    },

    // 处理记录字段更新
    handleRecordUpdated(updatedFields) {
      Object.assign(this.localRecord, updatedFields);
    },

    // 重置更改
    resetChanges() {
      this.localRecord = { ...this.originalRecord };
      this.$message.info('Changes reset');
    },

    // 保存记录 - Prepare the record for API submission
    async saveRecord() {
      this.saving = true;
      try {
        // Transform the record back to the API format
        const apiRecord = {
          id: this.localRecord.id,
          taxonomic_id: this.localRecord.taxonId,
          locality_id: this.localRecord.locality1Id,
          record_data: {
            total_number: this.localRecord.totalNumber,
            storage: this.localRecord.storage,
            jar_size: this.localRecord.jarSize,
            prev_number: this.localRecord.prevNumber,
            inventory: this.localRecord.inventory,
            remarks: this.localRecord.remarks
          },
          locality_data: {
            collection_date: this.localRecord.collectionDate,
            field_number: this.localRecord.fieldNumber
          }
        };

        // Emit the transformed record for the parent to save
        this.$emit('save', apiRecord);
      } catch (error) {
        this.$message.error('Failed to save record');
        console.error(error);
      } finally {
        this.saving = false;
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
          );
        } catch {
          return; // 用户取消关闭
        }
      }

      this.hasLoaded = false;
      this.$emit('close');
    }
  }
};
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
