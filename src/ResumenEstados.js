import { useEffect, useState } from "react";
import { API_URL } from "./config";

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

  // 🔹 NUEVO FETCH ÚNICO
  const fetchDashboard = async () => {
    try {
      const res = await fetch(API_URL.DashboardResumen, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      setResumen(data);
    } catch (error) {
      console.error(error);
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
          resumen.criticos.map((eq, i) => (
            <div
              key={i}
              className="flex justify-between bg-gray-800 p-4 rounded-xl mb-2 cursor-pointer"
              onClick={() => setEquipoSeleccionado(eq)}
            >
              <span>
                {eq.descripcion} {eq.numero_serie}
              </span>

              <span className="font-bold">
                {eq.activo ? "🟢 ON" : "🔴 OFF"}
              </span>
            </div>
          ))
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
