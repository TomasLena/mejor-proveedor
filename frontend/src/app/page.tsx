'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface HealthResponse {
  status: string;
  message: string;
  database: string;
  timestamp: string;
}

export default function Home() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://localhost:4000/healthcheck')
      .then((res) => {
        if (!res.ok) throw new Error('No se pudo conectar con el servidor Express');
        return res.json();
      })
      .then((data) => {
        setHealth(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl">
        <h1 className="text-2xl font-bold text-emerald-400 mb-1">MejorProveedor v1.0</h1>
        <p className="text-xs text-slate-400 mb-6">Prueba de conexión Frontend ↔ Backend (v0.1)</p>

        {loading && (
          <div className="flex items-center gap-3 text-amber-400 bg-amber-500/10 p-4 rounded-lg border border-amber-500/20">
            <Loader2 className="animate-spin w-5 h-5" />
            <span className="text-sm font-medium">Verificando API y base de datos...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 text-red-400 bg-red-500/10 p-4 rounded-lg border border-red-500/20">
            <XCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {health && (
          <div className="space-y-3 bg-slate-800/50 p-4 rounded-lg border border-slate-700/50">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">Estado API:</span>
              <span className="text-emerald-400 font-bold text-sm flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> {health.status.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-700/50 pt-2">
              <span className="text-slate-400 text-sm">PostgreSQL (Neon):</span>
              <span className="text-emerald-400 font-medium text-xs">{health.database}</span>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}