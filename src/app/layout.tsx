import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fauna Frontline",
  description: "Animal battle strategy game",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
