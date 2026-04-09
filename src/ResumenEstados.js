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

import { FaHospital, FaUserMd, FaProcedures } from "react-icons/fa";
import { MdMedicalServices } from "react-icons/md";

export default function ResumenEstados() {
  const [resumen, setResumen] = useState(null);
  const [token, setToken] = useState("");
  const [autorizado, setAutorizado] = useState(false);
  const [mostrarToken, setMostrarToken] = useState(false);
  const [recordar, setRecordar] = useState(false);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState(null);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState(null);

  const iconosEquipos = {
  RESONADOR: FaBrain,
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

  const iconosServicios = {
  diagnostico_imagen: FaHospital,
  centro_quirurgico: FaProcedures,
  gastroenterologia: FaUserMd,
  tomografos: FaXRay,
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
  const ordenGrupos = [
  "tomografos",
  "diagnostico_imagen",
  "centro_quirurgico",
  "gastroenterologia",
];
const tomografosCard = resumen?.grupos?.tomografos
  ? [{
      descripcion: "TOMOGRAFOS",
      estado: resumen.grupos.tomografos.estado === "ON" ? "ACTIVO" : "FUERA DE SERVICIO",
      esGrupo: true,
      data: resumen.grupos.tomografos
    }]
  : [];

const criticosOrdenados = [...(resumen?.criticos || [])];

const indexResonador = criticosOrdenados.findIndex(
  eq => eq.descripcion?.toUpperCase().includes("RESONADOR")
);

if (indexResonador !== -1 && tomografosCard.length > 0) {
  criticosOrdenados.splice(indexResonador + 1, 0, tomografosCard[0]);
} else {
  // fallback si no encuentra resonador
  criticosOrdenados.push(...tomografosCard);
}

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">

      <h1 className="text-2xl font-bold mb-4 text-center">
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
          
  {criticosOrdenados.map((eq, i) => {
    const key = eq.descripcion?.toUpperCase().trim();

const Icono = eq.esGrupo
  ? FaXRay
  : iconosEquipos[key] || FaQuestionCircle;

    const estado = eq.estado?.toUpperCase().trim();

    let colorClase = "";
    let animacion = "";

    if (estado === "ACTIVO") {
      colorClase = "text-green-400";
    } else if (estado === "FUERA DE SERVICIO") {
      colorClase = "text-red-500";
      animacion = "animate-pulse";
    } else if (estado === "ACTIVO RESTRINGIDO") {
      colorClase = "text-yellow-400";
    } else {
      colorClase = "text-red-500";
    }

    return (
      <div
        key={i}
        onClick={() => {
  if (eq.esGrupo) {
    setGrupoSeleccionado({
      nombre: "Tomógrafos",
      ...eq.data
    });
  } else {
    setEquipoSeleccionado(eq);
  }
}}
        className="bg-gray-800 p-4 rounded-xl cursor-pointer flex flex-col items-center justify-center hover:scale-105 transition"
      >
        {/* 🔹 ICONO */}
        <Icono
          className={`text-4xl mb-2 ${colorClase} ${animacion}`}
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

{/* 🏥 ESTADO POR SERVICIOS */}
<div className="mt-8">
  {!resumen?.grupos ? (
    <div className="bg-gray-700 p-4 rounded-xl text-center">
      Cargando...
    </div>
  ) : (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

     {ordenGrupos
  .filter(key => key !== "tomografos")
  .map((key, i) => {

    const grupo = resumen.grupos[key];
    if (!grupo) return null;

  const nombreMap = {
    diagnostico_imagen: "Equipos de RX",
    centro_quirurgico: "Equipos de Centro Quirúrgico",
    gastroenterologia: "Equipos de Gastroenterología",
  };

  const nombre = nombreMap[key] || key;

  const Icono = iconosServicios[key] || MdMedicalServices;

  let colorClase = "text-green-400";
  let animacion = "";

  if (grupo.estado === "OFF") {
    colorClase = "text-red-500";
    animacion = "animate-pulse";
  }

  return (
    <div
      key={i}
      onClick={() =>
        setGrupoSeleccionado({
          nombre,
          ...grupo
        })
      }
      className="bg-gray-800 p-4 rounded-xl cursor-pointer flex flex-col items-center justify-center hover:scale-105 transition"
    >
      <Icono className={`text-4xl mb-2 ${colorClase} ${animacion}`} />

      <span className="text-xs text-center opacity-80">
        {nombre}
      </span>
    </div>
  );
})}

    </div>
  )}
</div>

      {/* 🔍 MODAL */}
      {equipoSeleccionado && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
    
    <div className="bg-gray-900 text-white p-6 rounded-2xl shadow-2xl w-80 border border-cyan-400/30 animate-scaleIn">

      <h3 className="text-lg font-bold mb-3 text-cyan-400">
        {equipoSeleccionado.descripcion}
      </h3>

      <p className="text-sm mb-1">
  <span className="text-gray-400">Marca / Modelo:</span>{" "}
  {equipoSeleccionado.marca_modelo || "Sin datos"}
</p>

      <p className="text-sm mb-1">
        <span className="text-gray-400">Serie:</span> {equipoSeleccionado.numero_serie}
      </p>

      <p className="text-sm mb-4">
        <span className="text-gray-400">Estado:</span>{" "}
        <span
  className={
    ["ACTIVO", "ACTIVO RESTRINGIDO"].includes(
      equipoSeleccionado.estado?.toUpperCase().trim()
    )
      ? "text-green-400"
      : "text-red-400"
  }
>
  {equipoSeleccionado.estado}
</span>
      </p>

      <button
        onClick={() => setEquipoSeleccionado(null)}
        className="w-full mt-2 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-xl transition"
      >
        Cerrar
      </button>

    </div>
  </div>
)}
{grupoSeleccionado && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">

    <div className="bg-gray-900 text-white p-6 rounded-2xl shadow-2xl w-96 max-h-[80vh] overflow-y-auto border border-blue-400/30 animate-scaleIn">

      <h3 className="text-lg font-bold mb-2 text-blue-400">
        {grupoSeleccionado.nombre}
      </h3>

      <p className="text-sm mb-1">
  <span className="text-gray-400">Equipos inactivos:</span>{" "}
  
</p>

<p className="text-sm mb-4">
  <span className="text-gray-400">Estado:</span>{" "}
  <span className="text-red-400 font-semibold">
    {grupoSeleccionado.subgrupos.reduce((acc, sg) => acc + sg.no_activos, 0)} / 
{grupoSeleccionado.subgrupos.reduce((acc, sg) => acc + sg.total, 0)}
  </span>{" "}
  fuera de servicio
</p>

      {grupoSeleccionado.detalle.length === 0 ? (
        <p className="text-green-400">✔ Todos activos</p>
      ) : (
        <div className="space-y-2">
          {grupoSeleccionado.detalle.map((eq, i) => (
            <div key={i} className="border-b border-gray-700 pb-2">
              <p className="text-sm font-semibold">
                {eq.marca_modelo}
              </p>
              <p className="text-sm font-semibold">
                {eq.descripcion}
              </p>
              <p className="text-xs text-gray-400">
                Serie: {eq.numero_serie}
              </p>
              <p className="text-xs text-red-400">
                Estado: {eq.estado}
              </p>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => setGrupoSeleccionado(null)}
        className="w-full mt-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-xl transition"
      >
        Cerrar
      </button>

    </div>
  </div>
)}

    </div>
  );
}
