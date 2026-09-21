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
          <el-form-item label="Last Name" required>
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
          <el-form-item label="Last Name" required>
            <el-input v-model="form.lastName" />
          </el-form-item>
          <el-form-item label="First Name" required>
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
          <el-form-item label="Initials" required>
            <el-input v-model="form.initials" />
          </el-form-item>
        </div>
      <el-form-item>
        <el-button type="primary" :loading="saving" @click="onSubmit">Create</el-button>
        <el-button @click="onCancel">Cancel</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import { addNewLoanPeople, addNewStaff, addNewCollector, addNewDeterminer } from '@/api/table'

// 每种人存在不同的表，成功后回的主键列也不同 —— 建完要把这个号报给 curator，
// 否则界面上"成功"和"失败"的差别只有一句提示的颜色（他会以为存进去了）。
const TYPES = {
  LoanPeople: { label: 'Loan People', api: addNewLoanPeople, idKey: 'AgentID', required: ['lastName'] },
  Determiner: { label: 'Determiner', api: addNewDeterminer, idKey: 'DeterminerID', required: ['lastName'] },
  Collector: { label: 'Collector', api: addNewCollector, idKey: 'CollectorID', required: ['lastName'] },
  Staff: { label: 'Staff', api: addNewStaff, idKey: 'SatffID', required: ['lastName', 'firstName', 'initials'] }
}

const LABELS = {
  lastName: 'Last Name',
  firstName: 'First Name',
  initials: 'Initials'
}

function emptyForm(personType) {
  return {
    personType,
    lastName: '', firstName: '', middleName: '', groupName: '', title: '',
    abbreviation: '', institution: '', phone1: '', phone2: '', fax: '', email: '',
    jobTitle: '', address: '', city: '', state: '', country: '', postalCode: '',
    remarks: '', agentType: '', initials: ''
  }
}

export default {
  data() {
    return {
      form: emptyForm('LoanPeople'), // loanPeople,staff,collectors,determiner
      saving: false
    }
  },
  methods: {
    onSubmit() {
      const type = TYPES[this.form.personType]
      if (!type) return

      const missing = type.required
        .filter(f => !String(this.form[f] || '').trim())
        .map(f => LABELS[f] || f)
      if (missing.length) {
        this.$message.error(`${missing.join(' and ')} ${missing.length > 1 ? 'are' : 'is'} required for ${type.label}.`)
        return
      }

      this.saving = true
      type.api(this.form).then(response => {
        const created = (response.data.items || [])[0] || {}
        const id = created[type.idKey]
        const name = [this.form.firstName, this.form.lastName].filter(Boolean).join(' ')
        this.$message.success(id
          ? `${type.label} "${name}" created — ${type.idKey} ${id}. You can now pick this person in the loan / gift form.`
          : `${type.label} "${name}" created.`)
        // 清空表单，保留当前类型：curator 常常要连着录好几个人
        this.form = emptyForm(this.form.personType)
      }).catch(() => {
        // 具体错误由 request.js 的拦截器统一弹（它会把后端的 detail 显示出来），
        // 这里只要保证表单不被清空、curator 能改完重试。
      }).finally(() => {
        this.saving = false
      })
    },
    onCancel() {
      this.form = emptyForm(this.form.personType)
      this.$message({
        message: 'Form cleared.',
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

