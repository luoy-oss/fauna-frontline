# 🐾 兽阵前线 (Fauna Frontline)

动物对战策略游戏，支持双人在线对战。

## 游戏规则

- 4×7 棋盘，共 28 枚棋子随机暗置（每方 14 枚）
- 暗棋状态下双方均不知道棋子归属，翻面后才可见
- 棋子大小：🐘象 > 🦁狮 > 🐅虎 > 🐆豹 > 🐺狼 > 🐕狗 > 🐱猫 > 🐀鼠

### 回合操作（每回合执行一次）

| 操作 | 说明 |
|------|------|
| 翻开 | 点击任意暗棋，揭示其归属和类型 |
| 移动 | 选中己方明棋，点击相邻空格 |
| 吃子 | 选中己方明棋，点击相邻敌方明棋（大吃小） |

- 同级吃子：双方同归于尽
- 胜利条件：吃光对方所有棋子

## 技术栈

- **框架**：Next.js 14 (App Router)
- **语言**：TypeScript
- **样式**：Tailwind CSS
- **数据库**：Upstash Redis

## 本地运行

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

在 [Upstash Console](https://console.upstash.com/) 创建 Redis 数据库，然后在项目根目录创建 `.env.local`：

```bash
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxx...
```

### 3. 启动

```bash
npm run dev
```

浏览器打开 http://localhost:3000

## 部署到 Vercel

1. 在 [Vercel](https://vercel.com) 导入本仓库
2. 进入项目 **Storage** → 创建 **Upstash Redis** 数据库
3. 环境变量会自动注入，点击 **Redeploy** 即可

## 如何对战

1. 玩家 1 点击「创建游戏」，获得 6 位游戏码
2. 玩家 2 输入游戏码点击「加入游戏」
3. 双方轮流操作，翻棋、移动、吃子
4. 吃光对方棋子即获胜
