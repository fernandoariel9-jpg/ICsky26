import { useEffect, useMemo, useState } from "react";
import { API_URL } from "./config";
import {
  BotonesNavegacion,
  ProtocoloLayout,
  TarjetaEtapa
} from "./protocolos/ProtocoloBase";

const POTENCIAS_REFERENCIA = [50, 100, 200];
const CLAVE_EQUIPO = "equipoAptitudCardio";
const ETAPAS = ["Último mantenimiento de usuario", "Parámetros esenciales", "Etapa 3", "Etapa 4"];

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
  const [errorGuardado, setErrorGuardado] = useState("");
  const [ultimoMantenimientoUsuario, setUltimoMantenimientoUsuario] = useState(null);
  const [cargandoMantenimientoUsuario, setCargandoMantenimientoUsuario] = useState(true);
  const [errorMantenimientoUsuario, setErrorMantenimientoUsuario] = useState("");


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

  const formatearFecha = (fecha) => {
    if (!fecha) return "Fecha no disponible";
    const valor = new Date(fecha);
    return Number.isNaN(valor.getTime())
      ? String(fecha)
      : valor.toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" });
  };

  const limpiarContextoLocal = () => {
    localStorage.removeItem(CLAVE_EQUIPO);
    Object.keys(localStorage)
      .filter((clave) => clave.startsWith("au_cardio:"))
      .forEach((clave) => localStorage.removeItem(clave));
  };

  const cancelar = async () => {
    const mensaje = evaluacionId
      ? "¿Cancelar esta evaluación guardada? Se eliminará definitivamente el informe y todas sus mediciones."
      : "¿Cancelar la aptitud de uso? Se descartarán todas las mediciones y observaciones ingresadas.";
    if (!window.confirm(mensaje)) return;

    try {
      if (evaluacionId) {
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
    if (evaluacionId) return;
    if (!puedeContinuar) {
      setErrorGuardado("No se puede guardar la etapa 2: el último mantenimiento de usuario debe estar registrado y completamente conforme.");
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
        progreso={25}
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
  const puedeContinuar = estadoMantenimientoUsuario === "CONFORME";

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
        {!puedeContinuar && (
          <div className={`rounded-xl border p-3 mb-4 text-sm ${estadoMantenimientoUsuario === "NO CONFORME" ? "bg-red-50 border-red-200 text-red-800" : "bg-amber-50 border-amber-200 text-amber-800"}`}>
            {estadoMantenimientoUsuario === "NO CONFORME"
              ? "El último mantenimiento de usuario tiene puntos no conformes. No se puede continuar con los parámetros esenciales hasta resolverlos y registrar un nuevo mantenimiento conforme."
              : "La etapa 1 todavía no está conforme. Se necesita un último mantenimiento de usuario registrado y con todos sus controles conformes para habilitar esta etapa."}
          </div>
        )}
        <fieldset disabled={!puedeContinuar} className={!puedeContinuar ? "opacity-50" : ""}>
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

      <TarjetaEtapa titulo="3. Etapa 3 — Pendiente de definición" ayuda="Esta etapa se incorporará cuando definamos sus controles y criterios de conformidad.">
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
          Etapa pendiente de diseño. No puede considerarse conforme ni habilitar el Apto de Uso.
        </div>
      </TarjetaEtapa>

      <TarjetaEtapa titulo="4. Etapa 4 — Pendiente de definición" ayuda="Esta etapa se incorporará cuando definamos sus controles y criterios de conformidad.">
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
            disabled={guardando || Boolean(evaluacionId) || !puedeContinuar}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-xl p-3 font-semibold"
          >
            {guardando ? "Guardando..." : evaluacionId ? "Etapa 2 guardada" : "Guardar etapa 2 (aptitud pendiente)"}
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
