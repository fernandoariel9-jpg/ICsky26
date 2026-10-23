export default function NavegacionResumenRIC({ etapas, irAEtapa, deshabilitado = false }) {
  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 mb-4">
      <p className="font-semibold text-indigo-900 mb-1">Revisar o corregir verificaciones</p>
      <p className="text-xs text-indigo-800 mb-3">
        Seleccioná la etapa que quieras revisar después del mantenimiento correctivo.
        Guardá el avance actualizado antes de finalizar el preventivo.
      </p>
      <div className="grid grid-cols-2 gap-2">
        {etapas.map((nombre, indice) => (
          <button
            key={indice}
            type="button"
            disabled={deshabilitado}
            onClick={() => irAEtapa(indice)}
            className="rounded-lg bg-white border border-indigo-300 px-2 py-2 text-xs font-semibold text-indigo-800 hover:bg-indigo-100 disabled:opacity-50"
          >
            {indice + 1}. {nombre}
          </button>
        ))}
      </div>
    </div>
  );
}
