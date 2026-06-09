<template>
  <!-- 老版 lots 标签（字段同 utils/lotLabels.js 的 TULANE label）。表格 auto 列宽 → 下划线对齐 -->
  <table class="lot-label">
    <tr>
      <td class="lbl">Family No.</td><td class="val">{{ item.FamilyNumber }}</td>
      <td class="lbl">Cat. No.</td><td class="val">{{ item.CatalogNumber != null ? item.CatalogNumber : (item.identifier || '') }}</td>
    </tr>
    <tr>
      <td class="lbl">Sci. Name</td><td class="val ital" colspan="3">{{ item.FullScientificName }}</td>
    </tr>
    <tr>
      <td class="lbl">Drainage</td><td class="val">{{ item.Drainage }}</td>
      <td class="lbl">No. Spec.</td><td class="val">{{ item.TotalNumber }}</td>
    </tr>
    <tr>
      <td class="lbl">State</td><td class="val">{{ item.State || item.LocalityState }}</td>
      <td class="lbl">County</td><td class="val">{{ item.County || item.LocalityCounty }}</td>
    </tr>
    <tr>
      <td class="lbl">Locality</td><td class="val" colspan="3">{{ item.LocalityString }}</td>
    </tr>
    <tr>
      <td class="lbl">Date</td><td class="val">{{ item.VerbatimDate }}</td>
      <td class="lbl">Col. No</td><td class="val">{{ item.FieldNo }}</td>
    </tr>
    <tr>
      <td class="lbl">Col. by</td><td class="val" colspan="3">{{ item.VerbatimCollectors || '' }}</td>
    </tr>
  </table>
</template>

<script>
export default {
  name: 'SpecimenLabel',
  props: {
    item: { type: Object, default: () => ({}) }
  }
}
</script>

<style scoped>
.lot-label { width: 100%; border-collapse: collapse; font-size: 15px; color: #000; }
.lot-label td { padding: 3px 6px; vertical-align: bottom; }
/* 标签列：贴内容宽(auto)、加粗、不换行 → 值列起点对齐 */
.lot-label td.lbl { font-weight: bold; white-space: nowrap; width: 1%; }
/* 值列：底边线 = 下划线 */
.lot-label td.val { border-bottom: 1px solid #000; }
.lot-label td.ital { font-style: italic; }
</style>