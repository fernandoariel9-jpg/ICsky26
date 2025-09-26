import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";

const API_URL = "https://sky26.onrender.com/tareas";

export default function Supervisor() {
  const [tareas, setTareas] = useState([]);
  const [modalImagen, setModalImagen] = useState(null);

  useEffect(() => {
    fetchTareas();
  }, []);

  const fetchTareas = async () => {
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setTareas(data.filter((t) => !t.fin));
    } catch {
      toast.error("Error al cargar tareas");
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-center mb-4">📋 Panel de Supervisión</h1>
      <p className="text-center mb-4 text-red-600 font-semibold">
        Tareas pendientes: {tareas.length}
      </p>

      <ul className="space-y-3">
        {tareas.map((t) => (
          <li key={t.id} className="p-3 rounded-xl shadow-sm bg-yellow-100 flex items-center space-x-3">
            {t.imagen && (
              <img
                src={`data:image/jpeg;base64,${t.imagen}`}
                alt="Foto"
                className="w-12 h-12 rounded-full object-cover cursor-pointer"
                onClick={() => setModalImagen(t.imagen)}
              />
            )}
            <div>
              <p>
                <span className="font-bold text-gray-700">#{t.id}</span> {t.usuario}: {t.tarea} 🔹
              </p>
              <p className="text-sm text-gray-500">
                Fecha: {new Date(t.fecha).toLocaleString()}
              </p>
            </div>
          </li>
        ))}
      </ul>

      {modalImagen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
          onClick={() => setModalImagen(null)}
        >
          <img
            src={`data:image/jpeg;base64,${modalImagen}`}
            alt="Ampliada"
            className="max-w-full max-h-full rounded-xl shadow-lg"
          />
        </div>
      )}
    </div>
  );
}
