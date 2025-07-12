# 小说动画互动展示系统 - 后端

## 概述

基于Python + FastAPI + LangGraph + Ollama的小说动画生成系统后端。

## 系统架构

### Agent Flow 设计

```
文本小说 → 章节分割 → 编导Agent → 导演Agent → 制作Agent → 剪辑Agent → 最终输出
```

### 各Agent职责

1. **编导Agent (ScriptAgent)**
   - 分析小说内容
   - 按章节创建剧本
   - 提取关键场景和对话

2. **导演Agent (DirectorAgent)**
   - 根据剧本设计场景
   - 规划视觉效果
   - 设计动画和镜头语言

3. **制作Agent (ProductionAgent)**
   - 生成场景图片
   - 创建语音素材
   - 生成CSS动画代码

4. **剪辑Agent (EditorAgent)**
   - 检查场景连贯性
   - 验证素材完整性
   - 优化整体流程

## 技术栈

- **FastAPI**: Web框架
- **LangGraph**: Agent工作流框架
- **Ollama**: 本地大模型推理
- **Pydantic**: 数据验证
- **aiohttp**: 异步HTTP客户端

## 安装和运行

### 1. 安装依赖

```bash
cd backend
pip install -r requirements.txt
```

### 2. 启动Ollama服务

```bash
# 安装Ollama (如果未安装)
curl -fsSL https://ollama.com/install.sh | sh

# 启动Ollama服务
ollama serve

# 拉取模型
ollama pull gemma3n:e4b
```

### 3. 启动后端服务

```bash
python run.py
```

## API文档

### 主要接口

- `POST /process-novel` - 上传并处理小说
- `GET /processing-status` - 获取处理状态(SSE)
- `GET /chapters` - 获取所有章节
- `GET /chapter/{id}` - 获取特定章节

### 使用示例

```python
import requests

# 上传小说
with open('novel.txt', 'rb') as f:
    response = requests.post('http://localhost:8000/process-novel', files={'file': f})

# 获取处理状态
import sseclient
messages = sseclient.SSEClient('http://localhost:8000/processing-status')
for msg in messages:
    print(msg.data)

# 获取章节
chapters = requests.get('http://localhost:8000/chapters').json()
```

## 配置

### 环境变量

- `OLLAMA_HOST`: Ollama服务地址 (默认: localhost:11434)
- `MODEL_NAME`: 使用的模型名称 (默认: gemma3n:e4b)
- `ASSETS_DIR`: 素材存储目录 (默认: assets)

### 文件结构

```
backend/
├── main.py              # FastAPI应用入口
├── run.py               # 启动脚本
├── models.py            # 数据模型
├── agent_flow.py        # LangGraph工作流
├── agents/              # Agent实现
│   ├── script_agent.py
│   ├── director_agent.py
│   ├── production_agent.py
│   └── editor_agent.py
├── utils/               # 工具函数
│   ├── file_utils.py
│   └── ollama_client.py
└── assets/              # 生成的素材
    ├── images/
    ├── audio/
    └── animations/
```

## 扩展功能

### 添加新的Agent

1. 在`agents/`目录创建新Agent类
2. 在`agent_flow.py`中注册新节点
3. 配置工作流边连接

### 集成外部服务

- **图像生成**: 可集成DALL-E、Midjourney等
- **语音合成**: 可集成OpenAI TTS、Azure Speech等
- **动画生成**: 可集成Lottie、CSS动画库等

## 故障排除

### 常见问题

1. **Ollama连接失败**
   - 检查Ollama服务是否启动
   - 确认端口11434是否开放

2. **模型生成质量差**
   - 尝试更大的模型
   - 优化提示词模板

3. **处理速度慢**
   - 使用GPU加速
   - 减少生成的场景数量

### 日志查看

```bash
# 查看应用日志
tail -f logs/app.log

# 查看Ollama日志
ollama logs
```