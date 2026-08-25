export interface MemoryCell {
    actual: number | null;
    revealed: boolean;
}
export interface MemoryBoard {
    cells: MemoryCell[];
    targetCount: number;
    currentStep: number;
    started: boolean;
    errorCount: number;
    maxErrors: number;
}
export declare function createBoard(targetCount?: number, errorCount?: number): MemoryBoard;
export declare function clickCell(board: MemoryBoard, index: number): MemoryBoard;
