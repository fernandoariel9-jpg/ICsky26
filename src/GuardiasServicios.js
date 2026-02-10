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
    ([, data]) => data?.realizado
  );

    console.log("✅ visitasRealizadas:", visitasRealizadas);

  if (visitasRealizadas.length === 0) {
    alert("No seleccionaste ningún servicio");
    return;
  }

  setGuardando(true);

  try {
    for (const [servicio, data] of visitasRealizadas) {
      const resp = await fetch("/api/guardias", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personal_id: personalId,
          servicio,
          fecha_hora: data.fechaHora,
          observaciones: data.observaciones || "",
        }),
      });

      console.log("🧪 personalId:", personalId);
console.log("🧪 visitas:", visitas);

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || "Error guardando guardia");
      }
    }

    // volver a la vista de tareas
    if (typeof onConfirmar === "function") {
      onConfirmar();
    }
  } catch (error) {
    console.error("Error guardando guardias", error);
    alert("Error al guardar las visitas");
  } finally {
    setGuardando(false);
  }
};

  return (
    <div className="pb-24 text-sm">
      <h2 className="text-lg font-semibold mb-2">
        🛡️ Guardias
      </h2>

      <div className="space-y-1">
        {SERVICIOS.map((servicio) => {
          const visita = visitas[servicio];

          return (
            <div
              key={servicio}
              className="border rounded-md px-2 py-2"
            >
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="w-5 h-5"
                  checked={visita?.realizado || false}
                  onChange={(e) =>
                    handleCheck(servicio, e.target.checked)
                  }
                />

                <span className="flex-1 leading-tight">
                  {servicio}
                </span>

                {visita?.fechaHora && (
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {new Date(visita.fechaHora).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
              </label>

              {visita?.realizado && (
                <textarea
                  rows={2}
                  className="mt-2 w-full border rounded px-2 py-1 text-xs"
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
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-3">
        <button
          onClick={confirmarVisitas}
          disabled={guardando}
          className="w-full bg-blue-600 text-white py-3 rounded-xl text-base font-semibold disabled:opacity-50"
        >
          {guardando ? "Guardando..." : "✅ Confirmar visitas"}
        </button>
      </div>
    </div>
  );
}
