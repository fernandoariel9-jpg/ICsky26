import React, { useState, useEffect } from "react";

const API_URL = "http://192.168.2.101:4000/tareas"; // cambia según tu servidor

function PanelPendientes() {
  const [tareas, setTareas] = useState([]);

  useEffect(() => {
    fetchTareas();
    const interval = setInterval(fetchTareas, 5000); // refresca cada 5 segundos
    return () => clearInterval(interval);
  }, []);

  const fetchTareas = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      const pendientes = data.filter(t => !t.fin);
      setTareas(pendientes.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)));
    } catch (err) {
      console.error("Error al cargar tareas pendientes:", err);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto mt-4">
      {/* Contador */}
      <div className="mb-4 text-center">
        <h2 className="text-2xl font-bold">📋 Panel de Tareas Pendientes</h2>
        <p className="text-lg font-semibold text-red-600 mt-2">
          Total pendientes: {tareas.length}
        </p>
      </div>

      {/* Lista de tareas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {tareas.length === 0 && (
          <p className="text-center text-gray-500 col-span-full">No hay tareas pendientes</p>
        )}
        {tareas.map(t => (
          <div key={t.id} className="p-4 bg-yellow-100 rounded-2xl shadow-md flex flex-col">
            <div className="flex justify-between items-start">
              <p className="font-bold text-gray-700">#{t.id} - {t.usuario}</p>
            </div>
            <p className="mt-2 text-gray-800">{t.tarea}</p>
            <p className="mt-1 text-sm text-gray-500">Fecha: {new Date(t.fecha).toLocaleString()}</p>
            {t.imagen && (
              <img
                src={`data:image/jpeg;base64,${t.imagen}`}
                alt="Foto"
                className="mt-2 w-28 h-28 rounded object-cover self-center"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default PanelPendientes;