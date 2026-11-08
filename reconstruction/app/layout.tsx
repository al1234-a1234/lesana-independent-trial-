import type { Metadata } from "next";
import "./globals.css";
import "./phase21.css";
import { DataProvider } from "@/components/data-provider";
import { Shell } from "@/components/shell";
import { ThemeProvider } from "@/components/theme-provider";
export const metadata: Metadata = {
  title: "سطر — حكاية كل يوم",
  description: "تعلّم الإنجليزية بقصص أصلية، كتابة تفاعلية ومراجعة متباعدة.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <ThemeProvider><DataProvider><Shell>{children}</Shell></DataProvider></ThemeProvider>
      </body>
    </html>
  );
}
