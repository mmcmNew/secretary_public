import { PropTypes } from 'prop-types';
import { memo, useState } from "react";
import { Paper, InputBase, IconButton } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

const NewTaskInput = memo(function NewTaskInput({ onAdd, disabled }) {
  const [value, setValue] = useState("");

  const handleAdd = () => {
    if (value.trim() === "") return;
    onAdd(value);
    setValue("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <Paper component="form" sx={{ display: "flex", alignItems: "center", mt: 1, mx: 1 }}>
      <IconButton aria-label="add task" onClick={handleAdd} disabled={disabled}>
        <AddIcon />
      </IconButton>
      <InputBase
        sx={{ flex: 1 }}
        placeholder="Добавить задачу"
        value={value}
        onKeyDown={handleKeyDown}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
      />
    </Paper>
  );
});

export default NewTaskInput;

NewTaskInput.propTypes = {
  onAdd: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};