"""
统一的日志配置管理
优化日志输出，减少冗余的DEBUG信息
"""

import logging
import os
import sys
from datetime import datetime
from logging.handlers import RotatingFileHandler
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

class OptimizedLoggingConfig:
    """优化的日志配置类"""
    
    def __init__(self):
        self.log_level = os.getenv('LOG_LEVEL', 'INFO').upper()
        self.enable_file_logging = os.getenv('ENABLE_FILE_LOGGING', 'True').lower() == 'true'
        self.enable_console_logging = os.getenv('ENABLE_CONSOLE_LOGGING', 'True').lower() == 'true'
        self.log_file = os.getenv('LOG_FILE', 'app.log')
        self.max_file_size = int(os.getenv('MAX_LOG_FILE_SIZE', '10485760'))  # 10MB
        self.backup_count = int(os.getenv('LOG_BACKUP_COUNT', '5'))
        
        # 设置日志级别映射
        self.level_mapping = {
            'DEBUG': logging.DEBUG,
            'INFO': logging.INFO,
            'WARNING': logging.WARNING,
            'ERROR': logging.ERROR,
            'CRITICAL': logging.CRITICAL
        }
        
        # 需要过滤的DEBUG日志模式
        self.debug_filters = [
            'connect_tcp.started',
            'connect_tcp.complete',
            'start_tls.started',
            'start_tls.complete',
            'send_request_headers.started',
            'send_request_headers.complete',
            'send_request_body.started',
            'send_request_body.complete',
            'receive_response_headers.started',
            'receive_response_headers.complete',
            'receive_response_body.started',
            'receive_response_body.complete',
            'response_closed.started',
            'response_closed.complete',
            'send_connection_init.started',
            'send_connection_init.complete',
            'Adding (b',
            'Encoding',
            'Encoded header block',
            'STREAM b',
            'temperature:NOT_GIVEN',
            'top_p:NOT_GIVEN'
        ]
    
    def setup_logging(self):
        """设置优化的日志配置"""
        # 获取日志级别
        level = self.level_mapping.get(self.log_level, logging.INFO)
        
        # 创建根日志记录器
        root_logger = logging.getLogger()
        root_logger.setLevel(level)
        
        # 清除现有的处理器
        root_logger.handlers.clear()
        
        # 创建格式化器
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        
        # 文件处理器
        if self.enable_file_logging:
            file_handler = RotatingFileHandler(
                self.log_file,
                maxBytes=self.max_file_size,
                backupCount=self.backup_count,
                encoding='utf-8'
            )
            file_handler.setLevel(level)
            file_handler.setFormatter(formatter)
            root_logger.addHandler(file_handler)
        
        # 控制台处理器
        if self.enable_console_logging:
            console_handler = logging.StreamHandler(sys.stdout)
            console_handler.setLevel(level)
            console_handler.setFormatter(formatter)
            root_logger.addHandler(console_handler)
        
        # 设置第三方库的日志级别
        self._configure_third_party_loggers()
        
        # 添加过滤器
        self._add_filters(root_logger)
        
        logging.info(f"日志系统已初始化 - 级别: {self.log_level}")
    
    def _configure_third_party_loggers(self):
        """配置第三方库的日志级别"""
        # HTTP库日志级别
        logging.getLogger('httpx').setLevel(logging.WARNING)
        logging.getLogger('httpcore').setLevel(logging.WARNING)
        logging.getLogger('urllib3').setLevel(logging.WARNING)
        logging.getLogger('requests').setLevel(logging.WARNING)
        
        # AI库日志级别
        logging.getLogger('transformers').setLevel(logging.WARNING)
        logging.getLogger('torch').setLevel(logging.WARNING)
        
        # 其他库
        logging.getLogger('PIL').setLevel(logging.WARNING)
        logging.getLogger('cv2').setLevel(logging.WARNING)
    
    def _add_filters(self, logger):
        """添加日志过滤器"""
        class DebugFilter(logging.Filter):
            def __init__(self):
                super().__init__()
                self.debug_filters = [
                    "urllib3.connectionpool",
                    "httpx._client",
                    "transformers.modeling_utils",
                    "torch.nn.modules"
                ]
            
            def filter(self, record):
                # 过滤掉冗余的DEBUG信息
                message = record.getMessage()
                for pattern in self.debug_filters:
                    if pattern in message:
                        return False
                return True
        
        # 为所有处理器添加过滤器
        for handler in logger.handlers:
            handler.addFilter(DebugFilter())
    
    def get_logger(self, name: str) -> logging.Logger:
        """获取指定名称的日志记录器"""
        logger = logging.getLogger(name)
        return logger

class OptimizedLogger:
    """优化的日志记录器包装类"""
    
    def __init__(self, name: str):
        self.logger = logging.getLogger(name)
        self.name = name
    
    def debug(self, message: str, *args, **kwargs):
        """DEBUG级别日志 - 仅在开发环境使用"""
        if self.logger.isEnabledFor(logging.DEBUG):
            # 过滤掉冗余的DEBUG信息
            if not any(pattern in message for pattern in OptimizedLoggingConfig().debug_filters):
                self.logger.debug(message, *args, **kwargs)
    
    def info(self, message: str, *args, **kwargs):
        """INFO级别日志 - 关键信息"""
        self.logger.info(message, *args, **kwargs)
    
    def warning(self, message: str, *args, **kwargs):
        """WARNING级别日志"""
        self.logger.warning(message, *args, **kwargs)
    
    def error(self, message: str, *args, **kwargs):
        """ERROR级别日志"""
        self.logger.error(message, *args, **kwargs)
    
    def critical(self, message: str, *args, **kwargs):
        """CRITICAL级别日志"""
        self.logger.critical(message, *args, **kwargs)
    
    def log_request(self, method: str, url: str, status_code: int = None, response_time: float = None):
        """记录HTTP请求信息"""
        if status_code:
            if 200 <= status_code < 300:
                self.info(f"HTTP {method} {url} - {status_code} ({response_time:.3f}s)" if response_time else f"HTTP {method} {url} - {status_code}")
            elif 400 <= status_code < 500:
                self.warning(f"HTTP {method} {url} - {status_code} ({response_time:.3f}s)" if response_time else f"HTTP {method} {url} - {status_code}")
            else:
                self.error(f"HTTP {method} {url} - {status_code} ({response_time:.3f}s)" if response_time else f"HTTP {method} {url} - {status_code}")
        else:
            self.info(f"HTTP {method} {url}")
    
    def log_ai_request(self, service: str, model: str, success: bool, response_time: float = None, error: str = None):
        """记录AI服务请求信息"""
        if success:
            self.info(f"AI请求成功 - {service} ({model}) - {response_time:.3f}s" if response_time else f"AI请求成功 - {service} ({model})")
        else:
            self.error(f"AI请求失败 - {service} ({model}) - {error}" if error else f"AI请求失败 - {service} ({model})")
    
    def log_file_operation(self, operation: str, file_path: str, success: bool, error: str = None):
        """记录文件操作信息"""
        if success:
            self.info(f"文件操作成功 - {operation}: {file_path}")
        else:
            self.error(f"文件操作失败 - {operation}: {file_path} - {error}" if error else f"文件操作失败 - {operation}: {file_path}")

# 全局日志配置实例
logging_config = OptimizedLoggingConfig()

def setup_optimized_logging():
    """设置优化的日志系统"""
    logging_config.setup_logging()
    return logging_config

def get_optimized_logger(name: str) -> OptimizedLogger:
    """获取优化的日志记录器"""
    return OptimizedLogger(name)

# 便捷函数
def get_logger(name: str) -> OptimizedLogger:
    """获取日志记录器的便捷函数"""
    return get_optimized_logger(name)
