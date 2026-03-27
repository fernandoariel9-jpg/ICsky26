import { useEffect, useState } from "react";
import { API_URL } from "./config";

const SeleccionEquipo = ({ setVista }) => {
  const [equipos, setEquipos] = useState([]);
  const [busqueda, setBusqueda] = useState("");

  const tareaActiva = JSON.parse(localStorage.getItem("tareaActiva"));

  useEffect(() => {
    fetch(API_URL.Equipos)
      .then(res => res.json())
      .then(data => setEquipos(data))
      .catch(err => console.error("Error cargando equipos:", err));
  }, []);

  const equiposFiltrados = equipos.filter(e =>
    `${e.descripcion} ${e.marca_modelo} ${e.numero_serie}`
      .toLowerCase()
      .includes(busqueda.toLowerCase())
  );

  const handleSeleccionarEquipo = async (equipo) => {
    if (!tareaActiva) return;

    try {
      await fetch(`${API_URL.AsignarEquipo}/${tareaActiva.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          descripcion: equipo.descripcion,
          marca_modelo: equipo.marca_modelo,
          numero_serie: equipo.numero_serie,
          servicio: equipo.servicio,
          subservicio: equipo.sub_servicio,
          area: equipo.area
        })
      });

      localStorage.removeItem("tareaActiva");

      setVista("tareas");

    } catch (error) {
      console.error("Error asignando equipo:", error);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-3">Seleccionar equipo</h2>

      <input
        type="text"
        placeholder="Buscar equipo..."
        className="w-full p-2 border rounded mb-3"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />

      <div className="space-y-2">
        {equiposFiltrados.map((e) => (
          <div
            key={e.numero_serie}
            onClick={() => handleSeleccionarEquipo(e)}
            className="p-3 border rounded cursor-pointer hover:bg-gray-100"
          >
            <p className="font-semibold">{e.descripcion}</p>
            <p className="text-sm text-gray-600">{e.marca_modelo}</p>
            <p className="text-sm text-gray-500">Serie: {e.numero_serie}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SeleccionEquipo;
