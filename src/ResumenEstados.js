import { useEffect, useState } from "react";
import { API_URL } from "./config";

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

  const fetchResumen = async () => {
    try {
      const res = await fetch(API_URL.ResumenEstados, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

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

  // 🔹 ALERTAS AVANZADAS
  const calcularAlertasAvanzadas = () => {
    const alertasAvanzadas = [];

    const getTipo = (tipo) =>
      resumenTipos.find((t) => t.tipo === tipo);

    ["FLAT PANEL", "ARCO EN C", "EQUIPO RX MOVIL"].forEach((tipo) => {
      const data = getTipo(tipo);

      if (data && data.total > 0 && data.no_activos / data.total >= 0.5) {
        alertasAvanzadas.push({
          mensaje: `🚨 RX (${tipo}): ${data.no_activos}/${data.total} fuera de servicio`,
        });
      }
    });

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

  const alertasAvanzadas = calcularAlertasAvanzadas();

  return (
    <div className="p-6 bg-gray-900 text-white min-h-screen">

      <h1 className="text-3xl font-bold mb-6 text-center">
        🏥 Equipamiento a cargo del Servicio de Ingeniería Clínica HPDDGR
      </h1>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6">

        <div className="bg-gray-800 p-4 rounded-xl text-center">
          <h2>Total Equipos</h2>
          <p className="text-3xl font-bold">{total}</p>
        </div>

        <div className="bg-green-600 p-4 rounded-xl text-center">
          <h2>Activos</h2>
          <p className="text-3xl font-bold">
            {resumenTipos.reduce((acc, t) => acc + Number(t.activos), 0)}
          </p>
        </div>

        <div className="bg-red-600 p-4 rounded-xl text-center">
          <h2>Fuera de servicio</h2>
          <p className="text-3xl font-bold">
            {resumenTipos.reduce((acc, t) => acc + Number(t.no_activos), 0)}
          </p>
        </div>

      </div>

      {/* ALERTAS */}
      <div>
        <h2 className="text-xl mb-3 text-red-400">
          🚨 Alertas críticas
        </h2>

        {alertasAvanzadas.length === 0 ? (
          <div className="bg-green-600 p-4 rounded-xl text-center">
            ✅ Todo operativo
          </div>
        ) : (
          alertasAvanzadas.map((a, i) => (
            <div key={i} className="bg-red-600 p-4 rounded-xl mb-2">
              {a.mensaje}
            </div>
          ))
        )}
      </div>

      {/* MODAL */}
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
