"""
Конфигурация путей к системным и пользовательским данным
"""
import os

# Базовые пути
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR = os.path.join(BASE_DIR, 'data')

# Системные данные (общие для всех пользователей)
SYSTEM_DATA_DIR = os.path.join(DATA_DIR, 'system')
SYSTEM_DEFAULTS_DIR = os.path.join(SYSTEM_DATA_DIR, 'defaults')
SYSTEM_ASSETS_DIR = os.path.join(SYSTEM_DATA_DIR, 'assets')

# Пути к системным файлам по умолчанию
SYSTEM_PATHS = {
    'scenarios': os.path.join(SYSTEM_DEFAULTS_DIR, 'scenarios'),
    'settings': os.path.join(SYSTEM_DEFAULTS_DIR, 'settings'),
    'memory_images': os.path.join(SYSTEM_ASSETS_DIR, 'memory'),
    'sounds': os.path.join(SYSTEM_ASSETS_DIR, 'sounds'),
    'avatars': os.path.join(SYSTEM_ASSETS_DIR, 'avatars'),
}

# Пользовательские данные (индивидуальные для каждого пользователя)
USER_DATA_DIR = os.path.join(DATA_DIR, 'user_data')

def get_user_data_path(user_id, data_type):
    """
    Возвращает путь к пользовательским данным
    
    Args:
        user_id (int): ID пользователя
        data_type (str): Тип данных ('scenarios', 'settings', 'memory', 'uploads', etc.)
    
    Returns:
        str: Путь к пользовательским данным
    """
    user_dir = os.path.join(USER_DATA_DIR, f'user_{user_id}')
    
    # Создаем папку пользователя если её нет
    if not os.path.exists(user_dir):
        os.makedirs(user_dir, exist_ok=True)
    
    data_path = os.path.join(user_dir, data_type)
    
    # Создаем папку для типа данных если её нет
    if not os.path.exists(data_path):
        os.makedirs(data_path, exist_ok=True)
    
    return data_path

def get_system_data_path(data_type):
    """
    Возвращает путь к системным данным
    
    Args:
        data_type (str): Тип данных ('scenarios', 'settings', 'memory_images', 'sounds', 'avatars')
    
    Returns:
        str: Путь к системным данным
    """
    return SYSTEM_PATHS.get(data_type)

def copy_system_defaults_to_user(user_id, data_type):
    """
    Копирует системные файлы по умолчанию в папку пользователя
    
    Args:
        user_id (int): ID пользователя
        data_type (str): Тип данных для копирования
    """
    import shutil
    
    system_path = get_system_data_path(data_type)
    user_path = get_user_data_path(user_id, data_type)
    
    if system_path and os.path.exists(system_path):
        # Копируем все файлы из системной папки в пользовательскую
        for filename in os.listdir(system_path):
            src_file = os.path.join(system_path, filename)
            dst_file = os.path.join(user_path, filename)
            
            if os.path.isfile(src_file) and not os.path.exists(dst_file):
                shutil.copy2(src_file, dst_file)

def initialize_user_data(user_id):
    """
    Инициализирует данные для нового пользователя, копируя системные файлы по умолчанию
    
    Args:
        user_id (int): ID пользователя
    """
    # Копируем системные файлы по умолчанию
    copy_system_defaults_to_user(user_id, 'scenarios')
    copy_system_defaults_to_user(user_id, 'settings')
    
    # Создаем остальные необходимые папки
    get_user_data_path(user_id, 'memory')
    get_user_data_path(user_id, 'uploads')
    get_user_data_path(user_id, 'temp')