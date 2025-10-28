// src/PanelLogin.js
import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion, AnimatePresence } from "framer-motion";
import AsistenteIAFlotante from "./AsistenteIAFlotante";

import RegistroUsuario from "./RegistroUsuario";
import RegistroPersonal from "./RegistroPersonal";

// --- imports extra para gráficos ---
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const API_URL = "https://sky26.onrender.com/tareas";

// ---------- Login ----------
function PanelLogin({ onLogin }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const PASS = "repliKat";

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      if (password === PASS) {
        onLogin(true);
        toast.success("Acceso concedido ✅");
      } else {
        toast.error("Contraseña incorrecta ❌");
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="p-4 max-w-md mx-auto mt-20 relative">
      {loading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <h1 className="text-2xl font-bold text-center mb-4">
        <img src="/logosmall.png" alt="Logo" className="mx-auto mb-4 w-24 h-auto" />
        🔒 Acceso Panel de Supervisión
      </h1>
      <form onSubmit={handleSubmit} className="flex flex-col space-y-3">
        <input
          type="password"
          placeholder="Contraseña"
          className="w-full p-2 border rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" className="bg-green-500 text-white p-2 rounded-xl">
          Ingresar
        </button>
      </form>
    </div>
  );
}

// ---------- Panel principal ----------
function Supervision({ setVista }) {
  const [tareas, setTareas] = useState([]);
  const [modalImagen, setModalImagen] = useState(null);
  const [tab, setTab] = useState("pendientes");
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [vistaGrafico, setVistaGrafico] = useState("area");
  const [promedios, setPromedios] = useState([]);

  // Cargar tareas
  useEffect(() => {
    fetchTareas();
  }, []);

  const fetchTareas = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      setTareas(data.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)));
    } catch {
      toast.error("Error al cargar tareas ❌");
    } finally {
      setLoading(false);
    }
  };

  // Recalcular promedios cuando cambian las tareas
  useEffect(() => {
    const tiemposPorDia = {};
    tareas.forEach((t) => {
      if (!t.fecha) return;
      const fecha = `${t.fecha}`; // mantener formato con hora

      if (!tiemposPorDia[fecha])
        tiemposPorDia[fecha] = { fecha, totalSol: 0, totalFin: 0, cantSol: 0, cantFin: 0 };

      if (t.fecha_comp !== null && t.fecha_comp !== undefined) {
        const tiempoSol = (new Date(t.fecha_comp) - new Date(t.fecha)) / (1000 * 60 * 60);
        tiemposPorDia[fecha].totalSol += tiempoSol;
        tiemposPorDia[fecha].cantSol += 1;
      }

      if (t.fecha_fin !== null && t.fecha_fin !== undefined) {
        const tiempoFin = (new Date(t.fecha_fin) - new Date(t.fecha)) / (1000 * 60 * 60);
        tiemposPorDia[fecha].totalFin += tiempoFin;
        tiemposPorDia[fecha].cantFin += 1;
      }
    });

    const nuevosPromedios = Object.values(tiemposPorDia)
      .map((d) => ({
        fecha: d.fecha,
        promedio_solucion: d.cantSol ? d.totalSol / d.cantSol : 0,
        promedio_finalizacion: d.cantFin ? d.totalFin / d.cantFin : 0,
      }))
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    setPromedios(nuevosPromedios);
  }, [tareas]);

  // 🔍 Búsqueda global incluyendo ID
  const filtrarBusqueda = (t) => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return true;

    const esNumero = /^\d+$/.test(texto);
    const coincideID = esNumero && t.id === parseInt(texto);

    return (
      coincideID ||
      (t.usuario && t.usuario.toLowerCase().includes(texto)) ||
      (t.tarea && t.tarea.toLowerCase().includes(texto)) ||
      (t.area && t.area.toLowerCase().includes(texto)) ||
      (t.servicio && t.servicio.toLowerCase().includes(texto)) ||
      (t.solucion && t.solucion.toLowerCase().includes(texto)) ||
      (t.asignado && t.asignado.toLowerCase().includes(texto))
    );
  };

  const pendientes = tareas.filter((t) => !t.solucion && !t.fin && filtrarBusqueda(t));
  const terminadas = tareas.filter((t) => t.solucion && !t.fin && filtrarBusqueda(t));
  const finalizadas = tareas.filter((t) => t.fin && filtrarBusqueda(t));

  const tareasPorTab =
    tab === "pendientes" ? pendientes : tab === "terminadas" ? terminadas : finalizadas;

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <img src="/logosmall.png" alt="Logo" className="mx-auto mb-4 w-24 h-auto" />
      <h1 className="text-2xl font-bold text-center mb-2">📋 Panel de Supervisión</h1>

      {/* 📊 TABLERO DE CONTROL */}
      <div className="bg-white shadow-md rounded-xl p-4 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-center">📈 Tablero de Control</h2>

        {/* Contadores */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="bg-blue-100 p-3 rounded-xl">
            <p className="text-gray-600 text-sm">Total de tareas</p>
            <p className="text-2xl font-bold">{tareas.length}</p>
          </div>
          <div className="bg-yellow-100 p-3 rounded-xl">
            <p className="text-gray-600 text-sm">Pendientes</p>
            <p className="text-2xl font-bold">{pendientes.length}</p>
          </div>
          <div className="bg-blue-200 p-3 rounded-xl">
            <p className="text-gray-600 text-sm">Terminadas</p>
            <p className="text-2xl font-bold">{terminadas.length}</p>
          </div>
          <div className="bg-green-200 p-3 rounded-xl">
            <p className="text-gray-600 text-sm">Finalizadas</p>
            <p className="text-2xl font-bold">{finalizadas.length}</p>
          </div>
        </div>

   {/* 🕓 Calcular tiempos promedio */}
  {tareas.length > 0 && (
    <div className="mt-4 text-center">
      {(() => {
        const tareasConComp = tareas.filter((t) => t.fecha && t.fecha_comp);
        const tareasConFin = tareas.filter((t) => t.fecha_comp && t.fecha_fin);

        const promedioSolucion =
          tareasConComp.length > 0
            ? (
                tareasConComp.reduce(
                  (acc, t) =>
                    acc +
                    (new Date(t.fecha_comp) - new Date(t.fecha)) / (1000 * 60 * 60),
                  0
                ) / tareasConComp.length
              ).toFixed(1)
            : "—";

        const promedioFinalizacion =
          tareasConFin.length > 0
            ? (
                tareasConFin.reduce(
                  (acc, t) =>
                    acc +
                    (new Date(t.fecha_fin) - new Date(t.fecha_comp)) /
                      (1000 * 60 * 60),
                  0
                ) / tareasConFin.length
              ).toFixed(1)
            : "—";

        return (
          <>
            <p className="text-sm text-gray-600">
              ⏱️ Tiempo promedio de solución:{" "}
              <span className="font-semibold">
                {promedioSolucion !== "—" ? `${promedioSolucion} h` : "Sin datos"}
              </span>
            </p>
            <p className="text-sm text-gray-600">
              🕒 Tiempo promedio hasta finalización:{" "}
              <span className="font-semibold">
                {promedioFinalizacion !== "—"
                  ? `${promedioFinalizacion} h`
                  : "Sin datos"}
              </span>
            </p>
          </>
        );
      })()}
    </div>
  )}

               {/* 🔽 Selector de gráfico circular */}
        {vistaGrafico !== "tendencias" && (
          <div className="flex justify-center mt-6 mb-4">
            <select
              className="border rounded-xl p-2 shadow-sm text-sm"
              value={vistaGrafico}
              onChange={(e) => setVistaGrafico(e.target.value)}
            >
              <option value="area">Por área</option>
              <option value="personal">Por personal</option>
              <option value="servicio">Por servicio</option>
            </select>
          </div>
        )}

        {/* 📊 Gráfico circular */}
        {vistaGrafico !== "tendencias" && (
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={(() => {
                  const conteo = {};
                  if (vistaGrafico === "area") {
                    tareas.forEach(t => { const k = t.area || "Sin área"; conteo[k] = (conteo[k] || 0) + 1; });
                  } else if (vistaGrafico === "personal") {
                    tareas.forEach(t => { const k = t.asignado || "Sin asignar"; conteo[k] = (conteo[k] || 0) + 1; });
                  } else if (vistaGrafico === "servicio") {
                    tareas.forEach(t => { const k = t.servicio || "Sin servicio"; conteo[k] = (conteo[k] || 0) + 1; });
                  }
                  return Object.keys(conteo).map(k => ({ name: k, value: conteo[k] }));
                })()}
                cx="50%"
                cy="50%"
                outerRadius={120}
                dataKey="value"
                label
              >
                {(() => {
                  const conteo = {};
                  if (vistaGrafico === "area") {
                    tareas.forEach(t => { const k = t.area || "Sin área"; conteo[k] = (conteo[k] || 0) + 1; });
                  } else if (vistaGrafico === "personal") {
                    tareas.forEach(t => { const k = t.asignado || "Sin asignar"; conteo[k] = (conteo[k] || 0) + 1; });
                  } else if (vistaGrafico === "servicio") {
                    tareas.forEach(t => { const k = t.servicio || "Sin servicio"; conteo[k] = (conteo[k] || 0) + 1; });
                  }
                  const nombres = Object.keys(conteo);
                  return nombres.map((_, i) => {
                    const hue = (i * 360 / nombres.length) % 360;
                    const color = `hsl(${hue}, 70%, 50%)`;
                    return <Cell key={i} fill={color} />;
                  });
                })()}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}

        {/* ----------------- Gráfico de tendencias separado ----------------- */}
        <div className="mt-8 bg-white shadow-md rounded-xl p-4">
          <h2 className="text-xl font-semibold mb-4 text-center">📈 Tendencias de Promedios</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={promedios.map(p => ({
                ...p,
                fecha: p.fecha.includes(":") ? p.fecha : `${p.fecha} 00:00:00`,
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="fecha" />
              <YAxis label={{ value: "Horas", angle: -90, position: "insideLeft" }} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white p-2 border rounded shadow-sm">
                        <p className="font-semibold text-sm">Fecha: {label}</p>
                        {payload.map((p, i) => (
                          <p key={i} className="text-sm" style={{ color: p.color }}>
                           {p.name}: {typeof p.value === "number" ? p.value.toFixed(2) : "0"} hs
                          </p>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="promedio_solucion" stroke="#3B82F6" name="Promedio solución" />
              <Line type="monotone" dataKey="promedio_finalizacion" stroke="#10B981" name="Promedio finalización" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <p className="text-center text-xs text-gray-500 mt-2">
        Vista actual:{" "}
        <span className="font-semibold">
          {vistaGrafico.charAt(0).toUpperCase() + vistaGrafico.slice(1)}
        </span>
      </p>

      {/* Botones principales */}
      <div className="flex justify-center space-x-2 mb-6">
        <button
          onClick={() => setVista("usuario")}
          className="bg-blue-500 text-white px-4 py-2 rounded-xl"
        >
          Registrar Usuario
        </button>
        <button
          onClick={() => setVista("personal")}
          className="bg-green-500 text-white px-4 py-2 rounded-xl"
        >
          Registrar Personal
        </button>
      </div>

      {/* 🔍 Cuadro de búsqueda */}
      <div className="relative flex justify-center mb-4">
        <input
          type="text"
          placeholder="🔍 Buscar en todas las tareas..."
          className="w-full max-w-md p-2 border rounded-xl shadow-sm focus:ring focus:ring-blue-300 pr-10"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        {busqueda && (
          <button
            onClick={() => setBusqueda("")}
            className="absolute right-[calc(50%-11rem)] sm:right-[calc(50%-12rem)] md:right-[calc(50%-13rem)] lg:right-[calc(50%-14rem)] text-gray-500 hover:text-red-500"
          >
            ❌
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex justify-center space-x-2 mb-4">
        <button
          onClick={() => setTab("pendientes")}
          className={`px-3 py-1 rounded-xl ${
            tab === "pendientes" ? "bg-yellow-400 text-white" : "bg-gray-200 text-gray-700"
          }`}
        >
          🕓 Pendientes ({pendientes.length})
        </button>
        <button
          onClick={() => setTab("terminadas")}
          className={`px-3 py-1 rounded-xl ${
            tab === "terminadas" ? "bg-blue-400 text-white" : "bg-gray-200 text-gray-700"
          }`}
        >
          🧩 Terminadas ({terminadas.length})
        </button>
        <button
          onClick={() => setTab("finalizadas")}
          className={`px-3 py-1 rounded-xl ${
            tab === "finalizadas" ? "bg-green-500 text-white" : "bg-gray-200 text-gray-700"
          }`}
        >
          ✅ Finalizadas ({finalizadas.length})
        </button>
      </div>

      <div className="flex justify-center mb-4">
        <button
          onClick={fetchTareas}
          className="bg-blue-500 text-white px-3 py-1 rounded-xl"
        >
          🔄 Actualizar lista
        </button>
      </div>

      {/* Lista de tareas */}
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <ul className="space-y-3">
          {tareasPorTab.length === 0 && (
            <p className="text-center text-gray-500 italic">
              No hay tareas en esta categoría.
            </p>
          )}
          {tareasPorTab.map((t) => (
            <motion.li
              key={t.id}
              className="p-3 rounded-xl shadow bg-white"
              whileHover={{ scale: 1.02 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center space-x-3">
                {t.imagen && (
                  <img
                    src={`data:image/jpeg;base64,${t.imagen}`}
                    alt="Foto"
                    className="w-14 h-14 rounded-lg object-cover cursor-pointer"
                    onClick={() => setModalImagen(t.imagen)}
                  />
                )}
                <div>
                  <p className="font-semibold">
                    #{t.id} — {t.usuario}: {t.tarea}
                  </p>
                  <p className="text-sm text-gray-700 mt-1">
                    🏢 Área: <span className="font-medium">{t.area || "—"}</span>
                  </p>
                  <p className="text-sm text-gray-700">
                    🧰 Servicio: <span className="font-medium">{t.servicio || "—"}</span>
                  </p>
                  {t.reasignado_a && (
                    <p className="text-sm text-purple-700 mt-1">
                      🔄 Reasignada a <strong>{t.reasignado_a}</strong> por{" "}
                      <strong>{t.reasignado_por}</strong> (desde {t.area})
                    </p>
                  )}
                  {t.asignado && (
                    <p className="text-sm text-gray-700 mt-1">
                      👷‍♂️ Realizada por: <span className="font-semibold">{t.asignado}</span>
                    </p>
                  )}
                  <p className="text-sm text-gray-600 mt-1">
                    📅 {t.fecha}
                  </p>
                  {t.fecha_comp && (
                    <p className="text-sm text-blue-700 mt-1">
                      ⏰ Solucionado el: {t.fecha_comp}
                    </p>
                  )}
                  {t.fecha_fin && (
                    <p className="text-sm text-green-700 mt-1">
                      ⏰ Finalizado el: {t.fecha_fin}
                    </p>
                  )}
                  {t.solucion && (
                    <p className="text-sm bg-gray-100 p-1 rounded mt-1">
                      💡 Solución: {t.solucion}
                    </p>
                  )}
                  {t.fin && (
                    <p className="text-green-600 font-semibold mt-1">
                      ✔️ Finalizada por el usuario
                    </p>
                  )}
                </div>
              </div>
            </motion.li>
          ))}
        </ul>
      )}

      {/* Modal imagen */}
      <AnimatePresence>
        {modalImagen && (
          <motion.div
            key="modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
            onClick={() => setModalImagen(null)}
          >
            <motion.img
              src={`data:image/jpeg;base64,${modalImagen}`}
              alt="Ampliada"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="max-w-full max-h-full rounded-xl shadow-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🤖 Asistente de IA */}
      <div className="mt-10">
        <AsistenteIAFlotante />
      </div>

      <ToastContainer position="bottom-right" autoClose={2000} />
    </div>
  );
}

// ---------- Wrapper ----------
export default function Panel() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [vista, setVista] = useState("panel");

  if (!loggedIn) return <PanelLogin onLogin={setLoggedIn} />;

  if (vista === "usuario")
    return (
      <div className="p-4 max-w-md mx-auto">
        <button
          onClick={() => setVista("panel")}
          className="bg-gray-400 text-white px-4 py-2 rounded-xl mb-4"
        >
          ← Volver al Panel
        </button>
        <RegistroUsuario />
      </div>
    );

  if (vista === "personal")
    return (
      <div className="p-4 max-w-md mx-auto">
        <button
          onClick={() => setVista("panel")}
          className="bg-gray-400 text-white px-4 py-2 rounded-xl mb-4"
        >
          ← Volver al Panel
        </button>
        <RegistroPersonal />
      </div>
    );

  return <Supervision setVista={setVista} />;
}
