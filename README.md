# threejs-vite-wx

Three.js 微信小游戏项目，使用 Vite 构建。

## 技术栈

- [Three.js](https://threejs.org/) r162（最后一个支持 WebGL1 的版本）
- [Vite](https://vitejs.dev/) 6.x

## 开发

```bash
npm install
npm run dev        # 浏览器开发服务器 http://localhost:5173
npm run build      # 构建到 dist/
```

## 微信开发者工具

1. `npm run build`
2. 微信开发者工具导入 `dist/` 目录
3. 不要点击「构建 npm」

## 项目结构

```
├── src/                  # 源码
│   ├── main.js           # Vite 入口（浏览器）
│   ├── game/
│   │   ├── Main.js       # 游戏主逻辑
│   │   └── KTXLoader.js  # KTX 纹理加载器
│   └── libs/
│       ├── weapp-adapter.js  # 微信适配器
│       └── symbol.js         # Symbol polyfill
├── public/               # 静态资源（构建时原样复制到 dist/）
│   ├── game.js           # 微信小游戏入口
│   ├── game.json         # 微信小游戏配置
│   ├── project.config.json
│   ├── images/
│   ├── audio/
│   └── js/libs/
├── index.html            # Vite HTML 入口
├── vite.config.js
└── package.json
```

## 环境适配

`Main.js` 自动检测运行环境：

- **微信小游戏**：使用 `weapp-adapter` 提供的全局 `canvas`，`WebGL1Renderer` 渲染
- **浏览器**：Three.js 自动创建 canvas，`WebGLRenderer` 渲染

## 注意事项

- Three.js ≥ r163 已移除 WebGL1 支持，微信小游戏仅支持 WebGL1，因此锁定 r162
