import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BRIET Reader",
  description: "Big ol test",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script src="https://unpkg.com/@internetarchive/bookreader@5.0.0-79/BookReaderDemo/BookReaderJSSimple.js"></script>
        <script>instantiateBookReader('#Bookreader')</script>
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
