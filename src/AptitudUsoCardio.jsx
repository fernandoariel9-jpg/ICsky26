import { useMemo, useState } from "react";
import {
  BotonesNavegacion,
  ProtocoloLayout,
  TarjetaEtapa
} from "./protocolos/ProtocoloBase";

const POTENCIAS_REFERENCIA = [50, 100, 200];
const CLAVE_EQUIPO = "equipoAptitudCardio";
const ETAPAS = ["Parámetros esenciales"];

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
      <label htmlFor={id} className="block text-sm font-semibold text-red-700 mb-1">
        Observación de la no conformidad *
      </label>
      <textarea
        id={id}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        placeholder="Describa el motivo de la no conformidad..."
        className="w-full border border-red-300 rounded-xl px-3 py-2 text-sm bg-white"
      />
    </div>
  );
}

function EstadoParametro({ conforme }) {
  if (conforme === null || conforme === undefined) {
    return <span className="px-2 py-1 rounded-lg bg-gray-100 text-gray-500 text-xs font-bold">PENDIENTE</span>;
  }
  return conforme
    ? <span className="px-2 py-1 rounded-lg bg-green-100 text-green-700 text-xs font-bold">CONFORME</span>
    : <span className="px-2 py-1 rounded-lg bg-red-100 text-red-700 text-xs font-bold">NO CONFORME</span>;
}

export default function AptitudUsoCardio({ setVista, personal }) {
  const equipo = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem(CLAVE_EQUIPO) || "null");
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

  const cancelar = () => {
    const confirmar = window.confirm(
      "¿Cancelar la aptitud de uso? Se descartarán todas las mediciones y observaciones ingresadas. Esta acción no se puede deshacer."
    );
    if (!confirmar) return;

    // AU Cardio todavía no crea registros ni borradores en el servidor.
    // Solo se elimina su contexto local, sin tocar una eventual tareaActiva de otro flujo.
    localStorage.removeItem(CLAVE_EQUIPO);
    Object.keys(localStorage)
      .filter((clave) => clave.startsWith("au_cardio:"))
      .forEach((clave) => localStorage.removeItem(clave));
    setVista("equipos");
  };

  if (!equipo) {
    return (
      <ProtocoloLayout
        codigo="AU-CARDIO"
        tituloCorto="Aptitud de uso"
        etapas={ETAPAS}
        etapa={0}
        progreso={100}
        datos={{ descripcion: "Cardiodesfibrilador", marca_modelo: "", numero_serie: "", area: "", servicio: "" }}
        error="No se encontraron los datos del equipo seleccionado."
      >
        <TarjetaEtapa titulo="Aptitud de uso - Cardiodesfibrilador">
          <BotonesNavegacion mostrarVolver={false} onCancelar={() => setVista("equipos")} />
        </TarjetaEtapa>
      </ProtocoloLayout>
    );
  }

  const datosEquipo = {
    descripcion: equipo.descripcion || "Cardiodesfibrilador",
    marca_modelo: equipo.marca_modelo || "",
    numero_serie: equipo.numero_serie || "",
    area: equipo.area || "",
    servicio: equipo.servicio || ""
  };

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
    <ProtocoloLayout
      codigo="AU-CARDIO"
      tituloCorto="Aptitud de uso"
      etapas={ETAPAS}
      etapa={0}
      progreso={100}
      datos={datosEquipo}
    >
      <TarjetaEtapa
        titulo="Aptitud de uso - Cardiodesfibrilador"
        ayuda={`Parámetros esenciales · Responsable de la evaluación: ${personal?.nombre || "No identificado"}`}
      >
        <div className="space-y-3">
          <section className="bg-gray-50 rounded-lg p-3">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h3 className="font-bold text-gray-800">1. Energía de descarga</h3>
              <span className="text-xs text-gray-500">Tolerancia: ±15%</span>
            </div>
            <div className="space-y-3">
              {estadosPotencia.map(({ referencia, conforme }) => (
                <article key={referencia} className="bg-white border rounded-xl p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <h4 className="font-semibold text-gray-800">Medición a {referencia} J</h4>
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
                    <CampoObservacion
                      id={`obs-potencia-${referencia}`}
                      valor={observacionesPotencia[referencia] || ""}
                      onChange={(v) => actualizarObservacionPotencia(referencia, v)}
                    />
                  )}
                </article>
              ))}
            </div>
          </section>

          <section className="bg-gray-50 rounded-lg p-3">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h3 className="font-bold text-gray-800">2. Potencia máxima del equipo</h3>
              <EstadoParametro conforme={estadoPotenciaMax} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="potencia-max-fabricante" className="block text-sm font-semibold text-gray-700 mb-1">Potencia máxima indicada por el fabricante (J)</label>
                <input id="potencia-max-fabricante" type="number" min="0" step="0.1" value={potenciaMaxFabricante} onChange={(e) => setPotenciaMaxFabricante(e.target.value)} placeholder="Valor de fabricante" className="w-full border rounded-xl px-3 py-2 bg-white" />
              </div>
              <div>
                <label htmlFor="potencia-max-medida" className="block text-sm font-semibold text-gray-700 mb-1">Potencia máxima medida (J)</label>
                <input id="potencia-max-medida" type="number" min="0" step="0.1" value={potenciaMaxMedida} onChange={(e) => setPotenciaMaxMedida(e.target.value)} placeholder="Valor medido" className="w-full border rounded-xl px-3 py-2 bg-white" />
              </div>
            </div>
            {rangoPotenciaMax && <p className="text-xs text-gray-500 mt-2">Rango aceptable según fabricante: {rangoPotenciaMax.minimo.toFixed(1)} a {rangoPotenciaMax.maximo.toFixed(1)} J (±15%)</p>}
            {estadoPotenciaMax === false && <CampoObservacion id="obs-potencia-max" valor={observacionPotenciaMax} onChange={setObservacionPotenciaMax} />}
          </section>

          <section className="bg-gray-50 rounded-lg p-3">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h3 className="font-bold text-gray-800">3. Sincronismo</h3>
              <EstadoParametro conforme={estadoSincronismo} />
            </div>
            <label htmlFor="sincronismo" className="block text-sm text-gray-600 mb-1">Tiempo de sincronismo (ms)</label>
            <input id="sincronismo" type="number" min="0" step="0.1" value={sincronismo} onChange={(e) => setSincronismo(e.target.value)} placeholder="Ingresar tiempo medido" className="w-full border rounded-xl px-3 py-2 bg-white" />
            <p className="text-xs text-gray-500 mt-1">Criterio de conformidad: menor a 60 ms.</p>
            {estadoSincronismo === false && <CampoObservacion id="obs-sincronismo" valor={observacionSincronismo} onChange={setObservacionSincronismo} />}
          </section>

          <section className="bg-gray-50 rounded-lg p-3">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h3 className="font-bold text-gray-800">4. Forma de onda</h3>
              <EstadoParametro conforme={estadoOnda} />
            </div>
            <label htmlFor="tipo-onda" className="block text-sm text-gray-600 mb-1">Tipo de onda del equipo</label>
            <select id="tipo-onda" value={tipoOnda} onChange={(e) => { setTipoOnda(e.target.value); setOndaCoincide(""); setObservacionOnda(""); }} className="w-full border rounded-xl px-3 py-2 bg-white">
              <option value="">Seleccionar tipo de onda</option>
              <option value="Monofásica">Monofásica</option>
              <option value="Bifásica">Bifásica</option>
            </select>
            <fieldset className="mt-3">
              <legend className="block text-sm text-gray-600 mb-2">¿La forma de onda verificada coincide con la seleccionada?</legend>
              <div className="flex flex-wrap gap-3">
                <label className="flex items-center gap-2 border bg-white rounded-xl px-4 py-2 cursor-pointer"><input type="radio" name="onda-coincide" value="si" checked={ondaCoincide === "si"} onChange={(e) => setOndaCoincide(e.target.value)} /> Sí</label>
                <label className="flex items-center gap-2 border bg-white rounded-xl px-4 py-2 cursor-pointer"><input type="radio" name="onda-coincide" value="no" checked={ondaCoincide === "no"} onChange={(e) => setOndaCoincide(e.target.value)} /> No</label>
              </div>
            </fieldset>
            {estadoOnda === false && <CampoObservacion id="obs-onda" valor={observacionOnda} onChange={setObservacionOnda} />}
          </section>

          <section className="bg-gray-50 rounded-lg p-3">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h3 className="font-bold text-gray-800">5. Tiempo de carga</h3>
              <EstadoParametro conforme={estadoCarga} />
            </div>
            <label htmlFor="tiempo-carga" className="block text-sm text-gray-600 mb-1">Tiempo de carga (segundos)</label>
            <input id="tiempo-carga" type="number" min="0" step="0.1" value={tiempoCarga} onChange={(e) => setTiempoCarga(e.target.value)} placeholder="Ingresar tiempo medido" className="w-full border rounded-xl px-3 py-2 bg-white" />
            <p className="text-xs text-gray-500 mt-1">Criterio de conformidad: menor a 15 segundos.</p>
            {estadoCarga === false && <CampoObservacion id="obs-carga" valor={observacionCarga} onChange={setObservacionCarga} />}
          </section>

          <section className="bg-blue-50 rounded-lg border border-blue-200 p-3">
            <h3 className="font-bold text-gray-800">6. Equipo verificador</h3>
            <p className="text-sm text-gray-600 mt-1">El selector de equipos verificadores se incorporará en una etapa posterior.</p>
            <label className="block text-sm font-semibold text-gray-500 mt-3 mb-1">Equipo verificador</label>
            <select disabled className="w-full border rounded-xl px-3 py-2 bg-gray-100 text-gray-500">
              <option>Selector pendiente de implementación</option>
            </select>
          </section>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl p-3 mt-4 text-sm">
          Los resultados todavía no se guardan en la base de datos. La persistencia se implementará en una etapa posterior.
        </div>

        <BotonesNavegacion
          mostrarVolver={false}
          onCancelar={cancelar}
        />
      </TarjetaEtapa>
    </ProtocoloLayout>
  );
}
