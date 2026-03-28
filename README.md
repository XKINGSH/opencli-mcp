# opencli-mcp

把 [opencli](https://github.com/jackwener/opencli) 包装成 MCP Server，让 AI Agent 可以直接调用 390 个命令，覆盖 65 个平台。

## 包含的工具

| 工具 | 说明 |
|------|------|
| `opencli` | 运行任意 opencli 命令 |
| `opencli_list` | 列出所有可用命令 |
| `opencli_help` | 获取某个站点/命令的帮助 |

## 前置条件

- Node.js 18+
- opencli 已安装（见下方）

## 安装 opencli

```bash
git clone https://github.com/jackwener/opencli.git
cd opencli
npm install
npm run build
```

## 安装 opencli-mcp

```bash
git clone https://github.com/XKINGSH/opencli-mcp.git
cd opencli-mcp
npm install
# dist/index.js 已包含，无需构建
```

## 运行 MCP Server

```bash
# 默认路径（opencli 在 ~/opencli/dist/main.js）
node /path/to/opencli-mcp/dist/index.js

# 自定义 opencli 路径
OPENCLI_PATH=/your/path/to/opencli/dist/main.js node /path/to/opencli-mcp/dist/index.js
```

## 接入 Kollab

在 Kollab 控制台 → MCP 连接器 → 新建，选择 **stdio** 类型，填写：

```json
{
  "command": "node",
  "args": ["/absolute/path/to/opencli-mcp/dist/index.js"],
  "env": {
    "OPENCLI_PATH": "/absolute/path/to/opencli/dist/main.js"
  }
}
```

> 路径必须是绝对路径。macOS 用户一般是 `/Users/yourname/...`

## 命令示例（AI 调用形式）

```
opencli(site="hackernews", command="top")
opencli(site="arxiv", command="search", args=["LLM agent"], options={"limit": "10"})
opencli(site="zhihu", command="hot")
opencli(site="wikipedia", command="summary", args=["Claude Shannon"])
opencli(site="github", command="trending")
```

## 命令策略说明

- `[public]` — 91 个命令，直接 HTTP，无需登录
- `[cookie]` — 219 个命令，需要浏览器会话（需配合 Browser Bridge）
- `[intercept]` — 11 个命令，CDP 网络拦截
- `[ui]` — 桌面自动化

`[public]` 命令可以直接用，其他类型需要额外配置 Browser Bridge。
