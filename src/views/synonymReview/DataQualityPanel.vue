<!--
  DataQualityPanel.vue

  Two curator decisions that are NOT name corrections, kept on one screen precisely because
  their risk is different and that difference should be visible side by side:

    A. Family disagreements  -> writes one policy row. Reversible, moves no data.
    B. Duplicate taxa        -> moves specimens between two taxon rows. Real data change,
                                so it shows how many specimens ride on it, asks for an
                                explicit confirmation, and keeps an undo history.

  Backends are independent (/api/family-policy, /api/taxon-merge); only the section frame
  (DecisionSection) is shared.
-->
<template>
  <div class="data-quality-panel">

    <!-- ============================ A. family disagreements ============================ -->
    <decision-section
      title="Which family do we file these under?"
      purpose="Our database puts each genus in a family. The Catalog of Fishes sometimes puts it in a
               different one. Every record we import whose genus is on this list gets held back for
               someone to confirm — so settling a row here once stops that question coming back on
               every future batch."
      :caveat="famCaveat"
      :pending-count="famPairs.length"
      :decided-count="rulings.length"
      :loading="famLoading"
      :is-empty="!famPairs.length"
      empty-text="No family disagreements left to settle"
      @refresh="loadFamily"
    >
      <el-button type="text" size="small" class="explain-toggle" @click="famExplain = !famExplain">
        <i :class="famExplain ? 'el-icon-arrow-down' : 'el-icon-arrow-right'" /> What am I deciding here?
      </el-button>
      <div v-show="famExplain" class="explainer">
        <p>
          <b>Reading a row.</b> Take the first one below as an example: we file the genus
          <i>Peristedion</i> under <b>Triglidae</b>; the Catalog of Fishes files it under
          <b>Peristediidae</b>. That affects 14 of our taxa and the specimens under them.
        </p>
        <p>
          <b>Why they differ.</b> Usually the Catalog has split an older, broader family into
          several newer ones and we have not followed that change. It is a difference of
          scientific opinion, not necessarily an error on either side.
        </p>
        <p>
          <b>Why you are being asked.</b> The importer treats any such disagreement as
          “this taxon might be filed wrongly” and holds the record back for review. That is what
          we want when something really is misfiled — a freshwater catfish sitting under sturgeons —
          but it is wasted effort when it is a naming opinion you have already made up your mind
          about.
        </p>
        <p>
          <b>Your options.</b>
          <span class="opt keep">Keep ours</span> — our family is right for this collection; stop
          holding records back for it. The row moves to “already decided” below and can be undone.
          <span class="opt follow">Follow the Catalog</span> — records your intention to move these
          taxa later. <u>It changes nothing now</u> and records keep being held back, because
          actually moving a family is a separate bulk operation.
          <span class="opt move">Neither is right</span> — open the row, tick the taxa that are
          filed wrongly on both counts, and move them to the family you choose (creating it if
          we do not have it). <u>This one does change the taxonomy</u>: those taxa get a new
          family. Specimens are not re-identified, the old family is recorded for every taxon,
          and the move can be undone.
          <span class="opt none">Do nothing</span> — records keep being held back for review.
        </p>
      </div>

      <el-alert
        v-if="focusPair"
        type="info"
        :closable="false"
        show-icon
        class="focus-note"
      >
        Brought here from the recheck list to settle
        <b>{{ focusPair.local_family }} → {{ focusPair.reference_family }}</b> — highlighted below.
        Deciding it clears every recheck row that carries this flag.
      </el-alert>

      <el-table
        ref="famTable"
        :data="famPairs"
        size="small"
        border
        :row-class-name="famRowClass"
        @expand-change="onExpand"
      >
        <el-table-column type="expand">
          <template slot-scope="{ row }">
            <div v-loading="taxaLoading[pairKey(row)]" class="taxa-detail">
              <p class="muted small">
                The {{ row.taxa }} taxa this decision covers — these are the records that get
                held back on every import until it is settled. Tick any that belong in a
                different family altogether.
              </p>
              <el-table
                :ref="taxaRef(row)"
                :data="taxaByPair[pairKey(row)] || []"
                size="mini"
                border
                max-height="320"
                @selection-change="sel => onTaxaSelect(row, sel)"
              >
                <el-table-column type="selection" width="40" />
                <el-table-column label="ID" prop="TaxonID" width="70" />
                <el-table-column label="Scientific name" prop="full_name" min-width="220" />
                <el-table-column label="Genus" prop="genus" width="150" />
                <el-table-column label="Species" prop="species" width="150" />
                <el-table-column label="Specimens" prop="specimens" width="95" align="right" />
              </el-table>

              <div class="taxa-toolbar">
                <span v-if="selectedCount(row)" class="sel-count">
                  {{ selectedCount(row) }} selected ·
                  {{ selectedSpecimens(row) }} specimens
                </span>
                <span v-else class="muted small">
                  Neither <b>{{ row.local_family }}</b> nor <b>{{ row.reference_family }}</b> is
                  right for some of these? Tick them and move them where they belong.
                </span>
                <el-button
                  size="mini"
                  type="primary"
                  plain
                  :disabled="!selectedCount(row)"
                  @click="openMove(row)"
                >
                  Move selected to another family…
                </el-button>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="We file it under" prop="local_family" width="170" />
        <el-table-column label="Catalog of Fishes says" prop="reference_family" width="185" />
        <el-table-column label="Our taxa" prop="taxa" width="85" align="right" />
        <el-table-column label="Specimens" prop="determinations" width="95" align="right" />
        <el-table-column label="For example" min-width="240">
          <template slot-scope="{ row }">
            <span class="muted">
              we file <i>{{ row.sample_genera[0] }}</i> under {{ row.local_family }}<span
                v-if="row.sample_genera.length > 1"
              >, plus {{ row.sample_genera.length - 1 }} more genera</span>
              — <span class="hint">click the arrow to see all {{ row.taxa }}</span>
            </span>
          </template>
        </el-table-column>
        <el-table-column label="Decision" width="240" align="center">
          <template slot-scope="{ row }">
            <el-button size="mini" type="success" plain @click="rule(row, 'keep_local')">
              Keep ours
            </el-button>
            <el-button size="mini" type="warning" plain @click="rule(row, 'adopt_reference')">
              Follow the Catalog
            </el-button>
            <!-- Opens the row and ticks everything, so "the whole pair belongs elsewhere" is
                 one click, while the curator still sees exactly what is about to move. -->
            <el-button size="mini" type="text" class="neither" @click="neither(row)">
              Neither is right…
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <template slot="decided">
        <el-alert v-if="rulings.length" type="success" :closable="false" class="coverage">
          These {{ rulings.length }} decisions are holding down
          <b>{{ coveredTaxa }}</b> taxa and <b>{{ coveredDets }}</b> specimen records — that is
          how many rows would otherwise be held back for review on every import.
        </el-alert>

        <el-table :data="rulings" size="small" border @expand-change="onExpand">
          <!-- same expandable taxa list as the pending table: a decision covering 702 taxa
               should be inspectable after it is made, not only before -->
          <el-table-column type="expand">
            <template slot-scope="{ row }">
              <div v-loading="taxaLoading[pairKey(row)]" class="taxa-detail">
                <p class="muted small">
                  The {{ row.taxa }} taxa this decision covers. While it stands, these are
                  <b>not</b> held back for review.
                </p>
                <el-table :data="taxaByPair[pairKey(row)] || []" size="mini" border max-height="320">
                  <el-table-column label="ID" prop="TaxonID" width="70" />
                  <el-table-column label="Scientific name" prop="full_name" min-width="220" />
                  <el-table-column label="Genus" prop="genus" width="150" />
                  <el-table-column label="Species" prop="species" width="150" />
                  <el-table-column label="Specimens" prop="specimens" width="95" align="right" />
                </el-table>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="Decision" min-width="300">
            <template slot-scope="{ row }">
              <div>
                <b>{{ row.local_family }}</b>
                <span class="muted"> stays our family, not </span>
                <b>{{ row.reference_family }}</b>
                <el-tag v-if="row.decision !== 'keep_local'" type="warning" size="mini">
                  marked to move
                </el-tag>
              </div>
              <div v-if="row.sample_genera && row.sample_genera.length" class="muted xsmall">
                e.g. {{ row.sample_genera.slice(0, 4).join(', ') }}
              </div>
            </template>
          </el-table-column>
          <el-table-column label="Taxa" width="70" align="right">
            <template slot-scope="{ row }">
              <span class="hint">{{ row.taxa }}</span>
            </template>
          </el-table-column>
          <el-table-column label="Specimens" prop="determinations" width="95" align="right" />
          <el-table-column label="Decided by" min-width="170">
            <template slot-scope="{ row }">
              <span v-if="row.created_by === 'system_seed'" class="muted">
                set up with the feature
              </span>
              <span v-else>{{ row.created_by }}</span>
              <div class="muted xsmall">{{ shortDate(row.created_at) }}</div>
            </template>
          </el-table-column>
          <el-table-column label="Note" prop="note" min-width="200" show-overflow-tooltip />
          <el-table-column width="100" align="center">
            <template slot-scope="{ row }">
              <el-button size="mini" type="text" @click="revoke(row)">Revoke</el-button>
            </template>
          </el-table-column>
        </el-table>
        <p class="muted small">
          Revoking keeps the row — who decided what, and when, stays in the record — and that pair
          starts being held back for review again.
        </p>

        <!-- Moves are shown next to the rulings on purpose: they answer the same question, and
             a curator looking for "what did we decide about this family" should not have to
             know that one answer was recorded and another was carried out. -->
        <h4 class="sub-head">Families actually moved</h4>
        <p class="muted small">
          These changed the taxonomy: the taxa listed were repointed to a different family.
          Specimens were not touched — each one kept its identification, and the taxon it hangs
          off simply moved.
        </p>
        <el-table :data="moves" size="mini" border @expand-change="onMoveExpand">
          <el-table-column type="expand">
            <template slot-scope="{ row }">
              <div v-loading="moveTaxaLoading[row.id]" class="taxa-detail">
                <el-table :data="moveTaxa[row.id] || []" size="mini" border max-height="300">
                  <el-table-column label="ID" prop="taxon_id" width="70" />
                  <el-table-column label="Scientific name" prop="full_name" min-width="200" />
                  <el-table-column label="Was" prop="old_family_name" width="160" />
                  <el-table-column label="Now" prop="new_family_name" width="160" />
                  <el-table-column label="Specimens" prop="usage_count" width="95" align="right" />
                </el-table>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="Move" min-width="280">
            <template slot-scope="{ row }">
              <div>
                <b>{{ row.taxa_count }}</b> taxa
                <span v-if="row.source_local_family" class="muted">
                  from {{ row.source_local_family }} </span>
                <span class="muted">→</span>
                <b>{{ row.target_family_name }}</b>
                <el-tag v-if="row.target_family_created" type="warning" size="mini">
                  new family
                </el-tag>
              </div>
              <div v-if="row.note" class="muted xsmall">{{ row.note }}</div>
            </template>
          </el-table-column>
          <el-table-column label="Specimens" prop="specimens_count" width="95" align="right" />
          <el-table-column label="By" min-width="150">
            <template slot-scope="{ row }">
              {{ row.performed_by }}
              <div class="muted xsmall">{{ shortDate(row.performed_at) }}</div>
            </template>
          </el-table-column>
          <el-table-column label="Status" width="90">
            <template slot-scope="{ row }">
              <el-tag :type="row.status === 'undone' ? 'info' : 'success'" size="mini">
                {{ row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column width="90" align="center">
            <template slot-scope="{ row }">
              <el-button
                v-if="row.status === 'applied'"
                size="mini"
                type="text"
                @click="undoMove(row)"
              >Undo</el-button>
            </template>
          </el-table-column>
        </el-table>
      </template>
    </decision-section>

    <!-- ============================ B. duplicate taxa ================================= -->
    <decision-section
      title="Duplicate taxa"
      purpose="The same scientific name exists on two taxon rows, each holding its own specimens,
               so one species is split in two. Merging moves the specimens onto one row. Nothing is
               deleted and no specimen gains a re-identification: the original determiner and date are
               carried forward."
      :pending-count="dupGroups.length"
      :decided-count="mergeHistory.length"
      :loading="dupLoading"
      :is-empty="!dupGroups.length"
      empty-text="No duplicate taxa left"
      @refresh="loadDuplicates"
    >
      <el-table :data="dupGroups" size="small" border>
        <el-table-column label="Name" prop="name" min-width="200" />
        <el-table-column label="Rows holding specimens" min-width="300">
          <template slot-scope="{ row }">
            <el-tag
              v-for="m in row.members"
              :key="m.taxon_id"
              :type="m.taxon_id === row.recommended_winner ? 'success' : 'info'"
              :effect="m.taxon_id === row.recommended_winner ? 'dark' : 'plain'"
              size="mini"
              class="member-tag"
            >
              #{{ m.taxon_id }} · {{ m.determinations_current }} specimens
              <span v-if="m.family"> · {{ m.family }}</span>
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Will move" prop="determinations_to_move" width="95" align="right" />
        <el-table-column width="130" align="center">
          <template slot-scope="{ row }">
            <el-tag v-if="row.families_differ" type="danger" size="mini">families differ</el-tag>
            <el-tag v-else-if="row.kind === 'trivial'" type="info" size="mini">one side empty</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Action" width="110" align="center">
          <template slot-scope="{ row }">
            <el-button size="mini" type="primary" plain @click="openMerge(row)">Merge…</el-button>
          </template>
        </el-table-column>
      </el-table>

      <template slot="decided">
        <el-table :data="mergeHistory" size="mini" border>
          <el-table-column label="Merged" min-width="220">
            <template slot-scope="{ row }">
              #{{ row.old_taxon_id }} → #{{ row.new_taxon_id }} ({{ row.new_name }})
            </template>
          </el-table-column>
          <el-table-column label="Specimens" prop="determinations_changed" width="95" align="right" />
          <el-table-column label="By" prop="applied_by" width="120" />
          <el-table-column label="When" width="160">
            <template slot-scope="{ row }">{{ shortDate(row.applied_at) }}</template>
          </el-table-column>
          <el-table-column label="Status" width="90">
            <template slot-scope="{ row }">
              <el-tag :type="row.status === 'undone' ? 'info' : 'success'" size="mini">
                {{ row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column width="90" align="center">
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
          Undo the most recent merge first: later operations build on the determinations an
          earlier one created, and the server refuses an out-of-order undo.
        </p>
      </template>
    </decision-section>

    <!-- The move dialog itself lives in a shared component: batch review opens the same one
         from a record, and one decision should not have two dialogs. -->
    <family-move-dialog
      :visible.sync="moveDlg"
      :taxa="moveRows"
      :source-local-family="movePair ? movePair.local_family : ''"
      :source-reference-family="movePair ? movePair.reference_family : null"
      :curator="curator"
      @moved="onMoved"
    />

    <!-- ------------------------------- merge dialog ------------------------------- -->
    <el-dialog :visible.sync="mergeDlg" title="Merge duplicate taxa" width="620px">
      <div v-if="mergeTarget">
        <p class="dlg-name">{{ mergeTarget.name }}</p>
        <p class="muted">Choose the row to keep. Everything from the other row moves onto it.</p>
        <el-radio-group v-model="winnerId" class="winner-group">
          <el-radio
            v-for="m in mergeTarget.members"
            :key="m.taxon_id"
            :label="m.taxon_id"
            border
            class="winner-radio"
          >
            #{{ m.taxon_id }} — {{ m.determinations_current }} specimens
            <span v-if="m.family" class="muted"> · {{ m.family }}</span>
            <el-tag v-if="m.taxon_id === mergeTarget.recommended_winner" type="success" size="mini">
              recommended
            </el-tag>
          </el-radio>
        </el-radio-group>

        <el-alert v-if="preview" :closable="false" type="info" class="preview">
          <div>
            <b>{{ preview.determinations_to_move }}</b> determinations on
            <b>{{ preview.affected_primaries }}</b> specimen(s) will move from
            #{{ preview.loser.taxon_id }} onto #{{ preview.winner.taxon_id }}.
          </div>
          <div class="muted small">
            The losing row is kept and tagged as merged — not deleted. Each moved determination
            keeps its original determiner and date, and records which taxon it came from.
          </div>
          <div v-if="preview.families_differ" class="warn small">
            These two rows sit in different families — check that they really are the same taxon.
          </div>
        </el-alert>

        <el-input
          v-model="mergeNote"
          type="textarea"
          :rows="2"
          placeholder="Note (optional) — why these two are the same"
          class="note"
        />
      </div>
      <span slot="footer">
        <el-button @click="mergeDlg = false">Cancel</el-button>
        <el-button
          type="primary"
          :loading="merging"
          :disabled="!winnerId || !preview || !preview.determinations_to_move"
          @click="doMerge"
        >Merge</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import DecisionSection from './DecisionSection'
import FamilyMoveDialog from '@/components/FamilyMoveDialog'
import {
  getDisagreements, getDisagreementTaxa, getRulings, addRuling, revokeRuling,
  getReassignHistory, getReassignTaxa, undoReassign
} from '@/api/familyPolicy'
import { getDuplicateGroups, previewMerge, mergeTaxa, undoMerge, getMergeHistory } from '@/api/taxonMerge'

export default {
  name: 'DataQualityPanel',
  components: { DecisionSection, FamilyMoveDialog },
  props: {
    // Set when the recheck tab hands over a specific disagreement: {local_family,
    // reference_family}. That row is highlighted and opened so the curator lands on it
    // instead of hunting through 52 rows.
    focusPair: { type: Object, default: null }
  },
  data() {
    return {
      famLoading: false,
      famPairs: [],
      famCaveat: '',
      famExplain: false,
      rulings: [],
      coveredTaxa: 0,
      coveredDets: 0,
      // affected-taxa lists, fetched the first time a row is expanded and then kept
      taxaByPair: {},
      taxaLoading: {},

      // Per-pair tick state. Keyed by pair, not global: several rows can be open at once and
      // a selection must not leak from one family disagreement into another.
      selectedByPair: {},
      // The dialog owns the target/preview/note state now; this page only says which taxa,
      // and where they are coming from.
      moveDlg: false,
      movePair: null,
      moveRows: [],
      moves: [],
      moveTaxa: {},
      moveTaxaLoading: {},

      dupLoading: false,
      dupGroups: [],
      mergeHistory: [],

      mergeDlg: false,
      mergeTarget: null,
      winnerId: null,
      preview: null,
      mergeNote: '',
      merging: false
    }
  },
  computed: {
    curator() { return this.$store.getters.name || 'curator' }
  },
  watch: {
    // the preview follows whichever row the curator picks to keep
    winnerId(id) { if (id && this.mergeTarget) this.loadPreview(id) }
  },
  created() {
    this.loadFamily()
    this.loadDuplicates()
  },
  methods: {
    shortDate(v) { return v ? String(v).replace('T', ' ').slice(0, 16) : '' },

    // ---- A. family ---------------------------------------------------------------
    async loadFamily() {
      this.famLoading = true
      try {
        const [dis, rul, mov] = await Promise.all([
          getDisagreements(false), getRulings(false), getReassignHistory()
        ])
        this.famPairs = (dis.data && dis.data.pairs) || []
        this.famCaveat = (dis.data && dis.data.reference_caveat) || ''
        this.rulings = (rul.data && rul.data.items) || []
        this.coveredTaxa = (rul.data && rul.data.covered_taxa) || 0
        this.coveredDets = (rul.data && rul.data.covered_determinations) || 0
        this.moves = (mov.data && mov.data.items) || []
        // a moved taxon is no longer in the pair it came from, so cached lists are stale
        this.taxaByPair = {}
        this.selectedByPair = {}
        this.$nextTick(this.revealFocused)
      } catch (e) {
        this.$message.error('Failed to load family disagreements')
      } finally {
        this.famLoading = false
      }
    },
    pairKey(row) { return `${row.local_family}|${row.reference_family}` },
    isFocused(row) {
      const f = this.focusPair
      return !!f &&
        (f.local_family || '').toLowerCase() === (row.local_family || '').toLowerCase() &&
        (f.reference_family || '').toLowerCase() === (row.reference_family || '').toLowerCase()
    },
    famRowClass({ row }) { return this.isFocused(row) ? 'focused-row' : '' },
    // Open the handed-over row (and load its taxa) once the list has arrived.
    revealFocused() {
      if (!this.focusPair || !this.$refs.famTable) return
      const row = this.famPairs.find(r => this.isFocused(r))
      if (!row) return
      this.$refs.famTable.toggleRowExpansion(row, true)
      this.onExpand(row, true)
    },
    // Lazily load a row's taxa the first time it is opened; the pair alone is not enough to
    // judge, and loading all 52 lists up front would be wasteful.
    async onExpand(row, expanded) {
      const key = this.pairKey(row)
      const open = Array.isArray(expanded) ? expanded.includes(row) : expanded
      if (!open || this.taxaByPair[key]) return
      this.$set(this.taxaLoading, key, true)
      try {
        const res = await getDisagreementTaxa(row.local_family, row.reference_family)
        this.$set(this.taxaByPair, key, (res.data && res.data.items) || [])
      } catch (e) {
        this.$message.error('Failed to load the taxa for this row')
      } finally {
        this.$set(this.taxaLoading, key, false)
      }
    },
    async rule(row, decision) {
      const keep = decision === 'keep_local'
      const msg = keep
        ? `We keep filing these under ${row.local_family}, and the importer stops holding records
           back over ${row.reference_family}.

           Affects ${row.taxa} taxa and ${row.determinations} specimens. Nothing in the taxonomy
           changes — this only records the decision, and you can undo it below.`
        : `Record that these should eventually move from ${row.local_family} to
           ${row.reference_family}.

           Nothing moves now: this is a note of intent. Records will keep being held back until
           the family is actually moved, which is a separate operation.`
      try {
        await this.$confirm(msg, keep ? 'Keep our family' : 'Follow the Catalog later',
          { type: 'info' })
      } catch (e) { return }
      try {
        const res = await addRuling({
          local_family: row.local_family,
          reference_family: row.reference_family,
          decision,
          note: null,
          created_by: this.curator
        })
        if (res.code === 20000) {
          this.$message.success(res.message || 'Ruling saved')
          this.$emit('data-changed')
          this.loadFamily()
        } else {
          this.$message.error(res.message)
        }
      } catch (e) {
        this.$message.error('Failed to save the ruling')
      }
    },
    async revoke(row) {
      try {
        await this.$confirm(
          `Revoke the ruling for ${row.local_family} → ${row.reference_family}?
           This pair will start warning again.`, 'Revoke', { type: 'warning' })
      } catch (e) { return }
      const res = await revokeRuling(row.id, { revoked_by: this.curator })
      if (res.code === 20000) {
        this.$message.success(res.message || 'Revoked')
        this.$emit('data-changed')
        this.loadFamily()
      } else {
        this.$message.error(res.message)
      }
    },

    // ---- A2. "neither is right": move taxa to a family the curator picks -----------
    taxaRef(row) { return `taxa_${this.pairKey(row)}` },
    onTaxaSelect(row, sel) { this.$set(this.selectedByPair, this.pairKey(row), sel) },
    selected(row) { return this.selectedByPair[this.pairKey(row)] || [] },
    selectedCount(row) { return this.selected(row).length },
    selectedSpecimens(row) {
      return this.selected(row).reduce((s, r) => s + (r.specimens || 0), 0)
    },
    // Row-level shortcut: open the row, load its taxa, tick everything, open the dialog. The
    // curator still sees the full list before committing -- a pair can carry 700 taxa.
    async neither(row) {
      const table = this.$refs.famTable
      if (table) table.toggleRowExpansion(row, true)
      await this.onExpand(row, true)
      await this.$nextTick()
      const inner = this.$refs[this.taxaRef(row)]
      const t = Array.isArray(inner) ? inner[0] : inner
      if (t) t.toggleAllSelection()
      await this.$nextTick()
      if (this.selectedCount(row)) this.openMove(row)
    },
    openMove(row) {
      this.movePair = row
      this.moveRows = this.selected(row).slice()
      this.moveDlg = true
    },
    // The dialog did the write; this page only has to catch up.
    onMoved() {
      this.$emit('data-changed')
      this.loadFamily()
    },
    async onMoveExpand(row, expanded) {
      const open = Array.isArray(expanded) ? expanded.includes(row) : expanded
      if (!open || this.moveTaxa[row.id]) return
      this.$set(this.moveTaxaLoading, row.id, true)
      try {
        const res = await getReassignTaxa(row.id)
        this.$set(this.moveTaxa, row.id, (res.data && res.data.items) || [])
      } catch (e) {
        this.$message.error('Failed to load the moved taxa')
      } finally {
        this.$set(this.moveTaxaLoading, row.id, false)
      }
    },
    async undoMove(row) {
      try {
        await this.$confirm(
          `Put these ${row.taxa_count} taxa back into the family they came from?
           Any warning this move silenced starts again.`, 'Undo move', { type: 'warning' })
      } catch (e) { return }
      try {
        const res = await undoReassign(row.id, { undone_by: this.curator })
        if (res.code === 20000) {
          this.$message.success(res.message)
          this.$set(this.moveTaxa, row.id, undefined)
          this.$emit('data-changed')
          this.loadFamily()
        } else {
          this.$message.error(res.message)
        }
      } catch (e) {
        // refused undos (a taxon moved again since) are reported by the interceptor
      }
    },

    // ---- B. duplicates -----------------------------------------------------------
    async loadDuplicates() {
      this.dupLoading = true
      try {
        const [dup, hist] = await Promise.all([getDuplicateGroups(), getMergeHistory()])
        this.dupGroups = (dup.data && dup.data.groups) || []
        this.mergeHistory = (hist.data && (hist.data.items || hist.data.list)) || []
      } catch (e) {
        this.$message.error('Failed to load duplicate taxa')
      } finally {
        this.dupLoading = false
      }
    },
    openMerge(row) {
      this.mergeTarget = row
      this.mergeNote = ''
      this.preview = null
      this.mergeDlg = true
      this.winnerId = row.recommended_winner
      this.loadPreview(row.recommended_winner)
    },
    async loadPreview(winnerId) {
      const loser = this.mergeTarget.members.find(m => m.taxon_id !== winnerId)
      if (!loser) { this.preview = null; return }
      const res = await previewMerge(winnerId, loser.taxon_id)
      this.preview = res.code === 20000 ? res.data : null
    },
    async doMerge() {
      const loser = this.mergeTarget.members.find(m => m.taxon_id !== this.winnerId)
      this.merging = true
      try {
        const res = await mergeTaxa({
          winner_taxon_id: this.winnerId,
          loser_taxon_id: loser.taxon_id,
          merged_by: this.curator,
          notes: this.mergeNote || null
        })
        if (res.code === 20000) {
          this.$message.success(res.message)
          this.mergeDlg = false
          this.$emit('data-changed')
          this.loadDuplicates()
        } else {
          this.$message.error(res.message)
        }
      } catch (e) {
        this.$message.error('Merge failed')
      } finally {
        this.merging = false
      }
    },
    async undo(row) {
      try {
        await this.$confirm(
          `Undo this merge? ${row.determinations_changed} determinations go back to
           taxon #${row.old_taxon_id}.`, 'Undo merge', { type: 'warning' })
      } catch (e) { return }
      const res = await undoMerge(row.id, { undone_by: this.curator })
      if (res.code === 20000) {
        this.$message.success('Merge undone')
        this.$emit('data-changed')
        this.loadDuplicates()
      } else {
        this.$message.error(res.message)
      }
    }
  }
}
</script>

<style scoped>
.data-quality-panel { padding: 4px; }
.muted { color: #909399; }
.small { font-size: 12px; }
.warn { color: #e6a23c; }
.member-tag { margin: 2px 4px 2px 0; }
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
.opt { display: inline-block; padding: 0 6px; border-radius: 3px; font-weight: 600; }
.opt.keep { background: #f0f9eb; color: #67c23a; }
.opt.follow { background: #fdf6ec; color: #e6a23c; }
.opt.move { background: #ecf5ff; color: #409eff; }
.opt.none { background: #f4f4f5; color: #909399; }
.hint { color: #409eff; }
.taxa-detail { padding: 6px 12px 10px; background: #fafcff; }
.focus-note { margin-bottom: 10px; }
.taxa-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 8px;
}
.sel-count { font-size: 12px; font-weight: 600; color: #409eff; }
.sub-head { margin: 18px 0 4px; font-size: 13px; font-weight: 600; color: #303133; }
.xsmall { font-size: 11px; }
/* not scoped: el-table renders rows outside this component's scope id */
</style>

<style>
.el-table .focused-row { background: #fdf6ec !important; }
.el-table .focused-row td { border-color: #f5dab1; }
.dlg-name { font-size: 15px; font-weight: 600; margin: 0 0 4px; }
.winner-group { display: block; margin: 12px 0; }
.winner-radio { display: block; margin: 0 0 8px; }
.preview { margin-top: 8px; }
.note { margin-top: 12px; }
.picker-row { display: flex; align-items: center; gap: 10px; margin: 14px 0 4px; }
.neither { margin-left: 6px; }
</style>
