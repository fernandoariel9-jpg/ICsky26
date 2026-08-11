import { useState, useEffect } from "react";
import { API_URL } from "./config";

export default function RIC29({ setVista, personal }) {

  // =====================================================
  // ESTADO GENERAL
  // =====================================================

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [etapa, setEtapa] = useState("inspecciones");

  // =====================================================
  // DATOS DEL EQUIPO
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
    encargado: "",
    tecnico: personal?.nombre || ""
  });

  // =====================================================
  // 1 - INSPECCIONES
  // =====================================================

  const [inspecciones, setInspecciones] = useState({
    limpieza_exterior: "",
    papel_registro: "",
    estado_cables: "",
    observaciones: ""
  });

  // =====================================================
  // 2 - ENTREGA DE ENERGÍA
  // =====================================================

  const [energia, setEnergia] = useState([
    {
      numero_medicion: 1,
      energia_nominal: 50,
      resultado_medicion: "",
      incertidumbre: 1.29,
      rango_min: 42.5,
      rango_max: 57.5,
      conforme: null
    },
    {
      numero_medicion: 2,
      energia_nominal: 100,
      resultado_medicion: "",
      incertidumbre: 2.25,
      rango_min: 85,
      rango_max: 115,
      conforme: null
    },
    {
      numero_medicion: 3,
      energia_nominal: 150,
      resultado_medicion: "",
      incertidumbre: 3.30,
      rango_min: 127.5,
      rango_max: 172.5,
      conforme: null
    },
    {
      numero_medicion: 4,
      energia_nominal: 200,
      resultado_medicion: "",
      incertidumbre: 4.40,
      rango_min: 170,
      rango_max: 230,
      conforme: null
    },
    {
      numero_medicion: 5,
      energia_nominal: 270,
      resultado_medicion: "",
      incertidumbre: 5.36,
      rango_min: 229.5,
      rango_max: 310.5,
      conforme: null
    },
    {
      numero_medicion: 6,
      energia_nominal: null,
      resultado_medicion: "",
      incertidumbre: null,
      rango_min: null,
      rango_max: null,
      conforme: null
    }
  ]);

  const [medicionEnergiaActual, setMedicionEnergiaActual] = useState(0);
  const [observacionesEnergia, setObservacionesEnergia] = useState("");

  // =====================================================
  // 3 - TIEMPO DE CARGA
  // =====================================================

  const [carga, setCarga] = useState({
    numero_medicion: 1,
    resultado_medicion: "",
    incertidumbre: 0.05,
    rango_max: 15,
    conforme: null,
    observaciones: ""
  });

  // =====================================================
  // 4 - BATERÍA
  // =====================================================

  const [bateria, setBateria] = useState([
    {
      numero_medicion: 1,
      resultado_medicion: "",
      incertidumbre: 0.05,
      rango_max: 15,
      conforme: null,
      observaciones: ""
    }
  ]);

  // =====================================================
  // 5 - SINCRONISMO
  // =====================================================

  const [sincronismo, setSincronismo] = useState({
    resultado_medicion: "",
    incertidumbre: 6.42,
    rango_max: 60,
    conforme: null,
    observaciones: ""
  });

  // =====================================================
  // 6 - MONITORIZACIÓN DE ALARMAS
  // =====================================================

  const [monitorizacion, setMonitorizacion] = useState([
    {
      frecuencia_nominal: 60,
      resultado_medicion: "",
      incertidumbre: null,
      conforme: null
    },
    {
      frecuencia_nominal: 120,
      resultado_medicion: "",
      incertidumbre: null,
      conforme: null
    }
  ]);

  const [observacionesMonitorizacion, setObservacionesMonitorizacion] =
    useState("");

  // =====================================================
  // 7 - ALARMAS
  // =====================================================

  const [alarmas, setAlarmas] = useState({
    alarma_alta_frecuencia: "",
    alarma_baja_frecuencia: "",
    activacion_alarmas: "",
    observaciones: ""
  });

  // =====================================================
  // RESULTADO FINAL
  // =====================================================

  const [resultadoGeneral, setResultadoGeneral] = useState("");
  const [observacionesGenerales, setObservacionesGenerales] = useState("");

  // =====================================================
  // CARGAR DATOS DEL EQUIPO
  // =====================================================

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

      const tarea =
        JSON.parse(tareaGuardada);

      console.log(
        "Tarea activa para RIC29:",
        tarea
      );

      let equipo = null;

      if (tarea.numero_serie) {

        const res = await fetch(
          `${API_URL.BuscarEquipo}/${encodeURIComponent(
            tarea.numero_serie
          )}`
        );

        if (!res.ok) {
          throw new Error(
            "No se encontró el equipo."
          );
        }

        equipo = await res.json();
      }

      setDatos({

        ric01_id:
          tarea.id || "",

        equipo_id:
          equipo?.id || "",

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

  // =====================================================
  // FUNCIONES DE VALIDACIÓN
  // =====================================================

  const validarRango = (
    valor,
    minimo,
    maximo
  ) => {

    const numero =
      parseFloat(valor);

    if (
      isNaN(numero) ||
      minimo === null ||
      maximo === null
    ) {
      return null;
    }

    return (
      numero >= minimo &&
      numero <= maximo
    );
  };

  // =====================================================
  // VALIDACIÓN DE ENTREGA DE ENERGÍA
  // =====================================================

  const actualizarEnergia = (
    index,
    valor
  ) => {

    setEnergia(prev => {

      const copia = [...prev];

      copia[index] = {
        ...copia[index],
        resultado_medicion: valor,
        conforme: null
      };

      return copia;
    });
  };

  const aceptarMedicionEnergia = () => {

    const medicion =
      energia[medicionEnergiaActual];

    if (
      !medicion.resultado_medicion
    ) {

      alert(
        "Debe ingresar el resultado de la medición."
      );

      return;
    }

    let conforme;

    // ---------------------------------------------
    // MEDICIONES 50 / 100 / 150 / 200 / 270 J
    // ---------------------------------------------

    if (
      medicion.energia_nominal !== null
    ) {

      conforme = validarRango(
        medicion.resultado_medicion,
        medicion.rango_min,
        medicion.rango_max
      );

    }

    // ---------------------------------------------
    // MÁXIMA ENERGÍA
    // ---------------------------------------------

    else {

      const valorMax =
        parseFloat(
          medicion.resultado_medicion
        );

      if (isNaN(valorMax) || valorMax <= 0) {

        alert(
          "Ingrese un valor válido de máxima energía."
        );

        return;
      }

      const minimo =
        valorMax * 0.85;

      const maximo =
        valorMax * 1.15;

      // Para máxima energía no existe
      // un valor de referencia previo.
      //
      // Guardamos el valor ingresado
      // como energía nominal.

      setEnergia(prev => {

        const copia = [...prev];

        copia[medicionEnergiaActual] = {
          ...copia[medicionEnergiaActual],
          energia_nominal: valorMax,
          rango_min: minimo,
          rango_max: maximo,
          conforme: true
        };

        return copia;
      });

      conforme = true;
    }

    setEnergia(prev => {

      const copia = [...prev];

      copia[medicionEnergiaActual] = {
        ...copia[medicionEnergiaActual],
        conforme
      };

      return copia;
    });

    // ---------------------------------------------
    // SIGUIENTE MEDICIÓN
    // ---------------------------------------------

    if (
      medicionEnergiaActual <
      energia.length - 1
    ) {

      setMedicionEnergiaActual(
        prev => prev + 1
      );

    } else {

      setEtapa("carga");

    }
  };

  // =====================================================
  // BATERÍA - AGREGAR MEDICIÓN
  // =====================================================

  const agregarMedicionBateria = () => {

    setBateria(prev => [

      ...prev,

      {
        numero_medicion:
          prev.length + 1,

        resultado_medicion: "",

        incertidumbre: 0.05,

        rango_max: 15,

        conforme: null,

        observaciones: ""
      }

    ]);
  };

  // =====================================================
  // VALIDAR BATERÍA
  // =====================================================

  const validarBateria = (
    index,
    valor
  ) => {

    const conforme =
      validarRango(
        valor,
        0,
        15
      );

    setBateria(prev => {

      const copia = [...prev];

      copia[index] = {
        ...copia[index],
        resultado_medicion: valor,
        conforme
      };

      return copia;
    });
  };

  // =====================================================
  // VALIDAR CARGA
  // =====================================================

  const validarCarga = (
    valor
  ) => {

    const conforme =
      parseFloat(valor) < 15;

    setCarga(prev => ({
      ...prev,
      resultado_medicion: valor,
      conforme:
        isNaN(parseFloat(valor))
          ? null
          : conforme
    }));
  };

  // =====================================================
  // VALIDAR SINCRONISMO
  // =====================================================

  const validarSincronismo = (
    valor
  ) => {

    const numero =
      parseFloat(valor);

    setSincronismo(prev => ({
      ...prev,
      resultado_medicion: valor,
      conforme:
        isNaN(numero)
          ? null
          : numero < 60
    }));
  };

  // =====================================================
  // VALIDAR MONITORIZACIÓN
  // =====================================================

  const validarMonitorizacion = (
    index,
    valor
  ) => {

    const nominal =
      monitorizacion[index]
        .frecuencia_nominal;

    const numero =
      parseFloat(valor);

    const conforme =
      !isNaN(numero) &&
      numero >= nominal - 3 &&
      numero <= nominal + 3;

    setMonitorizacion(prev => {

      const copia = [...prev];

      copia[index] = {
        ...copia[index],
        resultado_medicion: valor,
        conforme:
          isNaN(numero)
            ? null
            : conforme
      };

      return copia;
    });
  };

  // =====================================================
  // DETERMINAR SI HAY NO CONFORMIDADES
  // =====================================================

  const hayNoConformidades = () => {

    const inspeccionesNC =
      Object.values(inspecciones)
        .some(
          valor =>
            valor === "No Conforme"
        );

    const energiaNC =
      energia.some(
        item =>
          item.conforme === false
      );

    const cargaNC =
      carga.conforme === false;

    const bateriaNC =
      bateria.some(
        item =>
          item.conforme === false
      );

    const sincronismoNC =
      sincronismo.conforme === false;

    const monitorizacionNC =
      monitorizacion.some(
        item =>
          item.conforme === false
      );

    const alarmasNC =
      Object.values(alarmas)
        .some(
          valor =>
            valor === "No Conforme"
        );

    return (
      inspeccionesNC ||
      energiaNC ||
      cargaNC ||
      bateriaNC ||
      sincronismoNC ||
      monitorizacionNC ||
      alarmasNC
    );
  };

  // =====================================================
  // RESULTADO GENERAL
  // =====================================================

  const calcularResultadoGeneral = () => {

    return hayNoConformidades()
      ? "No Conforme"
      : "Conforme";
  };

  // =====================================================
  // PANTALLA DE CARGA
  // =====================================================

  if (cargando) {

    return (
      <div className="p-6 text-center">

        <p className="text-lg">
          ⏳ Cargando datos del equipo...
        </p>

      </div>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error) {

    return (
      <div className="p-6 max-w-xl mx-auto">

        <div className="bg-red-100 text-red-700 p-4 rounded-xl">

          ⚠️ {error}

        </div>

        <button
          onClick={() =>
            setVista("equipos")
          }
          className="w-full bg-gray-500 text-white rounded-xl p-3 mt-4"
        >
          ← Volver
        </button>

      </div>
    );
  }

  // =====================================================
  // COMPONENTES VISUALES
  // =====================================================

  const Explicacion = () => (

    <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-xl p-3 mb-4">

      <p className="font-semibold mb-1">
        📖 Cómo realizar la medición
      </p>

      <p className="text-sm">
        acá va explicación
      </p>

    </div>
  );

  const EstadoMedicion = ({
    conforme
  }) => {

    if (conforme === null) {
      return null;
    }

    return (

      <div
        className={`rounded-xl p-3 mt-3 text-center font-bold ${
          conforme
            ? "bg-green-100 text-green-700"
            : "bg-red-100 text-red-700"
        }`}
      >

        {conforme
          ? "✓ CONFORME"
          : "✕ NO CONFORME"}

      </div>
    );
  };

  // =====================================================
  // INSPECCIONES
  // =====================================================

  if (etapa === "inspecciones") {

    const hayNC =
      inspecciones.limpieza_exterior === "No Conforme" ||
      inspecciones.papel_registro === "No Conforme" ||
      inspecciones.estado_cables === "No Conforme";

    return (

      <div className="p-4 max-w-xl mx-auto">

        <h1 className="text-2xl font-bold text-center mb-6">
          📋 RIC 29
        </h1>

        <div className="bg-gray-100 rounded-xl p-4 mb-4">

          <h2 className="font-bold text-lg">
            🏥 Datos del equipo
          </h2>

          <p className="mt-2">
            <b>Equipo:</b>{" "}
            {datos.descripcion}
          </p>

          <p>
            <b>Marca / Modelo:</b>{" "}
            {datos.marca_modelo}
          </p>

          <p>
            <b>Serie:</b>{" "}
            {datos.numero_serie}
          </p>

        </div>

        <div className="bg-white border rounded-xl p-4">

          <h2 className="font-bold text-xl mb-3">
            1. Inspecciones
          </h2>

          <Explicacion />

          {[
            [
              "limpieza_exterior",
              "1-a. Limpieza exterior"
            ],
            [
              "papel_registro",
              "1-b. Papel de registro"
            ],
            [
              "estado_cables",
              "1-c. Estado de cables"
            ]
          ].map(([campo, titulo]) => (

            <div
              key={campo}
              className="mb-4"
            >

              <label className="block font-semibold mb-1">
                {titulo}
              </label>

              <select
                value={inspecciones[campo]}
                onChange={(e) =>
                  setInspecciones(prev => ({
                    ...prev,
                    [campo]:
                      e.target.value
                  }))
                }
                className="w-full border rounded-xl p-3"
              >

                <option value="">
                  Seleccione
                </option>

                <option value="Conforme">
                  Conforme
                </option>

                <option value="No Conforme">
                  No Conforme
                </option>

              </select>

            </div>

          ))}

          {hayNC && (

            <div className="mt-4">

              <label className="block font-semibold mb-1">
                Observaciones
              </label>

              <textarea
                value={
                  inspecciones.observaciones
                }
                onChange={(e) =>
                  setInspecciones(prev => ({
                    ...prev,
                    observaciones:
                      e.target.value
                  }))
                }
                className="w-full border rounded-xl p-3"
                rows="3"
              />

            </div>

          )}

        </div>

        <button
          onClick={() => {

            if (
              !inspecciones.limpieza_exterior ||
              !inspecciones.papel_registro ||
              !inspecciones.estado_cables
            ) {

              alert(
                "Complete todas las inspecciones."
              );

              return;
            }

            setEtapa("energia");

          }}
          className="w-full bg-blue-600 text-white rounded-xl p-3 mt-5 font-semibold"
        >
          Continuar → Entrega de energía
        </button>

      </div>
    );
  }

  // =====================================================
  // ENTREGA DE ENERGÍA
  // =====================================================

  if (etapa === "energia") {

    const medicion =
      energia[medicionEnergiaActual];

    const esMaxima =
      medicion.energia_nominal === null;

    const hayNC =
      energia.some(
        item =>
          item.conforme === false
      );

    return (

      <div className="p-4 max-w-xl mx-auto">

        <h1 className="text-2xl font-bold text-center mb-6">
          ⚡ 2. Entrega de energía
        </h1>

        <Explicacion />

        <div className="bg-white border rounded-xl p-4">

          <h3 className="text-lg font-bold mb-4">

            Medición{" "}
            {medicionEnergiaActual + 1}
            {" de "}
            {energia.length}

          </h3>

          {!esMaxima ? (

            <>
              <div className="bg-gray-100 rounded-xl p-3 mb-4">

                <p>
                  <b>Entrega de energía:</b>{" "}
                  {medicion.energia_nominal} J
                </p>

                <p>
                  <b>Incertidumbre:</b>{" "}
                  ±{medicion.incertidumbre}
                </p>

                <p>
                  <b>Rango:</b>{" "}
                  {medicion.rango_min}
                  {" a "}
                  {medicion.rango_max}
                </p>

              </div>

              <label className="block font-semibold mb-1">
                Resultado de medición
              </label>

              <input
                type="number"
                step="0.01"
                value={
                  medicion.resultado_medicion
                }
                onChange={(e) =>
                  actualizarEnergia(
                    medicionEnergiaActual,
                    e.target.value
                  )
                }
                className="w-full border rounded-xl p-3 text-lg"
              />

            </>

          ) : (

            <>

              <div className="bg-gray-100 rounded-xl p-3 mb-4">

                <p className="font-semibold">
                  Máxima energía
                </p>

                <p className="text-sm text-gray-600 mt-1">
                  Ingrese el valor de máxima energía
                  indicado por el fabricante.
                </p>

              </div>

              <label className="block font-semibold mb-1">
                Resultado de medición
              </label>

              <input
                type="number"
                step="0.01"
                value={
                  medicion.resultado_medicion
                }
                onChange={(e) =>
                  actualizarEnergia(
                    medicionEnergiaActual,
                    e.target.value
                  )
                }
                className="w-full border rounded-xl p-3 text-lg"
              />

            </>

          )}

          <EstadoMedicion
            conforme={
              medicion.conforme
            }
          />

          <button
            onClick={
              aceptarMedicionEnergia
            }
            className="w-full bg-green-600 text-white rounded-xl p-3 mt-5 font-semibold"
          >
            ✓ Aceptar medición
          </button>

        </div>

        {medicionEnergiaActual ===
          energia.length - 1 &&
          medicion.conforme !== null &&
          hayNC && (

            <div className="bg-white border rounded-xl p-4 mt-4">

              <label className="block font-semibold mb-1">
                Observaciones
              </label>

              <textarea
                value={
                  observacionesEnergia
                }
                onChange={(e) =>
                  setObservacionesEnergia(
                    e.target.value
                  )
                }
                rows="3"
                className="w-full border rounded-xl p-3"
              />

            </div>
          )}

      </div>
    );
  }

  // =====================================================
  // TIEMPO DE CARGA
  // =====================================================

  if (etapa === "carga") {

    return (

      <div className="p-4 max-w-xl mx-auto">

        <h1 className="text-2xl font-bold text-center mb-6">
          ⏱️ 3. Tiempo de carga
        </h1>

        <Explicacion />

        <div className="bg-white border rounded-xl p-4">

          <p className="font-semibold mb-3">
            Carga a máxima energía
          </p>

          <p className="text-sm text-gray-500 mb-4">
            Rango de aceptación: &lt; 15
          </p>

          <label className="block font-semibold mb-1">
            Resultado de medición
          </label>

          <input
            type="number"
            step="0.01"
            value={
              carga.resultado_medicion
            }
            onChange={(e) =>
              validarCarga(
                e.target.value
              )
            }
            className="w-full border rounded-xl p-3 text-lg"
          />

          <EstadoMedicion
            conforme={
              carga.conforme
            }
          />

          {carga.conforme === false && (

            <textarea
              placeholder="Observaciones"
              value={
                carga.observaciones
              }
              onChange={(e) =>
                setCarga(prev => ({
                  ...prev,
                  observaciones:
                    e.target.value
                }))
              }
              rows="3"
              className="w-full border rounded-xl p-3 mt-4"
            />

          )}

          <button
            onClick={() => {

              if (
                carga.conforme === null
              ) {

                alert(
                  "Ingrese una medición válida."
                );

                return;
              }

              setEtapa("bateria");

            }}
            className="w-full bg-blue-600 text-white rounded-xl p-3 mt-5 font-semibold"
          >
            Continuar → Estado de batería
          </button>

        </div>

      </div>
    );
  }

  // =====================================================
  // BATERÍA
  // =====================================================

  if (etapa === "bateria") {

    return (

      <div className="p-4 max-w-xl mx-auto">

        <h1 className="text-2xl font-bold text-center mb-6">
          🔋 4. Estado de batería
        </h1>

        <Explicacion />

        {bateria.map(
          (medicion, index) => (

            <div
              key={index}
              className="bg-white border rounded-xl p-4 mb-4"
            >

              <h3 className="font-bold mb-3">
                Medición{" "}
                {medicion.numero_medicion}
              </h3>

              <p className="text-sm text-gray-500 mb-3">
                Carga a máxima energía —
                rango &lt; 15
              </p>

              <input
                type="number"
                step="0.01"
                value={
                  medicion.resultado_medicion
                }
                onChange={(e) =>
                  validarBateria(
                    index,
                    e.target.value
                  )
                }
                className="w-full border rounded-xl p-3 text-lg"
              />

              <EstadoMedicion
                conforme={
                  medicion.conforme
                }
              />

              {medicion.conforme === false && (

                <textarea
                  placeholder="Observaciones"
                  value={
                    medicion.observaciones
                  }
                  onChange={(e) => {

                    setBateria(prev => {

                      const copia =
                        [...prev];

                      copia[index] = {
                        ...copia[index],
                        observaciones:
                          e.target.value
                      };

                      return copia;

                    });

                  }}
                  rows="3"
                  className="w-full border rounded-xl p-3 mt-4"
                />

              )}

            </div>

          )
        )}

        <button
          onClick={
            agregarMedicionBateria
          }
          className="w-full bg-gray-600 text-white rounded-xl p-3 mb-3"
        >
          ＋ Agregar medición
        </button>

        <button
          onClick={() => {

            if (
              bateria.some(
                item =>
                  item.conforme === null
              )
            ) {

              alert(
                "Complete todas las mediciones."
              );

              return;
            }

            setEtapa("sincronismo");

          }}
          className="w-full bg-blue-600 text-white rounded-xl p-3 font-semibold"
        >
          Continuar → Sincronismo
        </button>

      </div>
    );
  }

  // =====================================================
  // SINCRONISMO
  // =====================================================

  if (etapa === "sincronismo") {

    return (

      <div className="p-4 max-w-xl mx-auto">

        <h1 className="text-2xl font-bold text-center mb-6">
          🔄 5. Sincronismo
        </h1>

        <Explicacion />

        <div className="bg-white border rounded-xl p-4">

          <p className="font-semibold mb-2">
            Tiempo entre onda R y descarga
          </p>

          <p className="text-sm text-gray-500 mb-4">
            Rango de aceptación: &lt; 60
          </p>

          <input
            type="number"
            step="0.01"
            value={
              sincronismo.resultado_medicion
            }
            onChange={(e) =>
              validarSincronismo(
                e.target.value
              )
            }
            className="w-full border rounded-xl p-3 text-lg"
          />

          <EstadoMedicion
            conforme={
              sincronismo.conforme
            }
          />

          {sincronismo.conforme === false && (

            <textarea
              placeholder="Observaciones"
              value={
                sincronismo.observaciones
              }
              onChange={(e) =>
                setSincronismo(prev => ({
                  ...prev,
                  observaciones:
                    e.target.value
                }))
              }
              rows="3"
              className="w-full border rounded-xl p-3 mt-4"
            />

          )}

          <button
            onClick={() => {

              if (
                sincronismo.conforme === null
              ) {

                alert(
                  "Ingrese una medición válida."
                );

                return;
              }

              setEtapa("monitorizacion");

            }}
            className="w-full bg-blue-600 text-white rounded-xl p-3 mt-5 font-semibold"
          >
            Continuar → Monitorización
          </button>

        </div>

      </div>
    );
  }

  // =====================================================
  // MONITORIZACIÓN
  // =====================================================

  if (etapa === "monitorizacion") {

    return (

      <div className="p-4 max-w-xl mx-auto">

        <h1 className="text-2xl font-bold text-center mb-6">
          ❤️ 6. Monitorización de alarmas
        </h1>

        <Explicacion />

        {monitorizacion.map(
          (medicion, index) => (

            <div
              key={index}
              className="bg-white border rounded-xl p-4 mb-4"
            >

              <p className="font-bold mb-2">
                {medicion.frecuencia_nominal} BPM
              </p>

              <p className="text-sm text-gray-500 mb-3">
                Rango de aceptación:{" "}
                {medicion.frecuencia_nominal - 3}
                {" a "}
                {medicion.frecuencia_nominal + 3}
                {" BPM"}
              </p>

              <input
                type="number"
                step="0.01"
                value={
                  medicion.resultado_medicion
                }
                onChange={(e) =>
                  validarMonitorizacion(
                    index,
                    e.target.value
                  )
                }
                className="w-full border rounded-xl p-3 text-lg"
              />

              <EstadoMedicion
                conforme={
                  medicion.conforme
                }
              />

            </div>

          )
        )}

        {monitorizacion.some(
          item =>
            item.conforme === false
        ) && (

          <textarea
            placeholder="Observaciones"
            value={
              observacionesMonitorizacion
            }
            onChange={(e) =>
              setObservacionesMonitorizacion(
                e.target.value
              )
            }
            rows="3"
            className="w-full border rounded-xl p-3 mb-4"
          />

        )}

        <button
          onClick={() => {

            if (
              monitorizacion.some(
                item =>
                  item.conforme === null
              )
            ) {

              alert(
                "Complete todas las mediciones."
              );

              return;
            }

            setEtapa("resumen");

          }}
          className="w-full bg-blue-600 text-white rounded-xl p-3 font-semibold"
        >
          Continuar → Resumen
        </button>

      </div>
    );
  }

  // =====================================================
  // RESUMEN FINAL
  // =====================================================

  if (etapa === "resumen") {

    const resultado =
      calcularResultadoGeneral();

    return (

      <div className="p-4 max-w-xl mx-auto">

        <h1 className="text-2xl font-bold text-center mb-6">
          📋 Finalizar RIC 29
        </h1>

        <div className="bg-gray-100 rounded-xl p-4 mb-4">

          <p>
            <b>Equipo:</b>{" "}
            {datos.descripcion}
          </p>

          <p>
            <b>Serie:</b>{" "}
            {datos.numero_serie}
          </p>

          <p>
            <b>Técnico:</b>{" "}
            {datos.tecnico}
          </p>

        </div>

        <div
          className={`rounded-xl p-5 text-center text-xl font-bold mb-4 ${
            resultado === "Conforme"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {resultado === "Conforme"
            ? "✓ MANTENIMIENTO CONFORME"
            : "✕ MANTENIMIENTO NO CONFORME"}
        </div>

        <div className="bg-white border rounded-xl p-4">

          <label className="block font-semibold mb-2">
            Observaciones generales
          </label>

          <textarea
            value={
              observacionesGenerales
            }
            onChange={(e) =>
              setObservacionesGenerales(
                e.target.value
              )
            }
            rows="4"
            className="w-full border rounded-xl p-3"
          />

        </div>

        <button
          onClick={() => {

            alert(
              "RIC29 preparado correctamente. El guardado se implementará en el siguiente paso."
            );

          }}
          className="w-full bg-green-600 text-white rounded-xl p-4 mt-5 font-bold text-lg"
        >
          💾 Guardar preventivo
        </button>

        <button
          onClick={() =>
            setVista("equipos")
          }
          className="w-full bg-gray-500 text-white rounded-xl p-3 mt-3"
        >
          ← Cancelar
        </button>

      </div>
    );
  }

  return null;
}
