import asyncio
import json
import uuid
from typing import Dict, List, Any

class DirectorAgent:
    """导演Agent - 负责根据剧本设计关键场景"""
    
    def __init__(self, ollama_client):
        self.ollama_client = ollama_client
        self.model_name = "gemma3n:e4b"
        # self.model_name = "qwen3:4b"
    
    async def design_scenes(self, script: Dict[str, Any], revision_suggestions: List[Dict] = []) -> List[Dict[str, Any]]:
        """为剧本设计场景（支持修正建议）"""
        
        scene_designs = []
        
        for scene in script.get("scenes", []):
            try:
                design = await self._design_single_scene(scene, script.get("chapter_title", ""), revision_suggestions)
                scene_designs.append(design)
            except Exception as e:
                # 如果设计失败，创建默认设计
                print(f"场景设计失败: {str(e)}")
                design = self._create_default_scene_design(scene)
                scene_designs.append(design)
        
        return scene_designs
    
    async def _design_single_scene(self, scene: Dict[str, Any], chapter_title: str, revision_suggestions: List[Dict] = []) -> Dict[str, Any]:
        """设计单个场景（支持修正建议）"""

        # Add revision suggestions to prompt if available
        revision_prompt = ""
        if revision_suggestions:
            revision_prompt = f"\n修正建议：{json.dumps(revision_suggestions, ensure_ascii=False)}（请优先遵循修正建议）"
        
        prompt = f"""
作为一个专业的导演，请为以下场景设计详细的视觉效果、动画和呈现方式。{revision_prompt} 

章节标题：{chapter_title}
场景信息：
- 标题：{scene.get('title', '')}
- 描述：{scene.get('description', '')}
- 对话：{scene.get('dialogue', '')}
- 情感：{scene.get('emotion', '')}
- 设置：{scene.get('setting', '')}

请按照以下JSON格式输出场景设计：
{{
    "scene_id": "{scene.get('id', '')}",
    "visual_description": "详细的视觉场景描述，包括环境、光线、色彩、构图等",
    "image_prompt": "用于生成场景图片的AI提示词（英文）",
    "dialogue_text": "精炼的对话或旁白文本, 和输入的语言保持一致",
    "animation_effects": "动画效果描述",
    "css_animation": "CSS动画代码",
    "camera_angle": "镜头角度",
    "mood": "情绪氛围",
    "color_palette": "色彩调色板",
    "duration": {scene.get('duration', 30)}
}}

要求：
1. 视觉描述要生动具体，适合AI图像生成
2. 动画效果要简洁优雅
3. CSS动画代码要可执行
4. 镜头角度要有电影感
5. 色彩搭配要符合情绪
6. dialogue_text 要和输入的语言保持一致，输入是中文，这个输出也是中文

请只返回JSON格式，不要包含其他文字。
"""
        
        response = await self.ollama_client.generate(
            model=self.model_name,
            prompt=prompt,
            stream=False
        )
        
        # 解析响应
        design_text = response.get("response", "").strip()
        
        print(f"design_text: {design_text}")
        try:
            design_data = json.loads(design_text)
        except json.JSONDecodeError:
            design_data = self._extract_json_from_text(design_text)
        
        # 确保有scene_id
        if "scene_id" not in design_data:
            design_data["scene_id"] = scene.get("id", f"scene_{uuid.uuid4().hex[:8]}")
        
        return design_data
    
    def _extract_json_from_text(self, text: str) -> Dict[str, Any]:
        """从文本中提取JSON"""
        import re
        
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group(0))
            except json.JSONDecodeError:
                pass
        
        return {}
    
    def _create_default_scene_design(self, scene: Dict[str, Any]) -> Dict[str, Any]:
        """创建默认场景设计"""
        
        scene_id = scene.get("id", f"scene_{uuid.uuid4().hex[:8]}")
        
        # 基于场景信息创建默认设计
        emotion = scene.get("emotion", "neutral")
        setting = scene.get("setting", "室内")
        
        # 情感到颜色的映射
        emotion_colors = {
            "happy": ["#FFD700", "#FFA500", "#FF6B6B"],
            "sad": ["#4A90E2", "#6C7B7F", "#B0BEC5"],
            "angry": ["#FF4444", "#CC0000", "#8B0000"],
            "peaceful": ["#81C784", "#66BB6A", "#4CAF50"],
            "mysterious": ["#7B68EE", "#6A5ACD", "#483D8B"],
            "neutral": ["#90A4AE", "#78909C", "#607D8B"]
        }
        
        colors = emotion_colors.get(emotion, emotion_colors["neutral"])
        
        # 生成默认CSS动画
        css_animation = f"""
        @keyframes sceneAnimation_{scene_id} {{
            0% {{
                opacity: 0;
                transform: translateY(20px);
            }}
            50% {{
                opacity: 0.8;
                transform: translateY(0);
            }}
            100% {{
                opacity: 1;
                transform: translateY(0);
            }}
        }}
        
        .scene-animation {{
            animation: sceneAnimation_{scene_id} 2s ease-in-out;
        }}
        """
        
        return {
            "scene_id": scene_id,
            "visual_description": f"一个{setting}的场景，{scene.get('description', '展现故事情节')}",
            "image_prompt": f"A cinematic scene in {setting}, {emotion} atmosphere, beautiful lighting, high quality",
            "dialogue_text": scene.get("dialogue", ""),
            "animation_effects": "淡入淡出效果",
            "css_animation": css_animation,
            "camera_angle": "中景",
            "mood": emotion,
            "color_palette": colors,
            "duration": scene.get("duration", 30)
        }