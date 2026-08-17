<template>
  <el-drawer
    :visible.sync="open"
    :with-header="false"
    size="60%"
    class="name-groups-drawer"
    @open="load"
  >
    <div class="ng-body">
      <div class="ng-head">
        <h3>Decide once per name</h3>
        <p class="muted">
          Every row of the spreadsheet was imported as its own record, so the same name can
          appear hundreds of times and ask for the same judgement each time. Confirming a name
          here applies it to every record in this batch still waiting on species review.
          Specimens are not re-identified — each record simply gets the taxon you confirmed.
        </p>
        <el-alert v-if="summary.clicks_saved > 0" type="info" :closable="false">
          <b>{{ summary.total_pending }}</b> records are waiting on
          <b>{{ summary.total_groups }}</b> distinct names — deciding by name instead of by
          record is <b>{{ summary.clicks_saved }}</b> fewer decisions.
        </el-alert>

        <!-- One name matched to several taxa is not a normal "pick one" situation. The
             importer answers the same spelling the same way every time, so this means the
             matching itself was inconsistent — and any record it already marked verified was
             settled against one of these answers with nobody looking at it. Those records are
             as suspect as the pending ones, which is why this is an error and not a hint. -->
        <el-alert
          v-if="summary.inconsistent_names > 0"
          type="error"
          :closable="false"
          show-icon
          style="margin-top: 8px"
        >
          <template slot="title">
            {{ summary.inconsistent_names }}
            {{ summary.inconsistent_names === 1 ? 'name was' : 'names were' }} matched to more
            than one taxon — the matching is not consistent for
            {{ summary.inconsistent_names === 1 ? 'it' : 'them' }}
          </template>
          The same spelling should always resolve to the same taxon, so this points at the
          local taxonomy having changed mid-import or at two duplicate rows of one name.
          <b v-if="summary.inconsistent_verified_records > 0">
            {{ summary.inconsistent_verified_records }} record{{
              summary.inconsistent_verified_records === 1 ? '' : 's'
            }} inside these names {{ summary.inconsistent_verified_records === 1 ? 'is' : 'are' }}
            already marked verified against one of the conflicting answers and should be
            re-checked as well — record numbers are listed on each row below.
          </b>
          <span v-else>Nothing inside them is verified yet.</span>
        </el-alert>
      </div>

      <div class="ng-controls">
        <el-input
          v-model="q"
          size="small"
          clearable
          placeholder="Filter by name"
          prefix-icon="el-icon-search"
          style="width: 260px"
        />
        <!-- Inconsistent names are actionable now (one Apply per taxon), so hiding them here
             would hide the ones that most need attention. Only names with no suggestion at
             all are filtered out. -->
        <el-checkbox v-model="onlyActionable" style="margin-left: 12px">
          Only names with a suggestion
        </el-checkbox>
        <span class="muted small" style="margin-left: auto">
          {{ visible.length }} of {{ groups.length }} names
        </span>
      </div>

      <el-table
        v-loading="loading"
        :data="visible"
        size="small"
        border
        height="420"
      >
        <el-table-column label="Imported name" min-width="220">
          <template slot-scope="{ row }">
            <span class="ng-name">{{ row.name_key }}</span>
            <div v-if="row.verbatim_families.length" class="muted xsmall">
              filed as {{ row.verbatim_families.slice(0, 3).join(', ') }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Records" width="90" align="right">
          <template slot-scope="{ row }">
            <b>{{ row.pending_records }}</b>
          </template>
        </el-table-column>
        <el-table-column label="Suggested taxon" min-width="260">
          <template slot-scope="{ row }">
            <template v-if="row.state === 'single'">
              <div>{{ row.suggestions[0].full_name }}</div>
              <div class="muted xsmall">{{ row.suggestions[0].family || 'no family' }}</div>
            </template>
            <!-- A name whose records point at different taxa is not one decision, and it used
                 to render as a warning tag with no button and no instruction — a dead end.
                 Each answer now gets its own line, its own record counts and its own Apply, so
                 the name can be worked through instead of stared at. -->
            <template v-else-if="row.state === 'mixed'">
              <el-tag type="danger" size="mini">
                matched inconsistently — {{ row.suggestions.length }} taxa
              </el-tag>
              <div
                v-for="t in (row.by_taxon || [])"
                :key="t.taxon_id"
                class="ng-answer"
              >
                <div class="ng-answer-main">
                  <span>{{ t.full_name || ('taxon ' + t.taxon_id) }}</span>
                  <el-button
                    v-if="t.pending_records > 0"
                    size="mini"
                    type="text"
                    :loading="applying === applyKey(row, t)"
                    @click="confirm(row, t)"
                  >Apply to {{ t.pending_records }}</el-button>
                </div>
                <div class="muted xsmall">
                  {{ t.family || 'no family' }} ·
                  matched by {{ t.match_statuses.join('/') || 'unknown' }}
                </div>
                <!-- the part the curator cannot see anywhere else: records already committed
                     to this answer, with numbers to go look them up -->
                <div v-if="t.verified_records > 0" class="ng-answer-verified">
                  {{ t.verified_records }} record{{ t.verified_records === 1 ? '' : 's' }}
                  already verified on this answer — re-check
                  {{ t.verified_sample_ids.join(', ')
                  }}{{ t.verified_records > t.verified_sample_ids.length ? ' …' : '' }}
                </div>
              </div>
            </template>
            <span v-else class="muted">no automatic match — review these records individually</span>
          </template>
        </el-table-column>
        <el-table-column width="110" align="center">
          <template slot-scope="{ row }">
            <el-button
              v-if="row.state === 'single'"
              size="mini"
              type="text"
              :loading="applying === applyKey(row)"
              @click="confirm(row)"
            >Apply to all</el-button>
            <!-- mixed rows carry their own per-taxon buttons in the column to the left -->
            <span v-else-if="row.state === 'mixed'" class="muted xsmall">one at a time</span>
          </template>
        </el-table-column>
      </el-table>

      <el-button type="text" size="small" @click="showHistory = !showHistory">
        <i :class="showHistory ? 'el-icon-arrow-down' : 'el-icon-arrow-right'" />
        {{ showHistory ? 'Hide' : 'Show' }} what has already been decided
        <span v-if="history.length">({{ history.length }})</span>
      </el-button>

      <div v-if="showHistory" class="ng-history">
        <el-table :data="history" size="mini" border max-height="240">
          <el-table-column label="Name" prop="name_key" min-width="180" />
          <el-table-column label="Taxon" prop="taxon_name" min-width="180" />
          <el-table-column label="Records" prop="records_applied" width="90" align="right" />
          <el-table-column label="Set to" width="100">
            <template slot-scope="{ row }">
              <el-tag :type="row.species_status === 'verified' ? 'success' : 'warning'" size="mini">
                {{ row.species_status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="By" min-width="150">
            <template slot-scope="{ row }">
              {{ row.applied_by || '—' }}
              <div class="muted xsmall">{{ shortDate(row.applied_at) }}</div>
            </template>
          </el-table-column>
          <el-table-column label="Status" width="90">
            <template slot-scope="{ row }">
              <el-tag :type="row.status === 'undone' ? 'info' : 'success'" size="mini">
                {{ row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column width="80" align="center">
            <template slot-scope="{ row }">
              <el-button
                v-if="row.status === 'applied'"
                size="mini"
                type="text"
                @click="undo(row)"
              >Undo</el-button>
            </template>
          </el-table-column>
        </el-table>
        <p class="muted small">
          Undo puts every record back exactly as it was. A record edited since is skipped, not
          overwritten.
        </p>
      </div>

      <!-- The cross-batch half of the same idea. The list above is "what has been decided in
           THIS batch"; this is "what has been decided ever", which is what future imports are
           pre-filled from. It lives here because it is the same question one step out, and
           because a ruling that turns out wrong has to be revocable from where the curator
           notices it. -->
      <el-button type="text" size="small" @click="toggleReference">
        <i :class="showReference ? 'el-icon-arrow-down' : 'el-icon-arrow-right'" />
        {{ showReference ? 'Hide' : 'Show' }} names decided on earlier batches
        <span v-if="refStats.active">({{ refStats.active }})</span>
      </el-button>

      <div v-if="showReference" class="ng-history">
        <p class="muted small" style="margin: 4px 0 8px">
          When a name here turns up in a future import, its taxon is filled in automatically
          and the record is left <b>pending</b> with a "Previously corrected" mark — an
          inherited answer still gets confirmed, so one wrong entry cannot quietly spread
          through every delivery.
          <span v-if="refStats.records_prefilled">
            So far <b>{{ refStats.records_prefilled }}</b> record(s) have been pre-filled this
            way.
          </span>
        </p>

        <el-input
          v-model="refQuery"
          size="mini"
          clearable
          placeholder="Filter by imported name or taxon"
          prefix-icon="el-icon-search"
          style="width: 260px; margin-bottom: 8px"
          @input="loadReference"
        />

        <el-table v-loading="refLoading" :data="reference" size="mini" border max-height="260">
          <el-table-column label="Imported name" min-width="170">
            <template slot-scope="{ row }">
              <span class="ng-name">{{ row.name_key }}</span>
            </template>
          </el-table-column>
          <el-table-column label="Means" min-width="190">
            <template slot-scope="{ row }">
              <div>{{ row.current_taxon_name || row.taxon_name }}</div>
              <div class="muted xsmall">{{ row.family || 'no family' }}</div>
              <!-- a changed ruling keeps its old answer in view; a silent change here would
                   redirect every future batch with nothing to show for it -->
              <div v-if="row.previous_taxon_name" class="muted xsmall">
                was {{ row.previous_taxon_name }}, changed by {{ row.updated_by || '—' }}
              </div>
            </template>
          </el-table-column>
          <el-table-column label="Decided by" min-width="130">
            <template slot-scope="{ row }">
              {{ row.decided_by || '—' }}
              <div class="muted xsmall">
                {{ shortDate(row.decided_at) }}
                <span v-if="row.source_batch">· {{ row.source_batch }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="Reused" width="80" align="right">
            <template slot-scope="{ row }">
              <b v-if="row.times_reused">{{ row.times_reused }}</b>
              <span v-else class="muted">—</span>
            </template>
          </el-table-column>
          <el-table-column width="90" align="center">
            <template slot-scope="{ row }">
              <el-button
                v-if="row.status === 'active'"
                size="mini"
                type="text"
                :loading="retiring === row.id"
                @click="retire(row)"
              >Stop using</el-button>
              <el-tag v-else size="mini" type="info">retired</el-tag>
            </template>
          </el-table-column>
        </el-table>
        <p v-if="!refLoading && !reference.length" class="muted small">
          Nothing decided yet. Entries appear here as the curator confirms names in batch
          review.
        </p>
      </div>
    </div>
  </el-drawer>
</template>

<script>
import {
  getNameGroups, previewNameGroup, applyNameGroup, getNameGroupHistory, undoNameGroup,
  previewUndoNameGroup
} from '@/api/verbatimworkspace'
import {
  getNameDecisions, getNameDecisionStats, retireNameDecision
} from '@/api/nameDecision'

export default {
  name: 'NameGroupsPanel',
  props: {
    visibleSync: { type: Boolean, default: false },
    batchSerialId: { type: String, default: '' },
    curator: { type: String, default: '' },
    // Set when the drawer is opened from a specific record ("every record with this name is
    // the same"), so the curator lands on that name instead of scrolling 1999 rows to it.
    initialFilter: { type: String, default: '' }
  },
  data() {
    return {
      loading: false,
      groups: [],
      summary: {},
      history: [],
      showHistory: false,
      q: '',
      onlyActionable: false,
      applying: '',
      // the cross-batch reference table (names decided on earlier batches)
      showReference: false,
      reference: [],
      refStats: {},
      refQuery: '',
      refLoading: false,
      retiring: 0
    }
  },
  computed: {
    open: {
      get() { return this.visibleSync },
      set(v) { this.$emit('update:visibleSync', v) }
    },
    visible() {
      const q = this.q.trim().toLowerCase()
      return this.groups.filter(g => {
        if (this.onlyActionable && g.state === 'none') return false
        return !q || g.name_key.indexOf(q) !== -1
      })
    }
  },
  methods: {
    shortDate(v) { return v ? String(v).replace('T', ' ').slice(0, 16) : '' },

    async load() {
      if (!this.batchSerialId) return
      this.q = this.initialFilter || ''
      this.loading = true
      try {
        const [g, h] = await Promise.all([
          getNameGroups(this.batchSerialId, { only_pending: true, min_size: 2 }),
          getNameGroupHistory(this.batchSerialId)
        ])
        this.groups = (g.data && g.data.items) || []
        this.summary = g.data || {}
        this.history = (h.data && h.data.items) || []
      } catch (e) {
        this.$message.error('Failed to load name groups')
      } finally {
        this.loading = false
      }
    },

    // Keyed by name AND taxon: an inconsistent name shows one button per taxon, and only the
    // button that was pressed should spin.
    applyKey(row, taxon) {
      return row.name_key + '#' + (taxon ? taxon.taxon_id : (row.suggestions[0] || {}).taxon_id)
    },

    // Preview first: the curator is about to change hundreds of rows, and whether they come
    // out verified or still pending is decided by the family check, not by this click.
    // `taxon` is passed for an inconsistent name, where the row offers several answers and
    // the click means "this one", not "the row".
    async confirm(row, taxon) {
      const taxonId = taxon ? taxon.taxon_id : row.suggestions[0].taxon_id
      const key = this.applyKey(row, taxon)
      this.applying = key
      let p
      try {
        const res = await previewNameGroup(this.batchSerialId,
          { name_key: row.name_key, taxon_id: taxonId })
        if (res.code !== 20000) { this.$message.error(res.message); return }
        p = res.data
      } catch (e) {
        return
      } finally {
        this.applying = ''
      }

      let msg = `Assign ${p.taxon.full_name} (${p.taxon.family || 'no family'}) to all ` +
        `${p.records_to_apply} records imported as "${p.name_key}"?`
      msg += '\n\nThey will be marked verified.'
      // An inconsistent name is applied one answer at a time, so say what is NOT covered by
      // this click -- otherwise the name stays in the list afterwards and looks like the
      // button failed.
      if (row.state === 'mixed') {
        const others = (row.by_taxon || []).filter(t => t.taxon_id !== taxonId)
        const left = others.reduce((n, t) => n + t.pending_records, 0)
        const stillVerified = others.reduce((n, t) => n + t.verified_records, 0)
        if (left) {
          msg += `\n\nThis name was matched inconsistently. ${left} more record(s) with the ` +
            'same spelling point at a different taxon and are NOT covered by this click — ' +
            'they stay in the list for a separate decision.'
        }
        if (stillVerified) {
          msg += `\n\n${stillVerified} record(s) with this spelling are already marked ` +
            'verified against a different answer. This click does not touch them; they need ' +
            'checking by hand.'
        }
      }
      // Advice, not a block -- same as applying the suggestion one record at a time. The
      // warning is written to every record so it can be acted on later.
      if (p.family_reference_warning) {
        msg += `\n\nFlagged on each: ${p.family_reference_warning.message}`
      }
      if (p.family_suggestion_warnings.length) {
        msg += `\n\n${p.family_suggestion_warnings.length} imported-family mismatch(es) will ` +
          'be flagged on the records.'
      }
      msg += '\n\nThis can be undone.'

      try {
        await this.$confirm(msg, 'Apply to all records with this name', { type: 'warning' })
      } catch (e) { return }

      this.applying = key
      try {
        const res = await applyNameGroup(this.batchSerialId,
          { name_key: row.name_key, taxon_id: taxonId, applied_by: this.curator })
        if (res.code === 20000) {
          this.$message.success(res.message)
          this.$emit('applied')
          await this.load()
        } else {
          this.$message.error(res.message)
        }
      } catch (e) {
        // the interceptor already surfaced the server's message
      } finally {
        this.applying = ''
      }
    },

    toggleReference() {
      this.showReference = !this.showReference
      if (this.showReference) this.loadReference()
    },

    async loadReference() {
      this.refLoading = true
      try {
        const [d, s] = await Promise.all([
          getNameDecisions({ q: this.refQuery, status: 'all', limit: 300 }),
          getNameDecisionStats()
        ])
        this.reference = (d.data && d.data.items) || []
        this.refStats = s.data || {}
      } catch (e) {
        this.$message.error('Failed to load the decided names')
      } finally {
        this.refLoading = false
      }
    },

    // Revoking is the safeguard, so it says out loud what stays behind: future imports stop
    // using the ruling, but records it already pre-filled are NOT rewritten -- some may have
    // been confirmed by a curator since, and silently reverting those would be a worse bug
    // than the wrong ruling.
    async retire(row) {
      const reused = row.times_reused
        ? `\n\nIt has already pre-filled ${row.times_reused} record(s). Those are left exactly ` +
          'as they are — this only affects future imports.'
        : ''
      try {
        await this.$confirm(
          `Stop using "${row.name_key}" → ${row.current_taxon_name || row.taxon_name}?` +
          '\n\nFuture imports will no longer fill this name in automatically. The entry is ' +
          'kept for the record.' + reused,
          'Stop using this decision', { type: 'warning' })
      } catch (e) { return }
      this.retiring = row.id
      try {
        const res = await retireNameDecision(row.id, { retired_by: this.curator })
        if (res.code === 20000) {
          this.$message.success(res.message)
          await this.loadReference()
        } else {
          this.$message.error(res.message)
        }
      } catch (e) {
        // the interceptor already surfaced the server's message
      } finally {
        this.retiring = 0
      }
    },

    async undo(row) {
      // Ask the server what it would actually do first. `records_applied` is what the apply
      // touched, not what undo will restore -- records edited since are left alone, and being
      // told that only in the result message afterwards reads like the undo half failed.
      let plan = null
      try {
        const res = await previewUndoNameGroup(row.id)
        if (res.code === 20000) plan = res.data
      } catch (e) {
        // fall through to the plain wording rather than blocking the undo
      }

      let msg = plan
        ? `Put ${plan.would_restore} record(s) back the way they were?`
        : `Put these ${row.records_applied} records back the way they were?`
      if (plan && plan.would_skip) {
        msg += `\n\n${plan.would_skip} of the ${plan.records_applied} record(s) this applied ` +
          'to have been edited since, so they are left exactly as they are — this undo only ' +
          'reverses its own changes.'
        if (plan.skipped_record_ids && plan.skipped_record_ids.length) {
          msg += `\nLeft alone: ${plan.skipped_record_ids.slice(0, 8).join(', ')}` +
            `${plan.skipped_record_ids.length > 8 ? ' …' : ''}`
        }
      }

      try {
        await this.$confirm(msg, 'Undo', { type: 'warning' })
      } catch (e) { return }
      try {
        const res = await undoNameGroup(row.id, { undone_by: this.curator })
        if (res.code === 20000) {
          this.$message.success(res.message)
          this.$emit('applied')
          await this.load()
        } else {
          this.$message.error(res.message)
        }
      } catch (e) {
        // handled by the interceptor
      }
    }
  }
}
</script>

<style scoped>
/* element-ui 2.13.2 的 .el-drawer 是 overflow:hidden，.el-drawer__body 只有 flex:1、
   没有 overflow —— 两边都没人负责滚动，内容一超过屏幕高度就被裁掉，展开一行之后下面的
   既看不见也滚不到。高度 flex:1 已经给足了，只差这一句。 */
.name-groups-drawer >>> .el-drawer__body { overflow: auto; }
.ng-body { padding: 20px 24px; }
.ng-head h3 { margin: 0 0 6px; }
.ng-head p { margin: 0 0 12px; line-height: 1.6; }
.ng-controls { display: flex; align-items: center; margin: 16px 0 10px; }
.ng-name { font-style: italic; }
.ng-answer { padding: 4px 0; border-top: 1px solid #f0f0f0; }
.ng-answer:first-of-type { border-top: none; margin-top: 4px; }
.ng-answer-main { display: flex; align-items: center; justify-content: space-between; }
.ng-answer-verified { color: #f56c6c; font-size: 11px; }
.ng-history { margin-top: 10px; }
.muted { color: #909399; }
.small { font-size: 12px; }
.xsmall { font-size: 11px; }
</style>
