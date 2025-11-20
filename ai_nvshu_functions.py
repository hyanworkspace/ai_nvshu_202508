from googletrans import Translator
from transformers import BertTokenizer, BertModel
import torch
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from config import Config
from dotenv import load_dotenv
import os
from PIL import Image
import time
from zhipuai import ZhipuAI
from utils import *
from dict_io import *
from word_vector_manager import word_vectors
from googletrans import Translator

# variables --------------------
load_dotenv()  # 加载 .env 文件中的环境变量

ZHIPU_API_KEY = os.getenv('ZHIPU_API_KEY')
nvshu_ai = ZhipuAI(api_key=ZHIPU_API_KEY)

# 简单的重试装饰器
def retry_on_network_error(max_retries=3, backoff_factor=0.5):
    def decorator(func):
        def wrapper(*args, **kwargs):
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_retries - 1:
                        raise e
                    time.sleep(backoff_factor * (2 ** attempt))
            return None
        return wrapper
    return decorator



# 加载预训练的 BERT 模型和分词器
tokenizer = BertTokenizer.from_pretrained('bert-base-uncased')
model = BertModel.from_pretrained('bert-base-uncased')

simple_el_dict = load_dict_from_file('knowledge_tmp/simple.pkl')

# functions --------------------
@retry_on_network_error(max_retries=3, backoff_factor=0.5)
def translate_text(text, src_language='en', target_language="zh-cn"):
    # 首先尝试使用增强的 googletrans
    try:
        translator = Translator()
        if translator:
            result = translator.translate(text, src=src_language, dest=target_language)
            return result.text
        else:
            raise Exception("Google翻译客户端未初始化")
    except Exception as e:
        # 如果 googletrans 失败，尝试使用增强的 zhipu_AI
        try:
            if not nvshu_ai:
                raise Exception("智谱AI客户端未初始化")
                
            # 构建翻译提示
            if target_language == "zh-cn" and src_language == "en":
                prompt = f"请将以下英文翻译成中文，只返回翻译结果，不要其他内容：{text}"
            elif target_language == "en" and src_language == "zh-cn":
                prompt = f"请将以下中文翻译成英文，只返回翻译结果，不要其他内容：{text}"
            else:
                # 其他语言组合
                prompt = f"请将以下{src_language}文本翻译成{target_language}，只返回翻译结果，不要其他内容：{text}"
            
            completion = nvshu_ai.chat.completions.create(
                model=Config.LLM_MODEL,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=100,
            )
            
            translation = completion.choices[0].message.content.strip()
            return translation
            
        except Exception as ai_error:
            # 如果两种方法都失败，使用简单的映射
            
            # 如果两种方法都失败，使用简单的映射
            simple_translations = {
                'book': '书', 'strange': '奇', 'woman': '女', 'character': '字', 'text': '文',
                'beautiful': '美', 'flower': '花', 'moon': '月', 'love': '爱', 'heart': '心',
                'spring': '春', 'autumn': '秋', 'winter': '冬', 'summer': '夏', 'night': '夜',
                'day': '日', 'mountain': '山', 'river': '水', 'wind': '风', 'rain': '雨',
                'red': '红', 'black': '黑', 'white': '白', 'green': '绿', 'blue': '蓝',
                'dance': '舞', 'move': '动', 'posture': '姿', 'back': '背', 'scene': '景',
                'middle': '中', 'scarf': '巾', 'skirt': '裙', 'purple': '紫', 'sunset': '霞'
            }
            
            if target_language == "zh-cn" and src_language == "en":
                return simple_translations.get(text.lower(), text)
            elif target_language == "en" and src_language == "zh-cn":
                # 反向映射
                reverse_translations = {v: k for k, v in simple_translations.items()}
                return reverse_translations.get(text, text)
            
            # 如果都不行，返回原文
            return text

# 定义向量化函数
def vectorize_texts(texts):
    embeddings = []
    for text in texts:
        # 对文本进行分词
        inputs = tokenizer(text, return_tensors='pt', padding=True, truncation=True, max_length=512)
        # 获取BERT模型输出
        with torch.no_grad():
            outputs = model(**inputs)
        # 提取最后一层的隐藏状态的第一个 token 的向量表示（[CLS] token）
        cls_embedding = outputs.last_hidden_state[:, 0, :]
        embeddings.append(cls_embedding.numpy())
    # 将嵌入列表转换为 NumPy 数组
    return np.vstack(embeddings)


def find_most_similar_texts(input_embedding, text_embeddings, texts, n=5):
    # 计算相似度
    similarity_matrix = cosine_similarity(input_embedding, text_embeddings)

    # 找到最相似的文本的索引
    most_similar_indices = np.argsort(similarity_matrix[0, 1:])[-n:][::-1] + 1

    # 获取最相似的文本并去掉换行符
    most_similar_texts = [texts[i].replace('\n', '') for i in most_similar_indices]

    return most_similar_texts, most_similar_indices


# 最主要的函数 --------------------
# 视频/图像识别 + 找到最相近的三句诗，返回
def recognize_and_translate(filename, media_type, session_id, logger=None):
    try:
        if logger:
            logger.debug(f"Starting processing for session: {session_id}")
            
        # Ensure filename is a string (in case it's passed as a tuple)
        if isinstance(filename, tuple):
            filename = filename[0]  # Take the first element if it's a tuple
            
        media_path = os.path.join(Config.UPLOAD_FOLDER, os.path.basename(filename))
        if logger:
            logger.info(f"调用 media_path: {media_path}")
        
        # Verify the path exists
        if not os.path.exists(media_path):
            raise FileNotFoundError(f"Video file not found at: {media_path}")
        from media_analysis import MediaAnalyzer
        analyzer = MediaAnalyzer(Config.VISION_MODEL, media_type, session_id)
        # result = analyzer.analyze_media(media_path)
        result = analyzer.analyze_media(filename)
        
        # 如果返回的是元组（分析结果，关键帧路径），则处理关键帧路径
        if isinstance(result, tuple) and len(result) == 2:
            analysis_result, keyframe_path = result
            # 将关键帧路径转换为URL
            if keyframe_path:
                # 从绝对路径转换为相对URL
                keyframe_url = keyframe_path.replace(Config.BASE_DIR, '').replace('\\', '/')
                if not keyframe_url.startswith('/'):
                    keyframe_url = '/' + keyframe_url
                return translate_text(analysis_result), analysis_result, keyframe_url
            else:
                return translate_text(analysis_result), analysis_result, None
        else:
            # 兼容旧格式（只返回分析结果）
            return translate_text(result), result, None
    except Exception as e:
        if logger:
            logger.debug(f"调用video recg API时出错: {str(e)}")
        # 重新抛出异常，让调用者知道发生了什么
        raise e

# 怀旧打字机，纸上诉真情。
def find_similar(translated_result, n=3):
    # 读中英文版的
    poems = list()
    poems_eng = list()
    with open('knowledge_base/nvshu_origin_with_eng.txt', 'r', encoding='utf-8') as file:
        for index, line in enumerate(file):
            # Check if the line index is even or odd
            if index % 2 == 0:
                poems.append(line.rstrip())
            else:
                poems_eng.append(line.rstrip())
    poem_embeddings = load_dict_from_file("knowledge_base/poem_embeddings")
    try:
        # 找到最相似的诗句
        input_embedding = vectorize_texts([translated_result])
        most_similar_texts, idx = find_most_similar_texts(input_embedding, poem_embeddings, poems, n)
        most_similar_texts_eng = [poems_eng[i] for i in idx]

        return most_similar_texts, most_similar_texts_eng
    except Exception as e:
        print(f"find_similar()函数出错: {str(e)}")

def validate_poem_format(poem):
    """检查是否为五言诗（两句，每句五个字）"""
    normalized_poem = poem.replace(",", "，")
    parts = [part.strip() for part in normalized_poem.split("，") if part.strip()]
    return len(parts) == 2 and all(len(part.strip()) == 5 for part in parts)

def ensure_five_chars(poem):
    """确保每句都是5个字，如果超过则截取前5个字"""
    if not poem:
        return poem
    
    # 按逗号分割
    parts = poem.split('，')
    if len(parts) != 2:
        return poem
    
    # 处理每一句，确保是5个字
    processed_parts = []
    for part in parts:
        part = part.strip()
        if len(part) > 5:
            part = part[:5]
        processed_parts.append(part)
    
    # 重新组合
    return '，'.join(processed_parts)

def create_new_poem(video_description, similar_poems, max_retries=2):
    retry_count = 0
    last_error = None
    
    while retry_count <= max_retries:
        try:
            # v2
            completion = nvshu_ai.chat.completions.create(
                model=Config.LLM_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": "你是一位旧时的女性诗人，必须严格按照五言诗格式（两句，每句五个字）生成诗歌。写一句五言诗，如：一齐花纸女，我来几俫欢。要求：上下两句，每句都是五个字，严禁不同字数，共十个中文字。直接给出诗句，中间用逗号分开，不要用特殊字符。",
                    },
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": f"{video_description}，基于这段文字内容，请你以旧时的女性的视角，结合这三句诗句：{similar_poems}创作一个新的五言诗。必须严格按照五言诗格式（两句，每句五个字）生成诗歌。直接给出诗歌。"
                            }
                        ]
                    }
                ],
                max_tokens=50,
            )
            new_poem = completion.choices[0].message.content.strip()
            
            # 确保每句都是5个字
            new_poem = ensure_five_chars(new_poem)

            # 检查诗歌格式（确保是五言诗）
            if not validate_poem_format(new_poem):
                print(new_poem)
                raise ValueError("Generated poem does not meet the required format")

            # 返回诗歌及其翻译
            return new_poem, translate_text(new_poem, 'zh-cn', 'en')
        except Exception as e:
            last_error = e
            print(f"Attempt {retry_count + 1} failed: {e}")
            retry_count += 1
            if retry_count <= max_retries:
                time.sleep(1)  # 稍作延迟再重试
    # 如果所有尝试都失败，返回默认值
    print(f"All retries failed. Last error: {last_error}")
    default_poem = "江永女书奇，闺中秘语稀。"
    try:
        default_translation = translate_text(default_poem, 'zh-cn', 'en')
    except:
        default_translation = "Jiang Yong female script, secret words in boudoir."
    return default_poem, default_translation


# create_nvshu_from_poem('江永女书奇，闺中秘语稀。')
# poem = '江永女书奇，闺中秘语稀。'
# poem = '色舞影婆娑，巾裙紫红霞。'
def create_nvshu_from_poem(poem):
    try:
        # 验证输入参数
        if not poem or not isinstance(poem, str):
            raise ValueError("诗句参数无效：必须提供非空字符串")
        
        if len(poem) < 5:
            raise ValueError("诗句长度不足：至少需要5个字符")
        
        # 验证word_vectors是否正确加载
        if word_vectors is None:
            raise RuntimeError("词向量管理器未正确初始化")
        
        # A发送诗句给B
        EL_mappings = load_dict_from_file('knowledge_tmp/EL_vectors.pkl')
        
        with open('knowledge_base/pca.pkl', 'rb') as f:
            pca = pickle.load(f)

        current_knowledge = SharedKnowledge()
        current_knowledge.known_mappings = EL_mappings
        current_knowledge.simple_el_dict = simple_el_dict

        # 创建两个Machine对象
        machine_A = Machine('A', current_knowledge, n=1, pca=pca)
        machine_B = Machine('B', current_knowledge, n=1, pca=pca)

        try:
            # print(f"尝试读取诗句……")
            marked_message, el_message_vectors = machine_A.send_message(poem)
            if marked_message == "skip_flag":   # 检查标记，并跳过当前句子
                raise ValueError("诗句中的所有字符都已包含在知识库中，无法生成新的女书字符")
        except KeyError as e:
            raise RuntimeError(f"生成女书字符时出现键错误: {str(e)}")
        except Exception as e:
            raise RuntimeError(f"发送消息时出现错误: {str(e)}")

        # B接收诗句并猜测EL字符
        max_tries = 5
        list_to_guess = list()
        word_idx = 0
        list_of_guess = []
        for j in range(max_tries):
            
            guess = machine_B.receive_message(marked_message, el_message_vectors)

            if j == 0:
                word_idx = get_differing_indices(guess, poem)[0]
                random_number = random.randint(1000, 4000)
                list_to_guess = get_transition_keys(word_vectors, guess[word_idx], poem[word_idx])
                list_to_guess = sample_transition_keys(list_to_guess, random_number)
                # print(list_to_guess)
            else:
                if len(list_to_guess) > 0:
                    guess = replace_string_element(guess, word_idx, list_to_guess[0])
                    list_to_guess = list_to_guess[1:]
                    
            # print(f"Guess result {j}: {guess}")
            list_of_guess.append(guess[machine_A.replaced_indices[0]])
            is_correct, feedback = machine_A.check_guess(guess, el_message_vectors, machine_B)

            if is_correct:
                # print(f"B的猜测在第{j+1}次就完全正确！")
                machine_A.knowledge.known_mappings[feedback[0]] = feedback[1]
                machine_B.knowledge.known_mappings[feedback[0]] = feedback[1]
                break

            elif j == max_tries -  1:
                if feedback is not None: # 确认feedback非空
                    # print(f"在{j+1}次尝试后，A告诉B正确答案")
                    # 更新 A 和 B 的 known_mappings
                    machine_A.knowledge.known_mappings[feedback[0]] = feedback[1]
                    machine_B.knowledge.known_mappings[feedback[0]] = feedback[1]

                    # 改动这两句代码，B在知道答案后将其加入知识库,然后再返回
                    updated_guess = machine_B.receive_message(marked_message, el_message_vectors)
                    # print(f"获得答案后，B答对了，猜测结果为：{updated_guess}")
                    guess = updated_guess
        
        # 验证feedback不为空
        if feedback is None or len(feedback) < 2:
            raise RuntimeError("无法生成有效的女书字符反馈")
        
        # 中文字, 中文字位置, 女书字（3-dim），768-dim vect, list of guess, list of guess(translated in eng), 带有替换字的五言诗的翻译
        idx = poem.index(feedback[0])
        guess_poems = [poem[:idx] + i + poem[idx+1:] for i in list_of_guess]
        char_3dim = machine_A.knowledge.simple_el_dict[feedback[0]]['char_3dim']
        return feedback[0], idx, char_3dim, list(feedback[1].astype('float')), list_of_guess, [translate_text(x, 'zh-cn', 'en').lower() for x in list_of_guess], [translate_text(x, 'zh-cn', 'en').lower() for x in guess_poems]
    except Exception as e:
        # 提供更详细的错误信息
        error_msg = f"生成女书字符失败: {str(e)}"
        if "word_vectors" in str(e):
            error_msg = "词向量系统初始化失败，请检查知识库文件"
        elif "pickle" in str(e).lower():
            error_msg = "知识库文件损坏或不存在，请重新初始化知识库"
        elif "index" in str(e).lower():
            error_msg = "诗句字符索引错误，请检查诗句格式"
        
        print(f"create_nvshu_from_poem 错误: {error_msg}")
        raise RuntimeError(error_msg)

def get_char_translate(char_cn, poem, poem_eng):
    try:
        completion = nvshu_ai.chat.completions.create(
            model=Config.LLM_MODEL,  # 使用LLM模型而不是VISION模型
            messages=[
                {
                    "role": "user",
                    "content": f"这句五言诗{poem}的翻译是{poem_eng}，请返回对应{char_cn}这个字的英语单词。要求只要输出一个单词。"
                }
            ],
            max_tokens=50,
        )
        return completion.choices[0].message.content
    except Exception as e:
        # 如果AI服务失败，使用简单的字符映射
        print(f"AI翻译失败: {str(e)}")
        return char_cn
    
def find_content_boundaries(img_array, background_value=217, tolerance=2):
    """找到字的实际内容边界，返回上下实际内容的位置"""
    mask = np.abs(img_array - background_value) > tolerance
    rows = np.any(mask, axis=1)
    if not np.any(rows):
        return None, None
    
    # 找到实际内容的上下边界
    content_top = np.where(rows)[0][0]
    content_bottom = np.where(rows)[0][-1]
    
    return content_top, content_bottom

def trim_whitespace(image, num, black=False, padding=0):
    """裁剪图片周围的空白区域（针对灰度图像）"""
    # 转换为numpy数组
    img_array = np.array(image)
    
    # 对于灰度图像，判断非背景像素
    # 假设背景色为16或者217（根据情况）
    if black:
        if num == 0:
            mask = img_array != 15
        else:
            mask = img_array != 16
    else:
        mask = img_array != 217
    
    # 找到非空白区域的边界
    rows = np.any(mask, axis=1)
    cols = np.any(mask, axis=0)
    if not np.any(rows) or not np.any(cols):
        return image
    
    # 获取非空白区域的边界索引
    y_min, y_max = np.where(rows)[0][[0, -1]]
    # x_min, x_max = np.where(cols)[0][[0, -1]]
    
    # 添加小边距
    y_min = max(0, y_min - padding)
    y_max = min(img_array.shape[0], y_max + padding)
    # x_min = max(0, x_min - padding)
    # x_max = min(img_array.shape[1], x_max + padding)
    
    # 裁剪图片
    return image.crop((0, y_min, img_array.shape[1], y_max))
    # return image.crop((x_min, y_min, x_max, y_max))


def replace_with_simple_el(message):
    el_message = [char for char in message]
    replaced_indices = []

    # 先检查消息中的字符是否所有都在EL字典中
    known_chinese = list(simple_el_dict.keys()) + ['，', '。', '！', '？', '\n']
    check_in_el = [char in known_chinese for char in message]
    
    # 找出 True 值的位置
    true_indices = [i for i, value in enumerate(check_in_el) if value]
    for i in true_indices:
        # print(i)
        if message[i] not in ['，', '。', '！', '？', '\n']:
            # 使用新的函数获取3维向量
            char_3dim = get_char_3dim(message[i])
            el_message[i] = char_3dim
            replaced_indices.append(i)

    return el_message, ''.join([str(char) for char in el_message]), replaced_indices


# message = '江永女书奇，闺中秘语稀。'
def init_marked_message(message):
    # A发送诗句给B
    known_chinese = list(simple_el_dict.keys())
    possible_choices = [char for char in message if (char not in ['，', '。', '！', '？']) and (not char in known_chinese)]
    i = random.randrange(len(possible_choices))
    char = possible_choices[i]
    pos = message.index(char) # 这里的pos是标点符号也代入计数的pos，直接在 message 里的位置
    marked_message = ''.join(['*' if i in [pos] else c for i, c in enumerate(message)])

    return pos, char, marked_message

def print_nvshu_list(nvshu_list):
    """
    打印女书字符列表，使其更易读
    参数:
        nvshu_list: 包含中文字符和三维向量的列表
    """
    print("\n女书字符列表:")
    print("-" * 50)
    for i, item in enumerate(nvshu_list):
        if isinstance(item, str):
            print(f"位置 {i}: 中文字符 '{item}'")
        elif isinstance(item, list) and len(item) == 3:
            print(f"位置 {i}: 三维向量 {item}")
    print("-" * 50)

# create_combined_nvshu_image([14, 0, 16], black=True, trim_wsp=True)
def create_combined_nvshu_image(repr_3dim, black=False, trim_wsp=True):
    """
    将3个女书字符图片拼接成一个大图，并大幅减小宽度（至少减半），
    同时保持图案在图片的正中间
    """
    # 假设所有图片都是相同尺寸
    if black:
        image_dir = 'knowledge_base/nvshu_comp_black'
    else:
        image_dir = 'knowledge_base/nvshu_comp'
    images = []
    trimmed_images = []
    content_boundaries = []
    left_bounds = []
    right_bounds = []

    # 加载每个数字对应的图片
    for num in repr_3dim:
        image_path = os.path.join(image_dir, f'{int(num)}.png')
        if os.path.exists(image_path):
            img = Image.open(image_path)
            images.append(img)
            trimmed_img = trim_whitespace(img, num, black=black)
            trimmed_images.append(trimmed_img)
            # 获取每个字的实际内容边界
            img_array = np.array(trimmed_img)
            if trim_wsp:
                # 计算左右边界
                # 只考虑alpha>0的像素
                if len(img_array.shape) == 3 and img_array.shape[2] == 4:
                    alpha = img_array[:, :, 3]
                    mask = alpha > 0
                else:
                    # 没有alpha通道，直接用非背景色
                    if img_array.ndim == 3 and img_array.shape[2] >= 3:
                        if black:
                            mask = np.any(img_array[:, :, :3] < 250, axis=2)
                        else:
                            mask = np.any(img_array[:, :, :3] > 10, axis=2)
                    else:
                        # 灰度图像处理
                        if black:
                            mask = img_array < 250
                        else:
                            mask = img_array > 10
                cols = np.any(mask, axis=0)
                if np.any(cols):
                    left = np.argmax(cols)
                    right = len(cols) - 1 - np.argmax(cols[::-1])
                else:
                    left, right = 0, img_array.shape[1] - 1
                left_bounds.append(left)
                right_bounds.append(right)

    if not trimmed_images:
        return None

    # 计算所有图片的最小left和最大right，实现整体左右裁剪
    if trim_wsp and left_bounds and right_bounds:
        min_left = min(left_bounds)
        max_right = max(right_bounds)
        # 计算原始宽度
        img_width = trimmed_images[0].size[0]
        # 目标宽度为原始宽度的一半（向下取整），但不能小于内容宽度
        content_width = max_right - min_left + 1
        target_width = max(content_width, img_width // 4)  # 改为1/4，因为后面还要再减半
        # 计算需要的左右padding，使内容居中
        pad_total = target_width - content_width
        pad_left = pad_total // 2
        pad_right = pad_total - pad_left
        cropped_images = []
        for img in trimmed_images:
            # 对每个图片做左右裁剪
            cropped = img.crop((min_left, 0, max_right + 1, img.size[1]))
            # 新建目标宽度的透明底图，将内容居中粘贴
            new_img = Image.new('RGBA', (target_width, img.size[1]), (0, 0, 0, 0))
            new_img.paste(cropped, (pad_left, 0))
            cropped_images.append(new_img)
        trimmed_images = cropped_images
        width = target_width // 2  # 最终宽度再减半
    else:
        # 即使不裁剪，也要将宽度减半
        width, _ = images[0].size
        width = width // 2

    # 计算总高度（加上字符间距）
    spacing = 20  # 字符间距，可以调整
    total_height = sum(img.size[1] for img in trimmed_images) + spacing * (len(trimmed_images) - 1)

    # 创建新图片
    combined_image = Image.new('RGBA', (width, total_height), (0, 0, 0, 0))

    # 拼接图片
    current_y = 0
    for img in trimmed_images:
        # 如果图片宽度不等于目标宽度，直接裁剪到目标宽度（保持高度不变）
        if img.size[0] != width:
            # 从中心裁剪到目标宽度
            left = (img.size[0] - width) // 2
            right = left + width
            img = img.crop((left, 0, right, img.size[1]))
        
        # 水平居中（其实已经居中，无需再偏移）
        x_offset = 0
        combined_image.paste(img, (x_offset, current_y))
        current_y += img.size[1] + spacing

    # 保存临时文件
    if black:
        if trim_wsp:
            output_path = os.path.join('static/nvshu_images', f'combined_{"-".join(map(str, repr_3dim))}_vertical_black_trim.png')
        else:
            output_path = os.path.join('static/nvshu_images', f'combined_{"-".join(map(str, repr_3dim))}_vertical_black.png')
    else:
        if trim_wsp:
            output_path = os.path.join('static/nvshu_images', f'combined_{"-".join(map(str, repr_3dim))}_vertical_trim.png')
        else:
            output_path = os.path.join('static/nvshu_images', f'combined_{"-".join(map(str, repr_3dim))}_vertical.png')
    combined_image.save(output_path)

    # 返回相对路径
    return output_path
