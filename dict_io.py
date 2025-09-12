import pickle
from config import Config

def save_dict_to_file(dictionary, filename):
    with open(filename, 'wb') as f:
        pickle.dump(dictionary, f)

def load_dict_from_file(filename):
    with open(filename, 'rb') as f:
        dictionary = pickle.load(f)
    return dictionary

def add_to_dictionary(char, char_3dim, char_translate):
    dictionary = load_dict_from_file(Config.DICTIONARY_PATH)
    
    # 检查字符是否已存在
    if char in dictionary:
        # 将字典值从列表格式转换为字典格式，以支持英文翻译
        if isinstance(dictionary[char], list):
            # 如果当前值是列表，转换为字典格式
            dictionary[char] = {
                'char_3dim': dictionary[char],
                'char_translate': char_translate
            }
        else:
            # 如果已经是字典格式，只更新翻译
            dictionary[char]['char_translate'] = char_translate
    else:
        # 如果字符不存在，直接添加新的字典格式数据
        dictionary[char] = {
            'char_3dim': char_3dim,
            'char_translate': char_translate
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