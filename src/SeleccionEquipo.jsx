import { useState, useEffect } from "react";
import { API_URL } from "./config";

export default function SeleccionEquipo({ setVista }) {
  const [serie, setSerie] = useState("");
  const [equipo, setEquipo] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const tareaGuardada = localStorage.getItem("tareaActiva");

    if (!tareaGuardada) {
      alert("No hay tarea activa");
      setVista("tareas");
    }
  }, []);

  const buscarEquipo = async () => {
    if (!serie) return;

    try {
      const res = await fetch(`${API_URL.BuscarEquipo}/${serie}`);

      if (!res.ok) throw new Error();

      const data = await res.json();
      setEquipo(data);
      setError("");
    } catch {
      setEquipo(null);
      setError("Equipo no encontrado");
    }
  };

  const seleccionarEquipo = async () => {
    try {
      const tareaActiva = JSON.parse(localStorage.getItem("tareaActiva"));

      await fetch(`${API_URL.Ric01}/asignar-equipo/${tareaActiva.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          descripcion: equipo.descripcion,
          marca_modelo: equipo.marca_modelo,
          numero_serie: equipo.numero_serie,
          servicio: equipo.servicio,
          subservicio: equipo.sub_servicio,
          area: equipo.area
        })
      });

      alert("Equipo asignado ✅");

      localStorage.removeItem("tareaActiva");
      setVista("tareas");

    } catch (error) {
      console.error(error);
      alert("Error al asignar equipo");
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">🔎 Seleccionar Equipo</h1>

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

      {/* Aviso tarea activa */}
      {localStorage.getItem("tareaActiva") && (
        <div className="bg-yellow-100 p-2 rounded mb-3">
          📋 Asignando equipo a tarea
        </div>
      )}

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
            onClick={seleccionarEquipo}
            className="bg-blue-500 text-white px-4 py-2 rounded-xl w-full mt-3"
          >
            ✅ Seleccionar equipo
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-red-500 mt-3">{error}</p>
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
