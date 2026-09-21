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

const normalizar = (texto = "") =>
  String(texto)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

export default function PanelPersonal({ personal, onLogout }) {
  const [vista, setVista] = useState("tareas");
  const [ric29Montado, setRic29Montado] = useState(false);
  const [ric39Montado, setRic39Montado] = useState(false);

  useEffect(() => {
    if (vista === "ric29") setRic29Montado(true);
    if (vista === "ric39") setRic39Montado(true);
  }, [vista]);

  const leerCampoEquipo = (contenedor, etiqueta) => {
    const parrafo = [...contenedor.querySelectorAll("p")].find((p) =>
      p.textContent.trim().startsWith(`${etiqueta}:`)
    );
    if (!parrafo) return "";
    return parrafo.textContent.replace(`${etiqueta}:`, "").trim();
  };

  const continuarPreventivoDesdeTarjeta = (event) => {
    const boton = event.target.closest("button");
    if (!boton || !boton.textContent.includes("Continuar")) return;

    const tarjeta = boton.closest(".border.border-yellow-300.bg-yellow-50");
    if (!tarjeta) return;

    const textos = [...tarjeta.querySelectorAll("p")].map((p) => p.textContent.trim());
    const tipoTexto = textos.find((t) => t.startsWith("Tipo:")) || "";
    const tipo = tipoTexto.replace("Tipo:", "").trim();
    if (normalizar(tipo) !== "preventivo") return;

    const titulo = tarjeta.querySelector("strong")?.textContent || "";
    const id = Number(titulo.match(/#(\d+)/)?.[1]);
    if (!Number.isInteger(id)) return;

    const contenedor = event.currentTarget;
    const descripcion = leerCampoEquipo(contenedor, "Equipo");
    const descripcionNormalizada = normalizar(descripcion);

    let vistaPreventivo = "";
    if (descripcionNormalizada.includes("cardiodesfibrilador")) vistaPreventivo = "ric29";
    if (descripcionNormalizada.includes("monitor multiparametrico")) vistaPreventivo = "ric39";
    if (!vistaPreventivo) return;

    const numeroSerie = leerCampoEquipo(contenedor, "Serie");
    const marcaModelo = leerCampoEquipo(contenedor, "Marca");
    const area = leerCampoEquipo(contenedor, "Área");
    const servicio = leerCampoEquipo(contenedor, "Servicio");
    const subServicio = leerCampoEquipo(contenedor, "Sub Servicio");
    const diagnosticoTexto = textos.find((t) => t.startsWith("Diagnóstico:")) || "";
    const diagnostico = diagnosticoTexto.replace("Diagnóstico:", "").trim();

    event.preventDefault();
    event.stopPropagation();

    localStorage.setItem(
      "tareaActiva",
      JSON.stringify({
        id,
        ric01_id: id,
        numero_serie: numeroSerie,
        descripcion,
        marca_modelo: marcaModelo,
        area,
        servicio,
        sub_servicio: subServicio,
        tipo_mantenimiento: "Preventivo",
        diagnostico,
        asignado: personal?.nombre || "",
        continuar_preventivo: true
      })
    );

    setVista(vistaPreventivo);
  };

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
        <div onClickCapture={continuarPreventivoDesdeTarjeta}>
          <Equipos
            setVista={setVista}
            personal={personal}
          />
        </div>
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