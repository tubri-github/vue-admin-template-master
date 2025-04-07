<template>
  <div class="recent-records-container" :style="containerStyle">
    <div class="header-actions">
      <h3 class="component-subtitle"></h3>
      <el-button size="mini" icon="el-icon-refresh" @click="fetchRecentRecords">
        Refresh
      </el-button>
    </div>

    <el-timeline class="records-timeline" :style="timelineStyle">
      <el-timeline-item
        v-for="record in recentRecords"
        :key="record.id"
        :timestamp="record.timestamp"
        hollow
        type="primary"
        placement="top"
      >
        <div class="record-content">
          <span class="record-type">Add {{ record.type }}</span>
          <span class="record-id">ID: {{ record.id }}</span>
        </div>
      </el-timeline-item>
      <el-timeline-item v-if="recentRecords.length === 0" type="info">
        No recent records found
      </el-timeline-item>
    </el-timeline>
  </div>
</template>

<script>
import { recentAdded } from '@/api/table'

export default {
  name: 'RecentRecords',
  props: {
    width: {
      type: [String, Number],
      default: '100%'
    },
    height: {
      type: [String, Number],
      default: 350
    }
  },
  computed: {
    containerStyle() {
      return {
        width: typeof this.width === 'number' ? `${this.width}px` : this.width,
        height: typeof this.height === 'number' ? `${this.height}px` : this.height
      }
    },
    timelineStyle() {
      // 内部时间线高度应当减去头部的高度，确保滚动区域适合容器
      const headerHeight = 50; // 头部高度的估计值
      const timelineHeight = typeof this.height === 'number'
        ? (this.height - headerHeight)
        : 'calc(100% - 50px)';

      return {
        height: typeof timelineHeight === 'number' ? `${timelineHeight}px` : timelineHeight
      }
    }
  },
  data() {
    return {
      recentRecords: []
    }
  },
  created() {
    this.fetchRecentRecords()
  },
  methods: {
    fetchRecentRecords() {
      recentAdded().then(response => {
        this.recentRecords = response.data.items
      }).catch(error => {
        console.error('Failed to fetch recent records:', error)
        this.$message.error('Failed to load recent records')
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.recent-records-container {
  padding: 16px;
  height: 100%;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-shrink: 0;

  .component-subtitle {
    margin: 0;
    font-size: 16px;
    font-weight: 500;
    color: #303133;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.records-timeline {
  flex-grow: 1;
  overflow-y: auto;
  padding-right: 10px;

  .record-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;

    .record-type {
      font-weight: 500;
      margin-right: 8px;
    }

    .record-id {
      color: #909399;
      font-size: 13px;
    }

    @media (max-width: 480px) {
      flex-direction: column;
      align-items: flex-start;

      .record-id {
        margin-top: 4px;
      }
    }
  }
}

// Custom scrollbar for the timeline
.records-timeline::-webkit-scrollbar {
  width: 6px;
}

.records-timeline::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.records-timeline::-webkit-scrollbar-thumb {
  background: #d0d0d0;
  border-radius: 3px;
}

.records-timeline::-webkit-scrollbar-thumb:hover {
  background: #b3b3b3;
}

// Add resize method to support parent component's resize calls
:deep(.el-timeline) {
  width: 100%;
}
</style>
