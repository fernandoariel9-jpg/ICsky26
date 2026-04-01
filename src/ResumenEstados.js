import { useEffect, useState } from "react";
import { API_URL } from "./config";

export default function ResumenEstados() {
  const [datos, setDatos] = useState([]);
  const [token, setToken] = useState("");
  const [autorizado, setAutorizado] = useState(false);
  const [mostrarToken, setMostrarToken] = useState(false);
  const [recordar, setRecordar] = useState(false);

  // 🔁 cargar token guardado
  useEffect(() => {
    const tokenGuardado = localStorage.getItem("tokenResumen");
    if (tokenGuardado) {
      setToken(tokenGuardado);
      setRecordar(true);
    }
  }, []);

  const validarToken = async () => {
    if (token === "ingeclinHR") {
      setAutorizado(true);

      if (recordar) {
        localStorage.setItem("tokenResumen", token);
      } else {
        localStorage.removeItem("tokenResumen");
      }

      fetchResumen();
    } else {
      alert("❌ Token incorrecto");
    }
  };

  const fetchResumen = async () => {
    try {
      const res = await fetch(API_URL.ResumenEstados);
      const data = await res.json();
      setDatos(data);
    } catch (error) {
      console.error(error);
    }
  };

  // 🔐 LOGIN
  if (!autorizado) {
    return (
      <div className="p-4 max-w-sm mx-auto">
        <h1 className="text-xl font-bold mb-4 text-center">
          🔐 Acceso
        </h1>

        {/* INPUT TOKEN */}
        <input
          type={mostrarToken ? "text" : "password"}
          placeholder="Ingresar token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="w-full border p-2 rounded-xl mb-2"
        />

        {/* VER TOKEN */}
        <button
          onClick={() => setMostrarToken(!mostrarToken)}
          className="text-sm text-blue-500 mb-2"
        >
          {mostrarToken ? "🙈 Ocultar" : "👁 Ver token"}
        </button>

        {/* RECORDAR */}
        <div className="flex items-center mb-3">
          <input
            type="checkbox"
            checked={recordar}
            onChange={() => setRecordar(!recordar)}
            className="mr-2"
          />
          <label>Recordar token</label>
        </div>

        {/* BOTON */}
        <button
          onClick={validarToken}
          className="bg-green-500 text-white px-4 py-2 rounded-xl w-full"
        >
          Ingresar
        </button>
      </div>
    );
  }

  // 📊 DATA
  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">
        📊 Estado de Equipos
      </h1>

      {datos.map((item, index) => (
        <div key={index} className="flex justify-between border-b py-2">
          <span>{item.estado}</span>
          <span className="font-bold">{item.cantidad}</span>
        </div>
      ))}
    </div>
  );
}
