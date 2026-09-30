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

const ETAPAS = ["Acciones preventivas", "Verificaciones", "Resumen"];
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

const crearAcciones = () => ACCIONES.map((nombre, i) => ({
  orden: i + 1,
  nombre,
  estado: "",
  observaciones: ""
}));

const crearVerificaciones = () => VERIFICACIONES_BASE.map((item, i) => ({
  ...item,
  orden: i + 1,
  valor: "",
  estado: "",
  observaciones: ""
}));

const numero = (valor) => Number(String(valor ?? "").replace(",", "."));

function SelectorEstado({ valor, onChange }) {
  return (
    <div className="grid grid-cols-3 gap-2 mt-3">
      {["CONFORME", "NO CONFORME", "NO APLICA"].map((estado) => (
        <button
          type="button"
          key={estado}
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
    datos,
    cargandoBase,
    errorBase,
    estados,
    mostrarEstadoFinal,
    setMostrarEstadoFinal,
    estadoFinal,
    setEstadoFinal,
    finalizando,
    cancelarPreventivo,
    finalizarMantenimiento
  } = useProtocoloBase({
    codigo: "RIC71",
    personal,
    defaultDescripcion: "DETECTOR FETAL"
  });

  const [etapa, setEtapa] = useState(0);
  const [indiceAccion, setIndiceAccion] = useState(0);
  const [indiceVerificacion, setIndiceVerificacion] = useState(0);
  const [acciones, setAcciones] = useState(crearAcciones);
  const [verificaciones, setVerificaciones] = useState(crearVerificaciones);
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
        const borrador = JSON.parse(raw);
        if (Number.isInteger(borrador.etapa)) setEtapa(Math.min(borrador.etapa, 2));
        if (Number.isInteger(borrador.indiceAccion)) setIndiceAccion(borrador.indiceAccion);
        if (Number.isInteger(borrador.indiceVerificacion)) setIndiceVerificacion(borrador.indiceVerificacion);
        if (Array.isArray(borrador.acciones)) setAcciones(borrador.acciones);
        if (Array.isArray(borrador.verificaciones)) setVerificaciones(borrador.verificaciones);
        if (typeof borrador.observaciones === "string") setObservaciones(borrador.observaciones);
      }
    } catch (err) {
      console.error("Error cargando borrador RIC71:", err);
    } finally {
      setBorradorCargado(true);
    }
  }, [datos.ric01_id, borradorCargado]);

  useEffect(() => {
    if (!borradorCargado || !datos.ric01_id || ric71Id) return;

    localStorage.setItem(
      claveBorrador(datos.ric01_id),
      JSON.stringify({
        etapa,
        indiceAccion,
        indiceVerificacion,
        acciones,
        verificaciones,
        observaciones
      })
    );
  }, [
    borradorCargado,
    datos.ric01_id,
    ric71Id,
    etapa,
    indiceAccion,
    indiceVerificacion,
    acciones,
    verificaciones,
    observaciones
  ]);

  const accionActual = acciones[indiceAccion];
  const verificacionActual = verificaciones[indiceVerificacion];

  const resumen = useMemo(() => {
    const todos = [...acciones, ...verificaciones];
    const pendientes = todos.filter((item) => !item.estado).length;
    const noConformes = todos.filter((item) => item.estado === "NO CONFORME");
    const conformes = todos.filter((item) => item.estado === "CONFORME").length;
    const noAplica = todos.filter((item) => item.estado === "NO APLICA").length;

    return {
      pendientes,
      noConformes,
      conformes,
      noAplica,
      resultado: pendientes ? "PENDIENTE" : noConformes.length ? "NO CONFORME" : "CONFORME"
    };
  }, [acciones, verificaciones]);

  const progreso = etapa === 0
    ? ((indiceAccion + 1) / acciones.length) * 40
    : etapa === 1
      ? 40 + ((indiceVerificacion + 1) / verificaciones.length) * 50
      : 100;

  const actualizarVerificacion = (valor) => {
    setVerificaciones((prev) => prev.map((item, i) => {
      if (i !== indiceVerificacion) return item;
      const valorNumerico = numero(valor);
      const estado = String(valor).trim() && Number.isFinite(valorNumerico)
        ? valorNumerico >= item.min && valorNumerico <= item.max
          ? "CONFORME"
          : "NO CONFORME"
        : "";
      return { ...item, valor, estado };
    }));
  };

  const marcarNoAplicaVerificacion = () => {
    setVerificaciones((prev) => prev.map((item, i) =>
      i === indiceVerificacion
        ? { ...item, valor: "", estado: "NO APLICA" }
        : item
    ));
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
      if (verificacionActual.estado !== "NO APLICA" && !String(verificacionActual.valor).trim()) {
        return alert("Ingrese el valor medido.");
      }
      if (indiceVerificacion < verificaciones.length - 1) return setIndiceVerificacion((n) => n + 1);
      setEtapa(2);
    }
  };

  const volver = () => {
    if (etapa === 2) return setEtapa(1);

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
    if (resumen.pendientes) {
      return alert("Complete todas las acciones y verificaciones antes de guardar RIC71.");
    }
    if (ric71Id || guardando) return;

    try {
      setGuardando(true);
      setError("");

      const respuesta = await fetch(API_URL.Ric71, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...datos,
          fecha: fechaHoraLocalProtocolo(),
          resultado_general: resumen.resultado,
          observaciones,
          acciones,
          verificaciones
        })
      });

      const body = await respuesta.json();
      if (!respuesta.ok) throw new Error(body.error || "No se pudo guardar RIC71");

      setRic71Id(body.ric71_id);
      localStorage.removeItem(claveBorrador(datos.ric01_id));
      setMostrarEstadoFinal(true);
    } catch (err) {
      console.error("Error guardando RIC71:", err);
      setError(err.message || "Error guardando RIC71");
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
      const respuesta = await fetch(`${API_URL.Ric71}/${ric71Id}/drive`, { method: "POST" });
      const body = await respuesta.json();
      if (!respuesta.ok) throw new Error(body.error || "No se pudo enviar a Drive");
      alert("✅ RIC71 enviado correctamente a Google Drive");
    } catch (err) {
      alert(err.message || "Error enviando RIC71 a Drive");
    } finally {
      setEnviandoDrive(false);
    }
  };

  if (cargandoBase || !borradorCargado) {
    return <div className="p-6 text-center">⏳ Cargando datos del equipo...</div>;
  }

  return (
    <>
      <ProtocoloLayout
        codigo="RIC71"
        tituloCorto="MP Detector Fetal"
        etapas={ETAPAS}
        etapa={etapa}
        progreso={progreso}
        datos={datos}
        error={error || errorBase}
      >
        {etapa === 0 && (
          <TarjetaEtapa titulo="1. Acciones preventivas" ayuda="Realice cada acción preventiva y registre su conformidad antes de continuar.">
            <div className="bg-gray-100 rounded-xl p-3 text-center mb-4">
              <p className="text-sm text-gray-500">Acción {indiceAccion + 1} de {acciones.length}</p>
              <p className="font-bold text-lg mt-1">{accionActual.nombre}</p>
            </div>

            <SelectorEstado
              valor={accionActual.estado}
              onChange={(estado) => setAcciones((prev) => prev.map((item, i) =>
                i === indiceAccion ? { ...item, estado } : item
              ))}
            />

            <textarea
              value={accionActual.observaciones}
              onChange={(e) => setAcciones((prev) => prev.map((item, i) =>
                i === indiceAccion ? { ...item, observaciones: e.target.value } : item
              ))}
              placeholder="Observaciones de la acción"
              className="w-full border rounded-xl p-3 mt-4"
              rows={3}
            />

            <BotonesNavegacion
              onVolver={volver}
              onCancelar={cancelar}
              onContinuar={siguiente}
              continuarDisabled={!accionActual.estado}
              continuarTexto={indiceAccion === acciones.length - 1 ? "Verificaciones →" : "Aceptar →"}
            />
          </TarjetaEtapa>
        )}

        {etapa === 1 && (
          <TarjetaEtapa
            titulo="2. Verificaciones"
            ayuda="Ingrese el valor medido. La aceptación se evalúa automáticamente según el rango indicado en RIC71."
          >
            <div className="bg-gray-100 rounded-xl p-3 mb-4">
              <p className="text-sm text-gray-500">Verificación {indiceVerificacion + 1} de {verificaciones.length}</p>
              <p className="font-bold text-lg">{verificacionActual.parametro}</p>
              <p className="text-sm mt-2"><b>Referencia:</b> {verificacionActual.referencia}</p>
            </div>

            <label className="font-semibold block mb-2">Valor medido ({verificacionActual.unidad})</label>
            <input
              value={verificacionActual.valor}
              disabled={verificacionActual.estado === "NO APLICA"}
              onChange={(e) => actualizarVerificacion(e.target.value)}
              inputMode="decimal"
              className="w-full border rounded-xl p-3 disabled:bg-gray-100"
              placeholder="Ingrese valor medido"
            />

            {verificacionActual.estado && verificacionActual.estado !== "NO APLICA" && (
              <div className={`rounded-xl p-3 mt-3 font-bold text-center ${
                verificacionActual.estado === "CONFORME"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}>
                {verificacionActual.estado}
              </div>
            )}

            <button
              type="button"
              onClick={marcarNoAplicaVerificacion}
              className={`w-full border rounded-xl p-3 mt-3 font-semibold ${
                verificacionActual.estado === "NO APLICA"
                  ? "bg-gray-600 text-white"
                  : "bg-white text-gray-700"
              }`}
            >
              No aplica
            </button>

            <textarea
              value={verificacionActual.observaciones}
              onChange={(e) => setVerificaciones((prev) => prev.map((item, i) =>
                i === indiceVerificacion ? { ...item, observaciones: e.target.value } : item
              ))}
              placeholder="Observaciones de la verificación"
              className="w-full border rounded-xl p-3 mt-4"
              rows={3}
            />

            <BotonesNavegacion
              onVolver={volver}
              onCancelar={cancelar}
              onContinuar={siguiente}
              continuarDisabled={!verificacionActual.estado}
              continuarTexto={indiceVerificacion === verificaciones.length - 1 ? "Ver resumen →" : "Aceptar →"}
            />
          </TarjetaEtapa>
        )}

        {etapa === 2 && (
          <TarjetaEtapa titulo="3. Resumen del mantenimiento">
            {resumen.noConformes.length === 0 ? (
              <div className="bg-green-100 text-green-800 rounded-xl p-4 mb-5">
                <p className="font-bold text-lg">✅ MANTENIMIENTO CONFORME</p>
                <p className="text-sm mt-1">Todas las acciones y verificaciones realizadas se encuentran conformes o fueron indicadas como no aplicables.</p>
              </div>
            ) : (
              <div className="bg-red-100 text-red-800 rounded-xl p-4 mb-5">
                <p className="font-bold text-lg mb-3">❌ MANTENIMIENTO NO CONFORME</p>
                <div className="space-y-2">
                  {resumen.noConformes.map((item, i) => (
                    <div key={`${item.parametro || item.nombre}-${i}`} className="bg-white rounded-lg p-3">
                      <p className="font-bold">{item.parametro || item.nombre}</p>
                      {item.referencia && <p className="text-sm"><b>Referencia:</b> {item.referencia}</p>}
                      {item.valor && <p className="text-sm"><b>Medido:</b> {item.valor} {item.unidad || ""}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 mb-5 text-center">
              <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                <p className="text-xs text-gray-500">Conformes</p>
                <p className="text-xl font-bold text-green-700">{resumen.conformes}</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-xs text-gray-500">No conformes</p>
                <p className="text-xl font-bold text-red-700">{resumen.noConformes.length}</p>
              </div>
              <div className="bg-gray-100 border rounded-xl p-3">
                <p className="text-xs text-gray-500">No aplica</p>
                <p className="text-xl font-bold text-gray-700">{resumen.noAplica}</p>
              </div>
            </div>

            <label className="font-semibold block mb-2">Observaciones generales</label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={5}
              className="w-full border rounded-xl p-3"
              placeholder="Observaciones del mantenimiento"
            />

            <BotonesNavegacion onVolver={volver} onCancelar={cancelar} />

            {!ric71Id && <RepuestosRIC personal={personal} />}

            <button
              onClick={guardar}
              disabled={guardando || Boolean(ric71Id)}
              className="w-full bg-green-600 disabled:bg-gray-400 text-white rounded-xl p-3 mt-3 font-bold"
            >
              {guardando ? "Guardando..." : ric71Id ? "✅ Preventivo guardado" : "💾 Guardar preventivo"}
            </button>

            {ric71Id && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                <button onClick={abrirPDF} className="bg-blue-600 text-white rounded-xl p-3 font-bold">📄 Ver / Descargar PDF</button>
                <button onClick={() => setVista("equipos")} className="bg-gray-600 text-white rounded-xl p-3 font-bold">🚪 Salir</button>
                <button
                  onClick={enviarDrive}
                  disabled={enviandoDrive}
                  className="md:col-span-2 bg-blue-600 disabled:bg-gray-400 text-white rounded-xl p-3 font-bold"
                >
                  {enviandoDrive ? "☁️ Enviando..." : "☁️ Enviar a Google Drive"}
                </button>
              </div>
            )}
          </TarjetaEtapa>
        )}
      </ProtocoloLayout>

      <ModalEstadoFinal
        abierto={mostrarEstadoFinal}
        estados={estados}
        estadoFinal={estadoFinal}
        setEstadoFinal={setEstadoFinal}
        finalizando={finalizando}
        onCerrar={() => setMostrarEstadoFinal(false)}
        onConfirmar={finalizarMantenimiento}
      />
    </>
  );
}
