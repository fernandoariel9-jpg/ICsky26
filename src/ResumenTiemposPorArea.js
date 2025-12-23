import React, { useEffect, useState } from "react";
import { API_URL } from "./config";

export default function ResumenTiemposPorArea() {
  const [datos, setDatos] = useState([]);

  useEffect(() => {
    fetch(API_URL.ResumenTiemposPorArea)
      .then((res) => res.json())
      .then(setDatos)
      .catch(console.error);
  }, []);

  const formatTiempo = (seg) => {
    if (!seg) return "-";
    const h = Math.floor(seg / 3600);
    const m = Math.floor((seg % 3600) / 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow">
      <h2 className="text-lg font-bold mb-3 text-center">
        ⏱️ Tiempos promedio por área
      </h2>

      <table className="w-full text-sm border">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">Área</th>
            <th className="border p-2">Prom. Solución</th>
            <th className="border p-2">Prom. Finalización</th>
          </tr>
        </thead>
        <tbody>
          {datos.map((d) => (
            <tr key={d.area}>
              <td className="border p-2 font-semibold">{d.area}</td>
              <td className="border p-2 text-center">
                {formatTiempo(d.prom_solucion_seg)}
              </td>
              <td className="border p-2 text-center">
                {formatTiempo(d.prom_finalizacion_seg)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
