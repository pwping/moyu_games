/**
 * 数独 (Sudoku) 核心逻辑 — 简单难度（唯一余数法可解）
 */
export interface SudokuCell {
    value: number | null;
    fixed: boolean;
    candidates: number[];
}
export interface SudokuBoard {
    cells: SudokuCell[];
    solution: number[];
    correctCount: number;
    errorCount: number;
    completed: boolean;
    selectedIndex: number | null;
    noteMode: boolean;
    history: HistoryEntry[];
    correctOnce: Set<number>;
    wrongOnce: Set<number>;
}
interface HistoryEntry {
    index: number;
    prevValue: number | null;
    prevCandidates: number[];
}
export declare function createBoard(): SudokuBoard;
export declare function selectCell(board: SudokuBoard, index: number): SudokuBoard;
export declare function inputNumber(board: SudokuBoard, num: number): SudokuBoard;
export declare function eraseCell(board: SudokuBoard): SudokuBoard;
export declare function undo(board: SudokuBoard): SudokuBoard;
export declare function getHint(board: SudokuBoard): SudokuBoard;
export declare function toggleNoteMode(board: SudokuBoard): SudokuBoard;
export declare function isRelated(indexA: number, indexB: number): boolean;
export declare function getBoxStart(index: number): number;
export { formatElapsed } from './puzzle.ts';
