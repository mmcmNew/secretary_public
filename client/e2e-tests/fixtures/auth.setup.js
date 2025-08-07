import { test as setup } from '@playwright/test';

const authFile = 'e2e-tests/.auth/user.json';
const username = 'testuser';
const email = 'testuser@example.com';
const password = 'password123';

setup('authenticate', async ({ page }) => {
  // Попробовать выполнить регистрацию пользователя
  await page.goto('/register');
  await page.getByRole('textbox', { name: 'Username' }).fill(username);
  await page.getByRole('textbox', { name: 'Email' }).fill(email);
  await page.getByRole('textbox', { name: 'Password' }).fill(password);
  await page.getByRole('button', { name: 'Register' }).click();
  
  // Проверить, была ли регистрация успешной
  try {
    // Дождаться перехода на главную страницу или появления сообщения об ошибке
    await Promise.race([
      page.waitForURL('/'),
      page.waitForSelector('text=Username already taken', { timeout: 5000 }),
      page.waitForSelector('text=Email already registered', { timeout: 5000 })
    ]);
    
    // Если появилось сообщение об ошибке, значит пользователь уже существует
    const usernameTaken = await page.getByText('Username already taken').isVisible();
    const emailRegistered = await page.getByText('Email already registered').isVisible();
    
    if (usernameTaken || emailRegistered) {
      // Выполнить вход в систему
      await page.goto('/login');
      await page.getByRole('textbox', { name: 'Email' }).fill(email);
      await page.getByRole('textbox', { name: 'Password' }).fill(password);
      await page.getByRole('button', { name: 'Sign In' }).click();
      await page.waitForURL('/');
    }
  } catch (error) {
    console.error('Error during authentication:', error);
    throw error;
  }
  
  // Сохранить состояние авторизации
  await page.context().storageState({ path: authFile });
});