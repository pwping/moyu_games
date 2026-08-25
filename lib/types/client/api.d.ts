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
    type: 'task-start';
    /** Monotonic task (turn) id — changes exactly when a new task begins. */
    task: number;
    at: number;
}
/** A `task-end` frame pushed by the host when the current turn finishes. */
export interface TaskEndFrame {
    type: 'task-end';
    task: number;
    reason: string;
    at: number;
}
/** Handler invoked for every broadcast `task-start` frame. */
export type TaskStartHandler = (frame: TaskStartFrame) => void;
/** Handler invoked for every broadcast `task-end` frame. */
export type TaskEndHandler = (frame: TaskEndFrame) => void;
/** Optional observer for transport-level failures (auto-reconnect still applies). */
export type TaskStreamErrorHandler = (error: unknown) => void;
/** A single recoverable SSE subscription. */
export declare class TaskStartStream {
    private readonly path;
    private readonly onTaskStart;
    private readonly onTaskEnd;
    private readonly onError?;
    private source;
    constructor(path: string, onTaskStart: TaskStartHandler, onTaskEnd?: TaskEndHandler, onError?: TaskStreamErrorHandler | undefined);
    /** Open the stream once; a second call is a no-op while connected. */
    connect(): void;
    /** Close the stream. Safe to call when not connected. */
    disconnect(): void;
}
