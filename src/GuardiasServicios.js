import React, { useState } from "react";

const SERVICIOS = [
  "Servicio de Terapía Intensiva Adultos",
  "Cardiología",
  "Servicio Médico de Urgencias",
  "Servicio Médico de Urgencias Pediátrica",
  "Servicio Médico de Urgencias RX",
  "Terapias Pediatría",
  "Terapias Neonatología",
  "Hemodiálisis",
  "Rayos X Central",
  "Resonancia",
  "Tomografía",
];

export default function GuardiasServicios({ personalId, onConfirmar }) {
  const [visitas, setVisitas] = useState({});
  const [guardando, setGuardando] = useState(false);

  const handleCheck = (servicio, checked) => {
    const ahora = new Date().toISOString();

    setVisitas((prev) => ({
      ...prev,
      [servicio]: {
        ...prev[servicio],
        realizado: checked,
        fechaHora: checked ? ahora : null,
      },
    }));
  };

  const handleObsChange = (servicio, value) => {
    setVisitas((prev) => ({
      ...prev,
      [servicio]: {
        ...prev[servicio],
        observaciones: value,
      },
    }));
  };

  const confirmarVisitas = async () => {
    const visitasRealizadas = Object.entries(visitas).filter(
      ([, data]) => data.realizado
    );

    if (visitasRealizadas.length === 0) {
      alert("No seleccionaste ningún servicio");
      return;
    }

    setGuardando(true);

    try {
      for (const [servicio, data] of visitasRealizadas) {
        await fetch("/api/guardias", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            personal_id: personalId,
            servicio,
            fecha_hora: data.fechaHora,
            observaciones: data.observaciones || "",
          }),
        });
      }

      onConfirmar();
    } catch (error) {
      console.error("Error guardando guardias", error);
      alert("Error al guardar las visitas");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-2 text-sm">
      <h2 className="text-lg font-semibold mb-2">
        Servicios a Visitar
      </h2>

      {SERVICIOS.map((servicio) => {
        const visita = visitas[servicio];

        return (
          <div
            key={servicio}
            className="border rounded-md px-2 py-1"
          >
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={visita?.realizado || false}
                onChange={(e) =>
                  handleCheck(servicio, e.target.checked)
                }
              />

              <span className="flex-1 truncate">
                {servicio}
              </span>

              {visita?.fechaHora && (
                <span className="text-xs text-gray-500">
                  {new Date(visita.fechaHora).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </div>

            {visita?.realizado && (
              <textarea
                rows={2}
                className="mt-1 w-full border rounded px-2 py-1 text-xs"
                placeholder="Observaciones"
                value={visita?.observaciones || ""}
                onChange={(e) =>
                  handleObsChange(servicio, e.target.value)
                }
              />
            )}
          </div>
        );
      })}

      <button
        onClick={confirmarVisitas}
        disabled={guardando}
        className="mt-3 w-full bg-blue-600 text-white py-2 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
      >
        {guardando ? "Guardando..." : "✅ Confirmar visitas"}
      </button>
    </div>
  );
}
