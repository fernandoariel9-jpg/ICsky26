// PanelPendientes.js
import React, { useEffect, useState } from "react";

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
      setTareas(data.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)));
    } catch (err) {
      console.error("Error al obtener tareas", err);
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto bg-white shadow rounded-xl mt-6">
      <h2 className="text-xl font-bold mb-4">📊 Panel de Supervisión</h2>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2 border">ID</th>
            <th className="p-2 border">Usuario</th>
            <th className="p-2 border">Tarea</th>
            <th className="p-2 border">Finalizada</th>
            <th className="p-2 border">Fecha</th>
          </tr>
        </thead>
        <tbody>
          {tareas.map((t) => (
            <tr key={t.id} className="text-center">
              <td className="border p-1">{t.id}</td>
              <td className="border p-1">{t.usuario}</td>
              <td className="border p-1">{t.tarea}</td>
              <td className="border p-1">{t.fin ? "✅" : "❌"}</td>
              <td className="border p-1">
                {new Date(t.fecha).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
