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

const crearPuntos = () => PUNTOS.map((nombre, i) => ({
  orden: i + 1,
  nombre,
  estado: "",
  observaciones: ""
}));

const fechaHoraLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
};

function BotonEstado({ activo, tipo, onClick }) {
  const clases = tipo === "CONFORME"
    ? activo
      ? "bg-green-600 text-white border-green-600"
      : "bg-white text-green-700 border-green-300 hover:bg-green-50"
    : tipo === "NO CONFORME"
      ? activo
        ? "bg-red-600 text-white border-red-600"
        : "bg-white text-red-700 border-red-300 hover:bg-red-50"
      : activo
        ? "bg-gray-600 text-white border-gray-600"
        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 border rounded-xl p-3 font-semibold transition ${clases}`}
    >
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
  const [datos, setDatos] = useState({
    ric01_id: "",
    equipo_id: "",
    numero_serie: "",
    descripcion: "",
    marca_modelo: "",
    area: "",
    servicio: "",
    sub_servicio: "",
    encargado: "",
    tecnico: personal?.nombre || ""
  });
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
    fetch(API_URL.Estados)
      .then((r) => r.json())
      .then((d) => setEstados(Array.isArray(d) ? d : []))
      .catch(() => {});
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
    localStorage.setItem(
      claveBorrador(datos.ric01_id),
      JSON.stringify({ etapa, indiceActual, puntos, enUso, observaciones })
    );
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
  const progreso = etapa === 1
    ? 100
    : ((indiceActual + 1) / puntos.length) * 100;

  const cambiarEstado = (estado) => {
    setPuntos((prev) => prev.map((p, i) =>
      i === indiceActual ? { ...p, estado } : p
    ));
  };

  const siguiente = () => {
    if (!puntoActual?.estado) {
      alert("Seleccione Conforme, No conforme o No aplica antes de continuar.");
      return;
    }

    if (indiceActual < puntos.length - 1) {
      setIndiceActual((prev) => prev + 1);
      return;
    }

    if (!enUso) {
      alert("Indique si el equipo se encuentra en uso.");
      return;
    }

    setEtapa(1);
  };

  const volver = () => {
    if (etapa === 1) {
      setEtapa(0);
      return;
    }

    if (indiceActual > 0) {
      setIndiceActual((prev) => prev - 1);
      return;
    }

    setVista("equipos");
  };

  const cancelar = async () => {
    const confirmar = window.confirm(
      "¿Desea cancelar el mantenimiento? Se eliminará la tarea creada y se perderán todos los datos ingresados."
    );

    if (!confirmar) return;

    try {
      const tareaRaw = localStorage.getItem("tareaActiva");
      const tarea = tareaRaw ? JSON.parse(tareaRaw) : null;
      const tareaId = tarea?.id || tarea?.ric01_id || datos.ric01_id;

      if (tareaId && !ric56Id) {
        const res = await fetch(`${API_URL.Ric01}/${tareaId}/cancelar-preventivo`, {
          method: "DELETE"
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data.error || "No se pudo eliminar la tarea creada.");
        }
      }

      if (datos.ric01_id) {
        localStorage.removeItem(claveBorrador(datos.ric01_id));
      }

      localStorage.removeItem("tareaActiva");
      setVista("equipos");
    } catch (error) {
      console.error("Error cancelando RIC56:", error);
      alert(error.message || "No se pudo cancelar el mantenimiento.");
    }
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
      alert("Mantenimiento preventivo guardado correctamente ✅");
    } catch (e) {
      setError(e.message || "Error guardando RIC56");
    } finally {
      setGuardando(false);
    }
  };

  const abrirPDF = () => {
    if (!ric56Id) return alert("Primero debe guardar el mantenimiento.");
    window.open(`${API_URL.Ric56}/${ric56Id}/pdf`, "_blank");
  };

  const enviarDrive = async () => {
    if (!ric56Id) return alert("Primero debe guardar el mantenimiento.");
    setEnviandoDrive(true);

    try {
      const r = await fetch(`${API_URL.Ric56}/${ric56Id}/drive`, { method: "POST" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "No se pudo enviar a Drive");
      alert("✅ PDF enviado a Google Drive");
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
        body: JSON.stringify({
          fecha_fin: fechaHoraLocal(),
          estado: estadoFinal,
          numero_serie: datos.numero_serie,
          usuario: datos.tecnico
        })
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

  if (cargando) {
    return (
      <div className="p-6 text-center">
        <p className="text-lg">⏳ Cargando datos del equipo...</p>
      </div>
    );
  }

  if (error && !datos.numero_serie) {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <div className="bg-red-100 text-red-700 p-4 rounded-xl">⚠️ {error}</div>
        <button onClick={() => setVista("equipos")} className="w-full bg-gray-500 text-white rounded-xl p-3 mt-4">← Volver</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-50 bg-white shadow">
        <div className="max-w-xl mx-auto p-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <p className="font-bold">RIC56 - MP Equipo RX Móvil</p>
            <span>{ETAPAS[etapa]}</span>
            <span>{etapa + 1} / {ETAPAS.length}</span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progreso}%` }}
            />
          </div>
        </div>
      </div>

      <div className="p-4 max-w-xl mx-auto pb-10">
        <div className="bg-gray-100 rounded-xl p-3 mb-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-bold">{datos.descripcion}</p>
              <p className="text-sm text-gray-600">{datos.marca_modelo}</p>
            </div>

            <div className="text-right text-xs">
              <p><b>Serie:</b> {datos.numero_serie}</p>
              <p><b>Área:</b> {datos.area}</p>
              <p><b>Servicio:</b> {datos.servicio}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-xl mb-4">⚠️ {error}</div>
        )}

        {etapa === 0 && (
          <div className="bg-white rounded-xl shadow p-4">
            <h2 className="text-xl font-bold mb-2">1. Verificación funcional</h2>

            <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3 mb-4">
              Verifique cada punto del equipo y seleccione Conforme, No conforme o No aplica según corresponda.
            </p>

            <div className="bg-gray-100 rounded-xl p-3 mb-4 text-center">
              <p className="text-sm text-gray-500">Punto de verificación</p>
              <p className="text-2xl font-bold">{indiceActual + 1} / {puntos.length}</p>
              <p className="text-xl font-bold mt-1">{puntoActual.nombre}</p>
            </div>

            <div className="flex gap-2">
              <BotonEstado
                tipo="CONFORME"
                activo={puntoActual.estado === "CONFORME"}
                onClick={() => cambiarEstado("CONFORME")}
              />
              <BotonEstado
                tipo="NO CONFORME"
                activo={puntoActual.estado === "NO CONFORME"}
                onClick={() => cambiarEstado("NO CONFORME")}
              />
              <BotonEstado
                tipo="NO APLICA"
                activo={puntoActual.estado === "NO APLICA"}
                onClick={() => cambiarEstado("NO APLICA")}
              />
            </div>

            <div className="mt-5">
              <label className="font-semibold block mb-2">Observaciones</label>
              <textarea
                rows={4}
                value={puntoActual.observaciones || ""}
                onChange={(e) => setPuntos((prev) => prev.map((p, i) =>
                  i === indiceActual ? { ...p, observaciones: e.target.value } : p
                ))}
                placeholder="Ingrese observaciones de la verificación..."
                className="w-full border rounded-xl p-3"
              />
            </div>

            {indiceActual === puntos.length - 1 && (
              <div className="mt-5">
                <label className="font-semibold block mb-2">Equipo en uso</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEnUso("SI")}
                    className={`flex-1 rounded-xl p-3 border font-semibold ${enUso === "SI" ? "bg-blue-600 text-white border-blue-600" : "bg-white"}`}
                  >
                    Sí
                  </button>
                  <button
                    type="button"
                    onClick={() => setEnUso("NO")}
                    className={`flex-1 rounded-xl p-3 border font-semibold ${enUso === "NO" ? "bg-blue-600 text-white border-blue-600" : "bg-white"}`}
                  >
                    No
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-6">
              <button onClick={volver} className="flex-1 bg-gray-500 text-white rounded-xl p-3">← Volver</button>
              <button onClick={cancelar} className="flex-1 bg-red-500 text-white rounded-xl p-3">Cancelar</button>
              <button
                onClick={siguiente}
                disabled={!puntoActual.estado}
                className="flex-1 bg-blue-600 disabled:bg-gray-300 text-white rounded-xl p-3"
              >
                {indiceActual === puntos.length - 1 ? "Resumen →" : "Aceptar →"}
              </button>
            </div>
          </div>
        )}

        {etapa === 1 && (
          <div className="bg-white rounded-xl shadow p-4">
            <h2 className="text-xl font-bold mb-2">2. Resumen</h2>

            <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3 mb-4">
              Revise los resultados antes de guardar el protocolo.
            </p>

            <div className={`rounded-xl p-4 mb-4 text-center ${resumen.resultado === "CONFORME" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              <p className="text-sm font-semibold">Resultado general</p>
              <p className="text-2xl font-bold">{resumen.resultado}</p>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4 text-center">
              <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                <p className="text-xs text-gray-500">Conformes</p>
                <p className="text-xl font-bold text-green-700">{resumen.conformes}</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-xs text-gray-500">No conformes</p>
                <p className="text-xl font-bold text-red-700">{resumen.noConformes.length}</p>
              </div>
              <div className="bg-gray-100 border rounded-xl p-3">
                <p className="text-xs text-gray-500">No aplica</p>
                <p className="text-xl font-bold text-gray-700">{resumen.noAplica}</p>
              </div>
            </div>

            <div className="space-y-2 mb-5">
              {puntos.map((p) => (
                <div key={p.orden} className="border rounded-xl p-3 flex justify-between items-center gap-3">
                  <span className="text-sm font-semibold">{p.orden}. {p.nombre}</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg whitespace-nowrap ${
                    p.estado === "CONFORME"
                      ? "bg-green-100 text-green-700"
                      : p.estado === "NO CONFORME"
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-200 text-gray-700"
                  }`}>
                    {p.estado}
                  </span>
                </div>
              ))}
            </div>

            <div className="mb-5">
              <label className="font-semibold block mb-2">Observaciones generales</label>
              <textarea
                rows={4}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Ingrese observaciones generales..."
                className="w-full border rounded-xl p-3"
              />
            </div>

            {!ric56Id ? (
              <div className="flex gap-2 mt-6">
                <button onClick={volver} className="flex-1 bg-gray-500 text-white rounded-xl p-3">← Volver</button>
                <button onClick={cancelar} className="flex-1 bg-red-500 text-white rounded-xl p-3">Cancelar</button>
                <button
                  onClick={guardar}
                  disabled={guardando}
                  className="flex-1 bg-green-600 disabled:bg-gray-300 text-white rounded-xl p-3"
                >
                  {guardando ? "Guardando..." : "Guardar"}
                </button>
              </div>
            ) : (
              <div className="space-y-2 mt-6">
                <button onClick={abrirPDF} className="w-full bg-red-600 text-white rounded-xl p-3">📄 Ver PDF</button>
                <button
                  onClick={enviarDrive}
                  disabled={enviandoDrive}
                  className="w-full bg-blue-600 disabled:bg-gray-300 text-white rounded-xl p-3"
                >
                  {enviandoDrive ? "Enviando..." : "☁️ Enviar a Google Drive"}
                </button>
                {!tareaFinalizada && (
                  <button onClick={() => setMostrarFinalizar(true)} className="w-full bg-green-600 text-white rounded-xl p-3">✅ Finalizar mantenimiento</button>
                )}
                {tareaFinalizada && (
                  <button onClick={() => setVista("equipos")} className="w-full bg-gray-500 text-white rounded-xl p-3">← Volver a Equipos</button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {mostrarFinalizar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5">
            <h2 className="text-lg font-bold mb-2">Finalizar mantenimiento</h2>
            <p className="text-sm text-gray-600 mb-4">¿En qué estado queda el equipo?</p>

            <select
              className="w-full border rounded-xl p-3 mb-4"
              value={estadoFinal}
              onChange={(e) => setEstadoFinal(e.target.value)}
            >
              <option value="">Seleccionar estado</option>
              {estados.map((e, i) => {
                const valor = e.estado || e.nombre || e;
                return <option key={`${valor}-${i}`} value={valor}>{valor}</option>;
              })}
            </select>

            <div className="flex gap-2">
              <button onClick={() => setMostrarFinalizar(false)} className="flex-1 bg-gray-500 text-white rounded-xl p-3">Cancelar</button>
              <button
                onClick={finalizar}
                disabled={finalizando}
                className="flex-1 bg-green-600 disabled:bg-gray-300 text-white rounded-xl p-3"
              >
                {finalizando ? "Finalizando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
