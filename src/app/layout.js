import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "DMS Drive",
  description: "Lưu trữ tài liệu nội bộ",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body className={`${inter.className} bg-[#f8fafd] text-[#1f1f1f] antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
