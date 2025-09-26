import os

# 基础配置
class Config:
    # 项目根目录
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    # BASE_DIR = '/Users/slv/Dev/ai_nvshu_202508'
    # 上传文件配置
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
    # MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB
    ALLOWED_EXTENSIONS = {'mp4', 'webm', 'jpg', 'jpeg', 'png'}
    DICTIONARY_PATH = 'knowledge_tmp/simple.pkl'
    OUTPUT_DIR = os.path.join(UPLOAD_FOLDER, 'output_frames')     # 帧输出目录
    MAX_FRAMES = 5                 # 最大截取帧数
    PROMPT = "请客观地描述一下你看到的内容，用亲眼所见的口吻来描述，直接说你看见了什么。请以 I see 开头，不要使用 video, picture, photo, scene 或者 camera 之类的字眼，大概100 字。" # 图像分析提示词
    # VISION_MODEL = "meta-llama/Llama-4-Maverick-17B-128E-Instruct"
    VISION_MODEL = "glm-4v-flash"
    LLM_MODEL = "glm-4-flash-250414"
