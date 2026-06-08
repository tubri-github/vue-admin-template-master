<template>
  <div class="app-container">
   <el-row :gutter="20">
    <el-col :span="13" class="left-pane">
    <!-- 始终告诉录入员当前在建「根 lot」还是「子节点」 -->
    <div class="form-header" :class="mode">
      <span v-if="mode === 'sub'">
        <i class="el-icon-bottom-right" />
        Adding a <b>SUB-RECORD</b> under <b>{{ subParentLabel }}</b>
        <span class="fh-hint">— taxon &amp; locality inherited, fill the rest</span>
      </span>
      <span v-else>
        <i class="el-icon-folder-add" />
        Cataloging a <b>NEW ROOT LOT</b><span v-if="rootPrimaryId"> &nbsp;(last saved: #{{ rootCatalog }})</span>
      </span>
      <el-button v-if="rootPrimaryId" type="text" class="fh-action" @click="startNewRoot">＋ Start a new lot</el-button>
      <el-button v-if="mode === 'sub'" type="text" class="fh-action" @click="exitSubMode">Cancel sub</el-button>
    </div>
    <el-form ref="form" :model="form" label-width="120px" :class="['lot-form', mode]">
<!--      <el-form-item label="Catalog Number">-->
<!--        <el-input v-model="form.catalogNumber" />-->
<!--      </el-form-item>--> <!-- return auto incement catalog id will have id duplicate issues -->
      <el-form-item label="Node type">
        <el-select v-model="form.collection" class="filter-item" placeholder="What kind of lot is this?">
          <el-option v-for="opt in collectionOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
        <span v-if="mode === 'root'" class="muted">This lot is the tree root (gets a numeric catalog #). Sub-records are added below after saving.</span>
        <span v-else class="muted">Sub-record under <b>{{ subParentLabel }}</b> (gets a TIS-/OST- identifier). Taxon &amp; locality are inherited — adjust the rest.</span>
      </el-form-item>
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
        <el-button type="primary" :loading="saving" @click="onSubmit">
          {{ mode === 'sub' ? 'Add sub-record' : 'Create lot' }}
        </el-button>
        <el-button v-if="mode === 'sub'" @click="exitSubMode">Cancel sub</el-button>
        <el-button v-else @click="onCancel">Cancel</el-button>
      </el-form-item>
    </el-form>
    </el-col>

    <!-- 右侧：collection 树（始终在视野内），可载入已有 lot 来建/管树 -->
    <el-col :span="11" class="right-pane">
      <div class="tree-card">
        <div class="tree-head">Collection tree</div>
        <div class="load-row">
          <el-input v-model="loadCatalog" size="small" placeholder="Catalog # of an existing lot" clearable @keyup.enter.native="loadExisting">
            <template slot="prepend">Catalog #</template>
          </el-input>
          <el-button size="small" type="primary" plain :loading="loadingTree" @click="loadExisting">Load</el-button>
        </div>

        <div v-if="!rootPrimaryId" class="tree-empty">
          Create a lot on the left, or load an existing one above — its collection tree shows here, then click a node to add sub-records.
        </div>
        <template v-else>
          <div class="tree-sub">Tree of <b>#{{ rootCatalog }}</b></div>
          <el-tree
            ref="tree"
            :data="treeData"
            node-key="PrimaryID"
            :expand-on-click-node="false"
            default-expand-all
            highlight-current
            @node-click="onNode"
          >
            <span slot-scope="{ data }" class="tree-row">
              <el-tag size="mini" :type="tagType(data.collection)" effect="plain">{{ data.collection }}</el-tag>
              <b>{{ data.identifier || ('#' + data.CatalogNumber) }}</b>
              <span v-if="data.TotalNumber" class="muted">×{{ data.TotalNumber }}</span>
            </span>
          </el-tree>

          <div class="node-panel">
            <div v-if="!selectedNode" class="muted">Click a node to add a sub-record under it, or delete it.</div>
            <template v-else>
              <p style="margin:0 0 8px">
                <span class="muted">Selected: </span>
                <el-tag size="mini" :type="tagType(selectedNode.collection)" effect="plain">{{ selectedNode.collection }}</el-tag>
                <b>{{ selectedNode.identifier || ('#' + selectedNode.CatalogNumber) }}</b>
              </p>
              <el-button
                v-if="selectedNode.collection !== 'image'"
                type="primary"
                size="small"
                icon="el-icon-plus"
                @click="startAddSub(selectedNode)"
              >Add sub-record under this node</el-button>
              <div v-else class="muted">image is a voucher leaf — cannot have sub-records.</div>
              <el-button
                v-if="selectedNode.parent_id"
                type="danger"
                size="small"
                plain
                icon="el-icon-delete"
                :loading="deleting"
                style="margin-left:8px"
                @click="delNode"
              >Delete{{ childCount(selectedNode) ? (' (+' + childCount(selectedNode) + ')') : '' }}</el-button>
            </template>
          </div>
        </template>
      </div>
    </el-col>
   </el-row>

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
  addNewLot,
  getLotTree,
  getLotsAdvanced,
  deleteSubRecord
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
      // ---- collection tree / mode state ----
      mode: 'root', // 'root' = 建根 lot；'sub' = 在 subParentId 下建子节点
      loadCatalog: '',     // 右侧「载入已有 lot」输入框
      loadingTree: false,
      subParentId: null,
      subParentLabel: '',
      rootPrimaryId: null,
      rootCatalog: null,
      flat: [],
      treeData: [],
      selectedNode: null,
      saving: false,
      deleting: false,
      form: {
        collection: 'fluid', // root 节点类型: fluid|osteology|tissue (image 不能当 root)
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
    },
    collectionOptions() {
      // root 可选 fluid/osteology/tissue；子节点只能 osteology/tissue（image 走单独的图片页）
      if (this.mode === 'sub') {
        return [
          { value: 'osteology', label: 'skeleton / osteology (OST-)' },
          { value: 'tissue', label: 'tissue (TIS-)' }
        ]
      }
      return [
        { value: 'fluid', label: 'fish / fluid (whole specimen, fluid-preserved)' },
        { value: 'osteology', label: 'skeleton / osteology' },
        { value: 'tissue', label: 'tissue' }
      ]
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
      // 校验：preparation 下拉有值时，count 不能为空（0 允许）。
      const badPrep = (this.form.preparation || []).find(
        p => p.preparationType && (p.count === '' || p.count === null || p.count === undefined)
      )
      if (badPrep) {
        this.$message.error('Preparation "' + badPrep.preparationType + '" needs a count (0 is allowed, but it cannot be empty).')
        return
      }

      const searchParams = Object.fromEntries(
        Object.entries(this.form).filter(([_, v]) => v !== '' && v !== null && v !== undefined)
      )
      const isSub = this.mode === 'sub'
      if (isSub) searchParams.parentId = this.subParentId

      this.saving = true
      addNewLot(searchParams).then(response => {
        const items = response.data.items
        if (isSub) {
          this.$message.success('Added sub-record ' + items.identifier)
          // 留在 sub 模式，方便继续在同一父节点下加；重置非继承字段。
          this.enterSubMode(this.subParentId, this.subParentLabel)
          return this.reloadTree()
        }
        // 建了 root：后端直接返回了 PrimaryID，载入树、切到 sub 模式（默认在 root 下加）。
        this.rootCatalog = items.CatalogNumber
        this.rootPrimaryId = items.PrimaryID
        this.$message.success('Created lot #' + items.CatalogNumber + ' — add sub-records below.')
        return this.reloadTree().then(() => this.enterSubMode(items.PrimaryID, '#' + items.CatalogNumber))
      }).catch(err => {
        this.$message.error((err && err.message) || 'Failed to save')
      }).then(() => { this.saving = false })
    },
    onCancel() {
      this.$message({ message: 'cancel!', type: 'warning' })
    },

    // ---------- collection tree ----------
    // 载入一条已有 lot（按 catalog #），拉它的树并进入 sub 模式；预填该 lot 的 taxon+locality 供继承。
    loadExisting() {
      const cat = (this.loadCatalog || '').trim()
      if (!cat) return
      this.loadingTree = true
      getLotsAdvanced({ ids: cat, page: 1, page_size: 1 }).then(res => {
        const row = (res.data.items || [])[0]
        if (!row) { this.$message.warning('No lot found for #' + cat); return }
        this.rootPrimaryId = row.PrimaryID
        this.rootCatalog = row.CatalogNumber
        this.selectedNode = null
        // 预填继承的 taxon + locality（让该 lot 下加子节点时自动带上）
        this.form.localityId = row.Locality1ID || ''
        if (row.Locality1ID) {
          this.localityList = [{ localityID: row.Locality1ID, localityString: row.LocalityString }]
        }
        if (row.TaxonID) {
          this.taxonOptions = [{ TaxonID: row.TaxonID, TaxonName: row.FullScientificName }]
          this.form.zDetermination = [{
            isCurrent: true, taxonId: row.TaxonID,
            determination: { determinerName: '', determinerID: '' }, date: '', remarks: ''
          }]
        }
        return this.reloadTree().then(() => this.enterSubMode(row.PrimaryID, '#' + row.CatalogNumber))
      }).catch(() => { this.$message.error('Failed to load lot') })
        .then(() => { this.loadingTree = false })
    },
    tagType(coll) {
      return { fluid: '', osteology: 'info', tissue: 'success', image: 'warning' }[coll] || ''
    },
    childCount(node) {
      return node ? this.flat.filter(n => n.parent_id === node.PrimaryID).length : 0
    },
    buildTree(items) {
      const byId = {}
      items.forEach(i => { byId[i.PrimaryID] = Object.assign({ children: [] }, i) })
      const roots = []
      items.forEach(i => {
        const node = byId[i.PrimaryID]
        if (i.parent_id && byId[i.parent_id]) byId[i.parent_id].children.push(node)
        else roots.push(node)
      })
      return roots
    },
    reloadTree() {
      if (!this.rootPrimaryId) return Promise.resolve()
      return getLotTree({ primaryId: this.rootPrimaryId }).then(res => {
        this.flat = res.data.items || []
        this.treeData = this.buildTree(this.flat)
        if (this.selectedNode) {
          this.selectedNode = this.flat.find(n => n.PrimaryID === this.selectedNode.PrimaryID) || null
        }
      })
    },
    onNode(data) { this.selectedNode = data },
    startAddSub(node) {
      const label = (node.identifier || ('#' + node.CatalogNumber))
      this.selectedNode = node
      this.enterSubMode(node.PrimaryID, label)
      this.$nextTick(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
    },
    // 进入/继续 sub 模式：保留继承的 taxon(zDetermination) + locality，重置其余字段。
    enterSubMode(parentId, label) {
      this.mode = 'sub'
      this.subParentId = parentId
      this.subParentLabel = label || ''
      this.form.collection = 'tissue'
      this.form.prevNumber = ''
      this.form.dateCataloged = new Date()
      this.form.jarSize = ''
      this.form.catalogerId = ''
      this.form.storage = ''
      this.form.totalNumber = 1
      this.form.typeStatus = ''
      this.form.inventory = ''
      this.form.remarks = ''
      this.form.preparation = [{ preparationType: '', count: '' }]
      // zDetermination(taxon) 与 localityId 保留 = 继承
    },
    exitSubMode() {
      this.mode = 'root'
      this.subParentId = null
      this.subParentLabel = ''
    },
    startNewRoot() {
      // 清空整页，回到建新根 lot。
      this.mode = 'root'
      this.subParentId = null
      this.subParentLabel = ''
      this.rootPrimaryId = null
      this.rootCatalog = null
      this.flat = []
      this.treeData = []
      this.selectedNode = null
      this.form.collection = 'fluid'
      this.form.prevNumber = ''
      this.form.dateCataloged = new Date()
      this.form.jarSize = ''
      this.form.catalogerId = ''
      this.form.storage = ''
      this.form.totalNumber = ''
      this.form.typeStatus = ''
      this.form.inventory = ''
      this.form.remarks = ''
      this.form.localityId = ''
      this.form.zDetermination = [{
        isCurrent: true, taxonId: '', determination: { determinerName: '', determinerID: '' }, date: '', remarks: ''
      }]
      this.form.preparation = [{ preparationType: '', count: '' }]
    },
    delNode() {
      const node = this.selectedNode
      if (!node || !node.parent_id) return
      const kids = this.childCount(node)
      const label = node.identifier || ('#' + node.CatalogNumber)
      const warn = kids
        ? `Delete ${label} AND its ${kids} sub-record(s)? This cannot be undone.`
        : `Delete ${label}? This cannot be undone.`
      this.$confirm(warn, 'Confirm delete', { type: 'warning' }).then(() => {
        this.deleting = true
        return deleteSubRecord(node.PrimaryID, kids > 0)
      }).then(res => {
        this.$message.success('Deleted ' + res.data.items.count + ' record(s)')
        this.selectedNode = null
        return this.reloadTree()
      }).catch(err => {
        if (err === 'cancel' || err === 'close') return
        this.$message.error((err && err.message) || 'Failed to delete')
      }).then(() => { this.deleting = false })
    }
  }
}
</script>

<style scoped>
.line{
  text-align: center;
}
.muted{
  display: block;
  color: #909399;
  font-size: 12px;
  line-height: 1.4;
  margin-top: 4px;
}
/* 模式头条：始终显示在建「根 lot」还是「子节点」 */
.form-header{
  display: flex; align-items: center;
  padding: 10px 14px; border-radius: 6px; margin-bottom: 12px;
  font-size: 14px; font-weight: 500;
}
.form-header i{ font-size: 18px; margin-right: 8px; }
.form-header.root{ background: #ecf5ff; color: #409eff; border: 1px solid #b3d8ff; }
.form-header.sub{ background: #f0f9eb; color: #5daf34; border: 1px solid #c2e7b0; }
.form-header .fh-hint{ font-weight: 400; opacity: .8; margin-left: 4px; }
.form-header .fh-action{ margin-left: auto; padding: 0 6px; }
/* 左右两栏 */
.left-pane{ padding-right: 4px; }
.right-pane .tree-card{ position: sticky; top: 12px; }
.tree-card{
  padding: 14px 16px;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,.06);
}
.tree-head{ font-size: 14px; font-weight: 600; color: #303133; margin-bottom: 12px; }
.tree-row{ display: inline-flex; align-items: center; gap: 8px; }
.load-row{ display: flex; gap: 8px; margin-bottom: 12px; }
.tree-empty{ color: #909399; font-size: 13px; line-height: 1.6; background: #fafafa; border: 1px dashed #dcdfe6; border-radius: 6px; padding: 18px; text-align: center; }
.tree-sub{ font-size: 12px; color: #909399; margin-bottom: 8px; }
.node-panel{ margin-top: 12px; padding-top: 12px; border-top: 1px solid #ebeef5; }
</style>

