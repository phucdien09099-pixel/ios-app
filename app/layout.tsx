import { Geist, Geist_Mono, Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/libs/utils";
import { DrawerProvider } from "@/components/providers/drawer/DrawerProvider";
import { Toaster } from "sonner";
import { DatabaseProvider } from "@/components/providers/db/DatabaseProvider";
import { TransportProvider } from "@/components/providers/transport/TransportProvider";
import type { Viewport } from "next";
import WhisperTester from "@/components/common/WhisperTester";

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};
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
                <WhisperTester />
                {children}
              </DrawerProvider>
              <Toaster
                position="bottom-center"
                richColors={true}
                closeButton={false}
                expand={false}
                visibleToasts={1}
                offset={40}
                toastOptions={{
                  duration: 2000,
                  classNames: {
                    toast: `mx-auto w-fit min-w-[150px] max-w-[250px] h-11 px-6 py-0 rounded-full! justify-center`,
                    description: `hidden`,
                  },
                }}
              />
            </TransportProvider>
          </DatabaseProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
