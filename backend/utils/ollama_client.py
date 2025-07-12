import aiohttp
import asyncio
import json
from typing import Dict, Any, Optional

class OllamaClient:
    """Ollama客户端"""
    
    def __init__(self, base_url: str = "http://localhost:11434"):
        self.base_url = base_url
        self.session = None
    
    async def _get_session(self):
        """获取或创建HTTP会话"""
        if self.session is None:
            self.session = aiohttp.ClientSession()
        return self.session
    
    async def generate(self, model: str, prompt: str, stream: bool = False, **kwargs) -> Dict[str, Any]:
        """生成文本"""
        
        session = await self._get_session()
        
        payload = {
            "model": model,
            "prompt": prompt,
            "stream": stream,
            **kwargs
        }
        
        try:
            async with session.post(f"{self.base_url}/api/generate", json=payload) as response:
                if response.status == 200:
                    if stream:
                        return await self._handle_stream_response(response)
                    else:
                        return await response.json()
                else:
                    error_text = await response.text()
                    raise Exception(f"Ollama API错误: {response.status} - {error_text}")
        
        except aiohttp.ClientError as e:
            raise Exception(f"连接Ollama失败: {str(e)}")
    
    async def _handle_stream_response(self, response) -> Dict[str, Any]:
        """处理流式响应"""
        full_response = ""
        
        async for line in response.content:
            if line:
                try:
                    data = json.loads(line.decode('utf-8'))
                    if 'response' in data:
                        full_response += data['response']
                    if data.get('done', False):
                        break
                except json.JSONDecodeError:
                    continue
        
        return {"response": full_response}
    
    async def chat(self, model: str, messages: list, stream: bool = False, **kwargs) -> Dict[str, Any]:
        """聊天接口"""
        
        session = await self._get_session()
        
        payload = {
            "model": model,
            "messages": messages,
            "stream": stream,
            **kwargs
        }
        
        try:
            async with session.post(f"{self.base_url}/api/chat", json=payload) as response:
                if response.status == 200:
                    if stream:
                        return await self._handle_stream_response(response)
                    else:
                        return await response.json()
                else:
                    error_text = await response.text()
                    raise Exception(f"Ollama API错误: {response.status} - {error_text}")
        
        except aiohttp.ClientError as e:
            raise Exception(f"连接Ollama失败: {str(e)}")
    
    async def list_models(self) -> Dict[str, Any]:
        """列出可用模型"""
        
        session = await self._get_session()
        
        try:
            async with session.get(f"{self.base_url}/api/tags") as response:
                if response.status == 200:
                    return await response.json()
                else:
                    error_text = await response.text()
                    raise Exception(f"Ollama API错误: {response.status} - {error_text}")
        
        except aiohttp.ClientError as e:
            raise Exception(f"连接Ollama失败: {str(e)}")
    
    async def pull_model(self, model: str) -> Dict[str, Any]:
        """拉取模型"""
        
        session = await self._get_session()
        
        payload = {"name": model}
        
        try:
            async with session.post(f"{self.base_url}/api/pull", json=payload) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    error_text = await response.text()
                    raise Exception(f"Ollama API错误: {response.status} - {error_text}")
        
        except aiohttp.ClientError as e:
            raise Exception(f"连接Ollama失败: {str(e)}")
    
    async def check_model_exists(self, model: str) -> bool:
        """检查模型是否存在"""
        try:
            models = await self.list_models()
            model_names = [m['name'] for m in models.get('models', [])]
            return model in model_names
        except:
            return False
    
    async def close(self):
        """关闭会话"""
        if self.session:
            await self.session.close()
            self.session = None
    
    async def __aenter__(self):
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close()