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
    open: boolean;
    /**
     * Non-null exactly when a task-end frame arrived and the toast has not yet
     * been acknowledged / auto-dismissed. Carries the task id for correlation.
     * Consumers (the overlay) set this back to null after presenting the toast.
     */
    taskEndPending: number | null;
}
/** The window-state owner the foot action toggles and the overlay renders from. */
export declare class GameController {
    private open;
    /** Latest task id seen on a task-start frame (0 = none yet). */
    private task;
    /** Task id the user manually dismissed; auto-popup skips it until a new task. */
    private dismissedTask;
    /** Most recent task id whose `task-end` was received and not yet consumed. */
    private taskEndPending;
    private readonly listeners;
    getSnapshot(): GameControllerSnapshot;
    subscribe(fn: () => void): () => void;
    /**
     * A task-start frame arrived (auto-popup path): open unless the user
     * dismissed this very task. A new task id clears the dismissal. The caller
     * (SSE handler) already gated on auto/manual mode, so this is the auto path.
     */
    onTaskStart(task: number): void;
    /**
     * A turn ended. Stash the task id so the overlay (even if currently
     * hidden) can surface a completion toast next time it's rendered.
     */
    onTaskEnd(task: number): void;
    /** Called by the overlay after it has rendered (or decided to skip) the completion toast. */
    consumeTaskEnd(): void;
    /** Open the window (manual/footer entry). No-op if already open; always
     * allowed — the manual path (sidebar button) must open even after a close. */
    show(): void;
    /** Close the window and suppress auto-popup for the rest of this task. */
    hide(): void;
    toggle(): void;
    private notify;
}
