# Многоэтапная сборка Docker образа для Secretary App
FROM node:18-alpine AS client-builder

# Устанавливаем рабочую директорию для клиента
WORKDIR /app/client

# Копируем package.json и package-lock.json
COPY client/package*.json ./

# Устанавливаем зависимости (включая dev для сборки)
RUN npm ci

# Копируем исходный код клиента
COPY client/ ./

# Собираем клиентское приложение
RUN npm run build

# Этап сборки сервера
FROM python:3.12-slim AS server

# Устанавливаем системные зависимости
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем requirements.txt
COPY server/requirements.txt ./

# Устанавливаем Python зависимости
RUN pip install --no-cache-dir -r requirements.txt

# Копируем серверный код
COPY server/ ./

# Копируем собранный клиент в app/dist как настроено в сервере
COPY --from=client-builder /app/client/dist ./app/dist

# Создаем необходимые директории
RUN mkdir -p logs user_data/db user_data/memory user_data/scenarios user_data/settings user_data/static

# Открываем порт
EXPOSE 5100

# Устанавливаем переменные окружения
ENV FLASK_APP=run_docker.py
ENV FLASK_ENV=production
ENV PORT=5100

# Запускаем приложение
CMD ["python", "run_docker.py"]