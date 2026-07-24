import { wait } from './animationController.js'

export async function dispenseRemaining({ engine, purchase, onCapsule, onStatus }) {
  const remaining = purchase.capsules.filter((capsule) => capsule.status === 'ready_to_dispense')
  for (const capsule of remaining) {
    onStatus(`미스터리볼 ${purchase.capsules.indexOf(capsule) + 1}번이 나옵니다.`)
    await wait(520)
    purchase = engine.updateCapsule(purchase.purchaseId, capsule.capsuleId, 'dispensed')
    onCapsule(purchase, capsule.capsuleId)
    await wait(250)
  }
  return purchase
}

export async function revealEveryCapsule({ engine, purchase, onGlow, onReveal, onStatus }) {
  const pending = purchase.capsules.filter((capsule) => capsule.status === 'dispensed')
  for (const capsule of pending) {
    purchase = engine.updateCapsule(purchase.purchaseId, capsule.capsuleId, 'opening')
    onGlow(purchase, capsule.capsuleId)
    onStatus('미스터리볼이 열립니다…')
    await wait(capsule.grade <= 2 ? 820 : 500)
    purchase = engine.updateCapsule(purchase.purchaseId, capsule.capsuleId, 'revealed')
    onReveal(purchase, capsule.capsuleId)
    await wait(180)
  }
  return purchase
}
