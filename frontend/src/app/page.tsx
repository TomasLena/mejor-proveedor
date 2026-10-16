export default function Home() {
  return (
    <main className="p-8 flex items-center justify-center min-h-[80vh]">
      <div className="text-center space-y-4">
        <div className="inline-block bg-emerald-600 p-4 rounded-2xl mb-2">
          <div className="w-8 h-8 bg-white rounded-md"></div>
        </div>
        <h1 className="text-3xl font-bold text-white">Bienvenido a MejorProveedor</h1>
        <p className="text-slate-400 max-w-md mx-auto">
          Utilizá el menú lateral para gestionar tus proveedores, cargar nuevas listas de precios o ingresar al tablero comparativo.
        </p>
      </div>
    </main>
  );
}