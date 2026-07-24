import { wait } from './animationController.js'

export async function dispenseRemaining({ engine, purchase, onCapsule, onStatus }) {
  const remaining = purchase.capsules.filter((capsule) => capsule.status === 'ready_to_dispense')
  const START_DELAY_MS = 120
  const BALL_STAGGER_MS = 145

  // Each result begins shortly after the previous one, but its rolling motion
  // continues independently. This keeps 5/10 draws fast and rhythmic.
  const draws = remaining.map(async (capsule, index) => {
    await wait(START_DELAY_MS + index * BALL_STAGGER_MS)
    const nextPurchase = engine.updateCapsule(purchase.purchaseId, capsule.capsuleId, 'dispensed')
    onStatus(`미스터리볼 ${index + 1}번이 결과 트레이로 굴러갑니다.`)
    onCapsule(nextPurchase, capsule.capsuleId)
    return nextPurchase
  })

  const updatedPurchases = await Promise.all(draws)
  return updatedPurchases.at(-1) ?? purchase
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
