import { test, expect } from '@playwright/test';

test.describe('Demo Mode and Auth Modal', () => {
  test('should show login button for guest user', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Войти' })).toBeVisible();
  });

//   test('should open auth modal on protected action', async ({ page }) => {
//     await page.goto('/');
//     // Предполагается, что есть кнопка "Создать задачу", которая триггерит модальное окно
//     // Если такой кнопки нет, нужно будет адаптировать тест под реальный UI
//     await page.getByRole('button', { name: 'Создать задачу' }).click();
//     await expect(page.getByRole('dialog')).toBeVisible();
//     await expect(page.getByRole('tab', { name: 'Sign In' })).toBeVisible();
//     await expect(page.getByRole('tab', { name: 'Register' })).toBeVisible();
//   });

  test('should switch between sign in and register tabs', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Войти' }).click();
    
    await expect(page.getByLabel('Email Address')).toBeVisible();
    
    await page.getByRole('tab', { name: 'Register' }).click();
    await expect(page.getByLabel('Username')).toBeVisible();
  });

  test('should show error on failed login', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Войти' }).click();
    
    await page.getByLabel('Email Address').fill('wrong@test.com');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    await expect(page.getByText('Invalid username or password')).toBeVisible();
  });

  test('should show error on failed registration', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Войти' }).click();
    await page.getByRole('tab', { name: 'Register' }).click();

    // Используем существующего пользователя для проверки ошибки
    await page.getByLabel('Username').fill('testuser');
    await page.getByLabel('Email Address').fill('test@test.com');
    await page.getByLabel('Password').fill('password');
    await page.getByRole('button', { name: 'Register' }).click();

    await expect(page.getByText('Email already registered')).toBeVisible();
  });
});