/**
 * 数独 (Sudoku) 核心逻辑 — 简单难度（唯一余数法可解）
 */

export interface SudokuCell {
  value: number | null
  fixed: boolean
  candidates: number[]
}

export interface SudokuBoard {
  cells: SudokuCell[]
  solution: number[]
  correctCount: number
  errorCount: number
  completed: boolean
  selectedIndex: number | null
  noteMode: boolean
  history: HistoryEntry[]
  correctOnce: Set<number>
  wrongOnce: Set<number>
}

interface HistoryEntry {
  index: number
  prevValue: number | null
  prevCandidates: number[]
}

/* ------------------------ 数独生成 ------------------------ */

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function getRow(board: number[], index: number): number[] {
  const r = Math.floor(index / 9)
  const res: number[] = []
  for (let c = 0; c < 9; c++) {
    const v = board[r * 9 + c]
    if (v !== 0) res.push(v)
  }
  return res
}

function getCol(board: number[], index: number): number[] {
  const c = index % 9
  const res: number[] = []
  for (let r = 0; r < 9; r++) {
    const v = board[r * 9 + c]
    if (v !== 0) res.push(v)
  }
  return res
}

function getBox(board: number[], index: number): number[] {
  const br = Math.floor(Math.floor(index / 9) / 3) * 3
  const bc = Math.floor((index % 9) / 3) * 3
  const res: number[] = []
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const v = board[(br + r) * 9 + (bc + c)]
      if (v !== 0) res.push(v)
    }
  }
  return res
}

function isValidPlacement(board: number[], index: number, num: number): boolean {
  return !getRow(board, index).includes(num)
    && !getCol(board, index).includes(num)
    && !getBox(board, index).includes(num)
}

function getCandidates(board: number[], index: number): number[] {
  if (board[index] !== 0) return []
  const used = new Set([...getRow(board, index), ...getCol(board, index), ...getBox(board, index)])
  return [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(n => !used.has(n))
}

/** 回溯法生成完整数独解。 */
function generateSolution(): number[] {
  const board = Array(81).fill(0)
  fillBoard(board)
  return board
}

function fillBoard(board: number[]): boolean {
  for (let i = 0; i < 81; i++) {
    if (board[i] !== 0) continue
    for (const n of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
      if (isValidPlacement(board, i, n)) {
        board[i] = n
        if (fillBoard(board)) return true
        board[i] = 0
      }
    }
    return false
  }
  return true
}

/** 唯一余数法求解：只看每个空格候选数是否为 1。 */
function solveByNakedSingle(board: number[]): boolean {
  const b = [...board]
  let changed = true
  while (changed) {
    changed = false
    for (let i = 0; i < 81; i++) {
      if (b[i] !== 0) continue
      const cands = getCandidates(b, i)
      if (cands.length === 1) {
        b[i] = cands[0]
        changed = true
      }
    }
  }
  return b.every(v => v !== 0)
}

/** 生成简单数独谜题（唯一余数法可解）。 */
function generatePuzzle(solution: number[], targetHoles: number): number[] {
  const puzzle = [...solution]
  const indices = shuffle(Array.from({ length: 81 }, (_, i) => i))
  let holes = 0
  for (const idx of indices) {
    if (holes >= targetHoles) break
    const temp = puzzle[idx]
    puzzle[idx] = 0
    if (solveByNakedSingle([...puzzle])) {
      holes++
    } else {
      puzzle[idx] = temp
    }
  }
  return puzzle
}

/* ------------------------ 公开 API ------------------------ */

export function createBoard(): SudokuBoard {
  const solution = generateSolution()
  const puzzle = generatePuzzle(solution, 38)

  const cells: SudokuCell[] = puzzle.map((v) => ({
    value: v === 0 ? null : v,
    fixed: v !== 0,
    candidates: [],
  }))

  return {
    cells,
    solution,
    correctCount: 0,
    errorCount: 0,
    completed: false,
    selectedIndex: null,
    noteMode: false,
    history: [],
    correctOnce: new Set(),
    wrongOnce: new Set(),
  }
}

export function selectCell(board: SudokuBoard, index: number): SudokuBoard {
  return { ...board, selectedIndex: index }
}

export function inputNumber(board: SudokuBoard, num: number): SudokuBoard {
  if (board.selectedIndex === null) return board
  const cell = board.cells[board.selectedIndex]
  if (cell.fixed || board.completed) return board

  // 笔记模式
  if (board.noteMode) {
    const newCells = [...board.cells]
    const newCell = { ...newCells[board.selectedIndex] }
    const idx = newCell.candidates.indexOf(num)
    if (idx >= 0) {
      newCell.candidates = newCell.candidates.filter((_, i) => i !== idx)
    } else {
      newCell.candidates = [...newCell.candidates, num].sort((a, b) => a - b)
    }
    newCells[board.selectedIndex] = newCell
    return { ...board, cells: newCells }
  }

  // 正常填入
  if (cell.value === num) return board

  const entry: HistoryEntry = {
    index: board.selectedIndex,
    prevValue: cell.value,
    prevCandidates: [...cell.candidates],
  }

  const newCells = [...board.cells]
  const newCell = { ...newCells[board.selectedIndex] }
  newCell.value = num
  newCell.candidates = []
  newCells[board.selectedIndex] = newCell

  const correct = num === board.solution[board.selectedIndex]
  const newCorrectOnce = new Set(board.correctOnce)
  const newWrongOnce = new Set(board.wrongOnce)
  let newCorrectCount = board.correctCount
  let newErrorCount = board.errorCount

  if (correct && !newCorrectOnce.has(board.selectedIndex) && !newWrongOnce.has(board.selectedIndex)) {
    newCorrectOnce.add(board.selectedIndex)
    newCorrectCount++
  }
  if (!correct && !newWrongOnce.has(board.selectedIndex)) {
    newWrongOnce.add(board.selectedIndex)
    newErrorCount++
  }

  const allFilled = newCells.every(c => c.value !== null)
  const hasCurrentError = newCells.some((c, i) => !c.fixed && c.value !== null && c.value !== board.solution[i])
  const completed = allFilled && !hasCurrentError

  return {
    ...board,
    cells: newCells,
    correctCount: newCorrectCount,
    errorCount: newErrorCount,
    correctOnce: newCorrectOnce,
    wrongOnce: newWrongOnce,
    completed,
    history: [...board.history, entry],
  }
}

export function eraseCell(board: SudokuBoard): SudokuBoard {
  if (board.selectedIndex === null) return board
  const cell = board.cells[board.selectedIndex]
  if (cell.fixed || board.completed) return board

  const entry: HistoryEntry = {
    index: board.selectedIndex,
    prevValue: cell.value,
    prevCandidates: [...cell.candidates],
  }

  const newCells = [...board.cells]
  const newCell = { ...newCells[board.selectedIndex] }
  newCell.value = null
  newCell.candidates = []
  newCells[board.selectedIndex] = newCell

  return {
    ...board,
    cells: newCells,
    completed: false,
    history: [...board.history, entry],
  }
}

export function undo(board: SudokuBoard): SudokuBoard {
  if (board.history.length === 0) return board
  const last = board.history[board.history.length - 1]
  const newCells = [...board.cells]
  const cur = newCells[last.index]

  newCells[last.index] = {
    ...cur,
    value: last.prevValue,
    candidates: [...last.prevCandidates],
  }

  return {
    ...board,
    cells: newCells,
    completed: false,
    history: board.history.slice(0, -1),
  }
}

export function getHint(board: SudokuBoard): SudokuBoard {
  if (board.selectedIndex === null || board.completed) return board
  const cell = board.cells[board.selectedIndex]
  if (cell.fixed) return board

  const correctValue = board.solution[board.selectedIndex]

  const entry: HistoryEntry = {
    index: board.selectedIndex,
    prevValue: cell.value,
    prevCandidates: [...cell.candidates],
  }

  const newCells = [...board.cells]
  const newCell = { ...newCells[board.selectedIndex] }
  newCell.value = correctValue
  newCell.candidates = []
  newCells[board.selectedIndex] = newCell

  const newCorrectOnce = new Set(board.correctOnce)
  const newWrongOnce = new Set(board.wrongOnce)
  let newCorrectCount = board.correctCount
  if (!newCorrectOnce.has(board.selectedIndex) && !newWrongOnce.has(board.selectedIndex)) {
    newCorrectOnce.add(board.selectedIndex)
    newCorrectCount++
  }

  const allFilled = newCells.every(c => c.value !== null)
  const hasCurrentError = newCells.some((c, i) => !c.fixed && c.value !== null && c.value !== board.solution[i])

  return {
    ...board,
    cells: newCells,
    correctCount: newCorrectCount,
    correctOnce: newCorrectOnce,
    history: [...board.history, entry],
    completed: allFilled && !hasCurrentError,
  }
}

export function toggleNoteMode(board: SudokuBoard): SudokuBoard {
  return { ...board, noteMode: !board.noteMode }
}

export function isRelated(indexA: number, indexB: number): boolean {
  if (indexA === indexB) return true
  const ra = Math.floor(indexA / 9), ca = indexA % 9
  const rb = Math.floor(indexB / 9), cb = indexB % 9
  const ba = Math.floor(ra / 3) * 3 + Math.floor(ca / 3)
  const bb = Math.floor(rb / 3) * 3 + Math.floor(cb / 3)
  return ra === rb || ca === cb || ba === bb
}

export function getBoxStart(index: number): number {
  const r = Math.floor(index / 9)
  const c = index % 9
  const br = Math.floor(r / 3) * 3
  const bc = Math.floor(c / 3) * 3
  return br * 9 + bc
}

export { formatElapsed } from './puzzle.ts'
