import pyttsx3
from pathlib import Path
import ffmpeg  # pip3 install python-ffmpeg
from pydub import AudioSegment  # 新增：用于获取音频时长 pip3 install audioop-lts
import time

class _TTS:

    engine = None
    rate = None
    def __init__(self):
        self.engine = pyttsx3.init(driverName='nsss')
        self.engine.setProperty('rate', 150)  # 语速（默认200）
        self.engine.setProperty('volume', 1.0)  # 音量（0.0-1.0）


    def start(self, text_, audio_path):
        # self.engine.save_to_file(text_, str(audio_path))
        # self.engine.say(text_)
        self.engine.save_to_file(text_, str(audio_path))
        self.engine.runAndWait()

def generate_audio(text: str, scene_id: str, output_dir: Path) -> str:
    """
    使用pyttsx3生成语音文件
    :param text: 要转换的文本
    :param scene_id: 场景ID（用于生成唯一文件名）
    :param output_dir: 输出目录
    :return: 生成的音频文件路径（相对于项目根目录）
    """
    if not text.strip():
        return ""
    
    # 确保输出目录存在
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # 初始化引擎
    tts = _TTS()
    
    # 生成文件名
    audio_path = output_dir / f"audio_{scene_id}.wav"
    timestamp = time.strftime("%Y%m%d_%H%M%S")
    final_mp3_path = output_dir / f"audio_{scene_id}_{timestamp}.mp3"
    
    try:
        # 保存语音到文件
        print(f"正在生成音频: {audio_path}")
        tts.start(text, audio_path)
        del(tts)

        # 2. 使用ffmpeg转换为mp3（需要系统安装ffmpeg）
        (
            ffmpeg.input(str(audio_path))
            .output(str(final_mp3_path), acodec='libmp3lame')
            .overwrite_output()
            .run()
        )
        if final_mp3_path.exists():
            # 新增：计算音频时长
            audio = AudioSegment.from_mp3(final_mp3_path)
            duration = round(audio.duration_seconds, 2)  # 保留2位小数
            
            # 清理临时wav文件
            if audio_path.exists():
                audio_path.unlink(missing_ok=True)
                
            print(f"音频生成成功: {final_mp3_path}（时长：{duration}秒）")
            return {
                "url": f"/assets/audios/{final_mp3_path.name}",
                "duration": duration
            }
        else:
            print(f"MP3文件未生成: {final_mp3_path}")
            return {}
    except Exception as e:
        print(f"语音生成失败: {str(e)}")
        return ""

def batch_convert_wav_to_mp3(input_dir: Path, delete_original: bool = False) -> int:
    """
    批量转换指定目录下的wav文件为mp3（增强错误日志版）
    """
    if not input_dir.exists() or not input_dir.is_dir():
        print(f"错误：目录不存在 {input_dir}")
        return 0

    wav_files = list(input_dir.glob("*.wav"))
    success_count = 0

    for wav_path in wav_files:
        # 新增：验证输入文件是否存在（避免文件被删除后仍处理）
        if not wav_path.exists():
            print(f"跳过：文件不存在 {wav_path.name}")
            continue

        mp3_path = wav_path.with_suffix(".mp3")
        
        try:
            # 关键修改：移除quiet=True，显示ffmpeg原始输出
            # 并捕获stdout/stderr用于错误诊断
            process = (
                ffmpeg.input(str(wav_path))
                .output(str(mp3_path), acodec='libmp3lame')  # Changed parameter
                .overwrite_output()
                .run_async(pipe_stdout=True, pipe_stderr=True)
            )
            
            # 获取ffmpeg输出
            stdout, stderr = process.communicate()
            if process.returncode != 0:
                raise Exception(f"FFmpeg错误输出：{stderr.decode('utf-8')}")

            # 验证文件生成
            if mp3_path.exists() and mp3_path.stat().st_size > 0:
                success_count += 1
                print(f"转换成功: {wav_path.name} -> {mp3_path.name}")
                
                if delete_original:
                    wav_path.unlink()
                    print(f"已删除原始文件: {wav_path.name}")
            else:
                raise Exception("MP3文件未生成或为空")

        except Exception as e:
            # 关键修改：打印完整错误信息（包含ffmpeg的具体报错）
            print(f"转换失败 {wav_path.name}: {str(e)}")
            continue

    print(f"批量转换完成，成功 {success_count}/{len(wav_files)} 个文件")
    return success_count

# 测试方法
if __name__ == "__main__":
    test_text = "这是一段用于测试语音生成的示例文本。"
    test_scene_id = "test_001"
    test_output_dir = Path("../assets/audios")  # 测试输出目录（相对于当前文件）
    
    result = generate_audio(test_text, test_scene_id, test_output_dir)
    if result:
        print(f"测试成功！音频文件路径：{result}")
    else:
        print("测试失败，未生成音频文件。")

    # 示例：转换public目录下的audios文件夹中的wav文件
    # public_audios_dir = Path("../public/assets/audios")  # 根据实际项目结构调整路径
    
    # 执行批量转换（不删除原始文件）
    # batch_convert_wav_to_mp3(public_audios_dir, delete_original=False)