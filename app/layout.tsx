import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Meta Editor",
  description: "File metadata editor tool",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
