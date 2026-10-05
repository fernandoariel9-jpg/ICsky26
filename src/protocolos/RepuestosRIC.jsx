import { useMemo, useState } from "react";
import { API_URL } from "../config";

const STOCK_API = `${API_URL.Base}/api/stock`;

function leerTareaActiva() {
  try {
    const raw = localStorage.getItem("tareaActiva");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function RepuestosRIC({ personal, tarea: tareaProp = null, areaStock = "", onRegistrado = null, etiqueta = "🔩 Agregar repuestos del stock" }) {
  const [abierto, setAbierto] = useState(false);
  const [existencias, setExistencias] = useState([]);
  const [todasExistencias, setTodasExistencias] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [itemId, setItemId] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [seleccionados, setSeleccionados] = useState([]);
  const [error, setError] = useState("");
  const [registrados, setRegistrados] = useState(0);
  const [transferencia, setTransferencia] = useState(null);
  const [cantidadTransferencia, setCantidadTransferencia] = useState("");
  const [observacionTransferencia, setObservacionTransferencia] = useState("");
  const [solicitandoTransferencia, setSolicitandoTransferencia] = useState(false);
  const [mensajeTransferencia, setMensajeTransferencia] = useState("");

  const normalizarTexto = (valor = "") =>
    String(valor ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  const tarea = useMemo(
    () => tareaProp || leerTareaActiva(),
    [tareaProp, abierto]
  );
  const ric01Id = tarea?.ric01_id || tarea?.id || null;
  const area = String(areaStock || personal?.area || tarea?.area || "").trim().toUpperCase();
  const personalNombre = personal?.nombre || tarea?.asignado || tarea?.usuario || "";
  const personalId = personal?.id || null;

  const existenciasFiltradas = useMemo(() => {
    const q = normalizarTexto(busqueda);
    if (!q) return existencias;

    return existencias.filter((e) =>
      normalizarTexto([
        e.codigo,
        e.descripcion,
        e.categoria,
        e.unidad
      ].filter(Boolean).join(" ")).includes(q)
    );
  }, [existencias, busqueda]);

  const existenciasOtrasAreas = useMemo(() => {
    const q = normalizarTexto(busqueda);
    if (!q) return [];

    return todasExistencias
      .filter((e) => String(e.area || "").trim().toUpperCase() !== area)
      .filter((e) => Number(e.cantidad || 0) > 0)
      .filter((e) =>
        normalizarTexto([
          e.codigo,
          e.descripcion,
          e.categoria,
          e.unidad,
          e.area
        ].filter(Boolean).join(" ")).includes(q)
      )
      .sort((a, b) => {
        const porDescripcion = String(a.descripcion || "").localeCompare(String(b.descripcion || ""), "es");
        if (porDescripcion !== 0) return porDescripcion;
        return String(a.area || "").localeCompare(String(b.area || ""), "es");
      });
  }, [todasExistencias, busqueda, area]);

  const limpiarTransferencia = () => {
    setTransferencia(null);
    setCantidadTransferencia("");
    setObservacionTransferencia("");
  };

  const cerrar = (forzar = false) => {
    if ((guardando || solicitandoTransferencia) && !forzar) return;
    setAbierto(false);
    setItemId("");
    setCantidad("");
    setSeleccionados([]);
    setBusqueda("");
    setError("");
    setMensajeTransferencia("");
    limpiarTransferencia();
  };

  const abrir = async () => {
    const actual = tareaProp || leerTareaActiva();
    const id = actual?.ric01_id || actual?.id;
    const areaActual = String(areaStock || personal?.area || actual?.area || "").trim().toUpperCase();

    if (!id) {
      alert("No se encontró la tarea de mantenimiento activa.");
      return;
    }

    if (!areaActual) {
      alert("No se pudo determinar el área para consultar el stock.");
      return;
    }

    setAbierto(true);
    setCargando(true);
    setError("");
    setSeleccionados([]);
    setItemId("");
    setCantidad("");
    setBusqueda("");
    setMensajeTransferencia("");
    limpiarTransferencia();

    try {
      const res = await fetch(`${STOCK_API}/existencias`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudieron obtener las existencias");

      const lista = Array.isArray(data) ? data : [];
      setTodasExistencias(lista);

      const disponibles = lista
        .filter((e) => String(e.area || "").trim().toUpperCase() === areaActual)
        .filter((e) => Number(e.cantidad || 0) > 0)
        .sort((a, b) => String(a.descripcion || "").localeCompare(String(b.descripcion || ""), "es"));

      setExistencias(disponibles);
    } catch (err) {
      console.error("Error cargando repuestos RIC:", err);
      setError(err.message || "No se pudieron cargar los repuestos");
    } finally {
      setCargando(false);
    }
  };

  const agregar = () => {
    setError("");
    const id = Number(itemId);
    const cant = Number(cantidad);
    const existencia = existencias.find((e) => Number(e.item_id || e.id) === id);

    if (!existencia) return setError("Seleccione un repuesto.");
    if (!Number.isFinite(cant) || cant <= 0) return setError("Ingrese una cantidad válida.");

    const previo = seleccionados.find((r) => r.item_id === id);
    const total = cant + Number(previo?.cantidad || 0);
    const disponible = Number(existencia.cantidad || 0);

    if (total > disponible) {
      return setError(`Stock insuficiente. Disponible: ${disponible} ${existencia.unidad || ""}`);
    }

    const repuesto = {
      item_id: id,
      codigo: existencia.codigo || "",
      descripcion: existencia.descripcion || "Repuesto",
      unidad: existencia.unidad || "",
      cantidad: total,
      disponible,
    };

    setSeleccionados((actuales) => {
      const existe = actuales.some((r) => r.item_id === id);
      return existe
        ? actuales.map((r) => (r.item_id === id ? repuesto : r))
        : [...actuales, repuesto];
    });

    setItemId("");
    setCantidad("");
  };

  const quitar = (id) => {
    setSeleccionados((actuales) => actuales.filter((r) => r.item_id !== id));
  };

  const confirmar = async () => {
    if (!ric01Id) return setError("No se encontró la tarea de mantenimiento activa.");
    if (!area) return setError("No se pudo determinar el área del mantenimiento.");
    if (seleccionados.length === 0) return setError("Agregue al menos un repuesto.");

    const detalle = seleccionados
      .map((r) => `${r.descripcion}: ${r.cantidad} ${r.unidad || ""}`)
      .join("\n");

    if (!window.confirm(`¿Registrar estos repuestos en el mantenimiento #${ric01Id}?\n\n${detalle}`)) {
      return;
    }

    setGuardando(true);
    setError("");
    let registradosAhora = 0;

    try {
      for (const repuesto of seleccionados) {
        const res = await fetch(`${STOCK_API}/salidas`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            item_id: repuesto.item_id,
            area,
            cantidad: Number(repuesto.cantidad),
            tipo: "CONSUMO",
            ric01_id: Number(ric01Id),
            personal_id: personalId,
            personal_nombre: personalNombre || null,
            observacion: `REPUESTO UTILIZADO EN TAREA / MANTENIMIENTO #${ric01Id}`,
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const prefijo = registradosAhora > 0
            ? `${registradosAhora} repuesto(s) ya fueron registrados. `
            : "";
          throw new Error(prefijo + (data.error || `No se pudo registrar ${repuesto.descripcion}`));
        }

        registradosAhora += 1;
      }

      setRegistrados((n) => n + registradosAhora);
      alert(`✅ ${registradosAhora} repuesto(s) registrado(s) en la tarea / mantenimiento #${ric01Id}`);
      if (typeof onRegistrado === "function") {
        await onRegistrado({ ric01Id: Number(ric01Id), cantidad: registradosAhora });
      }
      cerrar(true);
    } catch (err) {
      console.error("Error registrando repuestos desde RIC:", err);
      setError(err.message || "No se pudieron registrar los repuestos");
    } finally {
      setGuardando(false);
    }
  };


  const solicitarTransferencia = async () => {
    if (!transferencia) return setError("Seleccione una existencia de otra área.");
    if (!area) return setError("No se pudo determinar el área solicitante.");

    const cant = Number(cantidadTransferencia);
    const disponible = Number(transferencia.cantidad || 0);

    if (!Number.isInteger(cant) || cant <= 0) {
      return setError("La cantidad a transferir debe ser un número entero mayor que cero.");
    }

    if (cant > disponible) {
      return setError(`Stock insuficiente en ${transferencia.area}. Disponible: ${disponible} ${transferencia.unidad || ""}`);
    }

    try {
      setSolicitandoTransferencia(true);
      setError("");
      setMensajeTransferencia("");

      const res = await fetch(`${STOCK_API}/transferencias`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_id: Number(transferencia.item_id || transferencia.id),
          cantidad: cant,
          area_origen: String(transferencia.area || "").trim().toUpperCase(),
          area_destino: area,
          solicitado_por_id: personalId,
          solicitado_por_nombre: personalNombre || null,
          observacion: [
            observacionTransferencia.trim(),
            ric01Id ? `SOLICITADO DESDE TAREA / MANTENIMIENTO #${ric01Id}` : ""
          ].filter(Boolean).join(" - ")
        })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "No se pudo solicitar la transferencia.");

      setMensajeTransferencia(
        `✅ Transferencia solicitada a ${transferencia.area}. Queda pendiente de aprobación por el área origen.`
      );
      limpiarTransferencia();
    } catch (err) {
      console.error("Error solicitando transferencia desde RIC:", err);
      setError(err.message || "No se pudo solicitar la transferencia.");
    } finally {
      setSolicitandoTransferencia(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        className="w-full bg-cyan-700 hover:bg-cyan-800 text-white rounded-xl p-3 mt-3 font-bold"
      >
        {etiqueta}{registrados > 0 ? ` (${registrados})` : ""}
      </button>

      {abierto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h2 className="text-lg font-bold text-gray-800">🔩 Repuestos utilizados</h2>
                <p className="text-sm text-gray-600">Tarea / mantenimiento #{ric01Id}</p>
                <p className="text-xs text-gray-500">Stock disponible en {area || "área sin definir"}</p>
              </div>
              <button
                type="button"
                onClick={cerrar}
                disabled={guardando || solicitandoTransferencia}
                className="text-gray-500 hover:text-red-600 font-bold text-xl disabled:opacity-50"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="mb-3 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">
                {error}
              </div>
            )}

            {cargando ? (
              <div className="py-8 text-center text-gray-500">Cargando repuestos...</div>
            ) : (
              <>
                <div className="mb-3">
                  <label className="block text-sm font-semibold mb-1">Buscar repuesto</label>
                  <input
                    type="text"
                    value={busqueda}
                    onChange={(e) => {
                      setBusqueda(e.target.value);
                      setItemId("");
                      limpiarTransferencia();
                      setMensajeTransferencia("");
                    }}
                    placeholder="Código, descripción o categoría..."
                    className="w-full border rounded-xl px-3 py-2"
                    autoFocus
                  />
                </div>

                {mensajeTransferencia && (
                  <div className="mb-3 bg-green-50 border border-green-200 text-green-800 rounded-xl p-3 text-sm">
                    {mensajeTransferencia}
                  </div>
                )}

                {existencias.length === 0 ? (
                  <div className="py-4 text-center text-gray-500 bg-gray-50 rounded-xl">
                    No hay repuestos con stock disponible en {area}.
                  </div>
                ) : existenciasFiltradas.length === 0 ? (
                  <div className="py-4 text-center text-gray-500 bg-gray-50 rounded-xl">
                    No se encontraron coincidencias con stock propio en {area}.
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_110px] gap-2">
                      <select
                        value={itemId}
                        onChange={(e) => setItemId(e.target.value)}
                        className="w-full border rounded-xl px-3 py-2"
                      >
                        <option value="">Seleccionar repuesto</option>
                        {existenciasFiltradas.map((r) => {
                          const id = r.item_id || r.id;
                          return (
                            <option key={`${id}-${r.area}`} value={id}>
                              {r.codigo ? `${r.codigo} · ` : ""}{r.descripcion} — {r.cantidad} {r.unidad}
                            </option>
                          );
                        })}
                      </select>

                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={cantidad}
                        onChange={(e) => setCantidad(e.target.value)}
                        placeholder="Cantidad"
                        className="w-full border rounded-xl px-3 py-2"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={agregar}
                      className="mt-2 w-full bg-cyan-700 hover:bg-cyan-800 text-white font-semibold py-2 rounded-xl"
                    >
                      ＋ Agregar repuesto
                    </button>
                  </>
                )}

                {busqueda.trim() && (
                  <div className="mt-5 border-t pt-4">
                    <div className="mb-2">
                      <p className="font-bold text-gray-800">🔄 Stock disponible en otras áreas</p>
                      <p className="text-xs text-gray-500">
                        Si tu área no dispone del repuesto, podés solicitar una transferencia sin salir del mantenimiento.
                      </p>
                    </div>

                    {existenciasOtrasAreas.length === 0 ? (
                      <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-500 text-center">
                        No hay coincidencias disponibles en otras áreas.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-52 overflow-y-auto">
                        {existenciasOtrasAreas.map((r) => {
                          const id = Number(r.item_id || r.id);
                          const seleccionada =
                            transferencia &&
                            Number(transferencia.item_id || transferencia.id) === id &&
                            String(transferencia.area || "") === String(r.area || "");

                          return (
                            <div
                              key={`${id}-${r.area}`}
                              className={`border rounded-xl p-3 ${seleccionada ? "border-purple-500 bg-purple-50" : "bg-white"}`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="font-semibold text-sm">
                                    {r.codigo ? `${r.codigo} · ` : ""}{r.descripcion}
                                  </p>
                                  <p className="text-xs text-gray-600 mt-1">
                                    Área: <strong>{r.area}</strong> · Disponible: <strong>{r.cantidad} {r.unidad}</strong>
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setTransferencia(r);
                                    setCantidadTransferencia("");
                                    setObservacionTransferencia("");
                                    setError("");
                                  }}
                                  className="shrink-0 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-xl text-xs font-semibold"
                                >
                                  Solicitar
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {transferencia && (
                      <div className="mt-3 border border-purple-300 bg-purple-50 rounded-xl p-3">
                        <p className="font-bold text-purple-900 text-sm">
                          Solicitar desde {transferencia.area}
                        </p>
                        <p className="text-sm text-gray-700 mt-1">
                          {transferencia.codigo ? `${transferencia.codigo} · ` : ""}{transferencia.descripcion}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={cantidadTransferencia}
                            onChange={(e) => setCantidadTransferencia(e.target.value)}
                            placeholder="Cantidad"
                            className="w-full border rounded-xl px-3 py-2 bg-white"
                          />
                          <input
                            type="text"
                            value={observacionTransferencia}
                            onChange={(e) => setObservacionTransferencia(e.target.value)}
                            placeholder="Observación opcional"
                            className="w-full border rounded-xl px-3 py-2 bg-white"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-3">
                          <button
                            type="button"
                            onClick={limpiarTransferencia}
                            disabled={solicitandoTransferencia}
                            className="bg-gray-500 text-white py-2 rounded-xl disabled:opacity-50"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={solicitarTransferencia}
                            disabled={solicitandoTransferencia || !cantidadTransferencia}
                            className="bg-purple-700 hover:bg-purple-800 text-white py-2 rounded-xl font-semibold disabled:bg-gray-300"
                          >
                            {solicitandoTransferencia ? "Solicitando..." : "Confirmar solicitud"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {seleccionados.length > 0 && (
              <div className="mt-4">
                <p className="font-bold text-gray-800 mb-2">Repuestos a utilizar ({seleccionados.length})</p>
                <div className="space-y-2">
                  {seleccionados.map((r) => (
                    <div key={r.item_id} className="border rounded-xl p-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">
                          {r.codigo ? `${r.codigo} · ` : ""}{r.descripcion}
                        </p>
                        <p className="text-sm text-gray-600">
                          Cantidad: <strong>{r.cantidad} {r.unidad}</strong>
                        </p>
                        <p className="text-xs text-gray-500">
                          Disponible: {r.disponible} {r.unidad}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => quitar(r.item_id)}
                        disabled={guardando || solicitandoTransferencia}
                        className="shrink-0 bg-red-600 text-white px-3 py-2 rounded-xl text-sm disabled:opacity-50"
                      >
                        Quitar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                type="button"
                onClick={cerrar}
                disabled={guardando || solicitandoTransferencia}
                className="bg-gray-500 text-white py-2 rounded-xl disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmar}
                disabled={guardando || seleccionados.length === 0}
                className="bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl font-semibold disabled:bg-gray-300"
              >
                {guardando ? "Registrando..." : "Confirmar consumo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
