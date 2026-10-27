import { useEffect, useState } from "react";
import { API_URL } from "./config";
const etiquetas = [
  ["estado_equipos", "Estado de equipos"],
  ["tareas_mantenimiento", "Indicadores de tareas de mantenimiento"],
  ["envejecimiento_parque", "Envejecimiento del parque tecnológico"]
];
export default function ConfigMonitorIndicadores() {
  const [config, setConfig] = useState(null);
  const [clave, setClave] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [guardando, setGuardando] = useState(false);
  useEffect(() => {
    fetch(`${API_URL.Base}/api/monitor-indicadores/config`, { cache: "no-store" })
      .then(r => { if (!r.ok) throw new Error("No se pudo leer la configuración"); return r.json(); })
      .then(d => setConfig(d.configuracion))
      .catch(e => setMensaje(e.message));
  }, []);
  const guardar = async () => {
    if (!clave.trim()) { setMensaje("Ingresá la clave de administración del monitor."); return; }
    setGuardando(true);
    setMensaje("");
    try {
      const res = await fetch(`${API_URL.Base}/api/monitor-indicadores/config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-monitor-admin-key": clave },
        body: JSON.stringify({ configuracion: config })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "No se pudo guardar");
      setMensaje("Configuración guardada. El monitor la actualizará automáticamente.");
      setClave("");
    } catch (e) { setMensaje(e.message); }
    finally { setGuardando(false); }
  };
  return (
    <section className="bg-white rounded-xl shadow-md p-4 mb-6">
      <h2 className="text-lg font-bold mb-1">Módulos del Monitor de Indicadores</h2>
      <p className="text-sm text-gray-600 mb-3">Activá o desactivá cada bloque. Los cambios se aplican a todos los monitores, sin cambiar sus cálculos.</p>
      {config ? <>
        <div className="space-y-2 mb-3">
          {etiquetas.map(([id, nombre]) => (
            <label key={id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
              <span className="text-sm font-semibold">{nombre}</span>
              <input type="checkbox" className="h-5 w-5" checked={Boolean(config[id])}
                onChange={e => setConfig(prev => ({ ...prev, [id]: e.target.checked }))} />
            </label>
          ))}
        </div>
        <label className="block text-sm font-medium mb-1">Clave de administración del monitor</label>
        <input type="password" autoComplete="off" value={clave} onChange={e => setClave(e.target.value)}
          placeholder="Clave configurada en Render" className="w-full rounded-lg border p-2 mb-3" />
        <button type="button" onClick={guardar} disabled={guardando} className="bg-indigo-700 text-white rounded-lg px-4 py-2 font-semibold disabled:opacity-50">
          {guardando ? "Guardando..." : "Guardar configuración"}
        </button>
      </> : <p className="text-gray-500">Cargando módulos...</p>}
      {mensaje && <p role="status" className="mt-2 text-sm">{mensaje}</p>}
    </section>
  );
}
