import React, { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis
} from "recharts";
import { API_URL } from "./config";

export default function AnaliticaTiempos() {
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [datos, setDatos] = useState([]);

  const cargarDatos = async () => {
  if (!desde || !hasta) return alert("Seleccioná rango de fechas");

  try {
    const res = await fetch(
      `${API_URL.TiemposAnalitica}?desde=${desde}&hasta=${hasta}`
    );

    const data = await res.json();

    if (!Array.isArray(data)) {
      console.warn("Respuesta inválida del backend:", data);
      setDatos([]);
      return;
    }

    setDatos(data);
  } catch (err) {
    console.error("Error cargando analítica:", err);
    setDatos([]);
  }
};

  const avg = (arr) =>
    arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

  // =======================
  // PROCESO POR ÁREA
  // =======================
  const areas = {};
  datos.forEach(d => {
    if (!areas[d.area]) areas[d.area] = { sol: [], fin: [] };
    if (d.t_sol) areas[d.area].sol.push(d.t_sol);
    if (d.t_fin) areas[d.area].fin.push(d.t_fin);
  });

  const dataAreas = Object.keys(areas).map(a => ({
    area: a,
    promSol: avg(areas[a].sol) / 3600,
    promFin: avg(areas[a].fin) / 3600,
  }));

  // =======================
  // PROCESO POR PERSONAL
  // =======================
  const personal = {};
  datos.forEach(d => {
    if (!d.personal) return;
    if (!personal[d.personal]) personal[d.personal] = { sol: [], fin: [] };
    if (d.t_sol) personal[d.personal].sol.push(d.t_sol);
    if (d.t_fin) personal[d.personal].fin.push(d.t_fin);
  });

  const dataPersonal = Object.keys(personal).map(p => ({
    nombre: p,
    promSol: avg(personal[p].sol) / 3600,
    promFin: avg(personal[p].fin) / 3600,
  }));

  // =======================
  // DETECCIÓN DE ÁREAS LENTAS
  // =======================
  const promedioGlobal =
    avg(dataAreas.map(a => a.promSol));

  const areasLentas = dataAreas.filter(
    a => a.promSol > promedioGlobal * 1.3
  );

  return (
    <div className="space-y-6 bg-white p-6 rounded-xl shadow">

      <h2 className="text-2xl font-bold text-center">
        📊 Analítica de tiempos
      </h2>

      {/* FILTRO FECHAS */}
      <div className="flex gap-2 justify-center">
        <input
          type="date"
          value={desde}
          onChange={e => setDesde(e.target.value)}
          className="border p-2 rounded"
        />
        <input
          type="date"
          value={hasta}
          onChange={e => setHasta(e.target.value)}
          className="border p-2 rounded"
        />
        <button
          onClick={cargarDatos}
          className="bg-blue-600 text-white px-4 rounded"
        >
          Aplicar
        </button>
      </div>

      {/* GRÁFICO BARRAS */}
      <div className="flex justify-center">
        <BarChart width={500} height={300} data={dataAreas}>
          <XAxis dataKey="area" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="promSol" name="Solución (hs)" />
          <Bar dataKey="promFin" name="Finalización (hs)" />
        </BarChart>
      </div>

      {/* GRÁFICO RADAR */}
      <div className="flex justify-center">
        <RadarChart width={500} height={400} data={dataAreas} outerRadius={120}>
          <PolarGrid />
          <PolarAngleAxis dataKey="area" />
          <Radar name="Solución" dataKey="promSol" fillOpacity={0.6} />
          <Radar name="Finalización" dataKey="promFin" fillOpacity={0.6} />
          <Legend />
        </RadarChart>
      </div>

      {/* TABLA POR PERSONAL */}
      <div>
        <h3 className="font-bold mb-2">👷 Promedios por personal</h3>
        <table className="w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2">Personal</th>
              <th className="border p-2">Solución (hs)</th>
              <th className="border p-2">Finalización (hs)</th>
            </tr>
          </thead>
          <tbody>
            {dataPersonal.map(p => (
              <tr key={p.nombre}>
                <td className="border p-2">{p.nombre}</td>
                <td className="border p-2 text-center">{p.promSol.toFixed(2)}</td>
                <td className="border p-2 text-center">{p.promFin.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ALERTA ÁREAS LENTAS */}
      {areasLentas.length > 0 && (
        <div className="bg-red-100 p-4 rounded">
          <h3 className="font-bold text-red-700">
            ⚠️ Áreas lentas detectadas
          </h3>
          <ul className="list-disc ml-5">
            {areasLentas.map(a => (
              <li key={a.area}>
                {a.area} – {a.promSol.toFixed(2)} hs
              </li>
            ))}
          </ul>
        </div>
      )}

    </div>
  );
}
