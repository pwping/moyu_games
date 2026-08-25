/**
 * Host-side task-start broadcaster.
 *
 * Subscribes to the durable DSH session vocabulary (`session/event`). When a
 * turn or a step begins (`turn/start`, `step/start`), it broadcasts a
 * `task-start` event to every connected SSE client. A debounce collapses a
 * burst of turn/step starts into at most one broadcast per window, so one user
 * message (which may open several steps/tool calls) does not spam the browser.
 * The browser half shows the game on the first signal and leaves it open until
 * the user closes it.
 */

import type { ServerResponse } from 'node:http'
import type { Context } from '@deepseek-ai/cordis'
import type { Session, SessionEvent } from '@deepseek-ai/dsh-session'

/** A task-start frame written to the SSE stream. */
export interface TaskStartFrame {
  type: 'task-start'
  /** Monotonic task (turn) id — changes exactly when a new task begins. */
  task: number
  at: number
}

/** A task-end frame written to the SSE stream when the current turn finishes. */
export interface TaskEndFrame {
  type: 'task-end'
  /** The same monotonic task id the matching start frame carried. */
  task: number
  /** `completed` = normal end; anything else (error / aborted / ...) still counts. */
  reason: string
  at: number
}

/** Name of the SSE "task-start" event. */
export const TASK_START_EVENT = 'task-start'
/** Name of the SSE "task-end" event. */
export const TASK_END_EVENT = 'task-end'

/** Relative path of the SSE endpoint the browser connects to. */
export const EVENTS_PATH = '/api/moyu-games/events'

interface SseClient {
  res: ServerResponse
}

/** Owns the SSE subscriber set and the session/event subscription for one host instance. */
export class TaskStartBroadcaster {
  private readonly clients = new Set<SseClient>()
  private readonly disposers: Array<(() => void) | undefined> = []
  private lastSent = 0
  private pending: (() => void) | undefined
  private readonly debounceMs: number
  /** Current task (turn) id; incremented on every turn/start. */
  private task = 0

  constructor(ctx: Context, debounceMs: number) {
    this.debounceMs = Math.max(0, debounceMs)
    this.disposers.push(ctx.on('session/event', (_session: Session, event: SessionEvent) => {
      // turn/start opens a new task; the turn's step/starts belong to it.
      if (event.type === 'turn/start') this.task += 1
      if (event.type === 'turn/start' || event.type === 'step/start') this.signal()
      // turn/end closes the current task — broadcast directly (no debounce).
      if (event.type === 'turn/end') {
        const data = (event.data ?? {}) as { reason?: { kind?: string } }
        const reason = data.reason?.kind ?? 'unknown'
        this.emitTaskEnd(reason)
      }
    }))
  }

  /** Register an SSE response and immediately send a comment to flush headers. */
  addClient(res: ServerResponse): void {
    const client: SseClient = { res }
    this.clients.add(client)
    try { res.write(': connected\n\n') } catch { this.clients.delete(client) }
  }

  /** Drop a disconnected SSE response. */
  removeClient(res: ServerResponse): void {
    for (const client of this.clients) {
      if (client.res === res) {
        this.clients.delete(client)
        return
      }
    }
  }

  /** Broadcast a `task-start` frame to every live client (debounced). */
  signal(): void {
    const now = Date.now()
    const wait = Math.max(0, this.debounceMs - (now - this.lastSent))
    if (wait === 0) {
      this.emit()
      return
    }
    if (this.pending !== undefined) return
    this.pending = (() => {
      const timer = setTimeout(() => {
        this.pending = undefined
        this.emit()
      }, wait)
      return () => clearTimeout(timer)
    })()
  }

  private emit(): void {
    this.lastSent = Date.now()
    const frame: TaskStartFrame = { type: 'task-start', task: this.task, at: this.lastSent }
    const payload = `event: ${TASK_START_EVENT}\ndata: ${JSON.stringify(frame)}\n\n`
    for (const client of [...this.clients]) {
      try { client.res.write(payload) } catch { this.clients.delete(client) }
    }
  }

  /** Broadcast a `task-end` frame immediately (no debounce) so the GUI can show the completion toast. */
  private emitTaskEnd(reason: string): void {
    const now = Date.now()
    const frame: TaskEndFrame = { type: 'task-end', task: this.task, reason, at: now }
    const payload = `event: ${TASK_END_EVENT}\ndata: ${JSON.stringify(frame)}\n\n`
    for (const client of [...this.clients]) {
      try { client.res.write(payload) } catch { this.clients.delete(client) }
    }
  }

  /** Undo the session/event subscription and any pending debounce. */
  dispose(): void {
    this.pending?.()
    this.pending = undefined
    for (const dispose of this.disposers) if (dispose !== undefined) dispose()
    this.disposers.length = 0
    for (const client of [...this.clients]) {
      try { client.res.end() } catch { /* ignore */ }
    }
    this.clients.clear()
  }
}
