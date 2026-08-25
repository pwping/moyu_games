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
  /**
   * Non-null exactly when a task-end frame arrived and the toast has not yet
   * been acknowledged / auto-dismissed. Carries the task id for correlation.
   * Consumers (the overlay) set this back to null after presenting the toast.
   */
  taskEndPending: number | null
}

/** The window-state owner the foot action toggles and the overlay renders from. */
export class GameController {
  private open = false
  /** Latest task id seen on a task-start frame (0 = none yet). */
  private task = 0
  /** Task id the user manually dismissed; auto-popup skips it until a new task. */
  private dismissedTask: number | null = null
  /** Most recent task id whose `task-end` was received and not yet consumed. */
  private taskEndPending: number | null = null
  private readonly listeners = new Set<() => void>()

  getSnapshot(): GameControllerSnapshot {
    return { open: this.open, taskEndPending: this.taskEndPending }
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn)
    return () => { this.listeners.delete(fn) }
  }

  /**
   * A task-start frame arrived (auto-popup path): open unless the user
   * dismissed this very task. A new task id clears the dismissal. The caller
   * (SSE handler) already gated on auto/manual mode, so this is the auto path.
   */
  onTaskStart(task: number): void {
    this.task = task
    // A new start before the previous end was consumed just overrides the
    // pending signal — a stale completion toast would be misleading.
    this.taskEndPending = null
    if (this.dismissedTask === task) { this.notify(); return }
    this.dismissedTask = null
    this.show()
  }

  /**
   * A turn ended. Stash the task id so the overlay (even if currently
   * hidden) can surface a completion toast next time it's rendered.
   */
  onTaskEnd(task: number): void {
    this.taskEndPending = task
    this.notify()
  }

  /** Called by the overlay after it has rendered (or decided to skip) the completion toast. */
  consumeTaskEnd(): void {
    if (this.taskEndPending === null) return
    this.taskEndPending = null
    this.notify()
  }

  /** Open the window (manual/footer entry). No-op if already open; always
   * allowed — the manual path (sidebar button) must open even after a close. */
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
