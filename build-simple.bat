@echo off
echo ========================================
echo Secretary App - Simple Build Script
echo ========================================

echo.
echo [1/4] Сборка клиента...
cd client
call npm run build
cd ..

echo.
echo [2/4] Копирование клиента в сервер...
if exist "server\app\dist" rmdir /s /q "server\app\dist"
xcopy "client\dist" "server\app\dist" /E /I /Y

echo.
echo [3/4] Сборка Docker образа...
docker build -f Dockerfile.simple -t secretary-app .

echo.
echo [4/4] Запуск контейнера...
docker stop secretary-app 2>nul
docker rm secretary-app 2>nul
docker run -d --name secretary-app -p 5100:5100 -v "%cd%\server\user_data:/app/user_data" -v "%cd%\server\logs:/app/logs" secretary-app

echo.
echo ========================================
echo Сборка завершена!
echo Приложение доступно по адресу: http://localhost:5100
echo ========================================
pause