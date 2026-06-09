<template>
  <div class="label-sheet">
    <!-- 每张标签 = 一页，外面一圈虚线框 = 每页 border = 裁切线（沿框裁） -->
    <div v-for="(it, i) in items" :key="i" class="label-page">
      <SpecimenLabel :item="it" />
    </div>
  </div>
</template>

<script>
import SpecimenLabel from '@/components/SpecimenLabel'

export default {
  name: 'LabelSheet',
  components: { SpecimenLabel },
  props: {
    items: { type: Array, default: () => [] }
  }
}
</script>

<style scoped>
.label-page {
  border: 1px dashed #000;     /* 每页边框 = 裁切线，撑满整页 → 落在纸张边缘 */
  padding: 10px 14px;
  box-sizing: border-box;
  min-height: 100vh;
  page-break-after: always;
}
</style>