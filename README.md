# moyu-games

DeepSeek Harness（DSH）的"摸鱼"拼图插件。当任务开始执行（一个 turn 或 step 启动）时，屏幕右下角会弹出数字华容道（滑动数字拼图）窗口，让你在 agent 干活的同时摸鱼。可选 3x3 ~ 10x10，玩完关掉即可——侧边栏底部"设置"旁边还有一个"摸鱼游戏"入口。

这是一个**独立的 DSH Web 插件**。它只使用官方 `@deepseek-ai/*` SDK 和官方 shell 槽位（`sidebar.footer.action`、`shell.overlay`、`settings.section`），不依赖任何插件族或 monorepo，**任何人都可以安装**。

## 功能

- **任务执行时自动弹窗。** 宿主订阅 `session/event` 事件流，当 turn 或 step 开始（`turn/start`、`step/start`）时，通过 SSE 端点 `/api/moyu-games/events` 广播一个 `task-start` 帧（带单调递增的任务号，每次 `turn/start` 都会 +1）；浏览器在开启自动弹窗时弹出游戏窗口，并保持打开直到你手动关闭。广播做了防抖，这样一条用户消息不会反复弹窗。**手动关闭后，同一任务剩余部分不再弹出**，下一个任务到来时又会弹出。
- **游戏本体。** 经典滑动数字拼图（"数字华容道"）。点击与空格相邻的数字方块把它滑入空位，把方块还原成 `1..n²`（空格在最后）。难度 3x3 ~ 10x10 可选，带步数/计时统计和完成状态。开新局时空格固定从右下角最后位置起步。
- **入口。** 侧边栏底部"设置"旁的"摸鱼游戏"行（官方 `sidebar.footer.action` 槽位），以及任务开始时的自动弹窗。窗口浮动在**右下角**，覆盖在一层**全透明、可点击穿透**的遮罩上（下方的任务日志依然可见可操作），可以通过标题栏**拖到任意位置**；每次重新打开都会回到右下角锚点。
- **控制区。** 步数、用时在中间居中显示，右侧是一个**圆形箭头刷新按钮**（同一行）；棋盘盒子固定为 6×6 的尺寸（格子数变化时盒子大小不变，格子自适应铺满），并可通过工具栏的**滑块**整体缩放，内部的格子、间距、字号会随之等比缩放。
- **配置** 在 设置 → "摸鱼游戏" 页面：总开关、自动弹窗、默认棋盘大小。

## 安装

已构建的 `lib/` 已提交，因此安装无需构建。

### 从本地目录

```sh
dsh plugin --profile web add E:/Vibe_CODE/moyu_games
# 或者，如果 `dsh` 在 PATH 上且使用默认 profile：
dsh plugin add ./moyu_games
```

### 发布到 npm 后

```sh
dsh plugin --profile web add <your-npm-scope>/moyu-games
```

重启 `dsh web`。侧边栏底部"设置"旁会出现"摸鱼游戏"行，任务开始时会弹出游戏窗口。

## 构建（仅在修改源码时需要）

```sh
npm install
npm run build
```

`npm run build` 生成 `lib/index.js`（宿主，一个 cordis 插件）和 `lib/client.js`(浏览器端，交给 DSH 的闭包工厂客户端包)。`npm run typecheck` 和 `npm test` 用于校验源码。

## 配置

所有字段都在 设置 → "摸鱼游戏"（对应 `moyu-games` 设置命名空间）：

| 字段 | 默认值 | 含义 |
| --- | --- | --- |
| `enabled` | `true` | 总开关。关闭后隐藏侧边栏入口和自动弹窗。 |
| `autoPopup` | `true` | 任务/turn 开始时自动弹出窗口。 |
| `defaultSize` | `5` | 新窗口默认棋盘尺寸（默认 5x5；3x3 ~ 10x10）。 |
| `popupDebounceMs` | `2000` | 任务开始广播之间的最小间隔（毫秒）。 |
| `announceToAgent` | `true` | 是否在系统提示词中播报该插件。 |

## 安全模型

- 插件只挂载 UI 表面（侧边栏底部操作、遮罩、设置页），并打开一条**只读**的 SSE 流连接到 GUI 加载时所在的同源。它不写任何磁盘内容，不暴露任何状态或变更端点。
- 自动弹窗可通过 `autoPopup` 关闭；窗口始终可手动关闭（按钮或 Escape）。

## 构建方式

- 宿主端：`src/index.ts`（一个 cordis 插件）+ `src/stream.ts`（SSE 广播器）。注册设置命名空间和 `/api/moyu-games/events` 路由，并订阅 `session/event`。
- 浏览器端：`src/client/index.ts` 注册三个官方槽位并订阅 SSE 流；`src/client/ui.tsx` 渲染底部入口、遮罩、拼图游戏和设置页；`src/client/styles.ts` 注入样式表。
- `tsdown.config.ts` 构建宿主（ESM，SDK 外部化）和客户端（CJS 闭包工厂，交给 `window.__ModuleLoader__.load`，shell 的冻结模块表保持外部、其余全部内联）。

## License

Apache-2.0。