import type { Metadata } from "next";
import { Newsreader, Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { Toaster } from "sonner";

const newsreader = Newsreader({
  variable: "--font-newsreader",
  style: ["normal", "italic"],
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ZConnect - Directory & Workspace",
  description: "Editorial workspace and member manager for ZConnect.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${newsreader.variable} ${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full bg-bg-base text-text-primary font-sans flex flex-col antialiased" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={true}>
          <AuthProvider>
            {children}
            <Toaster position="top-right" richColors closeButton toastOptions={{
              style: {
                borderRadius: '0.75rem',
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-surface)',
                color: 'var(--text-primary)',
              }
            }} />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
