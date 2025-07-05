import types from "prop-types";
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Checkbox,
  ListItemText
} from '@mui/material';

const FiltersPanel = ({
  showFilters,
  filtersConfig,
  filters,
  dropdownValues,
  handleFilterChange,
  resetFilters,
  applyFilters,
  loadingFilteredRecords
}) => {
  if (!showFilters || !filtersConfig) return null;

  const isEmpty = Object.values(filters).every(
    (v) =>
      (Array.isArray(v) && v.length === 0) ||
      (!Array.isArray(v) && (v === '' || v === undefined || v === null))
  );

  return (
    <Box sx={{ marginBottom: 2, padding: 2, border: '1px solid #ccc', borderRadius: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        Фильтры
      </Typography>

      {/* Date range filters */}
      {filtersConfig.date?.map((field) => (
        <Box
          key={field}
          sx={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 2 }}
        >
          <TextField
            label={`${field} от`}
            type="date"
            InputLabelProps={{ shrink: true }}
            value={filters[`${field}_from`] || ''}
            onChange={(e) => handleFilterChange(`${field}_from`, e.target.value)}
            disabled={loadingFilteredRecords}
          />
          <TextField
            label={`${field} до`}
            type="date"
            InputLabelProps={{ shrink: true }}
            value={filters[`${field}_to`] || ''}
            onChange={(e) => handleFilterChange(`${field}_to`, e.target.value)}
            disabled={loadingFilteredRecords}
          />
        </Box>
      ))}

      {/* Multiselect dropdown filters */}
      {filtersConfig.dropdown?.map((field) => (
        <FormControl
          key={field}
          sx={{ minWidth: 150, marginRight: 2, marginBottom: 2 }}
          disabled={loadingFilteredRecords}
        >
          <InputLabel>{field}</InputLabel>
          <Select
            multiple
            value={filters[field] || []}
            onChange={(e) => handleFilterChange(field, e.target.value)}
            renderValue={(selected) => selected.join(', ')}
            label={field}
          >
            {dropdownValues[field]?.map((option) => (
              <MenuItem key={option} value={option}>
                <Checkbox checked={(filters[field] || []).includes(option)} />
                <ListItemText primary={option} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      ))}

      {/* Text filters */}
      {filtersConfig.text?.map((field) => (
        <TextField
          key={field}
          label={field}
          variant="outlined"
          value={filters[field] || ''}
          onChange={(e) => handleFilterChange(field, e.target.value)}
          sx={{ marginRight: 2, marginBottom: 2 }}
          disabled={loadingFilteredRecords}
        />
      ))}

      {/* Range filters */}
      {filtersConfig.range?.map((field) => (
        <Box
          key={field}
          sx={{ display: 'flex', alignItems: 'center', gap: 1, marginBottom: 2 }}
        >
          <TextField
            label={`${field} от`}
            type="number"
            value={filters[`${field}_min`] || ''}
            onChange={(e) => handleFilterChange(`${field}_min`, e.target.value)}
            disabled={loadingFilteredRecords}
          />
          <TextField
            label={`${field} до`}
            type="number"
            value={filters[`${field}_max`] || ''}
            onChange={(e) => handleFilterChange(`${field}_max`, e.target.value)}
            disabled={loadingFilteredRecords}
          />
        </Box>
      ))}

      {/* Buttons */}
      <Box sx={{ display: 'flex', gap: 2, marginTop: 2 }}>
        <Button variant="outlined" onClick={resetFilters} disabled={loadingFilteredRecords || isEmpty}>
          Сбросить фильтры
        </Button>
        <Button variant="contained" onClick={applyFilters} disabled={loadingFilteredRecords || isEmpty}>
          Загрузить
        </Button>
      </Box>
    </Box>
  );
};

export default FiltersPanel;

FiltersPanel.propTypes = {
  showFilters: types.bool,
  filtersConfig: types.object,
  filters: types.object,
  handleFilterChange: types.func,
  resetFilters: types.func,
  applyFilters: types.func,
  loadingFilteredRecords: types.bool,
  dropdownValues: types.object
};
