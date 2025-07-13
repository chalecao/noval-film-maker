from pydantic import BaseModel
from typing import List, Optional
from dataclasses import dataclass

@dataclass
class ProcessingStatus:
    stage: str
    progress: int
    message: str
    isComplete: bool
    
    def copy(self):
        return ProcessingStatus(
            stage=self.stage,
            progress=self.progress,
            message=self.message,
            isComplete=self.isComplete
        )

class Scene(BaseModel):
    id: str
    chapterIndex: int
    sceneIndex: int
    title: str
    description: str
    imageUrl: str
    audioUrl: str
    audioScript: str
    animationCode: str
    duration: float

class Chapter(BaseModel):
    id: str
    title: str
    scenes: List[Scene]

class Script(BaseModel):
    chapter_title: str
    chapter_content: str
    scenes: List[dict]

class SceneDesign(BaseModel):
    scene_id: str
    visual_description: str
    dialogue: str
    animation_effects: str
    duration: float