import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

const API = "https://sky26.onrender.com/equipos/publico";

function formatearFecha(valor) {
  if (!valor) return "-";
  const [anio, mes, dia] = String(valor).slice(0, 10).split("-");
  if (!anio || !mes || !dia) return valor;
  return `${dia}/${mes}/${anio}`;
}

function textoPeriodo(periodo) {
  if (periodo === null || periodo === undefined || periodo === "") return "No configurada";
  const numero = Number(periodo);
  if (Number.isFinite(numero)) {
    return `${numero} ${numero === 1 ? "mes" : "meses"}`;
  }
  return String(periodo);
}

export default function EquipoPublico() {
  const { numeroSerie } = useParams();
  const [equipo, setEquipo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;

    const cargar = async () => {
      setCargando(true);
      setError("");

      try {
        const res = await fetch(`${API}/${encodeURIComponent(numeroSerie || "")}`, {
          cache: "no-store"
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data.error || "No se pudo obtener el equipo");
        }

        if (activo) setEquipo(data);
      } catch (e) {
        if (activo) setError(e.message || "Error al consultar el equipo");
      } finally {
        if (activo) setCargando(false);
      }
    };

    cargar();
    return () => { activo = false; };
  }, [numeroSerie]);

  const estado = useMemo(() => {
    if (!equipo) return null;

    const mapa = {
      EN_TERMINO: {
        titulo: "Mantenimiento en término",
        detalle: equipo.dias_diferencia === 0
          ? "El mantenimiento preventivo vence hoy"
          : `Faltan ${equipo.dias_diferencia} día${equipo.dias_diferencia === 1 ? "" : "s"}`,
        clase: "bg-green-100 border-green-300 text-green-800",
        icono: "🟢"
      },
      VENCIDO: {
        titulo: "Mantenimiento vencido",
        detalle: `Vencido hace ${Math.abs(equipo.dias_diferencia || 0)} día${Math.abs(equipo.dias_diferencia || 0) === 1 ? "" : "s"}`,
        clase: "bg-red-100 border-red-300 text-red-800",
        icono: "🔴"
      },
      SIN_PREVENTIVO: {
        titulo: "Sin preventivo registrado",
        detalle: "No hay una fecha de último mantenimiento preventivo registrada",
        clase: "bg-gray-100 border-gray-300 text-gray-700",
        icono: "⚪"
      },
      SIN_PERIODICIDAD: {
        titulo: "Periodicidad no configurada",
        detalle: "Existe un último preventivo, pero no se puede calcular el próximo vencimiento",
        clase: "bg-amber-100 border-amber-300 text-amber-800",
        icono: "🟠"
      }
    };

    return mapa[equipo.estado_preventivo] || mapa.SIN_PERIODICIDAD;
  }, [equipo]);

  if (cargando) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4"><div className="bg-white rounded-2xl shadow p-6 text-gray-600">Consultando equipo...</div></div>;
  }

  if (error || !equipo) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4"><div className="bg-white rounded-2xl shadow p-6 max-w-md w-full"><h1 className="text-xl font-bold text-red-700 mb-2">Equipo no disponible</h1><p className="text-gray-600">{error || "No se encontró información del equipo."}</p></div></div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
          <div className="bg-slate-800 text-white p-5 text-center">
            <img src="/logosmall_old.png" alt="Ingeniería Clínica" className="mx-auto mb-3 w-14 h-auto" />
            <div className="text-xs tracking-widest uppercase text-slate-300">Ingeniería Clínica</div>
            <h1 className="text-2xl font-bold mt-1">Información del equipo</h1>
          </div>

          <div className="p-5 space-y-5">
            <div>
              <div className="text-2xl font-bold text-gray-800">{equipo.descripcion || "Equipo"}</div>
              <div className="text-gray-600 mt-1">{equipo.marca_modelo || "Marca / modelo no informado"}</div>
              <div className="mt-2 inline-flex bg-gray-100 rounded-lg px-3 py-1 text-sm font-semibold text-gray-700">N° Serie: {equipo.numero_serie}</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 rounded-xl p-3"><div className="text-gray-500">Servicio</div><div className="font-semibold text-gray-800">{equipo.servicio || "-"}</div></div>
              <div className="bg-gray-50 rounded-xl p-3"><div className="text-gray-500">Área</div><div className="font-semibold text-gray-800">{equipo.area || "-"}</div></div>
              <div className="bg-gray-50 rounded-xl p-3"><div className="text-gray-500">Subservicio</div><div className="font-semibold text-gray-800">{equipo.sub_servicio || "-"}</div></div>
              <div className="bg-gray-50 rounded-xl p-3"><div className="text-gray-500">Estado del equipo</div><div className="font-semibold text-gray-800">{equipo.estado || "-"}</div></div>
            </div>

            <div className="border-t pt-5">
              <h2 className="font-bold text-gray-800 mb-3">Mantenimiento preventivo</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm mb-4">
                <div className="bg-blue-50 rounded-xl p-3"><div className="text-blue-600">Último preventivo</div><div className="font-bold text-gray-800 mt-1">{formatearFecha(equipo.ultimo_mant)}</div></div>
                <div className="bg-blue-50 rounded-xl p-3"><div className="text-blue-600">Periodicidad</div><div className="font-bold text-gray-800 mt-1">{textoPeriodo(equipo.periodo)}</div></div>
                <div className="bg-blue-50 rounded-xl p-3"><div className="text-blue-600">Próximo preventivo</div><div className="font-bold text-gray-800 mt-1">{formatearFecha(equipo.proximo_preventivo)}</div></div>
              </div>

              {estado && (
                <div className={`rounded-2xl border p-4 ${estado.clase}`}>
                  <div className="font-bold text-lg">{estado.icono} {estado.titulo}</div>
                  <div className="text-sm mt-1">{estado.detalle}</div>
                </div>
              )}
            </div>

            <div className="text-xs text-gray-400 text-center pt-2">
              Información pública de mantenimiento preventivo. No contiene historial técnico ni datos internos.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
