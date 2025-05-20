<!--
  ModalDialog.vue
  Reusable modal dialog component
-->
<template>
  <div v-if="visible" class="modal-overlay">
    <div class="modal-container">
      <div class="modal-header">
        <h3 class="modal-title">{{ title }}</h3>
        <button class="modal-close" @click="close">
          <i class="el-icon-close" />
        </button>
      </div>

      <div class="modal-body">
        <slot />
      </div>

      <div class="modal-footer">
        <slot name="footer">
          <el-button @click="close">{{ cancelText }}</el-button>
          <el-button type="primary" @click="confirm">{{ confirmText }}</el-button>
        </slot>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ModalDialog',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: 'Dialog'
    },
    cancelText: {
      type: String,
      default: 'Cancel'
    },
    confirmText: {
      type: String,
      default: 'Confirm'
    }
  },
  methods: {
    close() {
      this.$emit('close')
    },
    confirm() {
      this.$emit('confirm')
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #ebeef5;
}

.modal-title {
  font-size: 18px;
  font-weight: 500;
  color: #303133;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #909399;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  padding: 10px 20px 16px;
  gap: 10px;
}
</style>
