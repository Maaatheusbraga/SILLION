import type { Metadata } from "next";
import { DM_Sans, Syne } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SILLION — CRM de Prospecção",
  description: "Transforme planilhas em pipeline de vendas.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
};

const themeScript = `(function(){try{var t=localStorage.getItem("sillion-theme");document.documentElement.setAttribute("data-theme",t==="light"?"light":"dark")}catch(e){document.documentElement.setAttribute("data-theme","dark")}})()`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${dmSans.variable} ${syne.variable} antialiased`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
