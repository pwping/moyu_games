/**
 * moyu-games — host half.
 *
 * Serves the SSE event stream `/api/moyu-games/events` that tells the web GUI
 * when a turn/step starts (so it can pop the idle game window), and the
 * plugin's settings namespace + system-prompt announcement. The browser half
 * (./client) registers the settings page, the sidebar "Slacker game" foot
 * action, the floating game window, and subscribes to the SSE stream. This is
 * a standalone DSH plugin: it rides only the official DSH NPM SDK and can be
 * installed by anyone with `dsh plugin add`.
 */
import type { Context } from '@deepseek-ai/cordis';
import z from 'schemastery';
/** Stable cordis plugin name (matches cordis.patch.yml insert id). */
export declare const name = "moyu-games";
/** Services required before the broadcaster + route can mount. */
export declare const inject: string[];
/** Settings namespace the plugin card edits. */
export declare const MOYU_GAMES_SETTINGS_NAMESPACE: import("@deepseek-ai/dsh-settings").SettingsNamespace;
/** Plugin config, validated by the same-named schemastery schema. */
export interface Config {
    /** Master switch for the plugin. */
    enabled?: boolean;
    /** Whether the window auto-pops on task start. */
    autoPopup?: boolean;
    /** Minimum gap between task-start broadcasts (ms). */
    popupDebounceMs?: number;
    /** Default board size (3x3 .. 10x10). */
    defaultSize?: number;
    /** When true (default), a system-prompt section announces the plugin. */
    announceToAgent?: boolean;
}
export declare const Config: z<Config>;
/** Model-facing announcement: plugin presence and capabilities. */
export declare const MOYU_GAMES_GUIDANCE = "\u672C\u673A\u5DF2\u5B89\u88C5 moyu-games \u63D2\u4EF6\uFF08\u6478\u9C7C\u6E38\u620F \u00B7 \u6570\u5B57\u534E\u5BB9\u9053\uFF09\uFF1A\u4EFB\u52A1\u6267\u884C\uFF08turn/step \u5F00\u59CB\uFF09\u65F6\u53F3\u4E0B\u89D2\u4F1A\u5F39\u51FA\u6570\u5B57\u534E\u5BB9\u9053\u6ED1\u52A8\u62FC\u56FE\u6D6E\u7A97\uFF083x3~10x10\uFF0C\u53EF\u62D6\u52A8\u3001\u906E\u7F69\u900F\u660E\u4E0D\u5F71\u54CD\u67E5\u770B\u4EFB\u52A1\uFF09\uFF0C\u53EF\u624B\u52A8\u5173\u95ED\uFF1B\u540C\u4E00\u4EFB\u52A1\u5185\u624B\u52A8\u5173\u95ED\u540E\u4E0D\u518D\u81EA\u52A8\u5F39\u51FA\uFF0C\u4E0B\u4E2A\u4EFB\u52A1\u6062\u590D\u3002\u4FA7\u8FB9\u680F\u5E95\u90E8\u300C\u6478\u9C7C\u6E38\u620F\u300D\u5165\u53E3\uFF08\u8BBE\u7F6E\u5728\u9644\u8FD1\uFF09\u53EF\u968F\u65F6\u518D\u6253\u5F00\u3002\u7528\u6237\u63D0\u5230\u300C\u6478\u9C7C / \u6E38\u620F / \u534E\u5BB9\u9053 / \u6570\u5B57\u62FC\u56FE / \u5F39\u7A97\u5C0F\u6E38\u620F\u300D\u65F6\u5373\u6307\u672C\u63D2\u4EF6\uFF0C\u53EF\u63D0\u793A\u5176\u5728 \u8BBE\u7F6E \u2192 \u6478\u9C7C\u6E38\u620F \u4E2D\u5173\u95ED\u81EA\u52A8\u5F39\u7A97\u3002";
/** Mount the broadcaster + route and the announcement, aligned to the current source. */
export declare const apply: typeof applyImpl;
declare function applyImpl(ctx: Context, config?: Config): void;
export {};
