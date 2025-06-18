import requests
from twitchio.ext import commands


# Создаём класс бота, наследуя его от commands.Bot
class TwitchBot(commands.Bot):

    def __init__(self):
        # Инициализация бота с указанием токена, префикса команд и списка каналов
        super().__init__(token='qr51a9pl84o8uzm7be71phdrmh01ww', prefix='!', initial_channels=['player_mmcm'])
        self.user_messages = {}  # Словарь для отслеживания пользователей и их сообщений

    async def event_ready(self):
        # Вызывается, когда бот успешно подключился и готов к работе
        print(f'Logged in as | {self.nick}')

    async def event_message(self, message):
        # Вызывается при каждом сообщении в чате
        # Проверка, чтобы бот не реагировал на свои собственные сообщения
        if message.echo:
            return

        if message.author.name not in self.user_messages:
            print(f'Первое сообщение от {message.author.name}: {message.content}')
            self.user_messages[message.author.name] = 1  # Добавляем пользователя в словарь
            # Отправляем данные в маршрут Flask
            self.send_to_flask(message)
        else:
            print(f'Не первое сообщение от {message.author.name}: {message.content}')
            # Увеличиваем счетчик сообщений для данного пользователя
            self.user_messages[message.author.name] += 1
        # Дополнительно: передаем сообщение обработчику команд, если это команда
        await self.handle_commands(message)

    @staticmethod
    def send_to_flask(message):
        # Формируем данные для отправки
        data = {
            'author': message.author.name,
            'content': message.content,
        }
        print(f'send_to_flask: {data}')
        # URL вашего Flask-сервера
        flask_url = 'http://127.0.0.1:5000/twitch_message'  # замените на актуальный URL

        try:
            # Отправляем POST-запрос на сервер Flask
            response = requests.post(flask_url, json=data)
            print(f'Отправлено в Flask: {response.status_code} - {response.text}')
            pass
        except requests.exceptions.RequestException as e:
            print(f'Ошибка отправки данных на Flask: {e}')


# Запуск бота
if __name__ == "__main__":
    bot = TwitchBot()
    bot.run()
