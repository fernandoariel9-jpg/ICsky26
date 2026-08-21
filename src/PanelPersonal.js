import { useState } from "react";
import TareasPersonal from "./TareasPersonal";
import Equipos from "./Equipos";
import SeleccionEquipo from "./SeleccionEquipo";
import NuevoEquipo from "./NuevoEquipo";
import RIC29 from "./RIC29";
import RIC37 from "./RIC37";

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
        <SeleccionEquipo
          setVista={setVista}
        />
      )}

      {vista === "nuevoEquipo" && (
        <NuevoEquipo
          setVista={setVista}
        />
      )}

      {vista === "ric29" && (
        <RIC29
          setVista={setVista}
          personal={personal}
        />
      )}

      {vista === "ric37" && (
        <RIC37
          setVista={setVista}
          personal={personal}
        />
      )}
    </>
  );
}
