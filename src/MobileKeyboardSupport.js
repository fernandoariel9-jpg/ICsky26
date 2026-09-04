import { useEffect } from "react";

// =====================================================
// SOPORTE DE TECLADO MÓVIL
// =====================================================
// Permite que la tecla de acción del teclado virtual
// ejecute la acción principal del formulario sin ocultar
// el teclado. Se aplica de forma global a la aplicación.
//
// Para componentes nuevos, si existe un <form>, se utiliza
// su submit. En componentes con botones personalizados,
// se identifica automáticamente el botón de acción principal.
// También puede forzarse mediante:
//   data-mobile-action="search|next|done|go|send|continue"
// =====================================================

const esDispositivoMovil = () => {
  if (typeof navigator === "undefined") return false;

  return (
    /Android|iPhone|iPad|iPod|Windows Phone/i.test(
      navigator.userAgent
    ) ||
    navigator.maxTouchPoints > 1
  );
};

const textoBoton = (boton) =>
  (boton?.innerText || boton?.textContent || "")
    .trim()
    .toLowerCase();

const botonValido = (boton) => {
  if (!boton || boton.disabled) return false;

  const rect = boton.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return false;

  const texto = textoBoton(boton);

  if (!texto) return false;

  // Nunca convertir acciones destructivas o de navegación
  // en la acción automática de la tecla Enter.
  if (
    texto.includes("cancelar") ||
    texto.includes("volver") ||
    texto.includes("salir") ||
    texto.includes("pdf") ||
    texto.includes("drive") ||
    texto.includes("eliminar")
  ) {
    return false;
  }

  return true;
};

const obtenerAccion = (elemento) => {
  if (!elemento) return null;

  const accionForzada = elemento.dataset?.mobileAction;

  if (accionForzada) {
    return accionForzada;
  }

  // Los formularios HTML mantienen su comportamiento natural.
  const formulario = elemento.closest("form");
  if (formulario) {
    return "done";
  }

  // Buscar botones dentro del bloque visual que contiene el campo.
  // Esto permite trabajar también con los formularios RIC que utilizan
  // botones personalizados y no un <form> HTML.
  const contenedor =
    elemento.closest(".bg-white") ||
    elemento.closest("section") ||
    elemento.parentElement;

  if (!contenedor) return null;

  const botones = Array.from(
    contenedor.querySelectorAll("button")
  ).filter(botonValido);

  if (botones.length === 0) return null;

  const prioridad = [
    "buscar",
    "continuar",
    "aceptar",
    "siguiente",
    "ver resumen",
    "guardar",
    "ingresar",
    "enviar",
    "registrar",
    "iniciar",
    "confirmar",
    "listo"
  ];

  const botonPrincipal =
    botones.find((boton) => {
      const texto = textoBoton(boton);
      return prioridad.some((palabra) =>
        texto.includes(palabra)
      );
    }) || botones[botones.length - 1];

  const texto = textoBoton(botonPrincipal);

  if (texto.includes("buscar")) return "search";
  if (texto.includes("ir") || texto.includes("abrir")) return "go";
  if (texto.includes("enviar")) return "send";
  if (
    texto.includes("continuar") ||
    texto.includes("siguiente") ||
    texto.includes("aceptar") ||
    texto.includes("ver resumen")
  ) {
    return "next";
  }

  return "done";
};

const obtenerBotonPrincipal = (elemento) => {
  if (!elemento) return null;

  const botonForzado = elemento.dataset?.mobileAction;
  if (botonForzado) {
    const formulario = elemento.closest("form");
    if (formulario) {
      return formulario.querySelector(
        'button[type="submit"], input[type="submit"]'
      );
    }
  }

  const formulario = elemento.closest("form");
  if (formulario) {
    return formulario.querySelector(
      'button[type="submit"], input[type="submit"]'
    );
  }

  const contenedor =
    elemento.closest(".bg-white") ||
    elemento.closest("section") ||
    elemento.parentElement;

  if (!contenedor) return null;

  const botones = Array.from(
    contenedor.querySelectorAll("button")
  ).filter(botonValido);

  if (botones.length === 0) return null;

  const prioridad = [
    "buscar",
    "continuar",
    "aceptar",
    "siguiente",
    "ver resumen",
    "guardar",
    "ingresar",
    "enviar",
    "registrar",
    "iniciar",
    "confirmar",
    "listo"
  ];

  return (
    botones.find((boton) => {
      const texto = textoBoton(boton);
      return prioridad.some((palabra) =>
        texto.includes(palabra)
      );
    }) || botones[botones.length - 1]
  );
};

export default function MobileKeyboardSupport() {
  useEffect(() => {
    if (!esDispositivoMovil()) return undefined;

    const prepararCampo = (elemento) => {
      if (!elemento) return;

      const tag = elemento.tagName?.toLowerCase();
      if (tag !== "input") return;

      const tipo = (elemento.type || "text").toLowerCase();
      if (["button", "checkbox", "radio", "file", "submit", "hidden"].includes(tipo)) {
        return;
      }

      const accion = obtenerAccion(elemento);
      if (accion) {
        elemento.enterKeyHint = accion;
      }
    };

    const handleFocusIn = (event) => {
      prepararCampo(event.target);
    };

    const handleKeyDown = (event) => {
      if (event.key !== "Enter") return;

      const elemento = event.target;
      if (!elemento || elemento.tagName?.toLowerCase() !== "input") {
        return;
      }

      const tipo = (elemento.type || "text").toLowerCase();
      if (["button", "checkbox", "radio", "file", "submit", "hidden"].includes(tipo)) {
        return;
      }

      const formulario = elemento.closest("form");
      if (formulario) {
        return;
      }

      const boton = obtenerBotonPrincipal(elemento);
      if (!boton) return;

      event.preventDefault();
      event.stopPropagation();

      boton.click();
    };

    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("keydown", handleKeyDown, true);

    // Preparar los campos que ya existan al montar el soporte.
    document
      .querySelectorAll("input")
      .forEach(prepararCampo);

    return () => {
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, []);

  return null;
}
