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

const ETAPAS = ["Mantenimiento", "Estado operativo", "Resumen"];
const claveBorrador = (id) => `preventivo:ric10:${id}`;

const CHECKS = [
  "1-A Limpieza exterior y desincrustación de lancetas",
  "1-B Limpieza sistema hidráulico",
  "1-C Limpieza base interior",
  "2 Lubricar O-rings con pasta de silicona",
  "3-A Filtro de entrada de agua",
  "3-B Filtro ácido",
  "3-C Filtro bicarbonato",
  "3-D Filtro de líquido dializante",
  "3-E Filtro de bomba de UF",
  "3-F Filtro lavado de la lanceta de concentrado",
  "3-G Filtro lavado de la lanceta de bicarbonato",
  "3-H Revisión de restrictores de flujo",
  "3-I Filtro de desgasificación",
  "4 Verificar estado de válvula 84, cambiar si es necesario",
  "6 Verificar tensiones de la fuente (5V, 12V, 24V, 20V)",
  "8 Verificar tensión del detector de fuga de sangre (5V)",
  "13 Verificar volúmenes de bomba de concentrado y bicarbonato",
  "14 Verificar test"
];

const MEDICIONES = [
  { parametro: "5-A Entrada de agua", referencia: "1 Bar aprox.", tipo: "manual", unidad: "Bar" },
  { parametro: "5-B Presión de carga", referencia: "1,4 Bar aprox.", tipo: "manual", unidad: "Bar" },
  { parametro: "5-C Presión bomba de desgasificación", referencia: "0,8 Bar aprox.", tipo: "manual", unidad: "Bar" },
  { parametro: "5-D Presión bomba de flujo", referencia: "2,2 Bar aprox.", tipo: "manual", unidad: "Bar" },
  { parametro: "7-A Flujo 300", referencia: "Dig 59-64", tipo: "rango", min: 59, max: 64, unidad: "Dig" },
  { parametro: "7-B Flujo 500", referencia: "Dig 79-86", tipo: "rango", min: 79, max: 86, unidad: "Dig" },
  { parametro: "7-C Flujo 800", referencia: "Dig 118-228", tipo: "rango", min: 118, max: 228, unidad: "Dig" },
  { parametro: "9 Temperatura", referencia: "37 °C ± 0,5 °C", tipo: "rango", min: 36.5, max: 37.5, unidad: "°C" },
  { parametro: "10 Flujo de bomba de sangre", referencia: "600 ml/min ± 30", tipo: "rango", min: 570, max: 630, unidad: "ml/min" },
  { parametro: "11 Volumen UF", referencia: "60 ml ± 1 ml", tipo: "rango", min: 59, max: 61, unidad: "ml" },
  { parametro: "12 Conductividad", referencia: "13,8 mS ± 0,2", tipo: "rango", min: 13.6, max: 14.0, unidad: "mS" }
];

const crearChecks = () => CHECKS.map((nombre, i) => ({ orden: i + 1, nombre, estado: "", observaciones: "" }));
const crearMediciones = () => MEDICIONES.map((m, i) => ({ ...m, orden: i + 1, valor: "", estado: "", observaciones: "" }));
const numero = (v) => Number(String(v ?? "").replace(",", "."));

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
              ? estado === "CONFORME" ? "bg-green-600 text-white border-green-600"
              : estado === "NO CONFORME" ? "bg-red-600 text-white border-red-600"
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

export default function RIC10({ setVista, personal }) {
  const {
    datos, cargandoBase, errorBase, estados,
    mostrarEstadoFinal, setMostrarEstadoFinal,
    estadoFinal, setEstadoFinal, finalizando,
    cancelarPreventivo, finalizarMantenimiento
  } = useProtocoloBase({ codigo: "RIC10", personal, defaultDescripcion: "MAQUINA DE HEMODIALISIS" });

  const [etapa, setEtapa] = useState(0);
  const [indiceCheck, setIndiceCheck] = useState(0);
  const [indiceMed, setIndiceMed] = useState(0);
  const [checks, setChecks] = useState(crearChecks);
  const [mediciones, setMediciones] = useState(crearMediciones);
  const [observaciones, setObservaciones] = useState("");
  const [borradorCargado, setBorradorCargado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [enviandoDrive, setEnviandoDrive] = useState(false);
  const [ric10Id, setRic10Id] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!datos.ric01_id || borradorCargado) return;
    try {
      const raw = localStorage.getItem(claveBorrador(datos.ric01_id));
      if (raw) {
        const b = JSON.parse(raw);
        if (Number.isInteger(b.etapa)) setEtapa(Math.min(b.etapa, 2));
        if (Number.isInteger(b.indiceCheck)) setIndiceCheck(b.indiceCheck);
        if (Number.isInteger(b.indiceMed)) setIndiceMed(b.indiceMed);
        if (Array.isArray(b.checks)) setChecks(b.checks);
        if (Array.isArray(b.mediciones)) setMediciones(b.mediciones);
        if (typeof b.observaciones === "string") setObservaciones(b.observaciones);
      }
    } catch (e) {
      console.error("Error cargando borrador RIC10:", e);
    } finally {
      setBorradorCargado(true);
    }
  }, [datos.ric01_id, borradorCargado]);

  useEffect(() => {
    if (!borradorCargado || !datos.ric01_id || ric10Id) return;
    localStorage.setItem(claveBorrador(datos.ric01_id), JSON.stringify({ etapa, indiceCheck, indiceMed, checks, mediciones, observaciones }));
  }, [borradorCargado, datos.ric01_id, ric10Id, etapa, indiceCheck, indiceMed, checks, mediciones, observaciones]);

  const checkActual = checks[indiceCheck];
  const medActual = mediciones[indiceMed];

  const resumen = useMemo(() => {
    const todos = [...checks, ...mediciones];
    const pendientes = todos.filter((x) => !x.estado).length;
    const noConformes = todos.filter((x) => x.estado === "NO CONFORME");
    const conformes = todos.filter((x) => x.estado === "CONFORME").length;
    const noAplica = todos.filter((x) => x.estado === "NO APLICA").length;
    return {
      pendientes, noConformes, conformes, noAplica,
      resultado: pendientes ? "PENDIENTE" : noConformes.length ? "NO CONFORME" : "CONFORME"
    };
  }, [checks, mediciones]);

  const progreso = etapa === 0
    ? ((indiceCheck + 1) / checks.length) * 45
    : etapa === 1
      ? 45 + ((indiceMed + 1) / mediciones.length) * 45
      : 100;

  const actualizarMedicion = (valor) => {
    setMediciones((prev) => prev.map((m, i) => {
      if (i !== indiceMed) return m;
      if (m.tipo === "manual") return { ...m, valor };
      const n = numero(valor);
      const estado = String(valor).trim() && Number.isFinite(n)
        ? (n >= m.min && n <= m.max ? "CONFORME" : "NO CONFORME")
        : "";
      return { ...m, valor, estado };
    }));
  };

  const siguiente = () => {
    if (etapa === 0) {
      if (!checkActual.estado) return alert("Seleccione Conforme, No conforme o No aplica.");
      if (indiceCheck < checks.length - 1) return setIndiceCheck((n) => n + 1);
      setEtapa(1);
      return;
    }

    if (etapa === 1) {
      if (!medActual.estado) return alert("Complete la medición y su conformidad antes de continuar.");
      if (medActual.estado !== "NO APLICA" && !String(medActual.valor).trim()) return alert("Ingrese el valor medido.");
      if (indiceMed < mediciones.length - 1) return setIndiceMed((n) => n + 1);
      setEtapa(2);
    }
  };

  const volver = () => {
    if (etapa === 2) return setEtapa(1);
    if (etapa === 1) {
      if (indiceMed > 0) return setIndiceMed((n) => n - 1);
      setEtapa(0);
      setIndiceCheck(checks.length - 1);
      return;
    }
    if (indiceCheck > 0) return setIndiceCheck((n) => n - 1);
    setVista("equipos");
  };

  const cancelar = () => cancelarPreventivo({
    setVista,
    borrarBorrador: () => datos.ric01_id && localStorage.removeItem(claveBorrador(datos.ric01_id))
  });

  const guardar = async () => {
    if (resumen.pendientes) return alert("Complete todas las verificaciones antes de guardar RIC10.");
    if (ric10Id) return;
    try {
      setGuardando(true);
      setError("");
      const res = await fetch(API_URL.Ric10, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...datos,
          fecha: fechaHoraLocalProtocolo(),
          resultado_general: resumen.resultado,
          observaciones,
          verificador_equipo: "MULTIMETRO FLUKE 87V",
          verificador_numero_serie: "14020306",
          verificador_certificado: "CEMEC 54126/25",
          verificador_vigencia: "2026-10-07",
          verificaciones: checks,
          mediciones
        })
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "No se pudo guardar RIC10");
      setRic10Id(body.ric10_id);
      localStorage.removeItem(claveBorrador(datos.ric01_id));
      setMostrarEstadoFinal(true);
    } catch (e) {
      setError(e.message || "Error guardando RIC10");
    } finally {
      setGuardando(false);
    }
  };

  const abrirPDF = () => ric10Id
    ? window.open(`${API_URL.Ric10}/${ric10Id}/pdf`, "_blank")
    : alert("Primero debe guardar RIC10.");

  const enviarDrive = async () => {
    if (!ric10Id) return alert("Primero debe guardar RIC10.");
    try {
      setEnviandoDrive(true);
      const res = await fetch(`${API_URL.Ric10}/${ric10Id}/drive`, { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "No se pudo enviar a Drive");
      alert("✅ RIC10 enviado correctamente a Google Drive");
    } catch (e) {
      alert(e.message || "Error enviando RIC10 a Drive");
    } finally {
      setEnviandoDrive(false);
    }
  };

  if (cargandoBase || !borradorCargado) return <div className="p-6 text-center">⏳ Cargando datos del equipo...</div>;

  return (
    <>
      <ProtocoloLayout codigo="RIC10" tituloCorto="MP Máquina de Hemodiálisis" etapas={ETAPAS} etapa={etapa} progreso={progreso} datos={datos} error={error || errorBase}>
        {etapa === 0 && (
          <TarjetaEtapa titulo="1. Mantenimiento preventivo" ayuda="Realice cada intervención y registre su conformidad antes de continuar.">
            <div className="bg-gray-100 rounded-xl p-3 text-center mb-4">
              <p className="text-sm text-gray-500">Punto {indiceCheck + 1} de {checks.length}</p>
              <p className="font-bold text-lg mt-1">{checkActual.nombre}</p>
            </div>
            <SelectorEstado valor={checkActual.estado} onChange={(estado) => setChecks((p) => p.map((x, i) => i === indiceCheck ? { ...x, estado } : x))} />
            <textarea
              value={checkActual.observaciones}
              onChange={(e) => setChecks((p) => p.map((x, i) => i === indiceCheck ? { ...x, observaciones: e.target.value } : x))}
              placeholder="Observaciones del punto"
              className="w-full border rounded-xl p-3 mt-4"
              rows={3}
            />
            <BotonesNavegacion onVolver={volver} onCancelar={cancelar} onContinuar={siguiente} continuarDisabled={!checkActual.estado} continuarTexto={indiceCheck === checks.length - 1 ? "Estado operativo →" : "Aceptar →"} />
          </TarjetaEtapa>
        )}

        {etapa === 1 && (
          <TarjetaEtapa titulo="2. Verificar estado operativo" ayuda="Registre el valor medido. Los parámetros con tolerancia definida se evalúan automáticamente.">
            <div className="bg-gray-100 rounded-xl p-3 mb-4">
              <p className="text-sm text-gray-500">Medición {indiceMed + 1} de {mediciones.length}</p>
              <p className="font-bold text-lg">{medActual.parametro}</p>
              <p className="text-sm mt-2"><b>Referencia:</b> {medActual.referencia}</p>
            </div>

            <label className="font-semibold block mb-2">Valor medido {medActual.unidad ? `(${medActual.unidad})` : ""}</label>
            <input
              value={medActual.valor}
              disabled={medActual.estado === "NO APLICA"}
              onChange={(e) => actualizarMedicion(e.target.value)}
              inputMode="decimal"
              className="w-full border rounded-xl p-3 disabled:bg-gray-100"
              placeholder="Ingrese valor medido"
            />

            {medActual.tipo === "rango" && medActual.estado && medActual.estado !== "NO APLICA" && (
              <div className={`rounded-xl p-3 mt-3 font-bold text-center ${medActual.estado === "CONFORME" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                {medActual.estado}
              </div>
            )}

            {medActual.tipo === "manual" && (
              <SelectorEstado valor={medActual.estado} onChange={(estado) => setMediciones((p) => p.map((x, i) => i === indiceMed ? { ...x, estado } : x))} />
            )}

            {medActual.tipo === "rango" && (
              <button
                type="button"
                onClick={() => setMediciones((p) => p.map((x, i) => i === indiceMed ? { ...x, estado: "NO APLICA", valor: "" } : x))}
                className={`w-full border rounded-xl p-3 mt-3 font-semibold ${medActual.estado === "NO APLICA" ? "bg-gray-600 text-white" : "bg-white text-gray-700"}`}
              >
                No aplica
              </button>
            )}

            <textarea
              value={medActual.observaciones}
              onChange={(e) => setMediciones((p) => p.map((x, i) => i === indiceMed ? { ...x, observaciones: e.target.value } : x))}
              placeholder="Observaciones de la medición"
              className="w-full border rounded-xl p-3 mt-4"
              rows={3}
            />

            <BotonesNavegacion onVolver={volver} onCancelar={cancelar} onContinuar={siguiente} continuarDisabled={!medActual.estado} continuarTexto={indiceMed === mediciones.length - 1 ? "Ver resumen →" : "Aceptar →"} />
          </TarjetaEtapa>
        )}

        {etapa === 2 && (
          <TarjetaEtapa titulo="3. Resumen del mantenimiento">
            {resumen.noConformes.length === 0 ? (
              <div className="bg-green-100 text-green-800 rounded-xl p-4 mb-5">
                <p className="font-bold text-lg">✅ MANTENIMIENTO CONFORME</p>
                <p className="text-sm mt-1">Todas las verificaciones realizadas se encuentran conformes o fueron indicadas como no aplicables.</p>
              </div>
            ) : (
              <div className="bg-red-100 text-red-800 rounded-xl p-4 mb-5">
                <p className="font-bold text-lg mb-3">❌ MANTENIMIENTO NO CONFORME</p>
                <div className="space-y-2">
                  {resumen.noConformes.map((x, i) => (
                    <div key={`${x.parametro || x.nombre}-${i}`} className="bg-white rounded-lg p-3">
                      <p className="font-bold">{x.parametro || x.nombre}</p>
                      {x.referencia && <p className="text-sm"><b>Referencia:</b> {x.referencia}</p>}
                      {x.valor && <p className="text-sm"><b>Medido:</b> {x.valor} {x.unidad || ""}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 mb-5 text-center">
              <div className="bg-green-50 border border-green-200 rounded-xl p-3"><p className="text-xs text-gray-500">Conformes</p><p className="text-xl font-bold text-green-700">{resumen.conformes}</p></div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-3"><p className="text-xs text-gray-500">No conformes</p><p className="text-xl font-bold text-red-700">{resumen.noConformes.length}</p></div>
              <div className="bg-gray-100 border rounded-xl p-3"><p className="text-xs text-gray-500">No aplica</p><p className="text-xl font-bold text-gray-700">{resumen.noAplica}</p></div>
            </div>

            <label className="font-semibold block mb-2">Observaciones generales</label>
            <textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} rows={5} className="w-full border rounded-xl p-3" placeholder="Observaciones del mantenimiento" />

            <BotonesNavegacion onVolver={volver} onCancelar={cancelar} />
            {!ric10Id && <RepuestosRIC personal={personal} />}

            <button onClick={guardar} disabled={guardando || Boolean(ric10Id)} className="w-full bg-green-600 disabled:bg-gray-400 text-white rounded-xl p-3 mt-3 font-bold">
              {guardando ? "Guardando..." : ric10Id ? "✅ Preventivo guardado" : "💾 Guardar preventivo"}
            </button>

            {ric10Id && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                <button onClick={abrirPDF} className="bg-blue-600 text-white rounded-xl p-3 font-bold">📄 Ver / Descargar PDF</button>
                <button onClick={() => setVista("equipos")} className="bg-gray-600 text-white rounded-xl p-3 font-bold">🚪 Salir</button>
                <button onClick={enviarDrive} disabled={enviandoDrive} className="md:col-span-2 bg-blue-600 disabled:bg-gray-400 text-white rounded-xl p-3 font-bold">
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
