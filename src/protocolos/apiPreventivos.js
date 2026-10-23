
import { API_URL } from "../config";

const BASE = `${API_URL.Base}/api/ric-preventivos`;

async function solicitar(ruta, opciones = {}) {
  const token = localStorage.getItem("personal_token");

  if (!token) {
    throw new Error("Debe iniciar sesión como personal técnico.");
  }

  const respuesta = await fetch(`${BASE}${ruta}`, {
    ...opciones,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(opciones.body
        ? { "Content-Type": "application/json" }
        : {}),
      ...opciones.headers
    }
  });

  const data = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    const error = new Error(
      data.error || `Error HTTP ${respuesta.status}`
    );
    error.status = respuesta.status;
    throw error;
  }

  return data;
}

export function guardarAvanceRIC(
  ric01Id,
  codigoRIC,
  datos,
  estado = "EN_PROCESO"
) {
  return solicitar(`/avances/${ric01Id}`, {
    method: "PUT",
    body: JSON.stringify({
      codigo_ric: codigoRIC,
      datos,
      estado
    })
  });
}

export async function recuperarAvanceRIC(ric01Id) {
  try {
    const resultado = await solicitar(`/avances/${ric01Id}`);
    return resultado.avance;
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
}

export function consultarCorrectivosRIC(preventivoId) {
  return solicitar(`/vinculos/${preventivoId}`);
}

export function vincularCorrectivoRIC(
  preventivoId,
  correctivoId,
  codigoRIC,
  noConformidades
) {
  return solicitar("/vinculos", {
    method: "POST",
    body: JSON.stringify({
      preventivo_ric01_id: preventivoId,
      correctivo_ric01_id: correctivoId,
      codigo_ric: codigoRIC,
      no_conformidades: noConformidades
    })
  });
}

export function cancelarPreventivoRIC(ric01Id) {
  return solicitar(`/cancelar/${encodeURIComponent(ric01Id)}`, { method: "DELETE" });
}
