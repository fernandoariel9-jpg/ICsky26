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

  // =====================================================
// ENTREGA DE ENERGÍA
// Tabla: ric29_energia
// =====================================================

const [energia, setEnergia] = useState({
  energia_nominal: "",
  resultado_medicion: "",
  incertidumbre: "",
  rango_min: "",
  rango_max: "",
  conforme: ""
});

// =====================================================
// TIEMPO DE CARGA
// Tabla: ric29_carga
// =====================================================

const [cargas, setCargas] = useState([
  {
    numero_medicion: 1,
    resultado_medicion: "",
    incertidumbre: "",
    rango_max: "",
    conforme: ""
  }
]);

// =====================================================
// BATERÍA
// Tabla: ric29_bateria
// =====================================================

const [baterias, setBaterias] = useState([
  {
    numero_medicion: 1,
    resultado_medicion: "",
    incertidumbre: "",
    rango_max: "",
    conforme: "",
    observaciones: ""
  }
]);

// =====================================================
// MONITORIZACIÓN
// Tabla: ric29_monitorizacion
// =====================================================

const [monitorizacion, setMonitorizacion] = useState({
  frecuencia_nominal: "",
  resultado_medicion: "",
  incertidumbre: "",
  conforme: ""
});

// =====================================================
// ALARMAS
// Tabla: ric29_alarmas
// =====================================================

const [alarmas, setAlarmas] = useState({
  alarma_alta_frecuencia: false,
  alarma_baja_frecuencia: false,
  activacion_alarmas: false,
  observaciones: ""
});

// =====================================================
// INSPECCIONES
// Tabla: ric29_inspecciones
// =====================================================

const [inspecciones, setInspecciones] = useState({
  limpieza_exterior: "",
  papel_registro: "",
  estado_cables: "",
  observaciones: ""
});

// =====================================================
// SINCRONISMO
// Tabla: ric29_sincronismo
// =====================================================

const [sincronismo, setSincronismo] = useState({
  resultado_medicion: "",
  incertidumbre: "",
  rango_max: "",
  conforme: ""
});

// =====================================================
// RESULTADO GENERAL
// Tabla: ric29
// =====================================================

const [resultadoGeneral, setResultadoGeneral] = useState("");

const [observacionesGenerales, setObservacionesGenerales] =
  useState("");

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

        {/* -------------------------------- */}
{/* ENTREGA DE ENERGÍA */}
{/* -------------------------------- */}

<div className="bg-white border rounded-xl p-4 mb-4">

  <h2 className="font-bold text-lg mb-4">
    ⚡ Entrega de energía
  </h2>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

    <div>
      <label className="block font-semibold mb-1">
        Energía nominal
      </label>

      <input
        type="number"
        step="any"
        value={energia.energia_nominal}
        onChange={(e) =>
          setEnergia({
            ...energia,
            energia_nominal: e.target.value
          })
        }
        className="w-full border rounded-lg p-2"
      />
    </div>

    <div>
      <label className="block font-semibold mb-1">
        Resultado de medición
      </label>

      <input
        type="number"
        step="any"
        value={energia.resultado_medicion}
        onChange={(e) =>
          setEnergia({
            ...energia,
            resultado_medicion: e.target.value
          })
        }
        className="w-full border rounded-lg p-2"
      />
    </div>

    <div>
      <label className="block font-semibold mb-1">
        Incertidumbre
      </label>

      <input
        type="number"
        step="any"
        value={energia.incertidumbre}
        onChange={(e) =>
          setEnergia({
            ...energia,
            incertidumbre: e.target.value
          })
        }
        className="w-full border rounded-lg p-2"
      />
    </div>

    <div>
      <label className="block font-semibold mb-1">
        Rango mínimo
      </label>

      <input
        type="number"
        step="any"
        value={energia.rango_min}
        onChange={(e) =>
          setEnergia({
            ...energia,
            rango_min: e.target.value
          })
        }
        className="w-full border rounded-lg p-2"
      />
    </div>

    <div>
      <label className="block font-semibold mb-1">
        Rango máximo
      </label>

      <input
        type="number"
        step="any"
        value={energia.rango_max}
        onChange={(e) =>
          setEnergia({
            ...energia,
            rango_max: e.target.value
          })
        }
        className="w-full border rounded-lg p-2"
      />
    </div>

    <div>
      <label className="block font-semibold mb-1">
        Conforme
      </label>

      <select
        value={energia.conforme}
        onChange={(e) =>
          setEnergia({
            ...energia,
            conforme:
              e.target.value === ""
                ? ""
                : e.target.value === "true"
          })
        }
        className="w-full border rounded-lg p-2"
      >

        <option value="">
          Seleccione
        </option>

        <option value="true">
          Sí
        </option>

        <option value="false">
          No
        </option>

      </select>
    </div>

  </div>

</div>
{/* -------------------------------- */}
{/* TIEMPO DE CARGA */}
{/* -------------------------------- */}

<div className="bg-white border rounded-xl p-4 mb-4">

  <h2 className="font-bold text-lg mb-4">
    ⏱️ Tiempo de carga
  </h2>

  {cargas.map((medicion, index) => (

    <div
      key={index}
      className="border rounded-xl p-3 mb-3 bg-gray-50"
    >

      <h3 className="font-bold mb-3">
        Medición {medicion.numero_medicion}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

        <div>
          <label className="block font-semibold mb-1">
            Resultado
          </label>

          <input
            type="number"
            step="any"
            value={medicion.resultado_medicion}
            onChange={(e) => {

              const copia = [...cargas];

              copia[index].resultado_medicion =
                e.target.value;

              setCargas(copia);

            }}
            className="w-full border rounded-lg p-2"
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">
            Incertidumbre
          </label>

          <input
            type="number"
            step="any"
            value={medicion.incertidumbre}
            onChange={(e) => {

              const copia = [...cargas];

              copia[index].incertidumbre =
                e.target.value;

              setCargas(copia);

            }}
            className="w-full border rounded-lg p-2"
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">
            Rango máximo
          </label>

          <input
            type="number"
            step="any"
            value={medicion.rango_max}
            onChange={(e) => {

              const copia = [...cargas];

              copia[index].rango_max =
                e.target.value;

              setCargas(copia);

            }}
            className="w-full border rounded-lg p-2"
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">
            Conforme
          </label>

          <select
            value={medicion.conforme}
            onChange={(e) => {

              const copia = [...cargas];

              copia[index].conforme =
                e.target.value === ""
                  ? ""
                  : e.target.value === "true";

              setCargas(copia);

            }}
            className="w-full border rounded-lg p-2"
          >

            <option value="">
              Seleccione
            </option>

            <option value="true">
              Sí
            </option>

            <option value="false">
              No
            </option>

          </select>
        </div>

      </div>

      {cargas.length > 1 && (

        <button
          type="button"
          onClick={() => {

            setCargas(
              cargas
                .filter((_, i) => i !== index)
                .map((item, i) => ({
                  ...item,
                  numero_medicion: i + 1
                }))
            );

          }}
          className="bg-red-500 text-white rounded-lg px-3 py-2 mt-3"
        >
          🗑️ Eliminar medición
        </button>

      )}

    </div>

  ))}

  <button
    type="button"
    onClick={() => {

      setCargas([
        ...cargas,
        {
          numero_medicion: cargas.length + 1,
          resultado_medicion: "",
          incertidumbre: "",
          rango_max: "",
          conforme: ""
        }
      ]);

    }}
    className="bg-blue-600 text-white rounded-lg px-4 py-2"
  >
    ➕ Agregar medición
  </button>

</div>
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
