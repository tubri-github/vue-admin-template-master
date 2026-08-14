<!--
  FamilyPicker

  "Pick a family, or make one that does not exist yet" as a single control.

  Both halves already existed, five and one times over: the remote-search select is copy-pasted
  in CreateSpeciesForm, LoanSearch, Lot baseSearch, Lot ConditionEditor and taxonomicform, and
  the create dialog is welded into SpeciesVerification. Neither was reusable, so the family
  tab had no way to offer "neither of these two families is right" without a sixth copy.

  It calls the same two endpoints those copies call -- getFamily (@/api/table) and createFamily
  (@/api/verbatimworkspace) -- rather than declaring a third name for either.

  One behaviour worth knowing: creating checks for an existing family by name first and selects
  that instead. The Family table is inconsistently cased (POTAMOTRYGONIDAE beside
  Potamotrygonidae), the backend rejects a duplicate with code 40900, and the global response
  interceptor turns any non-20000 into a rejected promise with no payload -- so the id could not
  be recovered from that error. Looking first is both friendlier and the only way to get it.

  Usage:
    <family-picker v-model="familyId" @change="onPick" />
    // @change emits { familyId, familyName, created }
-->
<template>
  <span class="family-picker">
    <el-select
      :value="value"
      :size="size"
      :disabled="disabled"
      :placeholder="placeholder"
      :loading="loading"
      :clearable="clearable"
      filterable
      remote
      reserve-keyword
      :remote-method="search"
      class="picker-select"
      @change="pick"
      @clear="pick(null)"
    >
      <el-option
        v-for="f in options"
        :key="f.FamilyID"
        :label="f.FamilyName"
        :value="f.FamilyID"
      />
      <el-option v-if="value && !inOptions" :key="value" :label="fallbackLabel" :value="value" />
    </el-select>

    <el-button
      v-if="allowCreate"
      :size="size"
      :disabled="disabled"
      class="new-btn"
      @click="openCreate()"
    >
      <i class="el-icon-plus" /> New
    </el-button>

    <el-dialog
      title="Add a new family"
      :visible.sync="dialog"
      width="440px"
      append-to-body
      @closed="resetForm"
    >
      <p class="dlg-note">
        Only add a family that genuinely does not exist yet — check the spelling against the
        Catalog of Fishes first. If the name is already in the table it will be selected
        instead of duplicated.
      </p>
      <el-form ref="form" :model="form" :rules="rules" label-width="120px" size="small">
        <el-form-item label="Family name" prop="family_name">
          <el-input v-model="form.family_name" placeholder="e.g. Peristediidae" />
        </el-form-item>
        <el-form-item label="Family number">
          <el-input v-model="form.family_number" placeholder="optional" />
        </el-form-item>
        <el-form-item label="Alias">
          <el-input v-model="form.alias2" placeholder="optional" />
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button size="small" @click="dialog = false">Cancel</el-button>
        <el-button size="small" type="primary" :loading="creating" @click="submit">
          Add
        </el-button>
      </span>
    </el-dialog>
  </span>
</template>

<script>
import { getFamily } from '@/api/table'
import { createFamily } from '@/api/verbatimworkspace'

export default {
  name: 'FamilyPicker',
  props: {
    value: { type: Number, default: null },
    // Shown when the bound id is not among the loaded options (e.g. set from outside before
    // any search has run), so the control never displays a bare number.
    initialLabel: { type: String, default: '' },
    placeholder: { type: String, default: 'Search a family…' },
    size: { type: String, default: 'small' },
    allowCreate: { type: Boolean, default: true },
    disabled: { type: Boolean, default: false },
    clearable: { type: Boolean, default: true }
  },
  data() {
    return {
      options: [],
      loading: false,
      dialog: false,
      creating: false,
      lastQuery: '',
      pickedLabel: '',
      form: { family_name: '', family_number: '', alias2: '' },
      rules: {
        family_name: [
          { required: true, message: 'Family name is required', trigger: 'blur' },
          { min: 3, message: 'That looks too short for a family name', trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    inOptions() {
      return this.options.some(f => f.FamilyID === this.value)
    },
    fallbackLabel() {
      return this.pickedLabel || this.initialLabel || `#${this.value}`
    }
  },
  methods: {
    async search(query) {
      const q = (query || '').trim()
      this.lastQuery = q
      if (!q) { this.options = []; return }
      this.loading = true
      try {
        const res = await getFamily({ keyWord: q })
        this.options = (res.data && res.data.items) || []
      } catch (e) {
        this.options = []
      } finally {
        this.loading = false
      }
    },
    pick(familyId) {
      const hit = this.options.find(f => f.FamilyID === familyId)
      this.pickedLabel = hit ? hit.FamilyName : ''
      this.$emit('input', familyId || null)
      this.$emit('change', familyId
        ? { familyId, familyName: this.pickedLabel, created: false }
        : { familyId: null, familyName: '', created: false })
    },
    // Prefills with whatever was typed into the select, so "searched, found nothing, add it"
    // does not mean typing the name twice.
    openCreate(prefill) {
      this.form.family_name = prefill || this.lastQuery || ''
      this.dialog = true
    },
    resetForm() {
      this.form = { family_name: '', family_number: '', alias2: '' }
      if (this.$refs.form) this.$refs.form.clearValidate()
    },
    submit() {
      this.$refs.form.validate(async valid => {
        if (!valid) return
        const name = this.form.family_name.trim()
        this.creating = true
        try {
          // Already there under some other casing? Select it rather than making a twin.
          const found = await getFamily({ keyWord: name })
          const existing = ((found.data && found.data.items) || []).find(
            f => (f.FamilyName || '').trim().toLowerCase() === name.toLowerCase())
          if (existing) {
            this.options = [existing]
            this.pickedLabel = existing.FamilyName
            this.$emit('input', existing.FamilyID)
            this.$emit('change', { familyId: existing.FamilyID,
              familyName: existing.FamilyName, created: false })
            this.$message.info(`"${existing.FamilyName}" already exists — selected it`)
            this.dialog = false
            return
          }

          const res = await createFamily({
            family_name: name,
            family_number: this.form.family_number.trim() || null,
            alias2: this.form.alias2.trim() || null
          })
          const d = res.data || {}
          const created = { FamilyID: d.family_id, FamilyName: d.family_name }
          this.options = [created]
          this.pickedLabel = created.FamilyName
          this.$emit('input', created.FamilyID)
          this.$emit('change', { familyId: created.FamilyID,
            familyName: created.FamilyName, created: true })
          this.$message.success(`Family "${created.FamilyName}" added`)
          this.dialog = false
        } catch (e) {
          // The interceptor has already shown the server's message.
        } finally {
          this.creating = false
        }
      })
    }
  }
}
</script>

<style scoped>
.family-picker { display: inline-flex; align-items: center; gap: 6px; }
.picker-select { width: 230px; }
.new-btn { margin-left: 6px; }
.dlg-note { margin: 0 0 14px; font-size: 12px; line-height: 1.7; color: #909399; }
</style>
