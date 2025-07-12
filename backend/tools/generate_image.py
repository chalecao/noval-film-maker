from diffusers import StableDiffusionPipeline
import torch
from PIL import Image
import time
from pathlib import Path

def generate_image(prompt: str, scene_id: str, output_dir: Path) -> str:
    """
    使用Stable Diffusion生成场景图片并保存到指定目录
    :param prompt: 图片生成提示词
    :param scene_id: 场景ID（用于生成唯一文件名）
    :param output_dir: 图片输出目录
    :return: 生成的图片URL路径（相对于项目根目录）
    """
    # 加载本地模型（修改为model目录下的模型路径）
    # local_model_path = "./tools/models/models--stabilityai--stable-diffusion-2-1-base"
    pipe = StableDiffusionPipeline.from_pretrained(
        "stabilityai/stable-diffusion-2-1-base",
        cache_dir="./tools/models", # 指定缓存目录,默认下载到 ~/.cache/huggingface/hub ，可以copy过来
        # local_model_path,
        torch_dtype=torch.float16,
        use_safetensors=True,
        local_files_only=True  # 禁止网络请求
    )
    
    # 强制使用MPS设备
    device = "mps" if torch.backends.mps.is_available() else "cpu"
    pipe = pipe.to(device)
    
    # 设置MPS专用参数
    generator = torch.Generator(device).manual_seed(42)
    
    try:
        # 生成图片（保持原有参数）
        image = pipe(
            prompt,
            num_inference_steps=30,
            guidance_scale=5.0,
            height=512,
            width=512,
            generator=generator
        ).images[0]
        
        # 保存到指定目录
        output_dir.mkdir(parents=True, exist_ok=True)  # 确保目录存在
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        image_name = f"image_{scene_id}_{timestamp}.png"
        image_path = output_dir / image_name
        image.save(image_path)
        
        # 返回相对URL路径
        return f"/assets/images/{image_name}"
    
    except Exception as e:
        print(f"生成失败: {str(e)}")
        return ""

if __name__ == "__main__":
    # 测试配置
    test_prompt = "A cyberpunk cityscape at sunset, 8k ultra realistic"
    test_scene_id = "test_scene_001"
    test_output_dir = Path("../assets/images")  # 指向项目assets/images目录
    
    # 执行测试
    print("开始测试图片生成...")
    result_url = generate_image(
        prompt=test_prompt,
        scene_id=test_scene_id,
        output_dir=test_output_dir
    )
    
    # 验证结果
    if result_url:
        print(f"测试成功！生成的图片URL: {result_url}")
        print(f"实际文件路径: {test_output_dir / result_url.split('/')[-1]}")
    else:
        print("测试失败！")