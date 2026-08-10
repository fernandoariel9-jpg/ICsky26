import { useState, useEffect } from "react";
import { API_URL } from "./config";

export default function RIC29({ setVista, personal }) {

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [datos, setDatos] = useState({
    ric01_id: "",
    equipo_id: "",
    numero_serie: "",
    descripcion: "",
    marca_modelo: "",
    area: "",
    servicio: "",
    sub_servicio: "",
    encargado: "",
    tecnico: personal?.nombre || ""
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {

    try {

      const tareaGuardada =
        localStorage.getItem("tareaActiva");

      if (!tareaGuardada) {

        setError("No hay una tarea activa.");

        setCargando(false);

        return;
      }

      const tarea = JSON.parse(tareaGuardada);

      console.log("Tarea activa para RIC29:", tarea);

      /*
       * Buscamos el equipo asociado a la tarea.
       */

      let equipo = null;

      if (tarea.numero_serie) {

        const res = await fetch(
          `${API_URL.BuscarEquipo}/${encodeURIComponent(
            tarea.numero_serie
          )}`
        );

        if (!res.ok) {
          throw new Error("No se encontró el equipo.");
        }

        equipo = await res.json();

      }

      /*
       * Cargamos los datos.
       */

      setDatos({

        ric01_id: tarea.id || "",

        equipo_id: equipo?.id || "",

        numero_serie:
          equipo?.numero_serie ||
          tarea.numero_serie ||
          "",

        descripcion:
          equipo?.descripcion ||
          tarea.descripcion ||
          "",

        marca_modelo:
          equipo?.marca_modelo ||
          tarea.marca_modelo ||
          "",

        area:
          equipo?.area ||
          tarea.area ||
          "",

        servicio:
          equipo?.servicio ||
          tarea.servicio ||
          "",

        sub_servicio:
          equipo?.sub_servicio ||
          tarea.subservicio ||
          "",

        encargado:
          equipo?.encargado ||
          "",

        tecnico:
          personal?.nombre ||
          tarea.usuario ||
          ""

      });

    } catch (err) {

      console.error(
        "Error cargando datos RIC29:",
        err
      );

      setError(
        err.message ||
        "No se pudieron cargar los datos del equipo."
      );

    } finally {

      setCargando(false);

    }

  };

  if (cargando) {

    return (
      <div className="p-6 text-center">

        <p className="text-lg">
          ⏳ Cargando datos del equipo...
        </p>

      </div>
    );

  }

  if (error) {

    return (
      <div className="p-6 max-w-xl mx-auto">

        <div className="bg-red-100 text-red-700 p-4 rounded-xl">

          ⚠️ {error}

        </div>

        <button
          onClick={() => setVista("equipos")}
          className="w-full bg-gray-500 text-white rounded-xl p-3 mt-4"
        >
          ← Volver
        </button>

      </div>
    );

  }

  return (

    <div className="p-4 max-w-xl mx-auto">

      <h1 className="text-2xl font-bold text-center mb-6">
        📋 RIC 29
      </h1>

      {/* -------------------------------- */}
      {/* DATOS DEL EQUIPO */}
      {/* -------------------------------- */}

      <div className="bg-gray-100 rounded-xl p-4 mb-4">

        <h2 className="font-bold text-lg mb-3">
          🏥 Datos del equipo
        </h2>

        <div className="space-y-1">

          <p>
            <b>Descripción:</b>{" "}
            {datos.descripcion || "-"}
          </p>

          <p>
            <b>Marca / Modelo:</b>{" "}
            {datos.marca_modelo || "-"}
          </p>

          <p>
            <b>Número de serie:</b>{" "}
            {datos.numero_serie || "-"}
          </p>

          <p>
            <b>Área:</b>{" "}
            {datos.area || "-"}
          </p>

          <p>
            <b>Servicio:</b>{" "}
            {datos.servicio || "-"}
          </p>

          <p>
            <b>Subservicio:</b>{" "}
            {datos.sub_servicio || "-"}
          </p>

          <p>
            <b>Encargado:</b>{" "}
            {datos.encargado || "-"}
          </p>

          <p>
            <b>Técnico:</b>{" "}
            {datos.tecnico || "-"}
          </p>

        </div>

      </div>


      {/* -------------------------------- */}
      {/* PROTOCOLO */}
      {/* -------------------------------- */}

      <div className="bg-white border rounded-xl p-4">

        <h2 className="font-bold text-lg mb-3">
          🔧 Protocolo RIC 29
        </h2>

        <p className="text-gray-500">
          Aquí incorporaremos las mediciones
          del cardiodesfibrilador.
        </p>

      </div>


      <button
        onClick={() => setVista("equipos")}
        className="w-full bg-gray-500 text-white rounded-xl p-3 mt-6"
      >
        ← Volver
      </button>

    </div>

  );

}
