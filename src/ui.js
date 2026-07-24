import { GRADE_META, MACHINES } from './inventoryStore.js'

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function machineMarkup(machine) {
  return `
    <button class="machine" type="button" data-machine-id="${machine.id}" data-theme="${machine.theme}" aria-pressed="false">
      <span class="machine__top">${machine.number}</span>
      <span class="machine__poster" aria-hidden="true">
        <span class="machine__poster-star">✦</span>
        <strong>${machine.posterTitle.replace('\n', '<br />')}</strong>
        <small>${machine.posterSubtitle}</small>
      </span>
      <span class="machine__dome"><i></i><i></i><i></i><i></i><i></i><i></i></span>
      <span class="machine__gear" aria-hidden="true">✣</span>
      <span class="machine__exit" aria-hidden="true"></span>
      <span class="machine__name">${machine.name}</span>
    </button>
  `
}

export function createAppShell(app) {
  app.innerHTML = `
    <main class="app-shell">
      <header class="topbar">
        <a class="brand" href="#top" aria-label="Capsule Parade 홈"><span>CAPSULE</span> PARADE</a>
        <p>돌리는 순간, 오늘의 캡슐이 시작됩니다.</p>
        <button id="reset-demo" class="text-button" type="button">데모 재시작</button>
      </header>

      <section id="top" class="hero">
        <div>
          <p class="eyebrow">ONLINE KUJI · CAPSULE EDITION</p>
          <h1>어떤 기계든<br /><em>같은 행운.</em></h1>
          <p class="hero__copy">기계를 고르고, 손잡이를 끝까지 돌려주세요.<br />상품 구성과 당첨 확률은 모두 동일합니다.</p>
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

      <section class="play-section" aria-labelledby="play-heading">
        <div class="play-panel">
          <div class="section-heading"><div><p class="eyebrow">STEP 02</p><h2 id="play-heading">연차를 선택하세요</h2></div></div>
          <div id="draw-counts" class="draw-counts" role="group" aria-label="연차 선택">
            <button type="button" data-draw-count="1"><strong>1</strong><span>한 번</span></button>
            <button type="button" data-draw-count="5"><strong>5</strong><span>다섯 번</span></button>
            <button type="button" data-draw-count="10"><strong>10</strong><span>열 번</span></button>
          </div>
          <p id="availability-note" class="availability-note"></p>
          <button id="purchase-button" class="purchase-button" type="button">기계와 연차를 선택해주세요</button>
          <p class="payment-note">프로토타입에서는 결제가 즉시 성공한 것으로 처리됩니다.<br />결과는 결제가 아니라 손잡이 완료 시점에 확정됩니다.</p>
        </div>

        <div id="turn-panel" class="turn-panel" data-status="idle">
          <div class="turn-panel__header"><p class="eyebrow">STEP 03</p><span id="turn-state">대기 중</span></div>
          <h2>손잡이를 시계 방향으로<br /><em>한 바퀴 돌려주세요.</em></h2>
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
      </section>

      <section class="capsule-section" aria-labelledby="capsule-heading">
        <div class="section-heading"><div><p class="eyebrow">STEP 04</p><h2 id="capsule-heading">나온 캡슐을 열어보세요</h2></div><button id="open-all" class="open-all" type="button" disabled>모두 열기</button></div>
        <div id="capsule-area" class="capsule-area" aria-live="polite"><p class="empty-capsules">손잡이를 돌리면 캡슐이 이곳으로 나옵니다.</p></div>
      </section>

      <section class="inventory-section" aria-labelledby="inventory-heading">
        <div class="section-heading"><div><p class="eyebrow">LIVE INVENTORY</p><h2 id="inventory-heading">남은 경품</h2></div><span class="inventory-disclaimer">확률·수량은 실제 남은 재고 기준</span></div>
        <div id="inventory-list" class="inventory-list"></div>
      </section>
    </main>
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
    area.innerHTML = '<p class="empty-capsules">손잡이를 돌리면 캡슐이 이곳으로 나옵니다.</p>'
    return
  }
  area.innerHTML = visible.map((capsule, index) => {
    const meta = GRADE_META[capsule.grade]
    const revealed = capsule.status === 'revealed'
    const opening = capsule.status === 'opening'
    return `
      <button class="capsule ${revealed ? `is-revealed grade-${meta.className}` : ''} ${opening ? `is-opening grade-${meta.className}` : ''}" type="button" data-capsule-id="${capsule.capsuleId}" ${(revealed || opening) ? 'disabled' : ''}>
        <span class="capsule__number">${String(index + 1).padStart(2, '0')}</span>
        <span class="capsule__orb"><i></i><b>${revealed ? meta.label : '?'}</b></span>
        <span class="capsule__result">${revealed ? escapeHtml(capsule.prizeName) : opening ? 'OPENING…' : 'TAP TO OPEN'}</span>
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
