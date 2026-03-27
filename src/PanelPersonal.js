import { useState } from "react";
import TareasPersonal from "./TareasPersonal";
import Equipos from "./Equipos";

export default function PanelPersonal({ personal, onLogout }) {
  const [vista, setVista] = useState("tareas");

  return (
    <>
      {vista === "tareas" && (
        <TareasPersonal
          personal={personal}
          onLogout={onLogout}
          setVista={setVista}
        />
      )}

      {vista === "equipos" && (
  <Equipos 
    setVista={setVista} 
    personal={personal} 
  />
)}
      {vista === "seleccionarEquipo" && (
  <SeleccionEquipo setVista={setVista} />
)}
    </>
  );
}
