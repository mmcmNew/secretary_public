#!/usr/bin/env python3
"""
Скрипт для конвертации PNG файлов в JPG в папке data/system/assets/memory
"""

import os
try:
    from PIL import Image
except ImportError:
    import PIL.Image as Image
import glob

def convert_png_to_jpg(source_dir):
    """Конвертирует все PNG файлы в указанной папке в JPG"""
    
    # Получаем все PNG файлы в папке
    png_files = glob.glob(os.path.join(source_dir, "*.png"))
    
    if not png_files:
        print(f"PNG файлы не найдены в папке: {source_dir}")
        return
    
    print(f"Найдено {len(png_files)} PNG файлов для конвертации...")
    
    converted_count = 0
    
    for png_file in png_files:
        try:
            # Открываем PNG изображение
            with Image.open(png_file) as img:
                # Конвертируем в RGB если изображение в режиме RGBA
                if img.mode in ('RGBA', 'LA', 'P'):
                    # Создаем белый фон
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'P':
                        img = img.convert('RGBA')
                    background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                    img = background
                
                # Создаем имя JPG файла
                jpg_file = png_file.replace('.png', '.jpg')
                
                # Сохраняем как JPG с качеством 95%
                img.save(jpg_file, 'JPEG', quality=95, optimize=True)
                
                print(f"Конвертирован: {os.path.basename(png_file)} -> {os.path.basename(jpg_file)}")
                converted_count += 1
                
        except Exception as e:
            print(f"Ошибка при конвертации {png_file}: {e}")
    
    print(f"\nКонвертация завершена. Обработано файлов: {converted_count}")
    
    # Удаляем оригинальные PNG файлы
    if converted_count > 0:
        response = input("\nУдалить оригинальные PNG файлы? (y/n): ")
        if response.lower() == 'y':
            for png_file in png_files:
                try:
                    os.remove(png_file)
                    print(f"Удален: {os.path.basename(png_file)}")
                except Exception as e:
                    print(f"Ошибка при удалении {png_file}: {e}")

def main():
    # Путь к папке с изображениями
    memory_dir = os.path.join("data", "system", "assets", "memory")
    
    if not os.path.exists(memory_dir):
        print(f"Папка не найдена: {memory_dir}")
        return
    
    print(f"Начинаю конвертацию PNG файлов в папке: {memory_dir}")
    convert_png_to_jpg(memory_dir)

if __name__ == "__main__":
    main()