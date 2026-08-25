/**
 * Self-contained stylesheet for the moyu-games surfaces, injected into
 * <head> once at apply time. All selectors are prefixed `moyu-` so the plugin
 * stays isolated from the host app and any other skin; no CSS-module build
 * step is needed, which keeps the client bundle buildable by anyone.
 */

export const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Varela+Round&family=Nunito+Sans:wght@400;600;700;800&display=swap');

:root {
  --moyu-accent: #0ea5a4;
  --moyu-accent-soft: #e2f5f5;
  --moyu-accent-strong: #0b8f8e;
  --moyu-ink: #1f2430;
  --moyu-ink-muted: #7a8294;
  --moyu-line: #ebeef3;
  --moyu-bg2: #f6f7fa;
}

.moyu-footer-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 32px;
  padding: 0 10px;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
  border-radius: 8px;
}
.moyu-footer-btn:hover { background: var(--dsw-specific-sidebar-nav-item-hover, rgba(120,120,160,0.12)); }
.moyu-footer-btn .moyu-footer-icon {
  display: inline-flex; align-items: center; justify-content: center;
  flex: none; width: 16px; height: 16px;
}
.moyu-footer-btn .moyu-footer-label { overflow: hidden; text-overflow: ellipsis; }
.moyu-rail .moyu-footer-label { display: none; }
[data-sidebar-collapsed] .moyu-footer-btn { justify-content: center; padding: 0; }

.moyu-overlay {
  position: fixed; inset: 0; z-index: 2147483000;
  /* Transparent, click-through: the task log underneath stays visible and usable. */
  pointer-events: none;
  opacity: 1; transition: opacity 0.22s ease;
}
.moyu-overlay.moyu-hidden {
  pointer-events: none; opacity: 0; visibility: hidden;
  /* Delay the visibility flip until the fade-out finishes, so closing animates. */
  transition: opacity 0.18s ease, visibility 0.18s;
}
.moyu-modal {
  position: absolute; right: clamp(12px, 2vw, 24px); bottom: clamp(12px, 2vh, 24px);
  pointer-events: auto;
  width: 460px; max-height: 86vh; overflow: auto;
  transform-origin: bottom right;
  transform: scale(0.8);
  border-radius: 20px;
  background: linear-gradient(180deg, #ffffff 0%, #f8faf9 100%);
  border: 1px solid #e8edea;
  box-shadow: 0 16px 40px -18px rgba(35,46,74,0.22), 0 2px 8px -4px rgba(35,46,74,0.08);
  color: #3a4a42;
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
  color: #5e8b7e;
}
.moyu-subtitle { font-size: 12px; font-weight: 600; color: #9aada2; white-space: nowrap; }
.moyu-close {
  display: inline-flex; align-items: center; justify-content: center;
  width: 30px; height: 30px; border: 0; border-radius: 10px;
  background: transparent; color: #9aada2; cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}
.moyu-close:hover { background: #f0f5f2; color: #5e8b7e; }

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
  background: transparent; color: #9aada2;
}
.moyu-game-tab:hover { background: #f0f5f2; color: #5e8b7e; }
.moyu-game-tab-active {
  background: #f0f5f2; color: #5e8b7e; border-color: #b8d8c8;
}

.moyu-board { padding: 6px 22px 22px; }
.moyu-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; flex-wrap: wrap; }
.moyu-sizes { display: flex; gap: 4px; flex-wrap: nowrap; flex: 1; }
.moyu-chip, .moyu-chip-active {
  flex: 1 1 0; min-width: 0;
  padding: 5px 2px; border-radius: 10px;
  background: #f0f5f2; color: #6b8e7e; font-size: 11px; font-weight: 700; cursor: pointer;
  border: 1.5px solid transparent;
  font-family: 'Nunito Sans', system-ui, sans-serif;
  transition: all 0.15s ease;
  text-align: center;
}
.moyu-chip:hover { background: #e8f0ec; color: #4a7563; }
.moyu-chip-active {
  background: #dceae3; color: #3a6550; border-color: #b8d8c8;
}
.moyu-new-game {
  padding: 7px 14px; border: 0; border-radius: 10px;
  background: var(--moyu-accent); color: #fff;
  font-size: 13px; font-weight: 700; cursor: pointer;
  box-shadow: 0 6px 14px -8px rgba(14,165,164,0.7);
  transition: filter 0.12s ease;
}
.moyu-new-game:hover { filter: brightness(1.04); }
.moyu-stats { display: flex; align-items: stretch; gap: 12px; margin-bottom: 16px; width: min(100%, 468px); margin-left: auto; margin-right: auto; }
.moyu-stats-center { flex: 1; display: flex; gap: 10px; min-width: 0; }
.moyu-stat {
  flex: 1; display: flex; flex-direction: column; gap: 3px; align-items: center;
  padding: 10px 12px; border-radius: 14px;
  background: #f6f9f7;
  border: 1.5px solid #e8f0eb;
  text-align: center; min-width: 0;
}
.moyu-stat-value {
  font-size: 18px; font-weight: 800; color: #4a6358; font-variant-numeric: tabular-nums;
  font-family: 'Nunito Sans', system-ui, sans-serif;
}
.moyu-stat-label { font-size: 10px; font-weight: 700; color: #8fa89a; text-transform: uppercase; letter-spacing: 0.6px; }
.moyu-refresh {
  flex: none; aspect-ratio: 1/1; display: inline-flex; align-items: center; justify-content: center;
  border-radius: 14px;
  border: 1.5px solid transparent;
  background: #f0f5f2; color: #7a9a8a;
  cursor: pointer; transition: all 0.15s ease;
}
.moyu-refresh:hover { background: #e8f0ec; color: #4a7563; }
.moyu-refresh:active { transform: rotate(140deg); }
.moyu-grid-wrap { display: flex; justify-content: center; margin: 0 auto; }
.moyu-grid {
  --moyu-base: calc(468px / var(--moyu-cols));
  display: grid; grid-template-columns: repeat(var(--moyu-cols), minmax(0, 1fr));
  gap: clamp(3px, calc(var(--moyu-base) * 0.06), 5px);
  width: min(100%, calc(var(--moyu-cols) * var(--moyu-base)));
  padding: clamp(3px, calc(var(--moyu-base) * 0.06), 5px); border-radius: 16px;
  background: #f4f8f5;
  box-shadow: 0 0 0 1px #e4ece8 inset;
}
.moyu-tile, .moyu-tile-movable, .moyu-empty { aspect-ratio: 1/1; border-radius: clamp(6px, var(--moyu-base), 12px); }
.moyu-empty { background: transparent; }
.moyu-tile, .moyu-tile-movable {
  display: flex; align-items: center; justify-content: center;
  border: 0; font-size: calc(var(--moyu-base) * 0.26); font-weight: 800; color: #3a4152;
  user-select: none; transition: transform 0.08s ease, filter 0.12s ease;
  font-family: 'Nunito Sans', system-ui, sans-serif;
}
.moyu-tile {
  background: linear-gradient(155deg, hsl(var(--moyu-hue),58%,88%), hsl(calc(var(--moyu-hue) + 26),65%,80%));
  box-shadow: 0 1px 0 rgba(255,255,255,0.5) inset, 0 2px 6px -4px rgba(23,34,61,0.14);
}
.moyu-tile-movable {
  background: linear-gradient(155deg, hsl(var(--moyu-hue),65%,84%), hsl(calc(var(--moyu-hue) + 26),72%,76%));
  cursor: pointer; transform: scale(1);
}
.moyu-tile-movable:hover { }
.moyu-tile-movable:active { transform: scale(0.97); }
.moyu-tile-schulte, .moyu-tile-schulte-done {
  display: flex; align-items: center; justify-content: center;
  border: 0; font-size: calc(var(--moyu-base) * 0.26); font-weight: 800;
  user-select: none; font-family: 'Nunito Sans', system-ui, sans-serif;
  aspect-ratio: 1/1; border-radius: clamp(6px, var(--moyu-base), 12px);
}
.moyu-tile-schulte {
  background: #fff;
  color: #3a4a42;
  box-shadow: 0 1px 0 rgba(255,255,255,0.5) inset, 0 1px 3px -1px rgba(23,34,61,0.1);
  cursor: pointer;
}
.moyu-tile-schulte-done {
  background: #eef2f0;
  color: #b8c8c0;
  cursor: default;
}
.moyu-hint { margin: 10px 2px 12px; font-size: 12px; color: #9aada2; text-align: center; }
.moyu-grid-wrap { position: relative; }
.moyu-schulte-toast {
  position: absolute; inset: 0; z-index: 10;
  display: flex; align-items: center; justify-content: center;
  font-size: 15px; font-weight: 800; color: #4a7c6e;
  pointer-events: none;
}
.moyu-stat-bump { animation: moyu-bump 1s ease; }
.moyu-stat-red { color: #dc2626; }
@keyframes moyu-bump {
  0%   { transform: scale(1); }
  15%  { transform: scale(1.35); }
  70%  { transform: scale(1.35); }
  100% { transform: scale(1); }
}
.moyu-solved {
  margin: 10px 2px 0; padding: 9px 12px; border-radius: 12px;
  background: #e8f4ec; color: #4a7c59;
  font-size: 13px; font-weight: 700; text-align: center;
}

/* ------------------------------------------------------------- sudoku */
.moyu-sudoku-grid {
  display: grid; grid-template-columns: repeat(9, 1fr);
  width: min(100%, 414px); margin: 0 auto;
  border: 2px solid #9abfaa; border-radius: 8px; overflow: hidden;
  outline: none;
}
.moyu-sudoku-grid:focus { box-shadow: 0 0 0 3px rgba(158, 191, 170, 0.35); }
.moyu-sudoku-cell {
  aspect-ratio: 1/1; background: #fff;
  border: 0; border-right: 1px solid #e0ebe4; border-bottom: 1px solid #e0ebe4;
  font-size: 18px; font-weight: 600; color: #3a4a42;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; padding: 0;
  font-family: 'Nunito Sans', system-ui, sans-serif;
}
.moyu-sudoku-cell:hover { background: #f6f9f7; }
/* 宫格垂直边界 */
.moyu-sudoku-cell:nth-child(9n+3),
.moyu-sudoku-cell:nth-child(9n+6) {
  border-right-width: 2px; border-right-color: #9abfaa;
}
/* 宫格水平边界 */
.moyu-sudoku-cell:nth-child(n+19):nth-child(-n+27),
.moyu-sudoku-cell:nth-child(n+46):nth-child(-n+54) {
  border-bottom-width: 2px; border-bottom-color: #9abfaa;
}
/* 最右列无右边框 */
.moyu-sudoku-cell:nth-child(9n) { border-right: 0; }
/* 最下行无下边框 */
.moyu-sudoku-cell:nth-child(n+73) { border-bottom: 0; }
.moyu-sudoku-selected { background: #dcede3 !important; }
.moyu-sudoku-related { background: #f0f5f2; }
.moyu-sudoku-same { background: #dceae3; }
.moyu-sudoku-fixed { color: #1a2e25; font-weight: 800; }
.moyu-sudoku-error { color: #dc2626; }
.moyu-sudoku-notes { padding: 1px; }
.moyu-sudoku-cands {
  display: grid; grid-template-columns: repeat(3, 1fr);
  width: 100%; height: 100%; align-items: center; justify-items: center;
}
.moyu-sudoku-cand {
  font-size: 8px; font-weight: 600; color: #8fa89a;
  line-height: 1;
}
.moyu-sudoku-actions {
  display: flex; gap: 8px; justify-content: center;
  margin-top: 12px;
}
.moyu-sudoku-action {
  padding: 6px 14px; border-radius: 8px; border: 1.5px solid #e0ebe4;
  background: #fff; color: #5e8b7e; font-size: 12px; font-weight: 700;
  cursor: pointer; font-family: 'Nunito Sans', system-ui, sans-serif;
  transition: all 0.15s ease;
}
.moyu-sudoku-action:hover { background: #f0f5f2; }
.moyu-sudoku-action-active {
  background: #e8f4ec; border-color: #b8d8c8; color: #4a7c59;
}
.moyu-sudoku-numpad {
  display: flex; gap: 6px; justify-content: center;
  margin-top: 10px;
}
.moyu-sudoku-num {
  width: 34px; height: 34px; border-radius: 8px; border: 1.5px solid #e0ebe4;
  background: #fff; color: #3a4a42; font-size: 15px; font-weight: 700;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  font-family: 'Nunito Sans', system-ui, sans-serif;
  transition: all 0.12s ease;
}
.moyu-sudoku-num:hover { background: #f0f5f2; border-color: #b8d8c8; }
.moyu-sudoku-num:active { transform: scale(0.95); }

/* ------------------------------------------------------------- memory */
.moyu-memory-grid {
  display: grid; grid-template-columns: repeat(6, 1fr);
  width: min(100%, 414px); margin: 0 auto;
  gap: 5px;
}
.moyu-memory-cell {
  aspect-ratio: 1/1; background: #f6f9f7; border-radius: 8px;
  border: 1px solid #e8edea; font-size: 18px; font-weight: 700;
  color: #3a4a42; display: flex; align-items: center; justify-content: center;
  cursor: pointer; padding: 0;
  font-family: 'Nunito Sans', system-ui, sans-serif;
  transition: all 0.12s ease;
}
.moyu-memory-cell:hover { background: #eef2f0; }
.moyu-memory-cell:disabled {
  cursor: default; background: #f6f9f7; border-color: #e8edea;
}
.moyu-memory-active {
  background: linear-gradient(135deg, #b8dcc8 0%, #c8e8d4 100%) !important;
  border-color: #a0c8b0 !important; color: #3a5a42 !important;
}
.moyu-memory-hidden {
  background: linear-gradient(135deg, #b8dcc8 0%, #c8e8d4 100%) !important;
  border-color: #a0c8b0 !important;
}

/* ---- snake game: popup canvas ---- */
.moyu-snake-canvas-wrap {
  position: relative; width: 400px; max-width: 100%; margin: 0 auto;
  border-radius: 12px; overflow: hidden;
  background: #f6f9f7; border: 1px solid #e8edea;
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
  margin: 0; font-size: 18px; font-weight: 700; color: #4a6358;
  text-shadow: 0 1px 6px rgba(255,255,255,0.8);
}
.moyu-snake-score-final { font-size: 14px; margin-top: 4px; color: #6a8a7e; }
.moyu-snake-restart-overlay {
  margin-top: 10px; pointer-events: auto;
  border: 1px solid #5e8b7e; border-radius: 10px; padding: 5px 16px;
  font-size: 13px; background: rgba(184, 220, 200, 0.7); color: #3a5a42;
  cursor: pointer; font-family: 'Nunito Sans', system-ui, sans-serif;
  transition: background 0.15s ease;
}
.moyu-snake-restart-overlay:hover { background: rgba(168, 208, 188, 0.85); }

.moyu-settings-page { padding: 4px 0; }
.moyu-setting { margin-bottom: 16px; }
.moyu-setting-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.moyu-setting-label { font-size: 14px; font-weight: 700; color: var(--moyu-ink); font-family: 'Nunito Sans', system-ui, sans-serif; }
.moyu-setting-hint { margin: 4px 0 0; font-size: 12px; color: var(--moyu-ink-muted); }
.moyu-switch {
  position: relative; width: 44px; height: 26px; flex: none; cursor: pointer;
  background: #dde2ea; border-radius: 999px; transition: background 0.18s ease;
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
