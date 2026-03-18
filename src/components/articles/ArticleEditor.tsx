'use client';

import React, { useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Markdown } from 'tiptap-markdown';

interface ArticleEditorProps {
  initialMarkdown?: string;
  onChange: (_markdown: string) => void;
  placeholder?: string;
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  title: string;
  children: React.ReactNode;
}

function ToolbarButton({
  onClick,
  isActive,
  title,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      type='button'
      onClick={onClick}
      title={title}
      className={`px-2 py-1 rounded text-sm font-medium transition-colors ${
        isActive
          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
      }`}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return (
    <span className='w-px h-5 bg-gray-200 dark:bg-slate-600 mx-1 self-center' />
  );
}

export default function ArticleEditor({
  initialMarkdown = '',
  onChange,
}: ArticleEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Markdown.configure({
        html: false,
        transformPastedText: true,
      }),
      Image.configure({ inline: false }),
    ],
    content: initialMarkdown,
    onUpdate({ editor: e }) {
      const markdownStorage = (e.storage as any).markdown;
      const md: string =
        typeof markdownStorage?.getMarkdown === 'function'
          ? markdownStorage.getMarkdown()
          : e.getText();
      onChange(md);
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-slate dark:prose-invert max-w-none min-h-[400px] p-4 focus:outline-none',
      },
    },
  });

  const handleImageUpload = useCallback(
    async (file: File) => {
      if (!editor) return;

      try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/upload/image', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) return;

        const { key } = await res.json();
        const publicUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${key}`;

        editor.chain().focus().setImage({ src: publicUrl }).run();
      } catch (err) {
        console.error('[ArticleEditor] Image upload failed:', err);
      }
    },
    [editor]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleImageUpload(file);
      // Reset so the same file can be selected again
      e.target.value = '';
    },
    [handleImageUpload]
  );

  if (!editor) return null;

  return (
    <div className='border border-gray-200 dark:border-slate-600 rounded-xl overflow-hidden bg-white dark:bg-slate-900'>
      {/* Toolbar */}
      <div className='flex flex-wrap items-center gap-0.5 p-2 border-b border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-800'>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title='Bold'
        >
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title='Italic'
        >
          <em>I</em>
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          isActive={editor.isActive('heading', { level: 1 })}
          title='Heading 1'
        >
          H1
        </ToolbarButton>
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          isActive={editor.isActive('heading', { level: 2 })}
          title='Heading 2'
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          isActive={editor.isActive('heading', { level: 3 })}
          title='Heading 3'
        >
          H3
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title='Bullet List'
        >
          • —
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title='Ordered List'
        >
          1. —
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive('code')}
          title='Inline Code'
        >
          {'</>'}
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title='Blockquote'
        >
          &quot;
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          isActive={false}
          title='Horizontal Rule'
        >
          —
        </ToolbarButton>

        <ToolbarDivider />

        <ToolbarButton
          onClick={() => fileInputRef.current?.click()}
          isActive={false}
          title='Upload Image'
        >
          🖼
        </ToolbarButton>

        <input
          ref={fileInputRef}
          type='file'
          accept='image/*'
          className='hidden'
          onChange={handleFileInputChange}
        />
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />
    </div>
  );
}
