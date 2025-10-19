from flask import Flask, render_template, request, jsonify, session, send_from_directory
import os
import uuid
import json
from werkzeug.utils import secure_filename
from werkzeug.exceptions import RequestEntityTooLarge
from dotenv import load_dotenv
from config import Config
# 隐藏 Werkzeug 的 HTTP 请求日志
import logging
log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)

# 加载环境变量
load_dotenv()
from ai_nvshu_functions import find_similar, recognize_and_translate, create_new_poem, create_nvshu_from_poem, create_combined_nvshu_image, replace_with_simple_el, get_char_translate, translate_text
from utils import load_dict_from_file
from process_video import pixelate
import logging
from flask_cors import CORS
import atexit
import time
from utils import *
from urllib.parse import unquote

# 设置优化的日志配置
from logging_config import setup_optimized_logging

# 初始化日志系统
setup_optimized_logging()

app = Flask(__name__)
app.secret_key = 'a-secret-key'
CORS(app, resources={r"/upload": {"origins": "*"}})



# 使用 Config 类中的配置
app.config['UPLOAD_FOLDER'] = Config.UPLOAD_FOLDER
app.config['DICTIONARY_PATH'] = Config.DICTIONARY_PATH
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB
app.config['TEMPLATES_AUTO_RELOAD'] = True
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0  # 禁用静态资源缓存（开发环境）

# 在模板中注入 DEBUG 标志（仅开发时自动刷新使用）
@app.context_processor
def inject_debug_flag():
    return {"DEBUG": app.debug}

# 开发环境下的文件变更版本号端点，用于前端轮询自动刷新
def _latest_mtime(paths):
    latest = 0.0
    for base in paths:
        if not os.path.exists(base):
            continue
        if os.path.isfile(base):
            try:
                latest = max(latest, os.path.getmtime(base))
            except Exception:
                pass
            continue
        for root, _, files in os.walk(base):
            for f in files:
                try:
                    m = os.path.getmtime(os.path.join(root, f))
                    if m > latest:
                        latest = m
                except Exception:
                    continue
    return int(latest * 1000)

@app.route('/__dev_version')
def dev_version():
    if not app.debug:
        return jsonify({"v": 0}), 404
    v = _latest_mtime(["templates", "static/css", "static/js"])  # 需要可再加其他目录
    resp = jsonify({"v": v})
    # 禁用缓存，确保轮询拿到最新
    resp.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    return resp

# 确保上传目录存在
if not os.path.exists(Config.UPLOAD_FOLDER):
    os.makedirs(Config.UPLOAD_FOLDER) 


# 允许的文件类型
ALLOWED_EXTENSIONS = Config.ALLOWED_EXTENSIONS

def allowed_file(filename):
    # return True/False
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.before_request
def before_request():
    # 如果用户没有session_id，创建一个新的
    if 'session_id' not in session:
        session['session_id'] = str(uuid.uuid4())

@app.route('/')
def index():
    return render_template('landingpage.html')

@app.route('/see')
def see():
    return render_template('see.html')

@app.route('/texteffectdemo')
def texteffectdemo():
    return render_template('texteffectdemo.html')


@app.route('/upload', methods=['POST'])
def upload_file():
    try:
        # 检查请求大小
        if request.content_length and request.content_length > app.config['MAX_CONTENT_LENGTH']:
            app.logger.error(f"请求过大: {request.content_length} 字节")
            return jsonify({
                'error': '请求过大',
                'message': f'请求大小 {request.content_length} 字节超过了 {app.config["MAX_CONTENT_LENGTH"]} 字节的限制',
                'max_size': f'{app.config["MAX_CONTENT_LENGTH"] // (1024*1024)}MB'
            }), 413

        # 一系列的检查 ------------------------------
        if 'file' not in request.files:
            app.logger.error("No file in request")
            return jsonify({'error': '没有文件'}), 400
        
        file = request.files['file']
        file_type = request.form.get('file_type', '')  # 获取客户端传递的文件类型
        
        if file.filename == '':
            app.logger.error("文件名为空")
            return jsonify({'error': '没有选择文件'}), 400
        
        # 改进的文件验证逻辑
        if not file:
            app.logger.error("文件对象为空")
            return jsonify({'error': '文件对象为空'}), 400
        
        # 检查文件是否被允许
        if not allowed_file(file.filename):
            app.logger.error(f"不支持的文件类型: {file.filename}")
            return jsonify({'error': f'不支持的文件类型: {file.filename}'}), 400
        
        # 生成唯一的文件名
        original_filename = secure_filename(file.filename)
        file_extension = original_filename.rsplit('.', 1)[1].lower() if '.' in original_filename else ''
        
        # 如果没有扩展名但有file_type，根据file_type推断扩展名
        if not file_extension and file_type:
            if file_type == 'image':
                # 根据content_type推断扩展名
                if 'png' in file.content_type.lower():
                    file_extension = 'png'
                elif 'jpeg' in file.content_type.lower() or 'jpg' in file.content_type.lower():
                    file_extension = 'jpg'
            elif file_type == 'video':
                if 'mp4' in file.content_type.lower():
                    file_extension = 'mp4'
                elif 'webm' in file.content_type.lower():
                    file_extension = 'webm' 
        
        if not file_extension:
            app.logger.error(f"无法确定文件扩展名: {original_filename}")
            return jsonify({'error': '无法确定文件类型'}), 400
        
        unique_filename = f"{str(uuid.uuid4())}.{file_extension}"

        # 确保上传目录存在
        if not os.path.exists(app.config['UPLOAD_FOLDER']):
            os.makedirs(app.config['UPLOAD_FOLDER'])
            app.logger.info(f"创建上传目录: {app.config['UPLOAD_FOLDER']}")
        
        # 保存文件
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        file.save(file_path)
        
        # 生成文件URL
        file_url = f'/uploads/{unique_filename}'
        
        # 设置 session 数据
        session['media_type'] = file_type
        session['media_url'] = file_url
        session['original_media_url'] = file_url
        
        app.logger.info(f"文件上传成功: {file.filename} -> {unique_filename}")

        return jsonify({
            'message': '文件上传成功',
            'file_url': file_url
        })
    except Exception as e:
        app.logger.error(f"文件上传失败: {str(e)}")
        return jsonify({
            "message": "error",
            "error": str(e)
        }), 500

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/uploads/<path:filename>')
def serve_video(filename):
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    response = send_from_directory(file_path)
    
    # 根据文件扩展名设置正确的 Content-Type
    file_extension = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
    content_type = {
        'mp4': 'video/mp4',
        'webm': 'video/webm',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png'
    }.get(file_extension, 'application/octet-stream')
    
    response.headers['Accept-Ranges'] = 'bytes'
    response.headers['Content-Type'] = content_type
    return response



# ----------------------------------------
# think 
# ----------------------------------------

@app.route('/think')
def think():
    if app.debug:
        media_url = '/uploads/output_5sec.mp4'
        original_media_url = '/uploads/output_5sec.mp4'
        media_type = 'video'
    else:
        media_url = request.args.get('media_url')
        original_media_url = request.args.get('original_media_url', media_url)
        media_type = request.args.get('media_type', 'video')
    
    # 确保session中有正确的URL和类型信息
    if media_url:
        session['media_url'] = media_url
        session['original_media_url'] = original_media_url
        session['media_type'] = media_type
    
    return render_template('think.html', 
                         media_url=media_url, 
                         original_media_url=original_media_url,
                         media_type=media_type)

@app.route('/describe_video', methods=['POST'])
def describe_video():
    try:
        # 检查是否启用调试模式或AI服务不可用
        use_mock_data = app.debug or os.getenv('USE_MOCK_AI', 'false').lower() == 'true'
        
        if use_mock_data:
            video_desc = '我看到一个女人坐在看似是咖啡馆或餐厅的桌子上。她穿着无袖上衣，拿着玫瑰靠近脸。该设置包括柜台上的各种物品，例如眼镜，餐巾纸和某些电子设备。桌子周围有椅子，穿过窗户，您可以在外面看到停放的汽车。氛围暗示了一个带有人工照明的室内环境。'
            video_desc_en = 'I see a woman sitting at a table in what appears to be a café or restaurant. She is wearing a sleeveless top and holding a rose close to her face. The setting includes various items on the counter such as glasses, napkins, and some electronic devices. There are chairs around the table, and through the window, you can see parked cars outside. The ambiance suggests an indoor environment with artificial lighting.'
            
            return jsonify({
                "video_desc": video_desc,
                'video_desc_eng': video_desc_en
            })
        else:
            media_type = session.get('media_type')
            media_url = session.get('original_media_url', session.get('media_url'))
            if not media_url:
                raise ValueError('No media URL provided for describe_video')
            
            data = request.get_json()
            if data and data.get('original_media_url'):
                media_url = data['original_media_url']
            
            # 从 URL 中提取文件名
            filename = os.path.basename(media_url.split('?')[0])
            # 构建完整的文件路径
            media_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            # 规范化路径
            media_path = os.path.abspath(os.path.normpath(media_path))
            
            # 验证文件是否存在
            if not os.path.isfile(media_path):
                raise FileNotFoundError(f'文件不存在: {media_path}')
            # 验证路径是否在允许的目录内
            if not media_path.startswith(os.path.abspath(app.config['UPLOAD_FOLDER'])):
                raise ValueError('无效的文件路径')

            app.logger.info(f"开始处理媒体文件: {filename}")
            result = recognize_and_translate(media_path, media_type, session['session_id'], logger=app.logger)
            if not result:
                raise ValueError('Media recognition returned None or empty result')
            
            # 处理新的返回格式（可能包含关键帧URL）
            if isinstance(result, (list, tuple)) and len(result) == 3:
                video_desc, video_desc_en, keyframe_url = result
                # 如果有关键帧URL，更新session中的media_url
                if keyframe_url:
                    session['media_url'] = keyframe_url
                    app.logger.info(f"更新media_url为关键帧: {keyframe_url}")
            elif isinstance(result, (list, tuple)) and len(result) == 2:
                video_desc, video_desc_en = result
            else:
                raise ValueError(f'Media recognition failed to return valid description. Expected tuple of 2 or 3, got: {type(result)} with value: {result}')
            
            return jsonify({
                "video_desc": video_desc,
                "video_desc_eng": video_desc_en
            })
    except Exception as e:
        app.logger.error(f"视频描述失败: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/generate_poem', methods=['POST'])
def generate_poem():
    try:
        if app.debug:
            new_poem = '江永女书奇，闺中秘语稀。'
            # new_poem = '江永女书奇，闺中秘语稀'
            new_poem_en = 'This is machine generated poem'
        else:
            data = request.get_json()
            new_poem, new_poem_en = create_new_poem(data.get('video_description'), data.get('similar_poems'))
            # new_poem = new_poem.replace(',', '，')
            new_poem = new_poem
            # print(new_poem)  # 打印诗句
        session['poem'] = new_poem
        session['poem_eng'] = new_poem_en
        return jsonify({
            "poem": new_poem,
            'poem_eng': new_poem_en
        })
    except Exception as e:
        print("Error:", str(e))  # 打印具体错误
        return jsonify({"error": str(e)}), 500


@app.route('/find_similar_poems', methods=['POST'])
def find_similar_poems():
    try:
        if app.debug:
            new_poem = ['江永女书奇，闺中秘语稀1。', '\n江永女书奇，闺中秘语稀2。', '\n江永女书奇，闺中秘语稀3。']
            new_poem_en = ['This is machine generated poem1.', '\nThis is machine generated poem2.', '\nThis is machine generated poem3.']
        else:
            data = request.get_json()
            new_poem, new_poem_en = find_similar(data.get('video_description'))
        session['similar_poems'] = new_poem
        return jsonify({
            "similar_poems": new_poem,
            'similar_poems_eng': new_poem_en
        })
    except Exception as e:
        print("Error:", str(e))  # 打印具体错误
        return jsonify({"error": str(e)}), 500



# ----------------------------------------
# guess 
# ----------------------------------------

@app.route('/replace_with_created_char', methods=['POST'])
def replace_with_created_char():
    try:
        data = request.get_json()
        poem = data.get('poem')
        if not poem:
            return jsonify({'error': 'No poem provided'}), 400
        
        poem_in_list, poem_replaced_with_simple_el, replaced_ind = replace_with_simple_el(data.get('poem'))
        return jsonify({
            'poem_orig': poem,
            "poem_in_list": poem_in_list,
            "poem_in_simple_el": poem_replaced_with_simple_el,
            "replaced_ind": replaced_ind
        })
    except Exception as e:
        print("Error:", str(e))  # 打印具体错误
        return jsonify({"error": str(e)}), 500


@app.route('/generate_char', methods=['POST'])
def generate_char():
    try:
        app.logger.info("开始生成女书字符")
        
        # 验证请求数据
        data = request.get_json()
        if not data:
            return jsonify(*format_error_response(
                "请求错误", 
                "请提供有效的诗句数据", 
                status_code=400
            ))
        
        poem = data.get('poem')
        is_valid, error_msg = validate_poem_input(poem)
        if not is_valid:
            return jsonify(*format_error_response(
                "参数错误", 
                error_msg, 
                status_code=400
            ))
        
        if app.debug:
            char_pos, simple_el, repr_token, guess_char = load_dict_from_file('knowledge_tmp/tmp.pkl')
            # guess_char_eng = [translate_text(x, 'zh-CN', 'en') for x in guess_char]
            guess_char_eng = ['一', '二', '三', '四', '五']
            guess_poems = [poem[:char_pos] + i + poem[char_pos+1:] for i in guess_char]
            # guess_poems_eng = [translate_text(x, 'zh-CN', 'en') for x in guess_poems]
            guess_poems_eng = [
                'this is test english poem translation 1',
                'this is test english poem translation 2',
                'this is test english poem translation 3',
                'this is test english poem translation 4',
                'this is test english poem translation 5'
            ]
            char_pos = 4
            char_translate = 'translateHere'
            char_cn = poem[char_pos]
        else:
            try:
                result = create_nvshu_from_poem(poem)
                # print(f"create_nvshu_from_poem returned: {result}")
                # print(f"Result type: {type(result)}, Length: {len(result) if hasattr(result, '__len__') else 'N/A'}")
                
                char_cn, char_pos, simple_el, repr_token, guess_char, guess_char_eng, guess_poems_eng = result
                # print(f"Unpacked values: char_cn={char_cn}, char_pos={char_pos}, guess_char={guess_char}")
                # print("Completed create_nvshu_from_poem")
            except Exception as e:
                print(f"Error in create_nvshu_from_poem: {str(e)}")
                return jsonify(*handle_ai_function_error(e, "女书字符生成"))
            
            try:
                char_translate = get_char_translate(char_cn, poem, data.get('poem_eng', ''))
                # print("Completed get_char_translate")
            except Exception as e:
                print(f"翻译字符时出错: {str(e)}")
                char_translate = f"字符: {char_cn}"
        
        # print("Creating combined images")
        try:
            img_path = create_combined_nvshu_image(list(simple_el))
            _ = create_combined_nvshu_image(list(simple_el), black=True)
            img_path_pixelated = pixelate(img_path)
        except Exception as e:
            return jsonify(*handle_ai_function_error(e, "女书图片生成"))

        print("Storing session data")
        session['char_img_path'] = img_path # img_path_pixelated
        session['char_translate'] = char_translate
        session['char_3dim'] = simple_el
        session['char'] = char_cn

        media_url = session.get('original_media_url', session.get('media_url'))
        # 从 URL 中提取文件名
        filename = os.path.basename(media_url.split('?')[0])
        # 构建完整的文件路径
        media_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        # 规范化路径
        media_path = os.path.abspath(os.path.normpath(media_path))

        app.logger.info("女书字符生成完成")
        return jsonify({
            'char_translate': char_translate,
            "char_pos": char_pos,
            "char_cn": char_cn,
            'simple_el': list(simple_el),
            'repr_token': repr_token,
            'char_img_path_pixelated': img_path_pixelated, 
            'guess_char': guess_char,
            'guess_char_eng': guess_char_eng,
            'guess_poems_eng': guess_poems_eng,
            'media_url': media_path
        })
    except Exception as e:
        print(f"generate_char 未预期的错误: {str(e)}")
        return jsonify(*format_error_response(
            "系统错误",
            "处理请求时出现未预期的错误，请稍后重试",
            str(e)
        ))


@app.route('/guess')
def guess():
    poem = request.args.get('poem', '')
    media_url = session.get('original_media_url', session.get('media_url'))
    return render_template('guess.html', poem=poem, media_url=media_url)


@app.route('/get_result')
def get_result():
    img_path = session['char_img_path']
    img_dir = os.path.dirname(img_path)
    img_filename = os.path.basename(img_path)
    pixelated_img_path = os.path.join(img_dir, f"pixelated_{img_filename}")
    char_value = session.get('char')
    if not char_value:
        raw_char = request.args.get('char', '')
        if raw_char:
            decoded_char = unquote(raw_char)
            if decoded_char.startswith('%') and len(decoded_char) > 1:
                decoded_char = decoded_char[1:]
            char_value = decoded_char
            session['char'] = char_value
    if not char_value:
        char_value = session.get('char_translate')
    return render_template(
        'result.html',
        media_url=session['media_url'],
        char_translate=session.get('char_translate'),
        char=char_value,
        char_img_path=pixelated_img_path,
        char_3dim=session.get('char_3dim'),
    )


@app.route('/save_user_name', methods=['POST'])
def save_user_name():
    data = request.get_json()
    session['user_name'] = data.get('user_name')
    return jsonify({'status': 'success'})

@app.route('/frame_11')
def frame_11():
    img_path = session['char_img_path']
    img_dir = os.path.dirname(img_path)
    img_filename = os.path.basename(img_path)
    pixelated_img_path = os.path.join(img_dir, f"pixelated_{img_filename}")
    return render_template(
        'frame_11.html', 
        media_url=session['original_media_url'],
        char_img_path=pixelated_img_path,
        char_3dim=session['char_3dim'],
        username=session['user_name'],
        char_translate=session['char_translate'],
        poem=session['poem'],
        poem_eng=session['poem_eng'],
        char=session['char'],  # 加上 char 这个中文字
        from_dictionary='false'
    )

@app.route('/frame_11_from_dict')
def frame_11_from_dict():
    # 从URL参数获取字符信息
    char = request.args.get('char', '')
    from_dictionary = request.args.get('from_dictionary', 'true')
    
    try:
        from dict_io import get_char_full_data
        
        # 从字典中获取完整数据
        char_data = get_char_full_data(char)
        
        if not char_data:
            return render_template('error.html', error_message="Character not found in dictionary")
        
        # 提取数据
        char_3dim = char_data.get('char_3dim', [])
        char_translate = char_data.get('char_translate', char)
        img_path = char_data.get('char_img_path')
        poem = char_data.get('poem', "代码千行密，测试一线明")
        poem_eng = char_data.get('poem_eng', "Code sprawls in tangled lines, yet testing brings one light.")
        # media_url = char_data.get('media_url')
        creator = char_data.get('creator', 'default')
        
        # 处理图片路径
        if img_path:
            # 如果有存储的图片路径，添加 pixelated_ 前缀
            img_dir = os.path.dirname(img_path)
            img_filename = os.path.basename(img_path)
            pixelated_img_path = os.path.join(img_dir, f"pixelated_{img_filename}")
        elif char_3dim and len(char_3dim) >= 3:
            # 如果没有存储的图片路径，根据3维向量生成
            pixelated_img_path = f"/static/nvshu_images/pixelated_combined_{char_3dim[0]}-{char_3dim[1]}-{char_3dim[2]}_vertical_trim.png"
        else:
            pixelated_img_path = None
        
        return render_template(
            'frame_11.html', 
            media_url = None,
            # media_url=media_url,
            char_img_path=pixelated_img_path,
            char_3dim=char_3dim,
            username=creator,  # 使用创建者作为用户名
            char_translate=char_translate,
            poem=poem,
            poem_eng=poem_eng,
            char=char,
            from_dictionary=from_dictionary
        )
    except Exception as e:
        app.logger.error(f"Error in frame_11_from_dict: {str(e)}")
        return render_template('error.html', error_message="Failed to load character details")

@app.route('/save_storage_preference', methods=['POST'])
def save_storage_preference():
    data = request.get_json()
    session['storage_preference'] = data.get('storage_preference')
    return jsonify({'status': 'success'})

@app.route('/dictionary')
def dictionary():
    return render_template('dictionary.html')

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/get_dictionary')
def get_dictionary():
    try:
        dictionary = load_dict_from_file(app.config['DICTIONARY_PATH'])
        # 保持字典的原始顺序，转换为有序列表格式
        ordered_dict = {
            'data': dictionary,
            'keys_order': list(dictionary.keys())
        }
        return jsonify(ordered_dict)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/search_dictionary')
def search_dictionary():
    search_term = request.args.get('term', '').strip().lower()
    if not search_term:
        return jsonify({}), 400
    try:
        dictionary = load_dict_from_file(app.config['DICTIONARY_PATH'])
        # 简单搜索实现 - 只匹配包含搜索词的中文字符
        results = {k: v for k, v in dictionary.items() if search_term in k.lower()}
        return jsonify(results)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/add_to_dictionary', methods=['POST'])
def add_to_dictionary():
    try:
        from dict_io import add_to_dictionary
        char = session.get('char')
        char_3dim = session.get('char_3dim')
        char_translate = session.get('char_translate')
        user_name = session.get('user_name', 'default')  # 获取用户名，默认为 'default'
        char_img_path = session.get('char_img_path')
        poem = session.get('poem')
        poem_eng = session.get('poem_eng')
        # media_url = session.get('media_url')  # 使用关键帧URL而不是原始视频URL
        
        if char and char_3dim:
            add_to_dictionary(char, char_3dim, char_translate, user_name, 
                            char_img_path, poem, poem_eng)  # , media_url)
            return jsonify({'status': 'success'})
        else:
            return jsonify({'status': 'error', 'message': 'Missing character data'}), 400
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


def cleanup_old_files():
    """清理所有过期的会话文件"""
    now = time.time()
    upload_folder = app.config['UPLOAD_FOLDER']
    
    try:
        for filename in os.listdir(upload_folder):
            file_path = os.path.join(upload_folder, filename)
            try:
                # 跳过 output_frames 目录，避免权限问题
                if filename == 'output_frames':
                    continue
                    
                # 只处理文件，跳过目录
                if not os.path.isfile(file_path):
                    continue
                    
                # 删除超过24小时未访问的文件
                if os.path.getatime(file_path) < now - 24 * 3600:
                    os.remove(file_path)
                    app.logger.info(f"删除过期文件: {file_path}")
            except PermissionError as e:
                app.logger.warning(f"权限不足，跳过文件 {file_path}: {str(e)}")
            except Exception as e:
                app.logger.error(f"删除文件失败 {file_path}: {str(e)}")
                
        # 单独处理 output_frames 目录中的过期文件
        output_frames_dir = os.path.join(upload_folder, 'output_frames')
        if os.path.exists(output_frames_dir):
            cleanup_output_frames(output_frames_dir, now)
            
    except Exception as e:
        app.logger.error(f"清理文件时出错: {str(e)}")

def cleanup_output_frames(output_frames_dir, now):
    """清理 output_frames 目录中的过期文件"""
    try:
        for session_dir in os.listdir(output_frames_dir):
            session_path = os.path.join(output_frames_dir, session_dir)
            if os.path.isdir(session_path):
                try:
                    # 检查目录的最后访问时间
                    if os.path.getatime(session_path) < now - 24 * 3600:
                        import shutil
                        shutil.rmtree(session_path)
                        app.logger.info(f"删除过期会话目录: {session_path}")
                except PermissionError as e:
                    app.logger.warning(f"权限不足，跳过目录 {session_path}: {str(e)}")
                except Exception as e:
                    app.logger.error(f"删除目录失败 {session_path}: {str(e)}")
    except Exception as e:
        app.logger.error(f"清理 output_frames 目录时出错: {str(e)}")

# 错误处理
@app.errorhandler(RequestEntityTooLarge)
def handle_file_too_large(e):
    app.logger.error(f"文件过大: {str(e)}")
    return jsonify({
        'error': '文件过大',
        'message': '上传的文件超过了50MB的限制，请选择较小的文件',
        'max_size': '50MB'
    }), 413

@app.errorhandler(413)
def handle_413_error(e):
    app.logger.error(f"请求体过大: {str(e)}")
    return jsonify({
        'error': '请求体过大',
        'message': '上传的文件超过了服务器限制，请选择较小的文件',
        'max_size': '50MB'
    }), 413

atexit.register(cleanup_old_files)

if __name__ == '__main__':
    # 使用 Flask 内置的调试重载器
    app.run(host='0.0.0.0', port=5001, debug=True)
    # app.run(debug=False)
