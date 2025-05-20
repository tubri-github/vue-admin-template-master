<!--
  FieldNumberOptions.vue
  Component for handling field number processing options
-->
<template>
  <modal-dialog
    :visible="visible"
    title="Field Number Processing Options"
    cancel-text="Back"
    confirm-text="Confirm and Continue"
    @close="cancel"
    @confirm="confirm"
  >
    <p class="text-gray-600 mb-4">
      You've chosen to assign field numbers later. Please select a processing method:
    </p>

    <div class="space-y-3 mb-6">
      <el-radio v-model="selectedOption" label="batch-after">
        <div>
          <div class="font-medium">Batch Assign After Import</div>
          <div class="text-sm text-gray-500">
            Complete the data import first, then batch assign field numbers in the Field Number Management Center
          </div>
        </div>
      </el-radio>

      <el-radio v-model="selectedOption" label="auto-generate">
        <div>
          <div class="font-medium">Auto Generate Temporary Numbers</div>
          <div class="text-sm text-gray-500">
            System will auto-generate temporary field numbers based on locality and date, which can be modified later
          </div>
        </div>
      </el-radio>
    </div>
  </modal-dialog>
</template>

<script>
import ModalDialog from './ModalDialog.vue';

export default {
  name: 'FieldNumberOptions',
  components: {
    ModalDialog
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      selectedOption: 'batch-after'
    };
  },
  methods: {
    cancel() {
      this.$emit('cancel')
    },
    confirm() {
      if (!this.selectedOption) {
        this.$message.warning('Please select an option')
        return
      }
      this.$emit('confirm', this.selectedOption)
    }
  }
}
</script>

<style scoped>
.el-radio {
  display: flex;
  align-items: flex-start;
  margin: 0;
  padding: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  width: 100%;
  height: auto;
}

.el-radio + .el-radio {
  margin-left: 0;
}
</style>
