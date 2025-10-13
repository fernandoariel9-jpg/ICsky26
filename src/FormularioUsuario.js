import React, { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { API_URL } from "./config";

const API_TAREAS = API_URL.Tareas;

export default function FormularioUsuario({ usuario, onLogout }) {
  const [tareas, setTareas] = useState([]);
  const [filtro, setFiltro] = useState("todas");
  const [showPopup, setShowPopup] = useState(false);
  const [tareaSeleccionada, setTareaSeleccionada] = useState(null);
  const [rating, setRating] = useState(0);

  const fetchTareas = async () => {
    try {
      if (!usuario?.nombre) return;

      const url = `${API_TAREAS}/usuario/${encodeURIComponent(usuario.nombre)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Error HTTP " + res.status);
      const data = await res.json();
      setTareas(data);
    } catch (err) {
      console.error("Error al cargar tareas:", err);
      toast.error("❌ Error al cargar tareas");
    }
  };

  useEffect(() => {
    fetchTareas();
  }, [usuario]);

  const abrirPopup = (id) => {
    setTareaSeleccionada(id);
    setRating(0);
    setShowPopup(true);
  };

  const cerrarPopup = () => {
    setShowPopup(false);
    setTareaSeleccionada(null);
    setRating(0);
  };

  const enviarCalificacion = async () => {
    try {
      const res = await fetch(`${API_TAREAS}/${tareaSeleccionada}/calificacion`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ calificacion: rating }),
      });

      if (!res.ok) throw new Error("Error HTTP " + res.status);
      toast.success("⭐ Calificación enviada");
      cerrarPopup();
      fetchTareas();
    } catch (err) {
      console.error("Error al guardar calificación:", err);
      toast.error("❌ Error al guardar calificación");
    }
  };

  const tareasFiltradas =
    filtro === "todas"
      ? tareas
      : filtro === "pendientes"
      ? tareas.filter((t) => !t.solucion)
      : filtro === "finalizadas"
      ? tareas.filter((t) => t.solucion)
      : tareas;

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <img src="/logosmall.png" alt="Logo" className="mx-auto mb-4 w-12 h-auto" />

      <h1 className="text-2xl font-bold mb-4 text-center">
        📌 Pedidos de tareas de{" "}
        <span className="text-blue-700">
          {usuario?.nombre || usuario?.mail || "Usuario"}
        </span>
      </h1>

      {/* 🔹 Botones de acción */}
      <div className="flex justify-between mb-4">
        <button
          onClick={fetchTareas}
          className="bg-blue-500 text-white px-4 py-2 rounded-xl"
        >
          🔄 Actualizar lista
        </button>
        <button
          onClick={onLogout}
          className="bg-red-500 text-white px-4 py-2 rounded-xl"
        >
          🚪 Cerrar sesión
        </button>
      </div>

      {/* 🔹 Filtros */}
      <div className="flex justify-center space-x-2 mb-4">
        <button
          onClick={() => setFiltro("todas")}
          className={`px-3 py-1 rounded-xl ${
            filtro === "todas" ? "bg-gray-700 text-white" : "bg-gray-200"
          }`}
        >
          📋 Todas
        </button>
        <button
          onClick={() => setFiltro("pendientes")}
          className={`px-3 py-1 rounded-xl ${
            filtro === "pendientes" ? "bg-yellow-500 text-white" : "bg-gray-200"
          }`}
        >
          🕓 Pendientes
        </button>
        <button
          onClick={() => setFiltro("finalizadas")}
          className={`px-3 py-1 rounded-xl ${
            filtro === "finalizadas" ? "bg-green-600 text-white" : "bg-gray-200"
          }`}
        >
          ✅ Finalizadas
        </button>
      </div>

      {/* 🔹 Lista de tareas */}
      <ul className="space-y-4">
        {tareasFiltradas.length > 0 ? (
          tareasFiltradas.map((t) => (
            <li key={t.id} className="border p-4 rounded-xl shadow bg-white">
              <p className="font-semibold text-gray-800">{t.tarea}</p>
              <p className="text-sm text-gray-600">
                Estado: {t.solucion ? "Finalizada" : "Pendiente"}
              </p>
              <p className="text-sm text-gray-600">Área: {t.area}</p>
              <p className="text-sm text-gray-600">Servicio: {t.servicio}</p>
              <p className="text-sm text-gray-600">
                Subservicio: {t.subservicio}
              </p>

              {t.solucion && (
                <button
                  onClick={() => abrirPopup(t.id)}
                  className="mt-3 bg-yellow-400 text-white px-3 py-1 rounded"
                >
                  ⭐ Calificar
                </button>
              )}
            </li>
          ))
        ) : (
          <p className="text-center text-gray-500">No hay tareas disponibles.</p>
        )}
      </ul>

      {/* 🔹 Popup de calificación */}
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl text-center">
            <h2 className="text-lg font-bold mb-4">Calificar solución</h2>
            <div className="flex justify-center space-x-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  onClick={() => setRating(star)}
                  className={`cursor-pointer text-3xl ${
                    star <= rating ? "text-yellow-400" : "text-gray-300"
                  }`}
                >
                  ★
                </span>
              ))}
            </div>
            <div className="flex justify-center space-x-3">
              <button
                onClick={enviarCalificacion}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Enviar
              </button>
              <button
                onClick={cerrarPopup}
                className="bg-gray-400 text-white px-4 py-2 rounded"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="bottom-right" autoClose={2000} />
    </div>
  );
}