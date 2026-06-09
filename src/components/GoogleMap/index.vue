<template>
<div>
  <div>
    <GmapMap
      ref="gmap"
      :center='mapCenter'
      :zoom='zoom'
      style='width:100%;  height: 300px;'
    >
      <GmapMarker
        @dragend = "updateMarker($event)"
        :key="index"
        v-for="(m, index) in displayMarkers"
        :position="m.position"
        :label="m.label"
        :clickable="true"
        :draggable="!points.length"
        @click="onMarkerClick(m, index)"
      ></GmapMarker>
    </GmapMap>
  </div>
</div>
</template>

<script>
export default {
  name: 'GoogleMap',
  props: {
    // 传入 points（[{lat,lng,label?}]）时：展示这些候选点（只读、可点选），并禁用内置 geolocate。
    // 不传时：保持原行为（浏览器定位 + 单个可拖 marker + updatedPosition）。
    points: { type: Array, default: () => [] }
  },
  data(){
    return{
      center:{
        lat: 45.508,
        lng: -73.587
      },
      currentPlace:null,
      markers:[
        {
          position:{
            lat: 45.508,
            lng: -73.587}
        }
      ]
    }
  },
  computed:{
    displayMarkers(){
      if (this.points.length) {
        return this.points.map((p, i) => ({
          position: { lat: Number(p.lat), lng: Number(p.lng) },
          label: p.label != null ? String(p.label) : String(i + 1)
        }))
      }
      return this.markers
    },
    mapCenter(){
      if (this.points.length) {
        const p = this.points[0]
        return { lat: Number(p.lat), lng: Number(p.lng) }
      }
      return this.center
    },
    zoom(){ return this.points.length ? 8 : 12 }
  },
  watch:{
    points(){ this.fitToPoints() }
  },
  mounted(){
    if (!this.points.length) this.geolocate();
    else this.fitToPoints();
  },
  methods:{
    setPlace(place) {
      this.currentPlace = place;
    },
    // 候选点模式：把地图视野缩放到框住所有候选点
    fitToPoints(){
      if (!this.points.length || !this.$refs.gmap) return
      this.$refs.gmap.$mapPromise.then(map => {
        const g = window.google
        if (!g || !g.maps) return
        const b = new g.maps.LatLngBounds()
        this.points.forEach(p => b.extend({ lat: Number(p.lat), lng: Number(p.lng) }))
        map.fitBounds(b)
      }).catch(() => {})
    },
    onMarkerClick(m, index){
      if (this.points.length) this.$emit('select', this.points[index])
      else this.center = m.position
    },
    updateMarker: function(event){
      this.markers = [{
        position:{
          lat: event.latLng.lat(),
          lng: event.latLng.lng(),
        }
      }]
      this.$emit('updatedPosition',this.markers[0].position)
    },
    geolocate: function(){
      navigator.geolocation.getCurrentPosition(position => {
        this.center = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        this.markers = [{
          position:{
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }
        }]
      })
    }
  }
}
</script>

<style scoped>

</style>