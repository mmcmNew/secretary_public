# Используем официальный Python-образ в качестве базового
FROM python:3.12-slim

# Устанавливаем рабочую директорию внутри контейнера
WORKDIR /app

# Копируем файл зависимостей в контейнер
COPY requirements.txt .

# Устанавливаем зависимости
RUN pip install --no-cache-dir -r requirements.txt

# Копируем все файлы и папки проекта в контейнер
COPY . .

# Открываем порт для приложения
EXPOSE 5000

# Запускаем Flask-приложение
CMD ["python", "run.py"]
