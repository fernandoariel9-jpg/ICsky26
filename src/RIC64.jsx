import { useEffect, useMemo, useState } from "react";
import { API_URL } from "./config";

const ETAPAS = ["Inspección visual", "Control de temperatura", "Seguridad eléctrica", "Resumen"];
const INSTRUCCION_GENERICA = "Procedimiento: configure el baño en el punto de trabajo, espere la estabilización térmica, registre las temperaturas indicadas y mida con el instrumento patrón.";
const claveBorrador = (ric01Id) => `preventivo:ric64:${ric01Id}`;

const crearTemperaturas = () =>
  Array.from({ length: 4 }, (_, i) => ({
    orden: i + 1,
    temp_seteada: "",
    temp_sensada: "",
    temp_medida: "",
    error_porcentaje: null,
    rango_aceptacion: "5%",
    conforme: null,
    no_aplica: false,
    observaciones: ""
  }));

const numero = (valor) => {
  if (valor === null || valor === undefined || String(valor).trim() === "") return NaN;
  return Number(String(valor).replace(",", "."));
};

const evaluarTemperatura = (sensada, medida) => {
  const s = numero(sensada);
  const m = numero(medida);
  if (!Number.isFinite(s) || !Number.isFinite(m) || m === 0) {
    return { error: null, conforme: null };
  }
  const error = Math.abs(((s - m) / m) * 100);
  return {
    error: Number(error.toFixed(2)),
    conforme: error <= 5
  };
};

function Estado({ conforme, noAplica }) {
  if (noAplica) return <span className="px-2 py-1 rounded-lg bg-gray-200 text-gray-700 text-xs font-bold">NO APLICA</span>;
  if (conforme === true) return <span className="px-2 py-1 rounded-lg bg-green-100 text-green-700 text-xs font-bold">CONFORME</span>;
  if (conforme === false) return <span className="px-2 py-1 rounded-lg bg-red-100 text-red-700 text-xs font-bold">NO CONFORME</span>;
  return <span className="px-2 py-1 rounded-lg bg-gray-100 text-gray-500 text-xs font-bold">PENDIENTE</span>;
}

export default function RIC64({ setVista, personal }) {
  const [etapa, setEtapa] = useState(0);
  const [temperaturaActual, setTemperaturaActual] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [borradorCargado, setBorradorCargado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [enviandoDrive, setEnviandoDrive] = useState(false);
  const [error, setError] = useState("");
  const [ric64Id, setRic64Id] = useState(null);

  const [datos, setDatos] = useState({
    ric01_id: "",
    ric37_id: "",
    equipo_id: "",
    numero_serie: "",
    descripcion: "",
    marca_modelo: "",
    area: "",
    servicio: "",
    sub_servicio: "",
    encargado: "",
    tecnico: personal?.nombre || "",
    en_uso: ""
  });

  const [inspecciones, setInspecciones] = useState({
    inspeccion_visual: "",
    limpieza_exterior: "",
    limpieza_interior: "",
    observaciones: ""
  });

  const [temperaturas, setTemperaturas] = useState(crearTemperaturas);
  const [observaciones, setObservaciones] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const raw = localStorage.getItem("tareaActiva");
        if (!raw) throw new Error("No hay una tarea activa.");
        const tarea = JSON.parse(raw);
        const ric01Id = tarea.ric01_id || tarea.id || "";

        let equipo = null;
        if (tarea.numero_serie) {
          const respuesta = await fetch(`${API_URL.BuscarEquipo}/${encodeURIComponent(tarea.numero_serie)}`);
          if (respuesta.ok) equipo = await respuesta.json();
        }

        setDatos((prev) => ({
          ...prev,
          ric01_id: ric01Id,
          equipo_id: equipo?.id || tarea.equipo_id || "",
          numero_serie: equipo?.numero_serie || tarea.numero_serie || "",
          descripcion: equipo?.descripcion || tarea.descripcion || "BAÑO TERMOSTÁTICO",
          marca_modelo: equipo?.marca_modelo || tarea.marca_modelo || "",
          area: equipo?.area || tarea.area || "",
          servicio: equipo?.servicio || tarea.servicio || "",
          sub_servicio: equipo?.sub_servicio || tarea.subservicio || tarea.sub_servicio || "",
          encargado: equipo?.encargado || tarea.encargado || "",
          tecnico: personal?.nombre || tarea.usuario || tarea.asignado || ""
        }));

        if (ric01Id) {
          const borradorRaw = localStorage.getItem(claveBorrador(ric01Id));
          if (borradorRaw) {
            const borrador = JSON.parse(borradorRaw);
            if (Number.isInteger(borrador.etapa)) setEtapa(borrador.etapa);
            if (Number.isInteger(borrador.temperaturaActual)) setTemperaturaActual(borrador.temperaturaActual);
            if (borrador.inspecciones) setInspecciones(borrador.inspecciones);
            if (Array.isArray(borrador.temperaturas)) setTemperaturas(borrador.temperaturas);
            if (typeof borrador.observaciones === "string") setObservaciones(borrador.observaciones);
            if (typeof borrador.en_uso === "boolean") setDatos((prev) => ({ ...prev, en_uso: borrador.en_uso }));
            if (borrador.ric37_id !== undefined && borrador.ric37_id !== null) {
              setDatos((prev) => ({ ...prev, ric37_id: String(borrador.ric37_id) }));
            }
          }
        }
      } catch (err) {
        setError(err.message || "No se pudieron cargar los datos del equipo.");
      } finally {
        setBorradorCargado(true);
        setCargando(false);
      }
    })();
  }, [personal]);

  useEffect(() => {
    if (!borradorCargado || cargando || !datos.ric01_id || ric64Id) return;
    localStorage.setItem(
      claveBorrador(datos.ric01_id),
      JSON.stringify({
        etapa,
        temperaturaActual,
        inspecciones,
        temperaturas,
        observaciones,
        en_uso: datos.en_uso,
        ric37_id: datos.ric37_id
      })
    );
  }, [borradorCargado, cargando, datos.ric01_id, datos.ric37_id, datos.en_uso, ric64Id, etapa, temperaturaActual, inspecciones, temperaturas, observaciones]);

  const resumen = useMemo(() => {
    const inspeccionValores = [
      inspecciones.inspeccion_visual,
      inspecciones.limpieza_exterior,
      inspecciones.limpieza_interior
    ];
    const inspeccionesPendientes = inspeccionValores.some((v) => !v);
    const inspeccionesNC = inspeccionValores.filter((v) => v === "NO CONFORME").length;
    const pendientes = temperaturas.filter((t) => !t.no_aplica && t.conforme === null).length;
    const noConformes = temperaturas.filter((t) => !t.no_aplica && t.conforme === false);
    const conformes = temperaturas.filter((t) => !t.no_aplica && t.conforme === true).length;
    const noAplica = temperaturas.filter((t) => t.no_aplica).length;
    const resultado = inspeccionesPendientes || datos.en_uso === "" || pendientes > 0
      ? "PENDIENTE"
      : inspeccionesNC > 0 || noConformes.length > 0
      ? "NO CONFORME"
      : "CONFORME";
    return { resultado, inspeccionesNC, pendientes, noConformes, conformes, noAplica };
  }, [inspecciones, temperaturas, datos.en_uso]);

  const progreso = ((etapa + 1) / ETAPAS.length) * 100;
  const temp = temperaturas[temperaturaActual];

  const actualizarTemperatura = (campo, valor) => {
    setTemperaturas((prev) => prev.map((item, indice) => {
      if (indice !== temperaturaActual) return item;
      const actualizado = { ...item, [campo]: valor, no_aplica: false };
      const evaluacion = evaluarTemperatura(actualizado.temp_sensada, actualizado.temp_medida);
      return { ...actualizado, error_porcentaje: evaluacion.error, conforme: evaluacion.conforme };
    }));
  };

  const marcarNoAplica = (marcado) => {
    setTemperaturas((prev) => prev.map((item, indice) =>
      indice === temperaturaActual
        ? { ...item, no_aplica: marcado, conforme: marcado ? null : item.conforme }
        : item
    ));
  };

  const siguiente = () => {
    if (etapa === 0) {
      if (!datos.en_uso || !inspecciones.inspeccion_visual || !inspecciones.limpieza_exterior || !inspecciones.limpieza_interior) {
        return alert("Complete En uso y las tres acciones preventivas antes de continuar.");
      }
      setEtapa(1);
      return;
    }

    if (etapa === 1) {
      if (!temp.no_aplica && temp.conforme === null) {
        return alert("Complete temperatura sensada y temperatura medida, o marque No aplica.");
      }
      if (temperaturaActual < temperaturas.length - 1) {
        setTemperaturaActual((p) => p + 1);
        return;
      }
      setEtapa(2);
      return;
    }

    if (etapa === 2) setEtapa(3);
  };

  const volver = () => {
    if (etapa === 0) return setVista("equipos");
    if (etapa === 1 && temperaturaActual > 0) {
      setTemperaturaActual((p) => p - 1);
      return;
    }
    setEtapa((p) => Math.max(0, p - 1));
  };

  const guardar = async () => {
    if (resumen.resultado === "PENDIENTE") return alert("Complete todas las verificaciones antes de guardar RIC64.");

    try {
      setGuardando(true);
      setError("");
      const respuesta = await fetch(API_URL.Ric64, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...datos,
          en_uso: datos.en_uso === true,
          resultado_general: resumen.resultado,
          observaciones,
          verificador_equipo: "MULTIMETRO FLUKE 87V",
          verificador_numero_serie: "14020306",
          verificador_certificado: "CEMEC 54126/25",
          verificador_vigencia: "2026-10-07",
          inspecciones,
          temperaturas
        })
      });
      const body = await respuesta.json();
      if (!respuesta.ok) throw new Error(body.error || "Error guardando RIC64");
      setRic64Id(body.ric64_id);
      if (datos.ric01_id) localStorage.removeItem(claveBorrador(datos.ric01_id));
      alert(`RIC64 guardado correctamente. ID: ${body.ric64_id}`);
    } catch (err) {
      setError(err.message || "No se pudo guardar RIC64.");
    } finally {
      setGuardando(false);
    }
  };

  const abrirPDF = () => ric64Id
    ? window.open(`${API_URL.Ric64}/${ric64Id}/pdf`, "_blank")
    : alert("Primero debe guardar el RIC64.");

  const enviarDrive = async () => {
    if (!ric64Id) return alert("Primero debe guardar el RIC64.");
    try {
      setEnviandoDrive(true);
      const respuesta = await fetch(`${API_URL.Ric64}/${ric64Id}/drive`, { method: "POST" });
      const body = await respuesta.json();
      if (!respuesta.ok) throw new Error(body.error || "Error enviando RIC64 a Drive");
      alert("RIC64 enviado correctamente a Google Drive.");
      if (body.archivo?.webViewLink) window.open(body.archivo.webViewLink, "_blank");
    } catch (err) {
      setError(err.message || "No se pudo enviar RIC64 a Drive.");
    } finally {
      setEnviandoDrive(false);
    }
  };

  if (cargando) return <div className="p-6 text-center"><p className="text-lg">⏳ Cargando datos del equipo...</p></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-50 bg-white shadow">
        <div className="max-w-xl mx-auto p-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <p className="font-bold">RIC64 - Verificación de Baño Termostático</p>
            <span>{ETAPAS[etapa]}</span>
            <span>{etapa + 1} / {ETAPAS.length}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progreso}%` }} />
          </div>
        </div>
      </div>

      <div className="p-4 max-w-xl mx-auto pb-10">
        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-xl">⚠️ {error}</div>}

        <div className="bg-gray-100 rounded-xl p-3 mb-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-bold">{datos.descripcion}</p>
              <p className="text-sm text-gray-600">{datos.marca_modelo}</p>
            </div>
            <div className="text-right text-xs">
              <p><b>Serie:</b> {datos.numero_serie}</p>
              <p><b>Área:</b> {datos.area}</p>
              <p><b>Servicio:</b> {datos.servicio}</p>
            </div>
          </div>
        </div>

        {etapa === 0 && (
          <div className="bg-white rounded-xl shadow p-4">
            <h2 className="text-xl font-bold mb-2">1. Inspección visual</h2>
            <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3 mb-4">Verifique el estado general del baño antes del control de temperatura.</p>

            <label className="font-semibold block mb-1">En uso</label>
            <select
              value={datos.en_uso === "" ? "" : datos.en_uso ? "SI" : "NO"}
              onChange={(e) => setDatos((p) => ({ ...p, en_uso: e.target.value === "" ? "" : e.target.value === "SI" }))}
              className="w-full border rounded-xl p-3 mb-4 bg-white"
            >
              <option value="">Seleccionar</option>
              <option value="SI">Sí</option>
              <option value="NO">No</option>
            </select>

            <div className="space-y-4">
              {[
                ["inspeccion_visual", "Inspección visual"],
                ["limpieza_exterior", "Limpieza exterior"],
                ["limpieza_interior", "Limpieza interior"]
              ].map(([campo, titulo]) => (
                <div key={campo}>
                  <label className="font-semibold block mb-1">{titulo}</label>
                  <select
                    value={inspecciones[campo]}
                    onChange={(e) => setInspecciones((p) => ({ ...p, [campo]: e.target.value }))}
                    className={`w-full border rounded-xl p-3 ${inspecciones[campo] === "CONFORME" ? "bg-green-50 border-green-400" : inspecciones[campo] === "NO CONFORME" ? "bg-red-50 border-red-400" : "bg-white"}`}
                  >
                    <option value="">Seleccionar</option>
                    <option value="CONFORME">CONFORME</option>
                    <option value="NO CONFORME">NO CONFORME</option>
                    <option value="NO APLICA">NO APLICA</option>
                  </select>
                </div>
              ))}
            </div>

            <textarea
              value={inspecciones.observaciones}
              onChange={(e) => setInspecciones((p) => ({ ...p, observaciones: e.target.value }))}
              placeholder="Observaciones"
              className="w-full border rounded-xl p-3 min-h-20 mt-4"
            />

            <div className="flex gap-2 mt-6">
              <button onClick={volver} className="flex-1 bg-gray-500 text-white rounded-xl p-3">← Volver</button>
              <button onClick={siguiente} className="flex-1 bg-blue-600 text-white rounded-xl p-3">Continuar →</button>
            </div>
          </div>
        )}

        {etapa === 1 && temp && (
          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h2 className="text-xl font-bold">2. Control de temperatura</h2>
                <p className="text-sm text-gray-500">Punto {temperaturaActual + 1} de {temperaturas.length}</p>
              </div>
              <Estado conforme={temp.conforme} noAplica={temp.no_aplica} />
            </div>

            <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3 mb-4">{INSTRUCCION_GENERICA}</p>

            <div className={`border rounded-xl p-3 ${temp.no_aplica ? "bg-gray-50" : temp.conforme === true ? "bg-green-50 border-green-300" : temp.conforme === false ? "bg-red-50 border-red-300" : "bg-white"}`}>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-semibold">Temperatura seteada (°C)</label>
                  <input type="number" step="0.01" value={temp.temp_seteada} disabled={temp.no_aplica} onChange={(e) => actualizarTemperatura("temp_seteada", e.target.value)} className="w-full border rounded-xl p-3 mt-1 bg-white disabled:bg-gray-100" />
                </div>
                <div>
                  <label className="text-sm font-semibold">Temperatura sensada por el baño (°C)</label>
                  <input type="number" step="0.01" value={temp.temp_sensada} disabled={temp.no_aplica} onChange={(e) => actualizarTemperatura("temp_sensada", e.target.value)} className="w-full border rounded-xl p-3 mt-1 bg-white disabled:bg-gray-100" />
                </div>
                <div>
                  <label className="text-sm font-semibold">Temperatura medida con patrón (°C)</label>
                  <input type="number" step="0.01" value={temp.temp_medida} disabled={temp.no_aplica} onChange={(e) => actualizarTemperatura("temp_medida", e.target.value)} className="w-full border rounded-xl p-3 mt-1 bg-white disabled:bg-gray-100" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm mt-4">
                <div className="bg-white border rounded-xl p-3"><span className="text-gray-500 text-xs">Error</span><div className="font-bold">{temp.error_porcentaje == null ? "-" : `${temp.error_porcentaje}%`}</div></div>
                <div className="bg-white border rounded-xl p-3"><span className="text-gray-500 text-xs">Rango de aceptación</span><div className="font-bold">5%</div></div>
              </div>

              <textarea
                value={temp.observaciones}
                disabled={temp.no_aplica}
                onChange={(e) => actualizarTemperatura("observaciones", e.target.value)}
                placeholder="Observaciones del punto"
                className="w-full border rounded-xl p-3 min-h-20 mt-3 bg-white disabled:bg-gray-100"
              />

              <label className="mt-3 flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" checked={temp.no_aplica} onChange={(e) => marcarNoAplica(e.target.checked)} />
                No aplica
              </label>
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={volver} className="flex-1 bg-gray-500 text-white rounded-xl p-3">← Volver</button>
              <button onClick={() => setVista("equipos")} className="flex-1 bg-red-500 text-white rounded-xl p-3">Cancelar</button>
              <button onClick={siguiente} className="flex-1 bg-blue-600 text-white rounded-xl p-3">Aceptar →</button>
            </div>
          </div>
        )}

        {etapa === 2 && (
          <div className="bg-white rounded-xl shadow p-4 space-y-4">
            <h2 className="text-xl font-bold">3. Seguridad eléctrica · RIC 37</h2>
            <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">Realice el ensayo de seguridad eléctrica RIC37 y vincule su identificador al mantenimiento.</p>
            <input type="number" value={datos.ric37_id} onChange={(e) => setDatos((p) => ({ ...p, ric37_id: e.target.value }))} placeholder="ID RIC37" className="w-full border rounded-xl p-3" />
            <div className="bg-gray-50 border rounded-xl p-3 text-sm">
              <b>Equipo verificador:</b> MULTÍMETRO FLUKE 87V · NS 14020306 · CEMEC 54126/25 · Vigencia 07/10/2026
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={volver} className="flex-1 bg-gray-500 text-white rounded-xl p-3">← Volver</button>
              <button onClick={() => setVista("equipos")} className="flex-1 bg-red-500 text-white rounded-xl p-3">Cancelar</button>
              <button onClick={siguiente} className="flex-1 bg-blue-600 text-white rounded-xl p-3">Ver resumen →</button>
            </div>
          </div>
        )}

        {etapa === 3 && (
          <div className="bg-white rounded-xl shadow p-4 space-y-4">
            <h2 className="text-xl font-bold">4. Resumen</h2>

            <div className={`border rounded-xl p-4 ${resumen.resultado === "CONFORME" ? "bg-green-50 border-green-400" : resumen.resultado === "NO CONFORME" ? "bg-red-50 border-red-400" : "bg-gray-50"}`}>
              <p className={`font-bold text-lg ${resumen.resultado === "CONFORME" ? "text-green-700" : resumen.resultado === "NO CONFORME" ? "text-red-700" : "text-gray-700"}`}>
                {resumen.resultado === "CONFORME" ? "✅ VERIFICACIÓN CONFORME" : resumen.resultado === "NO CONFORME" ? "❌ VERIFICACIÓN NO CONFORME" : "⏳ VERIFICACIÓN PENDIENTE"}
              </p>
              <p className="text-sm mt-2">Conformes: <b>{resumen.conformes}</b> · No conformes: <b>{resumen.noConformes.length + resumen.inspeccionesNC}</b> · No aplica: <b>{resumen.noAplica}</b></p>
            </div>

            {resumen.noConformes.length > 0 && (
              <div className="bg-red-50 border border-red-300 rounded-xl p-3 text-sm text-red-800">
                <p className="font-bold mb-2">Puntos fuera del 5%</p>
                {resumen.noConformes.map((item) => <p key={item.orden}>• Punto {item.orden}: error {item.error_porcentaje}%</p>)}
              </div>
            )}

            <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Observaciones generales" className="w-full border rounded-xl p-3 min-h-24" />

            <div className="flex flex-wrap gap-2">
              <button onClick={guardar} disabled={guardando || resumen.resultado === "PENDIENTE"} className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold disabled:opacity-40">{guardando ? "Guardando..." : "Guardar RIC64"}</button>
              <button onClick={abrirPDF} disabled={!ric64Id} className="px-4 py-2 bg-gray-700 text-white rounded-xl disabled:opacity-40">Ver PDF</button>
              <button onClick={enviarDrive} disabled={!ric64Id || enviandoDrive} className="px-4 py-2 bg-green-700 text-white rounded-xl disabled:opacity-40">{enviandoDrive ? "Enviando..." : "Enviar a Drive"}</button>
            </div>

            <button onClick={volver} className="w-full bg-gray-500 text-white rounded-xl p-3">← Volver</button>
          </div>
        )}
      </div>
    </div>
  );
}
