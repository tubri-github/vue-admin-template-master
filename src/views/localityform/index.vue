<template>
  <div class="app-container">
    <el-form ref="form" :model="form" label-width="120px">
      <el-form-item label="Field No">
        <el-input v-model="form.fieldNo" />
      </el-form-item>
      <el-form-item label="Locality String">
        <el-input v-model="form.localityString" />
      </el-form-item>
      <el-form-item label="Drainage">
        <el-input v-model="form.drainage" />
      </el-form-item>
      <el-form-item label="WaterBody">
        <el-input v-model="form.waterbody" />
      </el-form-item>
      <el-form-item label="Continent">
        <GeoField v-model="form.continent" level="continent" placeholder="Select or type a continent" />
      </el-form-item>
      <el-form-item label="Country">
        <GeoField v-model="form.country" level="country" placeholder="Select or type a country" @picked="onGeoPick('country', $event)" />
      </el-form-item>
      <el-form-item label="State">
        <GeoField v-model="form.state" level="state" placeholder="Select or type a state/province" @picked="onGeoPick('state', $event)" />
      </el-form-item>
<!--      <el-form-item label="Island">-->
<!--        <el-input v-model="form.island" />-->
<!--      </el-form-item>-->
<!--      <el-form-item label="Island Group">-->
<!--        <el-input v-model="form.islandGroup" />-->
<!--      </el-form-item>-->
      <el-form-item label="County">
        <GeoField v-model="form.county" level="county" placeholder="Select or type a county" @picked="onGeoPick('county', $event)" />
      </el-form-item>
      <el-form-item label="Lat">
        <el-input v-model="form.latitude" />
      </el-form-item>
      <el-form-item label="Lon">
        <el-input v-model="form.longitude" />
      </el-form-item>
      <el-form-item>
        <el-button size="small" type="primary" plain icon="el-icon-map-location" @click="geoVisible = true">
          Georeference from locality text (GEOLocate)
        </el-button>
        <span class="muted" style="margin-left:8px">Auto-suggest lat/long from the locality text; adjust on the map below.</span>
      </el-form-item>
      <el-form-item>
        <GoogleMap v-on:updatedPosition="updatedPosition"></GoogleMap>
      </el-form-item>
      <GeorefDialog :visible.sync="geoVisible" :locality="geoLocObj" @picked="onGeoPicked" />
      <!-- value-format 必须给：不给的话 picker 发的是带 Z 的完整 ISO（本地零点转 UTC），
           后端 timestamp 列收到会报错，且东半球时区会整整差一天 -->
      <el-form-item label="Date">
        <el-col :span="11">
          <el-date-picker v-model="form.startDate" type="date" value-format="yyyy-MM-dd" placeholder="Start date" style="width: 100%;" />
        </el-col>
        <el-col :span="2" class="line"> - </el-col>
        <el-col :span="11">
          <el-date-picker v-model="form.endDate" type="date" value-format="yyyy-MM-dd" placeholder="End date" style="width: 100%;" />
        </el-col>
      </el-form-item>
      <!-- VerbatimDate 是标签上的原文（varchar），库里都是 '7 September 1950' / '0/0/1876' / '21/8/1958'
           这种形式；日期控件既表达不了、又会逼人编一个精确日期，所以用纯文本 -->
      <el-form-item label="Verbatim Date">
        <el-col :span="11">
          <el-input v-model="form.verbatimDate" placeholder="Exactly as written on the label, e.g. 7 September 1950" />
        </el-col>
        <el-col :span="13">
          <span class="muted" style="margin-left:8px">Transcribe the date as written — do not normalise or guess.</span>
        </el-col>
      </el-form-item>
      <el-form-item label="Remark">
        <el-input v-model="form.remark" />
      </el-form-item>
      <el-form-item label="Inventory">
        <el-input v-model="form.inventory" />
      </el-form-item>
      <el-form-item label="Verbatim Collectors">
        <el-input v-model="form.verbatimCollectors" />
      </el-form-item>
      <el-form-item label="Collectors">
          <el-button @click="addNewCollectors">Add</el-button>
          <el-table
            :data="form.zCollectorsLocality"
            border
            style="width: 100%">
            <el-table-column
              prop="collectorNames"
              label="Collector Name"
              width="180">
              <template slot-scope="{row}">
                <el-select
                  v-model="row.collectorID"
                  placeholder="Please search collector name"
                  filterable
                  remote
                  clearable
                  :remote-method="(query) => remoteMethod(query)"
                  :loading="remoteLoading"
                  no-match-text="No match results found."
                >
                  <el-option
                    v-for="item in collectorsOptions"
                    :key="item.collectorID"
                    :label="item.collectorFirstName + ' ' + item.collectorLastName"
                    :value="item.collectorID"
                  >
                  </el-option>
                </el-select>
              </template>
            </el-table-column>
            <el-table-column
              label="Action">
              <template slot-scope="{row,$index}">
                <el-button
                size="mini"
                type="danger" @click="handleCollectorsDelete(row,$index)">Delete</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-form-item>
          <!-- FieldNo 允许为空（现场不一定给得到），所以是提醒不是拦截 -->
          <el-alert
            v-if="!hasFieldNo"
            type="warning"
            show-icon
            :closable="false"
            title="No Field No. given"
            description="This locality will be saved without a field number. You can still find it by locality text, but lots cannot be matched to it by field number later. Add one now if you have it."
            style="margin-bottom: 12px;"
          />
          <!-- 同样只提醒不拦截：库里已有 EndDate 早于 StartDate 的历史记录，
               硬拦会导致那些记录连打开保存都做不到。同一天算正常。 -->
          <el-alert
            v-if="dateRangeReversed"
            type="warning"
            show-icon
            :closable="false"
            title="End date is before start date"
            :description="'Collecting ends ' + form.endDate + ' but starts ' + form.startDate + '. It will be saved as entered — please check the dates.'"
            style="margin-bottom: 12px;"
          />
          <el-button type="primary" :loading="submitting" @click="onSubmit">{{ isEdit ? 'Save changes' : 'Create' }}</el-button>
          <el-button @click="onCancel">Cancel</el-button>
    </el-form>
    <el-divider content-position="left"> Please first create a locality in order to proceed with adding lots. </el-divider>
    <el-form :class="{ 'disabled': !isLotSectionEnabled }" label-width="120px">
      <!--lot list item-->
      <el-form-item label="Add Lot Details">
        <el-button @click="addNewLot">Add</el-button>
        <el-table
          :data="lotForm.loanDetails"
          border
          style="width: 100%">
          <el-table-column
            prop="CatalogNumber"
            label="Catalog Number"
            width="200">
            <template slot-scope="{row}">
              <el-input v-model.lazy="row.CatalogNumber" @focus="onfoucs(row)" @blur="blurUsername(row)" />
            </template>
          </el-table-column>
          <el-table-column
            prop="CatalogNumber"
            label="Catalog Number"
            width="200" v-if="false">
            <template slot-scope="{row}">
              <el-input v-model="row.PrimaryID" @focus="onfoucs(row)"/>
            </template>
          </el-table-column>
          <el-table-column
            prop="CatalogString"
            label="Catalog String"
            width="200">
            <template slot-scope="{row}">
              <span> {{row.PrimaryString}}</span>
            </template>
          </el-table-column>
          <el-table-column
            label="Quantity"
            width="100">
            <template slot-scope="{row}">
              <el-input type="number" v-model.number="row.Quantity" @focus="onfoucs(row)"/>
            </template>
          </el-table-column>

          <el-table-column
            prop="Remarks"
            label="Remarks"
            width="180"> <template slot-scope="{row}">
            <el-input v-model.number="row.Remarks" @focus="onfoucs(row)"/>
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
                type="danger" @click="handleDelete(row,$index)">Delete</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-form-item>
    </el-form>
    <el-dialog :visible.sync="addLotDialogFormVisible">
      <LotNewComplexTable :currLocalityID="currLocalityID" :currField = "currField" :key="'lotNewComplexTable'"></LotNewComplexTable>
    </el-dialog>
  </div>
</template>

<script>
import {
  getCountry,
  getStates,
  getContinent,
  getCounty,
  getCollectors,
  addNewLocality, addNewLoan, addNewStaff, getLocalityById, updateLocality
} from '@/api/table'
import _ from 'lodash'
import { parseTime } from '@/utils'
import GoogleMap from '@/components/GoogleMap'
import GeorefDialog from '@/components/GeorefDialog'
import GeoField from '@/components/GeoField'
import LotNewComplexTable from '@/views/lotform/index'
import Pagination from '@/components/Pagination'
import LotComplexTable from '@/views/lotform/updateLot'
const dateCataloged = parseTime(new Date(), '{y}-{m}-{d}')
export default {
  components: { GoogleMap, GeorefDialog, GeoField, LotNewComplexTable, LotComplexTable },
  props: {
    // 传入则进入编辑模式：按 Locality1ID 加载已有产地、提交走 update（复用 add 表单，同 loan/lots）
    externalLocalityId: { type: [String, Number], default: null }
  },
  data() {
    return {
      geoVisible: false,
      isEdit: false,
      submitting: false,
      statesOptions:[{
      }],
      countryOptions:[{
      }],
      continentOptions:[{
      }],
      countyOptions:[{}],
      allCollectorsOptions:[],
      collectorsOptions:[],
      remoteLoading:false,
      keyWord:"",
      form: {
        fieldNo: '',
        localityString: '', //dropdown?
        drainage: '',
        waterbody: '',
        country: '', //dropdown
        // island: '',
        // islandGroup: '',
        continent: '', //dropdown
        state: '',  //dropdown
        county: '', //dropdown
        latitude: '',
        longitude: '', //map?
        startDate: '',
        endDate: '',
        verbatimDate: '', //datepicker
        remark: '',
        inventory: '',
        verbatimCollectors: '',
        zCollectorsLocality: [
          {
            collectorName: '',
            collectorID:''
          }]
      },
    //  add-lot
      currLocalityID:'',
      currField:'',
      addLotDialogFormVisible:false,
      isLotSectionEnabled: false,
      lotForm: {
        loanId:'',
        status:'edit', //"edit" or "new"
        loanNumber: '',
        loanNumberNoType:'',
        transactionType: 'Loan',
        closed: this.ifClosed ? 'NO' : 'YES',
        dateClosed: '',
        text1: '',
        text2: '',
        loanPplID:'',
        loanPeopleFullName:'',
        loanPeopleTitle:'',
        agentID: '',
        loanAgents: '',
        organizationID: '',
        groupName:'',
        shipToAddress: '',
        shipToCity: '',
        shipToState: '',
        shipToZipCode: '',
        shipToCountry: '',
        shipToRemark: '',
        shipToMethod: '',
        address: '',
        country: '',
        city :'',
        state :'',
        postalCode:'',
        loanDetails: [{
          PrimaryID:'',
          CatalogNumber:'',
          PrimaryString: '',
          Quantity:0,
          QuantityReturned:0,
          QuantityResolved:0,
          DescriptionOfMaterial:'',
          InComments:'',
          OutComments:'',
          Remarks:'',
          FieldNo:'',
          FullScientificName:'',
          ScientificName:'',
          LocalityString:'',
          LocalityContinent:'',
          LocalityState:'',
          LocalityCounty:'',
          Drainage:'',
          StartDate:'',
          Lon:'',
          Lat:'',
          VerbatimCollectors:'',
          TotalNumber:0,
          FamilyName:''
        }],
        updatedLoanDetails: [],
        deletedLoanDetails: [],
        lotsTotal:0
      },
    }
  },
  created() {
    this.getStates()
    this.getCountries()
    this.getContinent()
    this.getCounty()
    if (this.externalLocalityId) this.loadLocality(this.externalLocalityId)
  },
  computed:{
    queryParams(){
      return {
        pageSize:-1, //query all data
        pageNumber:1,
        keyWord:this.keyWord
      }
    },
    hasFieldNo(){
      return !!(this.form.fieldNo && String(this.form.fieldNo).trim())
    },
    // 两个都是 value-format="yyyy-MM-dd" 的字符串，直接比大小即可；相等（同一天）算正常
    dateRangeReversed(){
      const s = this.form.startDate, e = this.form.endDate
      return !!(s && e && String(e) < String(s))
    },
    geoLocObj(){
      return {
        locality: this.form.localityString || this.form.drainage || '',
        country: this.form.country, state: this.form.state, county: this.form.county
      }
    }
  },
  methods: {
    addNewLot(){
      this.addLotDialogFormVisible = true;
    },
    enableLotSection(locality) {
      this.currLocalityID = locality
      this.currField = this.form.fieldNo
      this.isLotSectionEnabled = true
    },

    // 编辑模式：按 id 加载已有产地填进 form（字段名映射 locality1 列 → form）
    loadLocality(id) {
      getLocalityById(id).then(response => {
        const d = (response.data.items || [])[0]
        if (!d) { this.$message.error('Locality not found'); return }
        this.isEdit = true
        Object.assign(this.form, {
          fieldNo: d.FieldNo || '', localityString: d.LocalityString || '', drainage: d.Drainage || '',
          waterbody: d.WaterBody || '', country: d.Country || '', continent: d.Continent || '',
          state: d.State || '', county: d.County || '', latitude: d.Lat != null ? d.Lat : '',
          longitude: d.Lon != null ? d.Lon : '',
          // 后端回的是 ISO datetime，picker 现在按 yyyy-MM-dd 取值，截到日期部分才认
          startDate: (d.StartDate || '').slice(0, 10), endDate: (d.EndDate || '').slice(0, 10),
          verbatimDate: d.VerbatimDate || '', remark: d.Remarks || '', inventory: d.Inventory || '',
          verbatimCollectors: d.VerbatimCollectors || ''
        })
        // 已有的采集人（以前没加载，表格永远只有一行空的，改了还会被静默丢弃）
        const collectors = response.data.collectors || []
        this.form.zCollectorsLocality = collectors.map(c => ({
          collectorName: c.collectorName || '', collectorID: c.collectorID
        }))
        // el-select 是 remote 搜索的，没有候选项就显示不出名字：把已有的人预置进候选
        this.collectorsOptions = collectors.map(c => ({
          collectorID: c.collectorID,
          collectorFirstName: c.collectorName || '',
          collectorLastName: ''
        }))
      }).catch(() => { this.$message.error('Failed to load locality') })
    },
    onSubmit() {
      if (this.submitting) return // 防重复提交：失败后再点会撞 FieldNo 唯一约束
      this.submitting = true
      // 只提交真正选了人的行（表格默认带一行空的）。
      // manageCollectors 告诉后端"这份列表是完整的、可以照它重写"——旧版前端没有这个标记，
      // 后端就不会去动关联行，避免后端先上线时把采集人清空。
      const payload = Object.assign({}, this.form, {
        manageCollectors: true,
        zCollectorsLocality: (this.form.zCollectorsLocality || []).filter(c => c && c.collectorID)
      })
      if (this.isEdit) {
        updateLocality(Object.assign({ localityId: this.externalLocalityId }, payload)).then((response) => {
          this.$message.success('Locality updated')
          this.showWarnings(response)
          this.$emit('saved')
        }).catch(err => { this.$message.error(this.errText(err, 'Update failed')) })
          .finally(() => { this.submitting = false })
        return
      }
      // 之前这里没有 .catch，后端 500 在界面上完全静默（只能在 Network 里看到）
      addNewLocality(payload).then((response) => {
        this.$message.success('Locality created')
        this.showWarnings(response)
        this.enableLotSection(response.data.localityID)
      }).catch(err => { this.$message.error(this.errText(err, 'Create failed')) })
        .finally(() => { this.submitting = false })
    },
    // 后端"存了但有疑点"的提醒（如 EndDate 早于 StartDate）——保存成功但要让人看见
    showWarnings(response){
      const warnings = (response && response.data && response.data.warnings) || []
      warnings.forEach(w => this.$message({ message: w, type: 'warning', duration: 8000 }))
    },
    // 后端错误优先取 detail（FastAPI 的 HTTPException 格式），退回 axios 的 message
    errText(err, fallback) {
      const detail = err && err.response && err.response.data && err.response.data.detail
      return detail || (err && err.message) || fallback
    },

    onCancel() {
      this.$message({
        message: 'cancel!',
        type: 'warning'
      })
    },
    updatedPosition:function(updatedPosition){
      this.form.latitude = updatedPosition.lat
      this.form.longitude = updatedPosition.lng
    },
    // 从 GeoField(GeoNames) 选中带层级的地名 → 自动回填父级（county→state/country，state→country）
    onGeoPick(level, item){
      if (!item) return
      if (level === 'county') {
        if (item.state) this.form.state = item.state
        if (item.country) this.form.country = item.country
      } else if (level === 'state') {
        if (item.country) this.form.country = item.country
      }
    },
    // GEOLocate 选定候选 → 写回 lat/lon（和地图 updatedPosition 写同样的字段，互补不冲突）
    onGeoPicked(coords){
      this.form.latitude = coords.lat
      this.form.longitude = coords.lon
      this.$message.success('Coordinates set: ' + coords.lat + ', ' + coords.lon + ' — adjust on the map if needed.')
    },
    remoteMethod(searchKey){
      if(searchKey !== "") {
        this.remoteLoading = true
        this.keyWord = searchKey
        this.getRemote()
      }else{
        this.collectorsOptions = this.allCollectorsOptions
      }
    },
    getRemote: _.debounce(function(){
        this.getCollectorList(this.queryParams)
    },300),
    async getCollectorList(params){
      this.remoteLoading = false
      await getCollectors(params).then(response => {
        this.collectorsOptions = []
        response.data.items.forEach((item) => {
          this.collectorsOptions.push({
            collectorID: item.CollectorID,
            collectorFirstName: item.FirstName==null?'':item.FirstName,
            collectorLastName: item.LastName==null?'':item.LastName })
        })
      })
    },
    //handle collectors
    addNewCollectors(){
      let newCollector = {
        collectorName: '',
        collectorID:''
      }
      this.form.zCollectorsLocality.unshift(newCollector)
    },
    handleCollectorsDelete(row, index) {
      this.$notify({
        title: 'Success',
        message: 'Delete Successfully',
        type: 'success',
        duration: 2000
      })
      this.form.zCollectorsLocality.splice(index, 1)
    },
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
  }
}
</script>

<style scoped>
.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.line{
  text-align: center;
}

/* 已在模板里用了两处（GEOLocate 说明、Verbatim Date 说明），之前没定义 */
.muted{
  color: #909399;
  font-size: 12px;
}
</style>

