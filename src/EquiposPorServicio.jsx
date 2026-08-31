import { useEffect, useMemo, useState } from "react";
import { API_URL } from "./config";

export default function EquiposPorServicio({ personal, buscarEquipo, onCerrar }) {
  const [equipos, setEquipos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [serviciosAbiertos, setServiciosAbiertos] = useState({});
  const [subserviciosAbiertos, setSubserviciosAbiertos] = useState({});

  useEffect(() => {
    cargarEquipos();
  }, [personal?.area]);

  const cargarEquipos = async () => {
    try {
      setCargando(true);
      setError("");

      const res = await fetch(API_URL.Equipos);

      if (!res.ok) {
        throw new Error("No se pudieron obtener los equipos");
      }

      const data = await res.json();
      const lista = Array.isArray(data) ? data : data.equipos || [];
      const areaPersonal = (personal?.area || "").trim().toLowerCase();

      const filtrados = lista.filter((equipo) => {
        const areaEquipo = (equipo.area || "").trim().toLowerCase();
        return areaEquipo === areaPersonal;
      });

      setEquipos(filtrados);

      const serviciosIniciales = {};
      filtrados.forEach((equipo) => {
        const servicio = normalizarNombre(equipo.servicio, "Sin servicio");
        serviciosIniciales[servicio] = true;
      });
      setServiciosAbiertos(serviciosIniciales);
    } catch (err) {
      console.error("Error cargando equipos por servicio:", err);
      setError("No se pudieron cargar los equipos.");
    } finally {
      setCargando(false);
    }
  };

  const agrupados = useMemo(() => {
    const resultado = {};

    equipos.forEach((equipo) => {
      const servicio = normalizarNombre(equipo.servicio, "Sin servicio");
      const subservicio = normalizarNombre(
        equipo.sub_servicio ?? equipo.subservicio,
        "Sin subservicio"
      );

      if (!resultado[servicio]) {
        resultado[servicio] = {};
      }

      if (!resultado[servicio][subservicio]) {
        resultado[servicio][subservicio] = [];
      }

      resultado[servicio][subservicio].push(equipo);
    });

    return resultado;
  }, [equipos]);

  const totalServicios = Object.keys(agrupados).length;

  const toggleServicio = (servicio) => {
    setServiciosAbiertos((prev) => ({
      ...prev,
      [servicio]: !prev[servicio],
    }));
  };

  const toggleSubservicio = (clave) => {
    setSubserviciosAbiertos((prev) => ({
      ...prev,
      [clave]: !prev[clave],
    }));
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            Equipos por servicio
          </h2>
          <p className="text-sm text-gray-500">
            Área: {personal?.area || "Sin área"} · {equipos.length} equipos · {totalServicios} servicios
          </p>
        </div>

        {onCerrar && (
          <button
            onClick={onCerrar}
            className="text-gray-500 hover:text-gray-800 font-bold"
          >
            ✕
          </button>
        )}
      </div>

      {cargando && (
        <p className="text-gray-500 font-semibold">
          Consultando equipos...
        </p>
      )}

      {!cargando && error && (
        <div className="text-red-600 font-semibold">
          <p>{error}</p>
          <button
            onClick={cargarEquipos}
            className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl"
          >
            Reintentar
          </button>
        </div>
      )}

      {!cargando && !error && equipos.length === 0 && (
        <p className="text-green-600 font-semibold">
          ✓ No hay equipos registrados para esta área.
        </p>
      )}

      {!cargando && !error && equipos.length > 0 && (
        <div className="space-y-3">
          {Object.entries(agrupados)
            .sort(([a], [b]) => a.localeCompare(b, "es", { sensitivity: "base" }))
            .map(([servicio, subservicios]) => {
              const cantidadServicio = Object.values(subservicios).reduce(
                (total, lista) => total + lista.length,
                0
              );
              const servicioAbierto = serviciosAbiertos[servicio] !== false;

              return (
                <div key={servicio} className="border rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleServicio(servicio)}
                    className="w-full bg-gray-100 hover:bg-gray-200 px-4 py-3 flex justify-between items-center text-left"
                  >
                    <span className="font-bold text-gray-800">
                      {servicio}
                    </span>
                    <span className="font-bold text-gray-600">
                      {cantidadServicio} {servicioAbierto ? "▲" : "▼"}
                    </span>
                  </button>

                  {servicioAbierto && (
                    <div className="p-3 space-y-2">
                      {Object.entries(subservicios)
                        .sort(([a], [b]) => a.localeCompare(b, "es", { sensitivity: "base" }))
                        .map(([subservicio, lista]) => {
                          const clave = `${servicio}::${subservicio}`;
                          const abierto = subserviciosAbiertos[clave] === true;

                          return (
                            <div key={clave} className="border rounded-lg">
                              <button
                                onClick={() => toggleSubservicio(clave)}
                                className="w-full px-3 py-2 flex justify-between items-center text-left bg-white hover:bg-gray-50"
                              >
                                <span className="font-semibold text-gray-700">
                                  {subservicio}
                                </span>
                                <span className="text-sm font-bold text-gray-500">
                                  {lista.length} {abierto ? "▲" : "▼"}
                                </span>
                              </button>

                              {abierto && (
                                <div className="p-3 space-y-2 bg-gray-50">
                                  {lista
                                    .slice()
                                    .sort((a, b) =>
                                      String(a.descripcion || "").localeCompare(
                                        String(b.descripcion || ""),
                                        "es",
                                        { sensitivity: "base" }
                                      )
                                    )
                                    .map((equipo) => (
                                      <div
                                        key={equipo.id}
                                        className="border rounded-xl p-3 bg-white"
                                      >
                                        <div className="flex justify-between items-start gap-3">
                                          <div>
                                            <p className="font-bold text-gray-800">
                                              {equipo.descripcion || "Sin descripción"}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                              {equipo.marca_modelo || "Sin marca/modelo"}
                                            </p>
                                            <p className="text-sm text-gray-700">
                                              <strong>Nº serie:</strong>{" "}
                                              {equipo.numero_serie || "-"}
                                            </p>
                                          </div>

                                          <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">
                                            #{equipo.id}
                                          </span>
                                        </div>

                                        {buscarEquipo && equipo.numero_serie && (
                                          <button
                                            onClick={() => buscarEquipo(equipo.numero_serie)}
                                            className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-xl"
                                          >
                                            Ver equipo
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}

function normalizarNombre(valor, porDefecto) {
  const texto = String(valor || "").trim();
  return texto || porDefecto;
}
