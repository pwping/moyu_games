# moyu-games

DeepSeek Harness（DSH）的「摸鱼」小游戏插件。任务执行（一个 turn 或 step 启动）时，屏幕**右下角**会弹出小游戏窗口，让你在 agent 干活的同时摸一摸鱼。窗口默认贴右下角、可按住标题栏拖动。

<img src="images/1.png" alt="摸鱼游戏：右下角自动弹出的数字华容道窗口" width="100%" />

这是一个**独立的 DSH Web 插件**。它只使用官方 `@deepseek-ai/*` SDK 和官方 shell 槽位（`sidebar.footer.action`、`shell.overlay`、`settings.section`），不依赖任何插件族或 monorepo，**任何人都可以安装**。

整体视觉使用**微信绿**（`#07C160`）主题，包含5款小游戏。

## 截图
<div style="display:flex; gap:6px; align-items:flex-start;">
  <img src="images/2.png" alt="数字华容道" style="flex:1; min-width:0;" />
  <img src="images/3.png" alt="数独" style="flex:1; min-width:0;" />
  <img src="images/4.png" alt="贪吃蛇" style="flex:1; min-width:0;" />
  <img src="images/5.png" alt="舒尔特方格" style="flex:1; min-width:0;" />
  <img src="images/6.png" alt="数字记忆" style="flex:1; min-width:0;" />
</div>

## 功能

- **自动 / 手动开关（标题右侧，默认自动）。**
  - **自动**：每次任务发起（`task-start`）自动弹出游戏窗口。
  - **手动**：任务发起不再自动弹窗，需点击侧边栏左下角「摸鱼游戏」按钮才打开。
  - 开关写入设置命名空间的 `autoPopup`，与设置页一致。
- **任务执行时自动弹窗。** 宿主订阅 `session/event`，当 `turn/start` 或 `step/start` 启动时，通过 SSE 端点 `/api/moyu-games/events` 广播一个带单调递增任务号的 `task-start` 帧；浏览器在开启自动弹窗时弹出窗口并保持打开，直到你手动关闭（广播带防抖）。**手动关闭后，同一任务剩余部分不会自动重弹**；点按钮手动打开始终可用。下一个任务到来时（自动模式）会再次弹出。
- **右下角可拖动窗口。** 窗口固定在**右下角**（整体 80% 大小），可按住标题栏拖动（会限制在屏幕内，拖动后停留原位，下次打开回到右下角）。外层是一层全透明、可点击穿透的遮罩，下方任务日志始终可见可操作；只有窗口本身接收输入。
- **游戏本体（5 选 1，顶部 Tab 切换）：** 数字华容道 → 数独 → 贪吃蛇 → 舒尔特方格 → 数字记忆。
  - **数字华容道**：经典滑动拼图，点击与空格相邻的数字方块滑入空位，还原为 `1..n²`（空格在最后）。难度 3x3~10x10，带步数/用时。所有方块统一深微信绿，移动过程中不变色。规则：把数字 `1-n²-1` 按顺序排列好即可。
  - **数独**：9x9 标准数独，支持选择、键盘/数字键盘输入、笔记模式、撤销、擦除、提示；统计正确数/错误数/用时。规则：填入数字 1-9，每行每列每个 9 宫格数字都不重复。「笔记」按钮选中态为深微信绿。
  - **贪吃蛇**：Canvas 渲染的 30×30 方格蛇，方向键或鼠标控制方向，吃到彩色圆点变长，得分与游戏结束弹窗。规则：方向键或鼠标控制方向，吃彩色圆点变长。
  - **舒尔特方格**：把打乱的数字按 `1..n²` 顺序依次点击。难度 3x3~10x10，带「下一个数」与用时；点错的数字以深绿放大提示。规则：按 `1-n²` 的顺序依次点击数字（速度越快说明专注力越强）。已点中的数字用深微信绿显示。
  - **数字记忆**：6x6 格子，先记住 N 个数字的位置，再按顺序依次点击；统计错误数与用时。规则：记住数字位置，按 `1-N` 的顺序依次点击（速度越快说明记忆力越好）。
- **入口。** 侧边栏底部「设置」旁的「摸鱼游戏」行（官方 `sidebar.footer.action` 槽位，纯图标+文字、无背景框），以及自动弹窗。
- **配置** 在 设置 → 「摸鱼游戏」页面：总开关、自动弹窗、默认棋盘大小。

## 安装

### 前置条件

- **Node.js** `^22.19.0` 或 `>=24.0.0`（用于构建；仅安装使用已构建的 `lib/` 不强制要求）
- **DeepSeek Harness（DSH）** 已安装且 `dsh` 命令可用（`dsh --version` 能输出版本号）

### 方式一：给 Agent 的精简安装指令

> 这是插件仓库地址:`https://github.com/pwping/moyu_games` 帮我安装。


### 方式二：从本仓库 clone 后安装（推荐，本地开发或自用）

```sh
# 1. 克隆仓库到任意目录
git clone https://github.com/pwping/moyu_games.git
cd moyu_games

# 2.（可选）如需从源码重新构建，安装依赖并构建
#    仓库已提交构建产物 lib/，跳过此步也能直接安装
npm install
npm run build

# 3. 用 dsh 注册本插件（指向仓库根目录的绝对路径）
dsh plugin --profile web add /absolute/path/to/moyu_games
# Windows 示例：
# dsh plugin --profile web add E:/Vibe_CODE/moyu_games

# 4. 重启 dsh web 使插件加载
dsh web
# 若已在运行，先停止再重启：Ctrl+C 后重新执行 dsh web
```

安装完成后：
- 侧边栏底部「设置」旁出现「摸鱼游戏」行
- 自动模式下，任务（turn/step）开始时右下角自动弹出游戏窗口
- 设置 → 「摸鱼游戏」页可调整总开关 / 自动弹窗 / 默认棋盘大小



## 构建（仅在修改源码时需要）

```sh
npm install
npm run build
```

`npm run build` 生成 `lib/index.js`（宿主，一个 cordis 插件）和 `lib/client.js`（浏览器端，交给 DSH 闭包工厂客户端包）。`npm run typecheck` 和 `npm test` 用于校验源码。

## 配置

所有字段都在 设置 → 「摸鱼游戏」（对应 `moyu-games` 设置命名空间）：

| 字段 | 默认值 | 含义 |
| --- | --- | --- |
| `enabled` | `true` | 总开关。关闭后隐藏侧边栏入口和自动弹窗。 |
| `autoPopup` | `true` | 任务/turn 开始时自动弹出窗口（窗口内自动/手动开关也写这里）。 |
| `defaultSize` | `5` | 新窗口默认棋盘尺寸（默认 5x5；3x3 ~ 10x10）。 |
| `popupDebounceMs` | `2000` | 任务开始广播之间的最小间隔（毫秒）。 |
| `announceToAgent` | `true` | 是否在系统提示词中播报该插件。 |

## 安全模型

- 插件只挂载 UI 表面（侧边栏底部操作、右下角窗口、设置页），并打开一条**只读**的 SSE 流连接到 GUI 加载时所在的同源。它不写任何磁盘内容，不暴露任何状态或变更端点。
- 自动弹窗可通过 `autoPopup`（窗口内开关/设置页）关闭；窗口始终可手动关闭（按钮或 Escape），关闭后同一任务内不再自动重弹。

## 实现要点

- 宿主端：`src/index.ts`（一个 cordis 插件）+ `src/stream.ts`（SSE 广播器，带任务号与防抖）。注册设置命名空间和 `/api/moyu-games/events` 路由，并订阅 `session/event`。
- 浏览器端：`src/client/index.ts` 注册三个官方槽位并订阅 SSE 流；`src/client/ui.tsx` 渲染底部入口、右下角窗口、5 款游戏与设置页；`src/client/game/*` 是各游戏的纯逻辑引擎；`src/client/styles.ts` 注入微信绿样式表。
- `tsdown.config.ts` 构建宿主（ESM，SDK 外部化）和客户端（CJS 闭包工厂，交给 `window.__ModuleLoader__.load`，shell 的冻结模块表保持外部、其余全部内联）。

## License

MIT。
