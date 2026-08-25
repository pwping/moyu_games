/**
 * 贪吃蛇核心逻辑：方格蛇，吃食物长尾巴，每段颜色来自食物。
 * 纯逻辑，不含渲染。
 */
export type Direction = 'up' | 'down' | 'left' | 'right';
export interface Point {
    x: number;
    y: number;
}
export interface FoodItem extends Point {
    /** 食物颜色 hsl 字符串 */
    color: string;
}
export interface SnakeState {
    /** [0] = 蛇头，last = 尾巴 */
    snake: Point[];
    /** 每段蛇的颜色（与 snake 等长） */
    colors: string[];
    direction: Direction;
    pendingDir: Direction;
    food: FoodItem;
    score: number;
    gameOver: boolean;
    won: boolean;
    cols: number;
    rows: number;
    tick: number;
}
export declare function createGame(cols?: number, rows?: number): SnakeState;
export declare function changeDirection(state: SnakeState, dir: Direction): void;
export declare function tick(state: SnakeState): SnakeState;
