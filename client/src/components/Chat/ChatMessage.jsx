import { useState } from 'react';
import PropTypes from 'prop-types';
import { Card, TextField, CardHeader, CardContent, CardActions, CircularProgress, Alert } from '@mui/material';
import Box from '@mui/material/Box';
import { Avatar, IconButton, Typography, Icon, Collapse, Button } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { red } from '@mui/material/colors';
import { styled } from '@mui/material/styles';
import FileRenderer from '../FileRenderer';
import useWebSocket from './hooks/useWebSocket';

const ExpandMore = styled((props) => {
  const { ...other } = props;
  return <IconButton {...other} />;
})(({ theme, expand }) => ({
  transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
  marginLeft: 'auto',
  transition: theme.transitions.create('transform', {
    duration: theme.transitions.duration.shortest,
  }),
}));

function ChatMessage({ message, message_time }) {
  const [expanded, setExpanded] = useState(false);
  const { user, text, files, params } = message;
  const { user_name, avatar_src } = user;
  const avatar_path = '/avatars/';
  const avatar_filename = `${avatar_path}${avatar_src}`;
  const [editedParams, setEditedParams] = useState(params);
  const [inputError, setInputError] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { sendEditedRecord } = useWebSocket();
  const [isUpdateSuccess, setIsUpdateSuccess] = useState(false);

  function handleExpandClick() {
    setExpanded(!expanded);
  }

  function handleParamChange(key, value) {
    setEditedParams((prevParams) => ({
      ...prevParams,
      [key]: value,
    }));
  }

  async function handleSubmit() {
    setInputError(false);
    setIsSending(true);

    try {
      await sendEditedRecord(editedParams);
      setIsUpdateSuccess(true);
    } catch (record_edit_error) {
      setInputError(record_edit_error.message || 'An unexpected error occurred');
    } finally {
      setIsSending(false);
    }
  }

  return (
    <Card
      sx={{
        width: '90%',
        mb: 0.5,
        border: inputError ? `2px solid ${red[500]}` : 'none',
        boxShadow: 2,
      }}
    >
      <CardHeader
        avatar={
          <Avatar sx={{ bgcolor: red[500] }} aria-label="avatar">
            {avatar_src ? (
              <img
                src={avatar_filename}
                alt="avatar"
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
              />
            ) : (
              user_name.charAt(0).toUpperCase()
            )}
          </Avatar>
        }
        action={
          <IconButton aria-label="settings">
            <Icon>more_vert</Icon>
          </IconButton>
        }
        title={user_name}
        subheader={message_time}
      />
      {files && (
        <Box sx={{ mb: 1 }}>
          <FileRenderer url={files} />
        </Box>
      )}
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          {text}
        </Typography>
      </CardContent>
      <CardActions disableSpacing>
        {params && (
          <ExpandMore
            expand={expanded ? 'true' : undefined}
            onClick={handleExpandClick}
            aria-expanded={expanded}
            aria-label="show more"
          >
            <ExpandMoreIcon />
          </ExpandMore>
        )}
      </CardActions>
      {params && (
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <CardContent>
            {Object.keys(params).map((key) => (
              (key !== 'id' && key !== 'date' && key !== 'files' && key !== 'time'
              && key !== 'table_name') && (
                <div key={key} style={{ marginBottom: '1rem' }}>
                  <TextField
                    id={key + "_message_id"}
                    label={key}
                    multiline
                    maxRows={15}
                    fullWidth
                    value={editedParams[key] || ''}
                    onChange={(e) => handleParamChange(key, e.target.value)}
                  />
                </div>
              )
            ))}
            {isSending ? <CircularProgress size={24} /> :
              <Button onClick={handleSubmit} disabled={isSending}>Отправить</Button>}
            {inputError && <p style={{ color: 'red' }}>{inputError}</p>}
            {isUpdateSuccess &&
              <Alert icon={<CheckIcon fontSize="inherit" />} severity="success">
                Запись обновлена
              </Alert>}
          </CardContent>
        </Collapse>
      )}
    </Card>
  );
}

ChatMessage.propTypes = {
  message_time: PropTypes.string.isRequired,
  message: PropTypes.shape({
    message_id: PropTypes.string,
    user: PropTypes.shape({
      user_name: PropTypes.string.isRequired,
      avatar_src: PropTypes.string,
    }).isRequired,
    files: PropTypes.string,
    text: PropTypes.string.isRequired,
    params: PropTypes.object,
  }).isRequired,
  error: PropTypes.shape({
    text: PropTypes.string,
    code: PropTypes.string,
  }),
};

export default ChatMessage;
