import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MejorProveedor v1.0",
  description: "Sistema de Información para la Gestión de Costos",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* Mantenemos el min-h-full, pero agregamos el fondo base */}
      <body className="min-h-full flex bg-slate-50">
        
        {/* El menú lateral fijo a la izquierda */}
        <Sidebar />
        
        {/* Contenido principal empujado 64 unidades (256px) para no quedar atrás del Sidebar */}
        <div className="pl-64 w-full min-h-screen bg-slate-950 text-slate-100">
          {children}
        </div>
        
      </body>
    </html>
  );
}