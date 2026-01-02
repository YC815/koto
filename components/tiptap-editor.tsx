'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import { BubbleMenu as BubbleMenuExtension } from '@tiptap/extension-bubble-menu';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';

interface TiptapEditorProps {
  value: string;
  onChange: (text: string) => void;
  onHighlightChange: (highlighted: string) => void;
  autoFocus?: boolean;
}

export function TiptapEditor({
  value,
  onChange,
  onHighlightChange,
  autoFocus = false,
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight.configure({ multicolor: false }),
      BubbleMenuExtension.configure({
        options: {
          // duration: 100, // This is a Tippy.js option, not supported in Floating UI
        },
      }),
    ],
    content: value,
    autofocus: autoFocus,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getText());
    },
  });

  const handleHighlight = () => {
    if (!editor) return;
    editor.chain().focus().toggleHighlight().run();
    extractHighlighted();
  };

  const extractHighlighted = () => {
    if (!editor) return;
    const json = editor.getJSON();
    let highlighted = '';

    function traverse(node: Record<string, unknown>) {
      if (node.marks && Array.isArray(node.marks)) {
        const hasHighlight = node.marks.some((m: Record<string, unknown>) => m.type === 'highlight');
        if (hasHighlight) {
          highlighted += (node.text as string) || '';
        }
      }
      if (node.content && Array.isArray(node.content)) {
        node.content.forEach(traverse);
      }
    }
    traverse(json);

    onHighlightChange(highlighted || editor.getText());
  };

  // 同步外部 value 更新
  useEffect(() => {
    if (editor && value !== editor.getText()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className="border rounded-md relative">
      <BubbleMenu editor={editor}>
        <Button
          size="sm"
          variant="default"
          onClick={handleHighlight}
          className="shadow-lg"
        >
          螢光筆標記
        </Button>
      </BubbleMenu>
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none p-3 min-h-20 focus:outline-none"
      />
    </div>
  );
}
