import { useEffect, useState } from "react";
import TareasPersonal from "./TareasPersonal";
import Equipos from "./Equipos";
import SeleccionEquipo from "./SeleccionEquipo";
import NuevoEquipo from "./NuevoEquipo";
import Stock from "./Stock";
import RIC25 from "./RIC25";
import RIC29 from "./RIC29";
import RIC37 from "./RIC37";
import RIC39 from "./RIC39";
import RIC44 from "./RIC44";

export default function PanelPersonal({ personal, onLogout }) {
  const [vista, setVista] = useState("tareas");
  const [ric29Montado, setRic29Montado] = useState(false);
  const [ric39Montado, setRic39Montado] = useState(false);

  useEffect(() => {
    if (vista === "ric29") setRic29Montado(true);
    if (vista === "ric39") setRic39Montado(true);
  }, [vista]);

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

      {vista === "stock" && (
        <Stock
          setVista={setVista}
          personal={personal}
        />
      )}

      {vista === "ric25" && (
        <RIC25
          setVista={setVista}
          personal={personal}
        />
      )}

      {ric29Montado && (
        <div style={{ display: vista === "ric29" ? "block" : "none" }}>
          <RIC29
            setVista={setVista}
            personal={personal}
          />
        </div>
      )}

      {vista === "ric37" && (
        <RIC37
          setVista={setVista}
          personal={personal}
        />
      )}

      {ric39Montado && (
        <div style={{ display: vista === "ric39" ? "block" : "none" }}>
          <RIC39
            setVista={setVista}
            personal={personal}
          />
        </div>
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