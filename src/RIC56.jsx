import { useEffect, useMemo, useState } from "react";
import { API_URL } from "./config";
import {
  BotonesNavegacion,
  ModalEstadoFinal,
  ProtocoloLayout,
  ResumenMantenimiento,
  TarjetaEtapa,
  fechaHoraLocalProtocolo,
  useProtocoloBase
} from "./protocolos/ProtocoloBase";

const CODIGO = "RIC56";
const ETAPAS = ["Verificación", "Resumen"];
const claveBorrador = (ric01Id) => `preventivo:ric56:${ric01Id}`;

const PUNTOS = [
  "Inspección visual",
  "Limpieza mesa",
  "Limpieza mural",
  "Inspección de comando",
  "Estado de frenos",
  "Chasis a tierra",
  "Tensión de alimentación",
  "Colimado mecánico",
  "Colimado luz",
  "Disparo remoto",
  "Movimiento de ruedas y brazo",
  "Calibración flat panel",
  "Funcionamiento general"
];

const crearPuntos = () => PUNTOS.map((nombre, i) => ({
  orden: i + 1,
  nombre,
  estado: "",
  observaciones: ""
}));

function BotonEstado({ activo, tipo, onClick }) {
  const clases = tipo === "CONFORME"
    ? activo
      ? "bg-green-600 text-white border-green-600"
      : "bg-white text-green-700 border-green-300 hover:bg-green-50"
    : tipo === "NO CONFORME"
      ? activo
        ? "bg-red-600 text-white border-red-600"
        : "bg-white text-red-700 border-red-300 hover:bg-red-50"
      : activo
        ? "bg-gray-600 text-white border-gray-600"
        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50";

  return (
    <button type="button" onClick={onClick} className={`flex-1 border rounded-xl p-3 font-semibold transition ${clases}`}>
      {tipo === "NO APLICA" ? "No aplica" : tipo === "NO CONFORME" ? "No conforme" : "Conforme"}
    </button>
  );
}

export default function RIC56({ setVista, personal }) {
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
    codigo: CODIGO,
    personal,
    defaultDescripcion: "EQUIPO DE RX MÓVIL"
  });

  const [etapa, setEtapa] = useState(0);
  const [indiceActual, setIndiceActual] = useState(0);
  const [puntos, setPuntos] = useState(crearPuntos);
  const [enUso, setEnUso] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [borradorCargado, setBorradorCargado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [enviandoDrive, setEnviandoDrive] = useState(false);
  const [ric56Id, setRic56Id] = useState(null);
  const [errorLocal, setErrorLocal] = useState("");

  useEffect(() => {
    if (!datos.ric01_id || borradorCargado) return;

    try {
      const raw = localStorage.getItem(claveBorrador(datos.ric01_id));
      if (raw) {
        const b = JSON.parse(raw);
        if (Array.isArray(b.puntos)) setPuntos(b.puntos);
        if (typeof b.enUso === "string") setEnUso(b.enUso);
        if (typeof b.observaciones === "string") setObservaciones(b.observaciones);
        if (Number.isInteger(b.indiceActual)) setIndiceActual(b.indiceActual);
        if (Number.isInteger(b.etapa)) setEtapa(Math.min(b.etapa, ETAPAS.length - 1));
      }
    } catch (err) {
      console.error("Error cargando borrador RIC56:", err);
    } finally {
      setBorradorCargado(true);
    }
  }, [datos.ric01_id, borradorCargado]);

  useEffect(() => {
    if (!borradorCargado || !datos.ric01_id || ric56Id) return;
    localStorage.setItem(
      claveBorrador(datos.ric01_id),
      JSON.stringify({ etapa, indiceActual, puntos, enUso, observaciones })
    );
  }, [borradorCargado, datos.ric01_id, ric56Id, etapa, indiceActual, puntos, enUso, observaciones]);

  const resumen = useMemo(() => {
    const pendientes = puntos.filter((p) => !p.estado).length;
    const noConformes = puntos.filter((p) => p.estado === "NO CONFORME");
    const conformes = puntos.filter((p) => p.estado === "CONFORME").length;
    const noAplica = puntos.filter((p) => p.estado === "NO APLICA").length;
    const resultado = pendientes ? "PENDIENTE" : noConformes.length ? "NO CONFORME" : "CONFORME";
    return { pendientes, noConformes, conformes, noAplica, resultado };
  }, [puntos]);

  const puntoActual = puntos[indiceActual];
  const progreso = etapa === 1 ? 100 : ((indiceActual + 1) / puntos.length) * 100;

  const borrarBorrador = () => {
    if (datos.ric01_id) localStorage.removeItem(claveBorrador(datos.ric01_id));
  };

  const cancelar = () => cancelarPreventivo({ setVista, borrarBorrador });

  const volver = () => {
    if (etapa === 1) return setEtapa(0);
    if (indiceActual > 0) return setIndiceActual((prev) => prev - 1);
    setVista("equipos");
  };

  const siguiente = () => {
    if (!puntoActual?.estado) return alert("Seleccione Conforme, No conforme o No aplica antes de continuar.");
    if (indiceActual < puntos.length - 1) return setIndiceActual((prev) => prev + 1);
    if (!enUso) return alert("Indique si el equipo se encuentra en uso.");
    setEtapa(1);
  };

  const guardar = async () => {
    if (resumen.pendientes) return alert("Complete todos los puntos de verificación.");
    if (!enUso) return alert("Indique si el equipo se encuentra en uso.");
    if (ric56Id) return;

    setGuardando(true);
    setErrorLocal("");

    try {
      const res = await fetch(API_URL.Ric56, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...datos,
          fecha: fechaHoraLocalProtocolo(),
          en_uso: enUso === "SI",
          resultado_general: resumen.resultado,
          observaciones,
          verificaciones: puntos
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo guardar RIC56");

      setRic56Id(data.ric56_id);
      borrarBorrador();
      alert("Mantenimiento preventivo guardado correctamente ✅");
      setMostrarEstadoFinal(true);
    } catch (err) {
      setErrorLocal(err.message || "Error guardando RIC56");
    } finally {
      setGuardando(false);
    }
  };

  const abrirPDF = () => {
    if (!ric56Id) return alert("Primero debe guardar el mantenimiento.");
    window.open(`${API_URL.Ric56}/${ric56Id}/pdf`, "_blank");
  };

  const enviarDrive = async () => {
    if (!ric56Id) return alert("Primero debe guardar el mantenimiento.");
    setEnviandoDrive(true);

    try {
      const res = await fetch(`${API_URL.Ric56}/${ric56Id}/drive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo enviar a Drive");

      alert(
        data?.carpeta?.nombre
          ? `✅ PDF enviado a Google Drive\n\nCarpeta: ${data.carpeta.nombre}`
          : "✅ PDF enviado a Google Drive"
      );
    } catch (err) {
      alert(err.message || "Error enviando RIC56 a Drive");
    } finally {
      setEnviandoDrive(false);
    }
  };

  if (cargandoBase || !borradorCargado) {
    return <div className="p-6 text-center"><p className="text-lg">⏳ Cargando datos del equipo...</p></div>;
  }

  if (errorBase && !datos.numero_serie) {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <div className="bg-red-100 text-red-700 p-4 rounded-xl">⚠️ {errorBase}</div>
        <button onClick={() => setVista("equipos")} className="w-full bg-gray-500 text-white rounded-xl p-3 mt-4">← Volver</button>
      </div>
    );
  }

  return (
    <>
      <ProtocoloLayout
        codigo={CODIGO}
        tituloCorto="MP Equipo RX Móvil"
        etapas={ETAPAS}
        etapa={etapa}
        progreso={progreso}
        datos={datos}
        error={errorLocal || errorBase}
      >
        {etapa === 0 && (
          <TarjetaEtapa
            titulo="1. Verificación funcional"
            ayuda="Verifique cada punto del equipo y seleccione Conforme, No conforme o No aplica según corresponda."
          >
            <div className="bg-gray-100 rounded-xl p-3 mb-4 text-center">
              <p className="text-sm text-gray-500">Punto de verificación</p>
              <p className="text-2xl font-bold">{indiceActual + 1} / {puntos.length}</p>
              <p className="text-xl font-bold mt-1">{puntoActual.nombre}</p>
            </div>

            <div className="flex gap-2">
              <BotonEstado tipo="CONFORME" activo={puntoActual.estado === "CONFORME"} onClick={() => setPuntos((prev) => prev.map((p, i) => i === indiceActual ? { ...p, estado: "CONFORME" } : p))} />
              <BotonEstado tipo="NO CONFORME" activo={puntoActual.estado === "NO CONFORME"} onClick={() => setPuntos((prev) => prev.map((p, i) => i === indiceActual ? { ...p, estado: "NO CONFORME" } : p))} />
              <BotonEstado tipo="NO APLICA" activo={puntoActual.estado === "NO APLICA"} onClick={() => setPuntos((prev) => prev.map((p, i) => i === indiceActual ? { ...p, estado: "NO APLICA" } : p))} />
            </div>

            <div className="mt-5">
              <label className="font-semibold block mb-2">Observaciones</label>
              <textarea
                rows={4}
                value={puntoActual.observaciones || ""}
                onChange={(e) => setPuntos((prev) => prev.map((p, i) => i === indiceActual ? { ...p, observaciones: e.target.value } : p))}
                placeholder="Ingrese observaciones de la verificación..."
                className="w-full border rounded-xl p-3"
              />
            </div>

            {indiceActual === puntos.length - 1 && (
              <div className="mt-5">
                <label className="font-semibold block mb-2">Equipo en uso</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setEnUso("SI")} className={`flex-1 rounded-xl p-3 border font-semibold ${enUso === "SI" ? "bg-blue-600 text-white border-blue-600" : "bg-white"}`}>Sí</button>
                  <button type="button" onClick={() => setEnUso("NO")} className={`flex-1 rounded-xl p-3 border font-semibold ${enUso === "NO" ? "bg-blue-600 text-white border-blue-600" : "bg-white"}`}>No</button>
                </div>
              </div>
            )}

            <BotonesNavegacion
              onVolver={volver}
              onCancelar={cancelar}
              onContinuar={siguiente}
              continuarDisabled={!puntoActual.estado}
              continuarTexto={indiceActual === puntos.length - 1 ? "Ver resumen →" : "Aceptar →"}
            />
          </TarjetaEtapa>
        )}

        {etapa === 1 && (
          <ResumenMantenimiento
            noConformes={resumen.noConformes}
            mensajeConforme="Todos los puntos verificados se encuentran conformes o fueron indicados como no aplicables."
            renderNoConforme={(item) => (
              <>
                <p className="font-bold">Verificación funcional</p>
                <p><b>Punto:</b> {item.nombre}</p>
                <p><b>Resultado:</b> No conforme</p>
                {item.observaciones?.trim() && <p className="mt-1"><b>Observaciones:</b> {item.observaciones}</p>}
              </>
            )}
            contadores={{
              conformes: resumen.conformes,
              noConformes: resumen.noConformes.length,
              noAplica: resumen.noAplica
            }}
            observaciones={observaciones}
            setObservaciones={setObservaciones}
            onVolver={volver}
            onCancelar={cancelar}
            onGuardar={guardar}
            guardando={guardando}
            guardado={Boolean(ric56Id)}
            onPDF={abrirPDF}
            onSalir={() => setVista("equipos")}
            onDrive={enviarDrive}
            enviandoDrive={enviandoDrive}
          />
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
