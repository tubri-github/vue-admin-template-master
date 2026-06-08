<template>
  <div class="cond-editor">
    <div class="field-pill">{{ field.label }} <span class="muted">({{ field.type }})</span></div>

    <!-- taxon / family: typeahead → id, plus tier toggles -->
    <template v-if="isPick">
      <el-select
        v-model="pickId"
        filterable
        remote
        clearable
        :remote-method="remoteSearch"
        :loading="remoteLoading"
        placeholder="Type to search…"
        size="small"
        style="width:100%"
        @change="onPick"
      >
        <el-option v-for="o in remoteOptions" :key="o.id" :label="o.label" :value="o.id" />
      </el-select>
      <div class="tier-toggles">
        <el-checkbox :value="true" disabled>Exact</el-checkbox>
        <el-checkbox v-if="field.type === 'taxon'" v-model="inclSimilar">Similar spellings</el-checkbox>
        <el-checkbox v-model="inclSynonym">Synonyms / accepted</el-checkbox>
      </div>
      <div class="hint">Pick a {{ field.type === 'family' ? 'family' : 'taxon' }}; results include the chosen tiers (synonym names are tagged in the results).</div>
    </template>

    <!-- generic operator + value -->
    <template v-else>
      <el-select v-model="op" size="small" style="width:100%;margin-bottom:10px" @change="onOpChange">
        <el-option v-for="o in field.operators" :key="o" :label="opLabel(o)" :value="o" />
      </el-select>

      <template v-if="!noValueOp">
        <template v-if="op === 'between'">
          <el-date-picker
            v-if="field.type === 'date'"
            v-model="range"
            type="daterange"
            value-format="yyyy-MM-dd"
            range-separator="–"
            start-placeholder="From"
            end-placeholder="To"
            size="small"
            style="width:100%"
          />
          <div v-else class="range-row">
            <el-input v-model="v1" size="small" placeholder="min" />
            <span>–</span>
            <el-input v-model="v2" size="small" placeholder="max" />
          </div>
        </template>
        <el-date-picker
          v-else-if="field.type === 'date'"
          v-model="v1"
          type="date"
          value-format="yyyy-MM-dd"
          placeholder="Pick a date"
          size="small"
          style="width:100%"
        />
        <el-select
          v-else-if="field.type === 'enum' && op === 'is' && field.options"
          v-model="tags"
          multiple
          size="small"
          style="width:100%"
          placeholder="Select one or more (= OR)"
        >
          <el-option v-for="o in field.options" :key="o" :label="o || '(empty)'" :value="o" />
        </el-select>
        <template v-else-if="isMultiOp">
          <div v-if="tags.length" class="tag-list">
            <el-tag v-for="(t, ti) in tags" :key="'t' + ti" size="mini" closable @close="tags.splice(ti, 1)">{{ t }}</el-tag>
          </div>
          <div class="or-row">
            <el-input v-model="v1" size="small" placeholder="Enter a value" @keyup.enter.native="addOrValue" />
            <el-button size="small" icon="el-icon-plus" @click="addOrValue">OR</el-button>
          </div>
        </template>
        <el-input v-else v-model="v1" size="small" :placeholder="valuePlaceholder" />
        <div v-if="multiHint" class="hint">{{ multiHint }}</div>
      </template>
      <div v-else class="hint">No value needed.</div>
    </template>

    <div class="pop-actions">
      <el-button size="mini" @click="$emit('cancel')">{{ cancelLabel }}</el-button>
      <el-button size="mini" type="primary" @click="submit">{{ submitLabel }}</el-button>
    </div>
  </div>
</template>

<script>
import { getTaxon, getFamily } from '@/api/table'

const OP_LABELS = {
  contains: 'contains', equals: 'equals', fuzzy: 'fuzzy ≈', is: 'is', in: 'in list',
  empty: 'is empty', not_empty: 'is not empty',
  eq: '=', gte: '≥', lte: '≤', between: 'between', on: 'on', after: 'after', before: 'before'
}
const EMPTY_SENTINEL = '__EMPTY__'
const NOT_EMPTY_SENTINEL = '__NOT_EMPTY__'

export default {
  name: 'ConditionEditor',
  props: {
    field: { type: Object, required: true },
    value: { type: Object, default: null }, // 编辑模式初值 { op, values, meta }
    submitLabel: { type: String, default: 'Add' },
    cancelLabel: { type: String, default: 'Back' }
  },
  data() {
    return {
      op: null, v1: '', v2: '', range: [], tags: [],
      // taxon/family pick
      pickId: null, pickLabel: '', remoteOptions: [], remoteLoading: false,
      inclSimilar: false, inclSynonym: true
    }
  },
  computed: {
    isPick() { return this.field.type === 'taxon' || this.field.type === 'family' },
    noValueOp() { return this.op === 'empty' || this.op === 'not_empty' },
    isMultiOp() { return this.op === 'contains' || this.op === 'in' },
    valuePlaceholder() { return 'Enter value' },
    multiHint() {
      if (this.isMultiOp) return 'Type a value and click ' + this.submitLabel + '. Multiple = OR: separate with commas, or click + OR to stack.'
      if (this.field.type === 'enum' && this.op === 'is') return 'Select one or more values (= OR).'
      return ''
    }
  },
  created() { this.init() },
  methods: {
    opLabel(o) { return OP_LABELS[o] || o },
    init() {
      const v = this.value
      this.op = (v && v.op) || this.field.operators[0]
      this.v1 = ''; this.v2 = ''; this.range = []; this.tags = []
      if (this.isPick) {
        if (v && v.values && v.values.length) {
          this.pickId = v.values[0]
          this.pickLabel = (v.meta && v.meta.label) || String(v.values[0])
          this.remoteOptions = [{ id: this.pickId, label: this.pickLabel }] // seed so it displays
          this.inclSimilar = !!(v.meta && v.meta.similar)
          this.inclSynonym = !(v.meta && v.meta.synonym === false)
        }
        return
      }
      if (!v || !v.values) return
      if (this.op === 'between') {
        if (this.field.type === 'date') this.range = [v.values[0], v.values[1]]
        else { this.v1 = v.values[0]; this.v2 = v.values[1] }
      } else if (this.op === 'contains' || this.op === 'in' || (this.field.type === 'enum' && this.op === 'is')) {
        this.tags = [...v.values]
      } else if (this.op !== 'empty' && this.op !== 'not_empty') {
        this.v1 = v.values[0]
      }
    },
    onOpChange() { this.v1 = ''; this.v2 = ''; this.range = []; this.tags = [] },
    addOrValue() {
      const parts = (this.v1 || '').split(',').map(s => s.trim()).filter(Boolean)
      if (!parts.length) return
      parts.forEach(p => this.tags.push(p))
      this.v1 = ''
    },
    remoteSearch(q) {
      if (!q || !q.trim()) { this.remoteOptions = []; return }
      this.remoteLoading = true
      const api = this.field.type === 'family' ? getFamily : getTaxon
      api({ keyWord: q.trim() }).then(res => {
        const items = (res.data && res.data.items) || []
        this.remoteOptions = this.field.type === 'family'
          ? items.map(i => ({ id: i.FamilyID, label: i.FamilyName }))
          : items.map(i => ({ id: i.TaxonID, label: i.FullScientificName }))
      }).catch(() => {}).then(() => { this.remoteLoading = false })
    },
    onPick(id) {
      const o = this.remoteOptions.find(x => x.id === id)
      if (o) this.pickLabel = o.label
    },
    buildValues() {
      const op = this.op
      if (op === 'empty') return [EMPTY_SENTINEL]
      if (op === 'not_empty') return [NOT_EMPTY_SENTINEL]
      if (op === 'between') {
        if (this.field.type === 'date') return (this.range && this.range.length) ? [this.range[0], this.range[1]] : null
        if (!this.v1 && !this.v2) return null
        return [this.v1, this.v2]
      }
      if (op === 'contains' || op === 'in') {
        const pending = (this.v1 || '').split(',').map(s => s.trim()).filter(Boolean)
        const vals = [...this.tags, ...pending].map(s => String(s).trim()).filter(Boolean)
        return vals.length ? vals : null
      }
      if (this.field.type === 'enum' && op === 'is') {
        const vals = [...this.tags].filter(v => v !== '' && v != null)
        return vals.length ? vals : null
      }
      if (this.v1 === '' || this.v1 === null) return null
      return [this.v1]
    },
    submit() {
      if (this.isPick) {
        if (this.pickId === null || this.pickId === '') return
        this.$emit('submit', {
          op: 'match',
          values: [this.pickId],
          meta: { label: this.pickLabel, similar: this.inclSimilar, synonym: this.inclSynonym }
        })
        return
      }
      const values = this.buildValues()
      if (values === null) return
      this.$emit('submit', { op: this.op, values })
    }
  }
}
</script>

<style scoped>
.field-pill { display: inline-block; background: #ecf5ff; border: 1px solid #d9ecff; border-radius: 6px; padding: 3px 8px; font-size: 12px; margin-bottom: 10px; }
.muted { color: #909399; font-size: 12px; }
.range-row { display: flex; gap: 6px; align-items: center; }
.tag-list { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 6px; }
.or-row { display: flex; gap: 6px; align-items: center; }
.tier-toggles { display: flex; flex-direction: column; gap: 2px; margin-top: 8px; }
.hint { font-size: 11px; color: #909399; margin-top: 6px; }
.pop-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px; }
</style>
