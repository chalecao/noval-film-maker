from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import asyncio
import json
import os
import uuid
from typing import List, Dict, Any
import uvicorn
from pathlib import Path

from agent_flow import NovelProcessingFlow
from models import Chapter, Scene, ProcessingStatus
from utils.file_utils import extract_author, extract_book_title

app = FastAPI(title="小说动画互动展示系统")

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite默认端口
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 全局变量存储处理状态和结果
processing_status = ProcessingStatus(
    stage="idle",
    progress=0,
    message="等待上传文件...",
    isComplete=False
)
chapters_data: List[Chapter] = []
novel_flow = NovelProcessingFlow()

@app.post("/process-novel")
async def process_novel(file: UploadFile = File(...)):
    """处理上传的小说文件"""
    global processing_status, chapters_data
    
    if not file.filename.endswith('.txt'):
        raise HTTPException(status_code=400, detail="仅支持txt文件")
    
    try:
        # 保存上传的文件
        upload_dir = Path("uploads")
        upload_dir.mkdir(exist_ok=True)
        
        file_path = upload_dir / f"{uuid.uuid4()}_{file.filename}"
        content = await file.read()
        
        with open(file_path, 'wb') as f:
            f.write(content)
        
        # 重置处理状态
        processing_status.stage = "uploading"
        processing_status.progress = 10
        processing_status.message = "文件上传成功，开始处理..."
        processing_status.isComplete = False
        
        # 异步处理小说
        asyncio.create_task(process_novel_async(file_path))
        
        return {"message": "文件上传成功，开始处理"}
        
    except Exception as e:
        processing_status.stage = "error"
        processing_status.message = f"处理失败: {str(e)}"
        raise HTTPException(status_code=500, detail=str(e))

async def process_novel_async(file_path: Path):
    """异步处理小说"""
    global processing_status, chapters_data
    
    try:
        # 更新状态回调
        def update_status(stage: str, progress: int, message: str):
            print(f"update_status: {stage}, {progress}, {message}")
            processing_status.stage = stage
            processing_status.progress = progress
            processing_status.message = message
            processing_status.isComplete = False
        
        # 处理小说
        print(f"开始处理小说: {str(file_path)}")
        # chapters_data = {}
        chapters_data = await novel_flow.process_novel(str(file_path), update_status)

        # chapters_data = [Chapter(id='09f07061-e9da-4422-b7e8-486d2336abc7', title='山边小村', scenes=[Scene(id='d3ec8458-fcdf-49ca-b39d-a18063382abf', chapterIndex=0, sceneIndex=0, title='破屋残阳', description='黄昏时分，茅草屋顶在夕阳下泛着暗光，旧棉被上的霉斑如蛛网般蔓延，二愣子蜷缩在泥地上', imageUrl='/assets/images/image_SC001_20250712_174634.png', audioUrl='/assets/audios/audio_SC001_20250712_174607.mp3', animationCode='/* 棉絮飘动动画 */ @keyframes cottonSway { 0% {transform: translate(0,0) scale(1); opacity:1;} 100% {transform: translate(-10px,5px) scale(1.2); opacity:0.2;} } .cottonFibers { animation: cottonSway 15s linear infinite; } /* 霉斑蔓延动画 */ @keyframes moldSpread { 0% {opacity:0.3; transform: scale(1);} 100% {opacity:1; transform: scale(1.2);}} .moldSpots { animation: moldSpread 20s ease-in-out infinite; }', duration=3.25, audioScript='腐烂的棉絮在风中发出细碎声响'), Scene(id='82ddbb7a-4265-4410-8996-979f6b17838f', chapterIndex=0, sceneIndex=1, title='鼾声如雷', description='韩铸的鼾声在泥墙上震颤，打呼声与烟杆吸允声形成不规则节奏，墙缝渗出昏黄光线', imageUrl='/assets/images/image_SC002_20250712_174705.png', audioUrl='/assets/audios/audio_SC002_20250712_174634.mp3', animationCode=' @keyframes wall_light {\n 0% { opacity: 0.3; } \n 50% { opacity: 0.7; } \n 100% { opacity: 0.3; } \n }\n .wall-light { animation: wall_light 15s infinite; }', duration=2.64,audioScript='啪嗒啪嗒的烟杆声混着嘟嘟的鼾声',), Scene(id='f9c9d481-8fdd-4ab2-bee4-d50c1026f7a0', chapterIndex=0, sceneIndex=2, title='姓名密码', description='二愣子盯着褪色的棉被，指尖划过被面裂口，墙缝渗出的霉雾在脸上凝成细小水珠', imageUrl='/assets/images/image_SC003_20250712_174733.png', audioUrl='/assets/audios/audio_SC003_20250712_174705.mp3', animationCode='@keyframes moldFade { from {opacity:0.2} to {opacity:1}} @keyframes waterDrop { 0%{opacity:0} 50%{opacity:1} 100%{opacity:0}} .mold { animation: moldFade 5s linear forwards} .water { animation: waterDrop 1s ease-out forwards} .hand { animation: shake 0.3s ease-out forwards}', duration=2.09,audioScript="'窝头'两个字在舌尖发涩"), Scene(id='e5fb10b7-c15f-4966-ba2f-b3ccdd411821', chapterIndex=0, sceneIndex=3, title='晨光预兆', description='天光从裂缝透入，二愣子突然坐起，手指颤抖着扯开棉被，泥墙上爬满蛛网', imageUrl='/assets/images/image_SC004_20250712_174759.png', audioUrl='/assets/audios/audio_SC004_20250712_174733.mp3', animationCode='@keyframes lightFilter {0%{opacity:0.2;filter:blur(4px);}} 100%{opacity:1;filter:blur(0);} .crack-light {animation: lightFilter 5s ease-in-out infinite;}', duration=2.5,audioScript="'明天要捡柴'的念头刺破昏沉",)])]
        # 定时间隔3s更新status模拟测试状态，state顺序 splitting -> designing -> generating -> editing -> complete
        # await asyncio.sleep(3)
        # processing_status.stage = "splitting"
        # processing_status.progress = 20
        # processing_status.message = "正在分割章节..."
        # await asyncio.sleep(3)
        # processing_status.stage = "designing"
        # processing_status.progress = 40
        # processing_status.message = "正在设计场景..."
        # await asyncio.sleep(3)
        # processing_status.stage = "generating"
        # processing_status.progress = 60
        # processing_status.message = "正在生成资产..."
        # await asyncio.sleep(3)
        # processing_status.stage = "editing"
        # processing_status.progress = 80
        # processing_status.message = "正在编辑..."
        # await asyncio.sleep(3)
        processing_status.stage = "completed"
        processing_status.progress = 100
        processing_status.message = "处理完成！"
        processing_status.isComplete = True
        print(f"处理完成，生成章节数: {chapters_data}")
        chapters_dict = [
            {
                "id": chapter.id,
                "title": chapter.title,
                "scenes": [
                    {
                        "id": scene.id,
                        "chapterIndex": scene.chapterIndex,
                        "sceneIndex": scene.sceneIndex,
                        "title": scene.title,
                        "description": scene.description,
                        "imageUrl": scene.imageUrl,       # 新增字段
                        "audioUrl": scene.audioUrl,       # 新增字段
                        "audioScript": scene.audioScript,       # 新增字段
                        "animationCode": scene.animationCode,  # 新增字段
                        "duration": scene.duration        # 新增字段
                    } for scene in chapter.scenes
                ]
            } for chapter in chapters_data
        ]

        books_dir = Path("assets") / "books"
        safe_filename = file_path.name.replace("/", "_").replace("\\", "_")  # 处理特殊字符
        with open(books_dir / f"{safe_filename}.json", "w", encoding="utf-8") as f:
            json.dump(chapters_dict, f, ensure_ascii=False, indent=2)

        # 提取书名作者 追加生成all.json
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        # 提取作者
        author = extract_author(content)
        print(f"提取到作者: {author if author else '未找到作者信息'}")

        # 提取作者
        book_title = extract_book_title(content)
        print(f"提取到书名: {book_title if book_title else '未找到书名信息'}")
        
        # 追加生成 all.json（修复语法错误和缩进）
        books_dir = Path("assets") / "books"
        books_dir.mkdir(parents=True, exist_ok=True)  # 确保目录存在
        
        all_json_path = books_dir / "all.json"
        new_book_info = {
            "path": f"/books/{safe_filename}.json",
            "name": book_title,
            "author": author,
            "chapters": len(chapters_dict),
            "cover": chapters_dict[0]["scenes"][0]["imageUrl"]
        }

        # 读取或初始化 all.json
        if all_json_path.exists():
            with open(all_json_path, 'r', encoding='utf-8') as f:
                existing_data = json.load(f)
        else:
            existing_data = []
        
        existing_data.append(new_book_info)

        # 写入更新后的 all.json
        with open(all_json_path, 'w', encoding='utf-8') as f:
            json.dump(existing_data, f, ensure_ascii=False, indent=2)
            
        # 清理临时文件
        os.remove(file_path)

    except Exception as e:
        processing_status.stage = "error"
        processing_status.progress = 0
        processing_status.message = f"处理失败: {str(e)}"
        processing_status.isComplete = False
        print (f"处理失败: {str(e)}")

@app.get("/processing-status")
async def get_processing_status():
    """获取处理状态的SSE流"""
    async def event_stream():
        last_status = None
        while True:
            if processing_status != last_status:
                yield f"data: {json.dumps(processing_status.__dict__)}\n\n"
                last_status = processing_status.copy()
                
                if processing_status.isComplete:
                    break
            await asyncio.sleep(1)
    
    return StreamingResponse(event_stream(), media_type="text/event-stream")

@app.get("/books")
async def get_books():
    books_dir = Path("assets") / "books"
    book_list = []
    
    for file in books_dir.glob("*.json"):
        book_list.append({
            "name": file.stem,  # 文件名（不带扩展名）
            "path": str(file.relative_to("assets")),  # 相对路径
            "update_time": file.stat().st_mtime  # 修改时间
        })
    
    return {"books": book_list}

@app.get("/chapters")
async def get_chapters():
    """获取所有章节数据"""
    
    return [chapter.__dict__ for chapter in chapters_data]

@app.get("/chapter/{chapter_id}")
async def get_chapter(chapter_id: str):
    """获取特定章节"""
    for chapter in chapters_data:
        if chapter.id == chapter_id:
            return chapter.__dict__
    raise HTTPException(status_code=404, detail="章节未找到")

@app.get("/")
async def root():
    return {"message": "小说动画互动展示系统 API"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)