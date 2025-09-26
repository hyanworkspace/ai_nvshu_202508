#!/usr/bin/env python3
"""
下载BERT模型到本地的脚本
"""

import os
from transformers import BertModel, BertTokenizer
import torch

def download_bert_to_local():
    """下载BERT模型到本地"""
    
    # 本地保存路径
    local_model_path = "models/bert-base-chinese"
    
    print("🔍 开始下载BERT模型到本地...")
    
    try:
        # 创建目录
        os.makedirs(local_model_path, exist_ok=True)
        
        print("📥 下载BERT模型...")
        model = BertModel.from_pretrained('bert-base-chinese')
        
        print("📥 下载BERT分词器...")
        tokenizer = BertTokenizer.from_pretrained('bert-base-chinese')
        
        print("💾 保存模型到本地...")
        model.save_pretrained(local_model_path)
        tokenizer.save_pretrained(local_model_path)
        
        print(f"✅ BERT模型已保存到: {local_model_path}")
        
        # 验证保存是否成功
        print("🔍 验证本地模型...")
        local_model = BertModel.from_pretrained(local_model_path)
        local_tokenizer = BertTokenizer.from_pretrained(local_model_path)
        
        print("✅ 本地模型验证成功！")
        
        return True
        
    except Exception as e:
        print(f"❌ 下载失败: {str(e)}")
        return False

def check_local_model():
    """检查本地模型是否存在"""
    local_model_path = "models/bert-base-chinese"
    
    if os.path.exists(local_model_path):
        print(f"✅ 本地模型已存在: {local_model_path}")
        
        # 检查必要文件
        required_files = ['config.json', 'pytorch_model.bin', 'vocab.txt']
        missing_files = []
        
        for file in required_files:
            file_path = os.path.join(local_model_path, file)
            if not os.path.exists(file_path):
                missing_files.append(file)
        
        if missing_files:
            print(f"⚠️ 缺少文件: {missing_files}")
            return False
        else:
            print("✅ 所有必要文件都存在")
            return True
    else:
        print("❌ 本地模型不存在")
        return False

if __name__ == "__main__":
    print("🚀 BERT模型本地化工具")
    print("=" * 50)
    
    # 检查是否已有本地模型
    if check_local_model():
        print("本地模型已存在，无需重新下载")
    else:
        # 下载模型
        success = download_bert_to_local()
        if success:
            print("🎉 模型下载完成！")
        else:
            print("💥 模型下载失败，请检查网络连接")
