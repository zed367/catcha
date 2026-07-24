import { wait } from './animationController.js'

export async function dispenseRemaining({ engine, purchase, onCapsule, onStatus }) {
  const remaining = purchase.capsules.filter((capsule) => capsule.status === 'ready_to_dispense')
  for (const capsule of remaining) {
    onStatus(`캡슐 ${purchase.capsules.indexOf(capsule) + 1}번이 배출됩니다.`)
    await wait(430)
    purchase = engine.updateCapsule(purchase.purchaseId, capsule.capsuleId, 'dispensed')
    onCapsule(purchase, capsule.capsuleId)
    await wait(210)
  }
  return purchase
}

export async function revealEveryCapsule({ engine, purchase, onGlow, onReveal, onStatus }) {
  const pending = purchase.capsules.filter((capsule) => capsule.status === 'dispensed')
  for (const capsule of pending) {
    purchase = engine.updateCapsule(purchase.purchaseId, capsule.capsuleId, 'opening')
    onGlow(purchase, capsule.capsuleId)
    onStatus('캡슐에서 빛이 새어 나옵니다…')
    await wait(capsule.grade <= 2 ? 650 : 300)
    purchase = engine.updateCapsule(purchase.purchaseId, capsule.capsuleId, 'revealed')
    onReveal(purchase, capsule.capsuleId)
    await wait(180)
  }
  return purchase
}
