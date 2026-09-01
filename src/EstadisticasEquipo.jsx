import React from "react";

/**
 * Componente compacto y reutilizable para mostrar estadísticas de un equipo.
 * Acepta directamente el objeto devuelto por BuscarEquipo.
 * En el futuro se pueden agregar nuevas métricas aquí sin modificar cada pantalla.
 */
export default function EstadisticasEquipo({ equipo, className = "" }) {
  if (!equipo) return null;

  const correctivos = Number(equipo.correctivos) || 0;
  const preventivos = Number(equipo.preventivos) || 0;
  const totalMantenimientos = correctivos + preventivos;

  const diasFueraServicio = Number(
    equipo.dias_fuera_servicio ?? equipo.diasFueraServicio
  ) || 0;

  const equiposSimilares = Number(
    equipo.equipos_similares ?? equipo.equiposSimilares
  ) || 0;

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
    </div>
  );
}
