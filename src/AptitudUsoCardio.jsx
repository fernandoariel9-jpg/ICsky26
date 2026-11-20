import { useEffect, useMemo, useState } from "react";
import { API_URL } from "./config";
import { fechaCalendario, mostrarFecha } from "./utils/fechas";
import {
  BotonesNavegacion,
  ProtocoloLayout,
  TarjetaEtapa as TarjetaEtapaBase
} from "./protocolos/ProtocoloBase";

const POTENCIAS_REFERENCIA = [50, 100, 200];
const CLAVE_EQUIPO = "equipoAptitudCardio";
const CLAVE_RIC37_AU_CARDIO = "au_cardio:ric37-contexto";
const CLAVE_RESULTADO_RIC37 = (equipoId) => `au_cardio:ric37-result:${equipoId}`;
const CLAVE_BORRADOR = (equipoId) => `au_cardio:borrador:${equipoId}`;
const ETAPAS = ["Resumen técnico del equipo", "Último mantenimiento de usuario", "Parámetros esenciales", "Verificación funcional", "Etapa 5"];

function TarjetaEtapa({ titulo, ayuda, children }) {
  return (
    <div className="mb-4 rounded-xl border-2 border-black bg-gray-100 p-4 shadow-sm">
      <h2 className="mb-2 text-xl font-bold text-gray-900">{titulo}</h2>
      {ayuda && <p className="mb-4 rounded-lg bg-white/70 p-3 text-sm text-gray-600">{ayuda}</p>}
      {children}
    </div>
  );
}


const numeroValido = (valor) => valor !== "" && Number.isFinite(Number(valor));

const dentroDeTolerancia = (medicion, referencia) => {
  if (!numeroValido(medicion) || !numeroValido(referencia) || Number(referencia) <= 0) return null;
  const valor = Number(medicion);
  const nominal = Number(referencia);
  return valor >= nominal * 0.85 && valor <= nominal * 1.15;
};

function CampoObservacion({ id, valor, onChange }) {
  return (
    <div className="mt-3">
      <label htmlFor={id} className="block text-sm font-semibold text-red-700 mb-1">
        Observación de la no conformidad *
      </label>
      <textarea
        id={id}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        placeholder="Describa el motivo de la no conformidad..."
        className="w-full border border-red-300 rounded-xl px-3 py-2 text-sm bg-white"
      />
    </div>
  );
}

function EstadoParametro({ conforme }) {
  if (conforme === null || conforme === undefined) {
    return <span className="px-2 py-1 rounded-lg bg-gray-100 text-gray-500 text-xs font-bold">PENDIENTE</span>;
  }
  return conforme
    ? <span className="px-2 py-1 rounded-lg bg-green-100 text-green-700 text-xs font-bold">CONFORME</span>
    : <span className="px-2 py-1 rounded-lg bg-red-100 text-red-700 text-xs font-bold">NO CONFORME</span>;
}

export default function AptitudUsoCardio({ setVista, personal }) {
  const equipo = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem(CLAVE_EQUIPO) || "null");
    } catch {
      return null;
    }
  }, []);

  const [medicionesPotencia, setMedicionesPotencia] = useState({ 50: "", 100: "", 200: "" });
  const [potenciaMaxFabricante, setPotenciaMaxFabricante] = useState("");
  const [potenciaMaxMedida, setPotenciaMaxMedida] = useState("");
  const [observacionesPotencia, setObservacionesPotencia] = useState({});
  const [observacionPotenciaMax, setObservacionPotenciaMax] = useState("");
  const [sincronismo, setSincronismo] = useState("");
  const [observacionSincronismo, setObservacionSincronismo] = useState("");
  const [tipoOnda, setTipoOnda] = useState("");
  const [ondaCoincide, setOndaCoincide] = useState("");
  const [observacionOnda, setObservacionOnda] = useState("");
  const [tiempoCarga, setTiempoCarga] = useState("");
  const [observacionCarga, setObservacionCarga] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [evaluacionId, setEvaluacionId] = useState(null);
  const [evaluacionNueva, setEvaluacionNueva] = useState(false);
  const [cargandoEvaluacion, setCargandoEvaluacion] = useState(true);
  const [errorGuardado, setErrorGuardado] = useState("");
  const [ultimoMantenimientoUsuario, setUltimoMantenimientoUsuario] = useState(null);
  const [cargandoMantenimientoUsuario, setCargandoMantenimientoUsuario] = useState(true);
  const [errorMantenimientoUsuario, setErrorMantenimientoUsuario] = useState("");
  const [ric37, setRic37] = useState(null);
  const [estadisticasEquipo, setEstadisticasEquipo] = useState(null);
  const [cargandoEstadisticas, setCargandoEstadisticas] = useState(true);
  const [errorEstadisticas, setErrorEstadisticas] = useState("");



  useEffect(() => {
    let activo = true;
    const cargarEstadisticas = async () => {
      if (!equipo?.numero_serie) {
        setCargandoEstadisticas(false);
        setErrorEstadisticas("No se pudo identificar el número de serie del equipo.");
        return;
      }
      setCargandoEstadisticas(true);
      setErrorEstadisticas("");
      try {
        const respuesta = await fetch(`${API_URL.Base}/api/estadisticas/equipo/${encodeURIComponent(equipo.numero_serie)}`, { cache: "no-store" });
        const data = await respuesta.json().catch(() => ({}));
        if (!respuesta.ok) throw new Error(data.error || "No se pudieron cargar las estadísticas del equipo.");
        if (activo) setEstadisticasEquipo(data);
      } catch (error) {
        if (activo) setErrorEstadisticas(error.message || "No se pudieron cargar las estadísticas del equipo.");
      } finally {
        if (activo) setCargandoEstadisticas(false);
      }
    };
    cargarEstadisticas();
    return () => { activo = false; };
  }, [equipo?.numero_serie]);

  useEffect(() => {
    if (!equipo?.id) return;
    try {
      const borrador = JSON.parse(localStorage.getItem(CLAVE_BORRADOR(equipo.id)) || "null");
      if (borrador) {
        setMedicionesPotencia(borrador.medicionesPotencia || { 50: "", 100: "", 200: "" });
        setPotenciaMaxFabricante(borrador.potenciaMaxFabricante || "");
        setPotenciaMaxMedida(borrador.potenciaMaxMedida || "");
        setObservacionesPotencia(borrador.observacionesPotencia || {});
        setObservacionPotenciaMax(borrador.observacionPotenciaMax || "");
        setSincronismo(borrador.sincronismo || "");
        setObservacionSincronismo(borrador.observacionSincronismo || "");
        setTipoOnda(borrador.tipoOnda || "");
        setOndaCoincide(borrador.ondaCoincide || "");
        setObservacionOnda(borrador.observacionOnda || "");
        setTiempoCarga(borrador.tiempoCarga || "");
        setObservacionCarga(borrador.observacionCarga || "");
      }
    } catch { /* Se ignora un borrador local inválido. */ }
  }, [equipo?.id]);

  useEffect(() => {
    try {
      const resultadoGuardado = JSON.parse(localStorage.getItem(CLAVE_RESULTADO_RIC37(equipo?.id)) || "null");
      if (resultadoGuardado) setRic37(resultadoGuardado);
    } catch { /* Se ignora un resultado local inválido. */ }
    const actualizarRIC37 = (event) => {
      const detalle = event?.detail || {};
      const resultado = { id: detalle.ric37Id, resultado: detalle.resultado };
      setRic37(resultado);
      localStorage.setItem(CLAVE_RESULTADO_RIC37(equipo?.id), JSON.stringify(resultado));
      localStorage.removeItem(CLAVE_BORRADOR(equipo?.id));
      localStorage.removeItem(CLAVE_RIC37_AU_CARDIO);
    };
    window.addEventListener("au-cardio-ric37-finalizado", actualizarRIC37);
    return () => window.removeEventListener("au-cardio-ric37-finalizado", actualizarRIC37);
  }, [equipo?.id]);

  useEffect(() => {
    let activo = true;
    const cargarUltimoMantenimientoUsuario = async () => {
      if (!equipo?.id) {
        setCargandoMantenimientoUsuario(false);
        return;
      }
      setCargandoMantenimientoUsuario(true);
      setErrorMantenimientoUsuario("");
      try {
        const respuesta = await fetch(`${API_URL.Base}/api/mantenimientos-usuario/equipo/${equipo.id}/ultimo`);
        const data = await respuesta.json().catch(() => ({}));
        if (!respuesta.ok) throw new Error(data.error || "No se pudo cargar el último mantenimiento de usuario.");
        if (activo) setUltimoMantenimientoUsuario(data.mantenimiento || null);
      } catch (error) {
        if (activo) setErrorMantenimientoUsuario(error.message || "No se pudo cargar el mantenimiento de usuario.");
      } finally {
        if (activo) setCargandoMantenimientoUsuario(false);
      }
    };
    cargarUltimoMantenimientoUsuario();
    return () => { activo = false; };
  }, [equipo?.id]);


  useEffect(() => {
    let activo = true;
    const cargarUltimaEvaluacion = async () => {
      if (!equipo?.id) {
        setCargandoEvaluacion(false);
        return;
      }
      setCargandoEvaluacion(true);
      try {
        const token = localStorage.getItem("personal_token") || "";
        const respuesta = await fetch(`${API_URL.AuCardio}/equipo/${equipo.id}/ultima`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await respuesta.json().catch(() => ({}));
        if (!respuesta.ok) throw new Error(data.error || "No se pudo recuperar la última evaluación AU Cardio.");
        const evaluacion = data.evaluacion;
        if (!activo || !evaluacion) return;

        const filas = evaluacion.mediciones || [];
        const energia = (orden) => filas.find((item) => item.grupo === "ENERGIA" && Number(item.orden) === orden);
        const sincronismoGuardado = filas.find((item) => item.grupo === "SINCRONISMO");
        const ondaGuardada = filas.find((item) => item.grupo === "FORMA_ONDA");
        const cargaGuardada = filas.find((item) => item.grupo === "CARGA");
        const energia50 = energia(50);
        const energia100 = energia(100);
        const energia200 = energia(200);
        const potenciaMax = energia(4);

        setMedicionesPotencia({
          50: energia50?.medicion ?? "",
          100: energia100?.medicion ?? "",
          200: energia200?.medicion ?? ""
        });
        setObservacionesPotencia({
          50: energia50?.observaciones || "",
          100: energia100?.observaciones || "",
          200: energia200?.observaciones || ""
        });
        setPotenciaMaxFabricante(potenciaMax?.valor_nominal ?? "");
        setPotenciaMaxMedida(potenciaMax?.medicion ?? "");
        setObservacionPotenciaMax(potenciaMax?.observaciones || "");
        setSincronismo(sincronismoGuardado?.medicion ?? "");
        setObservacionSincronismo(sincronismoGuardado?.observaciones || "");
        setTipoOnda(ondaGuardada?.valor_nominal || "");
        setOndaCoincide(ondaGuardada?.conforme === true ? "si" : ondaGuardada?.conforme === false ? "no" : "");
        setObservacionOnda(ondaGuardada?.observaciones || "");
        setTiempoCarga(cargaGuardada?.medicion ?? "");
        setObservacionCarga(cargaGuardada?.observaciones || "");
        setEvaluacionId(evaluacion.id);
        setEvaluacionNueva(false);
      } catch (error) {
        if (activo) setErrorGuardado(error.message || "No se pudo recuperar la evaluación AU Cardio.");
      } finally {
        if (activo) setCargandoEvaluacion(false);
      }
    };
    cargarUltimaEvaluacion();
    return () => { activo = false; };
  }, [equipo?.id]);

  const formatearFecha = (fecha) => {
    if (!fecha) return "Fecha no disponible";
    const valor = new Date(fecha);
    return Number.isNaN(valor.getTime())
      ? String(fecha)
      : valor.toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" });
  };

  const iniciarVerificacionRIC37 = () => {
    if (!equipo?.id || !puedeContinuarParametros) return;
    setErrorGuardado("");
    localStorage.setItem(CLAVE_RIC37_AU_CARDIO, JSON.stringify({
      origen: "au_cardio",
      vista: "au_cardio",
      equipo: {
        id: equipo.id,
        numero_serie: equipo.numero_serie || "",
        descripcion: equipo.descripcion || "Cardiodesfibrilador",
        marca_modelo: equipo.marca_modelo || "",
        area: equipo.area || personal?.area || "",
        servicio: equipo.servicio || "",
        sub_servicio: equipo.sub_servicio || equipo.subservicio || "",
        encargado: equipo.encargado || ""
      }
    }));
    localStorage.setItem(CLAVE_BORRADOR(equipo.id), JSON.stringify({
      medicionesPotencia, potenciaMaxFabricante, potenciaMaxMedida, observacionesPotencia,
      observacionPotenciaMax, sincronismo, observacionSincronismo, tipoOnda, ondaCoincide,
      observacionOnda, tiempoCarga, observacionCarga
    }));
    setVista("ric37");
  };

  const limpiarContextoLocal = () => {
    localStorage.removeItem(CLAVE_EQUIPO);
    localStorage.removeItem(CLAVE_RIC37_AU_CARDIO);
    Object.keys(localStorage)
      .filter((clave) => clave.startsWith("au_cardio:"))
      .forEach((clave) => localStorage.removeItem(clave));
  };

  const cancelar = async () => {
    const mensaje = evaluacionId && evaluacionNueva
      ? "¿Cancelar esta evaluación recién guardada? Se eliminará definitivamente el informe y todas sus mediciones."
      : evaluacionId
        ? "¿Salir de la evaluación recuperada? El registro histórico no será eliminado."
        : "¿Cancelar la aptitud de uso? Se descartarán todas las mediciones y observaciones ingresadas.";
    if (!window.confirm(mensaje)) return;

    try {
      if (evaluacionId && evaluacionNueva) {
        const token = localStorage.getItem("personal_token") || "";
        const respuesta = await fetch(`${API_URL.AuCardio}/${evaluacionId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await respuesta.json().catch(() => ({}));
        if (!respuesta.ok) throw new Error(data.error || "No se pudo eliminar la evaluación.");
      }
      limpiarContextoLocal();
      setVista("equipos");
    } catch (error) {
      setErrorGuardado(error.message || "No se pudo cancelar la evaluación.");
    }
  };

  const guardarEvaluacion = async () => {
    setErrorGuardado("");
    if (!puedeContinuar) {
      setErrorGuardado("No se puede guardar la etapa 2: el último mantenimiento de usuario debe estar registrado y completamente conforme.");
      return;
    }
    if (!ric37 || ric37.resultado !== "CONFORME") {
      setErrorGuardado("Antes de guardar la etapa 2 debe completar y finalizar el RIC37 con resultado CONFORME.");
      return;
    }
    const pendientes = [
      ...estadosPotencia.filter((x) => x.conforme === null).map((x) => `${x.referencia} J`),
      ...(estadoPotenciaMax === null ? ["Potencia máxima"] : []),
      ...(estadoSincronismo === null ? ["Sincronismo"] : []),
      ...(estadoOnda === null ? ["Forma de onda"] : []),
      ...(estadoCarga === null ? ["Tiempo de carga"] : [])
    ];
    if (pendientes.length) {
      setErrorGuardado(`Complete los siguientes parámetros: ${pendientes.join(", ")}.`);
      return;
    }

    const observacionesFaltantes = [
      ...estadosPotencia.filter((x) => x.conforme === false && !String(observacionesPotencia[x.referencia] || "").trim()).map((x) => `${x.referencia} J`),
      ...(estadoPotenciaMax === false && !observacionPotenciaMax.trim() ? ["Potencia máxima"] : []),
      ...(estadoSincronismo === false && !observacionSincronismo.trim() ? ["Sincronismo"] : []),
      ...(estadoOnda === false && !observacionOnda.trim() ? ["Forma de onda"] : []),
      ...(estadoCarga === false && !observacionCarga.trim() ? ["Tiempo de carga"] : [])
    ];
    if (observacionesFaltantes.length) {
      setErrorGuardado(`Agregue una observación para: ${observacionesFaltantes.join(", ")}.`);
      return;
    }

    let ric01Id = null;
    try {
      const tareaRaw = localStorage.getItem("tareaActiva");
      if (tareaRaw) {
        const tarea = JSON.parse(tareaRaw);
        if (String(tarea.numero_serie || "") === String(equipo.numero_serie || "")) {
          ric01Id = tarea.ric01_id || tarea.id || null;
        }
      }
    } catch {
      ric01Id = null;
    }

    const payload = {
      evaluacion_id: evaluacionId || null,
      equipo: { id: equipo.id, numero_serie: equipo.numero_serie },
      ric01_id: ric01Id,
      mantenimiento_usuario_id: ultimoMantenimientoUsuario?.id || null,
      mediciones: {
        potencias: medicionesPotencia,
        observaciones_potencia: observacionesPotencia,
        potencia_max_fabricante: potenciaMaxFabricante,
        potencia_max_medida: potenciaMaxMedida,
        observacion_potencia_max: observacionPotenciaMax,
        sincronismo_ms: sincronismo,
        observacion_sincronismo: observacionSincronismo,
        tipo_onda: tipoOnda,
        onda_coincide: ondaCoincide === "si",
        observacion_onda: observacionOnda,
        tiempo_carga_s: tiempoCarga,
        observacion_carga: observacionCarga
      }
    };

    try {
      setGuardando(true);
      const token = localStorage.getItem("personal_token") || "";
      const respuesta = await fetch(API_URL.AuCardio, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await respuesta.json().catch(() => ({}));
      if (!respuesta.ok) throw new Error(data.error || "No se pudo guardar la evaluación.");
      setEvaluacionId(data.id);
      setEvaluacionNueva(!evaluacionId);
    } catch (error) {
      setErrorGuardado(error.message || "No se pudo guardar la evaluación.");
    } finally {
      setGuardando(false);
    }
  };

  if (!equipo) {
    return (
      <ProtocoloLayout
        codigo="AU-CARDIO"
        tituloCorto="Aptitud de uso"
        etapas={ETAPAS}
        etapa={0}
        progreso={20}
        datos={{ descripcion: "Cardiodesfibrilador", marca_modelo: "", numero_serie: "", area: "", servicio: "" }}
        error="No se encontraron los datos del equipo seleccionado."
      >
        <TarjetaEtapa titulo="Aptitud de uso - Cardiodesfibrilador">
          <BotonesNavegacion mostrarVolver={false} onCancelar={() => setVista("equipos")} />
        </TarjetaEtapa>
      </ProtocoloLayout>
    );
  }

  const datosEquipo = {
    descripcion: equipo.descripcion || "Cardiodesfibrilador",
    marca_modelo: equipo.marca_modelo || "",
    numero_serie: equipo.numero_serie || "",
    area: equipo.area || "",
    servicio: equipo.servicio || ""
  };

  const estadosPotencia = POTENCIAS_REFERENCIA.map((referencia) => ({
    referencia,
    conforme: dentroDeTolerancia(medicionesPotencia[referencia], referencia)
  }));
  const estadoPotenciaMax = dentroDeTolerancia(potenciaMaxMedida, potenciaMaxFabricante);
  const estadoSincronismo = numeroValido(sincronismo) ? Number(sincronismo) < 60 : null;
  const estadoOnda = ondaCoincide === "" ? null : ondaCoincide === "si";
  const estadoCarga = numeroValido(tiempoCarga) ? Number(tiempoCarga) < 15 : null;

  const controlesMantenimientoUsuario = ultimoMantenimientoUsuario
    ? [ultimoMantenimientoUsuario.limpieza_ok, ultimoMantenimientoUsuario.integridad_ok,
       ultimoMantenimientoUsuario.verificacion_funcional_ok, ultimoMantenimientoUsuario.capacitacion_personal_ok]
    : [];
  const estadoMantenimientoUsuario = cargandoMantenimientoUsuario || errorMantenimientoUsuario || !ultimoMantenimientoUsuario
    ? "PENDIENTE"
    : controlesMantenimientoUsuario.some((valor) => valor === false)
      ? "NO CONFORME"
      : controlesMantenimientoUsuario.every((valor) => valor === true)
        ? "CONFORME"
        : "PENDIENTE";
  const datosEstadisticas = estadisticasEquipo?.equipo || {};
  const fechaPreventivoEvaluada = fechaCalendario(datosEstadisticas.ultimo_mant);
  const periodoPreventivo = Number(datosEstadisticas.periodo);
  let vencimientoPreventivo = null;
  if (fechaPreventivoEvaluada && Number.isFinite(periodoPreventivo) && periodoPreventivo > 0) {
    vencimientoPreventivo = new Date(fechaPreventivoEvaluada);
    vencimientoPreventivo.setDate(vencimientoPreventivo.getDate() + periodoPreventivo);
  }
  const hoyPreventivo = new Date();
  hoyPreventivo.setHours(0, 0, 0, 0);
  const estadoPreventivo = cargandoEstadisticas || errorEstadisticas || !fechaPreventivoEvaluada || !vencimientoPreventivo
    ? "PENDIENTE"
    : vencimientoPreventivo < hoyPreventivo
      ? "NO CONFORME"
      : "CONFORME";
  const estadoEtapa2 = estadoMantenimientoUsuario;
  const puedeContinuarUsuario = estadoPreventivo === "CONFORME";
  const puedeContinuarParametros = puedeContinuarUsuario && estadoEtapa2 === "CONFORME";
  const estadosTodosParametros = [
    ...estadosPotencia.map((x) => x.conforme),
    estadoPotenciaMax,
    estadoSincronismo,
    estadoOnda,
    estadoCarga
  ];
  const parametrosCompletos = estadosTodosParametros.every((valor) => valor === true || valor === false);
  const parametrosConformes = estadosTodosParametros.every((valor) => valor === true);
  const estadoEtapa3 = !puedeContinuarParametros || !parametrosCompletos || ric37?.resultado !== "CONFORME"
    ? estadosTodosParametros.some((valor) => valor === false) ? "NO CONFORME" : "PENDIENTE"
    : parametrosConformes ? "CONFORME" : "NO CONFORME";

  const actualizarMedicionPotencia = (referencia, valor) => {
    setMedicionesPotencia((actual) => ({ ...actual, [referencia]: valor }));
  };

  const actualizarObservacionPotencia = (referencia, valor) => {
    setObservacionesPotencia((actual) => ({ ...actual, [referencia]: valor }));
  };

  const rangoPotenciaMax = numeroValido(potenciaMaxFabricante) && Number(potenciaMaxFabricante) > 0
    ? { minimo: Number(potenciaMaxFabricante) * 0.85, maximo: Number(potenciaMaxFabricante) * 1.15 }
    : null;

  return (
    <ProtocoloLayout
      codigo="AU-CARDIO"
      tituloCorto="Aptitud de uso"
      etapas={ETAPAS}
      etapa={0}
      progreso={25}
      datos={datosEquipo}
    >
      <div className="mb-4 rounded-xl border-2 border-black bg-gray-100 p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Resumen técnico del equipo</h3>
            <p className="text-[11px] text-slate-500">Indicadores del inventario y mantenimiento preventivo</p>
          </div>
          {cargandoEstadisticas && <span className="text-[11px] text-slate-500">Actualizando...</span>}
        </div>
        {errorEstadisticas ? (
          <p className="rounded-lg bg-amber-50 p-2 text-xs text-amber-800">{errorEstadisticas}</p>
        ) : (
          (() => {
            const datos = estadisticasEquipo?.equipo || {};
            const fechaAlta = datos.fecha_alta;
            const fechaAltaDate = fechaCalendario(fechaAlta);
            const diasDesdeAlta = fechaAltaDate ? Math.max(0, Math.floor((Date.now() - fechaAltaDate.getTime()) / 86400000)) : null;
            const ipa = estadisticasEquipo?.ipa;
            const tmf = estadisticasEquipo?.tmf?.dias;
            const fechaPreventivo = datos.ultimo_mant;
            const fechaPreventivoDate = fechaCalendario(fechaPreventivo);
            const periodo = Number(datos.periodo);
            let vencimiento = null;
            if (fechaPreventivoDate && Number.isFinite(periodo) && periodo > 0) {
              vencimiento = new Date(fechaPreventivoDate);
              vencimiento.setDate(vencimiento.getDate() + periodo);
            }
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            const vencido = vencimiento ? vencimiento < hoy : null;
            const Celda = ({ titulo, valor, detalle, estado }) => (
              <div className="min-w-0 rounded-xl border border-slate-100 bg-slate-50 p-3">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{titulo}</div>
                <div className="mt-1 break-words text-base font-bold text-slate-800">{valor}</div>
                {detalle && <div className="mt-1 text-[10px] leading-snug text-slate-500">{detalle}</div>}
                {estado && <div className={`mt-1 text-[10px] font-bold ${estado.ok ? "text-green-700" : "text-red-700"}`}>{estado.texto}</div>}
              </div>
            );
            return (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Celda titulo="Fecha de alta" valor={mostrarFecha(fechaAlta, "Sin datos")} detalle={diasDesdeAlta != null ? `Tiempo desde el alta: ${diasDesdeAlta} días` : "Antigüedad no disponible"} />
                <Celda titulo="IPA" valor={ipa?.valor != null ? `${Number(ipa.valor).toFixed(1)} / 100` : "Sin clasificar"} detalle={ipa ? (ipa.respaldo_aplicable === false ? "Respaldo no aplicable" : `${ipa.respaldos ?? 0} respaldo(s) activo(s)`) : "Sin datos de clasificación"} />
                <Celda titulo="TMF" valor={tmf != null ? `${Number(tmf).toFixed(1)} días` : "Sin datos"} detalle={tmf == null ? "No hay datos suficientes de fallas" : "Tiempo medio entre fallas"} />
                <Celda titulo="Último preventivo" valor={mostrarFecha(fechaPreventivo, "Sin datos")} detalle={periodo > 0 ? `Periodicidad: cada ${periodo} días` : "Periodicidad no definida"} estado={vencido == null ? null : { ok: !vencido, texto: vencido ? "MANTENIMIENTO VENCIDO" : "AL DÍA" }} />
              </div>
            );
          })()
        )}
      </div>

      <TarjetaEtapa
        titulo="1. Último mantenimiento de usuario"
        ayuda="Último checklist de mantenimiento de usuario registrado para este equipo."
      >
        {cargandoMantenimientoUsuario ? (
          <p className="text-sm text-gray-500">Consultando el último mantenimiento de usuario...</p>
        ) : errorMantenimientoUsuario ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">{errorMantenimientoUsuario}</div>
        ) : !ultimoMantenimientoUsuario ? (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-600">
            Este equipo todavía no tiene mantenimientos de usuario registrados.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500">Registro #{ultimoMantenimientoUsuario.id}</p>
              <p className="font-semibold text-gray-800">{formatearFecha(ultimoMantenimientoUsuario.fecha)}</p>
              <p className="text-sm text-gray-600 mt-1">
                Realizado por: <strong>{ultimoMantenimientoUsuario.usuario_nombre || "Usuario no identificado"}</strong>
              </p>
              {ultimoMantenimientoUsuario.usuario_mail && (
                <p className="text-xs text-gray-500">{ultimoMantenimientoUsuario.usuario_mail}</p>
              )}
            </div>

            <div className="space-y-2">
              {[
                ["Limpieza", ultimoMantenimientoUsuario.limpieza_ok],
                ["Integridad", ultimoMantenimientoUsuario.integridad_ok],
                ["Verificación funcional", ultimoMantenimientoUsuario.verificacion_funcional_ok],
                ["Capacitación del personal", ultimoMantenimientoUsuario.capacitacion_personal_ok]
              ].map(([nombre, conforme]) => (
                <div key={nombre} className="flex flex-wrap items-center justify-between gap-2 border rounded-xl p-3">
                  <span className="text-sm font-medium text-gray-700">{nombre}</span>
                  <span className={`px-2 py-1 rounded-lg text-xs font-bold ${conforme === true ? "bg-green-100 text-green-700" : conforme === false ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}>
                    {conforme === true ? "CONFORME" : conforme === false ? "NO CONFORME" : "SIN DATO"}
                  </span>
                </div>
              ))}
            </div>

            {ultimoMantenimientoUsuario.observaciones && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900">
                <strong>Observaciones:</strong>
                <p className="mt-1 whitespace-pre-wrap">{ultimoMantenimientoUsuario.observaciones}</p>
              </div>
            )}
          </div>
        )}
        <div className={`mt-4 rounded-xl p-3 text-sm font-bold ${estadoMantenimientoUsuario === "CONFORME" ? "bg-green-100 text-green-800" : estadoMantenimientoUsuario === "NO CONFORME" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}`}>
          ETAPA 1: {estadoMantenimientoUsuario}
          {estadoMantenimientoUsuario === "CONFORME" && " — Puede continuar con los parámetros esenciales."}
        </div>
      </TarjetaEtapa>

      <TarjetaEtapa
        titulo="2. Parámetros esenciales"
        ayuda={`Parámetros esenciales · Responsable de la evaluación: ${personal?.nombre || "No identificado"}`}
      >
        {!puedeContinuarParametros && (
          <div className={`rounded-xl border p-3 mb-4 text-sm ${estadoMantenimientoUsuario === "NO CONFORME" ? "bg-red-50 border-red-200 text-red-800" : "bg-amber-50 border-amber-200 text-amber-800"}`}>
            {estadoMantenimientoUsuario === "NO CONFORME"
              ? "El último mantenimiento de usuario tiene puntos no conformes. No se puede continuar con los parámetros esenciales hasta resolverlos y registrar un nuevo mantenimiento conforme."
              : "La etapa 1 todavía no está conforme. Se necesita un último mantenimiento de usuario registrado y con todos sus controles conformes para habilitar esta etapa."}
          </div>
        )}
        <fieldset disabled={!puedeContinuarParametros} className={!puedeContinuarParametros ? "opacity-50" : ""}>
        <div className="space-y-3">
          <section className="bg-gray-50 rounded-lg p-3">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h3 className="font-bold text-gray-800">1. Energía de descarga</h3>
              <span className="text-xs text-gray-500">Tolerancia: ±15%</span>
            </div>
            <div className="space-y-3">
              {estadosPotencia.map(({ referencia, conforme }) => (
                <article key={referencia} className="bg-white border rounded-xl p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <h4 className="font-semibold text-gray-800">Medición a {referencia} J</h4>
                    <EstadoParametro conforme={conforme} />
                  </div>
                  <label htmlFor={`potencia-${referencia}`} className="block text-sm text-gray-600 mb-1">Energía medida (J)</label>
                  <input
                    id={`potencia-${referencia}`}
                    type="number"
                    min="0"
                    step="0.1"
                    value={medicionesPotencia[referencia]}
                    onChange={(e) => actualizarMedicionPotencia(referencia, e.target.value)}
                    placeholder="Ingresar valor medido"
                    className="w-full border rounded-xl px-3 py-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">Rango aceptable: {(referencia * 0.85).toFixed(1)} a {(referencia * 1.15).toFixed(1)} J</p>
                  {conforme === false && (
                    <CampoObservacion
                      id={`obs-potencia-${referencia}`}
                      valor={observacionesPotencia[referencia] || ""}
                      onChange={(v) => actualizarObservacionPotencia(referencia, v)}
                    />
                  )}
                </article>
              ))}
            </div>
          </section>

          <section className="bg-gray-50 rounded-lg p-3">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h3 className="font-bold text-gray-800">2. Potencia máxima del equipo</h3>
              <EstadoParametro conforme={estadoPotenciaMax} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="potencia-max-fabricante" className="block text-sm font-semibold text-gray-700 mb-1">Potencia máxima indicada por el fabricante (J)</label>
                <input id="potencia-max-fabricante" type="number" min="0" step="0.1" value={potenciaMaxFabricante} onChange={(e) => setPotenciaMaxFabricante(e.target.value)} placeholder="Valor de fabricante" className="w-full border rounded-xl px-3 py-2 bg-white" />
              </div>
              <div>
                <label htmlFor="potencia-max-medida" className="block text-sm font-semibold text-gray-700 mb-1">Potencia máxima medida (J)</label>
                <input id="potencia-max-medida" type="number" min="0" step="0.1" value={potenciaMaxMedida} onChange={(e) => setPotenciaMaxMedida(e.target.value)} placeholder="Valor medido" className="w-full border rounded-xl px-3 py-2 bg-white" />
              </div>
            </div>
            {rangoPotenciaMax && <p className="text-xs text-gray-500 mt-2">Rango aceptable según fabricante: {rangoPotenciaMax.minimo.toFixed(1)} a {rangoPotenciaMax.maximo.toFixed(1)} J (±15%)</p>}
            {estadoPotenciaMax === false && <CampoObservacion id="obs-potencia-max" valor={observacionPotenciaMax} onChange={setObservacionPotenciaMax} />}
          </section>

          <section className="bg-gray-50 rounded-lg p-3">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h3 className="font-bold text-gray-800">3. Sincronismo</h3>
              <EstadoParametro conforme={estadoSincronismo} />
            </div>
            <label htmlFor="sincronismo" className="block text-sm text-gray-600 mb-1">Tiempo de sincronismo (ms)</label>
            <input id="sincronismo" type="number" min="0" step="0.1" value={sincronismo} onChange={(e) => setSincronismo(e.target.value)} placeholder="Ingresar tiempo medido" className="w-full border rounded-xl px-3 py-2 bg-white" />
            <p className="text-xs text-gray-500 mt-1">Criterio de conformidad: menor a 60 ms.</p>
            {estadoSincronismo === false && <CampoObservacion id="obs-sincronismo" valor={observacionSincronismo} onChange={setObservacionSincronismo} />}
          </section>

          <section className="bg-gray-50 rounded-lg p-3">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h3 className="font-bold text-gray-800">4. Forma de onda</h3>
              <EstadoParametro conforme={estadoOnda} />
            </div>
            <label htmlFor="tipo-onda" className="block text-sm text-gray-600 mb-1">Tipo de onda del equipo</label>
            <select id="tipo-onda" value={tipoOnda} onChange={(e) => { setTipoOnda(e.target.value); setOndaCoincide(""); setObservacionOnda(""); }} className="w-full border rounded-xl px-3 py-2 bg-white">
              <option value="">Seleccionar tipo de onda</option>
              <option value="Monofásica">Monofásica</option>
              <option value="Bifásica">Bifásica</option>
            </select>
            <fieldset className="mt-3">
              <legend className="block text-sm text-gray-600 mb-2">¿La forma de onda verificada coincide con la seleccionada?</legend>
              <div className="flex flex-wrap gap-3">
                <label className="flex items-center gap-2 border bg-white rounded-xl px-4 py-2 cursor-pointer"><input type="radio" name="onda-coincide" value="si" checked={ondaCoincide === "si"} onChange={(e) => setOndaCoincide(e.target.value)} /> Sí</label>
                <label className="flex items-center gap-2 border bg-white rounded-xl px-4 py-2 cursor-pointer"><input type="radio" name="onda-coincide" value="no" checked={ondaCoincide === "no"} onChange={(e) => setOndaCoincide(e.target.value)} /> No</label>
              </div>
            </fieldset>
            {estadoOnda === false && <CampoObservacion id="obs-onda" valor={observacionOnda} onChange={setObservacionOnda} />}
          </section>

          <section className="bg-gray-50 rounded-lg p-3">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h3 className="font-bold text-gray-800">5. Tiempo de carga</h3>
              <EstadoParametro conforme={estadoCarga} />
            </div>
            <label htmlFor="tiempo-carga" className="block text-sm text-gray-600 mb-1">Tiempo de carga (segundos)</label>
            <input id="tiempo-carga" type="number" min="0" step="0.1" value={tiempoCarga} onChange={(e) => setTiempoCarga(e.target.value)} placeholder="Ingresar tiempo medido" className="w-full border rounded-xl px-3 py-2 bg-white" />
            <p className="text-xs text-gray-500 mt-1">Criterio de conformidad: menor a 15 segundos.</p>
            {estadoCarga === false && <CampoObservacion id="obs-carga" valor={observacionCarga} onChange={setObservacionCarga} />}
          </section>

          <section className="bg-blue-50 rounded-lg border border-blue-200 p-3">
            <h3 className="font-bold text-gray-800">6. Equipo verificador</h3>
            <p className="text-sm text-gray-600 mt-1">El selector de equipos verificadores se incorporará en una etapa posterior.</p>
            <label className="block text-sm font-semibold text-gray-500 mt-3 mb-1">Equipo verificador</label>
            <select disabled className="w-full border rounded-xl px-3 py-2 bg-gray-100 text-gray-500">
              <option>Selector pendiente de implementación</option>
            </select>
          </section>
        </div>
        </fieldset>

        <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4">
          <h3 className="font-bold text-gray-900">7. Verificación de seguridad eléctrica</h3>
          <p className="text-sm text-gray-700 mt-1">La seguridad eléctrica se verifica mediante el protocolo RIC37 existente. Debe completarse y finalizarse antes de guardar la etapa 2.</p>
          {ric37 ? (
            <div className={`mt-3 rounded-lg p-3 text-sm font-semibold ${ric37.resultado === "CONFORME" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
              {ric37.resultado === "CONFORME" ? "✅" : "❌"} RIC37 #{ric37.id || "—"} — {ric37.resultado}
            </div>
          ) : (
            <p className="mt-3 text-sm text-amber-800">RIC37 pendiente. La etapa 2 no podrá guardarse hasta finalizarlo.</p>
          )}
          <button type="button" onClick={iniciarVerificacionRIC37} disabled={!puedeContinuarParametros || cargandoEvaluacion} className="w-full mt-3 bg-blue-700 hover:bg-blue-800 disabled:bg-gray-300 text-white rounded-xl p-3 font-bold">
            {ric37 ? "Volver a realizar verificación RIC37" : "⚡ Realizar verificación de seguridad eléctrica"}
          </button>
        </div>

        {errorGuardado && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-3 mt-4 text-sm" role="alert">
            {errorGuardado}
          </div>
        )}
        {evaluacionId && (
          <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-3 mt-4 text-sm">
            Evaluación guardada correctamente. Número de registro: <strong>#{evaluacionId}</strong>.
          </div>
        )}


      </TarjetaEtapa>

      <TarjetaEtapa titulo="4. Verificación funcional — Pendiente de definición" ayuda="Esta etapa se incorporará cuando definamos sus controles y criterios de conformidad.">
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
          Etapa pendiente de diseño. No puede considerarse conforme ni habilitar el Apto de Uso.
        </div>
      </TarjetaEtapa>

      <TarjetaEtapa titulo="5. Etapa 5 — Pendiente de definición" ayuda="Esta etapa se incorporará cuando definamos sus controles y criterios de conformidad.">
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
          Etapa pendiente de diseño. No puede considerarse conforme ni habilitar el Apto de Uso.
        </div>
      </TarjetaEtapa>

      <TarjetaEtapa titulo="Acciones de la evaluación">
        <div className="flex flex-col sm:flex-row gap-2 mt-5">
          <button
            type="button"
            onClick={cancelar}
            disabled={guardando}
            className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-xl p-3 font-semibold"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={guardarEvaluacion}
            disabled={guardando || cargandoEvaluacion || !puedeContinuarParametros || ric37?.resultado !== "CONFORME"}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-xl p-3 font-semibold"
          >
            {guardando ? "Guardando..." : cargandoEvaluacion ? "Recuperando evaluación..." : evaluacionId ? "Etapa 3 guardada" : ric37?.resultado !== "CONFORME" ? "Complete RIC37 para guardar" : "Guardar etapa 3 (aptitud pendiente)"}
          </button>
          {evaluacionId && (
            <button type="button" onClick={() => { limpiarContextoLocal(); setVista("equipos"); }} className="flex-1 bg-gray-600 hover:bg-gray-700 text-white rounded-xl p-3 font-semibold">
              Salir
            </button>
          )}
        </div>
      </TarjetaEtapa>
    </ProtocoloLayout>
  );
}
