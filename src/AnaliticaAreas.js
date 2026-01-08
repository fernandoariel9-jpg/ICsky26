import React, { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";

const API_TAREAS = "https://sky26.onrender.com/tareas";

const COLORES_AREAS = {
  "Area 1": "#EEF207",
  "Area 2": "#EF4444",
  "Area 3": "#10B981",
  "Area 4": "#3B82F6",
  "Area 5": "#D25CF6",
  "Area 6": "#f88408ff",
  "Sin área": "#6B7280",
};

export default function AnaliticaAreas() {
  const [tareas, setTareas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(API_TAREAS)
      .then((res) => {
        if (!res.ok) throw new Error("Error API");
        return res.json();
      })
      .then((data) => {
        setTareas(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("Error cargando tareas:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-lg">
          📊 Cargando analítica de áreas…
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">
        📊 Analítica de tareas por Área
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* === TAREAS PENDIENTES === */}
        <Grafico
          titulo="Tareas pendientes por Área"
          iconColor="text-green-600"
          tareas={tareas.filter(t => !t.fin && !t.solucion)}
        />

        {/* === TAREAS EN PROCESO === */}
        <Grafico
          titulo="Tareas en proceso por Área"
          iconColor="text-blue-600"
          tareas={tareas.filter(t => t.solucion && !t.fin)}
        />

      </div>
    </div>
  );
}

function Grafico({ titulo, iconColor, tareas }) {
  const data = Object.entries(
    tareas.reduce((acc, t) => {
      const area = t.reasignado_a || t.area || "Sin área";
      acc[area] = (acc[area] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  return (
    <div className="p-4 shadow-md bg-white rounded-xl">
      <h2 className={`text-lg font-semibold mb-2 flex items-center ${iconColor}`}>
        <PieChartIcon className="mr-2" />
        {titulo}
      </h2>

      <ResponsiveContainer width="100%" height={350}>
        <PieChart>
          <Pie
  data={data}
  dataKey="value"
  cx="50%"
  cy="50%"
  innerRadius={70}
  outerRadius={120}
  label={({ name, value }) => (
    <text
      fill="#000"
      fontSize={12}
      fontWeight="bold"
    >
      {`${name}: ${value}`}
    </text>
  )}
>
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={COLORES_AREAS[entry.name] || "#6B7280"}
              />
            ))}
          </Pie>

          <Tooltip
  contentStyle={{
    backgroundColor: "#fff",
    border: "1px solid #000",
    color: "#000",
    fontSize: "13px",
  }}
  itemStyle={{ color: "#000" }}
  labelStyle={{ color: "#000", fontWeight: "bold" }}
/>
          <Legend
  wrapperStyle={{
    color: "#000",
    fontSize: "13px",
    fontWeight: 500,
  }}
/>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
