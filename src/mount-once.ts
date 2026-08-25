/**
 * Host single-instance guard. The dsh loader may resolve the same plugin
 * package through more than one entry (e.g. a standalone install plus a
 * profile bundle), which would otherwise re-register the same webserver route,
 * settings namespace, and system-prompt section and fail the boot. mountOnce
 * makes the second apply a no-op for the lifetime of the first.
 *
 * The registry rides a global symbol so even two module instances of the same
 * package (a copy vs a link) share one verdict. cordis `ctx.effect` runs its
 * callback immediately and treats the callback's return value as the fiber
 * disposer, so the unmarker is returned, not run.
 */

const MOUNTED = Symbol.for('moyu-games.mounted')

type MountRegistry = { [MOUNTED]?: Set<string> }

function mountedSet(): Set<string> {
  const registry = globalThis as MountRegistry
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  return (registry[MOUNTED] ??= new Set())
}

/** Wrap a cordis plugin apply so the package runs at most once per process. */
export function mountOnce<T extends (...args: any[]) => unknown>(packageName: string, fn: T): T {
  return ((...args: unknown[]) => {
    const mounted = mountedSet()
    if (mounted.has(packageName)) return
    mounted.add(packageName)
    const ctx = args[0] as { effect?: (effect: () => unknown) => unknown } | undefined
    ctx?.effect?.(() => () => {
      mounted.delete(packageName)
    })
    return fn(...args)
  }) as T
}
