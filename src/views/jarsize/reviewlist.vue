<template>
  <div class="app-container">
    <div v-if="false" class="lot-label-template" style="margin:0 0 4em 0;width: 450px;height: auto;display: flex;flex-flow: row nowrap;justify-content: space-between;align-content: flex-start;">
      <div>
        <div class="lot-label-template-flex-outer">
          <div>Family No. <span style="border-bottom: 1px solid rgb(31, 45, 61);width: 100px;display: inline-block;"> 323232</span></div>

          <div>Cat. No. <span style="border-bottom: 1px solid rgb(31, 45, 61);width: 100px;display: inline-block;"> 323232</span></div>
        </div>
        <div style="padding-bottom: 0.5em">
          Scientific Name <span style="border-bottom: 1px solid rgb(31, 45, 61);width: 320px;display: inline-block;">Ajdfske dsDfsd</span>
        </div>
        <div class="lot-label-template-flex-outer">
          <div>
            Dr. <span style="border-bottom: 1px solid rgb(31, 45, 61);width: 170px;display: inline-block;"> Alabama River</span>
          </div>
          <div>
            No. of Specimens <span style="border-bottom: 1px solid rgb(31, 45, 61);width: 120px;display: inline-block;">7</span>
          </div>
        </div>
        <div class="lot-label-template-flex-outer">
          <div>
            <span> State </span> <span style="border-bottom: 1px solid rgb(31, 45, 61);width: 170px;display: inline-block;"> Alabama</span>
          </div>
          <div>
            <span> County </span><span style="border-bottom: 1px solid rgb(31, 45, 61);width: 120px;display: inline-block;"> Wilcox</span>
          </div>
        </div>
        <div style="padding-bottom: 0.5em">
          Locality <span style="border-bottom: 1px solid rgb(31, 45, 61);width: 100%;">Alabama River along right bank at Yellow Jacket Bar; River Mile 129.7</span>
        </div>
        <div class="lot-label-template-flex-outer">
          <div>
            Date <span style="border-bottom: 1px solid rgb(31, 45, 61);width: 170px;display: inline-block;"> 03-Sep-2000</span>
          </div>
          <div>
            Col. No <span style="border-bottom: 1px solid rgb(31, 45, 61);width: 120px;display: inline-block;"> RDS 11699</span>
          </div>
        </div>
        <div>
          Col. by <span style="border-bottom: 1px solid rgb(31, 45, 61);width: 220px;display: inline-block;" />
        </div>
      </div>
      <div id="catalog-left" style="width: 50px;height: inherit;writing-mode: vertical-rl;font-size: 30px;">*191150</div>
    </div>
    <el-dialog :visible.sync="editULMDialogFormVisible">
      <UlmEditView :currCatalogNo="currCatalogNo" :key="componentKey"></UlmEditView>
    </el-dialog>
    <div class="filter-container">
      <el-form ref="form" :model="searchForm" label-width="120px">
        <el-form-item label="Previous Catalog Number">
          <el-input clearable v-model="searchForm.prevNumber" style="width: 350px;" placeholder="Prev Catalogs(Use “,” to separate multiple numbers)" />
        </el-form-item>
        <!--        <el-input v-model="form.highCatalogNumber" style="width: 150px;" placeholder="Higher Catalog No." />-->
        <!--        <el-input v-model="searchForm.scientificName" style="width: 200px;" placeholder="Scientific Name" />-->
        <el-form-item label="Jar Size">
          <el-select clearable v-model="searchForm.jarSize" class="filter-item" placeholder="Please select Jar Size">
            <el-option v-for="item in jarSizeTypeOptions" :key="item.JarSizeID" :label="item.JarSize" :value="item.JarSize" />
          </el-select>
        </el-form-item>

        <el-form-item label="Total Number">
          <el-col :span="5">
            <el-input clearable type="number" :min="0" v-model.number="searchForm.minNum" />
          </el-col>
          <el-col :span="2" class="line"> - </el-col>
          <el-col :span="5">
            <el-input clearable type="number" :max="10000" v-model.number="searchForm.maxNum" />
          </el-col>

        </el-form-item>
        <el-form-item label="Date">
          <el-col :span="11">
            <el-date-picker clearable v-model="searchForm.startdate" type="date" placeholder="Pick a date" style="width: 100%;" />
          </el-col>
          <el-col :span="2" class="line"> - </el-col>
          <el-col :span="11">
            <el-date-picker clearable v-model="searchForm.enddate" type="date" placeholder="Pick a date" style="width: 100%;" />
          </el-col>
        </el-form-item>
        <el-form-item label="Review Required">
          <el-col :span="8">
            <el-switch v-model="searchForm.reviewrequired" />
          </el-col>
        </el-form-item>
        <el-form-item label="Dataset" >
          <el-col :span="11">
            <el-select clearable v-model="searchForm.dataset" class="filter-item" placeholder="Please select dataset:ULM/LATech">
              <el-option v-for="item in datasetTypeOptions" :key="item.dataset" :label="item.dataset" :value="item.dataset" />
            </el-select>
          </el-col>
        </el-form-item>

        <el-button type="primary" icon="el-icon-search" @click="onSubmit">Search</el-button>
      </el-form>
      <el-divider></el-divider>
      <el-button v-waves :loading="downloadLoading" class="filter-item" type="primary" icon="el-icon-download" @click="handleDownload">
        Download ULM List
      </el-button>
      <el-link :href="fileurl">{{ filename }}</el-link>
      <el-button v-waves :loading="notfounddownloadLoading" class="filter-item" type="primary" icon="el-icon-download" @click="handleNotFoundDownload">
        Download ULM Not Found List
      </el-button>
      <el-link :href="notfoundfileurl">{{ notfoundfilename }}</el-link>

    </div>

    <el-table
      :key="tableKey"
      v-loading="listLoading"
      :data="list"
      border
      fit
      highlight-current-row
      style="width: 100%;"
      show-overflow-tooltip="true"
      @sort-change="sortChange"
    >
      <el-table-column fixed="left" label="Prev Catalog Number" prop="id" sortable="custom" align="center">
        <template slot-scope="{row}">
          <span>{{ row.PrevNumber }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Dataset" align="center">
        <template slot-scope="{row}">
          <span>{{ row.dataset }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Family" align="center">
        <template slot-scope="{row}">
          <span>{{ row.family }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Genus" align="center">
        <template slot-scope="{row}">
          <span>{{ row.genus }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Species" align="center">
        <template slot-scope="{row}">
          <span>{{ row.species }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Original Date Collected" align="center">
        <template slot-scope="{row}">
<!--          <span>{{ row.collectordate | parseTime('{y}-{m}-{d}') }}</span>-->
          <span>{{ row.collectordate }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Updated Date Collected" align="center">
        <template slot-scope="{row}">
          <!--          <span>{{ row.collectordate | parseTime('{y}-{m}-{d}') }}</span>-->
          <span>{{ row.updatecollectordate }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Collector" align="center">
        <template slot-scope="{row}">
          <span>{{ row.collectorname }}</span>
        </template>
      </el-table-column>
      <!--      <el-table-column label="CatalogerID" align="center">-->
      <!--        <template slot-scope="{row}">-->
      <!--          <span>{{ row.CatalogerID }}</span>-->
      <!--        </template>-->
      <!--      </el-table-column>-->
      <el-table-column label="TotalNumber">
        <template slot-scope="{row}">
          <span>{{ row.TotalNumber }}</span>
        </template>
      </el-table-column>
      <el-table-column label="JarSize" class-name="status-col">
        <template slot-scope="{row}">
          <el-tag :type="row.JarSize | statusFilter">
            {{ row.JarSize }}
          </el-tag>
        </template>
      </el-table-column>
            <el-table-column label="TypeStatus" class-name="status-col">
              <template slot-scope="{row}">
                <span>{{ row.TypeStatus }}</span>
              </template>
            </el-table-column>
      <el-table-column label="Country" align="center">
        <template slot-scope="{row}">
          <span>{{ row.country }}</span>
        </template>
      </el-table-column>

      <el-table-column label="State" align="center">
        <template slot-scope="{row}">
          <span>{{ row.state }}</span>
        </template>
      </el-table-column>

      <el-table-column label="County" align="center">
        <template slot-scope="{row}">
          <span>{{ row.county }}</span>
        </template>
      </el-table-column>
      <el-table-column label="LocalityString" class-name="status-col">
        <template slot-scope="{row}">
          <span>{{ row.Location }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Waterbody" align="center">
        <template slot-scope="{row}">
          <span>{{ row.waterbody }}</span>
        </template>
      </el-table-column>

      <el-table-column label="Drainage" align="center">
        <template slot-scope="{row}">
          <span>{{ row.drainage }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Review Required" align="center">
        <template slot-scope="{row}">
          <span>{{ row.recheckrequired | recheckFilter}}</span>
        </template>
      </el-table-column>
      <el-table-column label="Review Comments" align="center">
        <template slot-scope="{row}">
          <span>{{ row.recheckcomment }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Editor" align="center">
        <template slot-scope="{row}">
          <span>{{ row.editor }}</span>
        </template>
      </el-table-column>

      <el-table-column fixed="right" label="Actions" align="center" width="230" class-name="small-padding fixed-width">
        <template slot-scope="{row,$index}">
          <el-button type="primary" size="mini" @click="handleUpdate(row)">
            Edit
          </el-button>
          <!--          <el-button v-if="row.status!='deleted'" size="mini" type="danger" @click="handleDelete(row,$index)">-->
          <!--            Delete-->
          <!--          </el-button>-->
        </template>
      </el-table-column>

    </el-table>

    <pagination v-show="total>0" :total="total" :page.sync="listQuery.page" :limit.sync="listQuery.limit" @pagination="getULMLotList" />
  </div>
</template>

<script>
import {
  getJarSizes,
  getULMLotList, downloadULMData, downloadULMNotFoundData
} from '@/api/table'
import waves from '@/directive/waves' // waves directive
import { parseTime } from '@/utils'
import Pagination from '@/components/Pagination'
import UlmEditView from '@/views/jarsize/ulmEdit'
const calendarTypeOptions = [
  { key: 'CN', display_name: 'China' },
  { key: 'US', display_name: 'USA' },
  { key: 'JP', display_name: 'Japan' },
  { key: 'EU', display_name: 'Eurozone' }
]
// eslint-disable-next-line no-unused-vars
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
  { key: "Multiple Jars &lt;see remarks&gt;", display_name: 'Multiple Jars\(see remarks\)' },
  { key: 'vial', display_name: 'vial' },
  { key: 'Steel Tank', display_name: 'Steel Tank' },
  { key: 'Titan Bin', display_name: 'Titan Bin' },
  { key: 'Unknown', display_name: 'Unknown' },
  { key: null, display_name: 'Unknown' }
]
const recheckTypeOptions = [
  { key:'true', display_name:'YES'},
  { key:'false', display_name:'NO'}
]
// arr to obj, such as { CN : "China", US : "USA" }
const calendarTypeKeyValue = calendarTypeOptions.reduce((acc, cur) => {
  acc[cur.key] = cur.display_name
  return acc
}, {})
const jarSizeTypeKeyValue = jarSizeTypeOptions.reduce((acc, cur) => {
  acc[cur.key] = cur.display_name
  return acc
}, {})
const recheckTypeKeyValue = recheckTypeOptions.reduce((acc, cur) => {
  acc[cur.key] = cur.display_name
  return acc
}, {})
export default {
  name: 'reviewlist',
  components: { UlmEditView, Pagination},
  directives: { waves},
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
    typeFilter(type) {
      return calendarTypeKeyValue[type]
    },
    jarSizeFilter(type) {
      return jarSizeTypeKeyValue[type]
    },
    recheckFilter(type){
      return recheckTypeKeyValue[type]
    },
    parseTime(time,cFormat){
      if(time===undefined || time === null)
        return ''
      let date = new Date(Date.parse(time))
      return parseTime(date,cFormat)
    }
  },
  data() {
    return {
      componentKey: 0,
      allLocalityList:[],
      allTaxonOptions:[],
      editULMDialogFormVisible:false,
      currCatalogNo:'',
      currPrimaryID:'',
      searchForm: {
        prevNumber: '',
        family:'',
        genus:'',
        species:'',
        startdate:'',
        enddate:'',
        jarSize: '',
        totalNumber: '',
        typeStatus: '',
        remarks: '',
        country:'',
        state:'',
        county:'',
        waterbody:'',
        drainage:'',
        locality:'',
        collector:'',
        reviewrequired:true,
        recheckcomment:'',
        dataset:'ULM',
      },
      remoteLoading:false,
      keyWord:"",
      tableKey: 0,
      list: null,
      catalogList:[{
        PrevNumber: '',
        dataset:'',
        family:'',
        genus:'',
        species:'',
        collectordate:'',
        updatecollectordate:'',
        JarSize: '',
        TotalNumber: '',
        TypeStatus: '',
        Remarks: '',
        country:'',
        state:'',
        county:'',
        waterbody:'',
        drainage:'',
        location:'',
        collectorname:'',
        recheckrequired:false,
        recheckcomment:'',
        editor:''
      }
      ],
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
      jarSizeTypeOptions:[{

      }],
      datasetTypeOptions:[
        {
          dataset:"ALL"
        },{
        dataset:"ULM"
      },
        {dataset:"LATech"}],
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
      rules: {
        type: [{ required: true, message: 'type is required', trigger: 'change' }],
        timestamp: [{ type: 'date', required: true, message: 'timestamp is required', trigger: 'change' }],
        title: [{ required: true, message: 'title is required', trigger: 'blur' }]
      },
      downloadLoading: false,
      filename:'',
      fileurl:'',
      notfounddownloadLoading:false,
      notfoundfileurl:'',
      notfoundfilename:''
    }
  },
  created() {
    this.getULMLotList()
    this.getJarSizes()
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
  methods: {
    /*force rerender ulm edit form component*/
    forceRerender(){
      this.componentKey += 1;
    },
    onSubmit() {
      this.getULMLotList()
      this.$message('submit!')
    },

    getULMLotList(){
      this.listLoading = true
      this.$message({
        message: 'loading Latest 100 data...',
        type: 'info'
      })

      getULMLotList({
        'ids': this.searchForm.prevNumber,
        'family':this.searchForm.family,
        'genus':this.searchForm.genus,
        'species':this.searchForm.species,
        'jarSize':this.searchForm.jarSize,
        'minNum':this.searchForm.minNum,
        'maxNum':this.searchForm.maxNum,
        'typeStatus':this.searchForm.typeStatus,
        'remarks':this.searchForm.remarks,
        'country':this.searchForm.country,
        'state':this.searchForm.state,
        'county':this.searchForm.county,
        'waterbody':this.searchForm.waterbody,
        'drainage':this.searchForm.drainage,
        'locality':this.searchForm.locality,
        'collector':this.searchForm.collector,
        'reviewrequired':this.searchForm.reviewrequired,
        'startdate':this.searchForm.startdate,
        'enddate':this.searchForm.enddate,
        'dataset':this.searchForm.dataset === 'ALL'?null:this.searchForm.dataset,
        'limit':this.listQuery.limit,
        'page':this.listQuery.page
      }).then(response => {
        this.list = response.data.items
        this.catalogList = response.data.items
        this.total = response.data.total
        setTimeout(() => {
          this.listLoading = false
        }, 1.5 * 1000)
      })},

    change(e) {
      this.$forceUpdate()
    },
    onCancel() {
      this.$message({
        message: 'clear!',
        type: 'warning'
      })
    },
    handleDownload(){
      this.downloadLoading = true
      downloadULMData().then(response => {
        this.filename = response.data.filename
        this.fileurl = response.data.url
        setTimeout(() => {
          this.downloadLoading = false
        }, 1.5 * 1000)
      })
    },
    handleNotFoundDownload(){
      this.notfounddownloadLoading = true
      downloadULMNotFoundData().then(response => {
        this.notfoundfilename = response.data.filename
        this.notfoundfileurl = response.data.url
        setTimeout(() => {
          this.notfounddownloadLoading = false
        }, 1.5 * 1000)
      })
    },
    handleUpdate(row) {
      this.currCatalogNo = row.PrevNumber
      this.dialogStatus = 'update'
      this.forceRerender()
      this.editULMDialogFormVisible = true
      // this.$nextTick(() => {
      //   this.$refs['dataForm'].clearValidate()
      // })
    },
    // for taxon
    handleSelect(item) {
      this.inputValue = item.value
    },
    querySearch(queryString, cb) {
      let results = this.newLotData.taxonsForQuery
      results = queryString
        ? results.filter(this.createFilter(queryString))
        : results
      cb(results)
    },
    createFilter(queryString) {
      return (item) => {
        return item.value.toUpperCase().match(queryString.toUpperCase())
      }
    },
    collectorsHandleSelect(item) {
      this.inputValue = item.value
    },
    collectorsQuerySearch(queryString, cb) {
      let results = this.newLotData.collectorsForQuery
      results = queryString
        ? results.filter(this.createFilter(queryString))
        : results
      cb(results)
    },
    getJarSizes() {
      this.listLoading = true
      this.$message({
        message: 'Loading JarSize data...',
        type: 'info'
      })
      getJarSizes().then(response => {
        this.jarSizeTypeOptions = []
        response.data.items.forEach((item) => {
          this.jarSizeTypeOptions.push({
            JarSizeID: item.JarSizeID,
            JarSize: item.JarSize })
        })
        this.listLoading = false
      })
    },
    // getList() {
    //   this.listLoading = true
    //   getList(this.listQuery).then(response => {
    //     this.list = response.data.items
    //     this.total = response.data.total
    //     // Just to simulate the time of the request
    //     setTimeout(() => {
    //       this.listLoading = false
    //     }, 1.5 * 1000)
    //   })
    // },
    handleFilter() {
      this.listQuery.page = 1
      //this.getList()
      this.getLots(1000)
    },
    handleModifyStatus(row, status) {
      this.$message({
        message: 'Success',
        type: 'success'
      })
      row.status = status
    },
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
    formatJson(filterVal) {
      return this.list.map(v => filterVal.map(j => {
        if (j === 'timestamp') {
          let tempDate = new Date(Date.parse(v[j]))
          return parseTime(tempDate)
        } else {
          return v[j]
        }
      }))
    },
    getSortClass: function(key) {
      const sort = this.listQuery.sort
      return sort === `+${key}` ? 'ascending' : 'descending'
    }
  }
}
</script>

<style scoped>

</style>
