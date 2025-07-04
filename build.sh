#!/bin/bash

echo "========================================"
echo "Secretary App - Docker Build Script"
echo "========================================"

echo ""
echo "[1/4] Остановка существующих контейнеров..."
docker-compose down

echo ""
echo "[2/4] Удаление старых образов..."
docker rmi secretary_public-secretary-app 2>/dev/null || true

echo ""
echo "[3/4] Сборка нового образа..."
docker-compose build --no-cache

echo ""
echo "[4/4] Запуск приложения..."
docker-compose up -d

echo ""
echo "========================================"
echo "Сборка завершена!"
echo "Приложение доступно по адресу: http://localhost:5100"
echo "========================================"

echo ""
echo "Для просмотра логов используйте: docker-compose logs -f"
echo "Для остановки используйте: docker-compose down"