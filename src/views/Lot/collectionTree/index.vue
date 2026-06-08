<template>
  <div class="app-container">
    <!-- Load a lot -->
    <div class="card">
      <div class="sec-title">Collection tree — manage cross-collection sub-records of a lot</div>
      <el-row :gutter="10" type="flex" align="middle">
        <el-col :span="6">
          <el-input v-model="catalogInput" placeholder="Catalog # of the fluid lot" clearable @keyup.enter.native="loadByCatalog">
            <template slot="prepend">Catalog #</template>
          </el-input>
        </el-col>
        <el-col :span="6">
          <el-button type="primary" icon="el-icon-search" :loading="loading" @click="loadByCatalog">Load tree</el-button>
        </el-col>
      </el-row>
      <div class="muted" style="margin-top:8px">
        Root = the fluid lot (numeric catalog). Sub-records (osteology/tissue/image) get OST-/TIS-/IMG- identifiers and are linked by internal id. image is a voucher leaf.
      </div>
    </div>

    <el-row v-if="rootPrimaryId" :gutter="16">
      <!-- Tree -->
      <el-col :span="14">
        <div class="card">
          <div class="sec-title">Preparation / collection tree</div>
          <el-tree
            ref="tree"
            :data="treeData"
            node-key="PrimaryID"
            :expand-on-click-node="false"
            default-expand-all
            highlight-current
            @node-click="onNode"
          >
            <span slot-scope="{ data }" class="tree-row">
              <el-tag size="mini" :type="tagType(data.collection)" effect="plain">{{ data.collection }}</el-tag>
              <b class="ident">{{ data.identifier || ('#' + data.CatalogNumber) }}</b>
              <span v-if="data.TotalNumber" class="muted">×{{ data.TotalNumber }}</span>
              <span v-if="data.Remarks" class="muted">— {{ data.Remarks }}</span>
            </span>
          </el-tree>
        </div>
      </el-col>

      <!-- Add sub-record -->
      <el-col :span="10">
        <div class="card">
          <div class="sec-title">Selected node</div>
          <div v-if="!selectedNode" class="muted">Click a node in the tree to add a sub-record under it.</div>
          <template v-else>
            <p>
              <el-tag size="mini" :type="tagType(selectedNode.collection)" effect="plain">{{ selectedNode.collection }}</el-tag>
              <b>{{ selectedNode.identifier || ('#' + selectedNode.CatalogNumber) }}</b>
              <span class="muted">(PrimaryID {{ selectedNode.PrimaryID }})</span>
            </p>
            <template v-if="selectedNode.collection !== 'image'">
              <el-form size="small" label-width="110px">
                <el-form-item label="Collection">
                  <el-select v-model="newColl" style="width:100%">
                    <el-option label="osteology (OST-)" value="osteology" />
                    <el-option label="tissue (TIS-)" value="tissue" />
                    <el-option label="image (IMG-)" value="image" />
                  </el-select>
                </el-form-item>
                <el-form-item label="Total number">
                  <el-input-number v-model="newTotal" :min="0" />
                </el-form-item>
                <el-form-item label="Remarks">
                  <el-input v-model="newRemarks" type="textarea" :rows="2" />
                </el-form-item>
                <el-form-item label="Inherit locality">
                  <el-switch v-model="newInheritLoc" />
                </el-form-item>
                <el-button type="primary" icon="el-icon-plus" :loading="adding" @click="addSub">Add sub-record</el-button>
              </el-form>
            </template>
            <div v-else class="muted">image is a voucher leaf — it cannot have sub-records.</div>

            <!-- Delete: only sub-records (not the fluid root). -->
            <div v-if="selectedNode.parent_id" style="margin-top:16px;border-top:1px solid #ebeef5;padding-top:12px">
              <el-button type="danger" icon="el-icon-delete" size="small" plain :loading="deleting" @click="delNode">
                Delete this node{{ childCount(selectedNode) ? (' + ' + childCount(selectedNode) + ' sub-record(s)') : '' }}
              </el-button>
            </div>
          </template>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { getLotsAdvanced, getLotTree, addSubRecord, deleteSubRecord } from '@/api/table'

export default {
  name: 'LotCollectionTree',
  data() {
    return {
      catalogInput: '',
      rootPrimaryId: null,
      flat: [],
      treeData: [],
      selectedNode: null,
      loading: false,
      adding: false,
      deleting: false,
      newColl: 'tissue',
      newTotal: 0,
      newRemarks: '',
      newInheritLoc: true
    }
  },
  created() {
    // 从 add-lot 跳转过来时带 ?catalog=，自动载入该 lot 的树。
    const cat = this.$route.query.catalog
    if (cat) {
      this.catalogInput = String(cat)
      this.loadByCatalog()
    }
  },
  methods: {
    tagType(coll) {
      return { fluid: '', osteology: 'info', tissue: 'success', image: 'warning' }[coll] || ''
    },
    childCount(node) {
      if (!node) return 0
      return this.flat.filter(n => n.parent_id === node.PrimaryID).length
    },
    buildTree(items) {
      const byId = {}
      items.forEach(i => { byId[i.PrimaryID] = Object.assign({ children: [] }, i) })
      const roots = []
      items.forEach(i => {
        const node = byId[i.PrimaryID]
        if (i.parent_id && byId[i.parent_id]) byId[i.parent_id].children.push(node)
        else roots.push(node)
      })
      return roots
    },
    loadByCatalog() {
      const cat = (this.catalogInput || '').trim()
      if (!cat) return
      this.loading = true
      // resolve the fluid root PrimaryID from the catalog number
      getLotsAdvanced({ ids: cat, page: 1, page_size: 1 }).then(res => {
        const items = (res.data.items || []).filter(it => !it.parent_id)
        const root = items[0] || (res.data.items || [])[0]
        if (!root) { this.$message.warning('No lot found for that catalog number'); this.loading = false; return }
        this.rootPrimaryId = root.PrimaryID
        return this.reloadTree()
      }).catch(() => { this.$message.error('Failed to load lot') }).then(() => { this.loading = false })
    },
    reloadTree() {
      if (!this.rootPrimaryId) return Promise.resolve()
      return getLotTree({ primaryId: this.rootPrimaryId }).then(res => {
        this.flat = res.data.items || []
        this.treeData = this.buildTree(this.flat)
        // keep selection if still present
        if (this.selectedNode) {
          this.selectedNode = this.flat.find(n => n.PrimaryID === this.selectedNode.PrimaryID) || null
        }
      })
    },
    onNode(data) { this.selectedNode = data },
    addSub() {
      if (!this.selectedNode) return
      this.adding = true
      addSubRecord({
        parent_primary_id: this.selectedNode.PrimaryID,
        collection: this.newColl,
        total_number: this.newTotal || null,
        remarks: this.newRemarks || null,
        inherit_locality: this.newInheritLoc
      }).then(res => {
        this.$message.success('Added ' + res.data.items.identifier)
        this.newRemarks = ''
        return this.reloadTree()
      }).catch(err => {
        const msg = (err && err.message) || 'Failed to add sub-record'
        this.$message.error(msg)
      }).then(() => { this.adding = false })
    },
    delNode() {
      const node = this.selectedNode
      if (!node || !node.parent_id) return
      const kids = this.childCount(node)
      const label = node.identifier || ('#' + node.CatalogNumber)
      const warn = kids
        ? `Delete ${label} AND its ${kids} sub-record(s)? This cannot be undone.`
        : `Delete ${label}? This cannot be undone.`
      this.$confirm(warn, 'Confirm delete', { type: 'warning' }).then(() => {
        this.deleting = true
        // 有子节点时需 cascade=true（后端否则 400）。
        return deleteSubRecord(node.PrimaryID, kids > 0)
      }).then(res => {
        if (!res) return // 用户取消
        this.$message.success('Deleted ' + res.data.items.count + ' record(s)')
        this.selectedNode = null
        return this.reloadTree()
      }).catch(err => {
        if (err === 'cancel' || err === 'close') return
        const msg = (err && err.message) || 'Failed to delete'
        this.$message.error(msg)
      }).then(() => { this.deleting = false })
    }
  }
}
</script>

<style scoped>
.app-container { background: #f5f7fa; padding: 16px 20px; }
.card { background: #fff; border-radius: 8px; box-shadow: 0 2px 12px rgba(0,0,0,.08); padding: 16px; margin-bottom: 16px; }
.sec-title { font-size: 14px; color: #303133; font-weight: 600; margin-bottom: 12px; }
.muted { color: #909399; font-size: 12px; }
.tree-row { display: inline-flex; align-items: center; gap: 8px; }
.tree-row .ident { font-weight: 600; }
</style>
