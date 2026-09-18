import { useEffect, useMemo, useState } from "react";
import { API_URL } from "./config";

const ESCENARIOS = [
  {
    nombre: "NORMAL",
    filas: [
      ["Forma de onda", "Normal", "Reprod. de onda", ""],
      ["Frecuencia ECG", "60 BPM", "58 - 62 BPM", "± 0,6 BPM"],
      ["Frecuencia resp.", "20 RPM", "19 - 21 RPM", ""],
      ["Temperatura", "37 °C", "36,5 - 37,5 °C", "± 0,4 °C"],
      ["IBP 1", "120/80 mmHg", "± 5%", ""],
      ["IBP 2", "28/15 mmHg", "± 5%", ""],
      ["PNI", "120/80 mmHg", "108-132/72-88 mmHg", "± 1,1 / ± 0,9 mmHg"],
      ["SpO²", "97%", "95% - 99%", "Nellcor 1% / BCI 3%"]
    ]
  },
  {
    nombre: "HIPERTENSO",
    filas: [
      ["Forma de onda", "Normal", "Reprod. de onda", ""],
      ["Frecuencia ECG", "130 BPM", "128 - 132 BPM", "± 1,3 BPM"],
      ["Frecuencia resp.", "40 RPM", "39 - 41 RPM", ""],
      ["Temperatura", "37 °C", "36,5 - 37,5 °C", "± 0,4 °C"],
      ["IBP 1", "120/80 mmHg", "± 5%", ""],
      ["IBP 2", "28/15 mmHg", "± 5%", ""],
      ["PNI", "210/150 mmHg", "189-231/135-165 mmHg", "± 1,5 / ± 1,25 mmHg"],
      ["SpO²", "93%", "92% - 96%", "Nellcor 1% / BCI 3%"]
    ]
  },
  {
    nombre: "BRADICARDIA",
    filas: [
      ["Forma de onda", "Normal", "Reprod. de onda", ""],
      ["Frecuencia ECG", "30 BPM", "28 - 32 BPM", "± 0,3 BPM"],
      ["Frecuencia resp.", "15 RPM", "14 - 16 RPM", ""],
      ["Temperatura", "37 °C", "36,5 - 37,5 °C", "± 0,4 °C"],
      ["IBP 1", "120/80 mmHg", "± 5%", ""],
      ["IBP 2", "28/15 mmHg", "± 5%", ""],
      ["PNI", "100/65 mmHg", "90-110/58,5-71,5 mmHg", "± 1 / ± 0,825 mmHg"],
      ["SpO²", "85%", "83% - 87%", "Nellcor 1% / BCI 3%"]
    ]
  }
];

const crearMediciones = () =>
  ESCENARIOS.flatMap((escenario) =>
    escenario.filas.map((fila, index) => ({
      escenario: escenario.nombre,
      orden: index + 1,
      parametro: fila[0],
      valor_nominal: fila[1],
      medicion: "",
      rango_aceptacion: fila[2],
      incertidumbre: fila[3],
      conforme: null,
      no_aplica: false,
      observaciones: ""
    }))
  );

const hoyLocal = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

function Campo({ label, ...props }) {
  return (
    <label className="text-sm block">
      <span className="font-semibold block mb-1">{label}</span>
      <input {...props} className="w-full border rounded-lg px-3 py-2 bg-white" />
    </label>
  );
}

export default function RIC39({ setVista, personal }) {
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
    limpieza_exterior: "",
    estado_baterias: "",
    estado_cables: "",
    aceptacion_visual: "",
    observaciones: ""
  });
  const [mediciones, setMediciones] = useState(crearMediciones);
  const [observaciones, setObservaciones] = useState("");
  const [resultadoGeneral, setResultadoGeneral] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [enviandoDrive, setEnviandoDrive] = useState(false);
  const [error, setError] = useState("");
  const [ric39Id, setRic39Id] = useState(null);

  useEffect(() => {
    const cargar = async () => {
      try {
        const raw = localStorage.getItem("tareaActiva");
        if (!raw) throw new Error("No hay una tarea activa.");
        const tarea = JSON.parse(raw);
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
    cargar();
  }, [personal]);

  const resumen = useMemo(() => {
    const evaluadas = mediciones.filter((m) => !m.no_aplica && m.conforme !== null);
    return {
      evaluadas: evaluadas.length,
      noConformes: evaluadas.filter((m) => m.conforme === false).length
    };
  }, [mediciones]);

  const actualizarMedicion = (indice, campo, valor) => {
    setMediciones((prev) => prev.map((m, i) => (i === indice ? { ...m, [campo]: valor } : m)));
  };

  const cambiarValoracion = (indice, valor) => {
    setMediciones((prev) =>
      prev.map((m, i) => {
        if (i !== indice) return m;
        if (valor === "NA") return { ...m, conforme: null, no_aplica: true };
        if (valor === "C") return { ...m, conforme: true, no_aplica: false };
        if (valor === "NC") return { ...m, conforme: false, no_aplica: false };
        return { ...m, conforme: null, no_aplica: false };
      })
    );
  };

  const valoracionActual = (m) => {
    if (m.no_aplica) return "NA";
    if (m.conforme === true) return "C";
    if (m.conforme === false) return "NC";
    return "";
  };

  const guardar = async () => {
    if (!datos.numero_serie) return alert("Falta el número de serie.");
    if (!resultadoGeneral) return alert("Seleccione el resultado general.");

    try {
      setGuardando(true);
      setError("");
      const res = await fetch(API_URL.Ric39, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...datos,
          resultado_general: resultadoGeneral,
          observaciones,
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
      if (body.archivo?.webViewLink) window.open(body.archivo.webViewLink, "_blank");
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setEnviandoDrive(false);
    }
  };

  if (cargando) return <div className="p-6">Cargando RIC39...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-3 md:p-6">
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
          <div>
            <h1 className="text-2xl font-bold">RIC 39</h1>
            <p className="text-gray-600">Verificación de monitor multiparamétrico</p>
          </div>
          <button onClick={() => setVista("equipos")} className="px-4 py-2 rounded-xl bg-gray-600 text-white font-semibold">← Volver</button>
        </div>

        {error && <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-300 text-red-700">{error}</div>}

        <section className="border rounded-xl p-4 mb-5">
          <h2 className="font-bold mb-3">Datos del equipo</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <Campo label="Equipo" value={datos.descripcion} readOnly />
            <Campo label="Marca / Modelo" value={datos.marca_modelo} readOnly />
            <Campo label="Nº de Serie" value={datos.numero_serie} readOnly />
            <Campo label="Área" value={datos.area} readOnly />
            <Campo label="Servicio" value={datos.servicio} readOnly />
            <Campo label="Subservicio" value={datos.sub_servicio} readOnly />
            <Campo label="Encargado" value={datos.encargado} readOnly />
            <Campo label="Técnico" value={datos.tecnico} readOnly />
            <Campo label="Fecha" type="date" value={datos.fecha} onChange={(e) => setDatos({ ...datos, fecha: e.target.value })} />
          </div>
        </section>

        <section className="border rounded-xl p-4 mb-5">
          <h2 className="font-bold mb-3">Equipo verificador</h2>
          <div className="text-sm bg-gray-50 rounded-xl p-3">ANALIZADOR DE MONITORES FLUKE PROSIM 8 · NS 2496025 · ETYC 27/01/2025 · VIGENCIA 27/01/2026</div>
        </section>

        <section className="border rounded-xl p-4 mb-5">
          <h2 className="font-bold mb-3">Inspecciones previas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              ["aceptacion_visual", "Aceptación según inspección visual"],
              ["limpieza_exterior", "Limpieza exterior"],
              ["estado_baterias", "Estado de baterías"],
              ["estado_cables", "Estado de cables"]
            ].map(([campo, label]) => (
              <label key={campo} className="text-sm">
                <span className="font-semibold block mb-1">{label}</span>
                <select value={inspecciones[campo]} onChange={(e) => setInspecciones({ ...inspecciones, [campo]: e.target.value })} className="w-full border rounded-lg px-3 py-2">
                  <option value="">Seleccionar</option>
                  <option value="CONFORME">CONFORME</option>
                  <option value="NO CONFORME">NO CONFORME</option>
                  <option value="NO APLICA">NO APLICA</option>
                </select>
              </label>
            ))}
          </div>
          <textarea value={inspecciones.observaciones} onChange={(e) => setInspecciones({ ...inspecciones, observaciones: e.target.value })} placeholder="Observaciones de inspección" className="mt-3 w-full border rounded-lg px-3 py-2 min-h-20" />
        </section>

        {ESCENARIOS.map((escenario) => {
          const indices = mediciones.map((m, i) => (m.escenario === escenario.nombre ? i : -1)).filter((i) => i >= 0);
          return (
            <section key={escenario.nombre} className="border rounded-xl p-3 md:p-4 mb-5">
              <h2 className="font-bold mb-3">{escenario.nombre}</h2>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] border-collapse text-sm">
                  <thead><tr className="bg-gray-100"><th className="border p-2 text-left">Parámetro</th><th className="border p-2">Valor nominal</th><th className="border p-2">Medición</th><th className="border p-2">Rango de aceptación</th><th className="border p-2">Incertidumbre</th><th className="border p-2">Valoración</th></tr></thead>
                  <tbody>
                    {indices.map((indice) => {
                      const m = mediciones[indice];
                      return (
                        <tr key={`${m.escenario}-${m.orden}`}>
                          <td className="border p-2 font-semibold">{m.parametro}</td>
                          <td className="border p-2 text-center">{m.valor_nominal}</td>
                          <td className="border p-1"><input value={m.medicion} onChange={(e) => actualizarMedicion(indice, "medicion", e.target.value)} className="w-full px-2 py-2 border rounded" placeholder="Resultado" /></td>
                          <td className="border p-2 text-center">{m.rango_aceptacion}</td>
                          <td className="border p-2 text-center">{m.incertidumbre || "-"}</td>
                          <td className="border p-1"><select value={valoracionActual(m)} onChange={(e) => cambiarValoracion(indice, e.target.value)} className="w-full px-2 py-2 border rounded"><option value="">Seleccionar</option><option value="C">CONFORME</option><option value="NC">NO CONFORME</option><option value="NA">NO APLICA</option></select></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}

        <section className="border rounded-xl p-4 mb-5">
          <h2 className="font-bold mb-3">Ensayo de seguridad eléctrica - RIC 37</h2>
          <p className="text-sm text-gray-600 mb-3">Si el ensayo RIC37 ya fue realizado, puede asociarse su ID a este protocolo.</p>
          <Campo label="ID RIC37" type="number" value={datos.ric37_id} onChange={(e) => setDatos({ ...datos, ric37_id: e.target.value })} />
        </section>

        <section className="border rounded-xl p-4 mb-5">
          <h2 className="font-bold mb-3">Resultado general</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <select value={resultadoGeneral} onChange={(e) => setResultadoGeneral(e.target.value)} className="border rounded-lg px-3 py-2"><option value="">Seleccionar resultado</option><option value="CONFORME">CONFORME</option><option value="NO CONFORME">NO CONFORME</option></select>
            <div className="text-sm bg-gray-50 rounded-lg p-3">Mediciones evaluadas: <b>{resumen.evaluadas}</b> · No conformes: <b>{resumen.noConformes}</b></div>
          </div>
          <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Observaciones generales" className="w-full border rounded-lg px-3 py-2 min-h-24" />
        </section>

        <div className="flex flex-wrap gap-2 justify-end">
          <button onClick={guardar} disabled={guardando} className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold disabled:opacity-50">{guardando ? "Guardando..." : "Guardar RIC39"}</button>
          <button onClick={abrirPDF} disabled={!ric39Id} className="px-4 py-2 rounded-xl bg-slate-700 text-white font-semibold disabled:opacity-40">Ver PDF</button>
          <button onClick={enviarDrive} disabled={!ric39Id || enviandoDrive} className="px-4 py-2 rounded-xl bg-green-700 text-white font-semibold disabled:opacity-40">{enviandoDrive ? "Enviando..." : "Enviar a Drive"}</button>
        </div>
      </div>
    </div>
  );
}
