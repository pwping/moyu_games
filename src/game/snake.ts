/**
 * 贪吃蛇核心逻辑：方格蛇，吃食物长尾巴，每段颜色来自食物。
 * 纯逻辑，不含渲染。
 */

export type Direction = 'up' | 'down' | 'left' | 'right'

export interface Point { x: number; y: number }

export interface FoodItem extends Point {
  /** 食物颜色 hsl 字符串 */
  color: string
}

export interface SnakeState {
  /** [0] = 蛇头，last = 尾巴 */
  snake: Point[]
  /** 每段蛇的颜色（与 snake 等长） */
  colors: string[]
  direction: Direction
  pendingDir: Direction
  food: FoodItem
  score: number
  gameOver: boolean
  won: boolean
  cols: number
  rows: number
  tick: number
}

const DIRS: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

const OPPOSITE: Record<Direction, Direction> = {
  up: 'down', down: 'up', left: 'right', right: 'left',
}

const FOOD_HUES = [0, 30, 55, 120, 180, 210, 260, 320, 340]

function randomColor(): string {
  const h = FOOD_HUES[Math.floor(Math.random() * FOOD_HUES.length)]
  return `hsl(${h}, 75%, 60%)`
}

function randomFood(state: Pick<SnakeState, 'snake' | 'cols' | 'rows'>): FoodItem {
  const occupied = new Set(state.snake.map(p => `${p.x},${p.y}`))
  const free: Point[] = []
  for (let y = 0; y < state.rows; y++) {
    for (let x = 0; x < state.cols; x++) {
      if (!occupied.has(`${x},${y}`)) free.push({ x, y })
    }
  }
  if (free.length === 0) return { x: 0, y: 0, color: randomColor() }
  const pos = free[Math.floor(Math.random() * free.length)]
  return { ...pos, color: randomColor() }
}

export function createGame(cols = 30, rows = 30): SnakeState {
  const cx = Math.floor(cols / 2)
  const cy = Math.floor(rows / 2)
  const snake: Point[] = [{ x: cx, y: cy }]
  const state: SnakeState = {
    snake,
    colors: [randomColor()],
    direction: 'right',
    pendingDir: 'right',
    food: { x: 0, y: 0, color: randomColor() },
    score: 0,
    gameOver: false,
    won: false,
    cols,
    rows,
    tick: 0,
  }
  state.food = randomFood(state)
  return state
}

export function changeDirection(state: SnakeState, dir: Direction): void {
  if (state.gameOver || state.won) return
  if (dir === OPPOSITE[state.direction]) return
  state.pendingDir = dir
}

export function tick(state: SnakeState): SnakeState {
  if (state.gameOver || state.won) return state
  const dir = state.pendingDir
  const d = DIRS[dir]
  const head = state.snake[0]
  const newHead: Point = { x: head.x + d.x, y: head.y + d.y }

  if (newHead.x < 0 || newHead.x >= state.cols || newHead.y < 0 || newHead.y >= state.rows) {
    return { ...state, gameOver: true }
  }

  for (let i = 0; i < state.snake.length - 1; i++) {
    if (state.snake[i].x === newHead.x && state.snake[i].y === newHead.y) {
      return { ...state, gameOver: true }
    }
  }

  const newSnake = [newHead, ...state.snake]
  let food = state.food
  let score = state.score
  let won: boolean = state.won
  // 颜色数组与 snake 身份一一对应：移动时身份只是位置变了，颜色不变
  let colors = state.colors

  if (newHead.x === state.food.x && newHead.y === state.food.y) {
    score++
    // 吃食物：在末尾追加新尾巴节，颜色 = 被吃食物的颜色
    colors = [...state.colors, state.food.color]
    const nextState = { ...state, snake: newSnake }
    if (newSnake.length >= state.cols * state.rows) {
      won = true
    } else {
      food = randomFood(nextState)
    }
  } else {
    // 没吃食物：去掉最后一节尾巴（身份n-1被丢弃），前面的身份颜色保持不变
    newSnake.pop()
    colors = state.colors
  }

  return { ...state, snake: newSnake, colors, direction: dir, food, score, gameOver: false, won, tick: state.tick + 1 }
}
