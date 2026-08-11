import { useState, useEffect } from "react";
import { API_URL } from "./config";

export default function RIC29({ setVista, personal }) {

  // =====================================================
  // ETAPAS
  // =====================================================

  const etapas = [
    "Inspecciones",
    "Entrega de energía",
    "Tiempo de carga",
    "Estado de batería",
    "Sincronismo",
    "Monitorización",
    "Resumen"
  ];

  const [etapa, setEtapa] = useState(0);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

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
    estado_cables: ""
  });

  // =====================================================
  // 2 - ENTREGA DE ENERGÍA
  // =====================================================

  const medicionesEnergiaIniciales = [
    {
      numero_medicion: 1,
      energia_nominal: 50,
      incertidumbre: 1.29,
      rango_min: 42.5,
      rango_max: 57.5,
      resultado_medicion: ""
    },
    {
      numero_medicion: 2,
      energia_nominal: 100,
      incertidumbre: 2.25,
      rango_min: 85,
      rango_max: 115,
      resultado_medicion: ""
    },
    {
      numero_medicion: 3,
      energia_nominal: 150,
      incertidumbre: 3.30,
      rango_min: 127.5,
      rango_max: 172.5,
      resultado_medicion: ""
    },
    {
      numero_medicion: 4,
      energia_nominal: 200,
      incertidumbre: 4.40,
      rango_min: 170,
      rango_max: 230,
      resultado_medicion: ""
    },
    {
      numero_medicion: 5,
      energia_nominal: 270,
      incertidumbre: 5.36,
      rango_min: 229.5,
      rango_max: 310.5,
      resultado_medicion: ""
    }
  ];

  const [medicionesEnergia, setMedicionesEnergia] = useState(
    medicionesEnergiaIniciales
  );

  const [maxEnergia, setMaxEnergia] = useState({
    valorFabricante: "",
    resultado_medicion: ""
  });

  const [energiaActual, setEnergiaActual] = useState(0);

  // =====================================================
  // 3 - TIEMPO DE CARGA
  // =====================================================

  const [carga, setCarga] = useState({
    resultado_medicion: ""
  });

  // =====================================================
  // 4 - BATERÍA
  // =====================================================

  const [medicionesBateria, setMedicionesBateria] = useState([
    {
      numero_medicion: 1,
      resultado_medicion: ""
    }
  ]);

  // =====================================================
  // 5 - SINCRONISMO
  // =====================================================

  const [sincronismo, setSincronismo] = useState({
    resultado_medicion: ""
  });

  // =====================================================
  // 6 - MONITORIZACIÓN
  // =====================================================

  const [monitorizacion, setMonitorizacion] = useState({
    resultado_60: "",
    resultado_120: ""
  });

  // =====================================================
  // OBSERVACIONES GENERALES
  // =====================================================

  const [observaciones, setObservaciones] = useState("");

  const [guardando, setGuardando] = useState(false);

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
          tarea.id ||
          "",

        equipo_id:
          equipo?.id ||
          "",

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
        "No se pudieron cargar los datos."
      );

    } finally {

      setCargando(false);

    }
  };

  // =====================================================
  // CONFORMIDAD
  // =====================================================

  const conformeDentroDeRango = (
    valor,
    minimo,
    maximo
  ) => {

    if (
      valor === "" ||
      valor === null ||
      valor === undefined
    ) {
      return null;
    }

    const numero = Number(valor);

    if (Number.isNaN(numero)) {
      return null;
    }

    return (
      numero >= minimo &&
      numero <= maximo
    );
  };

  // =====================================================
  // CONFORMIDAD MÁXIMA ENERGÍA
  // =====================================================

  const conformeMaxEnergia = () => {

    const fabricante =
      Number(maxEnergia.valorFabricante);

    const resultado =
      Number(maxEnergia.resultado_medicion);

    if (
      !maxEnergia.valorFabricante ||
      !maxEnergia.resultado_medicion
    ) {
      return null;
    }

    const minimo =
      fabricante * 0.85;

    const maximo =
      fabricante * 1.15;

    return (
      resultado >= minimo &&
      resultado <= maximo
    );
  };

  // =====================================================
  // CONFORMIDAD TIEMPO DE CARGA
  // =====================================================

  const conformeCarga = () => {

    if (carga.resultado_medicion === "") {
      return null;
    }

    return Number(
      carga.resultado_medicion
    ) < 15;
  };

  // =====================================================
  // CONFORMIDAD BATERÍA
  // =====================================================

  const conformeBateria = (valor) => {

    if (valor === "") {
      return null;
    }

    return Number(valor) < 15;
  };

  // =====================================================
  // CONFORMIDAD SINCRONISMO
  // =====================================================

  const conformeSincronismo = () => {

    if (
      sincronismo.resultado_medicion === ""
    ) {
      return null;
    }

    return Number(
      sincronismo.resultado_medicion
    ) < 60;
  };

  // =====================================================
  // CONFORMIDAD ALARMAS
  // =====================================================

  const conformeAlarma60 = () => {

    if (
      monitorizacion.resultado_60 === ""
    ) {
      return null;
    }

    return (
      Math.abs(
        Number(
          monitorizacion.resultado_60
        ) - 60
      ) <= 3
    );
  };

  const conformeAlarma120 = () => {

    if (
      monitorizacion.resultado_120 === ""
    ) {
      return null;
    }

    return (
      Math.abs(
        Number(
          monitorizacion.resultado_120
        ) - 120
      ) <= 3
    );
  };

  // =====================================================
  // COLOR SEGÚN CONFORMIDAD
  // =====================================================

  const claseResultado = (conforme) => {

    if (conforme === null) {
      return "bg-gray-100 border-gray-300";
    }

    if (conforme) {
      return "bg-green-100 border-green-500";
    }

    return "bg-red-100 border-red-500";
  };

  // =====================================================
  // RESUMEN DE NO CONFORMIDADES
  // =====================================================

  const obtenerNoConformidades = () => {

    const lista = [];

    // -----------------------------
    // INSPECCIONES
    // -----------------------------

    if (
      inspecciones.limpieza_exterior ===
      "No Conforme"
    ) {
      lista.push({
        etapa: "Inspecciones",
        medicion: "Limpieza exterior",
        resultado: "No Conforme"
      });
    }

    if (
      inspecciones.papel_registro ===
      "No Conforme"
    ) {
      lista.push({
        etapa: "Inspecciones",
        medicion: "Papel de registro",
        resultado: "No Conforme"
      });
    }

    if (
      inspecciones.estado_cables ===
      "No Conforme"
    ) {
      lista.push({
        etapa: "Inspecciones",
        medicion: "Estado de cables",
        resultado: "No Conforme"
      });
    }

    // -----------------------------
    // ENERGÍA
    // -----------------------------

    medicionesEnergia.forEach(
      (medicion) => {

        const conforme =
          conformeDentroDeRango(
            medicion.resultado_medicion,
            medicion.rango_min,
            medicion.rango_max
          );

        if (conforme === false) {

          lista.push({
            etapa:
              "Entrega de energía",

            medicion:
              `${medicion.energia_nominal} J`,

            resultado:
              `${medicion.resultado_medicion} J`,

            rango:
              `${medicion.rango_min} - ${medicion.rango_max} J`
          });

        }

      }
    );

    const conformeMax =
      conformeMaxEnergia();

    if (conformeMax === false) {

      const fabricante =
        Number(
          maxEnergia.valorFabricante
        );

      lista.push({

        etapa:
          "Entrega de energía",

        medicion:
          "Máx. energía",

        resultado:
          `${maxEnergia.resultado_medicion} J`,

        rango:
          `${(
            fabricante * 0.85
          ).toFixed(2)} - ${(
            fabricante * 1.15
          ).toFixed(2)} J`

      });
    }

    // -----------------------------
    // CARGA
    // -----------------------------

    if (conformeCarga() === false) {

      lista.push({

        etapa:
          "Tiempo de carga",

        medicion:
          "Carga a máxima energía",

        resultado:
          `${carga.resultado_medicion}`,

        rango:
          "< 15"

      });
    }

    // -----------------------------
    // BATERÍA
    // -----------------------------

    medicionesBateria.forEach(
      (medicion) => {

        if (
          conformeBateria(
            medicion.resultado_medicion
          ) === false
        ) {

          lista.push({

            etapa:
              "Estado de batería",

            medicion:
              `Medición ${medicion.numero_medicion}`,

            resultado:
              `${medicion.resultado_medicion}`,

            rango:
              "< 15"

          });
        }

      }
    );

    // -----------------------------
    // SINCRONISMO
    // -----------------------------

    if (
      conformeSincronismo() === false
    ) {

      lista.push({

        etapa:
          "Sincronismo",

        medicion:
          "Tiempo entre onda R y descarga",

        resultado:
          `${sincronismo.resultado_medicion}`,

        rango:
          "< 60"

      });
    }

    // -----------------------------
    // ALARMAS
    // -----------------------------

    if (
      conformeAlarma60() === false
    ) {

      lista.push({

        etapa:
          "Monitorización de alarmas",

        medicion:
          "60 BPM",

        resultado:
          `${monitorizacion.resultado_60} BPM`,

        rango:
          "57 - 63 BPM"

      });
    }

    if (
      conformeAlarma120() === false
    ) {

      lista.push({

        etapa:
          "Monitorización de alarmas",

        medicion:
          "120 BPM",

        resultado:
          `${monitorizacion.resultado_120} BPM`,

        rango:
          "117 - 123 BPM"

      });
    }

    return lista;
  };

  // =====================================================
  // RESULTADO GENERAL
  // =====================================================

  const noConformidades =
    obtenerNoConformidades();

  const resultadoGeneral =
    noConformidades.length === 0
      ? "Conforme"
      : "No Conforme";

  // =====================================================
  // VALIDAR ETAPA ACTUAL
  // =====================================================

  const validarEtapa = () => {

    // INSPECCIONES
    if (etapa === 0) {

      return (
        inspecciones.limpieza_exterior !== "" &&
        inspecciones.papel_registro !== "" &&
        inspecciones.estado_cables !== ""
      );
    }

    // ENERGÍA
    if (etapa === 1) {

      const medicionesCompletas =
        medicionesEnergia.every(
          (m) =>
            m.resultado_medicion !== ""
        );

      const maxCompleto =
        maxEnergia.valorFabricante !== "" &&
        maxEnergia.resultado_medicion !== "";

      return (
        medicionesCompletas &&
        maxCompleto
      );
    }

    // CARGA
    if (etapa === 2) {

      return (
        carga.resultado_medicion !== ""
      );
    }

    // BATERÍA
    if (etapa === 3) {

      return medicionesBateria.every(
        (m) =>
          m.resultado_medicion !== ""
      );
    }

    // SINCRONISMO
    if (etapa === 4) {

      return (
        sincronismo.resultado_medicion !== ""
      );
    }

    // MONITORIZACIÓN
    if (etapa === 5) {

      return (
        monitorizacion.resultado_60 !== "" &&
        monitorizacion.resultado_120 !== ""
      );
    }

    return true;
  };

  // =====================================================
  // SIGUIENTE ETAPA
  // =====================================================

  const siguienteEtapa = () => {

    if (!validarEtapa()) {

      alert(
        "Complete todos los campos de esta etapa antes de continuar."
      );

      return;
    }

    setEtapa(
      (actual) =>
        Math.min(
          actual + 1,
          etapas.length - 1
        )
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  // =====================================================
  // VOLVER
  // =====================================================

  const volverEtapa = () => {

    if (etapa === 0) {

      return;
    }

    setEtapa(
      (actual) =>
        Math.max(actual - 1, 0)
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  // =====================================================
  // CANCELAR
  // =====================================================

  const cancelar = () => {

    const confirmar =
      window.confirm(
        "¿Está seguro de cancelar el mantenimiento preventivo?\n\nSe perderán los datos cargados en este formulario."
      );

    if (!confirmar) {
      return;
    }

    setVista("equipos");
  };

  // =====================================================
  // AGREGAR MEDICIÓN DE BATERÍA
  // =====================================================

  const agregarMedicionBateria = () => {

    setMedicionesBateria(
      (actuales) => [

        ...actuales,

        {
          numero_medicion:
            actuales.length + 1,

          resultado_medicion:
            ""
        }

      ]
    );
  };

  // =====================================================
  // MODIFICAR MEDICIÓN DE ENERGÍA
  // =====================================================

  const actualizarEnergia = (
    indice,
    valor
  ) => {

    setMedicionesEnergia(
      (actuales) =>
        actuales.map(
          (medicion, i) =>

            i === indice
              ? {
                  ...medicion,
                  resultado_medicion:
                    valor
                }
              : medicion
        )
    );
  };

  // =====================================================
  // GUARDAR RIC29
  // =====================================================

  const guardarPreventivo = async () => {

    if (!validarEtapa()) {

      alert(
        "Complete todos los campos antes de guardar."
      );

      return;
    }

    setGuardando(true);

    try {

      const body = {

        // -------------------------
        // CABECERA
        // -------------------------

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

        resultado_general:
          resultadoGeneral,

        observaciones:
          observaciones,

        // -------------------------
        // INSPECCIONES
        // -------------------------

        inspecciones,

        // -------------------------
        // ENERGÍA
        // -------------------------

        energia: {

          mediciones:
            medicionesEnergia,

          max_energia:
            maxEnergia

        },

        // -------------------------
        // CARGA
        // -------------------------

        carga,

        // -------------------------
        // BATERÍA
        // -------------------------

        bateria:
          medicionesBateria,

        // -------------------------
        // SINCRONISMO
        // -------------------------

        sincronismo,

        // -------------------------
        // MONITORIZACIÓN
        // -------------------------

        monitorizacion

      };

      console.log(
        "DATOS RIC29 A GUARDAR:",
        body
      );

      const res = await fetch(
        `${API_URL.Base}/ric29`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify(body)
        }
      );

      const data =
        await res.json();

      if (!res.ok) {

        throw new Error(
          data.error ||
          "No se pudo guardar el RIC29."
        );
      }

      alert(
        resultadoGeneral === "Conforme"
          ? "Mantenimiento preventivo guardado correctamente ✅"
          : "Mantenimiento guardado como NO CONFORME ⚠️"
      );

      localStorage.removeItem(
        "tareaActiva"
      );

      setVista("equipos");

    } catch (err) {

      console.error(
        "ERROR GUARDANDO RIC29:",
        err
      );

      alert(
        err.message ||
        "Error al guardar el mantenimiento."
      );

    } finally {

      setGuardando(false);

    }
  };

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
  // RENDER
  // =====================================================

  return (

    <div className="min-h-screen bg-gray-50">

      {/* ================================================= */}
      {/* BARRA DE PROGRESO STICKY */}
      {/* ================================================= */}

      <div className="sticky top-0 z-50 bg-white border-b shadow-sm">

        <div className="max-w-xl mx-auto px-3 py-2">

          <div className="flex justify-between text-xs text-gray-500 mb-1">

            <span>
              Paso {etapa + 1} de {etapas.length}
            </span>

            <span className="font-semibold">
              {etapas[etapa]}
            </span>

          </div>

          <div className="w-full bg-gray-200 rounded-full h-2">

            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width:
                  `${(
                    (etapa + 1) /
                    etapas.length
                  ) * 100}%`
              }}
            />

          </div>

        </div>

      </div>

      <div className="p-3 max-w-xl mx-auto">

        {/* ================================================= */}
        {/* DATOS DEL EQUIPO COMPACTOS */}
        {/* ================================================= */}

        <div className="bg-white border rounded-xl shadow-sm p-3 mb-3">

          <div className="font-bold text-sm">

            {datos.descripcion || "-"}
            {" "}
            <span className="font-normal text-gray-600">
              {datos.marca_modelo || ""}
            </span>

          </div>

          <div className="text-xs text-gray-600 mt-1">

            <b>Serie:</b>{" "}
            {datos.numero_serie || "-"}

            {" · "}

            <b>Área:</b>{" "}
            {datos.area || "-"}

          </div>

          <div className="text-xs text-gray-600">

            <b>Servicio:</b>{" "}
            {datos.servicio || "-"}

            {" · "}

            <b>Sub:</b>{" "}
            {datos.sub_servicio || "-"}

          </div>

          <div className="text-xs text-gray-600">

            <b>Encargado:</b>{" "}
            {datos.encargado || "-"}

            {" · "}

            <b>Técnico:</b>{" "}
            {datos.tecnico || "-"}

          </div>

        </div>

        {/* ================================================= */}
        {/* ETAPA 1 - INSPECCIONES */}
        {/* ================================================= */}

        {etapa === 0 && (

          <div className="bg-white border rounded-xl p-4">

            <h2 className="text-xl font-bold mb-2">
              1. Inspecciones
            </h2>

            <p className="text-sm text-gray-500 mb-4">
              Acá va explicación.
            </p>

            <div className="space-y-4">

              <div>

                <label className="font-semibold block mb-1">
                  Limpieza exterior
                </label>

                <select
                  value={
                    inspecciones.limpieza_exterior
                  }
                  onChange={(e) =>
                    setInspecciones({
                      ...inspecciones,
                      limpieza_exterior:
                        e.target.value
                    })
                  }
                  className="w-full border rounded-xl p-3"
                >

                  <option value="">
                    Seleccionar
                  </option>

                  <option>
                    Conforme
                  </option>

                  <option>
                    No Conforme
                  </option>

                </select>

              </div>

              <div>

                <label className="font-semibold block mb-1">
                  Papel de registro
                </label>

                <select
                  value={
                    inspecciones.papel_registro
                  }
                  onChange={(e) =>
                    setInspecciones({
                      ...inspecciones,
                      papel_registro:
                        e.target.value
                    })
                  }
                  className="w-full border rounded-xl p-3"
                >

                  <option value="">
                    Seleccionar
                  </option>

                  <option>
                    Conforme
                  </option>

                  <option>
                    No Conforme
                  </option>

                </select>

              </div>

              <div>

                <label className="font-semibold block mb-1">
                  Estado de cables
                </label>

                <select
                  value={
                    inspecciones.estado_cables
                  }
                  onChange={(e) =>
                    setInspecciones({
                      ...inspecciones,
                      estado_cables:
                        e.target.value
                    })
                  }
                  className="w-full border rounded-xl p-3"
                >

                  <option value="">
                    Seleccionar
                  </option>

                  <option>
                    Conforme
                  </option>

                  <option>
                    No Conforme
                  </option>

                </select>

              </div>

            </div>

            <div className="flex gap-2 mt-6">

              <button
                onClick={cancelar}
                className="flex-1 bg-gray-500 text-white p-3 rounded-xl"
              >
                Cancelar
              </button>

              <button
                onClick={siguienteEtapa}
                className="flex-1 bg-blue-600 text-white p-3 rounded-xl"
              >
                Continuar →
              </button>

            </div>

          </div>

        )}

        {/* ================================================= */}
        {/* ETAPA 2 - ENERGÍA */}
        {/* ================================================= */}

        {etapa === 1 && (

          <div className="bg-white border rounded-xl p-4">

            <h2 className="text-xl font-bold mb-2">
              2. Entrega de energía
            </h2>

            <p className="text-sm text-gray-500 mb-4">
              Acá va explicación.
            </p>

            {/* ----------------------------- */}
            {/* MEDICIONES 50 - 270 */}
            {/* ----------------------------- */}

            {medicionesEnergia.map(
              (medicion, indice) => {

                if (
                  indice >
                  energiaActual
                ) {
                  return null;
                }

                const conforme =
                  conformeDentroDeRango(
                    medicion.resultado_medicion,
                    medicion.rango_min,
                    medicion.rango_max
                  );

                return (

                  <div
                    key={
                      medicion.numero_medicion
                    }
                    className={`border-2 rounded-xl p-4 mb-4 ${claseResultado(conforme)}`}
                  >

                    <h3 className="font-bold text-lg mb-3">

                      Medición{" "}
                      {medicion.numero_medicion}
                      {" - "}
                      {medicion.energia_nominal} J

                    </h3>

                    <p className="text-sm mb-2">

                      Rango:
                      {" "}
                      {medicion.rango_min}
                      {" - "}
                      {medicion.rango_max}
                      {" J"}

                      {" | "}

                      Incertidumbre:
                      {" ±"}
                      {medicion.incertidumbre}

                    </p>

                    <input
                      type="number"
                      step="0.01"
                      placeholder="Resultado de medición"
                      value={
                        medicion.resultado_medicion
                      }
                      onChange={(e) =>
                        actualizarEnergia(
                          indice,
                          e.target.value
                        )
                      }
                      className="w-full border rounded-xl p-3"
                    />

                    {conforme !== null && (

                      <div className="font-bold mt-3">

                        {conforme
                          ? "✅ CONFORME"
                          : "❌ NO CONFORME"}

                      </div>

                    )}

                    {indice ===
                      energiaActual && (

                      <button
                        disabled={
                          medicion.resultado_medicion === ""
                        }
                        onClick={() => {

                          if (
                            energiaActual <
                            medicionesEnergia.length - 1
                          ) {

                            setEnergiaActual(
                              energiaActual + 1
                            );

                          }

                        }}
                        className="w-full bg-blue-600 disabled:bg-gray-300 text-white p-3 rounded-xl mt-3"
                      >
                        Aceptar medición
                      </button>

                    )}

                  </div>

                );

              }
            )}

            {/* ----------------------------- */}
            {/* MÁXIMA ENERGÍA */}
            {/* ----------------------------- */}

            {energiaActual ===
              medicionesEnergia.length - 1 && (

              <div
                className={`border-2 rounded-xl p-4 mb-4 ${claseResultado(
                  conformeMaxEnergia()
                )}`}
              >

                <h3 className="font-bold text-lg mb-3">
                  Medición 6 - Máx. energía
                </h3>

                <label className="text-sm font-semibold">
                  Valor indicado por el fabricante
                </label>

                <input
                  type="number"
                  step="0.01"
                  placeholder="Ej: 360"
                  value={
                    maxEnergia.valorFabricante
                  }
                  onChange={(e) =>
                    setMaxEnergia({
                      ...maxEnergia,
                      valorFabricante:
                        e.target.value
                    })
                  }
                  className="w-full border rounded-xl p-3 mt-1 mb-3"
                />

                {maxEnergia.valorFabricante && (

                  <p className="text-sm mb-3">

                    Rango de aceptación:
                    {" "}
                    {(
                      Number(
                        maxEnergia.valorFabricante
                      ) * 0.85
                    ).toFixed(2)}

                    {" - "}

                    {(
                      Number(
                        maxEnergia.valorFabricante
                      ) * 1.15
                    ).toFixed(2)}
                    {" J"}

                    {" (±15%)"}

                  </p>

                )}

                <label className="text-sm font-semibold">
                  Resultado de medición
                </label>

                <input
                  type="number"
                  step="0.01"
                  placeholder="Resultado de medición"
                  value={
                    maxEnergia.resultado_medicion
                  }
                  onChange={(e) =>
                    setMaxEnergia({
                      ...maxEnergia,
                      resultado_medicion:
                        e.target.value
                    })
                  }
                  className="w-full border rounded-xl p-3 mt-1"
                />

                {conformeMaxEnergia() !== null && (

                  <div className="font-bold mt-3">

                    {conformeMaxEnergia()
                      ? "✅ CONFORME"
                      : "❌ NO CONFORME"}

                  </div>

                )}

              </div>

            )}

            <div className="flex gap-2 mt-6">

              <button
                onClick={volverEtapa}
                className="flex-1 bg-gray-500 text-white p-3 rounded-xl"
              >
                ← Volver
              </button>

              <button
                onClick={cancelar}
                className="flex-1 bg-gray-400 text-white p-3 rounded-xl"
              >
                Cancelar
              </button>

              <button
                onClick={siguienteEtapa}
                className="flex-1 bg-blue-600 text-white p-3 rounded-xl"
              >
                Continuar →
              </button>

            </div>

          </div>

        )}

        {/* ================================================= */}
        {/* ETAPA 3 - TIEMPO DE CARGA */}
        {/* ================================================= */}

        {etapa === 2 && (

          <div className="bg-white border rounded-xl p-4">

            <h2 className="text-xl font-bold mb-2">
              3. Tiempo de carga
            </h2>

            <p className="text-sm text-gray-500 mb-4">
              Acá va explicación.
            </p>

            <div
              className={`border-2 rounded-xl p-4 ${claseResultado(
                conformeCarga()
              )}`}
            >

              <h3 className="font-bold mb-2">
                Carga a máxima energía
              </h3>

              <p className="text-sm mb-3">
                Rango de aceptación:{" "}
                <b>&lt; 15</b>
              </p>

              <input
                type="number"
                step="0.01"
                placeholder="Resultado de medición"
                value={
                  carga.resultado_medicion
                }
                onChange={(e) =>
                  setCarga({
                    resultado_medicion:
                      e.target.value
                  })
                }
                className="w-full border rounded-xl p-3"
              />

              {conformeCarga() !== null && (

                <div className="font-bold mt-3">

                  {conformeCarga()
                    ? "✅ CONFORME"
                    : "❌ NO CONFORME"}

                </div>

              )}

            </div>

            <div className="flex gap-2 mt-6">

              <button
                onClick={volverEtapa}
                className="flex-1 bg-gray-500 text-white p-3 rounded-xl"
              >
                ← Volver
              </button>

              <button
                onClick={cancelar}
                className="flex-1 bg-gray-400 text-white p-3 rounded-xl"
              >
                Cancelar
              </button>

              <button
                onClick={siguienteEtapa}
                className="flex-1 bg-blue-600 text-white p-3 rounded-xl"
              >
                Continuar →
              </button>

            </div>

          </div>

        )}

        {/* ================================================= */}
        {/* ETAPA 4 - BATERÍA */}
        {/* ================================================= */}

        {etapa === 3 && (

          <div className="bg-white border rounded-xl p-4">

            <h2 className="text-xl font-bold mb-2">
              4. Estado de batería
            </h2>

            <p className="text-sm text-gray-500 mb-4">
              Acá va explicación.
            </p>

            {medicionesBateria.map(
              (medicion, indice) => {

                const conforme =
                  conformeBateria(
                    medicion.resultado_medicion
                  );

                return (

                  <div
                    key={indice}
                    className={`border-2 rounded-xl p-4 mb-3 ${claseResultado(conforme)}`}
                  >

                    <h3 className="font-bold mb-2">

                      Medición{" "}
                      {medicion.numero_medicion}

                    </h3>

                    <p className="text-sm mb-3">
                      Rango de aceptación:{" "}
                      <b>&lt; 15</b>
                    </p>

                    <input
                      type="number"
                      step="0.01"
                      placeholder="Resultado de medición"
                      value={
                        medicion.resultado_medicion
                      }
                      onChange={(e) => {

                        const nuevas =
                          [
                            ...medicionesBateria
                          ];

                        nuevas[indice] = {

                          ...nuevas[indice],

                          resultado_medicion:
                            e.target.value

                        };

                        setMedicionesBateria(
                          nuevas
                        );

                      }}
                      className="w-full border rounded-xl p-3"
                    />

                    {conforme !== null && (

                      <div className="font-bold mt-3">

                        {conforme
                          ? "✅ CONFORME"
                          : "❌ NO CONFORME"}

                      </div>

                    )}

                  </div>

                );

              }
            )}

            <button
              onClick={agregarMedicionBateria}
              className="w-full bg-green-600 text-white p-3 rounded-xl"
            >
              + Agregar medición
            </button>

            <div className="flex gap-2 mt-6">

              <button
                onClick={volverEtapa}
                className="flex-1 bg-gray-500 text-white p-3 rounded-xl"
              >
                ← Volver
              </button>

              <button
                onClick={cancelar}
                className="flex-1 bg-gray-400 text-white p-3 rounded-xl"
              >
                Cancelar
              </button>

              <button
                onClick={siguienteEtapa}
                className="flex-1 bg-blue-600 text-white p-3 rounded-xl"
              >
                Continuar →
              </button>

            </div>

          </div>

        )}

        {/* ================================================= */}
        {/* ETAPA 5 - SINCRONISMO */}
        {/* ================================================= */}

        {etapa === 4 && (

          <div className="bg-white border rounded-xl p-4">

            <h2 className="text-xl font-bold mb-2">
              5. Sincronismo
            </h2>

            <p className="text-sm text-gray-500 mb-4">
              Acá va explicación.
            </p>

            <div
              className={`border-2 rounded-xl p-4 ${claseResultado(
                conformeSincronismo()
              )}`}
            >

              <h3 className="font-bold mb-2">
                Tiempo entre onda R y descarga
              </h3>

              <p className="text-sm mb-3">
                Rango de aceptación:{" "}
                <b>&lt; 60</b>
              </p>

              <input
                type="number"
                step="0.01"
                placeholder="Resultado de medición"
                value={
                  sincronismo.resultado_medicion
                }
                onChange={(e) =>
                  setSincronismo({
                    resultado_medicion:
                      e.target.value
                  })
                }
                className="w-full border rounded-xl p-3"
              />

              {conformeSincronismo() !== null && (

                <div className="font-bold mt-3">

                  {conformeSincronismo()
                    ? "✅ CONFORME"
                    : "❌ NO CONFORME"}

                </div>

              )}

            </div>

            <div className="flex gap-2 mt-6">

              <button
                onClick={volverEtapa}
                className="flex-1 bg-gray-500 text-white p-3 rounded-xl"
              >
                ← Volver
              </button>

              <button
                onClick={cancelar}
                className="flex-1 bg-gray-400 text-white p-3 rounded-xl"
              >
                Cancelar
              </button>

              <button
                onClick={siguienteEtapa}
                className="flex-1 bg-blue-600 text-white p-3 rounded-xl"
              >
                Continuar →
              </button>

            </div>

          </div>

        )}

        {/* ================================================= */}
        {/* ETAPA 6 - MONITORIZACIÓN */}
        {/* ================================================= */}

        {etapa === 5 && (

          <div className="bg-white border rounded-xl p-4">

            <h2 className="text-xl font-bold mb-2">
              6. Monitorización de alarmas
            </h2>

            <p className="text-sm text-gray-500 mb-4">
              Acá va explicación.
            </p>

            {/* 60 BPM */}

            <div
              className={`border-2 rounded-xl p-4 mb-4 ${claseResultado(
                conformeAlarma60()
              )}`}
            >

              <h3 className="font-bold">
                60 BPM
              </h3>

              <p className="text-sm mb-3">
                Rango de aceptación:
                {" "}
                <b>57 - 63 BPM</b>
              </p>

              <input
                type="number"
                step="0.01"
                placeholder="Resultado de medición"
                value={
                  monitorizacion.resultado_60
                }
                onChange={(e) =>
                  setMonitorizacion({
                    ...monitorizacion,
                    resultado_60:
                      e.target.value
                  })
                }
                className="w-full border rounded-xl p-3"
              />

              {conformeAlarma60() !== null && (

                <div className="font-bold mt-3">

                  {conformeAlarma60()
                    ? "✅ CONFORME"
                    : "❌ NO CONFORME"}

                </div>

              )}

            </div>

            {/* 120 BPM */}

            <div
              className={`border-2 rounded-xl p-4 ${claseResultado(
                conformeAlarma120()
              )}`}
            >

              <h3 className="font-bold">
                120 BPM
              </h3>

              <p className="text-sm mb-3">
                Rango de aceptación:
                {" "}
                <b>117 - 123 BPM</b>
              </p>

              <input
                type="number"
                step="0.01"
                placeholder="Resultado de medición"
                value={
                  monitorizacion.resultado_120
                }
                onChange={(e) =>
                  setMonitorizacion({
                    ...monitorizacion,
                    resultado_120:
                      e.target.value
                  })
                }
                className="w-full border rounded-xl p-3"
              />

              {conformeAlarma120() !== null && (

                <div className="font-bold mt-3">

                  {conformeAlarma120()
                    ? "✅ CONFORME"
                    : "❌ NO CONFORME"}

                </div>

              )}

            </div>

            <div className="flex gap-2 mt-6">

              <button
                onClick={volverEtapa}
                className="flex-1 bg-gray-500 text-white p-3 rounded-xl"
              >
                ← Volver
              </button>

              <button
                onClick={cancelar}
                className="flex-1 bg-gray-400 text-white p-3 rounded-xl"
              >
                Cancelar
              </button>

              <button
                onClick={siguienteEtapa}
                className="flex-1 bg-blue-600 text-white p-3 rounded-xl"
              >
                Ver resumen →
              </button>

            </div>

          </div>

        )}

        {/* ================================================= */}
        {/* ETAPA 7 - RESUMEN */}
        {/* ================================================= */}

        {etapa === 6 && (

          <div className="bg-white border rounded-xl p-4">

            <h2 className="text-xl font-bold mb-2">
              7. Resumen del mantenimiento
            </h2>

            <div
              className={`rounded-xl p-4 mb-4 text-center ${
                resultadoGeneral ===
                "Conforme"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >

              <div className="text-2xl font-bold">

                {resultadoGeneral ===
                "Conforme"
                  ? "✅ CONFORME"
                  : "❌ NO CONFORME"}

              </div>

            </div>

            {/* -------------------------------- */}
            {/* NO CONFORMIDADES */}
            {/* -------------------------------- */}

            {noConformidades.length >
              0 && (

              <div className="border border-red-300 bg-red-50 rounded-xl p-4 mb-4">

                <h3 className="font-bold text-red-700 mb-3">

                  ⚠️ Mediciones no conformes

                </h3>

                <div className="space-y-3">

                  {noConformidades.map(
                    (item, index) => (

                      <div
                        key={index}
                        className="bg-white rounded-lg p-3 border"
                      >

                        <p className="font-bold">
                          {item.etapa}
                        </p>

                        <p>
                          <b>Medición:</b>{" "}
                          {item.medicion}
                        </p>

                        <p>
                          <b>Resultado:</b>{" "}
                          {item.resultado}
                        </p>

                        {item.rango && (

                          <p className="text-sm text-gray-600">

                            <b>Rango:</b>{" "}
                            {item.rango}

                          </p>

                        )}

                      </div>

                    )
                  )}

                </div>

              </div>

            )}

            {noConformidades.length ===
              0 && (

              <div className="bg-green-50 border border-green-300 rounded-xl p-4 mb-4">

                <p className="text-green-700 font-semibold text-center">

                  Todas las mediciones se encuentran
                  dentro de los rangos de aceptación.

                </p>

              </div>

            )}

            {/* -------------------------------- */}
            {/* OBSERVACIONES GENERALES */}
            {/* -------------------------------- */}

            <div className="mb-4">

              <label className="font-bold block mb-2">

                Observaciones generales

              </label>

              <textarea
                value={observaciones}
                onChange={(e) =>
                  setObservaciones(
                    e.target.value
                  )
                }
                rows={5}
                placeholder="Ingrese aquí las observaciones generales del mantenimiento..."
                className="w-full border rounded-xl p-3"
              />

            </div>

            {/* -------------------------------- */}
            {/* BOTONES */}
            {/* -------------------------------- */}

            <div className="flex gap-2">

              <button
                onClick={volverEtapa}
                disabled={guardando}
                className="flex-1 bg-gray-500 text-white p-3 rounded-xl disabled:opacity-50"
              >
                ← Volver
              </button>

              <button
                onClick={cancelar}
                disabled={guardando}
                className="flex-1 bg-gray-400 text-white p-3 rounded-xl disabled:opacity-50"
              >
                Cancelar
              </button>

            </div>

            <button
              onClick={guardarPreventivo}
              disabled={guardando}
              className="w-full bg-green-600 hover:bg-green-700 text-white p-3 rounded-xl mt-3 disabled:bg-gray-400"
            >

              {guardando
                ? "⏳ Guardando..."
                : "💾 Guardar preventivo"}

            </button>

          </div>

        )}

      </div>

    </div>
  );
}
