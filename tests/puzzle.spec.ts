import { describe, expect, it } from 'vitest'
import {
  SIZES,
  applyMove,
  applySlide,
  blankIndexOf,
  canMove,
  canSlide,
  formatElapsed,
  goalBoard,
  isSolved,
  isSolvable,
  moveBlankToBottomRight,
  shuffledBoard,
} from '../src/game/puzzle.ts'

/** Deterministic seeded rng (mulberry32) so shuffle tests are reproducible. */
function seededRng(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6D2B79F5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

describe('goalBoard / solved', () => {
  it('builds the ascending goal board', () => {
    expect(goalBoard(3)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 0])
    expect(goalBoard(4)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0])
  })

  it('recognises a solved board', () => {
    expect(isSolved(goalBoard(4))).toBe(true)
    expect(isSolved(applyMove(goalBoard(3), 7, 3))).toBe(false)
  })
})

describe('move rules', () => {
  it('finds the blank index', () => {
    expect(blankIndexOf(goalBoard(3))).toBe(8)
  })

  it('moves only a tile adjacent to the blank', () => {
    const moved = applyMove(goalBoard(3), 7, 3)
    expect(moved[7]).toBe(0)
    expect(moved[8]).toBe(8)
    expect(applyMove(goalBoard(3), 0, 3)).toEqual(goalBoard(3))
  })

  it('canMove returns false for the blank and far tiles', () => {
    expect(canMove(goalBoard(3), 8, 3)).toBe(false)
    expect(canMove(goalBoard(3), 0, 3)).toBe(false)
    expect(canMove(goalBoard(3), 7, 3)).toBe(true)
    expect(canMove(goalBoard(3), 5, 3)).toBe(true)
  })
})

describe('solvability', () => {
  it('accepts the goal board for every size', () => {
    for (const size of SIZES) {
      expect(isSolvable(goalBoard(size), size)).toBe(true)
    }
  })

  it('classifies a single adjacent slide as solvable', () => {
    expect(isSolvable(applyMove(goalBoard(3), 7, 3), 3)).toBe(true)
  })
})

describe('shuffle', () => {
  it('produces a solvable, not-yet-solved board for every size', () => {
    const rng = seededRng(42)
    for (const size of SIZES) {
      const board = shuffledBoard(size, rng)
      expect(board).toHaveLength(size * size)
      expect(isSolvable(board, size)).toBe(true)
      expect(isSolved(board)).toBe(false)
    }
  })

  it('keeps the same tile multiset (one 0, 1..n-1)', () => {
    const board = shuffledBoard(4, seededRng(7))
    const tiles = board.slice().sort((a, b) => a - b)
    expect(tiles).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15])
  })
})

describe('slide rules', () => {
  it('slides a whole row segment to the right when blank is on the right', () => {
    // Row 0 of a 5x5: [1, 13, 0, 2, 16]
    const board = [1, 13, 0, 2, 16, 6, 7, 8, 9, 10, 11, 12, 3, 14, 15, 4, 17, 18, 19, 20, 21, 22, 23, 24, 25]
    expect(canSlide(board, 0, 5)).toBe(true)
    expect(applySlide(board, 0, 5)).toEqual(
      [0, 1, 13, 2, 16, 6, 7, 8, 9, 10, 11, 12, 3, 14, 15, 4, 17, 18, 19, 20, 21, 22, 23, 24, 25],
    )
  })

  it('slides a whole row segment to the left when blank is on the left', () => {
    // Row 0 of a 5x5: [1, 13, 0, 2, 16]
    const board = [1, 13, 0, 2, 16, 6, 7, 8, 9, 10, 11, 12, 3, 14, 15, 4, 17, 18, 19, 20, 21, 22, 23, 24, 25]
    expect(canSlide(board, 4, 5)).toBe(true)
    expect(applySlide(board, 4, 5)).toEqual(
      [1, 13, 2, 16, 0, 6, 7, 8, 9, 10, 11, 12, 3, 14, 15, 4, 17, 18, 19, 20, 21, 22, 23, 24, 25],
    )
  })

  it('slides a whole column segment down when blank is below', () => {
    // Column 0 of a 5x5: [1, 6, 0, 11, 16]
    const board = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 0, 12, 13, 14, 15, 11, 17, 18, 19, 20, 16, 22, 23, 24, 25]
    expect(canSlide(board, 0, 5)).toBe(true)
    expect(applySlide(board, 0, 5)).toEqual(
      [0, 2, 3, 4, 5, 1, 7, 8, 9, 10, 6, 12, 13, 14, 15, 11, 17, 18, 19, 20, 16, 22, 23, 24, 25],
    )
  })

  it('slides a whole column segment up when blank is above', () => {
    // Column 0 of a 5x5: [1, 6, 0, 11, 16]
    const board = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 0, 12, 13, 14, 15, 11, 17, 18, 19, 20, 16, 22, 23, 24, 25]
    expect(canSlide(board, 20, 5)).toBe(true)
    expect(applySlide(board, 20, 5)).toEqual(
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 0, 22, 23, 24, 25],
    )
  })

  it('matches old adjacent move for neighbours', () => {
    const board = goalBoard(3)
    expect(canSlide(board, 7, 3)).toBe(true)
    expect(applySlide(board, 7, 3)).toEqual(applyMove(board, 7, 3))
  })

  it('returns false for the blank and far tiles', () => {
    const board = goalBoard(3)
    expect(canSlide(board, 8, 3)).toBe(false) // blank itself
    expect(canSlide(board, 0, 3)).toBe(false) // diagonal/far
    expect(canSlide(board, 7, 3)).toBe(true)  // adjacent
    expect(canSlide(board, 5, 3)).toBe(true)  // adjacent
  })

  it('is a no-op for non-aligned tiles', () => {
    const board = goalBoard(3)
    expect(applySlide(board, 0, 3)).toEqual(board)
  })
})

describe('moveBlankToBottomRight', () => {
  it('walks the blank to the last index for every size', () => {
    const rng = seededRng(11)
    for (const size of SIZES) {
      const board = moveBlankToBottomRight(shuffledBoard(size, rng), size)
      expect(blankIndexOf(board)).toBe(size * size - 1)
      expect(isSolvable(board, size)).toBe(true)
      expect(isSolved(board)).toBe(false)
      expect(board.slice().sort((a, b) => a - b)).toEqual(goalBoard(size).slice().sort((a, b) => a - b))
    }
  })

  it('is a no-op when the blank is already at the bottom-right', () => {
    const goal = goalBoard(4)
    expect(moveBlankToBottomRight(goal, 4)).toEqual(goal)
  })

  it('preserves solvability after moving (parity unchanged)', () => {
    const rng = seededRng(3)
    for (const size of SIZES) {
      const shuffled = shuffledBoard(size, rng)
      const moved = moveBlankToBottomRight(shuffled, size)
      expect(isSolvable(moved, size)).toBe(isSolvable(shuffled, size))
    }
  })
})

describe('formatElapsed', () => {
  it('formats under a minute as seconds', () => {
    expect(formatElapsed(0)).toBe('0 秒')
    expect(formatElapsed(9)).toBe('9 秒')
  })

  it('formats over a minute as m:ss', () => {
    expect(formatElapsed(75)).toBe('1:15')
    expect(formatElapsed(600)).toBe('10:00')
  })
})
