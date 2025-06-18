import { PropTypes } from 'prop-types';
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useEffect } from "react";


export default function MDNotionEditor({initialMarkdown}) {
  const editor = useCreateBlockNote();

  useEffect(() => {
    const loadMarkdown = async () => {
      const blocks = await editor.tryParseMarkdownToBlocks(initialMarkdown);
      editor.replaceBlocks(editor.document, blocks);
    };

    loadMarkdown();
  }, [editor, initialMarkdown]);

  return <BlockNoteView editor={editor} />;
}

MDNotionEditor.propTypes = {
  initialMarkdown: PropTypes.string,
};
