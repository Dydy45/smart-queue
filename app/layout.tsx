import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ToastProvider } from "@/lib/ToastProvider";
import '@/lib/init' // Initialiser le rate limiting
import RegisterSW from './components/RegisterSW'
import OfflineIndicator from './components/OfflineIndicator'
import UpdateNotification from './components/UpdateNotification'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SmartQueue - Gestion de files d'attente intelligente",
  description: "Système de gestion de files d'attente pour les entreprises. Créez des tickets, gérez les files d'attente en temps réel et optimisez l'expérience client.",
  keywords: ['gestion de file', 'queue management', 'tickets', 'attente', 'gestion client', 'temps réel'],
  authors: [{ name: 'SmartQueue Team' }],
  openGraph: {
    title: 'SmartQueue - Gestion de files d\'attente',
    description: 'Système intelligent de gestion de files d\'attente en temps réel',
    type: 'website',
    locale: 'fr_FR',
  },
  robots: {
    index: true,
    follow: true,
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/home"
      signUpFallbackRedirectUrl="/home"
    >
      <ToastProvider>
        <html lang="en" data-theme="valentine">
          <head>
            <link rel="manifest" href="/manifest.json" />
            <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
            <link rel="icon" type="image/png" href="/favicon.png" />
            <meta name="theme-color" content="#570df8" />
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
            <meta name="apple-mobile-web-app-title" content="SmartQueue" />
            <meta name="format-detection" content="telephone=no" />
            <meta name="mobile-web-app-capable" content="yes" />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  try {
                    var t = localStorage.getItem('theme') || 'valentine';
                    document.documentElement.setAttribute('data-theme', t);
                  } catch(e) {}
                `
              }}
            />
          </head>
          <body
            className={`${geistSans.variable} ${geistMono.variable} antialiased`}
          >
            <RegisterSW />
            <OfflineIndicator />
            <UpdateNotification />
            {children}
          </body>
        </html>
      </ToastProvider>
    </ClerkProvider>
  );
}
