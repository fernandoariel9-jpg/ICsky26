import { useEffect, useMemo, useState } from "react";
import { API_URL } from "./config";

const ETAPAS = ["Verificación", "Resumen"];
const claveBorrador = (ric01Id) => `preventivo:ric56:${ric01Id}`;

const PUNTOS = [
  "Inspección visual",
  "Limpieza mesa",
  "Limpieza mural",
  "Inspección de comando",
  "Estado de frenos",
  "Chasis a tierra",
  "Tensión de alimentación",
  "Colimado mecánico",
  "Colimado luz",
  "Disparo remoto",
  "Movimiento de ruedas y brazo",
  "Calibración flat panel",
  "Funcionamiento general"
];

const crearPuntos = () => PUNTOS.map((nombre, i) => ({ orden: i + 1, nombre, estado: "", observaciones: "" }));

const fechaHoraLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
};

function BotonEstado({ activo, tipo, onClick }) {
  const clases = tipo === "CONFORME"
    ? activo ? "bg-green-600 text-white border-green-600" : "bg-white text-green-700 border-green-300 hover:bg-green-50"
    : tipo === "NO CONFORME"
      ? activo ? "bg-red-600 text-white border-red-600" : "bg-white text-red-700 border-red-300 hover:bg-red-50"
      : activo ? "bg-slate-600 text-white border-slate-600" : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50";

  return (
    <button type="button" onClick={onClick} className={`px-3 py-2 rounded-xl border font-bold text-sm transition ${clases}`}>
      {tipo === "NO APLICA" ? "No aplica" : tipo === "NO CONFORME" ? "No conforme" : "Conforme"}
    </button>
  );
}

export default function RIC56({ setVista, personal }) {
  const [etapa, setEtapa] = useState(0);
  const [indiceActual, setIndiceActual] = useState(0);
  const [puntos, setPuntos] = useState(crearPuntos);
  const [enUso, setEnUso] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [datos, setDatos] = useState({ ric01_id: "", equipo_id: "", numero_serie: "", descripcion: "", marca_modelo: "", area: "", servicio: "", sub_servicio: "", encargado: "", tecnico: personal?.nombre || "" });
  const [cargando, setCargando] = useState(true);
  const [borradorCargado, setBorradorCargado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [enviandoDrive, setEnviandoDrive] = useState(false);
  const [ric56Id, setRic56Id] = useState(null);
  const [error, setError] = useState("");
  const [estados, setEstados] = useState([]);
  const [mostrarFinalizar, setMostrarFinalizar] = useState(false);
  const [estadoFinal, setEstadoFinal] = useState("");
  const [finalizando, setFinalizando] = useState(false);
  const [tareaFinalizada, setTareaFinalizada] = useState(false);

  useEffect(() => {
    fetch(API_URL.Estados).then((r) => r.json()).then((d) => setEstados(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const raw = localStorage.getItem("tareaActiva");
        if (!raw) throw new Error("No hay una tarea activa.");
        const tarea = JSON.parse(raw);
        const ric01Id = tarea.ric01_id || tarea.id || "";
        let equipo = null;
        if (tarea.numero_serie) {
          const r = await fetch(`${API_URL.BuscarEquipo}/${encodeURIComponent(tarea.numero_serie)}`);
          if (r.ok) equipo = await r.json();
        }

        setDatos((p) => ({
          ...p,
          ric01_id: ric01Id,
          equipo_id: equipo?.id || tarea.equipo_id || "",
          numero_serie: equipo?.numero_serie || tarea.numero_serie || "",
          descripcion: equipo?.descripcion || tarea.descripcion || "EQUIPO DE RX MÓVIL",
          marca_modelo: equipo?.marca_modelo || tarea.marca_modelo || "",
          area: equipo?.area || tarea.area || "",
          servicio: equipo?.servicio || tarea.servicio || "",
          sub_servicio: equipo?.sub_servicio || tarea.subservicio || tarea.sub_servicio || "",
          encargado: equipo?.encargado || tarea.encargado || "",
          tecnico: personal?.nombre || tarea.usuario || tarea.asignado || ""
        }));

        const borradorRaw = ric01Id ? localStorage.getItem(claveBorrador(ric01Id)) : null;
        if (borradorRaw) {
          const b = JSON.parse(borradorRaw);
          if (Array.isArray(b.puntos)) setPuntos(b.puntos);
          if (typeof b.enUso === "string") setEnUso(b.enUso);
          if (typeof b.observaciones === "string") setObservaciones(b.observaciones);
          if (Number.isInteger(b.indiceActual)) setIndiceActual(b.indiceActual);
          if (Number.isInteger(b.etapa)) setEtapa(Math.min(b.etapa, ETAPAS.length - 1));
        }
      } catch (e) {
        setError(e.message || "No se pudieron cargar los datos del equipo.");
      } finally {
        setBorradorCargado(true);
        setCargando(false);
      }
    })();
  }, [personal]);

  useEffect(() => {
    if (!borradorCargado || cargando || !datos.ric01_id || ric56Id) return;
    localStorage.setItem(claveBorrador(datos.ric01_id), JSON.stringify({ etapa, indiceActual, puntos, enUso, observaciones }));
  }, [borradorCargado, cargando, datos.ric01_id, ric56Id, etapa, indiceActual, puntos, enUso, observaciones]);

  const resumen = useMemo(() => {
    const pendientes = puntos.filter((p) => !p.estado).length;
    const noConformes = puntos.filter((p) => p.estado === "NO CONFORME");
    const conformes = puntos.filter((p) => p.estado === "CONFORME").length;
    const noAplica = puntos.filter((p) => p.estado === "NO APLICA").length;
    const resultado = pendientes ? "PENDIENTE" : noConformes.length ? "NO CONFORME" : "CONFORME";
    return { pendientes, noConformes, conformes, noAplica, resultado };
  }, [puntos]);

  const puntoActual = puntos[indiceActual];
  const progreso = etapa === 1 ? 100 : ((indiceActual + 1) / puntos.length) * 100;

  const cambiarEstado = (estado) => setPuntos((prev) => prev.map((p, i) => i === indiceActual ? { ...p, estado } : p));

  const siguiente = () => {
    if (!puntoActual?.estado) return alert("Seleccione Conforme, No conforme o No aplica antes de continuar.");
    if (indiceActual < puntos.length - 1) return setIndiceActual(indiceActual + 1);
    if (!enUso) return alert("Indique si el equipo se encuentra en uso.");
    setEtapa(1);
  };

  const volver = () => {
    if (etapa === 1) return setEtapa(0);
    if (indiceActual > 0) return setIndiceActual(indiceActual - 1);
    setVista("equipos");
  };

  const guardar = async () => {
    if (resumen.pendientes) return alert("Complete todos los puntos de verificación.");
    if (!enUso) return alert("Indique si el equipo se encuentra en uso.");
    setGuardando(true);
    setError("");
    try {
      const res = await fetch(API_URL.Ric56, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...datos,
          fecha: fechaHoraLocal(),
          en_uso: enUso === "SI",
          resultado_general: resumen.resultado,
          observaciones,
          verificaciones: puntos
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo guardar RIC56");
      setRic56Id(data.ric56_id);
      localStorage.removeItem(claveBorrador(datos.ric01_id));
      setMostrarFinalizar(true);
    } catch (e) {
      setError(e.message || "Error guardando RIC56");
    } finally {
      setGuardando(false);
    }
  };

  const abrirPDF = () => {
    if (!ric56Id) return;
    window.open(`${API_URL.Ric56}/${ric56Id}/pdf`, "_blank", "noopener,noreferrer");
  };

  const enviarDrive = async () => {
    if (!ric56Id) return;
    setEnviandoDrive(true);
    try {
      const r = await fetch(`${API_URL.Ric56}/${ric56Id}/drive`, { method: "POST" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "No se pudo enviar a Drive");
      alert("RIC56 enviado correctamente a Google Drive.");
    } catch (e) {
      alert(e.message || "Error enviando RIC56 a Drive");
    } finally {
      setEnviandoDrive(false);
    }
  };

  const finalizar = async () => {
    if (!estadoFinal) return alert("Seleccione el estado final del equipo.");
    setFinalizando(true);
    try {
      const r = await fetch(`${API_URL.Ric01}/finalizar/${datos.ric01_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fecha_fin: fechaHoraLocal(), estado: estadoFinal, numero_serie: datos.numero_serie, usuario: datos.tecnico })
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "No se pudo finalizar el mantenimiento");
      setTareaFinalizada(true);
      setMostrarFinalizar(false);
      localStorage.removeItem("tareaActiva");
      localStorage.setItem("equipoActualizado", datos.numero_serie);
    } catch (e) {
      alert(e.message || "Error finalizando mantenimiento");
    } finally {
      setFinalizando(false);
    }
  };

  if (cargando) return <div className="min-h-screen bg-gray-100 flex items-center justify-center text-gray-500">Cargando RIC56...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="bg-slate-800 text-white p-5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <div className="text-sm text-slate-300 font-semibold">SISTEMA DE GESTIÓN DE LA CALIDAD</div>
                <h1 className="text-2xl md:text-3xl font-black">VERIFICACIÓN DE EQUIPO RX MÓVIL</h1>
              </div>
              <div className="text-3xl font-black bg-white text-slate-900 px-4 py-2 rounded-xl">RIC 56</div>
            </div>
          </div>

          <div className="p-4 md:p-5 border-b grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div><b>Equipo:</b> {datos.descripcion}</div>
            <div><b>Marca - Modelo:</b> {datos.marca_modelo || "-"}</div>
            <div><b>Nº de Serie:</b> {datos.numero_serie || "-"}</div>
            <div><b>Servicio:</b> {datos.servicio || "-"}</div>
            <div><b>Área:</b> {datos.area || "-"}</div>
            <div><b>Técnico:</b> {datos.tecnico || "-"}</div>
          </div>

          <div className="h-2 bg-gray-200"><div className="h-full bg-blue-600 transition-all" style={{ width: `${progreso}%` }} /></div>

          {error && <div className="m-4 p-3 bg-red-100 text-red-700 rounded-xl border border-red-200">{error}</div>}

          <div className="p-4 md:p-6">
            {etapa === 0 ? (
              <>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div><div className="text-sm text-gray-500">Punto {indiceActual + 1} de {puntos.length}</div><h2 className="text-xl md:text-2xl font-bold text-gray-800">{puntoActual.nombre}</h2></div>
                  <span className="text-sm font-semibold text-gray-500">{Math.round(progreso)}%</span>
                </div>

                <div className="bg-gray-50 border rounded-2xl p-4 md:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <BotonEstado tipo="CONFORME" activo={puntoActual.estado === "CONFORME"} onClick={() => cambiarEstado("CONFORME")} />
                    <BotonEstado tipo="NO CONFORME" activo={puntoActual.estado === "NO CONFORME"} onClick={() => cambiarEstado("NO CONFORME")} />
                    <BotonEstado tipo="NO APLICA" activo={puntoActual.estado === "NO APLICA"} onClick={() => cambiarEstado("NO APLICA")} />
                  </div>
                  <textarea className="w-full mt-4 border rounded-xl px-3 py-2" rows="3" placeholder="Observación del punto (opcional)" value={puntoActual.observaciones || ""} onChange={(e) => setPuntos((prev) => prev.map((p, i) => i === indiceActual ? { ...p, observaciones: e.target.value.toUpperCase() } : p))} />
                </div>

                {indiceActual === puntos.length - 1 && (
                  <div className="mt-4 bg-white border rounded-2xl p-4">
                    <div className="font-bold mb-2">Equipo en uso</div>
                    <div className="flex gap-3">
                      <button type="button" onClick={() => setEnUso("SI")} className={`px-5 py-2 rounded-xl border font-bold ${enUso === "SI" ? "bg-blue-600 text-white border-blue-600" : "bg-white"}`}>Sí</button>
                      <button type="button" onClick={() => setEnUso("NO")} className={`px-5 py-2 rounded-xl border font-bold ${enUso === "NO" ? "bg-blue-600 text-white border-blue-600" : "bg-white"}`}>No</button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Resumen de verificación</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3"><div className="text-sm text-green-700">Conformes</div><div className="text-2xl font-black text-green-700">{resumen.conformes}</div></div>
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3"><div className="text-sm text-red-700">No conformes</div><div className="text-2xl font-black text-red-700">{resumen.noConformes.length}</div></div>
                  <div className="bg-slate-50 border rounded-xl p-3"><div className="text-sm text-slate-600">No aplica</div><div className="text-2xl font-black text-slate-700">{resumen.noAplica}</div></div>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3"><div className="text-sm text-blue-700">Resultado</div><div className="text-lg font-black text-blue-800">{resumen.resultado}</div></div>
                </div>

                <div className="space-y-2 mb-4">
                  {puntos.map((p) => <div key={p.orden} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border rounded-xl p-3"><span className="font-semibold">{p.orden}. {p.nombre}</span><span className={`px-2 py-1 rounded-lg text-xs font-bold ${p.estado === "CONFORME" ? "bg-green-100 text-green-700" : p.estado === "NO CONFORME" ? "bg-red-100 text-red-700" : "bg-gray-200 text-gray-700"}`}>{p.estado}</span></div>)}
                </div>

                <textarea className="w-full border rounded-xl px-3 py-2" rows="4" placeholder="Observaciones generales" value={observaciones} onChange={(e) => setObservaciones(e.target.value.toUpperCase())} />
              </>
            )}

            <div className="mt-6 flex flex-wrap gap-2 justify-between">
              <button type="button" onClick={volver} className="px-4 py-2 rounded-xl bg-gray-200 text-gray-700 font-semibold">← Volver</button>
              <div className="flex flex-wrap gap-2">
                {etapa === 0 && <button type="button" onClick={siguiente} className="px-5 py-2 rounded-xl bg-blue-600 text-white font-semibold">Siguiente →</button>}
                {etapa === 1 && !ric56Id && <button type="button" disabled={guardando} onClick={guardar} className="px-5 py-2 rounded-xl bg-green-600 text-white font-semibold disabled:opacity-50">{guardando ? "Guardando..." : "Guardar RIC56"}</button>}
                {ric56Id && <button type="button" onClick={abrirPDF} className="px-5 py-2 rounded-xl bg-slate-700 text-white font-semibold">Ver PDF</button>}
                {ric56Id && <button type="button" disabled={enviandoDrive} onClick={enviarDrive} className="px-5 py-2 rounded-xl bg-blue-700 text-white font-semibold disabled:opacity-50">{enviandoDrive ? "Enviando..." : "Enviar a Drive"}</button>}
                {ric56Id && !tareaFinalizada && <button type="button" onClick={() => setMostrarFinalizar(true)} className="px-5 py-2 rounded-xl bg-amber-600 text-white font-semibold">Finalizar mantenimiento</button>}
                {tareaFinalizada && <button type="button" onClick={() => setVista("equipos")} className="px-5 py-2 rounded-xl bg-green-700 text-white font-semibold">Volver a Equipos</button>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {mostrarFinalizar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5">
            <h2 className="text-xl font-bold mb-3">Estado final del equipo</h2>
            <select className="w-full border rounded-xl px-3 py-2 mb-4" value={estadoFinal} onChange={(e) => setEstadoFinal(e.target.value)}>
              <option value="">Seleccionar estado</option>
              {estados.map((e, i) => { const valor = e.estado || e.nombre || e; return <option key={`${valor}-${i}`} value={valor}>{valor}</option>; })}
            </select>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setMostrarFinalizar(false)} className="px-4 py-2 rounded-xl bg-gray-200">Cancelar</button>
              <button type="button" disabled={finalizando} onClick={finalizar} className="px-4 py-2 rounded-xl bg-green-600 text-white font-semibold disabled:opacity-50">{finalizando ? "Finalizando..." : "Finalizar"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
