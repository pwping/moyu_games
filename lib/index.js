import { installSettingsSection, settingsNamespace } from "@deepseek-ai/dsh-settings";
import z from "schemastery";
//#region src/stream.ts
/** Name of the SSE "task-start" event. */
const TASK_START_EVENT = "task-start";
/** Relative path of the SSE endpoint the browser connects to. */
const EVENTS_PATH = "/api/moyu-games/events";
/** Owns the SSE subscriber set and the session/event subscription for one host instance. */
var TaskStartBroadcaster = class {
	clients = /* @__PURE__ */ new Set();
	disposers = [];
	lastSent = 0;
	pending;
	debounceMs;
	/** Current task (turn) id; incremented on every turn/start. */
	task = 0;
	constructor(ctx, debounceMs) {
		this.debounceMs = Math.max(0, debounceMs);
		this.disposers.push(ctx.on("session/event", (_session, event) => {
			if (event.type === "turn/start") this.task += 1;
			if (event.type === "turn/start" || event.type === "step/start") this.signal();
		}));
	}
	/** Register an SSE response and immediately send a comment to flush headers. */
	addClient(res) {
		const client = { res };
		this.clients.add(client);
		try {
			res.write(": connected\n\n");
		} catch {
			this.clients.delete(client);
		}
	}
	/** Drop a disconnected SSE response. */
	removeClient(res) {
		for (const client of this.clients) if (client.res === res) {
			this.clients.delete(client);
			return;
		}
	}
	/** Broadcast a `task-start` frame to every live client (debounced). */
	signal() {
		const now = Date.now();
		const wait = Math.max(0, this.debounceMs - (now - this.lastSent));
		if (wait === 0) {
			this.emit();
			return;
		}
		if (this.pending !== void 0) return;
		this.pending = (() => {
			const timer = setTimeout(() => {
				this.pending = void 0;
				this.emit();
			}, wait);
			return () => clearTimeout(timer);
		})();
	}
	emit() {
		this.lastSent = Date.now();
		const frame = {
			type: "task-start",
			task: this.task,
			at: this.lastSent
		};
		const payload = `event: ${TASK_START_EVENT}\ndata: ${JSON.stringify(frame)}\n\n`;
		for (const client of [...this.clients]) try {
			client.res.write(payload);
		} catch {
			this.clients.delete(client);
		}
	}
	/** Undo the session/event subscription and any pending debounce. */
	dispose() {
		this.pending?.();
		this.pending = void 0;
		for (const dispose of this.disposers) if (dispose !== void 0) dispose();
		this.disposers.length = 0;
		for (const client of [...this.clients]) try {
			client.res.end();
		} catch {}
		this.clients.clear();
	}
};
//#endregion
//#region src/mount-once.ts
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
const MOUNTED = Symbol.for("moyu-games.mounted");
function mountedSet() {
	const registry = globalThis;
	return registry[MOUNTED] ??= /* @__PURE__ */ new Set();
}
/** Wrap a cordis plugin apply so the package runs at most once per process. */
function mountOnce(packageName, fn) {
	return ((...args) => {
		const mounted = mountedSet();
		if (mounted.has(packageName)) return;
		mounted.add(packageName);
		args[0]?.effect?.(() => () => {
			mounted.delete(packageName);
		});
		return fn(...args);
	});
}
//#endregion
//#region src/index.ts
/** Stable cordis plugin name (matches cordis.patch.yml insert id). */
const name = "moyu-games";
/** Services required before the broadcaster + route can mount. */
const inject = ["webServer", "systemPrompt"];
/** Settings namespace the plugin card edits. */
const MOYU_GAMES_SETTINGS_NAMESPACE = settingsNamespace("moyu-games");
/** Default debounce window. */
const DEFAULT_DEBOUNCE_MS = 2e3;
const Config = z.object({
	enabled: z.boolean().default(true),
	autoPopup: z.boolean().default(true),
	popupDebounceMs: z.number().min(200).max(3e4).default(DEFAULT_DEBOUNCE_MS),
	defaultSize: z.number().step(1).min(3).max(10).default(5),
	announceToAgent: z.boolean().default(true)
});
/** Order of the announcement section within the tool-guidance band. */
const SECTION_ORDER = 215;
/** Model-facing announcement: plugin presence and capabilities. */
const MOYU_GAMES_GUIDANCE = "本机已安装 moyu-games 插件（摸鱼游戏 · 数字华容道）：任务执行（turn/step 开始）时右下角会弹出数字华容道滑动拼图浮窗（3x3~10x10，可拖动、遮罩透明不影响查看任务），可手动关闭；同一任务内手动关闭后不再自动弹出，下个任务恢复。侧边栏底部「摸鱼游戏」入口（设置在附近）可随时再打开。用户提到「摸鱼 / 游戏 / 华容道 / 数字拼图 / 弹窗小游戏」时即指本插件，可提示其在 设置 → 摸鱼游戏 中关闭自动弹窗。";
/** Build the SSE route that accepts one streaming browser connection. */
function makeEventsRoute(broadcaster) {
	return {
		kind: "exact",
		path: EVENTS_PATH,
		handler: (req, res) => {
			res.writeHead(200, {
				"content-type": "text/event-stream; charset=utf-8",
				"cache-control": "no-cache, no-transform",
				connection: "keep-alive",
				"x-accel-buffering": "no"
			});
			res.flushHeaders();
			broadcaster.addClient(res);
			req.on("close", () => broadcaster.removeClient(res));
		}
	};
}
/** Mount the broadcaster + route and the announcement, aligned to the current source. */
const apply = mountOnce("moyu-games", applyImpl);
function applyImpl(ctx, config) {
	let current = () => config ?? {};
	let broadcaster;
	let disposeRoute;
	let disposeSection;
	const sync = () => {
		broadcaster?.dispose();
		broadcaster = void 0;
		if (disposeRoute !== void 0) {
			disposeRoute();
			disposeRoute = void 0;
		}
		if (disposeSection !== void 0) {
			disposeSection();
			disposeSection = void 0;
		}
		const value = current();
		if ((value.enabled ?? true) === false) return;
		broadcaster = new TaskStartBroadcaster(ctx, value.popupDebounceMs ?? DEFAULT_DEBOUNCE_MS);
		disposeRoute = ctx.effect(() => {
			const broadcasterNow = broadcaster;
			const dispose = ctx.webServer.register(makeEventsRoute(broadcasterNow));
			return () => dispose();
		}, "moyu-games: events route");
		if ((value.announceToAgent ?? true) !== false) disposeSection = ctx.systemPrompt.section({
			name: "plugin:moyu-games",
			order: SECTION_ORDER,
			text: MOYU_GAMES_GUIDANCE
		});
	};
	installSettingsSection(ctx, MOYU_GAMES_SETTINGS_NAMESPACE, Config, config ?? {}, {
		setSource: (source) => {
			current = source;
			sync();
		},
		onChange: sync
	});
	sync();
}
//#endregion
export { Config, MOYU_GAMES_GUIDANCE, MOYU_GAMES_SETTINGS_NAMESPACE, apply, inject, name };
