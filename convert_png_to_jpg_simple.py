#!/usr/bin/env python3
"""
Скрипт для конвертации PNG файлов в JPG в папке data/system/assets/memory
Использует PowerShell для конвертации
"""

import os
import subprocess
import glob

def convert_png_to_jpg_powershell(source_dir):
    """Конвертирует все PNG файлы в указанной папке в JPG используя PowerShell"""
    
    # Получаем все PNG файлы в папке
    png_files = glob.glob(os.path.join(source_dir, "*.png"))
    
    if not png_files:
        print(f"PNG файлы не найдены в папке: {source_dir}")
        return
    
    print(f"Найдено {len(png_files)} PNG файлов для конвертации...")
    
    converted_count = 0
    
    for png_file in png_files:
        try:
            # Создаем имя JPG файла
            jpg_file = png_file.replace('.png', '.jpg')
            
            # PowerShell команда для конвертации
            ps_command = f"""
            Add-Type -AssemblyName System.Drawing
            $img = [System.Drawing.Image]::FromFile('{png_file}')
            $img.Save('{jpg_file}', [System.Drawing.Imaging.ImageFormat]::Jpeg)
            $img.Dispose()
            """
            
            # Выполняем PowerShell команду
            result = subprocess.run(['powershell', '-Command', ps_command], 
                                  capture_output=True, text=True)
            
            if result.returncode == 0:
                print(f"Конвертирован: {os.path.basename(png_file)} -> {os.path.basename(jpg_file)}")
                converted_count += 1
            else:
                print(f"Ошибка при конвертации {png_file}: {result.stderr}")
                
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
    convert_png_to_jpg_powershell(memory_dir)

if __name__ == "__main__":
    main()