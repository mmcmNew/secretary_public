#!/bin/sh
set -e

# Применяем миграции (безопасно при каждом запуске)
if [ ! -d migrations ]; then
    echo "Creating migrations directory..."
    mkdir migrations
fi
# Инициализация миграций
flask db init || echo "Migrations already initialized"
# Создание миграции, если она не была создана ранее
if [ ! -d versions ]; then
    echo "Creating initial migration..."
    flask db migrate -m "Initial migration"
else
    echo "Migrations already exist, skipping initial migration creation."
fi 
# Если миграции уже есть, то просто применяем их
if [ -d migrations/versions ]; then
    echo "Applying existing migrations..."
else
    echo "No existing migrations found, creating initial migration..."  
flask db upgrade

# инициализация данных
flask seed

# Запуск приложения
exec python run.py --mode docker 