import { useState } from "react";
import { API_URL } from "./config";

function formatTimestamp(ts) {
  if (!ts) return "";
  if (/^\d{2}\/\d{2}\/\d{4}/.test(ts)) return ts;
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(ts)) {
    const [fechaPart, horaPart] = ts.split(" ");
    const [year, month, day] = fechaPart.split("-").map(Number);
    const [hour, min, sec = "00"] = horaPart.split(":");
    return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}, ${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }
  try {
    const d = new Date(ts);
    return new Intl.DateTimeFormat("es-AR", {
      timeZone: "America/Argentina/Buenos_Aires",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(d);
  } catch {
    return String(ts);
  }
}

export default function ResumenMantenimiento({ mantenimiento, onCerrar }) {
  const [enviandoDrive, setEnviandoDrive] = useState(false);

  if (!mantenimiento) return null;

  const ric29 = mantenimiento.ric29 || null;
  const resultado = String(ric29?.resultado_general || "").trim().toUpperCase();
  const tieneResultado = Boolean(resultado);
  const esConforme = resultado === "CONFORME";
  const observacionesRIC29 = String(ric29?.observaciones || "").trim();

  const abrirPDF = () => {
    if (!ric29?.id) {
      alert("Este mantenimiento preventivo no tiene un RIC29 asociado.");
      return;
    }

    window.open(`${API_URL.Ric29}/${ric29.id}/pdf`, "_blank");
  };

  const reenviarDrive = async () => {
    if (!ric29?.id) {
      alert("Este mantenimiento preventivo no tiene un RIC29 asociado.");
      return;
    }

    try {
      setEnviandoDrive(true);

      const res = await fetch(`${API_URL.Ric29}/${ric29.id}/drive`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "No se pudo enviar el PDF a Google Drive");
      }

      alert("✅ PDF reenviado correctamente a Google Drive");
    } catch (error) {
      console.error("Error reenviando RIC29 a Drive:", error);
      alert(error.message || "No se pudo reenviar el PDF a Google Drive");
    } finally {
      setEnviandoDrive(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-800">📄 Resumen del mantenimiento</h2>
            <p className="text-sm text-gray-500 mt-1">
              {mantenimiento.tipo_mantenimiento || "Mantenimiento"}
              {mantenimiento.fecha ? ` · ${formatTimestamp(mantenimiento.fecha)}` : ""}
            </p>
          </div>
          <button onClick={onCerrar} className="text-red-600 hover:text-red-800 font-bold text-xl">✖</button>
        </div>

        <div className="overflow-auto max-h-[calc(90vh-76px)] p-5 space-y-5">
          <section className="bg-white rounded-xl border shadow-sm p-4">
            <h3 className="text-lg font-bold text-gray-800 mb-3">Datos del mantenimiento</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <p><strong>Tipo:</strong> {mantenimiento.tipo_mantenimiento || "-"}</p>
              <p><strong>Fecha:</strong> {mantenimiento.fecha ? formatTimestamp(mantenimiento.fecha) : "-"}</p>
              <p><strong>Solicitado por:</strong> {mantenimiento.solicitado_por || mantenimiento.usuario || "-"}</p>
              <p><strong>Técnico:</strong> {mantenimiento.asignado || "-"}</p>
              <p><strong>Finalizado:</strong> {mantenimiento.fin ? "Sí" : "No"}</p>
              <p><strong>Fecha de finalización:</strong> {mantenimiento.fecha_fin ? formatTimestamp(mantenimiento.fecha_fin) : "-"}</p>
              <p><strong>Calificación:</strong> {mantenimiento.calificacion || "-"}</p>
            </div>
          </section>

          {ric29 && (
            <section className="bg-gray-50 border rounded-xl p-4 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-3">Resultado del preventivo</h3>

              <div className="flex flex-wrap items-center gap-3">
                <span className="font-semibold">Resultado:</span>
                {tieneResultado ? (
                  <span
                    className={`px-3 py-1 rounded-full font-bold text-white ${
                      esConforme ? "bg-green-600" : "bg-red-600"
                    }`}
                  >
                    {resultado}
                  </span>
                ) : (
                  <span className="text-gray-500">Sin resultado registrado</span>
                )}
              </div>

              {observacionesRIC29 && (
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-3">
                  <strong>📝 Observaciones del protocolo</strong>
                  <p className="mt-2 whitespace-pre-wrap text-sm">{observacionesRIC29}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                <button
                  onClick={abrirPDF}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-semibold"
                >
                  📄 Descargar / abrir PDF
                </button>

                <button
                  onClick={reenviarDrive}
                  disabled={enviandoDrive}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-xl font-semibold"
                >
                  {enviandoDrive ? "Enviando..." : "☁️ Volver a enviar a Drive"}
                </button>
              </div>
            </section>
          )}

          {!ric29 && (
            <section className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
              Este mantenimiento preventivo no tiene un RIC29 asociado.
            </section>
          )}

          {mantenimiento.diagnostico && (
            <section className="bg-red-50 border border-red-200 rounded-xl p-4">
              <h3 className="font-bold text-gray-800">🩺 Diagnóstico</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm">{mantenimiento.diagnostico}</p>
            </section>
          )}

          {mantenimiento.solucion && (
            <section className="bg-green-50 border border-green-200 rounded-xl p-4">
              <h3 className="font-bold text-gray-800">💡 Solución</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm">{mantenimiento.solucion}</p>
            </section>
          )}

          {mantenimiento.observacion && (
            <section className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h3 className="font-bold text-gray-800">📝 Observaciones del mantenimiento</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm">{mantenimiento.observacion}</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
