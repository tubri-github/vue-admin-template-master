<template>
  <div ref="mapEl" class="osm-map" />
</template>

<script>
// Leaflet + OpenStreetMap：免 API key，从 CDN 动态加载（无需 npm install）。显示多个候选 marker。
const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'

function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L)
  if (!document.querySelector('link[data-leaflet]')) {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = LEAFLET_CSS
    link.setAttribute('data-leaflet', '')
    document.head.appendChild(link)
  }
  if (!window._leafletPromise) {
    window._leafletPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script')
      s.src = LEAFLET_JS
      s.onload = () => resolve(window.L)
      s.onerror = reject
      document.head.appendChild(s)
    })
  }
  return window._leafletPromise
}

export default {
  name: 'OsmMap',
  props: {
    // [{ lat, lon, label? }]
    points: { type: Array, default: () => [] }
  },
  data() {
    return { map: null, layer: null, ready: false }
  },
  watch: {
    points() { this.render() }
  },
  mounted() {
    loadLeaflet().then(L => {
      this.initMap(L)
      this.ready = true
      this.render()
    }).catch(() => {})
  },
  beforeDestroy() {
    if (this.map) { this.map.remove(); this.map = null }
  },
  methods: {
    initMap(L) {
      this.map = L.map(this.$refs.mapEl).setView([39, -98], 4)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors', maxZoom: 19
      }).addTo(this.map)
      this.layer = L.layerGroup().addTo(this.map)
      // 弹窗在对话框里时容器尺寸可能初始为 0，下一帧 invalidate 一下
      this.$nextTick(() => this.map && this.map.invalidateSize())
    },
    render() {
      const L = window.L
      if (!L || !this.map || !this.layer) return
      this.layer.clearLayers()
      const pts = this.points.filter(p => p.lat != null && p.lon != null)
      if (!pts.length) return
      const latlngs = []
      pts.forEach(p => {
        const ll = [Number(p.lat), Number(p.lon)]
        latlngs.push(ll)
        const m = L.marker(ll).addTo(this.layer)
        if (p.label != null) m.bindTooltip(String(p.label), { permanent: true, direction: 'top' })
        m.on('click', () => this.$emit('select', p))
      })
      this.map.invalidateSize()
      if (latlngs.length === 1) this.map.setView(latlngs[0], 11)
      else this.map.fitBounds(latlngs, { padding: [30, 30], maxZoom: 12 })
    }
  }
}
</script>

<style scoped>
.osm-map { width: 100%; height: 300px; border: 1px solid #dcdfe6; border-radius: 6px; }
</style>