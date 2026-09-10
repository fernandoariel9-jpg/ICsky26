import { useMemo, useState } from "react";

const URL_CITREX_DEFAULT = "http://192.168.2.109:8080";

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

function Valor({ valor, unidad }) {
  return (
    <span className={valor == null ? "text-gray-400" : "font-semibold text-gray-800"}>
      {valor == null ? "--" : valor} {valor == null ? "" : unidad}
    </span>
  );
}

export default function RIC25({ setVista }) {
  const [urlCitrex, setUrlCitrex] = useState(
    localStorage.getItem("ric25_citrex_url") || URL_CITREX_DEFAULT
  );
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

  const capturarCitrex = async () => {
    const url = urlCitrex.trim();

    if (!url) {
      setError("Falta la URL de mediciones del CITREX H5.");
      return;
    }

    try {
      setCapturando(true);
      setError("");
      localStorage.setItem("ric25_citrex_url", url);

      const res = await fetch(url, {
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "application/json, text/plain, */*",
        },
      });

      if (!res.ok) {
        throw new Error(`El CITREX respondió HTTP ${res.status}.`);
      }

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.toLowerCase().includes("json")) {
        const texto = await res.text();
        throw new Error(
          texto.trim().startsWith("<")
            ? "La URL responde una página HTML. Ingrese la Request URL exacta que devuelve el JSON de mediciones."
            : "La URL no devolvió JSON de mediciones."
        );
      }

      const data = await res.json();
      const normalizadas = normalizarMediciones(data);

      if (Object.keys(normalizadas).length === 0) {
        throw new Error("El CITREX respondió, pero no se encontraron mediciones.");
      }

      setMediciones(normalizadas);
      setUltimaCaptura(new Date());
    } catch (err) {
      console.error("Error capturando CITREX:", err);

      const probableBloqueo =
        window.location.protocol === "https:" && url.startsWith("http://");

      setError(
        probableBloqueo
          ? `${err.message || "No se pudo conectar."} El navegador puede estar bloqueando la conexión HTTPS → HTTP hacia la IP local del CITREX.`
          : err.message || "No se pudo capturar la medición del CITREX H5."
      );
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
            <p className="text-sm text-gray-500">Prueba de captura automática desde IMT Analytics CITREX H5</p>
          </div>
          <button
            onClick={() => setVista("tareas")}
            className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded-xl"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm">
          <strong>CITREX H5:</strong> IMT Analytics · 192.168.2.109:8080
          <p className="mt-1 text-gray-600">
            Para esta prueba ingrese la Request URL exacta que en Network devuelve el arreglo JSON de mediciones.
          </p>
        </div>

        <label className="block mt-4 text-sm font-semibold text-gray-700">
          URL de mediciones CITREX
        </label>
        <div className="flex flex-col sm:flex-row gap-2 mt-1">
          <input
            value={urlCitrex}
            onChange={(e) => setUrlCitrex(e.target.value)}
            placeholder="http://192.168.2.109:8080/..."
            className="flex-1 border rounded-xl px-3 py-2 font-mono text-sm"
          />
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
          Todavía no hay datos capturados. Ingrese la URL JSON del CITREX y presione “Capturar CITREX”.
        </div>
      )}
    </div>
  );
}
