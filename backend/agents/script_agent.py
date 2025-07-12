import asyncio
import json
import uuid
from typing import Dict, List, Any

class ScriptAgent:
    """编导Agent - 负责分析小说并创建剧本"""
    
    def __init__(self, ollama_client):
        self.ollama_client = ollama_client
        # self.model_name = "gemma3n:e4b" 
        self.model_name = "qwen3:4b"
    
    async def create_script(self, chapter_content: str, chapter_index: int) -> Dict[str, Any]:
        """为单个章节创建剧本"""
        
        # 构建提示词
        prompt = f"""
作为一个专业的编导，请分析以下小说章节内容，并创建一个详细的剧本。

章节内容：
{chapter_content}

请按照以下JSON格式输出剧本：
{{
    "chapter_title": "章节标题",
    "chapter_summary": "章节摘要",
    "scenes": [
        {{
            "id": "场景唯一ID",
            "title": "场景标题",
            "description": "场景描述",
            "dialogue": "主要对话或旁白",
            "emotion": "情感基调",
            "setting": "场景设置",
            "characters": ["角色列表"],
            "key_events": ["关键事件"],
            "duration": 30
        }}
    ]
}}

要求：
1. 根据章节内容长度划分场景个数，建议每个场景覆盖200-300字，每个章节建议3-8个场景；
2. 场景要有明确的视觉描述
3. 对话要简洁有力
4. 情感基调要准确
5. 场景持续时间要合理（15-60秒）
6. 确保场景之间的连贯性

请只返回JSON格式，不要包含其他文字。
"""
        
        try:
            # 调用Ollama生成剧本
            response = await self.ollama_client.generate(
                model=self.model_name,
                prompt=prompt,
                stream=False
            )
            
            # 解析响应
            script_text = response.get("response", "").strip()
            
            # 尝试解析JSON
            try:
                script_data = json.loads(script_text)
            except json.JSONDecodeError:
                # 如果JSON解析失败，尝试提取JSON部分
                script_data = self._extract_json_from_text(script_text)
            
            # 确保每个场景都有唯一ID
            for i, scene in enumerate(script_data.get("scenes", [])):
                if "id" not in scene:
                    scene["id"] = f"scene_{chapter_index}_{i}_{uuid.uuid4().hex[:8]}"
            
            return script_data
            
        except Exception as e:
            # 如果AI生成失败，返回默认剧本
            return self._create_default_script(chapter_content, chapter_index)
    
    def _extract_json_from_text(self, text: str) -> Dict[str, Any]:
        """从文本中提取JSON"""
        import re
        
        # 尝试找到JSON块
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group(0))
            except json.JSONDecodeError:
                pass
        
        # 如果找不到有效JSON，返回空结构
        return {
            "chapter_title": "未知章节",
            "chapter_summary": "章节摘要解析失败",
            "scenes": []
        }
    
    def _create_default_script(self, chapter_content: str, chapter_index: int) -> Dict[str, Any]:
        """创建默认剧本（当AI生成失败时使用）"""
        
        # 简单的章节分析
        lines = chapter_content.split('\n')
        non_empty_lines = [line.strip() for line in lines if line.strip()]
        
        # 提取可能的标题
        chapter_title = f"第 {chapter_index + 1} 章"
        if non_empty_lines:
            first_line = non_empty_lines[0]
            if len(first_line) < 50:  # 可能是标题
                chapter_title = first_line
        
        # 创建基本场景
        scenes = []
        content_chunks = self._split_content_into_chunks(chapter_content, 3)
        
        for i, chunk in enumerate(content_chunks):
            scene = {
                "id": f"scene_{chapter_index}_{i}_{uuid.uuid4().hex[:8]}",
                "title": f"场景 {i + 1}",
                "description": chunk[:200] + "..." if len(chunk) > 200 else chunk,
                "dialogue": chunk[:100] + "..." if len(chunk) > 100 else chunk,
                "emotion": "neutral",
                "setting": "未指定",
                "characters": ["主角"],
                "key_events": ["情节发展"],
                "duration": 30
            }
            scenes.append(scene)
        
        return {
            "chapter_title": chapter_title,
            "chapter_summary": f"第 {chapter_index + 1} 章内容摘要",
            "scenes": scenes
        }
    
    def _split_content_into_chunks(self, content: str, num_chunks: int) -> List[str]:
        """将内容分割成指定数量的块"""
        words = content.split()
        chunk_size = max(1, len(words) // num_chunks)
        
        chunks = []
        for i in range(0, len(words), chunk_size):
            chunk = ' '.join(words[i:i + chunk_size])
            chunks.append(chunk)
        
        return chunks[:num_chunks]  # 确保不超过指定数量