import { test, expect } from '@playwright/test';

test.describe('Аутентификация', () => {
  test('Успешный вход в систему', async ({ page }) => {
    await page.goto('/login');
    
    // Заполнение формы входа
    await page.getByRole('textbox', { name: 'Email' }).fill('testuser@example.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('password123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Проверка успешного входа
    await expect(page).toHaveURL('/');
    // После успешного входа пользователь попадает на главную страницу
  });

  test('Ошибка входа с несуществующим именем пользователя', async ({ page }) => {
    await page.goto('/login');
    
    // Заполнение формы с несуществующим именем пользователя
    await page.getByRole('textbox', { name: 'Email' }).fill('email');
    await page.getByRole('textbox', { name: 'Password' }).fill('anypassword');
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Проверка ошибки
    await expect(page.getByText('Invalid username or password')).toBeVisible();
  });

  test('Ошибка входа с неправильным паролем', async ({ page }) => {
    await page.goto('/login');
    
    // Заполнение формы с правильным именем пользователя, но неправильным паролем
    // Предполагаем, что пользователь 'newuser' существует (создан в тесте регистрации)
    await page.getByRole('textbox', { name: 'Email' }).fill('newuser@example.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('wrongpassword');
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Проверка ошибки
    await expect(page.getByText('Invalid username or password')).toBeVisible();
  });

  test('Сохранение авторизации при обновлении страницы', async ({ page }) => {
    // Входим в систему
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'Email' }).fill('testuser@example.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('password123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL('/');

    // Проверяем, что токен сохранен в localStorage
    const accessToken = await page.evaluate(() => localStorage.getItem('accessToken'));
    expect(accessToken).not.toBeNull();

    // Обновляем страницу
    await page.reload();

    // Проверяем, что пользователь остался авторизованным
    await expect(page).toHaveURL('/');
    
    // Проверяем, что токен все еще в localStorage
    const accessTokenAfterReload = await page.evaluate(() => localStorage.getItem('accessToken'));
    expect(accessTokenAfterReload).toBe(accessToken);
  });

  test('Успешный выход из системы', async ({ page }) => {
    // Сначала нужно войти в систему
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'Email' }).fill('testuser@example.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('password123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL('/');

    // Находим и нажимаем кнопку выхода
    await page.getByRole('button', { name: 'T', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Выход' }).click();

    // Проверка успешного выхода
    await expect(page).toHaveURL('/login');
    
    // Проверяем, что токенов нет в localStorage
    const accessToken = await page.evaluate(() => localStorage.getItem('accessToken'));
    const refreshToken = await page.evaluate(() => localStorage.getItem('refreshToken'));
    expect(accessToken).toBeNull();
    expect(refreshToken).toBeNull();
  });
});
