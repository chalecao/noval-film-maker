# 小说动画互动展示系统

一个基于AI的小说动画生成和展示系统，能够将文本小说自动转换为精美的动画场景。

## 系统特点

### 🎬 AI驱动的创作流程
- **编导Agent**: 智能分析小说，按章节生成剧本
- **导演Agent**: 设计关键场景、动画效果和镜头语言
- **制作Agent**: 生成图片、语音和动画素材
- **剪辑Agent**: 检查连贯性，确保质量

### 🎨 精美的视觉效果
- 基于AI的场景图片生成
- 流畅的CSS动画效果
- 响应式设计，适配各种设备
- 现代化的用户界面

### 🎵 多媒体体验
- 文本转语音功能
- 背景音乐和音效
- 沉浸式的视觉体验
- 自动播放和手动控制

## 技术架构

### 前端 (React + TypeScript)
- **框架**: React 18 + TypeScript
- **样式**: Tailwind CSS
- **图标**: Lucide React
- **构建**: Vite

### 后端 (Python + FastAPI)
- **框架**: FastAPI
- **AI工作流**: LangGraph
- **大模型**: Ollama (Llama 3.1)
- **数据验证**: Pydantic
- **异步处理**: asyncio

### AI模型
- **文本生成**: Llama 3.1 8B
- **图像生成**: 支持多种AI图像API
- **语音合成**: TTS服务集成
- **动画生成**: AI辅助CSS动画

## 快速开始

### 环境要求
- Node.js >= 18
- Python >= 3.8
- Ollama服务

### 1. 克隆项目
```bash
git clone https://github.com/your-repo/novel-animation-system.git
cd novel-animation-system
```

### 2. 安装前端依赖
```bash
npm install
```

### 3. 安装后端依赖
```bash
cd backend
pip install -r requirements.txt
```

### 4. 启动Ollama服务
```bash
# 安装Ollama
curl -fsSL https://ollama.com/install.sh | sh

# 启动服务
ollama serve

# 拉取模型
ollama pull gemma3n:e4b
```

### 5. 启动应用
```bash
# 启动后端 (终端1)
cd backend
python run.py

# 启动前端 (终端2)
npm run dev
```

### 6. 访问应用
打开浏览器访问: http://localhost:5173

## 使用指南

### 上传小说
1. 点击上传区域选择txt格式的小说文件
2. 文件应包含明确的章节分割
3. 建议文件大小在1MB以内

### 处理流程
1. **章节分割**: 自动识别并分割章节
2. **剧本创建**: AI分析内容生成剧本
3. **场景设计**: 设计视觉效果和动画
4. **素材生成**: 生成图片、语音和动画
5. **质量检查**: 确保连贯性和完整性

### 播放控制
- 自动播放所有场景
- 手动控制播放/暂停
- 跳转到指定章节和场景
- 调整播放速度

## 项目结构

```
novel-animation-system/
├── src/                    # 前端源码
│   ├── App.tsx            # 主应用组件
│   ├── components/        # UI组件
│   └── utils/            # 工具函数
├── backend/              # 后端源码
│   ├── main.py           # FastAPI应用
│   ├── agents/           # AI Agent实现
│   ├── utils/            # 工具函数
│   └── models.py         # 数据模型
├── public/               # 静态资源
└── docs/                 # 文档
```

## 功能特性

### 已实现功能
- ✅ 文本小说上传和处理
- ✅ 智能章节分割
- ✅ AI剧本生成
- ✅ 场景设计和动画
- ✅ 多媒体播放界面
- ✅ 响应式设计

### 计划中功能
- 🔄 高级图像生成集成
- 🔄 背景音乐生成
- 🔄 用户自定义样式
- 🔄 导出为视频格式
- 🔄 社区分享功能

## 贡献指南

欢迎贡献代码！请查看 [CONTRIBUTING.md](CONTRIBUTING.md) 了解详细信息。

### 开发流程
1. Fork项目
2. 创建特性分支
3. 提交更改
4. 发起Pull Request

### 代码规范
- 使用TypeScript进行类型检查
- 遵循ESLint配置
- 编写测试用例
- 更新文档

## 许可证

本项目采用MIT许可证。详见 [LICENSE](LICENSE) 文件。

## 支持

如果您遇到问题或有建议，请：
1. 查看 [FAQ](docs/FAQ.md)
2. 提交 [Issue](https://github.com/your-repo/novel-animation-system/issues)
3. 联系开发团队

## 致谢

感谢以下开源项目的支持：
- [React](https://reactjs.org/)
- [FastAPI](https://fastapi.tiangolo.com/)
- [LangGraph](https://langchain-ai.github.io/langgraph/)
- [Ollama](https://ollama.com/)
- [Tailwind CSS](https://tailwindcss.com/)