import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "PLATINUM CRM",
  description: "Система управления ювелирным бутиком",
  openGraph: {
    locale: "ru_RU",
    title: "PLATINUM CRM",
    description: "Система управления ювелирным бутиком",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={`${manrope.variable} dark h-full antialiased`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('platinum.theme');if(t==='light')document.documentElement.classList.remove('dark');else document.documentElement.classList.add('dark')}catch(e){}",
          }}
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,300,0..1,0&display=swap"
        />
      </head>
      <body className="h-full min-h-full bg-background font-sans text-on-surface">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
