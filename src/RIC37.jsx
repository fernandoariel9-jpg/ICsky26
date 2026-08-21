import { useState, useEffect } from "react";
import { API_URL } from "./config";

export default function RIC37({ setVista, personal }) {

  // =====================================================
  // ESTADO GENERAL
  // =====================================================

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  // =====================================================
  // DATOS DEL MANTENIMIENTO / EQUIPO
  // =====================================================

  const [datos, setDatos] = useState({
    ric01_id: "",
    equipo_id: "",
    numero_serie: "",
    descripcion: "",
    marca_modelo: "",
    area: "",
    servicio: "",
    sub_servicio: "",
    tecnico: personal?.nombre || ""
  });

  // =====================================================
  // DATOS DEL ENSAYO
  // =====================================================

  const [clase, setClase] = useState("");
  const [tipoProteccion, setTipoProteccion] = useState("");

  const [medicionTension, setMedicionTension] = useState("");
  const [medicionCorriente, setMedicionCorriente] = useState("");

  // =====================================================
  // INDICACIONES
  // =====================================================

  const [indicaciones, setIndicaciones] = useState("");

  // =====================================================
  // DETERMINACIONES
  // =====================================================

  const [determinaciones, setDeterminaciones] = useState([
    {
      numero: 1,
      nombre: "Resistencia de protección a tierra",
      medicion: "",
      rango: 0.3,
      conforme: null,
      noAplica: false
    },
    {
      numero: 2,
      nombre: "Corriente de fuga de equipo",
      medicion: "",
      rango: 500,
      conforme: null,
      noAplica: false
    },
    {
      numero: 3,
      nombre: "Corriente de fuga reversa de equipo",
      medicion: "",
      rango: 500,
      conforme: null,
      noAplica: false
    }
  ]);

  // =====================================================
  // DETERMINACIÓN 4
  // =====================================================

  const [medicionesPartesAplicables, setMedicionesPartesAplicables] =
    useState([
      {
        id: Date.now(),
        medicion: "",
        observaciones: "",
        conforme: null,
        noAplica: false
      }
    ]);

  // =====================================================
  // OBSERVACIONES GENERALES
  // =====================================================

  const [observaciones, setObservaciones] = useState("");

  // =====================================================
  // FIRMAS
  // =====================================================

  const [firmaTecnico, setFirmaTecnico] = useState("");
  const [firmaResponsable, setFirmaResponsable] = useState("");

  // =====================================================
  // CARGAR TAREA ACTIVA
  // =====================================================

  useEffect(() => {

    const cargarDatos = async () => {

      try {

        const tareaGuardada =
          localStorage.getItem("tareaActiva");

        if (!tareaGuardada) {
          throw new Error(
            "No existe un mantenimiento activo."
          );
        }

        const tarea =
          JSON.parse(tareaGuardada);

        console.log(
          "RIC37 - TAREA ACTIVA:",
          tarea
        );

        if (!tarea.id && !tarea.ric01_id) {
          throw new Error(
            "El mantenimiento no tiene ID."
          );
        }

        setDatos({
          ric01_id:
            tarea.ric01_id ||
            tarea.id ||
            "",

          equipo_id:
            tarea.equipo_id ||
            "",

          numero_serie:
            tarea.numero_serie ||
            "",

          descripcion:
            tarea.descripcion ||
            "",

          marca_modelo:
            tarea.marca_modelo ||
            "",

          area:
            tarea.area ||
            "",

          servicio:
            tarea.servicio ||
            "",

          sub_servicio:
            tarea.sub_servicio ||
            tarea.subservicio ||
            "",

          tecnico:
            personal?.nombre ||
            tarea.asignado ||
            tarea.tecnico ||
            ""
        });

      } catch (err) {

        console.error(
          "ERROR CARGANDO RIC37:",
          err
        );

        setError(
          err.message ||
          "No se pudieron cargar los datos."
        );

      } finally {

        setCargando(false);

      }

    };

    cargarDatos();

  }, [personal]);

  // =====================================================
  // CAMBIAR DETERMINACIÓN
  // =====================================================

  const cambiarDeterminacion = (
    index,
    campo,
    valor
  ) => {

    setDeterminaciones(
      (actuales) =>
        actuales.map((item, i) =>
          i === index
            ? {
                ...item,
                [campo]: valor
              }
            : item
        )
    );

  };

  // =====================================================
  // CALCULAR RESULTADO
  // =====================================================

  const calcularConformidad = (
    medicion,
    rango
  ) => {

    if (
      medicion === "" ||
      medicion === null ||
      medicion === undefined
    ) {
      return null;
    }

    const valor =
      Number(
        String(medicion).replace(",", ".")
      );

    if (Number.isNaN(valor)) {
      return null;
    }

    return valor <= rango;

  };

  // =====================================================
  // CAMBIAR MEDICIÓN 4
  // =====================================================

  const cambiarMedicionPartes = (
    id,
    campo,
    valor
  ) => {

    setMedicionesPartesAplicables(
      (actuales) =>
        actuales.map((item) => {

          if (item.id !== id) {
            return item;
          }

          const actualizado = {
            ...item,
            [campo]: valor
          };

          if (
            campo === "medicion" &&
            valor !== ""
          ) {

            actualizado.conforme =
              calcularConformidad(
                valor,
                0.3
              );

          }

          return actualizado;

        })
    );

  };

  // =====================================================
  // AGREGAR MEDICIÓN 4
  // =====================================================

  const agregarMedicionPartes = () => {

    setMedicionesPartesAplicables(
      (actuales) => [
        ...actuales,
        {
          id: Date.now(),
          medicion: "",
          observaciones: "",
          conforme: null,
          noAplica: false
        }
      ]
    );

  };

  // =====================================================
  // ELIMINAR MEDICIÓN 4
  // =====================================================

  const eliminarMedicionPartes = (id) => {

    if (
      medicionesPartesAplicables.length === 1
    ) {
      return;
    }

    setMedicionesPartesAplicables(
      (actuales) =>
        actuales.filter(
          (item) => item.id !== id
        )
    );

  };

  // =====================================================
  // VALIDACIÓN
  // =====================================================

  const validarFormulario = () => {

    if (!datos.ric01_id) {
      return "No se encontró el mantenimiento asociado.";
    }

    if (!clase) {
      return "Seleccione la clase del equipo.";
    }

    if (!tipoProteccion) {
      return "Seleccione el tipo de protección.";
    }

    return null;

  };

  // =====================================================
  // GUARDAR
  // =====================================================

  const guardar = async () => {

    const mensaje =
      validarFormulario();

    if (mensaje) {
      alert(mensaje);
      return;
    }

    try {

      setGuardando(true);
      setError("");

      const payload = {

        ric01_id:
          datos.ric01_id,

        equipo_id:
          datos.equipo_id,

        numero_serie:
          datos.numero_serie,

        descripcion:
          datos.descripcion,

        marca_modelo:
          datos.marca_modelo,

        area:
          datos.area,

        servicio:
          datos.servicio,

        sub_servicio:
          datos.sub_servicio,

        tecnico:
          datos.tecnico,

        clase,

        tipo_proteccion:
          tipoProteccion,

        medicion_tension:
          medicionTension,

        medicion_corriente:
          medicionCorriente,

        indicaciones,

        determinaciones,

        mediciones_partes_aplicables:
          medicionesPartesAplicables,

        observaciones,

        firma_tecnico:
          firmaTecnico,

        firma_responsable:
          firmaResponsable
      };

      console.log(
        "RIC37 - DATOS A GUARDAR:",
        payload
      );

      const respuesta =
        await fetch(
          `${API_URL.Base}/api/ric37`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json"
            },
            body:
              JSON.stringify(payload)
          }
        );

      const data =
        await respuesta.json();

      if (!respuesta.ok) {

        throw new Error(
          data.error ||
          "Error guardando RIC37"
        );

      }

      console.log(
        "RIC37 GUARDADO:",
        data
      );

      alert(
        "RIC37 guardado correctamente ✅"
      );

      setVista("equipos");

    } catch (err) {

      console.error(
        "ERROR GUARDANDO RIC37:",
        err
      );

      setError(
        err.message ||
        "No se pudo guardar el RIC37."
      );

      alert(
        err.message ||
        "No se pudo guardar el RIC37."
      );

    } finally {

      setGuardando(false);

    }

  };

  // =====================================================
  // SALIR
  // =====================================================

  const salir = () => {

    setVista("equipos");

  };

  // =====================================================
  // CARGANDO
  // =====================================================

  if (cargando) {

    return (
      <div className="p-6 text-center">
        Cargando RIC37...
      </div>
    );

  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error && !datos.ric01_id) {

    return (
      <div className="p-6">

        <div className="bg-red-50 border border-red-300 text-red-700 p-4 rounded-xl">
          {error}
        </div>

        <button
          onClick={salir}
          className="mt-4 w-full bg-gray-600 text-white py-2 rounded-xl"
        >
          Salir
        </button>

      </div>
    );

  }

  // =====================================================
  // FORMULARIO
  // =====================================================

  return (

    <div className="p-4 max-w-3xl mx-auto">

      {/* ENCABEZADO */}

      <div className="bg-white rounded-xl shadow p-4 mb-4">

        <h1 className="text-xl font-bold text-center">
          RIC 37 - ENSAYO DE SEGURIDAD ELÉCTRICA
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4 text-sm">

          <p>
            <b>Equipo:</b>{" "}
            {datos.descripcion || "-"}
          </p>

          <p>
            <b>Marca / Modelo:</b>{" "}
            {datos.marca_modelo || "-"}
          </p>

          <p>
            <b>N° de serie:</b>{" "}
            {datos.numero_serie || "-"}
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
            <b>Técnico:</b>{" "}
            {datos.tecnico || "-"}
          </p>

        </div>

      </div>

      {/* INDICACIONES */}

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">

        <h2 className="font-bold mb-2">
          Indicaciones
        </h2>

        <textarea
          value={indicaciones}
          onChange={(e) =>
            setIndicaciones(e.target.value)
          }
          placeholder="Indicaciones para el ensayo..."
          className="w-full border rounded-lg p-2 min-h-[80px]"
        />

      </div>

      {/* CLASE / PROTECCIÓN */}

      <div className="bg-white rounded-xl shadow p-4 mb-4">

        <h2 className="font-bold mb-3">
          Clasificación del equipo
        </h2>

       <div className="grid grid-cols-2 gap-4">

  <div>
    <label className="block font-semibold mb-1">
      CLASE
    </label>

    <select
      value={clase}
      onChange={(e) =>
        setClase(e.target.value)
      }
      className="w-full border rounded-lg p-2"
    >
      <option value="">
        Seleccionar
      </option>

      <option value="CLASE I">
        CLASE I
      </option>

      <option value="CLASE II">
        CLASE II
      </option>

      <option value="CLASE III">
        CLASE III
      </option>
    </select>
  </div>

  <div>
    <label className="block font-semibold mb-1">
      TIPO DE PROTECCIÓN
    </label>

    <select
      value={tipoProteccion}
      onChange={(e) =>
        setTipoProteccion(e.target.value)
      }
      className="w-full border rounded-lg p-2"
    >
      <option value="">
        Seleccionar
      </option>

      <option value="TIPO B">
        TIPO B
      </option>

      <option value="TIPO BF">
        TIPO BF
      </option>

      <option value="TIPO CF">
        TIPO CF
      </option>
    </select>
  </div>

</div>

      </div>

      {/* MEDICIONES GENERALES */}

      <div className="bg-white rounded-xl shadow p-4 mb-4">

        <h2 className="font-bold mb-3">
          Mediciones
        </h2>

        <div className="grid grid-cols-2 gap-4">

  <div>
    <label className="block font-semibold mb-1">
      MEDICIÓN DE TENSIÓN
    </label>

    <input
      type="text"
      value={medicionTension}
      onChange={(e) =>
        setMedicionTension(e.target.value)
      }
      className="w-full border rounded-lg p-2"
    />
  </div>

  <div>
    <label className="block font-semibold mb-1">
      MEDICIÓN DE CORRIENTE
    </label>

    <input
      type="text"
      value={medicionCorriente}
      onChange={(e) =>
        setMedicionCorriente(e.target.value)
      }
      className="w-full border rounded-lg p-2"
    />
  </div>

</div>

      </div>

      {/* DETERMINACIONES */}

      <div className="bg-white rounded-xl shadow p-4 mb-4">

        <h2 className="text-lg font-bold mb-4">
          Determinaciones
        </h2>

        {determinaciones.map(
          (item, index) => (

            <div
              key={item.numero}
              className="border rounded-xl p-4 mb-4"
            >

              <h3 className="font-bold mb-3">
                {item.numero} -{" "}
                {item.nombre}
              </h3>

              <label className="block font-semibold mb-1">
                Medición
              </label>

              <input
                type="text"
                value={item.medicion}
                disabled={item.noAplica}
                onChange={(e) => {

                  const valor =
                    e.target.value;

                  cambiarDeterminacion(
                    index,
                    "medicion",
                    valor
                  );

                  cambiarDeterminacion(
                    index,
                    "conforme",
                    calcularConformidad(
                      valor,
                      item.rango
                    )
                  );

                }}
                className="w-full border rounded-lg p-2 mb-2"
              />

              <p className="text-sm text-gray-600 mb-2">
                Rango de aceptación:{" "}
                <b>{item.rango}</b>
              </p>

              <div className="flex gap-2 flex-wrap mb-2">

                <button
                  type="button"
                  onClick={() =>
                    cambiarDeterminacion(
                      index,
                      "conforme",
                      true
                    )
                  }
                  disabled={item.noAplica}
                  className={`px-4 py-2 rounded-lg ${
                    item.conforme === true
                      ? "bg-green-600 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  Conforme
                </button>

                <button
                  type="button"
                  onClick={() =>
                    cambiarDeterminacion(
                      index,
                      "conforme",
                      false
                    )
                  }
                  disabled={item.noAplica}
                  className={`px-4 py-2 rounded-lg ${
                    item.conforme === false
                      ? "bg-red-600 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  No conforme
                </button>

                <label className="flex items-center gap-2 px-3">

                  <input
                    type="checkbox"
                    checked={item.noAplica}
                    onChange={(e) => {

                      const marcado =
                        e.target.checked;

                      cambiarDeterminacion(
                        index,
                        "noAplica",
                        marcado
                      );

                      if (marcado) {

                        cambiarDeterminacion(
                          index,
                          "conforme",
                          null
                        );

                      }

                    }}
                  />

                  No aplica

                </label>

              </div>

            </div>

          )
        )}

        {/* =================================================
            DETERMINACIÓN 4
        ================================================= */}

        <div className="border rounded-xl p-4">

          <h3 className="font-bold mb-4">
            4 - Corriente de fuga de partes aplicables
          </h3>

          {medicionesPartesAplicables.map(
            (item, index) => (

              <div
                key={item.id}
                className="border rounded-lg p-3 mb-3 bg-gray-50"
              >

                <div className="flex justify-between items-center mb-2">

                  <span className="font-semibold">
                    Medición {index + 1}
                  </span>

                  {medicionesPartesAplicables.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        eliminarMedicionPartes(
                          item.id
                        )
                      }
                      className="text-red-600 text-sm"
                    >
                      Eliminar
                    </button>
                  )}

                </div>

                <label className="block font-semibold mb-1">
                  Medición
                </label>

                <input
                  type="text"
                  value={item.medicion}
                  disabled={item.noAplica}
                  onChange={(e) =>
                    cambiarMedicionPartes(
                      item.id,
                      "medicion",
                      e.target.value
                    )
                  }
                  className="w-full border rounded-lg p-2 mb-2"
                />

                <p className="text-sm text-gray-600 mb-2">
                  Rango de aceptación:{" "}
                  <b>0.3</b>
                </p>

                <label className="block font-semibold mb-1">
                  Observaciones
                </label>

                <textarea
                  value={item.observaciones}
                  onChange={(e) =>
                    cambiarMedicionPartes(
                      item.id,
                      "observaciones",
                      e.target.value
                    )
                  }
                  className="w-full border rounded-lg p-2 mb-2"
                  placeholder="Observaciones de esta medición..."
                />

                <div className="flex gap-2 flex-wrap">

                  <button
                    type="button"
                    disabled={item.noAplica}
                    onClick={() =>
                      cambiarMedicionPartes(
                        item.id,
                        "conforme",
                        true
                      )
                    }
                    className={`px-4 py-2 rounded-lg ${
                      item.conforme === true
                        ? "bg-green-600 text-white"
                        : "bg-gray-200"
                    }`}
                  >
                    Conforme
                  </button>

                  <button
                    type="button"
                    disabled={item.noAplica}
                    onClick={() =>
                      cambiarMedicionPartes(
                        item.id,
                        "conforme",
                        false
                      )
                    }
                    className={`px-4 py-2 rounded-lg ${
                      item.conforme === false
                        ? "bg-red-600 text-white"
                        : "bg-gray-200"
                    }`}
                  >
                    No conforme
                  </button>

                  <label className="flex items-center gap-2 px-3">

                    <input
                      type="checkbox"
                      checked={item.noAplica}
                      onChange={(e) => {

                        const marcado =
                          e.target.checked;

                        cambiarMedicionPartes(
                          item.id,
                          "noAplica",
                          marcado
                        );

                        if (marcado) {

                          cambiarMedicionPartes(
                            item.id,
                            "conforme",
                            null
                          );

                        }

                      }}
                    />

                    No aplica

                  </label>

                </div>

              </div>

            )
          )}

          <button
            type="button"
            onClick={agregarMedicionPartes}
            className="w-full bg-blue-600 text-white py-2 rounded-xl"
          >
            ➕ Agregar medición
          </button>

        </div>

      </div>

      {/* OBSERVACIONES */}

      <div className="bg-white rounded-xl shadow p-4 mb-4">

        <label className="block font-bold mb-2">
          Observaciones generales
        </label>

        <textarea
          value={observaciones}
          onChange={(e) =>
            setObservaciones(e.target.value)
          }
          className="w-full border rounded-lg p-2 min-h-[100px]"
        />

      </div>

      {/* FIRMAS */}

      <div className="bg-white rounded-xl shadow p-4 mb-4">

        <h2 className="font-bold mb-3">
          Firmas
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <input
            type="text"
            value={firmaTecnico}
            onChange={(e) =>
              setFirmaTecnico(e.target.value)
            }
            placeholder="Firma / Técnico responsable"
            className="w-full border rounded-lg p-2"
          />

          <input
            type="text"
            value={firmaResponsable}
            onChange={(e) =>
              setFirmaResponsable(e.target.value)
            }
            placeholder="Firma / Responsable"
            className="w-full border rounded-lg p-2"
          />

        </div>

      </div>

      {/* ERROR */}

      {error && (
        <div className="bg-red-50 border border-red-300 text-red-700 p-3 rounded-xl mb-4">
          {error}
        </div>
      )}

      {/* BOTONES */}

      <div className="flex gap-2">

        <button
          type="button"
          onClick={salir}
          disabled={guardando}
          className="flex-1 bg-gray-600 text-white py-3 rounded-xl"
        >
          Salir
        </button>

        <button
          type="button"
          onClick={guardar}
          disabled={guardando}
          className="flex-1 bg-green-600 text-white py-3 rounded-xl"
        >
          {guardando
            ? "Guardando..."
            : "Guardar RIC37"}
        </button>

      </div>

    </div>

  );

}
