<!--
  RecheckPanel.vue
  Whole-DB taxonomic recheck: scans in-use taxa against the CoF reference, classifies each,
  and lets the curator apply a correction (which writes a new determination for every affected
  specimen). Backend: /api/synonym-review/recheck/*.

  The tool DETECTS + SUGGESTS; the curator DECIDES. Only clean-binomial EXACT_SYNONYM with a
  single authoritative target is one-click "Apply". Everything else (RECOMBINATION / HYBRID /
  TRINOMIAL / multi-target) is "Resolve": the curator picks the target from the reference DB.

  Three endings per row, not two: Apply (a real re-identification), "Not a problem" (dismiss --
  records the decision, changes no data; most of a scan ends here), and Resolve.

  A target that does not exist locally is NOT invented by the apply: its family could only be
  guessed, and a family-less taxon drops out of family checks, statistics and the tree without
  an error. Resolve opens the normal CreateSpeciesForm instead, and the apply then runs against
  the id that form returned.
-->
<template>
  <div class="recheck-panel">
    <el-card>
      <div slot="header" class="clearfix">
        <span class="text-lg font-medium">Whole-DB Taxonomic Recheck</span>
        <el-button
          style="float:right;margin-left:10px;"
          type="primary"
          size="small"
          :loading="scanning"
          @click="handleScan"
        >
          <i class="el-icon-refresh" /> Scan in-use taxa
        </el-button>
        <el-button style="float:right;" type="text" size="small" @click="openUndo">
          <i class="el-icon-time" /> Undo history
        </el-button>
      </div>

      <!--
        The list below is a stored scan result, not a live query. Decisions taken in the other
        two tabs change the taxon table underneath it, so it has to be re-run to be true --
        without this the curator works through rows that a decision has already answered.
      -->
      <el-alert
        v-if="rescanNeeded"
        type="warning"
        show-icon
        :closable="false"
        class="stale-alert"
      >
        <div>
          <b>This list is out of date.</b> You have made decisions in the other tabs since it was
          produced — this list still shows the taxon table as it was before them. Scan again so it
          matches.
        </div>
        <el-button
          size="mini"
          type="warning"
          style="margin-top:8px;"
          :loading="scanning"
          @click="handleScan"
        >Scan again now</el-button>
      </el-alert>

      <p class="lead">
        Every name in the collection that is currently attached to a specimen was looked up in the
        Catalog of Fishes. The list below is only the names where the Catalog says something
        different from us — names that already agree are not shown.
      </p>

      <el-button type="text" size="small" class="explain-toggle" @click="explain = !explain">
        <i :class="explain ? 'el-icon-arrow-down' : 'el-icon-arrow-right'" /> How do I work through this list?
      </el-button>
      <div v-show="explain" class="explainer">
        <p>
          <b>Every row has three possible endings</b>, and most rows end in the second one:
        </p>
        <p>
          <span class="opt apply">Apply</span> — the Catalog is unambiguous: our name is a known
          synonym of one accepted name. Applying moves the specimens onto that name. Their old
          determination is kept as history, and the new one is stamped with you and today's date,
          because deciding this <i>is</i> a re-identification. Undoable from “Undo history”.
        </p>
        <p>
          <span class="opt dismiss">Not a problem</span> — you looked, and our name stays. Nothing
          in the data changes; it only records that this row has been dealt with so the next scan
          does not ask again. <b>Use this freely</b> — of a typical scan only a small part is a real
          correction, and without it the same hundreds of rows come back every time.
        </p>
        <p>
          <span class="opt resolve">Resolve…</span> — the Catalog offers more than one answer, or
          the row is a hybrid / subspecies / “sp.” where no automatic answer is safe. You pick the
          target yourself. If the right name is not in the Catalog at all, you can type it and,
          when it does not exist in our database either, create it there and then — through the
          normal taxon form, so you set its family rather than letting the tool guess.
        </p>
        <p class="cat-help">
          <b>What the labels mean.</b><br>
          <b>EXACT_SYNONYM</b> — the Catalog lists our name as a synonym of one accepted name.
          This is the only case that can be applied in one click.<br>
          <b>EXACT_VALID</b> — the Catalog accepts our name exactly as it is. Nothing is wrong with
          the name; the row is here <i>only</i> because of the family flag, which is settled once
          for the whole collection in the <b>Taxon Data Quality</b> tab.<br>
          <b>RECOMBINATION</b> — our name is not in the Catalog, but the same <i>species epithet</i>
          exists under a different genus. Often that is the same fish moved to another genus — but
          epithets are reused between completely unrelated fish: <i>Notropis atherinoides</i> (a
          minnow) matches <i>Pterengraulis atherinoides</i> (an anchovy) on the epithet alone. So
          this is never applied automatically; you confirm the target.<br>
          <b>TRINOMIAL</b> — a subspecies, e.g. <i>Notropis venustus cercostigma</i>. It is listed
          because its first two words (the species part) are out of date in the Catalog. You decide
          whether to move it to the current species name or keep the subspecies as it is.<br>
          <b>HYBRID</b> — a cross (“A × B”); there is no single correct name.<br>
          <b>NO_BINOMIAL</b> — genus-only or “sp.” placeholders.<br>
          <b>NOT_IN_COF</b> — the Catalog has never heard of this name.
        </p>
        <p class="cat-help">
          A <b>family flag</b> on a row is separate: it means we file the genus under a different
          family than the Catalog. That is settled once for the whole collection in the
          <b>Taxon Data Quality</b> tab, not here.
        </p>
      </div>

      <!-- stats -->
      <el-row :gutter="12" class="stat-row">
        <el-col :span="4"><div class="stat-item"><div class="stat-number">{{ totals.total || 0 }}</div><div class="stat-label">Still to review</div></div></el-col>
        <el-col :span="4"><div class="stat-item"><div class="stat-number ok">{{ totals.appliable || 0 }}</div><div class="stat-label">One-click</div></div></el-col>
        <el-col :span="4"><div class="stat-item"><div class="stat-number warn">{{ totals.family_mismatch || 0 }}</div><div class="stat-label">Family flag</div></div></el-col>
        <el-col :span="4"><div class="stat-item"><div class="stat-number">{{ (settled.applied || 0) }}</div><div class="stat-label">Corrected</div></div></el-col>
        <el-col :span="4"><div class="stat-item"><div class="stat-number">{{ (settled.dismissed || 0) }}</div><div class="stat-label">Marked OK</div></div></el-col>
      </el-row>

      <!-- category filter chips -->
      <div class="chips">
        <el-tag
          v-for="c in categoryChips"
          :key="c.value"
          :type="filters.category === c.value ? c.color : 'info'"
          :effect="filters.category === c.value ? 'dark' : 'plain'"
          class="chip"
          @click="setCategory(c.value)"
        >
          {{ c.label }}<span v-if="byCategory[c.value]"> ({{ byCategory[c.value].count }})</span>
        </el-tag>
      </div>

      <div class="toolbar">
        <el-checkbox v-model="filters.appliable" @change="reload">One-click only</el-checkbox>
        <el-checkbox v-model="filters.family_mismatch" @change="reload">Family mismatch</el-checkbox>
        <!--
          Bulk "not a problem". A scan's long tail (whole categories like NOT_IN_COF or
          NO_BINOMIAL) is usually settled the same way, and clearing it one row at a time is
          what makes the backlog feel endless. Deliberately only enabled once a filter narrows
          the set -- the server refuses a call with no selector at all.
        -->
        <el-button
          size="mini"
          type="info"
          plain
          style="margin-left:12px;"
          :disabled="!hasFilter"
          :title="hasFilter ? '' : 'Pick a category or filter first'"
          @click="batchDismiss"
        >
          Mark all {{ total }} filtered as “not a problem”
        </el-button>
        <el-input
          v-model="filters.search"
          placeholder="Search name…"
          size="small"
          clearable
          style="width:240px;margin-left:12px;"
          @keyup.enter.native="reload"
          @clear="reload"
        >
          <el-button slot="append" icon="el-icon-search" @click="reload" />
        </el-input>
      </div>

      <!-- table -->
      <el-table v-loading="loading" :data="rows" size="small" border style="width:100%;margin-top:12px;">
        <el-table-column label="Current name" min-width="200">
          <template slot-scope="{ row }">
            <span class="name">{{ row.current_full_name }}</span>
            <el-tag v-if="row.family_mismatch" type="warning" size="mini" effect="plain" style="margin-left:6px;">family?</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Category" width="140">
          <template slot-scope="{ row }">
            <el-tag :type="catColor(row.category)" size="mini">{{ row.category }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Suggested / candidates" min-width="220">
          <template slot-scope="{ row }">
            <span v-if="row.appliable" class="suggest">{{ row.suggested_full_name }}</span>
            <span v-else-if="row.suggested_full_name" class="suggest-weak">{{ row.suggested_full_name }} <em>(confirm)</em></span>
            <span v-else-if="row.candidates && row.candidates.length" class="cands">
              {{ row.candidates.slice(0,3).join('; ') }}<span v-if="row.candidates.length>3"> … (+{{ row.candidates.length-3 }})</span>
            </span>
            <span v-else class="muted">—</span>
          </template>
        </el-table-column>
        <el-table-column label="Family" min-width="190">
          <template slot-scope="{ row }">
            <span>{{ row.current_family || '—' }}</span>
            <!--
              A family disagreement is one decision for the whole collection, not one per
              taxon (Cyprinidae->Leuciscidae alone covers 584 rows). Settling it here row by
              row would be the same question hundreds of times, so this only points at the
              tab where it is settled once.
            -->
            <div v-if="row.family_mismatch" class="ref-fam">
              Catalog says <b>{{ row.reference_family }}</b>
              <el-button type="text" size="mini" class="goto" @click="gotoFamily(row)">
                decide once →
              </el-button>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="Specimens" width="90" align="right">
          <template slot-scope="{ row }">{{ row.in_use_count }}</template>
        </el-table-column>
        <el-table-column label="Action" width="235" align="center">
          <template slot-scope="{ row }">
            <el-button v-if="row.appliable" type="success" size="mini" @click="openApply(row)">Apply</el-button>
            <el-button v-else type="warning" size="mini" plain @click="openResolve(row)">Resolve…</el-button>
            <el-button size="mini" type="text" @click="dismissOne(row)">Not a problem</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        style="margin-top:12px;text-align:right;"
        background
        layout="total, prev, pager, next, sizes"
        :total="total"
        :page-size="pageSize"
        :current-page="page"
        :page-sizes="[20,50,100]"
        @current-change="onPage"
        @size-change="onSize"
      />
    </el-card>

    <!-- Apply / confirm dialog (one-click EXACT_SYNONYM) -->
    <el-dialog :visible.sync="applyDlg" title="Confirm correction" width="520px">
      <div v-if="current">
        <p><b>{{ current.current_full_name }}</b> &rarr; <b>{{ applyTargetName }}</b></p>
        <el-alert v-if="preview" :closable="false" type="info" show-icon style="margin:8px 0;">
          This will retire the current determination and add a new one for
          <b>{{ preview.current_determinations }}</b> specimen(s)
          ({{ preview.affected_primaries }} lot/record(s)).
          <span v-if="preview.target && preview.target.will_create">The target taxon will be created.</span>
        </el-alert>
        <p class="muted">New determination is stamped with you ({{ curator }}) and today's date; the
          old determination is kept as history.</p>
      </div>
      <span slot="footer">
        <el-button @click="applyDlg=false">Cancel</el-button>
        <el-button type="primary" :loading="applying" @click="doApply(null)">Confirm &amp; apply</el-button>
      </span>
    </el-dialog>

    <!-- Resolve dialog (needs-manual: pick target from reference) -->
    <el-dialog :visible.sync="resolveDlg" title="Resolve — pick the correct taxon" width="620px">
      <div v-if="current">
        <p><b>{{ current.current_full_name }}</b>
          <el-tag :type="catColor(current.category)" size="mini">{{ current.category }}</el-tag>
          <span class="muted"> · {{ current.in_use_count }} specimen(s)</span></p>
        <div v-if="current.candidates && current.candidates.length" class="cand-box">
          Reference candidates (same epithet — verify, homonyms possible):
          <el-tag v-for="c in current.candidates" :key="c" size="mini" class="chip" @click="pickName(c)">{{ c }}</el-tag>
        </div>
        <el-input
          v-model="refKeyword"
          placeholder="Search reference DB (CoF)…"
          size="small"
          style="margin-top:10px;"
          @keyup.enter.native="searchRef"
        >
          <el-button slot="append" icon="el-icon-search" @click="searchRef">Search</el-button>
        </el-input>
        <el-table
          v-loading="refLoading"
          :data="refResults"
          size="mini"
          border
          height="240"
          style="margin-top:8px;"
          highlight-current-row
          @current-change="pickRef"
        >
          <el-table-column label="Name" min-width="180">
            <template slot-scope="{ row }">{{ row.scientific_name }}</template>
          </el-table-column>
          <el-table-column label="Rank" width="90" prop="rank" />
          <el-table-column label="Status" width="90">
            <template slot-scope="{ row }">
              <el-tag :type="row.status==='valid' ? 'success':'warning'" size="mini">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="Accepted" min-width="160">
            <template slot-scope="{ row }">{{ row.valid_name }}</template>
          </el-table-column>
        </el-table>
        <!--
          The correct name is not always in the reference: the Catalog snapshot lags, and some
          museum material sits under names it has never carried. Without this the curator is
          stuck on rows the search cannot answer.
        -->
        <div class="manual-target">
          <el-checkbox v-model="manualEntry">The correct name is not in the list — let me type it</el-checkbox>
          <div v-if="manualEntry" class="manual-body">
            <el-input
              v-model="manualName"
              size="small"
              placeholder="e.g. Lepomis gulosus — genus and species"
              @input="onManualName"
            />
            <div v-if="manualName && manualLookup" class="lookup">
              <template v-if="manualLookup.exists">
                <i class="el-icon-success ok" />
                Already in our database (taxon #{{ manualLookup.taxon_id }}) — the specimens will
                be moved onto it.
              </template>
              <template v-else>
                <i class="el-icon-warning warn" />
                Not in our database yet. Create it first, so you set its family yourself —
                a taxon created automatically would have its family guessed.
                <el-button size="mini" type="primary" plain style="margin-left:8px;" @click="openCreate">
                  Create “{{ manualName }}”…
                </el-button>
              </template>
            </div>
          </div>
        </div>

        <el-alert v-if="chosenTarget" :closable="false" type="success" show-icon style="margin-top:10px;">
          Target: <b>{{ chosenTarget }}</b> — will add a new determination for
          {{ current.in_use_count }} specimen(s).
        </el-alert>
      </div>
      <span slot="footer">
        <el-button @click="resolveDlg=false">Cancel</el-button>
        <el-button
          type="primary"
          :loading="applying"
          :disabled="!chosenTarget"
          @click="doApply(chosenTarget)"
        >Apply to target</el-button>
      </span>
    </el-dialog>

    <!--
      Creating the target taxon. Reuses the same form as Species Verification instead of
      letting the apply invent one: there the curator sets the family explicitly, and a taxon
      with a guessed (or missing) family silently disappears from family checks and statistics.
    -->
    <el-dialog
      :visible.sync="createDlg"
      title="Create the taxon first"
      width="640px"
      append-to-body
    >
      <p class="muted xsmall" style="margin-top:0">
        Once it exists, the correction is applied against it and the specimens move over.
      </p>
      <create-species-form
        v-if="createDlg"
        :verbatim-data="createPrefill"
        @submit="onCreated"
        @cancel="createDlg = false"
      />
    </el-dialog>

    <!-- Undo history -->
    <el-dialog :visible.sync="undoDlg" title="Apply history / undo" width="760px">
      <el-table v-loading="undoLoading" :data="applyLog" size="mini" border>
        <el-table-column label="When" width="150">
          <template slot-scope="{ row }">{{ formatTime(row.applied_at) }}</template>
        </el-table-column>
        <el-table-column label="Correction" min-width="240">
          <template slot-scope="{ row }">{{ row.old_name }} &rarr; {{ row.new_name }}</template>
        </el-table-column>
        <el-table-column label="Specimens" width="90" align="right" prop="determinations_changed" />
        <el-table-column label="By" width="110" prop="applied_by" />
        <el-table-column label="Status" width="100">
          <template slot-scope="{ row }">
            <el-tag :type="statusColor(row.status)" size="mini">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="" width="90" align="center">
          <template slot-scope="{ row }">
            <el-button
              v-if="row.status==='applied'"
              type="danger"
              size="mini"
              plain
              @click="doUndo(row)"
            >Undo</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script>
import {
  recheckScan, recheckReviews, recheckStats, recheckPreview, recheckApply,
  recheckApplyLog, recheckApplyLogDetail, recheckUndo, searchReferenceTaxa,
  recheckDismiss, recheckBatchDismiss
} from '@/api/synonymReview'
// Same creation path as Species Verification: POST /api/taxon/taxon, created_via='reviewer_create'
import { addTaxon } from '@/api/table'
import CreateSpeciesForm from '@/components/RecordsProcessor/CreateSpeciesForm.vue'

const CATS = [
  { value: '', label: 'All', color: 'primary' },
  { value: 'EXACT_SYNONYM', label: 'Synonym', color: 'success' },
  { value: 'RECOMBINATION', label: 'Recombination', color: 'warning' },
  { value: 'TRINOMIAL', label: 'Subspecies', color: 'info' },
  { value: 'HYBRID', label: 'Hybrid', color: 'danger' },
  { value: 'NO_BINOMIAL', label: 'Genus-level', color: 'info' },
  { value: 'NOT_IN_COF', label: 'Not in CoF', color: 'info' },
  { value: 'EXACT_VALID', label: 'Valid', color: 'info' }
]

export default {
  name: 'RecheckPanel',
  components: { CreateSpeciesForm },
  props: {
    // true when a decision in another tab has invalidated the stored scan result
    rescanNeeded: { type: Boolean, default: false }
  },
  data() {
    return {
      scanning: false, loading: false,
      rows: [], total: 0, page: 1, pageSize: 20,
      totals: {}, byCategory: {}, settled: {},
      categoryChips: CATS,
      explain: false,
      // free-text target for rows the reference search cannot answer
      manualEntry: false, manualName: '', manualLookup: null, lookupTimer: null,
      createDlg: false, createPrefill: null,
      filters: { category: '', appliable: false, family_mismatch: false, search: '' },
      // apply
      applyDlg: false, resolveDlg: false, applying: false,
      current: null, preview: null,
      // resolve
      refKeyword: '', refResults: [], refLoading: false, chosenTarget: null, chosenTaxonId: null,
      // undo
      undoDlg: false, undoLoading: false, applyLog: []
    }
  },
  computed: {
    curator() { return this.$store.getters.name || 'curator' },
    applyTargetName() { return this.current ? this.current.suggested_full_name : '' },
    // Bulk dismiss needs a selector; without one it would clear the whole backlog, which is
    // the hardest kind of mistake to notice afterwards. The server refuses it too.
    hasFilter() {
      return !!(this.filters.category || this.filters.appliable || this.filters.family_mismatch)
    }
  },
  created() {
    this.loadStats()
    this.reload()
  },
  methods: {
    catColor(c) {
      const m = { EXACT_SYNONYM: 'success', RECOMBINATION: 'warning', HYBRID: 'danger',
        TRINOMIAL: '', NO_BINOMIAL: 'info', NOT_IN_COF: 'info', EXACT_VALID: 'info' }
      return m[c] === undefined ? 'info' : m[c]
    },
    statusColor(s) {
      return { applied: 'success', running: 'warning', failed: 'danger', undone: 'info' }[s] || 'info'
    },
    formatTime(t) { return t ? String(t).replace('T', ' ').slice(0, 19) : '' },
    setCategory(v) { this.filters.category = v; this.reload() },
    onPage(p) { this.page = p; this.load() },
    onSize(s) { this.pageSize = s; this.page = 1; this.load() },
    reload() { this.page = 1; this.load() },

    async loadStats() {
      try {
        const res = await recheckStats()
        this.totals = (res.data && res.data.totals) || {}
        this.byCategory = (res.data && res.data.by_category) || {}
        this.settled = (res.data && res.data.settled) || {}
      } catch (e) { /* ignore */ }
    },
    async load() {
      this.loading = true
      try {
        const res = await recheckReviews({
          page: this.page, page_size: this.pageSize, status: 'pending',
          category: this.filters.category || undefined,
          appliable: this.filters.appliable ? true : undefined,
          family_mismatch: this.filters.family_mismatch ? true : undefined,
          search: this.filters.search || undefined
        })
        this.rows = (res.data && res.data.items) || []
        this.total = (res.data && res.data.total) || 0
      } finally { this.loading = false }
    },
    async handleScan() {
      this.scanning = true
      try {
        const res = await recheckScan()
        this.$message.success(res.message || 'Scan done')
        this.$emit('scanned') // the stored result now matches the taxon table again
        await this.loadStats()
        this.reload()
      } catch (e) {
        this.$message.error('Scan failed')
      } finally { this.scanning = false }
    },

    // ---- one-click apply ----
    async openApply(row) {
      this.current = row; this.preview = null; this.applyDlg = true
      try {
        const res = await recheckPreview(row.id, {})
        this.preview = res.data
      } catch (e) { /* preview is advisory */ }
    },
    // ---- resolve (needs-manual) ----
    openResolve(row) {
      this.current = row
      this.refKeyword = (row.current_full_name || '').split(' ')[0]
      this.refResults = []; this.chosenTarget = null; this.chosenTaxonId = null
      this.manualEntry = false; this.manualName = ''
      this.resolveDlg = true
    },
    pickName(name) { this.chosenTarget = name; this.chosenTaxonId = null },
    // Typed-in target. The apply refuses to invent a taxon, so tell the curator up front
    // whether this name exists — and if not, offer the creation form rather than a dead end.
    // The preview endpoint already answers "does this name exist locally", so no new API.
    onManualName(v) {
      const name = (v || '').trim()
      const ok = name.split(/\s+/).length >= 2
      this.chosenTarget = ok ? name : null
      this.chosenTaxonId = null
      this.manualLookup = null
      clearTimeout(this.lookupTimer)
      if (!ok || !this.current) return
      this.lookupTimer = setTimeout(async() => {
        try {
          const res = await recheckPreview(this.current.id, { target_name: name })
          const t = (res.data && res.data.target) || {}
          this.manualLookup = { exists: !!t.exists, taxon_id: t.taxon_id }
          if (t.exists && t.taxon_id) this.chosenTaxonId = t.taxon_id
        } catch (e) { this.manualLookup = null }
      }, 350)
    },
    openCreate() {
      const parts = this.manualName.trim().split(/\s+/)
      // CreateSpeciesForm prefills itself from a verbatim-shaped object
      this.createPrefill = {
        verbatim_genus: parts[0] || '',
        verbatim_species: parts[1] || '',
        verbatim_subspecies: parts.slice(2).join(' ') || '',
        verbatim_family: this.current ? this.current.current_family : ''
      }
      this.createDlg = true
    },
    async onCreated(speciesData) {
      this.createDlg = false
      try {
        const res = await addTaxon(speciesData)
        const items = (res.data && res.data.items) || []
        if (res.code !== 20000 || !items.length) {
          this.$message.error('Could not create the taxon')
          return
        }
        // Apply against the id we just created, never by name -- so nothing is auto-invented.
        this.chosenTaxonId = items[0].TaxonID
        this.chosenTarget = speciesData.fullScientificName
        this.manualLookup = { exists: true, taxon_id: this.chosenTaxonId }
        this.$message.success(
          `Created “${speciesData.fullScientificName}” (#${this.chosenTaxonId}) — now apply it`)
      } catch (e) {
        this.$message.error('Could not create the taxon')
      }
    },

    // A family disagreement belongs to the whole collection, so hand it to the tab that
    // settles it once instead of answering it here per taxon.
    gotoFamily(row) {
      this.$emit('goto-family', {
        local_family: row.current_family,
        reference_family: row.reference_family
      })
    },

    // ---- dismiss: the other way out of a row ----
    async dismissOne(row) {
      try {
        await this.$confirm(
          `Record that “${row.current_full_name}” is fine as it is and stop listing it.

           Nothing in the data changes — no specimen is touched. The row can be put back later
           from the dismissed filter.`,
          'Not a problem', { type: 'info' })
      } catch (e) { return }
      try {
        const res = await recheckDismiss(row.id, { reviewed_by: this.curator })
        if (res.code === 20000) {
          this.$message.success('Marked as reviewed — nothing was changed')
          this.loadStats(); this.load()
        } else {
          this.$message.error(res.message)
        }
      } catch (e) {
        this.$message.error('Failed to record')
      }
    },

    async batchDismiss() {
      if (!this.hasFilter) return
      const what = [
        this.filters.category ? `category ${this.filters.category}` : null,
        this.filters.appliable ? 'one-click only' : null,
        this.filters.family_mismatch ? 'family mismatch' : null
      ].filter(Boolean).join(', ')
      try {
        await this.$confirm(
          `Mark all ${this.total} rows matching “${what}” as reviewed, keeping our names.

           No specimen and no name is changed — this only records that they have been looked
           at, so the next scan does not list them again. Individual rows can be put back.`,
          `Mark ${this.total} rows as “not a problem”`, { type: 'warning' })
      } catch (e) { return }
      try {
        const res = await recheckBatchDismiss({
          reviewed_by: this.curator,
          category: this.filters.category || undefined,
          appliable: this.filters.appliable ? true : undefined,
          family_mismatch: this.filters.family_mismatch ? true : undefined
        })
        if (res.code === 20000) {
          this.$message.success(res.message || `${res.data.dismissed} rows marked`)
          this.loadStats(); this.load()
        } else {
          this.$message.error(res.message)
        }
      } catch (e) {
        this.$message.error('Bulk action failed')
      }
    },
    pickRef(row) {
      if (!row) return
      // prefer the accepted/valid name as the target
      this.chosenTarget = row.status === 'valid' ? row.scientific_name : (row.valid_name || row.scientific_name)
      this.chosenTaxonId = null
    },
    async searchRef() {
      if (!this.refKeyword || this.refKeyword.length < 2) return
      this.refLoading = true
      try {
        const res = await searchReferenceTaxa(this.refKeyword)
        this.refResults = (res.data && res.data.items) || []
      } finally { this.refLoading = false }
    },

    async doApply(targetName) {
      if (!this.current) return
      this.applying = true
      try {
        const payload = { applied_by: this.curator }
        // Prefer the id: applying by name is ambiguous when the same name exists twice, and
        // the backend refuses to invent a taxon that does not exist yet.
        if (this.chosenTaxonId) payload.target_taxon_id = this.chosenTaxonId
        else if (targetName) payload.target_name = targetName
        const res = await recheckApply(this.current.id, payload)
        if (res.code !== 20000) {
          // e.g. "'X' does not exist in the taxon table. Create it first…"
          this.$message({ message: res.message, type: 'warning', duration: 8000, showClose: true })
          return
        }
        const d = res.data || {}
        if (d.status === 'running') {
          this.$message.info(`Large apply started (${d.total_planned} specimens); tracking…`)
          this.pollApply(d.apply_log_id)
        } else {
          this.$message.success(res.message || 'Applied')
        }
        this.applyDlg = false; this.resolveDlg = false
        await this.loadStats(); this.load()
      } catch (e) {
        this.$message.error((e && e.message) || 'Apply failed')
      } finally { this.applying = false }
    },
    async pollApply(logId) {
      const tick = async() => {
        try {
          const res = await recheckApplyLogDetail(logId)
          const s = res.data && res.data.status
          if (s === 'applied') { this.$message.success('Background apply finished'); this.loadStats(); this.load(); return }
          if (s === 'failed') { this.$message.error('Background apply failed: ' + (res.data.error_message || '')); return }
          setTimeout(tick, 2000)
        } catch (e) { /* stop polling on error */ }
      }
      setTimeout(tick, 2000)
    },

    // ---- undo ----
    async openUndo() {
      this.undoDlg = true; this.undoLoading = true
      try {
        const res = await recheckApplyLog({ page: 1, page_size: 50 })
        this.applyLog = (res.data && res.data.items) || []
      } finally { this.undoLoading = false }
    },
    async doUndo(row) {
      try {
        await this.$confirm(
          `Undo "${row.old_name} → ${row.new_name}" (${row.determinations_changed} specimens)?`,
          'Undo apply', { type: 'warning' })
      } catch (e) { return }
      try {
        const res = await recheckUndo(row.id, { undone_by: this.curator })
        this.$message.success(res.message || 'Undone')
        this.openUndo(); this.loadStats(); this.load()
      } catch (e) { this.$message.error('Undo failed') }
    }
  }
}
</script>

<style scoped>
.stat-row { margin-bottom: 12px; }
.stat-item { text-align: center; padding: 8px; background: #f5f7fa; border-radius: 4px; }
.stat-number { font-size: 22px; font-weight: 600; }
.stat-number.ok { color: #67c23a; }
.stat-number.warn { color: #e6a23c; }
.stat-label { font-size: 12px; color: #909399; }
.chips { margin: 8px 0; }
.chip { cursor: pointer; margin: 0 6px 6px 0; }
.toolbar { display: flex; align-items: center; margin-top: 6px; }
.name { font-style: italic; }
.suggest { color: #67c23a; font-weight: 600; font-style: italic; }
.suggest-weak { color: #e6a23c; font-style: italic; }
.suggest-weak em { color: #909399; font-style: normal; font-size: 12px; }
.cands { color: #909399; font-style: italic; }
.muted { color: #909399; }
.xsmall { font-size: 11px; line-height: 1.55; margin: 6px 0 0; }
.lead { margin: 0 0 6px; color: #606266; font-size: 13px; line-height: 1.7; }
.explain-toggle { margin-bottom: 4px; }
.explainer {
  background: #f7f9fc;
  border-left: 3px solid #c0c4cc;
  padding: 10px 14px;
  margin-bottom: 12px;
  font-size: 13px;
  line-height: 1.75;
  color: #5a5e66;
}
.explainer p { margin: 0 0 8px; }
.explainer p:last-child { margin-bottom: 0; }
.explainer .cat-help { font-size: 12px; line-height: 1.85; color: #6b7079; }
.opt { display: inline-block; padding: 0 6px; border-radius: 3px; font-weight: 600; }
.opt.apply { background: #f0f9eb; color: #67c23a; }
.opt.dismiss { background: #f4f4f5; color: #606266; }
.opt.resolve { background: #fdf6ec; color: #e6a23c; }
.manual-target { margin-top: 12px; border-top: 1px dashed #dcdfe6; padding-top: 10px; }
.manual-body { margin-top: 8px; }
.lookup { margin-top: 8px; font-size: 12px; line-height: 1.7; color: #606266; }
.lookup .ok { color: #67c23a; }
.lookup .warn { color: #e6a23c; }
.goto { padding: 0 0 0 6px; }
.stale-alert { margin-bottom: 12px; }
.ref-fam { font-size: 12px; color: #e6a23c; }
.cand-box { margin-top: 8px; }
</style>
