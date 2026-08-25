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
}
/** The window-state owner the foot action toggles and the overlay renders from. */
export declare class GameController {
    private open;
    /** Latest task id seen on a task-start frame (0 = none yet). */
    private task;
    /** Task id the user manually dismissed; auto-popup skips it until a new task. */
    private dismissedTask;
    private readonly listeners;
    getSnapshot(): GameControllerSnapshot;
    subscribe(fn: () => void): () => void;
    /**
     * A task-start frame arrived (auto-popup path): open unless the user
     * dismissed this very task. A new task id clears the dismissal.
     */
    onTaskStart(task: number): void;
    /** Open the window (manual entry). No-op if already open. */
    show(): void;
    /** Close the window and suppress auto-popup for the rest of this task. */
    hide(): void;
    toggle(): void;
    private notify;
}
