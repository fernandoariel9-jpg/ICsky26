import { useEffect, useState } from "react";
import { API_URL } from "./config";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

export default function ResumenEstados() {
  const [datos, setDatos] = useState([]);
  const [token, setToken] = useState("");
  const [autorizado, setAutorizado] = useState(false);
  const [mostrarToken, setMostrarToken] = useState(false);
  const [recordar, setRecordar] = useState(false);
  const [alertas, setAlertas] = useState([]);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState(null);
  const [resumenTipos, setResumenTipos] = useState([]);

  // 🔁 cargar token guardado
  useEffect(() => {
    const tokenGuardado = localStorage.getItem("tokenResumen");
    if (tokenGuardado) {
      setToken(tokenGuardado);
      setRecordar(true);
    }
  }, []);

  const fetchResumenTipos = async () => {
  try {
    const res = await fetch(API_URL.ResumenTipos, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    setResumenTipos(data);
  } catch (error) {
    console.error(error);
  }
};

    const dataEstados = datos.map((d) => ({
    name: d.estado,
    value: Number(d.cantidad),
  }));

  const dataTipos = resumenTipos.map((t) => ({
    name: t.tipo,
    activos: Number(t.activos),
    no_activos: Number(t.no_activos),
  }));

  const fetchResumen = async () => {
    try {
      const res = await fetch(API_URL.ResumenEstados);
      const data = await res.json();
      setDatos(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchAlertas = async () => {
    try {
      const res = await fetch(API_URL.AlertasEquipos, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      setAlertas(data);
    } catch (error) {
      console.error(error);
    }
  };

  const validarToken = async () => {
    if (token === "ingeclinHR") {
      setAutorizado(true);

      if (recordar) {
        localStorage.setItem("tokenResumen", token);
      } else {
        localStorage.removeItem("tokenResumen");
      }

      await fetchResumen();
      await fetchAlertas();
      await fetchResumenTipos();
    } else {
      alert("❌ Token incorrecto");
    }
  };

  // 🔹 ALERTAS POR GRUPOS
  const calcularAlertasGrupos = () => {
  const alertasGrupo = [];

  const getTipo = (tipo) =>
    resumenTipos.find((t) => t.tipo === tipo);

  // RX
  ["FLAT PANEL", "ARCO EN C", "EQUIPO RX MOVIL"].forEach((tipo) => {
    const data = getTipo(tipo);

    if (data && data.total > 0) {
      if (data.no_activos / data.total >= 0.5) {
        alertasGrupo.push(`RX - ${tipo} crítico (${data.no_activos}/${data.total})`);
      }
    }
  });

  // Centro quirúrgico
  const cqCriticos = [
    "BOMBA EXTRACORPOREA",
    "FACOEMULSIFICADOR",
    "CRANEOTOMO",
    "BALON DE CONTRAPULSACION",
    "MICROSCOPIO DE NEURO",
    "LITOTRIPTOR",
    "HISTEROSCOPIO",
  ];

  cqCriticos.forEach((tipo) => {
    const data = getTipo(tipo);

    if (data && data.no_activos > 0) {
      alertasGrupo.push(`Centro Quirúrgico - ${tipo} fuera de servicio`);
    }
  });

  // Gastro
  const gastro = getTipo("VIDEOCOLONOSCOPIO");

  if (gastro && gastro.no_activos / gastro.total >= 0.5) {
    alertasGrupo.push(`Gastro - ${gastro.no_activos}/${gastro.total} fuera de servicio`);
  }

  return alertasGrupo;
};

  // 🔹 ALERTAS AVANZADAS
  const calcularAlertasAvanzadas = () => {
  const alertasAvanzadas = [];

  const getTipo = (tipo) =>
    resumenTipos.find((t) => t.tipo === tipo);

  // RX
  ["FLAT PANEL", "ARCO EN C", "EQUIPO RX MOVIL"].forEach((tipo) => {
    const data = getTipo(tipo);

    if (data && data.total > 0 && data.no_activos / data.total >= 0.5) {
      alertasAvanzadas.push({
        mensaje: `🚨 RX (${tipo}): ${data.no_activos}/${data.total} fuera de servicio`,
      });
    }
  });

  // Quirófano
  [
    "BOMBA EXTRACORPOREA",
    "FACOEMULSIFICADOR",
    "CRANEOTOMO",
    "BALON DE CONTRAPULSACION",
    "MICROSCOPIO DE NEURO",
    "LITOTRIPTOR",
    "HISTEROSCOPIO",
  ].forEach((tipo) => {
    const data = getTipo(tipo);

    if (data && data.no_activos > 0) {
      alertasAvanzadas.push({
        mensaje: `🚨 QUIRÓFANO: ${tipo} fuera de servicio`,
      });
    }
  });

  // Gastro
  const gastro = getTipo("VIDEOCOLONOSCOPIO");

  if (gastro && gastro.no_activos / gastro.total >= 0.5) {
    alertasAvanzadas.push({
      mensaje: `🚨 GASTRO: ${gastro.no_activos}/${gastro.total} fuera de servicio`,
    });
  }

  return alertasAvanzadas;
};

  // 🔐 LOGIN
  if (!autorizado) {
    return (
      <div className="p-4 max-w-sm mx-auto">
        <h1 className="text-xl font-bold mb-4 text-center">
          🔐 Acceso
        </h1>

        <input
          type={mostrarToken ? "text" : "password"}
          placeholder="Ingresar token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="w-full border p-2 rounded-xl mb-2"
        />

        <button
          onClick={() => setMostrarToken(!mostrarToken)}
          className="text-sm text-blue-500 mb-2"
        >
          {mostrarToken ? "🙈 Ocultar" : "👁 Ver token"}
        </button>

        <div className="flex items-center mb-3">
          <input
            type="checkbox"
            checked={recordar}
            onChange={() => setRecordar(!recordar)}
            className="mr-2"
          />
          <label>Recordar token</label>
        </div>

        <button
          onClick={validarToken}
          className="bg-green-500 text-white px-4 py-2 rounded-xl w-full"
        >
          Ingresar
        </button>
      </div>
    );
  }

  const total = datos.reduce((acc, item) => acc + Number(item.cantidad), 0);

  const alertasGrupos = calcularAlertasGrupos();
  const alertasAvanzadas = calcularAlertasAvanzadas();
  const COLORS = ["#22c55e", "#ef4444", "#facc15", "#3b82f6", "#a855f7"];

  return (
  <div className="p-6 bg-gray-900 text-white min-h-screen">

    {/* 🧠 HEADER */}
    <h1 className="text-3xl font-bold mb-6 text-center">
      🏥 Equipamiento a cargo del Servicio de Ingeniería Clínica HPDDGR
    </h1>

    {/* 📊 KPIs */}
    <div className="grid grid-cols-3 gap-4 mb-6">

      <div className="bg-gray-800 p-4 rounded-xl text-center">
        <h2 className="text-sm">Total Equipos</h2>
        <p className="text-3xl font-bold">{total}</p>
      </div>

      <div className="bg-green-600 p-4 rounded-xl text-center">
        <h2 className="text-sm">Activos</h2>
        <p className="text-3xl font-bold">
          {resumenTipos.reduce((acc, t) => acc + Number(t.activos), 0)}
        </p>
      </div>

      <div className="bg-red-600 p-4 rounded-xl text-center">
        <h2 className="text-sm">Fuera de servicio</h2>
        <p className="text-3xl font-bold">
          {resumenTipos.reduce((acc, t) => acc + Number(t.no_activos), 0)}
        </p>
      </div>

    </div>

    {/* 📊 GRÁFICOS */}
    <div className="grid grid-cols-2 gap-6">

      <div className="bg-gray-800 p-4 rounded-xl">
        <h2 className="mb-2">Estados</h2>

        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie data={dataEstados} dataKey="value" outerRadius={100} label>
              {dataEstados.map((entry, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-gray-800 p-4 rounded-xl">
        <h2 className="mb-2">Equipos por tipo</h2>

        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={dataTipos}>
            <XAxis dataKey="name" hide />
            <YAxis />
            <Tooltip />
            <Bar dataKey="activos" stackId="a" fill="#22c55e" />
            <Bar dataKey="no_activos" stackId="a" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>

    {/* 🚨 ALERTAS */}
    <div className="mt-6">
      <h2 className="text-xl mb-3 text-red-400">
        🚨 Alertas críticas
      </h2>

      {alertasAvanzadas.length === 0 ? (
        <div className="bg-green-600 p-4 rounded-xl text-center">
          ✅ Todo operativo
        </div>
      ) : (
        alertasAvanzadas.map((a, i) => (
          <div
            key={i}
            className="bg-red-600 p-4 rounded-xl mb-2 text-lg font-bold"
          >
            {a.mensaje}
          </div>
        ))
      )}
    </div>

    {/* 🔍 MODAL (AHORA SÍ DENTRO DEL RETURN) */}
    {equipoSeleccionado && (
      <div className="fixed bottom-4 right-4 bg-white text-black p-4 rounded-xl shadow-xl w-80">
        <h3 className="font-bold mb-2">🔍 Detalle del equipo</h3>

        <p><b>Equipo:</b> {equipoSeleccionado.descripcion}</p>
        <p><b>Serie:</b> {equipoSeleccionado.numero_serie}</p>
        <p><b>Estado:</b> {equipoSeleccionado.estado}</p>

        <button
          onClick={() => setEquipoSeleccionado(null)}
          className="mt-2 px-3 py-1 bg-gray-600 text-white rounded"
        >
          Cerrar
        </button>
      </div>
    )}

  </div>
);
}
