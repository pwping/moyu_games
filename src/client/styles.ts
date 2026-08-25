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

export const STYLES = `
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
  position: relative;
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

/* 任务完成 toast：居中盖在游戏内容上。pointer-events: none 让卡片
   外面的 wrap 透明可穿透，只有 .moyu-toast-card 本身接收点击。 */
.moyu-toast-wrap {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 5;
}
.moyu-toast-card {
  pointer-events: auto;
  animation: moyu-toast-fade-in 0.25s ease-out;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid var(--moyu-border);
  box-shadow: 0 12px 32px -12px rgba(23, 46, 33, 0.28), 0 4px 10px -4px rgba(23, 46, 33, 0.12);
  max-width: 86%;
  cursor: pointer;
}
.moyu-toast-text {
  font-family: 'Nunito Sans', system-ui, sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: var(--moyu-accent-strong);
  line-height: 1.4;
}
@keyframes moyu-toast-fade-in {
  from { opacity: 0; transform: translateY(-6px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
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
`

/** Inject the stylesheet into <head> once; idempotent. */
export function injectStyles(): void {
  if (typeof document === 'undefined') return
  const id = 'moyu-games-styles'
  if (document.getElementById(id) !== null) return
  const tag = document.createElement('style')
  tag.id = id
  tag.dataset.plugin = 'moyu-games'
  tag.textContent = STYLES
  document.head.appendChild(tag)
}
