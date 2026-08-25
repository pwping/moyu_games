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
import type { ServerResponse } from 'node:http';
import type { Context } from '@deepseek-ai/cordis';
/** A task-start frame written to the SSE stream. */
export interface TaskStartFrame {
    type: 'task-start';
    /** Monotonic task (turn) id — changes exactly when a new task begins. */
    task: number;
    at: number;
}
/** Name of the SSE "task-start" event. */
export declare const TASK_START_EVENT = "task-start";
/** Relative path of the SSE endpoint the browser connects to. */
export declare const EVENTS_PATH = "/api/moyu-games/events";
/** Owns the SSE subscriber set and the session/event subscription for one host instance. */
export declare class TaskStartBroadcaster {
    private readonly clients;
    private readonly disposers;
    private lastSent;
    private pending;
    private readonly debounceMs;
    /** Current task (turn) id; incremented on every turn/start. */
    private task;
    constructor(ctx: Context, debounceMs: number);
    /** Register an SSE response and immediately send a comment to flush headers. */
    addClient(res: ServerResponse): void;
    /** Drop a disconnected SSE response. */
    removeClient(res: ServerResponse): void;
    /** Broadcast a `task-start` frame to every live client (debounced). */
    signal(): void;
    private emit;
    /** Undo the session/event subscription and any pending debounce. */
    dispose(): void;
}
