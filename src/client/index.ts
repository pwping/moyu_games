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

import type { ClientContext, SettingsScope, SettingsScopeSpec } from '@deepseek-ai/dsh-client-runtime/client'
// Type-only: pulls the locale plugin's Context merge (ctx.locale).
import type {} from '@deepseek-ai/dsh-client-locale/client'
// Type-only: pulls the settings-surface Context merge (ctx.settingsScope) and
// the `settings.section` SlotMap entry.
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
// Type-only: pulls the `shell.overlay` SlotMap entry (layout frame).
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
// Type-only: pulls the `sidebar.footer.action` SlotMap entry.
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import { GameController } from './controller.ts'
import { TaskStartStream } from './api.ts'
import { en, zh, type MoyuGamesKey } from './locales.ts'
import { injectStyles } from './styles.ts'
import { FooterEntry, GameOverlay, SettingsSection, type MoyuGamesSettings } from './ui.tsx'

/** Locale namespace this plugin owns. */
const NS = 'moyu-games'

/** Settings namespace the settings page edits (the Host plugin registers it). */
const SETTINGS_NS = 'moyu-games'

/** The host SSE endpoint the browser connects to. */
const EVENTS_PATH = '/api/moyu-games/events'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** moyu-games surface copy. */
    'moyu-games': MoyuGamesKey
  }
}

function clampSize(value: number | undefined, fallback = 5): number {
  const size = Number.isFinite(value) ? Math.round(value ?? fallback) : fallback
  return Math.min(10, Math.max(3, size))
}

/** Required services (fiber inject waiting — the runtime must be up first). */
export const inject = ['slots', 'locale', 'settingsScope', 'connection', 'remote']

/**
 * Mount the moyu-games surfaces and subscribe to the host event stream.
 * @param ctx - client root context (slots / locale / settingsScope services).
 */
export function apply(ctx: ClientContext): void {
  // Inject the stylesheet first so every surface below can render immediately.
  injectStyles()
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'moyu-games: dictionaries')

  const settingsScope: SettingsScope<MoyuGamesSettings> = ctx.settingsScope.bind({ namespace: SETTINGS_NS })
  const enabled = (): boolean => {
    const snapshot = settingsScope.getSnapshot()
    return snapshot.status === 'ready' ? snapshot.value?.enabled ?? true : true
  }
  const autoPopup = (): boolean => {
    const snapshot = settingsScope.getSnapshot()
    return snapshot.status === 'ready' ? snapshot.value?.autoPopup ?? true : true
  }
  const defaultSize = (): number => {
    const snapshot = settingsScope.getSnapshot()
    return clampSize(snapshot.status === 'ready' ? snapshot.value?.defaultSize : undefined)
  }

  const controller = new GameController()

  // Sidebar foot action (beside Settings): open the game window.
  ctx.slots.inject('sidebar.footer.action', () => ctx.slots.register({
    name: 'sidebar.footer.action',
    id: 'moyu-games',
    order: 60,
    label: () => ctx.locale.bind(NS)('entry.label'),
    locale: NS,
    inject: () => ({ controller }),
  }, FooterEntry))

  // Floating game window (frame-wide overlay). Kept mounted, hides via class.
  ctx.slots.inject('shell.overlay', () => ctx.slots.register({
    name: 'shell.overlay',
    id: 'moyu-games',
    order: 50,
    locale: NS,
    inject: () => ({ controller, defaultSize: defaultSize(), scope: settingsScope }),
  }, GameOverlay))

  // Settings page over the `moyu-games` namespace.
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'moyu-games',
    order: 120,
    label: () => ctx.locale.bind(NS)('settings.title'),
    locale: NS,
    inject: () => ({ scope: settingsScope }),
  }, SettingsSection))

  // Auto-popup on task start (host SSE broadcast), gated on live prefs.
  // A manual close suppresses the popup until the NEXT task (new task id).
  const stream = new TaskStartStream(EVENTS_PATH, (frame) => {
    if (!enabled() || !autoPopup()) return
    controller.onTaskStart(frame.task)
  })
  stream.connect()
  ctx.effect(() => () => stream.disconnect(), 'moyu-games: popup stream')
}
