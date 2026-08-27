import { useState } from "react";
import { API_URL } from "./config";
import { useEffect } from "react";
import { useRef } from "react";

//import LectorQR from "./components/LectorQR";

export default function Equipos({ setVista, personal }) {
  const [serie, setSerie] = useState("");
  const [equipo, setEquipo] = useState(null);
  const [error, setError] = useState("");
  const [mostrarForm, setMostrarForm] = useState(false);
  const [descripcion, setDescripcion] = useState("");
  const [tipoMantenimiento, setTipoMantenimiento] = useState("");
  const [diagnosticos, setDiagnosticos] = useState([]);
  const [diagnosticoSeleccionado, setDiagnosticoSeleccionado] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [estados, setEstados] = useState([]);
  const [mostrarFinalizar, setMostrarFinalizar] = useState(false);
  const [estadoFinal, setEstadoFinal] = useState("");
  const [historial, setHistorial] = useState([]);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const inputImagenRef = useRef(null);
  const [mostrarLector, setMostrarLector] = useState(false);
  const [coincidencias, setCoincidencias] = useState([]);
  const [equiposVencidos, setEquiposVencidos] = useState([]);
  const [mostrarVencidos, setMostrarVencidos] = useState(false);
  const [cargandoVencidos, setCargandoVencidos] = useState(false);

  useEffect(() => {
  fetchEstados();
}, []);

  useEffect(() => {
  const tareaGuardada = localStorage.getItem("tareaActiva");

  if (!tareaGuardada) return;

  const tarea = JSON.parse(tareaGuardada);

  if (tarea.numero_serie) {
    setSerie(tarea.numero_serie);
  }
}, []);

useEffect(() => {

  // Equipo que acaba de ser editado
  const equipoActualizado =
    localStorage.getItem("equipoActualizado");

  if (equipoActualizado) {

    // Limpiamos el dato temporal
    localStorage.removeItem("equipoActualizado");

    // Volvemos a buscar el equipo actualizado
    buscarEquipo(equipoActualizado);

    return;
  }

  // Comportamiento normal
  if (serie) {
    buscarEquipo();
  }

}, [serie]);

  const fetchEstados = async () => {
  try {
    const res = await fetch(API_URL.Estados);
    const data = await res.json();
    setEstados(data);
  } catch (err) {
    console.error("Error cargando estados:", err);
  }
};

  const cargarEquiposVencidos = async () => {
  try {
    setCargandoVencidos(true);

    const res = await fetch(
      API_URL.EquiposMantenimientoVencido
    );

    if (!res.ok) {
      throw new Error("Error al obtener equipos vencidos");
    }

    const data = await res.json();

    setEquiposVencidos(data);
    setMostrarVencidos(true);

  } catch (error) {
    console.error("Error equipos vencidos:", error);
    alert("No se pudieron obtener los equipos con mantenimiento vencido");
  } finally {
    setCargandoVencidos(false);
  }
};
  
  const cambiarEstado = async (id, nuevoEstado) => {
  try {
    const res = await fetch(`${API_URL.Equipos}/${id}/estado`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
      estado: nuevoEstado,
      usuario: personal.nombre})
    });

    if (!res.ok) throw new Error("Error HTTP");

    const actualizado = await res.json();

    // ✅ actualizar equipo en pantalla
    setEquipo(actualizado);

  } catch (err) {
    console.error(err);
    alert("❌ Error al actualizar estado");
  }
};

  const subirImagen = (e) => {

  const archivo = e.target.files[0];

  if (!archivo || !equipo?.numero_serie) return;

  const img = new Image();

  const reader = new FileReader();

  reader.onload = (ev) => {

    img.src = ev.target.result;

  };

  img.onload = async () => {

    // Tamaño máximo
    const MAX_WIDTH = 600;
    const MAX_HEIGHT = 600;

    let width = img.width;
    let height = img.height;

    if (width > MAX_WIDTH || height > MAX_HEIGHT) {

      const escala = Math.min(
        MAX_WIDTH / width,
        MAX_HEIGHT / height
      );

      width = Math.round(width * escala);
      height = Math.round(height * escala);

    }

    const canvas = document.createElement("canvas");

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");

    ctx.drawImage(img, 0, 0, width, height);

    // JPEG calidad 80%
    const imagenComprimida = canvas.toDataURL(
      "image/jpeg",
      0.6
    );

    try {

      const res = await fetch(
        `${API_URL.Equipos}/${encodeURIComponent(equipo.numero_serie)}/imagen`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            imagen: imagenComprimida
          })
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al guardar la imagen");
      }

      setEquipo({
        ...equipo,
        imagen: imagenComprimida
      });

      alert("Imagen guardada correctamente.");

    } catch (err) {

      console.error(err);

      alert("No se pudo guardar la imagen.");

    }

  };

  reader.readAsDataURL(archivo);

};
   function formatTimestamp(ts) {
  if (!ts) return "";

  // Si ya viene en formato dd/mm/yyyy, devolvemos tal cual
  if (/^\d{2}\/\d{2}\/\d{4}/.test(ts)) return ts;

  // Si viene como "YYYY-MM-DD HH:mm[:ss]" (string que vamos a respetar como hora local guardada)
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(ts)) {
    const [fechaPart, horaPart] = ts.split(" ");
    const [year, month, day] = fechaPart.split("-").map(Number);
    const [hour, min, sec = "00"] = horaPart.split(":");
    return `${String(day).padStart(2,"0")}/${String(month).padStart(2,"0")}/${year}, ${String(hour).padStart(2,"0")}:${String(min).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
  }

  // Si viene como ISO (contiene "T"), la convertimos interpretando la fecha y formateamos en zona Argentina
  try {
    const d = new Date(ts);
    const opciones = {
      timeZone: "America/Argentina/Buenos_Aires",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    };
    const partes = new Intl.DateTimeFormat("es-AR", opciones).formatToParts(d);
    const get = (t) => (partes.find(p => p.type === t) || {}).value || "00";
    const dia = get("day"), mes = get("month"), año = get("year");
    const hora = get("hour"), min = get("minute"), seg = get("second");
    return `${dia}/${mes}/${año}, ${hora}:${min}:${seg}`;
  } catch {
    return String(ts);
  }
}

    function getFechaLocal() {
    const d = new Date();
    d.setSeconds(0, 0);
    const año = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, "0");
    const dia = String(d.getDate()).padStart(2, "0");
    const hora = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${año}-${mes}-${dia} ${hora}:${min}`;
  }


  // =====================================================
// PROTOCOLOS DE MANTENIMIENTO ESPECÍFICOS
// =====================================================

const protocolosMantenimiento = [
  {
    protocolo: "RIC29",
    tipo: "preventivo",
    descripcion: "cardiodesfibrilador",
    vista: "ric29"
  }

  // Próximamente podemos agregar:
  //
  // {
  //   protocolo: "RIC30",
  //   tipo: "preventivo",
  //   descripcion: "electrobisturi",
  //   vista: "ric30"
  // },
  //
  // {
  //   protocolo: "RIC31",
  //   tipo: "preventivo",
  //   descripcion: "respirador",
  //   vista: "ric31"
  // }
];


// =====================================================
// BUSCAR PROTOCOLO CORRESPONDIENTE
// =====================================================

const obtenerProtocoloMantenimiento = (
  tipoMantenimiento,
  descripcionEquipo
) => {

  const tipo =
    tipoMantenimiento
      ?.trim()
      .toLowerCase();

  const descripcion =
    descripcionEquipo
      ?.trim()
      .toLowerCase();

  const protocoloEncontrado =
    protocolosMantenimiento.find(
      (p) =>
        p.tipo === tipo &&
        descripcion.includes(p.descripcion)
    );

  return protocoloEncontrado || null;
};

 const abrirRIC37 = () => {

  if (!equipo) {
    alert("Primero seleccione un equipo.");
    return;
  }

  if (!equipo.mantenimiento_id) {
    alert(
      "Primero debe iniciar el mantenimiento para poder realizar el RIC37."
    );
    return;
  }

  localStorage.setItem(
    "tareaActiva",
    JSON.stringify({
      id: equipo.mantenimiento_id,
      ric01_id: equipo.mantenimiento_id,
      equipo_id: equipo.id,
      numero_serie: equipo.numero_serie,
      descripcion: equipo.descripcion,
      marca_modelo: equipo.marca_modelo,
      area: equipo.area,
      servicio: equipo.servicio,
      sub_servicio: equipo.sub_servicio,
      tipo_mantenimiento: equipo.tipo_mantenimiento
    })
  );

  setVista("ric37");
};

 const guardarMantenimiento = async () => {
  try {

    // =====================================================
    // TAREA ACTIVA
    // =====================================================

    const tareaGuardada = localStorage.getItem("tareaActiva");

const tareaGuardadaObj = tareaGuardada
  ? JSON.parse(tareaGuardada)
  : null;

const tareaActiva =
  tareaGuardadaObj &&
  tareaGuardadaObj.numero_serie === equipo?.numero_serie
    ? tareaGuardadaObj
    : null;


    // =====================================================
    // TIPO DE MANTENIMIENTO
    // =====================================================

    const esPreventivo =
      tipoMantenimiento?.trim().toLowerCase() === "preventivo";


    // =====================================================
    // ¿EXISTE UN MANTENIMIENTO ABIERTO?
    // =====================================================

    const continuar =
      equipo?.estado?.toLowerCase() !== "activo" &&
      equipo?.mantenimiento_id &&
      equipo?.tipo_mantenimiento?.trim().toLowerCase() === "correctivo";


    // =====================================================
    // DETERMINAR PROTOCOLO ESPECÍFICO
    // =====================================================

    const protocolo =
      obtenerProtocoloMantenimiento(
        tipoMantenimiento,
        equipo?.descripcion
      );


    console.log(
      "=========================================="
    );

    console.log(
      "TIPO MANTENIMIENTO:",
      tipoMantenimiento
    );

    console.log(
      "ES PREVENTIVO:",
      esPreventivo
    );

    console.log(
      "EQUIPO:",
      equipo
    );

    console.log(
      "TAREA ACTIVA:",
      tareaActiva
    );

    console.log(
      "PROTOCOLO DETECTADO:",
      protocolo
    );

    console.log(
      "=========================================="
    );


    let res;


    // =====================================================
    // 1️⃣ CONTINUAR MANTENIMIENTO EXISTENTE
    // =====================================================

    if (continuar) {

      console.log(
        "🔧 CONTINUANDO MANTENIMIENTO:",
        equipo.mantenimiento_id
      );


      res = await fetch(
        `${API_URL.Ric01}/${equipo.mantenimiento_id}`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({

            diagnostico:
              diagnosticoSeleccionado,

            descripcion:
              descripcion,

            solucion:
              observaciones,

            fecha_comp:
              getFechaLocal()

          })
        }
      );

    }


    // =====================================================
    // 2️⃣ CREAR NUEVO MANTENIMIENTO PREVENTIVO
    // =====================================================

    else if (esPreventivo) {

      console.log(
        "🆕 CREANDO NUEVO MANTENIMIENTO PREVENTIVO"
      );


      res = await fetch(
        API_URL.Ric01,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({

            usuario:
              personal.nombre,

            fecha:
              getFechaLocal(),

            tarea:
              `Mantenimiento ${tipoMantenimiento} - ` +
              `${equipo.descripcion} ` +
              `${equipo.marca_modelo} - ` +
              `Serie: ${equipo.numero_serie}`,

            diagnostico:
              diagnosticoSeleccionado,

            tipo_mantenimiento:
              tipoMantenimiento,

            descripcion:
              equipo.descripcion,

            marca_modelo:
              equipo.marca_modelo,

            numero_serie:
              equipo.numero_serie,

            area:
              equipo.area ||
              personal.area,

            servicio:
              equipo.servicio,

            subservicio:
              equipo.sub_servicio,

            asignado:
              personal.nombre,

            solicitado_por:
              personal.nombre,

            origen:
              "interno",

            solucion:
              observaciones

          })
        }
      );

    }


    // =====================================================
    // 3️⃣ INICIAR MANTENIMIENTO DESDE TAREA EXISTENTE
    // =====================================================

    else if (tareaActiva) {

      console.log(
        "🔧 INICIANDO MANTENIMIENTO DESDE TAREA:",
        tareaActiva.id
      );


      res = await fetch(
        `${API_URL.Ric01}/${tareaActiva.id}/iniciar-mantenimiento`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({

            diagnostico:
              diagnosticoSeleccionado,

            tipo_mantenimiento:
              tipoMantenimiento,

            descripcion:
              equipo.descripcion,

            marca_modelo:
              equipo.marca_modelo,

            numero_serie:
              equipo.numero_serie,

            servicio:
              equipo.servicio,

            subservicio:
              equipo.sub_servicio,

            asignado:
              personal.nombre,

            solucion:
              observaciones

          })
        }
      );

    }


    // =====================================================
    // 4️⃣ CREAR MANTENIMIENTO NORMAL
    // =====================================================

    else {

      console.log(
        "🆕 CREANDO MANTENIMIENTO NUEVO"
      );


      res = await fetch(
        API_URL.Ric01,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({

            usuario:
              personal.nombre,

            fecha:
              getFechaLocal(),

            tarea:
              `Mantenimiento ${tipoMantenimiento} - ` +
              `${equipo.descripcion} ` +
              `${equipo.marca_modelo} - ` +
              `Serie: ${equipo.numero_serie}`,

            diagnostico:
              diagnosticoSeleccionado,

            tipo_mantenimiento:
              tipoMantenimiento,

            descripcion:
              equipo.descripcion,

            marca_modelo:
              equipo.marca_modelo,

            numero_serie:
              equipo.numero_serie,

            area:
              personal.area,

            servicio:
              equipo.servicio,

            subservicio:
              equipo.sub_servicio,

            asignado:
              personal.nombre,

            solicitado_por:
              personal.nombre,

            origen:
              "interno",

            solucion:
              observaciones

          })
        }
      );

    }


    // =====================================================
    // COMPROBAR RESPUESTA DEL SERVIDOR
    // =====================================================

    const data =
      await res.json();


    if (!res.ok) {

      throw new Error(
        data.error ||
        "Error al guardar el mantenimiento"
      );

    }


    console.log(
      "✅ RESPUESTA RIC01:",
      data
    );


    // =====================================================
    // 5️⃣ PROTOCOLO ESPECÍFICO
    // =====================================================

    if (protocolo) {

      console.log(
        "🚑 PROTOCOLO ESPECÍFICO DETECTADO:",
        protocolo
      );


      // ===================================================
      // IMPORTANTE:
      // data es el RIC01 recién creado.
      //
      // Su ID será utilizado por RIC29 como:
      //
      // ric29.ric01_id
      // ===================================================

      const mantenimientoRIC01 = {

        ...data,

        tipo_mantenimiento:
          tipoMantenimiento,

        descripcion:
          equipo.descripcion,

        marca_modelo:
          equipo.marca_modelo,

        numero_serie:
          equipo.numero_serie,

        area:
          equipo.area ||
          personal.area,

        servicio:
          equipo.servicio,

        subservicio:
          equipo.sub_servicio,

        asignado:
          personal.nombre,

        diagnostico:
          diagnosticoSeleccionado

      };


      console.log(
        "📋 MANTENIMIENTO RIC01 PARA PROTOCOLO:",
        mantenimientoRIC01
      );


      // ===================================================
      // GUARDAR EL RIC01 RECIÉN CREADO
      // ===================================================

      localStorage.setItem(
        "tareaActiva",
        JSON.stringify(
          mantenimientoRIC01
        )
      );


      console.log(
        "💾 tareaActiva guardada con RIC01 ID:",
        mantenimientoRIC01.id
      );


      // ===================================================
      // LIMPIAR FORMULARIO
      // ===================================================

      setMostrarForm(false);

      setTipoMantenimiento("");

      setDiagnosticoSeleccionado("");

      setObservaciones("");

      setDescripcion("");


      // ===================================================
      // ABRIR PROTOCOLO
      // ===================================================

      console.log(
        "🚑 Abriendo protocolo:",
        protocolo.vista
      );


      setVista(
        protocolo.vista
      );


      return;

    }


    // =====================================================
    // 6️⃣ MANTENIMIENTO NORMAL
    // =====================================================

    alert(
      continuar
        ? "Mantenimiento actualizado ✅"
        : "Mantenimiento iniciado ✅"
    );


    // =====================================================
    // LIMPIAR FORMULARIO
    // =====================================================

    setMostrarForm(false);

    setTipoMantenimiento("");

    setDiagnosticoSeleccionado("");

    setObservaciones("");

    setDescripcion("");


    // =====================================================
    // ELIMINAR TAREA ACTIVA
    // =====================================================

    localStorage.removeItem(
      "tareaActiva"
    );


    // =====================================================
    // LIMPIAR EQUIPO
    // =====================================================

    setEquipo(null);

    setSerie("");


  } catch (error) {

    console.error(
      "ERROR COMPLETO:",
      error
    );


    alert(
      error.message ||
      "Error al guardar el mantenimiento"
    );

  }
};

  const finalizarMantenimiento = async () => {

  if (!estadoFinal) {
    return alert("Seleccione un estado para el equipo");
  }

  try {

    const fechaFin = new Date()
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");

    const res = await fetch(
      `${API_URL.Ric01}/finalizar/${equipo.mantenimiento_id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fecha_fin: fechaFin,
          estado: estadoFinal,
          numero_serie: equipo.numero_serie,
          usuario: personal.nombre
        })
      }
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(
        data.error || "Error al finalizar mantenimiento"
      );
    }

    alert("✅ Mantenimiento finalizado");

    // cerrar modal
    setMostrarFinalizar(false);
    setEstadoFinal("");

    // limpiar formulario
    setMostrarForm(false);
    setTipoMantenimiento("");
    setDiagnosticoSeleccionado("");
    setObservaciones("");
    setDescripcion("");

    // limpiar equipo actual
    setEquipo(null);
    setSerie("");

    // eliminar tarea activa si existe
    localStorage.removeItem("tareaActiva");

  } catch (error) {
    console.error(error);
    alert(error.message);
  }
};
  
  const cargarDiagnosticos = async () => {
  try {
    const res = await fetch(API_URL.DiagnosticosRIC02);
    const data = await res.json();
    setDiagnosticos(data);
  } catch {
    alert("Error cargando diagnósticos");
  }
};

  const handleTipoChange = (value) => {
  setTipoMantenimiento(value);

  if (value === "Correctivo") {
    cargarDiagnosticos();
  }
};

  const buscarCoincidencias = async (texto) => {

  if (!texto.trim()) {
    setCoincidencias([]);
    return;
  }

  try {

    const res = await fetch(
      `${API_URL.Base}/buscar-equipos?q=${encodeURIComponent(texto)}`
    );

    if (!res.ok) {
      throw new Error("Error buscando equipos");
    }

    const data = await res.json();

    setCoincidencias(data);

  } catch (err) {

    console.error(err);
    setCoincidencias([]);

  }

};

const buscarEquipo = async (serieBuscar = serie) => {

  if (!serieBuscar) return;

  try {

    const res = await fetch(`${API_URL.BuscarEquipo}/${serieBuscar}`);

    if (!res.ok) {
      throw new Error("No encontrado");
    }

    const data = await res.json();

const tareaGuardada = localStorage.getItem("tareaActiva");

if (tareaGuardada) {
  const tarea = JSON.parse(tareaGuardada);

  if (tarea.numero_serie !== data.numero_serie) {
    localStorage.removeItem("tareaActiva");
  }
}

setEquipo(data);
    setError("");

    // Actualizar el cuadro de búsqueda
    setSerie(serieBuscar);

    // Si existe mantenimiento abierto
    if (
      data.estado &&
      data.estado.toLowerCase() !== "activo" &&
      data.mantenimiento_id
    ) {
      setTipoMantenimiento(data.tipo_mantenimiento || "");
      setDiagnosticoSeleccionado(data.diagnostico || "");
      setMostrarForm(true);
    }

  } catch (err) {

    setEquipo(null);
    setError("Equipo no encontrado");

  }

};

  const verHistorial = async () => {
  if (!equipo?.numero_serie) return;

  try {
    setCargandoHistorial(true);

    const res = await fetch(
      `${API_URL.HistorialEquipo}/${equipo.numero_serie}/historial`
    );

    if (!res.ok) {
      throw new Error("Error obteniendo historial");
    }

    const data = await res.json();

    setHistorial(data);
    setMostrarHistorial(true);

  } catch (err) {
    console.error(err);
    alert("No se pudo obtener el historial.");
  } finally {
    setCargandoHistorial(false);
  }
};

const imprimirHistorial = () => {

  if (!equipo?.numero_serie) return;

  window.open(
    `${API_URL.HistorialEquipo}/${equipo.numero_serie}/historial/pdf`,
    "_blank"
  );

};

  return (
    <div className="p-4 max-w-md mx-auto">
      <button
  onClick={cargarEquiposVencidos}
  className="w-full mb-4 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl shadow"
>
  {cargandoVencidos
    ? "Consultando..."
    : "⚠️ Ver mantenimientos vencidos"}
</button>
      {mostrarVencidos && (
  <div className="bg-white rounded-2xl shadow-md p-4 mb-6">

    <div className="flex justify-between items-center mb-4">
      <h2 className="text-xl font-bold text-gray-800">
        Equipos con mantenimiento vencido
      </h2>

      <button
        onClick={() => setMostrarVencidos(false)}
        className="text-gray-500 hover:text-gray-800 font-bold"
      >
        ✕
      </button>
    </div>

    {equiposVencidos.length === 0 ? (
      <p className="text-green-600 font-semibold">
        ✓ No hay equipos con mantenimiento vencido.
      </p>
    ) : (
      <div className="space-y-3">

        {equiposVencidos.map((equipo) => {

          const proximo = new Date(equipo.proximo_mant);
          const hoy = new Date();

          const diasVencido = Math.floor(
            (hoy - proximo) / (1000 * 60 * 60 * 24)
          );

          return (
            <div
              key={equipo.id}
              className="border rounded-xl p-4 hover:bg-gray-50"
            >

              <div className="flex justify-between items-start">

                <div>

                  <p className="font-bold text-gray-800">
                    {equipo.descripcion}
                  </p>

                  <p className="text-sm text-gray-600">
                    {equipo.marca_modelo || "Sin marca/modelo"}
                  </p>

                  <p className="text-sm">
                    <strong>Nº serie:</strong>{" "}
                    {equipo.numero_serie}
                  </p>

                  <p className="text-sm">
                    <strong>Servicio:</strong>{" "}
                    {equipo.servicio || "Sin asignar"}
                  </p>

                  <p className="text-sm">
                    <strong>Área:</strong>{" "}
                    {equipo.area || "Sin asignar"}
                  </p>

                </div>

                <div className="text-right">

                  <p className="text-sm text-gray-600">
                    Último mantenimiento
                  </p>

                  <p className="font-semibold">
                    {equipo.ultimo_mant
                      ? new Date(
                          equipo.ultimo_mant
                        ).toLocaleDateString("es-AR")
                      : "-"}
                  </p>

                  <p className="text-sm text-gray-600 mt-2">
                    Próximo mantenimiento
                  </p>

                  <p className="font-bold text-red-600">
                    {proximo.toLocaleDateString("es-AR")}
                  </p>

                  <p className="text-sm font-semibold text-red-600">
                    Vencido hace {diasVencido} días
                  </p>

                </div>

              </div>

              <button
               onClick={() => {
  setMostrarVencidos(false);
  buscarEquipo(equipo.numero_serie);
}}
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-xl"
              >
                Ver equipo
              </button>

            </div>
          );
        })}

      </div>
    )}

  </div>
)}

      <h1 className="text-xl font-bold mb-4">🔧 Búsqueda de Equipos</h1>

      {/* Input */}
      <div className="flex items-center gap-2">

  <input
    type="text"
    value={serie}
    onChange={(e) => {

  const valor = e.target.value;

  setSerie(valor);

  buscarCoincidencias(valor);

}}
    placeholder="Buscar equipo..."
    className="flex-1 border rounded px-3 py-2"
  />


 {/*<button
    type="button"
    onClick={() => setMostrarLector(true)}
    className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
    title="Escanear código QR o código de barras"
  >
    📷
  </button>*/}

</div>

      {/* Botón buscar */}
     <div className="flex gap-2">

  <button
    onClick={buscarEquipo}
    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-xl"
  >
    🔍 Buscar
  </button>

  <button
    onClick={() => setVista("nuevoEquipo")}
    className="bg-blue-600 text-white px-4 py-2 rounded-xl"
  >
    ➕ Nuevo
  </button>

</div>

      {/* Resultado */}

{localStorage.getItem("tareaActiva") && (
  <div className="bg-yellow-100 p-2 rounded mb-3">
    🔧 Iniciando mantenimiento desde tarea
  </div>
)}
         {coincidencias.length > 0 && (
  <div className="border rounded bg-white shadow max-h-64 overflow-y-auto mt-1">

    {coincidencias.map((item) => (

      <div
        key={item.id}
        onClick={() => {

          setSerie(item.numero_serie);

          setCoincidencias([]);

          buscarEquipo(item.numero_serie);

        }}
        className="p-2 border-b cursor-pointer hover:bg-blue-100"
      >

        <div className="font-semibold">
          {item.descripcion}
        </div>

        <div className="text-sm text-gray-600">
          {item.marca_modelo}
        </div>

        <div className="text-sm">
          Serie: <b>{item.numero_serie}</b>
        </div>

        <div className="text-xs text-gray-500">
          {item.servicio}
        </div>

      </div>

    ))}

  </div>
)}
      
{equipo && (
  <div className="bg-white shadow rounded-xl p-3 mt-3">

    <p><b>Equipo:</b> {equipo.descripcion}</p>
    <p><b>Marca:</b> {equipo.marca_modelo}</p>
    <p><b>Serie:</b> {equipo.numero_serie}</p>
    <p><b>Servicio:</b> {equipo.servicio}</p>
    <p><b>Área:</b> {equipo.area}</p>
    <p><b>Estado:</b> {equipo.estado}</p>

    {/* Fotografía */}
    <div className="mt-4 flex justify-center">

      {equipo.imagen ? (

        <img
          src={equipo.imagen}
          alt="Equipo"
          className="
            max-w-full
            w-96
            max-h-72
            object-contain
            rounded-lg
            border
            shadow
            cursor-pointer
          "
          onClick={() => window.open(equipo.imagen, "_blank")}
        />

      ) : (

        <div
          className="
            w-96
            h-60
            border-2
            border-dashed
            rounded-lg
            flex
            items-center
            justify-center
            text-gray-500
            bg-gray-100
          "
        >
          Sin fotografía
        </div>

      )}
 
    </div>

    <div className="mt-2">
      <div>
        <button
    onClick={() => inputImagenRef.current.click()}
    className="bg-blue-500 text-white px-4 py-2 rounded-xl w-full"
>
    📷 Imágen
</button>

        <button
  onClick={() => {
    localStorage.setItem(
      "equipoEditar",
      JSON.stringify(equipo)
    );

    setVista("nuevoEquipo");
  }}
  className="bg-orange-500 text-white px-4 py-2 rounded-xl w-full mt-2"
>
  ✏️ Editar equipo
</button>
        
      </div>
      <p className="text-sm font-semibold mb-1">
        Cambiar estado:
      </p>

      <select
        value={equipo.estado || ""}
        onChange={(e) => cambiarEstado(equipo.id, e.target.value)}
        className="w-full border rounded px-2 py-1 text-sm"
      >
        <option value="">Seleccionar estado</option>

        {estados.map((est) => (
          <option key={est.id} value={est.estado}>
            {est.estado}
          </option>
        ))}
      </select>
    </div>

    <p><b>Último mantenimiento preventivo:</b> {equipo.ultimo_mant}</p>
{equipo && (
  <div className="mt-5 bg-white rounded-xl shadow-md border p-4">

    <h2 className="text-lg font-bold mb-4">
      📊 Resumen del equipo
    </h2>

    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">

      <div className="bg-blue-50 rounded-lg p-3 text-center">
        <div className="text-2xl font-bold text-blue-700">
          {equipo.total_intervenciones}
        </div>
        <div className="text-xs text-gray-600">
          Intervenciones
        </div>
      </div>

      <div className="bg-red-50 rounded-lg p-3 text-center">
        <div className="text-2xl font-bold text-red-700">
          {equipo.correctivos}
        </div>
        <div className="text-xs">
          Correctivos
        </div>
      </div>

      <div className="bg-green-50 rounded-lg p-3 text-center">
        <div className="text-2xl font-bold text-green-700">
          {equipo.preventivos}
        </div>
        <div className="text-xs">
          Preventivos
        </div>
      </div>

      <div className="bg-yellow-50 rounded-lg p-3 text-center">
        <div className="text-2xl font-bold text-yellow-700">
          {equipo.calibraciones}
        </div>
        <div className="text-xs">
          Verificaciones
        </div>
      </div>

    </div>

    <div className="space-y-3">

      <div className="bg-gray-50 rounded-lg p-3">

        <div className="font-semibold">
          📅 Última intervención
        </div>

        <div>
          {equipo.ultima_fecha
            ? formatTimestamp(equipo.ultima_fecha)
            : "-"}
        </div>

      </div>

      <div className="bg-gray-50 rounded-lg p-3">

        <div className="font-semibold">
          👨‍🔧 Último técnico
        </div>

        <div>
          {equipo.ultimo_tecnico || "-"}
        </div>

      </div>

      <div className="bg-red-50 rounded-lg p-3">

        <div className="font-semibold text-red-700">
          🩺 Último diagnóstico
        </div>

        <div className="whitespace-pre-wrap">
          {equipo.ultimo_diagnostico || "-"}
        </div>

      </div>

      <div className="bg-green-50 rounded-lg p-3">

        <div className="font-semibold text-green-700">
          💡 Última solución
        </div>

        <div className="whitespace-pre-wrap">
          {equipo.ultima_solucion || "-"}
        </div>

      </div>

    </div>

  </div>
)}

     {equipo && (
  <button
    onClick={verHistorial}
    className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl w-full"
  >
    📋 Historial del equipo
  </button>
)}

    <button
  onClick={imprimirHistorial}
  className="mt-3 w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl"
>
  📄 Imprimir historial
</button>
    
    <button
  onClick={() => setMostrarForm(true)}
  className={`px-4 py-2 rounded-xl w-full mt-3 ${
    equipo.estado?.toLowerCase() !== "activo"
      ? "bg-yellow-500"
      : "bg-blue-500"
  } text-white`}
>
  {equipo.estado?.toLowerCase() !== "activo"
    ? "🔧 Continuar mantenimiento"
    : "🛠️ Iniciar mantenimiento"}

{equipo.estado?.toLowerCase() !== "activo" &&
  equipo.mantenimiento_id && (
    <div className="bg-yellow-50 border border-yellow-300 rounded p-2 mt-2 text-sm">
      <p>
        🔧 Mantenimiento abierto #{equipo.mantenimiento_id}
      </p>

      {equipo.tipo_mantenimiento && (
        <p>
          Tipo: {equipo.tipo_mantenimiento}
        </p>
      )}

      {equipo.diagnostico && (
        <p>
          Diagnóstico: {equipo.diagnostico}
        </p>
      )}
    </div>
)}
    </div>
    </button>
    <button
  onClick={abrirRIC37}
  disabled={!equipo.mantenimiento_id}
  className="px-4 py-2 rounded-xl w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
>
  ⚡ RIC37 - Seguridad eléctrica
</button>
)}

{/* Error */}
{error && (
  <p className="text-red-500 mt-3">{error}</p>
)}

     {mostrarForm && (
  <div className="bg-gray-100 p-3 rounded-xl mt-3">

     {/* NUEVO MANTENIMIENTO */}
    {!(
      equipo?.estado?.toLowerCase() !== "activo" &&
      equipo?.mantenimiento_id
    ) && (
      <select
        value={tipoMantenimiento}
        onChange={(e) => handleTipoChange(e.target.value)}
        className="w-full border p-2 rounded-xl mb-2"
      >
        <option value="">Seleccionar tipo</option>
        <option value="Correctivo">Correctivo</option>
        <option value="Preventivo">Preventivo</option>
        <option value="Verificación">Verificación</option>
      </select>
    )}

    {/* MANTENIMIENTO EXISTENTE */}
  {equipo?.estado?.toLowerCase() !== "activo" &&
  equipo?.mantenimiento_id && (
    <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-2">
      <p>
        🔧 Tipo de mantenimiento:
        <strong> {equipo.tipo_mantenimiento}</strong>
      </p>

      {equipo.diagnostico && (
        <p className="mt-1">
          📋 Diagnóstico:
          <strong> {equipo.diagnostico}</strong>
        </p>
      )}

      {equipo.fecha_inicio && (
        <p className="mt-1 text-sm text-gray-600">
          📅 Iniciado:
          <strong> {formatTimestamp(equipo.fecha_inicio)}</strong>
        </p>
      )}
    </div>
)}

   {/* Diagnóstico SOLO para mantenimiento NUEVO correctivo */}
{!(
  equipo?.estado?.toLowerCase() !== "activo" &&
  equipo?.mantenimiento_id
) && tipoMantenimiento === "Correctivo" && (
  <select
    value={diagnosticoSeleccionado}
    onChange={(e) => setDiagnosticoSeleccionado(e.target.value)}
    className="w-full border p-2 rounded-xl mb-2"
  >
    <option value="">Seleccionar diagnóstico</option>

    {diagnosticos.map((d, i) => (
      <option key={i} value={d.diagnostico}>
        {d.diagnostico}
      </option>
    ))}
  </select>
)}
    {/*<textarea
  placeholder="Observaciones"
  value={observaciones}
  onChange={(e) => setObservaciones(e.target.value)}
  className="w-full border p-2 rounded-xl mb-2"
/>*/}

    {/*<button
  onClick={() => setMostrarFinalizar(true)}
  className="bg-red-500 text-white px-4 py-2 rounded-xl w-full mt-2"
>
  ✅ Finalizar mantenimiento
</button>*/}
    <button
      onClick={guardarMantenimiento}
      className="bg-green-500 text-white px-4 py-2 rounded-xl w-full"
    >
      💾 Guardar
    </button>
  </div>
  
)}

      {mostrarHistorial && (
  <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">

    <div className="bg-white rounded-xl shadow-xl w-11/12 max-w-6xl max-h-[85vh] overflow-hidden">

      <div className="flex justify-between items-center p-4 border-b">

        <h2 className="text-xl font-bold">
          📋 Historial del equipo
        </h2>
<div className="flex flex-wrap gap-3 p-3 border-b text-sm">

  <div className="flex items-center gap-2">
    <div className="w-4 h-4 bg-red-50 border rounded"></div>
    <span>Correctivo</span>
  </div>

  <div className="flex items-center gap-2">
    <div className="w-4 h-4 bg-green-50 border rounded"></div>
    <span>Preventivo</span>
  </div>

  <div className="flex items-center gap-2">
    <div className="w-4 h-4 bg-yellow-50 border rounded"></div>
    <span>Verificación</span>
  </div>

  <div className="flex items-center gap-2">
    <div className="w-4 h-4 bg-blue-50 border rounded"></div>
    <span>Instalación</span>
  </div>

</div>

        <button
  onClick={imprimirHistorial}
  className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg"
>
  📄 Imprimir PDF
</button>
        
        <button
          onClick={() => setMostrarHistorial(false)}
          className="text-red-600 font-bold"
        >
          ✖
        </button>

      </div>

      <div className="overflow-auto max-h-[70vh]">
       <div className="max-h-[70vh] overflow-y-auto p-4 space-y-4">

  {historial.map((h) => {

    let color = "border-gray-300";
    let icono = "⚪";

    switch ((h.tipo_mantenimiento || "").toLowerCase()) {

      case "correctivo":
        color = "border-red-500";
        icono = "🔴";
        break;

      case "preventivo":
        color = "border-green-500";
        icono = "🟢";
        break;

      case "calibración":
      case "calibracion":
        color = "border-yellow-500";
        icono = "🟡";
        break;

      case "instalación":
      case "instalacion":
        color = "border-blue-500";
        icono = "🔵";
        break;

    }

    return (

      <div
        key={h.id}
        className={`border-l-8 ${color} bg-white rounded-lg shadow p-4`}
      >

       <div className="flex justify-between items-center">

  <h3 className="font-bold text-lg flex items-center gap-2">

    {icono}

    {h.tipo_mantenimiento || "Sin tipo"}

    {h.fin && (
      <span
        className="text-green-600 text-xl"
        title="Tarea finalizada"
      >
        ✅
      </span>
    )}

  </h3>

  <span className="text-sm text-gray-500">
    {formatTimestamp(h.fecha)}
  </span>

</div>

        <div className="mt-3 text-sm space-y-2">

          <p>
            👤 <strong>Solicitado por:</strong>{" "}
            {h.solicitado_por || h.usuario}
          </p>

          <p>
            👨‍🔧 <strong>Técnico:</strong>{" "}
            {h.asignado || "-"}
          </p>

          {h.diagnostico && (
            <div className="bg-red-50 rounded p-3">

              <strong>🩺 Diagnóstico</strong>

              <p className="mt-1 whitespace-pre-wrap">
                {h.diagnostico}
              </p>

            </div>
          )}

          {h.solucion && (
            <div className="bg-green-50 rounded p-3">

              <strong>💡 Solución</strong>

              <p className="mt-1 whitespace-pre-wrap">
                {h.solucion}
              </p>

            </div>
          )}

          {h.observacion && (
            <div className="bg-blue-50 rounded p-3">

              <strong>📝 Observaciones</strong>

              <p className="mt-1 whitespace-pre-wrap">
                {h.observacion}
              </p>

            </div>
          )}

          {h.calificacion && (
            <p>
              ⭐ <strong>Calificación:</strong> {h.calificacion}
            </p>
          )}

        </div>

      </div>

    );

  })}

</div>
      </div>
    </div>
  </div>
)}

      {mostrarFinalizar && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-5 rounded-xl shadow-xl w-96">

      <h2 className="text-lg font-bold mb-4">
        Finalizar mantenimiento
      </h2>

      <p className="mb-2">
        ¿En qué estado queda el equipo?
      </p>

      <select
        value={estadoFinal}
        onChange={(e) => setEstadoFinal(e.target.value)}
        className="w-full border p-2 rounded mb-4"
      >
        <option value="">
          Seleccionar estado
        </option>

        {estados.map((est) => (
          <option
            key={est.id}
            value={est.estado}
          >
            {est.estado}
          </option>
        ))}
      </select>

      <div className="flex gap-2">

        <button
          onClick={() => {
            setMostrarFinalizar(false);
            setEstadoFinal("");
          }}
          className="flex-1 bg-gray-500 text-white py-2 rounded"
        >
          Cancelar
        </button>

        <button
          onClick={finalizarMantenimiento}
          className="flex-1 bg-green-600 text-white py-2 rounded"
        >
          Confirmar
        </button>

      </div>

    </div>
  </div>
)}

      {/* Volver */}
      <button
        onClick={() => setVista("tareas")}
        className="bg-gray-400 text-white px-4 py-2 rounded-xl w-full mt-4"
      >
        ← Volver
      </button>
      
      <input
    ref={inputImagenRef}
    type="file"
    accept="image/*"
    capture="environment"
    style={{ display: "none" }}
    onChange={subirImagen}
/>
     {/* <LectorQR
  abierto={mostrarLector}
  onCerrar={() => setMostrarLector(false)}
  onDetectar={(codigo) => {

    console.log("Código leído:", codigo);

    buscarEquipo(codigo);

  }}
/> */}
    </div>
  );
}
