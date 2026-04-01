import { useEffect, useState } from "react";
import { API_URL } from "./config";

export default function ResumenEstados() {
  const [datos, setDatos] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchResumen = async () => {
    try {
      const res = await fetch(API_URL.ResumenEstados);
      const data = await res.json();
      setDatos(data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumen();
  }, []);

  if (loading) return <p className="p-4">Cargando...</p>;

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">
        📊 Estado de Equipos
      </h1>

      <div className="bg-white shadow rounded-xl p-4">
        {datos.map((item, index) => (
          <div
            key={index}
            className="flex justify-between border-b py-2"
          >
            <span>{item.estado}</span>
            <span className="font-bold">{item.cantidad}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
