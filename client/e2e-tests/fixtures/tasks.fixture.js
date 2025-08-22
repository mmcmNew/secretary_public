import { test as base, expect } from '@playwright/test';

export const test = base.extend({
  tasksPage: async ({ page }, use) => {
    // Переход к списку задач
    await page.goto('/');
    // await page.getByRole('button', { name: 'Add Container' }).click();

    // try {
    //   // Ждём до 2 секунд, что кнопка появится
    //   await page.getByRole('menuitem', { name: 'tasks' }).waitFor({ timeout: 2000 });
    // } catch {
    //   // Если кнопка не появилась — жмём ещё раз
    //   await page.getByRole('button', { name: 'Add Container' }).click();
    // }

    // // Теперь кнопка точно есть, можно кликать
    // await page.getByRole('menuitem', { name: 'tasks' }).click();

    // // Используем expect(...).toBeVisible() как альтернативный способ ожидания.
    // // Ожидаем элемент, который вы указали.
    // await expect(page.getByRole('button', { name: 'Мой день' })).toBeVisible();
    
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(page);
  },
});

export { expect } from '@playwright/test';