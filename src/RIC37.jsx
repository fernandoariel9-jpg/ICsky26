import { useState, useEffect } from "react";
import { API_URL } from "./config";

export default function RIC37({ setVista, personal }) {

  // =====================================================
  // ETAPAS
  // =====================================================

  const etapas = [
    "Clasificación",
    "Mediciones",
    "Determinaciones",
    "Partes aplicables",
    "Resumen"
  ];

  const [etapa, setEtapa] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [ric37Id, setRic37Id] = useState(null);

  // =====================================================
  // DATOS DEL EQUIPO / MANTENIMIENTO
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
  // DATOS GENERALES DEL ENSAYO
  // =====================================================

  const [clase, setClase] = useState("");
  const [tipoProteccion, setTipoProteccion] = useState("");
  const [medicionTension, setMedicionTension] = useState("");
  const [medicionCorriente, setMedicionCorriente] = useState("");
  const [indicaciones, setIndicaciones] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [firmaTecnico, setFirmaTecnico] = useState("");
  const [firmaResponsable, setFirmaResponsable] = useState("");

  // =====================================================
  // DETERMINACIONES 1, 2 Y 3
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
  // CARGAR DATOS
  // =====================================================

  useEffect(() => {

    const cargarDatos = async () => {

      try {

        const tareaGuardada =
          localStorage.getItem("tareaActiva");

        if (!tareaGuardada) {
          throw new Error("No existe un mantenimiento activo.");
        }

        const tarea = JSON.parse(tareaGuardada);
        let equipo = null;

        if (tarea.numero_serie) {

          const res = await fetch(
            `${API_URL.BuscarEquipo}/${encodeURIComponent(
              tarea.numero_serie
            )}`
          );

          if (res.ok) {
            equipo = await res.json();
          }
        }

        setDatos({
          ric01_id:
            tarea.ric01_id || tarea.id || "",
          equipo_id:
            equipo?.id || tarea.equipo_id || "",
          numero_serie:
            equipo?.numero_serie || tarea.numero_serie || "",
          descripcion:
            equipo?.descripcion || tarea.descripcion || "",
          marca_modelo:
            equipo?.marca_modelo || tarea.marca_modelo || "",
          area:
            equipo?.area || tarea.area || "",
          servicio:
            equipo?.servicio || tarea.servicio || "",
          sub_servicio:
            equipo?.sub_servicio ||
            tarea.sub_servicio ||
            tarea.subservicio ||
            "",
          encargado:
            equipo?.encargado || tarea.encargado || "",
          tecnico:
            personal?.nombre ||
            tarea.usuario ||
            tarea.asignado ||
            tarea.tecnico ||
            ""
        });

      } catch (err) {

        console.error("Error cargando datos RIC37:", err);

        setError(
          err.message ||
          "No se pudieron cargar los datos del equipo."
        );

      } finally {
        setCargando(false);
      }
    };

    cargarDatos();

  }, [personal]);

  // =====================================================
  // CONFORMIDAD
  // =====================================================

  const calcularConformidad = (medicion, rango) => {

    if (medicion === "" || medicion === null || medicion === undefined) {
      return null;
    }

    const valor = Number(
      String(medicion).replace(",", ".")
    );

    if (Number.isNaN(valor)) {
      return null;
    }

    return valor <= rango;
  };

  // =====================================================
  // CAMBIAR DETERMINACIÓN
  // =====================================================

  const cambiarDeterminacion = (index, campo, valor) => {

    setDeterminaciones((actuales) =>
      actuales.map((item, i) =>
        i === index
          ? { ...item, [campo]: valor }
          : item
      )
    );
  };

  const cambiarMedicionDeterminacion = (index, valor) => {

    setDeterminaciones((actuales) =>
      actuales.map((item, i) => {

        if (i !== index) {
          return item;
        }

        return {
          ...item,
          medicion: valor,
          conforme: calcularConformidad(valor, item.rango)
        };
      })
    );
  };

  // =====================================================
  // DETERMINACIÓN 4
  // =====================================================

  const cambiarMedicionPartes = (id, campo, valor) => {

    setMedicionesPartesAplicables((actuales) =>
      actuales.map((item) => {

        if (item.id !== id) {
          return item;
        }

        const actualizado = {
          ...item,
          [campo]: valor
        };

        if (campo === "medicion") {
          actualizado.conforme = calcularConformidad(valor, 0.3);
        }

        return actualizado;
      })
    );
  };

  const agregarMedicionPartes = () => {

    setMedicionesPartesAplicables((actuales) => [
      ...actuales,
      {
        id: Date.now(),
        medicion: "",
        observaciones: "",
        conforme: null,
        noAplica: false
      }
    ]);
  };

  const eliminarMedicionPartes = (id) => {

    if (medicionesPartesAplicables.length === 1) {
      return;
    }

    setMedicionesPartesAplicables((actuales) =>
      actuales.filter((item) => item.id !== id)
    );
  };

  // =====================================================
  // RESULTADOS NO CONFORMES
  // =====================================================

  const obtenerNoConformes = () => {

    const resultados = [];

    determinaciones.forEach((item) => {

      if (item.conforme === false && !item.noAplica) {
        resultados.push({
          etapa: "Determinaciones",
          medicion: `${item.numero} - ${item.nombre}`,
          resultado: item.medicion,
          rango: `≤ ${item.rango}`
        });
      }
    });

    medicionesPartesAplicables.forEach((item, index) => {

      if (item.conforme === false && !item.noAplica) {
        resultados.push({
          etapa: "Partes aplicables",
          medicion: `Medición ${index + 1}`,
          resultado: item.medicion,
          rango: "≤ 0.3"
        });
      }
    });

    return resultados;
  };

  // =====================================================
  // VALIDAR ETAPA
  // =====================================================

  const validarDeterminaciones = () => {

    return determinaciones.every((item) =>
      item.noAplica ||
      (item.medicion !== "" && item.conforme !== null)
    );
  };

  const validarPartesAplicables = () => {

    return medicionesPartesAplicables.every((item) =>
      item.noAplica ||
      (item.medicion !== "" && item.conforme !== null)
    );
  };

  // =====================================================
  // NAVEGACIÓN
  // =====================================================

  const volver = () => {

    if (etapa === 0) {
      setVista("equipos");
      return;
    }

    setEtapa((prev) => prev - 1);
  };

  const continuar = () => {

    if (etapa === 2 && !validarDeterminaciones()) {
      alert("Complete todas las determinaciones antes de continuar.");
      return;
    }

    if (etapa === 3 && !validarPartesAplicables()) {
      alert("Complete todas las mediciones antes de continuar.");
      return;
    }

    setEtapa((prev) => prev + 1);
  };

  // =====================================================
  // GUARDAR
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

    if (!validarDeterminaciones()) {
      return "Complete las determinaciones antes de guardar.";
    }

    if (!validarPartesAplicables()) {
      return "Complete las mediciones de partes aplicables antes de guardar.";
    }

    return null;
  };

  const guardar = async () => {

    const mensaje = validarFormulario();

    if (mensaje) {
      alert(mensaje);
      return;
    }

    try {

      setGuardando(true);
      setError("");

      const noConformes = obtenerNoConformes();

      const payload = {
        ric01_id: datos.ric01_id,
        equipo_id: datos.equipo_id,
        numero_serie: datos.numero_serie,
        descripcion: datos.descripcion,
        marca_modelo: datos.marca_modelo,
        area: datos.area,
        servicio: datos.servicio,
        sub_servicio: datos.sub_servicio,
        tecnico: datos.tecnico,
        clase,
        tipo_proteccion: tipoProteccion,
        medicion_tension: medicionTension,
        medicion_corriente: medicionCorriente,
        indicaciones,
        determinaciones,
        mediciones_partes_aplicables: medicionesPartesAplicables,
        resultado_general:
          noConformes.length === 0
            ? "CONFORME"
            : "NO CONFORME",
        observaciones,
        firma_tecnico: firmaTecnico,
        firma_responsable: firmaResponsable
      };

      const respuesta = await fetch(
        `${API_URL.Base}/api/ric37`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        }
      );

      const data = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          data.error || "Error guardando RIC37"
        );
      }

      setRic37Id(
        data.ric37_id || data.id || null
      );

      alert("RIC37 guardado correctamente ✅");

    } catch (err) {

      console.error("ERROR GUARDANDO RIC37:", err);

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
  // PROGRESO
  // =====================================================

  const progreso =
    ((etapa + 1) / etapas.length) * 100;

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

  if (error && !datos.ric01_id) {

    return (
      <div className="p-6 max-w-xl mx-auto">

        <div className="bg-red-100 text-red-700 p-4 rounded-xl">
          ⚠️ {error}
        </div>

        <button
          onClick={salir}
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

            <p className="font-bold">
              RIC37 - Seguridad eléctrica
            </p>

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
              style={{ width: `${progreso}%` }}
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
                <b>Serie:</b> {datos.numero_serie}
              </p>

              <p>
                <b>Área:</b> {datos.area}
              </p>

              <p>
                <b>Servicio:</b> {datos.servicio}
              </p>

            </div>

          </div>

        </div>

        {/* =================================================
            ETAPA 1 - CLASIFICACIÓN
        ================================================= */

        {etapa === 0 && (

          <div className="bg-white rounded-xl shadow p-4">

            <h2 className="text-xl font-bold mb-2">
              1. Clasificación del equipo
            </h2>

            <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3 mb-4">
              Seleccionar la clase y el tipo de protección correspondiente al equipo bajo ensayo.
            </p>

            <div className="grid grid-cols-2 gap-4">

              <div>
                <label className="font-semibold block mb-1">
                  CLASE
                </label>

                <select
                  value={clase}
                  onChange={(e) => setClase(e.target.value)}
                  className="w-full border rounded-xl p-3"
                >
                  <option value="">Seleccionar</option>
                  <option value="CLASE I">CLASE I</option>
                  <option value="CLASE II">CLASE II</option>
                  <option value="CLASE III">CLASE III</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">
                  TIPO DE PROTECCIÓN
                </label>

                <select
                  value={tipoProteccion}
                  onChange={(e) => setTipoProteccion(e.target.value)}
                  className="w-full border rounded-xl p-3"
                >
                  <option value="">Seleccionar</option>
                  <option value="TIPO B">TIPO B</option>
                  <option value="TIPO BF">TIPO BF</option>
                  <option value="TIPO CF">TIPO CF</option>
                </select>
              </div>

            </div>

            <div className="flex gap-2 mt-6">

              <button
                onClick={salir}
                className="flex-1 bg-gray-500 text-white rounded-xl p-3"
              >
                ← Volver
              </button>

              <button
                onClick={continuar}
                disabled={!clase || !tipoProteccion}
                className="flex-1 bg-blue-600 disabled:bg-gray-300 text-white rounded-xl p-3"
              >
                Continuar →
              </button>

            </div>

          </div>

        )}

        {/* =================================================
            ETAPA 2 - MEDICIONES
        ================================================= */

        {etapa === 1 && (

          <div className="bg-white rounded-xl shadow p-4">

            <h2 className="text-xl font-bold mb-2">
              2. Mediciones
            </h2>

            <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3 mb-4">
              Registrar las mediciones generales realizadas durante el ensayo de seguridad eléctrica.
            </p>

            <div className="grid grid-cols-2 gap-4">

              <div>
                <label className="font-semibold block mb-2">
                  MEDICIÓN DE TENSIÓN
                </label>

                <input
                  type="text"
                  value={medicionTension}
                  onChange={(e) => setMedicionTension(e.target.value)}
                  className="w-full border rounded-xl p-3 text-lg"
                />
              </div>

              <div>
                <label className="font-semibold block mb-2">
                  MEDICIÓN DE CORRIENTE
                </label>

                <input
                  type="text"
                  value={medicionCorriente}
                  onChange={(e) => setMedicionCorriente(e.target.value)}
                  className="w-full border rounded-xl p-3 text-lg"
                />
              </div>

            </div>

            <div className="flex gap-2 mt-6">

              <button
                onClick={volver}
                className="flex-1 bg-gray-500 text-white rounded-xl p-3"
              >
                ← Volver
              </button>

              <button
                onClick={continuar}
                className="flex-1 bg-blue-600 text-white rounded-xl p-3"
              >
                Continuar →
              </button>

            </div>

          </div>

        )}

        {/* =================================================
            ETAPA 3 - DETERMINACIONES
        ================================================= */

        {etapa === 2 && (

          <div className="bg-white rounded-xl shadow p-4">

            <h2 className="text-xl font-bold mb-2">
              3. Determinaciones
            </h2>

            <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3 mb-4">
              Registrar cada medición y verificar su rango de aceptación. Cuando corresponda, utilizar la casilla No aplica.
            </p>

            <div className="space-y-4">

              {determinaciones.map((item, index) => (

                <div
                  key={item.numero}
                  className="border rounded-xl p-4"
                >

                  <h3 className="font-bold mb-3">
                    {item.numero}. {item.nombre}
                  </h3>

                  <label className="font-semibold block mb-2">
                    Medición
                  </label>

                  <input
                    type="text"
                    value={item.medicion}
                    disabled={item.noAplica}
                    onChange={(e) =>
                      cambiarMedicionDeterminacion(
                        index,
                        e.target.value
                      )
                    }
                    className={`w-full border rounded-xl p-3 text-lg ${
                      item.conforme === true
                        ? "bg-green-100 border-green-500"
                        : item.conforme === false
                        ? "bg-red-100 border-red-500"
                        : ""
                    }`}
                  />

                  <p className="text-sm mt-2">
                    Rango de aceptación: <b>≤ {item.rango}</b>
                  </p>

                  <div className="flex items-center justify-between mt-4 gap-3">

                    <div className="flex gap-2">

                      <button
                        type="button"
                        disabled={item.noAplica}
                        onClick={() =>
                          cambiarDeterminacion(
                            index,
                            "conforme",
                            true
                          )
                        }
                        className={`px-3 py-2 rounded-xl ${
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
                          cambiarDeterminacion(
                            index,
                            "conforme",
                            false
                          )
                        }
                        className={`px-3 py-2 rounded-xl ${
                          item.conforme === false
                            ? "bg-red-600 text-white"
                            : "bg-gray-200"
                        }`}
                      >
                        No conforme
                      </button>

                    </div>

                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={item.noAplica}
                        onChange={(e) => {
                          const marcado = e.target.checked;
                          cambiarDeterminacion(
                            index,
                            "noAplica",
                            marcado
                          );
                          cambiarDeterminacion(
                            index,
                            "conforme",
                            null
                          );
                        }}
                      />
                      No aplica
                    </label>

                  </div>

                </div>

              ))}

            </div>

            <div className="flex gap-2 mt-6">

              <button
                onClick={volver}
                className="flex-1 bg-gray-500 text-white rounded-xl p-3"
              >
                ← Volver
              </button>

              <button
                onClick={continuar}
                className="flex-1 bg-blue-600 text-white rounded-xl p-3"
              >
                Continuar →
              </button>

            </div>

          </div>

        )}

        {/* =================================================
            ETAPA 4 - PARTES APLICABLES
        ================================================= */

        {etapa === 3 && (

          <div className="bg-white rounded-xl shadow p-4">

            <h2 className="text-xl font-bold mb-2">
              4. Corriente de fuga de partes aplicables
            </h2>

            <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3 mb-4">
              Registrar las mediciones correspondientes a las partes aplicables. Cada medición puede incluir observaciones.
            </p>

            <div className="space-y-4">

              {medicionesPartesAplicables.map((item, index) => (

                <div
                  key={item.id}
                  className="border rounded-xl p-4"
                >

                  <div className="flex justify-between items-center mb-3">

                    <h3 className="font-bold">
                      Medición {index + 1}
                    </h3>

                    {medicionesPartesAplicables.length > 1 && (
                      <button
                        type="button"
                        onClick={() => eliminarMedicionPartes(item.id)}
                        className="text-red-600 text-sm font-semibold"
                      >
                        Eliminar
                      </button>
                    )}

                  </div>

                  <label className="font-semibold block mb-2">
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
                    className={`w-full border rounded-xl p-3 text-lg ${
                      item.conforme === true
                        ? "bg-green-100 border-green-500"
                        : item.conforme === false
                        ? "bg-red-100 border-red-500"
                        : ""
                    }`}
                  />

                  <p className="text-sm mt-2">
                    Rango de aceptación: <b>≤ 0.3</b>
                  </p>

                  <label className="font-semibold block mt-4 mb-2">
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
                    className="w-full border rounded-xl p-3"
                    rows={3}
                    placeholder="Observaciones de esta medición..."
                  />

                  <div className="flex items-center justify-between mt-4 gap-3">

                    <div className="flex gap-2">

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
                        className={`px-3 py-2 rounded-xl ${
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
                        className={`px-3 py-2 rounded-xl ${
                          item.conforme === false
                            ? "bg-red-600 text-white"
                            : "bg-gray-200"
                        }`}
                      >
                        No conforme
                      </button>

                    </div>

                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={item.noAplica}
                        onChange={(e) => {
                          const marcado = e.target.checked;
                          cambiarMedicionPartes(
                            item.id,
                            "noAplica",
                            marcado
                          );
                          cambiarMedicionPartes(
                            item.id,
                            "conforme",
                            null
                          );
                        }}
                      />
                      No aplica
                    </label>

                  </div>

                </div>

              ))}

            </div>

            <button
              type="button"
              onClick={agregarMedicionPartes}
              className="w-full bg-blue-600 text-white rounded-xl p-3 mt-4"
            >
              ➕ Agregar medición
            </button>

            <div className="flex gap-2 mt-6">

              <button
                onClick={volver}
                className="flex-1 bg-gray-500 text-white rounded-xl p-3"
              >
                ← Volver
              </button>

              <button
                onClick={continuar}
                className="flex-1 bg-blue-600 text-white rounded-xl p-3"
              >
                Ver resumen →
              </button>

            </div>

          </div>

        )}

        {/* =================================================
            ETAPA 5 - RESUMEN
        ================================================= */

        {etapa === 4 && (

          <div className="bg-white rounded-xl shadow p-4">

            <h2 className="text-xl font-bold mb-4">
              5. Resumen del ensayo
            </h2>

            {obtenerNoConformes().length === 0 ? (

              <div className="bg-green-100 text-green-800 rounded-xl p-4 mb-5">

                <p className="font-bold text-lg">
                  ✅ ENSAYO CONFORME
                </p>

                <p className="text-sm mt-1">
                  Todas las determinaciones realizadas se encuentran dentro de los rangos de aceptación.
                </p>

              </div>

            ) : (

              <div className="bg-red-100 text-red-800 rounded-xl p-4 mb-5">

                <p className="font-bold text-lg mb-3">
                  ❌ ENSAYO NO CONFORME
                </p>

                <div className="space-y-3">

                  {obtenerNoConformes().map((item, index) => (

                    <div
                      key={index}
                      className="bg-white rounded-lg p-3"
                    >

                      <p className="font-bold">
                        {item.etapa}
                      </p>

                      <p>
                        <b>Medición:</b> {item.medicion}
                      </p>

                      <p>
                        <b>Resultado:</b> {item.resultado}
                      </p>

                      <p>
                        <b>Rango:</b> {item.rango}
                      </p>

                    </div>

                  ))}

                </div>

              </div>

            )}

            <div className="bg-gray-50 rounded-xl p-4 mb-4">

              <p className="font-bold mb-2">
                Clasificación del equipo
              </p>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <p>
                  <b>Clase:</b> {clase || "-"}
                </p>
                <p>
                  <b>Protección:</b> {tipoProteccion || "-"}
                </p>
                <p>
                  <b>Tensión:</b> {medicionTension || "-"}
                </p>
                <p>
                  <b>Corriente:</b> {medicionCorriente || "-"}
                </p>
              </div>

            </div>

            {indicaciones.trim() && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                <h3 className="font-bold mb-2">
                  Indicaciones
                </h3>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {indicaciones}
                </p>
              </div>
            )}

            <label className="font-semibold block mb-2">
              Observaciones generales
            </label>

            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={5}
              placeholder="Ingrese aquí las observaciones del ensayo..."
              className="w-full border rounded-xl p-3"
            />

            <div className="bg-gray-50 rounded-xl p-4 mt-4">

              <h3 className="font-bold mb-3">
                Firmas
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                <input
                  type="text"
                  value={firmaTecnico}
                  onChange={(e) => setFirmaTecnico(e.target.value)}
                  placeholder="Firma / Técnico responsable"
                  className="w-full border rounded-xl p-3"
                />

                <input
                  type="text"
                  value={firmaResponsable}
                  onChange={(e) => setFirmaResponsable(e.target.value)}
                  placeholder="Firma / Responsable"
                  className="w-full border rounded-xl p-3"
                />

              </div>

            </div>

            {error && (
              <div className="bg-red-100 text-red-700 p-3 rounded-xl mt-4">
                ⚠️ {error}
              </div>
            )}

            <div className="flex gap-2 mt-6">

              <button
                onClick={volver}
                className="flex-1 bg-gray-500 text-white rounded-xl p-3"
              >
                ← Volver
              </button>

              <button
                onClick={salir}
                className="flex-1 bg-gray-600 text-white rounded-xl p-3"
              >
                🚪 Salir
              </button>

            </div>

            <button
              disabled={guardando || !!ric37Id}
              onClick={guardar}
              className="w-full bg-green-600 disabled:bg-gray-400 text-white rounded-xl p-3 mt-3 font-bold"
            >
              {guardando
                ? "Guardando..."
                : ric37Id
                ? "✅ RIC37 guardado"
                : "💾 Guardar RIC37"}
            </button>

          </div>

        )}

      </div>

    </div>
  );
}
