/**
 * Browser half of the SSE broadcast: wraps one EventSource to the host
 * `/api/moyu-games/events` stream and forwards each `task-start` / `task-end`
 * frame.
 *
 * EventSource auto-reconnects on a dropped connection, so a transient error
 * never needs manual re-connect; `disconnect()` is the only teardown.
 */

/** A `task-start` frame pushed by the host on turn/step start. */
export interface TaskStartFrame {
  type: 'task-start'
  /** Monotonic task (turn) id — changes exactly when a new task begins. */
  task: number
  at: number
}

/** A `task-end` frame pushed by the host when the current turn finishes. */
export interface TaskEndFrame {
  type: 'task-end'
  task: number
  reason: string
  at: number
}

/** Handler invoked for every broadcast `task-start` frame. */
export type TaskStartHandler = (frame: TaskStartFrame) => void
/** Handler invoked for every broadcast `task-end` frame. */
export type TaskEndHandler = (frame: TaskEndFrame) => void

/** Optional observer for transport-level failures (auto-reconnect still applies). */
export type TaskStreamErrorHandler = (error: unknown) => void

/** SSE event names the host emits. */
const TASK_START_EVENT = 'task-start'
const TASK_END_EVENT = 'task-end'

/** A single recoverable SSE subscription. */
export class TaskStartStream {
  private source: EventSource | undefined

  constructor(
    private readonly path: string,
    private readonly onTaskStart: TaskStartHandler,
    private readonly onTaskEnd: TaskEndHandler = () => { /* noop */ },
    private readonly onError?: TaskStreamErrorHandler,
  ) {}

  /** Open the stream once; a second call is a no-op while connected. */
  connect(): void {
    if (this.source !== undefined) return
    const es = new EventSource(this.path)
    this.source = es
    es.addEventListener(TASK_START_EVENT, (event) => {
      const raw = (event as MessageEvent<string>).data
      try {
        this.onTaskStart(JSON.parse(raw) as TaskStartFrame)
      } catch {
        // Ignore malformed frames; the stream stays healthy.
      }
    })
    es.addEventListener(TASK_END_EVENT, (event) => {
      const raw = (event as MessageEvent<string>).data
      try {
        this.onTaskEnd(JSON.parse(raw) as TaskEndFrame)
      } catch {
        // Ignore malformed frames; the stream stays healthy.
      }
    })
    es.onerror = (event) => { this.onError?.(event) }
  }

  /** Close the stream. Safe to call when not connected. */
  disconnect(): void {
    this.source?.close()
    this.source = undefined
  }
}
