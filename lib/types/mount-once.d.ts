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
/** Wrap a cordis plugin apply so the package runs at most once per process. */
export declare function mountOnce<T extends (...args: any[]) => unknown>(packageName: string, fn: T): T;
