<template>
  <div class="app-container">
    <el-row type="flex" :gutter="20" style="height:3em">
      <el-col :span="6">
        <el-input v-model="form.catalogNumber" placeholder="32350"></el-input>
      </el-col>
      <el-col :span="3">
        <el-button @click="viewLotByCatalogNO" type="primary" size="medium">Enter Catalog ID</el-button>
      </el-col>
      <el-colW v-if="showForm">
        <el-button @click="viewDeaccesionHistory" type="warning" size="medium">Deaccesion History</el-button>
      </el-colW>
    </el-row>
    <el-form v-if="showForm" ref="form" :model="form" label-width="120px">
      <el-form-item label="Scientific Name">
        <el-col :span="11">
          <span>{{form.FullScientificName}}</span>
        </el-col>
      </el-form-item>
      <el-form-item label="Total Number">
        <el-col :span="11">
          <span>{{form.totalNumber}}</span>
        </el-col>
      </el-form-item>
      <el-form-item label="JarSize">
        <el-col :span="11">
          <span>{{form.JarSize}}</span>
        </el-col>
      </el-form-item>
      <el-form-item label="Deaccesion Date">
        <el-col :span="11">
          <el-date-picker v-model="form.dateDeaccesion" type="date" placeholder="Pick a date" style="width: 100%;" />
        </el-col>
      </el-form-item>
      <el-form-item label="Number Deaccessioned">
        <el-input type="number" :min="1" v-model.number="form.numberDeaccessioned" />
      </el-form-item>
      <el-form-item label="Remarks">
        <el-input type="textarea" v-model="form.remarks" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="deccession">Deaccession</el-button>
      </el-form-item>
    </el-form>

    <el-dialog
      title="Confirm"
      :visible.sync="confirmAlertVisible"
      width="30%"
    >
      <span>Do you really want to deaccession {{this.form.numberDeaccessioned}} specimens for Lot {{this.form.catalogNumber }}: {{this.form.FullScientificName }} ? </span>
      <span slot="footer" class="dialog-footer">
      <el-button type="danger" @click="deacessionProceed">Proceed</el-button>
      <el-button @click="confirmAlertVisible = false">Cancel</el-button>
    </span>

    </el-dialog>

    <el-dialog
      title="Deaccession History"
      :visible.sync="deaccesionHistoryVisible"
      width="60%"
    >
      <h3>Catalog Number: {{form.catalogNumber}}</h3>
      <el-table
        :key="tableKey"
        v-loading="listLoading"
        :data="deaccesionHistorylist"
        border
        fit
        highlight-current-row
        style="width: 100%;"
        show-overflow-tooltip="true"
      >
        <el-table-column label="Date Deaccesion" align="center">
          <template slot-scope="{row}">
            <span>{{ row.dateDeaccesion | parseTime('{y}-{m}-{d} {h}:{i}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Number Deaccesioned ">
          <template slot-scope="{row}">
            <span>{{ row.numberDeaccessioned }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Remarks" align="center">
          <template slot-scope="{row}">
            <span>{{ row.remarks }}</span>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>

</template>

<script>
import { getLots, deaccessionLot, getDeaccessions } from '@/api/table'
import { parseTime } from '@/utils'
const dateDeaccesion = parseTime(new Date(), '{y}-{m}-{d}')
export default {
  name: 'deaccesion',
  data(){
    return{
      showForm:false,
      confirmAlertVisible:false,
      deaccesionHistoryVisible:false,
      form:{
        primaryID:'',
        dateDeaccesion,
        catalogNumber:'',
        FullScientificName:'',
        totalNumber:'',
        JarSize:'',
        numberDeaccessioned:1,
        remarks:''
      },
      deaccesionHistorylist:null,
      tableKey:0,
      listLoading:false
    }

  },
  methods:{
    viewLotByCatalogNO(){
      getLots({ 'ids': this.form.catalogNumber===''?1:this.form.catalogNumber , 'limit':0 }).then(response => {
        let catalogList = response.data.items
        let total = response.data.total
        if(total === 0 || total > 1){
          this.$message('Catalog Number Not Found or Duplicate Catalog Numbers, please try again.')
        }
        else{
          this.showForm = true
          this.form.primaryID = catalogList[0].MainPrimaryID
          this.form.FullScientificName = catalogList[0].FullScientificName
          this.form.totalNumber = catalogList[0].TotalNumber
          this.form.JarSize = catalogList[0].JarSize
        }
      })
    },
    deccession(){
      if(this.form.totalNumber === 0){
        this.$message({
          message: 'Total number of specimens in this lot is 0, you can not deaccession it any more.',
          type: 'error'
        })
      }
      else if(this.form.numberDeaccessioned > this.form.totalNumber){
        this.$message({
          message: 'The number deaccessioned should equal or smaller than total number of the specimens.',
          type: 'error'
        })
      }
      else{
          this.confirmAlertVisible = true
      }
    },
    deacessionProceed(){
      this.confirmAlertVisible = false
      deaccessionLot(this.form).then(()=>{
        this.$message({
          message: 'Submit!',
          type: 'primary'
        })
        location.reload()
      })
    },
    viewDeaccesionHistory(){
      this.deaccesionHistoryVisible = true
      this.getDeaccesionHistory()
    },
    getDeaccesionHistory(){
      this.listLoading = true
      this.$message({
        message: 'loading deaccesion history...',
        type: 'info'
      })
      getDeaccessions({ 'primaryID': this.form.primaryID }).then(response => {
        this.deaccesionHistorylist = response.data.items
        this.catalogList = response.data.items
        this.total = response.data.total
        setTimeout(() => {
          this.listLoading = false
        }, 1.5 * 1000)
      })
    }
  }
}
</script>

<style scoped>
</style>
