# Инструкция по сборке и упаковке Secretary App в Docker

## Обзор проекта

Secretary App - это веб-приложение, состоящее из:
- **Frontend**: React приложение (Vite + PWA)
- **Backend**: Flask сервер с Socket.IO
- **База данных**: SQLite (встроенная)

## Структура Docker сборки

Проект использует многоэтапную сборку Docker:
1. **Этап 1**: Сборка React клиента
2. **Этап 2**: Настройка Python сервера и интеграция клиента

## Предварительные требования

- Docker версии 20.10+
- Docker Compose версии 2.0+
- Минимум 2GB свободного места на диске

## Быстрый запуск

### Windows
```cmd
# Запуск автоматической сборки
build.bat
```

### Linux/macOS
```bash
# Сделать скрипт исполняемым
chmod +x build.sh

# Запуск автоматической сборки
./build.sh
```

## Ручная сборка

### 1. Сборка образа
```bash
# Сборка с нуля
docker-compose build --no-cache

# Или сборка только при изменениях
docker-compose build
```

### 2. Запуск приложения
```bash
# Запуск в фоновом режиме
docker-compose up -d

# Запуск с выводом логов
docker-compose up
```

### 3. Остановка приложения
```bash
docker-compose down
```

## Управление контейнером

### Просмотр логов
```bash
# Все логи
docker-compose logs

# Логи в реальном времени
docker-compose logs -f

# Последние 100 строк
docker-compose logs --tail=100
```

### Перезапуск сервиса
```bash
docker-compose restart
```

### Вход в контейнер
```bash
docker-compose exec secretary-app bash
```

## Конфигурация

### Порты
- **5100**: Основной порт приложения
- Приложение доступно по адресу: `http://localhost:5100`

### Volumes (Постоянные данные)
- `./server/user_data:/app/user_data` - Пользовательские данные и БД
- `./server/logs:/app/logs` - Логи приложения

### Переменные окружения
- `FLASK_ENV=production` - Режим работы Flask
- `FLASK_APP=run.py` - Точка входа приложения

## Структура файлов Docker

```
secretary_public/
├── Dockerfile              # Основной Dockerfile
├── docker-compose.yml      # Конфигурация Docker Compose
├── .dockerignore           # Исключения для Docker
├── build.bat              # Скрипт сборки для Windows
├── build.sh               # Скрипт сборки для Linux/macOS
└── DOCKER_BUILD_GUIDE.md  # Данная инструкция
```

## Особенности сборки

### Многоэтапная сборка
1. **client-builder**: Собирает React приложение
   - Использует Node.js 18 Alpine
   - Устанавливает зависимости через `npm ci`
   - Создает production build

2. **server**: Основной этап
   - Использует Python 3.12 slim
   - Устанавливает системные зависимости
   - Копирует собранный клиент в статические файлы сервера

### Оптимизации
- Использование Alpine образов для минимального размера
- Кэширование слоев Docker
- Исключение dev зависимостей в production
- Минификация и сжатие клиентских файлов

## Troubleshooting

### Проблема: Порт уже занят
```bash
# Найти процесс на порту 5100
netstat -tulpn | grep 5100

# Остановить существующие контейнеры
docker-compose down
```

### Проблема: Недостаточно места
```bash
# Очистка неиспользуемых образов
docker system prune -a

# Очистка volumes
docker volume prune
```

### Проблема: Ошибки сборки
```bash
# Полная пересборка без кэша
docker-compose build --no-cache --pull

# Проверка логов сборки
docker-compose build --progress=plain
```

### Проблема: Приложение не отвечает
```bash
# Проверка статуса контейнера
docker-compose ps

# Проверка логов
docker-compose logs secretary-app

# Перезапуск
docker-compose restart
```

## Развертывание в production

### 1. Настройка переменных окружения
Создайте файл `.env`:
```env
FLASK_ENV=production
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///user_data/db/production.db
```

### 2. Настройка reverse proxy (nginx)
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:5100;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 3. Настройка SSL
```bash
# Использование Let's Encrypt
certbot --nginx -d your-domain.com
```

## Мониторинг

### Health Check
Приложение включает health check на эндпоинте `/api/health`

### Логирование
- Логи приложения: `./server/logs/`
- Логи Docker: `docker-compose logs`

## Резервное копирование

### Создание бэкапа данных
```bash
# Создание архива пользовательских данных
tar -czf backup_$(date +%Y%m%d_%H%M%S).tar.gz server/user_data/
```

### Восстановление данных
```bash
# Остановка приложения
docker-compose down

# Восстановление данных
tar -xzf backup_YYYYMMDD_HHMMSS.tar.gz

# Запуск приложения
docker-compose up -d
```

## Обновление приложения

```bash
# 1. Остановка текущей версии
docker-compose down

# 2. Обновление кода (git pull или копирование файлов)
git pull origin main

# 3. Пересборка образа
docker-compose build --no-cache

# 4. Запуск новой версии
docker-compose up -d
```

## Контакты и поддержка

При возникновении проблем:
1. Проверьте логи: `docker-compose logs`
2. Убедитесь в наличии свободного места на диске
3. Проверьте доступность портов
4. Обратитесь к разделу Troubleshooting