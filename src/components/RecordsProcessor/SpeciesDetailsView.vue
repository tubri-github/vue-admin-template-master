
<!--
  SpeciesDetailsView.vue
  物种详情查看组件
-->
<template>
  <div class="species-details-view">
    <!-- 物种基本信息 -->
    <el-card class="details-section">
      <div slot="header" class="section-header">
        <i class="el-icon-collection"></i>
        Taxonomic Information
        <el-tag
          :type="getStatusType()"
          size="small"
          style="float: right;">
          {{species.Status}}
        </el-tag>
      </div>

      <div class="details-content">
        <div class="species-name-display">
          <h2 class="scientific-name">{{species.FullName}}</h2>
          <div v-if="species.CommonName" class="common-name">
            Common Name: {{species.CommonName}}
          </div>
        </div>

        <el-row :gutter="20">
          <el-col :span="12">
            <div class="detail-item">
              <label>Taxon ID:</label>
              <span class="detail-value">{{species.TaxonID}}</span>
            </div>
          </el-col>
          <el-col :span="12">
            <div class="detail-item">
              <label>Status:</label>
              <span class="detail-value">
                <el-tag :type="getStatusType()" size="mini">{{species.Status}}</el-tag>
              </span>
            </div>
          </el-col>
        </el-row>

        <div v-if="species.Author" class="detail-item">
          <label>Author:</label>
          <span class="detail-value author">{{species.Author}}</span>
        </div>

        <div v-if="species.Status === 'Synonym' && species.ValidName" class="synonym-info">
          <div class="synonym-label">Valid Name:</div>
          <div class="valid-name">{{species.ValidName}}</div>
        </div>
      </div>
    </el-card>

    <!-- 分类等级 -->
    <el-card class="details-section">
      <div slot="header" class="section-header">
        <i class="el-icon-s-grid"></i>
        Taxonomic Hierarchy
      </div>

      <div class="details-content">
        <div class="taxonomy-tree">
          <div v-if="species.Kingdom" class="taxonomy-level kingdom">
            <span class="taxonomy-rank">Kingdom:</span>
            <span class="taxonomy-name">{{species.Kingdom}}</span>
          </div>
          <div v-if="species.Phylum" class="taxonomy-level phylum">
            <span class="taxonomy-rank">Phylum:</span>
            <span class="taxonomy-name">{{species.Phylum}}</span>
          </div>
          <div v-if="species.Class" class="taxonomy-level class">
            <span class="taxonomy-rank">Class:</span>
            <span class="taxonomy-name">{{species.Class}}</span>
          </div>
          <div v-if="species.Order" class="taxonomy-level order">
            <span class="taxonomy-rank">Order:</span>
            <span class="taxonomy-name">{{species.Order}}</span>
          </div>
          <div v-if="species.Family" class="taxonomy-level family">
            <span class="taxonomy-rank">Family:</span>
            <span class="taxonomy-name">{{species.Family}}</span>
          </div>
          <div class="taxonomy-level genus">
            <span class="taxonomy-rank">Genus:</span>
            <span class="taxonomy-name">{{species.Genus}}</span>
          </div>
          <div class="taxonomy-level species">
            <span class="taxonomy-rank">Species:</span>
            <span class="taxonomy-name">{{species.Species}}</span>
          </div>
          <div v-if="species.Subspecies" class="taxonomy-level subspecies">
            <span class="taxonomy-rank">Subspecies:</span>
            <span class="taxonomy-name">{{species.Subspecies}}</span>
          </div>
        </div>

        <!-- 分类学名称构建 -->
        <div class="name-construction">
          <div class="construction-label">Scientific Name Construction:</div>
          <div class="construction-breakdown">
            <span class="name-part genus">{{species.Genus}}</span>
            <span class="name-part species">{{species.Species}}</span>
            <span v-if="species.Subspecies" class="name-part subspecies">{{species.Subspecies}}</span>
            <span v-if="species.Author" class="name-part author">{{species.Author}}</span>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 相关信息 -->
    <el-card class="details-section">
      <div slot="header" class="section-header">
        <i class="el-icon-document"></i>
        Additional Information
      </div>

      <div class="details-content">
        <div v-if="species.Notes" class="detail-item">
          <label>Notes:</label>
          <div class="detail-value description">{{species.Notes}}</div>
        </div>

        <!-- 元数据信息 -->
        <div v-if="hasMetadata" class="metadata-section">
          <div class="metadata-label">Metadata:</div>
          <el-row :gutter="20">
            <el-col :span="12" v-if="species.CreatedDate">
              <div class="detail-item">
                <label>Created:</label>
                <span class="detail-value">{{formatDate(species.CreatedDate)}}</span>
              </div>
            </el-col>
            <el-col :span="12" v-if="species.ModifiedDate">
              <div class="detail-item">
                <label>Last Modified:</label>
                <span class="detail-value">{{formatDate(species.ModifiedDate)}}</span>
              </div>
            </el-col>
          </el-row>

          <el-row :gutter="20" v-if="species.CreatedBy || species.ModifiedBy">
            <el-col :span="12" v-if="species.CreatedBy">
              <div class="detail-item">
                <label>Created By:</label>
                <span class="detail-value">{{species.CreatedBy}}</span>
              </div>
            </el-col>
            <el-col :span="12" v-if="species.ModifiedBy">
              <div class="detail-item">
                <label>Modified By:</label>
                <span class="detail-value">{{species.ModifiedBy}}</span>
              </div>
            </el-col>
          </el-row>
        </div>
      </div>
    </el-card>

    <!-- 标本记录统计 -->
    <el-card class="details-section">
      <div slot="header" class="section-header">
        <i class="el-icon-pie-chart"></i>
        Specimen Records
        <el-button
          size="mini"
          style="float: right;"
          @click="loadSpecimenRecords">
          <i class="el-icon-refresh"></i>
          Refresh
        </el-button>
      </div>

      <div class="details-content">
        <div v-if="specimenStats" class="statistics">
          <el-row :gutter="20">
            <el-col :span="8">
              <div class="stat-item">
                <div class="stat-number">{{specimenStats.totalRecords || 0}}</div>
                <div class="stat-label">Total Records</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="stat-item">
                <div class="stat-number">{{specimenStats.totalSpecimens || 0}}</div>
                <div class="stat-label">Total Specimens</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="stat-item">
                <div class="stat-number">{{specimenStats.recentRecords || 0}}</div>
                <div class="stat-label">Recent Records (30 days)</div>
              </div>
            </el-col>
          </el-row>

          <!-- 地点分布 -->
          <div v-if="specimenStats.localities && specimenStats.localities.length > 0" class="localities-section">
            <div class="localities-label">Collection Localities:</div>
            <div class="localities-list">
              <div
                v-for="locality in specimenStats.localities.slice(0, 8)"
                :key="locality.id"
                class="locality-item"
                @click="viewLocalityDetails(locality)">
                <div class="locality-info">
                  <div class="locality-name">{{locality.name}}</div>
                  <div class="locality-details">
                    <span class="record-count">{{locality.recordCount}} records</span>
                    <span class="location">{{locality.country}}, {{locality.state}}</span>
                  </div>
                </div>
              </div>
              <div v-if="specimenStats.localities.length > 8" class="more-localities">
                and {{specimenStats.localities.length - 8}} more localities...
              </div>
            </div>
          </div>

          <!-- 采集日期范围 -->
          <div v-if="specimenStats.dateRange" class="date-range-section">
            <div class="date-range-label">Collection Date Range:</div>
            <div class="date-range-display">
              <span class="date-start">{{formatDate(specimenStats.dateRange.earliest)}}</span>
              <span class="date-separator">to</span>
              <span class="date-end">{{formatDate(specimenStats.dateRange.latest)}}</span>
              <span class="date-span">({{calculateDateSpan(specimenStats.dateRange)}})</span>
            </div>
          </div>
        </div>

        <div v-else class="loading-stats">
          <el-button @click="loadSpecimenRecords" :loading="loadingStats">
            <i class="el-icon-search"></i>
            Load Specimen Records
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 相关物种 -->
    <el-card class="details-section">
      <div slot="header" class="section-header">
        <i class="el-icon-connection"></i>
        Related Species
        <el-button
          size="mini"
          style="float: right;"
          @click="loadRelatedSpecies">
          <i class="el-icon-refresh"></i>
          Find Related
        </el-button>
      </div>

      <div class="details-content">
        <div v-if="relatedSpecies && relatedSpecies.length > 0">
          <!-- 同属物种 -->
          <div v-if="sameGenus.length > 0" class="related-group">
            <div class="related-group-title">
              <i class="el-icon-collection-tag"></i>
              Same Genus ({{species.Genus}})
            </div>
            <div class="related-list">
              <div
                v-for="related in sameGenus.slice(0, 5)"
                :key="related.TaxonID"
                class="related-item"
                @click="viewSpeciesDetails(related)">
                <div class="related-name">{{related.FullName}}</div>
                <div class="related-status">
                  <el-tag :type="getStatusType(related.Status)" size="mini">
                    {{related.Status}}
                  </el-tag>
                </div>
              </div>
              <div v-if="sameGenus.length > 5" class="more-related">
                and {{sameGenus.length - 5}} more species in this genus...
              </div>
            </div>
          </div>

          <!-- 同科物种 -->
          <div v-if="sameFamily.length > 0" class="related-group">
            <div class="related-group-title">
              <i class="el-icon-files"></i>
              Same Family ({{species.Family}})
            </div>
            <div class="related-list">
              <div
                v-for="related in sameFamily.slice(0, 3)"
                :key="related.TaxonID"
                class="related-item"
                @click="viewSpeciesDetails(related)">
                <div class="related-name">{{related.FullName}}</div>
                <div class="related-status">
                  <el-tag :type="getStatusType(related.Status)" size="mini">
                    {{related.Status}}
                  </el-tag>
                </div>
              </div>
              <div v-if="sameFamily.length > 3" class="more-related">
                and {{sameFamily.length - 3}} more species in this family...
              </div>
            </div>
          </div>

          <!-- 同名异物 -->
          <div v-if="synonyms.length > 0" class="related-group">
            <div class="related-group-title">
              <i class="el-icon-warning"></i>
              Synonyms and Related Names
            </div>
            <div class="related-list">
              <div
                v-for="synonym in synonyms"
                :key="synonym.TaxonID"
                class="related-item synonym"
                @click="viewSpeciesDetails(synonym)">
                <div class="related-name">{{synonym.FullName}}</div>
                <div class="related-status">
                  <el-tag type="warning" size="mini">{{synonym.Status}}</el-tag>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="loadingRelated" class="loading-related">
          <i class="el-icon-loading"></i>
          Loading related species...
        </div>

        <div v-else class="no-related">
          <i class="el-icon-info"></i>
          No related species information loaded
        </div>
      </div>
    </el-card>

    <!-- 外部资源链接 -->
    <el-card class="details-section">
      <div slot="header" class="section-header">
        <i class="el-icon-link"></i>
        External Resources
      </div>

      <div class="details-content">
        <div class="external-links">
          <el-button
            v-for="link in externalLinks"
            :key="link.name"
            size="small"
            @click="openExternalLink(link)"
            class="external-link-btn">
            <i :class="link.icon"></i>
            {{link.name}}
          </el-button>
        </div>

        <div class="search-suggestions">
          <div class="suggestions-label">Search this species in:</div>
          <el-tag
            v-for="suggestion in searchSuggestions"
            :key="suggestion.name"
            size="small"
            class="suggestion-tag"
            @click="searchInDatabase(suggestion)">
            {{suggestion.name}}
          </el-tag>
        </div>
      </div>
    </el-card>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <el-button @click="editSpecies">
        <i class="el-icon-edit"></i>
        Edit Species
      </el-button>
      <el-button @click="copySpeciesName">
        <i class="el-icon-copy-document"></i>
        Copy Name
      </el-button>
      <el-button @click="exportDetails">
        <i class="el-icon-download"></i>
        Export Details
      </el-button>
      <el-button @click="viewSpecimenRecords">
        <i class="el-icon-view"></i>
        View All Records
      </el-button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SpeciesDetailsView',
  props: {
    species: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      specimenStats: null,
      loadingStats: false,
      relatedSpecies: [],
      loadingRelated: false,

      // 外部资源链接
      externalLinks: [
        {
          name: 'FishBase',
          icon: 'el-icon-link',
          url: 'https://www.fishbase.org/search.php?lang=English&generic={genus}&species={species}'
        },
        {
          name: 'GBIF',
          icon: 'el-icon-link',
          url: 'https://www.gbif.org/species/search?q={fullname}'
        },
        {
          name: 'EOL',
          icon: 'el-icon-link',
          url: 'https://eol.org/search?q={fullname}'
        },
        {
          name: 'ITIS',
          icon: 'el-icon-link',
          url: 'https://www.itis.gov/servlet/SingleRpt/SingleRpt?search_topic=Scientific_Name&search_value={fullname}'
        }
      ],

      // 搜索建议
      searchSuggestions: [
        { name: 'Google Scholar', icon: 'el-icon-search' },
        { name: 'PubMed', icon: 'el-icon-document' },
        { name: 'ResearchGate', icon: 'el-icon-connection' },
        { name: 'NCBI Taxonomy', icon: 'el-icon-s-grid' }
      ]
    }
  },
  computed: {
    hasMetadata() {
      return this.species.CreatedDate ||
        this.species.ModifiedDate ||
        this.species.CreatedBy ||
        this.species.ModifiedBy;
    },

    sameGenus() {
      return this.relatedSpecies.filter(s =>
        s.Genus === this.species.Genus && s.TaxonID !== this.species.TaxonID
      );
    },

    sameFamily() {
      return this.relatedSpecies.filter(s =>
        s.Family === this.species.Family &&
        s.Genus !== this.species.Genus
      );
    },

    synonyms() {
      return this.relatedSpecies.filter(s =>
        s.Status === 'Synonym' ||
        (s.ValidName && s.ValidName.includes(this.species.FullName))
      );
    }
  },
  methods: {
    // 获取状态类型
    getStatusType(status = this.species.Status) {
      const typeMap = {
        'Valid': 'success',
        'Invalid': 'danger',
        'Synonym': 'warning',
        'Uncertain': 'info'
      };
      return typeMap[status] || '';
    },

    // 加载标本记录统计
    async loadSpecimenRecords() {
      this.loadingStats = true;
      try {
        const response = await this.$api.getSpeciesStatistics(this.species.TaxonID);
        if (response.code === 20000) {
          this.specimenStats = response.data;
        }
      } catch (error) {
        console.error('Failed to load specimen statistics:', error);
        this.$message.error('Failed to load specimen records');
      } finally {
        this.loadingStats = false;
      }
    },

    // 加载相关物种
    async loadRelatedSpecies() {
      this.loadingRelated = true;
      try {
        const response = await this.$api.getRelatedSpecies(this.species.TaxonID);
        if (response.code === 20000) {
          this.relatedSpecies = response.data.items || [];
        }
      } catch (error) {
        console.error('Failed to load related species:', error);
        this.$message.error('Failed to load related species');
      } finally {
        this.loadingRelated = false;
      }
    },

    // 查看地点详情
    viewLocalityDetails(locality) {
      this.$emit('view-locality', locality);
    },

    // 查看物种详情
    viewSpeciesDetails(species) {
      this.$emit('view-species', species);
    },

    // 打开外部链接
    openExternalLink(link) {
      let url = link.url
        .replace('{genus}', encodeURIComponent(this.species.Genus))
        .replace('{species}', encodeURIComponent(this.species.Species))
        .replace('{fullname}', encodeURIComponent(this.species.FullName));

      window.open(url, '_blank');
      this.$message.info(`Opening ${link.name}...`);
    },

    // 在数据库中搜索
    searchInDatabase(suggestion) {
      const searchTerms = {
        'Google Scholar': `"${this.species.FullName}" fish taxonomy`,
        'PubMed': this.species.FullName,
        'ResearchGate': this.species.FullName,
        'NCBI Taxonomy': this.species.FullName
      };

      const urls = {
        'Google Scholar': `https://scholar.google.com/scholar?q=${encodeURIComponent(searchTerms[suggestion.name])}`,
        'PubMed': `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(searchTerms[suggestion.name])}`,
        'ResearchGate': `https://www.researchgate.net/search.Search.html?type=publication&query=${encodeURIComponent(searchTerms[suggestion.name])}`,
        'NCBI Taxonomy': `https://www.ncbi.nlm.nih.gov/taxonomy/?term=${encodeURIComponent(searchTerms[suggestion.name])}`
      };

      const url = urls[suggestion.name];
      if (url) {
        window.open(url, '_blank');
        this.$message.info(`Searching in ${suggestion.name}...`);
      }
    },

    // 编辑物种
    editSpecies() {
      this.$emit('edit-species', this.species);
    },

    // 复制物种名称
    copySpeciesName() {
      const text = this.species.FullName;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          this.$message.success('Species name copied to clipboard');
        }).catch(() => {
          this.fallbackCopyToClipboard(text);
        });
      } else {
        this.fallbackCopyToClipboard(text);
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
        this.$message.success('Species name copied to clipboard');
      } catch (err) {
        this.$message.error('Failed to copy species name');
      }

      document.body.removeChild(textArea);
    },

    // 导出详情
    exportDetails() {
      const details = {
        taxonId: this.species.TaxonID,
        fullName: this.species.FullName,
        commonName: this.species.CommonName,
        status: this.species.Status,
        author: this.species.Author,
        taxonomy: {
          kingdom: this.species.Kingdom,
          phylum: this.species.Phylum,
          class: this.species.Class,
          order: this.species.Order,
          family: this.species.Family,
          genus: this.species.Genus,
          species: this.species.Species,
          subspecies: this.species.Subspecies
        },
        notes: this.species.Notes,
        metadata: {
          created: this.species.CreatedDate,
          modified: this.species.ModifiedDate,
          createdBy: this.species.CreatedBy,
          modifiedBy: this.species.ModifiedBy
        },
        specimenStats: this.specimenStats,
        exportedAt: new Date().toISOString()
      };

      const jsonStr = JSON.stringify(details, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `species_${this.species.TaxonID}_details.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      this.$message.success('Species details exported');
    },

    // 查看所有标本记录
    viewSpecimenRecords() {
      this.$emit('view-specimen-records', this.species);
    },

    // 计算日期跨度
    calculateDateSpan(dateRange) {
      if (!dateRange.earliest || !dateRange.latest) return '';

      const start = new Date(dateRange.earliest);
      const end = new Date(dateRange.latest);
      const years = end.getFullYear() - start.getFullYear();

      if (years < 1) {
        const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
        return months <= 1 ? 'Less than 1 month' : `${months} months`;
      } else {
        return years === 1 ? '1 year' : `${years} years`;
      }
    },

    // 格式化日期
    formatDate(dateStr) {
      if (!dateStr) return 'N/A';
      try {
        return new Date(dateStr).toLocaleDateString();
      } catch (error) {
        return dateStr;
      }
    }
  }
};
</script>

<style scoped>
.species-details-view {
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

.species-name-display {
  text-align: center;
  margin-bottom: 25px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #409EFF;
}

.scientific-name {
  font-size: 28px;
  font-style: italic;
  font-weight: 300;
  color: #1976d2;
  margin: 0 0 8px 0;
}

.common-name {
  font-size: 16px;
  color: #666;
  font-weight: 500;
}

.detail-item {
  margin-bottom: 15px;
  display: flex;
  align-items: flex-start;
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

.detail-value.author {
  font-style: italic;
  color: #1976d2;
}

.detail-value.description {
  background: #f8f9fa;
  padding: 10px;
  border-radius: 4px;
  border-left: 3px solid #409EFF;
  line-height: 1.6;
}

.synonym-info {
  margin-top: 15px;
  padding: 15px;
  background: #fff3cd;
  border-radius: 6px;
  border: 1px solid #ffeaa7;
}

.synonym-label {
  font-weight: 500;
  color: #856404;
  margin-bottom: 5px;
}

.valid-name {
  font-style: italic;
  color: #1976d2;
  font-size: 16px;
}

.taxonomy-tree {
  margin-bottom: 20px;
}

.taxonomy-level {
  margin-bottom: 8px;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 4px;
  border-left: 3px solid #e0e0e0;
  transition: all 0.2s;
}

.taxonomy-level:hover {
  background: #e3f2fd;
  border-left-color: #409EFF;
}

.taxonomy-level.species {
  background: #e8f5e9;
  border-left-color: #4caf50;
  font-weight: 500;
}

.taxonomy-rank {
  font-weight: 500;
  color: #666;
  display: inline-block;
  min-width: 80px;
  margin-right: 10px;
}

.taxonomy-name {
  color: #333;
  font-style: italic;
}

.name-construction {
  padding: 15px;
  background: #f0f9ff;
  border-radius: 6px;
  border: 1px solid #e0f2fe;
}

.construction-label {
  font-weight: 500;
  color: #333;
  margin-bottom: 10px;
}

.construction-breakdown {
  font-size: 18px;
  text-align: center;
}

.name-part {
  margin-right: 8px;
  padding: 4px 8px;
  border-radius: 4px;
  font-style: italic;
}

.name-part.genus {
  background: #e3f2fd;
  color: #1976d2;
  font-weight: 500;
}

.name-part.species {
  background: #e8f5e9;
  color: #388e3c;
  font-weight: 500;
}

.name-part.subspecies {
  background: #fff3e0;
  color: #f57c00;
}

.name-part.author {
  background: #f3e5f5;
  color: #7b1fa2;
  font-style: normal;
  font-size: 14px;
}

.metadata-section {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #e0e0e0;
}
</style>
