import asyncio
import json
from typing import Dict, List, Any

class EditorAgent:
    """剪辑Agent - 负责检查剧本和场景的连贯性"""
    
    def __init__(self, ollama_client):
        self.ollama_client = ollama_client
        self.model_name = "gemma3n:e4b"
        # self.model_name = "qwen3:4b"
    
    async def check_continuity(self, scripts: List[Dict], scene_designs: List[Dict], generated_assets: List[Dict]) -> List[Dict]:
        """检查连贯性和完整性"""
        
        # 检查每个场景的完整性
        checked_assets = []
        
        for i, assets in enumerate(generated_assets):
            try:
                # 检查素材完整性
                checked_asset = await self._check_asset_quality(assets, scene_designs[i] if i < len(scene_designs) else None)
                checked_assets.append(checked_asset)
            except Exception as e:
                print(f"检查素材 {i} 失败: {e}")
                checked_assets.append(assets)
        
        # 检查整体连贯性
        checked_assets = await self._check_overall_continuity(scripts, checked_assets)
        
        return checked_assets
    
    async def _check_asset_quality(self, assets: Dict[str, Any], scene_design: Dict[str, Any] = None) -> Dict[str, Any]:
        """检查单个素材的质量"""
        
        scene_id = assets.get("scene_id", "unknown")
        
        # 检查必要的素材是否存在
        if not assets.get("image_url"):
            print(f"场景 {scene_id} 缺少图片")
            assets["image_url"] = "https://via.placeholder.com/800x600/4A90E2/FFFFFF?text=Missing+Image"
        
        if not assets.get("animation_code"):
            print(f"场景 {scene_id} 缺少动画")
            assets["animation_code"] = self._create_fallback_animation(scene_id)
        
        # 检查动画代码的有效性
        if assets.get("animation_code") and not self._validate_css(assets["animation_code"]):
            print(f"场景 {scene_id} 动画代码无效")
            assets["animation_code"] = self._create_fallback_animation(scene_id)
        
        return assets
    
    async def _check_overall_continuity(self, scripts: List[Dict], assets: List[Dict]) -> List[Dict]:
        """检查整体连贯性"""
        
        # 使用AI检查剧本和场景的连贯性
        try:
            # 构建连贯性检查提示
            prompt = self._build_continuity_prompt(scripts, assets)
            
            response = await self.ollama_client.generate(
                model=self.model_name,
                prompt=prompt,
                stream=False
            )
            
            # 解析AI的建议
            suggestions = self._parse_continuity_suggestions(response.get("response", ""))
            
            # 应用建议
            assets = self._apply_continuity_fixes(assets, suggestions)
            
        except Exception as e:
            print(f"连贯性检查失败: {e}")
        
        return assets
    
    def _build_continuity_prompt(self, scripts: List[Dict], assets: List[Dict]) -> str:
        """构建连贯性检查提示"""
        
        # 简化的剧本信息
        script_summary = []
        for i, script in enumerate(scripts):
            summary = {
                "chapter": i + 1,
                "title": script.get("chapter_title", f"第{i+1}章"),
                "scenes_count": len(script.get("scenes", [])),
                "key_themes": script.get("chapter_summary", "")[:100]
            }
            script_summary.append(summary)
        
        # 简化的素材信息
        asset_summary = []
        for i, asset in enumerate(assets):
            summary = {
                "scene": i + 1,
                "has_image": bool(asset.get("image_url")),
                "has_audio": bool(asset.get("audio_url")),
                "has_animation": bool(asset.get("animation_code"))
            }
            asset_summary.append(summary)
        
        prompt = f"""
作为一个专业的剪辑师，请检查以下剧本和素材的连贯性：

剧本概要：
{json.dumps(script_summary, ensure_ascii=False, indent=2)}

素材状态：
{json.dumps(asset_summary, ensure_ascii=False, indent=2)}

请检查：
1. 场景转换是否自然
2. 素材是否完整
3. 是否有遗漏的关键场景
4. 整体节奏是否合适

请以JSON格式返回建议：
{{
    "issues": ["发现的问题"],
    "suggestions": ["改进建议"],
    "missing_scenes": ["缺失的场景"],
    "fixes": [
        {{
            "scene_index": 0,
            "fix_type": "修复类型",
            "description": "修复描述"
        }}
    ]
}}

请只返回JSON，不要包含其他文字。
"""
        
        return prompt
    
    def _parse_continuity_suggestions(self, response: str) -> Dict[str, Any]:
        """解析连贯性建议"""
        try:
            return json.loads(response)
        except json.JSONDecodeError:
            return {
                "issues": [],
                "suggestions": [],
                "missing_scenes": [],
                "fixes": []
            }
    
    def _apply_continuity_fixes(self, assets: List[Dict], suggestions: Dict[str, Any]) -> List[Dict]:
        """应用连贯性修复"""
        
        fixes = suggestions.get("fixes", [])
        
        for fix in fixes:
            scene_index = fix.get("scene_index", -1)
            fix_type = fix.get("fix_type", "")
            
            if 0 <= scene_index < len(assets):
                if fix_type == "add_transition":
                    # 添加过渡动画
                    assets[scene_index]["animation_code"] = self._add_transition_animation(
                        assets[scene_index].get("animation_code", "")
                    )
                elif fix_type == "fix_timing":
                    # 修复时间问题
                    assets[scene_index]["duration"] = max(15, min(60, assets[scene_index].get("duration", 30)))
        
        return assets
    
    def _add_transition_animation(self, existing_animation: str) -> str:
        """添加过渡动画"""
        transition_css = """
        .scene-transition {
            transition: all 0.5s ease-in-out;
        }
        
        .scene-transition.fade-in {
            opacity: 0;
            animation: fadeIn 1s ease-in-out forwards;
        }
        
        @keyframes fadeIn {
            to { opacity: 1; }
        }
        """
        
        return existing_animation + "\n" + transition_css
    
    def _validate_css(self, css_code: str) -> bool:
        """验证CSS代码的基本有效性"""
        if not css_code:
            return False
        
        # 简单的CSS验证
        try:
            # 检查是否包含@keyframes
            if "@keyframes" not in css_code:
                return False
            
            # 检查括号匹配
            open_braces = css_code.count("{")
            close_braces = css_code.count("}")
            if open_braces != close_braces:
                return False
            
            return True
        except:
            return False
    
    def _create_fallback_animation(self, scene_id: str) -> str:
        """创建备用动画"""
        return f"""
        @keyframes fallback_{scene_id} {{
            0% {{ opacity: 0; }}
            100% {{ opacity: 1; }}
        }}
        
        .scene-animation {{
            animation: fallback_{scene_id} 2s ease-in-out;
        }}
        """