import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import RepuestosRIC from "./RepuestosRIC";

const VISTAS_LEGACY = new Set([
  "ric29",
  "ric37",
  "ric39",
  "ric44",
  "ric48",
  "ric64",
]);

function visible(elemento) {
  if (!elemento) return false;
  const estilo = window.getComputedStyle(elemento);
  const rect = elemento.getBoundingClientRect();
  return estilo.display !== "none" && estilo.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
}

function esBotonGuardarRIC(boton) {
  const texto = String(boton?.textContent || "").trim().toLowerCase();
  if (!texto.includes("guardar")) return false;

  // No insertar junto a acciones auxiliares como Guardar IP o Guardar cambios.
  const excluir = ["guardar ip", "guardar cambios", "guardar solución", "guardar solucion"];
  return !excluir.some((valor) => texto.includes(valor));
}

export default function RepuestosRICPortal({ vista, personal }) {
  const [destino, setDestino] = useState(null);

  useEffect(() => {
    if (!VISTAS_LEGACY.has(vista)) {
      setDestino(null);
      return undefined;
    }

    let host = null;
    let cancelado = false;

    const buscarBoton = () => {
      if (cancelado || host) return;

      const botones = [...document.querySelectorAll("button")];
      const botonGuardar = botones.find((boton) => visible(boton) && esBotonGuardarRIC(boton));
      if (!botonGuardar?.parentElement) return;

      host = document.createElement("div");
      host.dataset.repuestosRic = vista;
      host.className = "w-full";
      botonGuardar.parentElement.insertBefore(host, botonGuardar);
      setDestino(host);
    };

    buscarBoton();

    const observer = new MutationObserver(() => buscarBoton());
    observer.observe(document.body, { childList: true, subtree: true });

    const interval = window.setInterval(buscarBoton, 400);

    return () => {
      cancelado = true;
      observer.disconnect();
      window.clearInterval(interval);
      setDestino(null);
      if (host?.parentNode) host.parentNode.removeChild(host);
    };
  }, [vista]);

  if (!destino) return null;
  return createPortal(<RepuestosRIC personal={personal} />, destino);
}
