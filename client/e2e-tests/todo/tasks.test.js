import { test, expect } from '../fixtures/tasks.fixture.js';

test.describe('Функциональность задач', () => {
  const taskName = `Тестовая задача ${Date.now()}`;
  // Тесты используют предварительно авторизованного пользователя
  // Состояние авторизации сохранено в e2e-tests/.auth/user.json

  // Фикстура tasksPage будет автоматически применяться к каждому тесту,
  // открывая нужный компонент перед его выполнением.

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

  test('Создание новой задачи', async ({ tasksPage }) => {
    // Клик по кнопке которая содержит текст Задачи в название
    await tasksPage.getByRole('button', { name: 'Задачи', exact: true }).click();

    // Заполнение формы
    await tasksPage.getByRole('textbox', { name: 'Добавить задачу' }).fill(taskName);
    await tasksPage.getByRole('button', { name: 'add task' }).click();
    
    // Проверка успешного создания
    const taskButton = tasksPage.getByRole('button', { name: taskName });
    await expect(taskButton).toBeVisible();
    await expect(taskButton.getByRole('checkbox', { name: taskName })).toBeVisible();
    await expect(taskButton.getByText(taskName)).toBeVisible();
  });

  test('Изменение статуса задачи', async ({ tasksPage }) => {
    const taskToChangeStatus = `Задача для изменения статуса ${Date.now()}`;
    // Создание задачи для изменения статуса
    await tasksPage.getByRole('button', { name: 'Задачи', exact: true }).click();
    await tasksPage.getByRole('textbox', { name: 'Добавить задачу' }).fill(taskToChangeStatus);
    await tasksPage.getByRole('button', { name: 'add task' }).click();
    const taskItem = await tasksPage.getByRole('button', { name: taskToChangeStatus });
    await expect(taskItem).toBeVisible();

    // Изменение статуса задачи на "Выполнена"
    await taskItem.getByRole('checkbox').check();
    
    // Проверка изменения статуса
    await expect(taskItem.getByRole('checkbox')).toBeChecked();

    // Изменение статуса обратно на "Не выполнена"
    await taskItem.getByRole('checkbox').uncheck();
    await expect(taskItem.getByRole('checkbox')).not.toBeChecked();
  });

  test('Полное редактирование задачи', async ({ tasksPage }) => {
    const initialTaskName = `Задача для редактирования ${Date.now()}`;
    const editedTaskName = 'Отредактированная задача';
    
    // Создаем задачу для редактирования
    await tasksPage.getByRole('button', { name: 'Задачи', exact: true }).click();
    await tasksPage.getByRole('textbox', { name: 'Добавить задачу' }).fill(initialTaskName);
    await tasksPage.getByRole('button', { name: 'add task' }).click();
    await expect(tasksPage.getByRole('button', { name: initialTaskName })).toBeVisible();

    // Открываем задачу для редактирования
    await tasksPage.getByRole('button', { name: initialTaskName }).click();

    // 1. Редактируем название
    await tasksPage.getByRole('textbox', { name: 'Название задачи' }).fill(editedTaskName);

    // 2. Устанавливаем дату и время начала
    await tasksPage.getByRole('group', { name: 'Начало' }).click();
    await tasksPage.getByRole('group', { name: 'Начало' }).getByLabel('DD').fill('21');
    await tasksPage.getByRole('group', { name: 'Начало' }).getByLabel('MM', { exact: true }).fill('08');
    await tasksPage.getByRole('group', { name: 'Начало' }).getByLabel('YYYY').fill('2025');
    await tasksPage.getByRole('group', { name: 'Начало' }).getByLabel('hh').fill('12');
    await tasksPage.getByRole('group', { name: 'Начало' }).getByLabel('mm').fill('0');

    // 3. Устанавливаем дату и время окончания
    await tasksPage.getByRole('group', { name: 'Окончание' }).click();
    await tasksPage.getByRole('group', { name: 'Окончание' }).getByLabel('DD').fill('21');
    await tasksPage.getByRole('group', { name: 'Окончание' }).getByLabel('MM', { exact: true }).fill('08');
    await tasksPage.getByRole('group', { name: 'Окончание' }).getByLabel('YYYY').fill('2025');
    await tasksPage.getByRole('group', { name: 'Окончание' }).getByLabel('hh').fill('14');
    await tasksPage.getByRole('group', { name: 'Окончание' }).getByLabel('mm').fill('30');
    
    // 4. Включаем "Фоновая задача"
    await tasksPage.getByRole('button', { name: 'Фоновая задача' }).getByRole('checkbox').check();

    // 5. Включаем "Награда"
    await tasksPage.getByRole('button', { name: 'Награда' }).getByRole('checkbox').check();

    // 6. Устанавливаем цвет
    await tasksPage.getByRole('button', { name: 'Цвет на календаре' }).click();
    await tasksPage.locator('button[style="background-color: rgb(255, 77, 77);"]').click(); // Red color

    // 7. Устанавливаем приоритет
    await tasksPage.getByRole('combobox', { name: 'Приоритет' }).click();
    await tasksPage.getByRole('option', { name: 'High' }).click();

    // 8. Устанавливаем повтор
    await tasksPage.getByRole('combobox', { name: 'Повтор' }).click();
    await tasksPage.getByRole('option', { name: 'День' }).click();

    // 9. Добавляем заметку
    await tasksPage.getByRole('textbox', { name: 'Заметка' }).fill('Это новая заметка');

    // 10. Добавляем подзадачи
    await tasksPage.getByRole('textbox', { name: 'add subtask' }).fill('Подзадача 1');
    await tasksPage.getByRole('textbox', { name: 'add subtask' }).press('Enter');
    await tasksPage.getByRole('textbox', { name: 'add subtask' }).fill('Подзадача 2');
    await tasksPage.getByRole('textbox', { name: 'add subtask' }).press('Enter');

    // Закрываем модальное окно редактирования
    await tasksPage.getByRole('button', { name: 'Close' }).click();

    // --- ПРОВЕРКА ИЗМЕНЕНИЙ ---
    // Открываем задачу снова, чтобы проверить, что все данные сохранились
    await tasksPage.getByRole('button', { name: editedTaskName }).click();

    // 1. Проверяем название
    await expect(tasksPage.getByRole('textbox', { name: 'Название задачи' })).toHaveValue(editedTaskName);

    // 2. Проверяем дату начала
    await expect(tasksPage.getByText('01.01.2026 10:30')).toBeVisible();

    // 3. Проверяем дату окончания
    await expect(tasksPage.getByText('02.02.2027 11:45')).toBeVisible();

    // 4. Проверяем "Фоновая задача"
    await expect(tasksPage.getByRole('button', { name: 'Фоновая задача' }).getByRole('checkbox')).toBeChecked();

    // 5. Проверяем "Награда"
    await expect(tasksPage.getByRole('button', { name: 'Награда' }).getByRole('checkbox')).toBeChecked();

    // 6. Проверяем цвет (проверяем, что у кнопки нужный стиль)
    await expect(tasksPage.locator('button[aria-label="Цвет на календаре"] > div > div')).toHaveAttribute('style', 'background-color: rgb(255, 77, 77);');

    // 7. Проверяем приоритет
    await expect(tasksPage.getByRole('combobox', { name: 'Приоритет' })).toHaveValue('high');

    // 8. Проверяем повтор
    await expect(tasksPage.getByRole('combobox', { name: 'Повтор' })).toHaveValue('daily');

    // 9. Проверяем заметку
    await expect(tasksPage.getByRole('textbox', { name: 'Заметка' })).toHaveValue('Это новая заметка');

    // 10. Проверяем подзадачи
    await expect(tasksPage.getByText('Подзадача 1')).toBeVisible();
    await expect(tasksPage.getByText('Подзадача 2')).toBeVisible();
  });

  test('Удаление задачи', async ({ tasksPage }) => {
    const taskToDelete = `Задача для удаления ${Date.now()}`;
    // Создание задачи для удаления
    await tasksPage.getByRole('button', { name: 'Задачи', exact: true }).click();
    await tasksPage.getByRole('textbox', { name: 'Добавить задачу' }).fill(taskToDelete);
    await tasksPage.getByRole('button', { name: 'add task' }).click();
    await expect(tasksPage.getByRole('button', { name: taskToDelete })).toBeVisible();
    
    const taskItem = tasksPage.getByRole('button', { name: taskToDelete });

    // Удаление задачи
    await taskItem.locator('button[aria-label="delete"]').click();
    
    // Проверка успешного удаления
    await expect(tasksPage.getByRole('button', { name: taskToDelete })).not.toBeVisible();
  });

});
