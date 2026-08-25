/**
 * The moyu-games React surfaces, registered into the OFFICIAL dsh slots:
 *  - `sidebar.footer.action` — the "Slacker game" row beside Settings;
 *  - `shell.overlay` — the floating game window (frame-wide additive layer);
 *  - `settings.section` — the plugin settings page (enabled / auto-popup /
 *    default size).
 *
 * The overlay stays mounted for the page lifetime (the list slot always
 * renders its entry), so the puzzle keeps its progress across open/close;
 * the `moyu-hidden` class only toggles visibility / pointer-events.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { InjectFace, PropsLocale, PropsRuntime, TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import type { SettingsScope } from '@deepseek-ai/dsh-client-runtime/client'
import type { GameController } from './controller.ts'
import { applySlide, canSlide, formatElapsed, isSolved, moveBlankToBottomRight, SIZES, shuffledBoard, type Board } from '../game/puzzle.ts'
import { clickBoard, createBoard as createSchulteBoard, isDone, isTarget, type SchulteBoard } from '../game/schulte.ts'
import { createBoard as createSudokuBoard, eraseCell, getHint, inputNumber, isRelated, selectCell, toggleNoteMode, undo, type SudokuBoard } from '../game/sudoku.ts'
import { clickCell as clickMemoryCell, createBoard as createMemoryBoard, type MemoryBoard } from '../game/memory.ts'
import { createGame as createSnakeGame, changeDirection as changeSnakeDir, tick as tickSnake, type SnakeState, type Direction as SnakeDir, type Point } from '../game/snake.ts'

/** The moyu-games settings section fields. */
export interface MoyuGamesSettings {
  enabled?: boolean
  autoPopup?: boolean
  defaultSize?: number
}

/* ------------------------------------------------------------------ hooks */

/** Subscribe to a controller's open state. */
function useOpen(controller: GameController): boolean {
  const [open, setOpen] = useState(() => controller.getSnapshot().open)
  useEffect(
    () => controller.subscribe(() => setOpen(controller.getSnapshot().open)),
    [controller],
  )
  return open
}

/** Subscribe to the whole settings scope snapshot (status/value/writable). */
function useScopeSnapshot<T>(scope: SettingsScope<T>) {
  const [snapshot, setSnapshot] = useState(() => scope.getSnapshot())
  useEffect(
    () => scope.subscribe(() => setSnapshot(scope.getSnapshot())),
    [scope],
  )
  return snapshot
}

function clampSize(value: number | undefined, fallback = 5): number {
  const size = Number.isFinite(value) ? Math.round(value ?? fallback) : fallback
  return Math.min(10, Math.max(3, size))
}

/** Clamp `v` into [min, max]. */
function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}

/* ---------------------------------------------- sidebar.footer.action row */

type FooterFace = { controller: GameController }
export type FooterEntryProps =
  PropsRuntime<'sidebar.footer.action'>
  & InjectFace<FooterFace>
  & PropsLocale<'moyu-games'>

const FOOTER_ICON = (
  <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2.5" y="2.5" width="4.6" height="4.6" rx="1.2" />
    <rect x="8.9" y="2.5" width="4.6" height="4.6" rx="1.2" />
    <rect x="2.5" y="8.9" width="4.6" height="4.6" rx="1.2" />
    <path d="M9.4 11.2h3.6M11.2 9.4v3.6" />
  </svg>
)

/** The sidebar foot action row: click to open the game window. */
export function FooterEntry(props: FooterEntryProps) {
  const { t, wide, controller } = props
  return (
    <button
      type="button"
      className="moyu-footer-btn"
      title={t('entry.tooltip')}
      aria-label={t('entry.label')}
      onClick={() => controller.show()}
      data-dsh-moyu-entry=""
    >
      <span className="moyu-footer-icon">{FOOTER_ICON}</span>
      {wide ? <span className="moyu-footer-label">{t('entry.label')}</span> : null}
    </button>
  )
}

/* --------------------------------------------------- shell.overlay window */

type OverlayFace = { controller: GameController; defaultSize: number; scope: SettingsScope<MoyuGamesSettings> }
export type GameOverlayProps =
  PropsRuntime<'shell.overlay'>
  & InjectFace<OverlayFace>
  & PropsLocale<'moyu-games'>

/**
 * The floating game window: docked to the bottom-right corner and draggable by
 * its header. The overlay wrapper is click-through so the task log underneath
 * stays visible and usable (only the panel itself takes input). Each open
 * re-anchors to the bottom-right corner; dragging moves it (clamped to the
 * viewport) and it stays where you leave it until you close it.
 */
export function GameOverlay(props: GameOverlayProps) {
  const { t, controller, defaultSize, scope } = props
  const open = useOpen(controller)
  const scopeSnap = useScopeSnapshot(scope)
  const auto = scopeSnap.value?.autoPopup ?? true
  const writable = scopeSnap.writable
  const toggleAuto = (): void => {
    if (!writable) return
    void scope.set('autoPopup', !auto)
  }
  const [activeGame, setActiveGame] = useState<'puzzle' | 'schulte' | 'sudoku' | 'memory' | 'snake'>('puzzle')

  const modalRef = useRef<HTMLDivElement | null>(null)
  /** Drag offset from the default bottom-right anchor (0,0 = docked corner). */
  const [drag, setDrag] = useState<{ dx: number; dy: number }>({ dx: 0, dy: 0 })
  const dragRef = useRef<{
    startX: number; startY: number; startDx: number; startDy: number; rect: DOMRect
  } | null>(null)

  useEffect(() => {
    if (!open) return
    // Re-anchor to the bottom-right corner each time the window opens.
    setDrag({ dx: 0, dy: 0 })
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') controller.hide()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, controller])

  const onHeaderPointerDown = (event: ReactPointerEvent<HTMLElement>): void => {
    if (event.button !== 0) return
    if ((event.target as HTMLElement).closest('button') !== null) return
    const rect = modalRef.current?.getBoundingClientRect()
    if (rect === undefined) return
    dragRef.current = { startX: event.clientX, startY: event.clientY, startDx: drag.dx, startDy: drag.dy, rect }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onHeaderPointerMove = (event: ReactPointerEvent<HTMLElement>): void => {
    const state = dragRef.current
    if (state === null) return
    const moveX = clamp(event.clientX - state.startX, 8 - state.rect.left, (window.innerWidth - 8) - state.rect.right)
    const moveY = clamp(event.clientY - state.startY, 8 - state.rect.top, (window.innerHeight - 8) - state.rect.bottom)
    setDrag({ dx: state.startDx + moveX, dy: state.startDy + moveY })
  }

  const endDrag = (): void => { dragRef.current = null }

  return (
    <div className={open ? 'moyu-overlay' : 'moyu-overlay moyu-hidden'} aria-hidden={!open} data-dsh-moyu-window={open ? 'open' : 'closed'}>
      <div
        ref={modalRef}
        className="moyu-modal"
        role="dialog"
        aria-label={t('game.title')}
        style={{ transform: `translate(${drag.dx}px, ${drag.dy}px) scale(0.8)` }}
      >
        <header
          className="moyu-header"
          onPointerDown={onHeaderPointerDown}
          onPointerMove={onHeaderPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <div className="moyu-title-wrap">
            <h2 className="moyu-title">{t('game.title')}</h2>
          </div>
          <div className="moyu-header-actions">
            <button
              type="button"
              className={auto ? 'moyu-mode-btn moyu-mode-on' : 'moyu-mode-btn'}
              role="switch"
              aria-checked={auto}
              disabled={!writable}
              title={auto ? '自动：每次任务开始自动弹窗' : '手动：点侧边栏「摸鱼游戏」按钮打开'}
              onClick={toggleAuto}
            >
              <span className="moyu-mode-switch" data-on={String(auto)} />
              <span className="moyu-mode-label">{auto ? '自动' : '手动'}</span>
            </button>
            <button type="button" className="moyu-close" aria-label={t('game.close')} onClick={() => controller.hide()}>
              <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
                <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </header>
        <div className="moyu-game-tabs" role="tablist">
          <button
            type="button"
            className={activeGame === 'puzzle' ? 'moyu-game-tab-active' : 'moyu-game-tab'}
            role="tab"
            aria-selected={activeGame === 'puzzle'}
            onClick={() => setActiveGame('puzzle')}
          >
            数字华容道
          </button>
          <button
            type="button"
            role="tab"
            className={activeGame === 'sudoku' ? 'moyu-game-tab-active' : 'moyu-game-tab'}
            onClick={() => setActiveGame('sudoku')}
            aria-selected={activeGame === 'sudoku'}
          >
            数独
          </button>
          <button
            type="button"
            role="tab"
            className={activeGame === 'snake' ? 'moyu-game-tab-active' : 'moyu-game-tab'}
            onClick={() => setActiveGame('snake')}
            aria-selected={activeGame === 'snake'}
          >
            贪吃蛇
          </button>
          <button
            type="button"
            role="tab"
            className={activeGame === 'schulte' ? 'moyu-game-tab-active' : 'moyu-game-tab'}
            onClick={() => setActiveGame('schulte')}
            aria-selected={activeGame === 'schulte'}
          >
            舒尔特方格
          </button>
          <button
            type="button"
            role="tab"
            className={activeGame === 'memory' ? 'moyu-game-tab-active' : 'moyu-game-tab'}
            onClick={() => setActiveGame('memory')}
            aria-selected={activeGame === 'memory'}
          >
            数字记忆
          </button>
        </div>
        {activeGame === 'puzzle'
          ? <SlidingPuzzle t={t} defaultSize={defaultSize} />
          : activeGame === 'sudoku'
            ? <SudokuBoard t={t} />
            : activeGame === 'snake'
              ? <SnakeGame t={t} />
              : activeGame === 'schulte'
                ? <SchulteGrid t={t} defaultSize={defaultSize} />
                : <MemoryGrid t={t} />
        }
      </div>
    </div>
  )
}

/* ------------------------------------------------------------ puzzle board */

/** The puzzle board's locale reader (the namespace-bound translate). */
type LocaleReader = TranslateNS<'moyu-games'>

/** Props for the puzzle board. */
export interface SlidingPuzzleProps {
  t: LocaleReader
  defaultSize?: number
}

/** The digital Huarong Road board. State stays in this always-mounted component. */
export function SlidingPuzzle({ t, defaultSize = 5 }: SlidingPuzzleProps) {
  const initialSize = clampSize(defaultSize)
  const [size, setSize] = useState<number>(initialSize)
  const [board, setBoard] = useState<Board>(() => moveBlankToBottomRight(shuffledBoard(initialSize), initialSize))
  const [moves, setMoves] = useState(0)
  const [startAt, setStartAt] = useState<number | null>(null)
  const [now, setNow] = useState(0)
  const [finishedAt, setFinishedAt] = useState<number | null>(null)

  const solved = isSolved(board)

  useEffect(() => {
    if (solved && startAt !== null && finishedAt === null) setFinishedAt(Date.now())
  }, [solved, startAt, finishedAt])

  useEffect(() => {
    if (startAt === null || solved) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [startAt, solved])

  const startNew = (nextSize: number): void => {
    const s = clampSize(nextSize)
    setSize(s)
    setBoard(moveBlankToBottomRight(shuffledBoard(s), s))
    setMoves(0)
    setStartAt(null)
    setNow(0)
    setFinishedAt(null)
  }

  const onTile = (index: number): void => {
    if (solved) return
    if (!canSlide(board, index, size)) return
    setBoard(applySlide(board, index, size))
    setMoves((m) => m + 1)
    if (startAt === null) setStartAt(Date.now())
  }

  const elapsedMs = finishedAt !== null
    ? finishedAt - (startAt ?? finishedAt)
    : startAt !== null ? now - startAt : 0

  return (
    <div className="moyu-board">
      <div className="moyu-toolbar">
        <div className="moyu-sizes" role="group" aria-label={t('game.size')}>
          {SIZES.map((s) => (
            <button
              key={s}
              type="button"
              className={s === size ? 'moyu-chip-active' : 'moyu-chip'}
              aria-pressed={s === size}
              onClick={() => { if (s !== size) startNew(s) }}
            >
              {s}×{s}
            </button>
          ))}
        </div>
      </div>

      <div className="moyu-stats">
        <div className="moyu-stats-center">
          <div className="moyu-stat">
            <span className="moyu-stat-label">{t('game.moves')}</span>
            <span className="moyu-stat-value">{moves}</span>
          </div>
          <div className="moyu-stat">
            <span className="moyu-stat-label">{t('game.time')}</span>
            <span className="moyu-stat-value">{formatElapsed(elapsedMs / 1000)}</span>
          </div>
        </div>
        <button type="button" className="moyu-refresh" title={t('game.newGame')} aria-label={t('game.newGame')} onClick={() => startNew(size)}>
          <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M13 8a5 5 0 1 1-1.5-3.5" />
            <path d="M12.3 1.6v3h-3" />
          </svg>
        </button>
      </div>

      <p className="moyu-hint">{`规则：把数字1-${size * size - 1}按顺序排列好即可`}</p>

      <div className="moyu-grid-wrap">
        <div className="moyu-grid" style={{ ['--moyu-cols' as string]: String(size) }} data-dsh-moyu-board={String(size)}>
          {board.map((value, index) => {
            if (value === 0) return <div key={index} className="moyu-empty" aria-hidden="true" />
            return (
              <button
                key={index}
                type="button"
                className="moyu-tile"
                onClick={() => onTile(index)}
                aria-label={String(value)}
              >
                {value}
              </button>
            )
          })}
        </div>
      </div>

      {solved
        ? (
          <p className="moyu-solved" role="status">
            {t('game.solved')} · {moves} {t('game.moves')} · {formatElapsed(elapsedMs / 1000)}
          </p>
        )
        : null}
    </div>
  )
}

/* ----------------------------------------------------------- schulte grid */

/** 舒尔特方格：按 1,2,3… 顺序依次点击。 */
export function SchulteGrid({ t, defaultSize = 5 }: SlidingPuzzleProps) {
  const initialSize = clampSize(defaultSize)
  const [size, setSize] = useState<number>(initialSize)
  const [board, setBoard] = useState<SchulteBoard>(() => createSchulteBoard(initialSize))
  const [startAt, setStartAt] = useState<number | null>(null)
  const [now, setNow] = useState(0)
  const [finishedAt, setFinishedAt] = useState<number | null>(null)
  const [hint, setHint] = useState<string | null>(null)
  const hintTimer = useRef<number | null>(null)

  useEffect(() => {
    if (board.completed && startAt !== null && finishedAt === null) {
      setFinishedAt(Date.now())
    }
  }, [board.completed, startAt, finishedAt])

  useEffect(() => {
    if (startAt === null || board.completed) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [startAt, board.completed])

  const clearHintTimer = (): void => {
    if (hintTimer.current !== null) {
      window.clearTimeout(hintTimer.current)
      hintTimer.current = null
    }
  }

  const startNew = (nextSize: number): void => {
    clearHintTimer()
    const s = clampSize(nextSize)
    setSize(s)
    setBoard(createSchulteBoard(s))
    setStartAt(null)
    setNow(0)
    setFinishedAt(null)
    setHint(null)
  }

  const onTile = (index: number): void => {
    if (board.completed) return
    const result = clickBoard(board, index)
    if (result === null) {
      clearHintTimer()
      setHint(`快速找到数字${board.currentTarget}`)
      hintTimer.current = window.setTimeout(() => {
        setHint(null)
        hintTimer.current = null
      }, 1000)
      return
    }
    setBoard(result)
    if (startAt === null) setStartAt(Date.now())
  }

  const elapsedMs = finishedAt !== null
    ? finishedAt - (startAt ?? finishedAt)
    : startAt !== null ? now - startAt : 0

  return (
    <div className="moyu-board">
      <div className="moyu-toolbar">
        <div className="moyu-sizes" role="group" aria-label={t('game.size')}>
          {SIZES.map((s) => (
            <button
              key={s}
              type="button"
              className={s === size ? 'moyu-chip-active' : 'moyu-chip'}
              aria-pressed={s === size}
              onClick={() => { if (s !== size) startNew(s) }}
            >
              {s}×{s}
            </button>
          ))}
        </div>
      </div>

      <div className="moyu-stats">
        <div className="moyu-stats-center">
          <div className={hint ? 'moyu-stat moyu-stat-bump' : 'moyu-stat'}>
            <span className="moyu-stat-label">下一个数</span>
            <span className={hint ? 'moyu-stat-value moyu-stat-hint' : 'moyu-stat-value'}>
              {board.completed ? '—' : board.currentTarget}
            </span>
          </div>
          <div className="moyu-stat">
            <span className="moyu-stat-label">{t('game.time')}</span>
            <span className="moyu-stat-value">{formatElapsed(elapsedMs / 1000)}</span>
          </div>
        </div>
        <button type="button" className="moyu-refresh" title={t('game.newGame')} aria-label={t('game.newGame')} onClick={() => startNew(size)}>
          <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M13 8a5 5 0 1 1-1.5-3.5" />
            <path d="M12.3 1.6v3h-3" />
          </svg>
        </button>
      </div>

      <p className="moyu-hint">规则：按 1-{size * size} 的顺序依次点击数字（速度越快说明专注力越强）</p>

      <div className="moyu-grid-wrap">
        <div className="moyu-grid" style={{ ['--moyu-cols' as string]: String(size) }} data-dsh-moyu-board={String(size)}>
          {board.values.map((value, index) => {
            const done = isDone(board, index)
            return (
              <button
                key={index}
                type="button"
                className={done ? 'moyu-tile-schulte-done' : 'moyu-tile-schulte'}
                onClick={() => onTile(index)}
                disabled={done}
                aria-label={String(value)}
              >
                {value}
              </button>
            )
          })}
        </div>
      </div>

      {board.completed
        ? (
          <p className="moyu-solved" role="status">
            {t('game.solved')} · {formatElapsed(elapsedMs / 1000)}
          </p>
        )
        : null}
    </div>
  )
}

/* ------------------------------------------------------------- sudoku board */

/** 9×9 数独棋盘。 */
export function SudokuBoard({ t }: { t: LocaleReader }) {
  const [board, setBoard] = useState<SudokuBoard>(() => createSudokuBoard())
  const [startAt, setStartAt] = useState<number | null>(null)
  const [now, setNow] = useState(0)
  const [finishedAt, setFinishedAt] = useState<number | null>(null)

  useEffect(() => {
    if (board.completed && startAt !== null && finishedAt === null) {
      setFinishedAt(Date.now())
    }
  }, [board.completed, startAt, finishedAt])

  useEffect(() => {
    if (startAt === null || board.completed) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [startAt, board.completed])

  const startNew = (): void => {
    setBoard(createSudokuBoard())
    setStartAt(null)
    setNow(0)
    setFinishedAt(null)
  }

  const onCell = (index: number): void => {
    setBoard((b) => selectCell(b, index))
  }

  const onNum = (num: number): void => {
    setBoard((b) => {
      const nb = inputNumber(b, num)
      if (nb !== b && startAt === null) setStartAt(Date.now())
      return nb
    })
  }

  const onErase = (): void => {
    setBoard((b) => eraseCell(b))
  }

  const onUndo = (): void => {
    setBoard((b) => undo(b))
  }

  const onHint = (): void => {
    setBoard((b) => {
      const nb = getHint(b)
      if (nb !== b && startAt === null) setStartAt(Date.now())
      return nb
    })
  }

  const onToggleNote = (): void => {
    setBoard((b) => toggleNoteMode(b))
  }

  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>): void => {
    if (board.completed) return
    const key = e.key
    if (/^[1-9]$/.test(key)) {
      e.preventDefault()
      onNum(parseInt(key, 10))
    } else if (key === 'Backspace' || key === 'Delete') {
      e.preventDefault()
      onErase()
    } else if (key === 'n' || key === 'N') {
      e.preventDefault()
      onToggleNote()
    }
  }, [board.completed, onNum, onErase, onToggleNote])

  const elapsedMs = finishedAt !== null
    ? finishedAt - (startAt ?? finishedAt)
    : startAt !== null ? now - startAt : 0

  return (
    <div className="moyu-board">
      <div className="moyu-stats">
        <div className="moyu-stats-center">
          <div className="moyu-stat">
            <span className="moyu-stat-label">正确数</span>
            <span className="moyu-stat-value">{board.correctCount}</span>
          </div>
          <div className="moyu-stat">
            <span className="moyu-stat-label">错误数</span>
            <span className="moyu-stat-value">{board.errorCount}</span>
          </div>
          <div className="moyu-stat">
            <span className="moyu-stat-label">{t('game.time')}</span>
            <span className="moyu-stat-value">{formatElapsed(elapsedMs / 1000)}</span>
          </div>
        </div>
        <button type="button" className="moyu-refresh" title={t('game.newGame')} aria-label={t('game.newGame')} onClick={startNew}>
          <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M13 8a5 5 0 1 1-1.5-3.5" />
            <path d="M12.3 1.6v3h-3" />
          </svg>
        </button>
      </div>

      <p className="moyu-hint">规则：填入数字1-9，每行每列每个9宫格数字都不重复</p>

      <div className="moyu-sudoku-grid" tabIndex={0} onKeyDown={onKeyDown}>
        {board.cells.map((cell, index) => {
          const isSelected = board.selectedIndex === index
          const isRelatedCell = board.selectedIndex !== null && isRelated(board.selectedIndex, index)
          const hasError = cell.value !== null && !cell.fixed && cell.value !== board.solution[index]

          let className = 'moyu-sudoku-cell'
          if (isSelected) className += ' moyu-sudoku-selected'
          else if (isRelatedCell) className += ' moyu-sudoku-related'
          if (hasError) className += ' moyu-sudoku-error'
          if (cell.fixed) className += ' moyu-sudoku-fixed'
          if (cell.value === null && cell.candidates.length > 0) className += ' moyu-sudoku-notes'

          const row = Math.floor(index / 9)
          const col = index % 9

          return (
            <button
              key={index}
              type="button"
              className={className}
              onClick={() => onCell(index)}
              aria-label={`第${row + 1}行第${col + 1}列`}
            >
              {cell.value !== null
                ? cell.value
                : (
                  <span className="moyu-sudoku-cands">
                    {cell.candidates.map((n) => (
                      <span key={n} className="moyu-sudoku-cand">{n}</span>
                    ))}
                  </span>
                )
              }
            </button>
          )
        })}
      </div>

      <div className="moyu-sudoku-actions">
        <button type="button" className="moyu-sudoku-action" onClick={onUndo}>撤销</button>
        <button type="button" className="moyu-sudoku-action" onClick={onErase}>擦除</button>
        <button
          type="button"
          className={board.noteMode ? 'moyu-sudoku-action moyu-sudoku-action-active' : 'moyu-sudoku-action'}
          onClick={onToggleNote}
        >
          笔记
        </button>
        <button type="button" className="moyu-sudoku-action" onClick={onHint}>提示</button>
      </div>

      <div className="moyu-sudoku-numpad">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            type="button"
            className="moyu-sudoku-num"
            onClick={() => onNum(num)}
          >
            {num}
          </button>
        ))}
      </div>

      {board.completed
        ? (
          <p className="moyu-solved" role="status">
            {t('game.solved')} · {formatElapsed(elapsedMs / 1000)}
          </p>
        )
        : null}
    </div>
  )
}

/** 数字记忆：6×6 棋盘，记住数字位置按顺序点击。 */
function MemoryGrid(props: { t: TranslateNS<'moyu-games'> }) {
  const { t } = props
  const [board, setBoard] = useState<MemoryBoard>(() => createMemoryBoard(3))
  const [startAt, setStartAt] = useState<number | null>(null)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const elapsedMs = startAt !== null ? now - startAt : 0

  const startNew = (): void => {
    setBoard(createMemoryBoard(3, 0))
    setStartAt(null)
  }

  const onCell = (index: number): void => {
    setBoard((b) => {
      const nb = clickMemoryCell(b, index)
      if (!b.started && nb.started) {
        setStartAt(Date.now())
      }
      // 达到上限完全重置时才重置时间；普通错误或阶段完成保持时间
      if (nb.errorCount === 0 && b.errorCount > 0) {
        setStartAt(null)
      }
      return nb
    })
  }

  return (
    <div className="moyu-board">
      <div className="moyu-stats">
        <div className="moyu-stats-center">
          <div className="moyu-stat">
            <span className="moyu-stat-label">错误数</span>
            <span className="moyu-stat-value">{board.errorCount}/{board.maxErrors}</span>
          </div>
          <div className="moyu-stat">
            <span className="moyu-stat-label">用时</span>
            <span className="moyu-stat-value">{formatElapsed(elapsedMs / 1000)}</span>
          </div>
        </div>
        <button type="button" className="moyu-refresh" title={t('game.newGame')} aria-label={t('game.newGame')} onClick={startNew}>
          <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M13 8a5 5 0 1 1-1.5-3.5" />
            <path d="M12.3 1.6v3h-3" />
          </svg>
        </button>
      </div>

      <p className="moyu-hint">规则：记住数字位置，按 1-{board.targetCount} 的顺序依次点击（速度越快说明记忆力越好）</p>

      <div className="moyu-memory-grid">
        {board.cells.map((cell, index) => {
          const hasNumber = cell.actual !== null
          const className = hasNumber
            ? (cell.revealed ? 'moyu-memory-cell moyu-memory-active' : 'moyu-memory-cell moyu-memory-hidden')
            : 'moyu-memory-cell'
          return (
            <button
              key={index}
              type="button"
              className={className}
              onClick={() => onCell(index)}
            >
              {cell.revealed ? cell.actual : ''}
            </button>
          )
        })}
      </div>

      <p className="moyu-hint" style={{ marginTop: '6px' }}>
        当前阶段：记住 {board.targetCount} 个数字
      </p>
    </div>
  )
}

/* --------------------------------------------------------------- snake game */

function lerp(a: number, b: number, t: number): number { return a + (b - a) * t }

/** 贪吃蛇：右下角弹窗内 Canvas 渲染，方格蛇+彩色圆点食物。 */
function SnakeGame({ t }: { t: LocaleReader }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<SnakeState>(createSnakeGame())
  const prevSnakeRef = useRef<Point[]>(gameRef.current.snake)
  const lastTickRef = useRef<number>(0)
  const rafRef = useRef<number>(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startedRef = useRef(false)
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [started, setStarted] = useState(false)

  const TICK_MS = 200

  const restart = useCallback((): void => {
    gameRef.current = createSnakeGame()
    prevSnakeRef.current = gameRef.current.snake
    lastTickRef.current = performance.now()
    startedRef.current = false
    setScore(0)
    setGameOver(false)
    setStarted(false)
  }, [])

  // Game tick loop
  useEffect(() => {
    const onTick = (): void => {
      const g = gameRef.current
      if (g.gameOver || g.won) return
      if (!startedRef.current) return
      prevSnakeRef.current = g.snake.map(s => ({ ...s }))
      const ng = tickSnake(g)
      gameRef.current = ng
      lastTickRef.current = performance.now()
      if (ng.gameOver) setGameOver(true)
      if (ng.score !== score) setScore(ng.score)
    }
    intervalRef.current = setInterval(onTick, TICK_MS)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [score])

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      let dir: SnakeDir | null = null
      switch (e.key) {
        case 'ArrowUp': case 'w': case 'W': dir = 'up'; break
        case 'ArrowDown': case 's': case 'S': dir = 'down'; break
        case 'ArrowLeft': case 'a': case 'A': dir = 'left'; break
        case 'ArrowRight': case 'd': case 'D': dir = 'right'; break
      }
      if (dir) {
        e.preventDefault()
        if (!startedRef.current && !gameRef.current.gameOver) {
          startedRef.current = true
          setStarted(true)
          lastTickRef.current = performance.now()
        }
        changeSnakeDir(gameRef.current, dir)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Mouse
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const onMove = (e: MouseEvent): void => {
      const rect = canvas.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top
      const g = gameRef.current
      if (g.gameOver || !startedRef.current) return
      const head = g.snake[0]
      const cellW = rect.width / g.cols
      const cellH = rect.height / g.rows
      const headX = head.x * cellW + cellW / 2
      const headY = head.y * cellH + cellH / 2
      const dx = mx - headX
      const dy = my - headY
      if (Math.abs(dx) < cellW * 0.3 && Math.abs(dy) < cellH * 0.3) return
      if (Math.abs(dx) > Math.abs(dy)) {
        changeSnakeDir(g, dx > 0 ? 'right' : 'left')
      } else {
        changeSnakeDir(g, dy > 0 ? 'down' : 'up')
      }
    }
    canvas.addEventListener('mousemove', onMove)
    return () => canvas.removeEventListener('mousemove', onMove)
  }, [])

  // Canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const CANVAS_SIZE = 400

    const resize = (): void => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = CANVAS_SIZE * dpr
      canvas.height = CANVAS_SIZE * dpr
      canvas.style.width = `${CANVAS_SIZE}px`
      canvas.style.height = `${CANVAS_SIZE}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    const render = (now: number): void => {
      const g = gameRef.current
      const w = CANVAS_SIZE
      const h = CANVAS_SIZE
      const cellSize = w / g.cols
      const gridW = cellSize * g.cols
      const gridH = cellSize * g.rows

      ctx.clearRect(0, 0, w, h)

      const tickProgress = startedRef.current && !g.gameOver
        ? Math.min(1, (now - lastTickRef.current) / TICK_MS)
        : 1

      // Grid lines: 1-cell lines (30×30 每格一条)
      ctx.strokeStyle = 'rgba(150, 170, 160, 0.45)'
      ctx.lineWidth = 0.6
      ctx.beginPath()
      for (let x = 0; x <= g.cols; x++) {
        ctx.moveTo(x * cellSize + 0.25, 0)
        ctx.lineTo(x * cellSize + 0.25, gridH)
      }
      for (let y = 0; y <= g.rows; y++) {
        ctx.moveTo(0, y * cellSize + 0.25)
        ctx.lineTo(gridW, y * cellSize + 0.25)
      }
      ctx.stroke()

      // Food: colored circle, same size as one cell
      const pulse = Math.sin(now / 250) * 0.08 + 1
      const foodR = (cellSize / 2) * pulse
      const foodX = g.food.x * cellSize + cellSize / 2
      const foodY = g.food.y * cellSize + cellSize / 2

      ctx.shadowBlur = 8
      ctx.shadowColor = g.food.color
      ctx.fillStyle = g.food.color
      ctx.beginPath()
      ctx.arc(foodX, foodY, foodR, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0

      // Snake: colored rounded squares, one cell each
      const positions = g.snake.map((seg, i) => {
        const prev = prevSnakeRef.current[i] || seg
        return {
          x: lerp(prev.x, seg.x, tickProgress) * cellSize,
          y: lerp(prev.y, seg.y, tickProgress) * cellSize,
        }
      })

      const radius = cellSize * 0.2
      for (let i = positions.length - 1; i >= 0; i--) {
        const pos = positions[i]
        const color = g.colors[i] || g.colors[0]
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.roundRect(pos.x, pos.y, cellSize, cellSize, radius)
        ctx.fill()
      }

      rafRef.current = requestAnimationFrame(render)
    }
    rafRef.current = requestAnimationFrame(render)

    return () => { cancelAnimationFrame(rafRef.current) }
  }, [])

  return (
    <div className="moyu-board">
      <div className="moyu-stats">
        <div className="moyu-stats-center">
          <div className="moyu-stat">
            <span className="moyu-stat-label">分数</span>
            <span className="moyu-stat-value">{score}</span>
          </div>
        </div>
        <button type="button" className="moyu-refresh" title={t('game.newGame')} aria-label={t('game.newGame')} onClick={restart}>
          <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M13 8a5 5 0 1 1-1.5-3.5" />
            <path d="M12.3 1.6v3h-3" />
          </svg>
        </button>
      </div>
      <p className="moyu-hint">规则：方向键或鼠标控制方向，吃彩色圆点变长</p>
      <div className="moyu-snake-canvas-wrap">
        <canvas ref={canvasRef} className="moyu-snake-canvas" />
        {gameOver && (
          <div className="moyu-snake-overlay">
            <p>游戏结束</p>
            <p className="moyu-snake-score-final">得分 {score}</p>
            <button type="button" className="moyu-snake-restart-overlay" onClick={restart}>再来一局</button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------- settings page */

type SectionFace = { scope: SettingsScope<MoyuGamesSettings> }
export type SettingsSectionProps =
  PropsRuntime<'settings.section'>
  & InjectFace<SectionFace>
  & PropsLocale<'moyu-games'>

/** A minimal toggle switch. */
function Switch({ on, disabled, onChange, label }: { on: boolean; disabled: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      className="moyu-switch"
      data-on={String(on)}
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
    />
  )
}

/** The plugin settings page bound to the `moyu-games` namespace. */
export function SettingsSection(props: SettingsSectionProps) {
  const { t, scope } = props
  const snapshot = useScopeSnapshot(scope)
  const value = snapshot.value
  const writable = snapshot.writable
  const set = (field: keyof MoyuGamesSettings, v: unknown): void => {
    if (!writable) return
    void scope.set(field, v)
  }

  if (snapshot.status !== 'ready') {
    // The namespace is not yet served to this client (loading or unavailable).
    if (snapshot.status === 'unavailable') {
      return <p className="moyu-setting-hint">{t('settings.readOnly')}</p>
    }
    return null
  }

  return (
    <div className="moyu-settings-page">
      <div className="moyu-setting">
        <div className="moyu-setting-head">
          <label className="moyu-setting-label">{t('settings.enabled')}</label>
          <Switch on={value?.enabled ?? true} disabled={!writable} label={t('settings.enabled')} onChange={() => set('enabled', !(value?.enabled ?? true))} />
        </div>
        <p className="moyu-setting-hint">{t('settings.enabledHint')}</p>
      </div>

      <div className="moyu-setting">
        <div className="moyu-setting-head">
          <label className="moyu-setting-label">{t('settings.autoPopup')}</label>
          <Switch on={value?.autoPopup ?? true} disabled={!writable} label={t('settings.autoPopup')} onChange={() => set('autoPopup', !(value?.autoPopup ?? true))} />
        </div>
        <p className="moyu-setting-hint">{t('settings.autoPopupHint')}</p>
      </div>

      <div className="moyu-setting">
        <label className="moyu-setting-label">{t('settings.defaultSize')}</label>
        <div className="moyu-size-field">
          {SIZES.map((s) => (
            <button
              key={s}
              type="button"
              className={(value?.defaultSize ?? 5) === s ? 'moyu-chip-active' : 'moyu-chip'}
              disabled={!writable}
              aria-pressed={(value?.defaultSize ?? 5) === s}
              onClick={() => set('defaultSize', s)}
            >
              {s}×{s}
            </button>
          ))}
        </div>
        <p className="moyu-setting-hint">{t('settings.defaultSizeHint')}</p>
      </div>
    </div>
  )
}
