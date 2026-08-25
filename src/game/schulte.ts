/**
 * 舒尔特方格 (Schulte Grid) 核心逻辑
 *
 * 规则：在 n×n 格子中随机填入 1~n² 的数字，玩家按 1,2,3... 顺序依次点击。
 * 点错无反应，点完全部数字后完成。
 */

/** 棋盘状态 */
export interface SchulteBoard {
  size: number
  values: number[]
  currentTarget: number
  completed: boolean
}

/** 创建一个 size×size 的随机舒尔特方格。 */
export function createBoard(size: number): SchulteBoard {
  const values = Array.from({ length: size * size }, (_, i) => i + 1)
  // Fisher–Yates shuffle
  for (let i = values.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[values[i], values[j]] = [values[j], values[i]]
  }
  return { size, values, currentTarget: 1, completed: false }
}

/** 点击 index 位置的格子；点对了返回新状态，点错返回 null。 */
export function clickBoard(board: SchulteBoard, index: number): SchulteBoard | null {
  if (board.completed) return null
  if (board.values[index] !== board.currentTarget) return null
  const nextTarget = board.currentTarget + 1
  return {
    ...board,
    currentTarget: nextTarget,
    completed: nextTarget > board.values.length,
  }
}

/** 判断某个 index 的数字是否已经被点过。 */
export function isDone(board: SchulteBoard, index: number): boolean {
  return board.values[index] < board.currentTarget
}

/** 判断某个 index 的数字是否是当前目标。 */
export function isTarget(board: SchulteBoard, index: number): boolean {
  return board.values[index] === board.currentTarget
}

export { formatElapsed } from './puzzle.ts'
