"use client";

import { useCallback, useEffect, useState } from "react";
import {
  LexicalComposer,
  InitialConfigType,
} from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { TRANSFORMERS } from "@lexical/markdown";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { LinkNode, AutoLinkNode } from "@lexical/link";
import { CodeNode } from "@lexical/code";
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  EditorState,
  $getRoot,
  $createParagraphNode,
  $createTextNode,
} from "lexical";
import {
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
} from "@lexical/list";
import { $setBlocksType } from "@lexical/selection";
import { $createHeadingNode } from "@lexical/rich-text";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Heading2,
} from "lucide-react";

const theme = {
  paragraph: "mb-2",
  heading: {
    h1: "text-2xl font-bold mb-3",
    h2: "text-xl font-semibold mb-2",
    h3: "text-lg font-medium mb-2",
  },
  list: {
    ul: "list-disc list-inside mb-2 space-y-1",
    ol: "list-decimal list-inside mb-2 space-y-1",
    listitem: "ml-2",
  },
  quote: "border-l-4 border-primary/30 pl-4 italic text-muted-foreground my-2",
  text: {
    bold: "font-bold",
    italic: "italic",
    underline: "underline",
    strikethrough: "line-through",
    code: "bg-muted px-1.5 py-0.5 rounded font-mono text-sm",
  },
  link: "text-primary underline hover:no-underline",
  code: "bg-muted p-3 rounded-lg font-mono text-sm overflow-x-auto",
};

function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat("bold"));
      setIsItalic(selection.hasFormat("italic"));
      setIsUnderline(selection.hasFormat("underline"));
    }
  }, []);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateToolbar();
      });
    });
  }, [editor, updateToolbar]);

  const formatBold = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
  };

  const formatItalic = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
  };

  const formatUnderline = () => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
  };

  const formatBulletList = () => {
    editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
  };

  const formatNumberedList = () => {
    editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
  };

  const formatHeading = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createHeadingNode("h2"));
      }
    });
  };

  const buttonClass = (active: boolean) =>
    `p-1.5 rounded hover:bg-accent transition-colors ${
      active ? "bg-accent text-primary" : "text-muted-foreground"
    }`;

  return (
    <div className="flex items-center gap-1 p-2 border-b bg-secondary/30">
      <button
        type="button"
        onClick={formatBold}
        className={buttonClass(isBold)}
        title="Fett (Strg+B)"
      >
        <Bold className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={formatItalic}
        className={buttonClass(isItalic)}
        title="Kursiv (Strg+I)"
      >
        <Italic className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={formatUnderline}
        className={buttonClass(isUnderline)}
        title="Unterstrichen (Strg+U)"
      >
        <Underline className="w-4 h-4" />
      </button>
      <div className="w-px h-5 bg-border mx-1" />
      <button
        type="button"
        onClick={formatHeading}
        className={buttonClass(false)}
        title="Überschrift"
      >
        <Heading2 className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={formatBulletList}
        className={buttonClass(false)}
        title="Aufzählung"
      >
        <List className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={formatNumberedList}
        className={buttonClass(false)}
        title="Nummerierte Liste"
      >
        <ListOrdered className="w-4 h-4" />
      </button>
    </div>
  );
}

// Plugin to initialize with content
function InitialContentPlugin({ content }: { content?: string }) {
  const [editor] = useLexicalComposerContext();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (content && !initialized) {
      editor.update(() => {
        const root = $getRoot();
        root.clear();
        const paragraph = $createParagraphNode();
        paragraph.append($createTextNode(content));
        root.append(paragraph);
      });
      setInitialized(true);
    }
  }, [editor, content, initialized]);

  return null;
}

interface RichTextEditorProps {
  value?: string;
  onChange?: (html: string, text: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Schreibe etwas...",
  className = "",
}: RichTextEditorProps) {
  const initialConfig: InitialConfigType = {
    namespace: "NoteEditor",
    theme,
    onError: (error) => {
      console.error("Lexical error:", error);
    },
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      LinkNode,
      AutoLinkNode,
      CodeNode,
    ],
  };

  const handleChange = (editorState: EditorState) => {
    editorState.read(() => {
      const root = $getRoot();
      const textContent = root.getTextContent();

      // For now, we'll store plain text but render with formatting
      // A full implementation would serialize to HTML or JSON
      onChange?.(textContent, textContent);
    });
  };

  return (
    <div className={`border rounded-lg overflow-hidden bg-background ${className}`}>
      <LexicalComposer initialConfig={initialConfig}>
        <ToolbarPlugin />
        <div className="relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable className="min-h-[120px] max-h-[300px] overflow-y-auto p-3 outline-none text-sm" />
            }
            placeholder={
              <div className="absolute top-3 left-3 text-muted-foreground text-sm pointer-events-none">
                {placeholder}
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>
        <HistoryPlugin />
        <ListPlugin />
        <LinkPlugin />
        <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        <OnChangePlugin onChange={handleChange} />
        <InitialContentPlugin content={value} />
      </LexicalComposer>
    </div>
  );
}

// Simpler read-only display for notes
export function RichTextDisplay({ content }: { content: string }) {
  if (!content) return null;

  // For now just display as formatted text
  // Could be enhanced to parse and render rich content
  return (
    <div className="text-sm text-muted-foreground whitespace-pre-wrap">
      {content}
    </div>
  );
}
