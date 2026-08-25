export interface MemoryCell {
  actual: number | null
  revealed: boolean
}

export interface MemoryBoard {
  cells: MemoryCell[]
  targetCount: number
  currentStep: number
  started: boolean
  errorCount: number
  maxErrors: number
}

export function createBoard(targetCount = 3, errorCount = 0): MemoryBoard {
  const cells: MemoryCell[] = Array.from({ length: 36 }, () => ({ actual: null, revealed: false }))

  const indices = Array.from({ length: 36 }, (_, i) => i)
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]]
  }

  for (let i = 0; i < targetCount; i++) {
    const idx = indices[i]
    cells[idx] = { actual: i + 1, revealed: true }
  }

  return {
    cells,
    targetCount,
    currentStep: 1,
    started: false,
    errorCount,
    maxErrors: 3,
  }
}

export function clickCell(board: MemoryBoard, index: number): MemoryBoard {
  const cell = board.cells[index]

  if (!board.started) {
    // 还没开始，必须点击数字1的位置才算开始；点到其他任何地方都算错
    if (cell.actual !== 1) {
      const newErrorCount = board.errorCount + 1
      if (newErrorCount >= board.maxErrors) {
        return createBoard(3, 0)
      }
      return { ...board, errorCount: newErrorCount }
    }
    // 点击了1，开始游戏：1保持显示，其他数字隐藏（但背景色保留）
    const newCells = board.cells.map((c) => {
      if (c.actual === 1) return { ...c, revealed: true }
      if (c.actual !== null) return { ...c, revealed: false }
      return c
    })
    return {
      ...board,
      cells: newCells,
      started: true,
      currentStep: 2,
    }
  }

  // 已经开始，必须点到当前目标数字的正确位置
  if (cell.actual !== board.currentStep) {
    const newErrorCount = board.errorCount + 1
    if (newErrorCount >= board.maxErrors) {
      return createBoard(3, 0)
    }
    return { ...board, errorCount: newErrorCount }
  }

  // 点对了，显示该数字
  const newCells = [...board.cells]
  newCells[index] = { ...newCells[index], revealed: true }
  const newStep = board.currentStep + 1

  // 当前阶段完成，进入下一阶段
  if (newStep > board.targetCount) {
    return createBoard(board.targetCount + 1, board.errorCount)
  }

  return {
    ...board,
    cells: newCells,
    currentStep: newStep,
  }
}
