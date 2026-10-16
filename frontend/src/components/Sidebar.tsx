'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ArrowLeftRight, 
  ShoppingCart, 
  ShieldCheck, 
  Settings 
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Productos', path: '/productos', icon: Package },
    { name: 'Proveedores', path: '/proveedores', icon: Users },
    { name: 'Comparativas', path: '/comparativas', icon: ArrowLeftRight },
    { name: 'Pedidos', path: '/pedidos', icon: ShoppingCart },
    { name: 'Homologación', path: '/homologacion', icon: ShieldCheck },
    { name: 'Configuración', path: '/configuracion', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-emerald-600 text-white min-h-screen flex flex-col fixed left-0 top-0 bottom-0 z-50">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="bg-white rounded p-1.5">
          <div className="w-6 h-6 bg-emerald-600 rounded-sm"></div>
        </div>
        <div>
          <h1 className="font-bold text-lg leading-none tracking-tight">MejorProveedor</h1>
          <span className="text-[10px] text-emerald-200 font-medium">v1.0 Enterprise</span>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-4 py-4 space-y-1.5">
        {menuItems.map((item) => {
          const isActive = pathname === item.path || (pathname === '/' && item.path === '/proveedores'); // Temporal para que veas uno activo

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