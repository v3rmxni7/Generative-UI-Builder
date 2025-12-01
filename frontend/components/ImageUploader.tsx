"use client";

interface Props {
  onChange: (file: File) => void;
}

export default function ImageUploader({ onChange }: Props) {
  return (
    <input
      type="file"
      accept="image/*"
      className="border p-2 rounded-md"
      onChange={(e) => onChange(e.target.files![0])}
    />
  );
}
