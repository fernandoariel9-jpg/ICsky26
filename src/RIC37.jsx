import { useState, useEffect } from "react";
import { API_URL } from "./config";

export default function RIC37({ setVista, personal }) {

  // =====================================================
  // ESTADOS GENERALES
  // =====================================================

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [ric37Id, setRic37Id] = useState(null);

  // =====================================================
  // DATOS DEL EQUIPO
  // =====================================================

  const [datos, setDatos] = useState({
    ric01_id: null,
    equipo_id: null,
    numero_serie: "",
    descripcion: "",
    marca_modelo: "",
    area: "",
    servicio: "",
    sub_servicio: "",
    encargado: "",
    tecnico: personal?.nombre || ""
  });

  // =====================================================
  // CLASIFICACIÓN
  // =====================================================

  const [clase, setClase] = useState("");
  const [tipoProteccion, setTipoProteccion] = useState("");

  // =====================================================
  // MEDICIONES GENERALES
  // =====================================================

  const [medicionTension, setMedicionTension] = useState("");
  const [medicionCorriente, setMedicionCorriente] = useState("");

  // =====================================================
  // DETERMINACIONES
  // =====================================================

  const [determinaciones, setDeterminaciones] = useState([
    {
      determinacion: 1,
      nombre: "Resistencia de protección a tierra",
      medicion: "",
      rango_aceptacion: 0.3,
      conforme: null,
      no_aplica: false,
      observaciones: ""
    },
    {
      determinacion: 2,
      nombre: "Corriente de fuga de equipo",
      medicion: "",
      rango_aceptacion: 500,
      conforme: null,
      no_aplica: false,
      observaciones: ""
    },
    {
      determinacion: 3,
      nombre: "Corriente de fuga reversa de equipo",
      medicion: "",
      rango_aceptacion: 500,
      conforme: null,
      no_aplica: false,
      observaciones: ""
    }
  ]);

  // =====================================================
  // DETERMINACIÓN 4
  // =====================================================

  const [medicionesPartesAplicables, setMedicionesPartesAplicables] =
    useState([
      {
        medicion: "",
        rango_aceptacion: 0.3,
        conforme: null,
        no_aplica: false,
        observaciones: ""
      }
    ]);

  // =====================================================
  // OBSERVACIONES GENERALES
  // =====================================================

  const [observaciones, setObservaciones] = useState("");

  // =====================================================
  // CARGAR TAREA ACTIVA
  // =====================================================

  useEffect(() => {

    const cargarDatos = async () => {

      try {

        setCargando(true);
        setError("");

        const tareaGuardada =
          localStorage.getItem("tareaActiva");

        if (!tareaGuardada) {

          setError(
            "No se encontró una tarea activa."
          );

          return;
        }

        const tarea =
          JSON.parse(tareaGuardada);

        console.log(
          "TAREA ACTIVA RIC37:",
          tarea
        );

        let equipo = null;

        // =================================================
        // BUSCAR EQUIPO
        // =================================================

        if (
          tarea.numero_serie &&
          API_URL.BuscarEquipo
        ) {

          try {

            const res =
              await fetch(
                `${API_URL.BuscarEquipo}/${encodeURIComponent(
                  tarea.numero_serie
                )}`
              );

            if (res.ok) {

              equipo =
                await res.json();

              console.log(
                "EQUIPO RIC37:",
                equipo
              );

            }

          } catch (err) {

            console.warn(
              "No se pudo obtener el equipo:",
              err
            );

          }

        }

        // =================================================
        // CARGAR DATOS
        // =================================================

        setDatos({

          ric01_id:
            tarea.id || null,

          equipo_id:
            equipo?.id ||
            tarea.equipo_id ||
            null,

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
            equipo?.subservicio ||
            tarea.sub_servicio ||
            tarea.subservicio ||
            "",

          encargado:
            tarea.encargado ||
            tarea.usuario ||
            "",

          tecnico:
            personal?.nombre ||
            ""

        });

      } catch (err) {

        console.error(
          "ERROR CARGANDO RIC37:",
          err
        );

        setError(
          "No se pudieron cargar los datos del equipo."
        );

      } finally {

        setCargando(false);

      }

    };

    cargarDatos();

  }, [personal]);

  // =====================================================
  // ACTUALIZAR DETERMINACIÓN
  // =====================================================

  const actualizarDeterminacion = (
    index,
    campo,
    valor
  ) => {

    setDeterminaciones(
      (actuales) =>
        actuales.map((item, i) => {

          if (i !== index)
            return item;

          const actualizado = {
            ...item,
            [campo]: valor
          };

          // ---------------------------------------------
          // NO APLICA
          // ---------------------------------------------

          if (campo === "no_aplica" && valor) {

            actualizado.conforme = null;

          }

          // ---------------------------------------------
          // CALCULAR CONFORMIDAD
          // ---------------------------------------------

          if (
            campo === "medicion" &&
            !actualizado.no_aplica
          ) {

            if (
              valor !== "" &&
              valor !== null
            ) {

              const medicion =
                Number(valor);

              const limite =
                Number(
                  actualizado.rango_aceptacion
                );

              actualizado.conforme =
                medicion <= limite;

            } else {

              actualizado.conforme = null;

            }

          }

          return actualizado;

        })
    );

  };

  // =====================================================
  // ACTUALIZAR MEDICIÓN 4
  // =====================================================

  const actualizarMedicionPartes = (
    index,
    campo,
    valor
  ) => {

    setMedicionesPartesAplicables(
      (actuales) =>
        actuales.map((item, i) => {

          if (i !== index)
            return item;

          const actualizado = {
            ...item,
            [campo]: valor
          };

          // ---------------------------------------------
          // NO APLICA
          // ---------------------------------------------

          if (
            campo === "no_aplica" &&
            valor
          ) {

            actualizado.conforme = null;

          }

          // ---------------------------------------------
          // CALCULAR CONFORMIDAD
          // ---------------------------------------------

          if (
            campo === "medicion" &&
            !actualizado.no_aplica
          ) {

            if (
              valor !== "" &&
              valor !== null
            ) {

              actualizado.conforme =
                Number(valor) <= 0.3;

            } else {

              actualizado.conforme = null;

            }

          }

          return actualizado;

        })
    );

  };

  // =====================================================
  // AGREGAR MEDICIÓN 4
  // =====================================================

  const agregarMedicion = () => {

    setMedicionesPartesAplicables(
      (actuales) => [
        ...actuales,
        {
          medicion: "",
          rango_aceptacion: 0.3,
          conforme: null,
          no_aplica: false,
          observaciones: ""
        }
      ]
    );

  };

  // =====================================================
  // ELIMINAR MEDICIÓN 4
  // =====================================================

  const eliminarMedicion = (index) => {

    if (
      medicionesPartesAplicables.length === 1
    ) {
      return;
    }

    setMedicionesPartesAplicables(
      (actuales) =>
        actuales.filter(
          (_, i) => i !== index
        )
    );

  };

  // =====================================================
  // RESULTADO GENERAL
  // =====================================================

  const obtenerResultadoGeneral = () => {

    const todas = [
      ...determinaciones,
      ...medicionesPartesAplicables
    ];

    const activas =
      todas.filter(
        (d) => !d.no_aplica
      );

    if (activas.length === 0) {

      return "CONFORME";

    }

    if (
      activas.some(
        (d) => d.conforme === false
      )
    ) {

      return "NO CONFORME";

    }

    if (
      activas.some(
        (d) => d.conforme === null
      )
    ) {

      return "";

    }

    return "CONFORME";

  };

  // =====================================================
  // VALIDAR FORMULARIO
  // =====================================================

  const validarFormulario = () => {

    if (!clase) {

      alert(
        "Seleccione la CLASE del equipo."
      );

      return false;

    }

    if (!tipoProteccion) {

      alert(
        "Seleccione el TIPO DE PROTECCIÓN."
      );

      return false;

    }

    const todas = [
      ...determinaciones,
      ...medicionesPartesAplicables
    ];

    const incompletas =
      todas.some(
        (d) =>
          !d.no_aplica &&
          (
            d.medicion === "" ||
            d.conforme === null
          )
      );

    if (incompletas) {

      alert(
        "Complete todas las determinaciones o marque No aplica."
      );

      return false;

    }

    return true;

  };

  // =====================================================
  // GUARDAR RIC37
  // =====================================================

  const guardarRIC37 = async () => {

    if (!validarFormulario()) {
      return;
    }

    try {

      setGuardando(true);
      setError("");

      const determinacionesPayload = [

        ...determinaciones,

        ...medicionesPartesAplicables.map(
          (item) => ({
            determinacion: 4,
            nombre:
              "Corriente de fuga de partes aplicables",
            ...item
          })
        )

      ];

      const payload = {

        ric01_id:
          datos.ric01_id,

        equipo_id:
          datos.equipo_id,

        numero_serie:
          datos.numero_serie,

        marca_modelo:
          datos.marca_modelo,

        area:
          datos.area,

        servicio:
          datos.servicio,

        sub_servicio:
          datos.sub_servicio,

        encargado:
          datos.encargado,

        tecnico:
          datos.tecnico,

        clase,

        tipo_proteccion:
          tipoProteccion,

        medicion_tension:
          medicionTension,

        medicion_corriente:
          medicionCorriente,

        resultado_general:
          obtenerResultadoGeneral(),

        observaciones,

        determinaciones:
          determinacionesPayload

      };

      console.log(
        "PAYLOAD RIC37:",
        payload
      );

      const res =
        await fetch(
          API_URL.Ric37,
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
        await res.json();

      if (!res.ok) {

        throw new Error(
          data.error ||
          "Error al guardar RIC37"
        );

      }

      setRic37Id(
        data.ric37_id
      );

      console.log(
        "RIC37 creado con ID:",
        data.ric37_id
      );

      alert(
        "Ensayo de seguridad eléctrica guardado correctamente ✅"
      );

      localStorage.removeItem(
        "tareaActiva"
      );

      setVista("equipos");

    } catch (err) {

      console.error(
        "ERROR GUARDANDO RIC37:",
        err
      );

      setError(
        err.message ||
        "Error al guardar RIC37"
      );

      alert(
        err.message ||
        "Error al guardar el ensayo"
      );

    } finally {

      setGuardando(false);

    }

  };

  // =====================================================
  // SALIR
  // =====================================================

  const salir = () => {

    const confirmar =
      window.confirm(
        "¿Desea salir del ensayo de seguridad eléctrica?"
      );

    if (!confirmar) {
      return;
    }

    setVista("equipos");

  };

  // =====================================================
  // ESTADO DE CARGA
  // =====================================================

  if (cargando) {

    return (
      <div className="p-6 text-center">

        <p className="text-gray-600">
          Cargando datos del equipo...
        </p>

      </div>
    );

  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error && !guardando) {

    return (
      <div className="p-6">

        <div className="bg-red-50 border border-red-300 rounded-xl p-4">

          <p className="font-bold text-red-700">
            Error
          </p>

          <p className="text-red-600 mt-1">
            {error}
          </p>

        </div>

        <button
          onClick={salir}
          className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg"
        >
          Salir
        </button>

      </div>
    );

  }

  // =====================================================
  // RENDER
  // =====================================================

  return (

    <div className="max-w-5xl mx-auto p-4">

      {/* ==================================================
          ENCABEZADO
      ================================================== */}

      <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-5 mb-5">

        <h1 className="text-2xl font-bold text-gray-800">
          RIC 37 - ENSAYO DE SEGURIDAD ELÉCTRICA
        </h1>

        <p className="text-sm text-gray-500 mt-1">
          Protocolo de mantenimiento preventivo
        </p>

      </div>


      {/* ==================================================
          INDICACIONES
      ================================================== */}

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5">

        <div className="flex gap-3">

          <div className="text-xl">
            ℹ️
          </div>

          <div>

            <h2 className="font-bold text-blue-800">
              Indicaciones
            </h2>

            <p className="text-sm text-blue-700 mt-1">
              Complete las mediciones correspondientes
              al ensayo y registre los resultados de
              cada determinación.
            </p>

          </div>

        </div>

      </div>


      {/* ==================================================
          DATOS DEL EQUIPO
      ================================================== */}

      <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-5 mb-5">

        <h2 className="text-lg font-bold text-gray-800 mb-4">
          Datos del equipo
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div>

            <label className="block text-sm font-semibold text-gray-700">
              Número de serie
            </label>

            <input
              value={datos.numero_serie}
              readOnly
              className="w-full mt-1 p-2 border rounded-lg bg-gray-100"
            />

          </div>

          <div>

            <label className="block text-sm font-semibold text-gray-700">
              Descripción
            </label>

            <input
              value={datos.descripcion}
              readOnly
              className="w-full mt-1 p-2 border rounded-lg bg-gray-100"
            />

          </div>

          <div>

            <label className="block text-sm font-semibold text-gray-700">
              Marca / Modelo
            </label>

            <input
              value={datos.marca_modelo}
              readOnly
              className="w-full mt-1 p-2 border rounded-lg bg-gray-100"
            />

          </div>

          <div>

            <label className="block text-sm font-semibold text-gray-700">
              Área
            </label>

            <input
              value={datos.area}
              readOnly
              className="w-full mt-1 p-2 border rounded-lg bg-gray-100"
            />

          </div>

          <div>

            <label className="block text-sm font-semibold text-gray-700">
              Servicio
            </label>

            <input
              value={datos.servicio}
              readOnly
              className="w-full mt-1 p-2 border rounded-lg bg-gray-100"
            />

          </div>

          <div>

            <label className="block text-sm font-semibold text-gray-700">
              Subservicio
            </label>

            <input
              value={datos.sub_servicio}
              readOnly
              className="w-full mt-1 p-2 border rounded-lg bg-gray-100"
            />

          </div>

          <div>

            <label className="block text-sm font-semibold text-gray-700">
              Encargado
            </label>

            <input
              value={datos.encargado}
              readOnly
              className="w-full mt-1 p-2 border rounded-lg bg-gray-100"
            />

          </div>

          <div>

            <label className="block text-sm font-semibold text-gray-700">
              Técnico
            </label>

            <input
              value={datos.tecnico}
              readOnly
              className="w-full mt-1 p-2 border rounded-lg bg-gray-100"
            />

          </div>

        </div>

      </div>


      {/* ==================================================
          CLASIFICACIÓN
      ================================================== */}

      <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-5 mb-5">

        <h2 className="text-lg font-bold text-gray-800 mb-4">
          Clasificación del equipo
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div>

            <label className="block text-sm font-semibold text-gray-700 mb-1">
              CLASE
            </label>

            <select
              value={clase}
              onChange={(e) =>
                setClase(e.target.value)
              }
              className="w-full p-2 border rounded-lg"
            >

              <option value="">
                Seleccione...
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

            <label className="block text-sm font-semibold text-gray-700 mb-1">
              TIPO DE PROTECCIÓN
            </label>

            <select
              value={tipoProteccion}
              onChange={(e) =>
                setTipoProteccion(e.target.value)
              }
              className="w-full p-2 border rounded-lg"
            >

              <option value="">
                Seleccione...
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


      {/* ==================================================
          MEDICIONES GENERALES
      ================================================== */}

      <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-5 mb-5">

        <h2 className="text-lg font-bold text-gray-800 mb-4">
          Mediciones generales
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div>

            <label className="block text-sm font-semibold text-gray-700">
              MEDICIÓN DE TENSIÓN
            </label>

            <input
              type="text"
              value={medicionTension}
              onChange={(e) =>
                setMedicionTension(
                  e.target.value
                )
              }
              className="w-full mt-1 p-2 border rounded-lg"
            />

          </div>


          <div>

            <label className="block text-sm font-semibold text-gray-700">
              MEDICIÓN DE CORRIENTE
            </label>

            <input
              type="text"
              value={medicionCorriente}
              onChange={(e) =>
                setMedicionCorriente(
                  e.target.value
                )
              }
              className="w-full mt-1 p-2 border rounded-lg"
            />

          </div>

        </div>

      </div>


      {/* ==================================================
          DETERMINACIONES 1, 2 Y 3
      ================================================== */}

      {determinaciones.map(
        (item, index) => (

          <div
            key={item.determinacion}
            className="bg-white rounded-2xl shadow-md border border-gray-200 p-5 mb-5"
          >

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">

              <h2 className="text-lg font-bold text-gray-800">
                {item.determinacion}.{" "}
                {item.nombre}
              </h2>

              <span className="text-sm bg-gray-100 px-3 py-1 rounded-lg">
                Rango de aceptación:{" "}
                <strong>
                  {item.rango_aceptacion}
                </strong>
              </span>

            </div>


            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div>

                <label className="block text-sm font-semibold text-gray-700">
                  Medición
                </label>

                <input
                  type="number"
                  step="any"
                  value={item.medicion}
                  disabled={item.no_aplica}
                  onChange={(e) =>
                    actualizarDeterminacion(
                      index,
                      "medicion",
                      e.target.value
                    )
                  }
                  className="w-full mt-1 p-2 border rounded-lg disabled:bg-gray-100"
                />

              </div>


              <div>

                <label className="block text-sm font-semibold text-gray-700">
                  Resultado
                </label>

                <div
                  className={`mt-1 p-2 rounded-lg font-bold text-center ${
                    item.no_aplica
                      ? "bg-gray-100 text-gray-500"
                      : item.conforme === true
                      ? "bg-green-100 text-green-700"
                      : item.conforme === false
                      ? "bg-red-100 text-red-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >

                  {item.no_aplica
                    ? "NO APLICA"
                    : item.conforme === true
                    ? "CONFORME"
                    : item.conforme === false
                    ? "NO CONFORME"
                    : "PENDIENTE"}

                </div>

              </div>

            </div>


            <label className="flex items-center gap-2 mt-4">

              <input
                type="checkbox"
                checked={item.no_aplica}
                onChange={(e) =>
                  actualizarDeterminacion(
                    index,
                    "no_aplica",
                    e.target.checked
                  )
                }
              />

              <span className="text-sm font-semibold">
                No aplica
              </span>

            </label>

          </div>

        )
      )}


      {/* ==================================================
          DETERMINACIÓN 4
      ================================================== */}

      <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-5 mb-5">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">

          <div>

            <h2 className="text-lg font-bold text-gray-800">
              4. Corriente de fuga de partes aplicables
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Rango de aceptación:{" "}
              <strong>0.3</strong>
            </p>

          </div>

          <button
            type="button"
            onClick={agregarMedicion}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + Agregar medición
          </button>

        </div>


        {medicionesPartesAplicables.map(
          (item, index) => (

            <div
              key={index}
              className="border border-gray-200 rounded-xl p-4 mb-4 bg-gray-50"
            >

              <div className="flex justify-between items-center mb-3">

                <h3 className="font-bold text-gray-700">
                  Medición {index + 1}
                </h3>

                {medicionesPartesAplicables.length > 1 && (

                  <button
                    type="button"
                    onClick={() =>
                      eliminarMedicion(index)
                    }
                    className="text-red-600 text-sm"
                  >
                    Eliminar
                  </button>

                )}

              </div>


              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>

                  <label className="block text-sm font-semibold text-gray-700">
                    Medición
                  </label>

                  <input
                    type="number"
                    step="any"
                    value={item.medicion}
                    disabled={item.no_aplica}
                    onChange={(e) =>
                      actualizarMedicionPartes(
                        index,
                        "medicion",
                        e.target.value
                      )
                    }
                    className="w-full mt-1 p-2 border rounded-lg disabled:bg-gray-200"
                  />

                </div>


                <div>

                  <label className="block text-sm font-semibold text-gray-700">
                    Resultado
                  </label>

                  <div
                    className={`mt-1 p-2 rounded-lg font-bold text-center ${
                      item.no_aplica
                        ? "bg-gray-200 text-gray-500"
                        : item.conforme === true
                        ? "bg-green-100 text-green-700"
                        : item.conforme === false
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >

                    {item.no_aplica
                      ? "NO APLICA"
                      : item.conforme === true
                      ? "CONFORME"
                      : item.conforme === false
                      ? "NO CONFORME"
                      : "PENDIENTE"}

                  </div>

                </div>

              </div>


              <label className="flex items-center gap-2 mt-4">

                <input
                  type="checkbox"
                  checked={item.no_aplica}
                  onChange={(e) =>
                    actualizarMedicionPartes(
                      index,
                      "no_aplica",
                      e.target.checked
                    )
                  }
                />

                <span className="text-sm font-semibold">
                  No aplica
                </span>

              </label>


              <div className="mt-4">

                <label className="block text-sm font-semibold text-gray-700">
                  Observaciones
                </label>

                <textarea
                  value={item.observaciones}
                  onChange={(e) =>
                    actualizarMedicionPartes(
                      index,
                      "observaciones",
                      e.target.value
                    )
                  }
                  rows={2}
                  className="w-full mt-1 p-2 border rounded-lg"
                />

              </div>

            </div>

          )
        )}

      </div>


      {/* ==================================================
          RESULTADO GENERAL
      ================================================== */}

      <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-5 mb-5">

        <h2 className="text-lg font-bold text-gray-800 mb-3">
          Resultado general
        </h2>

        <div
          className={`p-4 rounded-xl text-center font-bold text-lg ${
            obtenerResultadoGeneral() ===
            "CONFORME"
              ? "bg-green-100 text-green-700"
              : obtenerResultadoGeneral() ===
                "NO CONFORME"
              ? "bg-red-100 text-red-700"
              : "bg-gray-100 text-gray-500"
          }`}
        >

          {obtenerResultadoGeneral() ||
            "PENDIENTE"}

        </div>

      </div>


      {/* ==================================================
          OBSERVACIONES GENERALES
      ================================================== */}

      <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-5 mb-5">

        <label className="block text-lg font-bold text-gray-800">
          Observaciones generales
        </label>

        <textarea
          value={observaciones}
          onChange={(e) =>
            setObservaciones(
              e.target.value
            )
          }
          rows={4}
          className="w-full mt-3 p-3 border rounded-lg"
        />

      </div>


      {/* ==================================================
          BOTONES
      ================================================== */}

      <div className="flex flex-col sm:flex-row justify-between gap-3 mb-8">

        <button
          type="button"
          onClick={salir}
          disabled={guardando}
          className="px-5 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
        >
          Salir
        </button>


        <button
          type="button"
          onClick={guardarRIC37}
          disabled={guardando}
          className="px-5 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >

          {guardando
            ? "Guardando..."
            : "Guardar RIC37"}

        </button>

      </div>

    </div>

  );

}
