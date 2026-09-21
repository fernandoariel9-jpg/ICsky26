import { useEffect, useMemo, useState } from "react";
import { API_URL } from "./config";

const ETAPAS = [
  "Inspecciones",
  "Frecuencia",
  "Amplitud",
  "Grupo de onda",
  "Artefactos",
  "Forma de onda",
  "Segmento ST",
  "Seguridad eléctrica",
  "Resumen"
];

const INSTRUCCION_GENERICA =
  "Procedimiento: configure el simulador según el valor nominal indicado, realice la verificación y registre el resultado obtenido.";

const claveBorrador = (ric01Id) => `preventivo:ric48:${ric01Id}`;

const crearFrecuencias = () => [
  { nombre: "60 BPM", nominal: 60, incertidumbre: "± 1%", min: 54, max: 66, resultado: "", conforme: null, noAplica: false },
  { nombre: "80 BPM", nominal: 80, incertidumbre: "± 1%", min: 72, max: 88, resultado: "", conforme: null, noAplica: false },
  { nombre: "120 BPM", nominal: 120, incertidumbre: "± 1%", min: 108, max: 132, resultado: "", conforme: null, noAplica: false }
];

const crearAmplitudes = () => [
  { nombre: "0,5 mV", nominal: 0.5, incertidumbre: "± 2% +0,05 mV", min: 0.494, max: 0.506, resultado: "", conforme: null, noAplica: false },
  { nombre: "1 mV", nominal: 1, incertidumbre: "± 2% +0,05 mV", min: 0.93, max: 1.07, resultado: "", conforme: null, noAplica: false },
  { nombre: "2 mV", nominal: 2, incertidumbre: "± 2% +0,05 mV", min: 1.91, max: 2.09, resultado: "", conforme: null, noAplica: false }
];

const crearManual = (items) =>
  items.map((nombre) => ({ nombre, resultado: "", conforme: null, noAplica: false }));

function Estado({ conforme, noAplica }) {
  if (noAplica) {
    return <span className="px-2 py-1 rounded-lg bg-gray-200 text-gray-700 text-xs font-bold">NO APLICA</span>;
  }
  if (conforme === true) {
    return <span className="px-2 py-1 rounded-lg bg-green-100 text-green-700 text-xs font-bold">CONFORME</span>;
  }
  if (conforme === false) {
    return <span className="px-2 py-1 rounded-lg bg-red-100 text-red-700 text-xs font-bold">NO CONFORME</span>;
  }
  return <span className="px-2 py-1 rounded-lg bg-gray-100 text-gray-500 text-xs font-bold">PENDIENTE</span>;
}

const evaluarNumero = (valor, min, max) => {
  if (String(valor).trim() === "") return null;
  const numero = Number(String(valor).replace(",", "."));
  if (!Number.isFinite(numero)) return null;
  return numero >= min && numero <= max;
};

export default function RIC48({ setVista, personal }) {
  const [etapa, setEtapa] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [borradorCargado, setBorradorCargado] = useState(false);
  const [error, setError] = useState("");

  const [datos, setDatos] = useState({
    ric01_id: "",
    equipo_id: "",
    numero_serie: "",
    descripcion: "",
    marca_modelo: "",
    area: "",
    servicio: "",
    sub_servicio: "",
    encargado: "",
    tecnico: personal?.nombre || "",
    ric37_id: ""
  });

  const [inspecciones, setInspecciones] = useState({
    limpieza_exterior: "",
    papel_registro: "",
    estado_cables: "",
    observaciones: ""
  });

  const [frecuencias, setFrecuencias] = useState(crearFrecuencias);
  const [frecuenciaActual, setFrecuenciaActual] = useState(0);
  const [amplitudes, setAmplitudes] = useState(crearAmplitudes);
  const [amplitudActual, setAmplitudActual] = useState(0);
  const [gruposOnda, setGruposOnda] = useState(() => crearManual(["Cuadrada", "Triangular", "Senoidal"]));
  const [grupoActual, setGrupoActual] = useState(0);
  const [artefactos, setArtefactos] = useState(() => crearManual(["50 Hz (línea)", "Ruido de EMG"]));
  const [artefactoActual, setArtefactoActual] = useState(0);
  const [formasOnda, setFormasOnda] = useState(() => crearManual(["Normal", "Fibrilación auricular", "Aleteo auricular", "Fibrilación ventricular"]));
  const [formaActual, setFormaActual] = useState(0);
  const [segmentoST, setSegmentoST] = useState(() => crearManual(["+0,5 mV", "-0,5 mV"]));
  const [stActual, setStActual] = useState(0);
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
          descripcion: equipo?.descripcion || tarea.descripcion || "ELECTROCARDIÓGRAFO",
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
            if (borrador.inspecciones) setInspecciones(borrador.inspecciones);
            if (Array.isArray(borrador.frecuencias)) setFrecuencias(borrador.frecuencias);
            if (Number.isInteger(borrador.frecuenciaActual)) setFrecuenciaActual(borrador.frecuenciaActual);
            if (Array.isArray(borrador.amplitudes)) setAmplitudes(borrador.amplitudes);
            if (Number.isInteger(borrador.amplitudActual)) setAmplitudActual(borrador.amplitudActual);
            if (Array.isArray(borrador.gruposOnda)) setGruposOnda(borrador.gruposOnda);
            if (Number.isInteger(borrador.grupoActual)) setGrupoActual(borrador.grupoActual);
            if (Array.isArray(borrador.artefactos)) setArtefactos(borrador.artefactos);
            if (Number.isInteger(borrador.artefactoActual)) setArtefactoActual(borrador.artefactoActual);
            if (Array.isArray(borrador.formasOnda)) setFormasOnda(borrador.formasOnda);
            if (Number.isInteger(borrador.formaActual)) setFormaActual(borrador.formaActual);
            if (Array.isArray(borrador.segmentoST)) setSegmentoST(borrador.segmentoST);
            if (Number.isInteger(borrador.stActual)) setStActual(borrador.stActual);
            if (typeof borrador.observaciones === "string") setObservaciones(borrador.observaciones);
            if (typeof borrador.ric37_id === "string" || typeof borrador.ric37_id === "number") {
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
    if (!borradorCargado || cargando || !datos.ric01_id) return;
    localStorage.setItem(
      claveBorrador(datos.ric01_id),
      JSON.stringify({
        etapa,
        inspecciones,
        frecuencias,
        frecuenciaActual,
        amplitudes,
        amplitudActual,
        gruposOnda,
        grupoActual,
        artefactos,
        artefactoActual,
        formasOnda,
        formaActual,
        segmentoST,
        stActual,
        observaciones,
        ric37_id: datos.ric37_id
      })
    );
  }, [
    borradorCargado,
    cargando,
    datos.ric01_id,
    datos.ric37_id,
    etapa,
    inspecciones,
    frecuencias,
    frecuenciaActual,
    amplitudes,
    amplitudActual,
    gruposOnda,
    grupoActual,
    artefactos,
    artefactoActual,
    formasOnda,
    formaActual,
    segmentoST,
    stActual,
    observaciones
  ]);

  const resumen = useMemo(() => {
    const inspeccionesEvaluadas = [
      inspecciones.limpieza_exterior,
      inspecciones.papel_registro,
      inspecciones.estado_cables
    ];
    const inspeccionesPendientes = inspeccionesEvaluadas.some((v) => !v);
    const inspeccionesNC = inspeccionesEvaluadas.filter((v) => v === "NO CONFORME").length;

    const grupos = [frecuencias, amplitudes, gruposOnda, artefactos, formasOnda, segmentoST];
    const todos = grupos.flat();
    const pendientes = todos.filter((m) => !m.noAplica && m.conforme === null).length;
    const noConformes = todos.filter((m) => !m.noAplica && m.conforme === false);
    const conformes = todos.filter((m) => !m.noAplica && m.conforme === true).length;
    const noAplica = todos.filter((m) => m.noAplica).length;

    const resultado = inspeccionesPendientes || pendientes > 0
      ? "PENDIENTE"
      : inspeccionesNC > 0 || noConformes.length > 0
      ? "NO CONFORME"
      : "CONFORME";

    return { resultado, pendientes, noConformes, conformes, noAplica, inspeccionesNC };
  }, [inspecciones, frecuencias, amplitudes, gruposOnda, artefactos, formasOnda, segmentoST]);

  const progreso = ((etapa + 1) / ETAPAS.length) * 100;

  const actualizarNumerica = (setter, indice, valor, min, max) => {
    setter((prev) => prev.map((item, i) =>
      i === indice
        ? { ...item, resultado: valor, conforme: evaluarNumero(valor, min, max), noAplica: false }
        : item
    ));
  };

  const actualizarManual = (setter, indice, cambios) => {
    setter((prev) => prev.map((item, i) => i === indice ? { ...item, ...cambios } : item));
  };

  const validarActual = (item) => {
    if (!item) return false;
    if (item.noAplica) return true;
    return item.conforme !== null;
  };

  const avanzarLista = (lista, indiceActual, setIndiceActual, siguienteEtapa) => {
    if (!validarActual(lista[indiceActual])) {
      alert("Complete la verificación o marque No aplica antes de continuar.");
      return;
    }
    if (indiceActual < lista.length - 1) {
      setIndiceActual(indiceActual + 1);
      return;
    }
    setEtapa(siguienteEtapa);
  };

  const retrocederLista = (indiceActual, setIndiceActual, etapaAnterior) => {
    if (indiceActual > 0) {
      setIndiceActual(indiceActual - 1);
      return;
    }
    setEtapa(etapaAnterior);
  };

  const volver = () => {
    if (etapa === 0) return setVista("equipos");
    if (etapa === 1) return retrocederLista(frecuenciaActual, setFrecuenciaActual, 0);
    if (etapa === 2) return retrocederLista(amplitudActual, setAmplitudActual, 1);
    if (etapa === 3) return retrocederLista(grupoActual, setGrupoActual, 2);
    if (etapa === 4) return retrocederLista(artefactoActual, setArtefactoActual, 3);
    if (etapa === 5) return retrocederLista(formaActual, setFormaActual, 4);
    if (etapa === 6) return retrocederLista(stActual, setStActual, 5);
    setEtapa(etapa - 1);
  };

  const cancelar = () => {
    setVista("equipos");
  };

  const tarjetaNumerica = (titulo, lista, indice, setter, setIndice, siguienteEtapa, unidad) => {
    const item = lista[indice];
    return (
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h2 className="text-xl font-bold">{titulo}</h2>
            <p className="text-sm text-gray-500">Medición {indice + 1} de {lista.length}</p>
          </div>
          <Estado conforme={item.conforme} noAplica={item.noAplica} />
        </div>

        <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3 mb-4">{INSTRUCCION_GENERICA}</p>

        <div className={`border rounded-xl p-3 ${item.noAplica ? "bg-gray-50" : item.conforme === true ? "bg-green-50 border-green-300" : item.conforme === false ? "bg-red-50 border-red-300" : "bg-white"}`}>
          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
            <div><span className="text-gray-500 text-xs">Valor nominal</span><div className="font-bold">{item.nombre}</div></div>
            <div><span className="text-gray-500 text-xs">Incertidumbre</span><div className="font-bold">{item.incertidumbre}</div></div>
            <div className="col-span-2"><span className="text-gray-500 text-xs">Rango de aceptación</span><div>{item.min} a {item.max} {unidad}</div></div>
          </div>

          <input
            type="number"
            step="0.001"
            value={item.resultado}
            disabled={item.noAplica}
            onChange={(e) => actualizarNumerica(setter, indice, e.target.value, item.min, item.max)}
            placeholder={`Ingrese resultado en ${unidad}`}
            className="w-full border rounded-xl p-3 bg-white disabled:bg-gray-100"
          />

          <label className="mt-3 flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={item.noAplica}
              onChange={(e) => actualizarManual(setter, indice, { noAplica: e.target.checked, resultado: e.target.checked ? "" : item.resultado, conforme: e.target.checked ? null : item.conforme })}
            />
            No aplica
          </label>
        </div>

        <div className="flex gap-2 mt-6">
          <button onClick={volver} className="flex-1 bg-gray-500 text-white rounded-xl p-3">← Volver</button>
          <button onClick={cancelar} className="flex-1 bg-red-500 text-white rounded-xl p-3">Cancelar</button>
          <button onClick={() => avanzarLista(lista, indice, setIndice, siguienteEtapa)} className="flex-1 bg-blue-600 text-white rounded-xl p-3">Aceptar →</button>
        </div>
      </div>
    );
  };

  const tarjetaManual = (titulo, lista, indice, setter, setIndice, siguienteEtapa, pideResultado = false) => {
    const item = lista[indice];
    return (
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h2 className="text-xl font-bold">{titulo}</h2>
            <p className="text-sm text-gray-500">Verificación {indice + 1} de {lista.length}</p>
          </div>
          <Estado conforme={item.conforme} noAplica={item.noAplica} />
        </div>

        <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3 mb-4">{INSTRUCCION_GENERICA}</p>

        <div className={`border rounded-xl p-3 ${item.noAplica ? "bg-gray-50" : item.conforme === true ? "bg-green-50 border-green-300" : item.conforme === false ? "bg-red-50 border-red-300" : "bg-white"}`}>
          <p className="text-xs text-gray-500">Determinación</p>
          <p className="text-xl font-bold mb-4">{item.nombre}</p>

          {pideResultado && (
            <input
              value={item.resultado}
              disabled={item.noAplica}
              onChange={(e) => actualizarManual(setter, indice, { resultado: e.target.value })}
              placeholder="Ingrese resultado de medición"
              className="w-full border rounded-xl p-3 mb-3 bg-white disabled:bg-gray-100"
            />
          )}

          <select
            value={item.conforme === true ? "CONFORME" : item.conforme === false ? "NO CONFORME" : ""}
            disabled={item.noAplica}
            onChange={(e) => actualizarManual(setter, indice, { conforme: e.target.value === "" ? null : e.target.value === "CONFORME" })}
            className="w-full border rounded-xl p-3 bg-white disabled:bg-gray-100"
          >
            <option value="">Seleccionar resultado</option>
            <option value="CONFORME">CONFORME</option>
            <option value="NO CONFORME">NO CONFORME</option>
          </select>

          <label className="mt-3 flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={item.noAplica}
              onChange={(e) => actualizarManual(setter, indice, { noAplica: e.target.checked, conforme: e.target.checked ? null : item.conforme })}
            />
            No aplica
          </label>
        </div>

        <div className="flex gap-2 mt-6">
          <button onClick={volver} className="flex-1 bg-gray-500 text-white rounded-xl p-3">← Volver</button>
          <button onClick={cancelar} className="flex-1 bg-red-500 text-white rounded-xl p-3">Cancelar</button>
          <button onClick={() => avanzarLista(lista, indice, setIndice, siguienteEtapa)} className="flex-1 bg-blue-600 text-white rounded-xl p-3">Aceptar →</button>
        </div>
      </div>
    );
  };

  if (cargando) {
    return <div className="p-6 text-center"><p className="text-lg">⏳ Cargando datos del equipo...</p></div>;
  }

  if (error) {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <div className="bg-red-100 text-red-700 p-4 rounded-xl">⚠️ {error}</div>
        <button onClick={() => setVista("equipos")} className="w-full bg-gray-500 text-white rounded-xl p-3 mt-4">← Volver</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-50 bg-white shadow">
        <div className="max-w-xl mx-auto p-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <p className="font-bold">RIC48 - Verificación de Electrocardiógrafos</p>
            <span>{ETAPAS[etapa]}</span>
            <span>{etapa + 1} / {ETAPAS.length}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progreso}%` }} />
          </div>
        </div>
      </div>

      <div className="p-4 max-w-xl mx-auto pb-10">
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
            <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3 mb-4">
              Verifique visualmente el estado general del electrocardiógrafo antes de comenzar las mediciones.
            </p>
            <div className="space-y-4">
              {[
                ["limpieza_exterior", "Limpieza exterior"],
                ["papel_registro", "Papel de registro"],
                ["estado_cables", "Estado de cables"]
              ].map(([campo, titulo]) => (
                <div key={campo}>
                  <label className="font-semibold block mb-1">{titulo}</label>
                  <select
                    value={inspecciones[campo]}
                    onChange={(e) => setInspecciones((prev) => ({ ...prev, [campo]: e.target.value }))}
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

            <div className="mt-5">
              <label className="font-semibold block mb-2">Observaciones</label>
              <textarea
                value={inspecciones.observaciones}
                onChange={(e) => setInspecciones((prev) => ({ ...prev, observaciones: e.target.value }))}
                rows={4}
                placeholder="Ingrese observaciones de la inspección..."
                className="w-full border rounded-xl p-3"
              />
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={cancelar} className="flex-1 bg-red-500 text-white rounded-xl p-3">Cancelar</button>
              <button
                disabled={!inspecciones.limpieza_exterior || !inspecciones.papel_registro || !inspecciones.estado_cables}
                onClick={() => setEtapa(1)}
                className="flex-1 bg-blue-600 disabled:bg-gray-300 text-white rounded-xl p-3"
              >
                Continuar →
              </button>
            </div>
          </div>
        )}

        {etapa === 1 && tarjetaNumerica("2. Frecuencia", frecuencias, frecuenciaActual, setFrecuencias, setFrecuenciaActual, 2, "BPM")}
        {etapa === 2 && tarjetaNumerica("3. Amplitud", amplitudes, amplitudActual, setAmplitudes, setAmplitudActual, 3, "mV")}
        {etapa === 3 && tarjetaManual("4. Grupo de onda", gruposOnda, grupoActual, setGruposOnda, setGrupoActual, 4, false)}
        {etapa === 4 && tarjetaManual("5. Artefactos", artefactos, artefactoActual, setArtefactos, setArtefactoActual, 5, true)}
        {etapa === 5 && tarjetaManual("6. Forma de onda", formasOnda, formaActual, setFormasOnda, setFormaActual, 6, false)}
        {etapa === 6 && tarjetaManual("7. Desviación de segmento ST", segmentoST, stActual, setSegmentoST, setStActual, 7, true)}

        {etapa === 7 && (
          <div className="bg-white rounded-xl shadow p-4 space-y-4">
            <h2 className="text-xl font-bold">8. Seguridad eléctrica · RIC 37</h2>
            <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
              Realice el ensayo de seguridad eléctrica mediante el procedimiento RIC37 y vincule su identificador al mantenimiento.
            </p>
            <input
              type="number"
              value={datos.ric37_id}
              onChange={(e) => setDatos((prev) => ({ ...prev, ric37_id: e.target.value }))}
              placeholder="ID RIC37"
              className="w-full border rounded-xl p-3"
            />
            <div className="bg-gray-50 border rounded-xl p-3 text-sm">
              <b>Verificador principal:</b> ANALIZADOR DE MONITORES FLUKE PROSIM 8 · NS 2496025 · ETYC 27/01/2025 · Vigencia 27/01/2026
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={volver} className="flex-1 bg-gray-500 text-white rounded-xl p-3">← Volver</button>
              <button onClick={cancelar} className="flex-1 bg-red-500 text-white rounded-xl p-3">Cancelar</button>
              <button onClick={() => setEtapa(8)} className="flex-1 bg-blue-600 text-white rounded-xl p-3">Ver resumen →</button>
            </div>
          </div>
        )}

        {etapa === 8 && (
          <div className="bg-white rounded-xl shadow p-4 space-y-4">
            <h2 className="text-xl font-bold">9. Resumen de la verificación</h2>

            <div className={`border rounded-xl p-4 ${resumen.resultado === "CONFORME" ? "bg-green-50 border-green-400" : resumen.resultado === "NO CONFORME" ? "bg-red-50 border-red-400" : "bg-gray-50"}`}>
              <p className={`font-bold text-lg ${resumen.resultado === "CONFORME" ? "text-green-700" : resumen.resultado === "NO CONFORME" ? "text-red-700" : "text-gray-700"}`}>
                {resumen.resultado === "CONFORME" ? "✅ VERIFICACIÓN CONFORME" : resumen.resultado === "NO CONFORME" ? "❌ VERIFICACIÓN NO CONFORME" : "⏳ VERIFICACIÓN PENDIENTE"}
              </p>
              <p className="text-sm mt-2">
                Conformes: <b>{resumen.conformes}</b> · No conformes: <b>{resumen.noConformes.length + resumen.inspeccionesNC}</b> · No aplica: <b>{resumen.noAplica}</b>
              </p>
            </div>

            {resumen.noConformes.length > 0 && (
              <div className="bg-red-50 border border-red-300 rounded-xl p-3 text-sm text-red-800">
                <p className="font-bold mb-2">Determinaciones no conformes</p>
                {resumen.noConformes.map((item, index) => (
                  <p key={`${item.nombre}-${index}`}>• {item.nombre}{item.resultado ? `: ${item.resultado}` : ""}</p>
                ))}
              </div>
            )}

            {inspecciones.observaciones?.trim() && (
              <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-3 text-sm">
                <p className="font-bold mb-1">Observaciones de inspección</p>
                <p className="whitespace-pre-wrap">{inspecciones.observaciones}</p>
              </div>
            )}

            <label className="font-semibold block">Observaciones generales</label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={5}
              placeholder="Ingrese observaciones generales de la verificación..."
              className="w-full border rounded-xl p-3"
            />

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-800">
              El avance de RIC48 se guarda automáticamente. La persistencia definitiva, PDF y Google Drive se conectarán al backend cuando creemos las tablas y endpoints específicos de RIC48.
            </div>

            <div className="flex gap-2">
              <button onClick={volver} className="flex-1 bg-gray-500 text-white rounded-xl p-3">← Volver</button>
              <button onClick={() => setVista("equipos")} className="flex-1 bg-blue-600 text-white rounded-xl p-3">Guardar avance y salir</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
