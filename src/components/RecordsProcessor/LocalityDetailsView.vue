<!--
  LocalityDetailsView.vue
  地点详情查看组件
-->
<template>
  <div class="locality-details-view">
    <!-- 基本信息 -->
    <el-card class="details-section">
      <div slot="header" class="section-header">
        <i class="el-icon-location-outline"></i>
        Basic Information
      </div>

      <div class="details-content">
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="detail-item">
              <label>Locality ID:</label>
              <span class="detail-value">{{locality.LocalityID}}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="detail-item">
              <label>Locality Name:</label>
              <span class="detail-value">{{locality.LocalityName || 'N/A'}}</span>
            </div>
          </el-col>
        </el-row>

        <div v-if="locality.LocalityString" class="detail-item full-width">
          <label>Locality Description:</label>
          <div class="detail-value description">{{locality.LocalityString}}</div>
        </div>
      </div>
    </el-card>

    <!-- 地理信息 -->
    <el-card class="details-section">
      <div slot="header" class="section-header">
        <i class="el-icon-location"></i>
        Geographic Information
      </div>

      <div class="details-content">
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="detail-item">
              <label>Country:</label>
              <span class="detail-value">{{locality.Country || 'N/A'}}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="detail-item">
              <label>State/Province:</label>
              <span class="detail-value">{{locality.State || 'N/A'}}</span>
            </div>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <div class="detail-item">
              <label>County:</label>
              <span class="detail-value">{{locality.County || 'N/A'}}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="detail-item">
              <label>Drainage:</label>
              <span class="detail-value">{{locality.Drainage || 'N/A'}}</span>
            </div>
          </el-col>
        </el-row>

        <div v-if="locality.Waterbody" class="detail-item">
          <label>Water Body:</label>
          <span class="detail-value">{{locality.Waterbody}}</span>
        </div>
      </div>
    </el-card>

    <!-- 坐标信息 -->
    <el-card class="details-section">
      <div slot="header" class="section-header">
        <i class="el-icon-map-location"></i>
        Coordinates
        <el-button
          v-if="hasCoordinates"
          size="mini"
          style="float: right;"
          @click="viewOnMap">
          <i class="el-icon-location"></i>
          View on Map
        </el-button>
      </div>

      <div class="details-content">
        <div v-if="hasCoordinates">
          <el-row :gutter="20">
            <el-col :span="12">
              <div class="detail-item">
                <label>Latitude:</label>
                <span class="detail-value coordinate">{{locality.Latitude}}°</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="detail-item">
                <label>Longitude:</label>
                <span class="detail-value coordinate">{{locality.Longitude}}°</span>
              </div>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <div class="detail-item">
                <label>Coordinate System:</label>
                <span class="detail-value">{{locality.CoordinateSystem || 'Unknown'}}</span>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="detail-item">
                <label>Accuracy:</label>
                <span class="detail-value">
                  {{locality.CoordinateAccuracy ? locality.CoordinateAccuracy + ' meters' : 'Unknown'}}
                </span>
              </div>
            </el-col>
          </el-row>

          <!-- 坐标格式显示 -->
          <div class="coordinate-formats">
            <div class="format-label">Coordinate Formats:</div>
            <el-row :gutter="20">
              <el-col :span="8">
                <div class="format-item">
                  <label>Decimal Degrees:</label>
                  <span class="format-value">{{formatDecimalDegrees()}}</span>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="format-item">
                  <label>DMS:</label>
                  <span class="format-value">{{formatDMS()}}</span>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="format-item">
                  <label>UTM (approx):</label>
                  <span class="format-value">{{formatUTM()}}</span>
                </div>
              </el-col>
            </el-row>
          </div>
        </div>

        <div v-else class="no-coordinates">
          <i class="el-icon-info"></i>
          No coordinate information available
        </div>
      </div>
    </el-card>

    <!-- 环境信息 -->
    <el-card class="details-section">
      <div slot="header" class="section-header">
        <i class="el-icon-s-data"></i>
        Environmental Information
      </div>

      <div class="details-content">
        <el-row :gutter="20">
          <el-col :span="12">
            <div class="detail-item">
              <label>Elevation:</label>
              <span class="detail-value">
                {{locality.Elevation !== null ? locality.Elevation + ' meters' : 'N/A'}}
              </span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="detail-item">
              <label>Depth:</label>
              <span class="detail-value">
                {{locality.Depth !== null ? locality.Depth + ' meters' : 'N/A'}}
              </span>
            </div>
          </el-col>
        </el-row>

        <div v-if="locality.Habitat" class="detail-item">
          <label>Habitat:</label>
          <div class="detail-value description">{{locality.Habitat}}</div>
        </div>
      </div>
    </el-card>

    <!-- 附加信息 -->
    <el-card v-if="locality.Notes || hasMetadata" class="details-section">
      <div slot="header" class="section-header">
        <i class="el-icon-document"></i>
        Additional Information
      </div>

      <div class="details-content">
        <div v-if="locality.Notes" class="detail-item">
          <label>Notes:</label>
          <div class="detail-value description">{{locality.Notes}}</div>
        </div>

        <!-- 元数据信息 -->
        <div v-if="hasMetadata" class="metadata-section">
          <div class="metadata-label">Metadata:</div>
          <el-row :gutter="20">
            <el-col :span="12" v-if="locality.CreatedDate">
              <div class="detail-item">
                <label>Created:</label>
                <span class="detail-value">{{formatDate(locality.CreatedDate)}}</span>
              </div>
            </el-col>
            <el-col :span="12" v-if="locality.ModifiedDate">
              <div class="detail-item">
                <label>Last Modified:</label>
                <span class="detail-value">{{formatDate(locality.ModifiedDate)}}</span>
              </div>
            </el-col>
          </el-row>

          <el-row :gutter="20" v-if="locality.CreatedBy || locality.ModifiedBy">
            <el-col :span="12" v-if="locality.CreatedBy">
              <div class="detail-item">
                <label>Created By:</label>
                <span class="detail-value">{{locality.CreatedBy}}</span>
              </div>
            </el-col>
            <el-col :span="12" v-if="locality.ModifiedBy">
              <div class="detail-item">
                <label>Modified By:</label>
                <span class="detail-value">{{locality.ModifiedBy}}</span>
              </div>
            </el-col>
          </el-row>
        </div>
      </div>
    </el-card>

    <!-- 相关记录统计 -->
    <el-card class="details-section">
      <div slot="header" class="section-header">
        <i class="el-icon-pie-chart"></i>
        Usage Statistics
        <el-button
          size="mini"
          style="float: right;"
          @click="loadRelatedRecords">
          <i class="el-icon-refresh"></i>
          Refresh
        </el-button>
      </div>

      <div class="details-content">
        <div v-if="relatedRecords" class="statistics">
          <el-row :gutter="20">
            <el-col :span="12">
              <div class="stat-item">
                <div class="stat-number">{{relatedRecords.totalRecords || 0}}</div>
                <div class="stat-label">Total Records</div>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="stat-item">
                <div class="stat-number">{{relatedRecords.recentRecords || 0}}</div>
                <div class="stat-label">Recent Records (30 days)</div>
              </div>
            </el-col>
          </el-row>

          <div v-if="relatedRecords.species && relatedRecords.species.length > 0" class="species-list">
            <div class="species-label">Common Species at this Location:</div>
            <el-tag
              v-for="species in relatedRecords.species.slice(0, 5)"
              :key="species.id"
              size="small"
              class="species-tag">
              {{species.name}} ({{species.count}})
            </el-tag>
            <span v-if="relatedRecords.species.length > 5" class="more-species">
              and {{relatedRecords.species.length - 5}} more...
            </span>
          </div>
        </div>

        <div v-else class="loading-stats">
          <el-button @click="loadRelatedRecords" :loading="loadingStats">
            <i class="el-icon-search"></i>
            Load Statistics
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <el-button @click="editLocality">
        <i class="el-icon-edit"></i>
        Edit Locality
      </el-button>
      <el-button @click="copyCoordinates" :disabled="!hasCoordinates">
        <i class="el-icon-copy-document"></i>
        Copy Coordinates
      </el-button>
      <el-button @click="exportDetails">
        <i class="el-icon-download"></i>
        Export Details
      </el-button>
    </div>
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
  data() {
    return {
      relatedRecords: null,
      loadingStats: false
    }
  },
  computed: {
    hasCoordinates() {
      return this.locality.Latitude !== null &&
        this.locality.Longitude !== null &&
        this.locality.Latitude !== undefined &&
        this.locality.Longitude !== undefined;
    },

    hasMetadata() {
      return this.locality.CreatedDate ||
        this.locality.ModifiedDate ||
        this.locality.CreatedBy ||
        this.locality.ModifiedBy;
    }
  },
  methods: {
    // 格式化十进制度数
    formatDecimalDegrees() {
      if (!this.hasCoordinates) return 'N/A';
      return `${this.locality.Latitude}°, ${this.locality.Longitude}°`;
    },

    // 格式化度分秒
    formatDMS() {
      if (!this.hasCoordinates) return 'N/A';

      const lat = this.locality.Latitude;
      const lng = this.locality.Longitude;

      const latDMS = this.convertToDMS(Math.abs(lat));
      const lngDMS = this.convertToDMS(Math.abs(lng));

      const latDir = lat >= 0 ? 'N' : 'S';
      const lngDir = lng >= 0 ? 'E' : 'W';

      return `${latDMS}${latDir}, ${lngDMS}${lngDir}`;
    },

    // 转换为度分秒格式
    convertToDMS(decimal) {
      const degrees = Math.floor(decimal);
      const minutes = Math.floor((decimal - degrees) * 60);
      const seconds = ((decimal - degrees) * 60 - minutes) * 60;

      return `${degrees}°${minutes}'${seconds.toFixed(2)}"`;
    },

    // 格式化UTM坐标（简化版）
    formatUTM() {
      if (!this.hasCoordinates) return 'N/A';

      // 简化的UTM区域计算
      const zone = Math.floor((this.locality.Longitude + 180) / 6) + 1;
      const hemisphere = this.locality.Latitude >= 0 ? 'N' : 'S';

      return `Zone ${zone}${hemisphere} (approx)`;
    },

    // 查看地图
    viewOnMap() {
      this.$emit('view-on-map', this.locality);
    },

    // 加载相关记录
    async loadRelatedRecords() {
      this.loadingStats = true;
      try {
        const response = await this.$api.getLocalityStatistics(this.locality.LocalityID);
        if (response.code === 20000) {
          this.relatedRecords = response.data;
        }
      } catch (error) {
        console.error('Failed to load locality statistics:', error);
        this.$message.error('Failed to load usage statistics');
      } finally {
        this.loadingStats = false;
      }
    },

    // 编辑地点
    editLocality() {
      this.$emit('edit-locality', this.locality);
    },

    // 复制坐标
    copyCoordinates() {
      if (!this.hasCoordinates) {
        this.$message.warning('No coordinates available to copy');
        return;
      }

      const coordText = `${this.locality.Latitude}, ${this.locality.Longitude}`;

      // 尝试使用现代浏览器的 Clipboard API
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

    // 导出详情
    exportDetails() {
      const details = {
        localityId: this.locality.LocalityID,
        name: this.locality.LocalityName,
        description: this.locality.LocalityString,
        country: this.locality.Country,
        state: this.locality.State,
        county: this.locality.County,
        drainage: this.locality.Drainage,
        waterbody: this.locality.Waterbody,
        coordinates: this.hasCoordinates ? {
          latitude: this.locality.Latitude,
          longitude: this.locality.Longitude,
          system: this.locality.CoordinateSystem,
          accuracy: this.locality.CoordinateAccuracy
        } : null,
        elevation: this.locality.Elevation,
        depth: this.locality.Depth,
        habitat: this.locality.Habitat,
        notes: this.locality.Notes,
        metadata: {
          created: this.locality.CreatedDate,
          modified: this.locality.ModifiedDate,
          createdBy: this.locality.CreatedBy,
          modifiedBy: this.locality.ModifiedBy
        }
      };

      const jsonStr = JSON.stringify(details, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `locality_${this.locality.LocalityID}_details.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      this.$message.success('Locality details exported');
    },

    // 格式化日期
    formatDate(dateStr) {
      if (!dateStr) return 'N/A';
      try {
        return new Date(dateStr).toLocaleString();
      } catch (error) {
        return dateStr;
      }
    }
  }
};
</script>

<style scoped>
.locality-details-view {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.details-section {
  margin-bottom: 20px;
}

.section-header {
  font-weight: 500;
  color: #333;
}

.section-header i {
  margin-right: 8px;
  color: #409EFF;
}

.details-content {
  padding: 15px 0;
}

.detail-item {
  margin-bottom: 15px;
  display: flex;
  align-items: flex-start;
}

.detail-item.full-width {
  flex-direction: column;
}

.detail-item label {
  font-weight: 500;
  color: #666;
  min-width: 120px;
  margin-right: 15px;
}

.detail-value {
  color: #333;
  flex: 1;
}

.detail-value.coordinate {
  font-family: monospace;
  font-weight: 500;
  color: #1976d2;
}

.detail-value.description {
  background: #f8f9fa;
  padding: 10px;
  border-radius: 4px;
  border-left: 3px solid #409EFF;
  margin-top: 5px;
  line-height: 1.6;
}

.coordinate-formats {
  margin-top: 20px;
  padding: 15px;
  background: #f0f9ff;
  border-radius: 6px;
  border: 1px solid #e0f2fe;
}

.format-label {
  font-weight: 500;
  color: #333;
  margin-bottom: 10px;
}

.format-item {
  margin-bottom: 8px;
}

.format-item label {
  font-size: 12px;
  color: #666;
  display: block;
  margin-bottom: 2px;
}

.format-value {
  font-family: monospace;
  font-size: 13px;
  color: #1976d2;
  background: white;
  padding: 4px 8px;
  border-radius: 3px;
  border: 1px solid #e0e0e0;
}

.no-coordinates {
  text-align: center;
  color: #999;
  padding: 30px;
}

.metadata-section {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #e0e0e0;
}

.metadata-label {
  font-weight: 500;
  color: #333;
  margin-bottom: 10px;
}

.statistics {
  padding: 10px 0;
}

.stat-item {
  text-align: center;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 6px;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #1976d2;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

.species-list {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #e0e0e0;
}

.species-label {
  font-weight: 500;
  color: #333;
  margin-bottom: 10px;
}

.species-tag {
  margin-right: 8px;
  margin-bottom: 5px;
}

.more-species {
  color: #666;
  font-size: 12px;
  font-style: italic;
}

.loading-stats {
  text-align: center;
  padding: 20px;
}

.action-buttons {
  margin-top: 30px;
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
}

.action-buttons .el-button {
  margin: 0 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .locality-details-view {
    padding: 10px;
  }

  .detail-item {
    flex-direction: column;
  }

  .detail-item label {
    min-width: auto;
    margin-right: 0;
    margin-bottom: 5px;
  }
}
</style>
