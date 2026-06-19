import type { Metadata } from "next";
import { Toaster } from "sonner";
import { fontClassNames } from "@/lib/fonts";
import { FONT } from "@/lib/typography";
import "./globals.css";

export const metadata: Metadata = {
  title: "dailies — Daily Mini Games",
  description: "Six new puzzles every day. Play VERBUM, PITCH, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="da" className={`h-full antialiased ${fontClassNames}`}>
      <body className="min-h-full flex flex-col font-sans">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              fontFamily: FONT.mono,
              fontSize: "0.75rem",
              borderRadius: "2px",
            },
          }}
        />
      </body>
    </html>
  );
}
