import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SupabaseSync from "@/components/SupabaseSync";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BlackStore RD",
  description: "Sistema de gestión de pedidos y delivery",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "BlackStore RD" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0a0f",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.jpeg" />
      </head>
      <body className="h-full">
        <SupabaseSync />
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker'in navigator){navigator.serviceWorker.addEventListener('message',function(e){if(e.data&&e.data.type==='SW_UPDATED'){window.location.reload()}});navigator.serviceWorker.register('/sw.js').then(function(reg){setInterval(function(){reg.update()},30000);reg.addEventListener('updatefound',function(){var w=reg.installing;if(w){w.addEventListener('statechange',function(){if(w.state==='installed'&&navigator.serviceWorker.controller){w.postMessage('SKIP_WAITING')}})}})});navigator.serviceWorker.ready.then(function(reg){reg.update()})}`,
          }}
        />
      </body>
    </html>
  );
}
