import { useMemo, useState } from "react";

const POTENCIAS_REFERENCIA = [50, 100, 200];

const numeroValido = (valor) => valor !== "" && Number.isFinite(Number(valor));

const dentroDeTolerancia = (medicion, referencia) => {
  if (!numeroValido(medicion) || !numeroValido(referencia) || Number(referencia) <= 0) return null;
  const valor = Number(medicion);
  const nominal = Number(referencia);
  return valor >= nominal * 0.85 && valor <= nominal * 1.15;
};

function CampoObservacion({ id, valor, onChange }) {
  return (
    <div className="mt-3">
      <label htmlFor={id} className="block text-sm font-semibold text-red-800 mb-1">
        Observación de la no conformidad *
      </label>
      <textarea
        id={id}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        placeholder="Describa el motivo de la no conformidad..."
        className="w-full border border-red-300 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-300"
      />
    </div>
  );
}

function EstadoParametro({ conforme }) {
  if (conforme === null || conforme === undefined) {
    return <span className="text-xs text-gray-500">Pendiente de medición</span>;
  }
  return conforme
    ? <span className="inline-flex rounded-full bg-green-100 text-green-800 px-3 py-1 text-xs font-bold">Conforme</span>
    : <span className="inline-flex rounded-full bg-red-100 text-red-800 px-3 py-1 text-xs font-bold">No conforme</span>;
}

export default function AptitudUsoCardio({ setVista, personal }) {
  const equipo = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("equipoAptitudCardio") || "null");
    } catch {
      return null;
    }
  }, []);

  const [medicionesPotencia, setMedicionesPotencia] = useState({ 50: "", 100: "", 200: "" });
  const [potenciaMaxFabricante, setPotenciaMaxFabricante] = useState("");
  const [potenciaMaxMedida, setPotenciaMaxMedida] = useState("");
  const [observacionesPotencia, setObservacionesPotencia] = useState({});
  const [observacionPotenciaMax, setObservacionPotenciaMax] = useState("");
  const [sincronismo, setSincronismo] = useState("");
  const [observacionSincronismo, setObservacionSincronismo] = useState("");
  const [tipoOnda, setTipoOnda] = useState("");
  const [ondaCoincide, setOndaCoincide] = useState("");
  const [observacionOnda, setObservacionOnda] = useState("");
  const [tiempoCarga, setTiempoCarga] = useState("");
  const [observacionCarga, setObservacionCarga] = useState("");

  if (!equipo) {
    return (
      <main className="max-w-3xl mx-auto p-4">
        <div className="bg-white rounded-2xl shadow p-5">
          <h1 className="text-xl font-bold text-gray-800">Aptitud de uso - Cardiodesfibrilador</h1>
          <p className="mt-3 text-red-700">No se encontraron los datos del equipo seleccionado.</p>
          <button onClick={() => setVista("equipos")} className="mt-4 w-full bg-gray-600 hover:bg-gray-700 text-white rounded-xl py-2 font-semibold">Volver a Equipos</button>
        </div>
      </main>
    );
  }

  const estadosPotencia = POTENCIAS_REFERENCIA.map((referencia) => ({
    referencia,
    conforme: dentroDeTolerancia(medicionesPotencia[referencia], referencia)
  }));
  const estadoPotenciaMax = dentroDeTolerancia(potenciaMaxMedida, potenciaMaxFabricante);
  const estadoSincronismo = numeroValido(sincronismo) ? Number(sincronismo) < 60 : null;
  const estadoOnda = ondaCoincide === "" ? null : ondaCoincide === "si";
  const estadoCarga = numeroValido(tiempoCarga) ? Number(tiempoCarga) < 15 : null;

  const actualizarMedicionPotencia = (referencia, valor) => {
    setMedicionesPotencia((actual) => ({ ...actual, [referencia]: valor }));
  };

  const actualizarObservacionPotencia = (referencia, valor) => {
    setObservacionesPotencia((actual) => ({ ...actual, [referencia]: valor }));
  };

  const rangoPotenciaMax = numeroValido(potenciaMaxFabricante) && Number(potenciaMaxFabricante) > 0
    ? { minimo: Number(potenciaMaxFabricante) * 0.85, maximo: Number(potenciaMaxFabricante) * 1.15 }
    : null;

  return (
    <main className="max-w-3xl mx-auto p-4">
      <div className="bg-white rounded-2xl shadow p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className="text-sm font-semibold text-emerald-700">SKY26 · INGENIERÍA CLÍNICA</p>
            <h1 className="text-xl font-bold text-gray-900 mt-1">Aptitud de uso - Cardiodesfibrilador</h1>
            <p className="text-sm text-gray-500 mt-1">Etapa 2 · Parámetros esenciales</p>
          </div>
          <button onClick={() => setVista("equipos")} className="shrink-0 bg-gray-600 hover:bg-gray-700 text-white rounded-xl px-3 py-2 text-sm font-semibold">Volver</button>
        </div>

        <section className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <h2 className="font-bold text-gray-800 mb-2">Identificación del equipo</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <p><strong>Equipo:</strong> {equipo.descripcion || "-"}</p>
            <p><strong>Marca / modelo:</strong> {equipo.marca_modelo || "-"}</p>
            <p><strong>Número de serie:</strong> {equipo.numero_serie || "-"}</p>
            <p><strong>Servicio:</strong> {equipo.servicio || "-"}</p>
            <p><strong>Área:</strong> {equipo.area || "-"}</p>
            <p><strong>Responsable:</strong> {personal?.nombre || "-"}</p>
          </div>
        </section>

        <section className="mt-5">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="text-lg font-bold text-gray-900">1. Energía de descarga</h2>
            <span className="text-xs text-gray-500">Tolerancia: ±15%</span>
          </div>
          <div className="space-y-3">
            {estadosPotencia.map(({ referencia, conforme }) => (
              <article key={referencia} className="rounded-xl border border-gray-200 p-3 sm:p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-gray-800">Medición a {referencia} J</h3>
                  <EstadoParametro conforme={conforme} />
                </div>
                <label htmlFor={`potencia-${referencia}`} className="block text-sm text-gray-600 mb-1">Energía medida (J)</label>
                <input
                  id={`potencia-${referencia}`}
                  type="number"
                  min="0"
                  step="0.1"
                  value={medicionesPotencia[referencia]}
                  onChange={(e) => actualizarMedicionPotencia(referencia, e.target.value)}
                  placeholder="Ingresar valor medido"
                  className="w-full border rounded-xl px-3 py-2"
                />
                <p className="text-xs text-gray-500 mt-1">Rango aceptable: {(referencia * 0.85).toFixed(1)} a {(referencia * 1.15).toFixed(1)} J</p>
                {conforme === false && (
                  <CampoObservacion id={`obs-potencia-${referencia}`} valor={observacionesPotencia[referencia] || ""} onChange={(v) => actualizarObservacionPotencia(referencia, v)} />
                )}
              </article>
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-xl border border-gray-200 p-3 sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h2 className="text-lg font-bold text-gray-900">2. Potencia máxima del equipo</h2>
            <EstadoParametro conforme={estadoPotenciaMax} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="potencia-max-fabricante" className="block text-sm font-semibold text-gray-700 mb-1">Potencia máxima indicada por el fabricante (J)</label>
              <input id="potencia-max-fabricante" type="number" min="0" step="0.1" value={potenciaMaxFabricante} onChange={(e) => setPotenciaMaxFabricante(e.target.value)} placeholder="Valor de fabricante" className="w-full border rounded-xl px-3 py-2" />
            </div>
            <div>
              <label htmlFor="potencia-max-medida" className="block text-sm font-semibold text-gray-700 mb-1">Potencia máxima medida (J)</label>
              <input id="potencia-max-medida" type="number" min="0" step="0.1" value={potenciaMaxMedida} onChange={(e) => setPotenciaMaxMedida(e.target.value)} placeholder="Valor medido" className="w-full border rounded-xl px-3 py-2" />
            </div>
          </div>
          {rangoPotenciaMax && <p className="text-xs text-gray-500 mt-2">Rango aceptable según fabricante: {rangoPotenciaMax.minimo.toFixed(1)} a {rangoPotenciaMax.maximo.toFixed(1)} J (±15%)</p>}
          {estadoPotenciaMax === false && <CampoObservacion id="obs-potencia-max" valor={observacionPotenciaMax} onChange={setObservacionPotenciaMax} />}
        </section>

        <section className="mt-5 rounded-xl border border-gray-200 p-3 sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h2 className="text-lg font-bold text-gray-900">3. Sincronismo</h2>
            <EstadoParametro conforme={estadoSincronismo} />
          </div>
          <label htmlFor="sincronismo" className="block text-sm text-gray-600 mb-1">Tiempo de sincronismo (ms)</label>
          <input id="sincronismo" type="number" min="0" step="0.1" value={sincronismo} onChange={(e) => setSincronismo(e.target.value)} placeholder="Ingresar tiempo medido" className="w-full border rounded-xl px-3 py-2" />
          <p className="text-xs text-gray-500 mt-1">Criterio de conformidad: menor a 60 ms.</p>
          {estadoSincronismo === false && <CampoObservacion id="obs-sincronismo" valor={observacionSincronismo} onChange={setObservacionSincronismo} />}
        </section>

        <section className="mt-5 rounded-xl border border-gray-200 p-3 sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h2 className="text-lg font-bold text-gray-900">4. Forma de onda</h2>
            <EstadoParametro conforme={estadoOnda} />
          </div>
          <label htmlFor="tipo-onda" className="block text-sm text-gray-600 mb-1">Tipo de onda del equipo</label>
          <select id="tipo-onda" value={tipoOnda} onChange={(e) => { setTipoOnda(e.target.value); setOndaCoincide(""); setObservacionOnda(""); }} className="w-full border rounded-xl px-3 py-2">
            <option value="">Seleccionar tipo de onda</option>
            <option value="Monofásica">Monofásica</option>
            <option value="Bifásica">Bifásica</option>
          </select>
          <fieldset className="mt-3">
            <legend className="block text-sm text-gray-600 mb-2">¿La forma de onda verificada coincide con la seleccionada?</legend>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 border rounded-xl px-4 py-2 cursor-pointer"><input type="radio" name="onda-coincide" value="si" checked={ondaCoincide === "si"} onChange={(e) => setOndaCoincide(e.target.value)} /> Sí</label>
              <label className="flex items-center gap-2 border rounded-xl px-4 py-2 cursor-pointer"><input type="radio" name="onda-coincide" value="no" checked={ondaCoincide === "no"} onChange={(e) => setOndaCoincide(e.target.value)} /> No</label>
            </div>
          </fieldset>
          {estadoOnda === false && <CampoObservacion id="obs-onda" valor={observacionOnda} onChange={setObservacionOnda} />}
        </section>

        <section className="mt-5 rounded-xl border border-gray-200 p-3 sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h2 className="text-lg font-bold text-gray-900">5. Tiempo de carga</h2>
            <EstadoParametro conforme={estadoCarga} />
          </div>
          <label htmlFor="tiempo-carga" className="block text-sm text-gray-600 mb-1">Tiempo de carga (segundos)</label>
          <input id="tiempo-carga" type="number" min="0" step="0.1" value={tiempoCarga} onChange={(e) => setTiempoCarga(e.target.value)} placeholder="Ingresar tiempo medido" className="w-full border rounded-xl px-3 py-2" />
          <p className="text-xs text-gray-500 mt-1">Criterio de conformidad: menor a 15 segundos.</p>
          {estadoCarga === false && <CampoObservacion id="obs-carga" valor={observacionCarga} onChange={setObservacionCarga} />}
        </section>

        <section className="mt-5 rounded-xl border border-dashed border-blue-300 bg-blue-50/50 p-4">
          <h2 className="font-bold text-gray-800">6. Equipo verificador</h2>
          <p className="text-sm text-gray-600 mt-1">El selector de equipos verificadores se incorporará en una etapa posterior.</p>
          <div className="mt-3">
            <label className="block text-sm font-semibold text-gray-500 mb-1">Equipo verificador</label>
            <select disabled className="w-full border rounded-xl px-3 py-2 bg-gray-100 text-gray-500">
              <option>Selector pendiente de implementación</option>
            </select>
          </div>
        </section>

        <div className="mt-5 rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900">
          Esta etapa permite cargar y evaluar visualmente los parámetros. Los datos todavía no se guardan en la base de datos; la persistencia se implementará en una etapa posterior.
        </div>
      </div>
    </main>
  );
}
