'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  ArrowLeftRight, 
  ShoppingCart, 
  ShieldCheck 
} from 'lucide-react';

// Icono SVG
const NotebookSvg = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
  >
    {/* Anillas / Espirales superiores */}
    <rect x="5.5" y="1" width="1.8" height="3.5" rx="0.9" />
    <rect x="9.5" y="1" width="1.8" height="3.5" rx="0.9" />
    <rect x="13.5" y="1" width="1.8" height="3.5" rx="0.9" />
    <rect x="17.5" y="1" width="1.8" height="3.5" rx="0.9" />
    
    {/* Cuerpo principal de la libreta */}
    <path d="M4 4.5C4 3.67 4.67 3 5.5 3h13c.83 0 1.5.67 1.5 1.5v15c0 1.38-1.12 2.5-2.5 2.5h-10C6.12 22 5 20.88 5 19.5V4.5z" />
    
    {/* Renglones / Líneas interiores (blancos) */}
    <rect x="8" y="8" width="8" height="2" rx="0.75" fill="white" />
    <rect x="8" y="12" width="8" height="2" rx="0.75" fill="white" />
    <rect x="8" y="16" width="5" height="2" rx="0.75" fill="white" />
  </svg>
);

export default function Sidebar() {
  const pathname = usePathname();

  // Menú sin "Productos" ni "Configuración"
  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Proveedores', path: '/proveedores', icon: Users },
    { name: 'Comparativas', path: '/comparativas', icon: ArrowLeftRight },
    { name: 'Pedidos', path: '/pedidos', icon: ShoppingCart },
    { name: 'Homologación', path: '/homologacion', icon: ShieldCheck },
  ];

  return (
    <aside className="w-64 bg-emerald-600 text-white min-h-screen flex flex-col fixed left-0 top-0 bottom-0 z-50">
      {/* Logo con Icono de Bloc de Notas */}
      <div className="p-6 flex items-center gap-3">
        <div className="bg-white text-emerald-600 rounded-xl p-2 flex items-center justify-center shadow-xs">
          <NotebookSvg className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-none tracking-tight">MejorProveedor</h1>
          <span className="text-[10px] text-emerald-200 font-medium">v1.3 Enterprise</span>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-4 py-4 space-y-1.5">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;

          return (
            <Link
              key={item.name}
              href={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive 
                  ? 'bg-emerald-800 text-white shadow-inner' 
                  : 'text-emerald-50 hover:bg-emerald-500 hover:text-white'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}