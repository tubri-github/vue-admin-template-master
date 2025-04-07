<template>
  <div class="filter-container">
    <el-form ref="form" :model="searchForm" label-width="120px">
      <el-form-item label="Field No" style="width: 350px;">
        <el-input label="Field No" v-model="searchForm.fieldNo" placeholder="Field No." />
      </el-form-item>
      <!--        ADVANCED SEARCH TOOL-->
      <el-collapse>
        <el-collapse-item title="Advanced Search">
          <span>Lot</span>
          <el-form-item label="Jar Size">
            <el-select v-model="searchForm.jarSize" class="filter-item" placeholder="Please select Jar Size">
              <el-option v-for="item in jarSizeTypeOptions" :key="item.JarSizeID" :label="item.JarSize" :value="item.JarSize" />
            </el-select>
          </el-form-item>
          <el-form-item label="Inventory">
            <el-input v-model="searchForm.inventory" />
          </el-form-item>
          <el-form-item label="Storage">
            <el-input v-model="searchForm.storage" />
          </el-form-item>
          <el-form-item label="Total Number">
            <el-col :span="5">
              <el-input type="number" :min="0" v-model.number="searchForm.minTotalNumber" />
            </el-col>
            <el-col :span="2" class="line"> - </el-col>
            <el-col :span="5">
              <el-input type="number" :max="10000" v-model.number="searchForm.maxTotalNumber" />
            </el-col>

          </el-form-item>
          <el-form-item label="Date">
            <el-col :span="11">
              <el-date-picker v-model="searchForm.startDate" type="date" placeholder="Pick a date" style="width: 100%;" />
            </el-col>
            <el-col :span="2" class="line"> - </el-col>
            <el-col :span="11">
              <el-date-picker v-model="searchForm.endDate" type="date" placeholder="Pick a date" style="width: 100%;" />
            </el-col>
          </el-form-item>
          <span>Locality</span>
          <el-form-item label="Field No" style="width: 350px;">
            <el-input label="Field No" v-model="searchForm.fieldNo" placeholder="Field No." />
          </el-form-item>
          <el-form-item label="Locality" style="width: 350px;">
            <el-select
              v-model="searchForm.localityId"
              placeholder="Please select a locality string"
              filterable
              clearable
              style="width:100%"
              remote
              :remote-method="(query) => remoteMethod(query,'locality')"
              :loading="remoteLoading"
              no-match-text="No match results found."
            >
              <el-option
                v-for="item in localityList"
                :key="item.localityID"
                :label="item.localityString"
                :value="item.localityID"
              >
              </el-option>
            </el-select>
          </el-form-item>
        </el-collapse-item>
      </el-collapse>
      <el-button type="primary" icon="el-icon-search" @click="onSubmit">Search</el-button>
    </el-form>
    <el-table
      :key="tableKey"
      v-loading="listLoading"
      :data="localityList"
      border
      fit
      highlight-current-row
      style="width: 100%;"
      show-overflow-tooltip="true"
      @sort-change="sortChange"
    >
      <el-table-column label="FieldNo" prop="id" sortable="custom" align="center">
        <template slot-scope="{row}">
          <span>{{ row.FieldNo }}</span>
        </template>
      </el-table-column>
      <el-table-column label="LocalityString" align="center">
        <template slot-scope="{row}">
          <span>{{ row.LocalityString }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Drainage" min-width="150px">
        <template slot-scope="{row}">
          <span>{{ row.Drainage }}</span>

        </template>
      </el-table-column>
      <el-table-column label="StartDate" align="center">
        <template slot-scope="{row}">
          <span>{{ row.StartDate | parseTime('{y}-{m}-{d} {h}:{i}') }}</span>
        </template>
      </el-table-column>

      <el-table-column label="Country">
        <template slot-scope="{row}">
          <span>{{ row.Country }}</span>
        </template>
      </el-table-column>
      <el-table-column label="State" align="center">
        <template slot-scope="{row}">
          <span>{{ row.State }}</span>
        </template>
      </el-table-column>
      <el-table-column label="County">
        <template slot-scope="{row}">
          <span>{{ row.County }}</span>
        </template>
      </el-table-column>

      <el-table-column label="WaterBody">
        <template slot-scope="{row}">
          <span>{{ row.WaterBody }}</span>
        </template>
      </el-table-column>

      <el-table-column label="ElevationMethod" class-name="status-col">
        <template slot-scope="{row}">
          <el-tag :type="row.JarSize | statusFilter">
            {{ row.ElevationMethod }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column label="Lon" class-name="status-col">
        <template slot-scope="{row}">
          <span>{{ row.Lon }}</span>
        </template>
      </el-table-column>

      <el-table-column label="Lat" class-name="status-col">
        <template slot-scope="{row}">
          <span>{{ row.Lat }}</span>
        </template>
      </el-table-column>

      <el-table-column label="Inventory" class-name="status-col">
        <template slot-scope="{row}">
          <el-tag :type="row.Inventory | statusFilter">
            {{ row.Inventory }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="VerbatimCollectors" class-name="status-col">
        <template slot-scope="{row}">
            {{ row.VerbatimCollectors }}
        </template>
      </el-table-column>

<!--      <el-table-column label="Actions" align="center" width="230" class-name="small-padding fixed-width">-->
<!--        <template slot-scope="{row,$index}">-->
<!--          <el-button type="primary" size="mini" @click="handleUpdate(row)">-->
<!--            Edit-->
<!--          </el-button>-->
<!--        </template>-->
<!--      </el-table-column>-->
    </el-table>

    <pagination v-show="total>0" :total="total" :page.sync="listQuery.page" :limit.sync="listQuery.limit" @pagination="getLocalities" />
  </div>
</template>

<script>
import {getLocalityAdvanced} from '@/api/table'
import waves from '@/directive/waves' // waves directive
import { parseTime } from '@/utils'
import Pagination from '@/components/Pagination'
import _ from 'lodash' // secondary package based on el-pagination
export default {
  name: 'SearchLocality',
  components: { Pagination },
  directives: { waves },
  filters: {
    statusFilter(status) {
      const statusMap = {
        published: 'success',
        draft: 'info',
        deleted: 'danger',
        F: 'info',
        U: 'success',
        '4oz': 'info',
        '16oz': 'danger'

      }
      return statusMap[status]
    },
  },
  data() {
    return {
      searchForm:{
        fieldNo:''
      },
      editLotDialogFormVisible:false,
      remoteLoading:false,
      keyWord:"",
      taxonOptions:[],
      tableKey: 0,
      localityList:[{
        FieldNo:'',
        LocalityString:'',
        Drainage: '',
        Remarks:'',
        County:'',
        State:'',
        Country:'',
        WaterBody:'',
        StartDate:'',
        ElevationMethod:'',
        Lon:'',
        Lat:'',
        Inventory:'',
        TotalNumber:0,
        VerbatimCollectors:''
      }
      ],
      total: 0,
      listLoading: false,
      listQuery: {
        page: 1,
        limit: 100,
        importance: undefined,
        title: undefined,
        type: undefined,
        sort: '+id'
      },
      importanceOptions: [1, 2, 3],
      sortOptions: [{ label: 'ID Ascending', key: '+id' }, { label: 'ID Descending', key: '-id' }],
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
        update: 'Edit',
        create: 'Create'
      },
      dialogPvVisible: false,
      pvData: [],
      rules: {
        type: [{ required: true, message: 'type is required', trigger: 'change' }],
        timestamp: [{ type: 'date', required: true, message: 'timestamp is required', trigger: 'change' }],
        title: [{ required: true, message: 'title is required', trigger: 'blur' }]
      },
      downloadLoading: false,
      displayTags: [
        { name: 'Primary', type: '' },
        { name: 'Primary.PrimaryID', type: 'warning' },
        { name: 'Locality', type: '' },
        { name: 'Locality.LocalityString', type: 'warning' }
      ],
      displayStatsTags: [
        { name: 'Locality.TotalNumber', type: 'warning' }
      ],
      displaySortTags: [
        { name: 'Primary.PrimaryID', type: 'warning' }
      ],
      displayFilterTags: [
        {
          name: 'Locality.TotalNumber', type: 'warning'
        }, {
          name: 'Locality.PrimaryID', type: 'warning'
        }
      ]
    }
  },
  computed:{
    queryParams(){
      return {
        pageSize:-1, //query all data
        pageNumber:1,
        keyWord:this.keyWord
      }
    }
  },
  methods:{
    onSubmit() {
      this.getLocalities(100)
      this.$message('searching...')
    },
    getLocalities(limit){
      this.listLoading = true
      // getLots({ 'ids': this.searchForm.lowCatalogNumber===''?1:this.searchForm.lowCatalogNumber, 'limit': limit }).then(response => {
      getLocalityAdvanced({
        'fieldNo': this.searchForm.fieldNo,
        'limit': limit,
      }).then(response => {
        this.localityList = response.data.items
        this.total = response.data.total
        setTimeout(() => {
          this.listLoading = false
        }, 1.5 * 1000)
      })},
    sortChange(data) {
      const { prop, order } = data
      if (prop === 'id') {
        this.sortByID(order)
      }
    },
    sortByID(order) {
      if (order === 'ascending') {
        this.listQuery.sort = '+id'
      } else {
        this.listQuery.sort = '-id'
      }
      this.handleFilter()
    },
  }
}
</script>

<style scoped>

</style>
