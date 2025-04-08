<template>
  <div class="specimen-catalog">
    <!-- Search Controls -->
    <div class="search-container">
      <el-form ref="form" :model="searchForm" label-width="120px" class="search-form">
        <div class="search-form-row">
          <el-input
            v-model="searchForm.lowCatalogNumber"
            class="catalog-search"
            placeholder="Catalog numbers (use comma to separate)"
            prefix-icon="el-icon-search"
          />

          <el-select
            v-model="searchForm.taxonId"
            filterable
            remote
            clearable
            class="scientific-name-search"
            placeholder="Search scientific name"
            :remote-method="(query) => remoteMethod(query,'taxon')"
            :loading="remoteLoading"
            no-match-text="No matches found"
          >
            <el-option
              v-for="(item,index) in taxonOptions"
              :key="'taxonOption' + index"
              :label="item.TaxonName"
              :value="item.TaxonID"
            />
          </el-select>

          <el-select
            v-model="searchForm.familyID"
            filterable
            remote
            clearable
            class="family-search"
            placeholder="Search family name"
            :remote-method="(query) => remoteMethod(query,'family')"
            :loading="remoteLoading"
            no-match-text="No matches found"
          >
            <el-option
              v-for="(item,index) in familyOptions"
              :key="'familyOption' + index"
              :label="item.FamilyName"
              :value="item.FamilyID"
            />
          </el-select>

          <el-button type="primary" icon="el-icon-search" class="search-button" @click="onSubmit">
            Search
          </el-button>
        </div>

        <!-- Advanced Search Panel -->
        <el-collapse class="advanced-search-panel">
          <el-collapse-item title="Advanced Search" name="1">
            <div class="advanced-search-content">
              <div class="advanced-search-section">
                <h3>Lot Information</h3>
                <div class="advanced-search-grid">
                  <el-form-item label="Jar Size">
                    <el-select v-model="searchForm.jarSize" placeholder="Select jar size" class="full-width">
                      <el-option
                        v-for="(item,index) in jarSizeTypeOptions"
                        :key="'jarsizeoption' + index"
                        :label="item.JarSize"
                        :value="item.JarSize"
                      />
                    </el-select>
                  </el-form-item>

                  <el-form-item label="Inventory">
                    <el-input v-model="searchForm.inventory" class="full-width" />
                  </el-form-item>

                  <el-form-item label="Storage">
                    <el-input v-model="searchForm.storage" class="full-width" />
                  </el-form-item>

                  <el-form-item label="Total Number">
                    <div class="range-input">
                      <el-input v-model.number="searchForm.minTotalNumber" type="number" placeholder="Min" />
                      <span class="range-separator">-</span>
                      <el-input v-model.number="searchForm.maxTotalNumber" type="number" placeholder="Max" />
                    </div>
                  </el-form-item>

                  <el-form-item label="Lots Per Species">
                    <div class="range-input">
                      <el-input v-model.number="searchForm.minLotsNumber" type="number" placeholder="Min" />
                      <span class="range-separator">-</span>
                      <el-input v-model.number="searchForm.maxLotsNumber" type="number" placeholder="Max" />
                    </div>
                  </el-form-item>

                  <el-form-item label="Date Range">
                    <div class="date-range-picker">
                      <el-date-picker
                        v-model="searchForm.startDate"
                        type="date"
                        placeholder="Start date"
                        class="date-picker"
                      />
                      <span class="range-separator">-</span>
                      <el-date-picker
                        v-model="searchForm.endDate"
                        type="date"
                        placeholder="End date"
                        class="date-picker"
                      />
                    </div>
                  </el-form-item>
                </div>
              </div>

              <div class="advanced-search-section">
                <h3>Locality Information</h3>
                <div class="advanced-search-grid">
                  <el-form-item label="Field No">
                    <el-input v-model="searchForm.fieldNo" placeholder="Field number" class="full-width" />
                  </el-form-item>

                  <el-form-item label="Locality">
                    <el-select
                      v-model="searchForm.localityId"
                      placeholder="Select locality"
                      filterable
                      clearable
                      remote
                      class="full-width"
                      :remote-method="(query) => remoteMethod(query,'locality')"
                      :loading="remoteLoading"
                      no-match-text="No matches found"
                    >
                      <el-option
                        v-for="(item,index) in localityList"
                        :key="'local'+ index"
                        :label="item.localityString"
                        :value="item.localityID"
                      />
                    </el-select>
                  </el-form-item>
                </div>
              </div>
            </div>
          </el-collapse-item>
        </el-collapse>
      </el-form>
    </div>

    <!-- Results Container -->
    <div class="results-container">
      <div class="results-header">
        <h2 class="section-title">Specimen Records</h2>

        <!-- Action Toolbar (moved to top left) -->
        <div class="action-toolbar">
<!--          <el-tooltip content="Add New" placement="top">-->
<!--            <el-button type="primary" class="action-icon-btn" @click="handleCreate">-->
<!--              <i class="el-icon-plus" />-->
<!--            </el-button>-->
<!--          </el-tooltip>-->

          <el-dropdown trigger="click" @command="handleExport">
            <el-tooltip content="Export" placement="top">
              <el-button type="info" class="action-icon-btn">
                <i class="el-icon-download" />
              </el-button>
            </el-tooltip>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item command="Full" :disabled="downloadLoading">
                <i class="el-icon-document" /> All Results
              </el-dropdown-item>
              <el-dropdown-item command="Filtered" :disabled="downloadLoading || !isFiltering">
                <i class="el-icon-document-checked" /> Filtered Results
              </el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>

          <el-dropdown trigger="click" @command="handlePrint">
            <el-tooltip content="Print" placement="top">
              <el-button type="success" class="action-icon-btn">
                <i class="el-icon-printer" />
              </el-button>
            </el-tooltip>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item command="Full">
                <i class="el-icon-collection-tag" /> All Results
              </el-dropdown-item>
              <el-dropdown-item command="Filtered" :disabled="!isFiltering">
                <i class="el-icon-collection-tag" /> Filtered Results
              </el-dropdown-item>
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
        fit
        highlight-current-row
        class="specimen-table"
        show-overflow-tooltip="true"
        :row-class-name="tableRowClassName"
        @sort-change="sortChange"
        @filter-change="handleFilterChange"
      >
        <el-table-column
          :key="'CatalogNumber' + changeKey"
          fixed="left"
          label="Catalog #"
          align="center"
          min-width="180"
          :filters="filterOptions['CatalogNumber']"
          :filter-method="genericFilterHandler('CatalogNumber')"
        >
          <template slot-scope="{row}">
            <div class="catalog-number-container">
              <span class="catalog-number">{{ row.CatalogNumber }}</span>
              <div class="row-actions">
                <el-button type="text" class="action-icon edit-icon" @click="handleUpdate(row)">
                  <i class="el-icon-edit" />
                </el-button>

                <el-button type="text" class="action-icon print-icon" @click.native="printSingleLabel(row)">
                  <i class="el-icon-printer" />
                </el-button>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column
          :key="'ScientificName' + changeKey"
          label="Scientific Name"
          min-width="220"
          :filters="filterOptions['FullScientificName']"
          :filter-method="genericFilterHandler('FullScientificName')"
        >
          <template slot-scope="{row}">
            <span class="scientific-name link-type" @click="handleUpdate(row)">
              {{ row.FullScientificName }}
            </span>
          </template>
        </el-table-column>

        <el-table-column
          :key="'StartDate' + changeKey"
          label="Collection Date"
          align="center"
          min-width="135"
          :filters="filterOptions['StartDate']"
          :filter-method="genericFilterHandler('StartDate')"
        >
          <template slot-scope="{row}">
            <span>{{ row.StartDate | parseTime('{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>

        <el-table-column
          :key="'TotalNumber' + changeKey"
          label="Count"
          width="100"
          :filters="filterOptions['TotalNumber']"
          :filter-method="genericFilterHandler('TotalNumber')"
        >
          <template slot-scope="{row}">
            <!--            <el-tag size="medium" type="info">{{ row.TotalNumber }}</el-tag>-->
            <span>{{ row.TotalNumber }}</span>
          </template>
        </el-table-column>

        <el-table-column
          :key="'lotsnumber' + changeKey"
          label="Lots/Species"
          width="120"
          :filters="filterOptions['lotsnumber']"
          :filter-method="genericFilterHandler('lotsnumber')"
        >
          <template slot-scope="{row}">
            <span>{{ row.lotsnumber }}</span>
          </template>
        </el-table-column>

        <el-table-column
          :key="'PreparationType' + changeKey"
          label="Preparation"
          width="120"
          :filters="filterOptions['PreparationType']"
          :filter-method="genericFilterHandler('PreparationType')"
        >
          <template slot-scope="{row}">
            <span>{{ row.PreparationType }}</span>
          </template>
        </el-table-column>

        <el-table-column
          :key="'Count' + changeKey"
          label="Prep Count"
          width="120"
          :filters="filterOptions['Count']"
          :filter-method="genericFilterHandler('Count')"
        >
          <template slot-scope="{row}">
            <span>{{ row.Count }}</span>
          </template>
        </el-table-column>

        <el-table-column
          :key="'Storage' + changeKey"
          label="Storage"
          width="120"
          :filters="filterOptions['Storage']"
          :filter-method="genericFilterHandler('Storage')"
        >
          <template slot-scope="{row}">
            <span>{{ row.Storage }}</span>
          </template>
        </el-table-column>

        <el-table-column
          :key="'JarSize' + changeKey"
          label="Jar Size"
          width="100"
          :filters="filterOptions['JarSize']"
          :filter-method="genericFilterHandler('JarSize')"
        >
          <template slot-scope="{row}">
            <span v-if="row.JarSize && row.JarSize.trim() !== ''">
              <el-tag size="small" :type="row.JarSize | statusFilter">
                {{ row.JarSize }}
              </el-tag>
            </span>
            <span v-else style="color: #ccc;text-align: center">-</span>
          </template>
        </el-table-column>

        <el-table-column
          :key="'FieldNo' + changeKey"
          label="Field No."
          width="120"
          :filters="filterOptions['FieldNo']"
          :filter-method="genericFilterHandler('FieldNo')"
        >
          <template slot-scope="{row}">
            <span>{{ row.FieldNo }}</span>
          </template>
        </el-table-column>

        <el-table-column
          :key="'LocalityString' + changeKey"
          label="Locality"
          min-width="300"
          :filters="filterOptions['LocalityString']"
          :filter-method="genericFilterHandler('LocalityString')"
          show-overflow-tooltip
        >
          <template slot-scope="{row}">
            <span class="locality-string">{{ row.LocalityString }}</span>
          </template>
        </el-table-column>

        <el-table-column
          :key="'Inventory' + changeKey"
          label="Inventory"
          width="110"
          :filters="filterOptions['Inventory']"
          :filter-method="genericFilterHandler('Inventory')"
        >
          <template slot-scope="{row}">
            <!--            <el-tag size="small" :type="row.Inventory | statusFilter">-->
            <span>{{ row.Inventory }}</span>
            <!--            </el-tag>-->
          </template>
        </el-table-column>

        <el-table-column
          :key="'Drainage' + changeKey"
          label="Drainage"
          min-width="120"
          :filters="filterOptions['Drainage']"
          :filter-method="genericFilterHandler('Drainage')"
        >
          <template slot-scope="{row}">
            <span>{{ row.Drainage }}</span>
          </template>
        </el-table-column>

        <el-table-column
          :key="'Continent' + changeKey"
          label="Continent"
          width="120"
          :filters="filterOptions['Continent']"
          :filter-method="genericFilterHandler('Continent')"
        >
          <template slot-scope="{row}">
            <span>{{ row.Continent }}</span>
          </template>
        </el-table-column>

        <el-table-column
          :key="'County' + changeKey"
          label="County"
          min-width="120"
          :filters="filterOptions['County']"
          :filter-method="genericFilterHandler('County')"
        >
          <template slot-scope="{row}">
            <span>{{ row.County }}</span>
          </template>
        </el-table-column>

        <el-table-column
          :key="'State' + changeKey"
          label="State"
          min-width="120"
          :filters="filterOptions['State']"
          :filter-method="genericFilterHandler('State')"
        >
          <template slot-scope="{row}">
            <span>{{ row.State }}</span>
          </template>
        </el-table-column>

        <el-table-column
          :key="'Coordinates' + changeKey"
          label="Long/Lat"
          min-width="160"
        >
          <template slot-scope="{row}">
            <span v-if="row.Lon && row.Lat">
              {{ row.Lon }}, {{ row.Lat }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <pagination
        v-show="total>0"
        :total="total"
        :page.sync="listQuery.page"
        :limit.sync="listQuery.limit"
        class="pagination-container"
        @pagination="getLots"
      />
    </div>

    <!-- Print Dialog -->
    <el-dialog id="partial-label-print-dialog" :visible.sync="printDiablogVisible" title="Print Labels" custom-class="print-dialog">
      <el-button v-print="'#printPartials'" class="print-button">Print me</el-button>
      <div id="printPartials" class="print-container">
        <div v-for="(item,index) in this.catalogList" :key="'catalog' + index" class="print-label">
          <div class="print-header">TULANE UNIVERSITY COLLECTIONS</div>

          <div class="print-grid">
            <div class="print-row">
              <div class="print-col left-col">
                <div class="field">
                  <span class="field-label">Family Name</span>
                  <span class="field-underline">{{ (item.FamilyName !== '' && item.FamilyName !== null ? item.FamilyName : '') }}{{ (item.FamilyNumber !== '' && item.FamilyNumber !== null ? '(' + item.FamilyNumber + ')' : '') }}</span>
                </div>
              </div>
              <div class="print-col right-col">
                <div class="field">
                  <span class="field-label">Cat. No</span>
                  <span class="field-underline">{{ item.CatalogNumber }}</span>
                </div>
              </div>
            </div>

            <div class="print-row">
              <div class="print-col full-col">
                <div class="field">
                  <span class="field-label">Species</span>
                  <span class="field-underline">{{ item.FullScientificName }}</span>
                </div>
              </div>
            </div>

            <div class="print-row">
              <div class="print-col left-col">
                <div class="field">
                  <span class="field-label">Dr.</span>
                  <span class="field-underline">{{ item.Drainage }}</span>
                </div>
              </div>
              <div class="print-col right-col">
                <div class="field">
                  <span class="field-label">No. of Specimens</span>
                  <span class="field-underline">{{ item.TotalNumber }}</span>
                </div>
              </div>
            </div>

            <div class="print-row">
              <div class="print-col left-col">
                <div class="field">
                  <span class="field-label">Preparation</span>
                  <span class="field-underline">{{ item.PreparationType }}</span>
                </div>
              </div>
              <div class="print-col right-col">
                <div class="field">
                  <span class="field-label">Preparation Numbers</span>
                  <span class="field-underline">{{ item.Count }}</span>
                </div>
              </div>
            </div>

            <div v-if="item.PreparationType === 'C&S' || item.PreparationType === 'Skel'" class="print-row">
              <div class="print-col full-col">
                <div class="field">
                  <span class="field-label">Osteology Catalog No.</span>
                  <span class="field-underline">{{ item.osteologyCatalogNumber }}</span>
                </div>
              </div>
            </div>

            <div class="print-row">
              <div class="print-col left-col">
                <div class="field">
                  <span class="field-label">State</span>
                  <span class="field-underline">{{ item.State }}</span>
                </div>
              </div>
              <div class="print-col right-col">
                <div class="field">
                  <span class="field-label">County</span>
                  <span class="field-underline">{{ item.County }}</span>
                </div>
              </div>
            </div>

            <div class="print-row">
              <div class="print-col full-col">
                <div class="field">
                  <span class="field-label">Locality</span>
                  <span class="field-underline locality-field">{{ item.LocalityString }}</span>
                </div>
              </div>
            </div>

            <div class="print-row">
              <div class="print-col left-col">
                <div class="field">
                  <span class="field-label">Col. Date</span>
                  <span class="field-underline">{{ item.StartDate | parseTime('{y}-{m}-{d}') }}</span>
                </div>
              </div>
              <div class="print-col right-col">
                <div class="field">
                  <span class="field-label">Col. No.</span>
                  <span class="field-underline">{{ item.FieldNo }}</span>
                </div>
              </div>
            </div>

            <div class="print-row">
              <div class="print-col full-col">
                <div class="field">
                  <span class="field-label">Col. by</span>
                  <span class="field-underline">{{ item.VerbatimCollectors }}</span>
                </div>
              </div>
            </div>
          </div>

          <div style="page-break-after: always;" />
        </div>
      </div>
    </el-dialog>

    <!-- Edit Dialog -->
    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible" width="90%" class="edit-dialog">
      <el-form ref="dataForm" :model="newLotData" label-width="130px" class="edit-form">
        <div class="form-grid">
          <el-form-item label="Catalog Number">
            <el-input v-model="newLotData.catalogNumber" />
          </el-form-item>

          <el-form-item label="Prev Number">
            <el-input v-model="newLotData.prevNumber" />
          </el-form-item>

          <el-form-item label="Date Cataloged">
            <el-date-picker v-model="newLotData.dateCataloged" type="date" placeholder="Pick a date" style="width: 100%;" />
          </el-form-item>

          <el-form-item label="Jar Size">
            <el-select v-model="newLotData.jarSize" class="filter-item" placeholder="Please select" style="width: 100%;">
              <el-option
                v-for="(item,index) in jarSizeTypeOptions"
                :key="'jarSize'+ index"
                :label="item.display_name"
                :value="item.key"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="Cataloger">
            <el-select v-model="newLotData.cataloger" placeholder="Select cataloger" style="width: 100%;">
              <el-option label="Mike" value="Mike" />
              <el-option label="Jack" value="Jack" />
            </el-select>
          </el-form-item>

          <el-form-item label="Storage">
            <el-input v-model="newLotData.storage" />
          </el-form-item>
        </div>

        <el-divider content-position="left">Determination</el-divider>

        <el-form-item label="Determination">
          <div class="table-actions">
            <el-button type="success" size="small" icon="el-icon-plus">Add Determination</el-button>
          </div>

          <el-table
            ref="multipleTable"
            :data="newLotData.zDetermination"
            tooltip-effect="dark"
            style="width: 100%"
            border
            class="inner-table"
          >
            <el-table-column
              prop="isCurrent"
              type="selection"
              width="55"
            />

            <el-table-column
              v-if="false"
              prop="taxonId"
              label="Taxon Id"
            />

            <el-table-column
              prop="scientificName"
              label="Scientific Name"
              min-width="220"
            >
              <template slot-scope="{row}">
                <el-autocomplete
                  v-model="row.inputValue"
                  :fetch-suggestions="querySearch"
                  :trigger-on-focus="false"
                  class="inline-input"
                  placeholder="Scientific name"
                  @input="change($event)"
                  @select="handleSelect"
                  @keyup.enter.native="handleSelect"
                />
              </template>
            </el-table-column>

            <el-table-column
              prop="determiner"
              label="Determiner"
              min-width="180"
            >
              <template slot-scope="{row}">
                <el-autocomplete
                  v-model="row.determinerInputValue"
                  :fetch-suggestions="collectorsQuerySearch"
                  :trigger-on-focus="false"
                  class="inline-input"
                  placeholder="Determiner name"
                  @input="change($event)"
                  @select="collectorsHandleSelect"
                  @keyup.enter.native="collectorsHandleSelect"
                />
              </template>
            </el-table-column>

            <el-table-column
              prop="date"
              label="Date"
              width="180"
            >
              <template slot-scope="{row}">
                <el-date-picker
                  v-model="row.date"
                  style="width: 100%"
                  type="date"
                  placeholder="Pick a date"
                />
              </template>
            </el-table-column>

            <el-table-column
              prop="remarks"
              label="Remarks"
              min-width="180"
            >
              <template slot-scope="{row}">
                <el-input v-model="row.remarks" placeholder="Remarks" />
              </template>
            </el-table-column>

            <el-table-column
              label="Actions"
              width="120"
              align="center"
            >
              <template slot-scope="{row}">
                <el-button
                  size="mini"
                  type="primary"
                  icon="el-icon-edit"
                  circle
                />
                <el-button
                  size="mini"
                  type="danger"
                  icon="el-icon-delete"
                  circle
                />
              </template>
            </el-table-column>
          </el-table>
        </el-form-item>

        <el-divider content-position="left">Additional Information</el-divider>

        <el-form-item label="Type Status">
          <el-input v-model="newLotData.typeStatus" />
        </el-form-item>

        <el-form-item label="Preparation">
          <div class="table-actions">
            <el-button type="success" size="small" icon="el-icon-plus">Add Preparation</el-button>
          </div>

          <el-table
            :data="newLotData.preparation"
            border
            style="width: 100%"
            class="inner-table"
          >
            <el-table-column
              prop="preparation"
              label="Preparation Type"
              min-width="180"
            />

            <el-table-column
              prop="count"
              label="Count"
              min-width="120"
            />

            <el-table-column
              label="Actions"
              width="120"
              align="center"
            >
              <template slot-scope="{row}">
                <el-button
                  size="mini"
                  type="primary"
                  icon="el-icon-edit"
                  circle
                />
                <el-button
                  size="mini"
                  type="danger"
                  icon="el-icon-delete"
                  circle
                />
              </template>
            </el-table-column>
          </el-table>
        </el-form-item>

        <el-form-item label="Inventory">
          <el-input v-model="newLotData.inventory" />
        </el-form-item>

        <el-form-item label="Remarks">
          <el-input v-model="newLotData.remarks" type="textarea" :rows="3" />
        </el-form-item>

        <el-form-item label="Locality">
          <el-input v-model="newLotData.locality" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>

      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">
          Cancel
        </el-button>
        <el-button type="primary" @click="dialogStatus==='create'?createData():updateData()">
          Save
        </el-button>
      </div>
    </el-dialog>

    <!-- Edit Lot Dialog -->
    <el-dialog
      :visible.sync="editLotDialogFormVisible"
      title="Edit Specimen"
      width="90%"
      class="edit-lot-dialog"
    >
      <LotComplexTable
        :key="'lotComplexTable' + componentKey"
        :curr-catalog-no="currCatalogNo"
        :curr-primary-i-d="currPrimaryID"
      />
    </el-dialog>
  </div>
</template>
<script>

// Import dependencies
import print from 'vue-print-nb'
import LotComplexTable from '../../lotform/updateLot'
import {
  getJarSizes,
  newLot,
  getTaxon,
  getFamily,
  getLocality,
  getLotsAdvanced
} from '@/api/table'
import waves from '@/directive/waves' // waves directive
import { parseTime } from '@/utils'
import Pagination from '@/components/Pagination'
import * as printJS from 'print-js'
import _ from 'lodash'

// Jar Size Options
const jarSizeTypeOptions = [
  { key: '0.5L', display_name: '0.5L' },
  { key: '0.75L', display_name: '0.75L' },
  { key: '1.0L', display_name: '1.0L' },
  { key: '1.5L', display_name: '1.5L' },
  { key: '1L', display_name: '1L' },
  { key: '2L', display_name: '2L' },
  { key: '3L', display_name: '3L' },
  { key: '1oz', display_name: '1oz' },
  { key: '2oz', display_name: '2oz' },
  { key: '4oz', display_name: '4oz' },
  { key: '8oz', display_name: '8oz' },
  { key: '12oz', display_name: '12oz' },
  { key: '16oz', display_name: '16oz' },
  { key: '32oz', display_name: '32oz' },
  { key: '64oz', display_name: '64oz' },
  { key: '1gal', display_name: '1 gal' },
  { key: '2 gal Jug', display_name: '2 gal Jug' },
  { key: '3 gal Jug', display_name: '3 gal Jug' },
  { key: '5 gal Jug', display_name: '5 gal Jug' },
  { key: 'Unknown', display_name: 'Unknown' },
  { key: 'Multiple Jars &lt;see remarks&gt;', display_name: 'Multiple Jars (see remarks)' },
  { key: 'vial', display_name: 'vial' },
  { key: 'Steel Tank', display_name: 'Steel Tank' },
  { key: 'Titan Bin', display_name: 'Titan Bin' },
  { key: null, display_name: 'Unknown' }
]

// Calendar Type Options
const calendarTypeOptions = [
  { key: 'CN', display_name: 'China' },
  { key: 'US', display_name: 'USA' },
  { key: 'JP', display_name: 'Japan' },
  { key: 'EU', display_name: 'Eurozone' }
]

// Transform arrays to key-value objects for easier lookup
const jarSizeTypeKeyValue = jarSizeTypeOptions.reduce((acc, cur) => {
  acc[cur.key] = cur.display_name
  return acc
}, {})

const calendarTypeKeyValue = calendarTypeOptions.reduce((acc, cur) => {
  acc[cur.key] = cur.display_name
  return acc
}, {})

export default {
  name: 'SpecimenCatalog',
  components: { Pagination, LotComplexTable },
  directives: { waves, print },

  filters: {
    statusFilter(status) {
      if (!status || status.trim() === '') return 'default'

      const lower = status.toLowerCase()

      if (lower.includes('unknown')) return 'default'
      if (lower.includes('vial')) return 'info'
      if (lower.includes('steel') || lower.includes('titan')) return 'danger'
      if (lower.includes('multiple')) return 'warning'
      if (/gal/.test(lower)) return 'success'
      if (/l\b/.test(lower)) return 'primary'
      if (/oz/.test(lower)) return 'info'

      return 'default'
    },
    typeFilter(type) {
      return calendarTypeKeyValue[type]
    },
    jarSizeFilter(type) {
      return jarSizeTypeKeyValue[type]
    },
    parseTime(time, cFormat) {
      if (time === undefined || time === null) { return '' }
      const date = new Date(Date.parse(time))
      return parseTime(date, cFormat)
    }
  },

  data() {
    return {
      componentKey: 0,
      searchForm: {
        fieldNo: '',
        familyID: '',
        taxonId: '',
        localityId: '',
        lowCatalogNumber: '',
        startDate: '',
        endDate: '',
        maxTotalNumber: '',
        minTotalNumber: '',
        jarSize: '',
        inventory: '',
        storage: '',
        maxLotsNumber: '',
        minLotsNumber: ''
      },
      allLocalityList: [],
      allTaxonOptions: [],
      allFamilyOptions: [],
      editLotDialogFormVisible: false,
      currCatalogNo: '',
      currPrimaryID: '',
      remoteLoading: false,
      keyWord: '',
      localityList: [],
      taxonOptions: [],
      familyOptions: [],
      printDiablogVisible: false,
      printLoading: true,
      printObj: {
        id: 'printPartials'
      },
      newLotData: {
        catalogNumber: '',
        prevNumber: '',
        dateCataloged: '',
        jarSize: '',
        cataloger: '',
        storage: '',
        totalNumber: '',
        taxons: [],
        taxonsForQuery: [],
        zDeterminations: [],
        zDeterminationsForQuery: [],
        collectors: [],
        collectorsForQuery: [],
        zDetermination: [{
          isCurrent: true,
          taxonId: '203',
          scientificName: '',
          determiner: 'John',
          date: '1999-01-01',
          remarks: '',
          inputValue: '',
          determinerInputValue: ''
        }],
        preparations: [],
        preparationsForQuery: [],
        preparation: [{
          preparation: 'Type1',
          count: '5',
          prepareinputValue: ''
        }],
        typeStatus: '',
        inventory: '',
        remarks: '',
        locality: ''
      },
      tableKey: 0,
      list: null,
      filterOptions: {},
      changeKey: true,
      isFiltering: false,
      catalogList: [{
        MainPrimaryID: '',
        CatalogNumber: '',
        PrimaryString: '',
        Quantity: 0,
        QuantityReturned: 0,
        QuantityResolved: 0,
        DescriptionOfMaterial: '',
        InComments: '',
        OutComments: '',
        Remarks: '',
        FieldNo: '',
        FullScientificName: '',
        ScientificName: '',
        LocalityString: '',
        Continent: '',
        State: '',
        County: '',
        Drainage: '',
        StartDate: '',
        Lon: '',
        Lat: '',
        VerbatimCollectors: '',
        TotalNumber: 0,
        lotsnumber: 0,
        FamilyName: '',
        FamilyNumber: '',
        PreparationType: '',
        Count: 'Unknown',
        osteologyCatalogNumber: ''
      }],
      total: 0,
      listLoading: false,
      listQuery: {
        page: 1,
        limit: 20,
        importance: undefined,
        title: undefined,
        type: undefined,
        sort: '+id'
      },
      importanceOptions: [1, 2, 3],
      calendarTypeOptions,
      jarSizeTypeOptions: [],
      sortOptions: [
        { label: 'ID Ascending', key: '+id' },
        { label: 'ID Descending', key: '-id' }
      ],
      statusOptions: ['published', 'draft', 'deleted', '4oz', 'U', 'F', '16oz'],
      showReviewer: true,
      temp: {
        id: undefined,
        importance: 1,
        remark: '',
        timestamp: new Date(),
        title: '',
        type: '',
        status: 'published'
      },
      dialogFormVisible: false,
      dialogStatus: '',
      textMap: {
        update: 'Edit Specimen',
        create: 'Add New Specimen'
      },
      dialogPvVisible: false,
      pvData: [],
      rules: {
        type: [{ required: true, message: 'Type is required', trigger: 'change' }],
        timestamp: [{ type: 'date', required: true, message: 'Date is required', trigger: 'change' }],
        title: [{ required: true, message: 'Title is required', trigger: 'blur' }]
      },
      downloadLoading: false
    }
  },

  computed: {
    queryParams() {
      return {
        pageSize: 1,
        pageNumber: 1,
        keyWord: this.keyWord
      }
    }
  },

  created() {
    // Initialize data
    this.getLots()
    this.getJarSizes()
  },

  mounted() {
    this.initMobileDropdowns()
    window.addEventListener('resize', this.initMobileDropdowns)
  },

  beforeDestroy() {
    window.removeEventListener('resize', this.initMobileDropdowns)
  },

  methods: {
    // Force rerender lot form component
    forceRerender() {
      this.componentKey += 1
    },

    // Handle form submission
    onSubmit() {
      this.getLots()
      this.$message({
        message: 'Search submitted successfully!',
        type: 'success'
      })
    },

    // Handle export from dropdown
    handleExport(command) {
      this.handleDownload(command)
    },

    // Handle print from dropdown
    handlePrint(command) {
      this.printPartialLabels(command)
    },

    // Print labels
    printPartialLabels(type) {
      if (type === 'Full') {
        // Print all data matching current search conditions
        this.$message({
          message: 'Preparing to print all data, please wait...',
          type: 'info'
        })
        this.catalogList = this.list
      } else if (type === "Filtered") {
        // Check if the table reference exists first
        if (!this.$refs.table) {
          this.$message.error('Table reference not found')
          return
        }

        // Get filtered data from the Element UI table component
        const filteredData = this.$refs.table.tableData

        if (!filteredData || filteredData.length === 0) {
          this.$message.warning('No filtered data to print')
          return
        }

        this.$message({
          message: 'Preparing to print filtered data, please wait...',
          type: 'info'
        })

        // Set filtered data for printing
        this.catalogList = filteredData
      }

      this.$set(this.printObj, "id", "printPartials")
      this.printDiablogVisible = true

      // Add a short delay to ensure data is loaded
      setTimeout(() => {
        this.$nextTick(() => {
          // Ready for printing
          console.log('Print dialog opened, data loaded:', this.catalogList.length, 'items')
        })
      }, 300)
    },

    // Get locality list from API
    async getLocalityList(params) {
      try {
        const response = await getLocality(params)
        this.localityList = []
        response.data.items.forEach((item) => {
          this.localityList.push({
            localityID: item.Locality1ID,
            localityString: item.LocalityString
          })
        })
        this.remoteLoading = false
      } catch (error) {
        console.error('Error fetching locality data:', error)
        this.$message.error('Failed to load locality data')
        this.remoteLoading = false
      }
    },

    // Remote search method
    remoteMethod(searchKey, type) {
      if (searchKey !== '') {
        this.remoteLoading = true
        this.keyWord = searchKey
        this.getRemote(type)
      } else {
        this.taxonOptions = this.allTaxonOptions
        this.localityList = this.allLocalityList
        this.familyOptions = this.allFamilyOptions
      }
    },

    // Debounced remote search function
    getRemote: _.debounce(function(type) {
      if (type === 'taxon') { this.getTaxonList(this.queryParams) } else if (type === 'family') { this.getFamilyList(this.queryParams) } else if (type === 'locality') { this.getLocalityList(this.queryParams) }
    }, 300),

    // Get taxon list from API
    async getTaxonList(params) {
      try {
        const response = await getTaxon(params)
        this.taxonOptions = []
        response.data.items.forEach((item) => {
          this.taxonOptions.push({
            TaxonName: item.FullScientificName,
            TaxonID: item.TaxonID
          })
        })
        this.remoteLoading = false
      } catch (error) {
        console.error('Error fetching taxon data:', error)
        this.$message.error('Failed to load taxon data')
        this.remoteLoading = false
      }
    },

    // Get family list from API
    async getFamilyList(params) {
      try {
        const response = await getFamily(params)
        this.familyOptions = []
        response.data.items.forEach((item) => {
          this.familyOptions.push({
            FamilyName: item.FamilyName,
            FamilyID: item.FamilyID
          })
        })
        this.remoteLoading = false
      } catch (error) {
        console.error('Error fetching family data:', error)
        this.$message.error('Failed to load family data')
        this.remoteLoading = false
      }
    },

    // Fetch lots data from API
    getLots() {
      this.listLoading = true

      this.$message({
        message: `Loading lots records...`,
        type: 'info'
      })

      // Prepare search parameters
      const rawParams = {
        'ids': this.searchForm.lowCatalogNumber,
        'familyID': this.searchForm.familyID,
        'locality': this.searchForm.localityId,
        'taxonId': this.searchForm.taxonId,
        'fieldNo': this.searchForm.fieldNo,
        'jarSize': this.searchForm.jarSize,
        'Storage': this.searchForm.storage,
        'Inventory': this.searchForm.inventory,
        'maxNumber': this.searchForm.maxTotalNumber,
        'minNumber': this.searchForm.minTotalNumber,
        'maxLotsNumber': this.searchForm.maxLotsNumber,
        'minLotsNumber': this.searchForm.minLotsNumber,
        'startDate': this.searchForm.startDate,
        'endDate': this.searchForm.endDate,
        'page': this.listQuery.page,
        'page_size': this.listQuery.limit
      }

      const searchParams = Object.fromEntries(
        Object.entries(rawParams).filter(([_, v]) => v !== '' && v !== null && v !== undefined)
      )

      getLotsAdvanced(searchParams).then(response => {
        this.list = response.data.items
        this.catalogList = response.data.items
        this.total = response.data.total
        this.setupFilters()

        setTimeout(() => {
          this.listLoading = false
        }, 1000)
      }).catch(error => {
        console.error('Error fetching lots data:', error)
        this.$message.error('Failed to load specimen data')
        this.listLoading = false
      })
    },

    // Setup table column filters
    setupFilters() {
      const keys = [
        'CatalogNumber', 'FullScientificName', 'StartDate', 'TotalNumber', 'lotsnumber',
        'PreparationType', 'Count', 'Storage', 'JarSize', 'FieldNo', 'LocalityString', 'Inventory',
        'Drainage', 'Continent', 'County', 'State', 'Lon', 'Lat'
      ]

      keys.forEach(key => {
        const values = this.list.map(item => item[key]).filter(value => value !== null && value !== '' && value !== undefined)

        // Check column type and generate filter options
        if (values.length === 0) {
          // If there are no non-null values, don't set filter options
          this.filterOptions[key] = []
        } else {
          let uniqueValues

          if (typeof values[0] === 'boolean') {
            uniqueValues = [{ text: 'Yes', value: true }, { text: 'No', value: false }]
          } else if (this.isDate(values[0])) {
            uniqueValues = this.processDates(values)
          } else {
            // Get unique values and limit to first 50 to avoid UI performance issues
            uniqueValues = Array.from(new Set(values)).slice(0, 50)
          }

          this.filterOptions[key] = uniqueValues.map(value => ({
            text: value.toString(),
            value
          }))
        }
      })

      // Trigger UI update by toggling changeKey
      this.changeKey = !this.changeKey
    },

    // Generic filter handler
    genericFilterHandler(prop) {
      return (value, row) => {
        const cellValue = row[prop]
        if (cellValue == null) {
          return false
        }
        return cellValue.toString() === value.toString()
      }
    },

    // Check if value is a date
    isDate(value) {
      return value instanceof Date
    },

    // Process dates for filtering
    processDates(values) {
      return Array.from(new Set(values.map(value => value.toISOString().slice(0, 10))))
    },

    // Handle filter changes
    handleFilterChange(filters) {
      this.isFiltering = Object.keys(filters).some(key => filters[key].length > 0)
    },

    // Table row class for styling
    tableRowClassName({ row, rowIndex }) {
      if (row.TypeStatus && row.TypeStatus.toLowerCase().includes('type')) {
        return 'type-specimen-row'
      }
      return ''
    },

    // Force UI update when values change
    change(e) {
      this.$forceUpdate()
    },

    // Handle taxon selection
    handleSelect(item) {
      this.inputValue = item.value
    },

    // Mobile dropdown toggles
    initMobileDropdowns() {
      if (window.innerWidth <= 768) {
        const dropdownGroups = document.querySelectorAll('.dropdown-group')
        dropdownGroups.forEach(group => {
          const btn = group.querySelector('.dropdown-btn')
          if (btn) {
            btn.addEventListener('click', (e) => {
              e.preventDefault()
              e.stopPropagation()

              // Close all other dropdowns
              dropdownGroups.forEach(otherGroup => {
                if (otherGroup !== group) {
                  otherGroup.classList.remove('active')
                }
              })

              // Toggle current dropdown
              group.classList.toggle('active')
            })
          }
        })

        // Close dropdowns when clicking elsewhere
        document.addEventListener('click', () => {
          dropdownGroups.forEach(group => {
            group.classList.remove('active')
          })
        })
      }
    },

    printSingleLabel(row) {
      this.catalogList = [row]
      this.$set(this.printObj, 'id', 'printPartials')
      this.printDiablogVisible = true
    },

    duplicateRecord(row) {
      // Create deep copy to avoid modifying original object
      const newRecord = JSON.parse(JSON.stringify(row))

      // Clear ID and catalog number, system will auto-assign new ones
      newRecord.MainPrimaryID = ''
      newRecord.CatalogNumber = ''

      // Open edit dialog for user to confirm and modify data
      this.temp = newRecord
      this.dialogStatus = 'create'
      this.dialogFormVisible = true

      this.$nextTick(() => {
        if (this.$refs['dataForm']) {
          this.$refs['dataForm'].clearValidate()
        }
      })

      this.$notify({
        title: '提示',
        message: '请确认并保存复制的记录',
        type: 'info',
        duration: 2000
      })
    },

    // Query search for taxon autocomplete
    querySearch(queryString, cb) {
      let results = this.newLotData.taxonsForQuery || []
      results = queryString
        ? results.filter(this.createFilter(queryString))
        : results
      cb(results)
    },

    // Create filter for autocomplete
    createFilter(queryString) {
      return (item) => {
        return item.value.toUpperCase().includes(queryString.toUpperCase())
      }
    },

    // Handle collector selection
    collectorsHandleSelect(item) {
      this.inputValue = item.value
    },

    // Query search for collectors autocomplete
    collectorsQuerySearch(queryString, cb) {
      let results = this.newLotData.collectorsForQuery || []
      results = queryString
        ? results.filter(this.createFilter(queryString))
        : results
      cb(results)
    },

    // Get jar sizes from API
    getJarSizes() {
      this.listLoading = true

      this.$message({
        message: 'Loading jar size data...',
        type: 'info'
      })

      getJarSizes().then(response => {
        this.jarSizeTypeOptions = []
        response.data.items.forEach((item) => {
          this.jarSizeTypeOptions.push({
            JarSizeID: item.JarSizeID,
            JarSize: item.JarSize
          })
        })
        this.listLoading = false
      }).catch(error => {
        console.error('Error fetching jar sizes:', error)
        this.$message.error('Failed to load jar size data')
        this.listLoading = false
      })
    },

    // Handle filter button click
    handleFilter() {
      this.listQuery.page = 1
      this.listQuery.limit = 20
      this.getLots()
    },

    // Handle sort change
    sortChange(data) {
      const { prop, order } = data
      if (prop === 'id') {
        this.sortByID(order)
      }
    },

    // Sort by ID
    sortByID(order) {
      if (order === 'ascending') {
        this.listQuery.sort = '+id'
      } else {
        this.listQuery.sort = '-id'
      }
      this.handleFilter()
    },

    // Reset temp data
    resetTemp() {
      this.temp = {
        id: undefined,
        importance: 1,
        remark: '',
        timestamp: new Date(),
        title: '',
        status: 'published',
        type: ''
      }
    },

    // Reset lot data
    resetLotData() {
      this.newLotData = {
        catalogNumber: '',
        scientificName: '',
        prevNumber: '',
        dateCataloged: '',
        jarSize: '',
        cataloger: '',
        storage: '',
        totalNumber: '',
        zDetermination: [{
          isCurrent: true,
          taxonId: '203',
          determiner: 'John',
          date: '1999-01-01',
          remarks: ''
        }],
        preparation: [{
          preparation: 'Type1',
          count: '5'
        }],
        typeStatus: '',
        inventory: '',
        remarks: '',
        locality: ''
      }
    },

    // Handle create button click
    handleCreate() {
      this.resetLotData()
      this.dialogStatus = 'create'
      this.dialogFormVisible = true

      this.$nextTick(() => {
        if (this.$refs['dataForm']) {
          this.$refs['dataForm'].clearValidate()
        }
      })
    },

    // Create new data
    createData() {
      this.$refs['dataForm'].validate((valid) => {
        if (valid) {
          // Generate a mock ID for new entry
          this.temp.id = parseInt(Math.random() * 100) + 1024
          this.temp.author = 'vue-element-admin'

          // Submit new lot data to API
          newLot(this.newLotData).then(() => {
            if (this.list != null) {
              this.list.unshift(this.newLotData)
            }
            this.dialogFormVisible = false

            this.$notify({
              title: 'Success',
              message: 'New specimen created successfully',
              type: 'success',
              duration: 2000
            })

            // Refresh data
            this.getLots()
          }).catch(error => {
            console.error('Error creating new specimen:', error)
            this.$message.error('Failed to create new specimen')
          })
        }
      })
    },

    // Handle update button click
    handleUpdate(row) {
      this.currCatalogNo = row.CatalogNumber
      this.currPrimaryID = row.MainPrimaryID
      this.dialogStatus = 'update'
      this.forceRerender()
      this.editLotDialogFormVisible = true
    },

    // Update data
    updateData() {
      this.$refs['dataForm'].validate((valid) => {
        if (valid) {
          const tempData = Object.assign({}, this.temp)
          tempData.timestamp = +new Date(tempData.timestamp)

          // Update article via API
          updateArticle(tempData).then(() => {
            const index = this.list.findIndex(v => v.id === this.temp.id)
            this.list.splice(index, 1, this.temp)
            this.dialogFormVisible = false

            this.$notify({
              title: 'Success',
              message: 'Specimen updated successfully',
              type: 'success',
              duration: 2000
            })

            // Refresh data
            this.getLots()
          }).catch(error => {
            console.error('Error updating specimen:', error)
            this.$message.error('Failed to update specimen')
          })
        }
      })
    },

    // Handle delete button click
    handleDelete(row, index) {
      this.$confirm('Are you sure you want to delete this specimen?', 'Warning', {
        confirmButtonText: 'Confirm',
        cancelButtonText: 'Cancel',
        type: 'warning'
      }).then(() => {
        this.list.splice(index, 1)
        this.$notify({
          title: 'Success',
          message: 'Specimen deleted successfully',
          type: 'success',
          duration: 2000
        })
      }).catch(() => {
        // User canceled the operation
      })
    },

    // Handle export download
    handleDownload(type) {
      this.downloadLoading = true

      import('@/vendor/Export2Excel').then(excel => {
        const tHeader = [
          'CatalogNumber', 'FamilyName', 'FamilyBookNumber(4th)', 'Genus', 'ScientificName',
          'FullScientificName', 'Count', 'PreparationType', 'DateCollected', 'CatalogerID',
          'TotalNumber', 'LotsNumberPerSpecies', 'Storage', 'JarSize', 'TypeStatus',
          'WaterBody', 'FieldNo', 'LocalityString', 'Inventory', 'Drainage', 'Continent',
          'County', 'State', 'Longitude', 'Latitude'
        ]

        const filterVal = [
          'CatalogNumber', 'FamilyName', 'FamilyNumber', 'Genus', 'ScientificName',
          'FullScientificName', 'Count', 'PreparationType', 'StartDate', 'CatalogerID',
          'TotalNumber', 'lotsnumber', 'Storage', 'JarSize', 'TypeStatus', 'WaterBody',
          'FieldNo', 'LocalityString', 'Inventory', 'Drainage', 'Continent', 'County',
          'State', 'Lon', 'Lat'
        ]

        let data = []

        if (type === "Full") {
          // Export all data matching current search conditions
          this.$message({
            message: 'Preparing to export all data, please wait...',
            type: 'info'
          })
          data = this.formatExportJson(filterVal, this.list)
        } else if (type === "Filtered") {
          // For "Filtered" type, we need a different approach
          // First check if the table reference exists
          if (!this.$refs.table) {
            this.$message.error('Table reference not found')
            this.downloadLoading = false
            return
          }

          this.$message({
            message: 'Preparing to export filtered data, please wait...',
            type: 'info'
          })

          // In Element UI's el-table, the filtered data is accessible via tableData property
          const filteredData = this.$refs.table.tableData

          if (!filteredData || filteredData.length === 0) {
            this.$message.warning('No filtered data to export')
            this.downloadLoading = false
            return
          }

          data = this.formatExportJson(filterVal, filteredData)
        }

        // Export the data
        excel.export_json_to_excel({
          header: tHeader,
          data: data,
          filename: `Specimen-Catalog-${new Date().toISOString().split('T')[0]}`
        })

        this.downloadLoading = false
        this.$message({
          message: 'Export successful!',
          type: 'success'
        })
      }).catch(error => {
        this.downloadLoading = false
        this.$message.error('Failed to load export module')
        console.error('Export2Excel loading error:', error)
      })
    },

    formatExportJson(filterVal, data) {
      return data.map(v => filterVal.map(j => {
        if (j === 'StartDate') {
          // Date format conversion
          return v[j] ? parseTime(new Date(Date.parse(v[j])), '{y}-{m}-{d}') : ''
        } else {
          // Handle possible null values
          return v[j] != null ? v[j] : ''
        }
      }))
    },

    // Format JSON for export
    formatJson(filterVal, type) {
      let data = null

      if (type === 'Full') { data = this.list } else { data = this.$refs.table.tableData }

      return data.map(v => filterVal.map(j => {
        if (j === 'timestamp') {
          const tempDate = new Date(Date.parse(v[j]))
          return parseTime(tempDate)
        } else {
          return v[j]
        }
      }))
    },

    // Get sort class
    getSortClass(key) {
      const sort = this.listQuery.sort
      return sort === `+${key}` ? 'ascending' : 'descending'
    },

    // Original print function
    printTable() {
      let rawHtml = ''
      this.list.forEach((item) => {
        rawHtml = rawHtml + '<h3>TULANE UNIVERSITY COLLECTIONS</h3>' +
          '<div class="lot-label-template" style="margin:0 0 4em 0;width: 450px;height: auto;display: flex;flex-flow: row nowrap;justify-content: space-between;align-content: flex-start;">\n' +
          '      <div>\n' +
          '        <div class="lot-label-template-flex-outer">\n' +
          '          <div>Family No. <span style="border-bottom: 1px solid rgb(31, 45, 61);width: 100px;display: inline-block;">' + item.FamilyNumber + '</span></div>\n' +
          '\n' +
          '          <div>Cat. No. <span style="border-bottom: 1px solid rgb(31, 45, 61);width: 100px;display: inline-block;">' + item.CatalogNumber + '</span></div>\n' +
          '        </div>\n' +
          '        <div style="padding-bottom: 0.5em">\n' +
          '          Scientific Name <span style="border-bottom: 1px solid rgb(31, 45, 61);width: 320px;display: inline-block;">' + item.ScientificName + '</span>\n' +
          '        </div>\n' +
          '        <div class="lot-label-template-flex-outer">\n' +
          '          <div>\n' +
          '            Dr. <span style="border-bottom: 1px solid rgb(31, 45, 61);width: 170px;display: inline-block;">' + item.Drainage + '</span>\n' +
          '          </div>\n' +
          '          <div>\n' +
          '            No. of Specimens <span style="border-bottom: 1px solid rgb(31, 45, 61);width: 120px;display: inline-block;">' + item.TotalNumber + '</span>\n' +
          '          </div>\n' +
          '        </div>\n' +
          '        <div class="lot-label-template-flex-outer">\n' +
          '          <div>\n' +
          '          <span> State </span><span style="border-bottom: 1px solid rgb(31, 45, 61);width: 170px;display: inline-block;"> ' + item.State + '</span>\n' +
        '          </div>\n' +
        '          <div>\n' +
        '            <span> County </span><span style="border-bottom: 1px solid rgb(31, 45, 61);width: 120px;display: inline-block;"> ' + item.County + '</span>\n' +
        '          </div>\n' +
        '        </div>\n' +
        '        <div style="padding-bottom: 0.5em">\n' +
        '          Locality <span style="border-bottom: 1px solid rgb(31, 45, 61);width: 100%;">' + item.LocalityString + '</span>\n' +
        '        </div>\n' +
        '        <div class="lot-label-template-flex-outer">\n' +
        '          <div>\n' +
        '            Date <span style="border-bottom: 1px solid rgb(31, 45, 61);width: 170px;display: inline-block;"> ' + item.VerbatimDate + '</span>\n' +
        '          </div>\n' +
        '          <div>\n' +
        '            Col. No <span style="border-bottom: 1px solid rgb(31, 45, 61);width: 120px;display: inline-block;"> ' + item.FieldNo + '</span>\n' +
        '          </div>\n' +
        '        </div>\n' +
        '        <div>\n' +
        '          Col. by <span style="border-bottom: 1px solid rgb(31, 45, 61);width: 220px;display: inline-block;" />\n' +
        '        </div>\n' +
        '      </div>\n' +
        '      <div id="catalog-left" style="width: 50px;height: inherit;writing-mode: vertical-rl;font-size: 50px;">' + item.CatalogNumber + '</div>\n' +
        '    </div>\n'
      })
      const template_style = '.lot-label-template-flex-outer{padding-bottom: 0.5em;width: 450px;height: auto;display: flex;flex-flow: row nowrap;justify-content: space-between;align-content: flex-start;} .underline{text-decoration: underline;text-decoration-thickness:1px;}'
      console.log(this.list)
      printJS({
        printable: rawHtml,
        type: 'raw-html',
        style: template_style,
        targetStyles: ['*']
      })
    }
  }
}

</script>
<style scoped>
/* Main Container Styles */
.specimen-catalog {
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  color: #2c3e50;
  background-color: #f5f7fa;
  min-height: 100vh;
  padding-bottom: 40px;
}

/* Search Container */
.search-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  margin: 0 20px 20px;
  padding: 20px;
}

.search-form {
  margin-bottom: 15px;
}

.search-form-row {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 15px;
}

.catalog-search {
  flex: 1;
  min-width: 200px;
}

.scientific-name-search,
.family-search {
  flex: 1.5;
  min-width: 250px;
}

.search-button {
  min-width: 100px;
}

/* Advanced Search Panel */
.advanced-search-panel {
  margin-top: 15px;
  border: none;
}

.advanced-search-panel >>> .el-collapse-item__header {
  font-size: 16px;
  color: #409EFF;
  border: none;
  font-weight: 500;
}

.advanced-search-content {
  padding: 10px 0;
}

.advanced-search-section {
  margin-bottom: 20px;
}

.advanced-search-section h3 {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 15px;
  color: #606266;
  border-left: 3px solid #409EFF;
  padding-left: 10px;
}

.advanced-search-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.full-width {
  width: 100%;
}

.range-input {
  display: flex;
  align-items: center;
}

.range-separator {
  margin: 0 10px;
  color: #909399;
}

.date-range-picker {
  display: flex;
  align-items: center;
}

.date-picker {
  width: calc(50% - 10px);
}

/* Results Container */
.results-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  margin: 0 20px;
  padding: 20px;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-title {
  font-size: 18px;
  font-weight: 500;
  margin: 0;
  color: #303133;
}

/* Action Toolbar */
.action-toolbar {
  display: flex;
  gap: 10px;
}

.action-icon-btn {
  width: 40px !important;
  height: 40px !important;
  padding: 0 !important;
  border-radius: 50% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.action-icon-btn i {
  font-size: 16px;
  margin: 0 !important;
}

/* Catalog Number Container */
.catalog-number-container {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

/* Table Row Actions */
.row-actions {
  opacity: 0;
  position: absolute;
  right: -10px; /* Changed from -40px to -5px to bring buttons closer */
  display: flex;
  align-items: center;
  gap: 0px;
  transition: all 0.3s ease;
}

.el-table__row:hover .row-actions {
  opacity: 1;
  right: 5px; /* Changed from -10px to 5px to position buttons closer */
}

/* Increase width of Catalog # column slightly to accommodate buttons */
.specimen-table >>> .el-table__header-wrapper th:first-child {
  min-width: 180px;
}

/* Make buttons more compact */
.action-icon {
  padding: 4px !important;
  margin: 0 !important;
}

/* Ensure catalog number stays aligned properly */
.catalog-number {
  margin-right: 10px;
}

.edit-icon:hover {
  color: #409EFF !important;
}

.print-icon:hover {
  color: #67c23a !important;
}

/* Specimen Table */
.specimen-table {
  margin-bottom: 20px;
}

.specimen-table >>> .el-table__header th {
  background-color: #f2f6fc;
  color: #606266;
  font-weight: 600;
}

.specimen-table >>> .el-table__row {
  transition: background-color 0.2s ease;
}

.specimen-table >>> .el-table__row:hover {
  background-color: #ecf5ff;
}

.type-specimen-row {
  background-color: #fdf5e6 !important;
}

.catalog-number {
  font-weight: 600;
  color: #409EFF;
}

.scientific-name {
  font-style: italic;
  color: #303133;
}

.scientific-name.link-type {
  cursor: pointer;
  transition: color 0.3s;
}

.scientific-name.link-type:hover {
  color: #409EFF;
  text-decoration: underline;
}

.locality-string {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 300px;
}

/* Pagination */
.pagination-container {
  text-align: right;
  padding-top: 15px;
}

/* Print Dialog Styles */
.print-dialog {
  width: 700px !important;
  max-width: 90%;
  margin: 0 auto;
}

.print-dialog .el-dialog__body {
  padding: 20px 30px;
  overflow: hidden; /* Prevent scrollbars */
}

.print-button {
  display: block;
  margin: 0 auto 20px;
}

.print-container {
  width: 100%;
  overflow: hidden; /* Prevent scrollbars */
}

.print-label {
  width: 100%;
  margin-bottom: 40px;
  font-family: 'Times New Roman', serif;
  color: #333;
  overflow: hidden; /* Prevent horizontal scrolling */
}

.print-header {
  text-align: center;
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 20px;
  color: #333;
  text-transform: uppercase;
}

.print-grid {
  width: 100%;
  overflow: hidden;
}

.print-row {
  display: flex;
  width: 100%;
  margin-bottom: 15px;
  overflow: hidden;
}

.print-col {
  overflow: hidden;
}

.left-col {
  flex: 1;
  padding-right: 15px;
}

.right-col {
  flex: 1;
  padding-left: 15px;
}

.full-col {
  width: 100%;
}

.field {
  display: flex;
  flex-direction: column;
  margin-bottom: 5px;
}

.field-label {
  display: inline-block;
  margin-bottom: 5px;
  font-weight: normal;
}

.field-underline {
  display: block;
  border-bottom: 1px solid #333;
  padding-bottom: 2px;
  min-height: 20px;
  font-style: italic;
}

.locality-field {
  min-height: 40px;
}

/* Edit Dialog */

.edit-form {
  max-width: 100%;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.el-divider {
  margin: 25px 0;
}

.table-actions {
  margin-bottom: 15px;
}

.inner-table {
  margin-bottom: 20px;
}

/* Lot Complex Table Dialog */
.edit-lot-dialog >>> .el-dialog__body {
  padding: 10px 20px;
}

/* Dropdown Styling */
.el-dropdown-menu {
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.el-dropdown-menu__item {
  padding: 8px 16px;
  font-size: 14px;
  display: flex;
  align-items: center;
}

.el-dropdown-menu__item i {
  margin-right: 8px;
  font-size: 16px;
}

/* Animation for row actions */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.row-actions {
  animation: slideIn 0.3s ease;
}

/* Print Styles */
@media print {
  @page {
    size: letter;
    margin: 0.5in;
  }

  body {
    margin: 0;
    padding: 0;
    background: #fff;
  }

  .print-dialog {
    width: 100% !important;
    max-width: 100% !important;
    box-shadow: none !important;
    border: none !important;
    background: none !important;
  }

  .print-dialog .el-dialog__header,
  .print-dialog .el-dialog__body {
    padding: 0 !important;
    margin: 0 !important;
  }

  .print-button,
  .el-dialog__header,
  .el-dialog__headerbtn {
    display: none !important;
  }

  .print-label {
    page-break-after: always;
    margin: 0;
    padding: 20px;
  }

  .print-header {
    margin-top: 0;
  }
}

/* Responsive Adjustments */
@media (max-width: 768px) {
  .search-form-row {
    flex-direction: column;
  }

  .catalog-search,
  .scientific-name-search,
  .family-search {
    width: 100%;
  }

  .results-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .action-toolbar {
    width: 100%;
    justify-content: space-between;
  }

  .advanced-search-grid {
    grid-template-columns: 1fr;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .row-actions {
    opacity: 1; /* Always show on mobile */
    position: static; /* Reset the position for mobile */
    margin-left: 10px;
  }

  .catalog-number-container {
    flex-direction: column;
  }
}

</style>
