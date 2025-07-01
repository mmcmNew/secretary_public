import "@blocknote/core/fonts/inter.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { forwardRef, useEffect, useImperativeHandle } from "react";
import PropTypes from 'prop-types';

const MarkdownEditor = forwardRef(({ initialMarkdown = '', onChange }, ref) => {
  const editor = useCreateBlockNote();

  useEffect(() => {
    const load = async () => {
      const blocks = await editor.tryParseMarkdownToBlocks(initialMarkdown);
      editor.replaceBlocks(editor.document, blocks);
    };
    load();
  }, [initialMarkdown, editor]);

  editor.onEditorContentChange(() => {
    if (onChange) onChange();
  });

  useImperativeHandle(ref, () => ({
    async getMarkdown() {
      return await editor.blocksToMarkdownLossy(editor.document);
    },
    setMarkdown: async (md) => {
      const blocks = await editor.tryParseMarkdownToBlocks(md);
      editor.removeBlocks(editor.document);
      editor.insertBlocks(blocks, editor.document[0]?.id);
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
