import { useEffect } from "react";
import { guardarAvanceRIC, recuperarAvanceRIC } from "./apiPreventivos";

/**
 * Persistencia común de protocolos complejos (RIC29, RIC39, RIC48, etc.).
 * Cada protocolo conserva sus propios campos y cálculos; aquí solo se
 * administra el ciclo de vida del borrador.
 */
export async function recuperarBorradorRIC({ ric01Id, codigo, claveLocal }) {
  const remoto = await recuperarAvanceRIC(ric01Id);
  if (remoto && remoto.codigo_ric !== codigo) {
    throw new Error("El avance pertenece a otro protocolo: " + remoto.codigo_ric);
  }
  const respaldo = claveLocal ? localStorage.getItem(claveLocal) : null;
  const datos = remoto?.datos || (respaldo ? JSON.parse(respaldo) : null);
  return { datos, origen: remoto ? "postgresql" : respaldo ? "local" : "nuevo" };
}

export async function guardarBorradorRIC({
  ric01Id, codigo, datos, claveLocal, estado = "EN_PROCESO"
}) {
  if (!ric01Id) throw new Error("No se identificó el mantenimiento preventivo.");
  if (!datos || typeof datos !== "object") throw new Error("Borrador inválido.");
  if (claveLocal) localStorage.setItem(claveLocal, JSON.stringify(datos));
  return guardarAvanceRIC(ric01Id, codigo, datos, estado);
}


// Autoguardado común para todos los protocolos RIC.
// Mantiene una copia local inmediata y sincroniza PostgreSQL con debounce.
export function useAutoguardadoRIC({
  ric01Id,
  codigo,
  datos,
  claveLocal,
  habilitado = true,
  demora = 700
}) {
  const serializado = JSON.stringify(datos ?? null);

  useEffect(() => {
    if (!habilitado || !ric01Id || !serializado || serializado === "null") return;

    try {
      if (claveLocal) localStorage.setItem(claveLocal(ric01Id), serializado);
    } catch (error) {
      console.error(`No se pudo guardar el respaldo local de ${codigo}:`, error);
    }

    const timer = window.setTimeout(async () => {
      try {
        await guardarAvanceRIC(ric01Id, codigo, JSON.parse(serializado));
      } catch (error) {
        console.error(`No se pudo sincronizar el avance de ${codigo} con PostgreSQL:`, error);
      }
    }, demora);

    return () => window.clearTimeout(timer);
  }, [ric01Id, codigo, serializado, claveLocal, habilitado, demora]);
}
