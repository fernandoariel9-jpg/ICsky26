import { useMemo } from "react";

export default function AptitudUsoCardio({ setVista, personal }) {
  const equipo = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("equipoAptitudCardio") || "null");
    } catch {
      return null;
    }
  }, []);

  if (!equipo) {
    return (
      <main className="max-w-3xl mx-auto p-4">
        <div className="bg-white rounded-2xl shadow p-5">
          <h1 className="text-xl font-bold text-gray-800">Aptitud de uso - Cardiodesfibrilador</h1>
          <p className="mt-3 text-red-700">No se encontraron los datos del equipo seleccionado.</p>
          <button onClick={() => setVista("equipos")} className="mt-4 w-full bg-gray-600 hover:bg-gray-700 text-white rounded-xl py-2 font-semibold">Volver a Equipos</button>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto p-4">
      <div className="bg-white rounded-2xl shadow p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className="text-sm font-semibold text-emerald-700">SKY26 · INGENIERÍA CLÍNICA</p>
            <h1 className="text-xl font-bold text-gray-900 mt-1">Aptitud de uso - Cardiodesfibrilador</h1>
            <p className="text-sm text-gray-500 mt-1">Componente independiente de los protocolos RIC</p>
          </div>
          <button onClick={() => setVista("equipos")} className="shrink-0 bg-gray-600 hover:bg-gray-700 text-white rounded-xl px-3 py-2 text-sm font-semibold">Volver</button>
        </div>
        <section className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <h2 className="font-bold text-gray-800 mb-2">Identificación del equipo</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <p><strong>Equipo:</strong> {equipo.descripcion || "-"}</p>
            <p><strong>Marca / modelo:</strong> {equipo.marca_modelo || "-"}</p>
            <p><strong>Número de serie:</strong> {equipo.numero_serie || "-"}</p>
            <p><strong>Servicio:</strong> {equipo.servicio || "-"}</p>
            <p><strong>Área:</strong> {equipo.area || "-"}</p>
            <p><strong>Responsable:</strong> {personal?.nombre || "-"}</p>
          </div>
        </section>
        <section className="mt-5 rounded-xl border border-dashed border-emerald-400 bg-emerald-50/50 p-4">
          <h2 className="font-bold text-gray-800">Parámetros esenciales</h2>
          <p className="text-sm text-gray-600 mt-1">En la siguiente etapa incorporaremos las mediciones, criterios de conformidad y observaciones individuales.</p>
        </section>
      </div>
    </main>
  );
}
