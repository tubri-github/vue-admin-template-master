<template>
  <div class="app-container">
    <!-- Saved filters (named full condition sets) -->
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
            placeholder="Search everything (catalog #, scientific name, locality, river …)"
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
        <!-- 每个 chip 各挂一个 popover，点 ✎ 在该 chip 正下方弹出编辑器 -->
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
          <!-- step 1: searchable grouped column picker -->
          <div v-if="builder.step === 1">
            <el-input
              v-model="builder.colSearch"
              size="small"
              placeholder="Filter columns… (e.g. river / locality)"
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

          <!-- step 2: operator + value (shared editor component) -->
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
        <span class="muted">Matched <b>{{ total }}</b> lots</span>
        <div class="toolbar">
          <el-dropdown trigger="click" @command="handleLabelCommand">
            <el-button size="small" plain icon="el-icon-printer">
              Labels <i class="el-icon-arrow-down el-icon--right" />
            </el-button>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item command="print-page">Print labels (this page)</el-dropdown-item>
              <el-dropdown-item command="print-all">Print labels (all filtered results)</el-dropdown-item>
              <el-dropdown-item command="pdf-page">Download labels PDF (this page)</el-dropdown-item>
              <el-dropdown-item command="settings" divided>Label size settings…</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
          <el-dropdown trigger="click" @command="handleExport">
            <el-button size="small" type="primary" plain :loading="downloadLoading" icon="el-icon-download">
              Export <i class="el-icon-arrow-down el-icon--right" />
            </el-button>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item command="filtered">Export filtered results</el-dropdown-item>
              <el-dropdown-item command="all">Export all lots</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </div>
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
        row-key="PrimaryID"
        lazy
        :load="loadChildrenLazy"
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        @sort-change="handleSortChange"
      >
        <!-- 第一列：放展开三角 + 缩进（树形结构在这里直观显示），子节点显示 identifier -->
        <el-table-column label="Catalog # / ID" align="left" width="155" fixed="left" prop="CatalogNumber" sortable="custom" class-name="id-col">
          <template slot-scope="{ row }">
            <span v-if="row.CatalogNumber != null" class="cat-num">{{ row.CatalogNumber }}</span>
            <el-tag v-else-if="row.identifier" size="mini" :type="tagType(row.collection)" effect="plain">{{ row.identifier }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="" align="center" width="80" fixed="left" class-name="action-col">
          <template slot-scope="{ row }">
            <el-tooltip content="Edit this lot" placement="top">
              <i class="el-icon-edit row-action" @click="handleEdit(row)" />
            </el-tooltip>
            <el-tooltip content="Print this label" placement="top">
              <i class="el-icon-printer row-action" @click="printRowLabel(row)" />
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="Prev #" width="95" prop="PrevNumber" sortable="custom" />
        <el-table-column label="Batch #" width="135" prop="batch_serial_id" sortable="custom" />
        <el-table-column label="Scientific Name" min-width="190" prop="FullScientificName" sortable="custom">
          <template slot-scope="{ row }">
            <span>{{ row.FullScientificName || ((row.Genus || '') + ' ' + (row.Species || '')).trim() }}</span>
            <el-tag v-if="row.taxon_status === 'synonym'" size="mini" type="warning" effect="plain" class="status-tag" title="Synonym (per TaxonRank)">synonym</el-tag>
            <el-tag v-else-if="row.taxon_status === 'valid'" size="mini" type="success" effect="plain" class="status-tag" title="Accepted name">accepted</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Sci. Name (verbatim)" min-width="160" class-name="vb-col">
          <template slot-scope="{ row }">{{ vbName(row) }}</template>
        </el-table-column>
        <el-table-column label="Family" width="120" prop="FamilyName" sortable="custom" />
        <el-table-column label="Family (verbatim)" width="120" prop="verbatim_family" class-name="vb-col" />
        <el-table-column label="Cataloged" align="center" width="115" prop="DateCataloged" sortable="custom">
          <template slot-scope="{ row }">{{ row.DateCataloged ? String(row.DateCataloged).slice(0, 10) : '' }}</template>
        </el-table-column>
        <el-table-column label="Total" align="center" width="80" prop="TotalNumber" sortable="custom" />
        <el-table-column label="Storage" width="105" prop="Storage" sortable="custom" />
        <el-table-column label="Jar" align="center" width="75" prop="JarSize" sortable="custom" />
        <el-table-column label="Type" width="100" prop="TypeStatus" sortable="custom" />
        <el-table-column label="Field No." width="105" prop="FieldNo" sortable="custom" />
        <el-table-column label="Locality" min-width="180" prop="LocalityString" sortable="custom" />
        <el-table-column label="Country" width="95" prop="Country" sortable="custom" />
        <el-table-column label="State" width="105" prop="State" sortable="custom" />
        <el-table-column label="County" width="115" prop="County" sortable="custom" />
        <el-table-column label="Drainage" width="125" prop="Drainage" sortable="custom" />
        <el-table-column label="Water Body" width="125" prop="WaterBody" sortable="custom" />
        <el-table-column label="Collector" min-width="150" prop="Collector" sortable="custom" />
        <el-table-column label="Collected Date" width="130" prop="CollectedDate" sortable="custom" />
        <!-- verbatim locality 列已下线（新设计：每条记录已建 locality1，改显示外联 locality1）。
             以下注释保留，日后若要回显 verbatim locality 再启用：
        <el-table-column label="Field No. (verbatim)" width="120" prop="verbatim_fieldno" class-name="vb-col" />
        <el-table-column label="Locality (verbatim)" min-width="180" prop="verbatim_locality_string" class-name="vb-col" />
        <el-table-column label="Country (verbatim)" width="115" prop="verbatim_country" class-name="vb-col" />
        <el-table-column label="State (verbatim)" width="115" prop="verbatim_state" class-name="vb-col" />
        <el-table-column label="County (verbatim)" width="120" prop="verbatim_county" class-name="vb-col" />
        <el-table-column label="Drainage (verbatim)" width="130" prop="verbatim_drainage" class-name="vb-col" />
        <el-table-column label="Water Body (verbatim)" width="140" prop="verbatim_waterbody" class-name="vb-col" />
        -->
        <el-table-column label="Preparation" width="130" prop="Preparations" />
        <el-table-column label="Prep Count" align="center" width="90" prop="PrepCount" />
        <el-table-column label="Long/Lat" align="center" width="140">
          <template slot-scope="{ row }">{{ (row.Lon || row.Lat) ? ((row.Lon != null ? row.Lon : '') + ' / ' + (row.Lat != null ? row.Lat : '')) : '' }}</template>
        </el-table-column>
      </el-table>

      <pagination
        v-show="total > 0"
        :total="total"
        :page.sync="listQuery.page"
        :limit.sync="listQuery.limit"
        @pagination="getLots"
      />

      <!-- Debug: live request params sent to backend (handy during migration; remove later) -->
      <el-collapse class="debug">
        <el-collapse-item title="Request params (debug)">
          <pre>{{ lastParams }}</pre>
        </el-collapse-item>
      </el-collapse>
    </div>

    <!-- Label size settings: Datamax-I4308, 4x2in stock; remembered in localStorage -->
    <el-dialog title="Label size settings" :visible.sync="labelSettingsVisible" width="460px">
      <p class="muted" style="margin-top:0">
        Each label = one page. Stock is in inches to match the printer head (4" wide across the head x 2" feed).
        Offset X/Y (mm) nudge the print position to register on the label — calibrate once with a test print.
        For exact output print at "Actual size / 100%" (or launch Chrome with --kiosk-printing + Datamax as default).
      </p>
      <el-form label-width="170px" size="small">
        <el-form-item label="Width (in, across head)"><el-input-number v-model="labelDims.widthIn" :min="0.5" :max="8" :step="0.1" /></el-form-item>
        <el-form-item label="Height (in, feed)"><el-input-number v-model="labelDims.heightIn" :min="0.5" :max="8" :step="0.1" /></el-form-item>
        <el-form-item label="Offset X (mm)"><el-input-number v-model="labelDims.offsetXmm" :min="0" :max="20" :step="0.5" /></el-form-item>
        <el-form-item label="Offset Y (mm)"><el-input-number v-model="labelDims.offsetYmm" :min="0" :max="25" :step="0.5" /></el-form-item>
        <el-form-item label="Font size (pt)"><el-input-number v-model="labelDims.fontSize" :min="4" :max="14" :step="0.5" /></el-form-item>
      </el-form>
      <span slot="footer">
        <el-button size="small" @click="labelSettingsVisible = false">Cancel</el-button>
        <el-button size="small" @click="resetLabelDims">Reset default</el-button>
        <el-button size="small" type="primary" @click="saveLabelDims">Save</el-button>
      </span>
    </el-dialog>

    <!-- Edit lot: reuse the updateLot form in a dialog (same pattern as baseSearch) -->
    <el-dialog
      :visible.sync="editLotDialogVisible"
      title="Edit Specimen"
      width="90%"
      class="edit-lot-dialog"
      @close="getLots"
    >
      <LotComplexTable
        v-if="editLotDialogVisible"
        :key="'lotEdit' + componentKey"
        :curr-catalog-no="currCatalogNo"
        :curr-primary-i-d="currPrimaryID"
      />
    </el-dialog>
  </div>
</template>

<script>
import { getLotsAdvanced, getLotsFilterMetadata, getJarSizes } from '@/api/table'
import Pagination from '@/components/Pagination'
import { downloadLabels, DEFAULT_LABEL } from '@/utils/lotLabels'
import { printLotLabelsHtml } from '@/utils/labelHtmlPrint'
import LotComplexTable from '@/views/lotform/updateLot'
import ConditionEditor from './ConditionEditor'

const LABEL_DIMS_KEY = 'lots_label_dims_v2' // v2: inches + X/Y offset (old mm width/height/margin dropped)

// 表格列 prop → 后端排序字段（api key）。只列可排序的列。
const SORT_KEY = {
  CatalogNumber: 'catalog_number', PrevNumber: 'prev_number', FullScientificName: 'scientific_name',
  FamilyName: 'family', DateCataloged: 'date_cataloged', TotalNumber: 'total_number',
  Storage: 'storage', JarSize: 'jar_size', TypeStatus: 'type_status', FieldNo: 'field_no',
  LocalityString: 'locality_string', Country: 'country', State: 'state', County: 'county',
  Drainage: 'drainage', WaterBody: 'water_body',
  batch_serial_id: 'batch_serial_id', Collector: 'collector', CollectedDate: 'collected_date'
}

const SAVED_KEY = 'lots_saved_filters'
const PINNED_KEY = 'lots_pinned_cols'
const EMPTY_SENTINEL = '__EMPTY__'
const NOT_EMPTY_SENTINEL = '__NOT_EMPTY__'

const OP_LABELS = {
  contains: 'contains', equals: 'equals', fuzzy: 'fuzzy ≈', is: 'is', in: 'in list', match: '=',
  empty: 'is empty', not_empty: 'is not empty',
  eq: '=', gte: '≥', lte: '≤', between: 'between', on: 'on', after: 'after', before: 'before'
}

export default {
  name: 'AdvancedSearchLot',
  components: { Pagination, LotComplexTable, ConditionEditor },
  data() {
    return {
      globalSearch: '',
      chips: [],
      fields: [],
      fieldByKey: {},
      pinnedCols: JSON.parse(localStorage.getItem(PINNED_KEY) || 'null') ||
        ['catalog_number', 'family', 'jar_size', 'country'],
      savedFilters: JSON.parse(localStorage.getItem(SAVED_KEY) || '[]'),
      builder: { visible: false, step: 1, colSearch: '', field: null },
      editingChipIndex: null,
      list: [],
      total: 0,
      listLoading: false,
      downloadLoading: false,
      tableKey: 0,
      componentKey: 0,
      editLotDialogVisible: false,
      currCatalogNo: null,
      currPrimaryID: null,
      listQuery: { page: 1, limit: 20 },
      sortBy: null,
      sortOrder: null,
      lastParams: {},
      // Label dimensions (mm), remembered in localStorage to match the old printer
      labelDims: JSON.parse(localStorage.getItem(LABEL_DIMS_KEY) || 'null') || Object.assign({}, DEFAULT_LABEL),
      labelSettingsVisible: false
    }
  },
  computed: {
    // Column picker groups: pinned frequent columns first, then each group (filtered by colSearch)
    groupedFields() {
      const q = (this.builder.colSearch || '').trim().toLowerCase()
      const match = f => !q || (f.label + ' ' + f.group + ' ' + f.key).toLowerCase().includes(q)
      const groups = []
      const pinned = this.pinnedCols.map(k => this.fieldByKey[k]).filter(Boolean).filter(match)
      if (pinned.length) groups.push({ name: '★ Frequent columns', fields: pinned })
      const byGroup = {}
      this.fields.filter(match).forEach(f => {
        (byGroup[f.group] = byGroup[f.group] || []).push(f)
      })
      Object.keys(byGroup).forEach(name => groups.push({ name, fields: byGroup[name] }))
      return groups
    }
  },
  created() {
    this.fetchMetadata()
    // 从 batch review 跳转过来：?batch=xxx 预置 batch 过滤 chip
    const _b = this.$route.query.batch
    if (_b) {
      this.chips.push({ field: 'batch_serial_id', op: 'contains', values: [String(_b)] })
    }
    this.getLots()
  },
  methods: {
    // ---------- Metadata ----------
    fetchMetadata() {
      getLotsFilterMetadata().then(res => {
        this.fields = res.data.fields || []
        const map = {}
        this.fields.forEach(f => {
          if (!('options' in f)) f.options = null // ensure reactivity
          map[f.key] = f
        })
        this.fieldByKey = map
        this.loadDropdownOptions()
      }).catch(() => { this.$message.error('Failed to load filter metadata') })
    },
    // Populate real dropdown options for certain enum fields (e.g. jar_size from JarSizes)
    loadDropdownOptions() {
      const jar = this.fieldByKey['jar_size']
      if (jar) {
        getJarSizes().then(res => {
          const opts = (res.data.items || []).map(it => it.JarSize).filter(v => v)
          this.$set(jar, 'options', opts)
        }).catch(() => {})
      }
    },

    // ---------- Column picker / chip builder ----------
    openBuilder() {
      this.builder.visible = !this.builder.visible
      if (this.builder.visible) { this.builder.step = 1; this.builder.colSearch = ''; this.editingChipIndex = null }
    },
    pickField(f) {
      this.builder.field = f
      this.builder.step = 2
    },
    isPinned(key) { return this.pinnedCols.includes(key) },
    togglePin(key) {
      const i = this.pinnedCols.indexOf(key)
      if (i >= 0) this.pinnedCols.splice(i, 1)
      else this.pinnedCols.push(key)
      localStorage.setItem(PINNED_KEY, JSON.stringify(this.pinnedCols))
    },
    opLabel(op) { return OP_LABELS[op] || op },
    _mkChip(field, cond) {
      const chip = { field, op: cond.op, values: cond.values }
      if (cond.meta) { chip.label = cond.meta.label; chip.similar = cond.meta.similar; chip.synonym = cond.meta.synonym }
      return chip
    },
    // ConditionEditor emits {op, values, meta?}. Add: push a chip, keep popover open to chain more.
    onAddSubmit(cond) {
      this.chips.push(this._mkChip(this.builder.field.key, cond))
      this.builder.step = 1
      this.builder.field = null
      this.builder.colSearch = ''
    },
    // Open the editor popover right below the clicked chip
    openEdit(i) {
      this.builder.visible = false
      this.editingChipIndex = i
    },
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

    // ---------- Saved filters (full condition sets) ----------
    persistSaved() { localStorage.setItem(SAVED_KEY, JSON.stringify(this.savedFilters)) },
    saveCurrent() {
      if (!this.globalSearch.trim() && !this.chips.length) {
        this.$message.warning('Nothing to save.')
        return
      }
      this.$prompt('Name this filter set:', 'Save filter', { confirmButtonText: 'Save', cancelButtonText: 'Cancel' })
        .then(({ value }) => {
          if (!value) return
          this.savedFilters.push({
            name: value,
            search: this.globalSearch.trim(),
            chips: JSON.parse(JSON.stringify(this.chips))
          })
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
    clearAll() {
      this.globalSearch = ''
      this.chips = []
      this.onSearch()
    },
    onSearch() { this.listQuery.page = 1; this.getLots() },
    buildParams() {
      const ids = []
      const fieldFilters = {}
      const structured = []
      const params = { page: this.listQuery.page, page_size: this.listQuery.limit }
      this.chips.forEach(c => {
        if (c.field === 'taxon_pick' && c.op === 'match') {
          params.taxon_id = c.values[0]
          params.incl_similar = !!c.similar
          params.incl_synonym = c.synonym !== false
        } else if (c.field === 'family_pick' && c.op === 'match') {
          params.family_id = c.values[0]
          params.incl_synonym = c.synonym !== false
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
    // verbatim 学名（genus + species）拼一行，供 Scientific Name 列灰字显示
    vbName(row) {
      return ((row.verbatim_genus || '') + ' ' + (row.verbatim_species || '')).trim()
    },
    tagType(coll) {
      return { fluid: '', osteology: 'info', tissue: 'success', image: 'warning' }[coll] || ''
    },
    // el-table 懒加载：展开某行时拉它的直接子节点（走同一搜索查询 → 列结构一致）
    loadChildrenLazy(row, treeNode, resolve) {
      getLotsAdvanced({ parent_id: row.PrimaryID, page: 1, page_size: 100 }).then(res => {
        resolve(this.withHasChildren(res.data.items || []))
      }).catch(() => resolve([]))
    },
    // 给行打上 hasChildren（驱动 el-table 树表的展开箭头）
    withHasChildren(rows) {
      return rows.map(r => Object.assign({}, r, { hasChildren: Number(r.ChildCount) > 0 }))
    },
    // 表头点击排序 → 服务端按整个结果集排序后再分页
    handleSortChange({ prop, order }) {
      if (!order || !SORT_KEY[prop]) {
        this.sortBy = null; this.sortOrder = null
      } else {
        this.sortBy = SORT_KEY[prop]
        this.sortOrder = order === 'ascending' ? 'asc' : 'desc'
      }
      this.listQuery.page = 1
      this.getLots()
    },
    getLots() {
      this.listLoading = true
      const params = this.buildParams()
      this.lastParams = params
      getLotsAdvanced(params).then(response => {
        this.list = this.withHasChildren(response.data.items || [])
        this.total = response.data.total || 0
        this.listLoading = false
      }).catch(error => {
        console.error('Error fetching lots:', error)
        this.listLoading = false
      })
    },

    // ---------- Export Excel ----------
    // filtered = all rows matching current search/chips; all = whole table. Server page=-1 fetches all; client Export2Excel builds xlsx
    handleExport(command) {
      const isAll = command === 'all'
      const params = isAll ? { page: -1 } : Object.assign({}, this.buildParams(), { page: -1 })
      const note = isAll
        ? 'This exports ALL lots (the entire table) and may be very large.'
        : `This exports all ${this.total} rows matching the current filters.`
      this.$confirm(note + ' Continue?', 'Confirm export', {
        confirmButtonText: 'Export', cancelButtonText: 'Cancel', type: 'warning'
      }).then(() => {
        this.downloadLoading = true
        this.$message({ message: 'Preparing export, please wait…', type: 'info' })
        getLotsAdvanced(params).then(res => {
          this.exportToExcel(res.data.items || [])
        }).catch(err => {
          console.error('Export fetch failed:', err)
          this.$message.error('Export failed')
          this.downloadLoading = false
        })
      }).catch(() => {})
    },
    exportToExcel(items) {
      import('@/vendor/Export2Excel').then(excel => {
        const cols = [
          ['Catalog #', 'CatalogNumber'], ['Prev #', 'PrevNumber'],
          ['Scientific Name', 'FullScientificName'], ['Family', 'FamilyName'],
          ['Genus', 'Genus'], ['Species', 'Species'],
          ['Date Cataloged', 'DateCataloged'], ['Total', 'TotalNumber'],
          ['Storage', 'Storage'], ['Jar Size', 'JarSize'], ['Type Status', 'TypeStatus'],
          ['Inventory', 'Inventory'], ['Field No.', 'FieldNo'], ['Locality', 'LocalityString'],
          ['Country', 'Country'], ['State', 'State'], ['County', 'County'],
          ['Drainage', 'Drainage'], ['Water Body', 'WaterBody'],
          ['Preparation', 'Preparations'], ['Prep Count', 'PrepCount'],
          ['Longitude', 'Lon'], ['Latitude', 'Lat'], ['Remarks', 'Remarks']
        ]
        const header = cols.map(c => c[0])
        const data = items.map(row => cols.map(c => {
          const k = c[1]
          if (k === 'DateCataloged') return row[k] ? String(row[k]).slice(0, 10) : ''
          return row[k] != null ? row[k] : ''
        }))
        excel.export_json_to_excel({
          header,
          data,
          filename: 'Lots-Export-' + new Date().toISOString().slice(0, 10)
        })
        this.downloadLoading = false
        this.$message.success('Export successful (' + data.length + ' rows)')
      }).catch(err => {
        console.error('Export2Excel failed:', err)
        this.$message.error('Excel generation failed')
        this.downloadLoading = false
      })
    },

    // ---------- Label print / PDF ----------
    // Print: legacy HTML via print-js (flows to fill the 4x2 label, no centered-on-bigger-paper
    // blanks; dashed cut lines on the page edge). PDF export: still pdfmake geometry-exact.
    handleLabelCommand(cmd) {
      if (cmd === 'settings') { this.labelSettingsVisible = true; return }
      if (cmd === 'print-all') { this.printAllFilteredLabels(); return }
      if (!this.list || !this.list.length) { this.$message.warning('No rows to print'); return }
      if (cmd === 'print-page') printLotLabelsHtml(this.list)
      else if (cmd === 'pdf-page') downloadLabels(this.list, this.labelDims)
    },
    // Print every lot matching the CURRENT filters (not just the visible page, not the whole
    // table): re-run the same buildParams() with page=-1 so the server returns the full filtered
    // set, then hand it to the HTML label printer. Warn first — this can be a big print job.
    printAllFilteredLabels() {
      if (!this.total) { this.$message.warning('No rows to print'); return }
      const params = Object.assign({}, this.buildParams(), { page: -1 })
      this.$confirm(
        `This will print all ${this.total} labels matching the current filters. Large jobs may take a while to render. Continue?`,
        'Confirm print', { confirmButtonText: 'Print', cancelButtonText: 'Cancel', type: 'warning' }
      ).then(() => {
        this.$message({ message: 'Preparing labels, please wait…', type: 'info' })
        getLotsAdvanced(params).then(res => {
          const rows = res.data.items || []
          if (!rows.length) { this.$message.warning('No rows to print'); return }
          printLotLabelsHtml(rows)
        }).catch(err => {
          console.error('Print-all fetch failed:', err)
          this.$message.error('Failed to load labels')
        })
      }).catch(() => {})
    },
    printRowLabel(row) { printLotLabelsHtml([row]) },
    // 编辑单条 lot：复用 updateLot 表单 dialog（关闭后刷新当前页）
    handleEdit(row) {
      this.currCatalogNo = row.CatalogNumber
      this.currPrimaryID = row.PrimaryID
      this.componentKey += 1
      this.editLotDialogVisible = true
    },
    saveLabelDims() {
      localStorage.setItem(LABEL_DIMS_KEY, JSON.stringify(this.labelDims))
      this.labelSettingsVisible = false
      this.$message.success('Label settings saved')
    },
    resetLabelDims() { this.labelDims = Object.assign({}, DEFAULT_LABEL) }
  }
}
</script>

<style scoped>
.app-container { background-color: #f5f7fa; padding-bottom: 40px; }
/* verbatim 原始著录值：单独列，浅黄底 + 棕灰斜体，与匹配列区分 */
::v-deep .vb-col { background: #fffaf0; }
::v-deep .vb-col .cell { color: #9c7a3c; font-style: italic; }
/* 操作图标不换行 */
::v-deep .action-col .cell { white-space: nowrap; }
::v-deep .action-col .row-action { margin: 0 5px; font-size: 16px; cursor: pointer; }
::v-deep .action-col .row-action:hover { color: #409eff; }
/* 树表第一列：展开三角更明显 */
::v-deep .id-col .el-table__expand-icon { color: #409eff; font-size: 14px; }
::v-deep .id-col .cat-num { font-weight: 600; }
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
.row-action { cursor: pointer; color: #909399; margin: 0 4px; font-size: 15px; }
.row-action:hover { color: #409eff; }
.status-tag { margin-left: 6px; transform: scale(.85); transform-origin: left center; }
/* column picker popover */
.collist { max-height: 240px; overflow: auto; border: 1px solid #ebeef5; border-radius: 6px; margin-top: 8px; }
.grp { font-size: 11px; color: #909399; text-transform: uppercase; letter-spacing: .04em; padding: 7px 10px 3px; background: #fafafa; position: sticky; top: 0; }
.opt { padding: 7px 10px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; }
.opt:hover { background: #ecf5ff; }
.opt .right { display: inline-flex; align-items: center; gap: 8px; }
.opt .ty { font-size: 11px; color: #c0c4cc; }
.star { cursor: pointer; color: #c0c4cc; }
.star.on { color: #e6a23c; }
.star:hover { color: #e6a23c; }
.field-pill { display: inline-block; background: #ecf5ff; border: 1px solid #d9ecff; border-radius: 6px; padding: 3px 8px; font-size: 12px; margin-bottom: 10px; }
.range-row { display: flex; gap: 6px; align-items: center; }
.tag-list { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 6px; }
.or-row { display: flex; gap: 6px; align-items: center; }
.hint { font-size: 11px; color: #909399; margin-top: 6px; }
.pop-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px; }
.debug { margin-top: 16px; }
.debug pre { background: #1e1e2e; color: #cdd6f4; padding: 12px; border-radius: 6px; font-size: 12px; overflow: auto; }
</style>
