<template>
  <el-dialog
    :visible="visible"
    title="Georeference — GEOLocate"
    width="760px"
    :append-to-body="true"
    @update:visible="$emit('update:visible', $event)"
  >
    <p class="muted" style="margin-top:0">
      <b>{{ locality.locality || '(no locality string)' }}</b>
      <span> — {{ [locality.county, locality.state, locality.country].filter(Boolean).join(', ') }}</span>
    </p>
    <el-button size="small" type="primary" :loading="loading" icon="el-icon-search" @click="run">Find coordinates</el-button>
    <el-checkbox v-model="enableH2O" style="margin-left:12px">Water bodies (rivers/lakes)</el-checkbox>

    <template v-if="candidates.length">
      <!-- 候选点地图：Google Maps，显示全部候选；点 marker 即选用，编号对应下表 # -->
      <GoogleMap :points="mapPoints" style="margin-top:14px" @select="pick" />
      <el-table :data="candidates" size="small" border style="margin-top:12px">
        <el-table-column label="#" type="index" width="44" align="center" />
        <el-table-column label="Lat" width="105" prop="lat" />
        <el-table-column label="Lon" width="105" prop="lon" />
        <el-table-column label="Precision" width="95" prop="precision" />
        <el-table-column label="Score" width="70" prop="score" align="center" />
        <el-table-column label="± m" width="90" prop="uncertaintyMeters" />
        <el-table-column label="Parse pattern" prop="parsePattern" show-overflow-tooltip />
        <el-table-column label="" width="80" align="center">
          <template slot-scope="{ row }">
            <el-button size="mini" type="primary" @click="pick(row)">Use</el-button>
          </template>
        </el-table-column>
      </el-table>
    </template>
    <div v-else-if="searched && !loading" class="muted" style="margin-top:14px">
      No candidates — try editing the locality text or toggling water bodies.
    </div>
  </el-dialog>
</template>

<script>
import { georeferenceLocality } from '@/api/table'
import GoogleMap from '@/components/GoogleMap'

export default {
  name: 'GeorefDialog',
  components: { GoogleMap },
  props: {
    visible: { type: Boolean, default: false },
    // { locality, country, state, county } —— 用文字+行政区反查坐标
    locality: { type: Object, default: () => ({}) }
  },
  data() {
    return { candidates: [], loading: false, searched: false, enableH2O: true }
  },
  computed: {
    // 地图标记：GoogleMap 用 lat/lng；保留 lon 供 pick 取值；label(编号)对齐候选表 # 列
    mapPoints() {
      return this.candidates
        .filter(c => c.lat != null && c.lon != null)
        .map((c, i) => ({ lat: c.lat, lng: c.lon, lon: c.lon, label: i + 1 }))
    }
  },
  watch: {
    visible(v) {
      if (v) { this.candidates = []; this.searched = false; this.run() }
    }
  },
  methods: {
    run() {
      const q = this.locality.locality
      if (!q) { this.$message.warning('No locality text to georeference.'); return }
      this.loading = true
      this.searched = true
      georeferenceLocality({
        locality: q,
        country: this.locality.country || undefined,
        state: this.locality.state || undefined,
        county: this.locality.county || undefined,
        enable_h2o: this.enableH2O
      }).then(res => { this.candidates = res.data.items || [] })
        .catch(err => { this.$message.error((err && err.message) || 'GEOLocate request failed') })
        .then(() => { this.loading = false })
    },
    pick(row) {
      this.$emit('picked', { lat: row.lat, lon: row.lon })
      this.$emit('update:visible', false)
    }
  }
}
</script>

<style scoped>
.muted { color: #909399; font-size: 13px; }
</style>