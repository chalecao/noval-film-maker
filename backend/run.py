#!/usr/bin/env python3

import asyncio
import uvicorn
import sys
from pathlib import Path

# 添加当前目录到Python路径
sys.path.insert(0, str(Path(__file__).parent))

async def check_ollama_connection():
    """检查Ollama连接"""
    from utils.ollama_client import OllamaClient
    
    print("检查Ollama连接...")
    try:
        async with OllamaClient() as client:
            models = await client.list_models()
            print(f"✓ Ollama连接成功，可用模型: {len(models.get('models', []))} 个")
            
            # 检查是否有gemma3n:e4b模型
            if not await client.check_model_exists("gemma3n:e4b"):
                print("⚠️  警告: 未找到gemma3n:e4b模型")
                print("   请运行: ollama pull gemma3n:e4b")
            else:
                print("✓ gemma3n:e4b 模型已就绪")
                
    except Exception as e:
        print(f"✗ Ollama连接失败: {e}")
        print("请确保Ollama服务已启动，并运行 'ollama serve'")
        return False
    
    return True

def main():
    """主函数"""
    print("启动小说动画互动展示系统...")
    
    # 检查Ollama连接
    if not asyncio.run(check_ollama_connection()):
        print("请先启动Ollama服务后再运行此程序")
        return
    
    print("启动Web服务器...")
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

if __name__ == "__main__":
    main()