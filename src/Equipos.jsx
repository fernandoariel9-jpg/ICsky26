import { useState } from "react";
import { API_URL } from "./config";
import { useEffect } from "react";

export default function Equipos({ setVista, personal }) {
  const [serie, setSerie] = useState("");
  const [equipo, setEquipo] = useState(null);
  const [error, setError] = useState("");
  const [mostrarForm, setMostrarForm] = useState(false);
  const [descripcion, setDescripcion] = useState("");
  const [tipoMantenimiento, setTipoMantenimiento] = useState("");
  const [diagnosticos, setDiagnosticos] = useState([]);
  const [diagnosticoSeleccionado, setDiagnosticoSeleccionado] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [estados, setEstados] = useState([]);
  const [mostrarFinalizar, setMostrarFinalizar] = useState(false);
  const [estadoFinal, setEstadoFinal] = useState("");
  const [historial, setHistorial] = useState([]);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

  useEffect(() => {
  fetchEstados();
}, []);

  useEffect(() => {
  const tareaGuardada = localStorage.getItem("tareaActiva");

  if (!tareaGuardada) return;

  const tarea = JSON.parse(tareaGuardada);

  console.log("Tarea activa:", tarea);

  if (tarea.numero_serie) {
    setSerie(tarea.numero_serie);
  }
}, []);

  useEffect(() => {
  if (serie) {
    buscarEquipo();
  }
}, [serie]);

  const fetchEstados = async () => {
  try {
    const res = await fetch(API_URL.Estados);
    const data = await res.json();
    setEstados(data);
  } catch (err) {
    console.error("Error cargando estados:", err);
  }
};

  const cambiarEstado = async (id, nuevoEstado) => {
  try {
    const res = await fetch(`${API_URL.Equipos}/${id}/estado`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
      estado: nuevoEstado,
      usuario: personal.nombre})
    });

    if (!res.ok) throw new Error("Error HTTP");

    const actualizado = await res.json();

    // ✅ actualizar equipo en pantalla
    setEquipo(actualizado);

  } catch (err) {
    console.error(err);
    alert("❌ Error al actualizar estado");
  }
};

   function formatTimestamp(ts) {
  if (!ts) return "";

  // Si ya viene en formato dd/mm/yyyy, devolvemos tal cual
  if (/^\d{2}\/\d{2}\/\d{4}/.test(ts)) return ts;

  // Si viene como "YYYY-MM-DD HH:mm[:ss]" (string que vamos a respetar como hora local guardada)
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(ts)) {
    const [fechaPart, horaPart] = ts.split(" ");
    const [year, month, day] = fechaPart.split("-").map(Number);
    const [hour, min, sec = "00"] = horaPart.split(":");
    return `${String(day).padStart(2,"0")}/${String(month).padStart(2,"0")}/${year}, ${String(hour).padStart(2,"0")}:${String(min).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
  }

  // Si viene como ISO (contiene "T"), la convertimos interpretando la fecha y formateamos en zona Argentina
  try {
    const d = new Date(ts);
    const opciones = {
      timeZone: "America/Argentina/Buenos_Aires",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    };
    const partes = new Intl.DateTimeFormat("es-AR", opciones).formatToParts(d);
    const get = (t) => (partes.find(p => p.type === t) || {}).value || "00";
    const dia = get("day"), mes = get("month"), año = get("year");
    const hora = get("hour"), min = get("minute"), seg = get("second");
    return `${dia}/${mes}/${año}, ${hora}:${min}:${seg}`;
  } catch {
    return String(ts);
  }
}

    function getFechaLocal() {
    const d = new Date();
    d.setSeconds(0, 0);
    const año = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const dia = String(d.getDate()).padStart(2, "0");
    const hora = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${año}-${mes}-${dia} ${hora}:${min}`;
  }

  const guardarMantenimiento = async () => {
  try {

    const tareaActiva = JSON.parse(
      localStorage.getItem("tareaActiva")
    );
    console.log("TAREA ACTIVA:", tareaActiva);

    const continuar =
      equipo?.estado?.toLowerCase() !== "activo" &&
      equipo?.mantenimiento_id;

    let res;

    // 🔧 CONTINUAR MANTENIMIENTO EXISTENTE
    if (continuar) {
      res = await fetch(
        `${API_URL.Ric01}/${equipo.mantenimiento_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            diagnostico: diagnosticoSeleccionado,
            descripcion: descripcion,
            solucion: observaciones,
            fecha_comp: getFechaLocal()
          })
        }
      );
    }

   // 🆕 INICIAR MANTENIMIENTO DESDE UNA TAREA EXISTENTE
else if (tareaActiva) {
  console.log("VOY A USAR EL ENDPOINT NUEVO");
    res = await fetch(
    `${API_URL.Ric01}/${tareaActiva.id}/iniciar-mantenimiento`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        diagnostico: diagnosticoSeleccionado,
        tipo_mantenimiento: tipoMantenimiento,

        descripcion: equipo.descripcion,
        marca_modelo: equipo.marca_modelo,
        numero_serie: equipo.numero_serie,

        servicio: equipo.servicio,
        subservicio: equipo.sub_servicio,

        asignado: personal.nombre,
        solucion: observaciones,
      }),
    }
  );
}

// 🆕 CREAR MANTENIMIENTO NUEVO (cuando NO viene de una tarea)
else {
  console.log("VOY A CREAR UNA TAREA NUEVA");
  res = await fetch(API_URL.Ric01, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      usuario: personal.nombre,

      fecha: getFechaLocal(),

      tarea: `Mantenimiento ${tipoMantenimiento} - ${equipo.descripcion} ${equipo.marca_modelo} - Serie: ${equipo.numero_serie}`,

      diagnostico: diagnosticoSeleccionado,
      tipo_mantenimiento: tipoMantenimiento,

      descripcion: equipo.descripcion,
      marca_modelo: equipo.marca_modelo,
      numero_serie: equipo.numero_serie,

      area: personal.area,
      servicio: equipo.servicio,
      subservicio: equipo.sub_servicio,

      asignado: personal.nombre,
      solicitado_por: personal.nombre,

      origen: "interno",

      solucion: observaciones
    })
  });
}

    const data = await res.json();

    if (!res.ok) {
      throw new Error(
        data.error || "Error desconocido"
      );
    }

    alert(
      continuar
        ? "Mantenimiento actualizado ✅"
        : "Mantenimiento iniciado ✅"
    );

    setMostrarForm(false);

    setTipoMantenimiento("");
    setDiagnosticoSeleccionado("");
    setObservaciones("");
    setDescripcion("");
    localStorage.removeItem("tareaActiva");
    setEquipo(null);
    setSerie("");

  } catch (error) {
    console.error("ERROR COMPLETO:", error);
    alert(error.message);
  }
};

  const finalizarMantenimiento = async () => {

  if (!estadoFinal) {
    return alert("Seleccione un estado para el equipo");
  }

  try {

    const fechaFin = new Date()
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");

    const res = await fetch(
      `${API_URL.Ric01}/finalizar/${equipo.mantenimiento_id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fecha_fin: fechaFin,
          estado: estadoFinal,
          numero_serie: equipo.numero_serie,
          usuario: personal.nombre
        })
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(
        data.error || "Error al finalizar mantenimiento"
      );
    }

    alert("✅ Mantenimiento finalizado");

    // cerrar modal
    setMostrarFinalizar(false);
    setEstadoFinal("");

    // limpiar formulario
    setMostrarForm(false);
    setTipoMantenimiento("");
    setDiagnosticoSeleccionado("");
    setObservaciones("");
    setDescripcion("");

    // limpiar equipo actual
    setEquipo(null);
    setSerie("");

    // eliminar tarea activa si existe
    localStorage.removeItem("tareaActiva");

  } catch (error) {
    console.error(error);
    alert(error.message);
  }
};
  
  const cargarDiagnosticos = async () => {
  try {
    const res = await fetch(API_URL.DiagnosticosRIC02);
    const data = await res.json();
    setDiagnosticos(data);
  } catch {
    alert("Error cargando diagnósticos");
  }
};

  const handleTipoChange = (value) => {
  setTipoMantenimiento(value);

  if (value === "Correctivo") {
    cargarDiagnosticos();
  }
};

  const buscarEquipo = async () => {
    if (!serie) return;

    try {
      const res = await fetch(`${API_URL.BuscarEquipo}/${serie}`);

      if (!res.ok) {
        throw new Error("No encontrado");
      }

      const data = await res.json();

setEquipo(data);
setError("");

// Si existe mantenimiento abierto
if (
  data.estado &&
  data.estado.toLowerCase() !== "activo" &&
  data.mantenimiento_id
) {
  setTipoMantenimiento(data.tipo_mantenimiento || "");
  setDiagnosticoSeleccionado(data.diagnostico || "");

  setMostrarForm(true);

  }

    } catch (err) {
      setEquipo(null);
      setError("Equipo no encontrado");
    }
  };

  const verHistorial = async () => {
  if (!equipo?.numero_serie) return;

  try {
    setCargandoHistorial(true);

    const res = await fetch(
      `${API_URL.HistorialEquipo}/${equipo.numero_serie}/historial`
    );

    if (!res.ok) {
      throw new Error("Error obteniendo historial");
    }

    const data = await res.json();

    setHistorial(data);
    setMostrarHistorial(true);

  } catch (err) {
    console.error(err);
    alert("No se pudo obtener el historial.");
  } finally {
    setCargandoHistorial(false);
  }
};

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">🔧 Búsqueda de Equipos</h1>

      {/* Input */}
      <input
        type="text"
        placeholder="Número de serie"
        value={serie}
        onChange={(e) => setSerie(e.target.value)}
        className="w-full border p-2 rounded-xl mb-3"
      />

      {/* Botón buscar */}
      <button
        onClick={buscarEquipo}
        className="bg-green-500 text-white px-4 py-2 rounded-xl w-full mb-3"
      >
        🔍 Buscar
      </button>

      {equipo && (
  <button
    onClick={verHistorial}
    className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl w-full"
  >
    📋 Historial del equipo
  </button>
)}

      {/* Resultado */}

{localStorage.getItem("tareaActiva") && (
  <div className="bg-yellow-100 p-2 rounded mb-3">
    🔧 Iniciando mantenimiento desde tarea
  </div>
)}
      
{equipo && (
  <div className="bg-white shadow rounded-xl p-3 mt-3">
    <p><b>Equipo:</b> {equipo.descripcion}</p>
    <p><b>Marca:</b> {equipo.marca_modelo}</p>
    <p><b>Serie:</b> {equipo.numero_serie}</p>
    <p><b>Servicio:</b> {equipo.servicio}</p>
    <p><b>Área:</b> {equipo.area}</p>
    <p><b>Estado:</b> {equipo.estado}</p>
    <div className="mt-2">
  <p className="text-sm font-semibold mb-1">Cambiar estado:</p>

  <select
    value={equipo.estado || ""}
    onChange={(e) => cambiarEstado(equipo.id, e.target.value)}
    className="w-full border rounded px-2 py-1 text-sm"
  >
    <option value="">Seleccionar estado</option>

    {estados.map((est) => (
      <option key={est.id} value={est.estado}>
        {est.estado}
      </option>
    ))}
  </select>
</div>
    <p><b>Último mantenimiento:</b> {equipo.ultimo_mant}</p>

    <button
  onClick={() => setMostrarForm(true)}
  className={`px-4 py-2 rounded-xl w-full mt-3 ${
    equipo.estado?.toLowerCase() !== "activo"
      ? "bg-yellow-500"
      : "bg-blue-500"
  } text-white`}
>
  {equipo.estado?.toLowerCase() !== "activo"
    ? "🔧 Continuar mantenimiento"
    : "🛠️ Iniciar mantenimiento"}
</button>
{equipo.estado?.toLowerCase() !== "activo" &&
  equipo.mantenimiento_id && (
    <div className="bg-yellow-50 border border-yellow-300 rounded p-2 mt-2 text-sm">
      <p>
        🔧 Mantenimiento abierto #{equipo.mantenimiento_id}
      </p>

      {equipo.tipo_mantenimiento && (
        <p>
          Tipo: {equipo.tipo_mantenimiento}
        </p>
      )}

      {equipo.diagnostico && (
        <p>
          Diagnóstico: {equipo.diagnostico}
        </p>
      )}
    </div>
)}
    </div>
)}

{/* Error */}
{error && (
  <p className="text-red-500 mt-3">{error}</p>
)}

     {mostrarForm && (
  <div className="bg-gray-100 p-3 rounded-xl mt-3">

     {/* NUEVO MANTENIMIENTO */}
    {!(
      equipo?.estado?.toLowerCase() !== "activo" &&
      equipo?.mantenimiento_id
    ) && (
      <select
        value={tipoMantenimiento}
        onChange={(e) => handleTipoChange(e.target.value)}
        className="w-full border p-2 rounded-xl mb-2"
      >
        <option value="">Seleccionar tipo</option>
        <option value="Correctivo">Correctivo</option>
        <option value="Preventivo">Preventivo</option>
        <option value="Verificación">Verificación</option>
      </select>
    )}

    {/* MANTENIMIENTO EXISTENTE */}
  {equipo?.estado?.toLowerCase() !== "activo" &&
  equipo?.mantenimiento_id && (
    <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-2">
      <p>
        🔧 Tipo de mantenimiento:
        <strong> {equipo.tipo_mantenimiento}</strong>
      </p>

      {equipo.diagnostico && (
        <p className="mt-1">
          📋 Diagnóstico:
          <strong> {equipo.diagnostico}</strong>
        </p>
      )}

      {equipo.fecha_inicio && (
        <p className="mt-1 text-sm text-gray-600">
          📅 Iniciado:
          <strong> {formatTimestamp(equipo.fecha_inicio)}</strong>
        </p>
      )}
    </div>
)}

   {/* Diagnóstico SOLO para mantenimiento NUEVO correctivo */}
{!(
  equipo?.estado?.toLowerCase() !== "activo" &&
  equipo?.mantenimiento_id
) && tipoMantenimiento === "Correctivo" && (
  <select
    value={diagnosticoSeleccionado}
    onChange={(e) => setDiagnosticoSeleccionado(e.target.value)}
    className="w-full border p-2 rounded-xl mb-2"
  >
    <option value="">Seleccionar diagnóstico</option>

    {diagnosticos.map((d, i) => (
      <option key={i} value={d.diagnostico}>
        {d.diagnostico}
      </option>
    ))}
  </select>
)}
    <textarea
  placeholder="Observaciones"
  value={observaciones}
  onChange={(e) => setObservaciones(e.target.value)}
  className="w-full border p-2 rounded-xl mb-2"
/>

    {/*<button
  onClick={() => setMostrarFinalizar(true)}
  className="bg-red-500 text-white px-4 py-2 rounded-xl w-full mt-2"
>
  ✅ Finalizar mantenimiento
</button>*/}

    <button
      onClick={guardarMantenimiento}
      className="bg-green-500 text-white px-4 py-2 rounded-xl w-full"
    >
      💾 Guardar
    </button>
  </div>
)}

      {mostrarHistorial && (
  <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">

    <div className="bg-white rounded-xl shadow-xl w-11/12 max-w-6xl max-h-[85vh] overflow-hidden">

      <div className="flex justify-between items-center p-4 border-b">

        <h2 className="text-xl font-bold">
          📋 Historial del equipo
        </h2>

        <button
          onClick={() => setMostrarHistorial(false)}
          className="text-red-600 font-bold"
        >
          ✖
        </button>

      </div>

      <div className="overflow-auto max-h-[70vh]">

        <table className="min-w-full text-sm">

          <thead className="bg-gray-100 sticky top-0">

            <tr>

              <th className="p-2 border">Fecha</th>

              <th className="p-2 border">Tipo</th>

              <th className="p-2 border">Solicitado por</th>

              <th className="p-2 border">Asignado</th>

              <th className="p-2 border">Diagnóstico</th>

              <th className="p-2 border">Solución</th>

              <th className="p-2 border">Calificación</th>

            </tr>

          </thead>

          <tbody>

            {historial.map((h) => (

              <tr key={h.id}>

                <td className="border p-2">
                  {formatTimestamp(h.fecha)}
                </td>

                <td className="border p-2">
                  {h.tipo_mantenimiento || "-"}
                </td>

                <td className="border p-2">
                  {h.solicitado_por || h.usuario}
                </td>

                <td className="border p-2">
                  {h.asignado || "-"}
                </td>

                <td className="border p-2 whitespace-pre-wrap">
                  {h.diagnostico || "-"}
                </td>

                <td className="border p-2 whitespace-pre-wrap">
                  {h.solucion || "-"}
                </td>

                <td className="border p-2 text-center">
                  {h.calificacion ?? "-"}
                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>

  </div>
)}

      {mostrarFinalizar && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-5 rounded-xl shadow-xl w-96">

      <h2 className="text-lg font-bold mb-4">
        Finalizar mantenimiento
      </h2>

      <p className="mb-2">
        ¿En qué estado queda el equipo?
      </p>

      <select
        value={estadoFinal}
        onChange={(e) => setEstadoFinal(e.target.value)}
        className="w-full border p-2 rounded mb-4"
      >
        <option value="">
          Seleccionar estado
        </option>

        {estados.map((est) => (
          <option
            key={est.id}
            value={est.estado}
          >
            {est.estado}
          </option>
        ))}
      </select>

      <div className="flex gap-2">

        <button
          onClick={() => {
            setMostrarFinalizar(false);
            setEstadoFinal("");
          }}
          className="flex-1 bg-gray-500 text-white py-2 rounded"
        >
          Cancelar
        </button>

        <button
          onClick={finalizarMantenimiento}
          className="flex-1 bg-green-600 text-white py-2 rounded"
        >
          Confirmar
        </button>

      </div>

    </div>
  </div>
)}

      {/* Volver */}
      <button
        onClick={() => setVista("tareas")}
        className="bg-gray-400 text-white px-4 py-2 rounded-xl w-full mt-4"
      >
        ← Volver
      </button>
    </div>
  );
}
