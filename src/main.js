import './style.css'
import { animateAccessibleTurn, wait } from './animationController.js'
import { createCatchaEngine } from './catchaEngine.js'
import { dispenseRemaining, revealEveryCapsule } from './capsuleController.js'
import { attachHandleController } from './handleController.js'
import { createInventoryStore, MACHINES } from './inventoryStore.js'
import { createAppShell, renderCapsules, renderInventory, renderMachines, showToast } from './ui.js'

const app = document.querySelector('#app')
createAppShell(app)

const engine = createCatchaEngine(createInventoryStore())
const DRAW_COUNTS = [1, 5, 10]
const ui = {
  machineId: MACHINES[0].id,
  drawCount: 1,
  purchase: null,
  phase: 'idle',
  processing: false,
}

const els = {
  drawButtons: [...document.querySelectorAll('[data-draw-count]')],
  machineButtons: [...document.querySelectorAll('[data-machine-id]')],
  purchaseButton: document.querySelector('#purchase-button'),
  availability: document.querySelector('#availability-note'),
  turnPanel: document.querySelector('#turn-panel'),
  turnState: document.querySelector('#turn-state'),
  turnHint: document.querySelector('#turn-hint'),
  wheel: document.querySelector('#handle-wheel'),
  gear: document.querySelector('#machine-gear'),
  meter: document.querySelector('#turn-meter-bar'),
  accessibleTurn: document.querySelector('#accessible-turn'),
  openAll: document.querySelector('#open-all'),
  capsuleArea: document.querySelector('#capsule-area'),
  reset: document.querySelector('#reset-demo'),
}

function currentView() {
  return engine.describe()
}

function setWheelProgress(progress) {
  const degrees = progress * 288
  els.wheel.style.setProperty('--wheel-angle', `${degrees}deg`)
  els.meter.style.width = `${progress * 100}%`
}

function purchaseIsOpen() {
  return ui.purchase && ui.purchase.status !== 'completed'
}

function render() {
  const view = currentView()
  const locked = purchaseIsOpen() || ui.processing
  const selectedMachine = MACHINES.find((item) => item.id === ui.machineId)
  const canBuy = !locked && Boolean(ui.machineId) && view.available >= ui.drawCount
  const canTurn = ui.purchase?.status === 'paid_waiting_for_turn' && !ui.processing
  const dispensed = ui.purchase?.capsules.some((capsule) => capsule.status === 'dispensed')

  renderMachines(ui.machineId, locked)
  renderInventory(view)
  renderCapsules(ui.purchase)
  els.drawButtons.forEach((button) => {
    const count = Number(button.dataset.drawCount)
    const selected = count === ui.drawCount
    button.disabled = locked || view.available < count
    button.classList.toggle('is-selected', selected)
    button.setAttribute('aria-pressed', String(selected))
  })

  els.availability.innerHTML = view.available
    ? `현재 <strong>${view.available}개</strong> 구매 가능 · ${view.enabledDrawCounts.join(' · ')}연 선택 가능`
    : '구매 가능한 캡슐이 없습니다.'
  els.purchaseButton.disabled = !canBuy
  els.purchaseButton.textContent = canBuy
    ? `${selectedMachine.name}에서 ${ui.drawCount}연 결제하기`
    : locked ? '진행 중인 캡슐을 먼저 완료해주세요' : '기계와 연차를 선택해주세요'

  els.turnPanel.dataset.status = ui.phase
  els.turnState.textContent = {
    idle: '대기 중',
    paid_waiting_for_turn: '결제 완료',
    committing: '결과 확정 중',
    dispensing: '캡슐 배출 중',
    ready_to_open: '개봉 준비 완료',
    completed: '완료',
  }[ui.phase] ?? '대기 중'
  els.turnHint.textContent = canTurn
    ? '시계 방향으로 약 3/4바퀴 돌리면 추첨이 확정됩니다.'
    : ui.phase === 'dispensing' ? '기어가 돌아가고 캡슐이 나오는 중입니다.'
    : ui.phase === 'ready_to_open' ? '캡슐을 탭해 하나씩 열거나 모두 열어보세요.'
    : ui.phase === 'completed' ? '이번 쿠지를 모두 열었습니다. 다음 기계를 골라보세요.'
    : '결제 후 손잡이를 돌릴 수 있습니다.'
  els.wheel.classList.toggle('is-enabled', canTurn)
  els.wheel.tabIndex = canTurn ? 0 : -1
  els.accessibleTurn.disabled = !canTurn
  els.openAll.disabled = !dispensed || ui.processing
  els.gear.classList.toggle('is-spinning', ui.phase === 'committing' || ui.phase === 'dispensing')
}

async function startDispensing(purchase) {
  ui.processing = true
  ui.phase = 'dispensing'
  ui.purchase = purchase
  render()
  const completedPurchase = await dispenseRemaining({
    engine,
    purchase,
    onStatus: showToast,
    onCapsule(nextPurchase) {
      ui.purchase = nextPurchase
      render()
    },
  })
  ui.purchase = completedPurchase
  ui.processing = false
  ui.phase = completedPurchase.status === 'completed' ? 'completed' : 'ready_to_open'
  render()
  showToast('캡슐이 모두 나왔습니다. 하나씩 열어보세요!')
}

async function commitFromHandle() {
  if (ui.processing || ui.purchase?.status !== 'paid_waiting_for_turn') return
  ui.processing = true
  ui.phase = 'committing'
  render()
  showToast('손잡이 완료! 현재 재고 기준으로 결과를 확정합니다.')
  await wait(440)
  try {
    const purchase = engine.commitDraw(ui.purchase.purchaseId)
    ui.purchase = purchase
    await startDispensing(purchase)
  } catch (error) {
    ui.processing = false
    ui.phase = 'paid_waiting_for_turn'
    handle.reset()
    render()
    showToast(error.message)
  }
}

async function revealOne(capsuleId) {
  if (ui.processing || !ui.purchase) return
  const capsule = ui.purchase.capsules.find((item) => item.capsuleId === capsuleId)
  if (!capsule || capsule.status !== 'dispensed') return
  ui.processing = true
  ui.purchase = engine.updateCapsule(ui.purchase.purchaseId, capsuleId, 'opening')
  render()
  showToast('캡슐에서 빛이 새어 나옵니다…')
  await wait(capsule.grade <= 2 ? 650 : 300)
  ui.purchase = engine.updateCapsule(ui.purchase.purchaseId, capsuleId, 'revealed')
  ui.processing = false
  ui.phase = ui.purchase.status === 'completed' ? 'completed' : 'ready_to_open'
  render()
  showToast(`${capsule.grade}등 · ${capsule.prizeName}`)
}

const handle = attachHandleController(els.wheel, {
  onProgress: setWheelProgress,
  onCommit: commitFromHandle,
})

els.machineButtons.forEach((button) => button.addEventListener('click', () => {
  if (purchaseIsOpen()) return
  ui.machineId = button.dataset.machineId
  render()
}))

els.drawButtons.forEach((button) => button.addEventListener('click', () => {
  if (purchaseIsOpen()) return
  ui.drawCount = Number(button.dataset.drawCount)
  render()
}))

els.purchaseButton.addEventListener('click', () => {
  try {
    ui.purchase = engine.beginPurchase({ machineId: ui.machineId, count: ui.drawCount })
    ui.phase = 'paid_waiting_for_turn'
    handle.reset()
    render()
    showToast(`${ui.drawCount}연 결제가 완료되었습니다. 이제 직접 손잡이를 돌려주세요.`)
  } catch (error) {
    showToast(error.message)
  }
})

els.accessibleTurn.addEventListener('click', async () => {
  if (ui.processing || ui.purchase?.status !== 'paid_waiting_for_turn') return
  els.accessibleTurn.disabled = true
  await animateAccessibleTurn(setWheelProgress)
  commitFromHandle()
})

els.capsuleArea.addEventListener('click', (event) => {
  const button = event.target.closest('[data-capsule-id]')
  if (button) revealOne(button.dataset.capsuleId)
})

els.openAll.addEventListener('click', async () => {
  if (ui.processing || !ui.purchase) return
  ui.processing = true
  render()
  ui.purchase = await revealEveryCapsule({
    engine,
    purchase: ui.purchase,
    onStatus: showToast,
    onGlow(nextPurchase) {
      ui.purchase = nextPurchase
      render()
    },
    onReveal(nextPurchase) {
      ui.purchase = nextPurchase
      render()
    },
  })
  ui.processing = false
  ui.phase = ui.purchase.status === 'completed' ? 'completed' : 'ready_to_open'
  render()
  showToast('모든 결과를 공개했습니다!')
})

els.reset.addEventListener('click', () => {
  if (!window.confirm('데모 재고와 진행 중인 캡슐을 처음 상태로 되돌릴까요?')) return
  engine.resetDemo()
  ui.machineId = MACHINES[0].id
  ui.drawCount = 1
  ui.purchase = null
  ui.phase = 'idle'
  ui.processing = false
  handle.reset()
  render()
  showToast('데모 재고를 처음 상태로 되돌렸습니다.')
})

function resumeProgress() {
  const view = currentView()
  if (!view.activePurchase) return
  ui.purchase = engine.recoverPurchase(view.activePurchase.purchaseId)
  ui.machineId = ui.purchase.machineId
  ui.drawCount = ui.purchase.requestedCount
  if (ui.purchase.status === 'paid_waiting_for_turn') {
    ui.phase = 'paid_waiting_for_turn'
    showToast('이전 결제를 복원했습니다. 손잡이를 돌려 이어서 진행하세요.')
  } else if (ui.purchase.status === 'draw_committed') {
    ui.phase = 'ready_to_open'
    if (ui.purchase.capsules.some((capsule) => capsule.status === 'ready_to_dispense')) {
      showToast('확정된 결과를 복원했습니다. 남은 캡슐을 이어서 배출합니다.')
      startDispensing(ui.purchase)
    } else {
      showToast('이전 캡슐 진행 상태를 복원했습니다.')
    }
  }
}

resumeProgress()
render()
