"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  code: string;
}

/**
 * Transpiles the generated TSX in-browser using @babel/standalone,
 * then injects it into a sandboxed iframe with CDN React + Tailwind.
 */
export default function LivePreview({ code }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [transpileError, setTranspileError] = useState<string | null>(null);
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (!code || !iframeRef.current) return;

    // Strip markdown fences if LLM leaked them
    const cleaned = code
      .replace(/^```(?:tsx?|jsx?)?\n?/m, "")
      .replace(/```\s*$/m, "")
      .trim();

    let cancelled = false;

    import("@babel/standalone")
      .then((Babel) => {
        if (cancelled) return;
        const result = Babel.transform(cleaned, {
          filename: "component.tsx",
          presets: [
            ["react", { runtime: "classic" }],
            ["typescript", { allExtensions: true, isTSX: true }],
          ],
        });

        const transpiled = (result.code ?? "")
          .replace(/<\/script/gi, "<\\/script");
        setTranspileError(null);

        if (iframeRef.current) {
          iframeRef.current.srcdoc = buildIframeHTML(transpiled);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setTranspileError((err as Error).message);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [code, key]);

  return (
    <div className="relative flex flex-col h-full bg-zinc-950">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900 border-b border-zinc-800">
        <span className="text-xs text-zinc-500">Live Preview</span>
        <button
          onClick={() => setKey((k) => k + 1)}
          title="Refresh preview"
          className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {transpileError ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6">
          <AlertTriangle size={28} className="text-amber-400" />
          <p className="text-sm font-medium text-zinc-300">Transpile error</p>
          <pre className="text-xs text-red-400 bg-zinc-900 rounded-lg p-3 w-full overflow-auto max-h-40 font-mono">
            {transpileError}
          </pre>
          <p className="text-xs text-zinc-600 text-center">
            The generated code may need minor fixes. Copy it and adjust imports.
          </p>
        </div>
      ) : (
        <iframe
          key={key}
          ref={iframeRef}
          className="flex-1 border-0 bg-white"
          sandbox="allow-scripts"
          title="Live component preview"
        />
      )}
    </div>
  );
}

function buildIframeHTML(transpiledJS: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://cdn.tailwindcss.com"></script>
  <style>body { margin: 0; font-family: sans-serif; }</style>
</head>
<body>
  <div id="root"></div>
  <script type="importmap">
    {
      "imports": {
        "react": "https://esm.sh/react@18?dev",
        "react-dom/client": "https://esm.sh/react-dom@18/client?dev"
      }
    }
  </script>
  <script type="module">
    import React from 'react';
    import { createRoot } from 'react-dom/client';
    try {
      const exports = {};
      ${transpiledJS}
      const Component = exports.default || (typeof GeneratedPage !== 'undefined' ? GeneratedPage : null);
      if (Component) {
        createRoot(document.getElementById('root')).render(React.createElement(Component));
      } else {
        document.getElementById('root').innerHTML = '<p style="padding:1rem;color:#666">No component exported.</p>';
      }
    } catch (err) {
      document.getElementById('root').innerHTML = '<pre style="padding:1rem;color:red;font-size:13px">' + err.message + '</pre>';
    }
  </script>
</body>
</html>`;
}
