<template>
  <div class="app-container">
    <el-form ref="form" :model="form" label-width="120px">
      <div class="taxonomic">
        <el-form-item label="Genus">
          <el-input v-model="form.genus" />
        </el-form-item>
        <el-form-item label="Species">
          <el-input v-model="form.species" />
        </el-form-item>
        <el-form-item label="Subspecies">
          <el-input v-model="form.subspecies" />
        </el-form-item>
        <el-form-item label="Remarks">
            <el-input v-model="form.remarks" />
        </el-form-item>
        <el-form-item label="FullScientificName">
          <el-input v-model="form.fullScientificName" />
        </el-form-item>
        <el-form-item label="Family">
          <el-select
            v-model="form.familyID"
            placeholder="Please search family name"
            filterable
            remote
            clearable
            :remote-method="(query) => remoteMethod(query,'family')"
            :loading="remoteLoading"
            no-match-text="No matched results found."
          >
            <el-option
              v-for="item in familyOptions"
              :key="item.FamilyID"
              :label="item.FamilyName"
              :value="item.FamilyID"
            >
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="Remarks">
          <el-input v-model="form.remarks" />
        </el-form-item>

      </div>
      <el-form-item>
        <el-button type="primary" @click="onSubmit">Create</el-button>
<!--        <el-button @click="onCancel">Cancel</el-button>-->
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import _ from 'lodash'
import { addTaxon, getFamily, updateLot } from '@/api/table'

export default {
  name: 'taxonomicform',
  data() {
    return {
      form: {
        genus:'',
        species:'',
        subspecies:'',
        remarks:'',
        fullScientificName: '',
        familyID:''
      },
      familyOptions:[],
      remoteLoading:false,
      keyWord:"",
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
    remoteMethod(searchKey,type){
      if(searchKey !== "") {
        this.remoteLoading = true
        this.keyWord = searchKey
        this.getRemote(type)
      }
    },
    getRemote: _.debounce(function(type){
      if(type==='family')
        this.getFamilyList(this.queryParams)
    },300),
    async getFamilyList(params){
      this.remoteLoading = false
      await getFamily(params).then(response => {
        this.familyOptions = []
        response.data.items.forEach((item) => {
          this.familyOptions.push({
            FamilyName: item.FamilyName,
            FamilyID: item.FamilyID })
        })
      })
    },

    onSubmit() {
      addTaxon(this.form).then(response =>{
        this.$message('submit!')
      })
    },
  }
}
</script>

<style scoped>

</style>
