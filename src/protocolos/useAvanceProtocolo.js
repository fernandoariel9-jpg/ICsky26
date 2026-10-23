import { useCallback } from "react";
import { guardarAvanceRIC, recuperarAvanceRIC } from "./apiPreventivos";

// Motor común para persistencia de borradores, independiente de las mediciones de cada RIC.
export function useAvanceProtocolo({ codigo, ric01Id, claveLocal }) {
  const recuperar = useCallback(async () => {
    if (!ric01Id) return null;
    const remoto = await recuperarAvanceRIC(ric01Id);
    if (remoto && remoto.codigo_ric !== codigo) {
      throw new Error("El avance corresponde a otro protocolo RIC.");
    }
    if (remoto) return remoto.datos;
    const local = localStorage.getItem(claveLocal(ric01Id));
    return local ? JSON.parse(local) : null;
  }, [codigo, ric01Id, claveLocal]);

  const guardar = useCallback(async (datos, estado = "EN_PROCESO") => {
    if (!ric01Id) throw new Error("No existe una tarea preventiva asociada.");
    await guardarAvanceRIC(ric01Id, codigo, datos, estado);
    localStorage.setItem(claveLocal(ric01Id), JSON.stringify(datos));
  }, [codigo, ric01Id, claveLocal]);

  return { recuperar, guardar };
}
