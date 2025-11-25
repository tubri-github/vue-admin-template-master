<!--
  CreateLocalityForm.vue
  创建新地点表单组件 - 集成Google Maps
-->
<template>
  <div class="create-locality-form">
    <el-form
      ref="localityForm"
      :model="localityData"
      :rules="formRules"
      label-width="140px"
    >

      <!-- 基础信息提示 -->
      <el-alert
        v-if="verbatimData"
        type="info"
        :closable="false"
        class="verbatim-info"
      >
        <div slot="title">
          Pre-filled from verbatim data: {{ getVerbatimSummary() }}
        </div>
      </el-alert>

      <!-- 基本信息 -->
      <el-card class="form-section">
        <div slot="header">Basic Information</div>

        <el-form-item label="Field No" prop="FieldNo">
          <el-input
            v-model="localityData.FieldNo"
            placeholder="Enter Field Number (required, must be unique)"
            @blur="checkFieldNoUniqueness"
          />
          <div class="field-note">
            <i class="el-icon-info" />
            Field No must be unique and cannot be changed later
          </div>
          <div v-if="fieldNoCheckResult.checked && fieldNoCheckResult.exists" class="field-error">
            <i class="el-icon-warning" />
            This Field No already exists
          </div>
          <div v-if="fieldNoCheckResult.checked && !fieldNoCheckResult.exists" class="field-success">
            <i class="el-icon-check" />
            Field No is available
          </div>
        </el-form-item>

        <el-form-item label="Locality Description" prop="LocalityString">
          <el-input
            v-model="localityData.LocalityString"
            type="textarea"
            :rows="3"
            placeholder="Detailed locality description"
          />
        </el-form-item>

        <el-form-item label="Date">
          <el-row :gutter="10">
            <el-col :span="12">
              <el-date-picker
                v-model="localityData.StartDate"
                type="date"
                placeholder="Start date"
                format="yyyy-MM-dd"
                value-format="yyyy-MM-dd"
                style="width: 100%"
              />
            </el-col>
            <el-col :span="12">
              <el-date-picker
                v-model="localityData.EndDate"
                type="date"
                placeholder="End date"
                format="yyyy-MM-dd"
                value-format="yyyy-MM-dd"
                style="width: 100%"
              />
            </el-col>
          </el-row>
        </el-form-item>

        <el-form-item label="Verbatim Date">
          <el-input
            v-model="localityData.VerbatimDate"
            placeholder="Original date as written"
          />
        </el-form-item>
      </el-card>

      <!-- 地理信息 -->
      <el-card class="form-section">
        <div slot="header">Geographic Information</div>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Continent" prop="Continent">
              <el-select v-model="localityData.Continent" placeholder="Select continent" style="width: 100%">
                <el-option label="North America" value="North America" />
                <el-option label="South America" value="South America" />
                <el-option label="Europe" value="Europe" />
                <el-option label="Asia" value="Asia" />
                <el-option label="Africa" value="Africa" />
                <el-option label="Australia" value="Australia" />
                <el-option label="Antarctica" value="Antarctica" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Country" prop="Country">
              <el-input
                v-model="localityData.Country"
                placeholder="Country name"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="State/Province" prop="State">
              <el-input
                v-model="localityData.State"
                placeholder="State or province"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="County">
              <el-input
                v-model="localityData.County"
                placeholder="County name"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Island">
              <el-input
                v-model="localityData.Island"
                placeholder="Island name"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Island Group">
              <el-input
                v-model="localityData.IslandGroup"
                placeholder="Island group name"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <!-- 水文信息 -->
      <el-card class="form-section">
        <div slot="header">Water Features</div>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Drainage">
              <el-input
                v-model="localityData.Drainage"
                placeholder="Drainage system"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Water Body">
              <el-input
                v-model="localityData.WaterBody"
                placeholder="Lake, river, stream, etc."
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <!-- 坐标信息 -->
      <el-card class="form-section">
        <div slot="header">
          Coordinates
          <el-button
            size="mini"
            type="primary"
            style="float: right;"
            @click="showMapPicker"
          >
            <i class="el-icon-location" />
            Pick from Google Map
          </el-button>
        </div>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Latitude" prop="Lat">
              <el-input-number
                v-model="localityData.Lat"
                :precision="6"
                :min="-90"
                :max="90"
                placeholder="Decimal degrees"
                style="width: 100%"
                @change="updateMapMarker"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Longitude" prop="Lon">
              <el-input-number
                v-model="localityData.Lon"
                :precision="6"
                :min="-180"
                :max="180"
                placeholder="Decimal degrees"
                style="width: 100%"
                @change="updateMapMarker"
              />
            </el-form-item>
          </el-col>
        </el-row>



        <!-- 坐标预览 -->
        <div v-if="localityData.Lat && localityData.Lon" class="coordinate-preview">
          <div class="preview-label">Coordinate Preview:</div>
          <div class="coordinate-text">
            {{ localityData.Lat }}°, {{ localityData.Lon }}°
          </div>
          <el-button
            size="mini"
            @click="copyCoordinates"
            style="margin-left: 10px;"
          >
            <i class="el-icon-copy-document" />
            Copy
          </el-button>
        </div>
      </el-card>

      <!-- 采集信息 -->
      <el-card class="form-section">
        <div slot="header">Collection Information</div>

        <el-form-item label="Verbatim Collectors">
          <el-input
            v-model="localityData.VerbatimCollectors"
            type="textarea"
            :rows="2"
            placeholder="Collectors as written in original data"
          />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Inventory">
              <el-input
                v-model="localityData.Inventory"
                placeholder="Inventory information"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <div class="detail-item">
              <label>Elevation Method:</label>
              <el-input
                v-model="localityData.ElevationMethod"
                placeholder="GPS, Map, etc."
              />
            </div>
          </el-col>
        </el-row>
      </el-card>

      <!-- 备注信息 -->
      <el-card class="form-section">
        <div slot="header">Additional Information</div>

        <el-form-item label="Remarks">
          <el-input
            v-model="localityData.Remarks"
            type="textarea"
            :rows="3"
            placeholder="Additional notes and remarks"
          />
        </el-form-item>
      </el-card>

      <!-- 表单操作 -->
      <div class="form-actions">
        <el-button @click="cancelForm">Cancel</el-button>
        <el-button @click="resetForm">Reset</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">
          <i class="el-icon-check" />
          Create Locality
        </el-button>
      </div>
    </el-form>

    <!-- Google Maps 选择器对话框 -->
    <el-dialog
      title="Select Location from Google Maps"
      :visible.sync="showMapDialog"
      width="80%"
      :close-on-click-modal="false"
      :append-to-body="true"
    >

      <div class="map-picker">
        <!-- Google Maps 容器 -->
        <div id="google-map-container" style="height: 500px; border: 1px solid #ddd; border-radius: 4px;" />

        <!-- 地图控制和信息 -->
        <div class="map-controls">
          <el-row :gutter="20" style="margin-top: 15px;">
            <el-col :span="12">
              <el-input
                v-model="mapSearchQuery"
                placeholder="Search for a place..."
                @keyup.enter.native="searchOnMap"
              >
                <el-button
                  slot="append"
                  @click="searchOnMap"
                  :loading="mapSearching"
                >
                  Search
                </el-button>
              </el-input>
            </el-col>
            <el-col :span="12">
              <div v-if="selectedMapCoordinates" class="selected-coords">
                Selected: {{ selectedMapCoordinates.lat.toFixed(6) }}, {{ selectedMapCoordinates.lng.toFixed(6) }}
              </div>
              <div v-else class="no-selection">
                Click on the map to select a location
              </div>
            </el-col>
          </el-row>

          <!-- 地址详情 -->
          <div v-if="selectedAddress" class="address-details">
            <h4>Selected Location:</h4>
            <p>{{ selectedAddress }}</p>
          </div>
        </div>

        <div class="map-instructions">
          <i class="el-icon-info" />
          Click on the map to select coordinates, or search for a specific address
        </div>
      </div>

      <div slot="footer">
        <el-button @click="showMapDialog = false">Cancel</el-button>
        <el-button
          type="primary"
          @click="confirmMapSelection"
          :disabled="!selectedMapCoordinates"
        >
          Use Selected Location
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { checkLocalityFieldNoExists } from "@/api/table"

export default {
  name: 'CreateLocalityForm',
  props: {
    verbatimData: {
      type: Object,
      default: null
    },
    googleMapsApiKey: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      submitting: false,
      showMapDialog: false,

      // Google Maps 相关
      map: null,
      marker: null,
      geocoder: null,
      placesService: null,
      selectedMapCoordinates: null,
      selectedAddress: '',
      mapSearchQuery: '',
      mapSearching: false,

      // Field No 检查
      fieldNoCheckResult: {
        checked: false,
        exists: false
      },
      fieldNoCheckTimeout: null,

      localityData: {
        // 基本信息
        FieldNo: '',
        LocalityString: '',
        Drainage: '',
        Country: '',
        State: '',
        County: '',
        Continent: '',
        Island: '',
        IslandGroup: '',
        ElevationMethod: '',
        WaterBody: '',

        // 坐标和时间
        Lon: null,
        Lat: null,
        StartDate: null,
        EndDate: null,

        // 日期组件
        VerbatimDate: '',

        // 其他信息
        Remarks: '',
        Inventory: '',
        VerbatimCollectors: '',
        ElevationMethod: ''
      },

      // 表单验证规则
      formRules: {
        FieldNo: [
          { required: true, message: 'Field No is required', trigger: 'blur' },
          { min: 1, max: 50, message: 'Field No should be 1-50 characters', trigger: 'blur' },
          { validator: this.validateFieldNo, trigger: 'blur' }
        ],
        LocalityString: [
          { required: true, message: 'Locality description is required', trigger: 'blur' },
          { min: 2, max: 255, message: 'Locality description should be 2-255 characters', trigger: 'blur' }
        ],
        Country: [
          { required: true, message: 'Country is required', trigger: 'blur' }
        ],
        State: [
          { required: true, message: 'State/Province is required', trigger: 'blur' }
        ],
        Continent: [
          { required: true, message: 'Continent is required', trigger: 'change' }
        ],
        Lat: [
          { type: 'number', min: -90, max: 90, message: 'Latitude must be between -90 and 90', trigger: 'blur' }
        ],
        Lon: [
          { type: 'number', min: -180, max: 180, message: 'Longitude must be between -180 and 180', trigger: 'blur' }
        ]
      }
    }
  },
  created() {
    // 如果有 verbatim 数据，预填充表单
    if (this.verbatimData) {
      this.prefillFromVerbatim()
    }

    // 加载 Google Maps API
    this.loadGoogleMapsAPI()
  },
  beforeDestroy() {
    // 清理计时器
    if (this.fieldNoCheckTimeout) {
      clearTimeout(this.fieldNoCheckTimeout)
    }
  },
  methods: {
    // 加载 Google Maps API
    loadGoogleMapsAPI() {
      if (window.google && window.google.maps) {
        return Promise.resolve()
      }

      return new Promise((resolve, reject) => {
        const script = document.createElement('script')
        script.src = `https://maps.googleapis.com/maps/api/js?key=${this.googleMapsApiKey}&libraries=places&callback=initGoogleMaps`
        script.async = true
        script.defer = true

        window.initGoogleMaps = () => {
          resolve()
        }

        script.onerror = () => {
          reject(new Error('Failed to load Google Maps API'))
        }

        document.head.appendChild(script)
      })
    },

    // 从 verbatim 数据预填充表单
    prefillFromVerbatim() {
      const mapping = {
        FieldNo: 'field_number',
        LocalityString: 'locality_string',
        Drainage: 'drainage',
        Country: 'country',
        State: 'state',
        County: 'county',
        WaterBody: 'waterbody',
        Lat: 'latitude',
        Lon: 'longitude',
        VerbatimCollectors: 'collector'
      }

      Object.keys(mapping).forEach(localityField => {
        const verbatimField = mapping[localityField]
        if (this.verbatimData[verbatimField]) {
          this.localityData[localityField] = this.verbatimData[verbatimField]
        }
      })

      // 处理日期
      if (this.verbatimData.collect_date) {
        try {
          const date = new Date(this.verbatimData.collect_date)
          this.localityData.StartDate = date.toISOString().split('T')[0]
        } catch (error) {
          console.warn('Failed to parse verbatim date:', error)
        }
      }
    },

    // 获取 verbatim 摘要
    getVerbatimSummary() {
      if (!this.verbatimData) return ''

      const parts = [
        this.verbatimData.field_number,
        this.verbatimData.locality_string,
        this.verbatimData.country,
        this.verbatimData.state
      ].filter(Boolean)

      return parts.join(' | ') || 'Verbatim data available'
    },

    // Field No 验证器
    validateFieldNo(rule, value, callback) {
      if (this.fieldNoCheckResult.checked && this.fieldNoCheckResult.exists) {
        callback(new Error('This Field No already exists'))
      } else {
        callback()
      }
    },

    // 检查 Field No 唯一性
    async checkFieldNoUniqueness() {
      if (!this.localityData.FieldNo) {
        this.fieldNoCheckResult = { checked: false, exists: false }
        return
      }

      // 防抖处理
      if (this.fieldNoCheckTimeout) {
        clearTimeout(this.fieldNoCheckTimeout)
      }

      this.fieldNoCheckTimeout = setTimeout(async () => {
        try {
          const response = await checkLocalityFieldNoExists({
            fieldNo: this.localityData.FieldNo
          })

          this.fieldNoCheckResult = {
            checked: true,
            exists: response.code === 20000 && response.data.exists
          }

          // 触发表单验证
          this.$refs.localityForm.validateField('FieldNo')
        } catch (error) {
          console.error('Error checking Field No:', error)
          this.fieldNoCheckResult = { checked: false, exists: false }
        }
      }, 500)
    },

    // 显示地图选择器
    async showMapPicker() {
      try {
        await this.loadGoogleMapsAPI()
        this.showMapDialog = true
        this.$nextTick(() => {
          this.initializeGoogleMap()
        })
      } catch (error) {
        this.$message.error('Failed to load Google Maps')
        console.error(error)
      }
    },

    // 初始化 Google Maps
    initializeGoogleMap() {
      const mapContainer = document.getElementById('google-map-container')
      if (!mapContainer || !window.google) return

      // 默认中心点（如果有现有坐标则使用，否则使用美国中心）
      const defaultCenter = {
        lat: this.localityData.Lat || 39.8283,
        lng: this.localityData.Lon || -98.5795
      }

      // 创建地图
      this.map = new google.maps.Map(mapContainer, {
        zoom: this.localityData.Lat && this.localityData.Lon ? 12 : 4,
        center: defaultCenter,
        mapTypeId: 'roadmap'
      })

      // 创建地理编码器
      this.geocoder = new google.maps.Geocoder()

      // 创建Places服务
      this.placesService = new google.maps.places.PlacesService(this.map)

      // 如果有现有坐标，添加标记
      if (this.localityData.Lat && this.localityData.Lon) {
        this.addMapMarker(defaultCenter)
        this.selectedMapCoordinates = defaultCenter
      }

      // 添加点击事件监听器
      this.map.addListener('click', (event) => {
        const coordinates = {
          lat: event.latLng.lat(),
          lng: event.latLng.lng()
        }

        this.addMapMarker(coordinates)
        this.selectedMapCoordinates = coordinates
        this.reverseGeocode(coordinates)
      })
    },

    // 添加地图标记
    addMapMarker(coordinates) {
      // 移除现有标记
      if (this.marker) {
        this.marker.setMap(null)
      }

      // 创建新标记
      this.marker = new google.maps.Marker({
        position: coordinates,
        map: this.map,
        title: 'Selected Location',
        draggable: true
      })

      // 添加拖拽事件
      this.marker.addListener('dragend', (event) => {
        const newCoordinates = {
          lat: event.latLng.lat(),
          lng: event.latLng.lng()
        }
        this.selectedMapCoordinates = newCoordinates
        this.reverseGeocode(newCoordinates)
      })
    },

    // 反向地理编码
    reverseGeocode(coordinates) {
      if (!this.geocoder) return

      this.geocoder.geocode({ location: coordinates }, (results, status) => {
        if (status === 'OK' && results[0]) {
          this.selectedAddress = results[0].formatted_address

          // 尝试从结果中提取地理信息
          this.extractLocationInfo(results[0])
        }
      })
    },

    // 从地理编码结果提取位置信息
    extractLocationInfo(result) {
      const components = result.address_components

      for (const component of components) {
        const types = component.types

        if (types.includes('country')) {
          this.localityData.Country = component.long_name
        } else if (types.includes('administrative_area_level_1')) {
          this.localityData.State = component.long_name
        } else if (types.includes('administrative_area_level_2')) {
          this.localityData.County = component.long_name
        }
      }
    },

    // 在地图上搜索
    searchOnMap() {
      if (!this.mapSearchQuery.trim() || !this.geocoder) return

      this.mapSearching = true

      this.geocoder.geocode({ address: this.mapSearchQuery }, (results, status) => {
        this.mapSearching = false

        if (status === 'OK' && results[0]) {
          const location = results[0].geometry.location
          const coordinates = {
            lat: location.lat(),
            lng: location.lng()
          }

          // 移动地图中心并添加标记
          this.map.setCenter(coordinates)
          this.map.setZoom(14)
          this.addMapMarker(coordinates)
          this.selectedMapCoordinates = coordinates
          this.selectedAddress = results[0].formatted_address

          // 提取位置信息
          this.extractLocationInfo(results[0])
        } else {
          this.$message.error('Location not found')
        }
      })
    },

    // 确认地图选择
    confirmMapSelection() {
      if (this.selectedMapCoordinates) {
        this.localityData.Lat = Number(this.selectedMapCoordinates.lat.toFixed(6))
        this.localityData.Lon = Number(this.selectedMapCoordinates.lng.toFixed(6))
        this.showMapDialog = false
        this.$message.success('Coordinates updated from Google Maps')
      } else {
        this.$message.warning('Please select a location on the map first')
      }
    },

    // 更新地图标记（当手动输入坐标时）
    updateMapMarker() {
      if (this.map && this.localityData.Lat && this.localityData.Lon) {
        const coordinates = {
          lat: this.localityData.Lat,
          lng: this.localityData.Lon
        }
        this.addMapMarker(coordinates)
        this.map.setCenter(coordinates)
        this.selectedMapCoordinates = coordinates
      }
    },

    // 搜索地址
    async searchAddress() {
      if (!this.addressSearch.trim()) {
        this.$message.warning('Please enter an address to search')
        return
      }

      this.searching = true

      try {
        // 使用 Google Maps Geocoding API
        await this.loadGoogleMapsAPI()

        if (!this.geocoder) {
          this.geocoder = new google.maps.Geocoder()
        }

        this.geocoder.geocode({ address: this.addressSearch }, (results, status) => {
          this.searching = false

          if (status === 'OK' && results[0]) {
            const location = results[0].geometry.location

            this.localityData.Lat = Number(location.lat().toFixed(6))
            this.localityData.Lon = Number(location.lng().toFixed(6))

            // 提取位置信息
            this.extractLocationInfo(results[0])

            this.$message.success(`Found coordinates for: ${results[0].formatted_address}`)
          } else {
            this.$message.error('Address not found. Please try a different search term.')
          }
        })
      } catch (error) {
        this.searching = false
        this.$message.error('Failed to search address')
        console.error(error)
      }
    },

    // 复制坐标
    copyCoordinates() {
      const coordText = `${this.localityData.Lat}, ${this.localityData.Lon}`

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(coordText).then(() => {
          this.$message.success('Coordinates copied to clipboard')
        }).catch(() => {
          this.fallbackCopyToClipboard(coordText)
        })
      } else {
        this.fallbackCopyToClipboard(coordText)
      }
    },

    // 备用复制方法
    fallbackCopyToClipboard(text) {
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()

      try {
        document.execCommand('copy')
        this.$message.success('Coordinates copied to clipboard')
      } catch (err) {
        this.$message.error('Failed to copy coordinates')
      }

      document.body.removeChild(textArea)
    },

    // 提交表单
    async submitForm() {
      // 验证表单
      const valid = await new Promise(resolve => {
        this.$refs.localityForm.validate(resolve)
      })

      if (!valid) {
        this.$message.error('Please correct the form errors')
        return
      }

      // 最终检查FieldNo是否重复
      if (this.fieldNoCheckResult.checked && this.fieldNoCheckResult.exists) {
        this.$message.error('Field No already exists. Please use a different Field No.')
        return
      }

      this.submitting = true
      try {
        // 准备提交数据，确保日期格式正确
        const submitData = {
          ...this.localityData
        }

        // 确保日期字段是正确的格式
        if (submitData.StartDate) {
          // 确保是 YYYY-MM-DD 格式
          submitData.StartDate = new Date(submitData.StartDate).toISOString().split('T')[0]
        }

        if (submitData.EndDate) {
          // 确保是 YYYY-MM-DD 格式
          submitData.EndDate = new Date(submitData.EndDate).toISOString().split('T')[0]
        }

        // 移除空值字段
        Object.keys(submitData).forEach(key => {
          if (submitData[key] === null || submitData[key] === undefined || submitData[key] === '') {
            delete submitData[key]
          }
        })

        console.log('Submitting locality data:', submitData)

        // 触发提交事件
        this.$emit('submit', submitData)
      } catch (error) {
        this.$message.error('Failed to create locality')
        console.error(error)
      } finally {
        this.submitting = false
      }
    },

    // 重置表单
    resetForm() {
      this.$refs.localityForm.resetFields()
      this.fieldNoCheckResult = { checked: false, exists: false }
      this.selectedMapCoordinates = null
      this.selectedAddress = ''

      if (this.verbatimData) {
        this.prefillFromVerbatim()
      }
    },

    // 取消表单
    cancelForm() {
      this.$emit('cancel')
    }
  }
}
</script>

<style scoped>
.create-locality-form {
  max-width: 1000px;
  margin: 0 auto;
}

.verbatim-info {
  margin-bottom: 20px;
}

.form-section {
  margin-bottom: 20px;
}

.form-section .el-card__header {
  font-weight: 500;
  color: #333;
}

.field-note {
  font-size: 12px;
  color: #E6A23C;
  margin-top: 5px;
}

.field-note i {
  margin-right: 4px;
}

.field-error {
  font-size: 12px;
  color: #F56C6C;
  margin-top: 5px;
}

.field-error i {
  margin-right: 4px;
}

.field-success {
  font-size: 12px;
  color: #67C23A;
  margin-top: 5px;
}

.field-success i {
  margin-right: 4px;
}

.coordinate-preview {
  margin-top: 15px;
  padding: 10px;
  background: #f0f9ff;
  border-radius: 4px;
  border: 1px solid #e0f2fe;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.preview-label {
  font-size: 12px;
  color: #666;
}

.coordinate-text {
  font-size: 16px;
  font-weight: 500;
  color: #1976d2;
  font-family: monospace;
}

.form-actions {
  text-align: center;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
}

.form-actions .el-button {
  margin: 0 10px;
}

.map-picker {
  padding: 10px;
}

.map-controls {
  margin: 15px 0;
}

.selected-coords {
  font-family: monospace;
  font-weight: 500;
  color: #1976d2;
}

.no-selection {
  color: #999;
  font-style: italic;
}

.address-details {
  margin-top: 15px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}

.address-details h4 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 14px;
}

.address-details p {
  margin: 0;
  color: #666;
  font-size: 13px;
}

.map-instructions {
  margin-top: 10px;
  text-align: center;
  color: #666;
  font-size: 14px;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 4px;
}

.map-instructions i {
  margin-right: 5px;
  color: #409EFF;
}

/* 表单样式增强 */
.el-form-item {
  margin-bottom: 18px;
}

.el-form-item__label {
  font-weight: 500;
  color: #333;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .create-locality-form {
    padding: 10px;
  }

  .coordinate-preview {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
