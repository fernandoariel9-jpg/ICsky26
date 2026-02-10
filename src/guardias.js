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


export default function GuardiasServicios({ personalId }) {
const [visitas, setVisitas] = useState({});


const handleCheck = async (servicio, checked) => {
const ahora = new Date().toISOString();


setVisitas((prev) => ({
...prev,
[servicio]: {
...prev[servicio],
realizado: checked,
fechaHora: checked ? ahora : null,
},
}));


if (checked) {
await fetch("/api/guardias", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({
personal_id: personalId,
servicio,
fecha_hora: ahora,
observaciones: visitas[servicio]?.observaciones || "",
}),
});
}
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
{new Date(visitas[servicio].fechaHora).toLocaleTimeString()}
</span>
)}
</div>


<textarea
className="mt-2 w-full border rounded p-2"
placeholder="Observaciones (opcional)"
value={visitas[servicio]?.observaciones || ""}
onChange={(e) => handleObsChange(servicio, e.target.value)}
/>
</div>
))}
</div>
);
}
