<template>
  <div class="dashboard-container">
    <div class="report-link" @click="downloadReport" :class="{ 'is-loading': isReportLoading }">
      <i :class="isReportLoading ? 'el-icon-loading' : 'el-icon-document'"></i>
      {{ isReportLoading ? 'Generating Report...' : 'View Full Report' }}
    </div>

    <!-- 新项目卡片组 -->
    <div class="section-header">
      <div class="section-title">
        <i class="el-icon-star-on"></i>
        <span>New Items Added This Year</span>
      </div>
      <div class="section-divider"></div>
    </div>

    <el-row :gutter="20" class="card-row">
      <el-col :xs="24" :sm="12" :lg="8">
        <div class="stat-card loan-card">
          <div class="card-icon">
            <svg-icon icon-class="loan" />
          </div>
          <div class="card-content">
            <div class="card-label">Loans</div>
            <div class="card-value">
              <count-to :start-val="0" :end-val="loanNumberCurrentYear" :duration="2600" />
            </div>
            <div class="card-trend" v-if="loanTrend">
              <i :class="loanTrend > 0 ? 'el-icon-top' : 'el-icon-bottom'"></i>
              <span>{{ Math.abs(loanTrend) }}%</span>
            </div>
          </div>
        </div>
      </el-col>

      <el-col :xs="24" :sm="12" :lg="8">
        <div class="stat-card lot-card">
          <div class="card-icon">
            <svg-icon icon-class="jar" />
          </div>
          <div class="card-content">
            <div class="card-label">Lots</div>
            <div class="card-value">
              <count-to :start-val="0" :end-val="lotNumberCurrentYear" :duration="2000" />
            </div>
            <div class="card-trend" v-if="lotTrend">
              <i :class="lotTrend > 0 ? 'el-icon-top' : 'el-icon-bottom'"></i>
              <span>{{ Math.abs(lotTrend) }}%</span>
            </div>
          </div>
        </div>
      </el-col>

      <el-col :xs="24" :sm="12" :lg="8">
        <div class="stat-card locality-card">
          <div class="card-icon">
            <svg-icon icon-class="locality" />
          </div>
          <div class="card-content">
            <div class="card-label">Locality</div>
            <div class="card-value">
              <count-to :start-val="0" :end-val="localityNumberCurrentYear" :duration="2000" />
            </div>
            <div class="card-trend" v-if="localityTrend">
              <i :class="localityTrend > 0 ? 'el-icon-top' : 'el-icon-bottom'"></i>
              <span>{{ Math.abs(localityTrend) }}%</span>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 总计卡片组 -->
    <div class="section-header">
      <div class="section-title">
        <i class="el-icon-data-analysis"></i>
        <span>Total Data</span>
      </div>
      <div class="section-divider"></div>
    </div>

    <el-row :gutter="20" class="card-row">
      <el-col :xs="24" :sm="12" :lg="8">
        <div class="stat-card loan-card total-card">
          <div class="card-icon">
            <svg-icon icon-class="loan" />
          </div>
          <div class="card-content">
            <div class="card-label">Total Loans</div>
            <div class="card-value">
              <count-to :start-val="0" :end-val="loanTotalNumber" :duration="2600" />
            </div>
            <div class="card-info">
              <!--              <span>Completion Rate: {{ Math.round((loanReturnRate || 0) * 100) }}%</span>-->
            </div>
          </div>
        </div>
      </el-col>

      <el-col :xs="24" :sm="12" :lg="8">
        <div class="stat-card lot-card total-card">
          <div class="card-icon">
            <svg-icon icon-class="jar" />
          </div>
          <div class="card-content">
            <div class="card-label">Total Lots</div>
            <div class="card-value">
              <count-to :start-val="0" :end-val="lotTotalNumber" :duration="2000" />
            </div>
            <div class="card-info">
              <!--              <span>Processed: {{ formatNumber(processedLots) }}</span>-->
            </div>
          </div>
        </div>
      </el-col>

      <el-col :xs="24" :sm="12" :lg="8">
        <div class="stat-card locality-card total-card">
          <div class="card-icon">
            <svg-icon icon-class="locality" />
          </div>
          <div class="card-content">
            <div class="card-label">Total Localities</div>
            <div class="card-value">
              <count-to :start-val="0" :end-val="localityTotalNumber" :duration="2000" />
            </div>
            <div class="card-info">
              <span>Coverage: {{ coverageCountries }} countries</span>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 添加组件按钮 -->
    <div class="section-header">
      <div class="section-title">
        <i class="el-icon-s-grid"></i>
        <span>Dashboard Components</span>
      </div>
      <div class="section-divider"></div>
    </div>

    <div class="add-widget-section">
      <el-button type="primary" size="small" plain icon="el-icon-plus" @click="showComponentSelector = true">
        Add Component
      </el-button>
    </div>

    <!-- 动态组件容器 (修改为网格布局) -->
    <div class="grid-layout" :style="{ gridTemplateColumns: gridColumnsStyle }">
      <div
        v-for="(component, index) in activeComponents"
        :key="component.id"
        class="component-wrapper"
        :style="{ gridColumn: `span ${component.colSpan}` }"
      >
        <div class="component-header">
          <span>{{ getComponentTitle(component.type) }}</span>
          <el-dropdown
            trigger="hover"
            size="mini"
            @command="handleComponentAction($event, index)"
            placement="bottom-end"
          >
            <i class="el-icon-more component-menu-trigger"></i>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item command="1">1 Column</el-dropdown-item>
              <el-dropdown-item command="2">2 Columns</el-dropdown-item>
              <el-dropdown-item command="3">3 Columns</el-dropdown-item>
              <el-dropdown-item command="4">Full Width</el-dropdown-item>
              <el-dropdown-item command="remove" divided>Remove</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </div>
        <div class="component-content" v-resize="handleResize">
          <component
            :is="component.type"
            @node-click="handleTreeClick"
            :height="getComponentHeight(component.colSpan)"
            :ref="`component-${index}`"
          ></component>
        </div>
      </div>
    </div>

    <!-- 组件选择器对话框 -->
    <el-dialog
      title="Add Component"
      :visible.sync="showComponentSelector"
      width="460px"
      custom-class="component-selector-dialog">
      <div class="component-selector">
        <p class="selector-subtitle">Select components to add to your dashboard:</p>
        <el-checkbox-group v-model="selectedComponents" class="component-options">
          <el-checkbox v-for="option in availableComponents"
                       :key="option.type"
                       :label="option.type">
            {{ option.name }}
          </el-checkbox>
        </el-checkbox-group>

        <div class="size-selector" v-if="selectedComponents.length > 0">
          <p>Select component width:</p>
          <el-radio-group v-model="selectedColSpan" size="small">
            <el-radio :label="1">1 Column</el-radio>
            <el-radio :label="2">2 Columns</el-radio>
            <el-radio :label="3">3 Columns</el-radio>
            <el-radio :label="4">Full Width</el-radio>
          </el-radio-group>
        </div>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button size="small" @click="showComponentSelector = false">Cancel</el-button>
        <el-button size="small" type="primary" @click="addComponents" :disabled="selectedComponents.length === 0">Add Selected</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import {getLoanNumbersByYear, getSpeciesStats, getLotNumbersByYear, getLocalityNumbersByYear, getReport} from '@/api/table'
import {mapGetters} from 'vuex'
import countTo from 'vue-count-to'
import store from '@/store'
import BarChart from '@/components/Charts/BarChart'
import PieChart from '@/components/Charts/PieChart'
import TaxonomyTreeMap from '@/views/stastics/taxonomyTreeMap'
import MonthlyTimelineChart from '@/views/stastics/timelineChart'
import RecentRecords from '@/views/stastics/recentRecords'

export default {
  components: {
    countTo,
    BarChart,
    PieChart,
    TaxonomyTreeMap,
    MonthlyTimelineChart,
    RecentRecords
  },
  // 添加一个自定义指令用于监听元素大小变化并触发组件更新
  directives: {
    resize: {
      inserted(el, binding) {
        const callback = binding.value;
        const observer = new ResizeObserver(entries => {
          if (typeof callback === 'function') {
            callback(entries[0].contentRect);
          }
        });
        observer.observe(el);
        el._observer = observer;
      },
      unbind(el) {
        if (el._observer) {
          el._observer.disconnect();
        }
      }
    }
  },
  data() {
    return {
      isReportLoading: false,
      showStats: (store.getters.roles.indexOf('admin') !== -1),
      loading: false,
      localityNumberCurrentYear: 0,
      localityTotalNumber: 0,
      loanNumberCurrentYear: 0,
      loanTotalNumber: 0,
      lotNumberCurrentYear: 0,
      lotTotalNumber: 0,
      speciesStatisticsList: null,
      listLoading: false,
      tableKey: 0,

      // 趋势和额外统计数据
      loanTrend: 0, // 示例值：同比增长15%
      lotTrend: 0,  // 示例值：同比下降5%
      localityTrend: 0, // 示例值：同比增长8%
      loanReturnRate: 0, // 示例值：归还率78%
      processedLots: 0, // 示例值
      coverageCountries: 67, // 示例值

      // 动态组件变量
      showComponentSelector: false,
      selectedComponents: [],

      // 新的网格布局变量
      gridColumns: 4, // 总列数
      selectedColSpan: 2, // 默认组件占据2列
      activeComponents: [], // 仍然使用相同的数组但结构不同

      availableComponents: [
        {type: 'TaxonomyTreeMap', name: 'Taxonomy Tree Map'},
        {type: 'MonthlyTimelineChart', name: 'Monthly Timeline Chart'},
        {type: 'BarChart', name: 'ULM Bar Chart'},
        {type: 'PieChart', name: 'ULM Pie Chart'},
        {type: 'RecentRecords', name: 'Recent Activity'} // 新添加的组件
      ]
    }
  },
  name: 'Dashboard',
  computed: {
    ...mapGetters([
      'name'
    ]),

    // 计算网格列样式
    gridColumnsStyle() {
      return `repeat(${this.gridColumns}, 1fr)`;
    }
  },
  created() {
    this.getLocalityNumbersThisYear()
    this.getLocalityNumbersTotal()
    this.getLoanNumbersThisYear()
    this.getLoanNumbersTotal()
    this.getLotNumbersThisYear()
    this.getLotNumbersTotal()
    this.getSpeciesStatistics()

    // 加载保存的组件配置
    this.loadSavedComponents()
  },
  methods: {

    downloadReport() {
      // Set loading state
      this.isReportLoading = true;

      // Show loading notification
      const loadingNotification = this.$notify({
        title: 'Report Generation',
        message: 'Your report is being generated. This may take a moment...',
        duration: 0, // Don't auto-close
        type: 'info',
        position: 'top-right'
      });

      getReport()
        .then(response => {
          // Handle successful download
          const blob = new Blob([response.data], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'data_validation_report.xlsx';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);

          // Close loading notification and show success
          loadingNotification.close();
          this.$notify({
            title: 'Success',
            message: 'Report downloaded successfully',
            type: 'success',
            duration: 3000
          });
        })
        .catch(error => {
          console.error('Error downloading report:', error);

          // Close loading notification and show error
          loadingNotification.close();
          this.$notify.error({
            title: 'Error',
            message: 'Failed to download report. Please try again later.',
            duration: 5000
          });
        })
        .finally(() => {
          this.isReportLoading = false;
        });
    },

    formatNumber(num) {
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },

    handleTreeClick(node) {
      this.$message.success(`You clicked on: ${node.label}`)
    },

    getLocalityNumbersThisYear() {
      getLocalityNumbersByYear({year: '2025'}).then(response => {
        this.localityNumberCurrentYear = response.data.total
      })
    },
    getLocalityNumbersTotal() {
      getLocalityNumbersByYear({year: '1000'}).then(response => {
        this.localityTotalNumber = response.data.total
      })
    },
    getLotNumbersThisYear() {
      getLotNumbersByYear({year: '2025'}).then(response => {
        this.lotNumberCurrentYear = response.data.total
      })
    },
    getLotNumbersTotal() {
      getLotNumbersByYear({year: '1000'}).then(response => {
        this.lotTotalNumber = response.data.total
      })
    },
    getLoanNumbersThisYear() {
      getLoanNumbersByYear({year: '2025'}).then(response => {
        this.loanNumberCurrentYear = response.data.total
      })
    },
    getLoanNumbersTotal() {
      getLoanNumbersByYear({year: '1000'}).then(response => {
        this.loanTotalNumber = response.data.total
      })
    },
    getSpeciesStatistics() {
      getSpeciesStats().then(response => {
        this.speciesStatisticsList = response.data.items
        this.total = response.data.total
        setTimeout(() => {
          this.listLoading = false
        }, 1.5 * 1000)
      })
    },

    // 修改动态组件方法
    addComponents() {
      if (this.selectedComponents.length > 0) {
        const count = this.selectedComponents.length

        // 添加所有选中的组件
        this.selectedComponents.forEach(componentType => {
          this.activeComponents.push({
            type: componentType,
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            colSpan: this.selectedColSpan // 使用列跨度而不是尺寸
          })
        })

        // 保存当前配置
        this.saveComponentsConfig()

        // 重置并关闭对话框
        const message = count > 1 ? `Successfully added ${count} components` : 'Component added successfully'
        this.$message.success(message)

        this.selectedComponents = []
        this.selectedColSpan = 2 // 重置为默认2列
        this.showComponentSelector = false

        // 添加组件后需要触发窗口resize事件，以便图表组件能正确调整大小
        this.$nextTick(() => {
          window.dispatchEvent(new Event('resize'))
        })
      }
    },

    handleComponentAction(command, index) {
      if (command === 'remove') {
        this.removeComponent(index)
      } else {
        // 调整大小 - command 现在是列跨度 (1, 2, 3, 或 4)
        this.resizeComponent(index, parseInt(command))
      }
    },

    resizeComponent(index, colSpan) {
      // 更新组件列跨度
      this.$set(this.activeComponents[index], 'colSpan', colSpan)
      this.saveComponentsConfig()
      this.$message.success('Component size updated')

      // 触发resize事件，确保组件能够正确调整大小
      this.$nextTick(() => {
        window.dispatchEvent(new Event('resize'))
      })
    },

    removeComponent(index) {
      this.$confirm('Are you sure you want to remove this component?', 'Warning', {
        confirmButtonText: 'Yes',
        cancelButtonText: 'No',
        type: 'warning'
      }).then(() => {
        this.activeComponents.splice(index, 1)
        this.saveComponentsConfig()
        this.$message.success('Component removed successfully')
      }).catch(() => {
        // User canceled the operation
      })
    },

    getComponentTitle(componentType) {
      const component = this.availableComponents.find(c => c.type === componentType)
      return component ? component.name : componentType
    },

    // 根据组件列跨度计算高度
    getComponentHeight(colSpan) {
      // 根据组件的宽度（列跨度）调整高度，使比例更合适
      switch (colSpan) {
        case 1:
          return 300
        case 2:
          return 350
        case 3:
          return 380
        case 4:
          return 400
        default:
          return 350
      }
    },

    saveComponentsConfig() {
      // 将当前组件配置保存到localStorage
      try {
        localStorage.setItem('dashboardComponents', JSON.stringify(this.activeComponents))
      } catch (e) {
        console.error('Failed to save dashboard configuration', e)
      }
    },

    loadSavedComponents() {
      // 从localStorage加载保存的组件
      try {
        const savedComponents = localStorage.getItem('dashboardComponents')
        if (savedComponents) {
          const components = JSON.parse(savedComponents)

          // 转换旧的size格式到新的colSpan格式（兼容性处理）
          this.activeComponents = components.map(component => {
            if (component.size && !component.colSpan) {
              // 将旧格式转换为新格式
              let colSpan = 2; // 默认中等宽度
              switch(component.size) {
                case 'small':
                  colSpan = 1;
                  break;
                case 'medium':
                  colSpan = 2;
                  break;
                case 'large':
                  colSpan = 4;
                  break;
              }
              return {
                ...component,
                colSpan: colSpan
              };
            }
            return component;
          });
        }
      } catch (e) {
        console.error('Failed to load saved dashboard configuration', e)
      }
    },

    // 处理组件容器尺寸变化
    handleResize() {
      // 通知图表组件重新渲染
      this.$nextTick(() => {
        window.dispatchEvent(new Event('resize'))

        // 对于特定的组件类型，可能需要特殊处理
        this.activeComponents.forEach((component, index) => {
          const ref = this.$refs[`component-${index}`]
          if (ref && ref[0] && ref[0].resize) {
            // 如果组件有resize方法，直接调用
            ref[0].resize()
          } else if (ref && ref[0] && ref[0].chart) {
            // 对于echarts图表组件
            ref[0].chart.resize()
          }
        })
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.report-link {
  margin-bottom: 20px;
  display: inline-flex;
  align-items: center;
  font-size: 15px;
  color: #409EFF;
  text-decoration: none;
  transition: all 0.3s;
  cursor: pointer;
  padding: 8px 15px;
  border-radius: 4px;
  background-color: rgba(64, 158, 255, 0.1);

  &:hover {
    background-color: rgba(64, 158, 255, 0.2);
  }

  &.is-loading {
    opacity: 0.8;
    pointer-events: none;
  }

  i {
    margin-right: 8px;
  }
}
// 整体容器样式
.dashboard-container {
  padding: 24px;
  background-color: #f5f7fa;
}

// 报告链接样式
.report-link {
  margin-bottom: 20px;

  a {
    display: inline-flex;
    align-items: center;
    font-size: 15px;
    color: #409EFF;
    text-decoration: none;
    transition: all 0.3s;

    &:hover {
      opacity: 0.8;
      text-decoration: underline;
    }

    i {
      margin-right: 8px;
    }
  }
}

// 区块标题样式
.section-header {
  margin: 24px 0 16px;
  display: flex;
  align-items: center;

  .section-title {
    display: flex;
    align-items: center;
    font-size: 18px;
    font-weight: 500;
    color: #303133;

    i {
      margin-right: 8px;
      font-size: 20px;
      color: #409EFF;
    }
  }

  .section-divider {
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, rgba(64, 158, 255, 0.5) 0%, rgba(64, 158, 255, 0.05) 100%);
    margin-left: 12px;
  }
}

// 卡片行样式
.card-row {
  margin-bottom: 20px;
}

// 统计卡片基础样式
.stat-card {
  height: 120px;
  border-radius: 10px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
  background-color: #fff;
  display: flex;
  overflow: hidden;
  transition: all 0.3s;
  position: relative;
  margin-bottom: 20px;
  border: 1px solid rgba(235, 238, 245, 0.8);

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.08);
  }

  // 左侧图标区域
  .card-icon {
    width: 90px;
    display: flex;
    align-items: center;
    justify-content: center;

    svg {
      width: 48px;
      height: 48px;
    }
  }

  // 右侧内容区域
  .card-content {
    flex: 1;
    padding: 16px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  // 卡片标签
  .card-label {
    font-size: 16px;
    color: #606266;
    margin-bottom: 8px;
  }

  // 卡片数值
  .card-value {
    font-size: 24px;
    font-weight: 600;
    color: #303133;
    line-height: 1.2;
  }

  // 趋势指标
  .card-trend {
    margin-top: 8px;
    font-size: 14px;
    display: flex;
    align-items: center;

    i {
      margin-right: 4px;
    }
  }

  // 附加信息
  .card-info {
    margin-top: 8px;
    font-size: 14px;
    color: #909399;
  }
}

// 借出卡片特定样式
.loan-card {
  .card-icon {
    background: rgba(64, 201, 198, 0.1);
    color: #40c9c6;
  }

  .card-trend {
    color: #67c23a;
  }
}

// 批次卡片特定样式
.lot-card {
  .card-icon {
    background: rgba(54, 163, 247, 0.1);
    color: #36a3f7;
  }

  .card-trend {
    color: #f56c6c;
  }
}

// 地区卡片特定样式
.locality-card {
  .card-icon {
    background: rgba(244, 81, 108, 0.1);
    color: #f4516c;
  }

  .card-trend {
    color: #67c23a;
  }
}

// 总计卡片额外样式
.total-card {
  border-left: 4px solid;

  &.loan-card {
    border-left-color: #40c9c6;
  }

  &.lot-card {
    border-left-color: #36a3f7;
  }

  &.locality-card {
    border-left-color: #f4516c;
  }
}

// 添加组件按钮区域
.add-widget-section {
  margin: 16px 0;
  display: flex;
  justify-content: flex-end;

  .el-button {
    border-radius: 8px;
    font-weight: 500;
    box-shadow: 0 2px 6px rgba(64, 158, 255, 0.15);
    transition: all 0.3s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 10px rgba(64, 158, 255, 0.25);
    }
  }
}

// 组件选择器样式
.component-selector {
  .component-options {
    display: flex;
    flex-direction: column;
    margin-bottom: 16px;

    .el-checkbox {
      margin-left: 0;
      margin-bottom: 10px;

      &:last-child {
        margin-bottom: 0;
      }
    }
  }

  .size-selector {
    margin-top: 14px;
    padding-top: 14px;
    border-top: 1px solid #f0f2f5;

    p {
      margin-top: 0;
      margin-bottom: 12px;
      font-size: 14px;
      color: #606266;
    }
  }
}

// 添加自定义样式到全局层
:global(.component-selector-dialog) {
  .el-dialog__header {
    padding: 15px 20px;
    border-bottom: 1px solid #f0f2f5;
  }

  .el-dialog__body {
    padding: 20px;
  }

  .el-dialog__footer {
    padding: 12px 20px;
    border-top: 1px solid #f0f2f5;
  }

  .selector-subtitle {
    margin-top: 0;
    margin-bottom: 12px;
    font-size: 14px;
    color: #606266;
  }
}

// 新的网格布局样式
.grid-layout {
  display: grid;
  grid-template-columns: repeat(4, 1fr); // 默认4列
  gap: 20px;
  margin-bottom: 30px;
}

// 组件包装器样式 - 增强设计
.component-wrapper {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  transition: all 0.3s;
  border: 1px solid rgba(235, 238, 245, 0.8);
  position: relative;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.08);
    border-color: rgba(235, 238, 245, 0.4);
  }

  // 添加精细边框上的光泽效果
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, rgba(64, 158, 255, 0.7), rgba(100, 213, 255, 0.7));
    z-index: 1;
    opacity: 0;
    transition: opacity 0.3s;
  }

  &:hover::before {
    opacity: 1;
  }

  .component-header {
    padding: 16px;
    border-bottom: 1px solid #f0f2f5;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #ffffff;
    height: 50px;
    position: relative;

    // 添加微妙的渐变背景
    &::after {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      height: 1px;
      background: linear-gradient(90deg, rgba(235, 238, 245, 0), rgba(235, 238, 245, 0.8), rgba(235, 238, 245, 0));
    }

    span {
      font-weight: 500;
      font-size: 15px;
      color: #303133;
      position: relative;
      padding-left: 12px;

      // 添加标题前的彩色指示条
      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 4px;
        height: 16px;
        background: #409EFF;
        border-radius: 2px;
      }
    }

    .component-menu-trigger {
      color: #c0c4cc;
      cursor: pointer;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      transition: all 0.2s;

      &:hover {
        color: #409EFF;
        background-color: #ecf5ff;
      }
    }
  }

  .component-content {
    padding: 0;
    height: calc(100% - 50px); // 只减去header高度
    overflow: hidden;

    // 强制子组件适应容器尺寸
    & > div {
      width: 100% !important;
      height: 100% !important;
    }

    // 处理echarts图表
    .echarts {
      width: 100% !important;
      height: 100% !important;
      min-height: 300px;
    }
  }
}

// 为不同类型的组件设置不同的顶部边框颜色
.component-wrapper {
  &:nth-child(5n+1) .component-header span::before {
    background: #40c9c6;
  }

  &:nth-child(5n+2) .component-header span::before {
    background: #36a3f7;
  }

  &:nth-child(5n+3) .component-header span::before {
    background: #f4516c;
  }

  &:nth-child(5n+4) .component-header span::before {
    background: #f6ab5d;
  }

  &:nth-child(5n) .component-header span::before {
    background: #6f42c1;
  }

  // 鼠标悬停时对应的顶部光泽条
  &:nth-child(5n+1):hover::before {
    background: linear-gradient(90deg, rgba(64, 201, 198, 0.7), rgba(64, 201, 198, 0.4));
  }

  &:nth-child(5n+2):hover::before {
    background: linear-gradient(90deg, rgba(54, 163, 247, 0.7), rgba(54, 163, 247, 0.4));
  }

  &:nth-child(5n+3):hover::before {
    background: linear-gradient(90deg, rgba(244, 81, 108, 0.7), rgba(244, 81, 108, 0.4));
  }

  &:nth-child(5n+4):hover::before {
    background: linear-gradient(90deg, rgba(246, 171, 93, 0.7), rgba(246, 171, 93, 0.4));
  }

  &:nth-child(5n):hover::before {
    background: linear-gradient(90deg, rgba(111, 66, 193, 0.7), rgba(111, 66, 193, 0.4));
  }
}

// 响应式调整
@media (max-width: 1200px) {
  .grid-layout {
    grid-template-columns: repeat(3, 1fr); // 中等屏幕3列
  }

  // 在较大的colSpan上强制全宽
  .component-wrapper[style*="grid-column: span 4"] {
    grid-column: span 3 !important;
  }
}

@media (max-width: 768px) {
  .stat-card {
    height: auto;
    flex-direction: column;
    padding: 16px;

    .card-icon {
      width: 100%;
      padding: 12px 0;
    }

    .card-content {
      padding: 12px 0 0;
      align-items: center;
      text-align: center;
    }
  }

  .grid-layout {
    grid-template-columns: repeat(2, 1fr); // 小屏幕2列
  }

  // 在较大的colSpan上强制更窄
  .component-wrapper[style*="grid-column: span 3"],
  .component-wrapper[style*="grid-column: span 4"] {
    grid-column: span 2 !important;
  }
}

@media (max-width: 576px) {
  .grid-layout {
    grid-template-columns: 1fr; // 移动设备1列
  }

  // 所有组件强制单列
  .component-wrapper {
    grid-column: span 1 !important;
  }
}
</style>
