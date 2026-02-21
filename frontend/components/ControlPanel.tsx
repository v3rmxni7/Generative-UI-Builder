"use client";

import { useCallback, useRef, useState } from "react";
import toast from "react-hot-toast";
import { ImagePlus, Loader2, Square, Wand2, X } from "lucide-react";

import type {
  AgentStep,
  GenerationStatus,
  PlanResult,
  ReflectionResult,
} from "@/types/generation";
import AgentTimeline from "./AgentTimeline";

interface Props {
  status: GenerationStatus;
  agents: AgentStep[];
  plan: PlanResult | null;
  reflection: ReflectionResult | null;
  onGenerate: (file: File, instructions: string) => void;
  onCancel: () => void;
}

const MAX_FILE_SIZE_MB = 10;

export default function ControlPanel({
  status,
  agents,
  plan,
  reflection,
  onGenerate,
  onCancel,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [instructions, setInstructions] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isLoading = status === "running";

  const applyFile = useCallback((f: File) => {
    if (!f.type.startsWith("image/")) {
      toast.error("Only image files are supported.");
      return;
    }
    if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(`Image must be under ${MAX_FILE_SIZE_MB} MB.`);
      return;
    }
    setFile(f);
    setThumbnail(URL.createObjectURL(f));
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) applyFile(dropped);
    },
    [applyFile],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (selected) applyFile(selected);
    },
    [applyFile],
  );

  const handleGenerate = useCallback(() => {
    if (!file) {
      toast.error("Upload an image first.");
      return;
    }
    onGenerate(file, instructions);
  }, [file, instructions, onGenerate]);

  const clearFile = useCallback(() => {
    setFile(null);
    if (thumbnail) URL.revokeObjectURL(thumbnail);
    setThumbnail(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [thumbnail]);

  return (
    <div className="flex flex-col h-full gap-4 p-5 bg-zinc-900 overflow-y-auto">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-zinc-100 tracking-tight">
          Generative UI Builder
        </h1>
        <p className="text-[11px] text-zinc-500 mt-0.5">
          Agentic multi-step UI reconstruction
        </p>
      </div>

      {/* Drop zone */}
      <div>
        <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
          Screenshot
        </label>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => !thumbnail && inputRef.current?.click()}
          className={`mt-1.5 relative rounded-lg border-2 border-dashed transition-colors cursor-pointer
            ${dragging ? "border-blue-500 bg-blue-500/10" : "border-zinc-700 hover:border-zinc-500"}
            ${thumbnail ? "cursor-default" : ""}`}
        >
          {thumbnail ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumbnail}
                alt="Uploaded UI"
                className="w-full rounded-md object-contain max-h-36"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearFile();
                }}
                className="absolute top-1.5 right-1.5 p-1 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300"
              >
                <X size={12} />
              </button>
              <p className="text-center text-[10px] text-zinc-500 py-1 truncate px-2">
                {file?.name}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 gap-1.5">
              <ImagePlus size={24} className="text-zinc-600" />
              <p className="text-xs text-zinc-400">
                Drop image or <span className="text-blue-400 underline">browse</span>
              </p>
              <p className="text-[10px] text-zinc-600">PNG, JPG, WEBP · max 10 MB</p>
            </div>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileInput}
        />
      </div>

      {/* Instructions */}
      <div>
        <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">
          Instructions <span className="normal-case text-zinc-600">(optional)</span>
        </label>
        <textarea
          className="mt-1.5 w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-200
            placeholder:text-zinc-600 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
          rows={2}
          placeholder="e.g. Dashboard with sidebar and data table"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
        />
      </div>

      {/* Action */}
      {isLoading ? (
        <button
          onClick={onCancel}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg
            bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs transition-colors"
        >
          <Square size={12} />
          Cancel
        </button>
      ) : (
        <button
          onClick={handleGenerate}
          disabled={!file}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg
            bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600
            text-white text-xs font-medium transition-colors"
        >
          <Wand2 size={13} />
          Generate Component
        </button>
      )}

      {/* Agent Timeline */}
      {status !== "idle" && (
        <div className="border-t border-zinc-800 pt-3">
          <AgentTimeline agents={agents} plan={plan} reflection={reflection} />
        </div>
      )}

      {/* Final status */}
      {status === "done" && (
        <p className="text-[11px] text-green-400">
          ✓ Component ready — view in the panel →
        </p>
      )}
      {status === "error" && (
        <p className="text-[11px] text-red-400">
          Generation failed. Check the API key and try again.
        </p>
      )}
    </div>
  );
}
