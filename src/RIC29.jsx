import { useState, useEffect } from "react";
import { API_URL } from "./config";

export default function RIC29({ setVista, personal }) {
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // =====================================================
  // DATOS GENERALES
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
    tecnico: personal?.nombre || "",
  });

  // =====================================================
  // 1 - INSPECCIONES
  // =====================================================

  const [inspecciones, setInspecciones] = useState({
    limpieza_exterior: "",
    papel_registro: "",
    estado_cables: "",
    observaciones: "",
  });

  // =====================================================
  // 2 - ENTREGA DE ENERGÍA
  // =====================================================

  const medicionesEnergiaIniciales = [
    {
      numero: 1,
      energia_nominal: 50,
      incertidumbre: 1.29,
      rango_min: 42.5,
      rango_max: 57.5,
      resultado_medicion: "",
      conforme: null,
      aceptada: false,
    },
    {
      numero: 2,
      energia_nominal: 100,
      incertidumbre: 2.25,
      rango_min: 85,
      rango_max: 115,
      resultado_medicion: "",
      conforme: null,
      aceptada: false,
    },
    {
      numero: 3,
      energia_nominal: 150,
      incertidumbre: 3.3,
      rango_min: 127.5,
      rango_max: 172.5,
      resultado_medicion: "",
      conforme: null,
      aceptada: false,
    },
    {
      numero: 4,
      energia_nominal: 200,
      incertidumbre: 4.4,
      rango_min: 170,
      rango_max: 230,
      resultado_medicion: "",
      conforme: null,
      aceptada: false,
    },
    {
      numero: 5,
      energia_nominal: 270,
      incertidumbre: 5.36,
      rango_min: 229.5,
      rango_max: 310.5,
      resultado_medicion: "",
      conforme: null,
      aceptada: false,
    },
    {
      numero: 6,
      energia_nominal: null,
      incertidumbre: null,
      rango_min: null,
      rango_max: null,
      resultado_medicion: "",
      conforme: null,
      aceptada: false,
      esMaxima: true,
    },
  ];

  const [medicionesEnergia, setMedicionesEnergia] = useState(
    medicionesEnergiaIniciales
  );

  const [medicionEnergiaVisible, setMedicionEnergiaVisible] = useState(0);

  const [observacionesEnergia, setObservacionesEnergia] = useState("");

  // =====================================================
  // 3 - TIEMPO DE CARGA
  // =====================================================

  const [carga, setCarga] = useState({
    resultado_medicion: "",
    conforme: null,
    observaciones: "",
  });

  // =====================================================
  // 4 - ESTADO DE BATERÍA
  // =====================================================

  const [medicionesBateria, setMedicionesBateria] = useState([]);

  const [bateriaActual, setBateriaActual] = useState({
    resultado_medicion: "",
    conforme: null,
  });

  const [observacionesBateria, setObservacionesBateria] = useState("");

  // =====================================================
  // 5 - SINCRONISMO
  // =====================================================

  const [sincronismo, setSincronismo] = useState({
    resultado_medicion: "",
    conforme: null,
    observaciones: "",
  });

  // =====================================================
  // 6 - MONITORIZACIÓN DE ALARMAS
  // =====================================================

  const [monitorizacion, setMonitorizacion] = useState({
    bpm60: {
      resultado_medicion: "",
      conforme: null,
    },
    bpm120: {
      resultado_medicion: "",
      conforme: null,
    },
    observaciones: "",
  });

  // =====================================================
  // CARGAR DATOS DEL EQUIPO
  // =====================================================

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const tareaGuardada = localStorage.getItem("tareaActiva");

      if (!tareaGuardada) {
        setError("No hay una tarea activa.");
        setCargando(false);
        return;
      }

      const tarea = JSON.parse(tareaGuardada);

      console.log("Tarea activa para RIC29:", tarea);

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
          tarea.encargado ||
          "",

        tecnico:
          personal?.nombre ||
          tarea.usuario ||
          "",
      });
    } catch (err) {
      console.error("Error cargando datos RIC29:", err);

      setError(
        err.message ||
          "No se pudieron cargar los datos del equipo."
      );
    } finally {
      setCargando(false);
    }
  };

  // =====================================================
  // FUNCIONES DE EVALUACIÓN
  // =====================================================

  const evaluarRango = (valor, minimo, maximo) => {
    if (valor === "" || valor === null || valor === undefined) {
      return null;
    }

    const numero = Number(valor);

    if (Number.isNaN(numero)) {
      return null;
    }

    return numero >= minimo && numero <= maximo;
  };

  // =====================================================
  // ENERGÍA
  // =====================================================

  const cambiarResultadoEnergia = (indice, valor) => {
    setMedicionesEnergia((prev) => {
      const nuevas = [...prev];

      const medicion = {
        ...nuevas[indice],
        resultado_medicion: valor,
        aceptada: false,
      };

      if (medicion.esMaxima) {
        const nominal = Number(medicion.energia_nominal);
        const resultado = Number(valor);

        if (
          nominal > 0 &&
          !Number.isNaN(resultado)
        ) {
          medicion.rango_min = nominal * 0.85;
          medicion.rango_max = nominal * 1.15;

          medicion.conforme =
            resultado >= medicion.rango_min &&
            resultado <= medicion.rango_max;
        } else {
          medicion.conforme = null;
        }
      } else {
        medicion.conforme = evaluarRango(
          valor,
          medicion.rango_min,
          medicion.rango_max
        );
      }

      nuevas[indice] = medicion;

      return nuevas;
    });
  };

  const cambiarNominalMaxima = (valor) => {
    setMedicionesEnergia((prev) => {
      const nuevas = [...prev];

      const medicion = {
        ...nuevas[5],
        energia_nominal: valor,
        aceptada: false,
      };

      const nominal = Number(valor);
      const resultado = Number(
        medicion.resultado_medicion
      );

      if (nominal > 0) {
        medicion.rango_min = nominal * 0.85;
        medicion.rango_max = nominal * 1.15;

        if (
          medicion.resultado_medicion !== "" &&
          !Number.isNaN(resultado)
        ) {
          medicion.conforme =
            resultado >= medicion.rango_min &&
            resultado <= medicion.rango_max;
        } else {
          medicion.conforme = null;
        }
      } else {
        medicion.rango_min = null;
        medicion.rango_max = null;
        medicion.conforme = null;
      }

      nuevas[5] = medicion;

      return nuevas;
    });
  };

  const aceptarMedicionEnergia = () => {
    const medicion =
      medicionesEnergia[medicionEnergiaVisible];

    if (
      medicion.resultado_medicion === "" ||
      medicion.conforme === null
    ) {
      alert("Debe ingresar un resultado válido.");
      return;
    }

    setMedicionesEnergia((prev) => {
      const nuevas = [...prev];

      nuevas[medicionEnergiaVisible] = {
        ...nuevas[medicionEnergiaVisible],
        aceptada: true,
      };

      return nuevas;
    });

    if (medicionEnergiaVisible < 5) {
      setMedicionEnergiaVisible(
        medicionEnergiaVisible + 1
      );
    }
  };

  const energiaCompleta =
    medicionesEnergia.every(
      (m) => m.aceptada
    );

  const energiaNoConforme =
    medicionesEnergia.some(
      (m) => m.aceptada && m.conforme === false
    );

  // =====================================================
  // TIEMPO DE CARGA
  // =====================================================

  const cambiarCarga = (valor) => {
    const numero = Number(valor);

    let conforme = null;

    if (valor !== "" && !Number.isNaN(numero)) {
      conforme = numero < 15;
    }

    setCarga({
      resultado_medicion: valor,
      conforme,
      observaciones: conforme === false
        ? carga.observaciones
        : "",
    });
  };

  // =====================================================
  // BATERÍA
  // =====================================================

  const cambiarBateria = (valor) => {
    const numero = Number(valor);

    let conforme = null;

    if (valor !== "" && !Number.isNaN(numero)) {
      conforme = numero < 15;
    }

    setBateriaActual({
      resultado_medicion: valor,
      conforme,
    });
  };

  const agregarMedicionBateria = () => {
    if (
      bateriaActual.resultado_medicion === "" ||
      bateriaActual.conforme === null
    ) {
      alert("Debe ingresar una medición válida.");
      return;
    }

    setMedicionesBateria((prev) => [
      ...prev,
      {
        numero_medicion: prev.length + 1,
        ...bateriaActual,
      },
    ]);

    setBateriaActual({
      resultado_medicion: "",
      conforme: null,
    });
  };

  const bateriaNoConforme =
    medicionesBateria.some(
      (m) => m.conforme === false
    ) ||
    bateriaActual.conforme === false;

  // =====================================================
  // SINCRONISMO
  // =====================================================

  const cambiarSincronismo = (valor) => {
    const numero = Number(valor);

    let conforme = null;

    if (valor !== "" && !Number.isNaN(numero)) {
      conforme = numero < 60;
    }

    setSincronismo({
      ...sincronismo,
      resultado_medicion: valor,
      conforme,
    });
  };

  // =====================================================
  // MONITORIZACIÓN
  // =====================================================

  const cambiarBPM = (tipo, valor) => {
    const numero = Number(valor);

    let conforme = null;

    if (valor !== "" && !Number.isNaN(numero)) {
      const nominal = tipo === "bpm60" ? 60 : 120;

      conforme =
        numero >= nominal - 3 &&
        numero <= nominal + 3;
    }

    setMonitorizacion((prev) => ({
      ...prev,
      [tipo]: {
        resultado_medicion: valor,
        conforme,
      },
    }));
  };

  const monitorizacionNoConforme =
    monitorizacion.bpm60.conforme === false ||
    monitorizacion.bpm120.conforme === false;

  // =====================================================
  // INSPECCIONES
  // =====================================================

  const inspeccionNoConforme =
    inspecciones.limpieza_exterior === "No Conforme" ||
    inspecciones.papel_registro === "No Conforme" ||
    inspecciones.estado_cables === "No Conforme";

  // =====================================================
  // ESTADO GENERAL
  // =====================================================

  const preventivoNoConforme =
    inspeccionNoConforme ||
    energiaNoConforme ||
    carga.conforme === false ||
    bateriaNoConforme ||
    sincronismo.conforme === false ||
    monitorizacionNoConforme;

  // =====================================================
  // RENDER
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
    <div className="p-4 max-w-xl mx-auto pb-10">

      {/* ================================================= */}
      {/* TÍTULO */}
      {/* ================================================= */}

      <h1 className="text-2xl font-bold text-center mb-6">
        📋 RIC 29
      </h1>

      {/* ================================================= */}
      {/* DATOS DEL EQUIPO */}
      {/* ================================================= */}

      <div className="bg-gray-100 rounded-xl p-4 mb-5">

        <h2 className="font-bold text-lg mb-3">
          🏥 Datos del equipo
        </h2>

        <div className="space-y-1 text-sm">

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

      {/* ================================================= */}
      {/* 1 - INSPECCIONES */}
      {/* ================================================= */}

      <div className="bg-white border rounded-xl p-4 mb-5 shadow-sm">

        <h2 className="font-bold text-lg mb-4">
          1. Inspecciones
        </h2>

        {[
          ["limpieza_exterior", "1-a. Limpieza exterior"],
          ["papel_registro", "1-b. Papel de registro"],
          ["estado_cables", "1-c. Estado de cables"],
        ].map(([campo, titulo]) => (

          <div key={campo} className="mb-4">

            <label className="block font-semibold mb-1">
              {titulo}
            </label>

            <select
              value={inspecciones[campo]}
              onChange={(e) =>
                setInspecciones((prev) => ({
                  ...prev,
                  [campo]: e.target.value,
                  observaciones:
                    e.target.value === "Conforme"
                      ? ""
                      : prev.observaciones,
                }))
              }
              className="w-full border rounded-xl p-2"
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

        {inspeccionNoConforme && (
          <div>
            <label className="block font-semibold mb-1">
              Observaciones
            </label>

            <textarea
              value={inspecciones.observaciones}
              onChange={(e) =>
                setInspecciones((prev) => ({
                  ...prev,
                  observaciones: e.target.value,
                }))
              }
              className="w-full border rounded-xl p-2"
              rows="3"
              placeholder="Indique la no conformidad..."
            />
          </div>
        )}

      </div>

      {/* ================================================= */}
      {/* 2 - ENTREGA DE ENERGÍA */}
      {/* ================================================= */}

      <div className="bg-white border rounded-xl p-4 mb-5 shadow-sm">

        <h2 className="font-bold text-lg mb-4">
          2. Entrega de energía
        </h2>

        {(() => {

          const medicion =
            medicionesEnergia[
              medicionEnergiaVisible
            ];

          return (
            <div>

              <h3 className="font-semibold mb-3">
                2-
                {String.fromCharCode(
                  97 + medicionEnergiaVisible
                )}
                . Medición{" "}
                {medicion.numero}
              </h3>

              {medicion.esMaxima ? (
                <div className="mb-4">

                  <label className="block font-semibold mb-1">
                    Máx. energía nominal (J)
                  </label>

                  <input
                    type="number"
                    step="0.01"
                    value={
                      medicion.energia_nominal || ""
                    }
                    onChange={(e) =>
                      cambiarNominalMaxima(
                        e.target.value
                      )
                    }
                    className="w-full border rounded-xl p-2"
                    placeholder="Ingrese el valor nominal"
                  />

                </div>
              ) : (
                <div className="bg-gray-100 rounded-xl p-3 mb-4">

                  <p>
                    <b>Entrega de energía:</b>{" "}
                    {medicion.energia_nominal} J
                  </p>

                  <p>
                    <b>Incertidumbre:</b>{" "}
                    ±{medicion.incertidumbre} J
                  </p>

                  <p>
                    <b>Rango de aceptación:</b>{" "}
                    {medicion.rango_min} –{" "}
                    {medicion.rango_max} J
                  </p>

                </div>
              )}

              {medicion.esMaxima &&
                medicion.rango_min !== null && (
                  <div className="bg-gray-100 rounded-xl p-3 mb-4">

                    <p>
                      <b>Rango de aceptación:</b>{" "}
                      {medicion.rango_min.toFixed(2)}
                      {" – "}
                      {medicion.rango_max.toFixed(2)}
                      {" J"}
                    </p>

                    <p className="text-sm text-gray-500 mt-1">
                      ±15 % del valor nominal
                    </p>

                  </div>
                )}

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
                  cambiarResultadoEnergia(
                    medicionEnergiaVisible,
                    e.target.value
                  )
                }
                className="w-full border rounded-xl p-2 mb-4"
                placeholder="Ingrese el resultado"
                disabled={medicion.aceptada}
              />

              {medicion.conforme !== null && (
                <div
                  className={`p-3 rounded-xl text-center font-bold mb-4 ${
                    medicion.conforme
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {medicion.conforme
                    ? "🟢 CONFORME"
                    : "🔴 NO CONFORME"}
                </div>
              )}

              {!medicion.aceptada && (
                <button
                  onClick={aceptarMedicionEnergia}
                  className="w-full bg-blue-600 text-white rounded-xl p-3"
                >
                  ✅ Aceptar medición
                </button>
              )}

              {medicion.aceptada &&
                medicionEnergiaVisible < 5 && (
                  <div className="bg-green-100 text-green-700 rounded-xl p-3 text-center font-semibold">
                    Medición aceptada ✅
                  </div>
                )}

            </div>
          );

        })()}

        {energiaCompleta && (
          <div className="mt-5">

            <div
              className={`p-3 rounded-xl text-center font-bold ${
                energiaNoConforme
                  ? "bg-red-100 text-red-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {energiaNoConforme
                ? "🔴 Entrega de energía: NO CONFORME"
                : "🟢 Entrega de energía: CONFORME"}
            </div>

            {energiaNoConforme && (
              <div className="mt-4">

                <label className="block font-semibold mb-1">
                  Observaciones
                </label>

                <textarea
                  value={observacionesEnergia}
                  onChange={(e) =>
                    setObservacionesEnergia(
                      e.target.value
                    )
                  }
                  className="w-full border rounded-xl p-2"
                  rows="3"
                  placeholder="Indique las mediciones que no cumplen..."
                />

              </div>
            )}

          </div>
        )}

      </div>

      {/* ================================================= */}
      {/* 3 - TIEMPO DE CARGA */}
      {/* ================================================= */}

      <div className="bg-white border rounded-xl p-4 mb-5 shadow-sm">

        <h2 className="font-bold text-lg mb-4">
          3. Tiempo de carga
        </h2>

        <div className="bg-gray-100 rounded-xl p-3 mb-4">

          <p>
            <b>Carga a máxima energía</b>
          </p>

          <p className="text-sm text-gray-600">
            Incertidumbre: ±0,05 s
          </p>

          <p className="text-sm text-gray-600">
            Rango de aceptación: &lt; 15 s
          </p>

        </div>

        <label className="block font-semibold mb-1">
          Resultado de medición (s)
        </label>

        <input
          type="number"
          step="0.01"
          value={carga.resultado_medicion}
          onChange={(e) =>
            cambiarCarga(e.target.value)
          }
          className="w-full border rounded-xl p-2"
        />

        {carga.conforme !== null && (
          <div
            className={`p-3 rounded-xl text-center font-bold mt-4 ${
              carga.conforme
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {carga.conforme
              ? "🟢 CONFORME"
              : "🔴 NO CONFORME"}
          </div>
        )}

        {carga.conforme === false && (
          <textarea
            value={carga.observaciones}
            onChange={(e) =>
              setCarga({
                ...carga,
                observaciones: e.target.value,
              })
            }
            className="w-full border rounded-xl p-2 mt-4"
            rows="3"
            placeholder="Indique la no conformidad..."
          />
        )}

      </div>

      {/* ================================================= */}
      {/* 4 - ESTADO DE BATERÍA */}
      {/* ================================================= */}

      <div className="bg-white border rounded-xl p-4 mb-5 shadow-sm">

        <h2 className="font-bold text-lg mb-4">
          4. Estado de batería
        </h2>

        <div className="bg-gray-100 rounded-xl p-3 mb-4">

          <p>
            <b>Carga a máxima energía</b>
          </p>

          <p className="text-sm text-gray-600">
            Incertidumbre: ±0,05
          </p>

          <p className="text-sm text-gray-600">
            Rango de aceptación: &lt; 15
          </p>

        </div>

        <label className="block font-semibold mb-1">
          Resultado de medición
        </label>

        <input
          type="number"
          step="0.01"
          value={
            bateriaActual.resultado_medicion
          }
          onChange={(e) =>
            cambiarBateria(e.target.value)
          }
          className="w-full border rounded-xl p-2"
        />

        {bateriaActual.conforme !== null && (
          <div
            className={`p-3 rounded-xl text-center font-bold mt-4 ${
              bateriaActual.conforme
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {bateriaActual.conforme
              ? "🟢 CONFORME"
              : "🔴 NO CONFORME"}
          </div>
        )}

        <button
          onClick={agregarMedicionBateria}
          className="w-full bg-blue-600 text-white rounded-xl p-3 mt-4"
        >
          ➕ Agregar medición
        </button>

        {medicionesBateria.length > 0 && (
          <div className="mt-4 space-y-2">

            {medicionesBateria.map((medicion) => (
              <div
                key={medicion.numero_medicion}
                className={`p-3 rounded-xl ${
                  medicion.conforme
                    ? "bg-green-100"
                    : "bg-red-100"
                }`}
              >
                <b>
                  Medición{" "}
                  {medicion.numero_medicion}
                </b>

                {" : "}
                {medicion.resultado_medicion}

                {" — "}

                {medicion.conforme
                  ? "CONFORME"
                  : "NO CONFORME"}
              </div>
            ))}

          </div>
        )}

        {bateriaNoConforme && (
          <textarea
            value={observacionesBateria}
            onChange={(e) =>
              setObservacionesBateria(
                e.target.value
              )
            }
            className="w-full border rounded-xl p-2 mt-4"
            rows="3"
            placeholder="Indique la no conformidad..."
          />
        )}

      </div>

      {/* ================================================= */}
      {/* 5 - SINCRONISMO */}
      {/* ================================================= */}

      <div className="bg-white border rounded-xl p-4 mb-5 shadow-sm">

        <h2 className="font-bold text-lg mb-4">
          5. Sincronismo
        </h2>

        <div className="bg-gray-100 rounded-xl p-3 mb-4">

          <p>
            <b>Tiempo entre onda R y descarga</b>
          </p>

          <p className="text-sm text-gray-600">
            Valor nominal: 50 J
          </p>

          <p className="text-sm text-gray-600">
            Incertidumbre: ±6,42
          </p>

          <p className="text-sm text-gray-600">
            Rango de aceptación: &lt; 60
          </p>

        </div>

        <label className="block font-semibold mb-1">
          Resultado de medición
        </label>

        <input
          type="number"
          step="0.01"
          value={
            sincronismo.resultado_medicion
          }
          onChange={(e) =>
            cambiarSincronismo(
              e.target.value
            )
          }
          className="w-full border rounded-xl p-2"
        />

        {sincronismo.conforme !== null && (
          <div
            className={`p-3 rounded-xl text-center font-bold mt-4 ${
              sincronismo.conforme
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {sincronismo.conforme
              ? "🟢 CONFORME"
              : "🔴 NO CONFORME"}
          </div>
        )}

        {sincronismo.conforme === false && (
          <textarea
            value={sincronismo.observaciones}
            onChange={(e) =>
              setSincronismo({
                ...sincronismo,
                observaciones: e.target.value,
              })
            }
            className="w-full border rounded-xl p-2 mt-4"
            rows="3"
            placeholder="Indique la no conformidad..."
          />
        )}

      </div>

      {/* ================================================= */}
      {/* 6 - MONITORIZACIÓN DE ALARMAS */}
      {/* ================================================= */}

      <div className="bg-white border rounded-xl p-4 mb-5 shadow-sm">

        <h2 className="font-bold text-lg mb-4">
          6. Monitorización de alarmas
        </h2>

        <div className="mb-5">

          <label className="block font-semibold mb-1">
            60 BPM
          </label>

          <p className="text-sm text-gray-500 mb-2">
            Rango de aceptación: 57 – 63 BPM
          </p>

          <input
            type="number"
            step="0.01"
            value={
              monitorizacion.bpm60
                .resultado_medicion
            }
            onChange={(e) =>
              cambiarBPM(
                "bpm60",
                e.target.value
              )
            }
            className="w-full border rounded-xl p-2"
          />

          {monitorizacion.bpm60.conforme !==
            null && (
            <div
              className={`p-3 rounded-xl text-center font-bold mt-3 ${
                monitorizacion.bpm60.conforme
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {monitorizacion.bpm60.conforme
                ? "🟢 CONFORME"
                : "🔴 NO CONFORME"}
            </div>
          )}

        </div>

        <div>

          <label className="block font-semibold mb-1">
            120 BPM
          </label>

          <p className="text-sm text-gray-500 mb-2">
            Rango de aceptación: 117 – 123 BPM
          </p>

          <input
            type="number"
            step="0.01"
            value={
              monitorizacion.bpm120
                .resultado_medicion
            }
            onChange={(e) =>
              cambiarBPM(
                "bpm120",
                e.target.value
              )
            }
            className="w-full border rounded-xl p-2"
          />

          {monitorizacion.bpm120.conforme !==
            null && (
            <div
              className={`p-3 rounded-xl text-center font-bold mt-3 ${
                monitorizacion.bpm120.conforme
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {monitorizacion.bpm120.conforme
                ? "🟢 CONFORME"
                : "🔴 NO CONFORME"}
            </div>
          )}

        </div>

        {monitorizacionNoConforme && (
          <textarea
            value={monitorizacion.observaciones}
            onChange={(e) =>
              setMonitorizacion((prev) => ({
                ...prev,
                observaciones:
                  e.target.value,
              }))
            }
            className="w-full border rounded-xl p-2 mt-4"
            rows="3"
            placeholder="Indique la no conformidad..."
          />
        )}

      </div>

      {/* ================================================= */}
      {/* RESULTADO GENERAL */}
      {/* ================================================= */}

      <div
        className={`rounded-xl p-4 mb-5 text-center font-bold ${
          preventivoNoConforme
            ? "bg-red-100 text-red-700"
            : "bg-green-100 text-green-700"
        }`}
      >
        {preventivoNoConforme
          ? "🔴 PREVENTIVO CON NO CONFORMIDADES"
          : "🟢 PREVENTIVO CONFORME"}
      </div>

      {/* ================================================= */}
      {/* BOTÓN GUARDAR */}
      {/* ================================================= */}

      <button
        onClick={() => {
          console.log("DATOS RIC29:", {
            datos,
            inspecciones,
            medicionesEnergia,
            carga,
            medicionesBateria,
            sincronismo,
            monitorizacion,
            resultado_general:
              preventivoNoConforme
                ? "No Conforme"
                : "Conforme",
          });

          alert(
            "Formulario RIC29 listo. El guardado en la base de datos lo hacemos en el siguiente paso."
          );
        }}
        className="w-full bg-green-600 text-white rounded-xl p-4 font-bold text-lg"
      >
        💾 Guardar preventivo
      </button>

      {/* ================================================= */}
      {/* VOLVER */}
      {/* ================================================= */}

      <button
        onClick={() => setVista("equipos")}
        className="w-full bg-gray-500 text-white rounded-xl p-3 mt-3"
      >
        ← Volver
      </button>

    </div>
  );
}
