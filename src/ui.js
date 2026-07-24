import { GRADE_META, MACHINES } from './inventoryStore.js'

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function machineMarkup(machine, variant = 'selector') {
  const isModal = variant === 'modal'
  const tag = isModal ? 'div' : 'button'
  const attributes = isModal
    ? `class="machine machine--modal" data-theme="${machine.theme}"`
    : `class="machine" type="button" data-machine-id="${machine.id}" data-theme="${machine.theme}" aria-pressed="false"`
  return `
    <${tag} ${attributes}>
      <span class="machine__top"><b>${machine.number}</b><small>CAPSULE<br />STATION</small></span>
      <span class="machine__poster" aria-hidden="true">
        <span class="machine__poster-star">✦</span>
        <strong>${machine.posterTitle.replace('\n', '<br />')}</strong>
        <small>${machine.posterSubtitle}</small>
      </span>
      <span class="machine__dome"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span>
      <span class="machine__control" aria-hidden="true"><i>¥ 300</i><b>↻</b><em></em></span>
      <span class="machine__exit" aria-hidden="true"><i>TAKE<br />OUT</i></span>
      <span class="machine__name">${machine.name}</span>
    </${tag}>
  `
}

export function createAppShell(app) {
  app.innerHTML = `
    <main class="app-shell">
      <header class="topbar">
        <a class="brand" href="#top" aria-label="Capsule Parade 홈"><span>CAPSULE</span> PARADE</a>
        <p>고른 한 대가 눈앞으로 다가오는 가챠 쿠지.</p>
        <button id="reset-demo" class="text-button" type="button">데모 재시작</button>
      </header>

      <section id="top" class="hero">
        <div>
          <p class="eyebrow">ONLINE KUJI · CAPSULE EDITION</p>
          <h1>어떤 기계든<br /><em>같은 행운.</em></h1>
          <p class="hero__copy">기계를 고르면 실제 매대처럼 전면에 나타납니다.<br />손잡이를 돌려 미스터리볼 추첨을 시작하세요.</p>
        </div>
        <div class="hero__counter">
          <span>남은 캡슐</span>
          <strong id="hero-remaining">–</strong>
          <small>실시간 데모 재고</small>
        </div>
      </section>

      <section class="machine-section" aria-labelledby="machine-heading">
        <div class="section-heading">
          <div><p class="eyebrow">STEP 01</p><h2 id="machine-heading">마음에 드는 기계를 고르세요</h2></div>
          <span id="selected-machine-name" class="selection-note">기계를 선택해주세요</span>
        </div>
        <div id="machine-list" class="machine-list">${MACHINES.map(machineMarkup).join('')}</div>
      </section>

      <section class="inventory-section" aria-labelledby="inventory-heading">
        <div class="section-heading"><div><p class="eyebrow">LIVE INVENTORY</p><h2 id="inventory-heading">남은 경품</h2></div><span class="inventory-disclaimer">확률·수량은 실제 남은 재고 기준</span></div>
        <div id="inventory-list" class="inventory-list"></div>
      </section>
    </main>
    <div id="draw-modal" class="draw-modal" aria-hidden="true">
      <div class="draw-modal__backdrop" data-modal-close></div>
      <section class="draw-modal__panel" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <button id="modal-close" class="modal-close" type="button" aria-label="기계 선택 화면으로 돌아가기">×</button>
        <header class="draw-modal__header">
          <div><p class="eyebrow">SELECTED GACHA MACHINE</p><h2 id="modal-title">기계를 고르세요</h2></div>
          <span id="turn-state" class="modal-status">대기 중</span>
        </header>
        <div class="draw-modal__layout">
          <div id="modal-machine" class="modal-machine-slot"></div>
          <div class="draw-modal__experience">
            <div class="play-panel">
              <p class="eyebrow">STEP 02 · DRAW COUNT</p>
              <h3>몇 개의 공을<br />추첨할까요?</h3>
              <div id="draw-counts" class="draw-counts" role="group" aria-label="연차 선택">
                <button type="button" data-draw-count="1"><strong>1</strong><span>한 번</span></button>
                <button type="button" data-draw-count="5"><strong>5</strong><span>다섯 번</span></button>
                <button type="button" data-draw-count="10"><strong>10</strong><span>열 번</span></button>
              </div>
              <p id="availability-note" class="availability-note"></p>
              <button id="purchase-button" class="purchase-button" type="button">연차를 선택해주세요</button>
              <p class="payment-note">결제 뒤 손잡이를 끝까지 돌린 순간에만<br />남은 재고 기준으로 결과가 확정됩니다.<br />데모 재고는 새로고침하면 자동 리필됩니다.</p>
            </div>

            <div id="turn-panel" class="turn-panel" data-status="idle">
              <div class="lotto-machine" id="lotto-machine" aria-hidden="true">
                <div class="lotto-machine__dome"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
                <div class="lotto-machine__neck"></div><div class="lotto-machine__gate"></div>
              </div>
              <h3>손잡이를 돌리면<br /><em>미스터리볼이 나옵니다.</em></h3>
              <div class="handle-stage">
                <div id="machine-gear" class="machine-gear" aria-hidden="true">✣</div>
                <div id="handle-wheel" class="handle-wheel" role="img" aria-label="가챠 손잡이. 시계 방향으로 드래그해 돌리세요." tabindex="0">
                  <span class="handle-wheel__notch"></span><span class="handle-wheel__hub">TURN</span>
                </div>
                <span class="handle-arrow" aria-hidden="true">↻</span>
              </div>
              <div class="turn-meter" aria-label="손잡이 회전 진행"><span id="turn-meter-bar"></span></div>
              <button id="accessible-turn" class="accessible-turn" type="button">손잡이 돌리기</button>
              <p id="turn-hint" class="turn-hint">결제 후 손잡이를 돌릴 수 있습니다.</p>
            </div>
          </div>
        </div>
        <section class="lotto-results" aria-labelledby="lotto-results-heading">
          <div class="lotto-results__heading"><div><p class="eyebrow">DRAW RESULTS</p><h3 id="lotto-results-heading">추첨 결과</h3></div><button id="open-all" class="open-all" type="button" disabled>모두 공개</button></div>
          <div id="capsule-area" class="lotto-results__balls" aria-live="polite"><p class="empty-capsules">손잡이를 돌리면 공이 이곳으로 굴러 나옵니다.</p></div>
        </section>
      </section>
    </div>
    <div id="toast" class="toast" role="status" aria-live="polite"></div>
  `
}

export function renderMachines(selectedMachineId, disabled) {
  document.querySelectorAll('[data-machine-id]').forEach((button) => {
    const selected = button.dataset.machineId === selectedMachineId
    button.classList.toggle('is-selected', selected)
    button.disabled = disabled
    button.setAttribute('aria-pressed', String(selected))
  })
  const machine = MACHINES.find((item) => item.id === selectedMachineId)
  document.querySelector('#selected-machine-name').textContent = machine ? `${machine.number} · ${machine.name} 선택됨` : '기계를 선택해주세요'
}

export function renderModalMachine(machineId) {
  const machine = MACHINES.find((item) => item.id === machineId)
  if (!machine) return
  document.querySelector('#modal-machine').innerHTML = machineMarkup(machine, 'modal')
  document.querySelector('#modal-title').textContent = `${machine.number} · ${machine.name}`
}

export function renderInventory(view) {
  document.querySelector('#hero-remaining').textContent = view.physicalRemaining
  document.querySelector('#inventory-list').innerHTML = view.inventory.map((item) => `
    <article class="inventory-card grade-${item.className}">
      <span class="inventory-card__grade">${item.label}</span>
      <strong>${escapeHtml(item.name)}</strong>
      <span class="inventory-card__remaining">남은 <b>${item.remaining}</b> / ${item.total}</span>
      <span class="inventory-card__probability">현재 ${item.probability}%</span>
    </article>
  `).join('')
}

export function renderCapsules(purchase) {
  const area = document.querySelector('#capsule-area')
  const visible = purchase?.capsules.filter((capsule) => capsule.status !== 'ready_to_dispense') ?? []
  if (!visible.length) {
    area.innerHTML = '<p class="empty-capsules">손잡이를 돌리면 공이 이곳으로 굴러 나옵니다.</p>'
    return
  }
  area.innerHTML = visible.map((capsule, index) => {
    const meta = GRADE_META[capsule.grade]
    const revealed = capsule.status === 'revealed'
    const opening = capsule.status === 'opening'
    return `
      <button class="lotto-ball mystery-ball ${revealed ? `is-revealed grade-${meta.className}` : ''} ${opening ? `is-opening grade-${meta.className}` : ''}" type="button" data-capsule-id="${capsule.capsuleId}" ${(revealed || opening) ? 'disabled' : ''}>
        <span class="lotto-ball__sequence">RESULT ${String(index + 1).padStart(2, '0')}</span>
        <span class="mystery-ball__shell" aria-hidden="true"><i class="mystery-ball__half mystery-ball__half--top"></i><i class="mystery-ball__half mystery-ball__half--bottom"></i><b>?</b><span class="mystery-ball__note">${revealed ? meta.label : '…'}</span></span>
        <span class="lotto-ball__result">${revealed ? `${meta.label} · ${escapeHtml(capsule.prizeName)}` : opening ? '쪽지를 확인하는 중…' : '공을 눌러 결과 확인'}</span>
      </button>
    `
  }).join('')
}

export function showToast(message) {
  const toast = document.querySelector('#toast')
  toast.textContent = message
  toast.classList.add('is-visible')
  window.clearTimeout(showToast.timeout)
  showToast.timeout = window.setTimeout(() => toast.classList.remove('is-visible'), 2600)
}
