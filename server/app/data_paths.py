"""
Конфигурация путей к системным и пользовательским данным
"""
import os

# Корневая папка сервера
SERVER_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Папка со стандартными данными
DEFAULTS_DIR = os.path.join(SERVER_DIR, 'app', 'static', 'default_settings')

# Пути к системным файлам по умолчанию
SYSTEM_PATHS = {
    'scenarios': os.path.join(DEFAULTS_DIR, 'scenarios'),
    'settings': os.path.join(DEFAULTS_DIR, 'settings'),
    'memory_images': os.path.join(DEFAULTS_DIR, 'memory'),
    'sounds': os.path.join(DEFAULTS_DIR, 'static', 'sounds'),
    'avatars': os.path.join(DEFAULTS_DIR, 'static', 'avatars'),
    'audio': os.path.join(DEFAULTS_DIR, 'static', 'audio'),
}

# Пользовательские данные
USER_DATA_DIR = os.path.join(SERVER_DIR, 'user_data')
APP_USER_DATA_DIR = USER_DATA_DIR

def get_user_data_path(user_id, data_type):
    """
    Возвращает путь к пользовательским данным
    
    Args:
        user_id (int): ID пользователя
        data_type (str): Тип данных ('scenarios', 'settings', 'memory', 'uploads', 'audio', etc.)
    
    Returns:
        str: Путь к пользовательским данным
    """
    user_dir = os.path.join(USER_DATA_DIR, f'user_{user_id}')
    
    # Создаем папку пользователя если её нет
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
        data_type (str): Тип данных ('scenarios', 'settings', 'memory_images', 'sounds', 'avatars', 'audio')
    
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
    copy_system_defaults_to_user(user_id, 'avatars')
    copy_system_defaults_to_user(user_id, 'sounds')
    copy_system_defaults_to_user(user_id, 'audio')
    
    # Создаем остальные необходимые папки
    get_user_data_path(user_id, 'memory')
    get_user_data_path(user_id, 'uploads')
    get_user_data_path(user_id, 'temp')

    # Создаем базовую структуру папок пользователя
    os.makedirs(os.path.join(USER_DATA_DIR, f'user_{user_id}', 'journals'), exist_ok=True)
    os.makedirs(os.path.join(USER_DATA_DIR, f'user_{user_id}', 'static'), exist_ok=True)


# Пути к файлам журналов
def get_user_journal_path(user_id, journal_name):
    """Возвращает путь к папке журнала пользователя."""
    base = os.path.join(USER_DATA_DIR, f'user_{user_id}', 'journals', journal_name)
    os.makedirs(base, exist_ok=True)
    return base
