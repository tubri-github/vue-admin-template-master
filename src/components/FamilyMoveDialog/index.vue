<template>
  <el-dialog :visible.sync="open" title="Move taxa to another family" width="660px">
    <div v-if="taxa.length">
      <p class="dlg-name">
        {{ taxa.length }} taxa from {{ sourceLocalFamily || '(no family)' }}
        <span class="muted">({{ specimenCount }} specimens)</span>
      </p>
      <p class="muted small">
        <template v-if="sourceReferenceFamily">
          We file them under <b>{{ sourceLocalFamily }}</b>, the Catalog says
          <b>{{ sourceReferenceFamily }}</b>.
        </template>
        <!-- Arriving from a record rather than from a disagreement row: the Catalog may agree
             with us and the curator still think we are both wrong. Claiming a Catalog opinion
             we do not have would be worse than saying nothing. -->
        <template v-else>
          We file them under <b>{{ sourceLocalFamily || '(no family)' }}</b>.
        </template>
        Pick where they actually belong — including a family that is not in our table yet.
      </p>

      <p v-if="taxa.length <= 6" class="muted xsmall taxa-line">
        {{ taxa.map(t => t.full_name || t.TaxonID).join(', ') }}
      </p>

      <div class="picker-row">
        <family-picker v-model="targetId" @change="onTargetPicked" />
        <span v-if="targetName" class="muted small">
          → moving them to <b>{{ targetName }}</b>
        </span>
      </div>

      <el-alert v-if="preview" :closable="false" type="info" class="preview">
        <div>
          <b>{{ preview.taxa_count }}</b> taxa
          (<b>{{ preview.specimens_count }}</b> specimens) will move to
          <b>{{ preview.target.family_name }}</b>.
          <el-tag v-if="!preview.target.exists" type="warning" size="mini">
            this family will be created
          </el-tag>
        </div>
        <div v-if="preview.already_in_target.length" class="muted small">
          {{ preview.already_in_target.length }} of the selected taxa are already in that
          family and will be skipped.
        </div>
        <div class="muted small">
          Specimens are not re-identified. Every taxon's previous family is recorded and the
          whole move can be undone.
        </div>
        <!-- Moving to a family CoF still disagrees with does not end the argument, it renames
             it. Saying so here beats the curator discovering it on the next import. -->
        <div v-if="preview.rulings_to_create.length" class="warn small">
          The Catalog files some of these under
          {{ preview.rulings_to_create.join(', ') }}, so
          {{ preview.target.family_name }} would start being flagged instead. That follow-up
          warning will be silenced automatically — it shows up as a “Keep ours” ruling on the
          Taxon Data Quality page, and undoing the move revokes it.
        </div>
      </el-alert>

      <el-input
        v-model="note"
        type="textarea"
        :rows="2"
        placeholder="Note (optional) — why this family, e.g. which authority you followed"
        class="note"
      />
    </div>
    <span slot="footer">
      <el-button @click="open = false">Cancel</el-button>
      <el-button
        type="primary"
        :loading="moving"
        :disabled="!preview || !preview.taxa_count"
        @click="doMove"
      >Move {{ preview ? preview.taxa_count : '' }} taxa</el-button>
    </span>
  </el-dialog>
</template>

<script>
// The one place a family is changed. Shared on purpose: the Taxon Data Quality page reaches
// it from a (our family -> Catalog family) disagreement row, and batch review reaches it from
// a single record -- but it is the same decision, with the same consequences, and a curator
// should not meet two different dialogs for it.
import FamilyPicker from '@/components/FamilyPicker'
import { previewReassign, reassignFamily } from '@/api/familyPolicy'

export default {
  name: 'FamilyMoveDialog',
  components: { FamilyPicker },
  props: {
    visible: { type: Boolean, default: false },
    // [{ TaxonID, full_name, specimens }]
    taxa: { type: Array, default: () => [] },
    sourceLocalFamily: { type: String, default: '' },
    // null when the move did not come from a disagreement -- see the template.
    sourceReferenceFamily: { type: String, default: null },
    curator: { type: String, default: '' }
  },
  data() {
    return { targetId: null, targetName: '', preview: null, note: '', moving: false }
  },
  computed: {
    open: {
      get() { return this.visible },
      set(v) { this.$emit('update:visible', v) }
    },
    specimenCount() {
      return this.taxa.reduce((s, t) => s + (t.specimens || 0), 0)
    }
  },
  watch: {
    visible(v) {
      if (v) { this.targetId = null; this.targetName = ''; this.preview = null; this.note = '' }
    },
    targetId(id) { this.loadPreview(id) }
  },
  methods: {
    onTargetPicked({ familyName }) { this.targetName = familyName || '' },
    async loadPreview(familyId) {
      if (!familyId || !this.taxa.length) { this.preview = null; return }
      try {
        const res = await previewReassign({
          taxon_ids: this.taxa.map(t => t.TaxonID),
          target_family_id: familyId,
          performed_by: this.curator
        })
        this.preview = res.code === 20000 ? res.data : null
      } catch (e) {
        this.preview = null
      }
    },
    async doMove() {
      const p = this.preview
      try {
        await this.$confirm(
          `Move ${p.taxa_count} taxa (${p.specimens_count} specimens) out of
           ${this.sourceLocalFamily || '(no family)'} into ${p.target.family_name}?

           This changes the taxonomy for every record using these taxa, not just the one you
           came from. Each taxon's previous family is recorded and the move can be undone.`,
          'Move to another family', { type: 'warning' })
      } catch (e) { return }
      this.moving = true
      try {
        const res = await reassignFamily({
          taxon_ids: this.taxa.map(t => t.TaxonID),
          target_family_id: this.targetId,
          source_local_family: this.sourceLocalFamily || null,
          source_reference_family: this.sourceReferenceFamily || null,
          note: this.note || null,
          performed_by: this.curator
        })
        if (res.code === 20000) {
          this.$message.success(res.message)
          this.open = false
          this.$emit('moved', res.data)
        } else {
          this.$message.error(res.message)
        }
      } catch (e) {
        // the interceptor already surfaced the server's message
      } finally {
        this.moving = false
      }
    }
  }
}
</script>

<style scoped>
.dlg-name { font-size: 15px; font-weight: 600; margin: 0 0 4px; }
.taxa-line { margin: 0 0 10px; font-style: italic; }
.picker-row { display: flex; align-items: center; gap: 10px; margin: 14px 0; }
.preview { margin-bottom: 12px; }
.note { margin-top: 4px; }
.muted { color: #909399; }
.warn { color: #e6a23c; margin-top: 4px; }
.small { font-size: 12px; }
.xsmall { font-size: 11px; }
</style>
