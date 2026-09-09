import type { Metadata } from "next";
import "./globals.scss";

export const metadata: Metadata = {
  title: "Relatórios de Obra | RIOW",
  description: "Registro fotográfico de serviços executados em obras.",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: Readonly<RootLayoutProps>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
