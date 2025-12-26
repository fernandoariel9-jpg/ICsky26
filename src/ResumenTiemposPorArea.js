import React, { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, Cell
} from "recharts";
import { API_URL } from "./config";

const COLORES_AREAS = {
  "Area 1": "#EEF207",
  "Area 2": "#EF4444",
  "Area 3": "#10B981",
  "Area 4": "#3B82F6",
  "Area 5": "#D25CF6",
  "Area 6": "#f88408ff",
  "Sin área": "#6B7280",
};

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

  const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

  // =======================
  // PROCESO POR ÁREA
  // =======================
  const dataAreas = datos.map(d => ({
  area: d.area,
  promSol: Number(d.promedio_solucion),
  promFin: Number(d.promedio_finalizacion),
  total: Number(d.total_tareas)
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

  {/* PRIMERO Finalización */}
  <Bar dataKey="promFin" name="Finalización (hs)">
    {dataAreas.map((entry, index) => (
      <Cell
        key={`fin-${index}`}
        fill={COLORES_AREAS[entry.area] || "#9CA3AF"}
      />
    ))}
  </Bar>

  {/* DESPUÉS Solución */}
  <Bar dataKey="promSol" name="Solución (hs)">
    {dataAreas.map((entry, index) => (
      <Cell
        key={`sol-${index}`}
        fill={COLORES_AREAS[entry.area] || "#9CA3AF"}
      />
    ))}
  </Bar>

</BarChart>
      </div>

      {/* GRÁFICO RADAR */}
      <div className="flex justify-center">
        <RadarChart width={500} height={400} data={dataAreas} outerRadius={120}>
  <PolarGrid />
  <PolarAngleAxis dataKey="area" />

  {dataAreas.map((a, i) => (
    <Radar
      key={a.area}
      name={a.area}
      dataKey="promSol"
      stroke={COLORES_AREAS[a.area] || "#9CA3AF"}
      fill={COLORES_AREAS[a.area] || "#9CA3AF"}
      fillOpacity={0.3}
    />
  ))}

  <Legend />
</RadarChart>
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
