<template>
  <div :class="className" :style="{height:height,width:width}" />
</template>

<script>
import echarts from 'echarts'
import { getULMStatsUser } from '@/api/table'
require('echarts/theme/macarons') // echarts theme
import resize from './mixins/resize'

const animationDuration = 6000

export default {
  name:"BarChart",
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
      weeks:[],
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
      getULMStatsUser().then(response => {
        this.data = response.data.items
        this.weeks = [...new Set(this.data.map(item=>{
          return item.week
        }))]
        this.series = Object.values(this.data.reduce((acc, item) => {
          if (acc[item.editor]) {
            acc[item.editor].data.push(item.cnt);
          } else {
            const seriesItem = {
              name: item.editor,
              type: 'bar',
              stack:'count',
              barWidth: '60%',
              data: [item.cnt],
              animationDuration
            }
            acc[item.editor]= seriesItem;
          }
          return acc;
        }, {}))
        this.chart.setOption({
          tooltip: {
            trigger: 'axis',
            axisPointer: { // 坐标轴指示器，坐标轴触发有效
              type: 'shadow' // 默认为直线，可选为：'line' | 'shadow'
            }
          },
          grid: {
            top: 10,
            left: '2%',
            right: '2%',
            bottom: '3%',
            containLabel: true
          },
          xAxis: [{
            type: 'category',
            data: this.weeks,
            axisTick: {
              alignWithLabel: true
            }
          }],
          yAxis: [{
            type: 'value',
            axisTick: {
              show: false
            }
          }],
          series: this.series
        })
        this.listLoading = false
      })


    }
  }
}
</script>
