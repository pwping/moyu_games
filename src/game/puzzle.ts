/**
 * Digital Huarong Road (sliding-number-puzzle) engine — pure, framework-free.
 *
 * The board is a flat array of length size*size. Index `i` holds the tile
 * value at row floor(i/size), column i%size; `0` is the blank. A tile that is
 * orthogonal-adjacent to the blank can be slid into it (a swap). The goal is
 * [1,2,...,size*size-1,0].
 */

/** Flat board: index -> tile value (0 = blank). Length = size*size. */
export type Board = number[]

/** Valid difficulty sizes: 3x3 .. 10x10. */
export const SIZES = [3, 4, 5, 6, 7, 8, 9, 10] as const
export type PuzzleSize = (typeof SIZES)[number]

/** The solved board for a given size. */
export function goalBoard(size: number): Board {
  const n = size * size
  const board = new Array<number>(n)
  for (let i = 0; i < n - 1; i++) board[i] = i + 1
  board[n - 1] = 0
  return board
}

/** Index of the blank (the `0` cell). */
export function blankIndexOf(board: Board): number {
  return board.indexOf(0)
}

/** Indices orthogonally adjacent to `index` within a size x size grid. */
export function adjacentIndices(index: number, size: number): number[] {
  const row = Math.floor(index / size)
  const col = index % size
  const result: number[] = []
  if (row > 0) result.push(index - size)
  if (row < size - 1) result.push(index + size)
  if (col > 0) result.push(index - 1)
  if (col < size - 1) result.push(index + 1)
  return result
}

/** Whether the tile at `index` can slide into the blank (it is adjacent). */
export function canMove(board: Board, index: number, size: number): boolean {
  if (index < 0 || index >= board.length) return false
  if (board[index] === 0) return false
  return adjacentIndices(blankIndexOf(board), size).includes(index)
}

/** Slide the tile at `index` into the blank; returns a new board (no-op if illegal). */
export function applyMove(board: Board, index: number, size: number): Board {
  if (!canMove(board, index, size)) return board
  const next = board.slice()
  const blank = blankIndexOf(next)
  next[blank] = next[index]
  next[index] = 0
  return next
}

/**
 * Whether the tile at `index` shares a row or a column with the blank.
 * When true, clicking this tile slides the whole segment toward the blank.
 */
export function canSlide(board: Board, index: number, size: number): boolean {
  if (index < 0 || index >= board.length) return false
  if (board[index] === 0) return false
  const blank = blankIndexOf(board)
  const blankRow = Math.floor(blank / size)
  const blankCol = blank % size
  const indexRow = Math.floor(index / size)
  const indexCol = index % size
  return blankRow === indexRow || blankCol === indexCol
}

/**
 * Slide the whole row/column segment between `index` and the blank so the
 * blank ends up at `index`. Returns a new board (no-op if not on the same
 * row/column).
 */
export function applySlide(board: Board, index: number, size: number): Board {
  if (!canSlide(board, index, size)) return board
  const next = board.slice()
  const blank = blankIndexOf(board)
  if (Math.floor(blank / size) === Math.floor(index / size)) {
    // Same row
    if (index < blank) {
      for (let i = blank; i > index; i--) next[i] = board[i - 1]
    } else {
      for (let i = blank; i < index; i++) next[i] = board[i + 1]
    }
  } else {
    // Same column
    if (index < blank) {
      for (let i = blank; i > index; i -= size) next[i] = board[i - size]
    } else {
      for (let i = blank; i < index; i += size) next[i] = board[i + size]
    }
  }
  next[index] = 0
  return next
}

/** Whether the board is the solved goal state. */
export function isSolved(board: Board): boolean {
  const n = board.length
  for (let i = 0; i < n - 1; i++) {
    if (board[i] !== i + 1) return false
  }
  return board[n - 1] === 0
}

/** Count of inversions (pairs of tiles out of ascending order, blank ignored). */
export function inversionsOf(board: Board): number {
  const tiles = board.filter((v) => v !== 0)
  let count = 0
  for (let i = 0; i < tiles.length; i++) {
    for (let j = i + 1; j < tiles.length; j++) {
      if (tiles[i] > tiles[j]) count++
    }
  }
  return count
}

/**
 * Standard 15-puzzle solvability:
 *  - odd width: solvable iff the inversion count is even.
 *  - even width: solvable iff (inversions + blank row from the bottom) is odd.
 */
export function isSolvable(board: Board, size: number): boolean {
  const inv = inversionsOf(board)
  if (size % 2 === 1) return inv % 2 === 0
  const rowFromBottom = size - Math.floor(blankIndexOf(board) / size)
  return (inv + rowFromBottom) % 2 === 1
}

/**
 * Return a board identical to `board` except the blank has been walked to the
 * bottom-right corner (last index) via legal slides. The blank moves right to
 * the last column, then down to the last row. Solvability is preserved — this
 * is a sequence of adjacent slides, so no tile multiset or parity changes.
 */
export function moveBlankToBottomRight(board: Board, size: number): Board {
  const next = board.slice()
  let blank = board.indexOf(0)
  const last = size * size - 1
  const lastCol = size - 1
  const lastRow = size - 1
  while (blank !== last) {
    const row = Math.floor(blank / size)
    const col = blank % size
    const target = col < lastCol ? blank + 1 : row < lastRow ? blank + size : blank
    if (target === blank) break
    next[blank] = next[target]
    next[target] = 0
    blank = target
  }
  return next
}

/**
 * Uniform pseudo-random source: returns a number in [0, 1).
 */
export type Rng = () => number

/**
 * Shuffle the goal by a long random walk of legal slides (never undoing the
 * last move), which is guaranteed to produce a solvable board. Re-runs a few
 * times if it accidentally lands back on the goal.
 * @param size - grid dimension (3..10).
 * @param rng - injectable randomness for deterministic tests.
 */
export function shuffledBoard(size: number, rng: Rng = Math.random, maxAttempts = 20): Board {
  const target = Math.max(40, size * size * 90)
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let board = goalBoard(size)
    let blank = blankIndexOf(board)
    let prev = -1
    for (let k = 0; k < target; k++) {
      const neighbors = adjacentIndices(blank, size).filter((idx) => idx !== prev)
      if (neighbors.length === 0) continue
      const pick = neighbors[Math.floor(rng() * neighbors.length)]
      prev = blank
      board = applyMove(board, pick, size)
      blank = pick
    }
    if (!isSolved(board) && isSolvable(board, size)) return board
  }
  return applyMove(goalBoard(size), goalBoard(size).length - 2, size)
}

/** Format a second count as `m:ss` (or `s` under a minute). */
export function formatElapsed(totalSeconds: number): string {
  const secs = Math.max(0, Math.floor(totalSeconds))
  if (secs < 60) return `${secs} 秒`
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
