<template>
  <div class="app-container">
    <el-form ref="form" :model="form" label-width="120px">
      <el-form-item label="Type">
        <el-radio-group v-model="form.personType">
          <el-radio :label="'LoanPeople'"  >Loan People</el-radio>
          <el-radio :label="'Determiner'"  >Determiners</el-radio>
          <el-radio :label="'Collector'">Collectors</el-radio>
          <el-radio :label="'Staff'">Staff</el-radio>
        </el-radio-group>
      </el-form-item>
        <div v-if="form.personType !== 'Staff' " class="external-people">
          <el-form-item label="Last Name">
            <el-input v-model="form.lastName" />
          </el-form-item>
          <el-form-item label="First Name">
            <el-input v-model="form.firstName" />
          </el-form-item>
          <el-form-item label="Middle Name">
            <el-input v-model="form.middleName" />
          </el-form-item>
          <el-form-item label="Group Name">
            <el-input v-model="form.groupName" />
          </el-form-item>
          <el-form-item label="Title">
            <el-input v-model="form.title" />
          </el-form-item>
          <el-form-item label="Abbreviation">
            <el-input v-model="form.abbreviation" />
          </el-form-item>
          <el-form-item label="Institution">
            <el-input v-model="form.institution" />
          </el-form-item>
          <el-form-item label="Phone1">
            <el-input v-model="form.phone1" />
          </el-form-item>
          <el-form-item label="Phone2">
            <el-input v-model="form.phone2" />
          </el-form-item>
          <el-form-item label="Fax">
            <el-input v-model="form.fax" />
          </el-form-item>
          <el-form-item label="Email">
            <el-input v-model="form.email" />
          </el-form-item>
          <el-form-item label="Job Title">
            <el-input v-model="form.jobTitle" />
          </el-form-item>
          <el-form-item label="Address">
            <el-input v-model="form.address" />
          </el-form-item>
          <el-form-item label="City">
            <el-input v-model="form.city" />
          </el-form-item>
          <el-form-item label="State">
            <el-input v-model="form.state" />
          </el-form-item>
          <el-form-item label="Country">
            <el-input v-model="form.country" />
          </el-form-item>
          <el-form-item label="Postal Code">
            <el-input v-model="form.postalCode" />
          </el-form-item>
          <el-form-item label="Remarks">
            <el-input v-model="form.remarks" />
          </el-form-item>
        </div>
        <div v-else class="staff" >
          <el-form-item label="Last Name">
            <el-input v-model="form.lastName" />
          </el-form-item>
          <el-form-item label="First Name">
            <el-input v-model="form.firstName" />
          </el-form-item>
          <el-form-item label="Middle Initial">
            <el-input v-model="form.middleName" />
          </el-form-item>
          <el-form-item label="Title">
            <el-input v-model="form.title" />
          </el-form-item>
          <el-form-item label="Agent Type">
            <el-input v-model="form.agentType" />
          </el-form-item>
          <el-form-item label="Initials">
            <el-input v-model="form.initials" />
          </el-form-item>
        </div>
      <el-form-item>
        <el-button type="primary" @click="onSubmit">Create</el-button>
        <el-button @click="onCancel">Cancel</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import { addNewLoanPeople, addNewStaff, addNewCollector, addNewDeterminer } from '@/api/table'

export default {
  data() {
    return {
      form: {
        personType: 'LoanPeople', // loanPeople,staff,collectors,determiner
        lastName: '',
        firstName: '',
        middleName: '',
        groupName: '',
        title: '',
        abbreviation: '',
        institution: '',
        phone1: '',
        phone2: '',
        fax: '',
        email: '',
        jobTitle: '',
        address: '',
        city: '',
        state: '',
        country: '',
        postalCode: '',
        remarks: '',
        agentType: '',
        initials: ''
      }
    }
  },
  methods: {
    onSubmit() {
      if(this.form.personType === 'LoanPeople')
        addNewLoanPeople(this.form).then(() =>{
           this.$message('submit!')
        })
      else if (this.form.personType ==='Determiner'){
        addNewDeterminer(this.form).then(() =>{
          this.$message('submit!')
        })
      }
      else if (this.form.personType ==='Collector'){
        addNewCollector(this.form).then(() =>{
          this.$message('submit!')
        })
      }
      else{
        addNewStaff(this.form).then(() =>{
          this.$message('submit!')
        })
      }
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

