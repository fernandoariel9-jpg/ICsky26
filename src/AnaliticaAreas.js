import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";

const COLORES_AREAS = {
  "Area 1": "#EEF207",
  "Area 2": "#EF4444",
  "Area 3": "#10B981",
  "Area 4": "#3B82F6",
  "Area 5": "#D25CF6",
  "Area 6": "#f88408ff",
  "Sin área": "#6B7280",
};

export default function AnaliticaAreas({ tareas = [], handleAreaClick }) {

  if (!Array.isArray(tareas) || tareas.length === 0) {
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
        <div className="p-4 shadow-md bg-white rounded-xl">
          <h2 className="text-lg font-semibold mb-2 flex items-center">
            <PieChartIcon className="mr-2 text-green-600" />
            Tareas pendientes por Área
          </h2>

          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={Object.entries(
                  tareas.reduce((acc, t) => {
                    if (!t.fin && !t.solucion) {
                      const area = t.reasignado_a || t.area || "Sin área";
                      acc[area] = (acc[area] || 0) + 1;
                    }
                    return acc;
                  }, {})
                ).map(([name, value]) => ({ name, value }))}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={120}
                dataKey="value"
                label
                onClick={(d) => handleAreaClick?.(d.name)}
              >
                {Object.keys(COLORES_AREAS).map((area) => (
                  <Cell key={area} fill={COLORES_AREAS[area]} />
                ))}
              </Pie>

              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* === TAREAS EN PROCESO === */}
        <div className="p-4 shadow-md bg-white rounded-xl">
          <h2 className="text-lg font-semibold mb-2 flex items-center">
            <PieChartIcon className="mr-2 text-blue-600" />
            Tareas en proceso por Área
          </h2>

          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={Object.entries(
                  tareas.reduce((acc, t) => {
                    if (t.solucion && !t.fin) {
                      const area = t.reasignado_a || t.area || "Sin área";
                      acc[area] = (acc[area] || 0) + 1;
                    }
                    return acc;
                  }, {})
                ).map(([name, value]) => ({ name, value }))}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={120}
                dataKey="value"
                label
                onClick={(d) => handleAreaClick?.(d.name)}
              >
                {Object.keys(COLORES_AREAS).map((area) => (
                  <Cell key={area} fill={COLORES_AREAS[area]} />
                ))}
              </Pie>

              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
}
