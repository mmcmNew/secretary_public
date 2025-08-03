import { test, expect } from '@playwright/test';

test.describe('Аутентификация', () => {
  test('Успешный вход в систему', async ({ page }) => {
    await page.goto('/login');
    
    // Заполнение формы входа
    await page.getByRole('textbox', { name: 'Username' }).fill('newuser');
    await page.getByRole('textbox', { name: 'Password' }).fill('password123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Проверка успешного входа
    await expect(page).toHaveURL('/');
    // После успешного входа пользователь попадает на главную страницу
  });

  test('Ошибка входа с несуществующим именем пользователя', async ({ page }) => {
    await page.goto('/login');
    
    // Заполнение формы с несуществующим именем пользователя
    await page.getByRole('textbox', { name: 'Username' }).fill('nonexistentuser');
    await page.getByRole('textbox', { name: 'Password' }).fill('anypassword');
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Проверка ошибки
    await expect(page.getByText('Invalid username or password')).toBeVisible();
  });

  test('Ошибка входа с неправильным паролем', async ({ page }) => {
    await page.goto('/login');
    
    // Заполнение формы с правильным именем пользователя, но неправильным паролем
    // Предполагаем, что пользователь 'newuser' существует (создан в тесте регистрации)
    await page.getByRole('textbox', { name: 'Username' }).fill('newuser');
    await page.getByRole('textbox', { name: 'Password' }).fill('wrongpassword');
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Проверка ошибки
    await expect(page.getByText('Invalid username or password')).toBeVisible();
  });
});
