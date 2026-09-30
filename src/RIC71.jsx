import { useEffect, useMemo, useState } from "react";
import { API_URL } from "./config";
import {
  BotonesNavegacion,
  ModalEstadoFinal,
  ProtocoloLayout,
  TarjetaEtapa,
  fechaHoraLocalProtocolo,
  useProtocoloBase
} from "./protocolos/ProtocoloBase";
import RepuestosRIC from "./protocolos/RepuestosRIC";

const ETAPAS = ["Acciones preventivas", "Verificaciones", "Seguridad eléctrica", "Resumen"];
const claveBorrador = (id) => `preventivo:ric71:${id}`;

const ACCIONES = [
  "Inspección visual",
  "Limpieza exterior",
  "Limpieza interior"
];

const VERIFICACIONES_BASE = [
  { parametro: "Frecuencia cardiaca fetal", referencia: "110 LPM ± 10%", min: 99, max: 121, unidad: "LPM" },
  { parametro: "Frecuencia cardiaca fetal", referencia: "140 LPM ± 10%", min: 126, max: 154, unidad: "LPM" },
  { parametro: "Frecuencia cardiaca fetal", referencia: "180 LPM ± 10%", min: 162, max: 198, unidad: "LPM" },
  { parametro: "Alarmas", referencia: "130 - 190 LPM", min: 130, max: 190, unidad: "LPM" }
];

const SEGURIDAD_BASE = [
  { parametro: "Resistencia de protección a tierra", referencia: "≤ 0,3 Ω", max: 0.3, unidad: "Ω" },
  { parametro: "Corriente de fuga de equipo", referencia: "≤ 500 µA", max: 500, unidad: "µA" },
  { parametro: "Corriente de fuga reversa de equipo", referencia: "≤ 500 µA", max: 500, unidad: "µA" },
  { parametro: "Corriente de fuga de partes aplicables", referencia: "≤ 50 µA", max: 50, unidad: "µA" }
];

const crearAcciones = () => ACCIONES.map((nombre, i) => ({ orden: i + 1, nombre, estado: "", observaciones: "" }));
const crearVerificaciones = () => VERIFICACIONES_BASE.map((m, i) => ({ ...m, orden: i + 1, valor: "", estado: "", observaciones: "" }));
const crearSeguridad = () => SEGURIDAD_BASE.map((m, i) => ({ ...m, orden: i + 1, valor: "", estado: "", observaciones: "" }));
const numero = (v) => Number(String(v ?? "").replace(",", "."));

function SelectorEstado({ valor, onChange }) {
  return (
    <div className="grid grid-cols-3 gap-2 mt-3">
      {["CONFORME", "NO CONFORME", "NO APLICA"].map((estado) => (
        <button
          key={estado}
          type="button"
          onClick={() => onChange(estado)}
          className={`rounded-xl p-2 text-xs font-bold border ${
            valor === estado
              ? estado === "CONFORME"
                ? "bg-green-600 text-white border-green-600"
                : estado === "NO CONFORME"
                  ? "bg-red-600 text-white border-red-600"
                  : "bg-gray-600 text-white border-gray-600"
              : "bg-white text-gray-700 border-gray-300"
          }`}
        >
          {estado === "NO APLICA" ? "No aplica" : estado === "NO CONFORME" ? "No conforme" : "Conforme"}
        </button>
      ))}
    </div>
  );
}

export default function RIC71({ setVista, personal }) {
  const {
    datos, cargandoBase, errorBase, estados,
    mostrarEstadoFinal, setMostrarEstadoFinal,
    estadoFinal, setEstadoFinal, finalizando,
    cancelarPreventivo, finalizarMantenimiento
  } = useProtocoloBase({ codigo: "RIC71", personal, defaultDescripcion: "DETECTOR FETAL" });

  const [etapa, setEtapa] = useState(0);
  const [indiceAccion, setIndiceAccion] = useState(0);
  const [indiceVerificacion, setIndiceVerificacion] = useState(0);
  const [indiceSeguridad, setIndiceSeguridad] = useState(0);
  const [acciones, setAcciones] = useState(crearAcciones);
  const [verificaciones, setVerificaciones] = useState(crearVerificaciones);
  const [seguridad, setSeguridad] = useState(crearSeguridad);
  const [clase, setClase] = useState("");
  const [tipoProteccion, setTipoProteccion] = useState("");
  const [tension, setTension] = useState("");
  const [corriente, setCorriente] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [borradorCargado, setBorradorCargado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [enviandoDrive, setEnviandoDrive] = useState(false);
  const [ric71Id, setRic71Id] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!datos.ric01_id || borradorCargado) return;
    try {
      const raw = localStorage.getItem(claveBorrador(datos.ric01_id));
      if (raw) {
        const b = JSON.parse(raw);
        if (Number.isInteger(b.etapa)) setEtapa(Math.min(b.etapa, 3));
        if (Number.isInteger(b.indiceAccion)) setIndiceAccion(b.indiceAccion);
        if (Number.isInteger(b.indiceVerificacion)) setIndiceVerificacion(b.indiceVerificacion);
        if (Number.isInteger(b.indiceSeguridad)) setIndiceSeguridad(b.indiceSeguridad);
        if (Array.isArray(b.acciones)) setAcciones(b.acciones);
        if (Array.isArray(b.verificaciones)) setVerificaciones(b.verificaciones);
        if (Array.isArray(b.seguridad)) setSeguridad(b.seguridad);
        if (typeof b.clase === "string") setClase(b.clase);
        if (typeof b.tipoProteccion === "string") setTipoProteccion(b.tipoProteccion);
        if (typeof b.tension === "string") setTension(b.tension);
        if (typeof b.corriente === "string") setCorriente(b.corriente);
        if (typeof b.observaciones === "string") setObservaciones(b.observaciones);
      }
    } catch (e) {
      console.error("Error cargando borrador RIC71:", e);
    } finally {
      setBorradorCargado(true);
    }
  }, [datos.ric01_id, borradorCargado]);

  useEffect(() => {
    if (!borradorCargado || !datos.ric01_id || ric71Id) return;
    localStorage.setItem(claveBorrador(datos.ric01_id), JSON.stringify({
      etapa, indiceAccion, indiceVerificacion, indiceSeguridad,
      acciones, verificaciones, seguridad, clase, tipoProteccion,
      tension, corriente, observaciones
    }));
  }, [borradorCargado, datos.ric01_id, ric71Id, etapa, indiceAccion, indiceVerificacion, indiceSeguridad, acciones, verificaciones, seguridad, clase, tipoProteccion, tension, corriente, observaciones]);

  const accionActual = acciones[indiceAccion];
  const verificacionActual = verificaciones[indiceVerificacion];
  const seguridadActual = seguridad[indiceSeguridad];

  const resumen = useMemo(() => {
    const todos = [...acciones, ...verificaciones, ...seguridad];
    const pendientes = todos.filter((x) => !x.estado).length;
    const noConformes = todos.filter((x) => x.estado === "NO CONFORME");
    return {
      pendientes,
      noConformes,
      conformes: todos.filter((x) => x.estado === "CONFORME").length,
      noAplica: todos.filter((x) => x.estado === "NO APLICA").length,
      resultado: pendientes ? "PENDIENTE" : noConformes.length ? "NO CONFORME" : "CONFORME"
    };
  }, [acciones, verificaciones, seguridad]);

  const progreso = etapa === 0
    ? ((indiceAccion + 1) / acciones.length) * 20
    : etapa === 1
      ? 20 + ((indiceVerificacion + 1) / verificaciones.length) * 30
      : etapa === 2
        ? 50 + ((indiceSeguridad + 1) / seguridad.length) * 40
        : 100;

  const actualizarVerificacion = (valor) => {
    setVerificaciones((prev) => prev.map((m, i) => {
      if (i !== indiceVerificacion) return m;
      const n = numero(valor);
      const estado = String(valor).trim() && Number.isFinite(n)
        ? (n >= m.min && n <= m.max ? "CONFORME" : "NO CONFORME")
        : "";
      return { ...m, valor, estado };
    }));
  };

  const actualizarSeguridad = (valor) => {
    setSeguridad((prev) => prev.map((m, i) => {
      if (i !== indiceSeguridad) return m;
      const n = numero(valor);
      const estado = String(valor).trim() && Number.isFinite(n)
        ? (n <= m.max ? "CONFORME" : "NO CONFORME")
        : "";
      return { ...m, valor, estado };
    }));
  };

  const siguiente = () => {
    if (etapa === 0) {
      if (!accionActual.estado) return alert("Seleccione Conforme, No conforme o No aplica.");
      if (indiceAccion < acciones.length - 1) return setIndiceAccion((n) => n + 1);
      setEtapa(1);
      return;
    }

    if (etapa === 1) {
      if (!verificacionActual.estado) return alert("Ingrese el valor medido o seleccione No aplica.");
      if (verificacionActual.estado !== "NO APLICA" && !String(verificacionActual.valor).trim()) return alert("Ingrese el valor medido.");
      if (indiceVerificacion < verificaciones.length - 1) return setIndiceVerificacion((n) => n + 1);
      setEtapa(2);
      return;
    }

    if (etapa === 2) {
      if (!clase) return alert("Seleccione la clase del equipo.");
      if (!tipoProteccion) return alert("Seleccione el tipo de protección.");
      if (!seguridadActual.estado) return alert("Ingrese el valor medido o seleccione No aplica.");
      if (seguridadActual.estado !== "NO APLICA" && !String(seguridadActual.valor).trim()) return alert("Ingrese el valor medido.");
      if (indiceSeguridad < seguridad.length - 1) return setIndiceSeguridad((n) => n + 1);
      setEtapa(3);
    }
  };

  const volver = () => {
    if (etapa === 3) return setEtapa(2);
    if (etapa === 2) {
      if (indiceSeguridad > 0) return setIndiceSeguridad((n) => n - 1);
      setEtapa(1);
      setIndiceVerificacion(verificaciones.length - 1);
      return;
    }
    if (etapa === 1) {
      if (indiceVerificacion > 0) return setIndiceVerificacion((n) => n - 1);
      setEtapa(0);
      setIndiceAccion(acciones.length - 1);
      return;
    }
    if (indiceAccion > 0) return setIndiceAccion((n) => n - 1);
    setVista("equipos");
  };

  const cancelar = () => cancelarPreventivo({
    setVista,
    borrarBorrador: () => datos.ric01_id && localStorage.removeItem(claveBorrador(datos.ric01_id))
  });

  const guardar = async () => {
    if (resumen.pendientes) return alert("Complete todas las verificaciones antes de guardar RIC71.");
    if (!clase || !tipoProteccion) return alert("Complete la clasificación de seguridad eléctrica.");
    if (ric71Id || guardando) return;

    try {
      setGuardando(true);
      setError("");
      const res = await fetch(API_URL.Ric71, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...datos,
          fecha: fechaHoraLocalProtocolo(),
          resultado_general: resumen.resultado,
          observaciones,
          acciones,
          verificaciones,
          seguridad,
          clase,
          tipo_proteccion: tipoProteccion,
          tension,
          corriente,
          instrumento_seguridad: "Analizador de seguridad eléctrica FLUKE ESA 612",
          instrumento_seguridad_serie: "2500032"
        })
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "No se pudo guardar RIC71");
      setRic71Id(body.ric71_id);
      localStorage.removeItem(claveBorrador(datos.ric01_id));
      setMostrarEstadoFinal(true);
    } catch (e) {
      setError(e.message || "Error guardando RIC71");
    } finally {
      setGuardando(false);
    }
  };

  const abrirPDF = () => ric71Id
    ? window.open(`${API_URL.Ric71}/${ric71Id}/pdf`, "_blank")
    : alert("Primero debe guardar RIC71.");

  const enviarDrive = async () => {
    if (!ric71Id) return alert("Primero debe guardar RIC71.");
    try {
      setEnviandoDrive(true);
      const res = await fetch(`${API_URL.Ric71}/${ric71Id}/drive`, { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "No se pudo enviar a Drive");
      alert("✅ RIC71 enviado correctamente a Google Drive");
    } catch (e) {
      alert(e.message || "Error enviando RIC71 a Drive");
    } finally {
      setEnviandoDrive(false);
    }
  };

  if (cargandoBase || !borradorCargado) return <div className="p-6 text-center">⏳ Cargando datos del equipo...</div>;

  return (
    <>
      <ProtocoloLayout codigo="RIC71" tituloCorto="MP Detector Fetal" etapas={ETAPAS} etapa={etapa} progreso={progreso} datos={datos} error={error || errorBase}>
        {etapa === 0 && (
          <TarjetaEtapa titulo="1. Acciones preventivas" ayuda="Realice cada acción preventiva y registre su conformidad.">
            <div className="bg-gray-100 rounded-xl p-3 text-center mb-4">
              <p className="text-sm text-gray-500">Punto {indiceAccion + 1} de {acciones.length}</p>
              <p className="font-bold text-lg mt-1">{accionActual.nombre}</p>
            </div>
            <SelectorEstado valor={accionActual.estado} onChange={(estado) => setAcciones((p) => p.map((x, i) => i === indiceAccion ? { ...x, estado } : x))} />
            <textarea value={accionActual.observaciones} onChange={(e) => setAcciones((p) => p.map((x, i) => i === indiceAccion ? { ...x, observaciones: e.target.value } : x))} placeholder="Observaciones del punto" className="w-full border rounded-xl p-3 mt-4" rows={3} />
            <BotonesNavegacion onVolver={volver} onCancelar={cancelar} onContinuar={siguiente} continuarDisabled={!accionActual.estado} continuarTexto={indiceAccion === acciones.length - 1 ? "Verificaciones →" : "Aceptar →"} />
          </TarjetaEtapa>
        )}

        {etapa === 1 && (
          <TarjetaEtapa titulo="2. Verificaciones funcionales" ayuda="Ingrese el valor medido. La aceptación se calcula automáticamente según la referencia de la planilla.">
            <div className="bg-gray-100 rounded-xl p-3 mb-4 text-center">
              <p className="text-sm text-gray-500">Verificación {indiceVerificacion + 1} de {verificaciones.length}</p>
              <p className="font-bold text-lg">{verificacionActual.parametro}</p>
              <p className="text-sm mt-2"><b>Referencia:</b> {verificacionActual.referencia}</p>
            </div>
            <label className="font-semibold block mb-2">Valor medido ({verificacionActual.unidad})</label>
            <input value={verificacionActual.valor} disabled={verificacionActual.estado === "NO APLICA"} onChange={(e) => actualizarVerificacion(e.target.value)} inputMode="decimal" className="w-full border rounded-xl p-3 disabled:bg-gray-100" placeholder="Ingrese valor medido" />
            {verificacionActual.estado && verificacionActual.estado !== "NO APLICA" && (
              <div className={`rounded-xl p-3 mt-3 font-bold text-center ${verificacionActual.estado === "CONFORME" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{verificacionActual.estado}</div>
            )}
            <button type="button" onClick={() => setVerificaciones((p) => p.map((x, i) => i === indiceVerificacion ? { ...x, estado: "NO APLICA", valor: "" } : x))} className={`w-full border rounded-xl p-3 mt-3 font-semibold ${verificacionActual.estado === "NO APLICA" ? "bg-gray-600 text-white" : "bg-white text-gray-700"}`}>No aplica</button>
            <textarea value={verificacionActual.observaciones} onChange={(e) => setVerificaciones((p) => p.map((x, i) => i === indiceVerificacion ? { ...x, observaciones: e.target.value } : x))} placeholder="Observaciones de la verificación" className="w-full border rounded-xl p-3 mt-4" rows={3} />
            <BotonesNavegacion onVolver={volver} onCancelar={cancelar} onContinuar={siguiente} continuarDisabled={!verificacionActual.estado} continuarTexto={indiceVerificacion === verificaciones.length - 1 ? "Seguridad eléctrica →" : "Aceptar →"} />
          </TarjetaEtapa>
        )}

        {etapa === 2 && (
          <TarjetaEtapa titulo="3. Ensayo de seguridad eléctrica - RIC37" ayuda="Instrumento patrón: Analizador de seguridad eléctrica FLUKE ESA 612 · NS 2500032.">
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="font-semibold block mb-2">Clase</label>
                <select value={clase} onChange={(e) => setClase(e.target.value)} className="w-full border rounded-xl p-3">
                  <option value="">Seleccionar</option><option value="I">I</option><option value="II">II</option><option value="III">III</option>
                </select>
              </div>
              <div>
                <label className="font-semibold block mb-2">Tipo de protección</label>
                <select value={tipoProteccion} onChange={(e) => setTipoProteccion(e.target.value)} className="w-full border rounded-xl p-3">
                  <option value="">Seleccionar</option><option value="B">B</option><option value="BF">BF</option><option value="CF">CF</option>
                </select>
              </div>
              <div><label className="font-semibold block mb-2">Tensión (V)</label><input value={tension} onChange={(e) => setTension(e.target.value)} inputMode="decimal" className="w-full border rounded-xl p-3" /></div>
              <div><label className="font-semibold block mb-2">Corriente (A)</label><input value={corriente} onChange={(e) => setCorriente(e.target.value)} inputMode="decimal" className="w-full border rounded-xl p-3" /></div>
            </div>

            <div className="bg-gray-100 rounded-xl p-3 mb-4 text-center">
              <p className="text-sm text-gray-500">Determinación {indiceSeguridad + 1} de {seguridad.length}</p>
              <p className="font-bold text-lg">{seguridadActual.parametro}</p>
              <p className="text-sm mt-2"><b>Rango de aceptación:</b> {seguridadActual.referencia}</p>
            </div>
            <label className="font-semibold block mb-2">Valor medido ({seguridadActual.unidad})</label>
            <input value={seguridadActual.valor} disabled={seguridadActual.estado === "NO APLICA"} onChange={(e) => actualizarSeguridad(e.target.value)} inputMode="decimal" className="w-full border rounded-xl p-3 disabled:bg-gray-100" />
            {seguridadActual.estado && seguridadActual.estado !== "NO APLICA" && (
              <div className={`rounded-xl p-3 mt-3 font-bold text-center ${seguridadActual.estado === "CONFORME" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{seguridadActual.estado}</div>
            )}
            <button type="button" onClick={() => setSeguridad((p) => p.map((x, i) => i === indiceSeguridad ? { ...x, estado: "NO APLICA", valor: "" } : x))} className={`w-full border rounded-xl p-3 mt-3 font-semibold ${seguridadActual.estado === "NO APLICA" ? "bg-gray-600 text-white" : "bg-white text-gray-700"}`}>No aplica</button>
            <textarea value={seguridadActual.observaciones} onChange={(e) => setSeguridad((p) => p.map((x, i) => i === indiceSeguridad ? { ...x, observaciones: e.target.value } : x))} placeholder="Observaciones de la determinación" className="w-full border rounded-xl p-3 mt-4" rows={3} />
            <BotonesNavegacion onVolver={volver} onCancelar={cancelar} onContinuar={siguiente} continuarDisabled={!clase || !tipoProteccion || !seguridadActual.estado} continuarTexto={indiceSeguridad === seguridad.length - 1 ? "Ver resumen →" : "Aceptar →"} />
          </TarjetaEtapa>
        )}

        {etapa === 3 && (
          <TarjetaEtapa titulo="4. Resumen del mantenimiento">
            {resumen.noConformes.length === 0 ? (
              <div className="bg-green-100 text-green-800 rounded-xl p-4 mb-5"><p className="font-bold text-lg">✅ MANTENIMIENTO CONFORME</p><p className="text-sm mt-1">Todos los puntos verificados se encuentran conformes o fueron indicados como no aplicables.</p></div>
            ) : (
              <div className="bg-red-100 text-red-800 rounded-xl p-4 mb-5"><p className="font-bold text-lg mb-3">❌ MANTENIMIENTO NO CONFORME</p><div className="space-y-2">{resumen.noConformes.map((x, i) => <div key={`${x.parametro || x.nombre}-${i}`} className="bg-white rounded-lg p-3"><p className="font-bold">{x.parametro || x.nombre}</p>{x.referencia && <p className="text-sm"><b>Referencia:</b> {x.referencia}</p>}{x.valor && <p className="text-sm"><b>Medido:</b> {x.valor} {x.unidad || ""}</p>}</div>)}</div></div>
            )}

            <div className="grid grid-cols-3 gap-2 mb-5 text-center">
              <div className="bg-green-50 border border-green-200 rounded-xl p-3"><p className="text-xs text-gray-500">Conformes</p><p className="text-xl font-bold text-green-700">{resumen.conformes}</p></div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-3"><p className="text-xs text-gray-500">No conformes</p><p className="text-xl font-bold text-red-700">{resumen.noConformes.length}</p></div>
              <div className="bg-gray-100 border rounded-xl p-3"><p className="text-xs text-gray-500">No aplica</p><p className="text-xl font-bold text-gray-700">{resumen.noAplica}</p></div>
            </div>

            <label className="font-semibold block mb-2">Observaciones generales</label>
            <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} rows={5} className="w-full border rounded-xl p-3" placeholder="Observaciones del mantenimiento" />

            <BotonesNavegacion onVolver={volver} onCancelar={cancelar} />
            {!ric71Id && <RepuestosRIC personal={personal} />}
            <button onClick={guardar} disabled={guardando || Boolean(ric71Id)} className="w-full bg-green-600 disabled:bg-gray-400 text-white rounded-xl p-3 mt-3 font-bold">{guardando ? "Guardando..." : ric71Id ? "✅ Preventivo guardado" : "💾 Guardar preventivo"}</button>

            {ric71Id && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                <button onClick={abrirPDF} className="bg-blue-600 text-white rounded-xl p-3 font-bold">📄 Ver / Descargar PDF</button>
                <button onClick={() => setVista("equipos")} className="bg-gray-600 text-white rounded-xl p-3 font-bold">🚪 Salir</button>
                <button onClick={enviarDrive} disabled={enviandoDrive} className="md:col-span-2 bg-blue-600 disabled:bg-gray-400 text-white rounded-xl p-3 font-bold">{enviandoDrive ? "☁️ Enviando..." : "☁️ Enviar a Google Drive"}</button>
              </div>
            )}
          </TarjetaEtapa>
        )}
      </ProtocoloLayout>

      <ModalEstadoFinal abierto={mostrarEstadoFinal} estados={estados} estadoFinal={estadoFinal} setEstadoFinal={setEstadoFinal} finalizando={finalizando} onCerrar={() => setMostrarEstadoFinal(false)} onConfirmar={finalizarMantenimiento} />
    </>
  );
}
