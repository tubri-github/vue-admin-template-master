<template>
  <div class="as-base">
    <!-- Saved filters -->
    <div class="search-container">
      <div class="sec-title">
        <span><i class="el-icon-star-on" /> Saved filters</span>
        <el-button type="text" icon="el-icon-plus" @click="saveCurrent">Save current</el-button>
      </div>
      <div v-if="savedFilters.length" class="saved-row">
        <el-tag
          v-for="(s, i) in savedFilters"
          :key="'saved' + i"
          type="warning"
          effect="plain"
          closable
          class="saved-tag"
          @click="applySaved(i)"
          @close="delSaved(i)"
        >
          <i class="el-icon-star-on" /> {{ s.name }}
        </el-tag>
      </div>
      <div v-else class="muted">No saved filters yet — set conditions, then "Save current".</div>
    </div>

    <!-- Global fuzzy box + chip builder -->
    <div class="search-container">
      <el-row :gutter="10" type="flex" align="middle">
        <el-col :span="18">
          <el-input
            v-model="globalSearch"
            :placeholder="searchPlaceholder"
            clearable
            @keyup.enter.native="onSearch"
          >
            <template slot="prepend"><i class="el-icon-search" /></template>
          </el-input>
        </el-col>
        <el-col :span="6">
          <el-button type="primary" icon="el-icon-search" @click="onSearch">Search</el-button>
          <el-button icon="el-icon-refresh-left" @click="clearAll">Clear</el-button>
        </el-col>
      </el-row>

      <div class="filter-bar">
        <span v-if="!chips.length" class="muted">No filters yet —</span>
        <el-popover
          v-for="(c, i) in chips"
          :key="'chip' + i"
          placement="bottom-start"
          width="320"
          trigger="manual"
          :value="editingChipIndex === i"
        >
          <ConditionEditor
            v-if="editingChipIndex === i && fieldByKey[c.field]"
            :key="'editor' + i"
            :field="fieldByKey[c.field]"
            :value="{ op: c.op, values: c.values }"
            submit-label="Save"
            cancel-label="Cancel"
            @submit="onEditSubmit"
            @cancel="editingChipIndex = null"
          />
          <el-tag
            slot="reference"
            :type="isSentinelChip(c) ? 'warning' : ''"
            class="chip-tag"
            closable
            @close="removeChip(i)"
          >
            <b>{{ fieldByKey[c.field] ? fieldByKey[c.field].label : c.field }}</b>
            <i class="op">{{ opLabel(c.op) }}</i>
            <span>{{ chipValueText(c) }}</span>
            <i class="el-icon-edit chip-edit" title="Edit this condition" @click="openEdit(i)" />
          </el-tag>
        </el-popover>
        <el-popover v-model="builder.visible" placement="bottom-start" width="360" trigger="manual">
          <div v-if="builder.step === 1">
            <el-input
              v-model="builder.colSearch"
              size="small"
              placeholder="Filter columns…"
              prefix-icon="el-icon-search"
              clearable
            />
            <div class="collist">
              <template v-for="grp in groupedFields">
                <div v-if="grp.fields.length" :key="grp.name">
                  <div class="grp">{{ grp.name }}</div>
                  <div
                    v-for="f in grp.fields"
                    :key="grp.name + '_' + f.key"
                    class="opt"
                    @click="pickField(f)"
                  >
                    <span>{{ f.label }}</span>
                    <span class="right">
                      <i
                        :class="isPinned(f.key) ? 'el-icon-star-on star on' : 'el-icon-star-off star'"
                        :title="isPinned(f.key) ? 'Unpin' : 'Pin as frequent column'"
                        @click.stop="togglePin(f.key)"
                      />
                      <span class="ty">{{ f.type }}</span>
                    </span>
                  </div>
                </div>
              </template>
            </div>
            <div class="pop-actions">
              <el-button size="mini" @click="builder.visible = false">Done</el-button>
            </div>
          </div>
          <ConditionEditor
            v-else-if="builder.field"
            :key="'add-' + builder.field.key"
            :field="builder.field"
            submit-label="Add"
            cancel-label="‹ Back"
            @submit="onAddSubmit"
            @cancel="builder.step = 1"
          />
          <el-button slot="reference" type="primary" plain icon="el-icon-plus" @click="openBuilder">Add filter</el-button>
        </el-popover>
      </div>
    </div>

    <!-- Results -->
    <div class="results-container">
      <div class="results-header">
        <span class="muted">Matched <b>{{ total }}</b> {{ entityLabel }}</span>
        <div class="toolbar"><slot name="toolbar" :params="lastParams" :build-params="buildParams" /></div>
      </div>
      <el-table
        ref="table"
        :key="tableKey"
        v-loading="listLoading"
        :data="list"
        border
        size="small"
        highlight-current-row
        show-overflow-tooltip
        style="width:100%"
        v-bind="tableAttrs"
        @sort-change="handleSortChange"
      >
        <slot />
      </el-table>

      <pagination
        v-show="total > 0"
        :total="total"
        :page.sync="listQuery.page"
        :limit.sync="listQuery.limit"
        @pagination="getList"
      />
    </div>
  </div>
</template>

<script>
import Pagination from '@/components/Pagination'
import ConditionEditor from '@/views/Lot/advancedSearch/ConditionEditor'

const EMPTY_SENTINEL = '__EMPTY__'
const NOT_EMPTY_SENTINEL = '__NOT_EMPTY__'
const OP_LABELS = {
  contains: 'contains', equals: 'equals', fuzzy: 'fuzzy ≈', is: 'is', in: 'in list', match: '=',
  empty: 'is empty', not_empty: 'is not empty',
  eq: '=', gte: '≥', lte: '≤', between: 'between', on: 'on', after: 'after', before: 'before'
}

export default {
  name: 'AdvancedSearchBase',
  components: { Pagination, ConditionEditor },
  props: {
    // (params) => Promise  —— 实际搜索接口（如 getLoansAdvanced）
    searchFn: { type: Function, required: true },
    // () => Promise  —— filter-metadata 接口
    metadataFn: { type: Function, required: true },
    // 表格列 prop → 后端排序字段（api key）
    sortKeyMap: { type: Object, default: () => ({}) },
    entityLabel: { type: String, default: 'records' },
    searchPlaceholder: { type: String, default: 'Search everything…' },
    // localStorage namespace（避免不同模块的 saved/pinned 串台）
    storageKey: { type: String, default: 'as' },
    defaultPinned: { type: Array, default: () => [] },
    // { fieldKey: () => Promise<string[]> } —— 为某些 enum 字段加载真实下拉项
    optionLoaders: { type: Object, default: () => ({}) },
    // 每行结果的可选变换（如 lots 的 hasChildren）
    rowTransform: { type: Function, default: null },
    // 透传给内部 el-table 的额外属性（如 row-key/lazy/tree-props）
    tableAttrs: { type: Object, default: () => ({}) }
  },
  data() {
    return {
      globalSearch: '',
      chips: [],
      fields: [],
      fieldByKey: {},
      pinnedCols: JSON.parse(localStorage.getItem(this._pkey()) || 'null') || this.defaultPinned.slice(),
      savedFilters: JSON.parse(localStorage.getItem(this._skey()) || '[]'),
      builder: { visible: false, step: 1, colSearch: '', field: null },
      editingChipIndex: null,
      list: [],
      total: 0,
      listLoading: false,
      tableKey: 0,
      listQuery: { page: 1, limit: 20 },
      sortBy: null,
      sortOrder: null,
      lastParams: {}
    }
  },
  computed: {
    groupedFields() {
      const q = (this.builder.colSearch || '').trim().toLowerCase()
      const match = f => !q || (f.label + ' ' + f.group + ' ' + f.key).toLowerCase().includes(q)
      const groups = []
      const pinned = this.pinnedCols.map(k => this.fieldByKey[k]).filter(Boolean).filter(match)
      if (pinned.length) groups.push({ name: '★ Frequent columns', fields: pinned })
      const byGroup = {}
      this.fields.filter(match).forEach(f => { (byGroup[f.group] = byGroup[f.group] || []).push(f) })
      Object.keys(byGroup).forEach(name => groups.push({ name, fields: byGroup[name] }))
      return groups
    }
  },
  created() {
    this.fetchMetadata()
    this.getList()
  },
  methods: {
    _pkey() { return 'as_' + this.storageKey + '_pinned' },
    _skey() { return 'as_' + this.storageKey + '_saved' },
    // ---------- Metadata ----------
    fetchMetadata() {
      this.metadataFn().then(res => {
        this.fields = res.data.fields || []
        const map = {}
        this.fields.forEach(f => {
          if (!('options' in f)) f.options = null
          map[f.key] = f
        })
        this.fieldByKey = map
        this.loadDropdownOptions()
      }).catch(() => { this.$message.error('Failed to load filter metadata') })
    },
    loadDropdownOptions() {
      Object.keys(this.optionLoaders).forEach(key => {
        const fd = this.fieldByKey[key]
        if (!fd) return
        Promise.resolve(this.optionLoaders[key]()).then(opts => {
          if (Array.isArray(opts)) this.$set(fd, 'options', opts.filter(v => v))
        }).catch(() => {})
      })
    },
    // ---------- Chip builder ----------
    openBuilder() {
      this.builder.visible = !this.builder.visible
      if (this.builder.visible) { this.builder.step = 1; this.builder.colSearch = ''; this.editingChipIndex = null }
    },
    pickField(f) { this.builder.field = f; this.builder.step = 2 },
    isPinned(key) { return this.pinnedCols.includes(key) },
    togglePin(key) {
      const i = this.pinnedCols.indexOf(key)
      if (i >= 0) this.pinnedCols.splice(i, 1)
      else this.pinnedCols.push(key)
      localStorage.setItem(this._pkey(), JSON.stringify(this.pinnedCols))
    },
    opLabel(op) { return OP_LABELS[op] || op },
    _mkChip(field, cond) {
      const chip = { field, op: cond.op, values: cond.values }
      if (cond.meta) { chip.label = cond.meta.label; chip.similar = cond.meta.similar; chip.synonym = cond.meta.synonym }
      return chip
    },
    onAddSubmit(cond) {
      this.chips.push(this._mkChip(this.builder.field.key, cond))
      this.builder.step = 1
      this.builder.field = null
      this.builder.colSearch = ''
    },
    openEdit(i) { this.builder.visible = false; this.editingChipIndex = i },
    onEditSubmit(cond) {
      const i = this.editingChipIndex
      if (i === null) return
      this.$set(this.chips, i, this._mkChip(this.chips[i].field, cond))
      this.editingChipIndex = null
    },
    removeChip(i) { this.chips.splice(i, 1) },
    isSentinelChip(c) { return c.values[0] === EMPTY_SENTINEL || c.values[0] === NOT_EMPTY_SENTINEL },
    chipValueText(c) {
      if (c.op === 'match') {
        const scope = []
        if (c.similar) scope.push('+similar')
        if (c.synonym !== false) scope.push('+synonyms')
        return (c.label || c.values[0]) + (scope.length ? ' (' + scope.join(' ') + ')' : '')
      }
      if (c.op === 'empty' || c.op === 'not_empty') return ''
      if (c.op === 'between') return `${c.values[0] || '…'} – ${c.values[1] || '…'}`
      return c.values.join(', ')
    },
    // ---------- Saved filters ----------
    persistSaved() { localStorage.setItem(this._skey(), JSON.stringify(this.savedFilters)) },
    saveCurrent() {
      if (!this.globalSearch.trim() && !this.chips.length) { this.$message.warning('Nothing to save.'); return }
      this.$prompt('Name this filter set:', 'Save filter', { confirmButtonText: 'Save', cancelButtonText: 'Cancel' })
        .then(({ value }) => {
          if (!value) return
          this.savedFilters.push({ name: value, search: this.globalSearch.trim(), chips: JSON.parse(JSON.stringify(this.chips)) })
          this.persistSaved()
        }).catch(() => {})
    },
    applySaved(i) {
      const s = this.savedFilters[i]
      this.globalSearch = s.search || ''
      this.chips = JSON.parse(JSON.stringify(s.chips || []))
      this.onSearch()
    },
    delSaved(i) { this.savedFilters.splice(i, 1); this.persistSaved() },
    // ---------- Query ----------
    clearAll() { this.globalSearch = ''; this.chips = []; this.onSearch() },
    onSearch() { this.listQuery.page = 1; this.getList() },
    buildParams() {
      const ids = []
      const fieldFilters = {}
      const structured = []
      const params = { page: this.listQuery.page, page_size: this.listQuery.limit }
      this.chips.forEach(c => {
        if (c.field === 'taxon_pick' && c.op === 'match') {
          params.taxon_id = c.values[0]; params.incl_similar = !!c.similar; params.incl_synonym = c.synonym !== false
        } else if (c.field === 'family_pick' && c.op === 'match') {
          params.family_id = c.values[0]; params.incl_synonym = c.synonym !== false
        } else if (c.field === 'catalog_number' && c.op === 'in') {
          c.values.forEach(v => { const n = parseInt(v, 10); if (!isNaN(n)) ids.push(n) })
        } else if (['contains', 'empty', 'not_empty'].includes(c.op)) {
          if (!fieldFilters[c.field]) fieldFilters[c.field] = []
          fieldFilters[c.field].push(...c.values)
        } else {
          structured.push({ field: c.field, op: c.op, values: c.values })
        }
      })
      if (this.globalSearch.trim()) params.search = this.globalSearch.trim()
      if (ids.length) params.ids = ids.join(',')
      if (Object.keys(fieldFilters).length) params.field_filters = JSON.stringify(fieldFilters)
      if (structured.length) params.structured_filters = JSON.stringify(structured)
      if (this.sortBy) { params.sort_by = this.sortBy; params.sort_order = this.sortOrder }
      return params
    },
    handleSortChange({ prop, order }) {
      if (!order || !this.sortKeyMap[prop]) { this.sortBy = null; this.sortOrder = null } else {
        this.sortBy = this.sortKeyMap[prop]
        this.sortOrder = order === 'ascending' ? 'asc' : 'desc'
      }
      this.listQuery.page = 1
      this.getList()
    },
    getList() {
      this.listLoading = true
      const params = this.buildParams()
      this.lastParams = params
      this.searchFn(params).then(response => {
        let items = response.data.items || []
        if (this.rowTransform) items = items.map(this.rowTransform)
        this.list = items
        this.total = response.data.total || 0
        this.listLoading = false
        this.$emit('loaded', { items: this.list, total: this.total })
      }).catch(error => {
        console.error('Search failed:', error)
        this.listLoading = false
      })
    }
  }
}
</script>

<style scoped>
.search-container, .results-container {
  background-color: #fff; border-radius: 8px; box-shadow: 0 2px 12px rgba(0, 0, 0, .08);
  margin: 0 20px 18px; padding: 18px;
}
.results-container { margin-bottom: 0; }
.sec-title { display: flex; justify-content: space-between; align-items: center; color: #909399; font-size: 13px; margin-bottom: 10px; }
.saved-row { display: flex; gap: 8px; flex-wrap: wrap; }
.saved-tag { cursor: pointer; }
.muted { color: #909399; font-size: 13px; }
.filter-bar { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; margin-top: 14px; }
.chip-tag { display: inline-flex; align-items: center; gap: 6px; }
.chip-tag .op { color: #909399; font-style: italic; margin: 0 2px; }
.chip-edit { cursor: pointer; color: #909399; margin-left: 2px; }
.chip-edit:hover { color: #409eff; }
.results-header { margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; }
.toolbar { display: flex; gap: 8px; }
.collist { max-height: 240px; overflow: auto; border: 1px solid #ebeef5; border-radius: 6px; margin-top: 8px; }
.grp { font-size: 11px; color: #909399; text-transform: uppercase; letter-spacing: .04em; padding: 7px 10px 3px; background: #fafafa; position: sticky; top: 0; }
.opt { padding: 7px 10px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
.opt:hover { background: #ecf5ff; }
.opt .right { display: inline-flex; align-items: center; gap: 8px; }
.opt .ty { font-size: 11px; color: #c0c4cc; }
.star { cursor: pointer; color: #c0c4cc; }
.star.on { color: #e6a23c; }
.star:hover { color: #e6a23c; }
.pop-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px; }
</style>