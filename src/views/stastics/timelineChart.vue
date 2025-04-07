<template>
  <el-card>
    <div class="time-controls">
      <div class="toggle-buttons">
<!--        <el-button-group>-->
<!--          <el-button :type="mode === 'monthly' ? 'primary' : 'default'" @click="mode = 'monthly'">Monthly</el-button>-->
<!--          <el-button :type="mode === 'yearly' ? 'primary' : 'default'" @click="mode = 'yearly'">Yearly</el-button>-->
<!--        </el-button-group>-->
      </div>
    </div>
    <div ref="mainChart" style="height: 500px; width: 100%"></div>
<!--    <div class="small-multiples">-->
<!--      <el-button v-for="option in presets" :key="option.label" @click="applyPreset(option.range)">-->
<!--        {{ option.label }}-->
<!--      </el-button>-->
<!--    </div>-->
  </el-card>
</template>

<script>
import * as echarts from 'echarts'
import { getMonthlyCollectionTimeline } from '@/api/taxonomy'

export default {
  name: 'MonthlyTimelineChart',
  data() {
    return {
      rawData: [],
      chart: null,
      dateLabels: [],
      mode: 'monthly',
      presets: [
        {label: 'Last 3 Months', range: -3},
        {label: 'Last Year', range: -12},
        {label: 'Last 2 Years', range: -24},
        {label: 'All', range: 'all'}
      ]
    }
  },
  mounted() {
    this.chart = echarts.init(this.$refs.mainChart)
    this.loadData()
    window.addEventListener('resize', this.chart.resize)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.chart.resize)
    if (this.chart) this.chart.dispose()
  },
  methods: {
    async loadData() {
      try {
        const res = await getMonthlyCollectionTimeline()
        this.rawData = res.data.items.map(i => ({
          label: `${i.year}-${String(i.month).padStart(2, '0')}`,
          value: i.count
        }))
        this.dateLabels = this.rawData.map(d => d.label)
        this.renderChart()
      } catch (e) {
        this.$message.error('Failed to load timeline data')
      }
    },
    renderChart() {
      this.chart.setOption({
        tooltip: {trigger: 'axis'},
        title: {
          text: 'Collection Time Trend',
          left: 'center'
        },
        grid: {
          bottom: 80
        },
        xAxis: {
          type: 'category',
          data: this.dateLabels,
          axisLabel: {
            rotate: 45,
            formatter: (value) => value
          }
        },
        yAxis: {
          type: 'value',
          name: 'Records'
        },
        dataZoom: [
          {
            type: 'slider',
            start: 0,
            end: 100,
            height: 30,
            bottom: 10
          },
          {
            type: 'inside'
          }
        ],
        series: [{
          data: this.rawData.map(d => d.value),
          type: 'line',
          areaStyle: {},
          smooth: true,
          lineStyle: {color: '#5470c6'},
          itemStyle: {color: '#5470c6'}
        }]
      })
    },
    applyPreset(monthsBack) {
      if (monthsBack === 'all') {
        this.chart.setOption({dataZoom: [{start: 0, end: 100}]})
      } else {
        const total = this.dateLabels.length
        const end = 100
        const start = Math.max(0, ((total + monthsBack) / total) * 100)
        this.chart.setOption({
          dataZoom: [{start, end}]
        })
      }
    }
  }
}
</script>

<style scoped>
.time-controls {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
}

.small-multiples {
  margin-top: 16px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
