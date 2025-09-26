// src/Supervisor.js
import React from "react";
import PanelPendientes from "./PanelPendientes";

function Supervisor() {
  const tareasEjemplo = ["Revisar equipo", "Instalar software", "Revisar red"];

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">🔐 Panel de Supervisor</h1>
      <PanelPendientes tareas={tareasEjemplo} />
    </div>
  );
}

export default Supervisor;
