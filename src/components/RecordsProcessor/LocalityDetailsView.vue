<!--
  LocalityDetailsView.vue
  地点详情查看组件
-->
<template>
  <div class="locality-details-view">
    <!-- 基本信息 -->
    <el-card class="details-section">
      <div slot="header">
        <span class="header-title">
          <i class="el-icon-location"></i>
          Basic Information
        </span>
        <el-tag :type="getStatusType()" size="small" style="float: right;">
          ID: {{ locality.Locality1ID }}
        </el-tag>
      </div>

      <el-row :gutter="20">
        <el-col :span="12">
          <div class="detail-item">
            <label>Field No:</label>
            <span class="value field-no">{{ locality.FieldNo || 'N/A' }}</span>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="detail-item">
            <label>Locality String:</label>
            <span class="value">{{ locality.LocalityString || 'N/A' }}</span>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="8">
          <div class="detail-item">
            <label>Country:</label>
            <span class="value">{{ locality.Country || 'N/A' }}</span>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="detail-item">
            <label>State/Province:</label>
            <span class="value">{{ locality.State || 'N/A' }}</span>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="detail-item">
            <label>County:</label>
            <span class="value">{{ locality.County || 'N/A' }}</span>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="8">
          <div class="detail-item">
            <label>Continent:</label>
            <span class="value">{{ locality.Continent || 'N/A' }}</span>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="detail-item">
            <label>Island:</label>
            <span class="value">{{ locality.Island || 'N/A' }}</span>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="detail-item">
            <label>Island Group:</label>
            <span class="value">{{ locality.IslandGroup || 'N/A' }}</span>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 水文信息 -->
    <el-card class="details-section">
      <div slot="header">
        <span class="header-title">
          <i class="el-icon-s-grid"></i>
          Water Features
        </span>
      </div>

      <el-row :gutter="20">
        <el-col :span="12">
          <div class="detail-item">
            <label>Drainage:</label>
            <span class="value">{{ locality.Drainage || 'N/A' }}</span>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="detail-item">
            <label>Water Body:</label>
            <span class="value">{{ locality.WaterBody || 'N/A' }}</span>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 坐标信息 -->
    <el-card class="details-section">
      <div slot="header">
        <span class="header-title">
          <i class="el-icon-map-location"></i>
          Geographic Coordinates
        </span>
        <div style="float: right;">
          <el-button
            v-if="hasCoordinates"
            size="mini"
            @click="copyCoordinates"
          >
            <i class="el-icon-copy-document"></i>
            Copy
          </el-button>
          <el-button
            v-if="hasCoordinates"
            size="mini"
            type="primary"
            @click="openInGoogleMaps"
          >
            <i class="el-icon-location"></i>
            View in Maps
          </el-button>
        </div>
      </div>

      <div v-if="hasCoordinates">
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="detail-item">
              <label>Latitude:</label>
              <span class="value coordinate">{{ locality.Lat }}°</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="detail-item">
              <label>Longitude:</label>
              <span class="value coordinate">{{ locality.Lon }}°</span>
            </div>
          </el-col>
        </el-row>

        <div class="coordinate-display">
          <div class="coord-label">Decimal Degrees:</div>
          <div class="coord-value">{{ locality.Lat }}, {{ locality.Lon }}</div>
        </div>

        <!-- 简单地图预览 -->
        <div class="map-preview">
          <div class="map-container" id="locality-preview-map"></div>
        </div>
      </div>

      <div v-else class="no-coordinates">
        <i class="el-icon-warning-outline"></i>
        <span>No coordinate information available</span>
      </div>
    </el-card>

    <!-- 时间信息 -->
    <el-card class="details-section">
      <div slot="header">
        <span class="header-title">
          <i class="el-icon-time"></i>
          Temporal Information
        </span>
      </div>

      <el-row :gutter="20">
        <el-col :span="12">
          <div class="detail-item">
            <label>Start Date:</label>
            <span class="value">{{ formatDate(locality.StartDate) || 'N/A' }}</span>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="detail-item">
            <label>End Date:</label>
            <span class="value">{{ formatDate(locality.EndDate) || 'N/A' }}</span>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <div class="detail-item">
            <label>Verbatim Date:</label>
            <span class="value">{{ locality.VerbatimDate || 'N/A' }}</span>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="detail-item">
            <label>Collection Year:</label>
            <span class="value">{{ locality.year || 'N/A' }}</span>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="8">
          <div class="detail-item">
            <label>Start Time:</label>
            <span class="value">{{ formatTime(locality.StartTime) || 'N/A' }}</span>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="detail-item">
            <label>End Time:</label>
            <span class="value">{{ formatTime(locality.EndTime) || 'N/A' }}</span>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="detail-item">
            <label>Month/Day:</label>
            <span class="value">{{ formatMonthDay(locality.month, locality.day) || 'N/A' }}</span>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 采集信息 -->
    <el-card class="details-section">
      <div slot="header">
        <span class="header-title">
          <i class="el-icon-user"></i>
          Collection Information
        </span>
      </div>

      <div class="detail-item">
        <label>Verbatim Collectors:</label>
        <div class="value multiline">{{ locality.VerbatimCollectors || 'N/A' }}</div>
      </div>

      <el-row :gutter="20">
        <el-col :span="12">
          <div class="detail-item">
            <label>Inventory:</label>
            <span class="value">{{ locality.Inventory || 'N/A' }}</span>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="detail-item">
            <label>Elevation Method:</label>
            <span class="value">{{ locality.ElevationMethod || 'N/A' }}</span>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 备注信息 -->
    <el-card v-if="locality.Remarks" class="details-section">
      <div slot="header">
        <span class="header-title">
          <i class="el-icon-document"></i>
          Remarks
        </span>
      </div>

      <div class="remarks-content">
        {{ locality.Remarks }}
      </div>
    </el-card>

    <!-- 系统信息 -->
    <el-card class="details-section">
      <div slot="header">
        <span class="header-title">
          <i class="el-icon-info"></i>
          System Information
        </span>
      </div>

      <el-row :gutter="20">
        <el-col :span="12">
          <div class="detail-item">
            <label>Locality ID:</label>
            <span class="value system-id">{{ locality.Locality1ID }}</span>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="detail-item">
            <label>Last Modified:</label>
            <span class="value">{{ formatDateTime(locality.TimeStampModified) || 'N/A' }}</span>
          </div>
        </el-col>
      </el-row>

      <div v-if="locality.ElevationMethodID" class="detail-item">
        <label>Elevation Method ID:</label>
        <span class="value">{{ locality.ElevationMethodID }}</span>
      </div>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'LocalityDetailsView',
  props: {
    locality: {
      type: Object,
      required: true
    }
  },
  computed: {
    hasCoordinates() {
      return this.locality.Lat !== null &&
        this.locality.Lat !== undefined &&
        this.locality.Lon !== null &&
        this.locality.Lon !== undefined
    }
  },
  mounted() {
    if (this.hasCoordinates) {
      this.$nextTick(() => {
        this.initializeMapPreview()
      })
    }
  },
  methods: {
    // 获取状态类型
    getStatusType() {
      if (this.hasCoordinates) {
        return 'success'
      }
      return 'info'
    },

    // 初始化地图预览
    initializeMapPreview() {
      const mapContainer = document.getElementById('locality-preview-map')
      if (!mapContainer) return

      // 创建简化的地图预览
      mapContainer.innerHTML = `
        <div class="simple-map" style="
          width: 100%;
          height: 200px;
          background: linear-gradient(135deg, #e8f4f8 0%, #d1e7dd 100%);
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
              linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px);
            background-size: 30px 30px;
          "></div>

          <div class="location-marker" style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 20px;
            height: 20px;
            background: #ff4444;
            border: 2px solid white;
            border-radius: 50%;
            box-shadow: 0 0 8px rgba(0,0,0,0.3);
            z-index: 10;
          "></div>

          <div class="map-info" style="
            position: absolute;
            bottom: 8px;
            left: 8px;
            background: rgba(255,255,255,0.9);
            padding: 4px 8px;
            border-radius: 3px;
            font-size: 11px;
            color: #666;
            backdrop-filter: blur(2px);
          ">
            ${this.locality.Lat.toFixed(4)}, ${this.locality.Lon.toFixed(4)}
          </div>

          <div class="map-label" style="
            position: absolute;
            top: 8px;
            left: 8px;
            background: rgba(255,255,255,0.9);
            padding: 4px 8px;
            border-radius: 3px;
            font-size: 11px;
            color: #333;
            font-weight: 500;
            backdrop-filter: blur(2px);
          ">
            ${this.locality.FieldNo || 'Locality ' + this.locality.Locality1ID}
          </div>
        </div>
      `
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

    // 在Google Maps中打开
    openInGoogleMaps() {
      const url = `https://www.google.com/maps?q=${this.locality.Lat},${this.locality.Lon}`
      window.open(url, '_blank')
    },

    // 格式化日期
    formatDate(date) {
      if (!date) return null
      try {
        return new Date(date).toLocaleDateString()
      } catch (error) {
        return date
      }
    },

    // 格式化日期时间
    formatDateTime(datetime) {
      if (!datetime) return null
      try {
        return new Date(datetime).toLocaleString()
      } catch (error) {
        return datetime
      }
    },

    // 格式化时间
    formatTime(time) {
      if (!time) return null

      const timeStr = time.toString().padStart(4, '0')
      const hours = timeStr.substring(0, 2)
      const minutes = timeStr.substring(2, 4)
      return `${hours}:${minutes}`
    },

    // 格式化月日
    formatMonthDay(month, day) {
      if (!month && !day) return null

      const monthStr = month ? month.toString().padStart(2, '0') : '--'
      const dayStr = day ? day.toString().padStart(2, '0') : '--'
      return `${monthStr}/${dayStr}`
    }
  }
}
</script>

<style scoped>
.locality-details-view {
  max-width: 900px;
  margin: 0 auto;
}

.details-section {
  margin-bottom: 20px;
}

.header-title {
  font-weight: 500;
  color: #333;
}

.header-title i {
  margin-right: 8px;
  color: #409EFF;
}

.detail-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #f5f5f5;
}

.detail-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.detail-item label {
  font-weight: 500;
  color: #666;
  min-width: 140px;
  margin-right: 15px;
  flex-shrink: 0;
}

.detail-item .value {
  color: #333;
  flex: 1;
}

.detail-item .value.multiline {
  white-space: pre-wrap;
  line-height: 1.4;
}

.field-no {
  font-family: monospace;
  background: #f0f9ff;
  padding: 2px 6px;
  border-radius: 3px;
  color: #1976d2;
  font-weight: 500;
}

.coordinate {
  font-family: monospace;
  font-weight: 500;
  color: #1976d2;
}

.system-id {
  font-family: monospace;
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 3px;
  color: #666;
}

.coordinate-display {
  margin: 15px 0;
  padding: 10px;
  background: #f0f9ff;
  border-radius: 4px;
  border: 1px solid #e0f2fe;
  text-align: center;
}

.coord-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 5px;
}

.coord-value {
  font-size: 16px;
  font-weight: 500;
  color: #1976d2;
  font-family: monospace;
}

.no-coordinates {
  text-align: center;
  color: #999;
  padding: 30px;
  background: #f8f9fa;
  border-radius: 4px;
}

.no-coordinates i {
  font-size: 24px;
  margin-right: 8px;
}

.map-preview {
  margin-top: 15px;
}

.map-container {
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.remarks-content {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
  line-height: 1.6;
  color: #333;
  white-space: pre-wrap;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .locality-details-view {
    padding: 10px;
  }

  .detail-item {
    flex-direction: column;
    align-items: flex-start;
  }

  .detail-item label {
    min-width: auto;
    margin-bottom: 4px;
    margin-right: 0;
  }

  .coordinate-display {
    text-align: left;
  }
}

/* 打印样式 */
@media print {
  .locality-details-view {
    max-width: none;
  }

  .details-section {
    break-inside: avoid;
    margin-bottom: 15px;
  }

  .map-preview {
    display: none;
  }
}
</style>
