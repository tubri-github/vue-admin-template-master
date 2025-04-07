<template>
  <div class="app-container">
    <el-form ref="form" :model="form" label-width="120px" :rules="rules">
      <el-form-item label="Dataset" >
        <el-col :span="11">
          <el-select v-model="form.dataset" class="filter-item" placeholder="Please select dataset:ULM/LATech">
            <el-option v-for="item in datasetTypeOptions" :key="item.dataset" :label="item.dataset" :value="item.dataset" />
          </el-select>
        </el-col>
      </el-form-item>
      <el-form-item label="Prev Number">
        <el-col :span="8">
          <el-input v-if="showPrevInput" v-model="form.prevNumber" />
          <span v-if="showRemainForm">{{form.dataset}} - {{ form.prevNumber }}</span>
        </el-col>
      </el-form-item>
<!--      <el-form-item>-->
<!--        <el-button type="primary" @click="onLoad">Search</el-button>-->
<!--      </el-form-item>-->
      <div id="remain-form" v-if="showRemainForm">
        <el-form-item label="Jar Size"  prop="jarSize">
          <el-col :span="11">
            <el-select  style="border: 3px solid #f4516c" v-model="form.jarSize" class="filter-item" placeholder="Please select Jar Size">
              <el-option v-for="item in jarSizeTypeOptions" :key="item.JarSizeID" :label="item.JarSize" :value="item.JarSize" />
            </el-select>
          </el-col>
        </el-form-item>

        <el-form-item label="Collection Date">
          <el-col :span="11">
            {{form.originalCollectodate}}
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
        <el-form-item label="Family" prop="family">
          <el-col :span="8">
            <el-input :min="0" v-model.number="form.family" />
          </el-col>
        </el-form-item>
        <el-form-item label="Genus">
          <el-col :span="8">
            <el-input :min="0" v-model.number="form.genus" />
          </el-col>
        </el-form-item>
        <el-form-item label="Species">
          <el-col :span="8">
            <el-input :min="0" v-model.number="form.species" />
          </el-col>
        </el-form-item>
        <el-form-item label="Total Number">
          <el-col :span="8"><el-input type="number" :min="0" v-model.number="form.totalNumber" /></el-col>
        </el-form-item>
        <el-form-item label="Type Status">

          <el-col :span="8"><el-switch v-model="form.typeStatus" /></el-col>
        </el-form-item>
        <el-form-item label="Country" prop="contry">
          <el-col :span="8">
            <el-select v-model="form.country" class="filter-item" placeholder="Please select Country">
              <el-option v-for="item in countryOptions" :key="item.countryID" :label="item.countryName" :value="item.countryName" />
            </el-select>
          </el-col>
        </el-form-item>
        <el-form-item label="State">
          <el-col :span="8">
            <el-select v-model="form.state" class="filter-item" placeholder="Please select state">
              <el-option v-for="item in statesOptions" :key="item.stateID" :label="item.stateName" :value="item.stateName" />
            </el-select>
          </el-col>
        </el-form-item>
        <el-form-item label="County">
          <el-col :span="8">
            <el-select v-model="form.county" class="filter-item" placeholder="Please select state">
              <el-option v-for="item in countyOptions" :key="item.countyID" :label="item.countyName" :value="item.countyName" />
            </el-select>
          </el-col>
        </el-form-item>
        <el-form-item label="Waterbody">
          <el-col :span="8"><el-input v-model="form.waterbody" /></el-col>
        </el-form-item>
        <el-form-item label="Drainage">
          <el-col :span="8"><el-input v-model="form.drainage" /></el-col>
        </el-form-item>
        <el-form-item label="Locality">
          <el-col :span="8">
            <el-input v-model="form.locality" />
          </el-col>
        </el-form-item>
        <el-form-item label="Collector">
          <el-col :span="8">
            <el-input v-model="form.collector" />
          </el-col>
        </el-form-item>
        <el-form-item label="Remarks">
          <el-col :span="8">
            <el-input v-model="form.remarks" ></el-input>
          </el-col>
        </el-form-item>

        <el-form-item label="Report it to your supervisor">
          <el-col :span="8">
            <el-switch v-model="form.reviewrequired" />
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
        <el-form-item label="Jar size">
          <el-col :span="11">
            <el-select  style="border: 3px solid #f4516c" v-model="form.reportjarSize" class="filter-item" placeholder="Please select Jar Size">
              <el-option v-for="item in jarSizeTypeOptions" :key="item.JarSizeID" :label="item.JarSize" :value="item.JarSize" />
            </el-select>
          </el-col>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onReport">Yes</el-button>
        </el-form-item>
      </div>
    </el-form>
  </div>
</template>

<script>
import {
  getContinent,
  getCountry,
  getCounty,
  getJarSizes,
  getStates,
  getULM, reportULM,
  updateULMLot
} from '@/api/table'
import store from '@/store'
import { parseTime } from '@/utils'
const originalCollectodate = parseTime(new Date(), '{y}-{m}-{d}')
export default {
  name: 'ulmEditView',
  props:['currCatalogNo',],
  created() {
    this.getJarSizes()
    this.getCountries()
    this.getStates()
    this.getCounty()
  },
  data() {
    return {
      showRemainForm:true,
      showPrevInput:false,
      showReportForm:false,
      datasetTypeOptions:[{
        dataset:"ULM"
      },
        {dataset:"LATech"}],
      jarSizeTypeOptions:[{

      }],
      statesOptions:[{
      }],
      countryOptions:[{
      }],
      countyOptions:[{}],
      form: {
        dataset:'ULM',
        PrimaryID:'',
        prevNumber: '',
        family:'',
        genus:'',
        species:'',
        originalCollectodate,
        updateCollectdate:'',
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
        reviewrequired:false,
        recheckcomment:'',
        reportjarSize:'',
        editor:'',
        reviewer:store.getters.name
      },
      rules: {
        jarSize:[{ type: 'string', required: true, message: 'Please select Jar Size ', trigger: 'blur' }],
        // country: [{ type: 'string', required: true, message: 'Please input Country', trigger: 'change' }],
        // family: [{ type: 'string', required: true, message: 'Please input Family name', trigger: 'blur' }]
       }
    }
  },
  mounted() {
    this.form.prevNumber = this.currCatalogNo
    this.getULM()
  },
  methods:{
    //load address lists
    getStates() {
      this.listLoading = true
      this.$message({
        message: 'Loading State data...',
        type: 'info'
      })
      getStates().then(response => {
        this.statesOptions = []
        response.data.items.forEach((item) => {
          this.statesOptions.push({
            stateID: item.StateID,
            stateName: item.State })
        })
        this.listLoading = false
      })
    },
    getCountries() {
      this.listLoading = true
      this.$message({
        message: 'Loading Countries data...',
        type: 'info'
      })
      getCountry().then(response => {
        this.countryOptions = []
        response.data.items.forEach((item) => {
          this.countryOptions.push({
            countryID: item.CountryID,
            countryName: item.Country })
        })
        this.listLoading = false
      })
    },
    getContinent() {
      this.listLoading = true
      this.$message({
        message: 'Loading Continent data...',
        type: 'info'
      })
      getContinent().then(response => {
        this.continentOptions = []
        response.data.items.forEach((item) => {
          this.continentOptions.push({
            continentID: item.ContinentID,
            continentName: item.Continent })
        })
        this.listLoading = false
      })
    },
    getCounty() {
      this.listLoading = true
      this.$message({
        message: 'Loading county data...',
        type: 'info'
      })
      getCounty().then(response => {
        this.countyOptions = []
        response.data.items.forEach((item) => {
          this.countyOptions.push({
            countyID: item.countyID,
            countyName: item.County })
        })
        this.listLoading = false
      })
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
    getULM(){
      this.listLoading = true
      this.$message({
        message: 'Loading a ULM lot',
        type: 'info'
      })
      getULM({"prevNumber":this.form.prevNumber,"dataset":this.form.dataset}).then(response => {
        if(response.data.total === 0)
          this.showReportForm = true
        else{
          response.data.items.forEach((item) => {
            this.form.PrimaryID = item.PrimaryID
            this.form.dataset = item.dataset
            this.form.prevNumber = item.PrevNumber
            this.form.originalCollectodate = item.collectordate
            this.form.updateCollectdate = item.updatecollectordate
            this.form.jarSize = item.JarSize
            this.form.totalNumber = item.TotalNumber
            this.form.remarks = item.Remarks
            this.form.typeStatus = item.TypeStatus
            this.form.family = item.Family
            this.form.genus = item.genus
            this.form.species = item.species
            this.form.country = item.country
            this.form.county = item.county
            this.form.state = item.state
            this.form.waterbody = item.waterbody
            this.form.drainage = item.drainage
            this.form.locality = item.Location
            this.form.collector = item.collectorname
            this.form.reviewrequired = item.recheckrequired
            this.form.recheckcomment = item.recheckcomment
            this.form.editor = item.editor
            this.listLoading = false
            this.showRemainForm = true
            this.showPrevInput = false
          })
        }
    })

    },

    onReport(){
      reportULM({"prevNumber":this.form.prevNumber,"dataset":this.form.dataset,"jarSize":this.form.reportjarSize, "user":store.getters.name }).then(response =>{
        this.$message('submit!')
        location.reload()
      })
    },
    onSubmit(){
      this.$refs.form.validate(valid => {
        if(valid){
          this.loading = true
          updateULMLot(this.form).then(response =>{
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
