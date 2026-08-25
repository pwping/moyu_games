/**
 * 舒尔特方格 (Schulte Grid) 核心逻辑
 *
 * 规则：在 n×n 格子中随机填入 1~n² 的数字，玩家按 1,2,3... 顺序依次点击。
 * 点错无反应，点完全部数字后完成。
 */
/** 棋盘状态 */
export interface SchulteBoard {
    size: number;
    values: number[];
    currentTarget: number;
    completed: boolean;
}
/** 创建一个 size×size 的随机舒尔特方格。 */
export declare function createBoard(size: number): SchulteBoard;
/** 点击 index 位置的格子；点对了返回新状态，点错返回 null。 */
export declare function clickBoard(board: SchulteBoard, index: number): SchulteBoard | null;
/** 判断某个 index 的数字是否已经被点过。 */
export declare function isDone(board: SchulteBoard, index: number): boolean;
/** 判断某个 index 的数字是否是当前目标。 */
export declare function isTarget(board: SchulteBoard, index: number): boolean;
export { formatElapsed } from './puzzle.ts';
