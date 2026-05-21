<!--
  FieldFilterChips.vue
  通用按列搜索 chip 组件。v-model 绑定 {field_key: [val1, val2, ...]} 结构。
  同字段多值 OR、跨字段 AND 由后端处理。
-->
<template>
  <div class="field-filter-chips">
    <el-popover
      v-model="popoverVisible"
      placement="bottom-start"
      trigger="click"
      width="320"
      @hide="resetDraft"
    >
      <div class="filter-popover">
        <el-form size="small" label-position="top" @submit.native.prevent>
          <el-form-item label="Field">
            <el-select
              v-model="draftField"
              placeholder="Select field"
              filterable
              class="w-full"
            >
              <el-option
                v-for="opt in fieldOptions"
                :key="opt.key"
                :label="opt.label"
                :value="opt.key"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="Value (substring match)">
            <el-input
              ref="valueInput"
              v-model="draftValue"
              placeholder="Search value"
              clearable
              @keyup.enter.native="addChip"
            />
          </el-form-item>
          <div class="popover-actions">
            <el-button size="small" @click="closePopover">Cancel</el-button>
            <el-button
              type="primary"
              size="small"
              :disabled="!canAdd"
              @click="addChip"
            >
              Add
            </el-button>
          </div>
        </el-form>
      </div>
      <el-button slot="reference" size="small" class="add-filter-btn">
        <i class="el-icon-plus" />
        Add filter
      </el-button>
    </el-popover>

    <el-tag
      v-for="chip in chipList"
      :key="chip.id"
      class="filter-chip"
      closable
      size="small"
      type="info"
      @close="removeChip(chip)"
    >
      <strong>{{ getFieldLabel(chip.field) }}:</strong> {{ chip.value }}
    </el-tag>

    <el-button
      v-if="chipList.length > 0"
      type="text"
      size="mini"
      class="clear-all"
      @click="clearAll"
    >
      Clear all
    </el-button>
  </div>
</template>

<script>
export default {
  name: 'FieldFilterChips',
  props: {
    // {field_key: [val1, val2, ...]}
    value: {
      type: Object,
      default: () => ({})
    },
    // [{key: 'verbatim_genus', label: 'Verbatim Genus'}, ...]
    fieldOptions: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      popoverVisible: false,
      draftField: '',
      draftValue: ''
    }
  },
  computed: {
    chipList() {
      const list = []
      const v = this.value || {}
      Object.keys(v).forEach(field => {
        const vals = Array.isArray(v[field]) ? v[field] : []
        vals.forEach((val, i) => {
          list.push({ field, value: val, id: `${field}::${i}::${val}` })
        })
      })
      return list
    },
    canAdd() {
      return !!this.draftField && (this.draftValue || '').trim() !== ''
    }
  },
  methods: {
    getFieldLabel(key) {
      const opt = this.fieldOptions.find(o => o.key === key)
      return opt ? opt.label : key
    },
    addChip() {
      if (!this.canAdd) return
      const field = this.draftField
      const value = this.draftValue.trim()
      const next = { ...(this.value || {}) }
      const list = next[field] ? [...next[field]] : []
      // 同字段同值不重复
      if (!list.includes(value)) list.push(value)
      next[field] = list
      this.$emit('input', next)
      // 留住 field 方便连续加同字段多个值；只清值
      this.draftValue = ''
      this.$nextTick(() => {
        if (this.$refs.valueInput) this.$refs.valueInput.focus()
      })
    },
    removeChip(chip) {
      const next = { ...(this.value || {}) }
      const list = (next[chip.field] || []).filter(v => v !== chip.value)
      if (list.length > 0) {
        next[chip.field] = list
      } else {
        delete next[chip.field]
      }
      this.$emit('input', next)
    },
    clearAll() {
      this.$emit('input', {})
    },
    closePopover() {
      this.popoverVisible = false
    },
    resetDraft() {
      this.draftField = ''
      this.draftValue = ''
    }
  }
}
</script>

<style scoped>
.field-filter-chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.add-filter-btn {
  margin-right: 4px;
}

.filter-chip {
  margin-right: 0;
}

.filter-popover {
  padding: 4px;
}

.popover-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.clear-all {
  color: #f56c6c !important;
  margin-left: 4px;
}

.w-full {
  width: 100%;
}
</style>