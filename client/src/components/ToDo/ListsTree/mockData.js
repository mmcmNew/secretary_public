// Моковые данные для тестирования сортировки и перетаскивания
export const mockTreeData = [
  // Стандартные списки
  [
    { id: 'my_day', parent: 0, droppable: false, text: 'Мой день', data: { type: 'standard', unfinished_tasks_count: 3 } },
    { id: 'tasks', parent: 0, droppable: false, text: 'Задачи', data: { type: 'standard', unfinished_tasks_count: 5 } },
    { id: 'important', parent: 0, droppable: false, text: 'Важные', data: { type: 'standard', unfinished_tasks_count: 2 } },
  ],
  
  // Проекты с вложенными элементами
  [
    { id: 'project_1', parent: 0, droppable: true, text: 'Проект Альфа', data: { type: 'project', unfinished_tasks_count: 5 } },
    { id: 'project_2', parent: 0, droppable: true, text: 'Проект Бета', data: { type: 'project', unfinished_tasks_count: 3 } },
    
    // Элементы в проекте 1
    { id: '1', parent: 'project_1', droppable: false, text: 'Список в проекте 1', data: { type: 'list', unfinished_tasks_count: 2 } },
    { id: 'group_1', parent: 'project_1', droppable: true, text: 'Группа в проекте 1', data: { type: 'group', unfinished_tasks_count: 3 } },
    
    // Элементы в группе 1
    { id: '2', parent: 'group_1', droppable: false, text: 'Список в группе 1', data: { type: 'list', unfinished_tasks_count: 1 } },
    { id: '3', parent: 'group_1', droppable: false, text: 'Список 2 в группе 1', data: { type: 'list', unfinished_tasks_count: 2 } },
    
    // Элементы в проекте 2
    { id: '4', parent: 'project_2', droppable: false, text: 'Список в проекте 2', data: { type: 'list', unfinished_tasks_count: 3 } },
  ],
  
  // Отдельные списки и группы
  [
    { id: '5', parent: 0, droppable: false, text: 'Личные дела', data: { type: 'list', unfinished_tasks_count: 4 } },
    { id: '6', parent: 0, droppable: false, text: 'Покупки', data: { type: 'list', unfinished_tasks_count: 0 } },
    { id: '7', parent: 0, droppable: false, text: 'Работа', data: { type: 'list', unfinished_tasks_count: 7 } },
    
    { id: 'group_2', parent: 0, droppable: true, text: 'Домашние дела', data: { type: 'group', unfinished_tasks_count: 2 } },
    { id: 'group_3', parent: 0, droppable: true, text: 'Рабочие задачи', data: { type: 'group', unfinished_tasks_count: 1 } },
    
    // Элементы в группе 2
    { id: '8', parent: 'group_2', droppable: false, text: 'Уборка', data: { type: 'list', unfinished_tasks_count: 1 } },
    { id: '9', parent: 'group_2', droppable: false, text: 'Готовка', data: { type: 'list', unfinished_tasks_count: 1 } },
    
    // Элементы в группе 3
    { id: '10', parent: 'group_3', droppable: false, text: 'Встречи', data: { type: 'list', unfinished_tasks_count: 1 } },
  ]
];

// Утилиты для работы с деревом
export const treeUtils = {
  // Найти узел по ID
  findNode: (tree, nodeId) => {
    for (const section of tree) {
      const node = section.find(n => n.id === nodeId);
      if (node) return node;
    }
    return null;
  },

  // Найти секцию содержащую узел
  findSectionIndex: (tree, nodeId) => {
    for (let i = 0; i < tree.length; i++) {
      if (tree[i].some(n => n.id === nodeId)) return i;
    }
    return -1;
  },

  // Получить детей узла
  getChildren: (tree, parentId) => {
    const children = [];
    for (const section of tree) {
      children.push(...section.filter(n => n.parent === parentId));
    }
    return children;
  },

  // Переместить узел в новую позицию
  moveNode: (tree, sourceId, targetId, action = 'move') => {
    const newTree = tree.map(section => [...section]);
    const sourceNode = treeUtils.findNode(newTree, sourceId);
    const sourceSectionIndex = treeUtils.findSectionIndex(newTree, sourceId);
    
    if (!sourceNode || sourceSectionIndex === -1) return tree;

    if (action === 'move') {
      // Удаляем из исходной позиции
      newTree[sourceSectionIndex] = newTree[sourceSectionIndex].filter(n => n.id !== sourceId);
      
      // Добавляем в новую позицию
      if (targetId === 0) {
        // Перемещение на корневой уровень - определяем секцию по типу элемента
        let targetSectionIndex = 2; // По умолчанию в секцию списков
        if (sourceNode.data?.type === 'project') {
          targetSectionIndex = 1; // Проекты во вторую секцию
        }
        newTree[targetSectionIndex].push({ ...sourceNode, parent: 0 });
      } else {
        // Перемещение в контейнер
        const targetSectionIndex = treeUtils.findSectionIndex(newTree, targetId);
        if (targetSectionIndex !== -1) {
          newTree[targetSectionIndex].push({ ...sourceNode, parent: targetId });
        }
      }
    } else if (action === 'link') {
      // При связывании узел остается в исходном месте, но добавляется копия
      if (targetId !== 0) {
        const targetSectionIndex = treeUtils.findSectionIndex(newTree, targetId);
        if (targetSectionIndex !== -1) {
          const linkedNode = { 
            ...sourceNode, 
            id: `${sourceId}_linked_${Date.now()}`, 
            parent: targetId,
            text: `${sourceNode.text} (связанный)`
          };
          newTree[targetSectionIndex].push(linkedNode);
        }
      }
    }

    return newTree;
  },

  // Сортировать элементы в секции
  sortInSection: (tree, sectionIndex, sourceId, newPosition) => {
    const newTree = tree.map(section => [...section]);
    const section = newTree[sectionIndex];
    const sourceNode = section.find(n => n.id === sourceId);
    const sourceIndex = section.findIndex(n => n.id === sourceId);
    
    if (sourceIndex === -1 || !sourceNode) return tree;

    // Получаем элементы того же уровня (тот же parent)
    const sameParentElements = section.filter(n => n.parent === sourceNode.parent);
    const otherElements = section.filter(n => n.parent !== sourceNode.parent);
    
    // Находим индекс в группе одноуровневых элементов
    const sourceIndexInGroup = sameParentElements.findIndex(n => n.id === sourceId);
    
    if (sourceIndexInGroup === -1) return tree;
    
    // Перемещаем в группе
    const [movedElement] = sameParentElements.splice(sourceIndexInGroup, 1);
    const clampedPosition = Math.min(newPosition, sameParentElements.length);
    sameParentElements.splice(clampedPosition, 0, movedElement);
    
    // Собираем обратно секцию
    newTree[sectionIndex] = [...otherElements, ...sameParentElements].sort((a, b) => {
      // Сортируем: сначала корневые элементы, потом вложенные
      if (a.parent === 0 && b.parent !== 0) return -1;
      if (a.parent !== 0 && b.parent === 0) return 1;
      return 0;
    });

    return newTree;
  }
};