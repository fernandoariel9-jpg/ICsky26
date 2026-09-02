import React from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/**
 * Componente compacto y reutilizable para mostrar estadísticas de un equipo.
 * Acepta directamente el objeto devuelto por /api/estadisticas/equipo/:numero_serie.
 */
export default function EstadisticasEquipo({ equipo, className = "" }) {
  if (!equipo) return null;

  const correctivos = Number(
    equipo.mantenimientos?.correctivos ?? equipo.correctivos
  ) || 0;
  const preventivos = Number(
    equipo.mantenimientos?.preventivos ?? equipo.preventivos
  ) || 0;
  const totalMantenimientos = Number(
    equipo.mantenimientos?.total ?? equipo.total_mantenimientos
  ) || correctivos + preventivos;

  const diasFueraServicio = Number(
    equipo.dias_fuera_servicio ?? equipo.diasFueraServicio
  ) || 0;

  const equiposSimilares = Number(
    equipo.equipos_similares ?? equipo.equiposSimilares
  ) || 0;

  const evolucionIngresos = Array.isArray(equipo.evolucion_ingresos)
    ? equipo.evolucion_ingresos
        .map((registro) => ({
          periodo: String(registro.periodo ?? ""),
          ingresos: Number(registro.ingresos) || 0,
        }))
        .filter((registro) => registro.periodo)
    : [];

  let tendencia = null;
  if (evolucionIngresos.length >= 2) {
    const primero = evolucionIngresos[0].ingresos;
    const ultimo = evolucionIngresos[evolucionIngresos.length - 1].ingresos;

    if (ultimo > primero) tendencia = "aumenta";
    else if (ultimo < primero) tendencia = "disminuye";
    else tendencia = "estable";
  }

  const tmfDias = equipo.tmf?.dias ?? null;
  const fechaAlta = equipo.equipo?.fecha_alta ?? equipo.fecha_alta ?? null;
  const tieneFechaAlta = Boolean(fechaAlta && !Number.isNaN(new Date(fechaAlta).getTime()));
  const tieneIngresosTmf = correctivos > 0;

  const Item = ({ icon, value, label, title }) => (
    <div
      className="flex-1 min-w-0 rounded-lg bg-gray-50 border border-gray-100 px-2 py-2 text-center"
      title={title}
    >
      <div className="text-base leading-none font-bold text-gray-800">
        {icon} {value}
      </div>
      <div className="mt-1 text-[10px] leading-tight text-gray-500 truncate">
        {label}
      </div>
    </div>
  );

  return (
    <div className={`w-full ${className}`}>
      <div className="flex gap-1.5 overflow-hidden">
        <Item icon="🔧" value={correctivos} label="Correctivos" />
        <Item icon="🛠️" value={preventivos} label="Preventivos" />
        <Item icon="📋" value={totalMantenimientos} label="Total" />
        <Item icon="⏱️" value={diasFueraServicio} label="Días fuera" />
        <Item icon="👥" value={equiposSimilares} label="Similares" />
      </div>

      <div className="mt-3 rounded-lg border border-gray-100 bg-white px-3 py-3">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div>
            <div className="text-xs font-semibold text-gray-800">
              Evolución de ingresos a mantenimiento
            </div>
            <div className="text-[10px] text-gray-500">
              Cantidad de ingresos correctivos por año
            </div>
          </div>

          {tendencia === "aumenta" && (
            <span className="shrink-0 text-[11px] font-semibold text-green-600">
              📈 Aumenta
            </span>
          )}
          {tendencia === "disminuye" && (
            <span className="shrink-0 text-[11px] font-semibold text-red-600">
              📉 Disminuye
            </span>
          )}
          {tendencia === "estable" && (
            <span className="shrink-0 text-[11px] font-semibold text-gray-600">
              ➡️ Estable
            </span>
          )}
        </div>

        {evolucionIngresos.length > 0 ? (
          <div className="w-full h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={evolucionIngresos}
                margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="periodo" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(value) => [value, "Ingresos"]}
                  labelFormatter={(label) => `Año: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="ingresos"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="rounded-md bg-gray-50 border border-gray-100 px-3 py-4 text-center text-[11px] text-gray-500">
            No hay ingresos correctivos registrados para este equipo.
          </div>
        )}

        {evolucionIngresos.length === 1 && (
          <div className="mt-1 text-center text-[10px] text-gray-400">
            Se necesita más de un período para determinar una tendencia.
          </div>
        )}
      </div>

      <div className="mt-2 rounded-lg border border-gray-100 bg-white px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-xs font-semibold text-gray-800">TMF</div>
            <div className="text-[10px] text-gray-500">
              Tiempo medio de funcionamiento entre ingresos
            </div>
          </div>
          <div className="text-base font-bold text-gray-800">
            {tmfDias != null ? `${Number(tmfDias).toFixed(1)} días` : "Sin datos"}
          </div>
        </div>

        {tmfDias == null && (
          <div className="mt-2 rounded-md bg-amber-50 border border-amber-100 px-2.5 py-2 text-[10px] leading-relaxed text-amber-800">
            {!tieneFechaAlta
              ? "No se puede calcular el TMF: falta la fecha de alta del equipo."
              : !tieneIngresosTmf
                ? "No se puede calcular el TMF: no hay ingresos correctivos registrados."
                : "No se puede calcular el TMF: faltan datos necesarios para el cálculo."}
          </div>
        )}
      </div>
    </div>
  );
}
