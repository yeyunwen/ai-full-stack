import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 聊天助手",
  description: "一个智能AI聊天应用，可推荐商品和活动",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body suppressHydrationWarning>
        <div className="min-h-screen flex flex-col">
          <header className="bg-blue-600 text-white p-4">
            <h1 className="text-2xl font-bold">AI 聊天助手</h1>
          </header>
          <main className="flex-1 container mx-auto p-4">{children}</main>
          <footer className="bg-gray-100 p-4 text-center text-gray-500"></footer>
        </div>
      </body>
    </html>
  );
}
