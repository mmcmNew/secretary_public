import { test, expect } from '@playwright/test';

test.describe('Регистрация', () => {
  test('Успешная регистрация нового пользователя', async ({ page }) => {
    await page.goto('/register');
    
    // Заполнение формы регистрации
    await page.getByRole('textbox', { name: 'Username' }).fill('newuser');
    await page.getByRole('textbox', { name: 'Email' }).fill('newuser@example.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('password123');
    await page.getByRole('button', { name: 'Register' }).click();
    
    // Проверка успешной регистрации
    await expect(page).toHaveURL('/');
    // После успешной регистрации пользователь автоматически входит в систему
  });

  test('Ошибка регистрации с уже существующим именем пользователя', async ({ page }) => {
    await page.goto('/register');
    
    // Заполнение формы с уже существующим именем пользователя
    await page.getByRole('textbox', { name: 'Username' }).fill('newuser');
    await page.getByRole('textbox', { name: 'Email' }).fill('newuser@example.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('password123');
    await page.getByRole('button', { name: 'Register' }).click();
    
    // Проверка ошибки
    await expect(page.getByText('Username already taken')).toBeVisible();
  });


  test('Ошибка регистрации с уже существующим email', async ({ page }) => {
    await page.goto('/register');
    
    // Заполнение формы с уже существующим email
    await page.getByRole('textbox', { name: 'Username' }).fill('newusername');
    await page.getByRole('textbox', { name: 'Email' }).fill('newuser@example.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('password123');
    await page.getByRole('button', { name: 'Register' }).click();
    
    // Проверка ошибки
    await expect(page.getByText('Email already registered')).toBeVisible();
  });
});
