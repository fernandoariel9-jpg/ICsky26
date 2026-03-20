import { useState } from "react";
import { API_URL } from "./config";

export default function Equipos({ setVista }) {
  const [serie, setSerie] = useState("");
  const [equipo, setEquipo] = useState(null);
  const [error, setError] = useState("");

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
          <p><b>Equipo:</b> {equipo.marca_modelo}</p>
          <p><b>Serie:</b> {equipo.numero_serie}</p>
          <p><b>Servicio:</b> {equipo.servicio}</p>
          <p><b>Área:</b> {equipo.area}</p>
          <p><b>Estado:</b> {equipo.estado}</p>
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
