<template>
  <div class="app-container">
    <div style="float: left;width:500px">
      <el-row class="tac">
        <el-col :span="12">
          <h5>Tables/Columns</h5>
          <el-menu
            default-active="2"
            class="el-menu-vertical-demo"
            @open="handleOpen"
            @close="handleClose">
            <el-submenu index="1">
              <template slot="title">
                <span>Table:Primary</span>
              </template>
              <el-menu-item-group>
                <template slot="title">Columns</template>

                <el-menu-item index="1-1"><el-tag
                  class="el-tag--warning"
                  :type="warning">PrimaryID</el-tag>
                </el-menu-item>
                <el-menu-item index="1-2"><el-tag
                  class="el-tag--warning"
                  :type="warning">CatalogNumber</el-tag></el-menu-item>
                <el-menu-item index="1-3"><el-tag
                  class="el-tag--warning"
                  :type="warning">ScientificName</el-tag></el-menu-item>
                <el-menu-item index="1-4"><el-tag
                  class="el-tag--warning"
                  :type="warning">DateCataloged</el-tag></el-menu-item>
                <el-menu-item index="1-5"><el-tag
                  class="el-tag--warning"
                  :type="warning">CatalogerID</el-tag></el-menu-item>
                <el-menu-item index="1-6"><el-tag
                  class="el-tag--warning"
                  :type="warning">TotalNumber</el-tag></el-menu-item>
                <el-menu-item index="1-7"><el-tag
                  class="el-tag--warning"
                  :type="warning">StorageJarSize</el-tag></el-menu-item>
                <el-menu-item index="1-8"><el-tag
                  class="el-tag--warning"
                  :type="warning">TypeStatus</el-tag></el-menu-item>
                <el-menu-item index="1-9"><el-tag
                  class="el-tag--warning"
                  :type="warning">PrevNumber</el-tag></el-menu-item>
                <el-menu-item index="1-10"><el-tag
                  class="el-tag--warning"
                  :type="warning">Inventory</el-tag></el-menu-item>
                <el-menu-item index="1-11"><el-tag
                  class="el-tag--warning"
                  :type="warning">Remarks</el-tag></el-menu-item>
                <el-submenu index="1-12">
                  <template slot="title"><el-tag
                    class="el-tag--warning"
                    :type="warning">LocalityID</el-tag>
                  </template>
                  <span>Table:Locality</span>
                  <el-menu-item index="1-12-1"><el-tag
                    class="el-tag--warning"
                    :type="warning">FieldNo</el-tag></el-menu-item>
                  <el-menu-item index="1-12-2"><el-tag
                    class="el-tag--warning"
                    :type="warning">LocalityString</el-tag></el-menu-item>
                  <el-menu-item index="1-12-3">...</el-menu-item>
                </el-submenu>
                <el-menu-item index="1-13"><el-tag
                  class="el-tag--warning"
                  :type="warning">TimeStampModified</el-tag></el-menu-item>
              </el-menu-item-group>
            </el-submenu>
          </el-menu>
        </el-col>
      </el-row>

    </div>
    <div class="filter-container">
      <div class="filter-display-selection">
        Table/Columns:<el-tag
        v-for="tag in displayTags"
        :key="tag.name"
        closable
        :type="tag.type"
      >
        {{ tag.name }}
      </el-tag>
      </div>
      <div class="filter-display-stats">
        Stats:<el-tag
        v-for="tag in displayStatsTags"
        :key="tag.name"
        closable
        :type="tag.type"
      >
        <el-dropdown>
            <span class="el-dropdown-link">
              {{ tag.name }}(Sum)<i class="el-icon-arrow-down el-icon--right"></i>
            </span>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item command="a">{{ tag.name }}(Count)</el-dropdown-item>
            <el-dropdown-item command="b">{{ tag.name }}(Max)</el-dropdown-item>
            <el-dropdown-item command="c">{{ tag.name }}(Min)</el-dropdown-item>
            <el-dropdown-item command="c">{{ tag.name }}(Avg)</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </el-tag>
      </div>
      <div class="filter-display-sort">
        Sort:<el-tag
        v-for="tag in displaySortTags"
        :key="tag.name"
        closable
        :type="tag.type"
      >
        <el-dropdown>
            <span class="el-dropdown-link">
              {{ tag.name }}(Descending)<i class="el-icon-arrow-down el-icon--right"></i>
            </span>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item command="a">{{ tag.name }}(Descending)</el-dropdown-item>
            <el-dropdown-item command="b">{{ tag.name }}(Ascending)</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </el-tag>
      </div>
      <div class="filter-display-filter">
        Filters:<el-tag
        v-for="tag in displayFilterTags"
        :key="tag.name"
        closable
        :type="tag.type"
      >
        <el-dropdown>
            <span class="el-dropdown-link">
              {{ tag.name }}(&gt;)5<i class="el-icon-arrow-down el-icon--right"></i>
            </span>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item command="a">{{ tag.name }}(=)5</el-dropdown-item>
            <el-dropdown-item command="b">{{ tag.name }}(&lt;)5</el-dropdown-item>
            <el-dropdown-item command="b">{{ tag.name }}(&ge;)5</el-dropdown-item>
            <el-dropdown-item command="b">{{ tag.name }}(&le;)5</el-dropdown-item>
            <el-dropdown-item command="b">{{ tag.name }}(not equal)5</el-dropdown-item>
            <el-dropdown-item command="b">{{ tag.name }}(between)</el-dropdown-item>
            <el-dropdown-item command="b">{{ tag.name }}(like)</el-dropdown-item>
            <el-dropdown-item command="b">{{ tag.name }}(in)</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </el-tag>
      </div>
      <el-button v-waves class="filter-item" type="primary" icon="el-icon-search" @click="handleFilter">
        Search
      </el-button>
      <el-button class="filter-item" style="margin-left: 10px;" type="primary" icon="el-icon-edit" @click="handleCreate">
        Add
      </el-button>
      <el-button v-waves :loading="downloadLoading" class="filter-item" type="primary" icon="el-icon-download" @click="handleDownload">
        Export
      </el-button>
      <!--      <el-checkbox v-model="showReviewer" class="filter-item" style="margin-left:15px;" @change="tableKey=tableKey+1">-->
      <!--        reviewer-->
      <!--      </el-checkbox>-->
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
      <el-table-column label="PrimaryID" prop="id" sortable="custom" align="center" width="80" :class-name="getSortClass('id')">
        <template slot-scope="{row}">
          <span>{{ row.id }}</span>
        </template>
      </el-table-column>
      <el-table-column label="CatalogNumber" width="150px" align="center">
        <template slot-scope="{row}">
          <span>{{ row.timestamp | parseTime('{y}-{m}-{d} {h}:{i}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="ScientficName" min-width="150px">
        <template slot-scope="{row}">
          <span class="link-type" @click="handleUpdate(row)">{{ row.title }}</span>
          <el-tag>{{ row.type | typeFilter }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="DateCataloged" width="110px" align="center">
        <template slot-scope="{row}">
          <span>{{ row.author }}</span>
        </template>
      </el-table-column>
      <el-table-column v-if="showReviewer" label="CatalogerID" width="110px" align="center">
        <template slot-scope="{row}">
          <span style="color:red;">{{ row.reviewer }}</span>
        </template>
      </el-table-column>
      <el-table-column label="TotalNumber" width="80px">
        <template slot-scope="{row}">
          <svg-icon v-for="n in + row.importance" :key="n" icon-class="star" class="meta-item__icon" />
        </template>
      </el-table-column>
      <el-table-column label="Storage" align="center" width="95">
        <template slot-scope="{row}">
          <span v-if="row.pageviews" class="link-type" @click="handleFetchPv(row.pageviews)">{{ row.pageviews }}</span>
          <span v-else>0</span>
        </template>
      </el-table-column>
      <el-table-column label="JarSize" class-name="status-col" width="100">
        <template slot-scope="{row}">
          <el-tag :type="row.status | statusFilter">
            {{ row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="TypeStatus" class-name="status-col" width="100">
        <template slot-scope="{row}">
          <el-tag :type="row.status | statusFilter">
            {{ row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="PrevNumber" class-name="status-col" width="100">
        <template slot-scope="{row}">
          <el-tag :type="row.status | statusFilter">
            {{ row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Inventory" class-name="status-col" width="100">
        <template slot-scope="{row}">
          <el-tag :type="row.status | statusFilter">
            {{ row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Remarks" class-name="status-col" width="100">
        <template slot-scope="{row}">
          <el-tag :type="row.status | statusFilter">
            {{ row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Locality1ID" class-name="status-col" width="100">
        <template slot-scope="{row}">
          <el-tag :type="row.status | statusFilter">
            {{ row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="TimeStampModified" class-name="status-col" width="100">
        <template slot-scope="{row}">
          <el-tag :type="row.status | statusFilter">
            {{ row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Actions" align="center" width="230" class-name="small-padding fixed-width">
        <template slot-scope="{row,$index}">
          <el-button type="primary" size="mini" @click="handleUpdate(row)">
            Edit
          </el-button>
          <el-button v-if="row.status!='deleted'" size="mini" type="danger" @click="handleDelete(row,$index)">
            Delete
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total>0" :total="total" :page.sync="listQuery.page" :limit.sync="listQuery.limit" @pagination="getList" />

    <el-dialog :title="textMap[dialogStatus]" :visible.sync="dialogFormVisible">
      <el-form ref="dataForm" :rules="rules" :model="temp" label-position="left" label-width="70px" style="width: 400px; margin-left:50px;">
        <el-form-item label="Type" prop="type">
          <el-select v-model="temp.type" class="filter-item" placeholder="Please select">
            <el-option v-for="item in calendarTypeOptions" :key="item.key" :label="item.display_name" :value="item.key" />
          </el-select>
        </el-form-item>
        <el-form-item label="Date" prop="timestamp">
          <el-date-picker v-model="temp.timestamp" type="datetime" placeholder="Please pick a date" />
        </el-form-item>
        <el-form-item label="Title" prop="title">
          <el-input v-model="temp.title" />
        </el-form-item>
        <el-form-item label="Status">
          <el-select v-model="temp.status" class="filter-item" placeholder="Please select">
            <el-option v-for="item in statusOptions" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="Imp">
          <el-rate v-model="temp.importance" :colors="['#99A9BF', '#F7BA2A', '#FF9900']" :max="3" style="margin-top:8px;" />
        </el-form-item>
        <el-form-item label="Remark">
          <el-input v-model="temp.remark" :autosize="{ minRows: 2, maxRows: 4}" type="textarea" placeholder="Please input" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">
          Cancel
        </el-button>
        <el-button type="primary" @click="dialogStatus==='create'?createData():updateData()">
          Confirm
        </el-button>
      </div>
    </el-dialog>

    <el-dialog :visible.sync="dialogPvVisible" title="Reading statistics">
      <el-table :data="pvData" border fit highlight-current-row style="width: 100%">
        <el-table-column prop="key" label="Channel" />
        <el-table-column prop="pv" label="Pv" />
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="dialogPvVisible = false">Confirm</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { getList } from '@/api/table'
import waves from '@/directive/waves' // waves directive
import { parseTime } from '@/utils'
import Pagination from '@/components/Pagination' // secondary package based on el-pagination
const calendarTypeOptions = [
  { key: 'CN', display_name: 'China' },
  { key: 'US', display_name: 'USA' },
  { key: 'JP', display_name: 'Japan' },
  { key: 'EU', display_name: 'Eurozone' }
]
// arr to obj, such as { CN : "China", US : "USA" }
const calendarTypeKeyValue = calendarTypeOptions.reduce((acc, cur) => {
  acc[cur.key] = cur.display_name
  return acc
}, {})
export default {
  name: 'ComplexTable',
  components: { Pagination },
  directives: { waves },
  filters: {
    statusFilter(status) {
      const statusMap = {
        published: 'success',
        draft: 'info',
        deleted: 'danger'
      }
      return statusMap[status]
    },
    typeFilter(type) {
      return calendarTypeKeyValue[type]
    }
  },
  data() {
    return {
      tableKey: 0,
      list: null,
      total: 0,
      listLoading: true,
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
      sortOptions: [{ label: 'ID Ascending', key: '+id' }, { label: 'ID Descending', key: '-id' }],
      statusOptions: ['published', 'draft', 'deleted'],
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
        { name: 'Locality.TotalNumber', type: 'warning' },
      ],
      displaySortTags: [
        { name: 'Primary.PrimaryID', type: 'warning' },
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
  created() {
    this.getList()
  },
  methods: {
    getList() {
      this.listLoading = true
      getList(this.listQuery).then(response => {
        this.list = response.data.items
        this.total = response.data.total
        // Just to simulate the time of the request
        setTimeout(() => {
          this.listLoading = false
        }, 1.5 * 1000)
      })
    },
    handleFilter() {
      this.listQuery.page = 1
      this.getList()
    },
    handleModifyStatus(row, status) {
      this.$message({
        message: '操作Success',
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
    handleCreate() {
      this.resetTemp()
      this.dialogStatus = 'create'
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    createData() {
      this.$refs['dataForm'].validate((valid) => {
        if (valid) {
          this.temp.id = parseInt(Math.random() * 100) + 1024 // mock a id
          this.temp.author = 'vue-element-admin'
          createArticle(this.temp).then(() => {
            this.list.unshift(this.temp)
            this.dialogFormVisible = false
            this.$notify({
              title: 'Success',
              message: 'Created Successfully',
              type: 'success',
              duration: 2000
            })
          })
        }
      })
    },
    handleUpdate(row) {
      this.temp = Object.assign({}, row) // copy obj
      this.temp.timestamp = new Date(this.temp.timestamp)
      this.dialogStatus = 'update'
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    updateData() {
      this.$refs['dataForm'].validate((valid) => {
        if (valid) {
          const tempData = Object.assign({}, this.temp)
          tempData.timestamp = +new Date(tempData.timestamp) // change Thu Nov 30 2017 16:41:05 GMT+0800 (CST) to 1512031311464
          updateArticle(tempData).then(() => {
            const index = this.list.findIndex(v => v.id === this.temp.id)
            this.list.splice(index, 1, this.temp)
            this.dialogFormVisible = false
            this.$notify({
              title: 'Success',
              message: 'Update Successfully',
              type: 'success',
              duration: 2000
            })
          })
        }
      })
    },
    handleDelete(row, index) {
      this.$notify({
        title: 'Success',
        message: 'Delete Successfully',
        type: 'success',
        duration: 2000
      })
      this.list.splice(index, 1)
    },
    handleFetchPv(pv) {
      fetchPv(pv).then(response => {
        this.pvData = response.data.pvData
        this.dialogPvVisible = true
      })
    },
    handleDownload() {
      this.downloadLoading = true
      import('@/vendor/Export2Excel').then(excel => {
        const tHeader = ['timestamp', 'title', 'type', 'importance', 'status']
        const filterVal = ['timestamp', 'title', 'type', 'importance', 'status']
        const data = this.formatJson(filterVal)
        excel.export_json_to_excel({
          header: tHeader,
          data,
          filename: 'table-list'
        })
        this.downloadLoading = false
      })
    },
    formatJson(filterVal) {
      return this.list.map(v => filterVal.map(j => {
        if (j === 'timestamp') {
          return parseTime(v[j])
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
<style>
.el-table__header-wrapper{
  overflow: auto;
}
</style>
