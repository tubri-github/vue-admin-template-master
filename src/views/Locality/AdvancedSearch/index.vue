<template>
  <div class="app-container">
    <AdvancedSearchBase
      ref="search"
      :search-fn="searchFn"
      :metadata-fn="metadataFn"
      :sort-key-map="sortKeyMap"
      entity-label="localities"
      search-placeholder="Search localities (river, lake, locality string, country, collector …)"
      storage-key="locality"
      :default-pinned="['locality_string', 'drainage', 'country', 'state']"
    >
      <el-table-column label="" align="center" width="84" fixed="left" class-name="action-col">
        <template slot-scope="{ row }">
          <el-tooltip content="Edit this locality" placement="top">
            <i class="el-icon-edit row-action" @click="openEdit(row)" />
          </el-tooltip>
          <el-tooltip content="Georeference (GEOLocate)" placement="top">
            <i class="el-icon-map-location row-action" @click="openGeoref(row)" />
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column label="Field No." width="105" prop="FieldNo" sortable="custom" fixed="left" />
      <el-table-column label="Locality String" min-width="240" prop="LocalityString" sortable="custom" />
      <el-table-column label="Drainage" width="140" prop="Drainage" sortable="custom" />
      <el-table-column label="Water Body" width="130" prop="WaterBody" sortable="custom" />
      <el-table-column label="Country" width="100" prop="Country" sortable="custom" />
      <el-table-column label="State" width="110" prop="State" sortable="custom" />
      <el-table-column label="County" width="120" prop="County" sortable="custom" />
      <el-table-column label="Continent" width="110" prop="Continent" sortable="custom" />
      <el-table-column label="Coordinates" width="170" align="center">
        <template slot-scope="{ row }">
          <span v-if="row.Lat != null || row.Lon != null">{{ row.Lat }}, {{ row.Lon }}</span>
          <el-tag v-else size="mini" type="warning" effect="plain" title="No lat/long — candidate for GEOLocate">no coords</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Collectors" min-width="160" prop="VerbatimCollectors" />
      <el-table-column label="Verbatim Date" width="130" prop="VerbatimDate" />
    </AdvancedSearchBase>

    <!-- GEOLocate 地理参照：选一个候选存回该 locality -->
    <GeorefDialog :visible.sync="geoDialogVisible" :locality="geoLocObj" @picked="onPicked" />

    <!-- 编辑产地：复用 localityform（按 id 加载编辑，同 loan/lots） -->
    <el-dialog :visible.sync="editDialogVisible" title="Edit Locality" width="90%" :append-to-body="true" @close="refresh">
      <localityForm v-if="editDialogVisible" :key="'loc' + editKey" :external-locality-id="editId" @saved="onEdited" />
    </el-dialog>
  </div>
</template>

<script>
import AdvancedSearchBase from '@/components/AdvancedSearchBase'
import GeorefDialog from '@/components/GeorefDialog'
import localityForm from '@/views/localityform/index'
import { searchLocalitiesAdvanced, getLocalityFilterMetadata, updateLocalityCoords } from '@/api/table'

const SORT_KEY = {
  FieldNo: 'field_no', LocalityString: 'locality_string', Drainage: 'drainage',
  WaterBody: 'water_body', Country: 'country', State: 'state', County: 'county', Continent: 'continent'
}

export default {
  name: 'SearchLocality',
  components: { AdvancedSearchBase, GeorefDialog, localityForm },
  data() {
    return {
      searchFn: searchLocalitiesAdvanced,
      metadataFn: getLocalityFilterMetadata,
      sortKeyMap: SORT_KEY,
      geoDialogVisible: false,
      geoLoc: null,
      editDialogVisible: false,
      editId: null,
      editKey: 0
    }
  },
  computed: {
    geoLocObj() {
      const r = this.geoLoc || {}
      return { locality: r.LocalityString || r.Drainage || '', country: r.Country, state: r.State, county: r.County }
    }
  },
  methods: {
    openGeoref(row) {
      this.geoLoc = row
      this.geoDialogVisible = true
    },
    openEdit(row) {
      this.editId = row.Locality1ID
      this.editKey += 1
      this.editDialogVisible = true
    },
    onEdited() {
      this.editDialogVisible = false
      if (this.$refs.search) this.$refs.search.getList()
    },
    refresh() {
      if (this.$refs.search) this.$refs.search.getList()
    },
    onPicked(coords) {
      if (!this.geoLoc) return
      updateLocalityCoords({ localityId: this.geoLoc.Locality1ID, lat: coords.lat, lon: coords.lon }).then(() => {
        this.$message.success('Coordinates saved: ' + coords.lat + ', ' + coords.lon)
        if (this.$refs.search) this.$refs.search.getList()
      }).catch(err => {
        this.$message.error((err && err.message) || 'Failed to save coordinates')
      })
    }
  }
}
</script>

<style scoped>
.app-container { background-color: #f5f7fa; padding-bottom: 40px; }
::v-deep .action-col .row-action { font-size: 17px; cursor: pointer; color: #909399; }
::v-deep .action-col .row-action:hover { color: #409eff; }
.muted { color: #909399; font-size: 13px; }
</style>