/**
 * Digital Huarong Road (sliding-number-puzzle) engine — pure, framework-free.
 *
 * The board is a flat array of length size*size. Index `i` holds the tile
 * value at row floor(i/size), column i%size; `0` is the blank. A tile that is
 * orthogonal-adjacent to the blank can be slid into it (a swap). The goal is
 * [1,2,...,size*size-1,0].
 */
/** Flat board: index -> tile value (0 = blank). Length = size*size. */
export type Board = number[];
/** Valid difficulty sizes: 3x3 .. 10x10. */
export declare const SIZES: readonly [3, 4, 5, 6, 7, 8, 9, 10];
export type PuzzleSize = (typeof SIZES)[number];
/** The solved board for a given size. */
export declare function goalBoard(size: number): Board;
/** Index of the blank (the `0` cell). */
export declare function blankIndexOf(board: Board): number;
/** Indices orthogonally adjacent to `index` within a size x size grid. */
export declare function adjacentIndices(index: number, size: number): number[];
/** Whether the tile at `index` can slide into the blank (it is adjacent). */
export declare function canMove(board: Board, index: number, size: number): boolean;
/** Slide the tile at `index` into the blank; returns a new board (no-op if illegal). */
export declare function applyMove(board: Board, index: number, size: number): Board;
/**
 * Whether the tile at `index` shares a row or a column with the blank.
 * When true, clicking this tile slides the whole segment toward the blank.
 */
export declare function canSlide(board: Board, index: number, size: number): boolean;
/**
 * Slide the whole row/column segment between `index` and the blank so the
 * blank ends up at `index`. Returns a new board (no-op if not on the same
 * row/column).
 */
export declare function applySlide(board: Board, index: number, size: number): Board;
/** Whether the board is the solved goal state. */
export declare function isSolved(board: Board): boolean;
/** Count of inversions (pairs of tiles out of ascending order, blank ignored). */
export declare function inversionsOf(board: Board): number;
/**
 * Standard 15-puzzle solvability:
 *  - odd width: solvable iff the inversion count is even.
 *  - even width: solvable iff (inversions + blank row from the bottom) is odd.
 */
export declare function isSolvable(board: Board, size: number): boolean;
/**
 * Return a board identical to `board` except the blank has been walked to the
 * bottom-right corner (last index) via legal slides. The blank moves right to
 * the last column, then down to the last row. Solvability is preserved — this
 * is a sequence of adjacent slides, so no tile multiset or parity changes.
 */
export declare function moveBlankToBottomRight(board: Board, size: number): Board;
/**
 * Uniform pseudo-random source: returns a number in [0, 1).
 */
export type Rng = () => number;
/**
 * Shuffle the goal by a long random walk of legal slides (never undoing the
 * last move), which is guaranteed to produce a solvable board. Re-runs a few
 * times if it accidentally lands back on the goal.
 * @param size - grid dimension (3..10).
 * @param rng - injectable randomness for deterministic tests.
 */
export declare function shuffledBoard(size: number, rng?: Rng, maxAttempts?: number): Board;
/** Format a second count as `m:ss` (or `s` under a minute). */
export declare function formatElapsed(totalSeconds: number): string;
