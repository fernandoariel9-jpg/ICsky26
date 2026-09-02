import { formatTimestamp } from "./utils/formatTimestamp";

export default function ResumenMantenimiento({ mantenimiento, onCerrar }) {
  if (!mantenimiento) return null;

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
          <button
            onClick={onCerrar}
            className="text-red-600 hover:text-red-800 font-bold text-xl"
          >
            ✖
          </button>
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
              <h3 className="font-bold text-gray-800">📝 Observaciones</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm">{mantenimiento.observacion}</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
