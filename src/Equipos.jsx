import { useState } from "react";
import { API_URL } from "./config";

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

  const guardarMantenimiento = async () => {
  try {
    const fechaLocal = new Date().toISOString().slice(0, 19).replace("T", " ");

    const res = await fetch(API_URL.Ric01, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        usuario: personal.nombre, // o el campo que uses
        fecha: fechaLocal,
        tarea: observaciones,
        diagnostico: diagnosticoSeleccionado,
        tipo_mantenimiento: tipoMantenimiento,
        descripcion: equipo.descripcion,
        numero_serie: equipo.numero_serie,
        area: personal.area,
        servicio: equipo.servicio,
        subservicio: equipo.sub_servicio,
        asignado: personal.nombre,
        solicitado_por: personal.nombre,
        origen: "interno"
      })
    });

    const data = await res.json(); // 👈 AGREGAR

    console.log("RESPUESTA BACKEND:", data); // 👈 CLAVE

    if (!res.ok) {
      throw new Error(data.error || "Error desconocido");
    }

    alert("Mantenimiento guardado ✅");

  } catch (error) {
    console.error("ERROR COMPLETO:", error); // 👈 CLAVE
    alert("Error al guardar ❌");
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
{equipo && (
  <div className="bg-white shadow rounded-xl p-3 mt-3">
    <p><b>Equipo:</b> {equipo.descripcion}</p>
    <p><b>Marca:</b> {equipo.marca_modelo}</p>
    <p><b>Serie:</b> {equipo.numero_serie}</p>
    <p><b>Servicio:</b> {equipo.servicio}</p>
    <p><b>Área:</b> {equipo.area}</p>
    <p><b>Estado:</b> {equipo.estado}</p>
    <p><b>Último mantenimiento:</b> {equipo.ultimo_mant}</p>

    <button
      onClick={() => setMostrarForm(true)}
      className="bg-blue-500 text-white px-4 py-2 rounded-xl w-full mt-3"
    >
      🛠️ Iniciar mantenimiento
    </button>
  </div>
)}

{/* Error */}
{error && (
  <p className="text-red-500 mt-3">{error}</p>
)}

      {mostrarForm && (
  <div className="bg-gray-100 p-3 rounded-xl mt-3">

    {/* Tipo de mantenimiento */}
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

    {/* Diagnóstico SOLO si es correctivo */}
    {tipoMantenimiento === "Correctivo" && (
      <>
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

        {/* Observaciones */}
        <textarea
          placeholder="Observaciones"
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          className="w-full border p-2 rounded-xl mb-2"
        />
      </>
    )}

    {/* Descripción (general) */}
    <textarea
      placeholder="Descripción del mantenimiento"
      value={descripcion}
      onChange={(e) => setDescripcion(e.target.value)}
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
