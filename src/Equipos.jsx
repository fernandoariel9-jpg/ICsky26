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

  useEffect(() => {
  fetchEstados();
}, []);

  useEffect(() => {
  const tareaGuardada = localStorage.getItem("tareaActiva");

  if (tareaGuardada) {
    const tarea = JSON.parse(tareaGuardada);

    // 👉 podés mostrar info de la tarea si querés
    console.log("Tarea activa:", tarea);
  }
}, []);

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
      body: JSON.stringify({ estado: nuevoEstado }),
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

  const guardarMantenimiento = async () => {
  try {
    const fechaLocal = new Date()
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");

    const tareaActiva = JSON.parse(
      localStorage.getItem("tareaActiva")
    );

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
            descripcion,
            solucion: observaciones
          })
        }
      );
    }

    // 🆕 CREAR NUEVO MANTENIMIENTO
    else {
      res = await fetch(API_URL.Ric01, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          usuario: tareaActiva
            ? tareaActiva.usuario
            : personal.nombre,

          fecha: fechaLocal,

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
          tarea_id: tareaActiva?.id || null,

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

    setEquipo(null);
    setSerie("");

  } catch (error) {
    console.error("ERROR COMPLETO:", error);
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
            <strong> {tipoMantenimiento}</strong>
          </p>
        </div>
    )}

    {/* Diagnóstico SOLO si es correctivo */}
    {tipoMantenimiento === "Correctivo" && (
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

    <button
      onClick={guardarMantenimiento}
      className="bg-green-500 text-white px-4 py-2 rounded-xl w-full"
    >
      💾 Guardar
    </button>
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
