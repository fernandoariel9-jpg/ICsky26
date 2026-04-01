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

  // 🔁 cargar token guardado
  useEffect(() => {
    const tokenGuardado = localStorage.getItem("tokenResumen");
    if (tokenGuardado) {
      setToken(tokenGuardado);
      setRecordar(true);
    }
  }, []);

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
    } else {
      alert("❌ Token incorrecto");
    }
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

  // 📊 DATA
  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">
        📊 Estado de Equipos
      </h1>

      {datos.map((item, index) => {
        const porcentaje = total
          ? ((item.cantidad / total) * 100).toFixed(1)
          : 0;

        return (
          <div key={index} className="flex justify-between border-b py-2">
            <span>{item.estado}</span>
            <span className="font-bold">
              {item.cantidad} ({porcentaje}%)
            </span>
          </div>
        );
      })}

      {/* 🏥 EQUIPOS CRÍTICOS VISUAL */}
<h2 className="mt-6 font-bold text-lg">
  🏥 Equipos críticos
</h2>

{["TOMOGRAFO", "RESONADOR", "ANGIOGRAFO", "MAMOGRAFO", "ORTOPANTOMOGRAFO", "SERIOGRAFO"].map((tipo) => {
  const equipo = alertas.find(
    (e) => e.descripcion.toUpperCase() === tipo
  );

  const estaActivo = (tipo) => {
  return !alertas.find(
    (e) => e.descripcion?.toUpperCase().includes(tipo)
  );
};

  const alertasAvanzadas = [];

// 🔴 RX
const contarNoActivos = (tipo) =>
  alertas.filter((e) =>
    e.descripcion?.toUpperCase().includes(tipo)
  ).length;

const contarTotal = (tipo) =>
  datos
    .filter((d) => d.estado) // usamos datos solo como referencia global
    .reduce((acc) => acc, 0); // no usamos esto realmente

// ⚠️ mejor: calcular sobre alertas + activos
const contarEquipos = (tipo) => {
  const total = alertas.filter((e) =>
    e.descripcion?.toUpperCase().includes(tipo)
  ).length;

  // ⚠️ si querés precisión real, esto debería venir de backend
  return total;
};

// RX condiciones (basado en alertas)
const rxTipos = ["FLAT PANEL", "ARCO EN C", "RX MOVIL"];

rxTipos.forEach((tipo) => {
  const noActivos = alertas.filter((e) =>
    e.descripcion?.toUpperCase().includes(tipo)
  ).length;

  // ⚠️ asumimos total conocido = 2 (ajustable)
  const total = 2; // 👈 CAMBIAR SEGÚN TU REALIDAD

  if (noActivos / total >= 0.5 && noActivos > 0) {
    alertasAvanzadas.push({
      tipo: "critico",
      mensaje: `🚨 RX (${tipo}): ${noActivos}/${total} fuera de servicio`,
    });
  }
});

// 🔴 CENTRO QUIRURGICO
const quirurgicos = [
  "BOMBA EXTRACORPOREA",
  "FACOEMULSIFICADOR",
  "CRANEOTOMO",
  "BALON DE CONTRAPULSACION",
  "MICROSCOPIO",
  "LITOTRIPTOR",
  "HISTEROSCOPIO",
];

quirurgicos.forEach((tipo) => {
  const noActivo = alertas.find((e) =>
    e.descripcion?.toUpperCase().includes(tipo)
  );

  if (noActivo) {
    alertasAvanzadas.push({
      tipo: "critico",
      mensaje: `🚨 QUIRÓFANO: ${tipo} fuera de servicio`,
    });
  }
});

// 🔴 GASTRO
const gastro = "VIDEOCOLONOSCOPIO";

const noActivosGastro = alertas.filter((e) =>
  e.descripcion?.toUpperCase().includes(gastro)
).length;

const totalGastro = 2; // 👈 AJUSTAR

if (noActivosGastro / totalGastro >= 0.5 && noActivosGastro > 0) {
  alertasAvanzadas.push({
    tipo: "critico",
    mensaje: `🚨 GASTRO: ${noActivosGastro}/${totalGastro} videocolonoscopios fuera de servicio`,
  });
}

  return (
    <div
      key={tipo}
      className="flex items-center justify-between border-b py-2 cursor-pointer"
      onClick={() => !estaActivo && setEquipoSeleccionado(equipo)}
    >
      <span>{tipo}</span>

      <span
        className={`w-4 h-4 rounded-full ${
          estaActivo ? "bg-green-500" : "bg-red-500"
        }`}
      ></span>
    </div>
  );
})}

{/* 🔍 MODAL / DETALLE */}
{equipoSeleccionado && (
  <div className="mt-4 p-3 border rounded-xl bg-gray-100">
    <h3 className="font-bold">
      🔍 Detalle del equipo
    </h3>

    <p><b>Equipo:</b> {equipoSeleccionado.descripcion}</p>
    <p><b>Serie:</b> {equipoSeleccionado.numero_serie}</p>
    <p><b>Estado:</b> {equipoSeleccionado.estado}</p>

    <button
      onClick={() => setEquipoSeleccionado(null)}
      className="mt-2 px-3 py-1 bg-gray-500 text-white rounded"
    >
      Cerrar
    </button>
  </div>
)}
    </div>
  );
}
{alertasAvanzadas.length > 0 && (
  <div className="mt-6">
    <h2 className="font-bold text-lg mb-2">
      🚨 Alertas operativas
    </h2>

    {alertasAvanzadas.map((a, i) => (
      <div
        key={i}
        className="bg-red-500 text-white p-3 rounded-xl mb-2"
      >
        {a.mensaje}
      </div>
    ))}
  </div>
)}
