import { useEffect, useMemo, useState } from "react";

const URL_SNAPSHOT = "https://sky26.onrender.com/api/ric29/agent/snapshot";
const URL_AGENTE_LOCAL = "http://127.0.0.1:8787";

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
  const [citrexIp, setCitrexIp] = useState("");
  const [guardandoIp, setGuardandoIp] = useState(false);
  const [probandoCitrex, setProbandoCitrex] = useState(false);
  const [estadoAgente, setEstadoAgente] = useState("");
  const [errorAgente, setErrorAgente] = useState("");

  useEffect(() => {
    const cargarConfiguracionCitrex = async () => {
      try {
        setErrorAgente("");
        const res = await fetch(`${URL_AGENTE_LOCAL}/config/citrex`, {
          cache: "no-store",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "No se pudo consultar el agente local.");
        setCitrexIp(data.ip || "");
        setEstadoAgente(`Agente conectado · ${data.url || data.ip}`);
      } catch (err) {
        setEstadoAgente("");
        setErrorAgente(
          "No se pudo conectar con Sky26 Agent local. Verifique que el agent.js configurable esté ejecutándose en esta PC."
        );
      }
    };

    cargarConfiguracionCitrex();
  }, []);

  const guardarIpCitrex = async () => {
    const ip = citrexIp.trim();
    if (!ip) return setErrorAgente("Ingrese la IP del CITREX.");

    try {
      setGuardandoIp(true);
      setErrorAgente("");
      setEstadoAgente("");

      const res = await fetch(`${URL_AGENTE_LOCAL}/config/citrex`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "No se pudo guardar la IP del CITREX.");
      }

      setCitrexIp(data.ip || ip);
      setEstadoAgente(`✅ IP guardada · ${data.url || ip}`);
    } catch (err) {
      setErrorAgente(
        err.message || "No se pudo comunicar con Sky26 Agent para cambiar la IP."
      );
    } finally {
      setGuardandoIp(false);
    }
  };

  const probarConexionCitrex = async () => {
    try {
      setProbandoCitrex(true);
      setErrorAgente("");
      setEstadoAgente("");

      const res = await fetch(`${URL_AGENTE_LOCAL}/citrex`, {
        cache: "no-store",
      });

      if (!res.ok) {
        let mensaje = `CITREX respondió HTTP ${res.status}`;
        try {
          const data = await res.json();
          mensaje = data?.detalle || data?.error || mensaje;
        } catch {}
        throw new Error(mensaje);
      }

      const texto = await res.text();
      let datos;
      try {
        datos = JSON.parse(texto);
      } catch {
        datos = null;
      }

      const cantidad = Array.isArray(datos) ? datos.length : null;
      setEstadoAgente(
        cantidad == null
          ? "✅ CITREX respondió correctamente."
          : `✅ CITREX conectado · ${cantidad} mediciones recibidas.`
      );
    } catch (err) {
      setErrorAgente(`No se pudo conectar al CITREX: ${err.message}`);
    } finally {
      setProbandoCitrex(false);
    }
  };

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
    <div className="bg-white rounded-xl shadow p-4">
      <h2 className="text-xl font-bold mb-2">{titulo}</h2>
      <div className="overflow-x-auto rounded-xl border">
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
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-50 bg-white shadow">
        <div className="max-w-xl mx-auto p-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <p className="font-bold">RIC25 - Verificación de Respiradores</p>
            <span>Captura CITREX</span>
            <span>1 / 1</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full w-full" />
          </div>
        </div>
      </div>

      <div className="p-4 max-w-xl mx-auto pb-10 space-y-4">
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="text-xl font-bold mb-2">1. Conexión con CITREX H5</h2>

          <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3 mb-4">
            Configure la conexión con el analizador CITREX H5 y verifique que Sky26 Agent pueda comunicarse correctamente con el equipo.
          </p>

          <div className="bg-gray-100 rounded-xl p-3 mb-4 text-center">
            <p className="text-sm text-gray-500">Conexión de medición</p>
            <p className="font-bold text-gray-800 mt-1">CITREX H5 → Sky26 Agent → Render → RIC25</p>
          </div>

          <label className="font-semibold block mb-2">IP del CITREX H5</label>
          <input
            type="text"
            inputMode="decimal"
            value={citrexIp}
            onChange={(e) => setCitrexIp(e.target.value)}
            placeholder="Ej.: 192.168.1.33"
            className="w-full border rounded-xl p-3 font-mono"
          />
          <p className="text-xs text-gray-500 mt-2">
            Se utilizará http://IP:8080/request. La IP queda guardada en Sky26 Agent.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
            <button
              type="button"
              onClick={guardarIpCitrex}
              disabled={guardandoIp}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-xl p-3 font-semibold"
            >
              {guardandoIp ? "Guardando..." : "💾 Guardar IP"}
            </button>

            <button
              type="button"
              onClick={probarConexionCitrex}
              disabled={probandoCitrex}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-xl p-3 font-semibold"
            >
              {probandoCitrex ? "Probando..." : "🔌 Probar conexión"}
            </button>
          </div>

          {estadoAgente && (
            <div className="mt-4 bg-green-100 text-green-800 rounded-xl p-3 text-sm">
              {estadoAgente}
            </div>
          )}

          {errorAgente && (
            <div className="mt-4 bg-red-100 text-red-700 rounded-xl p-3 text-sm">
              ⚠️ {errorAgente}
            </div>
          )}

          <button
            onClick={capturarCitrex}
            disabled={capturando}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-xl p-3 mt-5 font-bold"
          >
            {capturando ? "Capturando..." : "📡 Capturar CITREX"}
          </button>

          {error && (
            <div className="mt-4 bg-red-100 text-red-700 rounded-xl p-3 text-sm whitespace-pre-wrap">
              ⚠️ {error}
            </div>
          )}

          {ultimaCaptura && (
            <div className="mt-4 bg-green-100 text-green-800 rounded-xl p-3 text-sm">
              ✅ Captura recibida correctamente · {ultimaCaptura.toLocaleTimeString("es-AR")}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="text-xl font-bold mb-2">2. Punto de ensayo 1</h2>

          <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3 mb-4">
            Verificación de los parámetros programados y los valores medidos por el CITREX H5.
          </p>

          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-gray-100 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500">Modo ventilatorio</p>
              <p className="font-bold mt-1">{PUNTO_ENSAYO_1.modo}</p>
            </div>
            <div className="bg-gray-100 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500">Volumen corriente</p>
              <p className="font-bold mt-1">500 ml</p>
            </div>
            <div className="bg-gray-100 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500">Frecuencia respiratoria</p>
              <p className="font-bold mt-1">12 resp/min</p>
            </div>
            <div className="bg-gray-100 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500">PEEP</p>
              <p className="font-bold mt-1">5 cmH₂O</p>
            </div>
            <div className="col-span-2 bg-gray-100 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500">FiO₂</p>
              <p className="font-bold mt-1">21 %</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border">
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

          <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 mt-4">
            La PEEP y la presión pico recibidas en mbar se convierten automáticamente a cmH₂O para mostrarlas en la misma unidad utilizada en el ensayo.
          </p>
        </div>

        {destacados.length > 0 && (
          <div className="bg-white rounded-xl shadow p-4">
            <h2 className="text-xl font-bold mb-4">Parámetros destacados</h2>
            <div className="grid grid-cols-2 gap-2">
              {destacados.map((m) => (
                <div key={m.id} className="bg-gray-100 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500">{m.nombre}</p>
                  <p className="text-xl font-bold text-gray-800 mt-1">
                    {m.valor == null ? "--" : m.valor}
                  </p>
                  <p className="text-xs text-gray-500">{m.unidad}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {generales.length > 0 && (
          <TablaMediciones titulo="Valores de medición" datos={generales} />
        )}

        {respiratorias.length > 0 && (
          <TablaMediciones titulo="Valores respiratorios" datos={respiratorias} />
        )}

        {Object.keys(mediciones).length === 0 && (
          <div className="bg-white rounded-xl shadow p-4">
            <div className="bg-gray-50 rounded-lg p-4 text-center text-sm text-gray-500">
              Todavía no hay datos capturados. Mantenga Sky26 Agent ejecutándose en la PC conectada al CITREX y presione “Capturar CITREX”.
            </div>
          </div>
        )}

        <button
          onClick={() => setVista("tareas")}
          className="w-full bg-gray-500 hover:bg-gray-600 text-white rounded-xl p-3 font-semibold"
        >
          ← Volver
        </button>
      </div>
    </div>
  );
}