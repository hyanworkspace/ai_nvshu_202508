import pickle
from config import Config

def save_dict_to_file(dictionary, filename):
    with open(filename, 'wb') as f:
        pickle.dump(dictionary, f)

def load_dict_from_file(filename):
    with open(filename, 'rb') as f:
        dictionary = pickle.load(f)
    return dictionary

def add_to_dictionary(char, char_3dim, char_translate, creator="default", 
                     char_img_path=None, poem=None, poem_eng=None):  # media_url=None):
    dictionary = load_dict_from_file(Config.DICTIONARY_PATH)
    
    # 检查字符是否已存在
    if not char in dictionary:
        # 如果字符不存在，直接添加新的字典格式数据
        dictionary[char] = {
            'char_3dim': char_3dim,
            'char_translate': char_translate,
            'creator': creator,
            'char_img_path': char_img_path,
            'poem': poem,
            'poem_eng': poem_eng,
            # 'media_url': media_url
        }
    
    save_dict_to_file(dictionary, Config.DICTIONARY_PATH)

def get_char_translation(char):
    """获取字符的英文翻译"""
    dictionary = load_dict_from_file(Config.DICTIONARY_PATH)
    if char in dictionary:
        if isinstance(dictionary[char], dict):
            return dictionary[char].get('char_translate', char)
        else:
            # 如果还是旧格式（列表），返回字符本身
            return char
    return char

def get_char_3dim(char):
    """获取字符的3维向量"""
    dictionary = load_dict_from_file(Config.DICTIONARY_PATH)
    if char in dictionary.keys():
        if isinstance(dictionary[char], dict):
            return dictionary[char].get('char_3dim', [])
        else:
            # 如果还是旧格式（列表），直接返回
            return dictionary[char]
    return []

def get_char_creator(char):
    """获取字符的创建者信息"""
    dictionary = load_dict_from_file(Config.DICTIONARY_PATH)
    if char in dictionary:
        if isinstance(dictionary[char], dict):
            return dictionary[char].get('creator', 'default')
        else:
            # 如果还是旧格式（列表），返回默认值
            return 'default'
    return 'default'

def get_char_img_path(char):
    """获取字符的图片路径"""
    dictionary = load_dict_from_file(Config.DICTIONARY_PATH)
    if char in dictionary:
        if isinstance(dictionary[char], dict):
            return dictionary[char].get('char_img_path', None)
    return None

def get_char_poem(char):
    """获取字符的原始诗句"""
    dictionary = load_dict_from_file(Config.DICTIONARY_PATH)
    if char in dictionary:
        if isinstance(dictionary[char], dict):
            return dictionary[char].get('poem', None)
    return None

def get_char_poem_eng(char):
    """获取字符的英文诗句"""
    dictionary = load_dict_from_file(Config.DICTIONARY_PATH)
    if char in dictionary:
        if isinstance(dictionary[char], dict):
            return dictionary[char].get('poem_eng', None)
    return None

# def get_char_media_url(char):
#     """获取字符的原始媒体URL"""
#     dictionary = load_dict_from_file(Config.DICTIONARY_PATH)
#     if char in dictionary:
#         if isinstance(dictionary[char], dict):
#             return dictionary[char].get('media_url', None)
#     return None

def get_char_full_data(char):
    """获取字符的完整数据"""
    dictionary = load_dict_from_file(Config.DICTIONARY_PATH)
    if char in dictionary:
        if isinstance(dictionary[char], dict):
            return dictionary[char]
        else:
            # 如果还是旧格式（列表），转换为新格式
            return {
                'char_3dim': dictionary[char],
                'char_translate': char,
                'creator': 'default',
                'char_img_path': None,
                'poem': None,
                'poem_eng': None,
                # 'media_url': None
            }
    return None

