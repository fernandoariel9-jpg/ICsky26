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
import RIC48 from "./RIC48";
import RIC56 from "./RIC56";
import RIC64 from "./RIC64";
import { API_URL } from "./config";

const normalizar = (texto = "") =>
  String(texto)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

const esRxMovil = (descripcion = "") => {
  const d = normalizar(descripcion)
    .replace(/[-_/]+/g, " ")
    .replace(/\s+/g, " ");

  return (
    d.includes("rx movil") ||
    d.includes("rayos x movil") ||
    d.includes("equipo de rx movil") ||
    d.includes("equipo rx movil") ||
    d.includes("equipo de rayos x movil") ||
    d.includes("equipo rayos x movil") ||
    d.includes("rx portatil") ||
    d.includes("rayos x portatil")
  );
};

const fechaLocal = () => {
  const d = new Date();
  d.setSeconds(0, 0);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

export default function PanelPersonal({ personal, onLogout }) {
  const [vista, setVista] = useState("tareas");
  const [ric29Montado, setRic29Montado] = useState(false);
  const [ric39Montado, setRic39Montado] = useState(false);
  const [ric48Montado, setRic48Montado] = useState(false);
  const [ric56Montado, setRic56Montado] = useState(false);
  const [ric64Montado, setRic64Montado] = useState(false);

  useEffect(() => {
    if (vista === "ric29") setRic29Montado(true);
    if (vista === "ric39") setRic39Montado(true);
    if (vista === "ric48") setRic48Montado(true);
    if (vista === "ric56") setRic56Montado(true);
    if (vista === "ric64") setRic64Montado(true);
  }, [vista]);

  const leerCampoEquipo = (contenedor, etiqueta) => {
    const parrafo = [...contenedor.querySelectorAll("p")].find((p) =>
      p.textContent.trim().startsWith(`${etiqueta}:`)
    );
    if (!parrafo) return "";
    return parrafo.textContent.replace(`${etiqueta}:`, "").trim();
  };

  const continuarPreventivoDesdeTarjeta = (event, boton) => {
    if (!boton.textContent.includes("Continuar")) return false;

    const tarjeta = boton.closest(".border.border-yellow-300.bg-yellow-50");
    if (!tarjeta) return false;

    const textos = [...tarjeta.querySelectorAll("p")].map((p) => p.textContent.trim());
    const tipoTexto = textos.find((t) => t.startsWith("Tipo:")) || "";
    const tipo = tipoTexto.replace("Tipo:", "").trim();
    if (normalizar(tipo) !== "preventivo") return false;

    const titulo = tarjeta.querySelector("strong")?.textContent || "";
    const id = Number(titulo.match(/#(\d+)/)?.[1]);
    if (!Number.isInteger(id)) return false;

    const contenedor = event.currentTarget;
    const descripcion = leerCampoEquipo(contenedor, "Equipo");
    const descripcionNormalizada = normalizar(descripcion);

    let vistaPreventivo = "";
    if (descripcionNormalizada.includes("cardiodesfibrilador")) vistaPreventivo = "ric29";
    if (descripcionNormalizada.includes("monitor multiparametrico")) vistaPreventivo = "ric39";
    if (descripcionNormalizada.includes("electrocardiografo")) vistaPreventivo = "ric48";
    if (esRxMovil(descripcion)) vistaPreventivo = "ric56";
    if (descripcionNormalizada.includes("bano termostatico")) vistaPreventivo = "ric64";
    if (!vistaPreventivo) return false;

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
    return true;
  };

  const iniciarProtocoloDesdeFormulario = async (event, boton) => {
    if (!boton.textContent.includes("Guardar")) return false;

    const formulario = boton.closest("div.bg-gray-100");
    if (!formulario) return false;

    const selectorTipo = [...formulario.querySelectorAll("select")].find((select) =>
      [...select.options].some((option) => normalizar(option.value) === "preventivo")
    );
    if (!selectorTipo || normalizar(selectorTipo.value) !== "preventivo") return false;

    const contenedor = event.currentTarget;
    const descripcion = leerCampoEquipo(contenedor, "Equipo");
    const descripcionNormalizada = normalizar(descripcion);

    let vistaProtocolo = "";
    if (esRxMovil(descripcion)) vistaProtocolo = "ric56";
    else if (descripcionNormalizada.includes("bano termostatico")) vistaProtocolo = "ric64";
    else return false;

    const marcaModelo = leerCampoEquipo(contenedor, "Marca");
    const numeroSerie = leerCampoEquipo(contenedor, "Serie");
    const servicio = leerCampoEquipo(contenedor, "Servicio");
    const subServicio = leerCampoEquipo(contenedor, "Sub Servicio");
    const area = leerCampoEquipo(contenedor, "Área") || personal?.area || "";
    const observaciones = formulario.querySelector("textarea")?.value || "";

    event.preventDefault();
    event.stopPropagation();

    if (!servicio || !subServicio) {
      alert("⚠️ No se puede iniciar el mantenimiento.\n\nEl equipo debe tener asignados Servicio y Subservicio.");
      return true;
    }

    try {
      const respuesta = await fetch(API_URL.Ric01, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuario: personal?.nombre || "",
          fecha: fechaLocal(),
          tarea: `Mantenimiento Preventivo - ${descripcion} ${marcaModelo} - Serie: ${numeroSerie}`,
          diagnostico: "",
          tipo_mantenimiento: "Preventivo",
          descripcion,
          marca_modelo: marcaModelo,
          numero_serie: numeroSerie,
          area,
          servicio,
          subservicio: subServicio,
          asignado: personal?.nombre || "",
          solicitado_por: personal?.nombre || "",
          origen: "interno",
          solucion: observaciones
        })
      });

      const data = await respuesta.json();
      if (!respuesta.ok) throw new Error(data.error || "Error al guardar el mantenimiento");

      localStorage.setItem(
        "tareaActiva",
        JSON.stringify({
          ...data,
          ric01_id: data.ric01_id || data.id,
          tipo_mantenimiento: "Preventivo",
          descripcion,
          marca_modelo: marcaModelo,
          numero_serie: numeroSerie,
          area,
          servicio,
          subservicio: subServicio,
          asignado: personal?.nombre || "",
          diagnostico: ""
        })
      );

      setVista(vistaProtocolo);
    } catch (err) {
      console.error("Error iniciando protocolo específico:", err);
      alert(err.message || "Error al iniciar el mantenimiento preventivo");
    }

    return true;
  };

  const manejarClickEquipos = async (event) => {
    const boton = event.target.closest("button");
    if (!boton) return;
    if (continuarPreventivoDesdeTarjeta(event, boton)) return;
    await iniciarProtocoloDesdeFormulario(event, boton);
  };

  return (
    <>
      {vista === "tareas" && (
        <TareasPersonal personal={personal} onLogout={onLogout} setVista={setVista} />
      )}

      {vista === "equipos" && (
        <div onClickCapture={manejarClickEquipos}>
          <Equipos setVista={setVista} personal={personal} />
        </div>
      )}

      {vista === "seleccionarEquipo" && <SeleccionEquipo setVista={setVista} />}
      {vista === "nuevoEquipo" && <NuevoEquipo setVista={setVista} />}
      {vista === "stock" && <Stock setVista={setVista} personal={personal} />}
      {vista === "ric25" && <RIC25 setVista={setVista} personal={personal} />}

      {ric29Montado && (
        <div style={{ display: vista === "ric29" ? "block" : "none" }}>
          <RIC29 setVista={setVista} personal={personal} />
        </div>
      )}

      {vista === "ric37" && <RIC37 setVista={setVista} personal={personal} />}

      {ric39Montado && (
        <div style={{ display: vista === "ric39" ? "block" : "none" }}>
          <RIC39 setVista={setVista} personal={personal} />
        </div>
      )}

      {vista === "ric44" && <RIC44 setVista={setVista} personal={personal} />}

      {ric48Montado && (
        <div style={{ display: vista === "ric48" ? "block" : "none" }}>
          <RIC48 setVista={setVista} personal={personal} />
        </div>
      )}

      {ric56Montado && (
        <div style={{ display: vista === "ric56" ? "block" : "none" }}>
          <RIC56 setVista={setVista} personal={personal} />
        </div>
      )}

      {ric64Montado && (
        <div style={{ display: vista === "ric64" ? "block" : "none" }}>
          <RIC64 setVista={setVista} personal={personal} />
        </div>
      )}
    </>
  );
}
