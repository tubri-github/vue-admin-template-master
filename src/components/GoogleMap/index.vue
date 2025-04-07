<template>
<div>
  <div>
    <GmapMap
      :center='center'
      :zoom='12'
      style='width:100%;  height: 300px;'
    >
      <GmapMarker
        @dragend = "updateMarker($event)"
        :key="index"
        v-for="(m, index) in markers"
        :position="m.position"
        :clickable="true"
        :draggable="true"
        @click="center=m.position"
      ></GmapMarker>
    </GmapMap>
  </div>
</div>
</template>

<script>
export default {
  name: 'GoogleMap',
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
  mounted(){
    this.geolocate();
  },
  methods:{
    setPlace(place) {
      this.currentPlace = place;
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
