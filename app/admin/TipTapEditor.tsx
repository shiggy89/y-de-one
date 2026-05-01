"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { useRef, useEffect } from "react";
import styles from "./TipTapEditor.module.css";

type Props = {
  content: string;
  onChange: (html: string) => void;
  adminFetch: (url: string, options?: RequestInit) => Promise<Response>;
  mode?: "diary" | "seo";
};

export default function TipTapEditor({ content, onChange, adminFetch, mode = "seo" }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false }),
      Link.configure({ openOnClick: false }),
    ],
    content,
    onUpdate: ({ editor }) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => onChange(editor.getHTML()), 300);
    },
    immediatelyRender: false,
  });

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  if (!editor) return null;

  const handleImageUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await adminFetch("/api/admin/upload-post-image", { method: "POST", body: formData });
    const data = await res.json();
    if (data.url) editor.chain().focus().setImage({ src: data.url }).run();
  };

  const triggerImageUpload = () => fileInputRef.current?.click();

  const setLink = () => {
    const url = window.prompt("URLを入力してください");
    if (!url) return;
    editor.chain().focus().setLink({ href: url }).run();
  };

  return (
    <div className={styles.editor}>
      <div className={styles.toolbar}>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run(); }} className={editor.isActive("bold") ? styles.active : ""}>B</button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleItalic().run(); }} className={editor.isActive("italic") ? styles.active : ""}>I</button>
        {mode === "seo" && (
          <>
            <button type="button" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 2 }).run(); }} className={editor.isActive("heading", { level: 2 }) ? styles.active : ""}>H2</button>
            <button type="button" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 3 }).run(); }} className={editor.isActive("heading", { level: 3 }) ? styles.active : ""}>H3</button>
            <button type="button" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBulletList().run(); }} className={editor.isActive("bulletList") ? styles.active : ""}>• リスト</button>
            <button type="button" onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleOrderedList().run(); }} className={editor.isActive("orderedList") ? styles.active : ""}>1. リスト</button>
            <button type="button" onMouseDown={(e) => { e.preventDefault(); setLink(); }}>リンク</button>
          </>
        )}
        <button type="button" onClick={triggerImageUpload}>📷 画像</button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImageUpload(file);
            e.target.value = "";
          }}
        />
      </div>
      <EditorContent editor={editor} className={styles.content} />
      {mode === "diary" && (
        <div className={styles.imageFloatBar}>
          <button type="button" className={styles.imageFloatBtn} onClick={triggerImageUpload}>📷 画像を挿入</button>
        </div>
      )}
    </div>
  );
}
