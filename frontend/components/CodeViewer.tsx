"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { Check, Copy, Download } from "lucide-react";

// Monaco must be loaded client-side only (uses browser APIs)
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => <EditorSkeleton />,
});

function EditorSkeleton() {
  return (
    <div className="w-full h-full bg-zinc-950 animate-pulse flex flex-col gap-2 p-4">
      {[80, 60, 90, 50, 70, 40, 85, 65].map((w, i) => (
        <div
          key={i}
          className="h-3.5 rounded bg-zinc-800"
          style={{ width: `${w}%` }}
        />
      ))}
    </div>
  );
}

interface Props {
  code: string;
  language?: "typescript" | "json";
  filename?: string;
}

export default function CodeViewer({
  code,
  language = "typescript",
  filename = "GeneratedPage.tsx",
}: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${filename}`);
  }, [code, filename]);

  return (
    <div className="relative flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900 border-b border-zinc-800">
        <span className="text-xs text-zinc-500 font-mono">{filename}</span>
        <div className="flex gap-1">
          <button
            onClick={handleCopy}
            title="Copy code"
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            {copied ? (
              <Check size={14} className="text-green-400" />
            ) : (
              <Copy size={14} />
            )}
          </button>
          <button
            onClick={handleDownload}
            title="Download file"
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <Download size={14} />
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-0">
        <MonacoEditor
          height="100%"
          language={language}
          value={code || "// Output will appear here as it streams in…"}
          theme="vs-dark"
          options={{
            readOnly: true,
            minimap: { enabled: false },
            fontSize: 13,
            lineHeight: 20,
            wordWrap: "on",
            scrollBeyondLastLine: false,
            renderLineHighlight: "none",
            folding: false,
            lineNumbers: "on",
            padding: { top: 12, bottom: 12 },
          }}
        />
      </div>
    </div>
  );
}
