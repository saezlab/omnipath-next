import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "next-themes"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { FilterProvider } from "@/contexts/filter-context"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "OmniPath Explorer",
  description: "Explore molecular interactions, pathways, and biological annotations",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <FilterProvider>
            <SidebarProvider>
              <AppSidebar />
              <SidebarInset>
                <main>
                  <SidebarTrigger className="md:hidden fixed bottom-28 right-4 z-50 bg-primary text-primary-foreground shadow-md" />
                  {children}
                </main>
              </SidebarInset>
            </SidebarProvider>
          </FilterProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

