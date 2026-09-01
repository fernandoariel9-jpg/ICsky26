import { useState } from "react";
import { API_URL } from "./config";
import { useEffect } from "react";
import { useRef } from "react";
import EquiposPorServicio from "./EquiposPorServicio";

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
const [cantidadVencidos, setCantidadVencidos] = useState(0);
const [equiposProximos, setEquiposProximos] = useState([]);
const [cantidadProximos, setCantidadProximos] = useState(0);
const [mostrarProximos, setMostrarProximos] = useState(false);
const [cargandoProximos, setCargandoProximos] = useState(false);
const [mostrarPorServicio, setMostrarPorServicio] = useState(false);

useEffect(() => {
fetchEstados();
}, []);

useEffect(() => {
const tareaGuardada = localStorage.getItem("tareaActiva");
if (!tareaGuardada) return;
const tarea = JSON.parse(tareaGuardada);
if (tarea.numero_serie) setSerie(tarea.numero_serie);
}, []);

useEffect(() => {
const equipoActualizado = localStorage.getItem("equipoActualizado");
if (equipoActualizado) {
localStorage.removeItem("equipoActualizado");
buscarEquipo(equipoActualizado);
return;
}
if (serie) buscarEquipo();
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

const cargarEquiposProximos = async () => {
try {
setCargandoProximos(true);
const res = await fetch(`${API_URL.EquiposMantenimientoProximo}?area=${encodeURIComponent(personal?.area || "")}`);
if (!res.ok) throw new Error("Error al obtener equipos próximos");
const data = await res.json();
setEquiposProximos(data.equipos);
setCantidadProximos(data.total);
setMostrarProximos(true);
} catch (error) {
console.error("Error equipos próximos:", error);
alert("No se pudieron obtener los equipos con mantenimiento próximo");
} finally {
setCargandoProximos(false);
}
};

const cargarEquiposVencidos = async () => {
try {
setCargandoVencidos(true);
const res = await fetch(`${API_URL.EquiposMantenimientoVencido}?area=${encodeURIComponent(personal?.area || "")}`);
if (!res.ok) throw new Error("Error al obtener equipos vencidos");
const data = await res.json();
setEquiposVencidos(data.equipos);
setCantidadVencidos(data.total);
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
body: JSON.stringify({ estado: nuevoEstado, usuario: personal.nombre })
});
if (!res.ok) throw new Error("Error HTTP");
const actualizado = await res.json();
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
reader.onload = (ev) => { img.src = ev.target.result; };
img.onload = async () => {
const MAX_WIDTH = 600;
const MAX_HEIGHT = 600;
let width = img.width;
let height = img.height;
if (width > MAX_WIDTH || height > MAX_HEIGHT) {
const escala = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
width = Math.round(width * escala);
height = Math.round(height * escala);
}
const canvas = document.createElement("canvas");
canvas.width = width;
canvas.height = height;
const ctx = canvas.getContext("2d");
ctx.drawImage(img, 0, 0, width, height);
const imagenComprimida = canvas.toDataURL("image/jpeg", 0.6);
try {
const res = await fetch(`${API_URL.Equipos}/${encodeURIComponent(equipo.numero_serie)}/imagen`, {
method: "PUT",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ imagen: imagenComprimida })
});
const data = await res.json();
if (!res.ok) throw new Error(data.error || "Error al guardar la imagen");
setEquipo({ ...equipo, imagen: imagenComprimida });
alert("Imagen guardada correctamente.");
} catch (err) {
console.error(err);
alert("No se pudo guardar la imagen.");
}
};
reader.readAsDataURL(archivo);
};

const abrirRIC37 = () => {
if (!equipo) {
alert("Primero seleccione un equipo.");
return;
}
if (!equipo.mantenimiento_id) {
alert("Primero debe iniciar el mantenimiento para poder realizar el RIC37.");
return;
}
localStorage.setItem("tareaActiva", JSON.stringify({
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
}));
setVista("ric37");
};

const abrirRIC44 = () => {
if (!equipo) {
alert("Primero seleccione un equipo.");
return;
}
localStorage.setItem("tareaActiva", JSON.stringify({
id: equipo.mantenimiento_id || null,
ric01_id: equipo.mantenimiento_id || null,
equipo_id: equipo.id,
numero_serie: equipo.numero_serie,
descripcion: equipo.descripcion,
marca_modelo: equipo.marca_modelo,
area: equipo.area,
servicio: equipo.servicio,
sub_servicio: equipo.sub_servicio,
tipo_mantenimiento: equipo.tipo_mantenimiento || ""
}));
setVista("ric44");
};

// El resto de la lógica existente de Equipos.jsx permanece debajo de estas funciones.
