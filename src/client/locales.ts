/**
 * The `moyu-games` namespace dictionaries: copy for the sidebar foot action,
 * the floating game window, and the settings page.
 */

/** Simplified Chinese dictionary (the key-set source of truth). */
export const zh = {
  'entry.label': '摸鱼游戏',
  'entry.tooltip': '摸鱼游戏 · 数字华容道',
  'game.title': '摸鱼游戏',
  'game.subtitle': '数字华容道',
  'game.howTo': '点击与空格相邻的数字，把它滑进空格',
  'game.newGame': '新游戏',
  'game.size': '难度',
  'game.moves': '步数',
  'game.time': '用时',
  'game.solved': '完成！',
  'game.close': '关闭',
  'settings.title': '摸鱼游戏',
  'settings.description': '数字华容道：任务执行时自动弹窗。',
  'settings.enabled': '启用插件',
  'settings.enabledHint': '关闭后不再提供侧边栏入口与自动弹窗。',
  'settings.autoPopup': '任务开始时自动弹窗',
  'settings.autoPopupHint': '关闭后只在侧边栏点击「摸鱼游戏」时弹出。',
  'settings.defaultSize': '默认难度',
  'settings.defaultSizeHint': '新窗口打开时使用的棋盘尺寸（3x3~10x10）。',
  'settings.readOnly': '当前部署的设置只读。',
} satisfies Record<string, string>

/** The moyu-games key union. */
export type MoyuGamesKey = keyof typeof zh

/** English dictionary, checked complete against the zh key set. */
export const en = {
  'entry.label': 'Slacker game',
  'entry.tooltip': 'Slacker game · number slide puzzle',
  'game.title': 'Slacker game',
  'game.subtitle': 'Number slide puzzle',
  'game.howTo': 'Tap a tile next to the blank to slide it into the gap',
  'game.newGame': 'New game',
  'game.size': 'Size',
  'game.moves': 'Moves',
  'game.time': 'Time',
  'game.solved': 'Solved!',
  'game.close': 'Close',
  'settings.title': 'Slacker game',
  'settings.description': 'Number slide puzzle: pops up when a task runs.',
  'settings.enabled': 'Enable plugin',
  'settings.enabledHint': 'When off, the sidebar entry and auto-popup are hidden.',
  'settings.autoPopup': 'Auto-open on task start',
  'settings.autoPopupHint': 'When off, the game only opens from the sidebar entry.',
  'settings.defaultSize': 'Default size',
  'settings.defaultSizeHint': 'Board size used when a fresh window opens (3x3~10x10).',
  'settings.readOnly': 'This deployment stores settings read-only.',
} satisfies Record<MoyuGamesKey, string>
