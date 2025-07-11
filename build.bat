chcp 65001
@echo off

REM 1. Сборка клиента
cd client
call npm install
call npm run build
cd ..

REM 2. Удаление папки dist на сервере
if exist "server\app\dist" rmdir /s /q "server\app\dist"

REM 3. Копирование dist в /app на сервер
xcopy "client\dist" "server\app\dist\" /s /e /i

REM 5. Сборка контейнера
docker build -t secretary-app .

REM 6. Запуск контейнера
docker compose --env-file .env.docker up -d --build
