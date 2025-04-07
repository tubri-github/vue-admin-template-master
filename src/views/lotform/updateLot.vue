<template>
  <div class="app-container">
    <el-form ref="form" :model="form" label-width="120px">
      <el-form-item label="CatalogNumber">
        <span>{{ this.currCatalogNo}}</span>
      </el-form-item>
<!--      return auto incement catalog id will have id duplicate issues-->
      <el-form-item label="Prev Number">
        <el-input v-model="form.prevNumber" />
      </el-form-item>
      <el-form-item label="Date Cataloged">
        <el-col :span="11">
          <el-date-picker v-model="form.dateCataloged" type="date" placeholder="Pick a date" style="width: 100%;" />
        </el-col>
      </el-form-item>
      <el-form-item label="Jar Size">
        <el-select v-model="form.jarSize" class="filter-item" placeholder="Please select Jar Size">
            <el-option v-for="item in jarSizeTypeOptions" :key="item.JarSizeID" :label="item.JarSize" :value="item.JarSize" />
        </el-select>
      </el-form-item>
      <el-form-item label="Cataloger">
        <el-select v-model="form.catalogerId" filterable placeholder="please select cataloger">
          <el-option v-for="item in catalogerList" :key="item.StaffID" :label="item.StaffName" :value="item.StaffID" />
        </el-select>
      </el-form-item>
      <el-form-item label="Storage">
        <el-input v-model="form.storage" />
      </el-form-item>
      <el-form-item label="Total Number">
        <el-input type="number" :min="0" v-model.number="form.totalNumber" />
      </el-form-item>
      <el-form-item label="zDetermination">
        <el-button @click="addNewDetermination">Add</el-button>
        <el-table
          ref="multipleTable"
          :data="form.zDetermination"
          tooltip-effect="dark"
          style="width: 100%"
          >
          <el-table-column
            prop="isCurrent"
            label="isCurrent"
            width="100">
            <template slot-scope="{row}">
              <el-checkbox v-model="row.isCurrent"></el-checkbox>
            </template>
          </el-table-column>
          <el-table-column
            prop="taxonId"
            label="Taxon Id"
            width="180">
            <template slot-scope="{row}">
            <el-select
              v-model="row.taxonId"
              @change="(value) => onSelectChange(row,value)"
              placeholder="Please search taxonomic name"
              filterable
              remote
              clearable
              :remote-method="(query) => remoteMethod(query,'taxon')"
              :loading="remoteLoading"
              no-match-text="No match results found."
            >
              <el-option
                v-for="item in taxonOptions"
                :key="item.TaxonID"
                :label="item.TaxonName"
                :value="item.TaxonID"
              >
              </el-option>
            </el-select>
            </template>
          </el-table-column>
          <el-table-column
            prop="determiner"
            label="Determiner"
            width="180">
            <template slot-scope="{row}">
              <el-select
                v-model="row.determination.determinerID"
                placeholder="Please select determiner"
                filterable
                clearable
              >
                <el-option
                  v-for="item in determinerList"
                  :key="item.determinerID"
                  :label="item.determinerName"
                  :value="item.determinerID"
                >
                </el-option>
              </el-select>
            </template>
          </el-table-column>
          <el-table-column
            prop="date"
            label="Date"
            width="180">
            <template slot-scope="{row}">
              <el-date-picker v-model="row.date"  type="date" placeholder="Pick a date" style="width: 100%;" />
            </template>
          </el-table-column>
          <el-table-column
            prop="remarks"
            label="Remarks"
            width="180">
            <template slot-scope="{row}">
              <el-input v-model="row.remarks" type="text" style="width: 100%;" />
            </template>
          </el-table-column>
          <el-table-column
            label="Action">
<!--            <el-button-->
<!--              size="mini"-->
<!--            >Edit</el-button>-->
            <template slot-scope="{row,$index}">
            <el-button
              size="mini"
              type="danger" @click="handleDeterminationDelete(row,$index)">Delete</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-form-item>
      <el-form-item label="Type Status">
        <el-input v-model="form.typeStatus" />
      </el-form-item>
      <el-form-item label="Preparation">
        <el-button @click="addNewPreparation">Add</el-button>
        <el-table
          :data="form.preparation"
          border
          style="width: 100%">
          <el-table-column
            prop="preparation"
            label="Preparation Type"
            width="180">
            <template slot-scope="{row}">
              <el-select
                v-model="row.preparationType"
                placeholder="Please select determiner"
                filterable
                clearable
              >
                <el-option
                  v-for="item in preparationList"
                  :key="item.preparationTypeID"
                  :label="item.preparationType"
                  :value="item.preparationType"
                >
                </el-option>
              </el-select>
            </template>
          </el-table-column>
          <el-table-column
            prop="count"
            label="count"
            width="180">
            <template slot-scope="{row}">
              <el-input type="number" :min="0" v-model.number="row.count" @focus="onfoucs(row)" />
            </template>
          </el-table-column>
<!--          <el-table-column-->
<!--            prop="oste-catalog"-->
<!--            label="Osteology Catalog Number"-->
<!--            width="180">-->
<!--            <template slot-scope="{row}">-->
<!--              <div v-if="row.preparationType === 'C&S' || row.preparationType === 'Skel'">-->
<!--                <el-checkbox v-if="row.preparationOsteologyCatalogNumber === undefined|| row.preparationOsteologyCatalogNumber === null || row.preparationOsteologyCatalogNumber === ''" v-model="row.preparationIfNew"> Create a new one? Or </el-checkbox>-->
<!--                <div>Update:<el-input :disabled="row.preparationIfNew" type="number" :min="0" v-model.number="row.preparationOsteologyCatalogNumber" @focus="onfoucs(row)" /></div>-->
<!--              </div>-->
<!--            </template>-->
<!--          </el-table-column>-->
          <el-table-column
            label="Action">
<!--            <el-button-->
<!--              size="mini"-->
<!--              >Edit</el-button>-->
            <template slot-scope="{row,$index}">
            <el-button
              size="mini"
              type="danger" @click="handlePreparationDelete(row,$index)">Delete</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-form-item>
      <el-form-item label="Inventory">
        <el-input v-model="form.inventory" />
      </el-form-item>
      <el-form-item label="Remarks">
        <el-input v-model="form.remarks" />
      </el-form-item>
      <el-form-item label="Locality">
          <el-select
            v-model="form.localityId"
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
      <el-form-item>
              <el-button type="primary" @click="onSubmit">Update</el-button>
<!--              <el-button @click="onCancel">Cancel</el-button>-->
            </el-form-item>
    </el-form>
  </div>
</template>

<script>
import {
  getJarSizes,
  getStaff,
  getTaxon,
  getDeterminers,
  getPreparation,
  getLocality,
  updateLot,
  getLots, getDeterminationListByPrimaryID, getPreparationListByPrimaryID
} from '@/api/table'
import _ from 'lodash'
import { parseTime } from '@/utils'
const dateCataloged = parseTime(new Date(), '{y}-{m}-{d}')
export default {
  name: 'LotComplexTable',
  props:['currCatalogNo', 'currPrimaryID'],
  data() {
    return {
      jarSizeTypeOptions:[{

        }],
      catalogerList:[{}],
      determinerList:[{}],
      preparationList:[{}],
      localityList:[],
      allLocalityList:[],
      //debounce - remote search
      remoteLoading:false,
      keyWord:"",
      taxonOptions:[],
      allTaxonOptions:[],
      form: {
        primaryID:'',
        prevNumber: '',
        dateCataloged,
        jarSize: '',
        catalogerId: '',
        storage: '',
        totalNumber: '',
        scientificName:'',
        zDetermination: [{
          determinationID:null,
          isCurrent: true,
          taxonId: '',
          determination:{
            determinerName: '',
            determinerID:'',
          },
          scientificName:'',
          date: '',
          remarks: ''
        }],
        preparation: [{
          preparationID:null,
          preparationType: '',
          count: '',
          preparationOsteologyCatalogNumber:'',
          preparationIfNew:false,
        }],
        typeStatus: '',
        inventory: '',
        remarks: '',
        localityId: ''
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
  created() {
    // this.getList()
    this.getJarSizes()
    this.getStaffList()
    this.getPreparationList()
    this.getDeterminersList()

  },
  mounted() {
    this.getLot(this.currCatalogNo)

  },

  methods: {
    onSelectChange(row,selectedValue) {
      if(row.isCurrent){
        const selectedTaxon = this.taxonOptions.find(item => item.TaxonID === selectedValue);
        if(selectedTaxon){
          this.form.scientificName = selectedTaxon.TaxonName
        }
      }
    },
    getLot(catalogNo){
      this.listLoading = true
      this.$message({
        message: 'loading Lot information...',
        type: 'info'
      })
      // getLots({ 'ids': this.searchForm.lowCatalogNumber===''?1:this.searchForm.lowCatalogNumber, 'limit': limit }).then(response => {
      getLots({
        'ids': catalogNo,'limit': 1
      }).then(response => {
        const data = response.data.items[0]
        console.log(data,response.data.items[0])
        this.form.primaryID = data.PrimaryID
        this.form.prevNumber = data.PrevNumber
        this.form.dateCataloged = data.DateCataloged
        this.form.jarSize = data.JarSize
        this.form.catalogerId = data.CatalogerID
        this.form.storage = data.Storage
        this.form.totalNumber = data.TotalNumber
        // this.form.date = data.date
        this.form.remarks = data.PrimaryRemarks
        // this.form.preparation = data.Preparation
        this.form.typeStatus = data.TypeStatus
        this.form.inventory = data.Inventory
        this.localityList =[{
          localityID:data.Locality1ID,
          localityString: data.LocalityString
        }]
        this.form.localityId = data.Locality1ID

        this.total = response.data.total
        setTimeout(() => {
          this.listLoading = false
        }, 1.5 * 1000)
        this.getDeterminationListByPrimaryID()
        this.getPreparationListByPrimaryID()
      })
    },
    getDeterminationListByPrimaryID(){
      this.listLoading = true
      this.$message({
        message: 'loading Detemination List...',
        type: 'info'
      })
      getDeterminationListByPrimaryID({
        'primaryID': this.currPrimaryID
      }).then(response => {
        this.taxonOptions=[]
        this.form.zDetermination.splice(0,this.form.zDetermination.length)
        response.data.items.forEach((item) => {
          this.taxonOptions.push({
            TaxonName: item.FullScientificName,
            TaxonID: item.TaxonID })
          this.form.zDetermination.push({
            isCurrent: item.IsCurrent,
            determinationID:item.DeterminationID,
            determination:{
              determinerID: item.Determiner==null?null:parseInt(item.Determiner),
              determinerName: item.DeterminerName == null? null: item.DeterminerName
            },
            taxonId: item.TaxonID,
            scientificName:item.FullScientificName,
            date:item.Date1,
            remarks: item.DeterminationRemarks
            })
        })
        setTimeout(() => {
          this.listLoading = false
        }, 1.5 * 1000)
      })
    },
    getPreparationListByPrimaryID(){
      this.listLoading = true
      this.$message({
        message: 'loading Preparation List...',
        type: 'info'
      })
      this.form.preparation.splice(0,this.form.preparation.length)
      getPreparationListByPrimaryID({
        'primaryID': this.currPrimaryID
      }).then(response => {
        response.data.items.forEach((item) => {
          this.form.preparation.push({
            preparationID:item.PreparationID,
            preparationType:item.PreparationType,
            count: item.Count,
            preparationOsteologyCatalogNumber: item.osteologyCatalogNumber,
            preparationIfNew: false
          })
        })
        setTimeout(() => {
          this.listLoading = false
        }, 1.5 * 1000)
      })

    },
    remoteMethod(searchKey,type){
      if(searchKey !== "") {
        this.remoteLoading = true
        this.keyWord = searchKey
        this.getRemote(type)
      }else{
        this.taxonOptions = this.allTaxonOptions
        this.localityList = this.allLocalityList
      }
    },
    getRemote: _.debounce(function(type){
      if(type==='taxon')
        this.getTaxonList(this.queryParams)
      else if(type==='locality')
        this.getLocalityList(this.queryParams)
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
    async getLocalityList(params) {
      await getLocality(params).then(response => {
        this.localityList = []
        response.data.items.forEach((item) => {
          this.localityList.push({
            localityID:item.Locality1ID,
            localityString: item.LocalityString
          })
        })
        this.remoteLoading = false
      })
    },
    addNewDetermination(){
      this.form.zDetermination = this.form.zDetermination.map((determination) => ({
        ...determination,
        isCurrent: false,
      }));
      let newDetermination = {
        determinationID:null,
        isCurrent: true,
        taxonId: '',
        determination:{
          determinerName: '',
          determinerID:'',
        },
        scientificName: '',
        date: '',
        remarks: ''
      }
      this.form.zDetermination.unshift(newDetermination)
    },
    handleDeterminationDelete(row, index) {
      this.$notify({
        title: 'Success',
        message: 'Delete Successfully',
        type: 'success',
        duration: 2000
      })
      this.form.zDetermination.splice(index, 1)
      if(this.form.zDetermination.length > 0) this.form.zDetermination[0].isCurrent=true
    },
    addNewPreparation(){
      let newPreparation = {
        preparationID:null,
        preparation: '',
        count:''
      }
      this.form.preparation.unshift(newPreparation)
    },
    handlePreparationDelete(row, index) {
      this.$notify({
        title: 'Success',
        message: 'Delete Successfully',
        type: 'success',
        duration: 2000
      })
      this.form.preparation.splice(index, 1)
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
    getDeterminersList(){
      this.listLoading = true
      this.$message({
        message: 'Loading Determiners...',
        type: 'info'
      })
      getDeterminers().then(response => {
        this.determinerList = [{determinerID:null, determinerName: null}]
        response.data.items.forEach((item) => {
          this.determinerList.push({
            determinerID: item.DeterminerID,
            determinerName: item.DeterminerName })
        })
        this.listLoading = false
      })
    },
    getStaffList() {
      this.listLoading = true
      this.$message({
        message: 'Loading Staff...',
        type: 'info'
      })
      getStaff().then(response => {
        this.catalogerList = []
        response.data.items.forEach((item) => {
          this.catalogerList.push({
            StaffName:item.StaffName,
            StaffID: item.SatffID
          })
        })
          this.listLoading = false
      })
    },

    getPreparationList(){
      this.listLoading = true
      this.$message({
        message: 'Loading Preparations...',
        type: 'info'
      })
      getPreparation().then(response => {
        this.preparationList = [{ preparationType: null,
          preparationTypeID:null}]
        response.data.items.forEach((item) => {
          this.preparationList.push({
            preparationType: item.PreparationType,
            preparationTypeID: item.PreparationTypeID
          })
        })
        this.listLoading = false
      })
    },

    handleMultipleLists(){
      this.form.zDetermination.forEach((item) =>{
        if(item.isCurrent == true){
          this.form.scientificName = item.scientificName
        }
      })
    },
    onfoucs(val) {
      const selected = false //聚焦取消勾选
      //this.$refs.multipleTable.toggleRowSelection(val.row, selected) //ref定义在el-table中
    },
    onSubmit() {
      // this.handleMultipleLists()
      updateLot(this.form).then(response =>{
        this.$message('submit!')

      })
    },
    onCancel() {
    }
  }
}
</script>

<style scoped>
.line{
  text-align: center;
}
</style>

