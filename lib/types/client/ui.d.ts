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
import type { InjectFace, PropsLocale, PropsRuntime, TranslateNS } from '@deepseek-ai/dsh-client-ui-slots';
import type { SettingsScope } from '@deepseek-ai/dsh-client-runtime/client';
import type { GameController } from './controller.ts';
/** The moyu-games settings section fields. */
export interface MoyuGamesSettings {
    enabled?: boolean;
    autoPopup?: boolean;
    defaultSize?: number;
}
type FooterFace = {
    controller: GameController;
};
export type FooterEntryProps = PropsRuntime<'sidebar.footer.action'> & InjectFace<FooterFace> & PropsLocale<'moyu-games'>;
/** The sidebar foot action row: click to open the game window. */
export declare function FooterEntry(props: FooterEntryProps): import("react").JSX.Element;
type OverlayFace = {
    controller: GameController;
    defaultSize: number;
    scope: SettingsScope<MoyuGamesSettings>;
};
export type GameOverlayProps = PropsRuntime<'shell.overlay'> & InjectFace<OverlayFace> & PropsLocale<'moyu-games'>;
/**
 * The floating game window: docked to the bottom-right corner and draggable by
 * its header. The overlay wrapper is click-through so the task log underneath
 * stays visible and usable (only the panel itself takes input). Each open
 * re-anchors to the bottom-right corner; dragging moves it (clamped to the
 * viewport) and it stays where you leave it until you close it.
 */
export declare function GameOverlay(props: GameOverlayProps): import("react").JSX.Element;
/** The puzzle board's locale reader (the namespace-bound translate). */
type LocaleReader = TranslateNS<'moyu-games'>;
/** Props for the puzzle board. */
export interface SlidingPuzzleProps {
    t: LocaleReader;
    /** Whether the floating window is open (false → pause the timer). */
    open?: boolean;
    defaultSize?: number;
}
/** The digital Huarong Road board. State is persisted to localStorage. */
export declare function SlidingPuzzle({ t, open, defaultSize }: SlidingPuzzleProps): import("react").JSX.Element;
/** 舒尔特方格：按 1,2,3… 顺序依次点击。 */
export declare function SchulteGrid({ t, open, defaultSize }: SlidingPuzzleProps): import("react").JSX.Element;
/** 9×9 数独棋盘。 */
export declare function SudokuBoard({ t, open }: {
    t: LocaleReader;
    open?: boolean;
}): import("react").JSX.Element;
type SectionFace = {
    scope: SettingsScope<MoyuGamesSettings>;
};
export type SettingsSectionProps = PropsRuntime<'settings.section'> & InjectFace<SectionFace> & PropsLocale<'moyu-games'>;
/** The plugin settings page bound to the `moyu-games` namespace. */
export declare function SettingsSection(props: SettingsSectionProps): import("react").JSX.Element | null;
export {};
