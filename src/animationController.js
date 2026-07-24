export function wait(milliseconds) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds))
}

export async function animateAccessibleTurn(onProgress) {
  for (let step = 1; step <= 12; step += 1) {
    onProgress(step / 12)
    await wait(42)
  }
}
