import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  List,
  ListItem,
  Chip,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { apiDelete, apiGet, apiPost, apiPut } from '../../utils/api';

// Функция транслитерации
const transliterate = (text) => {
  const map = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
    'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
    'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts',
    'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
  };
  return text.toLowerCase().split('').map(char => map[char] || char).join('').replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
};

// Функция для обеспечения уникальности ID
const makeUniqueIds = (fields) => {
  const usedIds = new Set();
  return fields.map(field => {
    const baseId = transliterate(field.label || '');
    let uniqueId = baseId;
    let counter = 1;
    
    while (usedIds.has(uniqueId)) {
      uniqueId = `${baseId}_${counter}`;
      counter++;
    }
    
    usedIds.add(uniqueId);
    return uniqueId;
  });
};

const FIELD_TYPES = [
  { value: 'text', label: 'Текст' },
  { value: 'textarea', label: 'Многострочный текст' },
  { value: 'number', label: 'Число' },
  { value: 'date', label: 'Дата' },
  { value: 'select', label: 'Выбор из списка' },
  { value: 'file', label: 'Файл' },
  { value: 'tags', label: 'Теги' },
  { value: 'checkbox', label: 'Флажок' }
];

export default function JournalManager() {
  const queryClient = useQueryClient();
  const { data: schemas = [], isLoading } = useQuery(['schemas'], async () => {
    // const { data } = await apiGet('/api/journals/schemas');
    // return data;
  });
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSchema, setEditingSchema] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    fields: []
  });

  const deleteSchemaMutation = useMutation(
    // (id) => apiDelete(`/api/journals/schemas/${id}`),
    // { onSuccess: () => queryClient.invalidateQueries(['schemas']) }
  );

  const saveSchemaMutation = useMutation(
    async ({ id, data }) => {
      // if (id) {
      //   await apiPut(`/api/journals/schemas/${id}`, data);
      // } else {
      //   await apiPost('/api/journals/schemas', data);
      // }
    },
    { onSuccess: () => queryClient.invalidateQueries(['schemas']) }
  );

  const handleCreateSchema = () => {
    setEditingSchema(null);
    setFormData({
      name: '',
      display_name: '',
      fields: [{ name: 'content', type: 'textarea', label: 'Содержание', required: true }]
    });
    setDialogOpen(true);
  };

  const handleEditSchema = (schema) => {
    setEditingSchema(schema);
    setFormData({
      name: schema.name,
      display_name: schema.display_name,
      fields: schema.fields
    });
    setDialogOpen(true);
  };

  const handleDeleteSchema = async (schemaId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот журнал? Все записи будут удалены.')) {
      return;
    }
    try {
      await deleteSchemaMutation.mutateAsync(schemaId);
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка удаления журнала');
    }
  };

  const handleSaveSchema = async () => {
    // Проверяем, что все поля имеют названия
    const hasEmptyLabels = formData.fields.some(field => !field.label?.trim());
    if (hasEmptyLabels) {
      setError('Все поля должны иметь названия');
      return;
    }
    
    try {
      // Обновляем name для всех полей с проверкой уникальности
      const uniqueIds = makeUniqueIds(formData.fields);
      const updatedFormData = {
        ...formData,
        fields: formData.fields.map((field, index) => ({
          ...field,
          name: uniqueIds[index]
        }))
      };
      
      if (editingSchema) {
        await saveSchemaMutation.mutateAsync({ id: editingSchema.id, data: updatedFormData });
      } else {
        await saveSchemaMutation.mutateAsync({ id: null, data: updatedFormData });
      }
      setDialogOpen(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка сохранения журнала');
    }
  };

  const addField = () => {
    setFormData({
      ...formData,
      fields: [...formData.fields, { type: 'text', label: '', required: false }]
    });
  };

  const updateField = (index, field) => {
    const newFields = [...formData.fields];
    // Автогенерация name из label
    if (field.label) {
      field.name = transliterate(field.label);
    }
    newFields[index] = field;
    setFormData({ ...formData, fields: newFields });
  };

  const updateFieldOptions = (index, optionsString) => {
    const newFields = [...formData.fields];
    newFields[index] = {
      ...newFields[index],
      optionsString: optionsString,
      options: optionsString ? optionsString.split(',').map(s => s.trim()).filter(s => s) : []
    };
    setFormData({ ...formData, fields: newFields });
  };

  const removeField = (index) => {
    const newFields = formData.fields.filter((_, i) => i !== index);
    setFormData({ ...formData, fields: newFields });
  };

  if (isLoading) return <Typography>Загрузка...</Typography>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Мои журналы</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateSchema}
        >
          Создать журнал
        </Button>
      </Box>

      {(error || queryError) && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error || queryError?.message}
        </Alert>
      )}

      <List>
        {schemas.map((schema) => (
          <ListItem key={schema.id} sx={{ p: 0, mb: 2 }}>
            <Card sx={{ width: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="h6">
                      {schema.display_name}
                      {schema.is_default && (
                        <Chip label="Системный" size="small" sx={{ ml: 1 }} />
                      )}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Поля: {schema.fields.map(f => f.label).join(', ')}
                    </Typography>
                  </Box>
                  <Box>
                    {!schema.is_default && (
                      <>
                        <IconButton onClick={() => handleEditSchema(schema)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton onClick={() => handleDeleteSchema(schema.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </ListItem>
        ))}
      </List>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingSchema ? 'Редактировать журнал' : 'Создать журнал'}
          <IconButton
            onClick={() => setDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {!editingSchema && (
              <TextField
                label="Системное имя"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                helperText="Используется в URL, только латинские буквы и подчеркивания"
                required
              />
            )}
            <TextField
              label="Отображаемое название"
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              required
            />

            <Typography variant="h6" sx={{ mt: 2 }}>Поля журнала</Typography>
            
            {formData.fields.map((field, index) => (
              <Card key={index} variant="outlined" sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  <TextField
                    label="Название поля"
                    value={field.label}
                    onChange={(e) => updateField(index, { ...field, label: e.target.value })}
                    size="small"
                    sx={{ flex: 1 }}
                    required
                    error={!field.label}
                    helperText={field.label ? `ID: ${makeUniqueIds(formData.fields)[index]}` : 'Обязательное поле'}
                  />
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Тип</InputLabel>
                    <Select
                      value={field.type}
                      onChange={(e) => updateField(index, { ...field, type: e.target.value })}
                    >
                      {FIELD_TYPES.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          {type.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={field.required || false}
                        onChange={(e) => updateField(index, { ...field, required: e.target.checked })}
                      />
                    }
                    label="Обязательное"
                  />
                  {field.type === 'file' && (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={field.multiple || false}
                          onChange={(e) => updateField(index, { ...field, multiple: e.target.checked })}
                        />
                      }
                      label="Множественные"
                    />
                  )}
                  <IconButton onClick={() => removeField(index)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </Box>
                
                {field.type === 'select' && (
                  <TextField
                    label="Варианты (через запятую)"
                    value={field.optionsString || field.options?.join(', ') || ''}
                    onChange={(e) => updateFieldOptions(index, e.target.value)}
                    fullWidth
                    sx={{ mt: 1 }}
                    size="small"
                  />
                )}
              </Card>
            ))}

            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={addField}
            >
              Добавить поле
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Отмена</Button>
          <Button onClick={handleSaveSchema} variant="contained">
            {editingSchema ? 'Сохранить' : 'Создать'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}