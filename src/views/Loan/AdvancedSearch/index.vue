<template>
  <div class="app-container">
    <AdvancedSearchBase
      ref="search"
      :search-fn="searchFn"
      :metadata-fn="metadataFn"
      :sort-key-map="sortKeyMap"
      entity-label="loans"
      search-placeholder="Search loans (loan #, person, organization, catalog #, scientific name …)"
      storage-key="loan"
      :default-pinned="['loan_number', 'transaction_type', 'loan_person', 'loan_date']"
      :option-loaders="optionLoaders"
    >
      <el-table-column label="" align="center" width="60" fixed="left" class-name="action-col">
        <template slot-scope="{ row }">
          <el-tooltip content="View / edit this loan" placement="top">
            <i class="el-icon-edit row-action" @click="openLoan(row)" />
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column label="Loan #" width="115" prop="LoanNumber" sortable="custom" fixed="left" />
      <el-table-column label="Type" width="95" prop="TransactionType" sortable="custom" />
      <el-table-column label="Person" min-width="150" prop="FullName" sortable="custom" />
      <el-table-column label="Last Name" width="130" prop="LastName" sortable="custom" />
      <el-table-column label="Organization" min-width="150" prop="OrganizationID" sortable="custom" />
      <el-table-column label="Loan Date" width="120" prop="LoanDateParsed" sortable="custom">
        <template slot-scope="{ row }">{{ fmtDate(row) }}</template>
      </el-table-column>
      <el-table-column label="Status" width="90" prop="Closed" sortable="custom" align="center">
        <template slot-scope="{ row }">
          <el-tag size="mini" :type="isClosed(row) ? 'info' : 'success'" effect="plain">{{ isClosed(row) ? 'closed' : 'open' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Date Closed" width="120" prop="DateClosedParsed" sortable="custom">
        <template slot-scope="{ row }">{{ fmtClosed(row) }}</template>
      </el-table-column>
    </AdvancedSearchBase>

    <!-- 编辑借阅：复用旧 loanForm（external-loan-id = LoanNumber） -->
    <el-dialog :visible.sync="loanDialogVisible" title="Loan" width="90%" :append-to-body="true" @close="refresh">
      <loanForm v-if="loanDialogVisible" :key="'loan' + dialogKey" :external-loan-id="dialogLoanNumber" />
    </el-dialog>
  </div>
</template>

<script>
import AdvancedSearchBase from '@/components/AdvancedSearchBase'
import loanForm from '@/views/loanform/index'
import { getLoansAdvanced, getLoanFilterMetadata, getJarSizes } from '@/api/table'

// 表格列 prop → 后端排序字段（仅借阅级可排序列，与后端 _LOAN_SORTABLE 对应）
const SORT_KEY = {
  LoanNumber: 'loan_number', TransactionType: 'transaction_type', FullName: 'loan_person',
  LastName: 'last_name', OrganizationID: 'organization', LoanDateParsed: 'loan_date',
  Closed: 'closed', DateClosedParsed: 'date_closed'
}

export default {
  name: 'SearchLoan',
  components: { AdvancedSearchBase, loanForm },
  data() {
    return {
      searchFn: getLoansAdvanced,
      metadataFn: getLoanFilterMetadata,
      sortKeyMap: SORT_KEY,
      // 给 jar_size enum 加载真实选项（其余如 transaction_type/closed 后端已带 options）
      optionLoaders: {
        jar_size: () => getJarSizes().then(r => (r.data.items || []).map(i => i.JarSize).filter(Boolean))
      },
      loanDialogVisible: false,
      dialogLoanNumber: '',
      dialogKey: 0
    }
  },
  methods: {
    fmtDate(row) {
      return row.LoanDateParsed ? String(row.LoanDateParsed).slice(0, 10) : (row.LoanDate || '')
    },
    fmtClosed(row) {
      return row.DateClosedParsed ? String(row.DateClosedParsed).slice(0, 10) : (row.DateClosed || '')
    },
    isClosed(row) { return row.Closed === true || row.Closed === 't' || row.Closed === 'true' },
    openLoan(row) {
      this.dialogLoanNumber = row.LoanNumber
      this.dialogKey += 1
      this.loanDialogVisible = true
    },
    refresh() { if (this.$refs.search) this.$refs.search.getList() }
  }
}
</script>

<style scoped>
.app-container { background-color: #f5f7fa; padding-bottom: 40px; }
::v-deep .action-col .cell { white-space: nowrap; }
::v-deep .action-col .row-action { font-size: 16px; cursor: pointer; color: #909399; }
::v-deep .action-col .row-action:hover { color: #409eff; }
</style>