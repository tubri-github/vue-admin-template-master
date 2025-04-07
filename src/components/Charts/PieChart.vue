<template>
  <div :class="className" :style="{height:height,width:width}" />
</template>

<script>
import echarts from 'echarts'
require('echarts/theme/macarons') // echarts theme
import resize from './mixins/resize'
import { getULMStatsReview } from '@/api/table'

export default {
  name:"PieChart",
  mixins: [resize],
  props: {
    className: {
      type: String,
      default: 'chart'
    },
    width: {
      type: String,
      default: '100%'
    },
    height: {
      type: String,
      default: '300px'
    }
  },
  data() {
    return {
      data:[],
      labels:[],
      series:[],
      chart: null
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.initChart()
    })
  },
  beforeDestroy() {
    if (!this.chart) {
      return
    }
    this.chart.dispose()
    this.chart = null
  },
  methods: {
    initChart() {
      this.chart = echarts.init(this.$el, 'macarons')
      this.listLoading = true
      getULMStatsReview().then(response => {
        this.data = response.data.items
        this.series = this.data.map(item=>{
          if(!item.recheckrequired && item.status === 'finded')
            return {value:item.cnt, name:'Completed'}
          else if(item.recheckrequired && item.status === 'finded')
            return {value:item.cnt, name:'Review Required'}
          else if(item.recheckrequired && item.status === 'unknown')
            return {value:item.cnt, name:'Not Found'}
          else
            return {value:item.cnt, name:'Unknown Records'}
        })
        this.labels = [...new Set(this.series.map(item=>{
          return item.name
        }))]
        this.chart.setOption({
          tooltip: {
            trigger: 'item',
            formatter: '{a} <br/>{b} : {c} ({d}%)'
          },
          legend: {
            left: 'center',
            bottom: '10',
            data: this.labels
          },
          series: [
            {
              name: 'Completion Status Overview',
              type: 'pie',
              roseType: 'radius',
              radius: [15, 95],
              center: ['50%', '38%'],
              data:this.series,
              animationEasing: 'cubicInOut',
              animationDuration: 2600
            }
          ]
        })
      })
    }
  }
}
</script>
