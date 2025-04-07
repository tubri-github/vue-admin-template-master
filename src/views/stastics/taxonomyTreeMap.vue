<template>
  <div class="taxonomy-treemap-container">
    <div class="treemap-header">
      <div class="title-navigation">
        <h3 class="component-title"></h3>
        <div class="navigation-controls">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item @click.native="resetTree" class="clickable-breadcrumb">All Families</el-breadcrumb-item>
            <el-breadcrumb-item
              v-for="(item, index) in pathStack"
              :key="index"
              @click.native="handleBreadcrumbClick(index)"
              class="clickable-breadcrumb"
            >
              {{ item.label }}
            </el-breadcrumb-item>
          </el-breadcrumb>
          <el-button @click="goBack" :disabled="pathStack.length === 0" size="mini" class="back-button">
            <i class="el-icon-arrow-left"></i> Back
          </el-button>
          <span class="current-label">Current: {{ currentLabel }}</span>
        </div>
      </div>
    </div>
    <div ref="chartContainer" class="chart-container"></div>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import { getFamilyList, getGenusList, getSpeciesList } from '@/api/taxonomy'

export default {
  name: 'TaxonomyTreemap',
  data() {
    return {
      chart: null,
      pathStack: [], // 用于 drill-down 记录层级 [{type: 'family', familyId, label}]
      currentLabel: 'All Families'
    }
  },
  mounted() {
    this.initChart()
    this.loadFamilies()
    this.handleResize = () => {
      if (this.chart) {
        this.chart.resize()
      }
    }
    window.addEventListener('resize', this.handleResize)
  },
  methods: {
    initChart() {
      // 确保容器存在
      if (!this.$refs.chartContainer) {
        return
      }

      // 如果图表已经存在，先销毁
      if (this.chart) {
        this.chart.dispose()
      }

      // 初始化图表
      this.chart = echarts.init(this.$refs.chartContainer)
    },

    resetTree() {
      this.pathStack = []
      this.loadFamilies()
      this.currentLabel = 'All Families'
    },

    handleBreadcrumbClick(index) {
      this.pathStack = this.pathStack.slice(0, index + 1)
      const target = this.pathStack[index]

      if (target.type === 'family') {
        this.loadGenus(target.familyName)
        this.currentLabel = target.label
      } else if (target.type === 'genus') {
        this.loadSpecies(target.familyName, target.genus, target.label)
        this.currentLabel = target.label
      }
    },

    goBack() {
      if (this.pathStack.length === 0) return

      this.pathStack.pop()
      if (this.pathStack.length === 0) {
        this.loadFamilies()
        this.currentLabel = 'All Families'
      } else {
        const last = this.pathStack[this.pathStack.length - 1]
        if (last.type === 'family') {
          this.loadGenus(last.familyName)
          this.currentLabel = last.label
        } else if (last.type === 'genus') {
          this.loadSpecies(last.familyName, last.genus, last.label)
          this.currentLabel = last.label
        }
      }
    },

    loadFamilies() {
      this.setLoadingState(true)

      getFamilyList().then(res => {
        const nodes = res.data.items.map(f => ({
          name: f.FamilyName,
          value: parseInt(f.count) || 0, // 确保值为数字
          familyName: f.FamilyName
          // 移除自定义颜色，使用原有配色方案
        }))

        this.renderTreemap(this.aggregateNodes(nodes), 'Family')
        this.currentLabel = 'All Families'
        this.setLoadingState(false)
      }).catch(err => {
        console.error('Failed to load families', err)
        this.setLoadingState(false)
      })
    },

    loadGenus(familyName) {
      this.setLoadingState(true)

      getGenusList({ familyName }).then(res => {
        const nodes = res.data.items.map(g => ({
          name: g.Genus,
          value: parseInt(g.count) || 0,
          familyName,
          genus: g.Genus
          // 移除自定义颜色，使用原有配色方案
        }))

        this.renderTreemap(this.aggregateNodes(nodes), 'Genus')
        this.currentLabel = familyName
        this.setLoadingState(false)
      }).catch(err => {
        console.error('Failed to load genus', err)
        this.setLoadingState(false)
      })
    },

    loadSpecies(familyName, genus, genusLabel) {
      this.setLoadingState(true)

      getSpeciesList({ familyName, genus }).then(res => {
        const raw = res.data.items.map(s => ({
          name: s.Species,
          value: parseInt(s.count) || 0
          // 移除自定义颜色，使用原有配色方案
        }))

        this.renderTreemap(this.aggregateNodes(raw), 'Species')
        this.currentLabel = genusLabel
        this.setLoadingState(false)
      }).catch(err => {
        console.error('Failed to load species', err)
        this.setLoadingState(false)
      })
    },

    // 保持原有配色方案，不自定义颜色
    generateColor() {
      return undefined // 返回undefined让echarts使用默认配色
    },

    aggregateNodes(nodes, threshold = 5) {
      const validNodes = nodes.filter(n => n.value && n.value > 0) // 过滤掉无效值

      if (validNodes.length === 0) {
        return [{ name: 'No Data', value: 1 }]
      }

      const result = []
      let others = 0

      validNodes.forEach(n => {
        if (n.value && n.value < threshold) {
          others += n.value
        } else {
          result.push(n)
        }
      })

      if (others > 0) {
        result.push({
          name: 'Others',
          value: others
        })
      }

      return result
    },

    setLoadingState(isLoading) {
      if (this.chart) {
        isLoading ? this.chart.showLoading({
          text: 'Loading data...',
          maskColor: 'rgba(255, 255, 255, 0.8)',
          textColor: '#333'
        }) : this.chart.hideLoading()
      }
    },

    renderTreemap(nodes, level) {
      if (!this.chart) {
        this.initChart()
      }

      if (nodes.length === 0) {
        nodes = [{ name: 'No Data', value: 1 }]
      }

      this.chart.setOption({
        title: {
          text: `Taxonomy - ${level}`,
          left: 'center',
          top: 0,
          textStyle: {
            fontSize: 16,
            fontWeight: 'normal',
            color: '#333'
          }
        },
        tooltip: {
          formatter: p => `${p.name}<br/>Records: ${p.value}`,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderColor: '#ccc',
          borderWidth: 1,
          textStyle: {
            color: '#333'
          }
        },
        series: [{
          type: 'treemap',
          data: nodes,
          leafDepth: 1,
          visibleMin: 1,
          width: '100%',
          height: '100%',
          label: {
            show: true,
            formatter: '{b}',
            fontSize: 14,
            overflow: 'break'
          },
          breadcrumb: {
            show: false // 禁用内置的面包屑导航，我们使用自定义的
          },
          animation: true,
          animationDuration: 500,
          animationEasing: 'cubicOut',
          levels: [
            {
              itemStyle: {
                borderColor: '#fff',
                borderWidth: 2,
                gapWidth: 2
              },
              emphasis: {
                itemStyle: {
                  shadowBlur: 10,
                  shadowColor: 'rgba(0,0,0,0.3)'
                }
              },
              upperLabel: {
                show: true
              }
            }
          ]
        }]
      }, true) // 设置为 true 完全刷新重绘

      this.chart.off('click') // 清除旧监听
      this.chart.on('click', params => {
        const data = params.data
        if (data.name === 'No Data' || data.name === 'Others') {
          return // 不响应这些特殊项的点击
        }

        if (level === 'Family') {
          this.pathStack.push({type: 'family', familyName: data.familyName, label: data.name})
          this.loadGenus(data.familyName)
        } else if (level === 'Genus') {
          this.pathStack.push({type: 'genus', familyName: data.familyName, genus: data.genus, label: data.name})
          this.loadSpecies(data.familyName, data.genus, data.name)
        }
      })
    }
  },
  beforeDestroy() {
    if (this.chart) {
      window.removeEventListener('resize', this.handleResize)
      this.chart.dispose()
      this.chart = null
    }
  }
}
</script>

<style lang="scss" scoped>
.taxonomy-treemap-container {
  width: 100%;
  height: 500px;
  display: flex;
  flex-direction: column;
  border-radius: 4px;
  background-color: #fff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.treemap-header {
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
}

.title-navigation {
  display: flex;
  flex-direction: column;
}

.component-title {
  margin: 0 0 10px 0;
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.navigation-controls {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  font-size: 13px;
}

.clickable-breadcrumb {
  cursor: pointer;
  color: #409EFF;
  transition: color 0.3s;

  &:hover {
    color: #66b1ff;
    text-decoration: underline;
  }
}

.back-button {
  margin: 0 10px;
}

.current-label {
  color: #606266;
  margin-left: 10px;
  font-weight: bold;
}

.chart-container {
  flex: 1;
  width: 100%;
  min-height: 400px;
  position: relative;
}

@media (max-width: 768px) {
  .navigation-controls {
    flex-direction: column;
    align-items: flex-start;

    .back-button, .current-label {
      margin-top: 8px;
      margin-left: 0;
    }
  }
}
</style>
