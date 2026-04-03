# tt-cli

滴答清单（TickTick）命令行工具。

## 安装

```bash
npm install -g @wangjs-jacky/tt-cli
```

## 使用

### 首次登录

```bash
tt login
```

首次使用会提示输入 Client ID 和 Client Secret，需要先到 [TickTick 开发者平台](https://developer.ticktick.com/app) 注册应用。

注册时 Redirect URI 设置为：`http://localhost:3000/callback`

### 日常使用

```bash
tt whoami    # 查看登录状态
tt logout    # 登出
tt config    # 查看配置
```

## 开发

```bash
npm install        # 安装依赖
npm run build      # 构建
npm test           # 运行测试
npm run dev        # 监听模式开发
```

## License

MIT
