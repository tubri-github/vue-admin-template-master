<!--
  LocalityMapView.vue
  地点地图查看组件
-->
<template>
  <div class="locality-map-view">
    <!-- 地点信息头部 -->
    <div class="map-header">
      <div class="locality-info">
        <h3 class="locality-title">
          <i class="el-icon-location"></i>
          {{locality.LocalityName || `Locality ${locality.LocalityID}`}}
        </h3>
        <div class="locality-subtitle">
          {{getLocationString()}}
        </div>
        <div v-if="hasCoordinates" class="coordinates-display">
          <span class="coord-label">Coordinates:</span>
          <span class="coord-value">{{locality.Latitude}}, {{locality.Longitude}}</span>
          <el-button size="mini" @click="copyCoordinates" class="copy-btn">
            <i class="el-icon-copy-document"></i>
          </el-button>
        </div>
      </div>

      <div class="map-controls">
        <el-button-group>
          <el-button size="small" @click="zoomIn">
            <i class="el-icon-zoom-in"></i>
          </el-button>
          <el-button size="small" @click="zoomOut">
            <i class="el-icon-zoom-out"></i>
          </el-button>
          <el-button size="small" @click="resetView">
            <i class="el-icon-refresh"></i>
          </el-button>
        </el-button-group>

        <el-dropdown @command="handleMapCommand" class="map-options">
          <el-button size="small">
            Options<i class="el-icon-arrow-down el-icon--right"></i>
          </el-button>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item command="satellite">Satellite View</el-dropdown-item>
            <el-dropdown-item command="terrain">Terrain View</el-dropdown-item>
            <el-dropdown-item command="street">Street View</el-dropdown-item>
            <el-dropdown-item divided command="fullscreen">Open Fullscreen</el-dropdown-item>
            <el-dropdown-item command="directions">Get Directions</el-dropdown-item>
            <el-dropdown-item command="export">Export Image</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </div>
    </div>

    <!-- 地图容器 -->
    <div class="map-container">
      <div v-if="hasCoordinates">
        <div id="locality-map" class="map-canvas" :style="mapStyle"></div>

        <!-- 地图加载状态 -->
        <div v-if="mapLoading" class="map-loading">
          <el-loading-mask :visible="true" text="Loading map..."></el-loading-mask>
        </div>
      </div>

      <!-- 无坐标信息 -->
      <div v-else class="no-coordinates">
        <i class="el-icon-warning-outline"></i>
        <div class="no-coords-text">
          <h4>No Coordinates Available</h4>
          <p>This locality does not have coordinate information to display on the map.</p>
          <el-button @click="$emit('edit-locality', locality)">
            <i class="el-icon-edit"></i>
            Add Coordinates
          </el-button>
        </div>
      </div>
    </div>

    <!-- 地图信息面板 -->
    <div v-if="hasCoordinates" class="map-info-panel">
      <el-tabs v-model="activeInfoTab" type="border-card">
        <!-- 位置信息 -->
        <el-tab-pane label="Location Info" name="location">
          <div class="info-content">
            <el-row :gutter="20">
              <el-col :span="12">
                <div class="info-item">
                  <label>Latitude:</label>
                  <span>{{locality.Latitude}}°</span>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="info-item">
                  <label>Longitude:</label>
                  <span>{{locality.Longitude}}°</span>
                </div>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <div class="info-item">
                  <label>Coordinate System:</label>
                  <span>{{locality.CoordinateSystem || 'Unknown'}}</span>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="info-item">
                  <label>Accuracy:</label>
                  <span>{{locality.CoordinateAccuracy ? locality.CoordinateAccuracy + 'm' : 'Unknown'}}</span>
                </div>
              </el-col>
            </el-row>

            <div v-if="locality.Elevation !== null" class="info-item">
              <label>Elevation:</label>
              <span>{{locality.Elevation}} meters</span>
            </div>
          </div>
        </el-tab-pane>

        <!-- 地图图层 -->
        <el-tab-pane label="Map Layers" name="layers">
          <div class="info-content">
            <div class="layer-controls">
              <el-checkbox v-model="layers.marker" @change="toggleLayer('marker')">
                Location Marker
              </el-checkbox>
              <el-checkbox v-model="layers.accuracy" @change="toggleLayer('accuracy')">
                Accuracy Circle
              </el-checkbox>
              <el-checkbox v-model="layers.nearby" @change="toggleLayer('nearby')">
                Nearby Localities
              </el-checkbox>
              <el-checkbox v-model="layers.terrain" @change="toggleLayer('terrain')">
                Terrain Overlay
              </el-checkbox>
            </div>

            <div class="layer-info">
              <div class="layer-item">
                <span class="layer-label">Current Zoom Level:</span>
                <span class="layer-value">{{currentZoom}}</span>
              </div>
              <div class="layer-item">
                <span class="layer-label">Map Type:</span>
                <span class="layer-value">{{currentMapType}}</span>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- 附近地点 -->
        <el-tab-pane label="Nearby Localities" name="nearby">
          <div class="info-content">
            <div class="nearby-controls">
              <el-row :gutter="10">
                <el-col :span="16">
                  <span>Search Radius:</span>
                  <el-slider
                    v-model="searchRadius"
                    :min="1"
                    :max="50"
                    :step="1"
                    show-input
                    :input-size="'mini'"
                    @change="searchNearbyLocalities">
                  </el-slider>
                </el-col>
                <el-col :span="8">
                  <span class="radius-display">{{searchRadius}} km</span>
                </el-col>
              </el-row>
            </div>

            <div v-if="nearbyLocalities.length > 0" class="nearby-list">
              <div
                v-for="nearby in nearbyLocalities"
                :key="nearby.LocalityID"
                class="nearby-item"
                @click="focusOnLocality(nearby)">
                <div class="nearby-info">
                  <div class="nearby-name">{{nearby.LocalityName}}</div>
                  <div class="nearby-details">
                    <span class="distance">{{nearby.distance.toFixed(1)}} km</span>
                    <span class="coords">{{nearby.Latitude}}, {{nearby.Longitude}}</span>
                  </div>
                </div>
                <el-button size="mini" @click.stop="viewNearbyDetails(nearby)">
                  <i class="el-icon-view"></i>
                </el-button>
              </div>
            </div>

            <div v-else-if="searchingNearby" class="nearby-loading">
              <i class="el-icon-loading"></i>
              Searching nearby localities...
            </div>

            <div v-else class="no-nearby">
              No nearby localities found within {{searchRadius}}km
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 全屏地图对话框 -->
    <el-dialog
      title="Fullscreen Map"
      :visible.sync="showFullscreenMap"
      :fullscreen="true"
      :show-close="true"
      class="fullscreen-map-dialog">

      <div id="fullscreen-map" class="fullscreen-map-canvas"></div>

      <div slot="footer">
        <el-button @click="showFullscreenMap = false">Close</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: 'LocalityMapView',
  props: {
    locality: {
      type: Object,
      required: true
    },
    height: {
      type: [String, Number],
      default: 400
    }
  },
  data() {
    return {
      // 地图状态
      map: null,
      marker: null,
      accuracyCircle: null,
      mapLoading: true,
      currentZoom: 10,
      currentMapType: 'roadmap',

      // UI状态
      activeInfoTab: 'location',
      showFullscreenMap: false,

      // 图层控制
      layers: {
        marker: true,
        accuracy: true,
        nearby: false,
        terrain: false
      },

      // 附近地点
      nearbyLocalities: [],
      searchingNearby: false,
      searchRadius: 10,
      nearbyMarkers: [],

      // 地图选项
      mapOptions: {
        zoom: 10,
        center: null,
        mapTypeId: 'roadmap',
        streetViewControl: false,
        mapTypeControl: true,
        fullscreenControl: false
      }
    }
  },
  computed: {
    hasCoordinates() {
      return this.locality.Latitude !== null &&
        this.locality.Longitude !== null &&
        this.locality.Latitude !== undefined &&
        this.locality.Longitude !== undefined;
    },

    mapStyle() {
      return {
        height: typeof this.height === 'number' ? `${this.height}px` : this.height,
        width: '100%'
      };
    }
  },
  mounted() {
    if (this.hasCoordinates) {
      this.$nextTick(() => {
        this.initializeMap();
      });
    }
  },
  beforeDestroy() {
    if (this.map) {
      // 清理地图事件监听器
      google.maps.event.clearInstanceListeners(this.map);
    }
  },
  methods: {
    // 获取位置字符串
    getLocationString() {
      const parts = [
        this.locality.Country,
        this.locality.State,
        this.locality.County
      ].filter(Boolean);

      return parts.join(', ') || 'Unknown location';
    },

    // 初始化地图（简化版，实际应集成 Google Maps 或其他地图服务）
    initializeMap() {
      // 模拟地图初始化
      this.mapLoading = true;

      // 在实际应用中，这里应该初始化真实的地图服务
      setTimeout(() => {
        this.createSimulatedMap();
        this.mapLoading = false;
      }, 1000);
    },

    // 创建模拟地图（实际应用中替换为真实地图库）
    createSimulatedMap() {
      const mapContainer = document.getElementById('locality-map');
      if (!mapContainer) return;

      // 创建简化的地图显示
      mapContainer.innerHTML = `
        <div class="simulated-map" style="
          width: 100%;
          height: 100%;
          background: linear-gradient(45deg, #e8f4f8 0%, #d1e7dd 50%, #c3e6cb 100%);
          position: relative;
          border: 1px solid #ddd;
          border-radius: 4px;
          overflow: hidden;
        ">
          <div class="map-grid" style="
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-image:
              linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px);
            background-size: 50px 50px;
          "></div>

          <div class="location-marker" style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 30px;
            height: 30px;
            background: #ff4444;
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 0 10px rgba(0,0,0,0.3);
            z-index: 10;
          "></div>

          <div class="accuracy-circle" style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 100px;
            height: 100px;
            border: 2px dashed #409EFF;
            border-radius: 50%;
            background: rgba(64, 158, 255, 0.1);
          "></div>

          <div class="map-info" style="
            position: absolute;
            bottom: 10px;
            left: 10px;
            background: white;
            padding: 8px 12px;
            border-radius: 4px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            font-size: 12px;
            color: #666;
          ">
            Lat: ${this.locality.Latitude}<br>
            Lng: ${this.locality.Longitude}<br>
            <small style="color: #999;">Demo Map - Integrate with real map service</small>
          </div>

          <div class="zoom-controls" style="
            position: absolute;
            top: 10px;
            right: 10px;
            background: white;
            border-radius: 4px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            overflow: hidden;
          ">
            <button onclick="window.demoZoomIn()" style="
              display: block;
              width: 30px;
              height: 30px;
              border: none;
              background: white;
              cursor: pointer;
              border-bottom: 1px solid #eee;
            ">+</button>
            <button onclick="window.demoZoomOut()" style="
              display: block;
              width: 30px;
              height: 30px;
              border: none;
              background: white;
              cursor: pointer;
            ">-</button>
          </div>
        </div>
      `;

      // 添加全局缩放函数（演示用）
      window.demoZoomIn = () => this.zoomIn();
      window.demoZoomOut = () => this.zoomOut();

      // 模拟点击事件
      mapContainer.addEventListener('click', (e) => {
        const rect = mapContainer.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        console.log(`Clicked at: ${x}, ${y}`);
      });
    },

    // 缩放控制
    zoomIn() {
      this.currentZoom = Math.min(this.currentZoom + 1, 20);
      this.$message.info(`Zoomed in to level ${this.currentZoom}`);
    },

    zoomOut() {
      this.currentZoom = Math.max(this.currentZoom - 1, 1);
      this.$message.info(`Zoomed out to level ${this.currentZoom}`);
    },

    resetView() {
      this.currentZoom = 10;
      this.$message.info('View reset to default');
    },

    // 处理地图命令
    handleMapCommand(command) {
      switch (command) {
        case 'satellite':
          this.currentMapType = 'satellite';
          this.$message.info('Switched to satellite view');
          break;
        case 'terrain':
          this.currentMapType = 'terrain';
          this.$message.info('Switched to terrain view');
          break;
        case 'street':
          this.currentMapType = 'roadmap';
          this.$message.info('Switched to street view');
          break;
        case 'fullscreen':
          this.openFullscreenMap();
          break;
        case 'directions':
          this.getDirections();
          break;
        case 'export':
          this.exportMapImage();
          break;
      }
    },

    // 切换图层
    toggleLayer(layerName) {
      this.$message.info(`${this.layers[layerName] ? 'Enabled' : 'Disabled'} ${layerName} layer`);

      if (layerName === 'nearby' && this.layers[layerName]) {
        this.searchNearbyLocalities();
      }
    },

    // 搜索附近地点
    async searchNearbyLocalities() {
      if (!this.layers.nearby) return;

      this.searchingNearby = true;
      this.nearbyLocalities = [];

      try {
        const response = await this.$api.searchLocalityByCoordinates({
          latitude: this.locality.Latitude,
          longitude: this.locality.Longitude,
          radius: this.searchRadius,
          exclude: this.locality.LocalityID
        });

        if (response.code === 20000) {
          this.nearbyLocalities = response.data.items || [];
          this.$message.success(`Found ${this.nearbyLocalities.length} nearby localities`);
        }
      } catch (error) {
        console.error('Failed to search nearby localities:', error);
        this.$message.error('Failed to search nearby localities');
      } finally {
        this.searchingNearby = false;
      }
    },

    // 聚焦到附近地点
    focusOnLocality(locality) {
      this.$message.info(`Focusing on ${locality.LocalityName}`);
      // 在实际地图中，这里会移动地图中心到指定位置
    },

    // 查看附近地点详情
    viewNearbyDetails(locality) {
      this.$emit('view-locality-details', locality);
    },

    // 复制坐标
    copyCoordinates() {
      const coordText = `${this.locality.Latitude}, ${this.locality.Longitude}`;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(coordText).then(() => {
          this.$message.success('Coordinates copied to clipboard');
        }).catch(() => {
          this.fallbackCopyToClipboard(coordText);
        });
      } else {
        this.fallbackCopyToClipboard(coordText);
      }
    },

    // 备用复制方法
    fallbackCopyToClipboard(text) {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        document.execCommand('copy');
        this.$message.success('Coordinates copied to clipboard');
      } catch (err) {
        this.$message.error('Failed to copy coordinates');
      }

      document.body.removeChild(textArea);
    },

    // 打开全屏地图
    openFullscreenMap() {
      this.showFullscreenMap = true;
      this.$nextTick(() => {
        this.initializeFullscreenMap();
      });
    },

    // 初始化全屏地图
    initializeFullscreenMap() {
      const mapContainer = document.getElementById('fullscreen-map');
      if (!mapContainer) return;

      // 创建更大的模拟地图
      mapContainer.innerHTML = `
        <div class="simulated-map" style="
          width: 100%;
          height: calc(100vh - 150px);
          background: linear-gradient(45deg, #e8f4f8 0%, #d1e7dd 50%, #c3e6cb 100%);
          position: relative;
          border: 1px solid #ddd;
          border-radius: 4px;
          overflow: hidden;
        ">
          <div class="map-grid" style="
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-image:
              linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px);
            background-size: 80px 80px;
          "></div>

          <div class="location-marker" style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 40px;
            height: 40px;
            background: #ff4444;
            border: 4px solid white;
            border-radius: 50%;
            box-shadow: 0 0 15px rgba(0,0,0,0.3);
            z-index: 10;
          "></div>

          <div class="map-info" style="
            position: absolute;
            bottom: 20px;
            left: 20px;
            background: white;
            padding: 15px 20px;
            border-radius: 6px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            font-size: 14px;
            color: #666;
          ">
            <h4 style="margin: 0 0 8px 0; color: #333;">${this.locality.LocalityName || 'Locality ' + this.locality.LocalityID}</h4>
            Latitude: ${this.locality.Latitude}<br>
            Longitude: ${this.locality.Longitude}<br>
            <small style="color: #999;">Fullscreen Map View</small>
          </div>
        </div>
      `;
    },

    // 获取路线
    getDirections() {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${this.locality.Latitude},${this.locality.Longitude}`;
      window.open(url, '_blank');
      this.$message.info('Opening Google Maps for directions');
    },

    // 导出地图图像
    exportMapImage() {
      // 在实际应用中，这里会导出地图的图像
      this.$message.info('Map image export is not implemented in demo mode');
    }
  }
};
</script>

<style scoped>
.locality-map-view {
  max-width: 100%;
}

.map-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 15px 0;
  border-bottom: 1px solid #eee;
  margin-bottom: 20px;
}

.locality-info {
  flex: 1;
}

.locality-title {
  margin: 0 0 5px 0;
  color: #333;
  font-size: 18px;
  font-weight: 500;
}

.locality-title i {
  color: #409EFF;
  margin-right: 8px;
}

.locality-subtitle {
  color: #666;
  font-size: 14px;
  margin-bottom: 8px;
}

.coordinates-display {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.coord-label {
  color: #666;
}

.coord-value {
  font-family: monospace;
  font-weight: 500;
  color: #1976d2;
  background: #f0f9ff;
  padding: 2px 6px;
  border-radius: 3px;
}

.copy-btn {
  padding: 2px 6px;
  font-size: 12px;
}

.map-controls {
  display: flex;
  gap: 10px;
  align-items: center;
}

.map-options {
  margin-left: 10px;
}

.map-container {
  margin-bottom: 20px;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  position: relative;
}

.map-canvas {
  border-radius: 6px;
}

.map-loading {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255,255,255,0.8);
  z-index: 1000;
}

.no-coordinates {
  text-align: center;
  padding: 60px 20px;
  background: #f8f9fa;
  border-radius: 6px;
  color: #999;
}

.no-coordinates i {
  font-size: 48px;
  color: #ddd;
  margin-bottom: 15px;
}

.no-coords-text h4 {
  margin: 0 0 10px 0;
  color: #666;
}

.no-coords-text p {
  margin: 0 0 20px 0;
  color: #999;
}

.map-info-panel {
  background: white;
  border-radius: 6px;
  overflow: hidden;
}

.info-content {
  padding: 15px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.info-item label {
  font-weight: 500;
  color: #666;
}

.info-item span {
  color: #333;
}

.layer-controls {
  margin-bottom: 20px;
}

.layer-controls .el-checkbox {
  display: block;
  margin-bottom: 10px;
}

.layer-info {
  padding-top: 15px;
  border-top: 1px solid #f0f0f0;
}

.layer-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.layer-label {
  color: #666;
  font-size: 13px;
}

.layer-value {
  color: #333;
  font-weight: 500;
  font-size: 13px;
}

.nearby-controls {
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #f0f0f0;
}

.radius-display {
  color: #666;
  font-size: 14px;
  font-weight: 500;
}

.nearby-list {
  max-height: 200px;
  overflow-y: auto;
}

.nearby-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.nearby-item:hover {
  border-color: #409EFF;
  background: #f0f9ff;
}

.nearby-info {
  flex: 1;
}

.nearby-name {
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.nearby-details {
  font-size: 12px;
  color: #666;
}

.nearby-details .distance {
  background: #e7f3ff;
  color: #1976d2;
  padding: 1px 6px;
  border-radius: 3px;
  margin-right: 10px;
}

.nearby-details .coords {
  font-family: monospace;
}

.nearby-loading,
.no-nearby {
  text-align: center;
  padding: 20px;
  color: #999;
}

.nearby-loading i {
  margin-right: 8px;
}

.fullscreen-map-dialog .el-dialog__body {
  padding: 0;
}

.fullscreen-map-canvas {
  width: 100%;
  height: calc(100vh - 150px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .map-header {
    flex-direction: column;
    gap: 15px;
  }

  .map-controls {
    align-self: stretch;
    justify-content: space-between;
  }

  .coordinates-display {
    flex-wrap: wrap;
  }

  .nearby-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
</style>
