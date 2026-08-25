/**
 * Browser half of the SSE broadcast: wraps one EventSource to the host
 * `/api/moyu-games/events` stream and forwards each `task-start` frame.
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

/** Handler invoked for every broadcast `task-start` frame. */
export type TaskStartHandler = (frame: TaskStartFrame) => void

/** Optional observer for transport-level failures (auto-reconnect still applies). */
export type TaskStreamErrorHandler = (error: unknown) => void

/** SSE event name the host emits. */
const TASK_START_EVENT = 'task-start'

/** A single recoverable SSE subscription. */
export class TaskStartStream {
  private source: EventSource | undefined

  constructor(
    private readonly path: string,
    private readonly onTaskStart: TaskStartHandler,
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
    es.onerror = (event) => { this.onError?.(event) }
  }

  /** Close the stream. Safe to call when not connected. */
  disconnect(): void {
    this.source?.close()
    this.source = undefined
  }
}
