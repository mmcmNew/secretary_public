import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button, CircularProgress } from '@mui/material';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import axios from 'axios';
import MDNotionEditor from './JournalEditor/MDNotionEditor';

export default function FileRenderer({ url }) {
  const extension = url.split('.').pop().toLowerCase();
  const [content, setContent] = useState(null);
  const [blobUrl, setBlobUrl] = useState(null);

  useEffect(() => {
    let isMounted = true;
    if (['md', 'txt'].includes(extension)) {
      axios.get(url, { responseType: 'text' })
        .then(r => { if (isMounted) setContent(r.data); })
        .catch(() => { if (isMounted) setContent(''); });
    } else {
      axios.get(url, { responseType: 'blob' })
        .then(r => { if (isMounted) setBlobUrl(URL.createObjectURL(r.data)); })
        .catch(() => { if (isMounted) setBlobUrl(''); });
    }
    return () => {
      isMounted = false;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [url, extension]);

  if (['md', 'txt'].includes(extension)) {
    if (content === null) return <CircularProgress size={20} />;
    return <MDNotionEditor readOnly initialMarkdown={content} />;
  }


  if (/(png|jpe?g|gif|webp)$/i.test(extension)) {
    if (!blobUrl) return <CircularProgress size={20} />;
    const markdown = `![file](${blobUrl})`;
    return <MDNotionEditor readOnly initialMarkdown={markdown} />;
  }

  if (/(mp4|webm|ogg|mov|m4v|avi|mkv)$/i.test(extension)) {
    if (!blobUrl) return <CircularProgress size={20} />;
    const markdown = `<video src="${blobUrl}"></video>`;
    return <MDNotionEditor readOnly initialMarkdown={markdown} />;
  }

  if (/(mp3|wav|ogg|m4a|flac|aac)$/i.test(extension)) {
    if (!blobUrl) return <CircularProgress size={20} />;
    const markdown = `<audio src="${blobUrl}"></audio>`;
    return <MDNotionEditor readOnly initialMarkdown={markdown} />;
  }

  return (
    blobUrl
      ? <Button href={blobUrl} target="_blank" startIcon={<AttachFileIcon />}>Открыть файл</Button>
      : <CircularProgress size={20} />
  );
}

FileRenderer.propTypes = {
  url: PropTypes.string.isRequired,
};
