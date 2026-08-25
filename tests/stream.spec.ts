import { afterEach, describe, expect, it, vi } from 'vitest'
import { TaskStartBroadcaster, TASK_START_EVENT } from '../src/stream.ts'

/** A minimal cordis-like context with `on` and a manual `emit`. */
function fakeCtx(): {
  on: (event: string, fn: (...args: any[]) => void) => () => void
  emit: (event: string, session: unknown, evt: unknown) => void
} {
  let handler: ((...args: any[]) => void) | undefined
  return {
    on: (_event, fn) => {
      handler = fn
      return () => { if (handler === fn) handler = undefined }
    },
    emit: (_event, session, evt) => { handler?.(session, evt) },
  }
}

/** A minimal ServerResponse recording `write` output. */
function fakeRes(): {
  res: { write: (s: string) => boolean; end: () => void }
  written: () => string
  ended: () => boolean
} {
  let text = ''
  let endedFlag = false
  return {
    res: {
      write: (s: string) => { text += s; return true },
      end: () => { endedFlag = true },
    },
    written: () => text,
    ended: () => endedFlag,
  }
}

afterEach(() => {
  vi.useRealTimers()
})

describe('TaskStartBroadcaster', () => {
  it('broadcasts a task-start frame to a connected client on turn/start', () => {
    const ctx = fakeCtx()
    const broadcaster = new TaskStartBroadcaster(ctx as never, 0)
    const client = fakeRes()
    broadcaster.addClient(client.res as never)
    ctx.emit('session/event', { id: 's1' }, { type: 'turn/start', seq: 1 })
    const out = client.written()
    // The connect comment flushes headers first; the frame follows.
    expect(out).toContain(': connected')
    expect(out).toContain(`event: ${TASK_START_EVENT}`)
    expect(out).toContain('"type":"task-start"')
  })

  it('does not broadcast on non-task events', () => {
    const ctx = fakeCtx()
    const broadcaster = new TaskStartBroadcaster(ctx as never, 0)
    const client = fakeRes()
    broadcaster.addClient(client.res as never)
    ctx.emit('session/event', { id: 's1' }, { type: 'assistant/chunk', seq: 1, data: { chunk: { type: 'text-delta', text: 'hi' } } })
    expect(client.written()).not.toContain(TASK_START_EVENT)
  })

  it('collapses a burst of starts inside the debounce window (first immediate, trailing once)', () => {
    vi.useFakeTimers()
    const ctx = fakeCtx()
    const broadcaster = new TaskStartBroadcaster(ctx as never, 5000)
    const client = fakeRes()
    broadcaster.addClient(client.res as never)
    // The very first start emits immediately (no earlier emit to debounce against).
    ctx.emit('session/event', { id: 's1' }, { type: 'turn/start', seq: 1 })
    expect(client.written().match(/event: task-start/g)).toHaveLength(1)
    // The burst that follows is collapsed into ONE trailing frame, not three.
    ctx.emit('session/event', { id: 's1' }, { type: 'step/start', seq: 2 })
    ctx.emit('session/event', { id: 's1' }, { type: 'step/start', seq: 3 })
    expect(client.written().match(/event: task-start/g)).toHaveLength(1)
    vi.advanceTimersByTime(5000)
    // One trailing frame for the whole burst.
    expect(client.written().match(/event: task-start/g)).toHaveLength(2)
  })

  it('removes a disconnected client and ends it on dispose', () => {
    const ctx = fakeCtx()
    const broadcaster = new TaskStartBroadcaster(ctx as never, 0)
    const client = fakeRes()
    broadcaster.addClient(client.res as never)
    broadcaster.removeClient(client.res as never)
    ctx.emit('session/event', { id: 's1' }, { type: 'turn/start', seq: 1 })
    expect(client.written()).not.toContain(TASK_START_EVENT)
    // Dispose ends the remaining live clients.
    const live = fakeRes()
    broadcaster.addClient(live.res as never)
    broadcaster.dispose()
    expect(live.ended()).toBe(true)
  })

  it('broadcasts on step/start as well', () => {
    const ctx = fakeCtx()
    const broadcaster = new TaskStartBroadcaster(ctx as never, 0)
    const client = fakeRes()
    broadcaster.addClient(client.res as never)
    ctx.emit('session/event', { id: 's1' }, { type: 'step/start', seq: 2 })
    expect(client.written()).toContain(TASK_START_EVENT)
  })

  it('stamps a fresh task id per turn and keeps it across the turn\'s steps', () => {
    const ctx = fakeCtx()
    const broadcaster = new TaskStartBroadcaster(ctx as never, 0)
    const client = fakeRes()
    broadcaster.addClient(client.res as never)
    ctx.emit('session/event', { id: 's1' }, { type: 'turn/start', seq: 1 })
    ctx.emit('session/event', { id: 's1' }, { type: 'step/start', seq: 2 })
    ctx.emit('session/event', { id: 's1' }, { type: 'step/start', seq: 3 })
    ctx.emit('session/event', { id: 's1' }, { type: 'turn/start', seq: 4 })
    const ids = [...client.written().matchAll(/"task":(\d+)/g)].map((m) => m[1])
    expect(ids).toEqual(['1', '1', '1', '2'])
  })
})
