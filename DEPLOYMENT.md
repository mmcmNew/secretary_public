# Развертывание проекта Secretary

## Созданные файлы для сборки

### Основные файлы
- `Dockerfile` - многоэтапная сборка приложения
- `docker-compose.yml` - конфигурация для разработки
- `docker-compose.prod.yml` - конфигурация для продакшена
- `.env.docker` - переменные окружения
- `.dockerignore` - исключения для Docker

### Скрипты сборки
- `build.sh` - скрипт сборки для Linux/macOS
- `build.bat` - скрипт сборки для Windows
- `Makefile` - автоматизация команд (Linux/macOS)

### Серверные файлы
- `server/run_docker.py` - запуск для Docker без SSL

## Процесс сборки

### Автоматическая сборка
```bash
# Linux/macOS
make build && make up

# Windows
build.bat
docker-compose up -d
```

### Ручная сборка
1. **Сборка клиента**: `cd client && npm ci && npm run build`
2. **Замена статики**: копирование `client/dist/*` в `server/app/static/`
3. **Сборка образа**: `docker build -t secretary-app:latest .`
4. **Запуск**: `docker-compose up -d`

## Структура контейнера

```
/app/
├── app/                    # Серверное приложение
│   ├── static/            # Статические файлы клиента
│   ├── user_data/         # Пользовательские данные (volume)
│   └── ...
├── logs/                  # Логи (volume)
├── requirements.txt       # Python зависимости
└── run_docker.py         # Точка входа
```

## Volumes
- `./data/user_data` → `/app/app/user_data` - пользовательские данные
- `./data/logs` → `/app/logs` - логи приложения

## Порты
- `5100` - основной порт приложения
- `80` - для продакшена (через nginx)

## Команды управления

```bash
# Сборка
make build

# Запуск
make up

# Остановка
make down

# Логи
make logs

# Очистка
make clean

# Продакшен
make prod
```

## Исключенные папки
Следующие папки НЕ копируются в контейнер:
- `user_data/` - пользовательские данные
- `logs/` - логи
- `tests/` - тесты
- `node_modules/` - зависимости Node.js
- `.git/` - Git репозиторий
- `migrations/` - миграции базы данных