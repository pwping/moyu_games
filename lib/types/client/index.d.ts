/**
 * moyu-games browser half — runs inside the dsh web GUI.
 *
 * Registers the OFFICIAL slots:
 *  - `sidebar.footer.action` — the "Slacker game" row beside Settings;
 *  - `shell.overlay` — the floating game window (frame-wide additive layer);
 *  - `settings.section` — the plugin settings page.
 * Plus the SSE subscription to `/api/moyu-games/events`: when a turn or step
 * starts, the host broadcasts a `task-start` frame and (when auto-popup is on)
 * the window opens. No DOM injection, no plugin-family code — this package
 * rides only the official DSH SDK and is installable by anyone.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
import { type MoyuGamesKey } from './locales.ts';
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** moyu-games surface copy. */
        'moyu-games': MoyuGamesKey;
    }
}
/** Required services (fiber inject waiting — the runtime must be up first). */
export declare const inject: string[];
/**
 * Mount the moyu-games surfaces and subscribe to the host event stream.
 * @param ctx - client root context (slots / locale / settingsScope services).
 */
export declare function apply(ctx: ClientContext): void;
