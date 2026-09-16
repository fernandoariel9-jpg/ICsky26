import { useEffect, useMemo, useState } from "react";

const API = "https://sky26.onrender.com/api/stock";

function formatearFecha(valor) {
  if (!valor) return "-";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return valor;
  return fecha.toLocaleString("es-AR");
}

export default function Stock({ setVista }) {
  const [tab, setTab] = useState("catalogo");
  const [items, setItems] = useState([]);
  const [existencias, setExistencias] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");

  const cargarDatos = async () => {
    setCargando(true);
    setError("");

    try {
      const [rItems, rExistencias, rMovimientos] = await Promise.all([
        fetch(`${API}/items`, { cache: "no-store" }),
        fetch(`${API}/existencias`, { cache: "no-store" }),
        fetch(`${API}/movimientos`, { cache: "no-store" })
      ]);

      if (!rItems.ok || !rExistencias.ok || !rMovimientos.ok) {
        throw new Error("No se pudo obtener la información de stock");
      }

      const [dItems, dExistencias, dMovimientos] = await Promise.all([
        rItems.json(),
        rExistencias.json(),
        rMovimientos.json()
      ]);

      setItems(Array.isArray(dItems) ? dItems : []);
      setExistencias(Array.isArray(dExistencias) ? dExistencias : []);
      setMovimientos(Array.isArray(dMovimientos) ? dMovimientos : []);
    } catch (e) {
      console.error(e);
      setError(e.message || "Error al cargar stock");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const filtrar = (lista) => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return lista;

    return lista.filter((fila) =>
      Object.values(fila || {}).some((valor) =>
        String(valor ?? "").toLowerCase().includes(texto)
      )
    );
  };

  const datos = useMemo(() => {
    if (tab === "catalogo") return filtrar(items);
    if (tab === "existencias") return filtrar(existencias);
    return filtrar(movimientos);
  }, [tab, items, existencias, movimientos, busqueda]);

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Stock</h1>
            <p className="text-gray-500">Repuestos e insumos de Ingeniería Clínica</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={cargarDatos}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
            >
              Actualizar
            </button>
            <button
              onClick={() => setVista?.("tareas")}
              className="px-4 py-2 rounded-xl bg-gray-700 text-white hover:bg-gray-800"
            >
              Volver
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <div className="bg-white rounded-2xl shadow p-4">
            <div className="text-sm text-gray-500">Artículos</div>
            <div className="text-3xl font-bold text-gray-800">{items.length}</div>
          </div>
          <div className="bg-white rounded-2xl shadow p-4">
            <div className="text-sm text-gray-500">Existencias registradas</div>
            <div className="text-3xl font-bold text-gray-800">{existencias.length}</div>
          </div>
          <div className="bg-white rounded-2xl shadow p-4">
            <div className="text-sm text-gray-500">Stock bajo</div>
            <div className="text-3xl font-bold text-red-600">
              {existencias.filter((e) => e.stock_bajo).length}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow p-4 mb-5">
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {[
                ["catalogo", "Catálogo"],
                ["existencias", "Existencias"],
                ["movimientos", "Movimientos"]
              ].map(([valor, etiqueta]) => (
                <button
                  key={valor}
                  onClick={() => setTab(valor)}
                  className={`px-4 py-2 rounded-xl font-semibold ${
                    tab === valor
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {etiqueta}
                </button>
              ))}
            </div>

            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar..."
              className="w-full lg:w-80 border rounded-xl px-4 py-2"
            />
          </div>
        </div>

        {error && (
          <div className="mb-5 bg-red-100 text-red-700 border border-red-200 rounded-xl p-3">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow overflow-hidden">
          {cargando ? (
            <div className="p-8 text-center text-gray-500">Cargando stock...</div>
          ) : datos.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Sin registros para mostrar.</div>
          ) : tab === "catalogo" ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left p-3">Código</th>
                    <th className="text-left p-3">Descripción</th>
                    <th className="text-left p-3">Categoría</th>
                    <th className="text-left p-3">Unidad</th>
                    <th className="text-right p-3">Stock mínimo</th>
                    <th className="text-center p-3">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {datos.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="p-3 font-medium">{item.codigo || "-"}</td>
                      <td className="p-3">{item.descripcion}</td>
                      <td className="p-3">{item.categoria || "-"}</td>
                      <td className="p-3">{item.unidad}</td>
                      <td className="p-3 text-right">{item.stock_minimo}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${item.activo ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"}`}>
                          {item.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : tab === "existencias" ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left p-3">Código</th>
                    <th className="text-left p-3">Descripción</th>
                    <th className="text-left p-3">Área</th>
                    <th className="text-right p-3">Cantidad</th>
                    <th className="text-right p-3">Mínimo</th>
                    <th className="text-center p-3">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {datos.map((e) => (
                    <tr key={e.id} className="border-t">
                      <td className="p-3 font-medium">{e.codigo || "-"}</td>
                      <td className="p-3">{e.descripcion}</td>
                      <td className="p-3">{e.area}</td>
                      <td className="p-3 text-right font-semibold">{e.cantidad} {e.unidad}</td>
                      <td className="p-3 text-right">{e.stock_minimo}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${e.stock_bajo ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                          {e.stock_bajo ? "Stock bajo" : "Normal"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left p-3">Fecha</th>
                    <th className="text-left p-3">Tipo</th>
                    <th className="text-left p-3">Artículo</th>
                    <th className="text-right p-3">Cantidad</th>
                    <th className="text-left p-3">Origen</th>
                    <th className="text-left p-3">Destino</th>
                    <th className="text-left p-3">Personal</th>
                    <th className="text-left p-3">Referencia</th>
                  </tr>
                </thead>
                <tbody>
                  {datos.map((m) => (
                    <tr key={m.id} className="border-t">
                      <td className="p-3 whitespace-nowrap">{formatearFecha(m.fecha)}</td>
                      <td className="p-3 font-semibold">{m.tipo}</td>
                      <td className="p-3">{m.codigo ? `${m.codigo} · ` : ""}{m.descripcion}</td>
                      <td className="p-3 text-right">{m.cantidad} {m.unidad}</td>
                      <td className="p-3">{m.area_origen || "-"}</td>
                      <td className="p-3">{m.area_destino || "-"}</td>
                      <td className="p-3">{m.personal_nombre || "-"}</td>
                      <td className="p-3">
                        {m.referencia_tipo && m.referencia_id
                          ? `${m.referencia_tipo} #${m.referencia_id}`
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
