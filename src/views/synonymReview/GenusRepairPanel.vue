<!--
  GenusRepairPanel.vue

  What the Genus-column repair changed, and what it deliberately did not.

  This tab exists so the repair is auditable by the person whose data it touched: every changed
  row is listed with the value it had before, and the handful the repair refused to guess at are
  listed with both candidate answers so a curator can pick one.

  The repaired list is read-only history. The "needs a manual decision" list is NOT: choosing
  there edits TaxonomicTable (Genus or FullScientificName), which is why every choice is written
  to genus_manual_decision and can be undone.
-->
<template>
  <div class="genus-repair-panel">
    <el-card shadow="never">
      <div slot="header" class="clearfix">
        <span class="section-title">Genus column repair</span>
        <el-button type="text" size="small" style="float:right" :loading="loading" @click="load">
          <i class="el-icon-refresh" /> Refresh
        </el-button>
      </div>

      <p class="purpose">
        An old import wrote the whole name plus internal markers into the <b>Genus</b> column —
        <code>Notropislutrensis+[Cyprinidae_SN]![Species] lutren</code> instead of just
        <code>Notropis</code>. Anything that looks a taxon up by genus (species matching on
        import, the family cross-check, genus statistics, the lots list) silently failed on those
        rows. The scientific name itself was never damaged, so the genus was rebuilt from it.
      </p>

      <el-row :gutter="12" class="stat-row">
        <el-col :span="5">
          <div class="stat-item">
            <div class="stat-number ok">{{ (summary.fixed && summary.fixed.total) || 0 }}</div>
            <div class="stat-label">rows repaired</div>
          </div>
        </el-col>
        <el-col :span="5">
          <div class="stat-item">
            <div class="stat-number">{{ (summary.fixed && summary.fixed.families) || 0 }}</div>
            <div class="stat-label">families involved</div>
          </div>
        </el-col>
        <el-col :span="5">
          <div class="stat-item">
            <div class="stat-number warn">{{ summary.unresolved || 0 }}</div>
            <div class="stat-label">need a decision</div>
          </div>
        </el-col>
        <el-col :span="5">
          <div class="stat-item">
            <div class="stat-number">{{ summary.decided_manually || 0 }}</div>
            <div class="stat-label">decided by hand</div>
          </div>
        </el-col>
        <el-col :span="4">
          <div class="stat-item when">
            <div class="stat-label">repaired on</div>
            <div>{{ shortDate(summary.fixed && summary.fixed.fixed_at) }}</div>
          </div>
        </el-col>
      </el-row>

      <div v-if="summary.fixed_by_family && summary.fixed_by_family.length" class="by-family">
        <span class="muted">By family:</span>
        <el-tag
          v-for="f in summary.fixed_by_family"
          :key="f.family"
          size="mini"
          type="info"
          class="fam-tag"
        >{{ f.family }} · {{ f.n }}</el-tag>
      </div>
    </el-card>

    <!-- ------------------------- needs a manual decision ------------------------- -->
    <el-card v-if="unresolved.length" shadow="never" class="section">
      <div slot="header">
        <span class="section-title">Needs a manual decision ({{ unresolved.length }})</span>
      </div>
      <p class="purpose">
        Here the two columns disagree and the repair deliberately did <b>not</b> choose, because
        in most of these the <b>Genus column is the correct one</b> and the name is the outdated or
        misspelled one — rebuilding the genus from the name would have replaced something right
        with something wrong. Decide which column is correct; each choice is recorded and can be
        undone.
      </p>
      <el-table :data="unresolved" size="small" border>
        <el-table-column label="ID" prop="taxon_id" width="65" />
        <el-table-column label="Scientific name says" min-width="210">
          <template slot-scope="{ row }">
            {{ row.full_name }}
            <div class="muted xsmall">genus would become “{{ row.genus_if_rebuilt }}”</div>
          </template>
        </el-table-column>
        <el-table-column label="Genus column says" min-width="180">
          <template slot-scope="{ row }">
            <b>{{ row.genus_now }}</b>
            <div class="muted xsmall">name would become “{{ row.rename_suggestion }}”</div>
          </template>
        </el-table-column>
        <el-table-column label="Family" prop="family_name" width="140" />
        <el-table-column label="Specimens" prop="specimens" width="90" align="right" />
        <el-table-column label="Which one is right?" width="290" align="center">
          <template slot-scope="{ row }">
            <el-button size="mini" type="primary" plain @click="chooseName(row)">
              The name
            </el-button>
            <el-button
              size="mini"
              :type="row.rename_target_exists ? 'info' : 'warning'"
              plain
              @click="chooseGenus(row)"
            >
              The genus
            </el-button>
            <el-button size="mini" type="text" @click="chooseNeither(row)">Neither, leave it</el-button>
            <div v-if="row.rename_target_exists" class="muted xsmall">
              “{{ row.rename_suggestion }}” already exists — this one is a merge, not a rename
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="decisions.length" class="decided">
        <el-button type="text" size="small" @click="showDecided = !showDecided">
          <i :class="showDecided ? 'el-icon-arrow-down' : 'el-icon-arrow-right'" />
          {{ showDecided ? 'Hide' : 'Show' }} decisions already made ({{ decisions.length }})
        </el-button>
        <el-table v-show="showDecided" :data="decisions" size="mini" border class="decided-table">
          <el-table-column label="ID" prop="taxon_id" width="65" />
          <el-table-column label="Decision" width="150">
            <template slot-scope="{ row }">
              <el-tag :type="decisionTag(row.decision)" size="mini">
                {{ decisionLabel(row.decision) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="Change" min-width="300">
            <template slot-scope="{ row }">
              <span v-if="row.field">
                {{ row.field }}: <code class="before">{{ row.value_before }}</code>
                → <b class="after">{{ row.value_after }}</b>
              </span>
              <span v-else class="muted">nothing was changed</span>
            </template>
          </el-table-column>
          <el-table-column label="By" prop="decided_by" width="110" />
          <el-table-column label="When" width="150">
            <template slot-scope="{ row }">{{ shortDate(row.decided_at) }}</template>
          </el-table-column>
          <el-table-column width="90" align="center">
            <template slot-scope="{ row }">
              <el-button size="mini" type="text" @click="revert(row)">Undo</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <!-- ------------------------- repaired rows ------------------------- -->
    <el-card shadow="never" class="section">
      <div slot="header" class="clearfix">
        <span class="section-title">Repaired rows ({{ total }})</span>
        <el-input
          v-model="search"
          placeholder="Search name or genus…"
          size="mini"
          clearable
          style="width:240px;float:right"
          @keyup.enter.native="reload"
          @clear="reload"
        />
      </div>
      <p class="purpose small">
        Only the <b>Genus</b> column was rewritten. The scientific name was never touched —
        it is what the new genus was rebuilt <i>from</i> — so there is no before/after for it.
      </p>
      <el-table v-loading="loading" :data="fixed" size="small" border>
        <el-table-column label="ID" prop="taxon_id" width="70" />
        <el-table-column label="Scientific name (never changed)" prop="full_name" min-width="210" />
        <el-table-column label="Genus:  before  →  after" min-width="330">
          <template slot-scope="{ row }">
            <code class="before">{{ row.genus_before }}</code>
            <span class="arrow">→</span>
            <b class="after">{{ row.genus_after }}</b>
          </template>
        </el-table-column>
        <el-table-column label="Family" prop="family_name" width="150" />
      </el-table>
      <pagination
        v-show="total > 0"
        :total="total"
        :page.sync="query.page"
        :limit.sync="query.page_size"
        @pagination="load"
      />
    </el-card>
  </div>
</template>

<script>
import Pagination from '@/components/Pagination'
import {
  getGenusSummary, getFixedRows, getUnresolvedRows, getManualDecisions,
  rebuildGenus, renameTaxon, keepAsIs, revertDecision
} from '@/api/genusAudit'

export default {
  name: 'GenusRepairPanel',
  components: { Pagination },
  data() {
    return {
      loading: false,
      summary: {},
      fixed: [],
      unresolved: [],
      decisions: [],
      showDecided: false,
      total: 0,
      search: '',
      query: { page: 1, page_size: 20 }
    }
  },
  computed: {
    curator() { return this.$store.getters.name || 'curator' }
  },
  created() {
    this.load()
    this.loadUnresolved()
  },
  methods: {
    shortDate(v) { return v ? String(v).replace('T', ' ').slice(0, 16) : '—' },
    decisionLabel(d) {
      return { rebuild_genus: 'name was right', rename: 'genus was right',
        keep_as_is: 'left as is' }[d] || d
    },
    decisionTag(d) {
      return { rebuild_genus: 'primary', rename: 'warning', keep_as_is: 'info' }[d] || 'info'
    },

    // "The name is right" -> rebuild Genus from the name.
    async chooseName(row) {
      try {
        await this.$confirm(
          `Set the genus to “${row.genus_if_rebuilt}”, taken from the scientific name
           “${row.full_name}”. The name itself is not touched.`,
          'The scientific name is correct', { type: 'info' })
      } catch (e) { return }
      const res = await rebuildGenus(row.taxon_id, { decided_by: this.curator })
      this.afterDecision(res)
    },

    // "The genus is right" -> correct the name. The server refuses if that name already
    // exists, so the curator is sent to the merge tool instead of creating a duplicate.
    async chooseGenus(row) {
      let value
      try {
        const r = await this.$prompt(
          `Correct the scientific name so it matches the genus “${row.genus_now}”.`,
          'The genus column is correct',
          { inputValue: row.rename_suggestion, inputPlaceholder: 'e.g. Lepomis gulosus' })
        value = r.value
      } catch (e) { return }
      const res = await renameTaxon(row.taxon_id, {
        new_full_name: value, decided_by: this.curator
      })
      this.afterDecision(res)
    },

    async chooseNeither(row) {
      try {
        await this.$confirm(
          `Record that both columns are fine as they are (placeholders and hybrid notation
           legitimately look like this) and stop listing this row. Nothing is changed.`,
          'Leave it as it is', { type: 'info' })
      } catch (e) { return }
      const res = await keepAsIs(row.taxon_id, { decided_by: this.curator })
      this.afterDecision(res)
    },

    async revert(row) {
      try {
        await this.$confirm('Undo this decision and put the value back?', 'Undo',
          { type: 'warning' })
      } catch (e) { return }
      const res = await revertDecision(row.id, { reverted_by: this.curator })
      this.afterDecision(res)
    },

    afterDecision(res) {
      if (res.code === 20000) {
        this.$message.success(res.message || 'Done')
        // Genus / FullScientificName just changed, so the stored recheck result is stale
        this.$emit('data-changed')
        this.loadUnresolved()
        this.load()
      } else {
        // e.g. "renaming would create a duplicate -- merge them instead"
        this.$message({ message: res.message, type: 'warning', duration: 8000, showClose: true })
      }
    },
    reload() { this.query.page = 1; this.load() },
    async load() {
      this.loading = true
      try {
        const [sum, rows] = await Promise.all([
          getGenusSummary(),
          getFixedRows({ ...this.query, search: this.search })
        ])
        this.summary = sum.data || {}
        this.fixed = (rows.data && rows.data.items) || []
        this.total = (rows.data && rows.data.total) || 0
      } catch (e) {
        this.$message.error('Failed to load the genus repair report')
      } finally {
        this.loading = false
      }
    },
    async loadUnresolved() {
      try {
        const [un, dec] = await Promise.all([getUnresolvedRows(), getManualDecisions()])
        this.unresolved = (un.data && un.data.items) || []
        this.decisions = (dec.data && dec.data.items) || []
      } catch (e) {
        this.unresolved = []
        this.decisions = []
      }
    }
  }
}
</script>

<style scoped>
.genus-repair-panel { padding: 4px; }
.section { margin-top: 16px; }
.section-title { font-size: 15px; font-weight: 600; }
.purpose { margin: 0 0 12px; color: #606266; font-size: 13px; line-height: 1.75; }
.purpose code { background: #f4f4f5; padding: 1px 5px; border-radius: 3px; font-size: 12px; }
.stat-row { margin-top: 4px; }
.stat-item { text-align: center; padding: 8px 0; background: #fafafa; border-radius: 4px; }
.stat-item.when { text-align: left; padding-left: 14px; }
.stat-number { font-size: 22px; font-weight: 600; }
.stat-number.ok { color: #67c23a; }
.stat-number.warn { color: #e6a23c; }
.stat-label { font-size: 12px; color: #909399; }
.by-family { margin-top: 12px; }
.fam-tag { margin: 2px 4px 2px 0; }
.muted { color: #909399; }
.before { color: #c0504d; font-size: 12px; word-break: break-all; }
.after { color: #67c23a; }
.arrow { margin: 0 8px; color: #909399; }
.small { font-size: 12px; }
.xsmall { font-size: 11px; line-height: 1.5; }
.decided { margin-top: 12px; border-top: 1px solid #ebeef5; padding-top: 8px; }
.decided-table { margin-top: 8px; }
</style>
