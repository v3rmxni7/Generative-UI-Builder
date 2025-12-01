"use client";

interface Props {
  code: string;
}

export default function CodeViewer({ code }: Props) {
  return (
    <pre className="bg-gray-100 p-3 rounded-md text-sm whitespace-pre-wrap max-h-[450px] overflow-auto">
      {code}
    </pre>
  );
}
