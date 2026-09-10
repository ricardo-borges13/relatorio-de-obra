import type { Metadata, Viewport } from "next";
import PwaProvider from "@/components/PwaProvider";
import "./globals.scss";

export const metadata: Metadata = {
  applicationName: "Relatórios de Obra",
  title: {
    default: "Relatórios de Obra | RIOW",
    template: "%s | RIOW",
  },
  description: "Criação de relatórios fotográficos de obra com funcionamento local e offline.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/riow-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/riow-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/riow-180.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Relatórios",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#26363e",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: Readonly<RootLayoutProps>) {
  return (
    <html lang="pt-BR">
      <body>
        <PwaProvider>{children}</PwaProvider>
      </body>
    </html>
  );
}
