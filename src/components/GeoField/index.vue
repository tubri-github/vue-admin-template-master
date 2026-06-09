<template>
  <el-autocomplete
    v-model="inner"
    :fetch-suggestions="fetch"
    :placeholder="placeholder"
    :trigger-on-focus="true"
    value-key="name"
    clearable
    style="width:100%"
    @select="onSelect"
    @input="onInput"
  >
    <template slot-scope="{ item }">
      <span class="gf-name">{{ item.name }}</span>
      <span v-if="hier(item)" class="gf-meta">{{ hier(item) }}</span>
      <span v-if="item.source === 'geonames'" class="gf-src">GeoNames</span>
    </template>
  </el-autocomplete>
</template>

<script>
import { geoSuggest } from '@/api/table'
import _ from 'lodash'

export default {
  name: 'GeoField',
  props: {
    value: { type: [String, Number], default: '' },
    level: { type: String, required: true }, // continent|country|state|county
    placeholder: { type: String, default: '' }
  },
  data() {
    return { inner: this.value }
  },
  watch: {
    value(v) { this.inner = v }
  },
  methods: {
    hier(item) {
      return [item.county, item.state, item.country].filter(v => v && v !== item.name).join(', ')
    },
    onInput(v) { this.$emit('input', v) },
    onSelect(item) {
      this.inner = item.name
      this.$emit('input', item.name)
      this.$emit('picked', item) // 含 GeoNames 层级 → 父级可自动填
    },
    fetch: _.debounce(function(queryString, cb) {
      geoSuggest({ q: queryString || '', level: this.level, limit: 8 })
        .then(res => cb(res.data.items || []))
        .catch(() => cb([]))
    }, 250)
  }
}
</script>

<style scoped>
.gf-name { font-weight: 500; }
.gf-meta { color: #909399; font-size: 12px; margin-left: 8px; }
.gf-src { color: #67c23a; font-size: 11px; margin-left: 8px; float: right; }
</style>