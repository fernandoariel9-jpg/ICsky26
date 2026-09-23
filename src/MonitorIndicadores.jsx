import { useEffect, useMemo, useState } from "react";
import { API_URL } from "./config";
import {
  FaBrain,
  FaXRay,
  FaHeartbeat,
  FaWaveSquare,
  FaDesktop,
  FaThermometerHalf,
  FaQuestionCircle,
  FaHospital,
  FaUserMd,
  FaProcedures
} from "react-icons/fa";
import {
  MdBiotech,
  MdOutlineScience,
  MdMemory,
  MdMonitorHeart,
  MdMedicalServices
} from "react-icons/md";
import { GiElectric } from "react-icons/gi";

const iconosEquipos = {
  RESONADOR: FaBrain,
  MAMOGRAFO: MdMonitorHeart,
  ANGIOGRAFO: FaHeartbeat,
  "CITOMETRO DE FLUJO": MdBiotech,
  PLETISMOGRAFO: FaWaveSquare,
  "MONITOR MULTIPARAMETRICO RMN": FaDesktop,
  "COLCHON TERMICO": FaThermometerHalf,
  ESPECTROMETRO: MdOutlineScience,
  MULTIPLEX: MdMemory,
  "ELECTROFORESIS CAPILAR": GiElectric
};

const iconosServicios = {
  diagnostico_imagen: FaHospital,
  centro_quirurgico: FaProcedures,
  gastroenterologia: FaUserMd,
  tomografos: FaXRay
};

const nombreServicios = {
  diagnostico_imagen: "Equipos de RX",
  centro_quirurgico: "Centro Quirúrgico",
  gastroenterologia: "Gastroenterología"
};

function TarjetaKPI({ titulo, valor, clase }) {
  return (
    <div className={`rounded-2xl border border-white/10 p-4 2xl:p-5 shadow-lg ${clase}`}>
      <div className="flex items-end justify-between gap-3">
        <p className="text-sm 2xl:text-base uppercase tracking-[0.16em] text-white/70 font-semibold">{titulo}</p>
        <p className="text-4xl 2xl:text-5xl font-black leading-none tabular-nums">{valor}</p>
      </div>
    </div>
  );
}

function TarjetaEquipo({ nombre, estado, Icono, detalle }) {
  const estadoNormalizado = String(estado || "").trim().toUpperCase();
  const activo = estadoNormalizado === "ACTIVO" || estadoNormalizado === "ON";
  const restringido = estadoNormalizado === "ACTIVO RESTRINGIDO";
  const color = activo
    ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/5"
    : restringido
      ? "text-amber-400 border-amber-500/20 bg-amber-500/5"
      : "text-red-400 border-red-500/25 bg-red-500/10";

  return (
    <div className={`min-h-[122px] 2xl:min-h-[148px] rounded-2xl border p-3 2xl:p-4 flex flex-col items-center justify-center text-center ${color}`}>
      <Icono className={`text-4xl 2xl:text-5xl mb-2 ${!activo && !restringido ? "animate-pulse" : ""}`} />
      <p className="text-xs 2xl:text-sm font-bold leading-tight text-white/90">{nombre}</p>
      {detalle && <p className="text-[10px] 2xl:text-xs text-white/45 mt-1">{detalle}</p>}
    </div>
  );
}

export default function MonitorIndicadores() {
  const [resumen, setResumen] = useState(null);
  const [error, setError] = useState("");
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);

  useEffect(() => {
    let activo = true;

    const cargar = async () => {
      const token = localStorage.getItem("tokenResumen");
      if (!token) {
        if (activo) setError("Falta el acceso guardado de Resumen de Estados");
        return;
      }

      try {
        const res = await fetch(API_URL.DashboardResumen, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store"
        });

        if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
        const data = await res.json();
        if (!activo) return;
        setResumen(data);
        setError("");
        setUltimaActualizacion(new Date());
      } catch (e) {
        if (!activo) return;
        console.error("Error cargando monitor de indicadores:", e);
        setError("No se pudo actualizar el estado de los equipos");
      }
    };

    cargar();
    const intervalo = setInterval(cargar, 30000);
    return () => {
      activo = false;
      clearInterval(intervalo);
    };
  }, []);

  const equiposLaterales = useMemo(() => {
    if (!resumen) return [];

    const criticos = [...(resumen.criticos || [])];
    const tomografos = resumen.grupos?.tomografos;

    if (tomografos) {
      const tarjetaTomografos = {
        descripcion: "TOMÓGRAFOS",
        estado: tomografos.estado === "ON" ? "ACTIVO" : "FUERA DE SERVICIO",
        icono: FaXRay,
        detalle: tomografos.subgrupos
          ? `${tomografos.subgrupos.reduce((a, g) => a + Number(g.no_activos || 0), 0)} fuera de servicio`
          : null
      };

      const indiceResonador = criticos.findIndex((eq) =>
        String(eq.descripcion || "").toUpperCase().includes("RESONADOR")
      );

      if (indiceResonador >= 0) criticos.splice(indiceResonador + 1, 0, tarjetaTomografos);
      else criticos.push(tarjetaTomografos);
    }

    const servicios = ["diagnostico_imagen", "centro_quirurgico", "gastroenterologia"]
      .map((key) => {
        const grupo = resumen.grupos?.[key];
        if (!grupo) return null;

        const fuera = Array.isArray(grupo.subgrupos)
          ? grupo.subgrupos.reduce((a, g) => a + Number(g.no_activos || 0), 0)
          : 0;
        const total = Array.isArray(grupo.subgrupos)
          ? grupo.subgrupos.reduce((a, g) => a + Number(g.total || 0), 0)
          : 0;

        return {
          descripcion: nombreServicios[key] || key,
          estado: grupo.estado === "OFF" ? "FUERA DE SERVICIO" : "ACTIVO",
          icono: iconosServicios[key] || MdMedicalServices,
          detalle: total ? `${fuera}/${total} fuera de servicio` : null
        };
      })
      .filter(Boolean);

    return [
      ...criticos.map((eq) => ({
        ...eq,
        icono: eq.icono || iconosEquipos[String(eq.descripcion || "").toUpperCase().trim()] || FaQuestionCircle
      })),
      ...servicios
    ];
  }, [resumen]);

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden">
      <div className="h-screen grid grid-cols-[minmax(360px,31vw)_1fr] 2xl:grid-cols-[minmax(470px,30vw)_1fr]">
        <aside className="h-screen border-r border-white/10 bg-slate-900/95 p-4 2xl:p-6 flex flex-col overflow-hidden">
          <div className="flex items-center gap-3 mb-4 2xl:mb-5 shrink-0">
            <img src="/logosmall_old.png" alt="Ingeniería Clínica" className="w-12 2xl:w-16 h-auto" />
            <div>
              <p className="text-xs 2xl:text-sm text-cyan-400 uppercase tracking-[0.18em] font-semibold">Ingeniería Clínica</p>
              <h1 className="text-lg 2xl:text-2xl font-black leading-tight">Estado de equipos</h1>
            </div>
          </div>

          <div className="space-y-2 2xl:space-y-3 shrink-0">
            <TarjetaKPI titulo="Total equipos" valor={resumen?.total ?? "—"} clase="bg-slate-800" />
            <TarjetaKPI titulo="Activos" valor={resumen?.activos ?? "—"} clase="bg-emerald-700/80" />
            <TarjetaKPI titulo="Fuera de servicio" valor={resumen?.no_activos ?? "—"} clase="bg-red-700/85" />
          </div>

          <div className="mt-4 2xl:mt-5 mb-2 shrink-0">
            <h2 className="text-sm 2xl:text-base font-bold uppercase tracking-[0.15em] text-white/60">Equipos y servicios críticos</h2>
          </div>

          <div className="grid grid-cols-2 gap-2 2xl:gap-3 overflow-y-auto pr-1 pb-2 content-start">
            {!resumen && !error && (
              <div className="col-span-2 rounded-2xl bg-white/5 p-8 text-center text-white/50">Cargando...</div>
            )}

            {equiposLaterales.map((eq, i) => (
              <TarjetaEquipo
                key={`${eq.descripcion}-${i}`}
                nombre={eq.descripcion}
                estado={eq.estado}
                Icono={eq.icono}
                detalle={eq.detalle}
              />
            ))}
          </div>

          <div className="mt-auto pt-3 border-t border-white/10 text-[10px] 2xl:text-xs text-white/35 shrink-0">
            {error ? (
              <span className="text-red-400">⚠ {error}</span>
            ) : (
              <span>
                Actualización automática cada 30 s
                {ultimaActualizacion ? ` · ${ultimaActualizacion.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}` : ""}
              </span>
            )}
          </div>
        </aside>

        <main className="h-screen p-6 2xl:p-10 overflow-hidden">
          <div className="h-full rounded-3xl border border-white/10 bg-slate-900/40 flex items-center justify-center">
            <div className="text-center text-white/30">
              <p className="text-3xl 2xl:text-5xl font-black">Monitor de indicadores</p>
              <p className="text-base 2xl:text-xl mt-3">Área disponible para los próximos indicadores</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
