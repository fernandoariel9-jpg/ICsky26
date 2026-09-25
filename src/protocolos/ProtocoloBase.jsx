import { useEffect, useState } from "react";
import { API_URL } from "../config";

export const fechaHoraLocalProtocolo = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
};

export const normalizarTextoProtocolo = (texto = "") =>
  String(texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

export function useProtocoloBase({ codigo, personal, defaultDescripcion = "" }) {
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
    tecnico: personal?.nombre || ""
  });
  const [cargandoBase, setCargandoBase] = useState(true);
  const [errorBase, setErrorBase] = useState("");
  const [estados, setEstados] = useState([]);
  const [mostrarEstadoFinal, setMostrarEstadoFinal] = useState(false);
  const [estadoFinal, setEstadoFinal] = useState("");
  const [finalizando, setFinalizando] = useState(false);

  useEffect(() => {
    fetch(API_URL.Estados)
      .then((r) => r.json())
      .then((d) => setEstados(Array.isArray(d) ? d : []))
      .catch((err) => console.error(`Error cargando estados ${codigo}:`, err));
  }, [codigo]);

  useEffect(() => {
    (async () => {
      try {
        const raw = localStorage.getItem("tareaActiva");
        if (!raw) throw new Error("No hay una tarea activa.");

        const tarea = JSON.parse(raw);
        let equipo = null;

        if (tarea.numero_serie) {
          const res = await fetch(`${API_URL.BuscarEquipo}/${encodeURIComponent(tarea.numero_serie)}`);
          if (res.ok) equipo = await res.json();
        }

        setDatos({
          ric01_id: tarea.ric01_id || tarea.id || "",
          equipo_id: equipo?.id || tarea.equipo_id || "",
          numero_serie: equipo?.numero_serie || tarea.numero_serie || "",
          descripcion: equipo?.descripcion || tarea.descripcion || defaultDescripcion,
          marca_modelo: equipo?.marca_modelo || tarea.marca_modelo || "",
          area: equipo?.area || tarea.area || "",
          servicio: equipo?.servicio || tarea.servicio || "",
          sub_servicio: equipo?.sub_servicio || tarea.subservicio || tarea.sub_servicio || "",
          encargado: equipo?.encargado || tarea.encargado || "",
          tecnico: personal?.nombre || tarea.usuario || tarea.asignado || ""
        });
      } catch (err) {
        console.error(`Error cargando datos ${codigo}:`, err);
        setErrorBase(err.message || "No se pudieron cargar los datos del equipo.");
      } finally {
        setCargandoBase(false);
      }
    })();
  }, [codigo, defaultDescripcion, personal]);

  const cancelarPreventivo = async ({ setVista, borrarBorrador }) => {
    const confirmar = window.confirm(
      "¿Desea cancelar el mantenimiento? Se eliminará la tarea creada y se perderán todos los datos ingresados."
    );
    if (!confirmar) return false;

    try {
      const tareaRaw = localStorage.getItem("tareaActiva");
      const tarea = tareaRaw ? JSON.parse(tareaRaw) : null;
      const tareaId = tarea?.id || tarea?.ric01_id || datos.ric01_id;

      if (tareaId) {
        const res = await fetch(`${API_URL.Ric01}/${tareaId}/cancelar-preventivo`, { method: "DELETE" });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "No se pudo eliminar la tarea creada.");
      }

      if (typeof borrarBorrador === "function") borrarBorrador();
      localStorage.removeItem("tareaActiva");
      setVista("equipos");
      return true;
    } catch (err) {
      console.error(`Error cancelando ${codigo}:`, err);
      alert(err.message || "No se pudo cancelar el mantenimiento.");
      return false;
    }
  };

  const finalizarMantenimiento = async () => {
    if (!estadoFinal) {
      alert("Seleccione el estado final del equipo.");
      return false;
    }

    try {
      setFinalizando(true);
      const res = await fetch(`${API_URL.Ric01}/finalizar/${datos.ric01_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fecha_fin: fechaHoraLocalProtocolo(),
          estado: estadoFinal,
          numero_serie: datos.numero_serie,
          usuario: datos.tecnico
        })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "No se pudo finalizar el mantenimiento");

      setMostrarEstadoFinal(false);
      localStorage.removeItem("tareaActiva");
      localStorage.setItem("equipoActualizado", datos.numero_serie);
      alert("✅ Mantenimiento finalizado correctamente");
      return true;
    } catch (err) {
      console.error(`Error finalizando ${codigo}:`, err);
      alert(err.message || "No se pudo finalizar el mantenimiento.");
      return false;
    } finally {
      setFinalizando(false);
    }
  };

  return {
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
  };
}

export function ProtocoloLayout({ codigo, tituloCorto, etapas, etapa, progreso, datos, error, children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-50 bg-white shadow">
        <div className="max-w-xl mx-auto p-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <p className="font-bold">{codigo} - {tituloCorto}</p>
            <span>{etapas[etapa]}</span>
            <span>{etapa + 1} / {etapas.length}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progreso}%` }}
            />
          </div>
        </div>
      </div>

      <div className="p-4 max-w-xl mx-auto pb-10">
        <FichaEquipo datos={datos} />
        {error && <div className="bg-red-100 text-red-700 p-3 rounded-xl mb-4">⚠️ {error}</div>}
        {children}
      </div>
    </div>
  );
}

export function FichaEquipo({ datos }) {
  return (
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
  );
}

export function TarjetaEtapa({ titulo, ayuda, children }) {
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <h2 className="text-xl font-bold mb-2">{titulo}</h2>
      {ayuda && <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3 mb-4">{ayuda}</p>}
      {children}
    </div>
  );
}

export function BotonesNavegacion({ onVolver, onCancelar, onContinuar, continuarTexto = "Continuar →", continuarDisabled = false, mostrarVolver = true }) {
  return (
    <div className="flex gap-2 mt-6">
      {mostrarVolver && (
        <button onClick={onVolver} className="flex-1 bg-gray-500 text-white rounded-xl p-3">← Volver</button>
      )}
      <button onClick={onCancelar} className="flex-1 bg-red-500 text-white rounded-xl p-3">Cancelar</button>
      {onContinuar && (
        <button
          onClick={onContinuar}
          disabled={continuarDisabled}
          className="flex-1 bg-blue-600 disabled:bg-gray-300 text-white rounded-xl p-3"
        >
          {continuarTexto}
        </button>
      )}
    </div>
  );
}

export function ResumenMantenimiento({ noConformes = [], mensajeConforme, renderNoConforme, contadores, observaciones, setObservaciones, onVolver, onCancelar, onGuardar, guardando, guardado, onPDF, onSalir, onDrive, enviandoDrive }) {
  return (
    <TarjetaEtapa titulo="2. Resumen del mantenimiento">
      {noConformes.length === 0 ? (
        <div className="bg-green-100 text-green-800 rounded-xl p-4 mb-5">
          <p className="font-bold text-lg">✅ MANTENIMIENTO CONFORME</p>
          <p className="text-sm mt-1">{mensajeConforme}</p>
        </div>
      ) : (
        <div className="bg-red-100 text-red-800 rounded-xl p-4 mb-5">
          <p className="font-bold text-lg mb-3">❌ MANTENIMIENTO NO CONFORME</p>
          <div className="space-y-3">
            {noConformes.map((item, index) => (
              <div key={item.orden ?? index} className="bg-white rounded-lg p-3">
                {renderNoConforme(item, index)}
              </div>
            ))}
          </div>
        </div>
      )}

      {contadores && (
        <div className="grid grid-cols-3 gap-2 mb-5 text-center">
          <div className="bg-green-50 border border-green-200 rounded-xl p-3">
            <p className="text-xs text-gray-500">Conformes</p>
            <p className="text-xl font-bold text-green-700">{contadores.conformes}</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-xs text-gray-500">No conformes</p>
            <p className="text-xl font-bold text-red-700">{contadores.noConformes}</p>
          </div>
          <div className="bg-gray-100 border rounded-xl p-3">
            <p className="text-xs text-gray-500">No aplica</p>
            <p className="text-xl font-bold text-gray-700">{contadores.noAplica}</p>
          </div>
        </div>
      )}

      <label className="font-semibold block mb-2">Observaciones generales</label>
      <textarea
        value={observaciones}
        onChange={(e) => setObservaciones(e.target.value)}
        rows={5}
        placeholder="Ingrese aquí las observaciones del mantenimiento..."
        className="w-full border rounded-xl p-3"
      />

      <BotonesNavegacion onVolver={onVolver} onCancelar={onCancelar} />

      <button
        disabled={guardando || guardado}
        onClick={onGuardar}
        className="w-full bg-green-600 disabled:bg-gray-400 text-white rounded-xl p-3 mt-3 font-bold"
      >
        {guardando ? "Guardando..." : guardado ? "✅ Preventivo guardado" : "💾 Guardar preventivo"}
      </button>

      {guardado && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          <button onClick={onPDF} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-3 font-bold">
            📄 Ver / Descargar PDF
          </button>
          <button onClick={onSalir} className="bg-gray-600 hover:bg-gray-700 text-white rounded-xl p-3 font-bold">
            🚪 Salir
          </button>
          <button
            onClick={onDrive}
            disabled={enviandoDrive}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-xl p-3 mt-3 font-bold"
          >
            {enviandoDrive ? "☁️ Enviando a Google Drive..." : "☁️ Enviar a Google Drive"}
          </button>
        </div>
      )}
    </TarjetaEtapa>
  );
}

export function ModalEstadoFinal({ abierto, estados, estadoFinal, setEstadoFinal, finalizando, onCerrar, onConfirmar }) {
  if (!abierto) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5">
        <h2 className="text-lg font-bold mb-2">Finalizar mantenimiento</h2>
        <p className="text-sm text-gray-600 mb-4">¿En qué estado queda el equipo?</p>
        <select
          className="w-full border rounded-xl p-3 mb-4"
          value={estadoFinal}
          onChange={(e) => setEstadoFinal(e.target.value)}
        >
          <option value="">Seleccionar estado</option>
          {estados.map((e, i) => {
            const valor = e.estado || e.nombre || e;
            return <option key={`${valor}-${i}`} value={valor}>{valor}</option>;
          })}
        </select>
        <div className="flex gap-2">
          <button type="button" onClick={onCerrar} className="flex-1 bg-gray-500 text-white rounded-xl p-3">Cancelar</button>
          <button
            type="button"
            onClick={onConfirmar}
            disabled={finalizando || !estadoFinal}
            className="flex-1 bg-green-600 disabled:bg-gray-300 text-white rounded-xl p-3"
          >
            {finalizando ? "Finalizando..." : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}
