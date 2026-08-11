import { useState, useEffect } from "react";
import { API_URL } from "./config";

export default function RIC29({ setVista, personal }) {

  // =====================================================
  // ESTADOS GENERALES
  // =====================================================

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

  // Etapa actual
  const [etapa, setEtapa] = useState(1);

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
      energia_nominal: 50,
      resultado_medicion: "",
      incertidumbre: 1.29,
      rango_min: 42.5,
      rango_max: 57.5,
      conforme: null
    },
    {
      energia_nominal: 100,
      resultado_medicion: "",
      incertidumbre: 2.25,
      rango_min: 85,
      rango_max: 115,
      conforme: null
    },
    {
      energia_nominal: 150,
      resultado_medicion: "",
      incertidumbre: 3.30,
      rango_min: 127.5,
      rango_max: 172.5,
      conforme: null
    },
    {
      energia_nominal: 200,
      resultado_medicion: "",
      incertidumbre: 4.40,
      rango_min: 170,
      rango_max: 230,
      conforme: null
    },
    {
      energia_nominal: 270,
      resultado_medicion: "",
      incertidumbre: 5.36,
      rango_min: 229.5,
      rango_max: 310.5,
      conforme: null
    },
    {
      energia_nominal: "MAX",
      energia_fabricante: "",
      resultado_medicion: "",
      incertidumbre: null,
      rango_min: null,
      rango_max: null,
      conforme: null
    }
  ]);

  const [medicionEnergiaActual, setMedicionEnergiaActual] = useState(0);

  const [observacionesEnergia, setObservacionesEnergia] =
    useState("");

  // =====================================================
  // 3 - TIEMPO DE CARGA
  // =====================================================

  const [carga, setCarga] = useState({
    resultado_medicion: "",
    incertidumbre: 0.05,
    rango_max: 15,
    conforme: null,
    observaciones: ""
  });

  // =====================================================
  // 4 - BATERÍA
  // =====================================================

  const [baterias, setBaterias] = useState([
    {
      numero_medicion: 1,
      resultado_medicion: "",
      incertidumbre: 0.05,
      rango_max: 15,
      conforme: null
    }
  ]);

  const [observacionesBateria, setObservacionesBateria] =
    useState("");

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
  // 6 - MONITORIZACIÓN
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
  // RESUMEN
  // =====================================================

  const [mostrarResumen, setMostrarResumen] = useState(false);

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

      const tarea = JSON.parse(tareaGuardada);

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
  // FUNCIONES AUXILIARES
  // =====================================================

  const numero = (valor) => {

    if (
      valor === "" ||
      valor === null ||
      valor === undefined
    ) {
      return null;
    }

    const n = Number(valor);

    return Number.isNaN(n) ? null : n;
  };

  // =====================================================
  // CONFORMIDAD ENERGÍA
  // =====================================================

  const calcularConformidadEnergia = (
    index,
    valor
  ) => {

    const medicion = energia[index];

    const resultado = numero(valor);

    if (resultado === null) {
      return null;
    }

    // Máxima energía
    if (
      medicion.energia_nominal === "MAX"
    ) {

      const fabricante =
        numero(
          medicion.energia_fabricante
        );

      if (fabricante === null) {
        return null;
      }

      const rangoMin =
        fabricante * 0.85;

      const rangoMax =
        fabricante * 1.15;

      return (
        resultado >= rangoMin &&
        resultado <= rangoMax
      );
    }

    return (
      resultado >= medicion.rango_min &&
      resultado <= medicion.rango_max
    );
  };

  const actualizarEnergia = (
    index,
    campo,
    valor
  ) => {

    setEnergia(prev => {

      const copia = [...prev];

      copia[index] = {
        ...copia[index],
        [campo]: valor
      };

      if (
        campo === "resultado_medicion" ||
        campo === "energia_fabricante"
      ) {

        copia[index].conforme =
          calcularConformidadEnergia(
            index,
            campo === "resultado_medicion"
              ? valor
              : copia[index].resultado_medicion
          );
      }

      return copia;
    });
  };

  // =====================================================
  // CONFORMIDAD CARGA
  // =====================================================

  const actualizarCarga = (valor) => {

    const resultado = numero(valor);

    const conforme =
      resultado !== null &&
      resultado < 15;

    setCarga(prev => ({
      ...prev,
      resultado_medicion: valor,
      conforme
    }));
  };

  // =====================================================
  // CONFORMIDAD BATERÍA
  // =====================================================

  const actualizarBateria = (
    index,
    valor
  ) => {

    setBaterias(prev => {

      const copia = [...prev];

      const resultado =
        numero(valor);

      copia[index] = {
        ...copia[index],
        resultado_medicion: valor,
        conforme:
          resultado !== null &&
          resultado < 15
      };

      return copia;
    });
  };

  const agregarMedicionBateria = () => {

    setBaterias(prev => [
      ...prev,
      {
        numero_medicion:
          prev.length + 1,
        resultado_medicion: "",
        incertidumbre: 0.05,
        rango_max: 15,
        conforme: null
      }
    ]);
  };

  // =====================================================
  // CONFORMIDAD SINCRONISMO
  // =====================================================

  const actualizarSincronismo = (
    valor
  ) => {

    const resultado =
      numero(valor);

    setSincronismo(prev => ({
      ...prev,
      resultado_medicion: valor,
      conforme:
        resultado !== null &&
        resultado < 60
    }));
  };

  // =====================================================
  // CONFORMIDAD MONITORIZACIÓN
  // =====================================================

  const actualizarMonitorizacion = (
    index,
    valor
  ) => {

    setMonitorizacion(prev => {

      const copia = [...prev];

      const resultado =
        numero(valor);

      const nominal =
        copia[index].frecuencia_nominal;

      const conforme =
        resultado !== null &&
        resultado >= nominal - 3 &&
        resultado <= nominal + 3;

      copia[index] = {
        ...copia[index],
        resultado_medicion: valor,
        conforme
      };

      return copia;
    });
  };

  // =====================================================
  // COMPLETAR INSPECCIONES
  // =====================================================

  const completarInspecciones = () => {

    if (
      !inspecciones.limpieza_exterior ||
      !inspecciones.papel_registro ||
      !inspecciones.estado_cables
    ) {

      alert(
        "Complete todos los campos de inspección."
      );

      return;
    }

    const hayNoConforme =
      inspecciones.limpieza_exterior ===
        "No Conforme" ||
      inspecciones.papel_registro ===
        "No Conforme" ||
      inspecciones.estado_cables ===
        "No Conforme";

    if (
      hayNoConforme &&
      !inspecciones.observaciones.trim()
    ) {

      alert(
        "Debe ingresar una observación para la no conformidad."
      );

      return;
    }

    setEtapa(2);
  };

  // =====================================================
  // COMPLETAR ENTREGA DE ENERGÍA
  // =====================================================

  const completarEnergia = () => {

    const medicionesCompletas =
      energia.every(m => {

        if (
          m.resultado_medicion === ""
        ) {
          return false;
        }

        if (
          m.energia_nominal === "MAX" &&
          m.energia_fabricante === ""
        ) {
          return false;
        }

        return true;
      });

    if (!medicionesCompletas) {

      alert(
        "Complete todas las mediciones de entrega de energía."
      );

      return;
    }

    const hayNoConforme =
      energia.some(
        m => m.conforme === false
      );

    if (
      hayNoConforme &&
      !observacionesEnergia.trim()
    ) {

      alert(
        "Debe ingresar observaciones para las mediciones no conformes."
      );

      return;
    }

    setEtapa(3);
  };

  // =====================================================
  // COMPLETAR CARGA
  // =====================================================

  const completarCarga = () => {

    if (
      carga.resultado_medicion === ""
    ) {

      alert(
        "Ingrese el resultado de la medición."
      );

      return;
    }

    if (
      carga.conforme === false &&
      !carga.observaciones.trim()
    ) {

      alert(
        "Debe ingresar una observación."
      );

      return;
    }

    setEtapa(4);
  };

  // =====================================================
  // COMPLETAR BATERÍA
  // =====================================================

  const completarBateria = () => {

    const incompleta =
      baterias.some(
        m => m.resultado_medicion === ""
      );

    if (incompleta) {

      alert(
        "Complete todas las mediciones de batería."
      );

      return;
    }

    const hayNoConforme =
      baterias.some(
        m => m.conforme === false
      );

    if (
      hayNoConforme &&
      !observacionesBateria.trim()
    ) {

      alert(
        "Debe ingresar observaciones."
      );

      return;
    }

    setEtapa(5);
  };

  // =====================================================
  // COMPLETAR SINCRONISMO
  // =====================================================

  const completarSincronismo = () => {

    if (
      sincronismo.resultado_medicion === ""
    ) {

      alert(
        "Ingrese el resultado de sincronismo."
      );

      return;
    }

    if (
      sincronismo.conforme === false &&
      !sincronismo.observaciones.trim()
    ) {

      alert(
        "Debe ingresar una observación."
      );

      return;
    }

    setEtapa(6);
  };

  // =====================================================
  // COMPLETAR MONITORIZACIÓN
  // =====================================================

  const completarMonitorizacion = () => {

    const incompleta =
      monitorizacion.some(
        m => m.resultado_medicion === ""
      );

    if (incompleta) {

      alert(
        "Complete las mediciones de monitorización."
      );

      return;
    }

    const hayNoConforme =
      monitorizacion.some(
        m => m.conforme === false
      );

    if (
      hayNoConforme &&
      !observacionesMonitorizacion.trim()
    ) {

      alert(
        "Debe ingresar observaciones."
      );

      return;
    }

    setMostrarResumen(true);
  };

  // =====================================================
  // OBTENER NO CONFORMIDADES
  // =====================================================

  const obtenerNoConformidades = () => {

    const errores = [];

    // Inspecciones

    if (
      inspecciones.limpieza_exterior ===
      "No Conforme"
    ) {

      errores.push({
        etapa: "Inspecciones",
        item: "Limpieza exterior",
        resultado: "No Conforme"
      });

    }

    if (
      inspecciones.papel_registro ===
      "No Conforme"
    ) {

      errores.push({
        etapa: "Inspecciones",
        item: "Papel de registro",
        resultado: "No Conforme"
      });

    }

    if (
      inspecciones.estado_cables ===
      "No Conforme"
    ) {

      errores.push({
        etapa: "Inspecciones",
        item: "Estado de cables",
        resultado: "No Conforme"
      });

    }

    // Energía

    energia.forEach((m, index) => {

      if (m.conforme === false) {

        let rango = "";

        if (
          m.energia_nominal === "MAX"
        ) {

          const fabricante =
            Number(
              m.energia_fabricante
            );

          rango =
            `${(
              fabricante * 0.85
            ).toFixed(2)} - ${(
              fabricante * 1.15
            ).toFixed(2)} J`;

        } else {

          rango =
            `${m.rango_min} - ${m.rango_max} J`;
        }

        errores.push({
          etapa: "Entrega de energía",
          item:
            m.energia_nominal === "MAX"
              ? "Máx. energía"
              : `${m.energia_nominal} J`,
          resultado:
            `${m.resultado_medicion} J`,
          rango
        });

      }

    });

    // Carga

    if (
      carga.conforme === false
    ) {

      errores.push({
        etapa: "Tiempo de carga",
        item: "Carga a máxima energía",
        resultado:
          `${carga.resultado_medicion}`,
        rango: "< 15"
      });

    }

    // Batería

    baterias.forEach(m => {

      if (m.conforme === false) {

        errores.push({
          etapa: "Estado de batería",
          item:
            `Medición ${m.numero_medicion}`,
          resultado:
            `${m.resultado_medicion}`,
          rango: "< 15"
        });

      }

    });

    // Sincronismo

    if (
      sincronismo.conforme === false
    ) {

      errores.push({
        etapa: "Sincronismo",
        item:
          "Tiempo entre onda R y descarga",
        resultado:
          `${sincronismo.resultado_medicion}`,
        rango: "< 60"
      });

    }

    // Monitorización

    monitorizacion.forEach(m => {

      if (m.conforme === false) {

        errores.push({
          etapa:
            "Monitorización de alarmas",
          item:
            `${m.frecuencia_nominal} BPM`,
          resultado:
            `${m.resultado_medicion} BPM`,
          rango:
            `${m.frecuencia_nominal - 3} - ${
              m.frecuencia_nominal + 3
            } BPM`
        });

      }

    });

    return errores;
  };

  // =====================================================
  // PROGRESO
  // =====================================================

  const porcentaje =
    mostrarResumen
      ? 100
      : ((etapa - 1) / 6) * 100;

  const nombresEtapas = [
    "Inspecciones",
    "Entrega de energía",
    "Tiempo de carga",
    "Estado de batería",
    "Sincronismo",
    "Monitorización"
  ];

  // =====================================================
  // CARGANDO
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
          onClick={() => setVista("equipos")}
          className="w-full bg-gray-500 text-white rounded-xl p-3 mt-4"
        >
          ← Volver
        </button>

      </div>
    );
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (

    <div className="p-4 max-w-xl mx-auto">

      {/* ================================================= */}
      {/* CABECERA */}
      {/* ================================================= */}

      <h1 className="text-2xl font-bold text-center mb-4">
        📋 RIC 29
      </h1>

      {/* ================================================= */}
      {/* BARRA DE PROGRESO */}
      {/* ================================================= */}

      <div className="mb-6">

        <div className="flex justify-between text-xs text-gray-500 mb-1">

          <span>
            {mostrarResumen
              ? "Finalizado"
              : `${etapa}/6`}
          </span>

          <span>
            {mostrarResumen
              ? "100%"
              : `${Math.round(porcentaje)}%`}
          </span>

        </div>

        <div className="w-full bg-gray-200 rounded-full h-3">

          <div
            className="bg-blue-600 h-3 rounded-full transition-all duration-500"
            style={{
              width: `${porcentaje}%`
            }}
          />

        </div>

        {!mostrarResumen && (
          <p className="text-center text-sm font-semibold mt-2">
            {nombresEtapas[etapa - 1]}
          </p>
        )}

      </div>

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
      {/* ETAPA 1 - INSPECCIONES */}
      {/* ================================================= */}

      {etapa === 1 && !mostrarResumen && (

        <div className="bg-white border rounded-xl p-4">

          <h2 className="font-bold text-lg mb-2">
            1. Inspecciones
          </h2>

          <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3 mb-4">
            💡 Acá va explicación
          </p>

          {/* LIMPIEZA */}

          <label className="font-semibold block mb-1">
            1-a. Limpieza exterior
          </label>

          <select
            value={
              inspecciones.limpieza_exterior
            }
            onChange={(e) =>
              setInspecciones(prev => ({
                ...prev,
                limpieza_exterior:
                  e.target.value
              }))
            }
            className="w-full border rounded-xl p-3 mb-4"
          >

            <option value="">
              Seleccionar
            </option>

            <option value="Conforme">
              Conforme
            </option>

            <option value="No Conforme">
              No Conforme
            </option>

          </select>

          {/* PAPEL */}

          <label className="font-semibold block mb-1">
            1-b. Papel de registro
          </label>

          <select
            value={
              inspecciones.papel_registro
            }
            onChange={(e) =>
              setInspecciones(prev => ({
                ...prev,
                papel_registro:
                  e.target.value
              }))
            }
            className="w-full border rounded-xl p-3 mb-4"
          >

            <option value="">
              Seleccionar
            </option>

            <option value="Conforme">
              Conforme
            </option>

            <option value="No Conforme">
              No Conforme
            </option>

          </select>

          {/* CABLES */}

          <label className="font-semibold block mb-1">
            1-c. Estado de cables
          </label>

          <select
            value={
              inspecciones.estado_cables
            }
            onChange={(e) =>
              setInspecciones(prev => ({
                ...prev,
                estado_cables:
                  e.target.value
              }))
            }
            className="w-full border rounded-xl p-3 mb-4"
          >

            <option value="">
              Seleccionar
            </option>

            <option value="Conforme">
              Conforme
            </option>

            <option value="No Conforme">
              No Conforme
            </option>

          </select>

          {/* OBSERVACIONES */}

          {(
            inspecciones.limpieza_exterior ===
              "No Conforme" ||
            inspecciones.papel_registro ===
              "No Conforme" ||
            inspecciones.estado_cables ===
              "No Conforme"
          ) && (

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
              placeholder="Observaciones"
              className="w-full border rounded-xl p-3 mb-4"
              rows={3}
            />

          )}

          <button
            onClick={
              completarInspecciones
            }
            className="w-full bg-blue-600 text-white rounded-xl p-3"
          >
            Aceptar inspecciones →
          </button>

        </div>

      )}

      {/* ================================================= */}
      {/* ETAPA 2 - ENERGÍA */}
      {/* ================================================= */}

      {etapa === 2 && !mostrarResumen && (

        <div className="bg-white border rounded-xl p-4">

          <h2 className="font-bold text-lg mb-2">
            2. Entrega de energía
          </h2>

          <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3 mb-4">
            💡 Acá va explicación
          </p>

          {energia.map((m, index) => {

            if (
              index !==
              medicionEnergiaActual
            ) {
              return null;
            }

            const esMax =
              m.energia_nominal === "MAX";

            return (

              <div key={index}>

                <h3 className="font-bold text-lg mb-4">

                  {esMax
                    ? "Medición 6 - Máx. energía"
                    : `Medición ${
                        index + 1
                      } - ${
                        m.energia_nominal
                      } J`}

                </h3>

                {/* VALOR FABRICANTE */}

                {esMax && (

                  <div className="mb-4">

                    <label className="font-semibold block mb-1">
                      Energía indicada por fabricante (J)
                    </label>

                    <input
                      type="number"
                      step="0.01"
                      value={
                        m.energia_fabricante
                      }
                      onChange={(e) =>
                        actualizarEnergia(
                          index,
                          "energia_fabricante",
                          e.target.value
                        )
                      }
                      className="w-full border rounded-xl p-3"
                      placeholder="Ej.: 360"
                    />

                  </div>

                )}

                {/* RESULTADO */}

                <label className="font-semibold block mb-1">
                  Resultado de medición (J)
                </label>

                <input
                  type="number"
                  step="0.01"
                  value={
                    m.resultado_medicion
                  }
                  onChange={(e) =>
                    actualizarEnergia(
                      index,
                      "resultado_medicion",
                      e.target.value
                    )
                  }
                  className={`w-full border rounded-xl p-3 mb-4 ${
                    m.conforme === true
                      ? "bg-green-100 border-green-500"
                      : m.conforme === false
                      ? "bg-red-100 border-red-500"
                      : ""
                  }`}
                  placeholder="Ingrese medición"
                />

                {/* RANGO */}

                {esMax && (
                  <div className="bg-gray-50 rounded-xl p-3 mb-4 text-sm">

                    {m.energia_fabricante !== "" ? (

                      <>
                        <p>
                          <b>Valor fabricante:</b>{" "}
                          {m.energia_fabricante} J
                        </p>

                        <p>
                          <b>Incertidumbre:</b>{" "}
                          ±15%
                        </p>

                        <p>
                          <b>Rango aceptación:</b>{" "}
                          {(
                            Number(
                              m.energia_fabricante
                            ) * 0.85
                          ).toFixed(2)}
                          {" - "}
                          {(
                            Number(
                              m.energia_fabricante
                            ) * 1.15
                          ).toFixed(2)}
                          {" J"}
                        </p>
                      </>

                    ) : (

                      <p>
                        Ingrese primero el valor indicado por el fabricante.
                      </p>

                    )}

                  </div>
                )}

                {!esMax && (

                  <div className="bg-gray-50 rounded-xl p-3 mb-4 text-sm">

                    <p>
                      <b>Incertidumbre:</b>{" "}
                      ±{m.incertidumbre} J
                    </p>

                    <p>
                      <b>Rango aceptación:</b>{" "}
                      {m.rango_min} -{" "}
                      {m.rango_max} J
                    </p>

                  </div>

                )}

                {/* RESULTADO CONFORMIDAD */}

                {m.conforme !== null && (

                  <div
                    className={`rounded-xl p-3 text-center font-bold mb-4 ${
                      m.conforme
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >

                    {m.conforme
                      ? "✅ CONFORME"
                      : "❌ NO CONFORME"}

                  </div>

                )}

                {/* SIGUIENTE */}

                <button
                  onClick={() => {

                    if (
                      m.resultado_medicion === ""
                    ) {

                      alert(
                        "Ingrese el resultado de la medición."
                      );

                      return;
                    }

                    if (
                      esMax &&
                      m.energia_fabricante === ""
                    ) {

                      alert(
                        "Ingrese el valor de energía indicado por el fabricante."
                      );

                      return;
                    }

                    if (
                      m.conforme === null
                    ) {

                      alert(
                        "Ingrese un resultado válido."
                      );

                      return;
                    }

                    if (
                      index <
                      energia.length - 1
                    ) {

                      setMedicionEnergiaActual(
                        index + 1
                      );

                    } else {

                      completarEnergia();

                    }

                  }}
                  className="w-full bg-blue-600 text-white rounded-xl p-3"
                >

                  {index <
                  energia.length - 1
                    ? "Aceptar medición →"
                    : "Aceptar mediciones →"}

                </button>

                {m.conforme === false && (
                  <textarea
                    value={
                      observacionesEnergia
                    }
                    onChange={(e) =>
                      setObservacionesEnergia(
                        e.target.value
                      )
                    }
                    placeholder="Observaciones de las no conformidades"
                    className="w-full border rounded-xl p-3 mt-4"
                    rows={3}
                  />
                )}

              </div>

            );

          })}

        </div>

      )}

      {/* ================================================= */}
      {/* ETAPA 3 - CARGA */}
      {/* ================================================= */}

      {etapa === 3 && !mostrarResumen && (

        <div className="bg-white border rounded-xl p-4">

          <h2 className="font-bold text-lg mb-2">
            3. Tiempo de carga
          </h2>

          <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3 mb-4">
            💡 Acá va explicación
          </p>

          <label className="font-semibold block mb-1">
            Carga a máxima energía
          </label>

          <input
            type="number"
            step="0.01"
            value={
              carga.resultado_medicion
            }
            onChange={(e) =>
              actualizarCarga(
                e.target.value
              )
            }
            className={`w-full border rounded-xl p-3 mb-4 ${
              carga.conforme === true
                ? "bg-green-100 border-green-500"
                : carga.conforme === false
                ? "bg-red-100 border-red-500"
                : ""
            }`}
            placeholder="Ingrese tiempo de carga"
          />

          <div className="bg-gray-50 rounded-xl p-3 mb-4 text-sm">

            <p>
              <b>Incertidumbre:</b> ±0.05
            </p>

            <p>
              <b>Rango de aceptación:</b> &lt; 15
            </p>

          </div>

          {carga.conforme !== null && (

            <div
              className={`rounded-xl p-3 text-center font-bold mb-4 ${
                carga.conforme
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >

              {carga.conforme
                ? "✅ CONFORME"
                : "❌ NO CONFORME"}

            </div>

          )}

          {carga.conforme === false && (

            <textarea
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
              placeholder="Observaciones"
              className="w-full border rounded-xl p-3 mb-4"
              rows={3}
            />

          )}

          <button
            onClick={
              completarCarga
            }
            className="w-full bg-blue-600 text-white rounded-xl p-3"
          >
            Aceptar medición →
          </button>

        </div>

      )}

      {/* ================================================= */}
      {/* ETAPA 4 - BATERÍA */}
      {/* ================================================= */}

      {etapa === 4 && !mostrarResumen && (

        <div className="bg-white border rounded-xl p-4">

          <h2 className="font-bold text-lg mb-2">
            4. Estado de batería
          </h2>

          <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3 mb-4">
            💡 Acá va explicación
          </p>

          {baterias.map((m, index) => (

            <div
              key={index}
              className="border rounded-xl p-3 mb-4"
            >

              <h3 className="font-bold mb-3">
                Medición {m.numero_medicion}
              </h3>

              <label className="font-semibold block mb-1">
                Resultado de medición
              </label>

              <input
                type="number"
                step="0.01"
                value={
                  m.resultado_medicion
                }
                onChange={(e) =>
                  actualizarBateria(
                    index,
                    e.target.value
                  )
                }
                className={`w-full border rounded-xl p-3 mb-3 ${
                  m.conforme === true
                    ? "bg-green-100 border-green-500"
                    : m.conforme === false
                    ? "bg-red-100 border-red-500"
                    : ""
                }`}
              />

              <p className="text-sm text-gray-500">
                Incertidumbre: ±0.05
              </p>

              <p className="text-sm text-gray-500 mb-3">
                Rango de aceptación: &lt; 15
              </p>

              {m.conforme !== null && (

                <div
                  className={`rounded-xl p-2 text-center font-bold ${
                    m.conforme
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >

                  {m.conforme
                    ? "✅ CONFORME"
                    : "❌ NO CONFORME"}

                </div>

              )}

            </div>

          ))}

          {baterias.some(
            m => m.conforme === false
          ) && (

            <textarea
              value={
                observacionesBateria
              }
              onChange={(e) =>
                setObservacionesBateria(
                  e.target.value
                )
              }
              placeholder="Observaciones"
              className="w-full border rounded-xl p-3 mb-4"
              rows={3}
            />

          )}

          <button
            onClick={
              agregarMedicionBateria
            }
            className="w-full bg-gray-500 text-white rounded-xl p-3 mb-3"
          >
            ➕ Agregar medición
          </button>

          <button
            onClick={
              completarBateria
            }
            className="w-full bg-blue-600 text-white rounded-xl p-3"
          >
            Aceptar batería →
          </button>

        </div>

      )}

      {/* ================================================= */}
      {/* ETAPA 5 - SINCRONISMO */}
      {/* ================================================= */}

      {etapa === 5 && !mostrarResumen && (

        <div className="bg-white border rounded-xl p-4">

          <h2 className="font-bold text-lg mb-2">
            5. Sincronismo
          </h2>

          <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3 mb-4">
            💡 Acá va explicación
          </p>

          <label className="font-semibold block mb-1">
            Tiempo entre onda R y descarga
          </label>

          <input
            type="number"
            step="0.01"
            value={
              sincronismo.resultado_medicion
            }
            onChange={(e) =>
              actualizarSincronismo(
                e.target.value
              )
            }
            className={`w-full border rounded-xl p-3 mb-4 ${
              sincronismo.conforme === true
                ? "bg-green-100 border-green-500"
                : sincronismo.conforme === false
                ? "bg-red-100 border-red-500"
                : ""
            }`}
          />

          <div className="bg-gray-50 rounded-xl p-3 mb-4 text-sm">

            <p>
              <b>Incertidumbre:</b> ±6.42
            </p>

            <p>
              <b>Rango de aceptación:</b> &lt; 60
            </p>

          </div>

          {sincronismo.conforme !== null && (

            <div
              className={`rounded-xl p-3 text-center font-bold mb-4 ${
                sincronismo.conforme
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >

              {sincronismo.conforme
                ? "✅ CONFORME"
                : "❌ NO CONFORME"}

            </div>

          )}

          {sincronismo.conforme === false && (

            <textarea
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
              placeholder="Observaciones"
              className="w-full border rounded-xl p-3 mb-4"
              rows={3}
            />

          )}

          <button
            onClick={
              completarSincronismo
            }
            className="w-full bg-blue-600 text-white rounded-xl p-3"
          >
            Aceptar medición →
          </button>

        </div>

      )}

      {/* ================================================= */}
      {/* ETAPA 6 - MONITORIZACIÓN */}
      {/* ================================================= */}

      {etapa === 6 && !mostrarResumen && (

        <div className="bg-white border rounded-xl p-4">

          <h2 className="font-bold text-lg mb-2">
            6. Monitorización de alarmas
          </h2>

          <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3 mb-4">
            💡 Acá va explicación
          </p>

          {monitorizacion.map(
            (m, index) => (

              <div
                key={index}
                className="border rounded-xl p-3 mb-4"
              >

                <h3 className="font-bold mb-3">
                  {m.frecuencia_nominal} BPM
                </h3>

                <label className="font-semibold block mb-1">
                  Resultado de medición
                </label>

                <input
                  type="number"
                  step="0.01"
                  value={
                    m.resultado_medicion
                  }
                  onChange={(e) =>
                    actualizarMonitorizacion(
                      index,
                      e.target.value
                    )
                  }
                  className={`w-full border rounded-xl p-3 ${
                    m.conforme === true
                      ? "bg-green-100 border-green-500"
                      : m.conforme === false
                      ? "bg-red-100 border-red-500"
                      : ""
                  }`}
                />

                <p className="text-sm text-gray-500 mt-2">
                  Rango de aceptación:{" "}
                  {m.frecuencia_nominal - 3}
                  {" - "}
                  {m.frecuencia_nominal + 3}
                  {" BPM"}
                </p>

                {m.conforme !== null && (

                  <div
                    className={`rounded-xl p-2 text-center font-bold mt-3 ${
                      m.conforme
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >

                    {m.conforme
                      ? "✅ CONFORME"
                      : "❌ NO CONFORME"}

                  </div>

                )}

              </div>

            )
          )}

          {monitorizacion.some(
            m => m.conforme === false
          ) && (

            <textarea
              value={
                observacionesMonitorizacion
              }
              onChange={(e) =>
                setObservacionesMonitorizacion(
                  e.target.value
                )
              }
              placeholder="Observaciones"
              className="w-full border rounded-xl p-3 mb-4"
              rows={3}
            />

          )}

          <button
            onClick={
              completarMonitorizacion
            }
            className="w-full bg-green-600 text-white rounded-xl p-3"
          >
            Ver resumen →
          </button>

        </div>

      )}

      {/* ================================================= */}
      {/* RESUMEN FINAL */}
      {/* ================================================= */}

      {mostrarResumen && (

        <div className="bg-white border rounded-xl p-4">

          <h2 className="font-bold text-xl mb-4 text-center">
            📊 Resumen del mantenimiento
          </h2>

          {(() => {

            const errores =
              obtenerNoConformidades();

            return (

              <>

                {errores.length === 0 ? (

                  <div className="bg-green-100 text-green-700 rounded-xl p-5 text-center font-bold mb-5">

                    <div className="text-3xl mb-2">
                      ✅
                    </div>

                    MANTENIMIENTO CONFORME

                    <p className="font-normal text-sm mt-2">
                      Todas las mediciones e inspecciones
                      cumplen con los criterios de aceptación.
                    </p>

                  </div>

                ) : (

                  <div>

                    <div className="bg-red-100 text-red-700 rounded-xl p-4 mb-4">

                      <p className="font-bold text-lg">
                        ❌ Se encontraron{" "}
                        {errores.length}{" "}
                        no conformidad(es)
                      </p>

                    </div>

                    <div className="space-y-3">

                      {errores.map(
                        (error, index) => (

                          <div
                            key={index}
                            className="border border-red-300 rounded-xl p-3 bg-red-50"
                          >

                            <p className="font-bold text-red-700">
                              {error.etapa}
                            </p>

                            <p>
                              <b>Ítem:</b>{" "}
                              {error.item}
                            </p>

                            <p>
                              <b>Resultado:</b>{" "}
                              {error.resultado}
                            </p>

                            {error.rango && (

                              <p>
                                <b>Rango aceptación:</b>{" "}
                                {error.rango}
                              </p>

                            )}

                          </div>

                        )
                      )}

                    </div>

                  </div>

                )}

                <div className="bg-gray-50 rounded-xl p-4 mt-5">

                  <h3 className="font-bold mb-2">
                    Datos del técnico
                  </h3>

                  <p>
                    <b>Técnico:</b>{" "}
                    {datos.tecnico}
                  </p>

                  <p>
                    <b>Equipo:</b>{" "}
                    {datos.descripcion}
                  </p>

                  <p>
                    <b>Serie:</b>{" "}
                    {datos.numero_serie}
                  </p>

                </div>

                <button
                  onClick={() => {
                    alert(
                      "Formulario listo para guardar. El guardado en PostgreSQL lo implementaremos en el siguiente paso."
                    );
                  }}
                  className="w-full bg-green-600 text-white rounded-xl p-3 mt-5"
                >
                  💾 Guardar preventivo
                </button>

                <button
                  onClick={() =>
                    setVista("equipos")
                  }
                  className="w-full bg-gray-500 text-white rounded-xl p-3 mt-3"
                >
                  ← Volver a equipos
                </button>

              </>

            );

          })()}

        </div>

      )}

    </div>
  );
}
