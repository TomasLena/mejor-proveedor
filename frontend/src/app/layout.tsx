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
      <body className="min-h-screen flex bg-slate-50 text-slate-900">
        {/* Menú lateral fijo a la izquierda */}
        <Sidebar />
        
        {/* Área de contenido principal con fondo claro y texto oscuro */}
        <div className="pl-64 w-full min-h-screen bg-slate-50 text-slate-900">
          {children}
        </div>
      </body>
    </html>
  );
}