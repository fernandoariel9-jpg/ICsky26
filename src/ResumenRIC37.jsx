import { useEffect, useState } from "react";
import { API_URL } from "./config";

export default function ResumenRIC37({ id, onCerrar }) {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    const cargar = async () => {
      try {
        setCargando(true);
        setError("");

        const res = await fetch(`${API_URL.Base}/api/ric37/${id}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "No se pudo obtener el RIC37");
        }

        setDatos(data.ric37);
      } catch (err) {
        console.error("Error obteniendo RIC37:", err);
        setError(err.message || "No se pudo obtener el resumen RIC37.");
      } finally {
        setCargando(false);
      }
    };

    cargar();
  }, [id]);

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-800">📋 Resumen RIC37</h2>
            {datos?.numero_serie && (
              <p className="text-sm text-gray-500 mt-1">Equipo: {datos.numero_serie}</p>
            )}
          </div>
          <button
            onClick={onCerrar}
            className="text-red-600 hover:text-red-800 font-bold text-xl"
          >
            ✖
          </button>
        </div>

        <div className="overflow-auto max-h-[calc(90vh-76px)] p-5">
          {cargando && (
            <p className="text-center text-gray-500 py-10">Cargando resumen RIC37...</p>
          )}

          {!cargando && error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
              ❌ {error}
            </div>
          )}

          {!cargando && !error && datos && (
            <div className="space-y-5">
              <div className="bg-white rounded-xl border shadow-sm p-4">
                <h3 className="text-lg font-bold text-gray-800 mb-3">Datos del control</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <p><strong>Descripción:</strong> {datos.descripcion || "-"}</p>
                  <p><strong>Marca / modelo:</strong> {datos.marca_modelo || "-"}</p>
                  <p><strong>Nº de serie:</strong> {datos.numero_serie || "-"}</p>
                  <p><strong>Área:</strong> {datos.area || "-"}</p>
                  <p><strong>Servicio:</strong> {datos.servicio || "-"}</p>
                  <p><strong>Sub servicio:</strong> {datos.sub_servicio || "-"}</p>
                  <p><strong>Encargado:</strong> {datos.encargado || "-"}</p>
                  <p><strong>Técnico:</strong> {datos.tecnico || "-"}</p>
                  <p><strong>Clase:</strong> {datos.clase || "-"}</p>
                  <p><strong>Tipo de protección:</strong> {datos.tipo_proteccion || "-"}</p>
                  <p><strong>Fecha:</strong> {datos.fecha ? new Date(datos.fecha).toLocaleString("es-AR") : "-"}</p>
                  <p><strong>Resultado general:</strong> {datos.resultado_general || "-"}</p>
                </div>
              </div>

              <div className="bg-white rounded-xl border shadow-sm p-4">
                <h3 className="text-lg font-bold text-gray-800 mb-3">Mediciones</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-sm text-gray-500">Tensión</p>
                    <p className="font-semibold">{datos.medicion_tension ?? "-"}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-sm text-gray-500">Corriente</p>
                    <p className="font-semibold">{datos.medicion_corriente ?? "-"}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border shadow-sm p-4">
                <h3 className="text-lg font-bold text-gray-800 mb-3">Determinaciones</h3>
                {datos.determinaciones?.length ? (
                  <div className="space-y-3">
                    {datos.determinaciones.map((d) => (
                      <div key={d.id} className="border rounded-xl p-3 bg-gray-50">
                        <div className="flex flex-col md:flex-row md:justify-between gap-2">
                          <div>
                            <p className="font-semibold text-gray-800">{d.nombre || d.determinacion || "Determinación"}</p>
                            {d.determinacion && <p className="text-xs text-gray-500">{d.determinacion}</p>}
                          </div>
                          <span className={`font-bold ${d.no_aplica ? "text-gray-500" : d.conforme === true ? "text-green-600" : d.conforme === false ? "text-red-600" : "text-gray-600"}`}>
                            {d.no_aplica ? "NO APLICA" : d.conforme === true ? "✓ CONFORME" : d.conforme === false ? "✕ NO CONFORME" : "SIN RESULTADO"}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-sm">
                          <p><strong>Medición:</strong> {d.medicion ?? "-"}</p>
                          <p><strong>Rango:</strong> {d.rango_aceptacion ?? "-"}</p>
                        </div>
                        {d.observaciones && (
                          <p className="text-sm mt-2 whitespace-pre-wrap"><strong>Observaciones:</strong> {d.observaciones}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No hay determinaciones registradas.</p>
                )}
              </div>

              {datos.observaciones && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <h3 className="font-bold text-gray-800">📝 Observaciones generales</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm">{datos.observaciones}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
