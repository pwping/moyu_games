import { describe, expect, it } from 'vitest'
import { GameController } from '../src/client/controller.ts'

describe('GameController', () => {
  it('opens, closes, and toggles', () => {
    const controller = new GameController()
    expect(controller.getSnapshot().open).toBe(false)
    controller.show()
    expect(controller.getSnapshot().open).toBe(true)
    controller.show()
    expect(controller.getSnapshot().open).toBe(true)
    controller.hide()
    expect(controller.getSnapshot().open).toBe(false)
    // toggle() after a manual close opens again (manual path is always allowed).
    controller.toggle()
    expect(controller.getSnapshot().open).toBe(true)
    controller.toggle()
    expect(controller.getSnapshot().open).toBe(false)
  })

  it('notifies subscribers on every change', () => {
    const controller = new GameController()
    const seen: boolean[] = []
    const unsubscribe = controller.subscribe(() => seen.push(controller.getSnapshot().open))
    controller.show()
    expect(seen).toEqual([true])
    controller.hide()
    expect(seen).toEqual([true, false])
    // Manual open after a manual close is allowed -> notifies.
    controller.show()
    expect(seen).toEqual([true, false, true])
    unsubscribe()
    controller.hide()
    expect(seen).toEqual([true, false, true])
  })
})

describe('GameController task-start auto-open', () => {
  it('auto-opens on task-start, then suppresses the SAME task after a manual close', () => {
    const controller = new GameController()
    controller.onTaskStart(1)
    expect(controller.getSnapshot().open).toBe(true)
    controller.hide()
    // Same task (a debounced trailing frame / repeated signal) -> stays closed.
    controller.onTaskStart(1)
    expect(controller.getSnapshot().open).toBe(false)
    // Next task -> opens again.
    controller.onTaskStart(2)
    expect(controller.getSnapshot().open).toBe(true)
  })

  it('allows MANUAL open (sidebar button) even after a manual close', () => {
    const controller = new GameController()
    controller.onTaskStart(1)
    controller.hide()
    controller.show()
    // The manual path is always allowed — it opens regardless of dismissal.
    expect(controller.getSnapshot().open).toBe(true)
  })

  it('does not leak dismissal into the next task', () => {
    const controller = new GameController()
    controller.onTaskStart(1)
    controller.hide()
    controller.onTaskStart(2)
    expect(controller.getSnapshot().open).toBe(true)
    controller.hide()
    controller.onTaskStart(3)
    expect(controller.getSnapshot().open).toBe(true)
  })
})
