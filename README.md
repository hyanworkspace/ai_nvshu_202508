# AI女书 Web App

[![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-3.1.0-green.svg)](https://flask.palletsprojects.com)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 项目概述

AI女书是一个基于人工智能的女书字符生成和诗歌创作Web应用。用户可以通过上传视频或图片，让AI分析内容并生成相应的女书字符，体验完整的女书文化交互流程。

### ✨ 主要功能

- 🎥 **多媒体上传**: 支持视频(MP4/WebM)和图片(PNG/JPG)上传
- 🤖 **AI内容分析**: 使用智谱AI进行智能内容识别和描述
- 📝 **诗歌生成**: 基于分析结果自动生成中文诗歌
- 🔤 **女书字符生成**: 将诗歌中的字符转换为女书符号
- 🎮 **互动猜测**: 用户猜测女书字符含义的趣味体验
- 📚 **字典管理**: 用户贡献的字符可存储到公共字典
- 🌐 **双语支持**: 完整的中英文对照体验

### 🎯 技术特色

- **前端**: HTML5 + CSS3 + JavaScript + GSAP动画
- **后端**: Flask + Python 3.10+
- **AI模型**: 智谱AI (GLM-4V + GLM-4)
- **机器学习**: PyTorch + Transformers + BERT
- **图像处理**: OpenCV + PIL + MoviePy
- **文本处理**: Jieba分词 + Gensim词向量

## 核心组件结构

### 1. 后端核心文件
- **app.py** - Flask主应用，包含所有路由和API端点
- **config.py** - 配置文件，包含模型参数、路径等
- **ai_nvshu_functions.py** - 核心AI功能函数
- **utils.py** - 工具函数，包含向量处理、错误处理等
- **word_vector_manager.py** - 词向量管理器
- **media_analysis.py** - 媒体分析模块
- **process_video.py** - 视频处理工具
- **dict_io.py** - 字典读写操作

### 2. 前端文件
- **templates/** - HTML模板
- **static/** - 静态资源（CSS、JS、图片、字体）

### 3. 知识库文件
- **knowledge_base/** - 预训练数据和模型文件
- **knowledge_tmp/** - 临时知识库文件

## 🚀 快速开始

### 环境要求
- **Python**: 3.10+ (推荐 3.11)
- **FFmpeg**: 用于视频处理 (可选，仅视频功能需要)
- **内存**: 至少 4GB RAM (AI模型加载需要)
- **存储**: 至少 2GB 可用空间

### 安装步骤

#### 1. 克隆项目
```bash
git clone <repository-url>
cd ai_nvshu
```

#### 2. 创建虚拟环境 (推荐)
```bash
# 使用 venv
python -m venv venv
source venv/bin/activate  # Linux/Mac
# 或
venv\Scripts\activate     # Windows

# 或使用 conda
conda create -n nvshu python=3.11
conda activate nvshu
```

#### 3. 安装依赖

**推荐使用** (包含所有功能，去除非必要包):
```bash
pip install -r requirements-minimal.txt
```

**完整版本** (包含所有依赖，包括开发工具):
```bash
pip install -r requirements.txt
```

#### 4. 配置环境变量
创建 `.env` 文件并添加API密钥:
```bash
# 智谱AI API密钥 (必需)
ZHIPU_API_KEY=your_zhipu_api_key_here

# 可选配置
USE_MOCK_AI=false  # 是否使用模拟数据
```

#### 5. 运行应用
```bash
python app.py
```

#### 6. 访问应用
打开浏览器访问: `http://localhost:5001`

### 🔧 开发模式

启用调试模式:
```bash
export FLASK_DEBUG=1  # Linux/Mac
set FLASK_DEBUG=1     # Windows
python app.py
```

调试模式下会:
- 自动重载代码变更
- 使用模拟数据 (如果AI服务不可用)
- 显示详细错误信息

### 🔑 API配置

#### 智谱AI配置
1. 访问 [智谱AI开放平台](https://open.bigmodel.cn/)
2. 注册账号并获取API密钥
3. 在 `.env` 文件中设置:
   ```bash
   ZHIPU_API_KEY=your_actual_api_key
   ```

#### 模型配置
应用使用以下AI模型:
- **视觉模型**: `glm-4v-flash` (图像/视频分析)
- **语言模型**: `glm-4-flash-250414` (诗歌生成)

### 🛠️ 故障排除

#### 常见问题

**1. AI服务连接失败**
```bash
# 检查API密钥是否正确
echo $ZHIPU_API_KEY

# 使用模拟数据模式
export USE_MOCK_AI=true
python app.py
```

**2. 依赖安装失败**
```bash
# 升级pip
pip install --upgrade pip

# 使用国内镜像源
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple/
```

**3. 内存不足**
- 确保系统有至少4GB可用内存
- 关闭其他占用内存的应用
- 推荐使用 `requirements-minimal.txt` 减少依赖包

**4. 文件上传失败**
- 检查 `uploads/` 目录权限
- 确保文件大小不超过20MB
- 支持格式: MP4, WebM, PNG, JPG, JPEG

#### 日志查看
```bash
# 查看应用日志
tail -f app.log

# 查看详细错误信息
python app.py --debug
```

## 📱 用户使用流程

### 完整体验流程

#### 第一步：上传媒体文件
1. **访问首页** - 打开应用首页 (`/`)
2. **选择上传方式**：
   - **录制视频** - 点击录制按钮，使用摄像头录制视频
   - **上传文件** - 点击上传按钮，选择本地视频或图片文件
3. **确认上传** - 预览文件后点击确认按钮

**支持的文件格式：**
- 视频：MP4, WebM
- 图片：PNG, JPG, JPEG
- 文件大小限制：5MB

#### 第二步：AI分析处理
1. **自动跳转** - 上传成功后自动进入思考页面 (`/think`)
2. **AI分析** - 系统自动分析媒体内容：
   - 识别视频/图片中的场景和内容
   - 生成中文和英文描述
3. **查找相似诗歌** - AI在知识库中查找相关的女书诗歌
4. **生成新诗歌** - 基于分析结果创作新的诗歌

#### 第三步：字符生成与猜测
1. **进入猜测页面** - 自动跳转到猜测页面 (`/guess`)
2. **显示诗歌** - 左侧圆形显示生成的诗歌
3. **生成女书字符** - AI将诗歌中的某个字符转换为女书符号
4. **用户猜测** - 右侧显示多个选项，用户猜测字符含义
5. **选择答案** - 点击认为正确的选项

#### 第四步：结果展示
1. **查看结果** - 显示猜测结果和正确答案
2. **最终展示** - 跳转到最终展示页面 (`/frame_11`)
3. **查看生成内容**：
   - AI生成的女书字符图片
   - 原始上传的媒体文件
   - 生成的诗歌（中英文对照）
   - 用户信息

#### 第五步：存储选择
1. **选择存储** - 用户选择是否将生成的字符存储到公共字典
2. **访问字典** - 可以浏览所有已存储的AI女书字符
3. **重新开始** - 可以返回首页开始新的体验

### 交互特点
- **自动化流程** - 大部分步骤自动完成，用户只需关键选择
- **实时反馈** - 每个处理步骤都有状态显示
- **双语支持** - 所有内容都提供中英文对照
- **视觉体验** - 精美的UI设计和动画效果
- **知识积累** - 用户贡献的字符会添加到公共字典中

## 🔄 页面跳转逻辑

### 主要页面流程

#### 1. 首页 (`/` 或 `/see`) - `see.html`
**功能：** 用户上传媒体文件（视频/图片）的入口页面

**页面组件结构：**
- `page-body` - 页面主体容器
- `page-container` - 页面容器
- `background` - 背景图片容器
- `nvshu-overlay` - 女书图案覆盖层
- `main-content` - 主要内容容器
  - `circles-container` - 圆形容器布局
    - `video-recording-circle` - 视频录制圆形容器
      - `recording-circle-container` - 录制圆形容器
      - `dotted-border` - 虚线边框
      - `camera-icon-container` - 相机图标容器
      - `recording-text` - 录制提示文本
      - `record-preview` - 录制预览视频
      - `record-controls` - 录制控制按钮
        - `start-record-btn` - 开始录制按钮
        - `stop-record-btn` - 停止录制按钮
    - `file-upload-circle` - 文件上传圆形容器
      - `upload-circle-container` - 上传圆形容器
      - `upload-dotted-border` - 上传虚线边框
      - `upload-icon-container` - 上传图标容器
      - `upload-text` - 上传提示文本
      - `format-info` - 格式信息文本
      - `file-input` - 文件输入框
- `confirmation-page` - 确认页面（隐藏状态）
  - `confirmation-background` - 确认页面背景
  - `confirmation-nvshu-overlay` - 确认页面女书覆盖层
  - `confirmation-main-content` - 确认页面主内容
    - `privacy-statement` - 隐私声明文本
    - `preview-container` - 预览容器
      - `preview-circle` - 预览圆形
      - `preview-dotted-border` - 预览虚线边框
      - `video-preview` - 视频预览
    - `action-buttons` - 操作按钮容器
      - `re-upload-button-container` - 重新上传按钮容器
        - `re-upload-btn` - 重新上传按钮
      - `confirm-button-container` - 确认按钮容器
        - `confirm-btn` - 确认按钮
- `privacy-policy-modal` - 隐私政策弹窗（隐藏状态）
  - `modal-backdrop` - 弹窗背景遮罩
  - `modal-content` - 弹窗内容
    - `modal-body` - 弹窗主体
      - `modal-title` - 弹窗标题
      - `modal-text` - 弹窗文本内容
    - `modal-footer` - 弹窗底部
      - `agree-btn` - 同意按钮

**主要交互元素：**
- **录制视频按钮** - 调用摄像头录制视频
- **上传文件按钮** - 选择本地文件上传
- **确认按钮** - 跳转到思考页面

**JavaScript逻辑：**
- `see.js` 处理文件上传和录制
- 支持拖拽上传
- 上传成功后调用 `confirm_video()` 函数跳转到 `/think?media_url=xxx`

**支持的文件格式：**
- 视频：MP4, WebM
- 图片：PNG, JPG, JPEG
- 文件大小限制：5MB

#### 2. 思考页面 (`/think`) - `think.html`
**功能：** AI分析媒体并生成诗歌的中间处理页面

**页面组件结构：**
- `background` - 背景图片容器
- `main-container` - 主内容容器
- `layout-row` - 左右布局行
- `left-panel` - 左侧面板
  - `left-title` - "Observation"标题
  - `left-media-wrapper` - 媒体包装器
    - `media-circle-bottom` - 底层视频圆形
    - `media-element` - 视频/图片元素
    - `media-circle-overlay` - 覆盖圆形
    - `left-content` - 动态内容显示区域
- `right-panel` - 右侧面板
  - `right-title` - "Process Status"标题
  - `status-list` - 状态列表容器

**自动处理流程：**
1. **媒体分析** → 调用 `/describe_video` API
2. **查找相似诗歌** → 调用 `/find_similar_poems` API  
3. **生成新诗歌** → 调用 `/generate_poem` API
4. **自动跳转** → 跳转到 `/guess?poem=xxx`

**JavaScript逻辑：**
- `think.js` 控制整个AI处理流程
- 每个步骤完成后自动进入下一步
- 使用打字机效果显示处理结果
- 最后自动跳转到猜测页面

#### 3. 猜测页面 (`/guess`) - `guess.html`
**功能：** 用户猜测AI生成的女书字符含义

**页面组件结构：**
- `page-body` - 页面主体容器
- `background` - 背景图片容器
- `header` - 页面头部
  - `consensus-title` - "Consensus Reached!"标题（隐藏状态）
- `main-content` - 主要内容容器
  - `left-panel` - 左侧面板（Speaker）
    - `speaker-circle-wrapper` - 说话者圆形包装器
    - `speaker-circle` - 说话者圆形容器
    - `original-text` - 原始诗歌文本显示区域
    - `speaker-label` - "Speaker"标签
  - `center-panel` - 中间面板
    - `encoding-text` - 编码提示文本
      - `encoding-title` - "Encoding..."标题
      - `encoding-subtitle` - 编码副标题
    - `guessing-text` - 猜测提示文本
      - `guessing-title` - "Guessing..."标题
      - `guessing-subtitle` - 猜测副标题
    - `loading` - 加载提示文本
    - `char-image-container` - 字符图片容器
    - `button-container` - 按钮容器
  - `right-panel` - 右侧面板（Listener）
    - `listener-circle-wrapper` - 听者圆形包装器
    - `listener-circle` - 听者圆形容器
    - `revealing-text` - 揭示文本显示区域
    - `listener-label` - "Listener"标签

**页面布局：**
- **左侧圆形** - 显示原始诗歌
- **中间区域** - 显示生成的女书字符
- **右侧圆形** - 显示猜测选项

**主要功能：**
- 显示原始诗歌
- 生成女书字符（调用 `/generate_char` API）
- 显示多个猜测选项
- 用户选择正确答案

**跳转逻辑：**
- 用户选择猜测后 → 跳转到结果页面

#### 4. 结果页面 (`/get_result`) - `result.html`
**功能：** 显示最终结果

**页面组件结构：**
- `page-body` - 页面主体容器
- `background` - 背景图片容器
- `main-container` - 主容器
  - `left-panel` - 左侧面板
    - `media-container` - 媒体容器
      - `video-circle` - 视频圆形容器
      - `video-element` - 视频元素
      - `char-overlay` - 字符覆盖层
      - `char-image` - 字符图片
      - `char-translate` - 字符翻译文本
      - `top-overlay` - 顶部覆盖层
      - `spacer` - 占位元素
    - `dimensions-display` - 3D尺寸显示
      - `dimensions-text` - 尺寸文本
      - `dimensions-title` - 尺寸标题
  - `right-panel` - 右侧面板
    - `content-wrapper` - 内容包装器
      - `congratulations-title` - 祝贺标题
      - `success-message` - 成功消息
      - `name-input-section` - 姓名输入区域
        - `name-prompt` - 姓名提示
        - `name-input` - 姓名输入框
        - `save-button` - 保存按钮

**跳转逻辑：**
- 显示结果后 → 跳转到最终展示页面

#### 5. 最终展示页面 (`/frame_11`) - `frame_11.html`
**功能：** 展示生成的AI女书字符和相关信息

**页面组件结构：**
- `page-body` - 页面主体容器
- `background` - 背景图片容器
- `main-container` - 主容器（带虚线边框）
  - `content-wrapper` - 内容包装器
    - `background-strip` - 背景装饰条
    - `left-column` - 左侧文本列
      - `character-info` - 字符信息
        - `character-title` - 字符标题
      - `creator-info` - 创建者信息
        - `creator-text` - 创建者文本
      - `poem-info` - 诗歌信息
        - `poem-label` - 诗歌标签
        - `poem-text` - 诗歌文本
        - `poem-eng-text` - 英文诗歌文本
    - `right-column` - 右侧圆形列
      - `ai-character-circle` - AI字符圆形
        - `character-background` - 字符背景
        - `character-image` - 字符图片
      - `video-wrapper` - 视频包装器
        - `video-circle` - 视频圆形
        - `video-element` - 视频元素
        - `video-overlay` - 视频覆盖层
      - `original-poem-circle` - 原始诗歌圆形
        - `poem-display` - 诗歌显示
        - `poem-eng-display` - 英文诗歌显示
- `bottom-section` - 底部区域
  - `bottom-content` - 底部内容
    - `storage-question` - 存储问题
      - `question-text` - 问题文本
      - `storage-options` - 存储选项
        - `yes-option` - 是选项
        - `no-option` - 否选项
    - `action-buttons` - 操作按钮
      - `save-image-button` - 保存图片按钮
      - `dictionary-button` - 字典按钮
      - `share-section` - 分享区域
        - `share-label` - 分享标签
        - `wechat-share` - 微信分享
        - `instagram-share` - Instagram分享
        - `copy-link` - 复制链接

**页面内容：**
- 生成的字符图片
- 原始视频/图片
- 诗歌内容（中英文）
- 用户信息

**交互功能：**
- **存储选择** - 用户选择是否存储到字典
- **截图功能** - 可以保存当前页面为图片

**跳转逻辑：**
- 选择存储 → 调用 `/add_to_dictionary` API
- 可以访问字典 → 跳转到字典页面

#### 6. 字典页面 (`/dictionary`) - `dictionary.html`
**功能：** 浏览所有已存储的AI女书字符

**页面组件结构：**
- `page-body` - 页面主体容器
- `background` - 背景图片容器
- `main-container` - 主容器
  - `header-section` - 头部区域
    - `page-title` - 页面标题 "Nüshu Character Dictionary"
    - `page-subtitle` - 页面副标题
  - `controls-section` - 控制区域
    - `search-input` - 搜索输入框
    - `pagination-controls` - 分页控制
      - `prev-button` - 上一页按钮
      - `page-info` - 页面信息显示
      - `next-button` - 下一页按钮
  - `dictionary-grid` - 字典网格容器
    - `loading-message` - 加载消息

**主要功能：**
- **搜索功能** - 调用 `/search_dictionary` API
- **分页浏览** - 显示字典内容
- **字符展示** - 显示字符图片和含义

**交互：**
- 可以返回首页重新开始流程

## API端点映射

| 前端调用 | 后端路由 | 方法 | 功能描述 |
|---------|---------|------|---------|
| `/upload` | `POST /upload` | POST | 文件上传 |
| `/describe_video` | `POST /describe_video` | POST | 媒体分析 |
| `/find_similar_poems` | `POST /find_similar_poems` | POST | 查找相似诗歌 |
| `/generate_poem` | `POST /generate_poem` | POST | 生成新诗歌 |
| `/replace_with_created_char` | `POST /replace_with_created_char` | POST | 替换字符 |
| `/generate_char` | `POST /generate_char` | POST | 生成女书字符 |
| `/save_user_name` | `POST /save_user_name` | POST | 保存用户名 |
| `/save_storage_preference` | `POST /save_storage_preference` | POST | 保存存储偏好 |
| `/get_dictionary` | `GET /get_dictionary` | GET | 获取字典数据 |
| `/search_dictionary` | `GET /search_dictionary` | GET | 搜索字典 |
| `/add_to_dictionary` | `POST /add_to_dictionary` | POST | 添加到字典 |

## 数据流向

### Session数据传递

应用使用Flask session在不同页面间传递数据：

| 数据键 | 类型 | 描述 |
|--------|------|------|
| `media_url` | String | 上传的媒体文件URL |
| `original_media_url` | String | 原始媒体文件URL |
| `poem` | String | 生成的诗歌 |
| `poem_eng` | String | 英文诗歌 |
| `char_img_path` | String | 生成的字符图片路径 |
| `char_translate` | String | 字符翻译 |
| `char_3dim` | Array | 字符3D数据 |
| `user_name` | String | 用户名 |
| `storage_preference` | String | 存储偏好 |

### URL参数传递

页面间通过URL参数传递数据：

| 参数名 | 描述 | 示例 |
|--------|------|------|
| `media_url` | 媒体文件URL | `/think?media_url=/uploads/xxx.mp4` |
| `original_media_url` | 原始媒体URL | `/think?original_media_url=/uploads/xxx.mp4` |
| `poem` | 诗歌内容 | `/guess?poem=江永女书奇` |

## 📁 项目结构

```
ai_nvshu/
├── 📄 app.py                    # Flask主应用文件
├── 📄 config.py                 # 配置文件
├── 📄 ai_nvshu_functions.py     # AI核心功能函数
├── 📄 utils.py                  # 工具函数
├── 📄 word_vector_manager.py    # 词向量管理器
├── 📄 media_analysis.py         # 媒体分析模块
├── 📄 process_video.py          # 视频处理工具
├── 📄 dict_io.py               # 字典读写操作
├── 📄 requirements.txt          # 完整依赖列表
├── 📄 requirements-minimal.txt  # 最小依赖列表
├── 📄 .env                     # 环境变量配置
├── 📁 templates/               # HTML模板
│   ├── 📄 landingpage.html     # 首页
│   ├── 📄 see.html            # 上传页面
│   ├── 📄 think.html          # 思考页面
│   ├── 📄 guess.html          # 猜测页面
│   ├── 📄 result.html         # 结果页面
│   ├── 📄 frame_11.html       # 最终展示页面
│   ├── 📄 dictionary.html     # 字典页面
│   └── 📄 about.html          # 关于页面
├── 📁 static/                 # 静态资源
│   ├── 📁 css/               # 样式文件
│   ├── 📁 js/                # JavaScript文件
│   ├── 📁 images/            # 图片资源
│   ├── 📁 fonts/             # 字体文件
│   └── 📁 nvshu_images/      # 女书字符图片
├── 📁 knowledge_base/         # 知识库文件
│   ├── 📄 data.json          # 女书数据
│   ├── 📄 simple.pkl         # 简化女书字典
│   ├── 📄 word_vectors.pkl   # 词向量文件
│   └── 📁 nvshu_comp/        # 女书组件图片
├── 📁 models/                 # AI模型文件
│   └── 📁 bert-base-chinese/ # BERT中文模型
├── 📁 uploads/                # 用户上传文件
└── 📁 knowledge_tmp/          # 临时知识库文件
```

## 🚀 部署指南

### 本地开发部署
```bash
# 1. 克隆项目
git clone <repository-url>
cd ai_nvshu

# 2. 创建虚拟环境
python -m venv venv
source venv/bin/activate

# 3. 安装依赖
pip install -r requirements-minimal.txt

# 4. 配置环境变量
echo "ZHIPU_API_KEY=your_api_key" > .env

# 5. 运行应用
python app.py
```

### 生产环境部署

#### 使用 Gunicorn + Nginx
```bash
# 1. 安装 Gunicorn
pip install gunicorn

# 2. 启动 Gunicorn
gunicorn -w 4 -b 127.0.0.1:8000 app:app

# 3. 配置 Nginx (参考 DEPLOYMENT.md)
```

#### 使用 Docker (推荐)
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements-minimal.txt .
RUN pip install -r requirements-minimal.txt

COPY . .
EXPOSE 5001

CMD ["python", "app.py"]
```

```bash
# 构建和运行
docker build -t ai-nvshu .
docker run -p 5001:5001 -e ZHIPU_API_KEY=your_key ai-nvshu
```

### 云服务部署

#### Vercel 部署
```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel --prod
```

#### Railway 部署
```bash
# 连接 GitHub 仓库
# 设置环境变量: ZHIPU_API_KEY
# 自动部署
```

详细部署说明请参考 [DEPLOYMENT.md](DEPLOYMENT.md)

### 📦 依赖包说明

| 文件 | 用途 | 包数量 | 说明 |
|------|------|--------|------|
| `requirements-minimal.txt` | **推荐使用** | ~35个 | 包含所有功能，去除非必要包 |
| `requirements.txt` | 完整版本 | ~200个 | 包含所有依赖，包括开发工具 |

**已删除的非必要包：**
- Jupyter相关：jupyter, jupyterlab, ipython, ipykernel等
- 开发工具：debugpy, ruff, livereload
- 其他框架：fastapi, gradio, uvicorn
- 数据科学：pandas, matplotlib相关
- 各种验证器和解析器

**保留的核心功能包：**
- ✅ Web框架：Flask + flask-cors
- ✅ AI/ML：PyTorch + Transformers + scikit-learn
- ✅ AI服务：zhipuai (智谱AI SDK)
- ✅ 图像处理：OpenCV + PIL + MoviePy
- ✅ 文本处理：jieba + gensim + googletrans
- ✅ 网络请求：requests + httpx
- ✅ 配置管理：python-dotenv

## 技术栈

- **后端：** Flask (Python)
- **前端：** HTML5, CSS3, JavaScript
- **样式：** Tailwind CSS
- **动画：** GSAP
- **AI功能：** 自定义AI函数模块

## 运行说明

1. 安装依赖：
```bash
pip install -r requirements.txt
```

2. 运行应用：
```bash
python app.py
```

3. 访问应用：
```
http://localhost:5000
```

## 开发模式

应用支持调试模式，在 `app.py` 中设置：
```python
app.run(debug=True)  # 启用调试模式
```

调试模式下会使用模拟数据，跳过实际的AI处理过程。

## 📋 注意事项

- 确保上传目录存在且有写入权限
- 文件大小限制为20MB
- 支持的文件格式：MP4, WebM, PNG, JPG, JPEG
- 应用会自动清理超过24小时的临时文件
- 首次运行需要下载BERT模型，请确保网络连接正常

## 🤝 贡献指南

我们欢迎各种形式的贡献！

### 如何贡献
1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 开发规范
- 遵循 PEP 8 Python 代码规范
- 添加适当的注释和文档
- 确保代码通过测试
- 更新相关文档

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [智谱AI](https://open.bigmodel.cn/) - 提供AI模型服务
- [Hugging Face](https://huggingface.co/) - 提供预训练模型
- [Flask](https://flask.palletsprojects.com/) - Web框架
- [PyTorch](https://pytorch.org/) - 深度学习框架

## 📞 联系我们

- 项目主页: [GitHub Repository]
- 问题反馈: [Issues]
- 邮箱: [your-email@example.com]

---

**AI女书** - 让传统文化在AI时代焕发新的生命力 ✨

## 🐛 调试指南

### AI服务问题调试

如果遇到AI识别失败的错误，可以按以下步骤调试：

#### 1. 运行AI服务测试脚本
```bash
python debug_ai.py
```

这个脚本会测试：
- 配置文件是否正确加载
- 智谱AI API是否可用
- 视觉API是否正常工作

#### 2. 检查环境变量
确保 `.env` 文件中设置了正确的API密钥：
```bash
ZHIPU_API_KEY=your-api-key-here
```

#### 3. 使用模拟数据模式
如果AI服务不可用，可以设置环境变量使用模拟数据：
```bash
export USE_MOCK_AI=true
python app.py
```

#### 4. 查看详细日志
启用调试模式查看详细错误信息：
```python
# 在 app.py 中设置
app.run(debug=True)
```

#### 5. 常见错误及解决方案

| 错误类型 | 可能原因 | 解决方案 |
|---------|---------|---------|
| `Media recognition failed` | AI API调用失败 | 检查API密钥和网络连接 |
| `File not found` | 文件路径错误 | 检查上传目录权限 |
| `Invalid file path` | 路径安全问题 | 检查文件是否在允许目录内 |
| `TypeError: not all arguments converted` | 日志格式化错误 | 已修复，更新代码 |
| `SSL: UNEXPECTED_EOF` | 网络连接不稳定 | 自动重试，或使用演示数据继续体验 |

#### 6. 用户体验改进

**错误处理优化：**
- **自动重试机制** - AI服务失败时自动重试3次
- **友好错误提示** - 显示具体错误原因和解决建议
- **演示数据模式** - 当AI服务不可用时，提供演示数据继续体验
- **超时处理** - 5秒后显示跳过选项，避免用户长时间等待
- **重试按钮** - 允许用户手动重试失败的请求

**加载状态优化：**
- **进度提示** - 显示当前处理步骤
- **状态切换** - 清晰显示加载、错误、成功状态
- **非阻塞体验** - 即使AI服务失败，用户仍可继续体验

### 日志查看
应用日志保存在 `app.log` 文件中，可以通过以下命令查看：
```bash
tail -f app.log
```

## 🛠️ 技术细节

### 开发模式

应用支持调试模式，在 `app.py` 中设置：
```python
app.run(debug=True)  # 启用调试模式
```

调试模式下会使用模拟数据，跳过实际的AI处理过程。

### 文件结构

```
ai_nvshu/
├── app.py                 # 主应用文件
├── routes/
│   ├── api.py            # API路由
│   └── debug.py          # 调试路由
├── templates/            # HTML模板
│   ├── see.html          # 首页
│   ├── think.html        # 思考页面
│   ├── guess.html        # 猜测页面
│   ├── result.html       # 结果页面
│   ├── frame_11.html     # 最终展示页面
│   └── dictionary.html   # 字典页面
├── static/
│   ├── js/              # JavaScript文件
│   │   ├── see.js       # 首页逻辑
│   │   ├── think.js     # 思考页面逻辑
│   │   └── guess.js     # 猜测页面逻辑
│   ├── css/             # 样式文件
│   └── images/          # 图片资源
└── knowledge_base/      # 知识库文件
```

### 技术栈

- **后端：** Flask (Python)
- **前端：** HTML5, CSS3, JavaScript
- **样式：** Tailwind CSS
- **动画：** GSAP
- **AI功能：** 自定义AI函数模块

### 数据流向

#### Session数据传递

应用使用Flask session在不同页面间传递数据：

| 数据键 | 类型 | 描述 |
|--------|------|------|
| `media_url` | String | 上传的媒体文件URL |
| `original_media_url` | String | 原始媒体文件URL |
| `poem` | String | 生成的诗歌 |
| `poem_eng` | String | 英文诗歌 |
| `char_img_path` | String | 生成的字符图片路径 |
| `char_translate` | String | 字符翻译 |
| `char_3dim` | Array | 字符3D数据 |
| `user_name` | String | 用户名 |
| `storage_preference` | String | 存储偏好 |

#### URL参数传递

页面间通过URL参数传递数据：

| 参数名 | 描述 | 示例 |
|--------|------|------|
| `media_url` | 媒体文件URL | `/think?media_url=/uploads/xxx.mp4` |
| `original_media_url` | 原始媒体URL | `/think?original_media_url=/uploads/xxx.mp4` |
| `poem` | 诗歌内容 | `/guess?poem=江永女书奇` |
