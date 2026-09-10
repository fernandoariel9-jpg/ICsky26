import { useState } from "react";
import TareasPersonal from "./TareasPersonal";
import Equipos from "./Equipos";
import SeleccionEquipo from "./SeleccionEquipo";
import NuevoEquipo from "./NuevoEquipo";
import RIC25 from "./RIC25";
import RIC29 from "./RIC29";
import RIC37 from "./RIC37";
import RIC44 from "./RIC44";

export default function PanelPersonal({ personal, onLogout }) {
  const [vista, setVista] = useState("tareas");

  return (
    <>
      {vista === "tareas" && (
        <>
          <TareasPersonal
            personal={personal}
            onLogout={onLogout}
            setVista={setVista}
          />
          <div className="fixed bottom-4 right-4 z-40">
            <button
              onClick={() => setVista("ric25")}
              className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-3 rounded-xl shadow-lg font-semibold"
            >
              🫁 Probar RIC25 · CITREX
            </button>
          </div>
        </>
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

      {vista === "ric25" && (
        <RIC25
          setVista={setVista}
          personal={personal}
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

      {vista === "ric44" && (
        <RIC44
          setVista={setVista}
          personal={personal}
        />
      )}
    </>
  );
}
