import { IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const ibmPlexMono = IBM_Plex_Mono({
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Pomodoro Tracker",
  description: "",
  keywords: ["Next.js", "App Router", "JavaScript", "React", "Mockup"],
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="es"
      className={`${ibmPlexMono.variable} scroll-smooth h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-mono bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        {children}
      </body>
    </html>
  );
}
