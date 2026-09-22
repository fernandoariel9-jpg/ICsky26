import { useEffect } from "react";

const SELECTOR = 'input[placeholder="Buscar equipo..."]';
const ESPERA_MS = 350;

export default function BusquedaEquiposEstable() {
  useEffect(() => {
    let input = null;
    let timer = null;
    let sincronizando = false;
    let ultimoValor = "";

    const descriptorValor = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value"
    );

    const enviarAReact = () => {
      if (!input) return;
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }

      sincronizando = true;
      descriptorValor?.set?.call(input, ultimoValor);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      sincronizando = false;
    };

    const alEscribir = (evento) => {
      if (sincronizando || evento.target !== input) return;

      // Conservamos inmediatamente lo que escribió el usuario, pero evitamos
      // que Equipos.jsx dispare buscarEquipo() por cada carácter.
      ultimoValor = input.value;
      evento.stopPropagation();
      if (typeof evento.stopImmediatePropagation === "function") {
        evento.stopImmediatePropagation();
      }

      if (timer) clearTimeout(timer);
      timer = setTimeout(enviarAReact, ESPERA_MS);
    };

    const alSalir = () => {
      if (timer) enviarAReact();
    };

    const conectar = () => {
      const encontrado = document.querySelector(SELECTOR);
      if (encontrado === input) return;

      if (input) {
        input.removeEventListener("input", alEscribir, true);
        input.removeEventListener("blur", alSalir, true);
      }

      input = encontrado;
      if (!input) return;

      ultimoValor = input.value || "";
      input.addEventListener("input", alEscribir, true);
      input.addEventListener("blur", alSalir, true);
    };

    conectar();

    const observer = new MutationObserver(conectar);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      if (timer) clearTimeout(timer);
      if (input) {
        input.removeEventListener("input", alEscribir, true);
        input.removeEventListener("blur", alSalir, true);
      }
    };
  }, []);

  return null;
}
