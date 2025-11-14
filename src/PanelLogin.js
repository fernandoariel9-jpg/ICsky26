// src/PanelLogin.js
import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion, AnimatePresence } from "framer-motion";
import AsistenteIAFlotante from "./AsistenteIAFlotante";
import { PieChart as PieChartIcon } from "lucide-react";

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
  brush
} from "recharts";

const API_URL = "https://sky26.onrender.com/tareas";

// ---------- Login ----------
function PanelLogin({ onLogin }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [recordar, setRecordar] = useState(false);
  const PASS = "repliKat";

  // ✅ Cargar contraseña guardada al iniciar
  useEffect(() => {
    const savedPass = localStorage.getItem("panelPassword");
    if (savedPass) {
      setPassword(savedPass);
      setRecordar(true);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      if (password === PASS) {
        onLogin(true);
        toast.success("Acceso concedido ✅");

        // ✅ Si está marcada la casilla, guardar contraseña
        if (recordar) {
          localStorage.setItem("panelPassword", password);
        } else {
          localStorage.removeItem("panelPassword");
        }
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

        <label className="flex items-center space-x-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={recordar}
            onChange={(e) => setRecordar(e.target.checked)}
            className="rounded border-gray-300"
          />
          <span>Recordar contraseña</span>
        </label>

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
  // 📈 Estados para guardar el resumen y su tendencia
const [resumenTareas, setResumenTareas] = useState([]);
const [resumenTareasConTendencia, setResumenTareasConTendencia] = useState([]);
const [resumenTiempos, setResumenTiempos] = useState([]);

  // Estados para popup por área
  const [selectedArea, setSelectedArea] = useState(null);
  const [detallesArea, setDetallesArea] = useState(null);

  // Paleta por defecto (puedes editar)
  const COLORS = [
    "#60A5FA",
    "#34D399",
    "#FBBF24",
    "#F87171",
    "#A78BFA",
    "#F472B6",
    "#10B981",
    "#F59E0B",
  ];

  // Mapea colores fijos por área (editable)
  const COLORES_AREAS = {
    "Area 1": "#EEF207",
    "Area 2": "#EF4444",
    "Area 3": "#10B981",
    "Area 4": "#3B82F6",
    "Area 5": "#D25CF6",
    "Area 6": "#f88408ff",
    "Sin área": "#6B7280",
  };

  // Cargar tareas
  useEffect(() => {
    fetchTareas();
  }, []);

  useEffect(() => {
  async function cargarResumenTiempos() {
    try {
      const res = await fetch(`${API_URL.Tareas}/resumen_tiempos`);
      const data = await res.json();
      setResumenTiempos(data);
    } catch (err) {
      console.error("Error cargando resumen de tiempos:", err);
    }
  }

  cargarResumenTiempos();
}, []);

  useEffect(() => {
  fetch("https://sky26.onrender.com/api/resumen_tareas")
    .then((res) => res.json())
    .then((data) => {
      const parsed = data.map((r) => ({
        ...r,
        fecha: new Date(r.fecha).toISOString().slice(0, 19).replace("T", " "),
        pendientes: Number(r.pendientes),
        en_proceso: Number(r.en_proceso),
      }));

      // 📈 Calcular promedios móviles (tendencias)
      const tendencia = parsed.map((p, i, arr) => {
        const inicio = Math.max(0, i - 2); // últimos 3 días
        const ventana = arr.slice(inicio, i + 1);
        const promedioPend =
          ventana.reduce((acc, d) => acc + d.pendientes, 0) / ventana.length;
        const promedioProc =
          ventana.reduce((acc, d) => acc + d.en_proceso, 0) / ventana.length;

        // --- Tendencias ---
function calcularTendencia(data, campo) {
  if (data.length < 2) return data.map(d => ({ dia: d.dia, value: d[campo] }));

  let n = data.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  data.forEach((d, i) => {
    const x = i + 1;
    const y = d[campo];
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  });

  const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const b = (sumY - m * sumX) / n;

  return data.map((d, i) => ({
    dia: d.dia,
    value: m * (i + 1) + b
  }));
}

const tendenciaSol = calcularTendencia(datosPromedios, "solucion");
const tendenciaFin = calcularTendencia(datosPromedios, "finalizacion");

        // ----------------- Datos de promedio de solución y finalización -----------------
const datosPromedios = (() => {
  const tiemposPorDia = {};

  tareas.forEach((t) => {
    if (!t.fecha) return;

    const fecha = new Date(t.fecha).toISOString().split("T")[0];

    let tiempoSol = null;
    let tiempoFin = null;

    if (t.fecha_comp)
      tiempoSol = (new Date(t.fecha_comp) - new Date(t.fecha)) / (1000 * 60 * 60);

    if (t.fecha_fin)
      tiempoFin = (new Date(t.fecha_fin) - new Date(t.fecha)) / (1000 * 60 * 60);

    if (!tiemposPorDia[fecha]) {
      tiemposPorDia[fecha] = {
        fecha,
        totalSol: 0,
        cantSol: 0,
        totalFin: 0,
        cantFin: 0
      };
    }

    if (tiempoSol !== null) {
      tiemposPorDia[fecha].totalSol += tiempoSol;
      tiemposPorDia[fecha].cantSol += 1;
    }

    if (tiempoFin !== null) {
      tiemposPorDia[fecha].totalFin += tiempoFin;
      tiemposPorDia[fecha].cantFin += 1;
    }
  });

  const lista = Object.values(tiemposPorDia)
    .map((d) => ({
      fecha: new Date(d.fecha).getTime(),
      promedioSol: d.cantSol ? d.totalSol / d.cantSol : 0,
      promedioFin: d.cantFin ? d.totalFin / d.cantFin : 0
    }))
    .sort((a, b) => a.fecha - b.fecha);

  return lista.slice(Math.max(0, lista.length - 30)); // últimos 30 días
})();

// ---------- Función de tendencia lineal ----------
function calcTrend(values) {
  const n = values.length;
  if (n === 0) return [];

  const x = values.map((_, i) => i);
  const y = values;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((a, c, i) => a + c * y[i], 0);
  const sumX2 = x.reduce((a, c) => a + c * c, 0);

  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return new Array(n).fill(y[0]);

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  return values.map((_, i) => intercept + slope * i);
}

// Tendencias
const tendenciaSol = calcTrend(datosPromedios.map((d) => d.promedioSol));
const tendenciaFin = calcTrend(datosPromedios.map((d) => d.promedioFin));

        return {
          ...p,
          tendencia_pendientes: Number(promedioPend.toFixed(2)),
          tendencia_en_proceso: Number(promedioProc.toFixed(2)),
        };
      });

      setResumenTareas(parsed);
      setResumenTareasConTendencia(tendencia);
    })
    .catch((err) =>
      console.error("❌ Error al obtener resumen de tareas:", err)
    );
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

  // 📊 Tareas agrupadas por área (obj y array para charts)
  const tareasPorAreaObj = tareas.reduce((acc, t) => {
  if (!t.solucion && !t.fin) { // solo tareas pendientes
    // Si la tarea fue reasignada, usar el área de destino
    const area = t.reasignado_a || t.area || "Sin área";
    acc[area] = (acc[area] || 0) + 1;
  }
  return acc;
}, {});

  const tareasPorArea = Object.entries(tareasPorAreaObj).map(([area, value]) => ({
    name: area,
    value,
  }));

  // Normalizar cadena para comparar (quita acentos, minúsculas)
  const normalize = (str) =>
    (str || "")
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

  // 📋 Manejar click en área (usa solucion text y fin booleano)
const handleAreaClick = (areaName) => {
  if (!areaName) return;
  setSelectedArea(areaName);

  // ✅ Ahora detecta si la tarea fue reasignada y usa el área de destino
  const tareasArea = tareas.filter((t) => {
    const areaReal = t.reasignado_a || t.area || "Sin área";
    return normalize(areaReal) === normalize(areaName);
  });

  // personal: usar 'asignado'
  const personal = [...new Set(tareasArea.map((t) => t.asignado || "No asignado"))];

  // servicios
  const servicios = [...new Set(tareasArea.map((t) => t.servicio || "Sin servicio"))];

  // tareas
  const tarea = [...new Set(tareasArea.map((t) => t.tarea || "Sin tarea"))];

  // estados: pendientes = !solucion && !fin ; en proceso = solucion && !fin ; finalizadas = fin
  const pendientesCount = tareasArea.filter((t) => !t.solucion && !t.fin).length;
  const enProcesoCount = tareasArea.filter((t) => t.solucion && !t.fin).length;
  const finalizadasCount = tareasArea.filter((t) => t.fin).length;

  setDetallesArea({
    personal,
    servicios,
    pendientes: pendientesCount,
    proceso: enProcesoCount,
    finalizadas: finalizadasCount,
    tareasList: tareasArea, // para el listado en popup
  });
};

  const cerrarPopupArea = () => {
    setSelectedArea(null);
    setDetallesArea(null);
  };

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
            <p className="text-gray-600 text-sm">En proceso</p>
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
                          acc + (new Date(t.fecha_comp) - new Date(t.fecha)) / (1000 * 60 * 60),
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
                          (new Date(t.fecha_fin) - new Date(t.fecha_comp)) / (1000 * 60 * 60),
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

        {/* === GRÁFICO CIRCULAR DE TAREAS POR ÁREA (separado, con click) === */}
        <div className="p-4 shadow-md mb-8 bg-white rounded-xl">
          <h2 className="text-lg font-semibold mb-2 flex items-center">
            <PieChartIcon className="mr-2 text-green-600" /> Tareas pendientes por Área
          </h2>
        <ResponsiveContainer width="100%" height={350}>
  <PieChart>
    {(() => {
      // 🎯 Datos agrupados solo por tareas pendientes
      const conteo = {};
      tareas.forEach((t) => {
        if (!t.fin && !t.solucion) {
          const area = t.reasignado_a || t.area || "Sin área";
          conteo[area] = (conteo[area] || 0) + 1;
        }
      });

      const data = Object.keys(conteo).map((k) => ({
        name: k,
        value: conteo[k],
      }));

      // 🎨 Colores fijos por área
      const coloresFijos = {
        "Area 1": "#EEF207",
        "Area 2": "#EF4444",
        "Area 3": "#10B981",
        "Area 4": "#3B82F6",
        "Area 5": "#D25CF6",
        "Area 6": "#f88408ff",
        "Sin área": "#6B7280",
      };

      return (
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={70}
          outerRadius={120}
          dataKey="value"
          labelLine={false}
          label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, name, value }) => {
            const RADIAN = Math.PI / 180;
            const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
            const x = cx + radius * Math.cos(-midAngle * RADIAN);
            const y = cy + radius * Math.sin(-midAngle * RADIAN);

            return (
              <text
                x={x}
                y={y}
                fill="#000"
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={12}
                fontWeight="bold"
              >
                {`${name}: ${value}`}
              </text>
            );
          }}
          onClick={(data) => handleAreaClick(data.name)} // popup
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={coloresFijos[entry.name] || "#6B7280"}
            />
          ))}
        </Pie>
      );
    })()}

    {/* Tooltip y leyenda */}
    <Tooltip
      contentStyle={{
        backgroundColor: "#fff",
        border: "1px solid #ccc",
        color: "#000",
        fontSize: "13px",
      }}
      itemStyle={{ color: "#000" }}
      formatter={(value, name) => [`${value} tareas pendientes`, name]}
      labelStyle={{ fontWeight: "bold", color: "#000" }}
    />

    <Legend
      verticalAlign="bottom"
      height={36}
      wrapperStyle={{
        paddingTop: "10px",
        fontSize: "13px",
        color: "#000",
      }}
    />
  </PieChart>
</ResponsiveContainer>

        </div>

        {/* === MODAL DETALLES POR ÁREA === */}
        <AnimatePresence>
          {selectedArea && detallesArea && (
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white rounded-2xl shadow-xl p-6 w-11/12 max-w-3xl"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
              >
                <h2 className="text-xl font-bold mb-4 text-center text-green-700">
                  Detalles del área: {selectedArea}
                </h2>

                {detallesArea && (
                  <>
                    <p>
                      <strong>Personal involucrado:</strong>{" "}
                      {detallesArea.personal.length ? detallesArea.personal.join(", ") : "—"}
                    </p>
                    <p>
                      <strong>Pendientes:</strong> {detallesArea.pendientes}
                    </p>
                    <p>
                      <strong>En proceso:</strong> {detallesArea.proceso}
                    </p>
                    <p>
                      <strong>Finalizadas:</strong> {detallesArea.finalizadas}
                    </p>
                    <p>
                      <strong>Servicios:</strong>{" "}
                      {detallesArea.servicios.length ? detallesArea.servicios.join(", ") : "—"}
                    </p>

                    {/* opcional: lista corta de tareas (id - asignado - servicio) */}
                  {detallesArea.tareasList && detallesArea.tareasList.length > 0 && (
  <div className="mt-4 max-h-60 overflow-auto text-sm border rounded p-2 bg-gray-50">
    <strong>Listado de pendientes (ID — Asignado — Servicio — Tarea):</strong>
    <ul className="mt-2 space-y-2">
      {detallesArea.tareasList
        .filter((ta) => !ta.fin && !ta.solucion) // 🔹 solo tareas pendientes
        .map((ta) => (
          <li
            key={ta.id}
            className="border-b pb-1 relative group text-black"
          >
            <p>
              #{ta.id} — <strong>{ta.asignado || "No asignado"}</strong> —{" "}
              {ta.servicio || "Sin servicio"}
            </p>

            {ta.tarea && (
              <>
                <p className="text-gray-800 italic ml-4">
                  📝{" "}
                  {ta.tarea.length > 120
                    ? ta.tarea.slice(0, 120) + "..."
                    : ta.tarea}
                </p>

                {/* Tooltip visible al pasar el mouse */}
                <div className="absolute z-50 left-0 mt-1 hidden group-hover:block bg-gray-800 text-white text-xs rounded-lg px-3 py-2 w-72 shadow-lg">
                  {ta.tarea}
                </div>
              </>
            )}
          </li>
        ))}
    </ul>
  </div>
)}

                  </>
                )}

                <div className="mt-6 flex justify-center">
                  <button
                    onClick={cerrarPopupArea}
                    className="bg-green-500 text-white px-6 py-2 rounded-xl hover:bg-green-600"
                  >
                    Cerrar
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

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

        {/* 📊 Gráfico circular (general) */}
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
                  return Object.keys(conteo).map((k) => ({ name: k, value: conteo[k] }));
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
                    const color = COLORES_AREAS[nombres[i]] || COLORS[i % COLORS.length];
                    return <Cell key={i} fill={color} />;
                  });
                })()}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}

{/* 📊 Gráfico de pendientes vs en proceso */}
<div className="bg-white p-4 rounded-xl shadow-md mt-6">
  <h2 className="text-lg font-semibold text-gray-800 mb-3">
    Tareas Pendientes vs En Proceso (últimos 15 días)
  </h2>

  <div className="overflow-x-auto">
    <div className="min-w-[900px]">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={resumenTareasConTendencia
            .slice(Math.max(0, resumenTareasConTendencia.length - 15))
            .map((item) => ({
              ...item,
              // 🔹 Mostrar solo el número del día
              fecha: new Date(item.fecha).getDate().toString(),
            }))}
          margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="fecha"
            tick={{ fill: "black", fontSize: 12 }}
            label={{
              value: "Día",
              position: "insideBottomRight",
              offset: -5,
              fill: "black",
            }}
          />
          <YAxis tick={{ fill: "black", fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="pendientes"
            stroke="#ff6666"
            strokeWidth={2}
            dot={{ r: 3 }}
            name="Pendientes"
          />
          <Line
            type="monotone"
            dataKey="en_proceso"
            stroke="#66b3ff"
            strokeWidth={2}
            dot={{ r: 3 }}
            name="En Proceso"
          />
          <Line
            type="monotone"
            dataKey="tendenciaPendientes"
            stroke="#cc0000"
            strokeDasharray="5 5"
            name="Tendencia Pendientes"
          />
          <Line
            type="monotone"
            dataKey="tendenciaEnProceso"
            stroke="#0066cc"
            strokeDasharray="5 5"
            name="Tendencia En Proceso"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
</div>
</div>

{/* 📈 Promedios de Solución y Finalización (Horas) */}
<div className="bg-white p-4 rounded-xl shadow-md mt-6">
  <h2 className="text-lg font-bold mb-4">Promedio de Tiempos (horas)</h2>

  <ResponsiveContainer width="100%" height={320}>
    <LineChart data={datosPromedios} syncId="panel">
  <CartesianGrid strokeDasharray="3 3" />

  <XAxis
    dataKey="fecha"
    type="number"
    scale="time"
    tickFormatter={(ts) => new Date(ts).getDate()}
  />

  <YAxis />

  <Tooltip formatter={(v) => `${v.toFixed(2)} h`} />
  <Legend />

  <Line dataKey="promedioSol" stroke="#3B82F6" dot={{ r: 2 }} />
  <Line dataKey="promedioFin" stroke="#10B981" dot={{ r: 2 }} />

  {/* Tendencias */}
  <Line
    data={datosPromedios.map((d, i) => ({
      fecha: d.fecha,
      valor: tendenciaSol[i],
    }))}
    dataKey="valor"
    stroke="#1E40AF"
    strokeDasharray="5 5"
    dot={false}
  />

  <Line
    data={datosPromedios.map((d, i) => ({
      fecha: d.fecha,
      valor: tendenciaFin[i],
    }))}
    dataKey="valor"
    stroke="#047857"
    strokeDasharray="5 5"
    dot={false}
  />

  <Brush dataKey="fecha" height={20} travellerWidth={8} />
</LineChart>
  </ResponsiveContainer>
</div>

       {/* ----------------- Gráfico de tendencias separado ----------------- */}
<div className="mt-8 bg-white shadow-md rounded-xl p-4">
  <h2 className="text-xl font-semibold mb-4 text-center">
    📈 Tendencias de Promedios (últimos 15 días)
  </h2>

  <div className="overflow-x-auto">
    <div className="min-w-[900px]">
      <ResponsiveContainer width="100%" height={350}>
        <LineChart
          data={(() => {
            const tiemposPorDia = {};
            tareas.forEach((t) => {
              if (!t.fecha) return;

              const fecha = new Date(t.fecha);
              const key = fecha.toISOString().split("T")[0]; // yyyy-mm-dd

              let tiempoSol = null;
              let tiempoFin = null;
              if (t.fecha_comp)
                tiempoSol = (new Date(t.fecha_comp) - new Date(t.fecha)) / (1000 * 60 * 60);
              if (t.fecha_fin)
                tiempoFin = (new Date(t.fecha_fin) - new Date(t.fecha)) / (1000 * 60 * 60);

              if (!tiemposPorDia[key])
                tiemposPorDia[key] = { fecha: key, totalSol: 0, totalFin: 0, cantSol: 0, cantFin: 0 };

              if (tiempoSol !== null) {
                tiemposPorDia[key].totalSol += tiempoSol;
                tiemposPorDia[key].cantSol += 1;
              }
              if (tiempoFin !== null) {
                tiemposPorDia[key].totalFin += tiempoFin;
                tiemposPorDia[key].cantFin += 1;
              }
            });

            const datos = Object.values(tiemposPorDia)
              .map((d) => ({
                fecha: new Date(d.fecha).getTime(),
                promedioSol: d.cantSol ? d.totalSol / d.cantSol : 0,
                promedioFin: d.cantFin ? d.totalFin / d.cantFin : 0,
              }))
              .sort((a, b) => a.fecha - b.fecha);

            // 🔹 Mostrar solo los últimos 15 días
            return datos.slice(Math.max(0, datos.length - 15));
          })()}
          margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />

          {/* 📅 Eje X - solo número del día */}
          <XAxis
            dataKey="fecha"
            type="number"
            domain={["auto", "auto"]}
            scale="time"
            tickFormatter={(timestamp) => new Date(timestamp).getDate()} // solo el día
            label={{ value: "Día del mes", position: "insideBottomRight", offset: -5 }}
            tick={{ fill: "#000", fontSize: 12 }}
          />

          {/* 🕒 Eje Y */}
          <YAxis
            label={{
              value: "Horas",
              angle: -90,
              position: "insideLeft",
              fill: "#000",
            }}
            tick={{ fill: "#000", fontSize: 12 }}
          />

          <Tooltip
            labelFormatter={(ts) =>
              new Date(ts).toLocaleString("es-AR", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              })
            }
            formatter={(v) => (typeof v === "number" ? `${v.toFixed(2)} h` : v)}
          />
          <Legend />

          {/* 📈 Líneas principales */}
          <Line
            type="monotone"
            dataKey="promedioSol"
            stroke="#3B82F6"
            name="Promedio solución"
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="promedioFin"
            stroke="#10B981"
            name="Promedio finalización"
            dot={{ r: 3 }}
          />

          {/* 📉 Líneas de tendencia */}
          {(() => {
            const tiemposPorDia = {};
            tareas.forEach((t) => {
              if (!t.fecha) return;
              const fecha = new Date(t.fecha);
              const key = fecha.toISOString().split("T")[0];
              let tiempoSol = null;
              let tiempoFin = null;
              if (t.fecha_comp)
                tiempoSol = (new Date(t.fecha_comp) - new Date(t.fecha)) / (1000 * 60 * 60);
              if (t.fecha_fin)
                tiempoFin = (new Date(t.fecha_fin) - new Date(t.fecha)) / (1000 * 60 * 60);
              if (!tiemposPorDia[key])
                tiemposPorDia[key] = { fecha: key, totalSol: 0, totalFin: 0, cantSol: 0, cantFin: 0 };
              if (tiempoSol !== null) {
                tiemposPorDia[key].totalSol += tiempoSol;
                tiemposPorDia[key].cantSol += 1;
              }
              if (tiempoFin !== null) {
                tiemposPorDia[key].totalFin += tiempoFin;
                tiemposPorDia[key].cantFin += 1;
              }
            });

            const datos = Object.values(tiemposPorDia)
              .map((d) => ({
                fecha: new Date(d.fecha).getTime(),
                promedioSol: d.cantSol ? d.totalSol / d.cantSol : 0,
                promedioFin: d.cantFin ? d.totalFin / d.cantFin : 0,
              }))
              .sort((a, b) => a.fecha - b.fecha)
              .slice(Math.max(0, Object.values(tiemposPorDia).length - 15));

            const calcTrend = (arr) => {
              const n = arr.length;
              if (n === 0) return [];
              const x = arr.map((_, i) => i);
              const y = arr;
              const sumX = x.reduce((a, b) => a + b, 0);
              const sumY = y.reduce((a, b) => a + b, 0);
              const sumXY = x.reduce((a, c, i) => a + c * y[i], 0);
              const sumX2 = x.reduce((a, c) => a + c * c, 0);
              const denom = n * sumX2 - sumX * sumX;
              if (denom === 0) return new Array(n).fill(y[0] || 0);
              const slope = (n * sumXY - sumX * sumY) / denom;
              const intercept = (sumY - slope * sumX) / n;
              return arr.map((_, i) => intercept + slope * i);
            };

            const tendenciaSol = calcTrend(datos.map((d) => d.promedioSol));
            const tendenciaFin = calcTrend(datos.map((d) => d.promedioFin));

            return (
              <>
                <Line
                  type="monotone"
                  data={datos.map((d, i) => ({ fecha: d.fecha, valor: tendenciaSol[i] }))}
                  dataKey="valor"
                  stroke="#1E40AF"
                  strokeDasharray="5 5"
                  name="Tendencia solución"
                  dot={false}
                />
                <Line
                  type="monotone"
                  data={datos.map((d, i) => ({ fecha: d.fecha, valor: tendenciaFin[i] }))}
                  dataKey="valor"
                  stroke="#047857"
                  strokeDasharray="5 5"
                  name="Tendencia finalización"
                  dot={false}
                />
              </>
            );
          })()}
        </LineChart>
      </ResponsiveContainer>
    </div>
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
          🧩 En proceso ({terminadas.length})
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
        <button onClick={fetchTareas} className="bg-blue-500 text-white px-3 py-1 rounded-xl">
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
            <p className="text-center text-gray-500 italic">No hay tareas en esta categoría.</p>
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
                  <p className="text-sm text-gray-600 mt-1">📅 {t.fecha}</p>
                  {t.fecha_comp && (
                    <p className="text-sm text-blue-700 mt-1">⏰ Solucionado el: {t.fecha_comp}</p>
                  )}
                  {t.fecha_fin && (
                    <p className="text-sm text-green-700 mt-1">⏰ Finalizado el: {t.fecha_fin}</p>
                  )}
                  {t.solucion && <p className="text-sm bg-gray-100 p-1 rounded mt-1">💡 Solución: {t.solucion}</p>}
                  {t.fin && <p className="text-green-600 font-semibold mt-1">✔️ Finalizada por el usuario</p>}
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
        <button onClick={() => setVista("panel")} className="bg-gray-400 text-white px-4 py-2 rounded-xl mb-4">
          ← Volver al Panel
        </button>
        <RegistroUsuario />
      </div>
    );

  if (vista === "personal")
    return (
      <div className="p-4 max-w-md mx-auto">
        <button onClick={() => setVista("panel")} className="bg-gray-400 text-white px-4 py-2 rounded-xl mb-4">
          ← Volver al Panel
        </button>
        <RegistroPersonal />
      </div>
    );

  return <Supervision setVista={setVista} />;
}
