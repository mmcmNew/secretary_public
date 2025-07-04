import glob
from datetime import datetime
import os
import asyncio
import random
import time

import edge_tts
from flask import current_app


def generate_tts(text, record_id=None):
    print('generate_tts')
    save_path = os.path.join(os.getcwd(), 'app', 'temp')
    os.makedirs(save_path, exist_ok=True)
    if not record_id:
        current_time = datetime.now().strftime("%Y%m%d%H%M%S")
        random_id = random.randint(1000, 9999)
        record_id = f'{current_time}_{random_id}'

    edge_filename = os.path.join(save_path, f'edge_audio_{record_id}.mp3')
    edge_output_filename = os.path.join(save_path, edge_filename)
    speed = 40
    tts_voice = 'ru-RU-SvetlanaNeural-Female'
    # print(f'edge_tts: text: {text}')
    tts_text = text.replace('*', '').replace('!', '.')
    try:
        if os.path.exists(edge_output_filename):
            os.remove(edge_output_filename)
        if speed >= 0:
            speed_str = f"+{speed}%"
        else:
            speed_str = f"{speed}%"
        t0 = time.time()
        
        # Простой синхронный подход
        try:
            # Проверяем, есть ли уже event loop
            try:
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    # Если loop уже работает, создаем новый в отдельном потоке
                    import threading
                    result = [None]
                    exception = [None]
                    
                    def run_in_thread():
                        try:
                            new_loop = asyncio.new_event_loop()
                            asyncio.set_event_loop(new_loop)
                            communicate = edge_tts.Communicate(tts_text, "-".join(tts_voice.split("-")[:-1]), rate=speed_str)
                            new_loop.run_until_complete(communicate.save(edge_output_filename))
                            new_loop.close()
                        except Exception as e:
                            exception[0] = e
                    
                    thread = threading.Thread(target=run_in_thread)
                    thread.start()
                    thread.join(timeout=30)
                    
                    if thread.is_alive():
                        raise TimeoutError("TTS generation timeout")
                    if exception[0]:
                        raise exception[0]
                else:
                    # Луп не работает, можно использовать его
                    communicate = edge_tts.Communicate(tts_text, "-".join(tts_voice.split("-")[:-1]), rate=speed_str)
                    loop.run_until_complete(communicate.save(edge_output_filename))
            except RuntimeError:
                # Нет event loop, создаем новый
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                communicate = edge_tts.Communicate(tts_text, "-".join(tts_voice.split("-")[:-1]), rate=speed_str)
                loop.run_until_complete(communicate.save(edge_output_filename))
                loop.close()
        except Exception as e:
            current_app.logger.error(f'TTS generation error: {e}')
            return f'TTS generation error: {e}'
            
        t1 = time.time()
        edge_time = t1 - t0
        current_app.logger.info(f'edge_tts: Time: {edge_time}')
        # info = f"Успешно edge-tts"
        # print(info)
        return edge_filename
    except EOFError:
        info = (
            "Похоже, что вывод edge-tts не соответствует действительности. "
            "Это может произойти при несовпадении входного текста и спикера. "
            "Например, вы ввели русский текст, но выбрали не русский?"
        )
        current_app.logger.info(info)
        return info
    except Exception as e:
        info = f'edge_tts: {e}'
        current_app.logger.info(info)
        return info


def del_all_audio_files():
    save_path = os.path.join(os.getcwd(), 'app', 'temp')
    for file_path in glob.glob(os.path.join(save_path, 'edge_audio_*.mp3')):
        try:
            os.remove(file_path)
            # current_app.logger.info(f'Файл {file_path} был успешно удален')
        except OSError as e:
            current_app.logger.error(f'Ошибка при удалении файла {file_path}: {e}')




if __name__ != '__main__':
    print("start_main")
