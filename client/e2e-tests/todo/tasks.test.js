import { test, expect } from '../fixtures/tasks.fixture.js';

test.describe('Функциональность задач', () => {
  const taskName = `Тестовая задача ${Date.now()}`;
  // Тесты используют предварительно авторизованного пользователя
  // Состояние авторизации сохранено в e2e-tests/.auth/user.json

  // Фикстура tasksPage будет автоматически применяться к каждому тесту,
  // открывая нужный компонент перед его выполнением.

  test('Создание новой задачи', async ({ tasksPage }) => {
    // const taskName = `Тестовая задача ${Date.now()}`;

    await tasksPage.getByRole('button', { name: 'Задачи' }).click();

    // Заполнение формы
    await tasksPage.getByRole('textbox', { name: 'Добавить задачу' }).fill(taskName);
    await tasksPage.getByRole('button', { name: 'add task' }).click();
    
    // Проверка успешного создания
    const taskButton = tasksPage.getByRole('button', { name: taskName });
    await expect(taskButton).toBeVisible();
    await expect(taskButton.getByRole('checkbox', { name: taskName })).toBeVisible();
    await expect(taskButton.getByText(taskName)).toBeVisible();
  });

  test('Редактирование задачи', async ({ tasksPage }) => {
    // Создание задачи для редактирования
    await tasksPage.getByRole('button', { name: 'Задачи Незавершённые задачи' }).click();

    await tasksPage.getByRole('textbox', { name: 'Добавить задачу' }).fill('Задача для редактирования');
    await tasksPage.getByRole('button', { name: 'add task' }).click();
    await expect(tasksPage.locator('text=Задача для редактирования')).toBeVisible();
    
    const taskItem = tasksPage.locator('.task-item:has-text("Задача для редактирования")');

    // Открытие задачи для редактирования
    await taskItem.getByRole('button', { name: 'edit' }).click();
    
    // Редактирование задачи
    await tasksPage.getByRole('textbox', { name: 'Редактировать задачу' }).fill('Отредактированная задача');
    await tasksPage.getByRole('button', { name: 'save' }).click();
    
    // Проверка успешного редактирования
    await expect(tasksPage.locator('text=Отредактированная задача')).toBeVisible();
    await expect(tasksPage.locator('text=Задача для редактирования')).not.toBeVisible();
  });

  // test('Удаление задачи', async ({ tasksPage }) => {
  //   // Создание задачи для удаления
  //   await tasksPage.getByRole('textbox', { name: 'Добавить задачу' }).fill('Задача для удаления');
  //   await tasksPage.getByRole('button', { name: 'add task' }).click();
  //   await expect(tasksPage.locator('text=Задача для удаления')).toBeVisible();
    
  //   const taskItem = tasksPage.locator('.task-item:has-text("Задача для удаления")');

  //   // Удаление задачи
  //   await taskItem.getByRole('button', { name: 'delete' }).click();
    
  //   // Проверка успешного удаления
  //   await expect(tasksPage.locator('text=Задача для удаления')).not.toBeVisible();
  // });

  test('Изменение статуса задачи', async ({ tasksPage }) => {
    // Создание задачи для изменения статуса
    await tasksPage.getByRole('button', { name: 'Задачи Незавершённые задачи' }).click();

    await tasksPage.getByRole('textbox', { name: 'Добавить задачу' }).fill('Задача для изменения статуса');
    await tasksPage.getByRole('button', { name: 'add task' }).click();
    await expect(tasksPage.locator('text=Задача для изменения статуса')).toBeVisible();
    
    const taskItem = tasksPage.locator('.task-item:has-text("Задача для изменения статуса")');

    // Изменение статуса задачи на "Выполнена"
    await taskItem.getByRole('checkbox').check();
    
    // Проверка изменения статуса
    await expect(taskItem.getByRole('checkbox')).toBeChecked();

    // Изменение статуса обратно на "Не выполнена"
    await taskItem.getByRole('checkbox').uncheck();
    await expect(taskItem.getByRole('checkbox')).not.toBeChecked();
  });

  test('Создание нового списка', async ({ tasksPage }) => {
    const listName = `Новый список`;
    await tasksPage.getByRole('button', { name: 'Создать список' }).click();
    await expect(tasksPage.getByText(listName)).toBeVisible();
  });

  test('Создание новой группы', async ({ tasksPage }) => {
    const groupName = `Новая группа`;
    await tasksPage.locator('div').filter({ hasText: /^Создать список$/ }).getByRole('button').nth(1).click();
    await expect(tasksPage.getByText(groupName)).toBeVisible();
  });

  test('Создание нового проекта', async ({ tasksPage }) => {
    const projectName = `Новый проект`;
    await tasksPage.locator('div').filter({ hasText: /^Создать список$/ }).getByRole('button').nth(2).click();
    await expect(tasksPage.getByText(projectName)).toBeVisible();
  });
});