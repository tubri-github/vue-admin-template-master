<!--
  CreateLocalityForm.vue
  创建新地点表单组件
-->
<template>
  <div class="create-locality-form">
    <el-form
      ref="localityForm"
      :model="localityData"
      :rules="formRules"
      label-width="140px">

      <!-- 基础信息提示 -->
      <el-alert
        v-if="verbatimData"
        type="info"
        :closable="false"
        class="verbatim-info">
        <div slot="title">
          Based on verbatim data: {{getVerbatimSummary()}}
        </div>
      </el-alert>

      <!-- 基本信息 -->
      <el-card class="form-section">
        <div slot="header">Basic Locality Information</div>

        <el-form-item label="Locality Name" prop="LocalityName">
          <el-input
            v-model="localityData.LocalityName"
            placeholder="Enter locality name">
          </el-input>
        </el-form-item>

        <el-form-item label="Locality String">
          <el-input
            v-model="localityData.LocalityString"
            type="textarea"
            :rows="3"
            placeholder="Detailed locality description">
          </el-input>
        </el-form-item>
      </el-card>

      <!-- 地理信息 -->
      <el-card class="form-section">
        <div slot="header">Geographic Information</div>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Country" prop="Country">
              <el-input
                v-model="localityData.Country"
                placeholder="Country name">
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="State/Province" prop="State">
              <el-input
                v-model="localityData.State"
                placeholder="State or province">
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="County">
              <el-input
                v-model="localityData.County"
                placeholder="County name">
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Drainage">
              <el-input
                v-model="localityData.Drainage"
                placeholder="Drainage system">
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="Water Body">
          <el-input
            v-model="localityData.Waterbody"
            placeholder="Lake, river, stream, etc.">
          </el-input>
        </el-form-item>
      </el-card>

      <!-- 坐标信息 -->
      <el-card class="form-section">
        <div slot="header">
          Coordinates
          <el-button
            size="mini"
            style="float: right;"
            @click="showMapPicker">
            <i class="el-icon-location"></i>
            Pick from Map
          </el-button>
        </div>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Latitude" prop="Latitude">
              <el-input-number
                v-model="localityData.Latitude"
                :precision="6"
                :min="-90"
                :max="90"
                placeholder="Decimal degrees"
                class="w-full">
              </el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Longitude" prop="Longitude">
              <el-input-number
                v-model="localityData.Longitude"
                :precision="6"
                :min="-180"
                :max="180"
                placeholder="Decimal degrees"
                class="w-full">
              </el-input-number>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Coordinate System">
              <el-select v-model="localityData.CoordinateSystem" class="w-full">
                <el-option label="WGS84" value="WGS84"></el-option>
                <el-option label="NAD83" value="NAD83"></el-option>
                <el-option label="NAD27" value="NAD27"></el-option>
                <el-option label="Unknown" value="Unknown"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Accuracy (meters)">
              <el-input-number
                v-model="localityData.CoordinateAccuracy"
                :min="0"
                placeholder="Accuracy in meters"
                class="w-full">
              </el-input-number>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 坐标预览 -->
        <div v-if="localityData.Latitude && localityData.Longitude" class="coordinate-preview">
          <div class="preview-label">Coordinate Preview:</div>
          <div class="coordinate-text">
            {{localityData.Latitude}}°N, {{Math.abs(localityData.Longitude)}}°{{localityData.Longitude < 0 ? 'W' : 'E'}}
          </div>
        </div>
      </el-card>

      <!-- 附加信息 -->
      <el-card class="form-section">
        <div slot="header">Additional Information</div>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="Elevation (m)">
              <el-input-number
                v-model="localityData.Elevation"
                placeholder="Elevation in meters"
                class="w-full">
              </el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Depth (m)">
              <el-input-number
                v-model="localityData.Depth"
                :min="0"
                placeholder="Water depth in meters"
                class="w-full">
              </el-input-number>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="Habitat">
          <el-input
            v-model="localityData.Habitat"
            placeholder="Habitat description">
          </el-input>
        </el-form-item>

        <el-form-item label="Notes">
          <el-input
            v-model="localityData.Notes"
            type="textarea"
            :rows="3"
            placeholder="Additional notes about this locality">
          </el-input>
        </el-form-item>
      </el-card>

      <!-- 表单操作 -->
      <div class="form-actions">
        <el-button @click="cancelForm">Cancel</el-button>
        <el-button @click="resetForm">Reset</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">
          Create Locality
        </el-button>
      </div>
    </el-form>

    <!-- 地图选择器对话框 -->
    <el-dialog
      title="Select Location from Map"
      :visible.sync="showMapDialog"
      width="70%">

      <div class="map-picker">
        <div id="map-container" style="height: 400px; border: 1px solid #ddd;"></div>
        <div class="map-instructions">
          Click on the map to select coordinates
        </div>
      </div>

      <div slot="footer">
        <el-button @click="showMapDialog = false">Cancel</el-button>
        <el-button type="primary" @click="confirmMapSelection">Confirm</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'CreateLocalityForm',
  props: {
    verbatimData: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      submitting: false,
      showMapDialog: false,
      selectedCoordinates: null,

      localityData: {
        LocalityName: '',
        LocalityString: '',
        Country: '',
        State: '',
        County: '',
        Drainage: '',
        Waterbody: '',
        Latitude: null,
        Longitude: null,
        CoordinateSystem: 'WGS84',
        CoordinateAccuracy: null,
        Elevation: null,
        Depth: null,
        Habitat: '',
        Notes: ''
      },

      // 表单验证规则
      formRules: {
        LocalityName: [
          { required: true, message: 'Locality name is required', trigger: 'blur' },
          { min: 2, max: 200, message: 'Locality name should be 2-200 characters', trigger: 'blur' }
        ],
        Country: [
          { required: true, message: 'Country is required', trigger: 'blur' }
        ],
        State: [
          { required: true, message: 'State/Province is required', trigger: 'blur' }
        ],
        Latitude: [
          { type: 'number', min: -90, max: 90, message: 'Latitude must be between -90 and 90', trigger: 'blur' }
        ],
        Longitude: [
          { type: 'number', min: -180, max: 180, message: 'Longitude must be between -180 and 180', trigger: 'blur' }
        ]
      }
    }
  },
  created() {
    // 如果有 verbatim 数据，预填充表单
    if (this.verbatimData) {
      this.prefillFromVerbatim();
    }
  },
  methods: {
    // 从 verbatim 数据预填充表单
    prefillFromVerbatim() {
      const mapping = {
        LocalityName: 'verbatimLocalityString',
        LocalityString: 'verbatimLocalityString',
        Country: 'verbatimCountry',
        State: 'verbatimState',
        County: 'verbatimCounty',
        Drainage: 'verbatimDrainage',
        Waterbody: 'verbatimWaterbody',
        Latitude: 'verbatimLatitude',
        Longitude: 'verbatimLongitude'
      };

      Object.keys(mapping).forEach(localityField => {
        const verbatimField = mapping[localityField];
        if (this.verbatimData[verbatimField]) {
          this.localityData[localityField] = this.verbatimData[verbatimField];
        }
      });

      // 如果没有地点名称，尝试生成一个
      if (!this.localityData.LocalityName) {
        const parts = [
          this.verbatimData.verbatimWaterbody,
          this.verbatimData.verbatimCounty,
          this.verbatimData.verbatimState
        ].filter(Boolean);

        if (parts.length > 0) {
          this.localityData.LocalityName = parts.join(', ');
        }
      }
    },

    // 获取 verbatim 摘要
    getVerbatimSummary() {
      if (!this.verbatimData) return '';

      const parts = [
        this.verbatimData.verbatimLocalityString,
        this.verbatimData.verbatimCountry,
        this.verbatimData.verbatimState,
        this.verbatimData.verbatimCounty
      ].filter(Boolean);

      return parts.join(' | ') || 'No verbatim data available';
    },

    // 显示地图选择器
    showMapPicker() {
      this.showMapDialog = true;
      this.$nextTick(() => {
        this.initializeMap();
      });
    },

    // 初始化地图（这里使用简化的地图实现）
    initializeMap() {
      // 这里应该集成真实的地图服务，如 Google Maps、OpenStreetMap 等
      // 为了演示，我们创建一个简单的点击区域
      const mapContainer = document.getElementById('map-container');
      if (!mapContainer) return;

      mapContainer.innerHTML = `
        <div style="
          height: 100%;
          background: #e8f4f8;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: crosshair;
          position: relative;
        " id="clickable-map">
          <div style="color: #666; font-size: 16px;">
            Click anywhere to select coordinates<br>
            <small>(This is a demo - integrate with real map service)</small>
          </div>
        </div>
      `;

      // 添加点击事件监听器
      const clickableMap = document.getElementById('clickable-map');
      clickableMap.addEventListener('click', (event) => {
        const rect = clickableMap.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // 将点击位置转换为模拟坐标（实际应用中由地图服务提供）
        const lat = 40 + (y / rect.height) * 20; // 模拟纬度 40-60
        const lng = -120 + (x / rect.width) * 40; // 模拟经度 -120 到 -80

        this.selectedCoordinates = {
          latitude: parseFloat(lat.toFixed(6)),
          longitude: parseFloat(lng.toFixed(6))
        };

        // 在地图上显示选中点
        const existingMarker = clickableMap.querySelector('.marker');
        if (existingMarker) {
          existingMarker.remove();
        }

        const marker = document.createElement('div');
        marker.className = 'marker';
        marker.style.cssText = `
          position: absolute;
          top: ${y - 10}px;
          left: ${x - 10}px;
          width: 20px;
          height: 20px;
          background: red;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 0 5px rgba(0,0,0,0.3);
        `;
        clickableMap.appendChild(marker);

        this.$message.success(`Selected: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      });
    },

    // 确认地图选择
    confirmMapSelection() {
      if (this.selectedCoordinates) {
        this.localityData.Latitude = this.selectedCoordinates.latitude;
        this.localityData.Longitude = this.selectedCoordinates.longitude;
        this.showMapDialog = false;
        this.$message.success('Coordinates updated from map');
      } else {
        this.$message.warning('Please select a location on the map first');
      }
    },

    // 提交表单
    async submitForm() {
      // 验证表单
      const valid = await new Promise(resolve => {
        this.$refs.localityForm.validate(resolve);
      });

      if (!valid) {
        this.$message.error('Please correct the form errors');
        return;
      }

      // 检查是否存在重复
      if (await this.checkDuplicateLocality()) {
        return;
      }

      this.submitting = true;
      try {
        // 触发提交事件
        this.$emit('submit', this.localityData);
      } catch (error) {
        this.$message.error('Failed to create locality');
        console.error(error);
      } finally {
        this.submitting = false;
      }
    },

    // 检查重复地点
    async checkDuplicateLocality() {
      try {
        const response = await this.$api.checkLocalityExists({
          name: this.localityData.LocalityName,
          country: this.localityData.Country,
          state: this.localityData.State,
          county: this.localityData.County
        });

        if (response.code === 20000 && response.data.exists) {
          const result = await this.$confirm(
            `A locality with similar information already exists. Do you want to proceed anyway?`,
            'Potential Duplicate',
            { type: 'warning' }
          );
          return !result;
        }
      } catch (error) {
        console.error('Error checking for duplicate locality:', error);
      }
      return false;
    },

    // 重置表单
    resetForm() {
      this.$refs.localityForm.resetFields();
      if (this.verbatimData) {
        this.prefillFromVerbatim();
      }
    },

    // 取消表单
    cancelForm() {
      this.$emit('cancel');
    }
  }
};
</script>

<style scoped>
.create-locality-form {
  max-width: 900px;
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

.coordinate-preview {
  margin-top: 15px;
  padding: 10px;
  background: #f0f9ff;
  border-radius: 4px;
  border: 1px solid #e0f2fe;
}

.preview-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 5px;
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

.w-full {
  width: 100%;
}

.map-picker {
  padding: 10px;
}

.map-instructions {
  margin-top: 10px;
  text-align: center;
  color: #666;
  font-size: 14px;
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
}
</style>
