/**
 * Game-window controller: the single owner of the window's open/closed state.
 *
 * Framework-free so the sidebar foot action, the SSE auto-popup, and the
 * floating overlay all share one tiny subscription surface. State lives only
 * for the browser session (no persistence); the puzzle keeps its own state
 * inside the always-mounted overlay.
 *
 * Auto-popup dismissal: when the user manually closes the window, the task id
 * at that moment is remembered and further task-start frames for the SAME task
 * (turn) are ignored; a frame carrying a new task id re-opens the window.
 */

export interface GameControllerSnapshot {
  open: boolean
}

/** The window-state owner the foot action toggles and the overlay renders from. */
export class GameController {
  private open = false
  /** Latest task id seen on a task-start frame (0 = none yet). */
  private task = 0
  /** Task id the user manually dismissed; auto-popup skips it until a new task. */
  private dismissedTask: number | null = null
  private readonly listeners = new Set<() => void>()

  getSnapshot(): GameControllerSnapshot {
    return { open: this.open }
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn)
    return () => { this.listeners.delete(fn) }
  }

  /**
   * A task-start frame arrived (auto-popup path): open unless the user
   * dismissed this very task. A new task id clears the dismissal.
   */
  onTaskStart(task: number): void {
    this.task = task
    if (this.dismissedTask === task) return
    this.dismissedTask = null
    this.show()
  }

  /** Open the window (manual entry). No-op if already open. */
  show(): void {
    if (this.open) return
    this.open = true
    this.notify()
  }

  /** Close the window and suppress auto-popup for the rest of this task. */
  hide(): void {
    if (!this.open) return
    this.open = false
    this.dismissedTask = this.task
    this.notify()
  }

  toggle(): void {
    if (this.open) this.hide()
    else this.show()
  }

  private notify(): void {
    for (const fn of [...this.listeners]) fn()
  }
}
