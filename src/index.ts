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

import type { Context } from '@deepseek-ai/cordis'
import { installSettingsSection, settingsNamespace } from '@deepseek-ai/dsh-settings'
import type { WebRoute } from '@deepseek-ai/dsh-host-webserver'
import type {} from '@deepseek-ai/dsh-system-prompt'
import z from 'schemastery'
import { EVENTS_PATH, TaskStartBroadcaster } from './stream.ts'
import { mountOnce } from './mount-once.ts'

/** Stable cordis plugin name (matches cordis.patch.yml insert id). */
export const name = 'moyu-games'

/** Services required before the broadcaster + route can mount. */
export const inject = ['webServer', 'systemPrompt']

/** Settings namespace the plugin card edits. */
export const MOYU_GAMES_SETTINGS_NAMESPACE = settingsNamespace('moyu-games')

/** Plugin config, validated by the same-named schemastery schema. */
export interface Config {
  /** Master switch for the plugin. */
  enabled?: boolean
  /** Whether the window auto-pops on task start. */
  autoPopup?: boolean
  /** Minimum gap between task-start broadcasts (ms). */
  popupDebounceMs?: number
  /** Default board size (3x3 .. 10x10). */
  defaultSize?: number
  /** When true (default), a system-prompt section announces the plugin. */
  announceToAgent?: boolean
}

/** Default debounce window. */
const DEFAULT_DEBOUNCE_MS = 2000

export const Config: z<Config> = z.object({
  enabled: z.boolean().default(true),
  autoPopup: z.boolean().default(true),
  popupDebounceMs: z.number().min(200).max(30_000).default(DEFAULT_DEBOUNCE_MS),
  defaultSize: z.number().step(1).min(3).max(10).default(5),
  announceToAgent: z.boolean().default(true),
})

/** Order of the announcement section within the tool-guidance band. */
const SECTION_ORDER = 215

/** Model-facing announcement: plugin presence and capabilities. */
export const MOYU_GAMES_GUIDANCE = '本机已安装 moyu-games 插件（摸鱼游戏 · 数字华容道）：任务执行（turn/step 开始）时右下角会弹出数字华容道滑动拼图浮窗（3x3~10x10，可拖动、遮罩透明不影响查看任务），可手动关闭；同一任务内手动关闭后不再自动弹出，下个任务恢复。侧边栏底部「摸鱼游戏」入口（设置在附近）可随时再打开。用户提到「摸鱼 / 游戏 / 华容道 / 数字拼图 / 弹窗小游戏」时即指本插件，可提示其在 设置 → 摸鱼游戏 中关闭自动弹窗。'

/** Build the SSE route that accepts one streaming browser connection. */
function makeEventsRoute(broadcaster: TaskStartBroadcaster): WebRoute {
  return {
    kind: 'exact',
    path: EVENTS_PATH,
    handler: (req, res) => {
      res.writeHead(200, {
        'content-type': 'text/event-stream; charset=utf-8',
        'cache-control': 'no-cache, no-transform',
        connection: 'keep-alive',
        'x-accel-buffering': 'no',
      })
      res.flushHeaders()
      broadcaster.addClient(res)
      req.on('close', () => broadcaster.removeClient(res))
    },
  }
}

/** Mount the broadcaster + route and the announcement, aligned to the current source. */
export const apply = mountOnce('moyu-games', applyImpl)

function applyImpl(ctx: Context, config?: Config): void {
  let current: () => Config = () => config ?? {}
  let broadcaster: TaskStartBroadcaster | undefined
  let disposeRoute: (() => void) | undefined
  let disposeSection: (() => void) | undefined

  const sync = (): void => {
    broadcaster?.dispose()
    broadcaster = undefined
    if (disposeRoute !== undefined) { disposeRoute(); disposeRoute = undefined }
    if (disposeSection !== undefined) { disposeSection(); disposeSection = undefined }
    const value = current()
    if ((value.enabled ?? true) === false) return
    broadcaster = new TaskStartBroadcaster(ctx, value.popupDebounceMs ?? DEFAULT_DEBOUNCE_MS)
    disposeRoute = ctx.effect(() => {
      const broadcasterNow = broadcaster!
      const dispose = ctx.webServer.register(makeEventsRoute(broadcasterNow))
      return () => dispose()
    }, 'moyu-games: events route')
    if ((value.announceToAgent ?? true) !== false) {
      disposeSection = ctx.systemPrompt.section({
        name: 'plugin:moyu-games',
        order: SECTION_ORDER,
        text: MOYU_GAMES_GUIDANCE,
      })
    }
  }

  installSettingsSection(ctx, MOYU_GAMES_SETTINGS_NAMESPACE, Config, config ?? {}, {
    setSource: (source) => { current = source; sync() },
    onChange: sync,
  })

  sync()
}
