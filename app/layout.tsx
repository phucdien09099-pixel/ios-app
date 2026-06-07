import { Geist, Geist_Mono, Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/libs/utils";
import { DrawerProvider } from "@/components/providers/drawer/DrawerProvider";
import { Toaster } from "sonner";
import { DatabaseProvider } from "@/components/providers/db/DatabaseProvider";
import { TransportProvider } from "@/components/providers/transport/TransportProvider";

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", inter.variable)}>
      <body>
        <ThemeProvider>
          <DatabaseProvider>
            <TransportProvider>
              <DrawerProvider>
                {children}
              </DrawerProvider>
              <Toaster richColors position="top-right" />
            </TransportProvider>
          </DatabaseProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
