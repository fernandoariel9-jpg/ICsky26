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
