import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";

const API_URL = "https://sky26.onrender.com/tareas";

export default function PanelPendientes() {
  const [tareas, setTareas] = useState([]);

  useEffect(() => {
    fetchTareas();
  }, []);

  const fetchTareas = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setTareas(data.filter((t) => !t.fin));
    } catch {
      toast.error("Error al cargar pendientes");
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-center mb-4">
        📋 Panel de Pendientes
      </h1>
      <ul className="space-y-3">
        {tareas.map((t) => (
          <li
            key={t.id}
            className="p-3 rounded-xl shadow-sm bg-blue-100 flex items-center space-x-3"
          >
            {t.imagen && (
              <img
                src={`data:image/jpeg;base64,${t.imagen}`}
                alt="Foto"
                className="w-12 h-12 rounded-full object-cover"
              />
            )}
            <div>
              <p>
                <span className="font-bold">#{t.id}</span> {t.usuario}: {t.tarea}
              </p>
              <p className="text-sm text-gray-500">
                {new Date(t.fecha).toLocaleString()}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
