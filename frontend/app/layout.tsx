import "./globals.css";

export const metadata = {
  title: "Generative UI Builder",
  description: "Image → UI DSL → React Code generator",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
