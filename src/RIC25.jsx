import { useMemo, useState } from "react";

const URL_SNAPSHOT = "https://sky26.onrender.com/api/ric29/agent/snapshot";

const UNIDADES = {
  lPerMin: "l/min",
  mbar: "mbar",
  bar: "bar",
  PERCENTAGE: "%",
  mL: "ml",
  C: "°C",
  hPa: "hPa",
  s: "s",
  RATIO: "",
  BPM: "b/min",
  mlPermbar: "ml/mbar",
};

const PARAMETROS_DESTACADOS = [
  "BREATHRATE",
  "VTI",
  "VTE",
  "VI",
  "VE",
  "PEAKPRESSURE",
  "MEANPRESSURE",
  "PEEP",
  "TI",
  "TE",
  "ITOE",
  "PFINSP",
  "PFEXP",
  "PLATEAUPRESSURE",
  "COMPLIANCE",
  "INSPIRATORYPOSITIVEAIRWAYPRESSURE",
  "OXYGEN",
];

const PUNTO_ENSAYO_1 = {
  modo: "VCV",
  volumenCorriente: 500,
  frecuenciaRespiratoria: 12,
  peep: 5,
  fio2: 21,
};

function normalizarValor(valor) {
  if (valor == null || valor === "" || valor === "--") return null;
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : valor;
}

function normalizarMediciones(lista) {
  if (!Array.isArray(lista)) {
    throw new Error("La respuesta del CITREX no es una lista de mediciones.");
  }

  return lista.reduce((acc, medicion) => {
    if (!medicion?.measurementId) return acc;

    acc[medicion.measurementId] = {
      id: medicion.measurementId,
      nombre: medicion.measurementName || medicion.measurementId,
      unidad: UNIDADES[medicion.unit] ?? medicion.unit ?? "",
      valor: normalizarValor(medicion.measurementValue),
      min: normalizarValor(medicion.min),
      max: normalizarValor(medicion.max),
      promedio: normalizarValor(medicion.mean),
      respiratorio: Boolean(medicion.respiratory),
    };

    return acc;
  }, {});
}

function redondear(valor, decimales = 1) {
  if (!Number.isFinite(Number(valor))) return null;
  const factor = 10 ** decimales;
  return Math.round(Number(valor) * factor) / factor;
}

function mbarACmH2O(valor) {
  if (!Number.isFinite(Number(valor))) return null;
  return Number(valor) * 1.019716;
}

function calcularDiferencia(medido, programado, decimales = 1) {
  if (!Number.isFinite(Number(medido)) || !Number.isFinite(Number(programado))) {
    return null;
  }

  return redondear(Number(medido) - Number(programado), decimales);
}

function mostrarNumero(valor, unidad = "") {
  if (valor == null || !Number.isFinite(Number(valor))) return "--";
  return `${valor}${unidad ? ` ${unidad}` : ""}`;
}

function Valor({ valor, unidad }) {
  return (
    <span className={valor == null ? "text-gray-400" : "font-semibold text-gray-800"}>
      {valor == null ? "--" : valor} {valor == null ? "" : unidad}
    </span>
  );
}

export default function RIC25({ setVista }) {
  const [mediciones, setMediciones] = useState({});
  const [capturando, setCapturando] = useState(false);
  const [error, setError] = useState("");
  const [ultimaCaptura, setUltimaCaptura] = useState(null);

  const respiratorias = useMemo(
    () => Object.values(mediciones).filter((m) => m.respiratorio),
    [mediciones]
  );

  const generales = useMemo(
    () => Object.values(mediciones).filter((m) => !m.respiratorio),
    [mediciones]
  );

  const destacados = PARAMETROS_DESTACADOS
    .map((id) => mediciones[id])
    .filter(Boolean);

  const medicionesPunto1 = useMemo(() => {
    const volumen = mediciones.VTE?.valor;
    const frecuencia = mediciones.BREATHRATE?.valor;
    const peepMbar = mediciones.PEEP?.valor;
    const oxigeno = mediciones.OXYGEN?.valor;
    const presionPicoMbar = mediciones.PEAKPRESSURE?.valor;

    const peepCmH2O = redondear(mbarACmH2O(peepMbar), 1);
    const presionPicoCmH2O = redondear(mbarACmH2O(presionPicoMbar), 1);

    return [
      {
        parametro: "Volumen corriente espirado",
        programado: PUNTO_ENSAYO_1.volumenCorriente,
        medido: redondear(volumen, 0),
        diferencia: calcularDiferencia(volumen, PUNTO_ENSAYO_1.volumenCorriente, 0),
        unidad: "ml",
      },
      {
        parametro: "Frecuencia respiratoria",
        programado: PUNTO_ENSAYO_1.frecuenciaRespiratoria,
        medido: redondear(frecuencia, 1),
        diferencia: calcularDiferencia(frecuencia, PUNTO_ENSAYO_1.frecuenciaRespiratoria, 1),
        unidad: "resp/min",
      },
      {
        parametro: "PEEP",
        programado: PUNTO_ENSAYO_1.peep,
        medido: peepCmH2O,
        diferencia: calcularDiferencia(peepCmH2O, PUNTO_ENSAYO_1.peep, 1),
        unidad: "cmH₂O",
      },
      {
        parametro: "Concentración de oxígeno",
        programado: PUNTO_ENSAYO_1.fio2,
        medido: redondear(oxigeno, 1),
        diferencia: calcularDiferencia(oxigeno, PUNTO_ENSAYO_1.fio2, 1),
        unidad: "%",
      },
      {
        parametro: "Presión pico",
        programado: null,
        medido: presionPicoCmH2O,
        diferencia: null,
        unidad: "cmH₂O",
      },
    ];
  }, [mediciones]);

  const capturarCitrex = async () => {
    try {
      setCapturando(true);
      setError("");

      const res = await fetch(URL_SNAPSHOT, {
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || `El backend respondió HTTP ${res.status}.`);
      }

      if (data.conectado === false) {
        const segundos = Number.isFinite(Number(data.antiguedadMs))
          ? Math.round(Number(data.antiguedadMs) / 1000)
          : null;

        throw new Error(
          segundos == null
            ? "Sky26 Agent está desconectado. No se utilizarán mediciones almacenadas."
            : `Sky26 Agent está desconectado. La última medición tiene ${segundos} s de antigüedad y no se utilizará.`
        );
      }

      const normalizadas = normalizarMediciones(data.datos);

      if (Object.keys(normalizadas).length === 0) {
        throw new Error("El backend respondió, pero no se encontraron mediciones.");
      }

      setMediciones(normalizadas);
      setUltimaCaptura(data.recibidoEn ? new Date(data.recibidoEn) : new Date());
    } catch (err) {
      console.error("Error capturando CITREX:", err);
      setError(err.message || "No se pudo capturar la medición del CITREX H5.");
    } finally {
      setCapturando(false);
    }
  };

  const TablaMediciones = ({ titulo, datos }) => (
    <section className="bg-white border rounded-xl shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b bg-gray-50">
        <h2 className="font-bold text-gray-800">{titulo}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-3 py-2">Parámetro</th>
              <th className="text-right px-3 py-2">Valor</th>
              <th className="text-right px-3 py-2">Mín.</th>
              <th className="text-right px-3 py-2">Máx.</th>
              <th className="text-right px-3 py-2">Prom.</th>
            </tr>
          </thead>
          <tbody>
            {datos.map((m) => (
              <tr key={m.id} className="border-t">
                <td className="px-3 py-2">
                  <div className="font-semibold text-gray-800">{m.nombre}</div>
                  <div className="text-[10px] text-gray-400">{m.id}</div>
                </td>
                <td className="px-3 py-2 text-right"><Valor valor={m.valor} unidad={m.unidad} /></td>
                <td className="px-3 py-2 text-right"><Valor valor={m.min} unidad={m.unidad} /></td>
                <td className="px-3 py-2 text-right"><Valor valor={m.max} unidad={m.unidad} /></td>
                <td className="px-3 py-2 text-right"><Valor valor={m.promedio} unidad={m.unidad} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-4">
      <div className="bg-white border rounded-2xl shadow p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">RIC25 · Respiradores</h1>
            <p className="text-sm text-gray-500">Captura automática desde IMT Analytics CITREX H5</p>
          </div>
          <button
            onClick={() => setVista("tareas")}
            className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-xl"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm">
          <strong>Conexión:</strong> CITREX H5 → Sky26 Agent → Render → RIC25
          <p className="mt-1 text-gray-600">
            El equipo puede capturar mediciones desde PC, tablet o celular mientras el agente esté enviando datos.
          </p>
        </div>

        <div className="mt-4">
          <button
            onClick={capturarCitrex}
            disabled={capturando}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-5 py-2 rounded-xl font-bold"
          >
            {capturando ? "Capturando..." : "📡 Capturar CITREX"}
          </button>
        </div>

        {error && (
          <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 whitespace-pre-wrap">
            {error}
          </div>
        )}

        {ultimaCaptura && (
          <div className="mt-3 bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700">
            ✅ Captura recibida correctamente · {ultimaCaptura.toLocaleTimeString("es-AR")}
          </div>
        )}
      </div>

      <section className="bg-white border rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50">
          <h2 className="font-bold text-gray-900">Punto de ensayo 1</h2>
          <p className="text-sm text-gray-500">Verificación de parámetros programados y medidos</p>
        </div>

        <div className="p-4 grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-gray-50 border rounded-xl p-3">
            <div className="text-xs text-gray-500">Modo ventilatorio</div>
            <div className="font-bold text-gray-900 mt-1">{PUNTO_ENSAYO_1.modo}</div>
          </div>
          <div className="bg-gray-50 border rounded-xl p-3">
            <div className="text-xs text-gray-500">Volumen corriente</div>
            <div className="font-bold text-gray-900 mt-1">500 ml</div>
          </div>
          <div className="bg-gray-50 border rounded-xl p-3">
            <div className="text-xs text-gray-500">Frecuencia respiratoria</div>
            <div className="font-bold text-gray-900 mt-1">12 resp/min</div>
          </div>
          <div className="bg-gray-50 border rounded-xl p-3">
            <div className="text-xs text-gray-500">PEEP</div>
            <div className="font-bold text-gray-900 mt-1">5 cmH₂O</div>
          </div>
          <div className="bg-gray-50 border rounded-xl p-3">
            <div className="text-xs text-gray-500">FiO₂</div>
            <div className="font-bold text-gray-900 mt-1">21 %</div>
          </div>
        </div>

        <div className="overflow-x-auto border-t">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-3 py-2">Parámetro</th>
                <th className="text-right px-3 py-2">Programado</th>
                <th className="text-right px-3 py-2">Medido</th>
                <th className="text-right px-3 py-2">Diferencia</th>
              </tr>
            </thead>
            <tbody>
              {medicionesPunto1.map((fila) => (
                <tr key={fila.parametro} className="border-t">
                  <td className="px-3 py-2 font-semibold text-gray-800">{fila.parametro}</td>
                  <td className="px-3 py-2 text-right">
                    {fila.programado == null ? "—" : mostrarNumero(fila.programado, fila.unidad)}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold">
                    {mostrarNumero(fila.medido, fila.unidad)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {fila.diferencia == null
                      ? "—"
                      : `${fila.diferencia > 0 ? "+" : ""}${fila.diferencia} ${fila.unidad}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t bg-amber-50 text-xs text-amber-800">
          La PEEP y la presión pico recibidas en mbar se convierten automáticamente a cmH₂O para mostrarlas en la misma unidad utilizada en el ensayo.
        </div>
      </section>

      {destacados.length > 0 && (
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {destacados.map((m) => (
            <div key={m.id} className="bg-white border rounded-xl p-3 text-center shadow-sm">
              <div className="text-xs text-gray-500">{m.nombre}</div>
              <div className="mt-1 text-lg font-bold text-gray-800">
                {m.valor == null ? "--" : m.valor}
              </div>
              <div className="text-[10px] text-gray-400">{m.unidad}</div>
            </div>
          ))}
        </section>
      )}

      {generales.length > 0 && (
        <TablaMediciones titulo="Valores de medición" datos={generales} />
      )}

      {respiratorias.length > 0 && (
        <TablaMediciones titulo="Valores respiratorios" datos={respiratorias} />
      )}

      {Object.keys(mediciones).length === 0 && (
        <div className="bg-gray-50 border border-dashed rounded-xl p-6 text-center text-gray-500">
          Todavía no hay datos capturados. Mantenga Sky26 Agent ejecutándose en la PC conectada al CITREX y presione “Capturar CITREX”.
        </div>
      )}
    </div>
  );
}
