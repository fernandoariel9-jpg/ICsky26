import { useEffect, useState } from "react";
import { API_URL } from "./config";
import { useLocation } from "react-router-dom";

export default function ResumenEstados() {
  const [datos, setDatos] = useState([]);
  const [autorizado, setAutorizado] = useState(false);

  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");

    // 👉 TOKEN HARDCODEADO (simple)
    if (token === "ingeclinHR") {
      setAutorizado(true);
      fetchResumen();
    } else {
      setAutorizado(false);
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

  // ❌ BLOQUEO
  if (!autorizado) {
    return (
      <div className="p-4 text-center text-red-500">
        🚫 Acceso no autorizado
      </div>
    );
  }

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
