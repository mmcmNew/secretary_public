import { test, expect } from '@playwright/test';

test.describe('Функциональность задач', () => {
  // Тесты используют предварительно авторизованного пользователя
  // Состояние авторизации сохранено в e2e-tests/.auth/user.json

  test('Создание новой задачи', async ({ page }) => {
    // Переход к списку задач
    await page.goto('/');
    await page.click('text=Задачи');
    
    // Открытие формы создания задачи
    await page.click('button[aria-label="Добавить задачу"]');
    
    // Заполнение формы
    await page.fill('input[name="title"]', 'Тестовая задача');
    await page.click('button:has-text("Сохранить")');
    
    // Проверка успешного создания
    await expect(page.locator('text=Тестовая задача')).toBeVisible();
  });

  test('Редактирование задачи', async ({ page }) => {
    // Создание задачи для редактирования
    await page.click('button[aria-label="Добавить задачу"]');
    await page.fill('input[name="title"]', 'Задача для редактирования');
    await page.click('button:has-text("Сохранить")');
    
    // Открытие задачи для редактирования
    await page.click('text=Задача для редактирования');
    await page.click('button[aria-label="Редактировать"]');
    
    // Редактирование задачи
    await page.fill('input[name="title"]', 'Отредактированная задача');
    await page.click('button:has-text("Сохранить")');
    
    // Проверка успешного редактирования
    await expect(page.locator('text=Отредактированная задача')).toBeVisible();
  });

  test('Удаление задачи', async ({ page }) => {
    // Создание задачи для удаления
    await page.click('button[aria-label="Добавить задачу"]');
    await page.fill('input[name="title"]', 'Задача для удаления');
    await page.click('button:has-text("Сохранить")');
    
    // Удаление задачи
    await page.click('text=Задача для удаления');
    await page.click('button[aria-label="Удалить"]');
    await page.click('button:has-text("Подтвердить")');
    
    // Проверка успешного удаления
    await expect(page.locator('text=Задача для удаления')).not.toBeVisible();
  });

  test('Изменение статуса задачи', async ({ page }) => {
    // Создание задачи для изменения статуса
    await page.click('button[aria-label="Добавить задачу"]');
    await page.fill('input[name="title"]', 'Задача для изменения статуса');
    await page.click('button:has-text("Сохранить")');
    
    // Изменение статуса задачи на "Выполнена"
    await page.click('input[type="checkbox"]'); // Чекбокс для изменения статуса
    
    // Проверка изменения статуса
    await expect(page.locator('input[type="checkbox"]')).toBeChecked();
  });
});