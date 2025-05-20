<!--
  StepIndicator.vue
  Component for displaying step progress indicator
-->
<template>
  <div class="step-indicator">
    <div class="steps-container">
      <div
        v-for="(step, index) in steps"
        :key="index"
        class="step-item"
        :class="{
          'current': index + 1 === currentStep,
          'completed': index + 1 < currentStep,
          'pending': index + 1 > currentStep
        }"
      >
        <div class="step-number">
          <span v-if="index + 1 < currentStep" class="step-check">
            <i class="el-icon-check"></i>
          </span>
          <span v-else class="step-digit">{{ index + 1 }}</span>
        </div>
        <div class="step-content">
          <div class="step-title">{{ step }}</div>
        </div>

        <!-- Connector line (not shown for last step) -->
        <div
          v-if="index < steps.length - 1"
          class="step-connector"
          :class="{
            'active': index + 1 < currentStep
          }"
        ></div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'StepIndicator',
  props: {
    steps: {
      type: Array,
      required: true,
      default: () => []
    },
    currentStep: {
      type: Number,
      required: true,
      default: 1
    }
  }
}
</script>

<style scoped>
.step-indicator {
  padding: 20px 0;
  margin-bottom: 20px;
}

.steps-container {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  min-width: 120px;
}

.step-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 8px;
  transition: all 0.3s ease;
  position: relative;
  z-index: 2;
}

/* Current step */
.step-item.current .step-number {
  background-color: #409eff;
  color: white;
  border: 2px solid #409eff;
}

/* Completed step */
.step-item.completed .step-number {
  background-color: #67c23a;
  color: white;
  border: 2px solid #67c23a;
}

/* Pending step */
.step-item.pending .step-number {
  background-color: #f5f7fa;
  color: #909399;
  border: 2px solid #dcdfe6;
}

.step-check {
  font-size: 16px;
  font-weight: bold;
}

.step-digit {
  font-size: 14px;
  font-weight: 600;
}

.step-content {
  text-align: center;
}

.step-title {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
  white-space: nowrap;
}

/* Current step title styling */
.step-item.current .step-title {
  color: #409eff;
  font-weight: 600;
}

/* Completed step title styling */
.step-item.completed .step-title {
  color: #67c23a;
  font-weight: 600;
}

/* Step connector line */
.step-connector {
  position: absolute;
  top: 16px;
  left: calc(50% + 16px);
  right: calc(-50% + 16px);
  height: 2px;
  background-color: #dcdfe6;
  transition: all 0.3s ease;
  z-index: 1;
}

.step-connector.active {
  background-color: #67c23a;
}

/* Responsive design */
@media (max-width: 768px) {
  .step-item {
    min-width: 80px;
  }

  .step-title {
    font-size: 12px;
  }

  .step-number {
    width: 28px;
    height: 28px;
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .steps-container {
    flex-direction: column;
    gap: 20px;
  }

  .step-connector {
    display: none;
  }

  .step-item {
    flex-direction: row;
    min-width: auto;
    width: 100%;
    justify-content: flex-start;
    gap: 12px;
  }

  .step-content {
    text-align: left;
  }

  .step-number {
    margin-bottom: 0;
  }
}
</style>
