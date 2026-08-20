import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "危化品查询｜《危险化学品目录》快速查询工具",
  description: "依据《危险化学品目录（2015版）》，支持化学品名称、别名、CAS号批量查询，快速核对产品是否匹配目录条目。",
  icons: { icon: "/logo.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
