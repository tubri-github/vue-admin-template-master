<!--
  DecisionSection.vue

  The shared frame for a "curator rules on a list of things" block: title, one-line purpose,
  an optional caveat banner, a pending count, loading/empty states, and a collapsible
  "already decided" area.

  Only the frame is shared. Each section supplies its own table through the default slot,
  because a family-pair row and a duplicate-taxon row have almost nothing in common -- forcing
  them through one generic table would take more slots than it saves.
-->
<template>
  <el-card class="decision-section" shadow="never">
    <div slot="header" class="clearfix">
      <span class="section-title">{{ title }}</span>
      <el-tag v-if="pendingCount !== null" :type="pendingCount ? 'warning' : 'success'" size="mini" class="count-tag">
        {{ pendingCount ? pendingCount + ' to decide' : 'all decided' }}
      </el-tag>
      <div class="header-actions">
        <slot name="actions" />
        <el-button type="text" size="small" :loading="loading" @click="$emit('refresh')">
          <i class="el-icon-refresh" /> Refresh
        </el-button>
      </div>
    </div>

    <p v-if="purpose" class="purpose">{{ purpose }}</p>

    <el-alert
      v-if="caveat"
      :title="caveat"
      type="warning"
      :closable="false"
      show-icon
      class="caveat"
    />

    <div v-loading="loading">
      <el-empty v-if="!loading && isEmpty" :description="emptyText" />
      <slot v-else />
    </div>

    <div v-if="$slots.decided" class="decided">
      <el-button type="text" size="small" @click="showDecided = !showDecided">
        <i :class="showDecided ? 'el-icon-arrow-down' : 'el-icon-arrow-right'" />
        {{ showDecided ? 'Hide' : 'Show' }} what has already been decided<span
          v-if="decidedCount !== null"
        > ({{ decidedCount }})</span>
      </el-button>
      <div v-show="showDecided" class="decided-body">
        <slot name="decided" />
      </div>
    </div>
  </el-card>
</template>

<script>
export default {
  name: 'DecisionSection',
  props: {
    title: { type: String, required: true },
    purpose: { type: String, default: '' },
    // Shown as a warning banner above the list: something the curator must know BEFORE
    // ruling (e.g. the reference snapshot may itself be stale).
    caveat: { type: String, default: '' },
    pendingCount: { type: Number, default: null },
    // shown next to the "already decided" toggle so the section is not a blind door
    decidedCount: { type: Number, default: null },
    loading: { type: Boolean, default: false },
    isEmpty: { type: Boolean, default: false },
    emptyText: { type: String, default: 'Nothing to decide' }
  },
  data() {
    return { showDecided: false }
  }
}
</script>

<style scoped>
.decision-section { margin-bottom: 18px; }
.section-title { font-size: 15px; font-weight: 600; }
.count-tag { margin-left: 10px; }
.header-actions { float: right; }
.purpose { margin: 0 0 10px; color: #606266; font-size: 13px; line-height: 1.6; }
.caveat { margin-bottom: 12px; }
.decided { margin-top: 12px; border-top: 1px solid #ebeef5; padding-top: 8px; }
.decided-body { margin-top: 8px; }
</style>
