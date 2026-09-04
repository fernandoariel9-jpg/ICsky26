import { useState, useEffect } from "react";
import { API_URL } from "./config";

export default function SeleccionEquipo({ setVista }) {
  const [serie, setSerie] = useState("");
  const [equipo, setEquipo] = useState(null);
  const [error, setError] = useState("");
  const [coincidencias, setCoincidencias] = useState([]);
  const [buscando, setBuscando] = useState(false);

  useEffect(() => {
    const tareaGuardada = localStorage.getItem("tareaActiva");

    if (!tareaGuardada) {
      alert("No hay tarea activa");
      setVista("tareas");
    }
  }, []);

 const buscarEquipo = async (serieBuscar = serie) => {

  if (!serieBuscar) return;

  try {

    const res = await fetch(
      `${API_URL.BuscarEquipo}/${encodeURIComponent(serieBuscar)}`
    );

    if (!res.ok) throw new Error();

    const data = await res.json();

    setEquipo(data);
    setError("");
    setCoincidencias([]);

  } catch {

    setEquipo(null);
    setError("Equipo no encontrado");

  }

};
  const seleccionarEquipo = async () => {
      if (!equipo?.servicio || !equipo?.sub_servicio) {
    alert(
      "⚠️ No se puede seleccionar este equipo.\n\n" +
      "El equipo debe tener asignados Servicio y Subservicio."
    );
    return;
  }
    try {
      const tareaActiva = JSON.parse(localStorage.getItem("tareaActiva"));

      await fetch(`${API_URL.Ric01}/asignar-equipo/${tareaActiva.id}`, {
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

      alert("Equipo asignado ✅");

      localStorage.removeItem("tareaActiva");
      setVista("tareas");

    } catch (error) {
      console.error(error);
      alert("Error al asignar equipo");
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">🔎 Seleccionar Equipo</h1>

      {/* Input */}
      <input
  type="text"
  placeholder="Número de serie"
  value={serie}
  onChange={async (e) => {

    const valor = e.target.value;

    setSerie(valor);

    if (valor.trim().length < 2) {

      setCoincidencias([]);
      return;

    }

    try {

      setBuscando(true);

      const res = await fetch(
        `${API_URL.BuscarEquipos}?q=${encodeURIComponent(valor)}`
      );

      const data = await res.json();

      setCoincidencias(data);

    } catch (err) {

      console.error(err);

    } finally {

      setBuscando(false);

    }

  }}
  className="w-full border p-2 rounded-xl"
/>
      {buscando && (

  <p className="text-sm text-gray-500 mt-1">
    Buscando...
  </p>

)}

      {coincidencias.length > 0 && (

  <div className="border rounded-xl bg-white shadow max-h-60 overflow-y-auto mb-3">

    {coincidencias.map((item) => (

      <div
        key={item.id}
        className="p-2 border-b hover:bg-blue-100 cursor-pointer"
        onClick={() => {

          setSerie(item.numero_serie);

          buscarEquipo(item.numero_serie);

        }}
      >

        <div className="font-semibold">

          {item.numero_serie}

        </div>

        <div className="text-sm">

          {item.descripcion}

        </div>

        <div className="text-xs text-gray-500">

          {item.marca_modelo}

        </div>

      </div>

    ))}

  </div>

)}

      {/* Botón buscar */}
      <button
        onClick={buscarEquipo}
        className="bg-green-500 text-white px-4 py-2 rounded-xl w-full mb-3"
      >
        🔍 Buscar
      </button>

      {/* Aviso tarea activa */}
      {localStorage.getItem("tareaActiva") && (
        <div className="bg-yellow-100 p-2 rounded mb-3">
          📋 Asignando equipo a tarea
        </div>
      )}

      {/* Resultado */}
      {equipo && (
        <div className="bg-white shadow rounded-xl p-3 mt-3">
          <p><b>Equipo:</b> {equipo.descripcion}</p>
          <p><b>Marca:</b> {equipo.marca_modelo}</p>
          <p><b>Serie:</b> {equipo.numero_serie}</p>
          <p><b>Servicio:</b> {equipo.servicio}</p>
          <p><b>Subservicio:</b> {equipo.sub_servicio}</p>
          <p><b>Área:</b> {equipo.area}</p>
          <p><b>Estado:</b> {equipo.estado}</p>
          <p><b>Último mantenimiento:</b> {equipo.ultimo_mant}</p>

          <button
            onClick={seleccionarEquipo}
            className="bg-blue-500 text-white px-4 py-2 rounded-xl w-full mt-3"
          >
            ✅ Seleccionar equipo
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-red-500 mt-3">{error}</p>
      )}

      {/* Volver */}
      <button
        onClick={() => setVista("tareas")}
        className="bg-gray-400 text-white px-4 py-2 rounded-xl w-full mt-4"
      >
        ← Volver
      </button>
    </div>
  );
}
