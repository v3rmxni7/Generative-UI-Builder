import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "Generative UI Builder",
  description: "Screenshot → DSL → React component, powered by local LLMs",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-zinc-950 text-zinc-100 antialiased">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#27272a",
              color: "#f4f4f5",
              border: "1px solid #3f3f46",
              fontSize: "13px",
            },
          }}
        />
      </body>
    </html>
  );
}
