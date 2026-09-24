import { useEffect, useMemo, useState } from "react";
import { API_URL } from "./config";

const API = "https://sky26.onrender.com/api/stock";

function formatearFecha(valor) {
  if (!valor) return "-";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return valor;
  return fecha.toLocaleString("es-AR");
}

function entero(valor) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? Math.trunc(numero) : 0;
}

function normalizarTexto(valor = "") {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function itemActivo(item) {
  const valor = item?.activo;
  return !(
    valor === false ||
    valor === 0 ||
    valor === "0" ||
    normalizarTexto(valor) === "false" ||
    normalizarTexto(valor) === "inactivo"
  );
}

function similitudTexto(a, b) {
  const textoA = normalizarTexto(a).replace(/\s+/g, " ");
  const textoB = normalizarTexto(b).replace(/\s+/g, " ");

  if (!textoA || !textoB) return 0;
  if (textoA === textoB) return 1;

  const menor = textoA.length <= textoB.length ? textoA : textoB;
  const mayor = textoA.length > textoB.length ? textoA : textoB;
  if (menor.length >= 5 && mayor.includes(menor)) return 0.9;
  if (menor.length < 4) return 0;

  const pares = (texto) => {
    const limpio = texto.replace(/\s/g, "");
    const resultado = [];
    for (let i = 0; i < limpio.length - 1; i += 1) resultado.push(limpio.slice(i, i + 2));
    return resultado;
  };

  const paresA = pares(textoA);
  const paresB = pares(textoB);
  if (!paresA.length || !paresB.length) return 0;

  const disponibles = [...paresB];
  let comunes = 0;
  paresA.forEach((par) => {
    const indice = disponibles.indexOf(par);
    if (indice !== -1) {
      comunes += 1;
      disponibles.splice(indice, 1);
    }
  });

  return (2 * comunes) / (paresA.length + paresB.length);
}

function buscarArticulosSimilares(nuevo, lista) {
  const codigoNuevo = normalizarTexto(nuevo?.codigo);
  const descripcionNueva = normalizarTexto(nuevo?.descripcion);
  const categoriaNueva = normalizarTexto(nuevo?.categoria);

  if (!codigoNuevo && descripcionNueva.length < 4) return [];

  return lista
    .map((item) => {
      const codigoExistente = normalizarTexto(item.codigo);
      const descripcionExistente = normalizarTexto(item.descripcion);
      const categoriaExistente = normalizarTexto(item.categoria);

      const codigoExacto = Boolean(codigoNuevo && codigoExistente && codigoNuevo === codigoExistente);
      const descripcionExacta = Boolean(descripcionNueva && descripcionExistente && descripcionNueva === descripcionExistente);
      let similitud = similitudTexto(descripcionNueva, descripcionExistente);

      if (categoriaNueva && categoriaExistente && categoriaNueva === categoriaExistente && similitud >= 0.55) {
        similitud = Math.min(1, similitud + 0.05);
      }

      const coincide = codigoExacto || descripcionExacta || similitud >= 0.72;
      if (!coincide) return null;

      return {
        ...item,
        similitud: codigoExacto || descripcionExacta ? 1 : similitud,
        motivo: codigoExacto
          ? "Mismo código"
          : descripcionExacta
            ? "Misma descripción"
            : "Descripción similar"
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.similitud - a.similitud)
    .slice(0, 5);
}

const inputClass = "w-full border rounded-xl px-3 py-2";
const actionButtonClass = "h-10 w-full sm:w-40 px-3 rounded-xl font-semibold inline-flex items-center justify-center whitespace-nowrap";
const formButtonClass = "h-10 min-w-40 px-4 rounded-xl font-semibold inline-flex items-center justify-center disabled:opacity-50";
const tableButtonClass = "h-8 min-w-20 px-3 rounded-lg font-semibold inline-flex items-center justify-center";

export default function Stock({ setVista, personal }) {
  const [tab, setTab] = useState("catalogo");
  const [categorias, setCategorias] = useState([]);
  const [areas, setAreas] = useState([]);
  const [items, setItems] = useState([]);
  const [existencias, setExistencias] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [transferencias, setTransferencias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [busquedaEntrada, setBusquedaEntrada] = useState("");
  const [busquedaSalida, setBusquedaSalida] = useState("");

  const [mostrarAlta, setMostrarAlta] = useState(false);
  const [mostrarEntrada, setMostrarEntrada] = useState(false);
  const [mostrarSalida, setMostrarSalida] = useState(false);
  const [mostrarTransferencia, setMostrarTransferencia] = useState(false);

  const [kpiActivo, setKpiActivo] = useState(null);
  const [existenciaAjuste, setExistenciaAjuste] = useState(null);
  const [ajuste, setAjuste] = useState({ nueva_cantidad: "", observacion: "" });

  const areaPersonal = (personal?.area || "").trim().toUpperCase();

  const [nuevoItem, setNuevoItem] = useState({ codigo: "", descripcion: "", categoria: "", unidad: "UNIDAD", stock_minimo: 0 });
  const [entrada, setEntrada] = useState({ item_id: "", area: areaPersonal, cantidad: "", observacion: "" });
  const [salida, setSalida] = useState({ item_id: "", area: areaPersonal, cantidad: "", tipo: "SALIDA", ric01_id: "", observacion: "" });
  const [transferencia, setTransferencia] = useState({ item_id: "", cantidad: "", area_origen: "", area_destino: areaPersonal, observacion: "" });

  const similaresNuevoItem = useMemo(
    () => buscarArticulosSimilares(nuevoItem, items),
    [nuevoItem.codigo, nuevoItem.descripcion, nuevoItem.categoria, items]
  );

  const cargarDatos = async () => {
    setCargando(true);
    setError("");
    try {
      const [rCategorias, rAreas, rItems, rExistencias, rMovimientos, rTransferencias] = await Promise.all([
        fetch(`${API}/categorias`, { cache: "no-store" }),
        fetch(API_URL.Areas, { cache: "no-store" }),
        fetch(`${API}/items`, { cache: "no-store" }),
        fetch(`${API}/existencias`, { cache: "no-store" }),
        fetch(`${API}/movimientos`, { cache: "no-store" }),
        fetch(`${API}/transferencias`, { cache: "no-store" })
      ]);

      if (!rCategorias.ok || !rAreas.ok || !rItems.ok || !rExistencias.ok || !rMovimientos.ok || !rTransferencias.ok) throw new Error("No se pudo obtener la información de stock");

      const [dCategorias, dAreas, dItems, dExistencias, dMovimientos, dTransferencias] = await Promise.all([
        rCategorias.json(), rAreas.json(), rItems.json(), rExistencias.json(), rMovimientos.json(), rTransferencias.json()
      ]);

      setCategorias(Array.isArray(dCategorias) ? dCategorias : []);
      setAreas(Array.isArray(dAreas) ? dAreas : []);
      setItems(Array.isArray(dItems) ? dItems : []);
      setExistencias(Array.isArray(dExistencias) ? dExistencias : []);
      setMovimientos(Array.isArray(dMovimientos) ? dMovimientos : []);
      setTransferencias(Array.isArray(dTransferencias) ? dTransferencias : []);
    } catch (e) {
      console.error(e);
      setError(e.message || "Error al cargar stock");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarDatos(); }, []);

  const postJSON = async (url, body, method = "POST") => {
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Error al guardar");
    return data;
  };

  const crearItem = async (e) => {
    e.preventDefault();
    setError("");
    setMensaje("");

    if (similaresNuevoItem.length > 0) {
      const detalle = similaresNuevoItem
        .map((item) => `${item.codigo ? `${item.codigo} · ` : ""}${item.descripcion} (${item.motivo})`)
        .join("\n");
      const continuar = window.confirm(
        `⚠ Se encontraron artículos similares:\n\n${detalle}\n\n¿Desea guardar el nuevo artículo de todas maneras?`
      );
      if (!continuar) return;
    }

    setGuardando(true);
    try {
      await postJSON(`${API}/items`, { ...nuevoItem, stock_minimo: entero(nuevoItem.stock_minimo || 0) });
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
    setError(""); setMensaje("");
    try {
      const res = await fetch(`${API}/items/${item.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "No se pudo eliminar el artículo");
      setMensaje("Artículo eliminado correctamente");
      await cargarDatos();
    } catch (e) { setError(e.message); }
  };

  const registrarEntrada = async (e) => {
    e.preventDefault(); setGuardando(true); setError(""); setMensaje("");
    try {
      await postJSON(`${API}/entradas`, { item_id: Number(entrada.item_id), area: entrada.area, cantidad: entero(entrada.cantidad), personal_id: personal?.id || null, personal_nombre: personal?.nombre || null, observacion: entrada.observacion });
      setEntrada({ item_id: "", area: areaPersonal, cantidad: "", observacion: "" });
      setBusquedaEntrada(""); setMostrarEntrada(false); setMensaje("Entrada registrada correctamente");
      await cargarDatos(); setTab("existencias");
    } catch (e2) { setError(e2.message); } finally { setGuardando(false); }
  };

  const registrarSalida = async (e) => {
    e.preventDefault(); setGuardando(true); setError(""); setMensaje("");
    try {
      await postJSON(`${API}/salidas`, { item_id: Number(salida.item_id), area: salida.area, cantidad: entero(salida.cantidad), tipo: salida.tipo, ric01_id: salida.tipo === "CONSUMO" ? Number(salida.ric01_id) : null, personal_id: personal?.id || null, personal_nombre: personal?.nombre || null, observacion: salida.observacion });
      setSalida({ item_id: "", area: areaPersonal, cantidad: "", tipo: "SALIDA", ric01_id: "", observacion: "" });
      setBusquedaSalida(""); setMostrarSalida(false); setMensaje(salida.tipo === "CONSUMO" ? "Consumo registrado correctamente" : "Salida registrada correctamente");
      await cargarDatos(); setTab("movimientos");
    } catch (e2) { setError(e2.message); } finally { setGuardando(false); }
  };

  const solicitarTransferencia = async (e) => {
    e.preventDefault(); setGuardando(true); setError(""); setMensaje("");
    try {
      await postJSON(`${API}/transferencias`, { item_id: Number(transferencia.item_id), cantidad: entero(transferencia.cantidad), area_origen: transferencia.area_origen, area_destino: transferencia.area_destino, solicitado_por_id: personal?.id || null, solicitado_por_nombre: personal?.nombre || null, observacion: transferencia.observacion });
      setTransferencia({ item_id: "", cantidad: "", area_origen: "", area_destino: areaPersonal, observacion: "" });
      setMostrarTransferencia(false); setMensaje("Transferencia solicitada correctamente"); await cargarDatos(); setTab("transferencias");
    } catch (e2) { setError(e2.message); } finally { setGuardando(false); }
  };

  const resolverTransferencia = async (t, accion) => {
    const verbo = accion === "APROBAR" ? "APROBAR" : "RECHAZAR";
    if (!window.confirm(`¿${verbo} TRANSFERENCIA #${t.id}?`)) return;
    setError(""); setMensaje("");
    try {
      await postJSON(`${API}/transferencias/${t.id}/resolver`, { accion, aprobado_por_id: personal?.id || null, aprobado_por_nombre: personal?.nombre || null, aprobado_por_area: areaPersonal }, "PUT");
      setMensaje(accion === "APROBAR" ? "Transferencia aprobada" : "Transferencia rechazada"); await cargarDatos(); setTab("transferencias");
    } catch (e) { setError(e.message); }
  };

  const abrirAjuste = (existencia) => { setExistenciaAjuste(existencia); setAjuste({ nueva_cantidad: String(entero(existencia.cantidad)), observacion: "" }); };

  const guardarAjuste = async (e) => {
    e.preventDefault(); if (!existenciaAjuste) return; setGuardando(true); setError(""); setMensaje("");
    try {
      await postJSON(`${API}/existencias/ajustar`, { existencia_id: existenciaAjuste.id, nueva_cantidad: entero(ajuste.nueva_cantidad), personal_id: personal?.id || null, personal_nombre: personal?.nombre || null, observacion: ajuste.observacion }, "PUT");
      setExistenciaAjuste(null); setAjuste({ nueva_cantidad: "", observacion: "" }); setMensaje("Ajuste de stock registrado correctamente"); await cargarDatos(); setKpiActivo("existencias");
    } catch (e2) { setError(e2.message); } finally { setGuardando(false); }
  };

  const filtrar = (lista) => {
    const texto = normalizarTexto(busqueda);
    if (!texto) return lista;
    return lista.filter((fila) => Object.values(fila || {}).some((valor) => normalizarTexto(valor).includes(texto)));
  };

  const filtrarItems = (texto) => {
    const termino = normalizarTexto(texto);
    return items.filter((item) => {
      if (!itemActivo(item)) return false;
      if (!termino) return true;
      const contenido = normalizarTexto([item.codigo, item.descripcion, item.categoria, item.unidad].filter(Boolean).join(" "));
      return contenido.includes(termino);
    });
  };

  const itemsEntrada = useMemo(() => filtrarItems(busquedaEntrada), [items, busquedaEntrada]);
  const itemsSalida = useMemo(() => filtrarItems(busquedaSalida), [items, busquedaSalida]);
  const existenciasArea = useMemo(() => existencias.filter((e) => String(e.area || "").trim().toUpperCase() === areaPersonal), [existencias, areaPersonal]);
  const stockBajoArea = useMemo(() => existenciasArea.filter((e) => e.stock_bajo), [existenciasArea]);
  const transferenciasPendientes = useMemo(() => transferencias.filter((t) => t.estado === "PENDIENTE"), [transferencias]);

  const datos = useMemo(() => {
    if (tab === "catalogo") return filtrar(items);
    if (tab === "existencias") return filtrar(existenciasArea);
    if (tab === "transferencias") return filtrar(transferencias);
    return filtrar(movimientos);
  }, [tab, items, existenciasArea, movimientos, transferencias, busqueda]);

  const kpiConfig = {
    articulos: { titulo: "Artículos", lista: items },
    existencias: { titulo: `Existencias de ${areaPersonal || "mi área"}`, lista: existenciasArea },
    bajo: { titulo: "Stock bajo", lista: stockBajoArea },
    transferencias: { titulo: "Transferencias pendientes", lista: transferenciasPendientes }
  };
  const kpiSeleccionado = kpiActivo ? kpiConfig[kpiActivo] : null;

  const renderListaKpi = () => {
    if (!kpiSeleccionado) return null;
    const lista = kpiSeleccionado.lista;
    if (lista.length === 0) return <div className="p-6 text-center text-gray-500">No hay registros para mostrar.</div>;
    if (kpiActivo === "articulos") return <div className="divide-y">{lista.map((item) => <div key={item.id} className="p-3"><div className="font-semibold">{item.codigo ? `${item.codigo} · ` : ""}{item.descripcion}</div><div className="text-sm text-gray-500">{item.categoria || "Sin categoría"} · {item.unidad} · Mínimo: {entero(item.stock_minimo)}</div></div>)}</div>;
    if (kpiActivo === "existencias" || kpiActivo === "bajo") return <div className="divide-y">{lista.map((e) => <div key={e.id} className="p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"><div><div className="font-semibold">{e.codigo ? `${e.codigo} · ` : ""}{e.descripcion}</div><div className="text-sm text-gray-500">{e.area} · {entero(e.cantidad)} {e.unidad} · Mínimo: {entero(e.stock_minimo)}</div>{e.stock_bajo && <div className="text-sm font-semibold text-red-600">Stock bajo</div>}</div>{kpiActivo === "existencias" && <button onClick={() => abrirAjuste(e)} className="px-3 py-2 rounded-lg bg-amber-600 text-white font-semibold">Ajustar</button>}</div>)}</div>;
    return <div className="divide-y">{lista.map((t) => <div key={t.id} className="p-3"><div className="font-semibold">#{t.id} · {t.codigo ? `${t.codigo} · ` : ""}{t.descripcion}</div><div className="text-sm text-gray-500">{entero(t.cantidad)} {t.unidad} · {t.area_origen} → {t.area_destino}</div><div className="text-sm text-gray-500">Solicitado por: {t.solicitado_por_nombre || "-"} · {formatearFecha(t.fecha_solicitud)}</div></div>)}</div>;
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
          <div><h1 className="text-3xl font-bold text-gray-800">Stock</h1><p className="text-gray-500">Repuestos e insumos de Ingeniería Clínica</p></div>
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 w-full md:w-auto">
            <button onClick={() => setMostrarAlta((v) => !v)} className={`${actionButtonClass} bg-indigo-600 text-white`}>Nuevo artículo</button>
            <button onClick={() => { setMostrarEntrada((v) => !v); setBusquedaEntrada(""); }} className={`${actionButtonClass} bg-green-600 text-white`}>Entrada</button>
            <button onClick={() => { setMostrarSalida((v) => !v); setBusquedaSalida(""); }} className={`${actionButtonClass} bg-amber-600 text-white`}>Salida / consumo</button>
            <button onClick={() => setMostrarTransferencia((v) => !v)} className={`${actionButtonClass} bg-purple-600 text-white`}>Transferir</button>
            <button onClick={cargarDatos} className={`${actionButtonClass} bg-blue-600 text-white hover:bg-blue-700`}>Actualizar</button>
            <button onClick={() => setVista?.("tareas")} className={`${actionButtonClass} bg-gray-700 text-white hover:bg-gray-800`}>Volver</button>
          </div>
        </div>

        {mensaje && <div className="mb-4 bg-green-100 text-green-700 border border-green-200 rounded-xl p-3">{mensaje}</div>}
        {error && <div className="mb-4 bg-red-100 text-red-700 border border-red-200 rounded-xl p-3">{error}</div>}

        {mostrarAlta && (
          <form onSubmit={crearItem} className="bg-white rounded-2xl shadow p-4 mb-5 grid grid-cols-1 md:grid-cols-5 gap-3">
            <input className={inputClass} placeholder="Código" value={nuevoItem.codigo} onChange={(e) => setNuevoItem({ ...nuevoItem, codigo: e.target.value.toUpperCase() })} />
            <input className={inputClass} placeholder="Descripción" required value={nuevoItem.descripcion} onChange={(e) => setNuevoItem({ ...nuevoItem, descripcion: e.target.value.toUpperCase() })} />
            <select className={inputClass} required value={nuevoItem.categoria} onChange={(e) => setNuevoItem({ ...nuevoItem, categoria: e.target.value })}><option value="">SELECCIONAR CATEGORÍA</option>{categorias.map((categoria) => <option key={categoria.id} value={categoria.nombre}>{categoria.nombre}</option>)}</select>
            <input className={inputClass} placeholder="Unidad" value={nuevoItem.unidad} onChange={(e) => setNuevoItem({ ...nuevoItem, unidad: e.target.value.toUpperCase() })} />
            <input className={inputClass} type="number" min="0" step="1" placeholder="Stock mínimo" value={nuevoItem.stock_minimo} onChange={(e) => setNuevoItem({ ...nuevoItem, stock_minimo: e.target.value })} />

            {similaresNuevoItem.length > 0 && (
              <div className="md:col-span-5 rounded-xl border border-amber-300 bg-amber-50 p-3 text-amber-900">
                <div className="font-bold mb-2">⚠ Posibles artículos duplicados o similares</div>
                <div className="space-y-1">
                  {similaresNuevoItem.map((item) => (
                    <div key={item.id} className="text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border-t border-amber-200 first:border-t-0 pt-1 first:pt-0">
                      <span><strong>{item.codigo || "SIN CÓDIGO"}</strong> · {item.descripcion}{item.categoria ? ` · ${item.categoria}` : ""}</span>
                      <span className="font-semibold whitespace-nowrap">{item.motivo} · {Math.round(item.similitud * 100)}%</span>
                    </div>
                  ))}
                </div>
                <div className="text-xs mt-2">Revise estos artículos antes de crear uno nuevo. Si continúa, se pedirá confirmación.</div>
              </div>
            )}

            <div className="md:col-span-5 flex justify-end"><button disabled={guardando} className={`${formButtonClass} bg-indigo-600 text-white`}>Guardar artículo</button></div>
          </form>
        )}

        {mostrarEntrada && (
          <form onSubmit={registrarEntrada} className="bg-white rounded-2xl shadow p-4 mb-5 grid grid-cols-1 md:grid-cols-4 gap-3">
            <input className={`${inputClass} md:col-span-4`} placeholder="Buscar artículo por código, descripción o categoría..." value={busquedaEntrada} onChange={(e) => { setBusquedaEntrada(e.target.value); setEntrada({ ...entrada, item_id: "" }); }} />
            <select className={inputClass} required value={entrada.item_id} onChange={(e) => setEntrada({ ...entrada, item_id: e.target.value })}><option value="">{itemsEntrada.length ? "Seleccionar artículo" : "Sin coincidencias"}</option>{itemsEntrada.map((i) => <option key={i.id} value={i.id}>{i.codigo ? `${i.codigo} · ` : ""}{i.descripcion}{i.categoria ? ` · ${i.categoria}` : ""}</option>)}</select>
            <input className={inputClass} required placeholder="Área" value={entrada.area} onChange={(e) => setEntrada({ ...entrada, area: e.target.value.toUpperCase() })} />
            <input className={inputClass} required type="number" min="1" step="1" placeholder="Cantidad" value={entrada.cantidad} onChange={(e) => setEntrada({ ...entrada, cantidad: e.target.value })} />
            <input className={inputClass} placeholder="Observación" value={entrada.observacion} onChange={(e) => setEntrada({ ...entrada, observacion: e.target.value.toUpperCase() })} />
            <div className="md:col-span-4 flex justify-end"><button disabled={guardando} className={`${formButtonClass} bg-green-600 text-white`}>Registrar entrada</button></div>
          </form>
        )}

        {mostrarSalida && (
          <form onSubmit={registrarSalida} className="bg-white rounded-2xl shadow p-4 mb-5 grid grid-cols-1 md:grid-cols-6 gap-3">
            <input className={`${inputClass} md:col-span-6`} placeholder="Buscar artículo por código, descripción o categoría..." value={busquedaSalida} onChange={(e) => { setBusquedaSalida(e.target.value); setSalida({ ...salida, item_id: "" }); }} />
            <select className={inputClass} required value={salida.item_id} onChange={(e) => setSalida({ ...salida, item_id: e.target.value })}><option value="">{itemsSalida.length ? "Seleccionar artículo" : "Sin coincidencias"}</option>{itemsSalida.map((i) => <option key={i.id} value={i.id}>{i.codigo ? `${i.codigo} · ` : ""}{i.descripcion}{i.categoria ? ` · ${i.categoria}` : ""}</option>)}</select>
            <input className={inputClass} required placeholder="Área" value={salida.area} onChange={(e) => setSalida({ ...salida, area: e.target.value.toUpperCase() })} />
            <input className={inputClass} required type="number" min="1" step="1" placeholder="Cantidad" value={salida.cantidad} onChange={(e) => setSalida({ ...salida, cantidad: e.target.value })} />
            <select className={inputClass} value={salida.tipo} onChange={(e) => setSalida({ ...salida, tipo: e.target.value, ric01_id: e.target.value === "CONSUMO" ? salida.ric01_id : "" })}><option value="SALIDA">Salida</option><option value="CONSUMO">Consumo</option></select>
            <input className={inputClass} type="number" min="1" step="1" required={salida.tipo === "CONSUMO"} disabled={salida.tipo !== "CONSUMO"} placeholder="RIC01 ID" value={salida.ric01_id} onChange={(e) => setSalida({ ...salida, ric01_id: e.target.value })} />
            <input className={inputClass} placeholder="Observación" value={salida.observacion} onChange={(e) => setSalida({ ...salida, observacion: e.target.value.toUpperCase() })} />
            <div className="md:col-span-6 flex justify-end"><button disabled={guardando} className={`${formButtonClass} bg-amber-600 text-white`}>Registrar {salida.tipo === "CONSUMO" ? "consumo" : "salida"}</button></div>
          </form>
        )}

        {mostrarTransferencia && (
          <form onSubmit={solicitarTransferencia} className="bg-white rounded-2xl shadow p-4 mb-5 grid grid-cols-1 md:grid-cols-5 gap-3">
            <select className={inputClass} required value={transferencia.item_id} onChange={(e) => setTransferencia({ ...transferencia, item_id: e.target.value })}><option value="">Seleccionar artículo</option>{items.filter(itemActivo).map((i) => <option key={i.id} value={i.id}>{i.codigo ? `${i.codigo} · ` : ""}{i.descripcion}</option>)}</select>
            <input className={inputClass} required type="number" min="1" step="1" placeholder="Cantidad" value={transferencia.cantidad} onChange={(e) => setTransferencia({ ...transferencia, cantidad: e.target.value })} />
            <select className={inputClass} required value={transferencia.area_origen} onChange={(e) => setTransferencia({ ...transferencia, area_origen: e.target.value })}><option value="">SELECCIONAR ÁREA QUE ENTREGA</option>{areas.map((a) => String(a.area || a.nombre || "").trim().toUpperCase()).filter((nombre, index, lista) => nombre && nombre !== transferencia.area_destino && lista.indexOf(nombre) === index).sort().map((nombre) => <option key={nombre} value={nombre}>{nombre}</option>)}</select>
            <input className={`${inputClass} bg-gray-100`} readOnly value={transferencia.area_destino} placeholder="Área solicitante" title="Área destino: área del técnico que solicita" />
            <input className={inputClass} placeholder="Observación" value={transferencia.observacion} onChange={(e) => setTransferencia({ ...transferencia, observacion: e.target.value.toUpperCase() })} />
            <div className="md:col-span-5 text-sm text-gray-500">El área seleccionada entrega el artículo a {transferencia.area_destino || "TU ÁREA"}.</div>
            <div className="md:col-span-5 flex justify-end"><button disabled={guardando} className={`${formButtonClass} bg-purple-600 text-white`}>Solicitar transferencia</button></div>
          </form>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3 mb-4 md:mb-5">
          <button onClick={() => setKpiActivo("articulos")} className="text-left bg-white rounded-xl md:rounded-2xl shadow p-3 md:p-4 hover:ring-2 hover:ring-blue-300 transition"><div className="text-xs sm:text-sm leading-tight text-gray-500">Artículos</div><div className="text-2xl md:text-3xl font-bold text-gray-800">{items.length}</div></button>
          <button onClick={() => setKpiActivo("existencias")} className="text-left bg-white rounded-xl md:rounded-2xl shadow p-3 md:p-4 hover:ring-2 hover:ring-blue-300 transition"><div className="text-xs sm:text-sm leading-tight text-gray-500">Existencias del área</div><div className="text-2xl md:text-3xl font-bold text-gray-800">{existenciasArea.length}</div></button>
          <button onClick={() => setKpiActivo("bajo")} className="text-left bg-white rounded-xl md:rounded-2xl shadow p-3 md:p-4 hover:ring-2 hover:ring-red-300 transition"><div className="text-xs sm:text-sm leading-tight text-gray-500">Stock bajo</div><div className="text-2xl md:text-3xl font-bold text-red-600">{stockBajoArea.length}</div></button>
          <button onClick={() => setKpiActivo("transferencias")} className="text-left bg-white rounded-xl md:rounded-2xl shadow p-3 md:p-4 hover:ring-2 hover:ring-purple-300 transition"><div className="text-xs sm:text-sm leading-tight text-gray-500">Transferencias pendientes</div><div className="text-2xl md:text-3xl font-bold text-purple-600">{transferenciasPendientes.length}</div></button>
        </div>

        <div className="bg-white rounded-2xl shadow p-4 mb-5">
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">{[["catalogo", "Catálogo"], ["existencias", "Existencias"], ["movimientos", "Movimientos"], ["transferencias", "Transferencias"]].map(([valor, etiqueta]) => <button key={valor} onClick={() => setTab(valor)} className={`h-10 w-full sm:w-36 px-3 rounded-xl font-semibold inline-flex items-center justify-center ${tab === valor ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>{etiqueta}</button>)}</div>
            <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar..." className="w-full lg:w-80 border rounded-xl px-4 py-2" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow overflow-hidden">
          {cargando ? <div className="p-8 text-center text-gray-500">Cargando stock...</div> : datos.length === 0 ? <div className="p-8 text-center text-gray-500">Sin registros para mostrar.</div> : tab === "catalogo" ? (
            <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-gray-50 text-gray-600"><tr><th className="text-left p-3">Código</th><th className="text-left p-3">Descripción</th><th className="text-left p-3">Categoría</th><th className="text-left p-3">Unidad</th><th className="text-right p-3">Stock mínimo</th><th className="text-center p-3">Estado</th><th className="text-center p-3">Acciones</th></tr></thead><tbody>{datos.map((item) => <tr key={item.id} className="border-t"><td className="p-3 font-medium">{item.codigo || "-"}</td><td className="p-3">{item.descripcion}</td><td className="p-3">{item.categoria || "-"}</td><td className="p-3">{item.unidad}</td><td className="p-3 text-right">{entero(item.stock_minimo)}</td><td className="p-3 text-center">{item.activo ? "Activo" : "Inactivo"}</td><td className="p-3 text-center"><button onClick={() => eliminarItem(item)} className={`${tableButtonClass} bg-red-600 text-white`}>Eliminar</button></td></tr>)}</tbody></table></div>
          ) : tab === "existencias" ? (
            <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-gray-50 text-gray-600"><tr><th className="text-left p-3">Código</th><th className="text-left p-3">Descripción</th><th className="text-left p-3">Área</th><th className="text-right p-3">Cantidad</th><th className="text-right p-3">Mínimo</th><th className="text-center p-3">Estado</th><th className="text-center p-3">Acciones</th></tr></thead><tbody>{datos.map((e) => <tr key={e.id} className="border-t"><td className="p-3 font-medium">{e.codigo || "-"}</td><td className="p-3">{e.descripcion}</td><td className="p-3">{e.area}</td><td className="p-3 text-right font-semibold">{entero(e.cantidad)} {e.unidad}</td><td className="p-3 text-right">{entero(e.stock_minimo)}</td><td className="p-3 text-center">{e.stock_bajo ? "Stock bajo" : "Normal"}</td><td className="p-3 text-center"><button onClick={() => abrirAjuste(e)} className={`${tableButtonClass} bg-amber-600 text-white`}>Ajustar</button></td></tr>)}</tbody></table></div>
          ) : tab === "transferencias" ? (
            <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-gray-50 text-gray-600"><tr><th className="text-left p-3">Fecha</th><th className="text-left p-3">Artículo</th><th className="text-right p-3">Cantidad</th><th className="text-left p-3">Origen</th><th className="text-left p-3">Destino</th><th className="text-left p-3">Solicitado por</th><th className="text-left p-3">Estado</th><th className="text-center p-3">Acciones</th></tr></thead><tbody>{datos.map((t) => { const puedeResolver = t.estado === "PENDIENTE" && String(t.area_origen || "").trim().toUpperCase() === areaPersonal; return <tr key={t.id} className="border-t"><td className="p-3 whitespace-nowrap">{formatearFecha(t.fecha_solicitud)}</td><td className="p-3">{t.codigo ? `${t.codigo} · ` : ""}{t.descripcion}</td><td className="p-3 text-right">{entero(t.cantidad)} {t.unidad}</td><td className="p-3">{t.area_origen}</td><td className="p-3">{t.area_destino}</td><td className="p-3">{t.solicitado_por_nombre || "-"}</td><td className="p-3 font-semibold">{t.estado}</td><td className="p-3 text-center">{puedeResolver ? <div className="flex gap-2 justify-center"><button onClick={() => resolverTransferencia(t, "APROBAR")} className={`${tableButtonClass} bg-green-600 text-white`}>Aprobar</button><button onClick={() => resolverTransferencia(t, "RECHAZAR")} className={`${tableButtonClass} bg-red-600 text-white`}>Rechazar</button></div> : t.estado === "PENDIENTE" ? <span className="text-xs text-gray-500">Esperando área origen</span> : "-"}</td></tr>; })}</tbody></table></div>
          ) : (
            <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-gray-50 text-gray-600"><tr><th className="text-left p-3">Fecha</th><th className="text-left p-3">Tipo</th><th className="text-left p-3">Artículo</th><th className="text-right p-3">Cantidad</th><th className="text-left p-3">Origen</th><th className="text-left p-3">Destino</th><th className="text-left p-3">Personal</th><th className="text-left p-3">Referencia</th><th className="text-left p-3">Observación</th></tr></thead><tbody>{datos.map((m) => <tr key={m.id} className="border-t"><td className="p-3 whitespace-nowrap">{formatearFecha(m.fecha)}</td><td className="p-3 font-semibold">{m.tipo}</td><td className="p-3">{m.codigo ? `${m.codigo} · ` : ""}{m.descripcion}</td><td className="p-3 text-right">{entero(m.cantidad)} {m.unidad}</td><td className="p-3">{m.area_origen || "-"}</td><td className="p-3">{m.area_destino || "-"}</td><td className="p-3">{m.personal_nombre || "-"}</td><td className="p-3">{m.referencia_tipo && m.referencia_id ? `${m.referencia_tipo} #${m.referencia_id}` : "-"}</td><td className="p-3">{m.observacion || "-"}</td></tr>)}</tbody></table></div>
          )}
        </div>
      </div>

      {kpiSeleccionado && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setKpiActivo(null)}><div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}><div className="p-4 border-b flex items-center justify-between"><div><h2 className="text-xl font-bold text-gray-800">{kpiSeleccionado.titulo}</h2><p className="text-sm text-gray-500">{kpiSeleccionado.lista.length} registro(s)</p></div><button onClick={() => setKpiActivo(null)} className="px-3 py-2 rounded-lg bg-gray-200 text-gray-700">Cerrar</button></div><div className="overflow-y-auto max-h-[65vh]">{renderListaKpi()}</div></div></div>}

      {existenciaAjuste && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4" onClick={() => setExistenciaAjuste(null)}><form onSubmit={guardarAjuste} className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}><h2 className="text-xl font-bold text-gray-800 mb-1">Ajustar stock</h2><p className="text-sm text-gray-500 mb-4">{existenciaAjuste.codigo ? `${existenciaAjuste.codigo} · ` : ""}{existenciaAjuste.descripcion}</p><div className="bg-gray-50 rounded-xl p-3 mb-4 text-sm"><div><strong>Área:</strong> {existenciaAjuste.area}</div><div><strong>Existencia actual:</strong> {entero(existenciaAjuste.cantidad)} {existenciaAjuste.unidad}</div></div><label className="block text-sm font-semibold mb-1">Nueva cantidad</label><input className={`${inputClass} mb-3`} type="number" min="0" step="1" required value={ajuste.nueva_cantidad} onChange={(e) => setAjuste({ ...ajuste, nueva_cantidad: e.target.value })} /><label className="block text-sm font-semibold mb-1">Motivo del ajuste</label><textarea className={`${inputClass} mb-4`} rows="3" required placeholder="Ej.: diferencia detectada en conteo físico" value={ajuste.observacion} onChange={(e) => setAjuste({ ...ajuste, observacion: e.target.value.toUpperCase() })} /><div className="flex gap-2 justify-end"><button type="button" onClick={() => setExistenciaAjuste(null)} className="px-4 py-2 rounded-xl bg-gray-300 text-gray-700">Cancelar</button><button disabled={guardando} className="px-4 py-2 rounded-xl bg-amber-600 text-white font-semibold disabled:opacity-50">Guardar ajuste</button></div></form></div>}
    </div>
  );
}
