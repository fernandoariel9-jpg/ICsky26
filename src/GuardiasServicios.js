import React, { useState } from "react";

const SERVICIOS = [
  "STIA",
  "Cardiología",
  "SMU",
  "SMU Pediátrica",
  "SMU RX",
  "Pediatría",
  "Neonatología",
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

      onConfirmar(); // 🔙 volver a tareas
    } catch (error) {
      console.error("Error guardando guardias", error);
      alert("Error al guardar las visitas");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Servicios a Visitar</h2>

      {SERVICIOS.map((servicio) => (
        <div key={servicio} className="p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={visitas[servicio]?.realizado || false}
              onChange={(e) => handleCheck(servicio, e.target.checked)}
            />
            <span className="font-medium">{servicio}</span>

            {visitas[servicio]?.fechaHora && (
              <span className="text-sm text-gray-500">
                {new Date(
                  visitas[servicio].fechaHora
                ).toLocaleTimeString()}
              </span>
            )}
          </div>

          <textarea
            className="mt-2 w-full border rounded p-2"
            placeholder="Observaciones (opcional)"
            value={visitas[servicio]?.observaciones || ""}
            onChange={(e) =>
              handleObsChange(servicio, e.target.value)
            }
          />
        </div>
      ))}

      {/* BOTÓN CONFIRMAR */}
      <button
        onClick={confirmarVisitas}
        disabled={guardando}
        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {guardando ? "Guardando..." : "✅ Confirmar visitas"}
      </button>
    </div>
  );
}
