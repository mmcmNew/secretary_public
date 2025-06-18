import "@blocknote/core/fonts/inter.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useTheme } from '@mui/material/styles';
import { forwardRef, useImperativeHandle } from "react";
import PropTypes from 'prop-types';

const NotionEditor = forwardRef((props, ref) => {
  const theme = useTheme();

  // console.log('NotionEditor', props);

  const editor = useCreateBlockNote({
    initialContent: Array.isArray(props.initialBlocks) && props.initialBlocks.length > 0
      ? props.initialBlocks
      : [{
          id: Math.random().toString(36).slice(2),
          type: 'paragraph',
          content: [],
          children: [],
        }]
  });

  // Добавляем обработчик изменений
  editor.onEditorContentChange(() => {
    if (props.onChange) {
      props.onChange();
    }
  });

  useImperativeHandle(ref, () => ({
    getBlocks() {
      return editor.document;
    },
    setBlocks(newBlocks) {
      editor.removeBlocks(editor.document);
      editor.insertBlocks(newBlocks, editor.document[0]?.id || undefined);
    },
    async blocksToMarkdownLossy(blocks) {
      return await editor.blocksToMarkdownLossy(blocks);
    },
    async blocksToHTMLLossy(blocks) {
      return await editor.blocksToHTMLLossy(blocks);
    }
  }));

  return (
    <BlockNoteView
      style={{ padding: 2 }}
      editor={editor}
      theme={theme.palette.mode}
    />
  );
});

NotionEditor.displayName = "NotionEditor";

export default NotionEditor;

NotionEditor.propTypes = {
  initialBlocks: PropTypes.arrayOf(PropTypes.object),
  onChange: PropTypes.func,
};
