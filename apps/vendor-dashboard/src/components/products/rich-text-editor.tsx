'use client';

import { Button, cn } from '@mitdrone/ui';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKitBundle from '@tiptap/starter-kit';
import { Bold, Heading2, Italic, List, ListOrdered, Redo2, Undo2 } from 'lucide-react';

/** TipTap editor. Output is HTML; the storefront sanitises it before rendering. */
export default function RichTextEditor({
  value,
  onChange,
  invalid,
  id,
}: {
  value: string;
  onChange: (html: string) => void;
  invalid?: boolean;
  id?: string;
}) {
  const editor = useEditor({
    extensions: [StarterKitBundle.configure({ heading: { levels: [2, 3] } })],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        id: id ?? 'description',
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-label': 'Product description',
        class:
          'prose-sm min-h-[200px] max-w-none px-3 py-2 outline-none [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:font-semibold [&_ol]:ml-5 [&_ol]:list-decimal [&_ul]:ml-5 [&_ul]:list-disc [&_p]:my-2',
      },
    },
    onUpdate: ({ editor: e }) => onChange(e.isEmpty ? '' : e.getHTML()),
  });
  if (!editor)
    return (
      <div className="bg-muted h-[260px] animate-pulse rounded-md border" aria-hidden="true" />
    );

  const tools = [
    {
      label: 'Bold',
      icon: Bold,
      active: editor.isActive('bold'),
      run: () => editor.chain().focus().toggleBold().run(),
    },
    {
      label: 'Italic',
      icon: Italic,
      active: editor.isActive('italic'),
      run: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      label: 'Heading',
      icon: Heading2,
      active: editor.isActive('heading', { level: 2 }),
      run: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      label: 'Bulleted list',
      icon: List,
      active: editor.isActive('bulletList'),
      run: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      label: 'Numbered list',
      icon: ListOrdered,
      active: editor.isActive('orderedList'),
      run: () => editor.chain().focus().toggleOrderedList().run(),
    },
    { label: 'Undo', icon: Undo2, active: false, run: () => editor.chain().focus().undo().run() },
    { label: 'Redo', icon: Redo2, active: false, run: () => editor.chain().focus().redo().run() },
  ];
  return (
    <div
      className={cn(
        'bg-background focus-within:ring-ring rounded-md border focus-within:ring-2',
        invalid ? 'border-destructive' : 'border-input',
      )}
    >
      <div role="toolbar" aria-label="Formatting" className="flex flex-wrap gap-1 border-b p-1">
        {tools.map(({ label, icon: Icon, active, run }) => (
          <Button
            key={label}
            type="button"
            variant={active ? 'secondary' : 'ghost'}
            size="icon"
            className="size-8"
            aria-label={label}
            aria-pressed={label === 'Undo' || label === 'Redo' ? undefined : active}
            onClick={run}
          >
            <Icon />
          </Button>
        ))}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
