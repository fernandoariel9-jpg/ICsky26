import { useEffect, useState } from "react";
import { API_URL } from "./config";
import {
  FaXRay,
  FaBrain,
  FaHeartbeat,
  FaVial,
  FaWaveSquare,
  FaDesktop,
  FaThermometerHalf
} from "react-icons/fa";

import {
  MdBiotech,
  MdOutlineScience,
  MdMemory,
  MdMonitorHeart
} from "react-icons/md";

import { GiElectric } from "react-icons/gi";

import { FaQuestionCircle } from "react-icons/fa";

export default function ResumenEstados() {
  const [resumen, setResumen] = useState(null);
  const [token, setToken] = useState("");
  const [autorizado, setAutorizado] = useState(false);
  const [mostrarToken, setMostrarToken] = useState(false);
  const [recordar, setRecordar] = useState(false);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState(null);

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

  const Icono = iconosEquipos[eq.descripcion] || FaQuestionCircle;

  const iconosEquipos = {
  RESONADOR: FaBrain,                     // 🧠
  TOMOGRAFO: FaXRay,                      // ☢️
  MAMOGRAFO: MdMonitorHeart,              // ❤️ imagen médica
  ANGIOGRAFO: FaHeartbeat,                // ❤️ vascular
  "CITOMETRO DE FLUJO": MdBiotech,        // 🧬 biotecnología
  PLETISMOGRAFO: FaWaveSquare,            // 📈 ondas
  "MONITOR MULTIPARAMETRICO": FaDesktop,  // 🖥 monitor
  "COLCHON TERMICO": FaThermometerHalf,   // 🌡 temperatura
  ESPECTROMETRO: MdOutlineScience,        // 🔬 análisis
  MULTIPLEX: MdMemory,                    // 🧠 procesamiento múltiple
  "ELECTROFORESIS CAPILAR": GiElectric,   // ⚡ separación eléctrica
};

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

const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background: "rgba(0,0,0,0.7)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

const modalStyle = {
  background: "#111",
  padding: "30px",
  borderRadius: "10px",
  color: "white",
  minWidth: "300px",
};

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
      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
  {resumen?.criticos?.map((eq, index) => {
    const Icono = iconosEquipos[eq.descripcion] || FaLaptopMedical;

    return (
      <div
        key={index}
        onClick={() => setEquipoSeleccionado(eq)}
        style={{
          cursor: "pointer",
          fontSize: "40px",
          color: eq.activo ? "#00ff88" : "#ff3b3b",
          transition: "transform 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.2)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        <Icono />
      </div>
    );
  })}
</div>

      {/* 🔍 MODAL */}
      {equipoSeleccionado && (
  <div style={overlayStyle}>
    <div style={modalStyle}>
      <h2>{equipoSeleccionado.descripcion}</h2>
      <p><strong>Serie:</strong> {equipoSeleccionado.numero_serie}</p>
      <p>
        <strong>Estado:</strong>{" "}
        <span style={{ color: equipoSeleccionado.activo ? "green" : "red" }}>
          {equipoSeleccionado.estado}
        </span>
      </p>

      <button onClick={() => setEquipoSeleccionado(null)}>
        Cerrar
      </button>
    </div>
  </div>
)}

    </div>
  );
}
