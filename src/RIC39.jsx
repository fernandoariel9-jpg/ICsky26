import { useEffect, useMemo, useState } from "react";
import { API_URL } from "./config";

const ETAPAS = [
  "Inspecciones",
  "Normal",
  "Hipertenso",
  "Bradicardia",
  "Seguridad eléctrica",
  "Resumen"
];

const ESCENARIOS = [
  {
    nombre: "NORMAL",
    filas: [
      { parametro: "Forma de onda", valor_nominal: "Normal", rango_aceptacion: "Reprod. de onda", incertidumbre: "", tipo: "onda" },
      { parametro: "Frecuencia ECG", valor_nominal: "60 BPM", rango_aceptacion: "58 - 62 BPM", incertidumbre: "± 0,6 BPM", tipo: "numero", min: 58, max: 62 },
      { parametro: "Frecuencia resp.", valor_nominal: "20 RPM", rango_aceptacion: "19 - 21 RPM", incertidumbre: "", tipo: "numero", min: 19, max: 21 },
      { parametro: "Temperatura", valor_nominal: "37 °C", rango_aceptacion: "36,5 - 37,5 °C", incertidumbre: "± 0,4 °C", tipo: "numero", min: 36.5, max: 37.5 },
      { parametro: "IBP 1", valor_nominal: "120/80 mmHg", rango_aceptacion: "± 5%", incertidumbre: "", tipo: "presion_pct", sistolica: 120, diastolica: 80 },
      { parametro: "IBP 2", valor_nominal: "28/15 mmHg", rango_aceptacion: "± 5%", incertidumbre: "", tipo: "presion_pct", sistolica: 28, diastolica: 15 },
      { parametro: "PNI", valor_nominal: "120/80 mmHg", rango_aceptacion: "108-132/72-88 mmHg", incertidumbre: "± 1,1 / ± 0,9 mmHg", tipo: "presion_rango", sistMin: 108, sistMax: 132, diastMin: 72, diastMax: 88 },
      { parametro: "SpO²", valor_nominal: "97%", rango_aceptacion: "95% - 99%", incertidumbre: "Nellcor 1% / BCI 3%", tipo: "numero", min: 95, max: 99 }
    ]
  },
  {
    nombre: "HIPERTENSO",
    filas: [
      { parametro: "Forma de onda", valor_nominal: "Normal", rango_aceptacion: "Reprod. de onda", incertidumbre: "", tipo: "onda" },
      { parametro: "Frecuencia ECG", valor_nominal: "130 BPM", rango_aceptacion: "128 - 132 BPM", incertidumbre: "± 1,3 BPM", tipo: "numero", min: 128, max: 132 },
      { parametro: "Frecuencia resp.", valor_nominal: "40 RPM", rango_aceptacion: "39 - 41 RPM", incertidumbre: "", tipo: "numero", min: 39, max: 41 },
      { parametro: "Temperatura", valor_nominal: "37 °C", rango_aceptacion: "36,5 - 37,5 °C", incertidumbre: "± 0,4 °C", tipo: "numero", min: 36.5, max: 37.5 },
      { parametro: "IBP 1", valor_nominal: "120/80 mmHg", rango_aceptacion: "± 5%", incertidumbre: "", tipo: "presion_pct", sistolica: 120, diastolica: 80 },
      { parametro: "IBP 2", valor_nominal: "28/15 mmHg", rango_aceptacion: "± 5%", incertidumbre: "", tipo: "presion_pct", sistolica: 28, diastolica: 15 },
      { parametro: "PNI", valor_nominal: "210/150 mmHg", rango_aceptacion: "189-231/135-165 mmHg", incertidumbre: "± 1,5 / ± 1,25 mmHg", tipo: "presion_rango", sistMin: 189, sistMax: 231, diastMin: 135, diastMax: 165 },
      { parametro: "SpO²", valor_nominal: "93%", rango_aceptacion: "92% - 96%", incertidumbre: "Nellcor 1% / BCI 3%", tipo: "numero", min: 92, max: 96 }
    ]
  },
  {
    nombre: "BRADICARDIA",
    filas: [
      { parametro: "Forma de onda", valor_nominal: "Normal", rango_aceptacion: "Reprod. de onda", incertidumbre: "", tipo: "onda" },
      { parametro: "Frecuencia ECG", valor_nominal: "30 BPM", rango_aceptacion: "28 - 32 BPM", incertidumbre: "± 0,3 BPM", tipo: "numero", min: 28, max: 32 },
      { parametro: "Frecuencia resp.", valor_nominal: "15 RPM", rango_aceptacion: "14 - 16 RPM", incertidumbre: "", tipo: "numero", min: 14, max: 16 },
      { parametro: "Temperatura", valor_nominal: "37 °C", rango_aceptacion: "36,5 - 37,5 °C", incertidumbre: "± 0,4 °C", tipo: "numero", min: 36.5, max: 37.5 },
      { parametro: "IBP 1", valor_nominal: "120/80 mmHg", rango_aceptacion: "± 5%", incertidumbre: "", tipo: "presion_pct", sistolica: 120, diastolica: 80 },
      { parametro: "IBP 2", valor_nominal: "28/15 mmHg", rango_aceptacion: "± 5%", incertidumbre: "", tipo: "presion_pct", sistolica: 28, diastolica: 15 },
      { parametro: "PNI", valor_nominal: "100/65 mmHg", rango_aceptacion: "90-110/58,5-71,5 mmHg", incertidumbre: "± 1 / ± 0,825 mmHg", tipo: "presion_rango", sistMin: 90, sistMax: 110, diastMin: 58.5, diastMax: 71.5 },
      { parametro: "SpO²", valor_nominal: "85%", rango_aceptacion: "83% - 87%", incertidumbre: "Nellcor 1% / BCI 3%", tipo: "numero", min: 83, max: 87 }
    ]
  }
];

const hoyLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const normalizar = (valor = "") =>
  String(valor).normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

const leerNumero = (valor) => {
  const match = String(valor ?? "").replace(",", ".").match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : NaN;
};

const leerPresion = (valor) => {
  const match = String(valor ?? "")
    .replace(/,/g, ".")
    .match(/(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)/);
  return match ? [Number(match[1]), Number(match[2])] : null;
};

const crearMediciones = () =>
  ESCENARIOS.flatMap((escenario) =>
    escenario.filas.map((fila, index) => ({
      escenario: escenario.nombre,
      orden: index + 1,
      ...fila,
      medicion: "",
      conforme: null,
      no_aplica: false,
      observaciones: ""
    }))
  );

const evaluar = (item, valor) => {
  if (String(valor ?? "").trim() === "") return null;
  if (item.tipo === "onda") return normalizar(valor) === "normal";

  if (item.tipo === "numero") {
    const numero = leerNumero(valor);
    if (!Number.isFinite(numero)) return null;
    return numero >= item.min && numero <= item.max;
  }

  const presion = leerPresion(valor);
  if (!presion) return null;
  const [sistolica, diastolica] = presion;

  if (item.tipo === "presion_pct") {
    return (
      sistolica >= item.sistolica * 0.95 &&
      sistolica <= item.sistolica * 1.05 &&
      diastolica >= item.diastolica * 0.95 &&
      diastolica <= item.diastolica * 1.05
    );
  }

  return (
    sistolica >= item.sistMin &&
    sistolica <= item.sistMax &&
    diastolica >= item.diastMin &&
    diastolica <= item.diastMax
  );
};

function Estado({ conforme, noAplica }) {
  if (noAplica) {
    return <span className="inline-flex px-3 py-1 rounded-full bg-gray-200 text-gray-700 font-bold">NO APLICA</span>;
  }
  if (conforme === true) {
    return <span className="inline-flex px-3 py-1 rounded-full bg-green-100 text-green-700 font-bold">CONFORME</span>;
  }
  if (conforme === false) {
    return <span className="inline-flex px-3 py-1 rounded-full bg-red-100 text-red-700 font-bold">NO CONFORME</span>;
  }
  return <span className="inline-flex px-3 py-1 rounded-full bg-gray-100 text-gray-500 font-semibold">PENDIENTE</span>;
}

function Campo({ label, ...props }) {
  return (
    <label className="text-sm block">
      <span className="font-semibold block mb-1">{label}</span>
      <input {...props} className="w-full border rounded-xl p-3 bg-white" />
    </label>
  );
}

export default function RIC39({ setVista, personal }) {
  const [etapa, setEtapa] = useState(0);
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
    fecha: hoyLocal(),
    tecnico: personal?.nombre || ""
  });
  const [inspecciones, setInspecciones] = useState({
    aceptacion_visual: "",
    limpieza_exterior: "",
    estado_baterias: "",
    estado_cables: "",
    observaciones: ""
  });
  const [mediciones, setMediciones] = useState(crearMediciones);
  const [observaciones, setObservaciones] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [enviandoDrive, setEnviandoDrive] = useState(false);
  const [error, setError] = useState("");
  const [ric39Id, setRic39Id] = useState(null);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const tareaGuardada = localStorage.getItem("tareaActiva");
        if (!tareaGuardada) throw new Error("No hay una tarea activa.");

        const tarea = JSON.parse(tareaGuardada);
        let equipo = null;

        if (tarea.numero_serie) {
          const res = await fetch(`${API_URL.BuscarEquipo}/${encodeURIComponent(tarea.numero_serie)}`);
          if (res.ok) equipo = await res.json();
        }

        setDatos((prev) => ({
          ...prev,
          ric01_id: tarea.ric01_id || tarea.id || "",
          equipo_id: equipo?.id || tarea.equipo_id || "",
          numero_serie: equipo?.numero_serie || tarea.numero_serie || "",
          descripcion: equipo?.descripcion || tarea.descripcion || "MONITOR MULTIPARAMÉTRICO",
          marca_modelo: equipo?.marca_modelo || tarea.marca_modelo || "",
          area: equipo?.area || tarea.area || "",
          servicio: equipo?.servicio || tarea.servicio || "",
          sub_servicio: equipo?.sub_servicio || tarea.subservicio || "",
          encargado: equipo?.encargado || tarea.encargado || "",
          tecnico: personal?.nombre || tarea.usuario || ""
        }));
      } catch (err) {
        console.error(err);
        setError(err.message || "No se pudieron cargar los datos del equipo.");
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, [personal]);

  const resumen = useMemo(() => {
    const evaluadas = mediciones.filter((m) => !m.no_aplica && m.conforme !== null);
    const noConformes = evaluadas.filter((m) => m.conforme === false);
    const noAplica = mediciones.filter((m) => m.no_aplica).length;
    const faltantes = mediciones.filter((m) => !m.no_aplica && !String(m.medicion).trim()).length;

    const inspeccionesValores = [
      inspecciones.aceptacion_visual,
      inspecciones.limpieza_exterior,
      inspecciones.estado_baterias,
      inspecciones.estado_cables
    ];
    const inspeccionesPendientes = inspeccionesValores.some((v) => !v);
    const inspeccionesNoConformes = Object.entries(inspecciones)
      .filter(([campo, valor]) => campo !== "observaciones" && valor === "NO CONFORME")
      .map(([campo]) => campo.replace(/_/g, " "));

    let resultado = "PENDIENTE";
    if (faltantes === 0 && !inspeccionesPendientes) {
      resultado = noConformes.length > 0 || inspeccionesNoConformes.length > 0 ? "NO CONFORME" : "CONFORME";
    }

    const observacionAutomatica = noConformes.length
      ? `Mediciones no conformes: ${noConformes
          .map((m) => `${m.escenario} - ${m.parametro}: ${m.medicion} (rango ${m.rango_aceptacion})`)
          .join(" | ")}`
      : "";

    return {
      evaluadas: evaluadas.length,
      conformes: evaluadas.filter((m) => m.conforme === true).length,
      noConformes,
      noAplica,
      faltantes,
      inspeccionesNoConformes,
      resultado,
      observacionAutomatica
    };
  }, [mediciones, inspecciones]);

  const progreso = ((etapa + 1) / ETAPAS.length) * 100;

  const actualizarMedicion = (indice, valor) => {
    setMediciones((prev) =>
      prev.map((m, i) =>
        i === indice ? { ...m, medicion: valor, conforme: evaluar(m, valor), no_aplica: false } : m
      )
    );
  };

  const cambiarNoAplica = (indice, marcado) => {
    setMediciones((prev) =>
      prev.map((m, i) =>
        i === indice
          ? {
              ...m,
              no_aplica: marcado,
              medicion: marcado ? "" : m.medicion,
              conforme: marcado ? null : evaluar(m, m.medicion)
            }
          : m
      )
    );
  };

  const medicionesEscenario = (escenario) =>
    mediciones.map((m, indice) => ({ ...m, indice })).filter((m) => m.escenario === escenario);

  const guardar = async () => {
    if (!datos.numero_serie) return alert("Falta el número de serie.");
    if (resumen.resultado === "PENDIENTE") {
      return alert("Complete las inspecciones y todas las mediciones, o marque No aplica donde corresponda.");
    }

    const observacionFinal = [
      resumen.observacionAutomatica,
      resumen.inspeccionesNoConformes.length
        ? `Inspecciones no conformes: ${resumen.inspeccionesNoConformes.join(", ")}`
        : "",
      observaciones
    ]
      .filter(Boolean)
      .join(" | ");

    try {
      setGuardando(true);
      setError("");

      const res = await fetch(API_URL.Ric39, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...datos,
          resultado_general: resumen.resultado,
          observaciones: observacionFinal,
          verificador_equipo: "ANALIZADOR DE MONITORES FLUKE PROSIM 8",
          verificador_numero_serie: "2496025",
          verificador_etyc: "2025-01-27",
          verificador_vigencia: "2026-01-27",
          inspecciones,
          mediciones
        })
      });

      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Error guardando RIC39");

      setRic39Id(body.ric39_id);
      alert(`RIC39 guardado correctamente. ID: ${body.ric39_id}`);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const abrirPDF = () => {
    if (!ric39Id) return alert("Primero debe guardar el RIC39.");
    window.open(`${API_URL.Ric39}/${ric39Id}/pdf`, "_blank", "noopener,noreferrer");
  };

  const enviarDrive = async () => {
    if (!ric39Id) return alert("Primero debe guardar el RIC39.");

    try {
      setEnviandoDrive(true);
      const res = await fetch(`${API_URL.Ric39}/${ric39Id}/drive`, { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Error enviando a Drive");

      alert("RIC39 enviado correctamente a Google Drive.");
      if (body.archivo?.webViewLink) window.open(body.archivo.webViewLink, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setEnviandoDrive(false);
    }
  };

  const renderEscenario = (nombre) => (
    <div className="space-y-4">
      {medicionesEscenario(nombre).map((m) => (
        <div
          key={`${m.escenario}-${m.orden}`}
          className={`rounded-2xl border p-4 shadow-sm transition-colors ${
            m.no_aplica
              ? "border-gray-300 bg-gray-50"
              : m.conforme === true
                ? "border-green-300 bg-green-50"
                : m.conforme === false
                  ? "border-red-300 bg-red-50"
                  : "border-gray-200 bg-white"
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-gray-800">{m.parametro}</h3>
              <p className="text-sm text-gray-600 mt-1">Valor nominal: <b>{m.valor_nominal}</b></p>
              <p className="text-sm text-gray-600">Rango de aceptación: <b>{m.rango_aceptacion}</b></p>
              {m.incertidumbre && <p className="text-sm text-gray-600">Incertidumbre: <b>{m.incertidumbre}</b></p>}
            </div>
            <Estado conforme={m.conforme} noAplica={m.no_aplica} />
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-center">
            {m.tipo === "onda" ? (
              <select
                value={m.medicion}
                disabled={m.no_aplica}
                onChange={(e) => actualizarMedicion(m.indice, e.target.value)}
                className={`w-full border rounded-xl p-3 text-lg ${
                  m.no_aplica
                    ? "bg-gray-100 text-gray-400"
                    : m.conforme === true
                      ? "border-green-400 bg-white"
                      : m.conforme === false
                        ? "border-red-400 bg-white"
                        : "bg-white"
                }`}
              >
                <option value="">Seleccionar resultado</option>
                <option value="Normal">Normal</option>
                <option value="Alterada">Alterada</option>
              </select>
            ) : (
              <input
                value={m.medicion}
                disabled={m.no_aplica}
                onChange={(e) => actualizarMedicion(m.indice, e.target.value)}
                placeholder={m.tipo.startsWith("presion") ? "Ej.: 120/80" : "Ingrese medición"}
                className={`w-full border rounded-xl p-3 text-lg ${
                  m.no_aplica
                    ? "bg-gray-100 text-gray-400"
                    : m.conforme === true
                      ? "border-green-400 bg-white"
                      : m.conforme === false
                        ? "border-red-400 bg-white"
                        : "bg-white"
                }`}
              />
            )}

            <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 text-sm font-semibold cursor-pointer whitespace-nowrap">
              <input
                type="checkbox"
                checked={m.no_aplica}
                onChange={(e) => cambiarNoAplica(m.indice, e.target.checked)}
                className="w-4 h-4"
              />
              No aplica
            </label>
          </div>
        </div>
      ))}
    </div>
  );

  if (cargando) return <div className="p-6">Cargando RIC39...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-3 md:p-6">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-blue-600 text-white p-5 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-blue-100 uppercase tracking-wide">Sistema de Gestión de la Calidad</p>
              <h1 className="text-2xl md:text-3xl font-bold mt-1">RIC 39</h1>
              <p className="text-lg font-semibold text-blue-50">Verificación de monitor multiparamétrico</p>
            </div>
            <button onClick={() => setVista("equipos")} className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 font-semibold">← Volver</button>
          </div>
        </div>

        <div className="p-4 md:p-6">
          {error && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-300 text-red-700">{error}</div>}

          <div className="border border-gray-200 rounded-2xl overflow-hidden mb-5 shadow-sm">
            <div className="bg-gray-100 px-4 py-3 font-bold text-gray-800">Datos del equipo</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 p-4 text-sm">
              <p><b>Equipo:</b> {datos.descripcion}</p>
              <p><b>Área:</b> {datos.area}</p>
              <p><b>Marca / Modelo:</b> {datos.marca_modelo}</p>
              <p><b>Servicio:</b> {datos.servicio}</p>
              <p><b>Nº de Serie:</b> {datos.numero_serie}</p>
              <p><b>Subservicio:</b> {datos.sub_servicio}</p>
              <p><b>Técnico:</b> {datos.tecnico}</p>
              <Campo label="Fecha" type="date" value={datos.fecha} onChange={(e) => setDatos({ ...datos, fecha: e.target.value })} />
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-6 shadow-sm">
            <div className="flex justify-between text-sm font-bold mb-2">
              <span>{ETAPAS[etapa]}</span>
              <span>{etapa + 1} / {ETAPAS.length}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progreso}%` }} />
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-4 md:p-5 shadow-sm">
            {etapa === 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4">Inspecciones previas</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    ["aceptacion_visual", "Aceptación según inspección visual"],
                    ["limpieza_exterior", "Limpieza exterior"],
                    ["estado_baterias", "Estado de baterías"],
                    ["estado_cables", "Estado de cables"]
                  ].map(([campo, label]) => (
                    <label key={campo} className="text-sm">
                      <span className="font-semibold block mb-1">{label}</span>
                      <select
                        value={inspecciones[campo]}
                        onChange={(e) => setInspecciones({ ...inspecciones, [campo]: e.target.value })}
                        className={`w-full border rounded-xl p-3 ${
                          inspecciones[campo] === "CONFORME"
                            ? "border-green-400 bg-green-50 text-green-700"
                            : inspecciones[campo] === "NO CONFORME"
                              ? "border-red-400 bg-red-50 text-red-700"
                              : "bg-white"
                        }`}
                      >
                        <option value="">Seleccionar</option>
                        <option value="CONFORME">CONFORME</option>
                        <option value="NO CONFORME">NO CONFORME</option>
                        <option value="NO APLICA">NO APLICA</option>
                      </select>
                    </label>
                  ))}
                </div>

                <textarea
                  value={inspecciones.observaciones}
                  onChange={(e) => setInspecciones({ ...inspecciones, observaciones: e.target.value })}
                  placeholder="Observaciones de inspección"
                  className="mt-4 w-full border rounded-xl p-3 min-h-24"
                />
              </div>
            )}

            {etapa === 1 && renderEscenario("NORMAL")}
            {etapa === 2 && renderEscenario("HIPERTENSO")}
            {etapa === 3 && renderEscenario("BRADICARDIA")}

            {etapa === 4 && (
              <div>
                <h2 className="text-xl font-bold mb-4">Ensayo de seguridad eléctrica · RIC 37</h2>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 text-sm text-blue-800">
                  Asociá el RIC37 realizado para este equipo. El PDF de RIC39 utilizará ese vínculo como ensayo de seguridad eléctrica.
                </div>
                <Campo label="ID RIC37" type="number" value={datos.ric37_id} onChange={(e) => setDatos({ ...datos, ric37_id: e.target.value })} />
                <div className="mt-4 text-sm bg-gray-50 border rounded-xl p-3">
                  <b>Equipo verificador:</b> ANALIZADOR DE MONITORES FLUKE PROSIM 8 · NS 2496025 · ETYC 27/01/2025 · VIGENCIA 27/01/2026
                </div>
              </div>
            )}

            {etapa === 5 && (
              <div>
                <h2 className="text-xl font-bold mb-4">Resumen final</h2>

                <div className={`rounded-2xl border-2 p-5 mb-4 ${
                  resumen.resultado === "CONFORME"
                    ? "border-green-400 bg-green-50"
                    : resumen.resultado === "NO CONFORME"
                      ? "border-red-400 bg-red-50"
                      : "border-gray-300 bg-gray-50"
                }`}>
                  <div className="text-sm text-gray-600">Resultado general</div>
                  <div className={`text-2xl font-bold mt-1 ${
                    resumen.resultado === "CONFORME"
                      ? "text-green-700"
                      : resumen.resultado === "NO CONFORME"
                        ? "text-red-700"
                        : "text-gray-600"
                  }`}>
                    {resumen.resultado}
                  </div>
                  <div className="mt-3 text-sm flex flex-wrap gap-x-4 gap-y-1">
                    <span>Evaluadas: <b>{resumen.evaluadas}</b></span>
                    <span>Conformes: <b className="text-green-700">{resumen.conformes}</b></span>
                    <span>No conformes: <b className="text-red-700">{resumen.noConformes.length}</b></span>
                    <span>No aplica: <b>{resumen.noAplica}</b></span>
                  </div>
                </div>

                {resumen.observacionAutomatica && (
                  <div className="rounded-xl border border-red-300 bg-red-50 p-4 mb-4 text-red-800">
                    <div className="font-bold mb-1">Observación automática</div>
                    {resumen.observacionAutomatica}
                  </div>
                )}

                {resumen.inspeccionesNoConformes.length > 0 && (
                  <div className="rounded-xl border border-red-300 bg-red-50 p-4 mb-4 text-red-800">
                    <b>Inspecciones no conformes:</b> {resumen.inspeccionesNoConformes.join(", ")}
                  </div>
                )}

                <textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Observaciones adicionales del técnico"
                  className="w-full border rounded-xl p-3 min-h-28"
                />

                <div className="flex flex-wrap gap-2 mt-5">
                  <button onClick={guardar} disabled={guardando || resumen.resultado === "PENDIENTE"} className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold disabled:opacity-40">
                    {guardando ? "Guardando..." : "Guardar RIC39"}
                  </button>
                  <button onClick={abrirPDF} disabled={!ric39Id} className="px-4 py-2 rounded-xl bg-gray-700 text-white font-semibold disabled:opacity-40">Ver PDF</button>
                  <button onClick={enviarDrive} disabled={!ric39Id || enviandoDrive} className="px-4 py-2 rounded-xl bg-green-700 text-white font-semibold disabled:opacity-40">
                    {enviandoDrive ? "Enviando..." : "Enviar a Drive"}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between gap-3 mt-6">
            <button
              onClick={() => {
                if (etapa === 0) {
                  setVista("equipos");
                  return;
                }
                setEtapa((actual) => Math.max(0, actual - 1));
              }}
              className="px-4 py-2 rounded-xl bg-gray-200 text-gray-700 font-semibold"
            >
              {etapa === 0 ? "← Volver" : "← Anterior"}
            </button>

            {etapa < ETAPAS.length - 1 && (
              <button
                onClick={() => setEtapa((actual) => Math.min(ETAPAS.length - 1, actual + 1))}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold"
              >
                Siguiente →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
