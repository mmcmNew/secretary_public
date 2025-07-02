import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button, CircularProgress } from '@mui/material';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import MDNotionEditor from './JournalEditor/MDNotionEditor';

export default function FileRenderer({ url }) {
  const extension = url.split('.').pop().toLowerCase();
  const [content, setContent] = useState(null);

  useEffect(() => {
    if (['md', 'txt'].includes(extension)) {
      let isMounted = true;
      fetch(url)
        .then(r => r.text())
        .then(text => { if (isMounted) setContent(text); })
        .catch(() => { if (isMounted) setContent(''); });
      return () => { isMounted = false; };
    }
  }, [url, extension]);

  if (['md', 'txt'].includes(extension)) {
    if (content === null) return <CircularProgress size={20} />;
    return <MDNotionEditor readOnly initialMarkdown={content} />;
  }

  if (/(png|jpe?g|gif|webp)$/i.test(extension)) {
    const markdown = `![file](${url})`;
    return <MDNotionEditor readOnly initialMarkdown={markdown} />;
  }

  return (
    <Button href={url} target="_blank" startIcon={<AttachFileIcon />}>
      Открыть файл
    </Button>
  );
}

FileRenderer.propTypes = {
  url: PropTypes.string.isRequired,
};
