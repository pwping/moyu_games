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
    controller.hide()
    controller.show()
    expect(seen).toEqual([true, false, true])
    unsubscribe()
    controller.hide()
    expect(seen).toEqual([true, false, true])
  })
})

describe('GameController task-start auto-open', () => {
  it('auto-opens on task-start and suppresses after manual close until the next task', () => {
    const controller = new GameController()
    controller.onTaskStart(1)
    expect(controller.getSnapshot().open).toBe(true)
    controller.hide()
    controller.onTaskStart(1) // same task (e.g. a debounced trailing frame)
    expect(controller.getSnapshot().open).toBe(false)
    controller.onTaskStart(2) // next task
    expect(controller.getSnapshot().open).toBe(true)
  })

  it('manual show still works while the current task is dismissed', () => {
    const controller = new GameController()
    controller.onTaskStart(1)
    controller.hide()
    controller.show()
    expect(controller.getSnapshot().open).toBe(true)
    controller.hide()
    controller.onTaskStart(1)
    expect(controller.getSnapshot().open).toBe(false)
  })

  it('dismissal does not leak into the next task after manual re-open', () => {
    const controller = new GameController()
    controller.onTaskStart(1)
    controller.hide()
    controller.show()
    controller.hide()
    controller.onTaskStart(2)
    expect(controller.getSnapshot().open).toBe(true)
  })
})
