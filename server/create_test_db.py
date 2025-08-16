#!/usr/bin/env python3
"""
Скрипт для создания тестовой базы данных PostgreSQL
"""
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def create_test_database():
    """Создает тестовую базу данных если она не существует"""
    try:
        # Подключаемся к PostgreSQL как суперпользователь
        conn = psycopg2.connect(
            host="localhost",
            port="5432",
            user="secretary",
            password="secretary",
            database="postgres"  # подключаемся к системной БД
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # Проверяем существование тестовой БД
        cursor.execute("SELECT 1 FROM pg_database WHERE datname = 'secretary_test_db'")
        exists = cursor.fetchone()
        
        if not exists:
            cursor.execute("CREATE DATABASE secretary_test_db")
            print("Тестовая база данных 'secretary_test_db' создана успешно")
        else:
            print("Тестовая база данных 'secretary_test_db' уже существует")
            
        cursor.close()
        conn.close()
        
    except psycopg2.Error as e:
        print(f"Ошибка при создании тестовой базы данных: {e}")
        return False
    
    return True

if __name__ == "__main__":
    create_test_database()