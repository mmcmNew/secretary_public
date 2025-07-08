vi.mock('@mui/icons-material', () => {
  return new Proxy({}, {
    get: () => () => null // Возвращает пустой компонент для любой иконки
  });
});
