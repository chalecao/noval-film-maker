import asyncio
import json
import uuid
import re
from typing import List, Dict, Any, Callable
from pathlib import Path

from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from typing_extensions import Annotated, TypedDict

from agents.director_agent import DirectorAgent
from agents.script_agent import ScriptAgent
from agents.production_agent import ProductionAgent
from agents.editor_agent import EditorAgent
from models import Chapter, Scene
from utils.file_utils import split_novel_by_chapters
from utils.ollama_client import OllamaClient

class NovelState(TypedDict):
    """小说处理状态"""
    novel_path: str
    chapters: List[str]
    scripts: List[Dict]
    scene_designs: List[Dict]
    generated_assets: List[Dict]
    final_chapters: List[Chapter]
    current_step: str
    error_message: str

class NovelProcessingFlow:
    """小说处理流程"""
    
    def __init__(self):
        self.ollama_client = OllamaClient()
        self.script_agent = ScriptAgent(self.ollama_client)
        self.director_agent = DirectorAgent(self.ollama_client)
        self.production_agent = ProductionAgent(self.ollama_client)
        self.editor_agent = EditorAgent(self.ollama_client)
        self.status_callback = None
        
        # 构建工作流图
        self.workflow = self._build_workflow()
    
    def _build_workflow(self) -> StateGraph:
        """构建LangGraph工作流"""
        workflow = StateGraph(NovelState)
        
        # 添加节点
        workflow.add_node("split_chapters", self.split_chapters_node)
        workflow.add_node("create_scripts", self.create_scripts_node)
        workflow.add_node("design_scenes", self.design_scenes_node)
        workflow.add_node("generate_assets", self.generate_assets_node)
        workflow.add_node("edit_check", self.edit_check_node)
        workflow.add_node("finalize", self.finalize_node)
        
        # 设置边
        workflow.add_edge("split_chapters", "create_scripts")
        workflow.add_edge("create_scripts", "design_scenes")
        workflow.add_edge("design_scenes", "generate_assets")
        workflow.add_edge("generate_assets", "edit_check")
        workflow.add_edge("edit_check", "finalize")
        workflow.add_edge("finalize", END)
        
        # 设置入口点
        workflow.set_entry_point("split_chapters")
        
        return workflow.compile()
    
    async def process_novel(self, novel_path: str, status_callback: Callable[[str, int, str], None]) -> List[Chapter]:
        """处理小说的主要方法"""
        self.status_callback = status_callback
        
        # 初始化状态
        initial_state = NovelState(
            novel_path=novel_path,
            chapters=[],
            scripts=[],
            scene_designs=[],
            generated_assets=[],
            final_chapters=[],
            current_step="start",
            error_message=""
        )
        
        try:
            # 运行工作流
            print(f"process_novel: {novel_path}")
            result = await self.workflow.ainvoke(initial_state)
            return result["final_chapters"]
        except Exception as e:
            print(f"处理小说失败: {str(e)}")
            self.status_callback("error", 0, f"处理失败: {str(e)}")
            raise e
    
    async def split_chapters_node(self, state: NovelState) -> NovelState:
        """分割章节节点"""
        if self.status_callback:
            self.status_callback("splitting", 15, "正在分割章节...")
        
        try:
            chapters = await split_novel_by_chapters(state["novel_path"])
            state["chapters"] = chapters
            state["current_step"] = "chapters_split"
            return state
        except Exception as e:
            state["error_message"] = f"分割章节失败: {str(e)}"
            raise e
    
    async def create_scripts_node(self, state: NovelState) -> NovelState:
        """创建剧本节点"""
        if self.status_callback:
            self.status_callback("scripting", 30, "正在创建剧本...")
        
        try:
            scripts = []
            for i, chapter_content in enumerate(state["chapters"]):
                print(f"create_scripts_node {i} {len(chapter_content)}: {chapter_content}")
                script = await self.script_agent.create_script(chapter_content, i)
                scripts.append(script)
                
                # 更新进度
                progress = 30 + (i + 1) / len(state["chapters"]) * 20
                if self.status_callback:
                    self.status_callback("scripting", int(progress), f"已完成 {i+1}/{len(state['chapters'])} 章节剧本")
            
            state["scripts"] = scripts
            state["current_step"] = "scripts_created"
            return state
        except Exception as e:
            state["error_message"] = f"创建剧本失败: {str(e)}"
            raise e
    
    async def design_scenes_node(self, state: NovelState) -> NovelState:
        """设计场景节点"""
        if self.status_callback:
            self.status_callback("designing", 50, "正在设计场景...")
        
        try:
            scene_designs = []
            for i, script in enumerate(state["scripts"]):
                designs = await self.director_agent.design_scenes(script)
                scene_designs.extend(designs)
                
                # 更新进度
                progress = 50 + (i + 1) / len(state["scripts"]) * 20
                if self.status_callback:
                    self.status_callback("designing", int(progress), f"已完成 {i+1}/{len(state['scripts'])} 章节场景设计")
            
            state["scene_designs"] = scene_designs
            state["current_step"] = "scenes_designed"
            return state
        except Exception as e:
            state["error_message"] = f"设计场景失败: {str(e)}"
            raise e
    
    async def generate_assets_node(self, state: NovelState) -> NovelState:
        """生成素材节点"""
        if self.status_callback:
            self.status_callback("generating", 70, "正在生成素材...")
        
        try:
            generated_assets = []
            for i, scene_design in enumerate(state["scene_designs"]):
                assets = await self.production_agent.generate_assets(scene_design)
                generated_assets.append(assets)
                
                print(f"generate_assets_node {i}: {assets}")
                # 更新进度
                progress = 70 + (i + 1) / len(state["scene_designs"]) * 15
                if self.status_callback:
                    self.status_callback("generating", int(progress), f"已完成 {i+1}/{len(state['scene_designs'])} 个场景素材")
            
            state["generated_assets"] = generated_assets
            state["current_step"] = "assets_generated"
            return state
        except Exception as e:
            state["error_message"] = f"生成素材失败: {str(e)}"
            raise e
    
    async def edit_check_node(self, state: NovelState) -> NovelState:
        """编辑检查节点"""
        if self.status_callback:
            self.status_callback("editing", 85, "正在检查和编辑...")
        
        try:
            # 检查连贯性和完整性
            checked_assets = await self.editor_agent.check_continuity(
                state["scripts"], 
                state["scene_designs"], 
                state["generated_assets"]
            )
            
            state["generated_assets"] = checked_assets
            state["current_step"] = "editing_complete"
            return state
        except Exception as e:
            state["error_message"] = f"编辑检查失败: {str(e)}"
            raise e
    
    async def finalize_node(self, state: NovelState) -> NovelState:
        """最终化节点"""
        if self.status_callback:
            self.status_callback("finalizing", 95, "正在最终化结果...")
        
        try:
            # 组装最终的章节数据
            final_chapters = []
            chapter_index = 0
            
            for script in state["scripts"]:
                chapter_scenes = []
                scene_index = 0
                
                for scene_data in script.get("scenes", []):
                    # 查找对应的生成资产
                    matching_assets = None
                    for assets in state["generated_assets"]:
                        if assets.get("scene_id") == scene_data.get("id"):
                            matching_assets = assets
                            break
                    
                    if matching_assets:
                        print(f"finalize_node {chapter_index} {scene_index}: {matching_assets}")
                        scene = Scene(
                            id=str(uuid.uuid4()),
                            chapterIndex=chapter_index,
                            sceneIndex=scene_index,
                            title=scene_data.get("title", f"场景 {scene_index + 1}"),
                            description=scene_data.get("description", ""),
                            audioScript=matching_assets.get("audio_script", ""),
                            imageUrl=matching_assets.get("image_url", ""),
                            audioUrl=matching_assets.get("audio_url", ""),
                            animationCode=matching_assets.get("animation_code", ""),
                            duration=matching_assets.get("audio_duration", ""),
                        )
                        chapter_scenes.append(scene)
                        scene_index += 1
                
                chapter = Chapter(
                    id=str(uuid.uuid4()),
                    title=script.get("chapter_title", f"第 {chapter_index + 1} 章"),
                    scenes=chapter_scenes
                )
                final_chapters.append(chapter)
                chapter_index += 1
            
            state["final_chapters"] = final_chapters
            state["current_step"] = "completed"
            return state
        except Exception as e:
            state["error_message"] = f"最终化失败: {str(e)}"
            raise e