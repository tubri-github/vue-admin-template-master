<!--
  SynonymReview.vue
  Taxon Name Review Workspace

  Pipeline per name:
    Step 1: Spelling/phonetic correction (fuzzy match against TaxonRank)
    Step 2: Synonym resolution (is the corrected name a synonym?)

  Issue types:
    - 'spelling'         : Typo detected, corrected name is valid
    - 'synonym'          : Name correct but is a known synonym
    - 'spelling+synonym' : Typo AND corrected name is also a synonym
-->
<template>
  <div class="synonym-review">
    <!-- Header Card: Stats & Scan -->
    <el-card class="stats-card">
      <div slot="header" class="clearfix">
        <span class="text-lg font-medium">Taxon Name Review</span>
        <el-button
          style="float: right; margin-left: 10px;"
          type="primary"
          size="small"
          :loading="scanning"
          :disabled="!configStatus.accessible"
          @click="handleScan">
          <i class="el-icon-search"></i>
          Scan All Taxon Names
        </el-button>
        <el-button
          style="float: right;"
          type="text"
          size="small"
          @click="checkConfig">
          <i class="el-icon-connection"></i>
          Check DB Connection
        </el-button>
      </div>

      <!-- Config Warning -->
      <el-alert
        v-if="configChecked && !configStatus.accessible"
        title="TaxonRank database is not accessible. Please configure TAXON_DB_* in .env"
        type="warning"
        show-icon
        :closable="false"
        style="margin-bottom: 16px;">
      </el-alert>

      <!-- Stats Overview -->
      <el-row :gutter="16">
        <el-col :span="3">
          <div class="stat-item">
            <div class="stat-number">{{ stats.total_taxon_count || 0 }}</div>
            <div class="stat-label">Total Taxa</div>
          </div>
        </el-col>
        <el-col :span="3">
          <div class="stat-item">
            <div class="stat-number total">{{ stats.total_reviews || 0 }}</div>
            <div class="stat-label">Issues Found</div>
          </div>
        </el-col>
        <el-col :span="3">
          <div class="stat-item">
            <div class="stat-number pending">{{ stats.pending || 0 }}</div>
            <div class="stat-label">Pending</div>
          </div>
        </el-col>
        <el-col :span="3">
          <div class="stat-item">
            <div class="stat-number accepted">{{ stats.accepted || 0 }}</div>
            <div class="stat-label">Accepted</div>
          </div>
        </el-col>
        <el-col :span="3">
          <div class="stat-item">
            <div class="stat-number rejected">{{ stats.rejected || 0 }}</div>
            <div class="stat-label">Rejected</div>
          </div>
        </el-col>
        <el-col :span="3">
          <div class="stat-item">
            <div class="stat-number corrected">{{ stats.corrected || 0 }}</div>
            <div class="stat-label">Corrected</div>
          </div>
        </el-col>
        <el-col :span="3">
          <div class="stat-item">
            <div class="stat-number skipped">{{ stats.skipped || 0 }}</div>
            <div class="stat-label">Skipped</div>
          </div>
        </el-col>
      </el-row>
      <!-- Issue type breakdown -->
      <el-divider content-position="left" class="stat-divider">Issue Breakdown</el-divider>
      <el-row :gutter="16">
        <el-col :span="8">
          <div class="stat-item-inline">
            <el-tag type="warning" size="small" effect="plain">Spelling</el-tag>
            <span class="stat-inline-number">{{ stats.spelling_issues || 0 }}</span>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="stat-item-inline">
            <el-tag type="danger" size="small" effect="plain">Synonym</el-tag>
            <span class="stat-inline-number">{{ stats.synonym_issues || 0 }}</span>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="stat-item-inline">
            <el-tag type="" size="small" effect="plain">Spelling + Synonym</el-tag>
            <span class="stat-inline-number">{{ stats.spelling_synonym_issues || 0 }}</span>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- Filter & Actions Bar -->
    <el-card class="filter-card">
      <el-row :gutter="16" type="flex" align="middle">
        <el-col :span="12">
          <el-radio-group v-model="filterStatus" size="small" @change="handleFilterChange">
            <el-radio-button label="">All</el-radio-button>
            <el-radio-button label="pending">Pending</el-radio-button>
            <el-radio-button label="accepted">Accepted</el-radio-button>
            <el-radio-button label="rejected">Rejected</el-radio-button>
            <el-radio-button label="corrected">Corrected</el-radio-button>
          </el-radio-group>
        </el-col>
        <el-col :span="3">
          <el-select
            v-model="filterIssue"
            placeholder="Issue type"
            size="small"
            clearable
            @change="handleFilterChange">
            <el-option label="Spelling" value="spelling"></el-option>
            <el-option label="Synonym" value="synonym"></el-option>
            <el-option label="Spelling+Synonym" value="spelling+synonym"></el-option>
          </el-select>
        </el-col>
        <el-col :span="5">
          <el-input
            v-model="searchText"
            placeholder="Search taxon name..."
            prefix-icon="el-icon-search"
            size="small"
            clearable
            @clear="handleSearch"
            @keyup.enter.native="handleSearch">
          </el-input>
        </el-col>
        <el-col :span="4" style="text-align: right;">
          <el-dropdown
            trigger="click"
            :disabled="selectedRows.length === 0"
            @command="handleBatchAction">
            <el-button size="small" :disabled="selectedRows.length === 0">
              Batch ({{ selectedRows.length }})
              <i class="el-icon-arrow-down el-icon--right"></i>
            </el-button>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item command="batch-accept">
                <i class="el-icon-check"></i> Accept Selected
              </el-dropdown-item>
              <el-dropdown-item command="batch-reject">
                <i class="el-icon-close"></i> Reject Selected
              </el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </el-col>
      </el-row>
    </el-card>

    <!-- Review Table -->
    <el-card class="table-card">
      <el-table
        ref="reviewTable"
        v-loading="loading"
        :data="reviewList"
        border
        fit
        highlight-current-row
        @selection-change="handleSelectionChange"
        :row-class-name="tableRowClassName"
        style="width: 100%">

        <el-table-column type="selection" width="40" :selectable="isSelectable"></el-table-column>

        <el-table-column prop="taxon_id" label="ID" width="70" sortable></el-table-column>

        <!-- Issue Type -->
        <el-table-column label="Issue" width="110" align="center">
          <template slot-scope="{ row }">
            <el-tag size="mini" :type="getIssueTagType(row.issue_type)">
              {{ getIssueLabel(row.issue_type) }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- Name Comparison: genus / species / family with diff highlighting -->
        <el-table-column label="Name Comparison" min-width="420">
          <template slot-scope="{ row }">
            <div class="name-compare">
              <div class="compare-header">
                <span class="compare-cell label-cell"></span>
                <span class="compare-cell">Genus</span>
                <span class="compare-cell">Species</span>
                <span class="compare-cell family-col">Family</span>
              </div>
              <!-- Original -->
              <div class="compare-row">
                <span class="compare-cell label-cell">Original</span>
                <span class="compare-cell sci-name">{{ row.current_genus }}</span>
                <span class="compare-cell sci-name">{{ row.current_species }}</span>
                <span class="compare-cell family-col family-text">{{ row.current_family || '-' }}</span>
              </div>
              <!-- Corrected (only for spelling issues) -->
              <div v-if="row.corrected_full_name" class="compare-row">
                <span class="compare-cell label-cell">Corrected</span>
                <span class="compare-cell sci-name" :class="{ 'field-changed': row.corrected_genus !== row.current_genus }">
                  {{ row.corrected_genus }}
                </span>
                <span class="compare-cell sci-name" :class="{ 'field-changed': row.corrected_species !== row.current_species }">
                  {{ row.corrected_species }}
                </span>
                <span class="compare-cell family-col family-text">
                  <span class="conf-badge">{{ row.correction_type }} {{ Math.round((row.correction_confidence || 0) * 100) }}%</span>
                </span>
              </div>
              <!-- Suggested Valid -->
              <div class="compare-row">
                <span class="compare-cell label-cell">Valid</span>
                <span class="compare-cell sci-name"
                  :class="{ 'field-changed': row.suggested_genus !== (row.corrected_genus || row.current_genus) }">
                  {{ row.suggested_genus }}
                </span>
                <span class="compare-cell sci-name"
                  :class="{ 'field-changed': row.suggested_species !== (row.corrected_species || row.current_species) }">
                  {{ row.suggested_species }}
                </span>
                <span class="compare-cell family-col family-text">-</span>
              </div>
              <!-- Final (if specialist overrode) -->
              <div v-if="row.final_valid_name && row.final_valid_name !== row.suggested_full_name" class="compare-row final-row">
                <span class="compare-cell label-cell">Final</span>
                <span class="compare-cell sci-name final-name" style="flex: 3;">{{ row.final_valid_name }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <!-- Confidence -->
        <el-table-column label="Conf." width="65" align="center">
          <template slot-scope="{ row }">
            <span class="confidence-text">{{ Math.round((row.match_confidence || 0) * 100) }}%</span>
          </template>
        </el-table-column>

        <!-- WoRMS -->
        <el-table-column label="WoRMS" width="60" align="center">
          <template slot-scope="{ row }">
            <el-tooltip content="Search on WoRMS" placement="top">
              <el-button
                type="text"
                size="mini"
                @click="openWorms(row.worms_url)">
                <i class="el-icon-link" style="font-size: 16px;"></i>
              </el-button>
            </el-tooltip>
          </template>
        </el-table-column>

        <!-- Status -->
        <el-table-column label="Status" width="90" align="center">
          <template slot-scope="{ row }">
            <el-tag size="small" :type="getStatusTagType(row.review_status)" effect="dark">
              {{ row.review_status }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- Actions -->
        <el-table-column label="Actions" width="200" align="center" fixed="right">
          <template slot-scope="{ row }">
            <el-tooltip content="Accept" placement="top">
              <el-button type="success" size="mini" icon="el-icon-check" circle @click="handleAccept(row)"></el-button>
            </el-tooltip>
            <el-tooltip content="Reject" placement="top">
              <el-button type="danger" size="mini" icon="el-icon-close" circle @click="handleReject(row)"></el-button>
            </el-tooltip>
            <el-tooltip content="Correct: provide the right name" placement="top">
              <el-button type="warning" size="mini" icon="el-icon-edit" circle @click="handleCorrect(row)"></el-button>
            </el-tooltip>
            <el-tooltip content="Skip" placement="top">
              <el-button type="info" size="mini" icon="el-icon-minus" circle plain @click="handleSkip(row)"></el-button>
            </el-tooltip>
            <el-tooltip v-if="row.review_status !== 'pending'" content="Reset to pending" placement="top">
              <el-button size="mini" icon="el-icon-refresh-left" circle @click="handleReset(row)"></el-button>
            </el-tooltip>
            <el-button type="text" size="mini" icon="el-icon-view" @click="showDetail(row)"></el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination
        v-show="total > 0"
        :total="total"
        :page.sync="listQuery.page"
        :limit.sync="listQuery.page_size"
        @pagination="fetchReviewList">
      </pagination>
    </el-card>

    <!-- Detail Dialog -->
    <el-dialog :visible.sync="detailDialogVisible" title="Review Detail" width="750px">
      <div v-if="detailData" class="detail-content">
        <el-descriptions :column="2" border size="medium">
          <el-descriptions-item label="TaxonID">{{ detailData.taxon_id }}</el-descriptions-item>
          <el-descriptions-item label="Issue Type">
            <el-tag size="small" :type="getIssueTagType(detailData.issue_type)">
              {{ getIssueLabel(detailData.issue_type) }}
            </el-tag>
          </el-descriptions-item>

          <el-descriptions-item label="Original Name" :span="2">
            <span class="scientific-name original">{{ detailData.current_full_name }}</span>
            <span v-if="detailData.current_family" class="family-tag" style="margin-left:8px;">{{ detailData.current_family }}</span>
          </el-descriptions-item>

          <template v-if="detailData.corrected_full_name">
            <el-descriptions-item label="Corrected Name" :span="2">
              <span class="scientific-name corrected">{{ detailData.corrected_full_name }}</span>
              <span class="confidence-tag" style="margin-left:8px;">
                {{ detailData.correction_type }} ({{ Math.round((detailData.correction_confidence || 0) * 100) }}%)
              </span>
            </el-descriptions-item>
          </template>

          <el-descriptions-item label="Suggested Valid Name" :span="2">
            <span class="scientific-name suggested">{{ detailData.suggested_full_name }}</span>
          </el-descriptions-item>

          <template v-if="detailData.final_valid_name">
            <el-descriptions-item label="Final Valid Name" :span="2">
              <span class="scientific-name final">{{ detailData.final_valid_name }}</span>
            </el-descriptions-item>
          </template>

          <el-descriptions-item label="Detection">{{ detailData.detection_method }}</el-descriptions-item>
          <el-descriptions-item label="Confidence">{{ Math.round((detailData.match_confidence || 0) * 100) }}%</el-descriptions-item>

          <el-descriptions-item label="Usage Count" :span="2">
            {{ detailData.usage_count || 0 }} records reference this TaxonID
          </el-descriptions-item>

          <!-- WoRMS links -->
          <el-descriptions-item label="WoRMS (Original)" :span="2">
            <el-link type="primary" :href="detailData.worms_current_url" target="_blank" :underline="true">
              <i class="el-icon-link"></i> {{ detailData.current_full_name }}
            </el-link>
          </el-descriptions-item>
          <template v-if="detailData.worms_corrected_url">
            <el-descriptions-item label="WoRMS (Corrected)" :span="2">
              <el-link type="primary" :href="detailData.worms_corrected_url" target="_blank" :underline="true">
                <i class="el-icon-link"></i> {{ detailData.corrected_full_name }}
              </el-link>
            </el-descriptions-item>
          </template>
          <template v-if="detailData.worms_suggested_url && detailData.suggested_full_name !== detailData.corrected_full_name">
            <el-descriptions-item label="WoRMS (Valid)" :span="2">
              <el-link type="primary" :href="detailData.worms_suggested_url" target="_blank" :underline="true">
                <i class="el-icon-link"></i> {{ detailData.suggested_full_name }}
              </el-link>
            </el-descriptions-item>
          </template>

          <el-descriptions-item label="Status">
            <el-tag :type="getStatusTagType(detailData.review_status)" size="small" effect="dark">
              {{ detailData.review_status }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="Reviewed By">{{ detailData.reviewed_by || '-' }}</el-descriptions-item>
          <el-descriptions-item v-if="detailData.reviewed_at" label="Reviewed At" :span="2">
            {{ formatDate(detailData.reviewed_at) }}
          </el-descriptions-item>
          <el-descriptions-item v-if="detailData.review_notes" label="Notes" :span="2">
            {{ detailData.review_notes }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- Quick actions from detail dialog -->
        <div class="detail-actions">
          <el-divider></el-divider>
          <el-button type="success" icon="el-icon-check" @click="handleAcceptFromDetail">Accept</el-button>
          <el-button type="danger" icon="el-icon-close" @click="handleRejectFromDetail">Reject</el-button>
          <el-button type="warning" icon="el-icon-edit" @click="handleCorrectFromDetail">Correct</el-button>
          <el-button type="info" icon="el-icon-minus" plain @click="handleSkipFromDetail">Skip</el-button>
          <el-button v-if="detailData.review_status !== 'pending'" icon="el-icon-refresh-left" @click="handleResetFromDetail">Reset</el-button>
        </div>
      </div>
      <span slot="footer">
        <el-button @click="detailDialogVisible = false">Close</el-button>
      </span>
    </el-dialog>

    <!-- Reject Action Dialog (notes only, no reviewer) -->
    <el-dialog :visible.sync="rejectDialogVisible" title="Reject Suggestion" width="500px">
      <el-alert
        title="Reject means the suggested name is incorrect. The original name will remain unchanged."
        type="error"
        :closable="false"
        show-icon
        style="margin-bottom: 16px;">
      </el-alert>

      <el-form label-width="100px">
        <el-form-item label="Notes">
          <el-input v-model="rejectForm.notes" type="textarea" :rows="3" placeholder="Why is this suggestion wrong?"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="rejectDialogVisible = false">Cancel</el-button>
        <el-button type="danger" :loading="actionLoading" @click="confirmReject">
          <i class="el-icon-close"></i> Confirm Reject
        </el-button>
      </span>
    </el-dialog>

    <!-- Correct Action Dialog -->
    <el-dialog :visible.sync="correctDialogVisible" title="Correct Name" width="650px">
      <el-alert
        title="Provide the correct valid name. Search the reference database or enter manually."
        type="warning"
        :closable="false"
        show-icon
        style="margin-bottom: 16px;">
      </el-alert>

      <div v-if="correctContext" class="accept-summary" style="margin-bottom: 16px;">
        <div class="pipeline-row">
          <span class="pipeline-label">Original:</span>
          <span class="scientific-name original">{{ correctContext.current_full_name }}</span>
        </div>
        <div class="pipeline-row">
          <span class="pipeline-label">Suggested:</span>
          <span class="scientific-name suggested">{{ correctContext.suggested_full_name }}</span>
        </div>
      </div>

      <el-form label-width="140px">
        <el-form-item label="Input Mode">
          <el-radio-group v-model="correctForm.mode" size="small">
            <el-radio-button label="search">Search Reference DB</el-radio-button>
            <el-radio-button label="manual">Manual Input</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <!-- Search mode -->
        <template v-if="correctForm.mode === 'search'">
          <el-form-item label="Search Taxon" required>
            <el-autocomplete
              v-model="correctForm.searchText"
              :fetch-suggestions="searchReferenceTaxaDebounced"
              placeholder="Type at least 2 characters..."
              :trigger-on-focus="false"
              style="width: 100%"
              @select="handleReferenceSelect">
              <template slot-scope="{ item }">
                <div style="line-height: 1.4;">
                  <span style="font-style: italic; font-weight: 500;">{{ item.scientific_name }}</span>
                  <span v-if="item.rank" style="margin-left: 8px; color: #909399; font-size: 12px;">
                    [{{ item.rank }}<template v-if="item.status"> - {{ item.status }}</template>]
                  </span>
                  <div v-if="item.valid_name && item.valid_name !== item.scientific_name" style="font-size: 12px; color: #67C23A;">
                    Valid: {{ item.valid_name }}
                  </div>
                </div>
              </template>
            </el-autocomplete>
          </el-form-item>
          <el-form-item v-if="correctForm.selectedRef" label="Selected">
            <el-tag type="success">{{ correctForm.final_valid_name }}</el-tag>
            <span style="margin-left: 8px; color: #909399; font-size: 12px;">
              (Ref ID: {{ correctForm.taxonrank_ref_id }})
            </span>
          </el-form-item>
        </template>

        <!-- Manual mode -->
        <template v-if="correctForm.mode === 'manual'">
          <el-form-item label="Genus" required>
            <el-input v-model="correctForm.final_genus" placeholder="e.g. Amphiprion"></el-input>
          </el-form-item>
          <el-form-item label="Species">
            <el-input v-model="correctForm.final_species" placeholder="e.g. ocellaris"></el-input>
          </el-form-item>
          <el-form-item label="Full Name" required>
            <el-input v-model="correctForm.final_valid_name" placeholder="e.g. Amphiprion ocellaris"></el-input>
          </el-form-item>
          <el-form-item label="Create in Local DB">
            <el-switch v-model="correctForm.create_in_local"></el-switch>
            <span style="margin-left: 8px; font-size: 12px; color: #909399;">
              Add this name to the local TaxonomicTable
            </span>
          </el-form-item>
        </template>

        <el-form-item label="Notes">
          <el-input v-model="correctForm.notes" type="textarea" :rows="2" placeholder="Optional notes..."></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="correctDialogVisible = false">Cancel</el-button>
        <el-button type="warning" :loading="actionLoading" @click="confirmCorrect">
          <i class="el-icon-edit"></i> Confirm Correction
        </el-button>
      </span>
    </el-dialog>

    <!-- Scan Confirmation Dialog -->
    <el-dialog :visible.sync="scanDialogVisible" title="Scan All Taxon Names" width="550px">
      <el-alert
        title="This will re-scan ALL taxon names against the TaxonRank reference database."
        type="warning"
        :closable="false"
        show-icon
        style="margin-bottom: 16px;">
      </el-alert>

      <div class="scan-warning-stats">
        <div class="scan-stat-row">
          <span class="scan-stat-label">Current pending reviews:</span>
          <span class="scan-stat-value pending">{{ stats.pending || 0 }}</span>
          <span class="scan-stat-hint">(will be deleted and re-created)</span>
        </div>
        <div class="scan-stat-row">
          <span class="scan-stat-label">Accepted:</span>
          <span class="scan-stat-value accepted">{{ stats.accepted || 0 }}</span>
          <span class="scan-stat-hint">(will NOT be affected)</span>
        </div>
        <div class="scan-stat-row">
          <span class="scan-stat-label">Rejected:</span>
          <span class="scan-stat-value rejected">{{ stats.rejected || 0 }}</span>
          <span class="scan-stat-hint">(will NOT be affected)</span>
        </div>
        <div class="scan-stat-row">
          <span class="scan-stat-label">Corrected:</span>
          <span class="scan-stat-value corrected">{{ stats.corrected || 0 }}</span>
          <span class="scan-stat-hint">(will NOT be affected)</span>
        </div>
      </div>

      <el-divider></el-divider>
      <div style="text-align: center;">
        <el-checkbox v-model="scanConfirmChecked" style="font-size: 14px;">
          I understand that <strong>{{ stats.pending || 0 }} pending reviews</strong> will be reset
        </el-checkbox>
      </div>

      <span slot="footer">
        <el-button @click="scanDialogVisible = false">Cancel</el-button>
        <el-button type="primary" :loading="scanning" :disabled="!scanConfirmChecked" @click="confirmScan">
          <i class="el-icon-search"></i> Start Scan
        </el-button>
      </span>
    </el-dialog>

    <!-- Batch Action Dialog (notes only, no reviewer) -->
    <el-dialog :visible.sync="batchDialogVisible" :title="batchDialogTitle" width="500px">
      <el-alert
        :title="batchAlertMessage"
        :type="batchActionType === 'accept' ? 'success' : 'error'"
        :closable="false"
        show-icon
        style="margin-bottom: 16px;">
      </el-alert>

      <el-form label-width="100px">
        <el-form-item label="Notes">
          <el-input v-model="batchForm.notes" type="textarea" :rows="2" placeholder="Optional notes..."></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="batchDialogVisible = false">Cancel</el-button>
        <el-button
          :type="batchActionType === 'accept' ? 'success' : 'danger'"
          :loading="actionLoading"
          @click="confirmBatchAction">
          Confirm {{ batchActionType }} ({{ selectedRows.length }})
        </el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import Pagination from '@/components/Pagination'
import {
  triggerSynonymScan,
  getReviewList,
  getReviewDetail,
  acceptReview,
  rejectReview,
  skipReview,
  batchAcceptReviews,
  batchRejectReviews,
  getReviewStats,
  getConfigStatus,
  searchReferenceTaxa,
  correctReview,
  resetReview
} from '@/api/synonymReview'

export default {
  name: 'SynonymReview',
  components: { Pagination },
  data() {
    return {
      configStatus: { configured: false, accessible: false },
      configChecked: false,
      stats: {},
      reviewList: [],
      total: 0,
      loading: false,
      scanning: false,
      listQuery: { page: 1, page_size: 20, sort_by: 'created_at', sort_order: 'desc' },
      filterStatus: '',
      filterIssue: '',
      searchText: '',
      selectedRows: [],

      // Detail dialog
      detailDialogVisible: false,
      detailData: null,

      // Reject dialog (notes only)
      rejectDialogVisible: false,
      rejectReviewId: null,
      rejectForm: { notes: '' },

      // Correct dialog
      correctDialogVisible: false,
      correctContext: null,
      correctForm: {
        mode: 'search',
        searchText: '',
        final_valid_name: '',
        final_genus: '',
        final_species: '',
        notes: '',
        correction_source: 'reference_db',
        taxonrank_ref_id: null,
        selectedRef: false,
        create_in_local: false
      },

      // Scan dialog
      scanDialogVisible: false,
      scanConfirmChecked: false,

      // Batch dialog (notes only)
      batchDialogVisible: false,
      batchDialogTitle: '',
      batchActionType: '',
      batchForm: { notes: '' },

      actionLoading: false
    }
  },
  computed: {
    batchAlertMessage() {
      if (this.batchActionType === 'accept') {
        return `Accept ${this.selectedRows.length} selected items. All suggested names will be recorded as valid.`
      }
      return `Reject ${this.selectedRows.length} selected items. These suggestions will be marked as incorrect.`
    }
  },
  created() {
    this.checkConfig()
    this.loadStats()
    this.fetchReviewList()
  },
  methods: {
    async checkConfig() {
      try {
        const res = await getConfigStatus()
        if (res.code === 20000) {
          this.configStatus = res.data
          this.configChecked = true
          if (res.data.accessible) {
            this.$message.success(`TaxonRank DB connected (${res.data.taxon_count} taxa)`)
          }
        }
      } catch (e) {
        this.configChecked = true
        this.$message.error('Failed to check config: ' + (e.message || e))
      }
    },

    async loadStats() {
      try {
        const res = await getReviewStats()
        if (res.code === 20000) { this.stats = res.data }
      } catch (e) { console.error('Failed to load stats:', e) }
    },

    handleScan() {
      this.scanConfirmChecked = false
      this.scanDialogVisible = true
    },
    async confirmScan() {
      this.scanning = true
      try {
        const res = await triggerSynonymScan()
        if (res.code === 20000) {
          const s = res.data.stats
          this.$message.success(
            `Scan complete: ${res.data.total_detected} issues found. ` +
            `Spelling: ${s.spelling_corrections}, Synonyms: ${s.synonyms_found}, Both: ${s.spelling_and_synonym}`
          )
          this.scanDialogVisible = false
          this.loadStats()
          this.fetchReviewList()
        } else {
          this.$message.error(res.message || 'Scan failed')
        }
      } catch (e) {
        this.$message.error('Scan failed: ' + (e.message || e))
      } finally {
        this.scanning = false
      }
    },

    async fetchReviewList() {
      this.loading = true
      try {
        const params = {
          ...this.listQuery,
          status: this.filterStatus || undefined,
          issue: this.filterIssue || undefined,
          search: this.searchText || undefined
        }
        const res = await getReviewList(params)
        if (res.code === 20000) {
          this.reviewList = res.data.items || []
          this.total = res.data.total || 0
        }
      } catch (e) {
        this.$message.error('Failed to load reviews: ' + (e.message || e))
      } finally {
        this.loading = false
      }
    },

    handleFilterChange() {
      this.listQuery.page = 1
      this.fetchReviewList()
    },
    handleSearch() {
      this.listQuery.page = 1
      this.fetchReviewList()
    },
    handleSelectionChange(selection) { this.selectedRows = selection },
    isSelectable(row) { return row.review_status === 'pending' },
    tableRowClassName({ row }) {
      if (row.review_status === 'accepted') return 'row-accepted'
      if (row.review_status === 'rejected') return 'row-rejected'
      if (row.review_status === 'corrected') return 'row-corrected'
      return ''
    },

    // --- Accept (one-click with $confirm) ---
    async handleAccept(row) {
      try {
        await this.$confirm(
          `Accept "${row.suggested_full_name}" as the valid name for "${row.current_full_name}"?`,
          'Confirm Accept',
          { confirmButtonText: 'Accept', cancelButtonText: 'Cancel', type: 'success' }
        )
      } catch { return }

      this.actionLoading = true
      try {
        const data = {
          reviewed_by: this.$store.getters.name,
          final_valid_name: row.suggested_full_name
        }
        const res = await acceptReview(row.id, data)
        if (res.code === 20000) {
          this.$message.success('Review accepted')
          this.fetchReviewList()
          this.loadStats()
        } else {
          this.$message.error(res.message || 'Accept failed')
        }
      } catch (e) {
        this.$message.error('Accept failed: ' + (e.message || e))
      } finally { this.actionLoading = false }
    },
    handleAcceptFromDetail() {
      this.detailDialogVisible = false
      this.handleAccept(this.detailData)
    },

    // --- Reject (dialog with notes only) ---
    handleReject(row) {
      this.rejectReviewId = row.id
      this.rejectForm = { notes: '' }
      this.rejectDialogVisible = true
    },
    handleRejectFromDetail() {
      this.detailDialogVisible = false
      this.handleReject(this.detailData)
    },
    async confirmReject() {
      this.actionLoading = true
      try {
        const data = {
          reviewed_by: this.$store.getters.name,
          notes: this.rejectForm.notes || undefined
        }
        const res = await rejectReview(this.rejectReviewId, data)
        if (res.code === 20000) {
          this.$message.success('Review rejected')
          this.rejectDialogVisible = false
          this.fetchReviewList()
          this.loadStats()
        } else {
          this.$message.error(res.message || 'Reject failed')
        }
      } catch (e) {
        this.$message.error('Reject failed: ' + (e.message || e))
      } finally { this.actionLoading = false }
    },

    // --- Skip (one-click, no dialog) ---
    async handleSkip(row) {
      this.actionLoading = true
      try {
        const data = { reviewed_by: this.$store.getters.name }
        const res = await skipReview(row.id, data)
        if (res.code === 20000) {
          this.$message.info('Review skipped')
          this.fetchReviewList()
          this.loadStats()
        } else {
          this.$message.error(res.message || 'Skip failed')
        }
      } catch (e) {
        this.$message.error('Skip failed: ' + (e.message || e))
      } finally { this.actionLoading = false }
    },
    handleSkipFromDetail() {
      this.detailDialogVisible = false
      this.handleSkip(this.detailData)
    },

    // --- Correct (dialog with search/manual modes) ---
    handleCorrect(row) {
      this.correctContext = {
        id: row.id,
        current_full_name: row.current_full_name,
        suggested_full_name: row.suggested_full_name
      }
      this.correctForm = {
        mode: 'search',
        searchText: '',
        final_valid_name: '',
        final_genus: '',
        final_species: '',
        notes: '',
        correction_source: 'reference_db',
        taxonrank_ref_id: null,
        selectedRef: false,
        create_in_local: false
      }
      this.correctDialogVisible = true
    },
    handleCorrectFromDetail() {
      this.detailDialogVisible = false
      this.handleCorrect(this.detailData)
    },
    searchReferenceTaxaDebounced(queryString, callback) {
      if (this._searchTimer) clearTimeout(this._searchTimer)
      this._searchTimer = setTimeout(async() => {
        if (!queryString || queryString.length < 2) {
          callback([])
          return
        }
        try {
          const res = await searchReferenceTaxa(queryString)
          if (res.code === 20000 && res.data.items) {
            callback(res.data.items.map(item => ({ ...item, value: item.scientific_name })))
          } else {
            callback([])
          }
        } catch {
          callback([])
        }
      }, 300)
    },
    handleReferenceSelect(item) {
      this.correctForm.final_valid_name = item.valid_name || item.scientific_name
      this.correctForm.taxonrank_ref_id = item.id
      this.correctForm.correction_source = 'reference_db'
      this.correctForm.selectedRef = true
      // Parse genus/species
      const parts = this.correctForm.final_valid_name.split(/\s+/)
      this.correctForm.final_genus = parts[0] || ''
      this.correctForm.final_species = parts.slice(1).join(' ') || ''
    },
    async confirmCorrect() {
      if (!this.correctForm.final_valid_name) {
        this.$message.warning('Please select or enter a valid name')
        return
      }
      if (this.correctForm.mode === 'manual' && !this.correctForm.final_genus) {
        this.$message.warning('Genus is required')
        return
      }
      this.actionLoading = true
      try {
        const data = {
          reviewed_by: this.$store.getters.name,
          notes: this.correctForm.notes || undefined,
          final_valid_name: this.correctForm.final_valid_name,
          final_genus: this.correctForm.final_genus || undefined,
          final_species: this.correctForm.final_species || undefined,
          correction_source: this.correctForm.mode === 'search' ? 'reference_db' : 'manual',
          taxonrank_ref_id: this.correctForm.taxonrank_ref_id || undefined,
          create_in_local: this.correctForm.create_in_local
        }
        const res = await correctReview(this.correctContext.id, data)
        if (res.code === 20000) {
          this.$message.success('Review corrected')
          this.correctDialogVisible = false
          this.fetchReviewList()
          this.loadStats()
        } else {
          this.$message.error(res.message || 'Correct failed')
        }
      } catch (e) {
        this.$message.error('Correct failed: ' + (e.message || e))
      } finally { this.actionLoading = false }
    },

    // --- Reset ---
    async handleReset(row) {
      try {
        await this.$confirm(
          `Reset this review back to pending? Current status: ${row.review_status}`,
          'Confirm Reset',
          { confirmButtonText: 'Reset', cancelButtonText: 'Cancel', type: 'warning' }
        )
      } catch { return }

      this.actionLoading = true
      try {
        const data = { reviewed_by: this.$store.getters.name }
        const res = await resetReview(row.id, data)
        if (res.code === 20000) {
          this.$message.success('Review reset to pending')
          this.fetchReviewList()
          this.loadStats()
        } else {
          this.$message.error(res.message || 'Reset failed')
        }
      } catch (e) {
        this.$message.error('Reset failed: ' + (e.message || e))
      } finally { this.actionLoading = false }
    },
    handleResetFromDetail() {
      this.detailDialogVisible = false
      this.handleReset(this.detailData)
    },

    // --- Batch ---
    handleBatchAction(command) {
      this.batchActionType = command === 'batch-accept' ? 'accept' : 'reject'
      this.batchDialogTitle = `Batch ${this.batchActionType} ${this.selectedRows.length} reviews`
      this.batchForm = { notes: '' }
      this.batchDialogVisible = true
    },
    async confirmBatchAction() {
      this.actionLoading = true
      try {
        const data = {
          review_ids: this.selectedRows.map(r => r.id),
          reviewed_by: this.$store.getters.name,
          notes: this.batchForm.notes || undefined
        }
        const res = this.batchActionType === 'accept'
          ? await batchAcceptReviews(data) : await batchRejectReviews(data)
        if (res.code === 20000) {
          this.$message.success(res.message || `Batch ${this.batchActionType} completed`)
          this.batchDialogVisible = false
          this.$refs.reviewTable.clearSelection()
          this.fetchReviewList()
          this.loadStats()
        } else {
          this.$message.error(res.message || 'Batch action failed')
        }
      } catch (e) {
        this.$message.error('Batch action failed: ' + (e.message || e))
      } finally { this.actionLoading = false }
    },

    // --- Detail ---
    async showDetail(row) {
      try {
        const res = await getReviewDetail(row.id)
        if (res.code === 20000) {
          this.detailData = res.data
          this.detailDialogVisible = true
        }
      } catch (e) {
        this.$message.error('Failed to load detail: ' + (e.message || e))
      }
    },

    openWorms(url) { if (url) window.open(url, '_blank') },

    // --- Helpers ---
    getStatusTagType(s) {
      return { pending: 'warning', accepted: 'success', rejected: 'danger', skipped: 'info', corrected: '' }[s] || ''
    },
    getIssueTagType(t) {
      return { spelling: 'warning', synonym: 'danger', 'spelling+synonym': '' }[t] || 'info'
    },
    getIssueLabel(t) {
      return { spelling: 'Spelling', synonym: 'Synonym', 'spelling+synonym': 'Spell+Syn' }[t] || t
    },
    formatDate(d) {
      if (!d) return '-'
      const dt = new Date(d)
      return dt.toLocaleDateString() + ' ' + dt.toLocaleTimeString()
    }
  }
}
</script>

<style scoped>
.synonym-review { padding: 20px; }
.stats-card { margin-bottom: 16px; }
.filter-card { margin-bottom: 16px; }
.table-card { margin-bottom: 16px; }

.stat-item { text-align: center; padding: 10px 0; }
.stat-number { font-size: 24px; font-weight: bold; color: #303133; }
.stat-number.total { color: #409EFF; }
.stat-number.pending { color: #E6A23C; }
.stat-number.accepted { color: #67C23A; }
.stat-number.rejected { color: #F56C6C; }
.stat-number.corrected { color: #E6A23C; }
.stat-number.skipped { color: #909399; }
.stat-label { font-size: 13px; color: #909399; margin-top: 4px; }

.stat-divider { margin: 10px 0 6px; }
.stat-item-inline { display: flex; align-items: center; gap: 8px; padding: 4px 0; }
.stat-inline-number { font-size: 18px; font-weight: bold; color: #303133; }

/* Name comparison mini-table */
.name-compare { font-size: 12px; line-height: 1.3; padding: 2px 0; }
.compare-header {
  display: flex; gap: 4px;
  color: #909399; font-size: 10px; text-transform: uppercase;
  border-bottom: 1px solid #EBEEF5; padding-bottom: 2px; margin-bottom: 2px;
}
.compare-row { display: flex; gap: 4px; padding: 1px 0; }
.compare-cell {
  flex: 1; min-width: 0;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.compare-cell.label-cell {
  flex: 0 0 55px; color: #909399; font-size: 11px;
  text-align: right; padding-right: 4px;
}
.compare-cell.sci-name { font-style: italic; font-weight: 500; color: #303133; }
.compare-cell.family-col { flex: 0 0 80px; }
.compare-cell.family-text { color: #606266; font-style: normal; }
.field-changed {
  background-color: #FDF6EC; color: #E6A23C !important;
  border-radius: 2px; padding: 0 2px;
}
.final-row .final-name { color: #409EFF; font-weight: 600; }
.conf-badge {
  font-size: 10px; color: #409EFF; background: #ecf5ff;
  padding: 1px 4px; border-radius: 3px;
}

/* Legacy pipeline styles (used in dialogs) */
.pipeline-row { display: flex; align-items: center; gap: 6px; line-height: 1.5; }
.pipeline-label {
  font-size: 11px; color: #909399; min-width: 60px;
  text-align: right; flex-shrink: 0;
}
.scientific-name { font-style: italic; font-weight: 500; }
.scientific-name.original { color: #303133; }
.scientific-name.corrected { color: #E6A23C; }
.scientific-name.suggested { color: #67C23A; }
.scientific-name.final { color: #409EFF; font-weight: 600; }

.family-tag {
  font-size: 11px; color: #909399; background: #f4f4f5;
  padding: 1px 6px; border-radius: 3px;
}
.confidence-tag {
  font-size: 11px; color: #409EFF; background: #ecf5ff;
  padding: 1px 6px; border-radius: 3px;
}
.confidence-text { font-size: 12px; color: #606266; }
.detail-content { padding: 0 10px; }
.detail-actions { text-align: center; padding: 10px 0; }

.accept-summary {
  background: #f5f7fa; border-radius: 6px; padding: 12px 16px;
  border-left: 3px solid #67C23A;
}

/* Scan warning dialog */
.scan-warning-stats {
  background: #fdf6ec; border-radius: 6px; padding: 12px 16px;
  border-left: 3px solid #E6A23C;
}
.scan-stat-row {
  display: flex; align-items: center; gap: 8px;
  padding: 4px 0; font-size: 14px;
}
.scan-stat-label { min-width: 180px; color: #606266; }
.scan-stat-value { font-weight: bold; font-size: 16px; min-width: 40px; }
.scan-stat-value.pending { color: #E6A23C; }
.scan-stat-value.accepted { color: #67C23A; }
.scan-stat-value.rejected { color: #F56C6C; }
.scan-stat-value.corrected { color: #E6A23C; }
.scan-stat-hint { font-size: 12px; color: #909399; }

::v-deep .el-table .row-accepted { background-color: #f0f9eb; }
::v-deep .el-table .row-rejected { background-color: #fef0f0; }
::v-deep .el-table .row-corrected { background-color: #fdf6ec; }

.text-lg { font-size: 16px; }
.font-medium { font-weight: 500; }
</style>