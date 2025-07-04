# Инструкция по сборке проекта Secretary

## Требования
- Node.js 18+
- Docker и Docker Compose
- Git

## Быстрая сборка

### Windows
```bash
build.bat
```

## Пошаговая сборка

### 1. Сборка клиента
```bash
cd client
npm run build
cd ..
```

### 2. Замена клиента на сервере
```bash
rmdir /s /q "server\app\dist"
mkdir "server\app\dist"
xcopy "client\dist\*" "server\app\dist\" /s /e /y
```

### 3. Сборка Docker образа
```bash
docker build -t secretary-app:latest .
```

### 4. Запуск
```bash
docker-compose up -d
```

## Доступ к приложению
После запуска приложение будет доступно по адресу: http://localhost:5100

## Остановка
```bash
docker-compose down
```

## Логи
```bash
docker-compose logs -f secretary-app
```