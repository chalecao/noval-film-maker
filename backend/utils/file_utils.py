import re
import asyncio
from typing import List
from pathlib import Path

chapter_patterns = [
        # r'第[零一二三四五六七八九十百千万\d]+卷',
        r'第[零一二三四五六七八九十百千万\d]+章',
        r'第[零一二三四五六七八九十百千万\d]+回',
        r'Chapter\s+\d+',
        r'CHAPTER\s+\d+',
        # r'第\d+卷',
        r'第\d+章',
        r'第\d+回',
]

async def split_novel_by_chapters(file_path: str) -> List[str]:
    """将小说按章节分割"""
    
    try:
        # 读取文件
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 如果文件包含 第 回 章  CHAPTER 章节
        if _is_chapter_title(content):  # 50KB以上的文件
            chapters = await _split_large_novel(content)
        else:
            chapters = await _split_small_novel(content)
        
        # 确保至少有一章
        if not chapters:
            chapters = [content]
        
        return chapters
        
    except Exception as e:
        print(f"分割章节失败: {e}")
        # 返回整个文件作为一章
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return [f.read()]
        except:
            return ["无法读取文件内容"]

async def _split_large_novel(content: str) -> List[str]:
    """分割大型小说"""
    
    # # 尝试按章节标题分割
    # chapter_patterns = [
    #     r'第[一二三四五六七八九十百千万\d]+章',
    #     r'第[一二三四五六七八九十百千万\d]+回',
    #     r'Chapter\s+\d+',
    #     r'CHAPTER\s+\d+',
    #     r'第\d+章',
    #     r'第\d+回',
    #     r'^\d+\.', # 数字开头
    #     r'^\d+\s+', # 数字空格开头
    # ]
    
    chapters = []
    
    for pattern in chapter_patterns:
        matches = list(re.finditer(pattern, content, re.MULTILINE | re.IGNORECASE))
        if len(matches) >= 2:  # 至少找到2个章节标记
            chapters = _extract_chapters_by_pattern(content, matches)
            if chapters:
                break
        if len(matches) == 1:  # 至少找到2个章节标记
            chapters = _extract_chapters_by_pattern(content, matches)
            if chapters:
                break
            
    
    # 如果没有找到章节标记，按段落分割
    if not chapters:
        chapters = await _split_by_paragraphs(content)
    
    return chapters

async def _split_small_novel(content: str) -> List[str]:
    """分割小型小说"""
    
    # 尝试简单的章节分割
    lines = content.split('\n')
    chapters = []
    current_chapter = []
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # 检查是否是章节标题
        if _is_chapter_title(line):
            if current_chapter:
                chapters.append('\n'.join(current_chapter))
                current_chapter = []
            current_chapter.append(line)
        else:
            current_chapter.append(line)
    
    # 添加最后一章
    if current_chapter:
        chapters.append('\n'.join(current_chapter))
    
    print(chapters)
    # 如果只有一章，按段落分割
    if len(chapters) == 1:
        chapters = await _split_by_paragraphs(content)
    
    return chapters

def _extract_chapters_by_pattern(content: str, matches: List) -> List[str]:
    """根据匹配模式提取章节"""
    chapters = []
    
    for i, match in enumerate(matches):
        start = match.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(content)
        
        chapter_content = content[start:end].strip()
        if chapter_content:
            chapters.append(chapter_content)
    
    return chapters

async def _split_by_paragraphs(content: str) -> List[str]:
    """按段落分割"""
    
    paragraphs = content.split('\n\n')  # 双换行符分割段落
    paragraphs = [p.strip() for p in paragraphs if p.strip()]
    
    if len(paragraphs) < 3:
        # 如果段落太少，按单换行分割
        paragraphs = content.split('\n')
        paragraphs = [p.strip() for p in paragraphs if p.strip()]
    
    # 合并段落为章节（每3-5个段落为一章）
    chapters = []
    current_chapter = []
    
    for i, paragraph in enumerate(paragraphs):
        current_chapter.append(paragraph)
        
        # 每3-5个段落合并为一章
        if len(current_chapter) >= 3 and (i + 1) % 4 == 0:
            chapters.append('\n\n'.join(current_chapter))
            current_chapter = []
    
    # 添加剩余段落
    if current_chapter:
        chapters.append('\n\n'.join(current_chapter))
    
    return chapters

def _is_chapter_title(line: str) -> bool:
    """判断是否是章节标题"""
    
    # 长度检查
    # if len(line) > 100:
    #     return False
    
    # 章节标题模式
    # patterns = [
    #     r'第[一二三四五六七八九十百千万\d]+卷',
    #     r'第[一二三四五六七八九十百千万\d]+章',
    #     r'第[一二三四五六七八九十百千万\d]+回',
    #     r'Chapter\s+\d+',
    #     r'CHAPTER\s+\d+',
    #     r'第\d+卷',
    #     r'第\d+章',
    #     r'第\d+回',
    #     r'^\d+\.', # 数字开头
    #     r'^\d+\s+', # 数字空格开头
    # ]
    
    for pattern in chapter_patterns:
        if re.search(pattern, line, re.IGNORECASE):
            return True
    
    return False

def extract_author(content: str) -> str:
    """从小说内容中提取作者信息（匹配'作者：'或'作者:'格式）"""
    # 匹配模式：作者后接冒号（全角/半角），然后是作者名（非换行字符）
    pattern = r'作者[:：]\s*([^\n]+)'
    match = re.search(pattern, content, re.IGNORECASE)
    return match.group(1).strip() if match else ""

def extract_book_title(text: str) -> str:
        """从文本中提取书名（支持《书名》和书名：XXX格式）"""
        # 其次匹配"书名："格式（如书名：凡人修仙传）
        pattern_2 = r'书名[:：]\s*([^\n]+)'  # 匹配"书名："后的非换行内容
        match_2 = re.search(pattern_2, text, re.IGNORECASE)
        if match_2:
            return match_2.group(1).strip()
        
         # 优先匹配书名号格式（如《凡人修仙传》）
        pattern_1 = r'《([^》]+)》'  # 匹配《和》之间的内容
        match_1 = re.search(pattern_1, text)
        if match_1:
            return match_1.group(1).strip()
        return ""

def main():
    """测试章节分割功能"""
    import sys
    if len(sys.argv) < 2:
        print("使用方法: python file_utils.py <小说文件路径>")
        return

    file_path = sys.argv[1]
    if not Path(file_path).exists():
        print(f"错误: 文件 {file_path} 不存在")
        return

    try:
        # 读取文件内容用于作者提取
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 提取作者
        author = extract_author(content)
        print(f"提取到作者: {author if author else '未找到作者信息'}")

        # 提取作者
        book_title = extract_book_title(content)
        print(f"提取到书名: {book_title if book_title else '未找到书名信息'}")

        # 章节分割测试
        chapters = asyncio.run(split_novel_by_chapters(file_path))
        print(f"成功分割为 {len(chapters)} 章")
        for i, chapter in enumerate(chapters, 1):
            preview = chapter[:100].replace('\n', ' ')  # 显示前100个字符（换行替换为空格）
            print(f"第 {i} 章 {len(chapter)} 预览: {preview}...")
    except Exception as e:
        print(f"测试失败: {str(e)}")

if __name__ == "__main__":
    main()
