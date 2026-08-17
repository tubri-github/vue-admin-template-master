/**
 * 详情弹窗里定一条记录的种名 —— 决定和写入是同一件事。
 *
 * 以前的顺序是：先把这一条单独 PUT 掉，再问要不要应用到同名的其余记录，最后对"剩下的"
 * 做一次 name-group apply。于是这一条不在那次 apply 的 prev_state 里，Undo 还不了它：
 * 每 undo 一次再 apply 一次，集合就少一条（真实记录：225 -> 224 -> 223），而被撤销掉的
 * 那个答案会永远留在触发的那条上（批次 20260806-001 的 PrimaryID 122365 就是这样挂着
 * 一个已经撤销的 isolepis）。
 *
 * 现在先问再写：选 "Apply to all" 就把这一条连同同名的其余记录一次性交给 name-group
 * apply（include_record_ids 把它强行纳入集合，prev_state 记的是它真正的判前状态），
 * 选 "Just this one" 才发单条 PUT。一个鉴定 = 一个集合 = 一次可完整撤销的操作。
 */
import { updateVerbatimRecord, previewNameGroup, applyNameGroup } from '@/api/verbatimworkspace'

// 跟后端 NAME_KEY_SQL 同一套归一化：小写、空白折叠、去首尾
export function verbatimNameKey(verbatim) {
  if (!verbatim) return ''
  const genus = verbatim.verbatimGenus || verbatim.genus || ''
  const species = verbatim.verbatimSpecies || verbatim.species || ''
  return `${genus} ${species}`.replace(/\s+/g, ' ').trim().toLowerCase()
}

/**
 * @param {Vue} vm 用来弹 $confirm 的组件实例
 * @param {Object} opts
 * @param {string} opts.batchSerialId
 * @param {number} opts.recordId       正在判的这一条
 * @param {Object} opts.verbatim       这条的 verbatim 名（取 name_key 用）
 * @param {number} opts.samePendingAny 同名还在等的条数，含自己（same_name_pending_any）
 * @param {number} opts.taxonId        判给它的 taxon，null 表示清除匹配
 * @param {string} opts.notes          写进 verification_notes
 * @param {string} opts.curator
 * @returns {Promise<{ok: boolean, mode: 'single'|'group', count: number, message: string}>}
 */
export async function decideTaxon(vm, opts) {
  const { batchSerialId, recordId, verbatim, samePendingAny, taxonId, notes, curator } = opts

  const saveThisOne = async() => {
    const payload = {
      id: recordId,
      taxon_id: taxonId || null,
      species_verification_status: taxonId ? 'verified' : 'pending',
      verification_notes: notes
    }
    // 署名只在真的定下来时写：区分 curator 人工确认和导入时的自动匹配
    if (taxonId) payload.verified_by = curator
    const res = await updateVerbatimRecord(payload)
    return { ok: res.code === 20000, mode: 'single', count: res.code === 20000 ? 1 : 0,
      message: res.message }
  }

  const nameKey = verbatimNameKey(verbatim)
  // 清除匹配、同名只有这一条、或者信息不全 —— 都只是一次普通的单条保存
  if (!taxonId || !batchSerialId || !nameKey || (samePendingAny || 0) <= 1) {
    return saveThisOne()
  }

  let preview = null
  try {
    const res = await previewNameGroup(batchSerialId, {
      name_key: nameKey,
      taxon_id: taxonId,
      whole_name: true,
      include_record_ids: [recordId]
    })
    if (res.code === 20000) preview = res.data
  } catch (e) {
    // 追问是锦上添花。问不出来就退回单条保存，别把 curator 这次决定卡住
  }
  if (!preview || !preview.records_to_apply || preview.records_to_apply <= 1) {
    return saveThisOne()
  }

  let msg = `${preview.records_to_apply} record(s) in this batch were imported as ` +
    `"${nameKey}", including this one.\n\n` +
    `Apply ${preview.taxon.full_name} to all of them?`
  if (preview.family_reference_warning) {
    msg += `\n\nFlagged on each: ${preview.family_reference_warning.message}`
  }
  msg += '\n\nThis is one operation and can be undone as a whole from "Decide by name".'

  try {
    await vm.$confirm(msg, 'Same name, same decision', {
      type: 'warning',
      confirmButtonText: `Apply to ${preview.records_to_apply}`,
      cancelButtonText: 'Just this one'
    })
  } catch (e) {
    return saveThisOne() // "Just this one"，或者直接关掉了追问
  }

  const res = await applyNameGroup(batchSerialId, {
    name_key: nameKey,
    taxon_id: taxonId,
    whole_name: true,
    include_record_ids: [recordId],
    applied_by: curator
  })
  if (res.code !== 20000) {
    return { ok: false, mode: 'group', count: 0, message: res.message }
  }
  return {
    ok: true,
    mode: 'group',
    count: (res.data && res.data.records_applied) || preview.records_to_apply,
    message: res.message
  }
}
