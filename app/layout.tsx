import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ErrorBoundary } from "@/components/error-boundary"
import { ServiceWorkerProvider } from "@/components/service-worker-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { OfflineIndicator } from "@/components/ui/progressive-enhancement"
import { AccessibleErrorBoundary } from "@/components/ui/accessibility"
import { IntegrationProvider } from "@/components/integration-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Meta Ads Dashboard Pro",
  description: "Advanced Meta Ads performance dashboard with historical analysis and predictions",
  manifest: "/manifest.json?v=2",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Meta Ads Dashboard",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/icons/icon-512x512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icons/icon-192x192.svg", sizes: "192x192", type: "image/svg+xml" },
    ],
  },
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#0f172a",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json?v=2" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Meta Ads" />
        <meta name="theme-color" content="#0f172a" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange={false}
        >
          <ServiceWorkerProvider>
            <IntegrationProvider>
              <AccessibleErrorBoundary>
                <ErrorBoundary>
                  <OfflineIndicator />
                  {children}
                </ErrorBoundary>
              </AccessibleErrorBoundary>
            </IntegrationProvider>
          </ServiceWorkerProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}