import { GRADE_META } from './inventoryStore.js'

const DRAW_COUNTS = [1, 5, 10]

function id(prefix) {
  return `${prefix}_${crypto.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(16).slice(2)}`}`
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value))
}

function totalRemaining(snapshot) {
  return snapshot.inventory.reduce((sum, item) => sum + item.remaining, 0)
}

function heldCount(snapshot) {
  return snapshot.purchases
    .filter((purchase) => purchase.status === 'paid_waiting_for_turn')
    .reduce((sum, purchase) => sum + purchase.requestedCount, 0)
}

function activePurchase(snapshot) {
  return snapshot.purchases
    .filter((purchase) => purchase.status !== 'completed')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null
}

function chooseInventory(inventory) {
  const total = inventory.reduce((sum, item) => sum + item.remaining, 0)
  let target = Math.floor(Math.random() * total)

  for (const item of inventory) {
    target -= item.remaining
    if (target < 0) return item
  }

  return inventory.at(-1)
}

function makeCapsule(inventoryItem, index, lottoNumber) {
  const meta = GRADE_META[inventoryItem.grade]
  return {
    capsuleId: id('capsule'),
    drawResultId: id('result'),
    prizeId: `prize_grade_${inventoryItem.grade}_${index + 1}`,
    // Visual-only lottery number. It never changes the weighted prize result.
    lottoNumber,
    grade: inventoryItem.grade,
    prizeName: meta.name,
    status: 'ready_to_dispense',
  }
}

/**
 * Browser-only adapter for the future API contract.
 * A paid purchase holds only a total count; the weighted result is committed at
 * handle completion, so the grade is never chosen when payment starts.
 */
export function createCatchaEngine(store) {
  function snapshot() {
    return store.read()
  }

  function describe(current = snapshot()) {
    const physicalRemaining = totalRemaining(current)
    const reserved = heldCount(current)
    const available = Math.max(0, physicalRemaining - reserved)
    const inventory = current.inventory.map((item) => ({
      ...item,
      probability: physicalRemaining === 0 ? 0 : Math.round((item.remaining / physicalRemaining) * 1000) / 10,
      ...GRADE_META[item.grade],
    }))

    return {
      inventory,
      physicalRemaining,
      reserved,
      available,
      enabledDrawCounts: DRAW_COUNTS.filter((count) => available >= count),
      activePurchase: deepClone(activePurchase(current)),
    }
  }

  function beginPurchase({ machineId, count }) {
    const current = snapshot()
    const view = describe(current)
    if (!DRAW_COUNTS.includes(count)) throw new Error('지원하지 않는 연차입니다.')
    if (activePurchase(current)) throw new Error('진행 중인 구매를 먼저 완료해주세요.')
    if (view.available < count) throw new Error('선택한 연차를 위한 재고가 부족합니다.')

    const purchase = {
      purchaseId: id('purchase'),
      reservationId: id('reservation'),
      machineId,
      requestedCount: count,
      confirmedCount: 0,
      status: 'paid_waiting_for_turn',
      createdAt: new Date().toISOString(),
      capsules: [],
    }
    current.purchases.push(purchase)
    store.write(current)
    return deepClone(purchase)
  }

  function commitDraw(purchaseId) {
    const current = snapshot()
    const purchase = current.purchases.find((item) => item.purchaseId === purchaseId)
    if (!purchase) throw new Error('구매 정보를 찾지 못했습니다.')
    if (purchase.status === 'draw_committed' || purchase.status === 'completed') return deepClone(purchase)
    if (purchase.status !== 'paid_waiting_for_turn') throw new Error('현재 추첨을 진행할 수 없습니다.')
    if (totalRemaining(current) < purchase.requestedCount) throw new Error('예약 재고를 확인할 수 없습니다. 다시 시도해주세요.')

    // Production: this block becomes a DB transaction with a purchaseId idempotency key.
    const capsules = []
    const usedLottoNumbers = new Set()
    for (let index = 0; index < purchase.requestedCount; index += 1) {
      const prize = chooseInventory(current.inventory)
      prize.remaining -= 1
      let lottoNumber
      do {
        lottoNumber = Math.floor(Math.random() * 45) + 1
      } while (usedLottoNumbers.has(lottoNumber))
      usedLottoNumbers.add(lottoNumber)
      capsules.push(makeCapsule(prize, index, lottoNumber))
    }

    purchase.status = 'draw_committed'
    purchase.confirmedCount = capsules.length
    purchase.capsules = capsules
    purchase.committedAt = new Date().toISOString()
    store.write(current)
    return deepClone(purchase)
  }

  function updateCapsule(purchaseId, capsuleId, status) {
    const current = snapshot()
    const purchase = current.purchases.find((item) => item.purchaseId === purchaseId)
    const capsule = purchase?.capsules.find((item) => item.capsuleId === capsuleId)
    if (!purchase || !capsule) throw new Error('캡슐 정보를 찾지 못했습니다.')
    if (status === 'dispensed' && capsule.status === 'ready_to_dispense') capsule.status = 'dispensed'
    if (status === 'opening' && capsule.status === 'dispensed') capsule.status = 'opening'
    if (status === 'revealed' && capsule.status === 'opening') capsule.status = 'revealed'
    if (purchase.capsules.every((item) => item.status === 'revealed')) purchase.status = 'completed'
    store.write(current)
    return deepClone(purchase)
  }

  function recoverPurchase(purchaseId) {
    const current = snapshot()
    const purchase = current.purchases.find((item) => item.purchaseId === purchaseId)
    if (!purchase) return null
    // An interrupted glow has not revealed a prize, so make that capsule safely openable again.
    let changed = false
    purchase.capsules.forEach((capsule) => {
      if (capsule.status === 'opening') {
        capsule.status = 'dispensed'
        changed = true
      }
    })
    if (changed) store.write(current)
    return deepClone(purchase)
  }

  function resetDemo() {
    return store.reset()
  }

  return { describe, beginPurchase, commitDraw, updateCapsule, recoverPurchase, resetDemo }
}
