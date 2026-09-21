import { useEffect, useMemo, useState } from "react";
import { API_URL } from "./config";

const ETAPAS = ["Aceptación visual", "Normal", "Hipertenso", "Bradicardia", "Seguridad eléctrica", "Resumen"];

const ESCENARIOS = [
  {
    nombre: "NORMAL",
    filas: [
      ["Forma de onda", "Normal", "Reprod. de onda", "", "onda"],
      ["Frecuencia ECG", "60 BPM", "58 - 62 BPM", "± 0,6 BPM", "numero", 58, 62],
      ["Frecuencia resp.", "20 RPM", "19 - 21 RPM", "", "numero", 19, 21],
      ["Temperatura", "37 °C", "36,5 - 37,5 °C", "± 0,4 °C", "numero", 36.5, 37.5],
      ["IBP 1", "120/80 mmHg", "± 5%", "", "presion_pct", 120, 80],
      ["IBP 2", "28/15 mmHg", "± 5%", "", "presion_pct", 28, 15],
      ["PNI", "120/80 mmHg", "108-132/72-88 mmHg", "± 1,1 / ± 0,9 mmHg", "presion_rango", 108, 132, 72, 88],
      ["SpO²", "97%", "95% - 99%", "Nellcor 1% / BCI 3%", "numero", 95, 99]
    ]
  },
  {
    nombre: "HIPERTENSO",
    filas: [
      ["Forma de onda", "Normal", "Reprod. de onda", "", "onda"],
      ["Frecuencia ECG", "130 BPM", "128 - 132 BPM", "± 1,3 BPM", "numero", 128, 132],
      ["Frecuencia resp.", "40 RPM", "39 - 41 RPM", "", "numero", 39, 41],
      ["Temperatura", "37 °C", "36,5 - 37,5 °C", "± 0,4 °C", "numero", 36.5, 37.5],
      ["IBP 1", "120/80 mmHg", "± 5%", "", "presion_pct", 120, 80],
      ["IBP 2", "28/15 mmHg", "± 5%", "", "presion_pct", 28, 15],
      ["PNI", "210/150 mmHg", "189-231/135-165 mmHg", "± 1,5 / ± 1,25 mmHg", "presion_rango", 189, 231, 135, 165],
      ["SpO²", "93%", "92% - 96%", "Nellcor 1% / BCI 3%", "numero", 92, 96]
    ]
  },
  {
    nombre: "BRADICARDIA",
    filas: [
      ["Forma de onda", "Normal", "Reprod. de onda", "", "onda"],
      ["Frecuencia ECG", "30 BPM", "28 - 32 BPM", "± 0,3 BPM", "numero", 28, 32],
      ["Frecuencia resp.", "15 RPM", "14 - 16 RPM", "", "numero", 14, 16],
      ["Temperatura", "37 °C", "36,5 - 37,5 °C", "± 0,4 °C", "numero", 36.5, 37.5],
      ["IBP 1", "120/80 mmHg", "± 5%", "", "presion_pct", 120, 80],
      ["IBP 2", "28/15 mmHg", "± 5%", "", "presion_pct", 28, 15],
      ["PNI", "100/65 mmHg", "90-110/58,5-71,5 mmHg", "± 1 / ± 0,825 mmHg", "presion_rango", 90, 110, 58.5, 71.5],
      ["SpO²", "85%", "83% - 87%", "Nellcor 1% / BCI 3%", "numero", 83, 87]
    ]
  }
];

const hoyLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const crearMediciones = () =>
  ESCENARIOS.flatMap((escenario) =>
    escenario.filas.map((f, i) => ({
      escenario: escenario.nombre,
      orden: i + 1,
      parametro: f[0],
      valor_nominal: f[1],
      rango_aceptacion: f[2],
      incertidumbre: f[3],
      tipo: f[4],
      a: f[5],
      b: f[6],
      c: f[7],
      d: f[8],
      medicion: "",
      conforme: null,
      no_aplica: false,
      observaciones: ""
    }))
  );

const normalizar = (v = "") => String(v).normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
const leerNumero = (v) => {
  const m = String(v ?? "").replace(",", ".").match(/-?\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : NaN;
};
const leerPresion = (v) => {
  const m = String(v ?? "").replace(/,/g, ".").match(/(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)/);
  return m ? [Number(m[1]), Number(m[2])] : null;
};

const evaluar = (m, valor) => {
  if (!String(valor ?? "").trim()) return null;
  if (m.tipo === "onda") return normalizar(valor) === "normal";
  if (m.tipo === "numero") {
    const n = leerNumero(valor);
    return Number.isFinite(n) ? n >= m.a && n <= m.b : null;
  }
  const p = leerPresion(valor);
  if (!p) return null;
  const [s, d] = p;
  if (m.tipo === "presion_pct") return s >= m.a * 0.95 && s <= m.a * 1.05 && d >= m.b * 0.95 && d <= m.b * 1.05;
  return s >= m.a && s <= m.b && d >= m.c && d <= m.d;
};

function Estado({ conforme, noAplica }) {
  if (noAplica) return <span className="px-2 py-1 rounded-lg bg-gray-200 text-gray-700 text-xs font-bold">NO APLICA</span>;
  if (conforme === true) return <span className="px-2 py-1 rounded-lg bg-green-100 text-green-700 text-xs font-bold">CONFORME</span>;
  if (conforme === false) return <span className="px-2 py-1 rounded-lg bg-red-100 text-red-700 text-xs font-bold">NO CONFORME</span>;
  return <span className="px-2 py-1 rounded-lg bg-gray-100 text-gray-500 text-xs font-bold">PENDIENTE</span>;
}

export default function RIC39({ setVista, personal }) {
  const [etapa, setEtapa] = useState(0);
  const [actual, setActual] = useState({ NORMAL: 0, HIPERTENSO: 0, BRADICARDIA: 0 });
  const [datos, setDatos] = useState({ ric01_id: "", ric37_id: "", equipo_id: "", numero_serie: "", descripcion: "", marca_modelo: "", area: "", servicio: "", sub_servicio: "", encargado: "", fecha: hoyLocal(), tecnico: personal?.nombre || "" });
  const [inspecciones, setInspecciones] = useState({ limpieza_exterior: "", estado_baterias: "", estado_cables: "", observaciones: "" });
  const [mediciones, setMediciones] = useState(crearMediciones);
  const [observaciones, setObservaciones] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [enviandoDrive, setEnviandoDrive] = useState(false);
  const [error, setError] = useState("");
  const [ric39Id, setRic39Id] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const raw = localStorage.getItem("tareaActiva");
        if (!raw) throw new Error("No hay una tarea activa.");
        const tarea = JSON.parse(raw);
        let equipo = null;
        if (tarea.numero_serie) {
          const r = await fetch(`${API_URL.BuscarEquipo}/${encodeURIComponent(tarea.numero_serie)}`);
          if (r.ok) equipo = await r.json();
        }
        setDatos((p) => ({
          ...p,
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
      } catch (e) {
        setError(e.message || "No se pudieron cargar los datos del equipo.");
      } finally {
        setCargando(false);
      }
    })();
  }, [personal]);

  const resumen = useMemo(() => {
    const evaluadas = mediciones.filter((m) => !m.no_aplica && m.conforme !== null);
    const noConformes = evaluadas.filter((m) => m.conforme === false);
    const noAplica = mediciones.filter((m) => m.no_aplica).length;
    const faltantes = mediciones.filter((m) => !m.no_aplica && !String(m.medicion).trim()).length;
    const inspPend = [inspecciones.limpieza_exterior, inspecciones.estado_baterias, inspecciones.estado_cables].some((v) => !v);
    const inspNC = Object.entries(inspecciones).filter(([k, v]) => k !== "observaciones" && v === "NO CONFORME").map(([k]) => k.replace(/_/g, " "));
    const resultado = faltantes || inspPend ? "PENDIENTE" : noConformes.length || inspNC.length ? "NO CONFORME" : "CONFORME";
    const obsAuto = noConformes.length ? `Mediciones no conformes: ${noConformes.map((m) => `${m.escenario} - ${m.parametro}: ${m.medicion} (rango ${m.rango_aceptacion})`).join(" | ")}` : "";
    return { evaluadas: evaluadas.length, conformes: evaluadas.filter((m) => m.conforme === true).length, noConformes, noAplica, resultado, inspNC, obsAuto };
  }, [mediciones, inspecciones]);

  const escenario = etapa === 1 ? "NORMAL" : etapa === 2 ? "HIPERTENSO" : etapa === 3 ? "BRADICARDIA" : null;
  const lista = escenario ? mediciones.map((m, indice) => ({ ...m, indice })).filter((m) => m.escenario === escenario) : [];
  const pos = escenario ? actual[escenario] : 0;
  const med = lista[pos];
  const progreso = ((etapa + 1) / ETAPAS.length) * 100;

  const cambiarMedicion = (indice, valor) => setMediciones((p) => p.map((m, i) => i === indice ? { ...m, medicion: valor, conforme: evaluar(m, valor), no_aplica: false } : m));
  const cambiarNA = (indice, marcado) => setMediciones((p) => p.map((m, i) => i === indice ? { ...m, no_aplica: marcado, medicion: marcado ? "" : m.medicion, conforme: marcado ? null : evaluar(m, m.medicion) } : m));

  const siguiente = () => {
    if (etapa === 0) return setEtapa(1);
    if (escenario) {
      if (!med.no_aplica && (!String(med.medicion).trim() || med.conforme === null)) return alert("Complete la medición o marque No aplica.");
      if (pos < lista.length - 1) return setActual((p) => ({ ...p, [escenario]: pos + 1 }));
    }
    if (etapa < 5) setEtapa((e) => e + 1);
  };

  const anterior = () => {
    if (etapa === 0) return setVista("equipos");
    if (escenario && pos > 0) return setActual((p) => ({ ...p, [escenario]: pos - 1 }));
    if (etapa === 2) { setEtapa(1); return setActual((p) => ({ ...p, NORMAL: 7 })); }
    if (etapa === 3) { setEtapa(2); return setActual((p) => ({ ...p, HIPERTENSO: 7 })); }
    if (etapa === 4) { setEtapa(3); return setActual((p) => ({ ...p, BRADICARDIA: 7 })); }
    setEtapa((e) => Math.max(0, e - 1));
  };

  const guardar = async () => {
    if (resumen.resultado === "PENDIENTE") return alert("Complete todas las mediciones o marque No aplica.");
    const obsFinal = [resumen.obsAuto, resumen.inspNC.length ? `Inspecciones no conformes: ${resumen.inspNC.join(", ")}` : "", observaciones].filter(Boolean).join(" | ");
    try {
      setGuardando(true);
      const r = await fetch(API_URL.Ric39, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...datos, resultado_general: resumen.resultado, observaciones: obsFinal, verificador_equipo: "ANALIZADOR DE MONITORES FLUKE PROSIM 8", verificador_numero_serie: "2496025", verificador_etyc: "2025-01-27", verificador_vigencia: "2026-01-27", inspecciones, mediciones }) });
      const b = await r.json();
      if (!r.ok) throw new Error(b.error || "Error guardando RIC39");
      setRic39Id(b.ric39_id);
      alert(`RIC39 guardado correctamente. ID: ${b.ric39_id}`);
    } catch (e) { setError(e.message); } finally { setGuardando(false); }
  };

  const abrirPDF = () => ric39Id ? window.open(`${API_URL.Ric39}/${ric39Id}/pdf`, "_blank") : alert("Primero debe guardar el RIC39.");
  const enviarDrive = async () => {
    if (!ric39Id) return alert("Primero debe guardar el RIC39.");
    try {
      setEnviandoDrive(true);
      const r = await fetch(`${API_URL.Ric39}/${ric39Id}/drive`, { method: "POST" });
      const b = await r.json();
      if (!r.ok) throw new Error(b.error || "Error enviando a Drive");
      alert("RIC39 enviado correctamente a Google Drive.");
      if (b.archivo?.webViewLink) window.open(b.archivo.webViewLink, "_blank");
    } catch (e) { setError(e.message); } finally { setEnviandoDrive(false); }
  };

  if (cargando) return <div className="p-6 text-center"><p className="text-lg">⏳ Cargando datos del equipo...</p></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-50 bg-white shadow">
        <div className="max-w-xl mx-auto p-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <p className="font-bold">RIC39 - MP Monitores Multiparamétricos</p>
            <span>{ETAPAS[etapa]}</span>
            <span>{etapa + 1} / {ETAPAS.length}</span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progreso}%` }}
            />
          </div>
        </div>
      </div>

      <div className="p-4 max-w-xl mx-auto pb-10">
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-xl">
            ⚠️ {error}
          </div>
        )}

        <div className="bg-gray-100 rounded-xl p-3 mb-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-bold">{datos.descripcion}</p>
              <p className="text-sm text-gray-600">{datos.marca_modelo}</p>
            </div>

            <div className="text-right text-xs">
              <p><b>Serie:</b>{" "}{datos.numero_serie}</p>
              <p><b>Área:</b>{" "}{datos.area}</p>
              <p><b>Servicio:</b>{" "}{datos.servicio}</p>
            </div>
          </div>
        </div>

        {etapa === 0 && (
          <div className="bg-white rounded-xl shadow p-4">
            <h2 className="text-xl font-bold mb-2">1. Aceptación visual</h2>
            <div className="space-y-4">
              {[["limpieza_exterior", "Limpieza exterior"], ["estado_baterias", "Estado de baterías"], ["estado_cables", "Estado de cables"]].map(([campo, label]) => (
                <div key={campo}>
                  <label className="font-semibold block mb-1">{label}</label>
                  <select
                    value={inspecciones[campo]}
                    onChange={(e) => setInspecciones({ ...inspecciones, [campo]: e.target.value })}
                    className={`w-full border rounded-xl p-3 ${inspecciones[campo] === "CONFORME" ? "border-green-400 bg-green-50" : inspecciones[campo] === "NO CONFORME" ? "border-red-400 bg-red-50" : "bg-white"}`}
                  >
                    <option value="">Seleccionar</option>
                    <option value="CONFORME">CONFORME</option>
                    <option value="NO CONFORME">NO CONFORME</option>
                    <option value="NO APLICA">NO APLICA</option>
                  </select>
                </div>
              ))}

              <textarea
                value={inspecciones.observaciones}
                onChange={(e) => setInspecciones({ ...inspecciones, observaciones: e.target.value })}
                placeholder="Observaciones"
                className="w-full border rounded-xl p-3 min-h-20"
              />
            </div>
          </div>
        )}

        {escenario && med && (
          <div className="bg-white rounded-xl shadow p-4">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h2 className="text-xl font-bold">{escenario}</h2>
                <p className="text-sm text-gray-500">Medición {pos + 1} de {lista.length}</p>
              </div>
              <Estado conforme={med.conforme} noAplica={med.no_aplica} />
            </div>

            <div className={`border rounded-xl p-3 ${med.no_aplica ? "bg-gray-50" : med.conforme === true ? "bg-green-50 border-green-300" : med.conforme === false ? "bg-red-50 border-red-300" : "bg-white"}`}>
              <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                <div><span className="text-gray-500 text-xs">Parámetro</span><div className="font-bold">{med.parametro}</div></div>
                <div><span className="text-gray-500 text-xs">Nominal</span><div className="font-bold">{med.valor_nominal}</div></div>
                <div><span className="text-gray-500 text-xs">Aceptación</span><div>{med.rango_aceptacion}</div></div>
                <div><span className="text-gray-500 text-xs">Incertidumbre</span><div>{med.incertidumbre || "-"}</div></div>
              </div>

              {med.tipo === "onda" ? (
                <select
                  value={med.medicion}
                  disabled={med.no_aplica}
                  onChange={(e) => cambiarMedicion(med.indice, e.target.value)}
                  className="w-full border rounded-xl p-3 bg-white disabled:bg-gray-100"
                >
                  <option value="">Seleccionar resultado</option>
                  <option value="Normal">Normal</option>
                  <option value="Alterada">Alterada</option>
                </select>
              ) : (
                <input
                  value={med.medicion}
                  disabled={med.no_aplica}
                  onChange={(e) => cambiarMedicion(med.indice, e.target.value)}
                  placeholder={med.tipo.startsWith("presion") ? "Ej.: 120/80" : "Ingrese medición"}
                  className="w-full border rounded-xl p-3 bg-white disabled:bg-gray-100"
                />
              )}

              <label className="mt-3 flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" checked={med.no_aplica} onChange={(e) => cambiarNA(med.indice, e.target.checked)} />
                No aplica
              </label>
            </div>
          </div>
        )}

        {etapa === 4 && (
          <div className="bg-white rounded-xl shadow p-4 space-y-4">
            <h2 className="text-xl font-bold">Seguridad eléctrica · RIC 37</h2>
            <input
              type="number"
              value={datos.ric37_id}
              onChange={(e) => setDatos({ ...datos, ric37_id: e.target.value })}
              placeholder="ID RIC37"
              className="w-full border rounded-xl p-3"
            />
            <div className="bg-gray-50 border rounded-xl p-3 text-sm">
              <b>Verificador:</b> FLUKE PROSIM 8 · NS 2496025 · ETYC 27/01/2025 · Vigencia 27/01/2026
            </div>
          </div>
        )}

        {etapa === 5 && (
          <div className="bg-white rounded-xl shadow p-4 space-y-4">
            <h2 className="text-xl font-bold">Resumen</h2>
            <div className={`border rounded-xl p-3 ${resumen.resultado === "CONFORME" ? "bg-green-50 border-green-400" : resumen.resultado === "NO CONFORME" ? "bg-red-50 border-red-400" : "bg-gray-50"}`}>
              <div className={`font-bold ${resumen.resultado === "CONFORME" ? "text-green-700" : resumen.resultado === "NO CONFORME" ? "text-red-700" : "text-gray-600"}`}>{resumen.resultado}</div>
              <div className="text-xs mt-1">Conformes: <b>{resumen.conformes}</b> · No conformes: <b>{resumen.noConformes.length}</b> · No aplica: <b>{resumen.noAplica}</b></div>
            </div>

            {resumen.obsAuto && (
              <div className="bg-red-50 border border-red-300 rounded-xl p-3 text-sm text-red-800">
                <b>Observación automática:</b> {resumen.obsAuto}
              </div>
            )}

            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Observaciones adicionales"
              className="w-full border rounded-xl p-3 min-h-20"
            />

            <div className="flex flex-wrap gap-2">
              <button onClick={guardar} disabled={guardando || resumen.resultado === "PENDIENTE"} className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold disabled:opacity-40">{guardando ? "Guardando..." : "Guardar RIC39"}</button>
              <button onClick={abrirPDF} disabled={!ric39Id} className="px-4 py-2 bg-gray-700 text-white rounded-xl disabled:opacity-40">Ver PDF</button>
              <button onClick={enviarDrive} disabled={!ric39Id || enviandoDrive} className="px-4 py-2 bg-green-700 text-white rounded-xl disabled:opacity-40">{enviandoDrive ? "Enviando..." : "Enviar a Drive"}</button>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-4">
          <button onClick={anterior} className="px-4 py-2 bg-gray-200 rounded-xl font-semibold">← {etapa === 0 ? "Volver" : "Anterior"}</button>
          {etapa < 5 && (
            <button onClick={siguiente} className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold">Siguiente →</button>
          )}
        </div>
      </div>
    </div>
  );
}
