<template>
  <div class="app-container">
    <el-form ref="form" :model="form" label-width="300px">
      <el-form-item label="Osteology Catalog Number">
        <el-col :span="8">
          <el-input v-if="showPrevInput" v-model.number="form.ostcatalog" />
          <span v-if="showRemainForm"> {{ form.ostcatalog }}</span>
        </el-col>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onLoad">Search</el-button>
      </el-form-item>
      <div id="remain-form" v-if="showRemainForm">
        <el-form-item label="Type"  prop="type">
          <el-col :span="11">
            <el-select  v-model="form.type" class="filter-item" placeholder="Please select Specimen type">
              <el-option v-for="item in specimenTypeOptions" :key="item.specimenType" :label="item.specimenType" :value="item.specimenType" />
            </el-select>
          </el-col>
        </el-form-item>
        <el-form-item label="Field Number">
          <el-col :span="8">
            <el-input v-model="form.fieldnumber" />
          </el-col>
        </el-form-item>
        <el-form-item label="TU Catalog Number">
          <el-col :span="8">
            <el-input v-model="form.tucatalog" />
          </el-col>
        </el-form-item>
        <el-form-item label="Other institution Catalog Number">
          <el-col :span="8">
            <el-input v-model="form.othercatalog" />
          </el-col>
        </el-form-item>

        <el-form-item label="Collection Date">
          <el-col :span="11">
            {{form.datecollected}}
            <div class="description">
              If there are issues with original collection date, please use the date picker below to select the correct collection date.<br>
              Issues like:<br>
              1. wrong collection date (ex:Specimen collected on 2006-10-18,but it recorded as 2018-10-18)<br>
              2. Unclear date (ex: Summer 1988)<br>
              3. Date range (ex: Nov 1988 - Spring 1989)
            </div>
            <el-date-picker v-model="form.updateCollectdate" type="date" placeholder="Pick a date" style="width: 100%;" />
          </el-col>
        </el-form-item>
        <el-form-item label="Scientific Name" prop="scientific name">
          <el-col :span="8">
            <el-input v-model.number="form.scientificname" />
          </el-col>
        </el-form-item>
        <el-form-item label="Pencil remarks on Scientific Name column">
          <el-col :span="8">
            <el-input v-model.number="form.scientificnameremarks" />
          </el-col>
        </el-form-item>
        <el-form-item label="Choose the correct Scientific Name">
          <el-select
          v-model="form.taxonid"
          placeholder="Please search scientific name"
          filterable
          remote
          clearable
          :remote-method="(query) => remoteMethod(query)"
          :loading="remoteLoading"
          no-match-text="No matched results found."
        >
          <el-option
            v-for="item in taxonOptions"
            :key="item.TaxonID"
            :label="item.TaxonName"
            :value="item.TaxonID"
          >
          </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="Total Number">
          <el-col :span="8"><el-input type="number" :min="0" v-model.number="form.count" /></el-col>
        </el-form-item>
        <el-form-item label="Inventory">
          <el-select  v-model="form.inventory" class="filter-item" placeholder="Please select Inventory type">
            <el-option v-for="item in inventoryTypeOptions" :key="item.inventoryType" :label="item.inventoryType" :value="item.inventoryType" />
          </el-select>
        </el-form-item>
        <el-form-item label="Locality">
          <el-col :span="8">
            <el-input type="textarea" v-model="form.locality" />
          </el-col>
        </el-form-item>
        <el-form-item label="Collector">
          <el-col :span="8">
            <el-input v-model="form.collector" />
          </el-col>
        </el-form-item>
        <el-form-item label="Ident. By">
          <el-col :span="8">
            <el-input v-model="form.identifyby" />
          </el-col>
        </el-form-item>
        <el-form-item label="Recorded By Date">
          <el-col :span="11">
            {{form.recordeddate}}
            <div class="description">
              If there are issues with original collection date, please use the date picker below to select the correct collection date.<br>
              Issues like:<br>
              1. wrong collection date (ex:Specimen collected on 2006-10-18,but it recorded as 2018-10-18)<br>
              2. Unclear date (ex: Summer 1988)<br>
              3. Date range (ex: Nov 1988 - Spring 1989)
            </div>
            <el-date-picker v-model="form.recordeddate" type="date" placeholder="Pick a date" style="width: 100%;" />
          </el-col>
        </el-form-item>
        <el-form-item label="Remarks">
          <el-col :span="8">
            <el-input v-model="form.remarks" ></el-input>
          </el-col>
        </el-form-item>

        <el-form-item label="TL">
          <el-col :span="8"><el-input type="number" :min="0" v-model.number="form.tl" /></el-col>
        </el-form-item>
        <el-form-item label="SL">
          <el-col :span="8"><el-input type="number" :min="0" v-model.number="form.sl" /></el-col>
        </el-form-item>
        <el-form-item label="FL">
          <el-col :span="8"><el-input type="number" :min="0" v-model.number="form.fl" /></el-col>
        </el-form-item>
        <el-form-item label="GM">
          <el-col :span="8"><el-input type="number" :min="0" v-model.number="form.gm" /></el-col>
        </el-form-item>

        <el-form-item label="Report it to your supervisor">
          <el-col :span="8">
            <el-switch v-model="form.recheckedrequried" />
          </el-col>
        </el-form-item>
        <el-form-item label="Report comments">
          <el-col :span="8">
            <el-input type="textarea" v-model="form.recheckcomment" />
          </el-col>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSubmit">Submit & Next</el-button>
        </el-form-item>
      </div>
      <div id="report-form" v-if="showReportForm">
        <span>
          Sorry, we can't find the catalog number, do you want to report it to data management system?
        </span>
        <el-form-item>
          <el-button type="primary" @click="onReport">Yes</el-button>
        </el-form-item>
      </div>
    </el-form>
  </div>
</template>

<script>
import {
  getOst, updateOst,
  reportOst, getTaxon
} from '@/api/table'
import store from '@/store'
import { parseTime } from '@/utils'
import _ from 'lodash'
const originalCollectodate = parseTime(new Date(), '{y}-{m}-{d}')
export default {
  name: 'index',
  created() {
  },
  data() {
    return {
      showRemainForm:false,
      showPrevInput:true,
      showReportForm:false,
      allTaxonOptions:[],
      taxonOptions:[],
      remoteLoading:false,
      keyWord:"",
      inventoryTypeOptions:[{
        inventoryType:"F"
      },
        {inventoryType:"M"}],
      specimenTypeOptions:[{
        specimenType:"Skel"
      },
        {specimenType:"C&S"}],
      form: {
        ostelogyid:'',
        ostcatalog:'',
        tucatalog:'',
        othercatalog:'',
        count:'',
        type:'',
        inventory:'',
        scientificname:'',
        locality:'',
        datecollected:'',
        updateCollectdate:'',
        fieldnumber:'',
        collector:'',
        remarks:'',
        tl:'',
        sl:'',
        fl:'',
        gm:'',
        taxonid:'',
        identifyby:'',
        recordeddate:'',
        scientificnameremarks:'',
        recheckedrequried:false,
        reviewer:store.getters.name,
        recheckcomment:''
      },
      rules: {
        //jarSize:[{ type: 'string', required: true, message: 'Please select Jar Size ', trigger: 'blur' }],
        // country: [{ type: 'string', required: true, message: 'Please input Country', trigger: 'change' }],
        // family: [{ type: 'string', required: true, message: 'Please input Family name', trigger: 'blur' }]
       }
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
    remoteMethod(searchKey){
      if(searchKey !== "") {
        this.remoteLoading = true
        this.keyWord = searchKey
        this.getRemote()
      }else{
        this.taxonOptions = this.allTaxonOptions
      }
    },
    getRemote: _.debounce(function(){
        this.getTaxonList(this.queryParams)
    },300),
    async getTaxonList(params){
      this.remoteLoading = false
      await getTaxon(params).then(response => {
        this.taxonOptions = []
        response.data.items.forEach((item) => {
          this.taxonOptions.push({
            TaxonName: item.FullScientificName,
            TaxonID: item.TaxonID })
        })
      })
    },

    //load address lists
    getOST(){
      this.listLoading = true
      this.$message({
        message: 'Loading a ULM lot',
        type: 'info'
      })
      getOst({"ostcatalog":this.form.ostcatalog}).then(response => {
        if(response.data.total === 0)
          this.showReportForm = true
        else{
          response.data.items.forEach((item) => {
            this.form.ostcatalog = item.ostcatalog,
            this.form.tucatalog = item.tucatalog
            this.form.othercatalog = item.othercatalog
            this.form.count = item.count
            this.form.type = item.type
            this.form.inventory = item.inventory
            this.form.scientificname = item.scientificname
            this.form.locality = item.locality
            this.form.datecollected = item.datecollected
            this.form.updateCollectdate = item.updatecollectdate
            this.form.fieldnumber = item.fieldnumber
            this.form.collector = item.collector
            this.form.remarks = item.remarks
            this.form.tl = item.tl
            this.form.sl = item.sl
            this.form.fl = item.fl
            this.form.gm = item.gm
            this.form.taxonid = item.taxonid
            this.form.identifyby = item.identifyby
            this.form.recordeddate = item.recordeddate
            this.form.scientificnameremarks = item.scientificnameremarks
            this.form.recheckedrequried = item.recheckedrequried
            this.form.recheckcomment = item.recheckcomment
            this.listLoading = false
            this.showRemainForm = true
            this.showPrevInput = false
          })
        }
    })

    },
    onLoad(){
      this.getOST()
    },
    onReport(){
      reportOst({"ostcatalog":this.form.ostcatalog, "user":store.getters.name }).then(response =>{
        this.$message('submit!')
        location.reload()
      })
    },
    onSubmit(){
      this.$refs.form.validate(valid => {
        if(valid){
          this.loading = true
          updateOst(this.form).then(response =>{
            this.$message('submit!')
            location.reload()
          })
        }
        else {
          this.$message('Invalid item detected. Please recheck your inputs.')
          return false
        }
      })

    }
  }
}
</script>

<style scoped>
.description{
  color: #838798;
  line-height: 20px;
}
</style>
