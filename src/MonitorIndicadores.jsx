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
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, LabelList } from "recharts";

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

function TarjetaKPI({ titulo, valor, clase, formula = "" }) {
  return (
    <div className={`rounded-lg border border-white/10 px-3 py-2 shadow-sm ${clase}`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[9px] 2xl:text-[10px] uppercase tracking-[0.1em] text-white/70 font-semibold leading-none">{titulo}</p>
        <p className="text-xl 2xl:text-2xl font-black leading-none tabular-nums">{valor}</p>
      </div>
      {formula && (
        <p className="mt-1.5 text-[7px] 2xl:text-[8px] leading-tight text-white/55">
          {formula}
        </p>
      )}
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
    <div className={`h-full min-h-0 rounded-lg border px-2 py-1.5 flex flex-col items-center justify-center text-center ${color}`}>
      <Icono className={`text-xl 2xl:text-2xl mb-1 shrink-0 ${!activo && !restringido ? "animate-pulse" : ""}`} />
      <p className="text-[8px] 2xl:text-[9px] font-bold leading-[1.05] text-white/90 line-clamp-2">{nombre}</p>
      {detalle && <p className="text-[7px] 2xl:text-[8px] text-white/40 leading-none mt-0.5 line-clamp-1">{detalle}</p>}
    </div>
  );
}

export default function MonitorIndicadores() {
  const [resumen, setResumen] = useState(null);
  const [indicadoresPreventivos, setIndicadoresPreventivos] = useState(null);
  const [edadEquipos, setEdadEquipos] = useState([]);
  const [detalleEdadEquipos, setDetalleEdadEquipos] = useState([]);
  const [rangoEdadSeleccionado, setRangoEdadSeleccionado] = useState(null);
  const [criterioEdad, setCriterioEdad] = useState("familia");
  const [grupoEdadSeleccionado, setGrupoEdadSeleccionado] = useState(null);
  const [resumenTareas, setResumenTareas] = useState({
    total: 0,
    pendientes: 0,
    enProceso: 0,
    finalizadas: 0
  });
  const [error, setError] = useState("");
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);
  const [modulos, setModulos] = useState({ estado_equipos: true, tareas_mantenimiento: true, envejecimiento_parque: true });
  useEffect(() => {
    let activo = true;
    const leer = async () => {
      try {
        const r = await fetch(`${API_URL.Base}/api/monitor-indicadores/config`, { cache: "no-store" });
        if (!r.ok) return;
        const d = await r.json();
        if (activo && d.configuracion) setModulos(d.configuracion);
      } catch (e) { console.error("Configuración de monitor:", e); }
    };
    leer();
    const temporizador = setInterval(leer, 30000);
    return () => { activo = false; clearInterval(temporizador); };
  }, []);


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
        const [resEquipos, resTareas, resIndicadores, resEdadEquipos] = await Promise.all([
          fetch(API_URL.DashboardResumen, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store"
          }),
          fetch(`${API_URL.Tareas}?panel=true`, {
            cache: "no-store"
          }),
          fetch(`${API_URL.Base}/api/indicadores/preventivos`, {
            cache: "no-store"
          }),
          fetch(`${API_URL.Base}/api/indicadores/edad-equipos`, {
            cache: "no-store"
          })
        ]);

        if (!resEquipos.ok) throw new Error(`Error equipos HTTP ${resEquipos.status}`);
        if (!resTareas.ok) throw new Error(`Error tareas HTTP ${resTareas.status}`);
        if (!resIndicadores.ok) throw new Error(`Error indicadores HTTP ${resIndicadores.status}`);
        if (!resEdadEquipos.ok) throw new Error(`Error edad equipos HTTP ${resEdadEquipos.status}`);

        const [dataEquipos, dataTareas, dataIndicadores, dataEdadEquipos] = await Promise.all([
          resEquipos.json(),
          resTareas.json(),
          resIndicadores.json(),
          resEdadEquipos.json()
        ]);

        if (!activo) return;

        const tareas = Array.isArray(dataTareas) ? dataTareas : [];

        setResumen(dataEquipos);
        setIndicadoresPreventivos(dataIndicadores);
        setEdadEquipos(Array.isArray(dataEdadEquipos?.grupos) ? dataEdadEquipos.grupos : []);
        setDetalleEdadEquipos(Array.isArray(dataEdadEquipos?.equipos) ? dataEdadEquipos.equipos : []);
        setResumenTareas({
          total: tareas.length,
          pendientes: tareas.filter((t) => !t.solucion && !t.fin).length,
          enProceso: tareas.filter((t) => t.solucion && !t.fin).length,
          finalizadas: tareas.filter((t) => t.fin).length
        });
        setError("");
        setUltimaActualizacion(new Date());
      } catch (e) {
        if (!activo) return;
        console.error("Error cargando monitor de indicadores:", e);
        setError("No se pudo actualizar el monitor de indicadores");
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

  const filasEquipos = Math.max(1, Math.ceil(equiposLaterales.length / 2));

  const edadEquiposConPorcentaje = useMemo(() => {
    const total = edadEquipos.reduce(
      (acum, item) => acum + Number(item.cantidad || 0),
      0
    );

    return edadEquipos.map((item) => ({
      ...item,
      porcentaje:
        total > 0
          ? Number(((Number(item.cantidad || 0) / total) * 100).toFixed(1))
          : 0
    }));
  }, [edadEquipos]);

  const equiposDelRango = useMemo(() => {
    if (!rangoEdadSeleccionado) return [];
    return detalleEdadEquipos
      .filter((equipo) => equipo.rango === rangoEdadSeleccionado)
      .sort((a, b) => Number(b.edad || 0) - Number(a.edad || 0));
  }, [detalleEdadEquipos, rangoEdadSeleccionado]);

  const gruposEdad = useMemo(() => {
    const campo =
      criterioEdad === "familia"
        ? "descripcion"
        : criterioEdad === "marca"
          ? "marca_modelo"
          : "servicio";

    const mapa = new Map();

    for (const equipo of equiposDelRango) {
      const nombre = String(equipo[campo] || "").trim() ||
        (criterioEdad === "familia"
          ? "SIN FAMILIA"
          : criterioEdad === "marca"
            ? "SIN MARCA / MODELO"
            : "SIN SERVICIO");

      if (!mapa.has(nombre)) mapa.set(nombre, []);
      mapa.get(nombre).push(equipo);
    }

    const total = equiposDelRango.length;

    return [...mapa.entries()]
      .map(([nombre, equipos]) => ({
        nombre,
        cantidad: equipos.length,
        porcentaje: total > 0
          ? Number(((equipos.length / total) * 100).toFixed(1))
          : 0,
        equipos
      }))
      .sort((a, b) => b.cantidad - a.cantidad || a.nombre.localeCompare(b.nombre, "es"));
  }, [equiposDelRango, criterioEdad]);

  const abrirDetalleEdad = (rango) => {
    if (!rango) return;
    setRangoEdadSeleccionado(rango);
    setCriterioEdad("familia");
    setGrupoEdadSeleccionado(null);
  };

  const cerrarDetalleEdad = () => {
    setRangoEdadSeleccionado(null);
    setGrupoEdadSeleccionado(null);
  };

  return (
    <div className="fixed inset-0 bg-slate-950 text-white overflow-hidden">
      <div className="absolute inset-0 grid overflow-hidden" style={{ gridTemplateColumns: modulos.estado_equipos ? "20% 80%" : "0% 100%" }}>
        <aside style={{ display: modulos.estado_equipos ? "flex" : "none" }} className="min-w-0 min-h-0 border-r border-white/10 bg-slate-900/95 p-2 flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 mb-2 shrink-0">
            <img src="/logosmall_old.png" alt="Ingeniería Clínica" className="w-8 h-auto shrink-0" />
            <div className="min-w-0">
              <p className="text-[8px] 2xl:text-[9px] text-cyan-400 uppercase tracking-[0.1em] font-semibold leading-none">Ingeniería Clínica</p>
              <h1 className="text-sm 2xl:text-base font-black leading-tight truncate">Estado de equipos</h1>
            </div>
          </div>

          <div className="space-y-1.5 shrink-0">
            <TarjetaKPI titulo="Total equipos" valor={resumen?.total ?? "—"} clase="bg-slate-800" />
            <TarjetaKPI titulo="Activos" valor={resumen?.activos ?? "—"} clase="bg-emerald-700/80" />
            <TarjetaKPI titulo="Fuera de servicio" valor={resumen?.no_activos ?? "—"} clase="bg-red-700/85" />
          </div>

          <div className="mt-2 mb-1.5 shrink-0">
            <h2 className="text-[9px] 2xl:text-[10px] font-bold uppercase tracking-[0.08em] text-white/55">Equipos y servicios críticos</h2>
          </div>

          <div
            className="grid grid-cols-2 gap-1.5 flex-1 min-h-0 overflow-hidden"
            style={{ gridTemplateRows: `repeat(${filasEquipos}, minmax(0, 1fr))` }}
          >
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

          <div className="pt-1.5 mt-1.5 border-t border-white/10 text-[7px] 2xl:text-[8px] text-white/30 shrink-0 truncate">
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

        <main className="min-w-0 min-h-0 p-2 2xl:p-3 overflow-hidden">
          <div className="h-full w-full overflow-hidden">
            <div style={{ display: modulos.tareas_mantenimiento ? "block" : "none" }}><div className="mb-1.5">
              <h2 className="text-sm 2xl:text-base font-black leading-tight">
                Indicadores de tareas de mantenimiento
              </h2>
            </div>

            <div className="grid grid-cols-4 gap-1.5 2xl:gap-2">
              <TarjetaKPI
                titulo="Total tareas"
                valor={resumenTareas.total}
                clase="bg-blue-700/80"
              />
              <TarjetaKPI
                titulo="Pendientes"
                valor={resumenTareas.pendientes}
                clase="bg-amber-700/80"
              />
              <TarjetaKPI
                titulo="En proceso"
                valor={resumenTareas.enProceso}
                clase="bg-cyan-700/80"
              />
              <TarjetaKPI
                titulo="Finalizadas"
                valor={resumenTareas.finalizadas}
                clase="bg-emerald-700/80"
              />
            </div>

            <div className="mt-3 2xl:mt-4">
              <h2 className="text-sm 2xl:text-base font-black leading-tight mb-1.5">
                Indicadores de mantenimiento preventivo
              </h2>

              <div className="grid grid-cols-4 gap-1.5 2xl:gap-2">
                <TarjetaKPI
                  titulo="Equipos con cobertura"
                  valor={indicadoresPreventivos?.detalle
                    ? indicadoresPreventivos.detalle.cubiertos
                    : "—"}
                  clase="bg-slate-700/80"
                  formula="Cantidad de equipos vigentes con período preventivo asignado"
                />

                <TarjetaKPI
                  titulo="Cobertura preventiva"
                  valor={indicadoresPreventivos
                    ? `${indicadoresPreventivos.cobertura_preventiva}%`
                    : "—"}
                  clase="bg-indigo-700/80"
                  formula="Equipos con período preventivo / Total de equipos vigentes × 100"
                />
                <TarjetaKPI
                  titulo="Cumplimiento preventivo"
                  valor={indicadoresPreventivos
                    ? `${indicadoresPreventivos.cumplimiento_preventivo}%`
                    : "—"}
                  clase="bg-violet-700/80"
                  formula="Preventivos en término / Equipos cubiertos con fecha calculable × 100"
                />
                <TarjetaKPI
                  titulo="Equipos operativos"
                  valor={indicadoresPreventivos
                    ? `${indicadoresPreventivos.equipos_operativos}%`
                    : "—"}
                  clase="bg-emerald-700/80"
                  formula="Equipos Activo o Activo restringido / Total de equipos vigentes × 100"
                />
              </div>
            </div>

            </div>
            <div style={{ display: modulos.envejecimiento_parque ? "block" : "none" }} className="mt-3 2xl:mt-4">
              <h2 className="text-sm 2xl:text-base font-black leading-tight mb-1">
                Envejecimiento del parque tecnológico
              </h2>
              <p className="text-[8px] 2xl:text-[9px] text-white/50 mb-2">
                Edad de los equipos vigentes agrupada cada 5 años según fecha de alta
              </p>

              <div className="h-[210px] 2xl:h-[250px] rounded-lg border border-white/10 bg-slate-900/70 p-2">
                {edadEquipos.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs text-white/40">
                    Sin datos suficientes de fecha de alta
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={edadEquiposConPorcentaje}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                      <XAxis
                        dataKey="rango"
                        tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 10 }}
                        label={{ value: "Edad (años)", position: "insideBottom", offset: -2, fill: "rgba(255,255,255,0.5)", fontSize: 9 }}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 10 }}
                      />
                      <Tooltip
                        formatter={(value, name, props) => {
                          if (name === "Equipos") {
                            return [
                              `${value} equipos (${props?.payload?.porcentaje ?? 0}%)`,
                              "Equipos"
                            ];
                          }
                          return [value, name];
                        }}
                        labelFormatter={(label) => `${label} años`}
                        contentStyle={{
                          background: "rgba(15,23,42,0.96)",
                          border: "1px solid rgba(255,255,255,0.12)",
                          borderRadius: 8,
                          color: "#fff"
                        }}
                      />
                      <Bar
                        dataKey="cantidad"
                        name="Equipos"
                        fill="currentColor"
                        radius={[4, 4, 0, 0]}
                        className="text-cyan-500 cursor-pointer"
                        onClick={(data) => abrirDetalleEdad(data?.rango)}
                      >
                        <LabelList
                          dataKey="porcentaje"
                          position="top"
                          formatter={(value) => `${value}%`}
                          fill="rgba(255,255,255,0.9)"
                          fontSize={10}
                          fontWeight={700}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {rangoEdadSeleccionado && (
        <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-6xl max-h-[90vh] bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-white/10 bg-slate-800/80">
              <div>
                <h2 className="text-lg 2xl:text-xl font-black">
                  Envejecimiento tecnológico · {rangoEdadSeleccionado} años
                </h2>
                <p className="text-xs text-white/50 mt-1">
                  {equiposDelRango.length} equipos en este rango de antigüedad
                </p>
              </div>
              <button
                type="button"
                onClick={cerrarDetalleEdad}
                className="text-white/60 hover:text-white text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[calc(90vh-76px)]">
              <div className="flex flex-wrap gap-2 mb-4">
                {[
                  ["familia", "Familia de equipos"],
                  ["marca", "Marca / modelo"],
                  ["servicio", "Servicio"]
                ].map(([valor, etiqueta]) => (
                  <button
                    key={valor}
                    type="button"
                    onClick={() => {
                      setCriterioEdad(valor);
                      setGrupoEdadSeleccionado(null);
                    }}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold border ${
                      criterioEdad === valor
                        ? "bg-cyan-600 border-cyan-400 text-white"
                        : "bg-slate-800 border-white/10 text-white/65 hover:bg-slate-700"
                    }`}
                  >
                    {etiqueta}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[42%_58%] gap-4">
                <div className="space-y-2">
                  {gruposEdad.map((grupo) => {
                    const seleccionado = grupoEdadSeleccionado === grupo.nombre;

                    return (
                      <button
                        key={grupo.nombre}
                        type="button"
                        onClick={() =>
                          setGrupoEdadSeleccionado(
                            seleccionado ? null : grupo.nombre
                          )
                        }
                        className={`w-full text-left rounded-xl border p-3 transition ${
                          seleccionado
                            ? "bg-cyan-950/70 border-cyan-500"
                            : "bg-slate-800/80 border-white/10 hover:border-white/25"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-semibold text-sm truncate">
                            {grupo.nombre}
                          </span>
                          <span className="shrink-0 text-lg font-black tabular-nums">
                            {grupo.cantidad}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1 text-[10px] text-white/50">
                          <span>{grupo.porcentaje}% del rango</span>
                          <span>{seleccionado ? "Ocultar equipos" : "Ver equipos"}</span>
                        </div>
                        <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full bg-cyan-500 rounded-full"
                            style={{ width: `${grupo.porcentaje}%` }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="rounded-xl border border-white/10 bg-slate-950/60 overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/10">
                    <h3 className="font-bold text-sm">
                      {grupoEdadSeleccionado
                        ? grupoEdadSeleccionado
                        : "Equipos del rango"}
                    </h3>
                    <p className="text-[10px] text-white/45 mt-0.5">
                      {grupoEdadSeleccionado
                        ? "Detalle de los equipos pertenecientes al grupo seleccionado"
                        : "Seleccione un grupo a la izquierda para filtrar el detalle"}
                    </p>
                  </div>

                  <div className="max-h-[55vh] overflow-y-auto divide-y divide-white/5">
                    {(grupoEdadSeleccionado
                      ? gruposEdad.find((g) => g.nombre === grupoEdadSeleccionado)?.equipos || []
                      : equiposDelRango
                    ).map((equipo) => (
                      <div key={equipo.id} className="px-4 py-3 text-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-bold text-white/90 truncate">
                              {equipo.descripcion || "Sin descripción"}
                            </p>
                            <p className="text-xs text-white/55 mt-0.5">
                              {equipo.marca_modelo || "Sin marca / modelo"}
                            </p>
                          </div>
                          <span className="shrink-0 px-2 py-1 rounded-lg bg-cyan-500/15 text-cyan-300 text-xs font-bold">
                            {equipo.edad} años
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 text-[10px] text-white/45">
                          <span>Serie: <b className="text-white/70">{equipo.numero_serie || "-"}</b></span>
                          <span>Estado: <b className="text-white/70">{equipo.estado || "-"}</b></span>
                          <span>Servicio: <b className="text-white/70">{equipo.servicio || "-"}</b></span>
                          <span>Subservicio: <b className="text-white/70">{equipo.sub_servicio || "-"}</b></span>
                          <span>Área: <b className="text-white/70">{equipo.area || "-"}</b></span>
                        </div>
                      </div>
                    ))}

                    {equiposDelRango.length === 0 && (
                      <div className="p-8 text-center text-white/40 text-sm">
                        No hay equipos para este rango.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
