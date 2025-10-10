import React, { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { API_URL } from "./config";

const API_TAREAS = API_URL.Tareas;

export default function TareasPersonal({ personal, onLogout }) {
  const [tareas, setTareas] = useState([]);
  const [soluciones, setSoluciones] = useState({});
  const [imagenAmpliada, setImagenAmpliada] = useState(null);
  const [filtro, setFiltro] = useState("pendientes"); // 🔹 Nuevo estado para el filtro

  const fetchTareas = async () => {
    try {
      if (!personal || !personal.area) {
        console.warn("fetchTareas: personal o personal.area no definido, se omite petición");
        setTareas([]);
        return;
      }

      const areaParam = encodeURIComponent(personal.area);
      const url = `${API_TAREAS}/${areaParam}`;
      console.log("GET", url);
      const res = await fetch(url);
      if (!res.ok) throw new Error("Error HTTP " + res.status);
      const data = await res.json();
      setTareas(data);
    } catch (err) {
      console.error("Error al cargar tareas:", err);
      toast.error("Error al cargar tareas ❌");
    }
  };

  useEffect(() => {
    fetchTareas();
  }, [personal]);

  const handleSolucionChange = (id, value) => {
    setSoluciones((prev) => ({ ...prev, [id]: value }));
  };

  const handleCompletar = async (id) => {
    try {
      const solucion = soluciones[id] || "";
      const url = `${API_TAREAS}/${id}/solucion`;
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ solucion, asignado: personal.nombre }),
      });

      if (!res.ok) throw new Error("Error HTTP " + res.status);

      setTareas((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, solucion, asignado: personal.nombre } : t
        )
      );

      toast.success("✅ Solución guardada");
    } catch (err) {
      console.error("Error al guardar solución", err);
      toast.error("❌ Error al guardar solución");
    }
  };

  // 🔹 Filtrado según el estado
  const tareasFiltradas = tareas.filter((t) => {
    if (filtro === "pendientes") return !t.solucion && !t.fin;
    if (filtro === "enProceso") return t.solucion && !t.fin;
    if (filtro === "finalizadas") return t.fin;
    return true;
  });

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <img src="/logosmall.png" alt="Logo" className="mx-auto mb-4 w-12 h-auto" />
      <h1 className="text-2xl font-bold mb-4 text-center">📌 Tareas</h1>

      {/* 🔹 Filtros con el mismo estilo que el panel de supervisión */}
      <div className="flex justify-center space-x-2 mb-4">
        <button
          onClick={() => setFiltro("pendientes")}
          className={`px-3 py-1 rounded-xl ${
            filtro === "pendientes"
              ? "bg-yellow-400 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          🕓 Pendientes
        </button>

        <button
          onClick={() => setFiltro("enProceso")}
          className={`px-3 py-1 rounded-xl ${
            filtro === "enProceso"
              ? "bg-blue-400 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          🧩 En proceso
        </button>

        <button
          onClick={() => setFiltro("finalizadas")}
          className={`px-3 py-1 rounded-xl ${
            filtro === "finalizadas"
              ? "bg-green-500 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          ✅ Finalizadas
        </button>
      </div>

      <div className="flex space-x-2 mb-4">
        <button
          onClick={fetchTareas}
          className="bg-blue-400 text-white px-3 py-1 rounded-xl text-sm"
        >
          🔄 Actualizar lista
        </button>
        <button
          onClick={onLogout}
          className="bg-red-500 text-white px-3 py-1 rounded-xl text-sm"
        >
          Cerrar sesión
        </button>
      </div>

      <ul className="space-y-4">
        {tareasFiltradas.map((tarea) => {
          const completada = !!tarea.solucion;
          return (
            <li key={tarea.id} className="border p-4 rounded-xl shadow bg-white">
              <p className="font-semibold">📝 {tarea.tarea}</p>
              <p className="text-sm text-gray-600">Usuario: {tarea.usuario}</p>

              {tarea.imagen && (
                <img
                  src={`data:image/jpeg;base64,${tarea.imagen}`}
                  alt="tarea"
                  className="w-32 h-32 object-cover mt-2 cursor-pointer rounded"
                  onClick={() =>
                    setImagenAmpliada(`data:image/jpeg;base64,${tarea.imagen}`)
                  }
                />
              )}

              <textarea
                className="w-full p-2 border rounded mt-2"
                placeholder="Escriba la solución..."
                value={soluciones[tarea.id] || tarea.solucion || ""}
                onChange={(e) => handleSolucionChange(tarea.id, e.target.value)}
                disabled={completada}
              />

              <button
                onClick={() => handleCompletar(tarea.id)}
                className={`mt-2 px-3 py-1 rounded text-white ${
                  completada ? "bg-gray-400 cursor-not-allowed" : "bg-green-500"
                }`}
                disabled={completada}
              >
                ✅ Completar
              </button>

              {completada && (
                <p className="mt-1 text-green-700 font-semibold">
                  Solución registrada
                </p>
              )}
            </li>
          );
        })}
      </ul>

      {imagenAmpliada && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setImagenAmpliada(null)}
        >
          <img
            src={imagenAmpliada}
            alt="ampliada"
            className="max-w-full max-h-full rounded-lg shadow-lg"
          />
        </div>
      )}

      <ToastContainer position="bottom-right" autoClose={2000} />
    </div>
  );
}
