import { useEffect, useState } from "react";
import { API_URL } from "./config";
import {
  FaBrain,
  FaXRay,
  FaHeartbeat,
  FaVial,
  FaWaveSquare,
  FaDesktop,
  FaThermometerHalf,
  FaQuestionCircle
} from "react-icons/fa";

import {
  MdBiotech,
  MdOutlineScience,
  MdMemory,
  MdMonitorHeart
} from "react-icons/md";

import { GiElectric } from "react-icons/gi";

export default function ResumenEstados() {
  const [resumen, setResumen] = useState(null);
  const [token, setToken] = useState("");
  const [autorizado, setAutorizado] = useState(false);
  const [mostrarToken, setMostrarToken] = useState(false);
  const [recordar, setRecordar] = useState(false);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState(null);

  const iconosEquipos = {
  RESONADOR: FaBrain,
  TOMOGRAFO: FaXRay,
  MAMOGRAFO: MdMonitorHeart,
  ANGIOGRAFO: FaHeartbeat,
  "CITOMETRO DE FLUJO": MdBiotech,
  PLETISMOGRAFO: FaWaveSquare,
  "MONITOR MULTIPARAMETRICO": FaDesktop,
  "COLCHON TERMICO": FaThermometerHalf,
  ESPECTROMETRO: MdOutlineScience,
  MULTIPLEX: MdMemory,
  "ELECTROFORESIS CAPILAR": GiElectric,
};

  // 🔁 cargar token guardado
  useEffect(() => {
    const tokenGuardado = localStorage.getItem("tokenResumen");
    if (tokenGuardado) {
      setToken(tokenGuardado);
      setRecordar(true);
    }
  }, []);

  useEffect(() => {
  if (autorizado) {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 30000);
    return () => clearInterval(interval);
  }
}, [autorizado]);

  // 🔹 NUEVO FETCH ÚNICO
  const fetchDashboard = async () => {
  try {
    const res = await fetch(API_URL.DashboardResumen, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // 👇 Primero validamos status
    if (!res.ok) {
      const errorText = await res.text();
      console.error("Error HTTP:", res.status, errorText);
      return;
    }

    // 👇 Detectamos tipo de respuesta
    const contentType = res.headers.get("content-type");

    if (!contentType || !contentType.includes("application/json")) {
      const text = await res.text();
      console.error("❌ La respuesta NO es JSON:", text);
      return;
    }

    // 👇 Ahora sí parseamos seguro
    const data = await res.json();

    console.log("✅ Dashboard:", data);
    setResumen(data);

  } catch (error) {
    console.error("Error en fetchDashboard:", error);
  }
};

  // 🔐 LOGIN
  const validarToken = async () => {
    if (token === "ingeclinHR") {
      setAutorizado(true);

      if (recordar) {
        localStorage.setItem("tokenResumen", token);
      } else {
        localStorage.removeItem("tokenResumen");
      }

      await fetchDashboard();
    } else {
      alert("❌ Token incorrecto");
    }
  };

  // 🔐 LOGIN VIEW
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

  const total = resumen?.total || 0;
  const activos = resumen?.activos || 0;
  const no_activos = resumen?.no_activos || 0;

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">

      <h1 className="text-3xl font-bold mb-6 text-center">
        🏥 Equipamiento a cargo del Servicio de Ingeniería Clínica HPDDGR
      </h1>

      {/* 📊 KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6">

        <div className="bg-gray-800 p-4 rounded-xl text-center">
          <h2>Total Equipos</h2>
          <p className="text-3xl font-bold">{total}</p>
        </div>

        <div className="bg-green-600 p-4 rounded-xl text-center">
          <h2>Activos</h2>
          <p className="text-3xl font-bold">{activos}</p>
        </div>

        <div className="bg-red-600 p-4 rounded-xl text-center">
          <h2>Fuera de servicio</h2>
          <p className="text-3xl font-bold">{no_activos}</p>
        </div>

      </div>

      {/* 🚨 EQUIPOS CRÍTICOS */}
      <div>
        <h2 className="text-xl mb-3 text-red-400">
          🚨 Equipos críticos
        </h2>

        {!resumen?.criticos ? (
          <div className="bg-gray-700 p-4 rounded-xl text-center">
            Cargando...
          </div>
        ) : (
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  {resumen.criticos.map((eq, i) => {
    const key = eq.descripcion?.toUpperCase().trim();
    const Icono = iconosEquipos[key] || FaQuestionCircle;

    return (
      <div
        key={i}
        onClick={() => setEquipoSeleccionado(eq)}
        className="bg-gray-800 p-4 rounded-xl cursor-pointer flex flex-col items-center justify-center hover:scale-105 transition"
      >
        {/* 🔹 ICONO */}
        <Icono
          className={`text-4xl mb-2 ${
            eq.activo ? "text-green-400" : "text-red-500"
          }`}
        />

        {/* 🔹 NOMBRE CHICO */}
        <span className="text-xs text-center opacity-80">
          {eq.descripcion}
        </span>
      </div>
    );
  })}
</div>
        )}
      </div>

      {/* 🔍 MODAL */}
      {equipoSeleccionado && (
        <div className="fixed bottom-4 right-4 bg-white text-black p-4 rounded-xl shadow-xl w-80">
          <p><b>{equipoSeleccionado.descripcion}</b></p>
          <p>Serie: {equipoSeleccionado.numero_serie}</p>
          <p>Estado: {equipoSeleccionado.estado}</p>

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
