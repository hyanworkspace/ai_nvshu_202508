from transformers import BertModel, BertTokenizer
import torch
import pickle
import os

# 读取chinese_list.txt
with open('knowledge_base/chinese_list.txt', 'r', encoding='utf-8') as f:
    chinese_list = list(f.read()) + ['，', '。', '！', '？']


with open('knowledge_base/word_vectors.pkl', 'rb') as f:
    word_vectors_dict = pickle.load(f)

# 加载预训练模型 - 优先使用本地模型
def load_bert_model():
    """加载BERT模型，优先使用本地模型"""
    try:
        # 首先尝试加载本地模型
        local_model_path = "models/bert-base-chinese"
        if os.path.exists(local_model_path):
            print("📂 加载本地BERT模型...")
            model = BertModel.from_pretrained(local_model_path)
            tokenizer = BertTokenizer.from_pretrained(local_model_path)
        else:
            print("🌐 本地模型不存在，从网络下载...")
            model = BertModel.from_pretrained('bert-base-chinese')
            tokenizer = BertTokenizer.from_pretrained('bert-base-chinese')
        
        # 检查是否有可用的GPU
        device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        model = model.to(device)
        
        print(f"✅ BERT模型加载成功，使用设备: {device}")
        return model, tokenizer, device
        
    except Exception as e:
        print(f"❌ BERT模型加载失败: {str(e)}")
        return None, None, None

# 加载模型
bert_chinese, tokenizer_cn, device = load_bert_model()


class WordVectorManager:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(WordVectorManager, cls).__new__(cls)
            cls._instance.vectors = {}

            # 初始化向量
            for word in chinese_list:
                # inputs = tokenizer(word, return_tensors='pt').to(device)
                # outputs = bert_chinese(**inputs)
                cls._instance.vectors[word] = word_vectors_dict[word]
        return cls._instance
    
    def get_vector(self, word):
        if word not in self.vectors:
            inputs = tokenizer_cn(word, return_tensors='pt').to(device)
            outputs = bert_chinese(**inputs)
            self.vectors[word] = outputs.last_hidden_state[0].mean(0).detach().cpu().numpy()
        return self.vectors[word]
    
    def __getitem__(self, word):
        return self.get_vector(word)
    
    def items(self):
        return self.vectors.items()
    
    def keys(self):
        return self.vectors.keys()
    
    def values(self):
        return self.vectors.values()

# # 创建全局实例
word_vectors = WordVectorManager()