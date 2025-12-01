"use client";

import { useState } from "react";

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const [instructions, setInstructions] = useState("");
  const [loading, setLoading] = useState(false);
  const [layout, setLayout] = useState<any>(null);
  const [code, setCode] = useState("");

  // Backend URL
  const API_URL = "http://localhost:8000/generate";

  const handleGenerate = async () => {
    if (!file) {
      alert("Upload an image first");
      return;
    }

    setLoading(true);

    const form = new FormData();
    form.append("file", file);
    form.append("instructions", instructions);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        body: form,
      });

      const data = await res.json();
      setLayout(data.layout);
      setCode(data.code);
    } catch (error) {
      console.error(error);
      alert("Failed to reach backend");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-8 flex flex-col gap-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold">
        Generative UI Builder (Phase 1)
      </h1>

      {/* Image Upload */}
      <div className="flex flex-col gap-2">
        <label className="font-medium">UI Screenshot or Sketch</label>
        <input
          type="file"
          accept="image/*"
          className="border p-2 rounded-md"
          onChange={(e) => setFile(e.target.files![0])}
        />
      </div>

      {/* Instructions */}
      <div className="flex flex-col gap-2">
        <label className="font-medium">Instructions (Optional)</label>
        <textarea
          className="border p-3 rounded-md text-sm"
          placeholder="Example: Dashboard layout with sidebar"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
        />
      </div>

      {/* Button */}
      <button
        onClick={handleGenerate}
        className="bg-blue-600 text-white px-4 py-2 rounded-md w-fit"
      >
        {loading ? "Generating…" : "Generate UI"}
      </button>

      {/* Show DSL JSON */}
      {layout && (
        <section>
          <h2 className="text-xl font-semibold mb-2">Generated DSL</h2>
          <pre className="bg-gray-100 p-3 rounded-md text-sm max-h-[350px] overflow-auto">
            {JSON.stringify(layout, null, 2)}
          </pre>
        </section>
      )}

      {/* Show Code */}
      {code && (
        <section>
          <h2 className="text-xl font-semibold mb-2">Generated React Code</h2>
          <pre className="bg-gray-100 p-3 rounded-md text-sm whitespace-pre-wrap max-h-[450px] overflow-auto">
            {code}
          </pre>
        </section>
      )}
    </main>
  );
}
