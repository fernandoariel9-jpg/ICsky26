import { useEffect, useMemo, useState } from "react";

const API = "https://sky26.onrender.com/api/stock";

function formatearFecha(valor) {
  if (!valor) return "-";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return valor;
  return fecha.toLocaleString("es-AR");
}

const inputClass = "w-full border rounded-xl px-3 py-2";

export default function Stock({ setVista, personal }) {
  const [tab, setTab] = useState("catalogo");
  const [categorias, setCategorias] = useState([]);
  const [items, setItems] = useState([]);
  const [existencias, setExistencias] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [busqueda, setBusqueda] = useState("");

  const [mostrarAlta, setMostrarAlta] = useState(false);
  const [mostrarEntrada, setMostrarEntrada] = useState(false);
  const [mostrarSalida, setMostrarSalida] = useState(false);

  const [nuevoItem, setNuevoItem] = useState({
    codigo: "",
    descripcion: "",
    categoria: "",
    unidad: "UNIDAD",
    stock_minimo: 0
  });

  const [entrada, setEntrada] = useState({
    item_id: "",
    area: (personal?.area || "").toUpperCase(),
    cantidad: "",
    observacion: ""
  });

  const [salida, setSalida] = useState({
    item_id: "",
    area: (personal?.area || "").toUpperCase(),
    cantidad: "",
    tipo: "SALIDA",
    ric01_id: "",
    observacion: ""
  });

  const cargarDatos = async () => {
    setCargando(true);
    setError("");

    try {
      const [rCategorias, rItems, rExistencias, rMovimientos] = await Promise.all([
        fetch(`${API}/categorias`, { cache: "no-store" }),
        fetch(`${API}/items`, { cache: "no-store" }),
        fetch(`${API}/existencias`, { cache: "no-store" }),
        fetch(`${API}/movimientos`, { cache: "no-store" })
      ]);

      if (!rCategorias.ok || !rItems.ok || !rExistencias.ok || !rMovimientos.ok) {
        throw new Error("No se pudo obtener la información de stock");
      }

      const [dCategorias, dItems, dExistencias, dMovimientos] = await Promise.all([
        rCategorias.json(),
        rItems.json(),
        rExistencias.json(),
        rMovimientos.json()
      ]);

      setCategorias(Array.isArray(dCategorias) ? dCategorias : []);
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

  const postJSON = async (url, body) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Error al guardar");
    return data;
  };

  const crearItem = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setError("");
    setMensaje("");

    try {
      await postJSON(`${API}/items`, {
        ...nuevoItem,
        stock_minimo: Number(nuevoItem.stock_minimo || 0)
      });

      setNuevoItem({ codigo: "", descripcion: "", categoria: "", unidad: "UNIDAD", stock_minimo: 0 });
      setMostrarAlta(false);
      setMensaje("Artículo creado correctamente");
      await cargarDatos();
      setTab("catalogo");
    } catch (e2) {
      setError(e2.message);
    } finally {
      setGuardando(false);
    }
  };

  const eliminarItem = async (item) => {
    const nombre = `${item.codigo ? `${item.codigo} · ` : ""}${item.descripcion}`;
    if (!window.confirm(`¿ELIMINAR DEFINITIVAMENTE ${nombre}?`)) return;

    setError("");
    setMensaje("");

    try {
      const res = await fetch(`${API}/items/${item.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "No se pudo eliminar el artículo");
      }

      setMensaje("Artículo eliminado correctamente");
      await cargarDatos();
    } catch (e) {
      setError(e.message);
    }
  };

  const registrarEntrada = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setError("");
    setMensaje("");

    try {
      await postJSON(`${API}/entradas`, {
        item_id: Number(entrada.item_id),
        area: entrada.area,
        cantidad: Number(entrada.cantidad),
        personal_id: personal?.id || null,
        personal_nombre: personal?.nombre || null,
        observacion: entrada.observacion
      });

      setEntrada({ item_id: "", area: (personal?.area || "").toUpperCase(), cantidad: "", observacion: "" });
      setMostrarEntrada(false);
      setMensaje("Entrada registrada correctamente");
      await cargarDatos();
      setTab("existencias");
    } catch (e2) {
      setError(e2.message);
    } finally {
      setGuardando(false);
    }
  };

  const registrarSalida = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setError("");
    setMensaje("");

    try {
      await postJSON(`${API}/salidas`, {
        item_id: Number(salida.item_id),
        area: salida.area,
        cantidad: Number(salida.cantidad),
        tipo: salida.tipo,
        ric01_id: salida.tipo === "CONSUMO" ? Number(salida.ric01_id) : null,
        personal_id: personal?.id || null,
        personal_nombre: personal?.nombre || null,
        observacion: salida.observacion
      });

      setSalida({ item_id: "", area: (personal?.area || "").toUpperCase(), cantidad: "", tipo: "SALIDA", ric01_id: "", observacion: "" });
      setMostrarSalida(false);
      setMensaje(salida.tipo === "CONSUMO" ? "Consumo registrado correctamente" : "Salida registrada correctamente");
      await cargarDatos();
      setTab("movimientos");
    } catch (e2) {
      setError(e2.message);
    } finally {
      setGuardando(false);
    }
  };

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

          <div className="flex flex-wrap gap-2">
            <button onClick={() => setMostrarAlta((v) => !v)} className="px-4 py-2 rounded-xl bg-indigo-600 text-white">Nuevo artículo</button>
            <button onClick={() => setMostrarEntrada((v) => !v)} className="px-4 py-2 rounded-xl bg-green-600 text-white">Entrada</button>
            <button onClick={() => setMostrarSalida((v) => !v)} className="px-4 py-2 rounded-xl bg-amber-600 text-white">Salida / consumo</button>
            <button onClick={cargarDatos} className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700">Actualizar</button>
            <button onClick={() => setVista?.("tareas")} className="px-4 py-2 rounded-xl bg-gray-700 text-white hover:bg-gray-800">Volver</button>
          </div>
        </div>

        {mensaje && <div className="mb-4 bg-green-100 text-green-700 border border-green-200 rounded-xl p-3">{mensaje}</div>}
        {error && <div className="mb-4 bg-red-100 text-red-700 border border-red-200 rounded-xl p-3">{error}</div>}

        {mostrarAlta && (
          <form onSubmit={crearItem} className="bg-white rounded-2xl shadow p-4 mb-5 grid grid-cols-1 md:grid-cols-5 gap-3">
            <input className={inputClass} placeholder="Código" value={nuevoItem.codigo} onChange={(e) => setNuevoItem({ ...nuevoItem, codigo: e.target.value.toUpperCase() })} />
            <input className={inputClass} placeholder="Descripción" required value={nuevoItem.descripcion} onChange={(e) => setNuevoItem({ ...nuevoItem, descripcion: e.target.value.toUpperCase() })} />
            <select className={inputClass} required value={nuevoItem.categoria} onChange={(e) => setNuevoItem({ ...nuevoItem, categoria: e.target.value })}>
              <option value="">SELECCIONAR CATEGORÍA</option>
              {categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.nombre}>{categoria.nombre}</option>
              ))}
            </select>
            <input className={inputClass} placeholder="Unidad" value={nuevoItem.unidad} onChange={(e) => setNuevoItem({ ...nuevoItem, unidad: e.target.value.toUpperCase() })} />
            <input className={inputClass} type="number" min="0" step="0.01" placeholder="Stock mínimo" value={nuevoItem.stock_minimo} onChange={(e) => setNuevoItem({ ...nuevoItem, stock_minimo: e.target.value })} />
            <div className="md:col-span-5 flex justify-end">
              <button disabled={guardando} className="px-4 py-2 rounded-xl bg-indigo-600 text-white disabled:opacity-50">Guardar artículo</button>
            </div>
          </form>
        )}

        {mostrarEntrada && (
          <form onSubmit={registrarEntrada} className="bg-white rounded-2xl shadow p-4 mb-5 grid grid-cols-1 md:grid-cols-4 gap-3">
            <select className={inputClass} required value={entrada.item_id} onChange={(e) => setEntrada({ ...entrada, item_id: e.target.value })}>
              <option value="">Seleccionar artículo</option>
              {items.filter((i) => i.activo).map((i) => <option key={i.id} value={i.id}>{i.codigo ? `${i.codigo} · ` : ""}{i.descripcion}</option>)}
            </select>
            <input className={inputClass} required placeholder="Área" value={entrada.area} onChange={(e) => setEntrada({ ...entrada, area: e.target.value.toUpperCase() })} />
            <input className={inputClass} required type="number" min="0.01" step="0.01" placeholder="Cantidad" value={entrada.cantidad} onChange={(e) => setEntrada({ ...entrada, cantidad: e.target.value })} />
            <input className={inputClass} placeholder="Observación" value={entrada.observacion} onChange={(e) => setEntrada({ ...entrada, observacion: e.target.value.toUpperCase() })} />
            <div className="md:col-span-4 flex justify-end">
              <button disabled={guardando} className="px-4 py-2 rounded-xl bg-green-600 text-white disabled:opacity-50">Registrar entrada</button>
            </div>
          </form>
        )}

        {mostrarSalida && (
          <form onSubmit={registrarSalida} className="bg-white rounded-2xl shadow p-4 mb-5 grid grid-cols-1 md:grid-cols-6 gap-3">
            <select className={inputClass} required value={salida.item_id} onChange={(e) => setSalida({ ...salida, item_id: e.target.value })}>
              <option value="">Seleccionar artículo</option>
              {items.filter((i) => i.activo).map((i) => <option key={i.id} value={i.id}>{i.codigo ? `${i.codigo} · ` : ""}{i.descripcion}</option>)}
            </select>
            <input className={inputClass} required placeholder="Área" value={salida.area} onChange={(e) => setSalida({ ...salida, area: e.target.value.toUpperCase() })} />
            <input className={inputClass} required type="number" min="0.01" step="0.01" placeholder="Cantidad" value={salida.cantidad} onChange={(e) => setSalida({ ...salida, cantidad: e.target.value })} />
            <select className={inputClass} value={salida.tipo} onChange={(e) => setSalida({ ...salida, tipo: e.target.value, ric01_id: e.target.value === "CONSUMO" ? salida.ric01_id : "" })}>
              <option value="SALIDA">Salida</option>
              <option value="CONSUMO">Consumo</option>
            </select>
            <input className={inputClass} type="number" min="1" required={salida.tipo === "CONSUMO"} disabled={salida.tipo !== "CONSUMO"} placeholder="RIC01 ID" value={salida.ric01_id} onChange={(e) => setSalida({ ...salida, ric01_id: e.target.value })} />
            <input className={inputClass} placeholder="Observación" value={salida.observacion} onChange={(e) => setSalida({ ...salida, observacion: e.target.value.toUpperCase() })} />
            <div className="md:col-span-6 flex justify-end">
              <button disabled={guardando} className="px-4 py-2 rounded-xl bg-amber-600 text-white disabled:opacity-50">Registrar {salida.tipo === "CONSUMO" ? "consumo" : "salida"}</button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <div className="bg-white rounded-2xl shadow p-4"><div className="text-sm text-gray-500">Artículos</div><div className="text-3xl font-bold text-gray-800">{items.length}</div></div>
          <div className="bg-white rounded-2xl shadow p-4"><div className="text-sm text-gray-500">Existencias registradas</div><div className="text-3xl font-bold text-gray-800">{existencias.length}</div></div>
          <div className="bg-white rounded-2xl shadow p-4"><div className="text-sm text-gray-500">Stock bajo</div><div className="text-3xl font-bold text-red-600">{existencias.filter((e) => e.stock_bajo).length}</div></div>
        </div>

        <div className="bg-white rounded-2xl shadow p-4 mb-5">
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {[["catalogo", "Catálogo"], ["existencias", "Existencias"], ["movimientos", "Movimientos"]].map(([valor, etiqueta]) => (
                <button key={valor} onClick={() => setTab(valor)} className={`px-4 py-2 rounded-xl font-semibold ${tab === valor ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>{etiqueta}</button>
              ))}
            </div>
            <input value={busqueda} onChange={(e) => setBusqueda(e.target.value.toUpperCase())} placeholder="Buscar..." className="w-full lg:w-80 border rounded-xl px-4 py-2" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow overflow-hidden">
          {cargando ? (
            <div className="p-8 text-center text-gray-500">Cargando stock...</div>
          ) : datos.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Sin registros para mostrar.</div>
          ) : tab === "catalogo" ? (
            <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-gray-50 text-gray-600"><tr><th className="text-left p-3">Código</th><th className="text-left p-3">Descripción</th><th className="text-left p-3">Categoría</th><th className="text-left p-3">Unidad</th><th className="text-right p-3">Stock mínimo</th><th className="text-center p-3">Estado</th><th className="text-center p-3">Acciones</th></tr></thead><tbody>{datos.map((item) => <tr key={item.id} className="border-t"><td className="p-3 font-medium">{item.codigo || "-"}</td><td className="p-3">{item.descripcion}</td><td className="p-3">{item.categoria || "-"}</td><td className="p-3">{item.unidad}</td><td className="p-3 text-right">{item.stock_minimo}</td><td className="p-3 text-center"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${item.activo ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"}`}>{item.activo ? "Activo" : "Inactivo"}</span></td><td className="p-3 text-center"><button onClick={() => eliminarItem(item)} className="px-3 py-1 rounded-lg bg-red-600 text-white hover:bg-red-700">Eliminar</button></td></tr>)}</tbody></table></div>
          ) : tab === "existencias" ? (
            <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-gray-50 text-gray-600"><tr><th className="text-left p-3">Código</th><th className="text-left p-3">Descripción</th><th className="text-left p-3">Área</th><th className="text-right p-3">Cantidad</th><th className="text-right p-3">Mínimo</th><th className="text-center p-3">Estado</th></tr></thead><tbody>{datos.map((e) => <tr key={e.id} className="border-t"><td className="p-3 font-medium">{e.codigo || "-"}</td><td className="p-3">{e.descripcion}</td><td className="p-3">{e.area}</td><td className="p-3 text-right font-semibold">{e.cantidad} {e.unidad}</td><td className="p-3 text-right">{e.stock_minimo}</td><td className="p-3 text-center"><span className={`px-2 py-1 rounded-full text-xs font-semibold ${e.stock_bajo ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>{e.stock_bajo ? "Stock bajo" : "Normal"}</span></td></tr>)}</tbody></table></div>
          ) : (
            <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-gray-50 text-gray-600"><tr><th className="text-left p-3">Fecha</th><th className="text-left p-3">Tipo</th><th className="text-left p-3">Artículo</th><th className="text-right p-3">Cantidad</th><th className="text-left p-3">Origen</th><th className="text-left p-3">Destino</th><th className="text-left p-3">Personal</th><th className="text-left p-3">Referencia</th></tr></thead><tbody>{datos.map((m) => <tr key={m.id} className="border-t"><td className="p-3 whitespace-nowrap">{formatearFecha(m.fecha)}</td><td className="p-3 font-semibold">{m.tipo}</td><td className="p-3">{m.codigo ? `${m.codigo} · ` : ""}{m.descripcion}</td><td className="p-3 text-right">{m.cantidad} {m.unidad}</td><td className="p-3">{m.area_origen || "-"}</td><td className="p-3">{m.area_destino || "-"}</td><td className="p-3">{m.personal_nombre || "-"}</td><td className="p-3">{m.referencia_tipo && m.referencia_id ? `${m.referencia_tipo} #${m.referencia_id}` : "-"}</td></tr>)}</tbody></table></div>
          )}
        </div>
      </div>
    </div>
  );
}
