import "@blocknote/core/fonts/inter.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import PropTypes from 'prop-types';
import { options } from "@fullcalendar/core/preact.js";

const MarkdownEditor = forwardRef(({ initialMarkdown = '', onChange }, ref) => {
  const editor = useCreateBlockNote(
    {trailingBlock: false}
  );
  const isInitialLoad = useRef(true);

  useEffect(() => {
    if (!editor) return;
    const load = async () => {
      const markdown = typeof initialMarkdown === 'string' ? initialMarkdown.trim() : '';
      const blocks = await editor.tryParseMarkdownToBlocks(markdown);
      editor.replaceBlocks(editor.document, blocks);
      isInitialLoad.current = false;
    };
    load();
  }, [initialMarkdown, editor]);
  

  editor.onEditorContentChange(() => {
    if (isInitialLoad.current) return;
    if (onChange) onChange();
  });

  useImperativeHandle(ref, () => ({
    async getMarkdown() {
      const md = await editor.blocksToMarkdownLossy(editor.document);
      return md.trim();
    },
    setMarkdown: async (md) => {
      const blocks = await editor.tryParseMarkdownToBlocks(md);
      editor.replaceBlocks(editor.document, blocks);
    }
  }));

  return (
    <BlockNoteView editor={editor} style={{ padding: 2 }} />
  );
});

MarkdownEditor.displayName = 'MarkdownEditor';
MarkdownEditor.propTypes = {
  initialMarkdown: PropTypes.string,
  onChange: PropTypes.func,
};

export default MarkdownEditor;
