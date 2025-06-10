<!--
  LocalityMapView.vue
  地点地图查看组件 - 修复版本，正确集成 Google Maps
-->
<template>
  <div class="locality-map-view">
    <!-- 地点信息头部 -->
    <div class="map-header">
      <div class="locality-info">
        <h3 class="locality-title">
          <i class="el-icon-location" />
          {{ locality.LocalityName || locality.FieldNo || `Locality ${locality.Locality1ID}` }}
        </h3>
        <div class="locality-subtitle">
          {{ getLocationString() }}
        </div>
        <div v-if="hasCoordinates" class="coordinates-display">
          <span class="coord-label">Coordinates:</span>
          <span class="coord-value">{{ locality.Lat }}, {{ locality.Lon }}</span>
          <el-button size="mini" class="copy-btn" @click="copyCoordinates">
            <i class="el-icon-copy-document" />
          </el-button>
        </div>
      </div>

      <div class="map-controls">
        <el-button-group>
          <el-button size="small" @click="zoomIn" :disabled="!mapLoaded">
            <i class="el-icon-zoom-in" />
          </el-button>
          <el-button size="small" @click="zoomOut" :disabled="!mapLoaded">
            <i class="el-icon-zoom-out" />
          </el-button>
          <el-button size="small" @click="resetView" :disabled="!mapLoaded">
            <i class="el-icon-refresh" />
          </el-button>
        </el-button-group>

        <el-dropdown class="map-options" @command="handleMapCommand">
          <el-button size="small" :disabled="!mapLoaded">
            Options<i class="el-icon-arrow-down el-icon--right" />
          </el-button>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item command="satellite">Satellite View</el-dropdown-item>
            <el-dropdown-item command="terrain">Terrain View</el-dropdown-item>
            <el-dropdown-item command="roadmap">Road Map</el-dropdown-item>
            <el-dropdown-item divided command="directions">Get Directions</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </div>
    </div>

    <!-- 地图容器 -->
    <div class="map-container">
      <div v-if="hasCoordinates">
        <!-- Google Maps 容器 -->
        <div
          :id="mapContainerId"
          class="map-canvas"
          :style="mapStyle"
        />

        <!-- 地图加载状态 -->
        <div v-if="mapLoading" class="map-loading">
          <div class="loading-content">
            <i class="el-icon-loading" />
            <span>Loading Google Maps...</span>
          </div>
        </div>

        <!-- 地图加载失败 -->
        <div v-if="mapLoadError" class="map-error">
          <div class="error-content">
            <i class="el-icon-warning" />
            <h4>Failed to Load Map</h4>
            <p>{{ mapLoadError }}</p>
            <el-button @click="retryLoadMap" size="small">
              <i class="el-icon-refresh" />
              Retry
            </el-button>
          </div>
        </div>
      </div>

      <!-- 无坐标信息 -->
      <div v-else class="no-coordinates">
        <i class="el-icon-warning-outline" />
        <div class="no-coords-text">
          <h4>No Coordinates Available</h4>
          <p>This locality does not have coordinate information to display on the map.</p>
          <el-button @click="$emit('edit-locality', locality)">
            <i class="el-icon-edit" />
            Add Coordinates
          </el-button>
        </div>
      </div>
    </div>

    <!-- 地图信息面板 -->
    <div v-if="hasCoordinates && mapLoaded" class="map-info-panel">
      <el-card>
        <div slot="header">
          <span>Location Information</span>
        </div>

        <div class="info-content">
          <el-row :gutter="20">
            <el-col :span="12">
              <div class="info-item">
                <label>Latitude:</label>
                <span>{{ locality.Lat }}°</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="info-item">
                <label>Longitude:</label>
                <span>{{ locality.Lon }}°</span>
              </div>
            </el-col>
          </el-row>

          <div class="info-item">
            <label>Zoom Level:</label>
            <span>{{ currentZoom }}</span>
          </div>

          <div class="info-item">
            <label>Map Type:</label>
            <span>{{ currentMapType }}</span>
          </div>
        </div>
      </el-card>
    </div>
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
    },
    googleMapsApiKey: {
      type: String,
      default: () => process.env.VUE_APP_GOOGLE_MAPS_API_KEY || ''
    }
  },
  data() {
    return {
      // 地图状态
      map: null,
      marker: null,
      mapLoading: true,
      mapLoaded: false,
      mapLoadError: null,
      currentZoom: 10,
      currentMapType: 'roadmap',

      // 唯一ID，避免多个组件实例冲突
      mapContainerId: `locality-map-${Math.random().toString(36).substr(2, 9)}`,

      // 地图选项
      defaultMapOptions: {
        zoom: 10,
        mapTypeId: 'roadmap',
        streetViewControl: false,
        mapTypeControl: true,
        fullscreenControl: true,
        zoomControl: true
      }
    }
  },
  computed: {
    hasCoordinates() {
      return this.locality.Lat !== null &&
        this.locality.Lon !== null &&
        this.locality.Lat !== undefined &&
        this.locality.Lon !== undefined &&
        !isNaN(this.locality.Lat) &&
        !isNaN(this.locality.Lon)
    },

    mapStyle() {
      return {
        height: typeof this.height === 'number' ? `${this.height}px` : this.height,
        width: '100%'
      }
    },

    coordinates() {
      if (!this.hasCoordinates) return null
      return {
        lat: Number(this.locality.Lat),
        lng: Number(this.locality.Lon)
      }
    }
  },
  mounted() {
    if (this.hasCoordinates && this.googleMapsApiKey) {
      this.initializeGoogleMaps()
    } else if (!this.googleMapsApiKey) {
      this.mapLoadError = 'Google Maps API Key is required'
      this.mapLoading = false
    } else {
      this.mapLoading = false
    }
  },
  beforeDestroy() {
    this.cleanupMap()
  },
  methods: {
    // 获取位置字符串
    getLocationString() {
      const parts = [
        this.locality.Country,
        this.locality.State,
        this.locality.County
      ].filter(Boolean)

      return parts.join(', ') || 'Unknown location'
    },

    // 初始化 Google Maps
    async initializeGoogleMaps() {
      try {
        this.mapLoading = true
        this.mapLoadError = null

        // 加载 Google Maps API
        await this.loadGoogleMapsAPI()

        // 等待 DOM 元素准备好
        await this.$nextTick()

        // 确保容器元素存在
        const container = document.getElementById(this.mapContainerId)
        if (!container) {
          throw new Error('Map container not found')
        }

        // 创建地图
        this.createMap(container)

      } catch (error) {
        console.error('Failed to initialize Google Maps:', error)
        this.mapLoadError = error.message
        this.mapLoading = false
      }
    },

    // 加载 Google Maps API
    loadGoogleMapsAPI() {
      return new Promise((resolve, reject) => {
        // 如果已经加载，直接返回
        if (window.google && window.google.maps) {
          resolve()
          return
        }

        // 如果正在加载，等待加载完成
        if (window.googleMapsLoading) {
          const checkLoaded = () => {
            if (window.google && window.google.maps) {
              resolve()
            } else {
              setTimeout(checkLoaded, 100)
            }
          }
          checkLoaded()
          return
        }

        // 开始加载
        window.googleMapsLoading = true

        const script = document.createElement('script')
        script.src = `https://maps.googleapis.com/maps/api/js?key=${this.googleMapsApiKey}&libraries=places`
        script.async = true
        script.defer = true

        script.onload = () => {
          window.googleMapsLoading = false
          resolve()
        }

        script.onerror = () => {
          window.googleMapsLoading = false
          reject(new Error('Failed to load Google Maps API'))
        }

        document.head.appendChild(script)
      })
    },

    // 创建地图
    createMap(container) {
      try {
        // 创建地图实例
        this.map = new google.maps.Map(container, {
          ...this.defaultMapOptions,
          center: this.coordinates,
          zoom: this.currentZoom
        })

        // 创建标记
        this.createMarker()

        // 添加事件监听器
        this.addMapEventListeners()

        this.mapLoaded = true
        this.mapLoading = false

        this.$message.success('Google Maps loaded successfully')

      } catch (error) {
        console.error('Failed to create map:', error)
        this.mapLoadError = error.message
        this.mapLoading = false
      }
    },

    // 创建标记
    createMarker() {
      if (!this.map || !this.coordinates) return

      this.marker = new google.maps.Marker({
        position: this.coordinates,
        map: this.map,
        title: this.locality.LocalityString || this.locality.FieldNo || 'Locality',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="8" fill="#ff4444" stroke="#ffffff" stroke-width="3"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(32, 32),
          anchor: new google.maps.Point(16, 16)
        }
      })

      // 添加信息窗口
      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 8px;">
            <h4 style="margin: 0 0 8px 0;">${this.locality.FieldNo || 'Locality'}</h4>
            <p style="margin: 0; color: #666;">${this.locality.LocalityString || 'No description'}</p>
            <p style="margin: 4px 0 0 0; font-size: 12px; color: #999;">
              ${this.locality.Lat}, ${this.locality.Lon}
            </p>
          </div>
        `
      })

      this.marker.addListener('click', () => {
        infoWindow.open(this.map, this.marker)
      })
    },

    // 添加地图事件监听器
    addMapEventListeners() {
      if (!this.map) return

      // 监听缩放变化
      this.map.addListener('zoom_changed', () => {
        this.currentZoom = this.map.getZoom()
      })

      // 监听地图类型变化
      this.map.addListener('maptypeid_changed', () => {
        this.currentMapType = this.map.getMapTypeId()
      })
    },

    // 缩放控制
    zoomIn() {
      if (this.map) {
        this.map.setZoom(this.map.getZoom() + 1)
      }
    },

    zoomOut() {
      if (this.map) {
        this.map.setZoom(this.map.getZoom() - 1)
      }
    },

    resetView() {
      if (this.map && this.coordinates) {
        this.map.setCenter(this.coordinates)
        this.map.setZoom(10)
      }
    },

    // 处理地图命令
    handleMapCommand(command) {
      if (!this.map) return

      switch (command) {
        case 'satellite':
          this.map.setMapTypeId('satellite')
          break
        case 'terrain':
          this.map.setMapTypeId('terrain')
          break
        case 'roadmap':
          this.map.setMapTypeId('roadmap')
          break
        case 'directions':
          this.getDirections()
          break
      }
    },

    // 重新加载地图
    retryLoadMap() {
      this.mapLoadError = null
      this.mapLoaded = false
      this.initializeGoogleMaps()
    },

    // 清理地图
    cleanupMap() {
      if (this.map) {
        google.maps.event.clearInstanceListeners(this.map)
        this.map = null
      }
      if (this.marker) {
        this.marker.setMap(null)
        this.marker = null
      }
    },

    // 复制坐标
    copyCoordinates() {
      const coordText = `${this.locality.Lat}, ${this.locality.Lon}`

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

    // 获取路线
    getDirections() {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${this.locality.Lat},${this.locality.Lon}`
      window.open(url, '_blank')
      this.$message.info('Opening Google Maps for directions')
    }
  }
}
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
  background: rgba(255,255,255,0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-content {
  text-align: center;
  color: #666;
}

.loading-content i {
  font-size: 24px;
  margin-bottom: 10px;
  display: block;
}

.map-error {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 300px;
  background: #f8f9fa;
  border-radius: 6px;
}

.error-content {
  text-align: center;
  color: #999;
}

.error-content i {
  font-size: 48px;
  color: #ddd;
  margin-bottom: 15px;
}

.error-content h4 {
  margin: 0 0 10px 0;
  color: #666;
}

.error-content p {
  margin: 0 0 20px 0;
  color: #999;
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
  margin-top: 20px;
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
}
</style>
