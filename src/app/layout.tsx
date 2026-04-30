import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "兽阵前线",
  description: "动物对战策略游戏",
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
