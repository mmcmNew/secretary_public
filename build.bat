chcp 65001
@echo off

REM 1. Сборка клиента
cd client
@REM call npm install
call npm run build
cd ..

REM 2. Удаление папки dist на сервере
if exist "server\app\dist" rmdir /s /q "server\app\static"

REM 3. Копирование dist в /app на сервер
xcopy "client\dist" "server\app\static\" /s /e /i

REM 5. Сборка контейнера
REM 5. Сборка контейнера
REM Usage: build.bat [version-tag]
REM Example: build.bat v1.2.2  -> will produce playermmcm/secretary-app:v1.2.1 and playermmcm/secretary-app:latest

docker build -t playermmcm/secretary-app:v1.2.2 -t playermmcm/secretary-app:latest .

@REM REM 6. Запуск контейнера
@REM docker compose --env-file .env.docker up -d --build
