"""
Менеджер пользовательских данных
"""
from .data_paths import initialize_user_data, get_user_data_path, get_system_data_path
import os
import json

class UserDataManager:
    """Класс для управления пользовательскими данными"""
    
    @staticmethod
    def create_user_workspace(user_id):
        """
        Создает рабочее пространство для нового пользователя
        
        Args:
            user_id (int): ID пользователя
        """
        try:
            # Инициализируем базовую структуру данных пользователя
            initialize_user_data(user_id)
            
            print(f"Рабочее пространство для пользователя {user_id} создано успешно")
            return True
            
        except Exception as e:
            print(f"Ошибка при создании рабочего пространства для пользователя {user_id}: {e}")
            return False
    
    @staticmethod
    def get_user_scenarios(user_id):
        """
        Получает список сценариев пользователя
        
        Args:
            user_id (int): ID пользователя
            
        Returns:
            list: Список сценариев
        """
        scenarios_path = get_user_data_path(user_id, 'scenarios')
        scenarios = []
        
        if os.path.exists(scenarios_path):
            for filename in os.listdir(scenarios_path):
                if filename.endswith('.json'):
                    file_path = os.path.join(scenarios_path, filename)
                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            scenario_data = json.load(f)
                            scenario_data['filename'] = filename
                            scenarios.append(scenario_data)
                    except Exception as e:
                        print(f"Ошибка при чтении сценария {filename}: {e}")
        
        return scenarios
    
    @staticmethod
    def get_user_settings(user_id, setting_type):
        """
        Получает настройки пользователя определенного типа
        
        Args:
            user_id (int): ID пользователя
            setting_type (str): Тип настроек (например, 'modules', 'commands_list')
            
        Returns:
            dict: Настройки пользователя
        """
        settings_path = get_user_data_path(user_id, 'settings')
        setting_file = os.path.join(settings_path, f'{setting_type}.json')
        
        if os.path.exists(setting_file):
            try:
                with open(setting_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                print(f"Ошибка при чтении настроек {setting_type} для пользователя {user_id}: {e}")
        
        return {}
    
    @staticmethod
    def save_user_settings(user_id, setting_type, settings_data):
        """
        Сохраняет настройки пользователя
        
        Args:
            user_id (int): ID пользователя
            setting_type (str): Тип настроек
            settings_data (dict): Данные настроек
            
        Returns:
            bool: Успешность сохранения
        """
        try:
            settings_path = get_user_data_path(user_id, 'settings')
            setting_file = os.path.join(settings_path, f'{setting_type}.json')
            
            with open(setting_file, 'w', encoding='utf-8') as f:
                json.dump(settings_data, f, ensure_ascii=False, indent=2)
            
            return True
            
        except Exception as e:
            print(f"Ошибка при сохранении настроек {setting_type} для пользователя {user_id}: {e}")
            return False
    
    @staticmethod
    def get_memory_image_path(user_id, image_name):
        """
        Возвращает путь к изображению памяти пользователя или системному
        
        Args:
            user_id (int): ID пользователя
            image_name (str): Имя изображения
            
        Returns:
            str: Путь к изображению
        """
        # Сначала ищем в пользовательской папке
        user_memory_path = get_user_data_path(user_id, 'memory')
        user_image_path = os.path.join(user_memory_path, image_name)
        
        if os.path.exists(user_image_path):
            return user_image_path
        
        # Если не найдено, ищем в системной папке
        system_memory_path = get_system_data_path('memory_images')
        system_image_path = os.path.join(system_memory_path, image_name)
        
        if os.path.exists(system_image_path):
            return system_image_path
        
        return None
    
    @staticmethod
    def cleanup_user_data(user_id):
        """
        Очищает данные пользователя (при удалении аккаунта)
        
        Args:
            user_id (int): ID пользователя
        """
        import shutil
        
        from .data_paths import USER_DATA_DIR
        try:
            user_dir = os.path.join(USER_DATA_DIR, f'user_{user_id}')
            if os.path.exists(user_dir):
                shutil.rmtree(user_dir)
                print(f"Данные пользователя {user_id} удалены")
                return True
        except Exception as e:
            print(f"Ошибка при удалении данных пользователя {user_id}: {e}")
            
        return False