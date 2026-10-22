import { vincularCorrectivoRIC } from "./apiPreventivos";
import { useRef, useState } from "react";
import { API_URL } from "../config";

// Acción reutilizable en resúmenes de protocolos preventivos.
// La tarea original permanece intacta; el correctivo queda asociado por su diagnóstico.
export default function CorrectivoDerivado({
  codigo,
  datos,
  personal,
  resultado,
  observaciones = "",
  noConformes = [],
  guardado = false,
  finalizado = false,
  setVista,
  antesDeCrear
}) {
  const enviandoRef = useRef(false);
  const [enviando, setEnviando] = useState(false);
  const [creado, setCreado] = useState(false);

  const fallas = (Array.isArray(noConformes) ? noConformes : [])
    .map((item) => {
      if (typeof item === "string") return item.trim();
      return [item?.etapa, item?.nombre || item?.parametro, item?.resultado || item?.estado,
        item?.medicion, item?.valor, item?.observaciones]
        .filter(Boolean).join(" - ");
    })
    .filter(Boolean);
  const textoObservaciones = String(observaciones || "").trim();
  const requiereCorrectivo = String(resultado || "").toUpperCase().includes("NO CONFORME") ||
    fallas.length > 0;
  const origenId = datos?.ric01_id || datos?.id;
  const clave = `correctivo-derivado:${codigo}:${origenId}`;

  if (!requiereCorrectivo || !origenId) return null;

  const iniciar = async () => {
    if (enviandoRef.current || creado) return;
    const existente = localStorage.getItem(clave);
    if (existente) {
      return alert(`Ya se generó un correctivo desde este mantenimiento: tarea #${existente}.`);
    }
    if (!window.confirm(`¿Iniciar un correctivo vinculado a ${codigo} (preventivo #${origenId})?\n\nEl preventivo quedará ABIERTO. Su avance se conservará para retomarlo después de resolver la falla.`)) return;

    enviandoRef.current = true;
    setEnviando(true);
    const ahora = new Date();
    const fecha = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, "0")}-${String(ahora.getDate()).padStart(2, "0")} ${String(ahora.getHours()).padStart(2, "0")}:${String(ahora.getMinutes()).padStart(2, "0")}`;
    const diagnostico = [
      `Correctivo originado en ${codigo} - mantenimiento preventivo #${origenId}.`,
      `Resultado: ${resultado || "Con observaciones"}.`,
      fallas.length ? `No conformidades:\n${fallas.map((f) => `- ${f}`).join("\n")}` : "",
      textoObservaciones ? `Observaciones:\n${textoObservaciones}` : ""
    ].filter(Boolean).join("\n\n");
    try {
      if (antesDeCrear) await antesDeCrear();
      const res = await fetch(API_URL.Ric01, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuario: personal?.nombre || datos.tecnico || "",
          fecha,
          tarea: `Correctivo derivado de ${codigo} #${origenId} - ${datos.descripcion || "Equipo"} - Serie: ${datos.numero_serie}`,
          diagnostico,
          tipo_mantenimiento: "Correctivo",
          descripcion: datos.descripcion || "",
          marca_modelo: datos.marca_modelo || "",
          numero_serie: datos.numero_serie,
          area: datos.area || personal?.area || "",
          servicio: datos.servicio || "",
          subservicio: datos.sub_servicio || datos.subservicio || "",
          asignado: personal?.nombre || "",
          solicitado_por: personal?.nombre || "",
          origen: "interno",
          solucion: ""
        })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "No se pudo crear la tarea correctiva.");
      const id = body.ric01_id || body.id;
      if (!id) throw new Error("El servidor no devolvió el ID del correctivo. Verifique las tareas antes de volver a intentar.");
      try {
        await vincularCorrectivoRIC(origenId, id, codigo, fallas);
      } catch (error) {
        alert(`Se creó el correctivo #${id}, pero no se pudo registrar el vínculo en PostgreSQL: ${error.message}. No cree otro; comunique este número para reparar la vinculación.`);
        localStorage.setItem(clave, String(id));
        return;
      }
      localStorage.setItem(clave, String(id));
      localStorage.setItem(`preventivo-origen:${id}`, JSON.stringify({ ric01_id: origenId, codigo, numero_serie: datos.numero_serie }));
      localStorage.setItem("tareaActiva", JSON.stringify({
        ...body, id, ric01_id: id, equipo_id: datos.equipo_id,
        numero_serie: datos.numero_serie, descripcion: datos.descripcion,
        marca_modelo: datos.marca_modelo, area: datos.area || personal?.area || "",
        servicio: datos.servicio, sub_servicio: datos.sub_servicio || datos.subservicio,
        tipo_mantenimiento: "Correctivo", diagnostico, asignado: personal?.nombre || "",
        preventivo_origen_id: origenId, preventivo_origen_ric: codigo
      }));
      if (datos.numero_serie) localStorage.setItem("equipoActualizado", datos.numero_serie);
      setCreado(true);
      setVista("equipos");
    } catch (error) {
      alert(error.message || "Error al crear el correctivo.");
    } finally {
      enviandoRef.current = false;
      setEnviando(false);
    }
  };

  return (
    <div className="border border-amber-300 bg-amber-50 rounded-xl p-4 mt-4 space-y-2">
      <p className="text-amber-900 font-bold">🔧 Se detectaron observaciones o no conformidades</p>
      <p className="text-sm text-amber-800">Puede iniciar un correctivo vinculado al preventivo #{origenId} sin modificar el informe original.</p>
      <button type="button" disabled={enviando || creado}
        onClick={iniciar}
        className="w-full rounded-xl bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white p-3 font-bold">
        {enviando ? "Creando correctivo..." : "🔧 Iniciar mantenimiento correctivo"}
      </button>
      <p className="text-xs text-amber-800">El preventivo seguirá abierto. Guarde su informe final al regresar del correctivo.</p>
    </div>
  );
}
