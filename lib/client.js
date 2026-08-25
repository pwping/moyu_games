window.__ModuleLoader__.load({
	id: "moyu-games",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/controller.ts
		/** The window-state owner the foot action toggles and the overlay renders from. */
		var GameController = class {
			open = false;
			/** Latest task id seen on a task-start frame (0 = none yet). */
			task = 0;
			/** Task id the user manually dismissed; auto-popup skips it until a new task. */
			dismissedTask = null;
			listeners = /* @__PURE__ */ new Set();
			getSnapshot() {
				return { open: this.open };
			}
			subscribe(fn) {
				this.listeners.add(fn);
				return () => {
					this.listeners.delete(fn);
				};
			}
			/**
			* A task-start frame arrived (auto-popup path): open unless the user
			* dismissed this very task. A new task id clears the dismissal. The caller
			* (SSE handler) already gated on auto/manual mode, so this is the auto path.
			*/
			onTaskStart(task) {
				this.task = task;
				if (this.dismissedTask === task) return;
				this.dismissedTask = null;
				this.show();
			}
			/** Open the window (manual/footer entry). No-op if already open; always
			* allowed — the manual path (sidebar button) must open even after a close. */
			show() {
				if (this.open) return;
				this.open = true;
				this.notify();
			}
			/** Close the window and suppress auto-popup for the rest of this task. */
			hide() {
				if (!this.open) return;
				this.open = false;
				this.dismissedTask = this.task;
				this.notify();
			}
			toggle() {
				if (this.open) this.hide();
				else this.show();
			}
			notify() {
				for (const fn of [...this.listeners]) fn();
			}
		};
		//#endregion
		//#region src/client/api.ts
		/** SSE event name the host emits. */
		const TASK_START_EVENT = "task-start";
		/** A single recoverable SSE subscription. */
		var TaskStartStream = class {
			path;
			onTaskStart;
			onError;
			source;
			constructor(path, onTaskStart, onError) {
				this.path = path;
				this.onTaskStart = onTaskStart;
				this.onError = onError;
			}
			/** Open the stream once; a second call is a no-op while connected. */
			connect() {
				if (this.source !== void 0) return;
				const es = new EventSource(this.path);
				this.source = es;
				es.addEventListener(TASK_START_EVENT, (event) => {
					const raw = event.data;
					try {
						this.onTaskStart(JSON.parse(raw));
					} catch {}
				});
				es.onerror = (event) => {
					this.onError?.(event);
				};
			}
			/** Close the stream. Safe to call when not connected. */
			disconnect() {
				this.source?.close();
				this.source = void 0;
			}
		};
		//#endregion
		//#region src/client/locales.ts
		/**
		* The `moyu-games` namespace dictionaries: copy for the sidebar foot action,
		* the floating game window, and the settings page.
		*/
		/** Simplified Chinese dictionary (the key-set source of truth). */
		const zh = {
			"entry.label": "摸鱼游戏",
			"entry.tooltip": "摸鱼游戏 · 数字华容道",
			"game.title": "摸鱼游戏",
			"game.subtitle": "数字华容道",
			"game.howTo": "点击与空格相邻的数字，把它滑进空格",
			"game.newGame": "新游戏",
			"game.size": "难度",
			"game.moves": "步数",
			"game.time": "用时",
			"game.solved": "完成！",
			"game.close": "关闭",
			"settings.title": "摸鱼游戏",
			"settings.description": "数字华容道：任务执行时自动弹窗。",
			"settings.enabled": "启用插件",
			"settings.enabledHint": "关闭后不再提供侧边栏入口与自动弹窗。",
			"settings.autoPopup": "任务开始时自动弹窗",
			"settings.autoPopupHint": "关闭后只在侧边栏点击「摸鱼游戏」时弹出。",
			"settings.defaultSize": "默认难度",
			"settings.defaultSizeHint": "新窗口打开时使用的棋盘尺寸（3x3~10x10）。",
			"settings.readOnly": "当前部署的设置只读。"
		};
		/** English dictionary, checked complete against the zh key set. */
		const en = {
			"entry.label": "Slacker game",
			"entry.tooltip": "Slacker game · number slide puzzle",
			"game.title": "Slacker game",
			"game.subtitle": "Number slide puzzle",
			"game.howTo": "Tap a tile next to the blank to slide it into the gap",
			"game.newGame": "New game",
			"game.size": "Size",
			"game.moves": "Moves",
			"game.time": "Time",
			"game.solved": "Solved!",
			"game.close": "Close",
			"settings.title": "Slacker game",
			"settings.description": "Number slide puzzle: pops up when a task runs.",
			"settings.enabled": "Enable plugin",
			"settings.enabledHint": "When off, the sidebar entry and auto-popup are hidden.",
			"settings.autoPopup": "Auto-open on task start",
			"settings.autoPopupHint": "When off, the game only opens from the sidebar entry.",
			"settings.defaultSize": "Default size",
			"settings.defaultSizeHint": "Board size used when a fresh window opens (3x3~10x10).",
			"settings.readOnly": "This deployment stores settings read-only."
		};
		//#endregion
		//#region src/client/styles.ts
		/**
		* Self-contained stylesheet for the moyu-games surfaces, injected into
		* <head> once at apply time. All selectors are prefixed `moyu-` so the plugin
		* stays isolated from the host app and any other skin; no CSS-module build
		* step is needed, which keeps the client bundle buildable by anyone.
		*
		* Theme: 微信绿 (WeChat #07C160). The window docks to the RIGHT edge and the
		* overlay itself is click-through, so the task log underneath stays visible
		* and usable.
		*/
		const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Varela+Round&family=Nunito+Sans:wght@400;600;700;800&display=swap');

:root {
  --moyu-accent: #07c160;
  --moyu-accent-strong: #06ad56;
  --moyu-accent-soft: #e8f7ee;
  --moyu-accent-bg: #f0faf4;
  --moyu-ink: #1a2e25;
  --moyu-ink-muted: #6b8a76;
  --moyu-line: #d9efe0;
  --moyu-border: #bfe4cf;
  --moyu-bg2: #f0faf4;
}

/* Sidebar foot action: plain icon + label, NO background box (like the
   Settings row). The entry is a bare <button>; reset any default chrome. */
.moyu-footer-btn {
  display: flex; align-items: center; gap: 8px;
  width: 100%; height: 32px; padding: 0 10px; margin: 0;
  border: none !important; background: none !important;
  box-shadow: none !important; outline: none !important;
  -webkit-appearance: none !important; appearance: none !important;
  color: inherit; font: inherit; cursor: pointer; border-radius: 0;
}
.moyu-footer-btn:hover { background: var(--dsw-specific-sidebar-nav-item-hover, rgba(120,120,160,0.12)) !important; }
.moyu-footer-btn .moyu-footer-icon {
  display: inline-flex; align-items: center; justify-content: center;
  flex: none; width: 16px; height: 16px;
}
.moyu-footer-btn .moyu-footer-label { overflow: hidden; text-overflow: ellipsis; }
[data-sidebar-collapsed] .moyu-footer-btn { justify-content: center; padding: 0; }

.moyu-overlay {
  position: fixed; inset: 0; z-index: 2147483000;
  /* Click-through layer: the task log underneath stays visible and usable. */
  pointer-events: none;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  padding: 16px;
  opacity: 1; transition: opacity 0.22s ease;
}
.moyu-overlay.moyu-hidden {
  pointer-events: none; opacity: 0; visibility: hidden;
  /* Delay the visibility flip until the fade-out finishes, so closing animates. */
  transition: opacity 0.18s ease, visibility 0.18s;
}
.moyu-modal {
  pointer-events: auto;
  width: 440px; max-height: 88vh; overflow: auto;
  /* Overall 80% size. The transform is driven inline by the drag offset
     (translate(dx,dy) scale(0.8)); origin bottom-right keeps it docked to the
     bottom-right corner. No transform transition: dragging must be instant. */
  transform: translate(0px, 0px) scale(0.8);
  transform-origin: bottom right;
  border-radius: 20px;
  background: linear-gradient(180deg, #ffffff 0%, #f2faf5 100%);
  border: 1px solid var(--moyu-line);
  box-shadow: 0 18px 44px -18px rgba(23, 46, 33, 0.28), 0 2px 8px -4px rgba(23, 46, 33, 0.1);
  color: #27382f;
}
.moyu-header {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 20px 22px 12px;
  cursor: move; user-select: none; touch-action: none;
}
.moyu-title-wrap { display: flex; align-items: baseline; gap: 10px; min-width: 0; }
.moyu-title {
  margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.2px;
  font-family: 'Varela Round', 'Nunito Sans', system-ui, -apple-system, sans-serif;
  color: var(--moyu-accent-strong);
}
.moyu-subtitle { font-size: 12px; font-weight: 600; color: var(--moyu-ink-muted); white-space: nowrap; }
.moyu-close {
  display: inline-flex; align-items: center; justify-content: center;
  width: 30px; height: 30px; border: 0; border-radius: 10px;
  background: transparent; color: var(--moyu-ink-muted); cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}
.moyu-close:hover { background: var(--moyu-accent-soft); color: var(--moyu-accent-strong); }

/* Auto / manual mode switch (beside the title). */
.moyu-header-actions { display: flex; align-items: center; gap: 8px; }
.moyu-mode-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 4px 10px; border-radius: 999px;
  border: 1.5px solid var(--moyu-line);
  background: var(--moyu-accent-bg);
  color: var(--moyu-ink-muted);
  font-size: 12px; font-weight: 700; cursor: pointer;
  font-family: 'Nunito Sans', system-ui, sans-serif;
  transition: all 0.15s ease;
}
.moyu-mode-btn:hover { background: var(--moyu-accent-soft); }
.moyu-mode-btn.moyu-mode-on {
  background: var(--moyu-accent-soft); color: var(--moyu-accent-strong); border-color: var(--moyu-border);
}
.moyu-mode-switch {
  position: relative; width: 26px; height: 15px; border-radius: 999px; flex: none;
  background: #cdd8d1; transition: background 0.18s ease;
}
.moyu-mode-switch::after {
  content: ""; position: absolute; top: 2px; left: 2px; width: 11px; height: 11px;
  border-radius: 50%; background: #fff; transition: transform 0.18s ease;
  box-shadow: 0 1px 2px rgba(0,0,0,0.2);
}
.moyu-mode-switch[data-on="true"] { background: var(--moyu-accent); }
.moyu-mode-switch[data-on="true"]::after { transform: translateX(11px); }
.moyu-mode-label { line-height: 1; }

.moyu-game-tabs {
  display: flex; gap: 8px;
  padding: 0 22px 12px;
}
.moyu-game-tab, .moyu-game-tab-active {
  flex: 1;
  padding: 6px 0; border-radius: 10px;
  font-size: 12px; font-weight: 700; cursor: pointer;
  text-align: center;
  font-family: 'Nunito Sans', system-ui, sans-serif;
  transition: all 0.15s ease;
  border: 1.5px solid transparent;
}
.moyu-game-tab {
  background: transparent; color: var(--moyu-ink-muted);
}
.moyu-game-tab:hover { background: var(--moyu-accent-soft); color: var(--moyu-accent-strong); }
.moyu-game-tab-active {
  background: var(--moyu-accent-soft); color: var(--moyu-accent-strong); border-color: var(--moyu-border);
}

.moyu-board { padding: 6px 22px 22px; }
.moyu-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; flex-wrap: wrap; }
.moyu-sizes { display: flex; gap: 4px; flex-wrap: nowrap; flex: 1; }
.moyu-chip, .moyu-chip-active {
  flex: 1 1 0; min-width: 0;
  padding: 5px 2px; border-radius: 10px;
  background: var(--moyu-accent-bg); color: var(--moyu-accent-strong); font-size: 11px; font-weight: 700; cursor: pointer;
  border: 1.5px solid transparent;
  font-family: 'Nunito Sans', system-ui, sans-serif;
  transition: all 0.15s ease;
  text-align: center;
}
.moyu-chip:hover { background: var(--moyu-accent-soft); color: var(--moyu-accent-strong); }
.moyu-chip-active {
  background: var(--moyu-accent-soft); color: var(--moyu-accent-strong); border-color: var(--moyu-border);
}
.moyu-new-game {
  padding: 7px 14px; border: 0; border-radius: 10px;
  background: var(--moyu-accent); color: #fff;
  font-size: 13px; font-weight: 700; cursor: pointer;
  box-shadow: 0 6px 14px -8px rgba(7,193,96,0.7);
  transition: filter 0.12s ease;
}
.moyu-new-game:hover { filter: brightness(1.04); }
.moyu-stats { display: flex; align-items: stretch; gap: 12px; margin-bottom: 16px; width: min(100%, 468px); margin-left: auto; margin-right: auto; }
.moyu-stats-center { flex: 1; display: flex; gap: 10px; min-width: 0; }
.moyu-stat {
  flex: 1; display: flex; flex-direction: column; gap: 3px; align-items: center;
  padding: 10px 12px; border-radius: 14px;
  background: var(--moyu-accent-bg);
  border: 1.5px solid var(--moyu-line);
  text-align: center; min-width: 0;
}
.moyu-stat-value {
  font-size: 18px; font-weight: 800; color: var(--moyu-ink); font-variant-numeric: tabular-nums;
  font-family: 'Nunito Sans', system-ui, sans-serif;
}
.moyu-stat-label { font-size: 10px; font-weight: 700; color: var(--moyu-ink-muted); text-transform: uppercase; letter-spacing: 0.6px; }
.moyu-refresh {
  flex: none; aspect-ratio: 1/1; display: inline-flex; align-items: center; justify-content: center;
  border-radius: 14px;
  border: 1.5px solid transparent;
  background: var(--moyu-accent-bg); color: var(--moyu-accent-strong);
  cursor: pointer; transition: all 0.15s ease;
}
.moyu-refresh:hover { background: var(--moyu-accent-soft); }
.moyu-refresh:active { transform: rotate(140deg); }
.moyu-grid-wrap { display: flex; justify-content: center; margin: 0 auto; }
.moyu-grid {
  --moyu-base: calc(468px / var(--moyu-cols));
  display: grid; grid-template-columns: repeat(var(--moyu-cols), minmax(0, 1fr));
  gap: clamp(3px, calc(var(--moyu-base) * 0.06), 5px);
  width: min(100%, calc(var(--moyu-cols) * var(--moyu-base)));
  padding: clamp(3px, calc(var(--moyu-base) * 0.06), 5px); border-radius: 16px;
  background: var(--moyu-accent-bg);
  box-shadow: 0 0 0 1px var(--moyu-line) inset;
}
.moyu-tile, .moyu-empty { aspect-ratio: 1/1; border-radius: clamp(6px, var(--moyu-base), 12px); }
.moyu-empty { background: transparent; }
.moyu-tile {
  display: flex; align-items: center; justify-content: center;
  border: 0; font-size: calc(var(--moyu-base) * 0.26); font-weight: 800;
  color: #ffffff;
  user-select: none; cursor: pointer; font-family: 'Nunito Sans', system-ui, sans-serif;
  /* Single fixed deep WeChat-green — no light/dark highlight based on the
     blank's row/column, and it never changes during a move. */
  background: linear-gradient(155deg, #07c160 0%, #059c50 100%);
  box-shadow: 0 1px 0 rgba(255,255,255,0.2) inset, 0 2px 6px -4px rgba(7,107,53,0.35);
}
.moyu-tile-schulte, .moyu-tile-schulte-done {
  display: flex; align-items: center; justify-content: center;
  border: 0; font-size: calc(var(--moyu-base) * 0.26); font-weight: 800;
  user-select: none; font-family: 'Nunito Sans', system-ui, sans-serif;
  aspect-ratio: 1/1; border-radius: clamp(6px, var(--moyu-base), 12px);
}
.moyu-tile-schulte {
  background: #fff;
  color: var(--moyu-ink);
  box-shadow: 0 1px 0 rgba(255,255,255,0.5) inset, 0 1px 3px -1px rgba(23,46,33,0.1);
  cursor: pointer;
}
.moyu-tile-schulte-done {
  /* Selected / already-clicked number: use the deep WeChat green of the
     华容道 number tiles. */
  background: linear-gradient(155deg, #07c160 0%, #059c50 100%);
  color: #ffffff;
  cursor: default;
}
.moyu-hint { margin: 10px 2px 12px; font-size: 12px; color: var(--moyu-ink-muted); text-align: center; line-height: 1.6; }
.moyu-grid-wrap { position: relative; }
.moyu-schulte-toast {
  position: absolute; inset: 0; z-index: 10;
  display: flex; align-items: center; justify-content: center;
  font-size: 15px; font-weight: 800; color: var(--moyu-accent-strong);
  pointer-events: none;
}
.moyu-stat-bump { animation: moyu-bump 1s ease; }
/* Wrong-click hint on the "next number" stat: enlarged in deep WeChat green. */
.moyu-stat-hint { color: #0a9e56; }
@keyframes moyu-bump {
  0%   { transform: scale(1); }
  15%  { transform: scale(1.35); }
  70%  { transform: scale(1.35); }
  100% { transform: scale(1); }
}
.moyu-solved {
  margin: 10px 2px 0; padding: 9px 12px; border-radius: 12px;
  background: var(--moyu-accent-soft); color: var(--moyu-accent-strong);
  font-size: 13px; font-weight: 700; text-align: center;
}

/* ------------------------------------------------------------- sudoku */
.moyu-sudoku-grid {
  display: grid; grid-template-columns: repeat(9, 1fr);
  width: min(100%, 414px); margin: 0 auto;
  border: 2px solid var(--moyu-border); border-radius: 8px; overflow: hidden;
  outline: none;
}
.moyu-sudoku-grid:focus { box-shadow: 0 0 0 3px rgba(7,193,96,0.25); }
.moyu-sudoku-cell {
  aspect-ratio: 1/1; background: #fff;
  border: 0; border-right: 1px solid var(--moyu-line); border-bottom: 1px solid var(--moyu-line);
  font-size: 18px; font-weight: 600; color: var(--moyu-ink);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; padding: 0;
  font-family: 'Nunito Sans', system-ui, sans-serif;
}
.moyu-sudoku-cell:hover { background: var(--moyu-accent-bg); }
.moyu-sudoku-cell:nth-child(9n+3),
.moyu-sudoku-cell:nth-child(9n+6) {
  border-right-width: 2px; border-right-color: var(--moyu-border);
}
.moyu-sudoku-cell:nth-child(n+19):nth-child(-n+27),
.moyu-sudoku-cell:nth-child(n+46):nth-child(-n+54) {
  border-bottom-width: 2px; border-bottom-color: var(--moyu-border);
}
.moyu-sudoku-cell:nth-child(9n) { border-right: 0; }
.moyu-sudoku-cell:nth-child(n+73) { border-bottom: 0; }
.moyu-sudoku-selected { background: var(--moyu-accent-soft) !important; }
.moyu-sudoku-related { background: var(--moyu-accent-bg); }
.moyu-sudoku-same { background: rgba(7,193,96,0.14); }
.moyu-sudoku-fixed { color: #143326; font-weight: 800; }
.moyu-sudoku-error { color: #dc2626; }
.moyu-sudoku-notes { padding: 1px; }
.moyu-sudoku-cands {
  display: grid; grid-template-columns: repeat(3, 1fr);
  width: 100%; height: 100%; align-items: center; justify-items: center;
}
.moyu-sudoku-cand {
  font-size: 8px; font-weight: 600; color: var(--moyu-ink-muted);
  line-height: 1;
}
.moyu-sudoku-actions {
  display: flex; gap: 8px; justify-content: center;
  margin-top: 12px;
}
.moyu-sudoku-action {
  padding: 6px 14px; border-radius: 8px; border: 1.5px solid var(--moyu-line);
  background: #fff; color: var(--moyu-accent-strong); font-size: 12px; font-weight: 700;
  cursor: pointer; font-family: 'Nunito Sans', system-ui, sans-serif;
  transition: all 0.15s ease;
}
.moyu-sudoku-action:hover { background: var(--moyu-accent-bg); }
.moyu-sudoku-action-active {
  /* Selected state (e.g. note mode): deep WeChat green like the 华容道 tiles. */
  background: linear-gradient(155deg, #07c160 0%, #059c50 100%);
  border-color: #07c160; color: #ffffff;
}
/* Keep the deep green (and white text) while hovering the active button, so
   the generic :hover light-green background never hides the label. */
.moyu-sudoku-action.moyu-sudoku-action-active:hover {
  background: linear-gradient(155deg, #06b357 0%, #048f48 100%);
  border-color: #07c160; color: #ffffff;
}
.moyu-sudoku-numpad {
  display: flex; gap: 6px; justify-content: center;
  margin-top: 10px;
}
.moyu-sudoku-num {
  width: 34px; height: 34px; border-radius: 8px; border: 1.5px solid var(--moyu-line);
  background: #fff; color: var(--moyu-ink); font-size: 15px; font-weight: 700;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  font-family: 'Nunito Sans', system-ui, sans-serif;
  transition: all 0.12s ease;
}
.moyu-sudoku-num:hover { background: var(--moyu-accent-bg); border-color: var(--moyu-border); }
.moyu-sudoku-num:active { transform: scale(0.95); }

/* ------------------------------------------------------------- memory */
.moyu-memory-grid {
  display: grid; grid-template-columns: repeat(6, 1fr);
  width: min(100%, 414px); margin: 0 auto;
  gap: 5px;
}
.moyu-memory-cell {
  aspect-ratio: 1/1; background: var(--moyu-accent-bg); border-radius: 8px;
  border: 1px solid var(--moyu-line); font-size: 18px; font-weight: 700;
  color: var(--moyu-ink); display: flex; align-items: center; justify-content: center;
  cursor: pointer; padding: 0;
  font-family: 'Nunito Sans', system-ui, sans-serif;
  transition: all 0.12s ease;
}
.moyu-memory-cell:hover { background: var(--moyu-accent-soft); }
.moyu-memory-cell:disabled {
  cursor: default; background: var(--moyu-accent-bg); border-color: var(--moyu-line);
}
.moyu-memory-active {
  background: linear-gradient(135deg, #b7e8c8 0%, #c8f2d7 100%) !important;
  border-color: var(--moyu-border) !important; color: #1f5138 !important;
}
.moyu-memory-hidden {
  background: linear-gradient(135deg, #b7e8c8 0%, #c8f2d7 100%) !important;
  border-color: var(--moyu-border) !important;
}

/* ---- snake game: popup canvas ---- */
.moyu-snake-canvas-wrap {
  position: relative; width: 400px; max-width: 100%; margin: 0 auto;
  border-radius: 12px; overflow: hidden;
  background: var(--moyu-accent-bg); border: 1px solid var(--moyu-line);
}
.moyu-snake-canvas {
  display: block; cursor: crosshair; width: 400px; height: 400px; max-width: 100%;
}
.moyu-snake-overlay {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  text-align: center; pointer-events: none;
  font-family: 'Varela Round', 'Nunito Sans', system-ui, sans-serif;
}
.moyu-snake-overlay p {
  margin: 0; font-size: 18px; font-weight: 700; color: var(--moyu-ink);
  text-shadow: 0 1px 6px rgba(255,255,255,0.8);
}
.moyu-snake-score-final { font-size: 14px; margin-top: 4px; color: var(--moyu-ink-muted); }
.moyu-snake-restart-overlay {
  margin-top: 10px; pointer-events: auto;
  border: 1px solid var(--moyu-accent-strong); border-radius: 10px; padding: 5px 16px;
  font-size: 13px; background: rgba(7,193,96,0.16); color: var(--moyu-accent-strong);
  cursor: pointer; font-family: 'Nunito Sans', system-ui, sans-serif;
  transition: background 0.15s ease;
}
.moyu-snake-restart-overlay:hover { background: rgba(7,193,96,0.26); }

.moyu-settings-page { padding: 4px 0; }
.moyu-setting { margin-bottom: 16px; }
.moyu-setting-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.moyu-setting-label { font-size: 14px; font-weight: 700; color: var(--moyu-ink); font-family: 'Nunito Sans', system-ui, sans-serif; }
.moyu-setting-hint { margin: 4px 0 0; font-size: 12px; color: var(--moyu-ink-muted); }
.moyu-switch {
  position: relative; width: 44px; height: 26px; flex: none; cursor: pointer;
  background: #dee6e1; border-radius: 999px; transition: background 0.18s ease;
}
.moyu-switch::after {
  content: ""; position: absolute; top: 3px; left: 3px; width: 20px; height: 20px;
  background: #fff; border-radius: 50%; transition: transform 0.18s ease; box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}
.moyu-switch[data-on="true"] { background: var(--moyu-accent); }
.moyu-switch[data-on="true"]::after { transform: translateX(18px); }
.moyu-size-field {
  display: flex; gap: 6px; flex-wrap: wrap;
}
`;
		/** Inject the stylesheet into <head> once; idempotent. */
		function injectStyles() {
			if (typeof document === "undefined") return;
			const id = "moyu-games-styles";
			if (document.getElementById(id) !== null) return;
			const tag = document.createElement("style");
			tag.id = id;
			tag.dataset.plugin = "moyu-games";
			tag.textContent = STYLES;
			document.head.appendChild(tag);
		}
		//#endregion
		//#region src/game/puzzle.ts
		/** Valid difficulty sizes: 3x3 .. 10x10. */
		const SIZES = [
			3,
			4,
			5,
			6,
			7,
			8,
			9,
			10
		];
		/** The solved board for a given size. */
		function goalBoard(size) {
			const n = size * size;
			const board = new Array(n);
			for (let i = 0; i < n - 1; i++) board[i] = i + 1;
			board[n - 1] = 0;
			return board;
		}
		/** Index of the blank (the `0` cell). */
		function blankIndexOf(board) {
			return board.indexOf(0);
		}
		/** Indices orthogonally adjacent to `index` within a size x size grid. */
		function adjacentIndices(index, size) {
			const row = Math.floor(index / size);
			const col = index % size;
			const result = [];
			if (row > 0) result.push(index - size);
			if (row < size - 1) result.push(index + size);
			if (col > 0) result.push(index - 1);
			if (col < size - 1) result.push(index + 1);
			return result;
		}
		/** Whether the tile at `index` can slide into the blank (it is adjacent). */
		function canMove(board, index, size) {
			if (index < 0 || index >= board.length) return false;
			if (board[index] === 0) return false;
			return adjacentIndices(blankIndexOf(board), size).includes(index);
		}
		/** Slide the tile at `index` into the blank; returns a new board (no-op if illegal). */
		function applyMove(board, index, size) {
			if (!canMove(board, index, size)) return board;
			const next = board.slice();
			const blank = blankIndexOf(next);
			next[blank] = next[index];
			next[index] = 0;
			return next;
		}
		/**
		* Whether the tile at `index` shares a row or a column with the blank.
		* When true, clicking this tile slides the whole segment toward the blank.
		*/
		function canSlide(board, index, size) {
			if (index < 0 || index >= board.length) return false;
			if (board[index] === 0) return false;
			const blank = blankIndexOf(board);
			const blankRow = Math.floor(blank / size);
			const blankCol = blank % size;
			const indexRow = Math.floor(index / size);
			const indexCol = index % size;
			return blankRow === indexRow || blankCol === indexCol;
		}
		/**
		* Slide the whole row/column segment between `index` and the blank so the
		* blank ends up at `index`. Returns a new board (no-op if not on the same
		* row/column).
		*/
		function applySlide(board, index, size) {
			if (!canSlide(board, index, size)) return board;
			const next = board.slice();
			const blank = blankIndexOf(board);
			if (Math.floor(blank / size) === Math.floor(index / size)) if (index < blank) for (let i = blank; i > index; i--) next[i] = board[i - 1];
			else for (let i = blank; i < index; i++) next[i] = board[i + 1];
			else if (index < blank) for (let i = blank; i > index; i -= size) next[i] = board[i - size];
			else for (let i = blank; i < index; i += size) next[i] = board[i + size];
			next[index] = 0;
			return next;
		}
		/** Whether the board is the solved goal state. */
		function isSolved(board) {
			const n = board.length;
			for (let i = 0; i < n - 1; i++) if (board[i] !== i + 1) return false;
			return board[n - 1] === 0;
		}
		/** Count of inversions (pairs of tiles out of ascending order, blank ignored). */
		function inversionsOf(board) {
			const tiles = board.filter((v) => v !== 0);
			let count = 0;
			for (let i = 0; i < tiles.length; i++) for (let j = i + 1; j < tiles.length; j++) if (tiles[i] > tiles[j]) count++;
			return count;
		}
		/**
		* Standard 15-puzzle solvability:
		*  - odd width: solvable iff the inversion count is even.
		*  - even width: solvable iff (inversions + blank row from the bottom) is odd.
		*/
		function isSolvable(board, size) {
			const inv = inversionsOf(board);
			if (size % 2 === 1) return inv % 2 === 0;
			return (inv + (size - Math.floor(blankIndexOf(board) / size))) % 2 === 1;
		}
		/**
		* Return a board identical to `board` except the blank has been walked to the
		* bottom-right corner (last index) via legal slides. The blank moves right to
		* the last column, then down to the last row. Solvability is preserved — this
		* is a sequence of adjacent slides, so no tile multiset or parity changes.
		*/
		function moveBlankToBottomRight(board, size) {
			const next = board.slice();
			let blank = board.indexOf(0);
			const last = size * size - 1;
			const lastCol = size - 1;
			const lastRow = size - 1;
			while (blank !== last) {
				const row = Math.floor(blank / size);
				const target = blank % size < lastCol ? blank + 1 : row < lastRow ? blank + size : blank;
				if (target === blank) break;
				next[blank] = next[target];
				next[target] = 0;
				blank = target;
			}
			return next;
		}
		/**
		* Shuffle the goal by a long random walk of legal slides (never undoing the
		* last move), which is guaranteed to produce a solvable board. Re-runs a few
		* times if it accidentally lands back on the goal.
		* @param size - grid dimension (3..10).
		* @param rng - injectable randomness for deterministic tests.
		*/
		function shuffledBoard(size, rng = Math.random, maxAttempts = 20) {
			const target = Math.max(40, size * size * 90);
			for (let attempt = 0; attempt < maxAttempts; attempt++) {
				let board = goalBoard(size);
				let blank = blankIndexOf(board);
				let prev = -1;
				for (let k = 0; k < target; k++) {
					const neighbors = adjacentIndices(blank, size).filter((idx) => idx !== prev);
					if (neighbors.length === 0) continue;
					const pick = neighbors[Math.floor(rng() * neighbors.length)];
					prev = blank;
					board = applyMove(board, pick, size);
					blank = pick;
				}
				if (!isSolved(board) && isSolvable(board, size)) return board;
			}
			return applyMove(goalBoard(size), goalBoard(size).length - 2, size);
		}
		/** Format a second count as `m:ss` (or `s` under a minute). */
		function formatElapsed(totalSeconds) {
			const secs = Math.max(0, Math.floor(totalSeconds));
			if (secs < 60) return `${secs} 秒`;
			const m = Math.floor(secs / 60);
			const s = secs % 60;
			return `${m}:${String(s).padStart(2, "0")}`;
		}
		//#endregion
		//#region src/game/schulte.ts
		/** 创建一个 size×size 的随机舒尔特方格。 */
		function createBoard$2(size) {
			const values = Array.from({ length: size * size }, (_, i) => i + 1);
			for (let i = values.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[values[i], values[j]] = [values[j], values[i]];
			}
			return {
				size,
				values,
				currentTarget: 1,
				completed: false
			};
		}
		/** 点击 index 位置的格子；点对了返回新状态，点错返回 null。 */
		function clickBoard(board, index) {
			if (board.completed) return null;
			if (board.values[index] !== board.currentTarget) return null;
			const nextTarget = board.currentTarget + 1;
			return {
				...board,
				currentTarget: nextTarget,
				completed: nextTarget > board.values.length
			};
		}
		/** 判断某个 index 的数字是否已经被点过。 */
		function isDone(board, index) {
			return board.values[index] < board.currentTarget;
		}
		//#endregion
		//#region src/game/sudoku.ts
		function shuffle(arr) {
			const a = [...arr];
			for (let i = a.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[a[i], a[j]] = [a[j], a[i]];
			}
			return a;
		}
		function getRow(board, index) {
			const r = Math.floor(index / 9);
			const res = [];
			for (let c = 0; c < 9; c++) {
				const v = board[r * 9 + c];
				if (v !== 0) res.push(v);
			}
			return res;
		}
		function getCol(board, index) {
			const c = index % 9;
			const res = [];
			for (let r = 0; r < 9; r++) {
				const v = board[r * 9 + c];
				if (v !== 0) res.push(v);
			}
			return res;
		}
		function getBox(board, index) {
			const br = Math.floor(Math.floor(index / 9) / 3) * 3;
			const bc = Math.floor(index % 9 / 3) * 3;
			const res = [];
			for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
				const v = board[(br + r) * 9 + (bc + c)];
				if (v !== 0) res.push(v);
			}
			return res;
		}
		function isValidPlacement(board, index, num) {
			return !getRow(board, index).includes(num) && !getCol(board, index).includes(num) && !getBox(board, index).includes(num);
		}
		function getCandidates(board, index) {
			if (board[index] !== 0) return [];
			const used = /* @__PURE__ */ new Set([
				...getRow(board, index),
				...getCol(board, index),
				...getBox(board, index)
			]);
			return [
				1,
				2,
				3,
				4,
				5,
				6,
				7,
				8,
				9
			].filter((n) => !used.has(n));
		}
		/** 回溯法生成完整数独解。 */
		function generateSolution() {
			const board = Array(81).fill(0);
			fillBoard(board);
			return board;
		}
		function fillBoard(board) {
			for (let i = 0; i < 81; i++) {
				if (board[i] !== 0) continue;
				for (const n of shuffle([
					1,
					2,
					3,
					4,
					5,
					6,
					7,
					8,
					9
				])) if (isValidPlacement(board, i, n)) {
					board[i] = n;
					if (fillBoard(board)) return true;
					board[i] = 0;
				}
				return false;
			}
			return true;
		}
		/** 唯一余数法求解：只看每个空格候选数是否为 1。 */
		function solveByNakedSingle(board) {
			const b = [...board];
			let changed = true;
			while (changed) {
				changed = false;
				for (let i = 0; i < 81; i++) {
					if (b[i] !== 0) continue;
					const cands = getCandidates(b, i);
					if (cands.length === 1) {
						b[i] = cands[0];
						changed = true;
					}
				}
			}
			return b.every((v) => v !== 0);
		}
		/** 生成简单数独谜题（唯一余数法可解）。 */
		function generatePuzzle(solution, targetHoles) {
			const puzzle = [...solution];
			const indices = shuffle(Array.from({ length: 81 }, (_, i) => i));
			let holes = 0;
			for (const idx of indices) {
				if (holes >= targetHoles) break;
				const temp = puzzle[idx];
				puzzle[idx] = 0;
				if (solveByNakedSingle([...puzzle])) holes++;
				else puzzle[idx] = temp;
			}
			return puzzle;
		}
		function createBoard$1() {
			const solution = generateSolution();
			return {
				cells: generatePuzzle(solution, 38).map((v) => ({
					value: v === 0 ? null : v,
					fixed: v !== 0,
					candidates: []
				})),
				solution,
				correctCount: 0,
				errorCount: 0,
				completed: false,
				selectedIndex: null,
				noteMode: false,
				history: [],
				correctOnce: /* @__PURE__ */ new Set(),
				wrongOnce: /* @__PURE__ */ new Set()
			};
		}
		function selectCell(board, index) {
			return {
				...board,
				selectedIndex: index
			};
		}
		function inputNumber(board, num) {
			if (board.selectedIndex === null) return board;
			const cell = board.cells[board.selectedIndex];
			if (cell.fixed || board.completed) return board;
			if (board.noteMode) {
				const newCells = [...board.cells];
				const newCell = { ...newCells[board.selectedIndex] };
				const idx = newCell.candidates.indexOf(num);
				if (idx >= 0) newCell.candidates = newCell.candidates.filter((_, i) => i !== idx);
				else newCell.candidates = [...newCell.candidates, num].sort((a, b) => a - b);
				newCells[board.selectedIndex] = newCell;
				return {
					...board,
					cells: newCells
				};
			}
			if (cell.value === num) return board;
			const entry = {
				index: board.selectedIndex,
				prevValue: cell.value,
				prevCandidates: [...cell.candidates]
			};
			const newCells = [...board.cells];
			const newCell = { ...newCells[board.selectedIndex] };
			newCell.value = num;
			newCell.candidates = [];
			newCells[board.selectedIndex] = newCell;
			const correct = num === board.solution[board.selectedIndex];
			const newCorrectOnce = new Set(board.correctOnce);
			const newWrongOnce = new Set(board.wrongOnce);
			let newCorrectCount = board.correctCount;
			let newErrorCount = board.errorCount;
			if (correct && !newCorrectOnce.has(board.selectedIndex) && !newWrongOnce.has(board.selectedIndex)) {
				newCorrectOnce.add(board.selectedIndex);
				newCorrectCount++;
			}
			if (!correct && !newWrongOnce.has(board.selectedIndex)) {
				newWrongOnce.add(board.selectedIndex);
				newErrorCount++;
			}
			const allFilled = newCells.every((c) => c.value !== null);
			const hasCurrentError = newCells.some((c, i) => !c.fixed && c.value !== null && c.value !== board.solution[i]);
			const completed = allFilled && !hasCurrentError;
			return {
				...board,
				cells: newCells,
				correctCount: newCorrectCount,
				errorCount: newErrorCount,
				correctOnce: newCorrectOnce,
				wrongOnce: newWrongOnce,
				completed,
				history: [...board.history, entry]
			};
		}
		function eraseCell(board) {
			if (board.selectedIndex === null) return board;
			const cell = board.cells[board.selectedIndex];
			if (cell.fixed || board.completed) return board;
			const entry = {
				index: board.selectedIndex,
				prevValue: cell.value,
				prevCandidates: [...cell.candidates]
			};
			const newCells = [...board.cells];
			const newCell = { ...newCells[board.selectedIndex] };
			newCell.value = null;
			newCell.candidates = [];
			newCells[board.selectedIndex] = newCell;
			return {
				...board,
				cells: newCells,
				completed: false,
				history: [...board.history, entry]
			};
		}
		function undo(board) {
			if (board.history.length === 0) return board;
			const last = board.history[board.history.length - 1];
			const newCells = [...board.cells];
			const cur = newCells[last.index];
			newCells[last.index] = {
				...cur,
				value: last.prevValue,
				candidates: [...last.prevCandidates]
			};
			return {
				...board,
				cells: newCells,
				completed: false,
				history: board.history.slice(0, -1)
			};
		}
		function getHint(board) {
			if (board.selectedIndex === null || board.completed) return board;
			const cell = board.cells[board.selectedIndex];
			if (cell.fixed) return board;
			const correctValue = board.solution[board.selectedIndex];
			const entry = {
				index: board.selectedIndex,
				prevValue: cell.value,
				prevCandidates: [...cell.candidates]
			};
			const newCells = [...board.cells];
			const newCell = { ...newCells[board.selectedIndex] };
			newCell.value = correctValue;
			newCell.candidates = [];
			newCells[board.selectedIndex] = newCell;
			const newCorrectOnce = new Set(board.correctOnce);
			const newWrongOnce = new Set(board.wrongOnce);
			let newCorrectCount = board.correctCount;
			if (!newCorrectOnce.has(board.selectedIndex) && !newWrongOnce.has(board.selectedIndex)) {
				newCorrectOnce.add(board.selectedIndex);
				newCorrectCount++;
			}
			const allFilled = newCells.every((c) => c.value !== null);
			const hasCurrentError = newCells.some((c, i) => !c.fixed && c.value !== null && c.value !== board.solution[i]);
			return {
				...board,
				cells: newCells,
				correctCount: newCorrectCount,
				correctOnce: newCorrectOnce,
				history: [...board.history, entry],
				completed: allFilled && !hasCurrentError
			};
		}
		function toggleNoteMode(board) {
			return {
				...board,
				noteMode: !board.noteMode
			};
		}
		function isRelated(indexA, indexB) {
			if (indexA === indexB) return true;
			const ra = Math.floor(indexA / 9), ca = indexA % 9;
			const rb = Math.floor(indexB / 9), cb = indexB % 9;
			const ba = Math.floor(ra / 3) * 3 + Math.floor(ca / 3);
			const bb = Math.floor(rb / 3) * 3 + Math.floor(cb / 3);
			return ra === rb || ca === cb || ba === bb;
		}
		//#endregion
		//#region src/game/memory.ts
		function createBoard(targetCount = 3, errorCount = 0) {
			const cells = Array.from({ length: 36 }, () => ({
				actual: null,
				revealed: false
			}));
			const indices = Array.from({ length: 36 }, (_, i) => i);
			for (let i = indices.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[indices[i], indices[j]] = [indices[j], indices[i]];
			}
			for (let i = 0; i < targetCount; i++) {
				const idx = indices[i];
				cells[idx] = {
					actual: i + 1,
					revealed: true
				};
			}
			return {
				cells,
				targetCount,
				currentStep: 1,
				started: false,
				errorCount,
				maxErrors: 3
			};
		}
		function clickCell(board, index) {
			const cell = board.cells[index];
			if (!board.started) {
				if (cell.actual !== 1) {
					const newErrorCount = board.errorCount + 1;
					if (newErrorCount >= board.maxErrors) return createBoard(3, 0);
					return {
						...board,
						errorCount: newErrorCount
					};
				}
				const newCells = board.cells.map((c) => {
					if (c.actual === 1) return {
						...c,
						revealed: true
					};
					if (c.actual !== null) return {
						...c,
						revealed: false
					};
					return c;
				});
				return {
					...board,
					cells: newCells,
					started: true,
					currentStep: 2
				};
			}
			if (cell.actual !== board.currentStep) {
				const newErrorCount = board.errorCount + 1;
				if (newErrorCount >= board.maxErrors) return createBoard(3, 0);
				return {
					...board,
					errorCount: newErrorCount
				};
			}
			const newCells = [...board.cells];
			newCells[index] = {
				...newCells[index],
				revealed: true
			};
			const newStep = board.currentStep + 1;
			if (newStep > board.targetCount) return createBoard(board.targetCount + 1, board.errorCount);
			return {
				...board,
				cells: newCells,
				currentStep: newStep
			};
		}
		//#endregion
		//#region src/game/snake.ts
		const DIRS = {
			up: {
				x: 0,
				y: -1
			},
			down: {
				x: 0,
				y: 1
			},
			left: {
				x: -1,
				y: 0
			},
			right: {
				x: 1,
				y: 0
			}
		};
		const OPPOSITE = {
			up: "down",
			down: "up",
			left: "right",
			right: "left"
		};
		const FOOD_HUES = [
			0,
			30,
			55,
			120,
			180,
			210,
			260,
			320,
			340
		];
		function randomColor() {
			return `hsl(${FOOD_HUES[Math.floor(Math.random() * FOOD_HUES.length)]}, 75%, 60%)`;
		}
		function randomFood(state) {
			const occupied = new Set(state.snake.map((p) => `${p.x},${p.y}`));
			const free = [];
			for (let y = 0; y < state.rows; y++) for (let x = 0; x < state.cols; x++) if (!occupied.has(`${x},${y}`)) free.push({
				x,
				y
			});
			if (free.length === 0) return {
				x: 0,
				y: 0,
				color: randomColor()
			};
			return {
				...free[Math.floor(Math.random() * free.length)],
				color: randomColor()
			};
		}
		function createGame(cols = 30, rows = 30) {
			const state = {
				snake: [{
					x: Math.floor(cols / 2),
					y: Math.floor(rows / 2)
				}],
				colors: [randomColor()],
				direction: "right",
				pendingDir: "right",
				food: {
					x: 0,
					y: 0,
					color: randomColor()
				},
				score: 0,
				gameOver: false,
				won: false,
				cols,
				rows,
				tick: 0
			};
			state.food = randomFood(state);
			return state;
		}
		function changeDirection(state, dir) {
			if (state.gameOver || state.won) return;
			if (dir === OPPOSITE[state.direction]) return;
			state.pendingDir = dir;
		}
		function tick(state) {
			if (state.gameOver || state.won) return state;
			const dir = state.pendingDir;
			const d = DIRS[dir];
			const head = state.snake[0];
			const newHead = {
				x: head.x + d.x,
				y: head.y + d.y
			};
			if (newHead.x < 0 || newHead.x >= state.cols || newHead.y < 0 || newHead.y >= state.rows) return {
				...state,
				gameOver: true
			};
			for (let i = 0; i < state.snake.length - 1; i++) if (state.snake[i].x === newHead.x && state.snake[i].y === newHead.y) return {
				...state,
				gameOver: true
			};
			const newSnake = [newHead, ...state.snake];
			let food = state.food;
			let score = state.score;
			let won = state.won;
			let colors = state.colors;
			if (newHead.x === state.food.x && newHead.y === state.food.y) {
				score++;
				colors = [...state.colors, state.food.color];
				const nextState = {
					...state,
					snake: newSnake
				};
				if (newSnake.length >= state.cols * state.rows) won = true;
				else food = randomFood(nextState);
			} else {
				newSnake.pop();
				colors = state.colors;
			}
			return {
				...state,
				snake: newSnake,
				colors,
				direction: dir,
				food,
				score,
				gameOver: false,
				won,
				tick: state.tick + 1
			};
		}
		//#endregion
		//#region src/client/ui.tsx
		/**
		* The moyu-games React surfaces, registered into the OFFICIAL dsh slots:
		*  - `sidebar.footer.action` — the "Slacker game" row beside Settings;
		*  - `shell.overlay` — the floating game window (frame-wide additive layer);
		*  - `settings.section` — the plugin settings page (enabled / auto-popup /
		*    default size).
		*
		* The overlay stays mounted for the page lifetime (the list slot always
		* renders its entry), so the puzzle keeps its progress across open/close;
		* the `moyu-hidden` class only toggles visibility / pointer-events.
		*/
		/** Subscribe to a controller's open state. */
		function useOpen(controller) {
			const [open, setOpen] = (0, react.useState)(() => controller.getSnapshot().open);
			(0, react.useEffect)(() => controller.subscribe(() => setOpen(controller.getSnapshot().open)), [controller]);
			return open;
		}
		/** Subscribe to the whole settings scope snapshot (status/value/writable). */
		function useScopeSnapshot(scope) {
			const [snapshot, setSnapshot] = (0, react.useState)(() => scope.getSnapshot());
			(0, react.useEffect)(() => scope.subscribe(() => setSnapshot(scope.getSnapshot())), [scope]);
			return snapshot;
		}
		function clampSize$1(value, fallback = 5) {
			return Math.min(10, Math.max(3, Number.isFinite(value) ? Math.round(value ?? fallback) : fallback));
		}
		/** Clamp `v` into [min, max]. */
		function clamp(v, min, max) {
			return Math.min(max, Math.max(min, v));
		}
		const FOOTER_ICON = /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
			viewBox: "0 0 16 16",
			width: "14",
			height: "14",
			fill: "none",
			stroke: "currentColor",
			strokeWidth: "1.3",
			strokeLinecap: "round",
			strokeLinejoin: "round",
			"aria-hidden": "true",
			children: [
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("rect", {
					x: "2.5",
					y: "2.5",
					width: "4.6",
					height: "4.6",
					rx: "1.2"
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("rect", {
					x: "8.9",
					y: "2.5",
					width: "4.6",
					height: "4.6",
					rx: "1.2"
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("rect", {
					x: "2.5",
					y: "8.9",
					width: "4.6",
					height: "4.6",
					rx: "1.2"
				}),
				/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M9.4 11.2h3.6M11.2 9.4v3.6" })
			]
		});
		/** The sidebar foot action row: click to open the game window. */
		function FooterEntry(props) {
			const { t, wide, controller } = props;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "moyu-footer-btn",
				title: t("entry.tooltip"),
				"aria-label": t("entry.label"),
				onClick: () => controller.show(),
				"data-dsh-moyu-entry": "",
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: "moyu-footer-icon",
					children: FOOTER_ICON
				}), wide ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: "moyu-footer-label",
					children: t("entry.label")
				}) : null]
			});
		}
		/**
		* The floating game window: docked to the bottom-right corner and draggable by
		* its header. The overlay wrapper is click-through so the task log underneath
		* stays visible and usable (only the panel itself takes input). Each open
		* re-anchors to the bottom-right corner; dragging moves it (clamped to the
		* viewport) and it stays where you leave it until you close it.
		*/
		function GameOverlay(props) {
			const { t, controller, defaultSize, scope } = props;
			const open = useOpen(controller);
			const scopeSnap = useScopeSnapshot(scope);
			const auto = scopeSnap.value?.autoPopup ?? true;
			const writable = scopeSnap.writable;
			const toggleAuto = () => {
				if (!writable) return;
				scope.set("autoPopup", !auto);
			};
			const [activeGame, setActiveGame] = (0, react.useState)("puzzle");
			const modalRef = (0, react.useRef)(null);
			/** Drag offset from the default bottom-right anchor (0,0 = docked corner). */
			const [drag, setDrag] = (0, react.useState)({
				dx: 0,
				dy: 0
			});
			const dragRef = (0, react.useRef)(null);
			(0, react.useEffect)(() => {
				if (!open) return;
				setDrag({
					dx: 0,
					dy: 0
				});
				const onKey = (event) => {
					if (event.key === "Escape") controller.hide();
				};
				window.addEventListener("keydown", onKey);
				return () => window.removeEventListener("keydown", onKey);
			}, [open, controller]);
			const onHeaderPointerDown = (event) => {
				if (event.button !== 0) return;
				if (event.target.closest("button") !== null) return;
				const rect = modalRef.current?.getBoundingClientRect();
				if (rect === void 0) return;
				dragRef.current = {
					startX: event.clientX,
					startY: event.clientY,
					startDx: drag.dx,
					startDy: drag.dy,
					rect
				};
				event.currentTarget.setPointerCapture(event.pointerId);
			};
			const onHeaderPointerMove = (event) => {
				const state = dragRef.current;
				if (state === null) return;
				const moveX = clamp(event.clientX - state.startX, 8 - state.rect.left, window.innerWidth - 8 - state.rect.right);
				const moveY = clamp(event.clientY - state.startY, 8 - state.rect.top, window.innerHeight - 8 - state.rect.bottom);
				setDrag({
					dx: state.startDx + moveX,
					dy: state.startDy + moveY
				});
			};
			const endDrag = () => {
				dragRef.current = null;
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: open ? "moyu-overlay" : "moyu-overlay moyu-hidden",
				"aria-hidden": !open,
				"data-dsh-moyu-window": open ? "open" : "closed",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					ref: modalRef,
					className: "moyu-modal",
					role: "dialog",
					"aria-label": t("game.title"),
					style: { transform: `translate(${drag.dx}px, ${drag.dy}px) scale(0.8)` },
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
							className: "moyu-header",
							onPointerDown: onHeaderPointerDown,
							onPointerMove: onHeaderPointerMove,
							onPointerUp: endDrag,
							onPointerCancel: endDrag,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "moyu-title-wrap",
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
									className: "moyu-title",
									children: t("game.title")
								})
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "moyu-header-actions",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
									type: "button",
									className: auto ? "moyu-mode-btn moyu-mode-on" : "moyu-mode-btn",
									role: "switch",
									"aria-checked": auto,
									disabled: !writable,
									title: auto ? "自动：每次任务开始自动弹窗" : "手动：点侧边栏「摸鱼游戏」按钮打开",
									onClick: toggleAuto,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "moyu-mode-switch",
										"data-on": String(auto)
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "moyu-mode-label",
										children: auto ? "自动" : "手动"
									})]
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: "moyu-close",
									"aria-label": t("game.close"),
									onClick: () => controller.hide(),
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("svg", {
										viewBox: "0 0 16 16",
										width: "16",
										height: "16",
										"aria-hidden": "true",
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", {
											d: "M3.5 3.5l9 9M12.5 3.5l-9 9",
											stroke: "currentColor",
											strokeWidth: "1.6",
											strokeLinecap: "round"
										})
									})
								})]
							})]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "moyu-game-tabs",
							role: "tablist",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: activeGame === "puzzle" ? "moyu-game-tab-active" : "moyu-game-tab",
									role: "tab",
									"aria-selected": activeGame === "puzzle",
									onClick: () => setActiveGame("puzzle"),
									children: "数字华容道"
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									role: "tab",
									className: activeGame === "sudoku" ? "moyu-game-tab-active" : "moyu-game-tab",
									onClick: () => setActiveGame("sudoku"),
									"aria-selected": activeGame === "sudoku",
									children: "数独"
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									role: "tab",
									className: activeGame === "snake" ? "moyu-game-tab-active" : "moyu-game-tab",
									onClick: () => setActiveGame("snake"),
									"aria-selected": activeGame === "snake",
									children: "贪吃蛇"
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									role: "tab",
									className: activeGame === "schulte" ? "moyu-game-tab-active" : "moyu-game-tab",
									onClick: () => setActiveGame("schulte"),
									"aria-selected": activeGame === "schulte",
									children: "舒尔特方格"
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									role: "tab",
									className: activeGame === "memory" ? "moyu-game-tab-active" : "moyu-game-tab",
									onClick: () => setActiveGame("memory"),
									"aria-selected": activeGame === "memory",
									children: "数字记忆"
								})
							]
						}),
						activeGame === "puzzle" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SlidingPuzzle, {
							t,
							defaultSize
						}) : activeGame === "sudoku" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SudokuBoard, { t }) : activeGame === "snake" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SnakeGame, { t }) : activeGame === "schulte" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)(SchulteGrid, {
							t,
							defaultSize
						}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)(MemoryGrid, { t })
					]
				})
			});
		}
		/** The digital Huarong Road board. State stays in this always-mounted component. */
		function SlidingPuzzle({ t, defaultSize = 5 }) {
			const initialSize = clampSize$1(defaultSize);
			const [size, setSize] = (0, react.useState)(initialSize);
			const [board, setBoard] = (0, react.useState)(() => moveBlankToBottomRight(shuffledBoard(initialSize), initialSize));
			const [moves, setMoves] = (0, react.useState)(0);
			const [startAt, setStartAt] = (0, react.useState)(null);
			const [now, setNow] = (0, react.useState)(0);
			const [finishedAt, setFinishedAt] = (0, react.useState)(null);
			const solved = isSolved(board);
			(0, react.useEffect)(() => {
				if (solved && startAt !== null && finishedAt === null) setFinishedAt(Date.now());
			}, [
				solved,
				startAt,
				finishedAt
			]);
			(0, react.useEffect)(() => {
				if (startAt === null || solved) return;
				const id = window.setInterval(() => setNow(Date.now()), 1e3);
				return () => window.clearInterval(id);
			}, [startAt, solved]);
			const startNew = (nextSize) => {
				const s = clampSize$1(nextSize);
				setSize(s);
				setBoard(moveBlankToBottomRight(shuffledBoard(s), s));
				setMoves(0);
				setStartAt(null);
				setNow(0);
				setFinishedAt(null);
			};
			const onTile = (index) => {
				if (solved) return;
				if (!canSlide(board, index, size)) return;
				setBoard(applySlide(board, index, size));
				setMoves((m) => m + 1);
				if (startAt === null) setStartAt(Date.now());
			};
			const elapsedMs = finishedAt !== null ? finishedAt - (startAt ?? finishedAt) : startAt !== null ? now - startAt : 0;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "moyu-board",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "moyu-toolbar",
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "moyu-sizes",
							role: "group",
							"aria-label": t("game.size"),
							children: SIZES.map((s) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: s === size ? "moyu-chip-active" : "moyu-chip",
								"aria-pressed": s === size,
								onClick: () => {
									if (s !== size) startNew(s);
								},
								children: [
									s,
									"×",
									s
								]
							}, s))
						})
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "moyu-stats",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "moyu-stats-center",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "moyu-stat",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "moyu-stat-label",
									children: t("game.moves")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "moyu-stat-value",
									children: moves
								})]
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "moyu-stat",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "moyu-stat-label",
									children: t("game.time")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "moyu-stat-value",
									children: formatElapsed(elapsedMs / 1e3)
								})]
							})]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: "moyu-refresh",
							title: t("game.newGame"),
							"aria-label": t("game.newGame"),
							onClick: () => startNew(size),
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
								viewBox: "0 0 16 16",
								width: "16",
								height: "16",
								fill: "none",
								stroke: "currentColor",
								strokeWidth: "1.5",
								strokeLinecap: "round",
								strokeLinejoin: "round",
								"aria-hidden": "true",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M13 8a5 5 0 1 1-1.5-3.5" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M12.3 1.6v3h-3" })]
							})
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: "moyu-hint",
						children: `规则：把数字1-${size * size - 1}按顺序排列好即可`
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "moyu-grid-wrap",
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "moyu-grid",
							style: { ["--moyu-cols"]: String(size) },
							"data-dsh-moyu-board": String(size),
							children: board.map((value, index) => {
								if (value === 0) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "moyu-empty",
									"aria-hidden": "true"
								}, index);
								return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: "moyu-tile",
									onClick: () => onTile(index),
									"aria-label": String(value),
									children: value
								}, index);
							})
						})
					}),
					solved ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", {
						className: "moyu-solved",
						role: "status",
						children: [
							t("game.solved"),
							" · ",
							moves,
							" ",
							t("game.moves"),
							" · ",
							formatElapsed(elapsedMs / 1e3)
						]
					}) : null
				]
			});
		}
		/** 舒尔特方格：按 1,2,3… 顺序依次点击。 */
		function SchulteGrid({ t, defaultSize = 5 }) {
			const initialSize = clampSize$1(defaultSize);
			const [size, setSize] = (0, react.useState)(initialSize);
			const [board, setBoard] = (0, react.useState)(() => createBoard$2(initialSize));
			const [startAt, setStartAt] = (0, react.useState)(null);
			const [now, setNow] = (0, react.useState)(0);
			const [finishedAt, setFinishedAt] = (0, react.useState)(null);
			const [hint, setHint] = (0, react.useState)(null);
			const hintTimer = (0, react.useRef)(null);
			(0, react.useEffect)(() => {
				if (board.completed && startAt !== null && finishedAt === null) setFinishedAt(Date.now());
			}, [
				board.completed,
				startAt,
				finishedAt
			]);
			(0, react.useEffect)(() => {
				if (startAt === null || board.completed) return;
				const id = window.setInterval(() => setNow(Date.now()), 1e3);
				return () => window.clearInterval(id);
			}, [startAt, board.completed]);
			const clearHintTimer = () => {
				if (hintTimer.current !== null) {
					window.clearTimeout(hintTimer.current);
					hintTimer.current = null;
				}
			};
			const startNew = (nextSize) => {
				clearHintTimer();
				const s = clampSize$1(nextSize);
				setSize(s);
				setBoard(createBoard$2(s));
				setStartAt(null);
				setNow(0);
				setFinishedAt(null);
				setHint(null);
			};
			const onTile = (index) => {
				if (board.completed) return;
				const result = clickBoard(board, index);
				if (result === null) {
					clearHintTimer();
					setHint(`快速找到数字${board.currentTarget}`);
					hintTimer.current = window.setTimeout(() => {
						setHint(null);
						hintTimer.current = null;
					}, 1e3);
					return;
				}
				setBoard(result);
				if (startAt === null) setStartAt(Date.now());
			};
			const elapsedMs = finishedAt !== null ? finishedAt - (startAt ?? finishedAt) : startAt !== null ? now - startAt : 0;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "moyu-board",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "moyu-toolbar",
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "moyu-sizes",
							role: "group",
							"aria-label": t("game.size"),
							children: SIZES.map((s) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: s === size ? "moyu-chip-active" : "moyu-chip",
								"aria-pressed": s === size,
								onClick: () => {
									if (s !== size) startNew(s);
								},
								children: [
									s,
									"×",
									s
								]
							}, s))
						})
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "moyu-stats",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "moyu-stats-center",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: hint ? "moyu-stat moyu-stat-bump" : "moyu-stat",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "moyu-stat-label",
									children: "下一个数"
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: hint ? "moyu-stat-value moyu-stat-hint" : "moyu-stat-value",
									children: board.completed ? "—" : board.currentTarget
								})]
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "moyu-stat",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "moyu-stat-label",
									children: t("game.time")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "moyu-stat-value",
									children: formatElapsed(elapsedMs / 1e3)
								})]
							})]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: "moyu-refresh",
							title: t("game.newGame"),
							"aria-label": t("game.newGame"),
							onClick: () => startNew(size),
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
								viewBox: "0 0 16 16",
								width: "16",
								height: "16",
								fill: "none",
								stroke: "currentColor",
								strokeWidth: "1.5",
								strokeLinecap: "round",
								strokeLinejoin: "round",
								"aria-hidden": "true",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M13 8a5 5 0 1 1-1.5-3.5" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M12.3 1.6v3h-3" })]
							})
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", {
						className: "moyu-hint",
						children: [
							"规则：按 1-",
							size * size,
							" 的顺序依次点击数字（速度越快说明专注力越强）"
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "moyu-grid-wrap",
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "moyu-grid",
							style: { ["--moyu-cols"]: String(size) },
							"data-dsh-moyu-board": String(size),
							children: board.values.map((value, index) => {
								const done = isDone(board, index);
								return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: done ? "moyu-tile-schulte-done" : "moyu-tile-schulte",
									onClick: () => onTile(index),
									disabled: done,
									"aria-label": String(value),
									children: value
								}, index);
							})
						})
					}),
					board.completed ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", {
						className: "moyu-solved",
						role: "status",
						children: [
							t("game.solved"),
							" · ",
							formatElapsed(elapsedMs / 1e3)
						]
					}) : null
				]
			});
		}
		/** 9×9 数独棋盘。 */
		function SudokuBoard({ t }) {
			const [board, setBoard] = (0, react.useState)(() => createBoard$1());
			const [startAt, setStartAt] = (0, react.useState)(null);
			const [now, setNow] = (0, react.useState)(0);
			const [finishedAt, setFinishedAt] = (0, react.useState)(null);
			(0, react.useEffect)(() => {
				if (board.completed && startAt !== null && finishedAt === null) setFinishedAt(Date.now());
			}, [
				board.completed,
				startAt,
				finishedAt
			]);
			(0, react.useEffect)(() => {
				if (startAt === null || board.completed) return;
				const id = window.setInterval(() => setNow(Date.now()), 1e3);
				return () => window.clearInterval(id);
			}, [startAt, board.completed]);
			const startNew = () => {
				setBoard(createBoard$1());
				setStartAt(null);
				setNow(0);
				setFinishedAt(null);
			};
			const onCell = (index) => {
				setBoard((b) => selectCell(b, index));
			};
			const onNum = (num) => {
				setBoard((b) => {
					const nb = inputNumber(b, num);
					if (nb !== b && startAt === null) setStartAt(Date.now());
					return nb;
				});
			};
			const onErase = () => {
				setBoard((b) => eraseCell(b));
			};
			const onUndo = () => {
				setBoard((b) => undo(b));
			};
			const onHint = () => {
				setBoard((b) => {
					const nb = getHint(b);
					if (nb !== b && startAt === null) setStartAt(Date.now());
					return nb;
				});
			};
			const onToggleNote = () => {
				setBoard((b) => toggleNoteMode(b));
			};
			const onKeyDown = (0, react.useCallback)((e) => {
				if (board.completed) return;
				const key = e.key;
				if (/^[1-9]$/.test(key)) {
					e.preventDefault();
					onNum(parseInt(key, 10));
				} else if (key === "Backspace" || key === "Delete") {
					e.preventDefault();
					onErase();
				} else if (key === "n" || key === "N") {
					e.preventDefault();
					onToggleNote();
				}
			}, [
				board.completed,
				onNum,
				onErase,
				onToggleNote
			]);
			const elapsedMs = finishedAt !== null ? finishedAt - (startAt ?? finishedAt) : startAt !== null ? now - startAt : 0;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "moyu-board",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "moyu-stats",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "moyu-stats-center",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "moyu-stat",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "moyu-stat-label",
										children: "正确数"
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "moyu-stat-value",
										children: board.correctCount
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "moyu-stat",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "moyu-stat-label",
										children: "错误数"
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "moyu-stat-value",
										children: board.errorCount
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "moyu-stat",
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "moyu-stat-label",
										children: t("game.time")
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "moyu-stat-value",
										children: formatElapsed(elapsedMs / 1e3)
									})]
								})
							]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: "moyu-refresh",
							title: t("game.newGame"),
							"aria-label": t("game.newGame"),
							onClick: startNew,
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
								viewBox: "0 0 16 16",
								width: "16",
								height: "16",
								fill: "none",
								stroke: "currentColor",
								strokeWidth: "1.5",
								strokeLinecap: "round",
								strokeLinejoin: "round",
								"aria-hidden": "true",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M13 8a5 5 0 1 1-1.5-3.5" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M12.3 1.6v3h-3" })]
							})
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: "moyu-hint",
						children: "规则：填入数字1-9，每行每列每个9宫格数字都不重复"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "moyu-sudoku-grid",
						tabIndex: 0,
						onKeyDown,
						children: board.cells.map((cell, index) => {
							const isSelected = board.selectedIndex === index;
							const isRelatedCell = board.selectedIndex !== null && isRelated(board.selectedIndex, index);
							const hasError = cell.value !== null && !cell.fixed && cell.value !== board.solution[index];
							let className = "moyu-sudoku-cell";
							if (isSelected) className += " moyu-sudoku-selected";
							else if (isRelatedCell) className += " moyu-sudoku-related";
							if (hasError) className += " moyu-sudoku-error";
							if (cell.fixed) className += " moyu-sudoku-fixed";
							if (cell.value === null && cell.candidates.length > 0) className += " moyu-sudoku-notes";
							const row = Math.floor(index / 9);
							const col = index % 9;
							return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className,
								onClick: () => onCell(index),
								"aria-label": `第${row + 1}行第${col + 1}列`,
								children: cell.value !== null ? cell.value : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "moyu-sudoku-cands",
									children: cell.candidates.map((n) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "moyu-sudoku-cand",
										children: n
									}, n))
								})
							}, index);
						})
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "moyu-sudoku-actions",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "moyu-sudoku-action",
								onClick: onUndo,
								children: "撤销"
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "moyu-sudoku-action",
								onClick: onErase,
								children: "擦除"
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: board.noteMode ? "moyu-sudoku-action moyu-sudoku-action-active" : "moyu-sudoku-action",
								onClick: onToggleNote,
								children: "笔记"
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: "moyu-sudoku-action",
								onClick: onHint,
								children: "提示"
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "moyu-sudoku-numpad",
						children: [
							1,
							2,
							3,
							4,
							5,
							6,
							7,
							8,
							9
						].map((num) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: "moyu-sudoku-num",
							onClick: () => onNum(num),
							children: num
						}, num))
					}),
					board.completed ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", {
						className: "moyu-solved",
						role: "status",
						children: [
							t("game.solved"),
							" · ",
							formatElapsed(elapsedMs / 1e3)
						]
					}) : null
				]
			});
		}
		/** 数字记忆：6×6 棋盘，记住数字位置按顺序点击。 */
		function MemoryGrid(props) {
			const { t } = props;
			const [board, setBoard] = (0, react.useState)(() => createBoard(3));
			const [startAt, setStartAt] = (0, react.useState)(null);
			const [now, setNow] = (0, react.useState)(Date.now());
			(0, react.useEffect)(() => {
				const id = setInterval(() => setNow(Date.now()), 1e3);
				return () => clearInterval(id);
			}, []);
			const elapsedMs = startAt !== null ? now - startAt : 0;
			const startNew = () => {
				setBoard(createBoard(3, 0));
				setStartAt(null);
			};
			const onCell = (index) => {
				setBoard((b) => {
					const nb = clickCell(b, index);
					if (!b.started && nb.started) setStartAt(Date.now());
					if (nb.errorCount === 0 && b.errorCount > 0) setStartAt(null);
					return nb;
				});
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "moyu-board",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "moyu-stats",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "moyu-stats-center",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "moyu-stat",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "moyu-stat-label",
									children: "错误数"
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									className: "moyu-stat-value",
									children: [
										board.errorCount,
										"/",
										board.maxErrors
									]
								})]
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "moyu-stat",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "moyu-stat-label",
									children: "用时"
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "moyu-stat-value",
									children: formatElapsed(elapsedMs / 1e3)
								})]
							})]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: "moyu-refresh",
							title: t("game.newGame"),
							"aria-label": t("game.newGame"),
							onClick: startNew,
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
								viewBox: "0 0 16 16",
								width: "16",
								height: "16",
								fill: "none",
								stroke: "currentColor",
								strokeWidth: "1.5",
								strokeLinecap: "round",
								strokeLinejoin: "round",
								"aria-hidden": "true",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M13 8a5 5 0 1 1-1.5-3.5" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M12.3 1.6v3h-3" })]
							})
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", {
						className: "moyu-hint",
						children: [
							"规则：记住数字位置，按 1-",
							board.targetCount,
							" 的顺序依次点击（速度越快说明记忆力越好）"
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: "moyu-memory-grid",
						children: board.cells.map((cell, index) => {
							return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: cell.actual !== null ? cell.revealed ? "moyu-memory-cell moyu-memory-active" : "moyu-memory-cell moyu-memory-hidden" : "moyu-memory-cell",
								onClick: () => onCell(index),
								children: cell.revealed ? cell.actual : ""
							}, index);
						})
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", {
						className: "moyu-hint",
						style: { marginTop: "6px" },
						children: [
							"当前阶段：记住 ",
							board.targetCount,
							" 个数字"
						]
					})
				]
			});
		}
		function lerp(a, b, t) {
			return a + (b - a) * t;
		}
		/** 贪吃蛇：右下角弹窗内 Canvas 渲染，方格蛇+彩色圆点食物。 */
		function SnakeGame({ t }) {
			const canvasRef = (0, react.useRef)(null);
			const gameRef = (0, react.useRef)(createGame());
			const prevSnakeRef = (0, react.useRef)(gameRef.current.snake);
			const lastTickRef = (0, react.useRef)(0);
			const rafRef = (0, react.useRef)(0);
			const intervalRef = (0, react.useRef)(null);
			const startedRef = (0, react.useRef)(false);
			const [score, setScore] = (0, react.useState)(0);
			const [gameOver, setGameOver] = (0, react.useState)(false);
			const [started, setStarted] = (0, react.useState)(false);
			const TICK_MS = 200;
			const restart = (0, react.useCallback)(() => {
				gameRef.current = createGame();
				prevSnakeRef.current = gameRef.current.snake;
				lastTickRef.current = performance.now();
				startedRef.current = false;
				setScore(0);
				setGameOver(false);
				setStarted(false);
			}, []);
			(0, react.useEffect)(() => {
				const onTick = () => {
					const g = gameRef.current;
					if (g.gameOver || g.won) return;
					if (!startedRef.current) return;
					prevSnakeRef.current = g.snake.map((s) => ({ ...s }));
					const ng = tick(g);
					gameRef.current = ng;
					lastTickRef.current = performance.now();
					if (ng.gameOver) setGameOver(true);
					if (ng.score !== score) setScore(ng.score);
				};
				intervalRef.current = setInterval(onTick, TICK_MS);
				return () => {
					if (intervalRef.current) clearInterval(intervalRef.current);
				};
			}, [score]);
			(0, react.useEffect)(() => {
				const onKey = (e) => {
					let dir = null;
					switch (e.key) {
						case "ArrowUp":
						case "w":
						case "W":
							dir = "up";
							break;
						case "ArrowDown":
						case "s":
						case "S":
							dir = "down";
							break;
						case "ArrowLeft":
						case "a":
						case "A":
							dir = "left";
							break;
						case "ArrowRight":
						case "d":
						case "D":
							dir = "right";
							break;
					}
					if (dir) {
						e.preventDefault();
						if (!startedRef.current && !gameRef.current.gameOver) {
							startedRef.current = true;
							setStarted(true);
							lastTickRef.current = performance.now();
						}
						changeDirection(gameRef.current, dir);
					}
				};
				window.addEventListener("keydown", onKey);
				return () => window.removeEventListener("keydown", onKey);
			}, []);
			(0, react.useEffect)(() => {
				const canvas = canvasRef.current;
				if (!canvas) return;
				const onMove = (e) => {
					const rect = canvas.getBoundingClientRect();
					const mx = e.clientX - rect.left;
					const my = e.clientY - rect.top;
					const g = gameRef.current;
					if (g.gameOver || !startedRef.current) return;
					const head = g.snake[0];
					const cellW = rect.width / g.cols;
					const cellH = rect.height / g.rows;
					const headX = head.x * cellW + cellW / 2;
					const headY = head.y * cellH + cellH / 2;
					const dx = mx - headX;
					const dy = my - headY;
					if (Math.abs(dx) < cellW * .3 && Math.abs(dy) < cellH * .3) return;
					if (Math.abs(dx) > Math.abs(dy)) changeDirection(g, dx > 0 ? "right" : "left");
					else changeDirection(g, dy > 0 ? "down" : "up");
				};
				canvas.addEventListener("mousemove", onMove);
				return () => canvas.removeEventListener("mousemove", onMove);
			}, []);
			(0, react.useEffect)(() => {
				const canvas = canvasRef.current;
				if (!canvas) return;
				const ctx = canvas.getContext("2d");
				if (!ctx) return;
				const CANVAS_SIZE = 400;
				const resize = () => {
					const dpr = window.devicePixelRatio || 1;
					canvas.width = CANVAS_SIZE * dpr;
					canvas.height = CANVAS_SIZE * dpr;
					canvas.style.width = `${CANVAS_SIZE}px`;
					canvas.style.height = `${CANVAS_SIZE}px`;
					ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
				};
				resize();
				const render = (now) => {
					const g = gameRef.current;
					const w = CANVAS_SIZE;
					const h = CANVAS_SIZE;
					const cellSize = w / g.cols;
					const gridW = cellSize * g.cols;
					const gridH = cellSize * g.rows;
					ctx.clearRect(0, 0, w, h);
					const tickProgress = startedRef.current && !g.gameOver ? Math.min(1, (now - lastTickRef.current) / TICK_MS) : 1;
					ctx.strokeStyle = "rgba(150, 170, 160, 0.45)";
					ctx.lineWidth = .6;
					ctx.beginPath();
					for (let x = 0; x <= g.cols; x++) {
						ctx.moveTo(x * cellSize + .25, 0);
						ctx.lineTo(x * cellSize + .25, gridH);
					}
					for (let y = 0; y <= g.rows; y++) {
						ctx.moveTo(0, y * cellSize + .25);
						ctx.lineTo(gridW, y * cellSize + .25);
					}
					ctx.stroke();
					const pulse = Math.sin(now / 250) * .08 + 1;
					const foodR = cellSize / 2 * pulse;
					const foodX = g.food.x * cellSize + cellSize / 2;
					const foodY = g.food.y * cellSize + cellSize / 2;
					ctx.shadowBlur = 8;
					ctx.shadowColor = g.food.color;
					ctx.fillStyle = g.food.color;
					ctx.beginPath();
					ctx.arc(foodX, foodY, foodR, 0, Math.PI * 2);
					ctx.fill();
					ctx.shadowBlur = 0;
					const positions = g.snake.map((seg, i) => {
						const prev = prevSnakeRef.current[i] || seg;
						return {
							x: lerp(prev.x, seg.x, tickProgress) * cellSize,
							y: lerp(prev.y, seg.y, tickProgress) * cellSize
						};
					});
					const radius = cellSize * .2;
					for (let i = positions.length - 1; i >= 0; i--) {
						const pos = positions[i];
						const color = g.colors[i] || g.colors[0];
						ctx.fillStyle = color;
						ctx.beginPath();
						ctx.roundRect(pos.x, pos.y, cellSize, cellSize, radius);
						ctx.fill();
					}
					rafRef.current = requestAnimationFrame(render);
				};
				rafRef.current = requestAnimationFrame(render);
				return () => {
					cancelAnimationFrame(rafRef.current);
				};
			}, []);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "moyu-board",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "moyu-stats",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "moyu-stats-center",
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "moyu-stat",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "moyu-stat-label",
									children: "分数"
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "moyu-stat-value",
									children: score
								})]
							})
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: "moyu-refresh",
							title: t("game.newGame"),
							"aria-label": t("game.newGame"),
							onClick: restart,
							children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("svg", {
								viewBox: "0 0 16 16",
								width: "16",
								height: "16",
								fill: "none",
								stroke: "currentColor",
								strokeWidth: "1.5",
								strokeLinecap: "round",
								strokeLinejoin: "round",
								"aria-hidden": "true",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M13 8a5 5 0 1 1-1.5-3.5" }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("path", { d: "M12.3 1.6v3h-3" })]
							})
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: "moyu-hint",
						children: "规则：方向键或鼠标控制方向，吃彩色圆点变长"
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "moyu-snake-canvas-wrap",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("canvas", {
							ref: canvasRef,
							className: "moyu-snake-canvas"
						}), gameOver && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "moyu-snake-overlay",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: "游戏结束" }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", {
									className: "moyu-snake-score-final",
									children: ["得分 ", score]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: "moyu-snake-restart-overlay",
									onClick: restart,
									children: "再来一局"
								})
							]
						})]
					})
				]
			});
		}
		/** A minimal toggle switch. */
		function Switch({ on, disabled, onChange, label }) {
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
				type: "button",
				className: "moyu-switch",
				"data-on": String(on),
				role: "switch",
				"aria-checked": on,
				"aria-label": label,
				disabled,
				onClick: onChange
			});
		}
		/** The plugin settings page bound to the `moyu-games` namespace. */
		function SettingsSection(props) {
			const { t, scope } = props;
			const snapshot = useScopeSnapshot(scope);
			const value = snapshot.value;
			const writable = snapshot.writable;
			const set = (field, v) => {
				if (!writable) return;
				scope.set(field, v);
			};
			if (snapshot.status !== "ready") {
				if (snapshot.status === "unavailable") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					className: "moyu-setting-hint",
					children: t("settings.readOnly")
				});
				return null;
			}
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "moyu-settings-page",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "moyu-setting",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "moyu-setting-head",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
								className: "moyu-setting-label",
								children: t("settings.enabled")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Switch, {
								on: value?.enabled ?? true,
								disabled: !writable,
								label: t("settings.enabled"),
								onChange: () => set("enabled", !(value?.enabled ?? true))
							})]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: "moyu-setting-hint",
							children: t("settings.enabledHint")
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "moyu-setting",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "moyu-setting-head",
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
								className: "moyu-setting-label",
								children: t("settings.autoPopup")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Switch, {
								on: value?.autoPopup ?? true,
								disabled: !writable,
								label: t("settings.autoPopup"),
								onChange: () => set("autoPopup", !(value?.autoPopup ?? true))
							})]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: "moyu-setting-hint",
							children: t("settings.autoPopupHint")
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "moyu-setting",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("label", {
								className: "moyu-setting-label",
								children: t("settings.defaultSize")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "moyu-size-field",
								children: SIZES.map((s) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
									type: "button",
									className: (value?.defaultSize ?? 5) === s ? "moyu-chip-active" : "moyu-chip",
									disabled: !writable,
									"aria-pressed": (value?.defaultSize ?? 5) === s,
									onClick: () => set("defaultSize", s),
									children: [
										s,
										"×",
										s
									]
								}, s))
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: "moyu-setting-hint",
								children: t("settings.defaultSizeHint")
							})
						]
					})
				]
			});
		}
		//#endregion
		//#region src/client/index.ts
		/** Locale namespace this plugin owns. */
		const NS = "moyu-games";
		/** Settings namespace the settings page edits (the Host plugin registers it). */
		const SETTINGS_NS = "moyu-games";
		/** The host SSE endpoint the browser connects to. */
		const EVENTS_PATH = "/api/moyu-games/events";
		function clampSize(value, fallback = 5) {
			return Math.min(10, Math.max(3, Number.isFinite(value) ? Math.round(value ?? fallback) : fallback));
		}
		/** Required services (fiber inject waiting — the runtime must be up first). */
		const inject = [
			"slots",
			"locale",
			"settingsScope",
			"connection",
			"remote"
		];
		/**
		* Mount the moyu-games surfaces and subscribe to the host event stream.
		* @param ctx - client root context (slots / locale / settingsScope services).
		*/
		function apply(ctx) {
			injectStyles();
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "moyu-games: dictionaries");
			const settingsScope = ctx.settingsScope.bind({ namespace: SETTINGS_NS });
			const enabled = () => {
				const snapshot = settingsScope.getSnapshot();
				return snapshot.status === "ready" ? snapshot.value?.enabled ?? true : true;
			};
			const autoPopup = () => {
				const snapshot = settingsScope.getSnapshot();
				return snapshot.status === "ready" ? snapshot.value?.autoPopup ?? true : true;
			};
			const defaultSize = () => {
				const snapshot = settingsScope.getSnapshot();
				return clampSize(snapshot.status === "ready" ? snapshot.value?.defaultSize : void 0);
			};
			const controller = new GameController();
			ctx.slots.inject("sidebar.footer.action", () => ctx.slots.register({
				name: "sidebar.footer.action",
				id: "moyu-games",
				order: 60,
				label: () => ctx.locale.bind(NS)("entry.label"),
				locale: NS,
				inject: () => ({ controller })
			}, FooterEntry));
			ctx.slots.inject("shell.overlay", () => ctx.slots.register({
				name: "shell.overlay",
				id: "moyu-games",
				order: 50,
				locale: NS,
				inject: () => ({
					controller,
					defaultSize: defaultSize(),
					scope: settingsScope
				})
			}, GameOverlay));
			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "moyu-games",
				order: 120,
				label: () => ctx.locale.bind(NS)("settings.title"),
				locale: NS,
				inject: () => ({ scope: settingsScope })
			}, SettingsSection));
			const stream = new TaskStartStream(EVENTS_PATH, (frame) => {
				if (!enabled() || !autoPopup()) return;
				controller.onTaskStart(frame.task);
			});
			stream.connect();
			ctx.effect(() => () => stream.disconnect(), "moyu-games: popup stream");
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map