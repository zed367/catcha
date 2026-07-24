function pointAngle(event, element) {
  const rect = element.getBoundingClientRect()
  return Math.atan2(event.clientY - rect.top - rect.height / 2, event.clientX - rect.left - rect.width / 2)
}

function normalizeDelta(delta) {
  if (delta > Math.PI) return delta - Math.PI * 2
  if (delta < -Math.PI) return delta + Math.PI * 2
  return delta
}

export function attachHandleController(element, { onProgress, onCommit }) {
  let pointerId = null
  let lastAngle = 0
  let turns = 0
  let committed = false

  function emit() {
    const progress = Math.min(1, turns / (Math.PI * 2 * 0.8))
    onProgress(progress)
    if (progress >= 1 && !committed) {
      committed = true
      onCommit()
    }
  }

  function onPointerDown(event) {
    if (committed) return
    pointerId = event.pointerId
    lastAngle = pointAngle(event, element)
    element.setPointerCapture(pointerId)
    element.classList.add('is-dragging')
  }

  function onPointerMove(event) {
    if (event.pointerId !== pointerId || committed) return
    const nextAngle = pointAngle(event, element)
    const delta = normalizeDelta(nextAngle - lastAngle)
    // Screen coordinates make clockwise movement positive around this wheel.
    turns += Math.max(0, delta)
    lastAngle = nextAngle
    emit()
  }

  function release(event) {
    if (event.pointerId !== pointerId) return
    pointerId = null
    element.classList.remove('is-dragging')
    if (!committed) {
      turns = 0
      onProgress(0)
    }
  }

  element.addEventListener('pointerdown', onPointerDown)
  element.addEventListener('pointermove', onPointerMove)
  element.addEventListener('pointerup', release)
  element.addEventListener('pointercancel', release)

  return {
    reset() {
      pointerId = null
      turns = 0
      committed = false
      element.classList.remove('is-dragging')
      onProgress(0)
    },
    destroy() {
      element.removeEventListener('pointerdown', onPointerDown)
      element.removeEventListener('pointermove', onPointerMove)
      element.removeEventListener('pointerup', release)
      element.removeEventListener('pointercancel', release)
    },
  }
}
