# 详细安装指南

## 系统环境要求

### 最低配置
- **操作系统**: Windows 10+, macOS 10.15+, Ubuntu 18.04+
- **内存**: 8GB RAM (推荐16GB+)
- **存储**: 10GB可用空间
- **网络**: 稳定的互联网连接

### 推荐配置
- **CPU**: 8核心以上
- **GPU**: 支持CUDA的显卡 (用于AI加速)
- **内存**: 16GB+ RAM
- **存储**: SSD存储

## 详细安装步骤

### 1. 安装Node.js

#### Windows
```bash
# 下载并安装Node.js LTS版本
# 访问: https://nodejs.org/

# 验证安装
node --version
npm --version
```

#### macOS
```bash
# 使用Homebrew安装
brew install node

# 或下载官方安装包
# 访问: https://nodejs.org/
```

#### Ubuntu/Debian
```bash
# 使用NodeSource仓库
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

### 2. 安装Python

#### Windows
```bash
# 下载并安装Python 3.8+
# 访问: https://www.python.org/downloads/

# 验证安装
python --version
pip --version
```

#### macOS
```bash
# 使用Homebrew安装
brew install python@3.11

# 验证安装
python3 --version
pip3 --version
```

#### Ubuntu/Debian
```bash
# 安装Python 3.8+
sudo apt update
sudo apt install python3 python3-pip python3-venv

# 验证安装
python3 --version
pip3 --version
```

### 3. 安装Ollama

#### Windows
```bash
# 下载并安装Ollama
# 访问: https://ollama.com/download/windows

# 或使用包管理器
winget install Ollama.Ollama
```

#### macOS
```bash
# 下载并安装Ollama
# 访问: https://ollama.com/download/mac

# 或使用Homebrew
brew install ollama
```

#### Linux
```bash
# 使用安装脚本
curl -fsSL https://ollama.com/install.sh | sh

# 或手动下载
wget https://ollama.com/download/linux
chmod +x ollama-linux-amd64
sudo mv ollama-linux-amd64 /usr/local/bin/ollama
```

### 4. 启动Ollama服务

```bash
# 启动Ollama服务
ollama serve

# 在新终端中拉取模型
ollama pull gemma3n:e4b

# 验证模型安装
ollama list
```

### 5. 克隆项目

```bash
# 克隆项目
git clone https://github.com/your-repo/novel-animation-system.git
cd novel-animation-system

# 或下载ZIP包并解压
```

### 6. 安装项目依赖

#### 前端依赖
```bash
# 安装前端依赖
npm install

# 如果遇到网络问题，可以使用淘宝镜像
npm install --registry=https://registry.npm.taobao.org
```

#### 后端依赖
```bash
# 进入后端目录
cd backend

# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

# 安装Python依赖
pip install -r requirements.txt

# 如果遇到网络问题，可以使用清华镜像
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
```

### 7. 配置环境变量

创建 `.env` 文件：
```bash
# 在项目根目录创建.env文件
touch .env

# 编辑环境变量
cat > .env << EOF
# Ollama配置
OLLAMA_HOST=http://localhost:11434
MODEL_NAME=gemma3n:e4b

# 后端配置
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000

# 前端配置
VITE_API_URL=http://localhost:8000
EOF
```

### 8. 测试安装

#### 测试Ollama
```bash
# 测试Ollama连接
curl http://localhost:11434/api/tags

# 测试模型生成
ollama run gemma3n:e4b "Hello, how are you?"
```

#### 测试后端
```bash
# 进入后端目录
cd backend

# 启动后端服务
python run.py

# 在新终端测试API
curl http://localhost:8000/
```

#### 测试前端
```bash
# 在项目根目录
npm run dev

# 访问 http://localhost:5173
```

## 常见问题解决

### 1. Ollama连接失败

**问题**: 连接Ollama服务失败
**解决**:
```bash
# 检查Ollama服务状态
ps aux | grep ollama

# 重启Ollama服务
pkill ollama
ollama serve

# 检查端口占用
lsof -i :11434
```

### 2. Python依赖安装失败

**问题**: pip安装依赖失败
**解决**:
```bash
# 升级pip
pip install --upgrade pip

# 使用国内镜像
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple

# 如果遇到编译错误，安装编译工具
# Ubuntu/Debian
sudo apt-get install build-essential python3-dev

# macOS
xcode-select --install
```

### 3. 内存不足

**问题**: 处理大型小说时内存不足
**解决**:
```bash
# 限制Ollama内存使用
export OLLAMA_MAX_MEMORY=4GB

# 分批处理章节
# 在代码中设置批处理大小
```

### 4. 模型下载慢

**问题**: 下载Ollama模型速度慢
**解决**:
```bash
# 使用国内镜像
export OLLAMA_REGISTRY=https://registry.ollama.com

# 或手动下载模型文件
# 访问 https://ollama.com/models
```

### 5. 端口冲突

**问题**: 端口被占用
**解决**:
```bash
# 检查端口占用
lsof -i :8000
lsof -i :5173
lsof -i :11434

# 修改端口配置
# 编辑 .env 文件
BACKEND_PORT=8001
```

## 性能优化

### 1. GPU加速

```bash
# 检查GPU支持
nvidia-smi

# 配置Ollama使用GPU
export OLLAMA_GPU=1
```

### 2. 内存优化

```bash
# 设置最大内存使用
export OLLAMA_MAX_MEMORY=8GB

# 优化Python内存
export PYTHONMALLOC=malloc
```

### 3. 并发处理

```bash
# 设置并发数
export MAX_WORKERS=4

# 配置异步处理
export ASYNC_BATCH_SIZE=2
```

## 开发环境配置

### 1. 代码编辑器

推荐使用 VS Code 并安装以下插件：
- Python
- TypeScript
- Tailwind CSS IntelliSense
- ESLint
- Prettier

### 2. 调试配置

创建 `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Python: FastAPI",
      "type": "python",
      "request": "launch",
      "program": "backend/run.py",
      "console": "integratedTerminal",
      "cwd": "${workspaceFolder}"
    }
  ]
}
```

### 3. 测试配置

```bash
# 安装测试依赖
npm install --save-dev jest @testing-library/react

# 后端测试
cd backend
pip install pytest pytest-asyncio
```

## 部署准备

### 1. 生产环境构建

```bash
# 前端构建
npm run build

# 后端打包
cd backend
pip install gunicorn
```

### 2. Docker部署

```bash
# 构建Docker镜像
docker-compose build

# 启动服务
docker-compose up -d
```

这份详细的安装指南应该能帮助用户成功搭建开发环境。如果遇到其他问题，请查看项目文档或提交Issue。