# Secretary App - Docker Quick Start

## Быстрый запуск

### Windows
```cmd
build.bat
```

### Linux/macOS
```bash
chmod +x build.sh
./build.sh
```

## Доступ к приложению
- URL: http://localhost:5100
- Логи: `docker-compose logs -f`
- Остановка: `docker-compose down`

## Структура проекта
- **Frontend**: React + Vite + PWA
- **Backend**: Flask + Socket.IO + SQLite
- **Docker**: Многоэтапная сборка

## Требования
- Docker 20.10+
- Docker Compose 2.0+
- 2GB свободного места

Подробная инструкция: [DOCKER_BUILD_GUIDE.md](DOCKER_BUILD_GUIDE.md)