import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ofiSí - Encuentra el profesional que necesitas",
  description:
    "La plataforma que conecta clientes con profesionales de servicios. Rápido, seguro y confiable.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        {/* Fallback de estilos en producción (Tailwind precompilado) */}
        <link rel="stylesheet" href="/styles.css" />
        {/* Meta tags para evitar caché en páginas de recuperación */}
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
