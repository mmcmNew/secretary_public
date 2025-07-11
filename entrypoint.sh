#!/bin/sh
set -e

# Применяем миграции (безопасно при каждом запуске)
flask db upgrade

# инициализация данных
flask seed

# Запуск приложения
exec python run.py --mode docker 