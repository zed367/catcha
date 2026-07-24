export const MACHINES = Object.freeze([
  {
    id: 'machine_mint',
    number: '01',
    name: 'MINT FRIENDS',
    posterTitle: 'MINT\nFRIENDS',
    posterSubtitle: 'CAPSULE COLLECTION',
    theme: 'mint',
    posterImageUrl: null,
  },
  {
    id: 'machine_grape',
    number: '02',
    name: 'STAR RUSH',
    posterTitle: 'STAR\nRUSH',
    posterSubtitle: 'MYSTERY FIGURES',
    theme: 'grape',
    posterImageUrl: null,
  },
  {
    id: 'machine_sunset',
    number: '03',
    name: 'DREAM WAVE',
    posterTitle: 'DREAM\nWAVE',
    posterSubtitle: 'CAPSULE PARADE',
    theme: 'sunset',
    posterImageUrl: null,
  },
  {
    id: 'machine_ocean',
    number: '04',
    name: 'OCEAN CREW',
    posterTitle: 'OCEAN\nCREW',
    posterSubtitle: 'SEA SIDE MINI',
    theme: 'ocean',
    posterImageUrl: null,
  },
  {
    id: 'machine_cherry',
    number: '05',
    name: 'CHERRY CLUB',
    posterTitle: 'CHERRY\nCLUB',
    posterSubtitle: 'SWEET DAY OUT',
    theme: 'cherry',
    posterImageUrl: null,
  },
  {
    id: 'machine_lemon',
    number: '06',
    name: 'LEMON POP',
    posterTitle: 'LEMON\nPOP',
    posterSubtitle: 'YELLOW EDITION',
    theme: 'lemon',
    posterImageUrl: null,
  },
])

export const GRADE_META = Object.freeze({
  1: { label: '1등', name: '황금 피규어 스페셜', glow: '#ffd54a', className: 'gold' },
  2: { label: '2등', name: '아크릴 디오라마', glow: '#b781ff', className: 'violet' },
  3: { label: '3등', name: '홀로그램 키체인', glow: '#63b6ff', className: 'blue' },
  4: { label: '4등', name: '컬렉션 스티커', glow: '#5eeaa5', className: 'green' },
})

function freshState() {
  return {
    version: 1,
    inventory: [
      { grade: 1, total: 2, remaining: 2 },
      { grade: 2, total: 4, remaining: 4 },
      { grade: 3, total: 8, remaining: 8 },
      { grade: 4, total: 16, remaining: 16 },
    ],
    purchases: [],
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

export function createInventoryStore() {
  // This is intentionally an in-memory demo store. Every page refresh starts
  // a newly stocked round, so testing can continue even after stock is sold out.
  let state = freshState()

  return {
    read() {
      return clone(state)
    },
    write(nextState) {
      state = clone(nextState)
      return this.read()
    },
    reset() {
      state = freshState()
      return this.read()
    },
  }
}
