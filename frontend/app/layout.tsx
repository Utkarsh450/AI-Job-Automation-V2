import type { Metadata } from "next";
import "./globals.css";
import QueryProvider from "../src/providers/QueryProvider";
import AuthProvider from "../src/providers/AuthProvider";
import { ThemeProvider } from "../components/theme-provider";

export const metadata: Metadata = {
  title: "Tsenta - AI Job Automation",
  description: "Automate your job search with AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full antialiased font-sans`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col scrollbar-hidden">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
