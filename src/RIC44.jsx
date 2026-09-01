import { useEffect, useMemo, useRef, useState } from "react";
import { API_URL } from "./config";
import EstadisticasEquipo from "./EstadisticasEquipo";

const CRITERIOS = [
  "Criterio de fábrica",
  "Falta de repuestos originales, soporte tecnico o no existen repuestos alternativos",
  "Mayor a 10 años de uso - Análisis de riesgo (RIESGO ALTO)",
  "Mayor a 10 años de uso - Análisis de tecnologías superiores que justifiquen el recambio",
  "Mayor a 10 años de uso - Análisis y sugerencia del usuario del equipamiento",
  "Mayor a 10 años de uso - Verificación funcional y seguridad eléctrica NO SUPERADA",
  "Mayor a 20 años de uso"
];

export default function RIC44({ setVista, personal }) {
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [equipo, setEquipo] = useState(null);
  const [criterio, setCriterio] = useState("");
  const [ampliarSeleccion, setAmpliarSeleccion] = useState("");
  const [disposicionFinal, setDisposicionFinal] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [imagen, setImagen] = useState("");
  const [estadisticasExtra, setEstadisticasExtra] = useState({ dias_fuera_servicio: 0, equipos_similares: 0 });
  const inputFoto = useRef(null);

  useEffect(() => { cargarDatos(); }, [personal]);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError("");
      const tareaGuardada = localStorage.getItem("tareaActiva");
      if (!tareaGuardada) throw new Error("No existe un equipo/mantenimiento activo.");

      const tarea = JSON.parse(tareaGuardada);
      let datosEquipo = null;

      if (tarea.numero_serie) {
        const res = await fetch(`${API_URL.BuscarEquipo}/${encodeURIComponent(tarea.numero_serie)}`);
        if (res.ok) datosEquipo = await res.json();
      }

      datosEquipo = datosEquipo || tarea;
      setEquipo(datosEquipo);
      setImagen(datosEquipo.imagen || "");
      await cargarEstadisticasExtra(datosEquipo);
    } catch (err) {
      console.error("Error cargando RIC44:", err);
      setError(err.message || "No se pudieron cargar los datos del equipo.");
    } finally {
      setCargando(false);
    }
  };

  const cargarEstadisticasExtra = async (datosEquipo) => {
    try {
      if (!datosEquipo?.numero_serie) return;
      const res = await fetch(`${API_URL.Ric44}/estadisticas/${encodeURIComponent(datosEquipo.numero_serie)}`);
      if (!res.ok) throw new Error("No se pudieron obtener las estadísticas adicionales");
      const data = await res.json();
      const stats = data.estadisticas || {};
      setEstadisticasExtra({
        dias_fuera_servicio: Number(stats.dias_fuera_servicio) || 0,
        equipos_similares: Number(stats.equipos_similares) || 0
      });
    } catch (err) {
      console.error("Error cargando estadísticas adicionales RIC44:", err);
    }
  };

  const seleccionarFoto = (e) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    const lector = new FileReader();
    lector.onload = () => setImagen(String(lector.result || ""));
    lector.readAsDataURL(archivo);
  };

  const guardar = async () => {
    if (!equipo?.numero_serie) return alert("No se encontró el número de serie del equipo.");
    if (!criterio) return alert("Seleccione el criterio de obsolescencia.");

    try {
      setGuardando(true);
      const payload = {
        equipo_id: equipo.id || null,
        ric01_id: equipo.mantenimiento_id || equipo.ric01_id || null,
        numero_serie: equipo.numero_serie,
        descripcion: equipo.descripcion || "",
        marca_modelo: equipo.marca_modelo || "",
        area: equipo.area || "",
        servicio: equipo.servicio || "",
        sub_servicio: equipo.sub_servicio || equipo.subservicio || "",
        encargado: equipo.encargado || "",
        tecnico: personal?.nombre || "",
        criterio,
        ampliar_seleccion: ampliarSeleccion,
        disposicion_final: disposicionFinal,
        imagen,
        observaciones,
        correctivos: Number(equipo.correctivos) || 0,
        preventivos: Number(equipo.preventivos) || 0,
        dias_fuera_servicio: estadisticasExtra.dias_fuera_servicio,
        equipos_similares: estadisticasExtra.equipos_similares
      };

      const respuesta = await fetch(API_URL.Ric44, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await respuesta.json();
      if (!respuesta.ok) throw new Error(data.error || "Error guardando RIC44");

      alert("RIC44 guardado correctamente ✅");
      localStorage.setItem("ric44Id", String(data.ric44_id || data.id || ""));
    } catch (err) {
      console.error("ERROR GUARDANDO RIC44:", err);
      setError(err.message || "No se pudo guardar el RIC44.");
      alert(err.message || "No se pudo guardar el RIC44.");
    } finally {
      setGuardando(false);
    }
  };

  const resumenCriticidad = useMemo(() => {
    const total = estadisticasExtra.equipos_similares + 1;
    if (total <= 1) return "Equipo único en el servicio/subservicio";
    if (total === 2) return "Baja disponibilidad de reemplazo";
    return `${total} equipos del mismo tipo en el servicio/subservicio`;
  }, [estadisticasExtra.equipos_similares]);

  if (cargando) return <div className="p-6 text-center">⏳ Cargando datos del equipo...</div>;

  if (error && !equipo) {
    return <div className="p-6 max-w-xl mx-auto"><div className="bg-red-100 text-red-700 p-4 rounded-xl">⚠️ {error}</div><button onClick={() => setVista("equipos")} className="w-full bg-gray-500 text-white rounded-xl p-3 mt-4">← Volver</button></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="sticky top-0 z-50 bg-white shadow">
        <div className="max-w-xl mx-auto p-3 flex justify-between items-center gap-2">
          <p className="font-bold text-gray-800">RIC44 - Registro de obsolescencia</p>
          <span className="text-xs text-gray-500">Ingeniería Clínica</span>
        </div>
      </div>

      <div className="max-w-xl mx-auto p-3 space-y-3">
        <section className="bg-white rounded-2xl shadow-sm p-3">
          <h2 className="text-base font-bold text-gray-800 mb-2">Datos del equipo</h2>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
            <p><strong>Nº serie:</strong> {equipo?.numero_serie || "-"}</p>
            <p><strong>Descripción:</strong> {equipo?.descripcion || "-"}</p>
            <p><strong>Marca/Modelo:</strong> {equipo?.marca_modelo || "-"}</p>
            <p><strong>Área:</strong> {equipo?.area || "-"}</p>
            <p><strong>Servicio:</strong> {equipo?.servicio || "-"}</p>
            <p><strong>Subservicio:</strong> {equipo?.sub_servicio || equipo?.subservicio || "-"}</p>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm p-3">
          <h2 className="text-base font-bold text-gray-800 mb-2">Criterio de obsolescencia</h2>
          <select value={criterio} onChange={(e) => setCriterio(e.target.value)} className="w-full border rounded-xl p-2.5 text-sm">
            <option value="">Seleccione...</option>
            {CRITERIOS.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <textarea value={ampliarSeleccion} onChange={(e) => setAmpliarSeleccion(e.target.value)} className="w-full border rounded-xl p-2.5 mt-2 text-sm min-h-20" placeholder="Ampliar selección / fundamento" />
        </section>

        <section className="bg-white rounded-2xl shadow-sm p-3">
          <h2 className="text-base font-bold text-gray-800 mb-2">Disposición final</h2>
          <textarea value={disposicionFinal} onChange={(e) => setDisposicionFinal(e.target.value)} className="w-full border rounded-xl p-2.5 text-sm min-h-20" placeholder="Indique la disposición final" />
        </section>

        <section className="bg-white rounded-2xl shadow-sm p-3">
          <h2 className="text-base font-bold text-gray-800 mb-2">Imagen del equipo</h2>
          {imagen ? <img src={imagen.startsWith("data:") ? imagen : `data:image/jpeg;base64,${imagen}`} alt="Equipo" className="w-full max-h-56 object-contain rounded-xl border bg-gray-50" /> : <p className="text-xs text-gray-500">Sin imagen registrada.</p>}
          <input ref={inputFoto} type="file" accept="image/*" capture="environment" onChange={seleccionarFoto} className="hidden" />
          <button onClick={() => inputFoto.current?.click()} className="w-full mt-2 bg-blue-600 text-white font-semibold py-2.5 rounded-xl text-sm">📷 {imagen ? "Cambiar imagen" : "Tomar imagen"}</button>
        </section>

        <section className="bg-white rounded-2xl shadow-sm p-3">
          <h2 className="text-base font-bold text-gray-800 mb-2">Estadísticas del equipo</h2>
          <EstadisticasEquipo equipo={{ ...equipo, dias_fuera_servicio: estadisticasExtra.dias_fuera_servicio, equipos_similares: estadisticasExtra.equipos_similares }} />
        </section>

        <section className="bg-white rounded-2xl shadow-sm p-3">
          <h2 className="text-base font-bold text-gray-800 mb-2">Criticidad por equipos similares</h2>
          <div className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 border p-3">
            <div><p className="text-xs text-gray-500">Misma descripción + servicio + subservicio</p><p className="text-xs font-semibold text-gray-700 mt-1">{resumenCriticidad}</p></div>
            <div className="text-3xl font-bold text-purple-600">{estadisticasExtra.equipos_similares}</div>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm p-3">
          <h2 className="text-base font-bold text-gray-800 mb-2">Observaciones</h2>
          <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} className="w-full border rounded-xl p-2.5 text-sm min-h-24" placeholder="Observaciones generales" />
        </section>

        {error && <div className="bg-red-100 text-red-700 p-3 rounded-xl text-sm">⚠️ {error}</div>}
        <button onClick={guardar} disabled={guardando} className="w-full bg-green-600 disabled:bg-gray-400 text-white font-bold py-3 rounded-xl shadow">{guardando ? "Guardando RIC44..." : "💾 Guardar RIC44"}</button>
        <button onClick={() => setVista("equipos")} className="w-full bg-gray-500 text-white font-semibold py-2.5 rounded-xl text-sm">← Volver a equipos</button>
      </div>
    </div>
  );
}
