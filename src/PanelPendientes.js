// src/PanelPendientes.js
import React from "react";

function PanelPendientes({ tareas }) {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">📌 Panel de pendientes</h2>
      <ul className="space-y-2">
        {tareas.map((t, i) => (
          <li key={i} className="p-2 bg-gray-100 rounded">
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PanelPendientes;
