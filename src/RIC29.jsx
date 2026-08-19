import { useState, useEffect } from "react";
import { API_URL } from "./config";

// =====================================================
// INDICADOR DE CONEXIÓN ELÉCTRICA
// =====================================================

const IndicadorRed = ({ conectado }) => {

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl mb-4 ${
        conectado
          ? "bg-green-50 border border-green-300"
          : "bg-red-50 border border-red-300"
      }`}
    >

      <img
        src={
          conectado
            ? "/imagenes/conectado.png"
            : "/imagenes/desconectado.png"
        }
        alt={
          conectado
            ? "Equipo conectado a la red eléctrica"
            : "Equipo desconectado de la red eléctrica"
        }
        className="w-12 h-12 object-contain"
      />

      <div>

        <p
          className={`font-bold ${
            conectado
              ? "text-green-700"
              : "text-red-700"
          }`}
        >
          {conectado
            ? "Equipo conectado a la red eléctrica"
            : "Equipo desconectado de la red eléctrica"}
        </p>

        <p className="text-sm text-gray-600">
          {conectado
            ? "Mantener conectado durante esta etapa."
            : "Desconectar de la red eléctrica durante esta etapa."}
        </p>

      </div>

    </div>
  );
};

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
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [ric29Id, setRic29Id] = useState(null);

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
  // OBSERVACIONES GENERALES
  // =====================================================

  const [observaciones, setObservaciones] = useState("");

  // =====================================================
  // 1 - INSPECCIONES
  // =====================================================

  const [inspecciones, setInspecciones] = useState({
    limpieza_exterior: "",
    papel_registro: "",
    estado_cables: ""
  });

  const [observacionesInspecciones, setObservacionesInspecciones] =
  useState("");

  // =====================================================
  // 2 - ENTREGA DE ENERGÍA
  // =====================================================

  const medicionesEnergia = [
    {
      numero: 1,
      nombre: "50 J",
      nominal: 50,
      incertidumbre: 1.29,
      min: 42.5,
      max: 57.5
    },
    {
      numero: 2,
      nombre: "100 J",
      nominal: 100,
      incertidumbre: 2.25,
      min: 85,
      max: 115
    },
    {
      numero: 3,
      nombre: "150 J",
      nominal: 150,
      incertidumbre: 3.30,
      min: 127.5,
      max: 172.5
    },
    {
      numero: 4,
      nombre: "200 J",
      nominal: 200,
      incertidumbre: 4.40,
      min: 170,
      max: 230
    },
    {
      numero: 5,
      nombre: "270 J",
      nominal: 270,
      incertidumbre: 5.36,
      min: 229.5,
      max: 310.5
    },
    {
      numero: 6,
      nombre: "Máx. energía",
      nominal: null,
      incertidumbre: null,
      min: null,
      max: null
    }
  ];

  const [energiaActual, setEnergiaActual] = useState(0);

  const [energia, setEnergia] = useState(
    medicionesEnergia.map((m) => ({
      ...m,
      resultado: "",
      conforme: null,
      noAplica: false
    }))
  );

  // =====================================================
  // 3 - TIEMPO DE CARGA
  // =====================================================

  const [carga, setCarga] = useState({
    resultado: "",
    conforme: null,
    noAplica: false
  });

  // =====================================================
  // 4 - BATERÍA
  // =====================================================

  const [bateriaActual, setBateriaActual] = useState(0);

  const [bateria, setBateria] = useState(
    [1, 2, 3, 4].map((numero) => ({
      numero_medicion: numero,
      resultado: "",
      conforme: null,
      noAplica: false
    }))
  );

  // =====================================================
  // 5 - SINCRONISMO
  // =====================================================

  const [sincronismo, setSincronismo] = useState({
    resultado: "",
    conforme: null,
    noAplica: false
  });

  // =====================================================
  // 6 - MONITORIZACIÓN
  // =====================================================

  const [monitorizacion, setMonitorizacion] = useState({
    "60": {
      resultado: "",
      conforme: null,
      noAplica: false
    },
    "120": {
      resultado: "",
      conforme: null,
      noAplica: false
    }
  });

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
          tarea.ric01_id ||
          tarea.id ||
          "",

        equipo_id:
          equipo?.id ||
          tarea.equipo_id ||
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
          tarea.encargado ||
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
  // CALCULAR CONFORMIDAD
  // =====================================================

  const calcularEnergia = (
    indice,
    valor
  ) => {

    const copia = [...energia];

    if (valor === "") {

      copia[indice].resultado = "";
      copia[indice].conforme = null;

      setEnergia(copia);

      return;
    }

    const numero =
      Number(valor);

    // -----------------------------------------------
    // MÁXIMA ENERGÍA
    // -----------------------------------------------

    if (indice === 5) {

      const fabricante =
        Number(valor);

      // Para la máxima energía todavía no
      // tenemos resultado medido.
      //
      // El valor ingresado por el técnico
      // representa el valor indicado por fabricante.

      copia[indice].resultado = fabricante;
      copia[indice].conforme = null;

      setEnergia(copia);

      return;
    }

    // -----------------------------------------------
    // MEDICIONES 50 / 100 / 150 / 200 / 270
    // -----------------------------------------------

    const conforme =
      numero >= copia[indice].min &&
      numero <= copia[indice].max;

    copia[indice].resultado = numero;
    copia[indice].conforme = conforme;

    setEnergia(copia);
  };

  // =====================================================
  // MÁXIMA ENERGÍA
  // =====================================================

 const calcularMaxEnergia = (
  valorFabricante,
  resultadoMedicion
) => {

  const copia = [...energia];

  const fabricante =
    Number(valorFabricante);

  const resultado =
    Number(resultadoMedicion);

  // -----------------------------------------------
  // VALORES INCOMPLETOS
  // -----------------------------------------------

  if (
    !fabricante ||
    !resultadoMedicion
  ) {

    copia[5] = {
      ...copia[5],

      // Guardamos también el valor del fabricante
      nominal:
        valorFabricante || "",

      fabricante:
        valorFabricante || "",

      resultado:
        resultadoMedicion || "",

      incertidumbre:
        null,

      min:
        null,

      max:
        null,

      conforme:
        null
    };

    setEnergia(copia);

    return;
  }

  // -----------------------------------------------
  // RANGO DE ACEPTACIÓN ±15 %
  // -----------------------------------------------

  const min =
    fabricante * 0.85;

  const max =
    fabricante * 1.15;

  const incertidumbre =
    fabricante * 0.15;

  // -----------------------------------------------
  // GUARDAR MEDICIÓN
  // -----------------------------------------------

  copia[5] = {
    ...copia[5],

    // IMPORTANTE:
    // Este es el valor que irá a
    // ric29_energia.energia_nominal
    nominal:
      fabricante,

    // Lo conservamos también como fabricante
    fabricante,

    // Resultado medido por el técnico
    resultado,

    // Incertidumbre = 15 %
    incertidumbre,

    // Rango de aceptación
    min,
    max,

    // Resultado de la comparación
    conforme:
      resultado >= min &&
      resultado <= max
  };

  setEnergia(copia);
};

  const abrirPDF = () => {

  if (!ric29Id) {
    alert("Primero debe guardar el mantenimiento.");
    return;
  }

  window.open(
    `${API_URL.Ric29}/${ric29Id}/pdf`,
    "_blank"
  );
};

  // =====================================================
  // CAMBIAR INSPECCIÓN
  // =====================================================

  const cambiarInspeccion = (
    campo,
    valor
  ) => {

    setInspecciones({
      ...inspecciones,
      [campo]: valor
    });
  };

  // =====================================================
  // CONFORMIDAD CARGA
  // =====================================================

  const calcularCarga = (
    valor
  ) => {

    if (valor === "") {

      setCarga({
        ...carga,
        resultado: "",
        conforme: null
      });

      return;
    }

    const numero =
      Number(valor);

    setCarga({

      ...carga,

      resultado: numero,

      conforme:
        numero < 15

    });
  };

  // =====================================================
  // BATERÍA
  // =====================================================

  const calcularBateria = (
    valor
  ) => {

    const copia = [...bateria];

    const indice =
      bateriaActual;

    if (valor === "") {

      copia[indice].resultado = "";
      copia[indice].conforme = null;

    } else {

      const numero =
        Number(valor);

      copia[indice].resultado =
        numero;

      copia[indice].conforme =
        numero < 15;
    }

    setBateria(copia);
  };

  // =====================================================
  // SINCRONISMO
  // =====================================================

  const calcularSincronismo = (
    valor
  ) => {

    if (valor === "") {

      setSincronismo({
        ...sincronismo,
        resultado: "",
        conforme: null
      });

      return;
    }

    const numero =
      Number(valor);

    setSincronismo({

      ...sincronismo,

      resultado: numero,

      conforme:
        numero < 60

    });
  };

  // =====================================================
  // MONITORIZACIÓN
  // =====================================================

  const calcularMonitorizacion = (
    frecuencia,
    valor
  ) => {

    if (valor === "") {

      setMonitorizacion({

        ...monitorizacion,

        [frecuencia]: {

          ...monitorizacion[frecuencia],

          resultado: "",
          conforme: null

        }

      });

      return;
    }

    const numero =
      Number(valor);

    const esperado =
      Number(frecuencia);

    const conforme =
      numero >= esperado - 3 &&
      numero <= esperado + 3;

    setMonitorizacion({

      ...monitorizacion,

      [frecuencia]: {

        ...monitorizacion[frecuencia],

        resultado: numero,
        conforme

      }

    });
  };

  // =====================================================
  // VALIDAR ETAPA
  // =====================================================

  const inspeccionesCompletas =
    inspecciones.limpieza_exterior !== "" &&
    inspecciones.papel_registro !== "" &&
    inspecciones.estado_cables !== "";

  const energiaCompleta = () => {

    const actual =
      energia[energiaActual];

    if (!actual) return false;

    if (actual.noAplica)
      return true;

    if (
      actual.resultado === "" ||
      actual.conforme === null
    )
      return false;

    return true;
  };

  // =====================================================
  // SIGUIENTE MEDICIÓN ENERGÍA
  // =====================================================

  const aceptarEnergia = () => {

    const actual =
      energia[energiaActual];

    if (actual.noAplica) {

      if (
        energiaActual <
        energia.length - 1
      ) {

        setEnergiaActual(
          energiaActual + 1
        );

        return;

      }

      setEtapa(2);

      return;
    }

    if (
      actual.resultado === "" ||
      actual.conforme === null
    ) {

      alert(
        "Complete la medición antes de continuar."
      );

      return;
    }

    if (
      energiaActual <
      energia.length - 1
    ) {

      setEnergiaActual(
        energiaActual + 1
      );

    } else {

      setEtapa(2);

    }
  };

  // =====================================================
  // BATERÍA SIGUIENTE
  // =====================================================

  const aceptarBateria = () => {

    const actual =
      bateria[bateriaActual];

    if (
      !actual.noAplica &&
      (
        actual.resultado === "" ||
        actual.conforme === null
      )
    ) {

      alert(
        "Complete la medición antes de continuar."
      );

      return;
    }

    if (
      bateriaActual <
      bateria.length - 1
    ) {

      setBateriaActual(
        bateriaActual + 1
      );

    } else {

      setEtapa(4);

    }
  };

  // =====================================================
  // CANCELAR
  // =====================================================

  const cancelar = async () => {

  const confirmar = window.confirm(
    "¿Desea cancelar el mantenimiento? Se eliminará la tarea creada y se perderán todos los datos ingresados."
  );

  if (!confirmar) {
    return;
  }

  try {

    // ==========================================
    // OBTENER LA TAREA RIC01 CREADA
    // ==========================================

    const tareaGuardada =
      localStorage.getItem("tareaActiva");

    if (!tareaGuardada) {

      console.log(
        "No existe tareaActiva para eliminar."
      );

      setVista("equipos");

      return;
    }

    const tarea =
      JSON.parse(tareaGuardada);

    console.log(
      "Tarea RIC01 a eliminar:",
      tarea
    );

    // ==========================================
    // ELIMINAR LA TAREA RIC01
    // ==========================================

    if (tarea.id) {

      const res = await fetch(
        `${API_URL.Ric01}/${tarea.id}/cancelar-preventivo`,
        {
          method: "DELETE"
        }
      );

      const data =
        await res.json();

      if (!res.ok) {

        throw new Error(
          data.error ||
          "No se pudo eliminar la tarea."
        );
      }

      console.log(
        "Tarea RIC01 eliminada correctamente:",
        data
      );
    }

    // ==========================================
    // LIMPIAR LOCALSTORAGE
    // ==========================================

    localStorage.removeItem(
      "tareaActiva"
    );

    // ==========================================
    // VOLVER A EQUIPOS
    // ==========================================

    setVista("equipos");

  } catch (error) {

    console.error(
      "Error cancelando preventivo:",
      error
    );

    alert(
      error.message ||
      "No se pudo cancelar el mantenimiento."
    );
  }
};
// =====================================================
// VOLVER
// =====================================================

const volver = () => {

  // -----------------------------------------------
  // INSPECCIONES
  // -----------------------------------------------

  if (etapa === 0) {
    setVista("equipos");
    return;
  }

  // -----------------------------------------------
  // ENTREGA DE ENERGÍA
  // Volver medición por medición
  // -----------------------------------------------

  if (etapa === 1) {

    if (energiaActual > 0) {

      setEnergiaActual(
        prev => prev - 1
      );

      return;
    }

    // Si estamos en la primera medición,
    // volvemos a Inspecciones.

    setEtapa(0);
    return;
  }

  // -----------------------------------------------
  // TIEMPO DE CARGA
  // -----------------------------------------------

  if (etapa === 2) {
    setEtapa(1);
    return;
  }

  // -----------------------------------------------
  // ESTADO DE BATERÍA
  // Volver medición por medición
  // -----------------------------------------------

  if (etapa === 3) {

    if (bateriaActual > 0) {

      setBateriaActual(
        prev => prev - 1
      );

      return;
    }

    // Si estamos en la primera medición,
    // volvemos a Tiempo de carga.

    setEtapa(2);
    return;
  }

  // -----------------------------------------------
  // SINCRONISMO
  // -----------------------------------------------

  if (etapa === 4) {
    setEtapa(3);
    return;
  }

  // -----------------------------------------------
  // MONITORIZACIÓN
  // -----------------------------------------------

  if (etapa === 5) {
    setEtapa(4);
    return;
  }

  // -----------------------------------------------
  // RESUMEN
  // -----------------------------------------------

  if (etapa === 6) {
    setEtapa(5);
    return;
  }
};

  // =====================================================
  // RESULTADOS NO CONFORMES
  // =====================================================

  const obtenerNoConformes = () => {

    const resultados = [];

    // -----------------------------------------------
    // INSPECCIONES
    // -----------------------------------------------

    Object.entries(
      inspecciones
    ).forEach(
      ([campo, valor]) => {

        if (
          valor === "No Conforme"
        ) {

          resultados.push({

            etapa: "Inspecciones",

            medicion:
              campo ===
              "limpieza_exterior"
                ? "Limpieza exterior"
                : campo ===
                  "papel_registro"
                  ? "Papel de registro"
                  : "Estado de cables",

            resultado:
              "No Conforme",

            rango:
              "Conforme"

          });

        }

      }
    );

    // -----------------------------------------------
    // ENERGÍA
    // -----------------------------------------------

    energia.forEach(
      (m) => {

        if (
          m.conforme === false
        ) {

          resultados.push({

            etapa:
              "Entrega de energía",

            medicion:
              m.nombre,

            resultado:
              m.resultado,

            rango:
              `${m.min} a ${m.max} J`

          });

        }

      }
    );

    // -----------------------------------------------
    // CARGA
    // -----------------------------------------------

    if (
      carga.conforme === false
    ) {

      resultados.push({

        etapa:
          "Tiempo de carga",

        medicion:
          "Carga a máxima energía",

        resultado:
          `${carga.resultado}`,

        rango:
          "< 15 s"

      });

    }

    // -----------------------------------------------
    // BATERÍA
    // -----------------------------------------------

    bateria.forEach(
      (m) => {

        if (
          m.conforme === false
        ) {

          resultados.push({

            etapa:
              "Estado de batería",

            medicion:
              `Medición ${m.numero_medicion}`,

            resultado:
              m.resultado,

            rango:
              "< 15"

          });

        }

      }
    );

    // -----------------------------------------------
    // SINCRONISMO
    // -----------------------------------------------

    if (
      sincronismo.conforme === false
    ) {

      resultados.push({

        etapa:
          "Sincronismo",

        medicion:
          "Tiempo entre onda R y descarga",

        resultado:
          sincronismo.resultado,

        rango:
          "< 60 ms"

      });

    }

    // -----------------------------------------------
    // MONITORIZACIÓN
    // -----------------------------------------------

    Object.entries(
      monitorizacion
    ).forEach(
      ([frecuencia, dato]) => {

        if (
          dato.conforme === false
        ) {

          resultados.push({

            etapa:
              "Monitorización de alarmas",

            medicion:
              `${frecuencia} BPM`,

            resultado:
              dato.resultado,

            rango:
              `${Number(frecuencia) - 3} a ${
                Number(frecuencia) + 3
              } BPM`

          });

        }

      }
    );

    return resultados;
  };

  // =====================================================
  // GUARDAR RIC29
  // =====================================================

  const guardarPreventivo = async () => {

    const noConformes =
      obtenerNoConformes();

    try {

      setGuardando(true);

      const payload = {

        // -----------------------------------------
        // CABECERA
        // -----------------------------------------

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
          noConformes.length === 0
            ? "CONFORME"
            : "NO CONFORME",

        observaciones,

        // -----------------------------------------
        // INSPECCIONES
        // -----------------------------------------

        inspecciones: {
  limpieza_exterior:
    inspecciones.limpieza_exterior,

  papel_registro:
    inspecciones.papel_registro,

  estado_cables:
    inspecciones.estado_cables,

  observaciones:
    observacionesInspecciones || null
},

        // -----------------------------------------
        // ENERGÍA
        // -----------------------------------------

       energia: energia.map((e, index) => ({
  energia_nominal:
    e.nominal !== null &&
    e.nominal !== ""
      ? Number(e.nominal)
      : null,

  resultado_medicion:
    e.resultado === ""
      ? null
      : Number(e.resultado),

  incertidumbre:
    e.incertidumbre,

  rango_min:
    e.min,

  rango_max:
    e.max,

  conforme:
    e.noAplica
      ? null
      : e.conforme
})),
        // -----------------------------------------
        // CARGA
        // -----------------------------------------

        carga: {

          resultado_medicion:
            carga.resultado,

          incertidumbre:
            0.05,

          rango_max:
            15,

          conforme:
            carga.noAplica
              ? null
              : carga.conforme,

          no_aplica:
            carga.noAplica

        },

        // -----------------------------------------
        // BATERÍA
        // -----------------------------------------

        bateria:

          bateria.map(
            (m) => ({

              numero_medicion:
                m.numero_medicion,

              resultado_medicion:
                m.resultado,

              incertidumbre:
                0.05,

              rango_max:
                15,

              conforme:
                m.noAplica
                  ? null
                  : m.conforme,

              no_aplica:
                m.noAplica

            })
          ),

        // -----------------------------------------
        // SINCRONISMO
        // -----------------------------------------

        sincronismo: {

          resultado_medicion:
            sincronismo.resultado,

          incertidumbre:
            6.42,

          rango_max:
            60,

          conforme:
            sincronismo.noAplica
              ? null
              : sincronismo.conforme,

          no_aplica:
            sincronismo.noAplica

        },

        // -----------------------------------------
        // MONITORIZACIÓN
        // -----------------------------------------

        monitorizacion: {

          "60": {

            frecuencia_nominal:
              60,

            resultado_medicion:
              monitorizacion["60"]
                .resultado,

            incertidumbre:
              3,

            conforme:
              monitorizacion["60"]
                .noAplica
                ? null
                : monitorizacion["60"]
                    .conforme,

            no_aplica:
              monitorizacion["60"]
                .noAplica

          },

          "120": {

            frecuencia_nominal:
              120,

            resultado_medicion:
              monitorizacion["120"]
                .resultado,

            incertidumbre:
              3,

            conforme:
              monitorizacion["120"]
                .noAplica
                ? null
                : monitorizacion["120"]
                    .conforme,

            no_aplica:
              monitorizacion["120"]
                .noAplica

          }

        }

      };

      console.log(
        "PAYLOAD RIC29:",
        payload
      );

     const res = await fetch(
  API_URL.Ric29,
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
    "Error al guardar RIC29"
  );

}

// Guardar el ID del RIC29 recién creado
setRic29Id(data.ric29_id);

console.log(
  "RIC29 creado con ID:",
  data.ric29_id
);
      alert(
  "Mantenimiento preventivo guardado correctamente ✅"
);

localStorage.removeItem(
  "tareaActiva"
);

    } catch (err) {

      console.error(
        "ERROR GUARDANDO RIC29:",
        err
      );

      alert(
        err.message ||
        "Error al guardar el mantenimiento"
      );

    } finally {

      setGuardando(false);

    }
  };

  // =====================================================
  // BARRA DE PROGRESO
  // =====================================================

  const progreso =
    ((etapa + 1) /
      etapas.length) *
    100;

  // =====================================================
  // LOADING
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

      {/* =================================================
          BARRA DE PROGRESO FIJA
      ================================================= */}

      <div className="sticky top-0 z-50 bg-white shadow">

        <div className="max-w-xl mx-auto p-3">

          <div className="flex justify-between text-xs text-gray-500 mb-1">
 <p className="font-bold">RIC29 - MP Cardiodesfibiladores</p>

            <span>
              {etapas[etapa]}
            </span>

            <span>
              {etapa + 1} / {etapas.length}
            </span>

          </div>

          <div className="w-full bg-gray-200 rounded-full h-2">

            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${progreso}%`
              }}
            />

          </div>

        </div>

      </div>

      <div className="p-4 max-w-xl mx-auto pb-10">

        {/* =================================================
            DATOS DEL EQUIPO COMPACTOS
        ================================================= */}

        <div className="bg-gray-100 rounded-xl p-3 mb-4">

          <div className="flex justify-between items-center">

            <div>

              <p className="font-bold">
                {datos.descripcion}
              </p>

              <p className="text-sm text-gray-600">
                {datos.marca_modelo}
              </p>

            </div>

            <div className="text-right text-xs">

              <p>
                <b>Serie:</b>{" "}
                {datos.numero_serie}
              </p>

              <p>
                <b>Área:</b>{" "}
                {datos.area}
              </p>
              <p>
                <b>Servicio:</b>{" "}
                {datos.servicio}
              </p>

            </div>

          </div>

        </div>

        {/* =================================================
            ETAPA 1 - INSPECCIONES
        ================================================= */}

        {etapa === 0 && (

          <div className="bg-white rounded-xl shadow p-4">

            <h2 className="text-xl font-bold mb-2">
              1. Inspeccion visual
            </h2>

            <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3 mb-4">
              Comprobar estado y entorno del equipo. Si se encuentra desconectado de la red o con elementos encima aclararlo en el campo Observaciones.
            </p>

            <div className="space-y-4">

              {[
                [
                  "limpieza_exterior",
                  "Limpieza exterior"
                ],
                [
                  "papel_registro",
                  "Papel de registro"
                ],
                [
                  "estado_cables",
                  "Estado de cables"
                ]
              ].map(
                ([campo, titulo]) => (

                  <div key={campo}>

                    <label className="font-semibold block mb-1">
                      {titulo}
                    </label>

                    <select
                      value={
                        inspecciones[campo]
                      }
                      onChange={(e) =>
                        cambiarInspeccion(
                          campo,
                          e.target.value
                        )
                      }
                      className="w-full border rounded-xl p-3"
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

                  </div>

                )
              )}

            </div>
{/* -----------------------------------------
    OBSERVACIONES DE INSPECCIONES
----------------------------------------- */}

<div className="mt-5">

  <label className="font-semibold block mb-2">
    Observaciones
  </label>

  <textarea
    value={observacionesInspecciones}
    onChange={(e) =>
      setObservacionesInspecciones(e.target.value)
    }
    rows={4}
    placeholder="Ingrese observaciones de la inspección..."
    className="w-full border rounded-xl p-3"
  />

</div>
            <div className="flex gap-2 mt-6">

              <button
                onClick={cancelar}
                className="flex-1 bg-red-500 text-white rounded-xl p-3"
              >
                Cancelar
              </button>

              <button
                disabled={!inspeccionesCompletas}
                onClick={() =>
                  setEtapa(1)
                }
                className="flex-1 bg-blue-600 disabled:bg-gray-300 text-white rounded-xl p-3"
              >
                Continuar →
              </button>

            </div>

          </div>

        )}

        {/* =================================================
            ETAPA 2 - ENERGÍA
        ================================================= */}

        {etapa === 1 && (

          <div className="bg-white rounded-xl shadow p-4">

            <h2 className="text-xl font-bold">
              2. Entrega de energía
            </h2>
            <IndicadorRed conectado={true} />
            <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3 my-4">
              Con el equipo conectado a la red eléctrica setear los valores de energía requeridos. En el caso de que el valor requerido no este disponible usar la casilla de verificación de "No aplica".
              Para la medición de Máx. energía se debe ingresar primero el valor máximo permitido por el equipo
            </p>

            <div className="bg-gray-100 rounded-xl p-3 mb-4 text-center">

              <p className="text-sm text-gray-500">
                Medición
              </p>

              <p className="text-2xl font-bold">
                {energiaActual + 1} / 6
              </p>

              <p className="text-2xl font-bold">
                {
                  energia[
                    energiaActual
                  ].nombre
                }
              </p>

            </div>

            {energiaActual < 5 && (

              <>

                <label className="font-semibold block mb-2">
                  Resultado de medición (J)
                </label>

                <input
                  type="number"
                  step="0.01"
                  value={
                    energia[
                      energiaActual
                    ].resultado
                  }
                  onChange={(e) =>
                    calcularEnergia(
                      energiaActual,
                      e.target.value
                    )
                  }
                  className={`w-full border rounded-xl p-3 text-lg ${
                    energia[
                      energiaActual
                    ].conforme === true
                      ? "bg-green-100 border-green-500"
                      : energia[
                          energiaActual
                        ].conforme === false
                      ? "bg-red-100 border-red-500"
                      : ""
                  }`}
                />

                <div className="mt-3 text-sm">

                  <p>
                    <b>Rango:</b>{" "}
                    {
                      energia[
                        energiaActual
                      ].min
                    }{" "}
                    a{" "}
                    {
                      energia[
                        energiaActual
                      ].max
                    } J
                  </p>

                  <p>
                    <b>Incertidumbre:</b>{" "}
                    ±
                    {
                      energia[
                        energiaActual
                      ].incertidumbre
                    } J
                  </p>

                </div>

              </>

            )}

            {/* -----------------------------------------
                MÁXIMA ENERGÍA
            ----------------------------------------- */}

            {energiaActual === 5 && (

              <>

                <label className="font-semibold block mb-2">
                  Valor máximo permitido por el equipo (J)
                </label>

                <input
                  type="number"
                  step="0.01"
                  value={
                    energia[5]
                      .fabricante || ""
                  }
                  onChange={(e) => {

                    const copia =
                      [...energia];

                    copia[5] = {
                      ...copia[5],
                      fabricante:
                        e.target.value
                    };

                    setEnergia(copia);

                  }}
                  className="w-full border rounded-xl p-3 mb-4"
                />

                <label className="font-semibold block mb-2">
                  Resultado de medición (J)
                </label>

                <input
                  type="number"
                  step="0.01"
                  value={
                    energia[5]
                      .resultado || ""
                  }
                  onChange={(e) =>
                    calcularMaxEnergia(
                      energia[5]
                        .fabricante,
                      e.target.value
                    )
                  }
                  className={`w-full border rounded-xl p-3 text-lg ${
                    energia[5]
                      .conforme === true
                      ? "bg-green-100 border-green-500"
                      : energia[5]
                          .conforme === false
                      ? "bg-red-100 border-red-500"
                      : ""
                  }`}
                />

                {energia[5].fabricante && (

                  <div className="mt-3 text-sm">

                    <p>
                      <b>Rango de aceptación:</b>{" "}
                      {energia[5].min?.toFixed(2)}
                      {" a "}
                      {energia[5].max?.toFixed(2)}
                      {" J"}
                    </p>

                    <p>
                      ±15 % del valor indicado por fabricante
                    </p>

                  </div>

                )}

              </>

            )}

            <label className="flex items-center gap-2 mt-5">

              <input
                type="checkbox"
                checked={
                  energia[
                    energiaActual
                  ].noAplica
                }
                onChange={(e) => {

                  const copia =
                    [...energia];

                  copia[
                    energiaActual
                  ].noAplica =
                    e.target.checked;

                  copia[
                    energiaActual
                  ].conforme =
                    null;

                  setEnergia(copia);

                }}
              />

              <span>
                No aplica
              </span>

            </label>

            <div className="flex gap-2 mt-6">

             <button
  onClick={() => {
    if (energiaActual > 0) {
      setEnergiaActual(prev => prev - 1);
    } else {
      setEtapa(prev => prev - 1);
    }
  }}
  className="flex-1 bg-gray-500 text-white rounded-xl p-3"
>
  ← Volver
</button>

              <button
                onClick={cancelar}
                className="flex-1 bg-red-500 text-white rounded-xl p-3"
              >
                Cancelar
              </button>

              <button
                onClick={aceptarEnergia}
                className="flex-1 bg-blue-600 text-white rounded-xl p-3"
              >
                Aceptar →
              </button>

            </div>

          </div>

        )}

        {/* =================================================
            ETAPA 3 - TIEMPO DE CARGA
        ================================================= */}

        {etapa === 2 && (

          <div className="bg-white rounded-xl shadow p-4">

            <h2 className="text-xl font-bold">
              3. Tiempo de carga
            </h2>
            <IndicadorRed conectado={true} />
            <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3 my-4">
              Con el equipo conectado a la red eléctrica setear el valor máximo de energía permitido por el equipo.
            </p>

            <p className="font-semibold mb-2">
              Carga a máxima energía
            </p>

            <input
              type="number"
              step="0.01"
              value={carga.resultado}
              onChange={(e) =>
                calcularCarga(
                  e.target.value
                )
              }
              className={`w-full border rounded-xl p-3 text-lg ${
                carga.conforme === true
                  ? "bg-green-100 border-green-500"
                  : carga.conforme === false
                  ? "bg-red-100 border-red-500"
                  : ""
              }`}
            />

            <p className="text-sm mt-2">
              Rango de aceptación: <b>&lt; 15 s</b>
            </p>

            <label className="flex items-center gap-2 mt-4">

              <input
                type="checkbox"
                checked={carga.noAplica}
                onChange={(e) =>
                  setCarga({

                    ...carga,

                    noAplica:
                      e.target.checked,

                    conforme:
                      null

                  })
                }
              />

              No aplica

            </label>

            <div className="flex gap-2 mt-6">

              <button
                onClick={volver}
                className="flex-1 bg-gray-500 text-white rounded-xl p-3"
              >
                ← Volver
              </button>

              <button
                onClick={cancelar}
                className="flex-1 bg-red-500 text-white rounded-xl p-3"
              >
                Cancelar
              </button>

              <button
                disabled={
                  !carga.noAplica &&
                  carga.conforme === null
                }
                onClick={() =>
                  setEtapa(3)
                }
                className="flex-1 bg-blue-600 disabled:bg-gray-300 text-white rounded-xl p-3"
              >
                Continuar →
              </button>

            </div>

          </div>

        )}

        {/* =================================================
            ETAPA 4 - BATERÍA
        ================================================= */}

        {etapa === 3 && (

          <div className="bg-white rounded-xl shadow p-4">

            <h2 className="text-xl font-bold">
              4. Estado de batería
            </h2>
            <IndicadorRed conectado={false} />
            <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3 my-4">
              Con el equipo desconectado de la red eléctrica setear el valor máximo de energía permitido por el equipo.
            </p>

            <div className="bg-gray-100 rounded-xl p-3 mb-4 text-center">

              <p className="text-sm">
                Medición
              </p>

              <p className="text-2xl font-bold">
                {bateriaActual + 1} / 4
              </p>

            </div>

            <label className="font-semibold block mb-2">
              Resultado de medición
            </label>

            <input
              type="number"
              step="0.01"
              value={
                bateria[
                  bateriaActual
                ].resultado
              }
              onChange={(e) =>
                calcularBateria(
                  e.target.value
                )
              }
              className={`w-full border rounded-xl p-3 text-lg ${
                bateria[
                  bateriaActual
                ].conforme === true
                  ? "bg-green-100 border-green-500"
                  : bateria[
                      bateriaActual
                    ].conforme === false
                  ? "bg-red-100 border-red-500"
                  : ""
              }`}
            />

            <p className="text-sm mt-2">
              Rango de aceptación: <b>&lt; 15</b>
            </p>

            <label className="flex items-center gap-2 mt-4">

              <input
                type="checkbox"
                checked={
                  bateria[
                    bateriaActual
                  ].noAplica
                }
                onChange={(e) => {

                  const copia =
                    [...bateria];

                  copia[
                    bateriaActual
                  ].noAplica =
                    e.target.checked;

                  copia[
                    bateriaActual
                  ].conforme =
                    null;

                  setBateria(copia);

                }}
              />

              No aplica

            </label>

            <div className="flex gap-2 mt-6">

<button
  onClick={() => {
    if (bateriaActual > 0) {
      setBateriaActual(prev => prev - 1);
    } else {
      setEtapa(prev => prev - 1);
    }
  }}
  className="flex-1 bg-gray-500 text-white rounded-xl p-3"
>
  ← Volver
</button>

              <button
                onClick={cancelar}
                className="flex-1 bg-red-500 text-white rounded-xl p-3"
              >
                Cancelar
              </button>

              <button
                onClick={aceptarBateria}
                className="flex-1 bg-blue-600 text-white rounded-xl p-3"
              >
                {bateriaActual === 3
                  ? "Continuar →"
                  : "Aceptar →"}
              </button>

            </div>

          </div>

        )}

        {/* =================================================
            ETAPA 5 - SINCRONISMO
        ================================================= */}

        {etapa === 4 && (

          <div className="bg-white rounded-xl shadow p-4">

            <h2 className="text-xl font-bold">
              5. Sincronismo
            </h2>

            <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3 my-4">
              Reconectar el equipo a la red eléctrica y activar la función de sincronismo. En el caso de no estar disponible usar la casilla de verificación de "No aplica".
            </p>
            <IndicadorRed conectado={true} />
            <p className="font-semibold mb-2">
              Tiempo entre onda R y descarga
            </p>

            <input
              type="number"
              step="0.01"
              value={
                sincronismo.resultado
              }
              onChange={(e) =>
                calcularSincronismo(
                  e.target.value
                )
              }
              className={`w-full border rounded-xl p-3 text-lg ${
                sincronismo.conforme === true
                  ? "bg-green-100 border-green-500"
                  : sincronismo.conforme === false
                  ? "bg-red-100 border-red-500"
                  : ""
              }`}
            />

            <p className="text-sm mt-2">
              Rango de aceptación: <b>&lt; 60 ms</b>
            </p>

            <label className="flex items-center gap-2 mt-4">

              <input
                type="checkbox"
                checked={
                  sincronismo.noAplica
                }
                onChange={(e) =>
                  setSincronismo({

                    ...sincronismo,

                    noAplica:
                      e.target.checked,

                    conforme:
                      null

                  })
                }
              />

              No aplica

            </label>

            <div className="flex gap-2 mt-6">

              <button
                onClick={volver}
                className="flex-1 bg-gray-500 text-white rounded-xl p-3"
              >
                ← Volver
              </button>

              <button
                onClick={cancelar}
                className="flex-1 bg-red-500 text-white rounded-xl p-3"
              >
                Cancelar
              </button>

              <button
                disabled={
                  !sincronismo.noAplica &&
                  sincronismo.conforme === null
                }
                onClick={() =>
                  setEtapa(5)
                }
                className="flex-1 bg-blue-600 disabled:bg-gray-300 text-white rounded-xl p-3"
              >
                Continuar →
              </button>

            </div>

          </div>

        )}

        {/* =================================================
            ETAPA 6 - MONITORIZACIÓN
        ================================================= */}

        {etapa === 5 && (

          <div className="bg-white rounded-xl shadow p-4">

            <h2 className="text-xl font-bold">
              6. Monitorización
            </h2>

            <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3 my-4">
              Con el equipo conectado a la red eléctrica verificar la correspondencia de los valores seteados en el simulador.
            </p>
            <IndicadorRed conectado={true} />
            {["60", "120"].map(
              (frecuencia) => (

                <div
                  key={frecuencia}
                  className="mb-5"
                >

                  <label className="font-semibold block mb-2">
                    {frecuencia} BPM
                  </label>

                  <input
                    type="number"
                    step="0.01"
                    value={
                      monitorizacion[
                        frecuencia
                      ].resultado
                    }
                    onChange={(e) =>
                      calcularMonitorizacion(
                        frecuencia,
                        e.target.value
                      )
                    }
                    className={`w-full border rounded-xl p-3 ${
                      monitorizacion[
                        frecuencia
                      ].conforme === true
                        ? "bg-green-100 border-green-500"
                        : monitorizacion[
                            frecuencia
                          ].conforme === false
                        ? "bg-red-100 border-red-500"
                        : ""
                    }`}
                  />

                  <p className="text-sm mt-1">
                    Rango:{" "}
                    {Number(frecuencia) - 3}
                    {" a "}
                    {Number(frecuencia) + 3}
                    {" BPM"}
                  </p>

                  <label className="flex items-center gap-2 mt-2">

                    <input
                      type="checkbox"
                      checked={
                        monitorizacion[
                          frecuencia
                        ].noAplica
                      }
                      onChange={(e) =>
                        setMonitorizacion({

                          ...monitorizacion,

                          [frecuencia]: {

                            ...monitorizacion[
                              frecuencia
                            ],

                            noAplica:
                              e.target.checked,

                            conforme:
                              null

                          }

                        })
                      }
                    />

                    No aplica

                  </label>

                </div>

              )
            )}

            <div className="flex gap-2 mt-6">

              <button
                onClick={volver}
                className="flex-1 bg-gray-500 text-white rounded-xl p-3"
              >
                ← Volver
              </button>

              <button
                onClick={cancelar}
                className="flex-1 bg-red-500 text-white rounded-xl p-3"
              >
                Cancelar
              </button>

              <button
                onClick={() =>
                  setEtapa(6)
                }
                className="flex-1 bg-blue-600 text-white rounded-xl p-3"
              >
                Ver resumen →
              </button>

            </div>

          </div>

        )}

        {/* =================================================
            ETAPA 7 - RESUMEN
        ================================================= */}

        {etapa === 6 && (

          <div className="bg-white rounded-xl shadow p-4">

            <h2 className="text-xl font-bold mb-4">
              7. Resumen del mantenimiento
            </h2>

            {obtenerNoConformes().length === 0 ? (

              <div className="bg-green-100 text-green-800 rounded-xl p-4 mb-5">

                <p className="font-bold text-lg">
                  ✅ MANTENIMIENTO CONFORME
                </p>

                <p className="text-sm mt-1">
                  Todas las mediciones realizadas
                  se encuentran dentro de los rangos
                  de aceptación.
                </p>

              </div>

            ) : (

              <div className="bg-red-100 text-red-800 rounded-xl p-4 mb-5">

                <p className="font-bold text-lg mb-3">
                  ❌ MANTENIMIENTO NO CONFORME
                </p>

                <div className="space-y-3">

                  {obtenerNoConformes().map(
                    (item, index) => (

                      <div
                        key={index}
                        className="bg-white rounded-lg p-3"
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

                        <p>
                          <b>Rango:</b>{" "}
                          {item.rango}
                        </p>

                      </div>

                    )
                  )}

                </div>

              </div>

            )}

            {/* -----------------------------------------
    OBSERVACIONES DE INSPECCIONES
----------------------------------------- */}

{observacionesInspecciones?.trim() && (
  <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-4 mt-4">

    <h3 className="font-bold text-yellow-800 mb-2">
      📝 Observaciones de inspecciones
    </h3>

    <p className="text-gray-700 whitespace-pre-wrap">
      {observacionesInspecciones}
    </p>

  </div>
)}

            {/* -----------------------------------------
                OBSERVACIONES GENERALES
            ----------------------------------------- */}

            <label className="font-semibold block mb-2">
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
              placeholder="Ingrese aquí las observaciones del mantenimiento..."
              className="w-full border rounded-xl p-3"
            />

            <div className="flex gap-2 mt-6">

              <button
                onClick={volver}
                className="flex-1 bg-gray-500 text-white rounded-xl p-3"
              >
                ← Volver
              </button>

              <button
                onClick={cancelar}
                className="flex-1 bg-red-500 text-white rounded-xl p-3"
              >
                Cancelar
              </button>

            </div>

            <button
              disabled={guardando}
              onClick={guardarPreventivo}
              className="w-full bg-green-600 disabled:bg-gray-400 text-white rounded-xl p-3 mt-3 font-bold"
            >

              {guardando
                ? "Guardando..."
                : "💾 Guardar preventivo"}

            </button>

            {ric29Id && (

  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">

    <button
      onClick={abrirPDF}
      className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-3 font-bold"
    >
      📄 Ver / Descargar PDF
    </button>

    <button
      onClick={() => setVista("equipos")}
      className="bg-gray-600 hover:bg-gray-700 text-white rounded-xl p-3 font-bold"
    >
      🚪 Salir
    </button>

  </div>

)}

          </div>

        )}

      </div>

    </div>
  );
}
