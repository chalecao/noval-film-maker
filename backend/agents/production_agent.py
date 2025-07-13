import asyncio
import json
import uuid
import os
from typing import Dict, List, Any
from pathlib import Path
import base64
import aiofiles
import aiohttp
from tools.generate_audio import generate_audio  # 新增导入
from tools.generate_image import generate_image  # 新增导入
import asyncio  # 确保已导入

class ProductionAgent:
    """制作Agent - 负责生成场景图片、语音和动画"""
    
    def __init__(self, ollama_client):
        self.ollama_client = ollama_client
        self.model_name = "gemma3n:e4b"
        # self.model_name = "qwen3:4b"
        self.assets_dir = Path("assets")
        self.assets_dir.mkdir(exist_ok=True)
        
        # 创建子目录
        (self.assets_dir / "images").mkdir(exist_ok=True)
        (self.assets_dir / "audios").mkdir(exist_ok=True)
        (self.assets_dir / "animations").mkdir(exist_ok=True)
    
    async def generate_assets(self, scene_design: Dict[str, Any]) -> Dict[str, Any]:
        """为场景生成所有素材"""
        
        scene_id = scene_design.get("scene_id", f"scene_{uuid.uuid4().hex[:8]}")
        
        # 并行生成各种素材
        image_task = self._generate_scene_image(scene_design)
        audio_task = self._generate_scene_audio(scene_design)
        animation_task = self._generate_animation_code(scene_design)
        
        # 等待所有任务完成
        image_url, audio_info, animation_code = await asyncio.gather(
            image_task, audio_task, animation_task
        )
        
        return {
            "scene_id": scene_id,
            "image_url": image_url,
            "audio_url": audio_info["url"],       # 音频路径
            "audio_duration": audio_info["duration"],  # 新增：音频时长（秒）
            "audio_script": scene_design.get("visual_description", ""), 
            "animation_code": animation_code,
            "assets_generated": True
        }
    
    async def _generate_scene_image(self, scene_design: Dict[str, Any]) -> str:
        """生成场景图片"""
        try:
            # 这里应该调用图像生成API（如DALL-E、Stable Diffusion等）
            # 由于演示目的，我们使用占位符图片
            
            scene_id = scene_design.get("scene_id", "default")
            visual_description = scene_design.get("visual_description", "A beautiful scene with mountains and river")
            image_prompt = scene_design.get("image_prompt", "a beautiful girl standing in the forest")
            output_dir = self.assets_dir / "images"  # 使用已创建的audio目录
            # 使用Ollama生成图片描述（如果支持）
            # 实际应用中应该调用专门的图像生成API
            
            # 暂时使用占位符图片
            # placeholder_url = await self._get_placeholder_image(scene_id, image_prompt)
            
            # return placeholder_url
            print(f"visual_description: {visual_description}")
            print(f"image_prompt: {image_prompt}")

            image_url = await asyncio.to_thread(
                generate_image,
                prompt=image_prompt,
                scene_id=scene_id,
                output_dir=output_dir
            )
            
            # 如果生成失败返回默认占位符
            return image_url or "https://via.placeholder.com/800x600/4A90E2/FFFFFF?text=Scene+Image"
            
            
        except Exception as e:
            print(f"图片生成失败: {e}")
            return "https://via.placeholder.com/800x600/4A90E2/FFFFFF?text=Scene+Image"
    
    async def _get_placeholder_image(self, scene_id: str, prompt: str) -> str:
        """获取占位符图片"""
        # 根据场景内容选择合适的占位符
        if "forest" in prompt.lower() or "nature" in prompt.lower():
            return "https://images.pexels.com/photos/147411/italy-mountains-dawn-daybreak-147411.jpeg?auto=compress&cs=tinysrgb&w=800"
        elif "city" in prompt.lower() or "urban" in prompt.lower():
            return "https://images.pexels.com/photos/374870/pexels-photo-374870.jpeg?auto=compress&cs=tinysrgb&w=800"
        elif "ocean" in prompt.lower() or "sea" in prompt.lower():
            return "https://images.pexels.com/photos/1704488/pexels-photo-1704488.jpeg?auto=compress&cs=tinysrgb&w=800"
        elif "mountain" in prompt.lower():
            return "https://images.pexels.com/photos/1366919/pexels-photo-1366919.jpeg?auto=compress&cs=tinysrgb&w=800"
        else:
            return "https://images.pexels.com/photos/531880/pexels-photo-531880.jpeg?auto=compress&cs=tinysrgb&w=800"
    
    async def _generate_scene_audio(self, scene_design: Dict[str, Any]) -> str:
        """生成场景语音（返回包含URL和时长的字典）"""
        try:
            # dialogue_text = scene_design.get("dialogue_text", "")
            dialogue_text = scene_design.get("visual_description", "")
            
            if not dialogue_text:
                return {"url": "", "duration": 0}
            
            scene_id = scene_design.get("scene_id", "default")
            audio_output_dir = self.assets_dir / "audios"

            # 调用工具生成语音（返回包含url和duration的字典）
            audio_info = generate_audio(
                text=dialogue_text,
                scene_id=scene_id,
                output_dir=audio_output_dir
            )

            return audio_info if audio_info else {"url": "", "duration": 0}
        except Exception as e:
            print(f"语音生成失败: {e}")
            return {"url": "", "duration": 0}
    
    async def _generate_animation_code(self, scene_design: Dict[str, Any]) -> str:
        """生成动画代码"""
        try:
            # 获取场景设计中的动画信息
            css_animation = scene_design.get("css_animation", "")
            animation_effects = scene_design.get("animation_effects", "")
            scene_id = scene_design.get("scene_id", "default")
            
            if css_animation:
                return css_animation
            
            # 使用AI生成动画代码
            prompt = f"""
作为一个前端开发专家，请为以下场景创建CSS动画代码：

场景ID: {scene_id}
动画效果: {animation_effects}
情绪: {scene_design.get('mood', 'neutral')}
色彩: {scene_design.get('color_palette', [])}

请创建一个完整的CSS动画，包括：
1. @keyframes 定义
2. 动画类名
3. 过渡效果
4. 适当的动画持续时间

要求：
- 动画要流畅自然
- 适合网页展示
- 不要过于复杂
- 确保兼容性

请只返回CSS代码，不要包含其他文字。
"""
            
            response = await self.ollama_client.generate(
                model=self.model_name,
                prompt=prompt,
                stream=False
            )
            
            animation_code = response.get("response", "").strip()
            
            # 如果AI生成失败，使用默认动画
            if not animation_code or len(animation_code) < 50:
                animation_code = self._create_default_animation(scene_id)
            
            return animation_code
            
        except Exception as e:
            print(f"动画生成失败: {e}")
            return self._create_default_animation(scene_design.get("scene_id", "default"))
    
    def _create_default_animation(self, scene_id: str) -> str:
        """创建默认动画"""
        return f"""
        @keyframes sceneAnimation_{scene_id} {{
            0% {{
                opacity: 0;
                transform: translateY(30px) scale(0.95);
            }}
            50% {{
                opacity: 0.7;
                transform: translateY(-5px) scale(1.02);
            }}
            100% {{
                opacity: 1;
                transform: translateY(0) scale(1);
            }}
        }}
        
        @keyframes backgroundPulse_{scene_id} {{
            0%, 100% {{
                background-size: 100% 100%;
            }}
            50% {{
                background-size: 110% 110%;
            }}
        }}
        
        .scene-animation {{
            animation: sceneAnimation_{scene_id} 3s ease-out forwards,
                      backgroundPulse_{scene_id} 6s ease-in-out infinite;
        }}
        
        .scene-animation::before {{
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(45deg, rgba(255,255,255,0.1), rgba(255,255,255,0));
            animation: shimmer_{scene_id} 4s ease-in-out infinite;
        }}
        
        @keyframes shimmer_{scene_id} {{
            0% {{
                transform: translateX(-100%);
            }}
            100% {{
                transform: translateX(100%);
            }}
        }}
        """