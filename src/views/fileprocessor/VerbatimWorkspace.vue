<!--
  VerbatimWorkspace.vue
  Verbatim 数据处理工作台 - 批次数据验证和编辑 (服务器端分页版本)
  支持完整的三阶段验证：物种验证、地点验证、记录详情验证
-->
<template>
  <div class="verbatim-workspace">
    <!-- 批次选择器 -->
    <el-card class="batch-selector-card">
      <div slot="header" class="clearfix">
        <span class="text-lg font-medium">Verbatim Data Processing Workspace</span>
      </div>

      <div class="batch-selector">
        <el-row :gutter="20" align="middle">
          <el-col :span="8">
            <el-select
              v-model="selectedBatchId"
              placeholder="Select a batch to process"
              filterable
              clearable
              @change="loadBatchData"
              class="w-full">
              <el-option
                v-for="batch in availableBatches"
                :key="batch.batchSerialId"
                :label="`${batch.batchSerialId} - ${batch.fileName} (${batch.recordCount} records)`"
                :value="batch.batchSerialId">
              </el-option>
            </el-select>
          </el-col>
          <el-col :span="4">
            <el-button
              type="primary"
              :loading="loadingBatch"
              @click="refreshBatchList">
              <i class="el-icon-refresh"></i>
              Refresh
            </el-button>
          </el-col>
          <el-col :span="12" v-if="currentBatch">
            <div class="batch-info">
              <span class="batch-info-item">
                <i class="el-icon-document"></i>
                {{currentBatch.fileName}}
              </span>
              <span class="batch-info-item">
                <i class="el-icon-tickets"></i>
                {{currentBatch.recordCount}} records
              </span>
              <span class="batch-info-item">
                <i class="el-icon-time"></i>
                {{formatDate(currentBatch.importDate)}}
              </span>
              <span class="batch-info-item" v-if="currentBatch.sourceFile">
                <el-button type="text" icon="el-icon-download" @click="downloadSourceFile">
                  Source file
                </el-button>
              </span>
              <span class="batch-info-item" v-if="currentBatch.fieldMappings">
                <el-popover placement="bottom" trigger="click" width="320" title="Import field mapping">
                  <el-table :data="mappingRows" size="mini" :show-header="true">
                    <el-table-column prop="field" label="Field" width="150"></el-table-column>
                    <el-table-column prop="column" label="Source column"></el-table-column>
                  </el-table>
                  <el-button slot="reference" type="text" icon="el-icon-connection">
                    Mapping
                  </el-button>
                </el-popover>
              </span>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-card>

    <!-- 数据处理区域 -->
    <div v-if="currentBatch" class="workspace-content">
      <!-- Catalog 进度 + 跳 Lots 搜索快捷链接 -->
      <div class="catalog-progress-banner" style="display:flex;align-items:center;justify-content:space-between;padding:8px 14px;margin-bottom:12px;background:#f0f9eb;border:1px solid #e1f3d8;border-radius:4px;">
        <span style="color:#67c23a;font-size:14px;">
          <i class="el-icon-finished" />
          Cataloged <b>{{ progressStats.cataloged || 0 }}</b> / {{ progressStats.fullyCompleted || 0 }} completed
          <span style="color:#909399;">· {{ Math.max((progressStats.fullyCompleted || 0) - (progressStats.cataloged || 0), 0) }} remaining to catalog</span>
          <span v-if="(progressStats.total || 0) - (progressStats.fullyCompleted || 0) > 0" style="color:#c0c4cc;">· {{ (progressStats.total || 0) - (progressStats.fullyCompleted || 0) }} pending (deferred)</span>
        </span>
        <el-button type="primary" size="mini" plain icon="el-icon-search" @click="goToLotsSearch">
          View this batch in Lots search →
        </el-button>
      </div>
      <!-- 进度概览 -->
      <el-card class="progress-overview-card">
        <div slot="header" class="clearfix">
          <span>Processing Progress</span>
          <el-button
            style="float: right; padding: 3px 0; margin-left: 10px;"
            type="text"
            @click="refreshProgress">
            <i class="el-icon-refresh"></i>
          </el-button>
          <el-button
            style="float: right; padding: 3px 0"
            type="text"
            @click="revalidateBatch">
            <i class="el-icon-refresh-right"></i>
            Re-validate
          </el-button>
        </div>

        <el-row :gutter="20">
          <el-col :span="4">
            <div class="progress-item">
              <div class="progress-number">{{progressStats.total}}</div>
              <div class="progress-label">Total Records</div>
            </div>
          </el-col>
          <el-col :span="5">
            <div class="progress-item">
              <div class="progress-number species">{{progressStats.speciesVerified}}</div>
              <div class="progress-label">Species Verified</div>
              <div class="progress-bar">
                <el-progress
                  :percentage="progressStats.speciesPercentage"
                  :stroke-width="8"
                  color="#67C23A">
                </el-progress>
              </div>
            </div>
          </el-col>
          <el-col :span="5">
            <div class="progress-item">
              <div class="progress-number locality">{{progressStats.localityVerified}}</div>
              <div class="progress-label">Locality Verified</div>
              <div class="progress-bar">
                <el-progress
                  :percentage="progressStats.localityPercentage"
                  :stroke-width="8"
                  color="#409EFF">
                </el-progress>
              </div>
            </div>
          </el-col>
          <el-col :span="5">
            <div class="progress-item">
              <div class="progress-number record">{{progressStats.recordVerified}}</div>
              <div class="progress-label">Record Verified</div>
              <div class="progress-bar">
                <el-progress
                  :percentage="progressStats.recordPercentage"
                  :stroke-width="8"
                  color="#E6A23C">
                </el-progress>
              </div>
            </div>
          </el-col>
          <el-col :span="5">
            <div class="progress-item">
              <div class="progress-number complete">{{progressStats.fullyCompleted}}</div>
              <div class="progress-label">Fully Completed</div>
              <div class="progress-bar">
                <el-progress
                  :percentage="progressStats.completionPercentage"
                  :stroke-width="8"
                  color="#F56C6C">
                </el-progress>
              </div>
            </div>
          </el-col>
        </el-row>

        <!-- Warnings & Issues Statistics -->
        <el-divider></el-divider>
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="progress-item warning-stat">
              <div class="progress-number" style="color: #E6A23C;">{{progressStats.hasWarnings || 0}}</div>
              <div class="progress-label">
                <i class="el-icon-warning" style="color: #E6A23C;"></i>
                Records with Warnings
              </div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="progress-item error-stat">
              <div class="progress-number" style="color: #F56C6C;">{{progressStats.hasErrors || 0}}</div>
              <div class="progress-label">
                <i class="el-icon-close" style="color: #F56C6C;"></i>
                Records with Errors
              </div>
            </div>
          </el-col>
          <el-col :span="8">
            <div class="progress-item pending-stat">
              <div class="progress-number" style="color: #909399;">{{progressStats.hasPending || 0}}</div>
              <div class="progress-label">
                <i class="el-icon-time" style="color: #909399;"></i>
                Pending Review
              </div>
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 记录列表和过滤器 -->
      <el-card class="records-card">
        <div slot="header" class="clearfix">
          <span>Records Management</span>
          <div style="float: right;">
            <el-button-group>
              <el-button
                size="small"
                :type="serverSideFilter === 'all' ? 'primary' : ''"
                @click="setFilter('all')">
                All ({{totalRecords}})
              </el-button>
              <el-button
                size="small"
                :type="serverSideFilter === 'completed' ? 'success' : ''"
                @click="setFilter('completed')">
                ✅ Completed ({{progressStats.fullyCompleted || 0}})
              </el-button>
              <el-button
                size="small"
                :type="serverSideFilter === 'has_errors' ? 'danger' : ''"
                @click="setFilter('has_errors')">
                🔴 Errors ({{progressStats.hasErrors || 0}})
              </el-button>
              <el-button
                size="small"
                :type="serverSideFilter === 'has_warnings' ? 'warning' : ''"
                @click="setFilter('has_warnings')">
                ⚠️ Warnings ({{progressStats.hasWarnings || 0}})
              </el-button>
              <el-button
                size="small"
                :type="serverSideFilter === 'pending_taxonomic' ? 'danger' : ''"
                @click="setFilter('pending_taxonomic')">
                ❌ Species Pending ({{progressStats.pendingTaxonomic || 0}})
              </el-button>
              <el-button
                size="small"
                :type="serverSideFilter === 'pending_locality' ? 'danger' : ''"
                @click="setFilter('pending_locality')">
                ❌ Locality Pending ({{progressStats.pendingLocality || 0}})
              </el-button>
              <el-button
                size="small"
                :type="serverSideFilter === 'pending_record' ? 'danger' : ''"
                @click="setFilter('pending_record')">
                ❌ Record Pending ({{progressStats.pendingRecord || 0}})
              </el-button>
            </el-button-group>
          </div>
        </div>

        <!-- 搜索和操作栏 -->
        <div class="table-toolbar">
          <el-row :gutter="20">
            <!-- 全局 search 框暂时停用，按列搜索请用下方 Add filter -->
            <el-col v-if="false" :span="12">
              <el-input
                v-model="searchText"
                @input="onSearchChange"
                @clear="onSearchClear"
                placeholder="Search by catalog number, field number, or species..."
                prefix-icon="el-icon-search"
                clearable>
              </el-input>
            </el-col>
            <el-col :span="24" class="text-right">
              <!-- One decision per imported name instead of one per record: the importer does
                   not deduplicate names, so a batch can ask for the same judgement 1300 times. -->
              <el-button type="primary" plain style="margin-right: 10px;" @click="nameGroupsOpen = true">
                <i class="el-icon-collection"></i>
                Decide by name
              </el-button>
              <el-dropdown @command="handleBatchAction" style="margin-right: 10px;">
                <el-button>
                  Batch Actions <i class="el-icon-arrow-down el-icon--right"></i>
                </el-button>
                <el-dropdown-menu slot="dropdown">
                  <el-dropdown-item command="verify-completed">Verify All Completed</el-dropdown-item>
                  <el-dropdown-item command="verify-species">Verify All Species</el-dropdown-item>
                  <el-dropdown-item command="verify-locality">Verify All Locality</el-dropdown-item>
                  <el-dropdown-item divided command="mark-review">Mark Selected for Review</el-dropdown-item>
                </el-dropdown-menu>
              </el-dropdown>
              <el-button @click="exportBatchResults">
                <i class="el-icon-download"></i>
                Export Results
              </el-button>
              <el-button type="success" @click="markBatchCompleted">
                <i class="el-icon-check"></i>
                Mark Batch Completed
              </el-button>
            </el-col>
          </el-row>
          <el-row :gutter="20" class="field-filters-row">
            <el-col :span="24">
              <field-filter-chips
                :value="serverSideFieldFilters"
                :field-options="fieldFilterOptions"
                @input="onFieldFiltersChange"
              />
            </el-col>
          </el-row>
        </div>

        <!-- 记录表格。
             注意这里没有 @row-click：一行里现在有可点的东西（Something wrong? 菜单、
             Apply），行级 handler 会把它们全吞掉——点菜单结果弹出详情。要开详情点
             Actions 列的 Edit。 -->
        <el-table
          ref="recordsTable"
          :data="batchRecords"
          v-loading="loadingRecords"
          stripe
          height="600"
          @selection-change="handleSelectionChange">

          <el-table-column
            type="selection"
            width="55">
          </el-table-column>

          <el-table-column prop="catalogNumber" label="Catalog # (Temp)" width="180">
            <template slot-scope="scope">
              <span class="catalog-number">
                <span v-if="isTemporaryCatalogNumber(scope.row.catalogNumber)" class="temp-catalog-number">
                  {{scope.row.catalogNumber}}
                </span>
                <span v-else class="normal-catalog-number">
                  {{scope.row.catalogNumber}}
                </span>
                <!-- Error icon (severity: error) -->
                <el-tooltip v-if="hasErrors(scope.row)" placement="top">
                  <div slot="content">
                    <div v-for="(error, idx) in getErrors(scope.row)" :key="`error-${idx}`" style="margin: 4px 0;">
                      🔴 {{ error.message }}
                    </div>
                  </div>
                  <i class="el-icon-close warning-icon" style="color: #F56C6C;"></i>
                </el-tooltip>
                <!-- Warning icon (severity: warning) - 即使有errors也显示warnings -->
                <el-tooltip v-if="hasWarnings(scope.row)" placement="top">
                  <div slot="content">
                    <div v-for="(warning, idx) in getWarnings(scope.row)" :key="`warning-${idx}`" style="margin: 4px 0;">
                      ⚠️ {{ warning.message }}
                    </div>
                  </div>
                  <i class="el-icon-warning warning-icon" style="color: #E6A23C;"></i>
                </el-tooltip>
              </span>
            </template>
          </el-table-column>

          <el-table-column prop="fieldNumber" label="Field #" width="120">
            <template slot-scope="scope">
              <span>{{scope.row.fieldNumber || '-'}}</span>
            </template>
          </el-table-column>

          <el-table-column label="Species Status" width="180">
            <template slot-scope="scope">
              <div class="status-column">
                <el-tag
                  :type="getSpeciesStatusType(scope.row)"
                  size="small">
                  <i :class="getSpeciesStatusIcon(scope.row)"></i>
                  {{getSpeciesStatusText(scope.row)}}
                </el-tag>
                <!-- 显示匹配建议信息 -->
                <div v-if="scope.row.matchSuggestions && scope.row.matchSuggestions.hasSuggestion" class="suggestion-info">
                  <el-tooltip :content="getMatchTooltip(scope.row.matchSuggestions)" placement="top">
                    <el-tag size="mini" :type="getMatchSuggestionType(scope.row.matchSuggestions)">
                      {{scope.row.matchSuggestions.status}} ({{scope.row.matchSuggestions.confidence}}%)
                    </el-tag>
                  </el-tooltip>
                </div>
                <!-- The taxon on this record was not found by matching this batch: it was
                     pre-filled from a decision a curator made on an EARLIER batch. The record
                     is still pending on purpose — an inherited answer has to be confirmed
                     knowingly, otherwise one wrong old ruling spreads through every future
                     delivery unnoticed. -->
                <div v-if="scope.row.historicalDecision" class="suggestion-info">
                  <el-tooltip
                    :content="historicalDecisionTooltip(scope.row)"
                    placement="top">
                    <el-tag size="mini" type="warning">
                      <i class="el-icon-time"></i>
                      Previously corrected
                    </el-tag>
                  </el-tooltip>
                </div>
                <!-- 来源科 ≠ 匹配科：分类问题，显眼提示在 species 这边 -->
                <div v-if="familyMismatch(scope.row)" class="suggestion-info">
                  <el-tooltip
                    :content="`Imported family '${familyMismatch(scope.row).from}' differs from matched family '${familyMismatch(scope.row).to}'. Confirm the family.`"
                    placement="top">
                    <el-tag size="mini" type="danger">
                      <i class="el-icon-warning"></i>
                      Family: {{familyMismatch(scope.row).from}} → {{familyMismatch(scope.row).to}}
                    </el-tag>
                  </el-tooltip>
                </div>
                <!-- 显示验证者信息 -->
                <div v-if="scope.row.verificationInfo && scope.row.verificationInfo.species.verified_by_name" class="verification-info">
                  <el-tooltip :content="`Verified by ${scope.row.verificationInfo.species.verified_by_name} at ${formatDateTime(scope.row.verificationInfo.species.verified_at)}`" placement="top">
                    <i class="el-icon-user verification-icon"></i>
                  </el-tooltip>
                </div>
                <!-- verified 但没人署名 = 导入时 exact match 自动配的，没人看过。
                     curator 问的"这条我是不是已经做过了"就是这个区分。 -->
                <div v-else-if="autoVerifiedSpecies(scope.row)" class="verification-info">
                  <el-tooltip
                    content="Matched automatically on import (exact name match) — nobody has confirmed it"
                    placement="top">
                    <el-tag size="mini" type="info">auto</el-tag>
                  </el-tooltip>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="Verbatim Family" width="140">
            <template slot-scope="scope">
              <span v-if="scope.row.verbatimTaxonomic && scope.row.verbatimTaxonomic.verbatimFamily" class="verbatim-text">
                {{scope.row.verbatimTaxonomic.verbatimFamily}}
              </span>
              <span v-else class="text-gray-400">-</span>
            </template>
          </el-table-column>

          <el-table-column label="Verbatim Genus" width="140">
            <template slot-scope="scope">
              <span v-if="scope.row.verbatimTaxonomic && scope.row.verbatimTaxonomic.verbatimGenus" class="verbatim-text">
                {{scope.row.verbatimTaxonomic.verbatimGenus}}
              </span>
              <span v-else class="text-gray-400">-</span>
            </template>
          </el-table-column>

          <el-table-column label="Verbatim Species" width="140">
            <template slot-scope="scope">
              <span v-if="scope.row.verbatimTaxonomic && scope.row.verbatimTaxonomic.verbatimSpecies" class="verbatim-text">
                {{scope.row.verbatimTaxonomic.verbatimSpecies}}
              </span>
              <span v-else class="text-gray-400">-</span>
            </template>
          </el-table-column>

          <el-table-column label="Matched Species" width="260">
            <template slot-scope="scope">
              <div v-if="scope.row.taxonomic">
                <template v-if="isFamilyLevelTaxon(scope.row.taxonomic)">
                  <div class="matched-text">
                    Family: {{scope.row.taxonomic.Family}}
                    <el-tag size="mini" type="info" class="match-level-tag">Family-level</el-tag>
                  </div>
                </template>
                <template v-else>
                  <div class="matched-text">
                    {{scope.row.taxonomic.FullName}}
                    <el-tag size="mini" type="success" class="match-level-tag">Genus + Species</el-tag>
                  </div>
                  <div v-if="scope.row.taxonomic.Family" class="text-xs text-gray-500">
                    Family: {{scope.row.taxonomic.Family}}
                  </div>
                </template>
                <div class="text-xs text-gray-500">
                  ID: {{scope.row.taxonomic.TaxonID}}
                </div>
              </div>
              <!-- 显示建议的物种（仅当species未verified时显示Apply按钮） -->
              <div v-else-if="scope.row.suggestedTaxonomic" class="suggested-species">
                <div class="suggested-text-wrapper">
                  <span class="suggested-species-name">{{scope.row.suggestedTaxonomic.FullName}}</span>
                  <!-- Apply 应用的是这个名字，不是这一条记录。同一个名字在一批里出现几百
                       上千次是常态（campostoma anomalum 1362 条），一条条点是同一个判断
                       做 1362 遍。按钮上直接写清楚会动几条，并且有二次确认、可撤销。 -->
                  <el-button
                    v-if="getSpeciesVerificationStatus(scope.row) !== 'verified'"
                    type="success"
                    size="mini"
                    :loading="applyingRecordId === scope.row.id"
                    @click.stop="applySuggestion(scope.row)">
                    <span v-if="applyingRecordId !== scope.row.id">
                      Apply<template v-if="scope.row.same_name_pending > 1">
                        ×{{scope.row.same_name_pending}}</template>
                    </span>
                  </el-button>
                </div>
                <div v-if="scope.row.suggestedTaxonomic.Family" class="text-xs text-gray-500">
                  Family: {{scope.row.suggestedTaxonomic.Family}}
                </div>
                <div class="text-xs text-gray-500">
                  Suggested ID: {{scope.row.suggestedTaxonomic.TaxonID}}
                </div>
              </div>
              <!-- Family-only 记录：verbatim 只有 family，没 genus/species -->
              <div v-else-if="scope.row.familyOnly && scope.row.familyOnly.isFamilyOnly" class="family-only">
                <el-tag v-if="scope.row.familyOnly.existsInDb" size="mini" type="info">
                  <i class="el-icon-info" />
                  Family in DB
                </el-tag>
                <el-tag v-else size="mini" type="warning">
                  <i class="el-icon-warning" />
                  Family not in DB
                </el-tag>
                <div class="text-xs text-gray-500" style="margin-top: 4px;">
                  {{scope.row.familyOnly.verbatimFamilyName}}
                  <span v-if="scope.row.familyOnly.existsInDb"> (FamilyID: {{scope.row.familyOnly.matchedFamilyId}})</span>
                </div>
                <div class="text-xs text-gray-400">
                  <span v-if="scope.row.familyOnly.existsInDb">Pick or create a species under this family</span>
                  <span v-else>Create family + species, or correct the spelling</span>
                </div>
              </div>
              <span v-else class="text-gray-400">Not matched</span>

              <!-- CoF 建议：本地缺该 accepted 名时，与上面的 DB 建议并列。
                   这里**只报信息不给按钮**。原来那个 "Create & apply" 是一键往馆级
                   TaxonomicTable/Family 插行、不可撤销，而且科是从 CoF 建议里带过来的，
                   curator 从没显式选过。建种改到 Edit 弹窗里做（Create New Species，
                   科要自己挑），那条路还会顺带追问同名的其余记录。 -->
              <div v-if="scope.row.cofCreate" class="cof-suggest"
                   style="margin-top:6px; border-top:1px dashed #dcdfe6; padding-top:4px;">
                <div class="text-xs" style="color:#E6A23C;">
                  <i class="el-icon-cpu"></i>
                  CoF: {{ cofCreateName(scope.row.cofCreate) }}
                  <span v-if="scope.row.cofCreate.family">({{ scope.row.cofCreate.family }})</span>
                </div>
                <div class="text-xs text-gray-400">Not in the local taxonomy — add it from Edit</div>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="Locality Status" width="180">
            <template slot-scope="scope">
              <div class="status-column">
                <el-tag
                  :type="getLocalityStatusType(scope.row)"
                  size="small">
                  <i :class="getLocalityStatusIcon(scope.row)"></i>
                  {{getLocalityStatusText(scope.row)}}
                </el-tag>
                <!-- 显示验证者信息 -->
                <div v-if="scope.row.verificationInfo && scope.row.verificationInfo.locality.verified_by_name" class="verification-info">
                  <el-tooltip :content="`Verified by ${scope.row.verificationInfo.locality.verified_by_name} at ${formatDateTime(scope.row.verificationInfo.locality.verified_at)}`" placement="top">
                    <i class="el-icon-user verification-icon"></i>
                  </el-tooltip>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="Record Status" width="150">
            <template slot-scope="scope">
              <div class="status-column">
                <el-tag
                  :type="getRecordStatusType(scope.row)"
                  size="small">
                  <i :class="getRecordStatusIcon(scope.row)"></i>
                  {{getRecordStatusText(scope.row)}}
                </el-tag>
                <!-- 显示验证者信息 -->
                <div v-if="scope.row.verificationInfo && scope.row.verificationInfo.record.verified_by_name" class="verification-info">
                  <el-tooltip :content="`Verified by ${scope.row.verificationInfo.record.verified_by_name} at ${formatDateTime(scope.row.verificationInfo.record.verified_at)}`" placement="top">
                    <i class="el-icon-user verification-icon"></i>
                  </el-tooltip>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="Overall Status" width="150">
            <template slot-scope="scope">
              <el-tag
                :type="getOverallStatusType(scope.row)"
                size="small">
                <i :class="getOverallStatusIcon(scope.row)"></i>
                {{getOverallStatusText(scope.row)}}
              </el-tag>
            </template>
          </el-table-column>


          <el-table-column label="Total #" width="80">
            <template slot-scope="scope">
              <span>{{scope.row.totalNumber || 1}}</span>
            </template>
          </el-table-column>

          <el-table-column label="Actions" width="120" fixed="right">
            <template slot-scope="scope">
              <el-button
                type="primary"
                size="mini"
                @click.stop="editRecord(scope.row)">
                <i class="el-icon-edit"></i>
                Edit
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-wrapper">
          <el-pagination
            :current-page="currentPage"
            :page-sizes="[10, 25, 50, 100]"
            :page-size="pageSize"
            :total="totalRecords"
            layout="total, sizes, prev, pager, next"
            @current-change="handlePageChange"
            @size-change="handleSizeChange">
          </el-pagination>
        </div>
      </el-card>
    </div>

    <!-- 记录编辑对话框 -->
    <record-editor-dialog
      v-if="showRecordEditor"
      :visible="showRecordEditor"
      :record="editingRecord"
      :batch-serial-id="selectedBatchId"
      @close="closeRecordEditor"
      @save="handleRecordSave"
      @partial-saved="handlePartialSaved"
      @fix-family="openFamilyMoveForTaxon"
    />

    <!-- 批量操作确认对话框 -->
    <el-dialog
      title="Batch Operation Confirmation"
      :visible.sync="showBatchConfirmDialog"
      width="500px">
      <div class="batch-confirm-content">
        <p>Are you sure you want to <strong>{{batchActionText}}</strong> for {{selectedRecords.length}} selected records?</p>
        <div v-if="batchActionType === 'verify-completed'" class="warning-text">
          <i class="el-icon-warning"></i>
          This will mark all selected records as fully verified if they have both species and locality matched.
        </div>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="showBatchConfirmDialog = false">Cancel</el-button>
        <el-button type="primary" @click="confirmBatchAction" :loading="performingBatchAction">Confirm</el-button>
      </div>
    </el-dialog>

    <name-groups-panel
      :visible-sync.sync="nameGroupsOpen"
      :batch-serial-id="selectedBatchId"
      :curator="curatorName"
      :initial-filter="nameGroupsFilter"
      @applied="onNameGroupApplied"
    />

    <!-- 改科就地弹窗：跟 Synonym Review 用的是同一个组件，curator 不用离开这个批次 -->
    <family-move-dialog
      :visible.sync="familyMoveOpen"
      :taxa="familyMoveTaxa"
      :source-local-family="familyMoveFrom"
      :source-reference-family="null"
      :curator="curatorName"
      @moved="onFamilyMoved"
    />
  </div>
</template>

<script>
import RecordEditorDialog from '@/components/RecordsProcessor/RecordEditorDialog.vue'
import FieldFilterChips from '@/components/FieldFilterChips/index.vue'
import NameGroupsPanel from './NameGroupsPanel.vue'
import FamilyMoveDialog from '@/components/FamilyMoveDialog'
import { getTaxonForMove } from '@/api/familyPolicy'
import { applyNameGroup, previewNameGroup } from '@/api/verbatimworkspace'
import request from '@/utils/request'
import {
  getVerbatimBatches,
  getBatchRecords,
  getBatchInfo,
  updateVerbatimRecord,
  exportBatchResults,
  downloadBatchSourceFile,
  markBatchCompleted,
  confirmBatchImport,
  batchUpdateVerificationStatus
} from '@/api/verbatimworkspace'

export default {
  name: 'VerbatimWorkspace',
  components: {
    RecordEditorDialog,
    FieldFilterChips,
    NameGroupsPanel,
    FamilyMoveDialog
  },
  data() {
    return {
      // 按名字批量决定（一个名字一次，而不是一条记录一次）
      nameGroupsOpen: false,
      nameGroupsFilter: '',

      // 改科弹窗（就地，不跳页）
      familyMoveOpen: false,
      familyMoveTaxa: [],
      familyMoveFrom: '',

      // 批次相关
      selectedBatchId: '',
      availableBatches: [],
      currentBatch: null,
      loadingBatch: false,

      // 记录数据
      batchRecords: [],
      loadingRecords: false,
      totalRecords: 0,
      // 编辑弹窗这一次打开里已经追问过的「名字 -> taxon」。就地 Apply 和底部 Save 是两条
      // 保存路径，同一个决定会先后经过两条，不去重就会把同一句话问两遍。
      nameGroupOffered: [],

      // 服务器端过滤和搜索
      serverSideFilter: 'all',
      serverSideSearch: '',
      serverSideFieldFilters: {}, // {field_key: [val1, val2, ...]}
      fieldFilterOptions: [
        { key: 'catalog_number', label: 'Catalog #' },
        { key: 'verbatim_field_number', label: 'Verbatim Field #' },
        { key: 'matched_field_number', label: 'Matched Field #' },
        { key: 'verbatim_family', label: 'Verbatim Family' },
        { key: 'verbatim_genus', label: 'Verbatim Genus' },
        { key: 'verbatim_species', label: 'Verbatim Species' },
        { key: 'matched_family', label: 'Matched Family' },
        { key: 'matched_genus', label: 'Matched Genus' },
        { key: 'matched_species', label: 'Matched Species' },
        { key: 'suggested_family', label: 'Suggested Family' },
        { key: 'suggested_genus', label: 'Suggested Genus' },
        { key: 'suggested_species', label: 'Suggested Species' },
        { key: 'verbatim_locality_string', label: 'Verbatim Locality' },
        { key: 'matched_locality', label: 'Matched Locality' },
        { key: 'verbatim_country', label: 'Verbatim Country' },
        { key: 'verbatim_state', label: 'Verbatim State' },
        { key: 'verbatim_county', label: 'Verbatim County' },
        { key: 'verbatim_drainage', label: 'Verbatim Drainage' },
        { key: 'verbatim_waterbody', label: 'Verbatim Waterbody' },
        { key: 'verbatim_collector', label: 'Verbatim Collector' },
        { key: 'storage', label: 'Storage' },
        { key: 'jar_size', label: 'Jar Size' },
        { key: 'prev_number', label: 'Prev Number' },
        { key: 'remarks', label: 'Remarks' }
      ],
      searchText: '',
      searchTimeout: null,
      currentPage: 1,
      pageSize: 25,

      // 进度统计
      progressStats: {
        total: 0,
        speciesVerified: 0,
        localityVerified: 0,
        recordVerified: 0,
        fullyCompleted: 0,
        speciesPercentage: 0,
        localityPercentage: 0,
        recordPercentage: 0,
        completionPercentage: 0,
        needsReview: 0,
        cataloged: 0,          // 已迁移到 Primary（拿到正式 catalog number）
        remaining: 0,          // 还差多少未 catalog
        hasErrors: 0,          // 有errors的记录数
        hasWarnings: 0,        // 有warnings的记录数
        hasPending: 0,         // 有pending状态的记录数
        pendingTaxonomic: 0,   // Species pending的记录数
        pendingLocality: 0,    // Locality pending的记录数
        pendingRecord: 0       // Record pending的记录数
      },

      // 编辑对话框
      showRecordEditor: false,
      editingRecord: null,

      // 批量操作
      selectedRecords: [],
      showBatchConfirmDialog: false,
      batchActionType: '',
      batchActionText: '',
      performingBatchAction: false,

      // Apply suggestion loading state
      applyingRecordId: null
    }
  },
  computed: {
    // 谁做的决定要留在 batch_name_group_apply 里，跟 DataQualityPanel 取同一个来源
    curatorName() { return this.$store.getters.name || 'curator' },

    // 把导入时的 field mapping（{field: 源列}）转成表格行展示
    mappingRows() {
      const m = this.currentBatch && this.currentBatch.fieldMappings;
      if (!m) return [];
      return Object.keys(m)
        .filter(k => m[k])
        .map(k => ({ field: k, column: m[k] }));
    },

    pendingCount() {
      return this.progressStats.total - this.progressStats.fullyCompleted;
    },

    completedCount() {
      return this.progressStats.fullyCompleted;
    },

    needsReviewCount() {
      return this.progressStats.needsReview || 0;
    }
  },
  async mounted() {
    await this.loadAvailableBatches();

    // 检查 URL 参数中是否有 batchId，如果有则自动选择该批次
    const batchIdFromQuery = this.$route.query.batchId;
    if (batchIdFromQuery) {
      this.selectedBatchId = batchIdFromQuery;
      await this.selectBatch(batchIdFromQuery);
    }
  },
  beforeDestroy() {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  },
  methods: {
    // 判断是否为临时catalog number
    isTemporaryCatalogNumber(catalogNumber) {
      return catalogNumber && catalogNumber.toString().startsWith('TEMP_');
    },

    // 判断 matched/suggested taxonomic 是否是 family-level（有 Family，Genus/Species 为空）
    isFamilyLevelTaxon(t) {
      if (!t) return false;
      const hasFamily = !!t.Family;
      const noGenus = !t.Genus || String(t.Genus).trim() === '';
      const noSpecies = !t.Species || String(t.Species).trim() === '';
      return hasFamily && noGenus && noSpecies;
    },

    // 加载可用批次列表
    async loadAvailableBatches() {
      this.loadingBatch = true;
      try {
        const response = await getVerbatimBatches();
        if (response.code === 20000) {
          this.availableBatches = response.data.items.map(batch => ({
            batchSerialId: batch.batch_serial_id,
            fileName: batch.file_name || 'Unnamed Batch',
            recordCount: batch.total_records,
            importDate: batch.import_date,
            status: batch.status,
          }))
        }
      } catch (error) {
        this.$message.error('Failed to load available batches');
        console.error(error);
      } finally {
        this.loadingBatch = false;
      }
    },

    // 刷新批次列表
    async refreshBatchList() {
      await this.loadAvailableBatches();
      this.$message.success('Batch list refreshed');
    },

    // 加载批次数据
    async loadBatchData() {
      if (!this.selectedBatchId) {
        this.currentBatch = null;
        this.batchRecords = [];
        this.totalRecords = 0;
        return;
      }

      // 重置分页和搜索
      this.currentPage = 1;
      this.serverSideSearch = '';
      this.serverSideFilter = 'all';
      this.searchText = '';
      this.serverSideFieldFilters = {};

      try {
        // 获取批次基本信息
        const batchResponse = await getBatchInfo(this.selectedBatchId);
        if (batchResponse.code === 20000) {
          this.currentBatch = {
            batchSerialId: batchResponse.data.batch_serial_id,
            fileName: batchResponse.data.file_name || `Batch ${batchResponse.data.batch_serial_id}`,
            recordCount: batchResponse.data.total_records,
            importDate: batchResponse.data.import_date,
            status: batchResponse.data.status,
            sourceFile: batchResponse.data.source_file || null,
            fieldMappings: (batchResponse.data.metadata && batchResponse.data.metadata.field_mappings) || null
          };

          // 设置进度统计
          this.updateProgressFromBatchInfo(batchResponse.data.progress);
        }

        // 加载第一页记录
        await this.loadBatchRecords();

        // 获取详细的verification统计 (包括warnings和errors)
        await this.fetchVerificationSummary();
      } catch (error) {
        this.$message.error('Failed to load batch data');
        console.error(error);
      }
    },

    // 加载批次记录
    async loadBatchRecords() {
      if (!this.selectedBatchId) {
        this.batchRecords = [];
        this.totalRecords = 0;
        return;
      }

      this.loadingRecords = true;
      try {
        const recordsResponse = await getBatchRecords(this.selectedBatchId, {
          page: this.currentPage,
          page_size: this.pageSize,
          status: this.serverSideFilter === 'all' ? undefined : this.serverSideFilter,
          search: this.serverSideSearch,
          field_filters: this.serverSideFieldFilters
        });

        if (recordsResponse.code === 20000) {
          this.totalRecords = recordsResponse.data.total;
          this.batchRecords = recordsResponse.data.items.map(record => {
            return {
              id: record.id,
              catalogNumber: record.catalog_number,
              taxonId: record.matched_data?.taxonomic?.id || null,
              verbatimTaxonomicId: record.verbatim_data?.taxonomic?.id || null,
              localityId: record.matched_data?.locality?.id || null,
              verbatimLocalityId: record.verbatim_data?.locality?.id || null,
              fieldNumber: record.verbatim_data?.locality?.field_number || null,
              collectionDate: record.matched_data?.locality?.collection_date || null,
              totalNumber: record.record_data?.total_number || 1,
              storage: record.record_data?.storage || null,
              jarSize: record.record_data?.jar_size || null,
              prevNumber: record.record_data?.prev_number || null,
              inventory: record.record_data?.inventory || null,
              typeStatus: record.record_data?.type_status || null,
              remarks: record.record_data?.remarks || null,

              verbatimTaxonomic: record.verbatim_data?.taxonomic ? {
                verbatimFamily: record.verbatim_data.taxonomic.family || '',
                verbatimGenus: record.verbatim_data.taxonomic.genus || '',
                verbatimSpecies: record.verbatim_data.taxonomic.species || ''
              } : null,

              verbatimLocality: record.verbatim_data?.locality ? {
                id: record.verbatim_data.locality.id,
                locality_string: record.verbatim_data.locality.locality_string,
                field_number: record.verbatim_data.locality.field_number,
                drainage: record.verbatim_data.locality.drainage,
                country: record.verbatim_data.locality.country,
                state: record.verbatim_data.locality.state,
                county: record.verbatim_data.locality.county,
                waterbody: record.verbatim_data.locality.waterbody,
                latitude: record.verbatim_data.locality.latitude,
                longitude: record.verbatim_data.locality.longitude,
                collect_date: record.verbatim_data.locality.collect_date,
                collector: record.verbatim_data.locality.collector
              } : null,

              taxonomic: record.matched_data?.taxonomic?.id ? {
                FullName: `${record.matched_data.taxonomic.genus || ''} ${record.matched_data.taxonomic.species || ''}`.trim(),
                TaxonID: record.matched_data.taxonomic.id,
                Family: record.matched_data.taxonomic.family,
                Genus: record.matched_data.taxonomic.genus,
                Species: record.matched_data.taxonomic.species,
                Author: record.matched_data.taxonomic.author
              } : null,

              locality: record.matched_data?.locality?.id ? {
                Locality1ID: record.matched_data.locality.id,
                LocalityString: record.matched_data.locality.locality,
                FieldNo: record.matched_data.locality.field_number,
                Country: record.matched_data.locality.country,
                State: record.matched_data.locality.state,
                County: record.matched_data.locality.county
              } : null,

              matchSuggestions: record.match_suggestions?.taxonomic ? {
                status: record.match_suggestions.taxonomic.status,
                confidence: record.match_suggestions.taxonomic.confidence,
                hasSuggestion: record.match_suggestions.taxonomic.has_suggestion,
                suggestionApplied: record.match_suggestions.taxonomic.suggestion_applied,
                suggested_taxon_id: record.match_suggestions.taxonomic.suggested_taxon_id,
                match_details: record.match_suggestions.taxonomic.match_details,
                suggested_data: record.match_suggestions.taxonomic.suggested_data
              } : null,

              suggestedTaxonomic: record.match_suggestions?.taxonomic?.suggested_data ? {
                FullName: record.match_suggestions.taxonomic.suggested_data.full_name ||
                  `${record.match_suggestions.taxonomic.suggested_data.genus || ''} ${record.match_suggestions.taxonomic.suggested_data.species || ''}`.trim(),
                TaxonID: record.match_suggestions.taxonomic.suggested_taxon_id,
                Family: record.match_suggestions.taxonomic.suggested_data.family,
                Genus: record.match_suggestions.taxonomic.suggested_data.genus,
                Species: record.match_suggestions.taxonomic.suggested_data.species,
                Author: record.match_suggestions.taxonomic.suggested_data.author
              } : null,

              familyOnly: record.match_suggestions?.taxonomic?.family_only ? {
                isFamilyOnly: record.match_suggestions.taxonomic.family_only.is_family_only,
                verbatimFamilyName: record.match_suggestions.taxonomic.family_only.verbatim_family_name,
                matchedFamilyId: record.match_suggestions.taxonomic.family_only.matched_family_id,
                existsInDb: record.match_suggestions.taxonomic.family_only.exists_in_db
              } : null,

              // CoF accepted 名本地缺失 -> 建议创建（genus/species/family 来自 CoF）
              cofCreate: record.match_suggestions?.taxonomic?.cof_create || null,

              verificationInfo: record.verification_info || null,
              processingStatus: record.processing_status,
              // 这一批里还有多少条记录挂着同一个名字、同一个建议 —— Apply 按钮拿它决定
              // 是改一条还是把这个名字整批应用
              same_name_pending: record.same_name_pending || 0,
              // 同名的全部待处理数（不看当初匹配到什么）—— 编辑弹窗保存后的追问用它
              same_name_pending_any: record.same_name_pending_any || 0,
              // 这条的 taxon 不是这批匹配出来的，是沿用之前某一批 curator 的裁定
              historicalDecision: record.historical_decision || null,
              _apiData: record
            };
          });

          if (recordsResponse.data.progress) {
            this.updateProgressFromAPI(recordsResponse.data.progress);
          }
        }
      } catch (error) {
        this.$message.error('Failed to load batch records');
        console.error(error);
      } finally {
        this.loadingRecords = false;
      }
    },

    // 更新进度统计 - 只更新基础统计，保留详细的验证统计
    updateProgressFromAPI(progress) {
      // 只更新部分字段，保留 hasErrors, hasWarnings, pendingTaxonomic 等字段
      this.progressStats.total = this.currentBatch?.recordCount || progress.taxonomic?.total || 0;
      this.progressStats.speciesVerified = progress.taxonomic?.verified || 0;
      this.progressStats.localityVerified = progress.locality?.verified || 0;
      this.progressStats.recordVerified = progress.record?.verified || 0;
      this.progressStats.fullyCompleted = progress.overall?.completed || 0;
      this.progressStats.speciesPercentage = progress.taxonomic?.percent || 0;
      this.progressStats.localityPercentage = progress.locality?.percent || 0;
      this.progressStats.recordPercentage = progress.record?.percent || 0;
      this.progressStats.completionPercentage = progress.overall?.percent || 0;
      this.progressStats.needsReview = progress.needs_review?.count || 0;
      // 注意：不覆盖 hasErrors, hasWarnings, pendingTaxonomic 等字段
    },

    updateProgressFromBatchInfo(progress) {
      if (progress) {
        // 只更新部分字段，保留 hasErrors, hasWarnings, pendingTaxonomic 等字段
        this.progressStats.total = progress.taxonomic?.total || 0;
        this.progressStats.speciesVerified = progress.taxonomic?.verified || 0;
        this.progressStats.localityVerified = progress.locality?.verified || 0;
        this.progressStats.recordVerified = progress.record?.verified || 0;
        this.progressStats.fullyCompleted = progress.overall?.completed || 0;
        this.progressStats.speciesPercentage = progress.taxonomic?.percent || 0;
        this.progressStats.localityPercentage = progress.locality?.percent || 0;
        this.progressStats.recordPercentage = progress.record?.percent || 0;
        this.progressStats.completionPercentage = progress.overall?.percent || 0;
        this.progressStats.needsReview = progress.needs_review?.count || 0;
        this.progressStats.cataloged = progress.cataloged?.processed || 0;
        this.progressStats.remaining = progress.cataloged?.remaining != null ? progress.cataloged.remaining : 0;
        // 注意：不覆盖 hasErrors, hasWarnings, pendingTaxonomic 等字段
      }
    },

    // 跳到 Lots 搜索并预置本批过滤（?batch=xxx）
    goToLotsSearch() {
      this.$router.push({ name: 'AdvancedSearchLot', query: { batch: this.selectedBatchId } });
    },

    // 刷新进度
    async refreshProgress() {
      await this.loadBatchData();
    },

    // 设置过滤状态
    async setFilter(status) {
      this.serverSideFilter = status;
      this.currentPage = 1;
      await this.loadBatchRecords();
    },

    // 搜索处理
    onSearchChange() {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(async () => {
        this.serverSideSearch = this.searchText;
        this.currentPage = 1;
        await this.loadBatchRecords();
      }, 500);
    },

    onSearchClear() {
      this.searchText = '';
      this.serverSideSearch = '';
      this.currentPage = 1;
      this.loadBatchRecords();
    },

    // chip 增删 / 清空触发
    async onFieldFiltersChange(next) {
      this.serverSideFieldFilters = next || {};
      this.currentPage = 1;
      await this.loadBatchRecords();
    },

    // 按名字批量应用/撤销之后：这一次可能改了上千条记录，表格和进度都得重拉
    async onNameGroupApplied() {
      await this.loadBatchRecords();
      await this.fetchVerificationSummary();
    },

    // 分页处理
    async handlePageChange(page) {
      this.currentPage = page;
      await this.loadBatchRecords();
    },

    async handleSizeChange(size) {
      this.pageSize = size;
      this.currentPage = 1;
      await this.loadBatchRecords();
    },

    // 跟后端 name-group 的分组键一致：小写的 "genus species"
    verbatimNameKey(record) {
      const v = record.verbatimTaxonomic || {};
      return `${v.verbatimGenus || ''} ${v.verbatimSpecies || ''}`
        .replace(/\s+/g, ' ').trim().toLowerCase();
    },

    // 科不在记录上，在 taxon 上。从编辑弹窗里开那个共用的移动对话框。
    async openFamilyMoveForTaxon(taxonId) {
      try {
        const res = await getTaxonForMove(taxonId);
        if (res.code !== 20000) { this.$message.error(res.message); return; }
        const t = res.data.taxon;
        this.familyMoveTaxa = [{
          TaxonID: t.TaxonID, full_name: t.full_name, specimens: t.specimens
        }];
        this.familyMoveFrom = t.family_name || '';
        this.familyMoveOpen = true;
      } catch (e) {
        this.$message.error('Failed to load that taxon');
      }
    },

    // 科变了 -> 这条记录显示的科也变了，而且 family 警告可能不再成立，重拉表格
    async onFamilyMoved() {
      await this.loadBatchRecords();
      await this.fetchVerificationSummary();
    },

    // verified 但 verbatim 行上没有署名 → 是导入时自动配的，不是人确认的
    autoVerifiedSpecies(record) {
      const s = record.verificationInfo && record.verificationInfo.species;
      return !!s && s.status === 'verified' && !s.verified_by_name;
    },

    // 获取物种验证状态
    getSpeciesVerificationStatus(record) {
      return record.verificationInfo?.species?.status ||
        record.processingStatus?.taxonomic ||
        (record.taxonId ? 'verified' : 'pending');
    },

    getSpeciesStatusType(record) {
      const status = this.getSpeciesVerificationStatus(record);
      switch(status) {
        case 'verified': return 'success';
        case 'needs_review': return 'warning';
        case 'rejected': return 'danger';
        default: return 'info';
      }
    },

    getSpeciesStatusIcon(record) {
      const status = this.getSpeciesVerificationStatus(record);
      switch(status) {
        case 'verified': return 'el-icon-check';
        case 'needs_review': return 'el-icon-warning';
        case 'rejected': return 'el-icon-close';
        default: return 'el-icon-minus';
      }
    },

    getSpeciesStatusText(record) {
      const status = this.getSpeciesVerificationStatus(record);
      switch(status) {
        case 'verified': return 'Verified';
        case 'needs_review': return 'Needs Review';
        case 'rejected': return 'Rejected';
        default: return 'Pending';
      }
    },

    // 获取地点验证状态
    getLocalityVerificationStatus(record) {
      return record.verificationInfo?.locality?.status ||
        record.processingStatus?.locality ||
        (record.localityId ? 'verified' : 'pending');
    },

    getLocalityStatusType(record) {
      const status = this.getLocalityVerificationStatus(record);
      switch(status) {
        case 'verified': return 'success';
        case 'needs_review': return 'warning';
        case 'rejected': return 'danger';
        default: return 'info';
      }
    },

    getLocalityStatusIcon(record) {
      const status = this.getLocalityVerificationStatus(record);
      switch(status) {
        case 'verified': return 'el-icon-check';
        case 'needs_review': return 'el-icon-warning';
        case 'rejected': return 'el-icon-close';
        default: return 'el-icon-minus';
      }
    },

    getLocalityStatusText(record) {
      const status = this.getLocalityVerificationStatus(record);
      switch(status) {
        case 'verified': return 'Verified';
        case 'needs_review': return 'Needs Review';
        case 'rejected': return 'Rejected';
        default: return 'Pending';
      }
    },

    // 获取记录验证状态
    getRecordVerificationStatus(record) {
      return record.verificationInfo?.record?.status ||
        record.processingStatus?.record ||
        'pending';
    },

    getRecordStatusType(record) {
      const status = this.getRecordVerificationStatus(record);
      switch(status) {
        case 'verified': return 'success';
        case 'needs_review': return 'warning';
        case 'rejected': return 'danger';
        default: return 'info';
      }
    },

    getRecordStatusIcon(record) {
      const status = this.getRecordVerificationStatus(record);
      switch(status) {
        case 'verified': return 'el-icon-check';
        case 'needs_review': return 'el-icon-warning';
        case 'rejected': return 'el-icon-close';
        default: return 'el-icon-minus';
      }
    },

    getRecordStatusText(record) {
      const status = this.getRecordVerificationStatus(record);
      switch(status) {
        case 'verified': return 'Verified';
        case 'needs_review': return 'Needs Review';
        case 'rejected': return 'Rejected';
        default: return 'Pending';
      }
    },

    // 获取整体验证状态
    getOverallVerificationStatus(record) {
      return record.verificationInfo?.overall?.status ||
        record.processingStatus?.overall ||
        'pending';
    },

    getOverallStatusType(record) {
      const status = this.getOverallVerificationStatus(record);
      switch(status) {
        case 'completed': return 'success';
        case 'verified': return 'success';
        case 'needs_review': return 'warning';
        case 'rejected': return 'danger';
        default: return 'info';
      }
    },

    getOverallStatusIcon(record) {
      const status = this.getOverallVerificationStatus(record);
      switch(status) {
        case 'completed': return 'el-icon-check';
        case 'verified': return 'el-icon-check';
        case 'needs_review': return 'el-icon-warning';
        case 'rejected': return 'el-icon-close';
        default: return 'el-icon-minus';
      }
    },

    getOverallStatusText(record) {
      const status = this.getOverallVerificationStatus(record);
      switch(status) {
        case 'completed': return 'Completed';
        case 'verified': return 'Verified';
        case 'needs_review': return 'Needs Review';
        case 'rejected': return 'Rejected';
        default: return 'Pending';
      }
    },

    // 获取匹配建议相关信息
    getMatchSuggestionType(matchSuggestions) {
      if (!matchSuggestions || !matchSuggestions.hasSuggestion) return '';

      const confidence = matchSuggestions.confidence || 0;
      if (confidence >= 90) return 'success';
      if (confidence >= 70) return 'warning';
      return 'info';
    },

    getMatchTooltip(matchSuggestions) {
      if (!matchSuggestions) return '';

      let tooltip = `Match Status: ${matchSuggestions.status}\n`;
      tooltip += `Confidence: ${matchSuggestions.confidence}%\n`;
      if (matchSuggestions.suggestionApplied) {
        tooltip += 'Suggestion has been applied';
      } else if (matchSuggestions.hasSuggestion) {
        tooltip += 'Click "Apply" to use this suggestion';
      } else {
        tooltip += 'No automatic suggestion available';
      }

      return tooltip;
    },

    // Whose earlier decision this record's taxon was inherited from. Naming the person and
    // the batch is the whole safeguard: the curator can see it is second-hand and go check
    // that batch if it looks wrong.
    historicalDecisionTooltip(record) {
      const d = record.historicalDecision;
      if (!d) return '';
      const who = d.decided_by || 'someone';
      const when = d.decided_at ? this.formatDateTime(d.decided_at) : 'an earlier batch';
      const batch = d.source_batch ? ` in batch ${d.source_batch}` : '';
      return `This name was decided to mean ${d.taxon_name || 'this taxon'} by ${who} ` +
        `on ${when}${batch}. The answer is filled in but still needs your confirmation.`;
    },

    // 应用分类建议
    async applySuggestion(record) {
      // 检查是否有建议的物种信息
      if (!record.suggestedTaxonomic || !record.suggestedTaxonomic.TaxonID) {
        this.$message.warning('No taxonomic suggestion available');
        return;
      }

      const key = this.verbatimNameKey(record);
      const sameName = record.same_name_pending || 1;

      // 同一个名字在一批里出现上百上千次是常态，而它们是同一个判断。确认一次就把这个名字
      // 全批应用掉，不让 curator 把同一件事做 1362 遍。改动可撤销（Decide by name 抽屉里
      // 有历史和 Undo）。
      if (sameName > 1 && key) {
        try {
          await this.$confirm(
            `Apply ${record.suggestedTaxonomic.FullName} to all ${sameName} records in this
             batch imported as "${key}"?

             They are the same name, so this is one decision. It can be undone.`,
            'Apply to this name', { type: 'warning', confirmButtonText: `Apply to ${sameName}` });
        } catch (e) { return }

        this.applyingRecordId = record.id;
        try {
          const res = await applyNameGroup(this.selectedBatchId, {
            name_key: key,
            taxon_id: record.suggestedTaxonomic.TaxonID,
            applied_by: this.curatorName
          });
          if (res.code === 20000) {
            this.$message.success(res.message);
            await this.loadBatchRecords();
            await this.fetchVerificationSummary();
          } else {
            this.$message.error(res.message);
          }
        } catch (error) {
          // interceptor 已经报过了
        } finally {
          this.applyingRecordId = null;
        }
        return;
      }

      // 这个名字在这批里只此一条，就地改这一条
      this.applyingRecordId = record.id;

      try {
        // 构建更新数据，与 RecordEditorDialog 的保存逻辑一致
        const updateData = {
          id: record.id,
          taxon_id: record.suggestedTaxonomic.TaxonID,
          species_verification_status: 'verified',
          // 谁按的。导入时 exact match 会自动写同样的 TaxonID + verified，
          // 不带这个就分不出这条是人确认的还是系统自己配的
          verified_by: this.curatorName,
          verification_notes: 'Applied taxonomic suggestion from workspace'
        };

        const response = await updateVerbatimRecord(updateData);
        if (response.code === 20000) {
          // 直接更新当前行的数据，无需刷新整个列表
          record.taxonId = record.suggestedTaxonomic.TaxonID;
          record.taxonomic = {
            TaxonID: record.suggestedTaxonomic.TaxonID,
            FullName: record.suggestedTaxonomic.FullName,
            Family: record.suggestedTaxonomic.Family,
            Genus: record.suggestedTaxonomic.Genus,
            Species: record.suggestedTaxonomic.Species,
            Author: record.suggestedTaxonomic.Author
          };
          // 更新验证状态
          if (record.verificationInfo) {
            record.verificationInfo.species = {
              ...record.verificationInfo.species,
              status: 'verified'
            };
          }
          if (record.processingStatus) {
            record.processingStatus.taxonomic = 'verified';
          }

          this.$message.success('Taxonomic suggestion applied');
          // 异步更新统计信息，不阻塞UI
          this.fetchVerificationSummary();
        }
      } catch (error) {
        this.$message.error('Failed to apply taxonomic suggestion');
        console.error(error);
      } finally {
        this.applyingRecordId = null;
      }
    },

    // CoF 建议创建的显示名
    cofCreateName(cof) {
      if (!cof) return '';
      return [cof.genus, cof.species, cof.subspecies].filter(Boolean).join(' ');
    },

    // "Create & apply" 已移除（2026-08-17）。它是这一页唯一一个一键往馆级
    // TaxonomicTable / Family 插行的按钮，不可撤销（删 taxon 会级联删 Determination），
    // 而且科是从 CoF 建议里带过来的、curator 从没显式选过——taxon 已存在时确认框写着
    // "Nothing new is added"，后端却仍会建出一个没有任何 taxa 挂靠的空科。
    // 建种改到 Edit 弹窗：Create New Species 要自己挑科，并且走 decideTaxon，
    // 会顺带追问同名的其余记录、整批可撤销。表格里只保留 CoF 那行提示。
    // 后端 /create-cof-taxon(+/preview) 和 cof_taxon_creation_log 暂时留着，没有调用方。

    // 编辑记录
    editRecord(record) {
      console.log('Editing record:', record);
      this.editingRecord = { ...record };
      this.nameGroupOffered = [];
      this.showRecordEditor = true;
    },

    // 关闭编辑对话框。这里故意不清 nameGroupOffered：底部 Save 会先关弹窗、再追问，
    // 清掉的话"就地 Apply 已经问过并且被拒绝"的记忆就没了，同一句话会再问一遍。
    closeRecordEditor() {
      this.showRecordEditor = false;
      this.editingRecord = null;
    },

    // 子组件已直接持久化（Apply/Cancel suggestion）：仅同步本地行 + 刷新统计，不关闭对话框
    async handlePartialSaved(payload) {
      const target = this.batchRecords.find(r => r.id === payload.recordId);
      // 追问用的是这条记录判之前的样子（同名还剩多少条在等），所以在同步覆盖之前先拍下来
      const before = target ? { ...target } : null;
      if (target) {
        target.taxonId = payload.taxonId;
        target.taxonomic = payload.taxonomic;
        if (target.verificationInfo) {
          target.verificationInfo.species = {
            ...target.verificationInfo.species,
            status: payload.speciesVerificationStatus
          };
        }
        if (target.processingStatus) {
          target.processingStatus.taxonomic = payload.speciesVerificationStatus === 'verified' ? 'processed' : 'pending';
        }
      }
      // 同步保持 editingRecord 与列表一致
      if (this.editingRecord && this.editingRecord.id === payload.recordId) {
        this.editingRecord.taxonId = payload.taxonId;
        this.editingRecord.taxonomic = payload.taxonomic;
      }
      this.fetchVerificationSummary();

      // 就地 Apply / Select 已经在子组件里走过 decideTaxon —— 问过、也连这一条一起写完了，
      // 这里只要把列表刷新到位就行。剩下没走 decideTaxon 的路径（科级 entry、手工 family
      // apply）仍然是先写后问，所以还得在这里补一次追问。
      if (payload.nameGroupHandled) {
        await this.loadBatchRecords();
        return;
      }
      await this.maybeOfferNameGroup(before, payload.taxonId,
        payload.speciesVerificationStatus);
    },

    // 详情弹窗里任何一次种名裁定之后，问要不要把同名的其余记录一起处理掉。
    // before 必须是判之前的那份快照 —— same_name_pending_any 是"还在等的同名条数"，
    // 判完再读就已经少了一条甚至归零。
    async maybeOfferNameGroup(before, taxonId, status) {
      if (!before || status !== 'verified' || !taxonId) return;
      const siblings = (before.same_name_pending_any || 0) - 1;
      const nameKey = this.verbatimNameKey(before);
      if (siblings <= 0 || !nameKey) return;

      const asked = `${nameKey}|${taxonId}`;
      if (this.nameGroupOffered.includes(asked)) return;
      this.nameGroupOffered.push(asked);

      await this.offerToApplyToWholeName(nameKey, taxonId, siblings);
    },

    // 处理记录保存
    async handleRecordSave(updatedRecord) {
      // 保存前先记住这条原本的样子：保存后列表会重载，就问不出"这个名字还有多少条在等"了
      const before = this.batchRecords.find(r => r.id === updatedRecord.id) || {};

      try {
        const response = await updateVerbatimRecord(updatedRecord);
        if (response.code === 20000) {
          this.$message.success('Record updated successfully');
          this.closeRecordEditor();
          await this.loadBatchRecords();
          // 重新获取验证统计信息，反映最新的 errors/warnings 数量
          await this.fetchVerificationSummary();

          // 同一个 verbatim 名字就是同一个鉴定。curator 在弹窗里刚判完一条，剩下几百条
          // 一模一样的还在队列里等着 —— 不问一句，他就得把同一件事再做几百遍。
          await this.maybeOfferNameGroup(before, updatedRecord.taxon_id,
            updatedRecord.species_verification_status);
        }
      } catch (error) {
        this.$message.error('Failed to update record');
        console.error(error);
      }
    },

    // 弹窗里判完一条之后，问要不要把同名的其余记录一起处理掉。
    // 走 whole_name 模式：curator 很可能否决了系统建议、选了别的 taxon，那些记录当初匹配到
    // 的是别的东西，按"同名同建议"筛会一条都选不到。
    async offerToApplyToWholeName(nameKey, taxonId, siblings) {
      let preview;
      try {
        const res = await previewNameGroup(this.selectedBatchId, {
          name_key: nameKey, taxon_id: taxonId, whole_name: true
        });
        if (res.code !== 20000 || !res.data || !res.data.records_to_apply) return;
        preview = res.data;
      } catch (e) {
        return; // 追问是锦上添花，问不出来就算了，别打扰刚保存成功的人
      }

      let msg = `${preview.records_to_apply} more record(s) in this batch were imported as ` +
        `"${nameKey}" and are still waiting.\n\nApply ${preview.taxon.full_name} to them too?`;
      if (preview.family_reference_warning) {
        msg += `\n\nFlagged on each: ${preview.family_reference_warning.message}`;
      }
      msg += '\n\nThis can be undone from "Decide by name".';

      try {
        await this.$confirm(msg, 'Same name, same decision', {
          type: 'warning',
          confirmButtonText: `Apply to ${preview.records_to_apply}`,
          cancelButtonText: 'Just this one'
        });
      } catch (e) { return }

      try {
        const res = await applyNameGroup(this.selectedBatchId, {
          name_key: nameKey, taxon_id: taxonId, whole_name: true,
          applied_by: this.curatorName
        });
        if (res.code === 20000) {
          this.$message.success(res.message);
          await this.loadBatchRecords();
          await this.fetchVerificationSummary();
        } else {
          this.$message.error(res.message);
        }
      } catch (e) {
        // interceptor 已经报过了
      }
    },

    // 处理表格选择变化
    handleSelectionChange(selection) {
      this.selectedRecords = selection;
    },

    // 处理批量操作
    handleBatchAction(command) {
      if (this.selectedRecords.length === 0) {
        this.$message.warning('Please select records first');
        return;
      }

      this.batchActionType = command;

      switch(command) {
        case 'verify-completed':
          this.batchActionText = 'verify as completed';
          break;
        case 'verify-species':
          this.batchActionText = 'verify species information';
          break;
        case 'verify-locality':
          this.batchActionText = 'verify locality information';
          break;
        case 'mark-review':
          this.batchActionText = 'mark for review';
          break;
        default:
          this.batchActionText = 'perform batch operation';
      }

      this.showBatchConfirmDialog = true;
    },

    // 确认批量操作
    async confirmBatchAction() {
      this.performingBatchAction = true;

      try {
        const recordIds = this.selectedRecords.map(record => record.id);
        let verificationType = 'all';
        let status = 'verified';

        switch(this.batchActionType) {
          case 'verify-completed':
            const completedRecords = this.selectedRecords.filter(record =>
              record.taxonId && record.localityId
            );
            if (completedRecords.length === 0) {
              this.$message.warning('No completed records found in selection');
              return;
            }
            verificationType = 'all';
            status = 'verified';
            break;
          case 'verify-species':
            verificationType = 'species';
            status = 'verified';
            break;
          case 'verify-locality':
            verificationType = 'locality';
            status = 'verified';
            break;
          case 'mark-review':
            verificationType = 'all';
            status = 'needs_review';
            break;
        }

        const response = await batchUpdateVerificationStatus({
          record_ids: recordIds,
          verification_type: verificationType,
          status: status,
          notes: `Batch ${this.batchActionText} operation`
        });

        if (response.code === 20000) {
          this.$message.success(`Batch operation completed for ${response.data.updated_count} records`);
          await this.loadBatchRecords();
          // 重新获取验证统计信息
          await this.fetchVerificationSummary();
          this.$refs.recordsTable.clearSelection();
        }
      } catch (error) {
        this.$message.error('Batch operation failed');
        console.error(error);
      } finally {
        this.performingBatchAction = false;
        this.showBatchConfirmDialog = false;
      }
    },

    // 导出批次结果
    async exportBatchResults() {
      try {
        const response = await exportBatchResults(this.selectedBatchId);

        const blob = new Blob([response.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `batch_${this.selectedBatchId}_results.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        this.$message.success('Batch results exported successfully');
      } catch (error) {
        this.$message.error('Failed to export batch results');
        console.error(error);
      }
    },

    // 下载该批次保留的原始上传源文件
    async downloadSourceFile() {
      const sf = this.currentBatch && this.currentBatch.sourceFile;
      if (!sf) {
        this.$message.warning('No source file is available for this batch');
        return;
      }
      try {
        const response = await downloadBatchSourceFile(this.selectedBatchId);
        const blob = new Blob([response.data]);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = sf.file_name || `batch_${this.selectedBatchId}_source`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        this.$message.error('Failed to download source file');
        console.error(error);
      }
    },

    // 标记批次完成
    async markBatchCompleted() {
      if (this.pendingCount > 0) {
        const result = await this.$confirm(
          `This batch still has ${this.pendingCount} pending records. Are you sure you want to mark it as completed?`,
          'Confirm',
          { type: 'warning' }
        );
        if (!result) return;
      }

      // 二次确认：是否生成正式 catalog number
      try {
        const confirmGenerate = await this.$confirm(
          'This will generate official catalog numbers for all records in this batch. This action cannot be undone. Continue?',
          'Confirm Final Import',
          {
            type: 'warning',
            confirmButtonText: 'Generate Catalog Numbers',
            cancelButtonText: 'Cancel'
          }
        );
        if (!confirmGenerate) return;
      } catch {
        return; // 用户取消
      }

      const loading = this.$loading({
        lock: true,
        text: 'Generating catalog numbers and migrating data...',
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.7)'
      });

      try {
        // 1. 标记批次为完成
        await markBatchCompleted(this.selectedBatchId);

        // 2. 调用 confirmBatchImport 生成正式 catalog number
        const importResult = await confirmBatchImport(this.selectedBatchId);

        loading.close();

        // 显示成功信息（部分迁移：只迁符合条件的，pending 的留待下次 batch）
        const d = importResult.data || {};
        const skipped = d.skipped_count || 0;
        const range = d.catalog_number_range || {};
        const baseMsg = `Batch completed! Migrated ${d.migrated_count != null ? d.migrated_count : ''} record(s)` +
          (range.start != null ? ` (catalog ${range.start} - ${range.end})` : '');
        this.$notify({
          title: skipped > 0 ? 'Completed with skipped records' : 'Success',
          message: skipped > 0
            ? `${baseMsg}. Skipped ${skipped} pending record(s) — not yet verified, they stay in this batch and will be migrated in a future batch-complete.`
            : baseMsg,
          type: skipped > 0 ? 'warning' : 'success',
          duration: skipped > 0 ? 8000 : 5000
        });

        await this.loadBatchData();
      } catch (error) {
        loading.close();
        this.$message.error('Failed to complete batch import: ' + (error.message || 'Unknown error'));
        console.error(error);
      }
    },

    // 格式化日期
    formatDate(date) {
      if (!date) return '';
      return new Date(date).toLocaleDateString();
    },

    // 格式化日期时间
    formatDateTime(datetime) {
      if (!datetime) return '';
      return new Date(datetime).toLocaleString();
    },

    // 检查记录是否有 errors (severity: error)
    hasErrors(record) {
      if (!record.verificationInfo || !record.verificationInfo.warnings) return false;
      return record.verificationInfo.warnings.some(w => w.severity === 'error');
    },

    // 检查记录是否有 warnings (severity: warning)
    hasWarnings(record) {
      if (!record.verificationInfo || !record.verificationInfo.warnings) return false;
      return record.verificationInfo.warnings.some(w => w.severity === 'warning');
    },

    // 检查记录是否只有 warnings (severity: warning, 没有 error) - 用于只显示warning图标
    hasWarningsOnly(record) {
      if (!record.verificationInfo || !record.verificationInfo.warnings) return false;
      const hasAnyErrors = record.verificationInfo.warnings.some(w => w.severity === 'error');
      const hasAnyWarnings = record.verificationInfo.warnings.some(w => w.severity === 'warning');
      return hasAnyWarnings && !hasAnyErrors;
    },

    // 获取 errors 列表
    getErrors(record) {
      if (!record.verificationInfo || !record.verificationInfo.warnings) return [];
      return record.verificationInfo.warnings.filter(w => w.severity === 'error');
    },

    // 获取 warnings 列表
    // 来源(verbatim)科 与 匹配到的 taxon 科 是否不一致（分类问题，显示在 Species Status 列）
    familyMismatch(record) {
      const src = record.verbatimTaxonomic && record.verbatimTaxonomic.verbatimFamily;
      const matched = record.taxonomic && record.taxonomic.Family;
      if (src && matched &&
          String(src).trim().toLowerCase() !== String(matched).trim().toLowerCase()) {
        return { from: src, to: matched };
      }
      return null;
    },
    getWarnings(record) {
      if (!record.verificationInfo || !record.verificationInfo.warnings) return [];
      return record.verificationInfo.warnings.filter(w => w.severity === 'warning');
    },

    // 获取 error 数量
    getErrorCount(record) {
      return this.getErrors(record).length;
    },

    // 获取 warning 数量
    getWarningCount(record) {
      return this.getWarnings(record).length;
    },

    // 导出issues (warnings/errors/all)
    async exportIssues(issueType) {
      try {
        const url = `${process.env.VUE_APP_BASE_API}/api/file-processor/batches/${this.selectedBatchId}/exportIssues?issue_type=${issueType}`;

        // 创建隐藏的下载链接
        const link = document.createElement('a');
        link.href = url;
        link.download = `batch_${this.selectedBatchId}_issues_${issueType}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.$message.success(`Exporting ${issueType} issues...`);
      } catch (error) {
        this.$message.error('Failed to export issues');
        console.error(error);
      }
    },

    // 获取verification统计信息 (调用新API)
    async fetchVerificationSummary() {
      if (!this.selectedBatchId) return;

      try {
        // 使用request模块 (已在文件顶部导入)
        const response = await request({
          url: `/file/batches/${this.selectedBatchId}/verificationSummary`,
          method: 'get'
        });

        console.log('Verification summary response:', response);

        if (response.code === 20000) {
          const data = response.data;
          const stats = data.statistics;

          console.log('Raw statistics from API:', stats);

          // 更新所有统计数据
          this.progressStats = {
            total: data.total_records,
            speciesVerified: stats.species_verified?.count || 0,
            localityVerified: stats.locality_verified?.count || 0,
            recordVerified: stats.record_verified?.count || 0,
            fullyCompleted: stats.fully_verified?.count || 0,
            cataloged: stats.cataloged?.count || 0,
            remaining: stats.cataloged?.remaining != null ? stats.cataloged.remaining : 0,
            speciesPercentage: stats.species_verified?.percentage || 0,
            localityPercentage: stats.locality_verified?.percentage || 0,
            recordPercentage: stats.record_verified?.percentage || 0,
            completionPercentage: stats.fully_verified?.percentage || 0,
            hasErrors: stats.has_errors?.count || 0,
            hasWarnings: stats.has_warnings?.count || 0,
            hasPending: stats.has_pending?.count || 0,
            pendingTaxonomic: stats.pending_taxonomic?.count || 0,
            pendingLocality: stats.pending_locality?.count || 0,
            pendingRecord: stats.pending_record?.count || 0,
            needsReview: 0  // 保留字段
          };

          console.log('Updated progressStats:', this.progressStats);
          console.log('Filter button values:', {
            hasErrors: this.progressStats.hasErrors,
            hasWarnings: this.progressStats.hasWarnings,
            pendingTaxonomic: this.progressStats.pendingTaxonomic,
            pendingLocality: this.progressStats.pendingLocality,
            pendingRecord: this.progressStats.pendingRecord
          });
        }
      } catch (error) {
        console.error('Failed to fetch verification summary:', error);
      }
    },

    // 重新验证批次记录
    async revalidateBatch() {
      if (!this.selectedBatchId) return;

      this.$confirm('This will re-run validation for all records in this batch. Continue?', 'Re-validate Batch', {
        confirmButtonText: 'Yes',
        cancelButtonText: 'Cancel',
        type: 'info'
      }).then(async () => {
        const loading = this.$loading({
          lock: true,
          text: 'Re-validating records...',
          spinner: 'el-icon-loading',
          background: 'rgba(0, 0, 0, 0.7)'
        });

        try {
          const response = await request({
            url: `/file/batches/${this.selectedBatchId}/revalidate`,
            method: 'post'
          });

          loading.close();

          if (response.code === 20000) {
            this.$message.success(`Re-validated ${response.data.records_validated} records`);
            // 刷新数据
            await this.loadBatchData();
          } else {
            this.$message.error('Failed to re-validate: ' + response.message);
          }
        } catch (error) {
          loading.close();
          this.$message.error('Failed to re-validate batch');
          console.error(error);
        }
      }).catch(() => {
        // 用户取消
      });
    }
  }
};
</script>

<style scoped>
.verbatim-workspace {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.batch-selector-card {
  margin-bottom: 20px;
}

.batch-selector {
  padding: 10px 0;
}

.batch-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.batch-info-item {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #666;
  font-size: 14px;
}

.progress-overview-card {
  margin-bottom: 20px;
}

.progress-item {
  text-align: center;
  padding: 20px;
  border-radius: 8px;
  background: #f8f9fa;
}

.progress-number {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 5px;
}

.progress-number.species {
  color: #67C23A;
}

.progress-number.locality {
  color: #409EFF;
}

.progress-number.record {
  color: #E6A23C;
}

.progress-number.complete {
  color: #F56C6C;
}

.progress-label {
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
}

.progress-bar {
  margin-top: 10px;
}

.records-card {
  background: white;
}

.table-toolbar {
  margin-bottom: 20px;
  padding: 15px;
}

.field-filters-row {
  margin-top: 12px;
}

.status-column {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.suggestion-info {
  margin-top: 4px;
}

.fix-menu-cell {
  margin-top: 4px;
}

.verification-info {
  margin-top: 4px;
}

.verification-icon {
  color: #67C23A;
  font-size: 12px;
}

.verbatim-text {
  font-style: italic;
  color: #666;
}

.matched-text {
  font-weight: 500;
  color: #333;
}

.match-level-tag {
  margin-left: 6px;
  vertical-align: middle;
}

.suggested-text-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.suggested-species-name {
  color: #E6A23C;
  font-style: italic;
  font-weight: 500;
}

.suggested-text {
  color: #E6A23C;
  font-style: italic;
}

.text-gray-400 {
  color: #9CA3AF;
}

.text-xs {
  font-size: 12px;
}

.text-gray-500 {
  color: #6B7280;
}

.pagination-wrapper {
  margin-top: 20px;
  text-align: center;
}

.batch-confirm-content {
  padding: 20px 0;
}

.warning-text {
  margin-top: 15px;
  padding: 10px;
  background: #fdf6ec;
  border: 1px solid #fbbf24;
  border-radius: 4px;
  color: #92400e;
  font-size: 14px;
}

.warning-text i {
  margin-right: 8px;
}

.catalog-number {
  font-weight: 500;
  color: #1f2937;
}

.temp-catalog-number {
  color: #e6a23c;
  font-style: italic;
  font-weight: 500;
}

.normal-catalog-number {
  color: #1f2937;
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .verbatim-workspace {
    max-width: 100%;
    padding: 10px;
  }

  .progress-item {
    padding: 15px 10px;
  }

  .progress-number {
    font-size: 1.5rem;
  }
}

@media (max-width: 768px) {
  .batch-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .table-toolbar .el-row {
    flex-direction: column;
  }

  .table-toolbar .el-col {
    width: 100% !important;
    margin-bottom: 10px;
  }
}

/* Warning icon styling - 简洁的图标显示 */
.warning-icon {
  display: inline-block;
  margin-left: 6px;
  font-size: 14px;
  vertical-align: middle;
  cursor: pointer;
}

.catalog-number {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
</style>
