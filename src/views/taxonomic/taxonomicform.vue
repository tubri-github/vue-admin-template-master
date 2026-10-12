<!--
  Taxonomic > Add

  The same two "add to the museum taxonomy" actions batch review offers inside a record's
  species check, without needing a record: a new species (CreateSpeciesForm, whose family
  picker can also add a family) and a new family on its own.

  Both write to the museum-wide TaxonomicTable / Family, not to a batch, and there is no undo.
  The backend refuses a name that already exists (code 40900) and says which row has it; the
  request interceptor shows that message, so the catch blocks here stay quiet.
-->
<template>
  <div class="app-container">
    <!-- 先隐藏；要恢复删掉 v-if 即可 -->
    <el-alert
      v-if="false"
      type="warning"
      :closable="false"
      show-icon
      class="top-note"
      title="These add rows to the museum-wide taxonomy and cannot be undone. Check the spelling against the Catalog of Fishes first — an existing name is refused, not duplicated."
    />

    <el-tabs v-model="tab">
      <el-tab-pane label="New species" name="species">
        <create-species-form
          ref="speciesForm"
          source="taxonomic_page"
          :show-cancel="false"
          @submit="createSpecies"
        />
      </el-tab-pane>

      <el-tab-pane label="New family" name="family">
        <el-form
          ref="familyForm"
          :model="familyForm"
          :rules="familyRules"
          label-width="140px"
          class="family-form"
        >
          <el-form-item label="Family name" prop="family_name">
            <el-input v-model="familyForm.family_name" placeholder="e.g. Peristediidae" />
          </el-form-item>
          <el-form-item label="Family number">
            <el-input v-model="familyForm.family_number" placeholder="optional" />
          </el-form-item>
          <el-form-item label="Alias">
            <el-input v-model="familyForm.alias2" placeholder="optional" />
          </el-form-item>
          <el-form-item>
            <el-button @click="resetFamily">Reset</el-button>
            <el-button type="primary" :loading="creatingFamily" @click="createFamily">
              Create Family
            </el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>
    </el-tabs>

    <el-card v-if="created.length" class="created">
      <div slot="header">Added in this session</div>
      <el-table :data="created" size="small">
        <el-table-column prop="kind" label="Type" width="90" />
        <el-table-column prop="id" label="ID" width="110" />
        <el-table-column label="Name">
          <template slot-scope="{ row }">
            <i v-if="row.kind === 'Species'">{{ row.name }}</i>
            <span v-else>{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="family" label="Family" />
      </el-table>
    </el-card>
  </div>
</template>

<script>
import { addTaxon } from '@/api/table'
import { createFamily } from '@/api/verbatimworkspace'
import CreateSpeciesForm from '@/components/RecordsProcessor/CreateSpeciesForm.vue'

const emptyFamily = () => ({ family_name: '', family_number: '', alias2: '' })

export default {
  name: 'Taxonomicform',
  components: { CreateSpeciesForm },
  data() {
    return {
      tab: 'species',
      created: [],
      creatingFamily: false,
      familyForm: emptyFamily(),
      familyRules: {
        family_name: [
          { required: true, message: 'Family name is required', trigger: 'blur' },
          { min: 3, message: 'That looks too short for a family name', trigger: 'blur' }
        ]
      }
    }
  },
  methods: {
    async createSpecies(data) {
      try {
        const res = await addTaxon(data)
        const d = res.data || {}
        this.created.unshift({
          kind: 'Species', id: d.taxon_id, name: d.full_name, family: d.family_name
        })
        this.$message.success(`Species "${d.full_name}" created (TaxonID ${d.taxon_id})`)
        this.$refs.speciesForm.resetForm()
      } catch (e) {
        // interceptor already showed the server's message (e.g. "already exists")
      }
    },
    createFamily() {
      this.$refs.familyForm.validate(async valid => {
        if (!valid) return
        this.creatingFamily = true
        try {
          const res = await createFamily({
            family_name: this.familyForm.family_name.trim(),
            family_number: this.familyForm.family_number.trim() || null,
            alias2: this.familyForm.alias2.trim() || null,
            source: 'taxonomic_page'
          })
          const d = res.data || {}
          this.created.unshift({ kind: 'Family', id: d.family_id, name: d.family_name, family: '' })
          this.$message.success(`Family "${d.family_name}" created (FamilyID ${d.family_id})`)
          this.resetFamily()
        } catch (e) {
          // interceptor already showed the server's message
        } finally {
          this.creatingFamily = false
        }
      })
    },
    resetFamily() {
      this.familyForm = emptyFamily()
      this.$nextTick(() => this.$refs.familyForm && this.$refs.familyForm.clearValidate())
    }
  }
}
</script>

<style scoped>
.top-note { margin-bottom: 16px; }
.family-form { max-width: 600px; margin: 0 auto; }
.created { margin-top: 24px; max-width: 900px; }
</style>
