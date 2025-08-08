import { test, expect } from '@playwright/test';

test.describe('Demo Mode and Authorization', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should show demo mode button in auth modal', async ({ page }) => {
    // Проверяем, что кнопка демо-режима видна в модальном окне
    await expect(page.getByRole('button', { name: 'Попробовать демо-режим' })).toBeVisible();
  });

  test('should successfully enter demo mode on button click', async ({ page }) => {
    // Нажимаем на кнопку демо-режима
    await page.getByRole('button', { name: 'Попробовать демо-режим' }).click();

    // Проверяем, что модальное окно закрылось
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // Проверяем, что мы вошли в систему (например, есть кнопка выхода)
    await expect(page.getByRole('button', { name: /выход/i })).toBeVisible();
  });

  test('should have access to basic functionality in demo mode', async ({ page }) => {
    // Входим в демо-режим
    await page.getByRole('button', { name: 'Попробовать демо-режим' }).click();

    // Проверяем доступ к основному функционалу
    // Например, проверяем наличие контейнеров на главной странице
    await expect(page.locator('.container')).toBeVisible();

    // Проверяем возможность добавления нового контейнера
    await page.getByRole('button', { name: /добавить/i }).click();
    await expect(page.getByRole('dialog', { name: /добавить контейнер/i })).toBeVisible();
  });

  test('should maintain demo state after page reload', async ({ page }) => {
    // Входим в демо-режим
    await page.getByRole('button', { name: 'Попробовать демо-режим' }).click();

    // Перезагружаем страницу
    await page.reload();

    // Проверяем, что мы всё ещё в демо-режиме
    await expect(page.getByRole('button', { name: /выход/i })).toBeVisible();
    await expect(page.locator('.container')).toBeVisible();
  });

  test('should show error message if demo mode fails', async ({ page }) => {
    // Намеренно вызываем ошибку, изменив URL API
    await page.route('**/api/demo/auth', (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Demo mode unavailable' })
      });
    });

    // Пытаемся войти в демо-режим
    await page.getByRole('button', { name: 'Попробовать демо-режим' }).click();

    // Проверяем, что появилось сообщение об ошибке
    await expect(page.getByText(/не удалось войти в демо-режим/i)).toBeVisible();
  });

  test('should correctly handle logout in demo mode', async ({ page }) => {
    // Входим в демо-режим
    await page.getByRole('button', { name: 'Попробовать демо-режим' }).click();

    // Выходим из системы
    await page.getByRole('button', { name: /выход/i }).click();

    // Проверяем, что мы вернулись к начальному состоянию
    await expect(page.getByRole('button', { name: 'Попробовать демо-режим' })).toBeVisible();
  });

  test('should show limited functionality message for restricted features', async ({ page }) => {
    // Входим в демо-режим
    await page.getByRole('button', { name: 'Попробовать демо-режим' }).click();

    // Пытаемся получить доступ к функционалу, который требует полного доступа
    await page.goto('/admin');

    // Проверяем, что появилось сообщение о необходимости регистрации
    await expect(page.getByText(/требуется регистрация/i)).toBeVisible();
  });
});
