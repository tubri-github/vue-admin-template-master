<template>
  <div class="app-container">
    <el-form ref="form" :model="form" label-width="120px">
<!--      <el-form-item label="Catalog Number">-->
<!--        <el-input v-model="form.catalogNumber" />-->
<!--      </el-form-item>--> <!-- return auto incement catalog id will have id duplicate issues -->
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
              placeholder="Please search taxonomic name"
              filterable
              remote
              clearable
              :remote-method="(query) => remoteMethod(query,'taxon')"
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
      <el-form-item label="Field #" v-if="currLocalityID != null"  >
        {{ currField }}
        <el-input type="hidden" v-model="form.localityId"/>
      </el-form-item >
      <el-form-item v-else label="Locality(search by field #)">
          <el-select
            v-model="form.localityId"
            placeholder="Please select a locality string"
            filterable
            clearable
            style="width:100%"
            remote
            :remote-method="(query) => remoteMethod(query,'locality')"
            :loading="remoteLoading"
            no-match-text="No matched results found."
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
        <el-button type="primary" @click="onSubmit">Create</el-button>
        <el-button @click="onCancel">Cancel</el-button>
      </el-form-item>
    </el-form>
    <el-dialog :visible.sync="newCatalogNumberVisible">
      <el-input v-model="newCatalogNumber" placeholder="Sorry, there is an issue happen when the api created the new lot record." style="width:400px;max-width:100%;" />
      <el-button type="primary" icon="el-icon-document" @click="handleCopy(newCatalogNumber)">
        copy
      </el-button>
    </el-dialog>
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
  addNewLot
} from '@/api/table'
import clip from '@/utils/clipboard'
import _ from 'lodash'
const dateCataloged = new Date()
export default {
  name: 'LotNewComplexTable',
  props:['sendMsg','currLocalityID','currField'],
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
      newCatalogNumberVisible:false,
      newCatalogNumber:'',
      form: {
        prevNumber: '',
        dateCataloged,
        jarSize: '',
        catalogerId: '',
        storage: '',
        totalNumber: '',
        zDetermination: [{
          isCurrent: true,
          taxonId: '',
          determination:{
            determinerName: '',
            determinerID:'',
          },
          date: '',
          remarks: ''
        }],
        preparation: [{
          preparationType: '',
          count: ''
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
    //this.getLocalityList()
    // this.getTaxons()
    // this.getCollectors()
  },
  mounted() {
    if(!this.currLocalityID)
    this.form.localityId = this.currLocalityID
  },
  methods: {
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
        isCurrent: true,
        taxonId: '',
        determination:{
          determinerName: '',
          determinerID:'',
        },
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
        this.determinerList = []
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
        this.preparationList = []
        response.data.items.forEach((item) => {
          this.preparationList.push({
            preparationType: item.PreparationType,
            preparationTypeID: item.PreparationTypeID
          })
        })
        this.listLoading = false
      })
    },
    async handleCopy(text) {
      try {
        await navigator.clipboard.writeText(text)
        this.$message.success('Copied!')
      } catch (err) {
        this.$message.error('Copy failed')
      }
    },
    onfoucs(val) {
      const selected = false //聚焦取消勾选
      //this.$refs.multipleTable.toggleRowSelection(val.row, selected) //ref定义在el-table中
    },
    onSubmit() {
      console.log('typeof dateCataloged:', typeof this.form.dateCataloged, this.form.dateCataloged)
      const searchParams = Object.fromEntries(
        Object.entries(this.form).filter(([_, v]) => v !== '' && v !== null && v !== undefined)
      )


      addNewLot(searchParams).then(response =>{
        this.$message('submit!')
        this.newCatalogNumberVisible = true
        this.newCatalogNumber = response.data.items.CatalogNumber
        //location.reload()
      })
    },
    onCancel() {
      this.$message({
        message: 'cancel!',
        type: 'warning'
      })
    }
  }
}
</script>

<style scoped>
.line{
  text-align: center;
}
</style>

