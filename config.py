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
    # 在这里可以添加更多需要调试的前端参数
    # 例如：
    # BLUR_RADIUS = 2.0
    # COLOR_INTENSITY = 1.0
    # 等等...
# import os
# from dotenv import load_dotenv

# # 加载环境变量
# load_dotenv()

# class BaseConfig:
#     """基础配置类"""
#     # 项目根目录
#     BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    
#     # 基础配置
#     SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
#     DEBUG = False
#     TESTING = False
    
#     # 文件上传配置
#     MAX_CONTENT_LENGTH = 20 * 1024 * 1024  # 20MB
#     ALLOWED_EXTENSIONS = {'mp4', 'webm', 'jpg', 'jpeg', 'png'}
    
#     # AI模型配置
#     VISION_MODEL = "glm-4v-flash"
#     LLM_MODEL = "glm-4-flash-250414"
#     PROMPT = "请客观地描述一下你看到的内容，用亲眼所见的口吻来描述，直接说你看见了什么。请以 I see 开头，不要使用 video, picture, photo, scene 或者 camera 之类的字眼，大概100 字。"
    
#     # 视频处理配置
#     MAX_FRAMES = 5
    
#     # API配置
#     ZHIPU_API_KEY = os.environ.get('ZHIPU_API_KEY')
    
#     # 日志配置
#     LOG_LEVEL = 'INFO'
#     LOG_FILE = 'app.log'

# class DevelopmentConfig(BaseConfig):
#     """开发环境配置"""
#     DEBUG = True
#     LOG_LEVEL = 'DEBUG'
    
#     # 开发环境路径配置
#     UPLOAD_FOLDER = os.path.join(BaseConfig.BASE_DIR, 'uploads', 'dev')
#     DICTIONARY_PATH = 'knowledge_tmp/simple.pkl'
#     OUTPUT_DIR = os.path.join(UPLOAD_FOLDER, 'output_frames')
    
#     # 开发环境AI配置 - 使用测试数据
#     USE_MOCK_AI = True
#     MOCK_VIDEO_DESC = '我看到一个女人坐在看似是咖啡馆或餐厅的桌子上。她穿着无袖上衣，拿着玫瑰靠近脸。'
#     MOCK_VIDEO_DESC_EN = 'I see a woman sitting at a table in what appears to be a café or restaurant. She is wearing a sleeveless top and holding a rose close to her face.'
#     MOCK_POEM = '江永女书奇，闺中秘语稀。'
#     MOCK_POEM_EN = 'This is machine generated poem'
    
#     # 开发环境调试配置
#     ENABLE_DEBUG_ROUTES = True
#     SHOW_DETAILED_ERRORS = True

# class ProductionConfig(BaseConfig):
#     """生产环境配置"""
#     DEBUG = False
#     LOG_LEVEL = 'WARNING'
    
#     # 生产环境路径配置
#     UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER') or os.path.join(BaseConfig.BASE_DIR, 'uploads', 'prod')
#     DICTIONARY_PATH = os.environ.get('DICTIONARY_PATH') or 'knowledge_base/simple.pkl'
#     OUTPUT_DIR = os.path.join(UPLOAD_FOLDER, 'output_frames')
    
#     # 生产环境AI配置
#     USE_MOCK_AI = False
    
#     # 生产环境安全配置
#     ENABLE_DEBUG_ROUTES = False
#     SHOW_DETAILED_ERRORS = False
    
#     # 生产环境性能配置
#     MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50MB

# class TestingConfig(BaseConfig):
#     """测试环境配置"""
#     TESTING = True
#     DEBUG = True
#     LOG_LEVEL = 'DEBUG'
    
#     # 测试环境路径配置
#     UPLOAD_FOLDER = os.path.join(BaseConfig.BASE_DIR, 'uploads', 'test')
#     DICTIONARY_PATH = 'knowledge_tmp/test_simple.pkl'
#     OUTPUT_DIR = os.path.join(UPLOAD_FOLDER, 'output_frames')
    
#     # 测试环境配置
#     USE_MOCK_AI = True
#     ENABLE_DEBUG_ROUTES = True

# # 配置映射
# config = {
#     'development': DevelopmentConfig,
#     'production': ProductionConfig,
#     'testing': TestingConfig,
#     'default': DevelopmentConfig
# }

# # 获取当前环境配置
# def get_config():
#     """根据环境变量获取配置"""
#     env = os.environ.get('FLASK_ENV', 'development')
#     return config.get(env, config['default'])

# # 为了向后兼容，保留原有的Config类
# Config = get_config()