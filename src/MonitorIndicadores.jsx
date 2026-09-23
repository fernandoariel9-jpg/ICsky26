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
    <div className={`rounded-lg border border-white/10 px-2.5 py-1.5 shadow-sm ${clase}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[9px] 2xl:text-[10px] uppercase tracking-[0.1em] text-white/70 font-semibold leading-none">{titulo}</p>
        <p className="text-xl 2xl:text-2xl font-black leading-none tabular-nums">{valor}</p>
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
    <div className={`h-[56px] 2xl:h-[62px] rounded-lg border px-1.5 py-1 flex flex-col items-center justify-center text-center ${color}`}>
      <Icono className={`text-lg 2xl:text-xl mb-0.5 shrink-0 ${!activo && !restringido ? "animate-pulse" : ""}`} />
      <p className="text-[8px] 2xl:text-[9px] font-bold leading-[1.05] text-white/90 line-clamp-2">{nombre}</p>
      {detalle && <p className="text-[7px] 2xl:text-[8px] text-white/35 leading-none mt-0.5 line-clamp-1">{detalle}</p>}
    </div>
  );
}

export default function MonitorIndicadores() {
  const [resumen, setResumen] = useState(null);
  const [error, setError] = useState("");
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById("root");

    const prev = {
      htmlOverflow: html.style.overflow,
      htmlWidth: html.style.width,
      htmlHeight: html.style.height,
      bodyOverflow: body.style.overflow,
      bodyWidth: body.style.width,
      bodyHeight: body.style.height,
      bodyMargin: body.style.margin,
      rootOverflow: root?.style.overflow || "",
      rootWidth: root?.style.width || "",
      rootHeight: root?.style.height || ""
    };

    html.style.overflow = "hidden";
    html.style.width = "100%";
    html.style.height = "100%";
    body.style.overflow = "hidden";
    body.style.width = "100%";
    body.style.height = "100%";
    body.style.margin = "0";

    if (root) {
      root.style.overflow = "hidden";
      root.style.width = "100%";
      root.style.height = "100%";
    }

    return () => {
      html.style.overflow = prev.htmlOverflow;
      html.style.width = prev.htmlWidth;
      html.style.height = prev.htmlHeight;
      body.style.overflow = prev.bodyOverflow;
      body.style.width = prev.bodyWidth;
      body.style.height = prev.bodyHeight;
      body.style.margin = prev.bodyMargin;
      if (root) {
        root.style.overflow = prev.rootOverflow;
        root.style.width = prev.rootWidth;
        root.style.height = prev.rootHeight;
      }
    };
  }, []);

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
    <div className="fixed inset-0 bg-slate-950 text-white overflow-hidden">
      <div className="absolute inset-0 grid grid-cols-[20%_80%] overflow-hidden">
        <aside className="min-w-0 min-h-0 border-r border-white/10 bg-slate-900/95 p-2 flex flex-col overflow-hidden">
          <div className="flex items-center gap-1.5 mb-1.5 shrink-0">
            <img src="/logosmall_old.png" alt="Ingeniería Clínica" className="w-7 h-auto shrink-0" />
            <div className="min-w-0">
              <p className="text-[8px] 2xl:text-[9px] text-cyan-400 uppercase tracking-[0.1em] font-semibold leading-none">Ingeniería Clínica</p>
              <h1 className="text-xs 2xl:text-sm font-black leading-tight truncate">Estado de equipos</h1>
            </div>
          </div>

          <div className="space-y-1 shrink-0">
            <TarjetaKPI titulo="Total equipos" valor={resumen?.total ?? "—"} clase="bg-slate-800" />
            <TarjetaKPI titulo="Activos" valor={resumen?.activos ?? "—"} clase="bg-emerald-700/80" />
            <TarjetaKPI titulo="Fuera de servicio" valor={resumen?.no_activos ?? "—"} clase="bg-red-700/85" />
          </div>

          <div className="mt-1.5 mb-1 shrink-0">
            <h2 className="text-[8px] 2xl:text-[9px] font-bold uppercase tracking-[0.08em] text-white/50">Equipos y servicios críticos</h2>
          </div>

          <div className="grid grid-cols-2 gap-1 content-start min-h-0 overflow-hidden">
            {!resumen && !error && (
              <div className="col-span-2 rounded-lg bg-white/5 p-2 text-center text-[9px] text-white/50">Cargando...</div>
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

          <div className="mt-auto pt-1 border-t border-white/10 text-[7px] 2xl:text-[8px] text-white/30 shrink-0 truncate">
            {error ? (
              <span className="text-red-400">⚠ {error}</span>
            ) : (
              <span>
                Actualización 30 s
                {ultimaActualizacion ? ` · ${ultimaActualizacion.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}` : ""}
              </span>
            )}
          </div>
        </aside>

        <main className="min-w-0 min-h-0 p-3 2xl:p-4 overflow-hidden">
          <div className="h-full w-full rounded-2xl border border-white/10 bg-slate-900/40 flex items-center justify-center overflow-hidden">
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
