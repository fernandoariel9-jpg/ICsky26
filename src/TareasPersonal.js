import React, { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { API_URL } from "./config";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import RegistroUsuario from "./RegistroUsuario";
import { FaWhatsapp } from "react-icons/fa";
import { FaSearch } from "react-icons/fa";

const API_TAREAS = API_URL.Tareas;
const API_AREAS = API_URL.Areas;

export default function TareasPersonal({ personal, onLogout }) {
  const [tareas, setTareas] = useState([]);
  const [soluciones, setSoluciones] = useState({});
  const [imagenAmpliada, setImagenAmpliada] = useState(null);
  const [filtro, setFiltro] = useState("pendientes");
  const [areas, setAreas] = useState([]);
  const [modal, setModal] = useState(null);
  const [nuevaArea, setNuevaArea] = useState("");
  const [editando, setEditando] = useState({});
  const [notificacionesActivas, setNotificacionesActivas] = useState(false);
  const [mostrarRegistro, setMostrarRegistro] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [usuarios, setUsuarios] = useState([]);
  const [mostrarUsuarios, setMostrarUsuarios] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [editUsuario, setEditUsuario] = useState({});
  const [mostrarRic02, setMostrarRic02] = useState(null);
  const [valorRic02, setValorRic02] = useState("");
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [mostrarObservacion, setMostrarObservacion] = useState(false);
  const [observacion, setObservacion] = useState("");
  const [tareaObsId, setTareaObsId] = useState(null);
  const [tareaObservacionActual, setTareaObservacionActual] = useState("");

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

  function formatTimestamp(ts) {
    if (!ts) return "";
    if (/^\d{2}\/\d{2}\/\d{4}/.test(ts)) return ts;
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(ts)) {
      const [fechaPart, horaPart] = ts.split(" ");
      const [year, month, day] = fechaPart.split("-").map(Number);
      const [hour, min, sec = "00"] = horaPart.split(":");
      return `${String(day).padStart(2,"0")}/${String(month).padStart(2,"0")}/${year}, ${String(hour).padStart(2,"0")}:${String(min).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
    }
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

  function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  async function registrarPush(userId) {
    if (!("serviceWorker" in navigator)) return;

    const registration = await navigator.serviceWorker.register("/sw.js");
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      setNotificacionesActivas(false);
      return;
    }

    setNotificacionesActivas(true);

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(process.env.REACT_APP_VAPID_PUBLIC_KEY),
    });
    console.log("📬 Suscripción creada:", subscription);
    console.log("Enviando suscripción al backend:", { userId, subscription });

    await fetch(`${API_URL.Base}/suscribir`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, subscription }),
    });

    toast.success("✅ Notificaciones activadas correctamente");
  }

  async function toggleNotificaciones(userId) {
    try {
      if (notificacionesActivas) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          const subscription = await registration.pushManager.getSubscription();
          if (subscription) {
            await subscription.unsubscribe();
            await fetch(`${API_URL.Base}/desuscribir`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId }),
            });
          }
        }
        setNotificacionesActivas(false);
        toast.info("🔕 Notificaciones desactivadas");
      } else {
        await registrarPush(userId);
      }
    } catch (error) {
      console.error("Error al alternar notificaciones:", error);
      toast.error("❌ Error al alternar notificaciones");
    }
  }

  const fetchTareas = async () => {
    try {
      if (!personal?.area) return;
      const res = await fetch(`${API_TAREAS}/${encodeURIComponent(personal.area)}`);
      if (!res.ok) throw new Error("Error HTTP " + res.status);
      const data = await res.json();
      setTareas(data);
    } catch (err) {
      console.error("Error al cargar tareas:", err);
      toast.error("Error al cargar tareas ❌");
    }
  };

  const guardarObservacion = async () => {
  try {
    const fecha = getFechaLocal();

    const nuevaLinea = `[${fecha}] ${observacion}`;

    const observacionFinal =
      (tareaObservacionActual || "").trim()
        ? `${tareaObservacionActual}\n${nuevaLinea}`
        : nuevaLinea;

    await fetch(`${API_TAREAS}/${tareaObsId}/observacion`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ observacion: observacionFinal }),
    });

    toast.success("Observación agregada");
    setMostrarObservacion(false);
    setObservacion("");

    fetchTareas();
  } catch (error) {
    console.error(error);
    toast.error("Error al guardar observación");
  }
};

  const fetchAreas = async () => {
    try {
      const res = await fetch(API_AREAS);
      if (!res.ok) throw new Error("Error HTTP " + res.status);
      const data = await res.json();
      setAreas(data);
    } catch (err) {
      console.error("Error al cargar áreas:", err);
    }
  };

 const fetchUsuarios = async () => {
  try {
    const res = await fetch(`${API_URL.Base}/usuarios`);
    if (!res.ok) throw new Error("Error al obtener usuarios");

    const data = await res.json();

    // 👉 Guardamos TODOS los usuarios
    setUsuarios(data);

  } catch (err) {
    console.error("Error al cargar usuarios:", err);
    toast.error("❌ No se pudieron cargar los usuarios");
  }
};

  const verUsuariosFiltrados = () => {
  if (!usuarios.length) return;

  const area = personal.area?.trim().toUpperCase();

  // 👉 Si es administrador ve todos
  if (area === "ADMIN") {
    setUsuarios(usuarios);
    setMostrarUsuarios(true);
    return;
  }

  // 👉 Sino filtramos por área
  const filtrados = usuarios.filter(
    (u) => u.area?.trim().toUpperCase() === area
  );

  setUsuarios(filtrados);
  setMostrarUsuarios(true);
};

  const verUsuarios = async () => {
  try {
    const res = await fetch(`${API_URL.Base}/usuarios`);
    if (!res.ok) throw new Error("Error al obtener usuarios");

    const data = await res.json();

    const area = personal.area?.trim().toUpperCase();

    // 👉 ADMIN ve todos
    const filtrados =
      area === "ADMIN"
        ? data
        : data.filter(
            (u) => u.area?.trim().toUpperCase() === area
          );

    setUsuarios(filtrados);
    setMostrarUsuarios(true); // 👉 ahora SÍ se muestran
    console.log("Usuarios filtrados:", filtrados);

  } catch (err) {
    console.error("Error al cargar usuarios:", err);
    toast.error("❌ No se pudieron cargar los usuarios");
  }
};
  
  const handleSeleccionUsuario = (u) => {
  setEditUsuario({
    id: u.id,
    nombre: u.nombre,
    mail: u.mail,
    movil: u.movil,
    area: u.area || "",
  });
  setUsuarioSeleccionado(true);
};

  useEffect(() => {
    fetchTareas();
    fetchAreas();
  }, [personal]);

  useEffect(() => {
    const BACKEND_URL = "https://sky26.onrender.com";
    const mantenerActivo = () => {
      fetch(BACKEND_URL)
        .then(() => console.log("✅ Ping al backend exitoso"))
        .catch(() => console.warn("⚠️ Falló el ping al backend"));
    };

    if ("Notification" in window) {
      setNotificacionesActivas(Notification.permission === "granted");
    }

    mantenerActivo();
    const interval = setInterval(mantenerActivo, 8 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!personal?.id) return;

    if (Notification.permission === "granted") {
      registrarPush(personal.id);
    } else if (Notification.permission === "default") {
      toast.info("🔔 Activa las notificaciones para recibir nuevas tareas");
    }
  }, [personal]);

  const handleSolucionChange = (id, value) => {
    setSoluciones((prev) => ({ ...prev, [id]: value }));
  };

  const handleCompletar = async (id) => {
    try {
      const fecha_comp = getFechaLocal();
      const textoSolucion = soluciones[id] || "";

// 👉 Agregar fecha y hora al inicio del texto
      const solucion = `[${fecha_comp}] ${textoSolucion}`;
      const url = `${API_TAREAS}/${id}/solucion`;
      const res = await fetch(url, {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ solucion, asignado: personal.nombre, fecha_comp }),
});

// 🚫 solución bloqueada por observaciones
if (res.status === 403) {
  toast.error("🔒 La solución está bloqueada porque se inicia trámite administrativo");
  return;
}

if (!res.ok) throw new Error("Error HTTP " + res.status);
      setTareas((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, solucion, asignado: personal.nombre, fecha_comp } : t
        )
      );
      toast.success("✅ Solución guardada");
    } catch (err) {
      console.error("Error al guardar solución", err);
      toast.error("❌ Error al guardar solución");
    }
  };

  const handleEditarSolucion = async (id) => {
  try {
    const textoNuevo = soluciones[id];
    if (!textoNuevo) {
      toast.warn("Escriba una nueva solución antes de guardar ✏️");
      return;
    }

    // 👉 buscamos la solución actual
    const tareaActual = tareas.find((t) => t.id === id);
    const solucionAnterior = tareaActual?.solucion || "";

    const fecha = getFechaLocal();

    // 👉 armamos historial
    const solucionFinal = solucionAnterior
      ? `${solucionAnterior}\n[${fecha}] ${textoNuevo}`
      : `[${fecha}] ${textoNuevo}`;

    const url = `${API_TAREAS}/${id}/solucion`;
const res = await fetch(url, {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    solucion: solucionFinal,
    asignado: personal.nombre,
  }),
});

// 🚫 solución bloqueada por observaciones
if (res.status === 403) {
  toast.error("🔒 La solución está bloqueada porque se inicia trámite administrativo");
  return;
}

if (!res.ok) throw new Error("Error HTTP " + res.status);

    setTareas((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, solucion: solucionFinal } : t
      )
    );

    // limpiamos input y salimos de edición
    setSoluciones((prev) => ({ ...prev, [id]: "" }));
    setEditando(null);

    toast.success("📝 Historial de solución actualizado");
  } catch (err) {
    console.error("Error al editar solución", err);
    toast.error("❌ Error al actualizar solución");
  }
};

  const handleReasignar = async (id) => {
    try {
      if (!nuevaArea) {
        toast.warn("Seleccione una nueva área antes de confirmar");
        return;
      }
      const url = `${API_TAREAS}/${id}/reasignar`;
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nueva_area: nuevaArea, reasignado_por: personal.nombre }),
      });
      if (!res.ok) throw new Error("Error HTTP " + res.status);
      toast.success(`🔄 Tarea #${id} reasignada a ${nuevaArea}`);
      setModal(null);
      setNuevaArea("");
      fetchTareas();
    } catch (err) {
      console.error("Error al reasignar tarea:", err);
      toast.error("❌ Error al reasignar tarea");
    }
  };

  const guardarCambiosUsuario = async () => {
  try {
    const res = await fetch(`${API_URL.Base}/usuarios/${editUsuario.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editUsuario),
    });

    if (!res.ok) throw new Error("Error al actualizar usuario");

    toast.success("✅ Usuario actualizado correctamente");
    setUsuarioSeleccionado(null);
    fetchUsuarios();
  } catch (err) {
    console.error(err);
    toast.error("❌ Error al guardar cambios");
  }
};

const cambiarPassword = async (id) => {
  const nueva = prompt("Ingrese la nueva contraseña:");
  if (!nueva) return;

  try {
    const res = await fetch(`${API_URL.Base}/usuarios/${id}/password`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: nueva }),
    });

    if (!res.ok) throw new Error("Error al cambiar contraseña");

    toast.success("🔐 Contraseña actualizada");
  } catch (err) {
    console.error(err);
    toast.error("❌ Error al cambiar contraseña");
  }
};

    // 👉 Si el usuario elige "Registrar Usuario", mostrar ese formulario
  if (mostrarRegistro) {
    return <RegistroUsuario onCancelar={() => setMostrarRegistro(false)} />;
  }

  const pendientes = tareas.filter((t) => !t.solucion && !t.fin);
  const enProceso = tareas.filter((t) => t.solucion && !t.fin);
  const finalizadas = tareas.filter((t) => t.fin);

  // 🔍 Filtrado global por búsqueda
let tareasFiltradas = [];

if (busqueda.trim()) {
  const texto = busqueda.toLowerCase();
  tareasFiltradas = tareas.filter((t) => {
    const valores = Object.values(t).join(" ").toLowerCase();
    return valores.includes(texto);
  });
} else {
  tareasFiltradas =
    filtro === "pendientes"
      ? pendientes
      : filtro === "enProceso"
      ? enProceso
      : finalizadas;
}

  const handleExportarPDF = async () => {
    const nombreLista =
      filtro === "pendientes"
        ? "Pendientes"
        : filtro === "enProceso"
        ? "En proceso"
        : "Finalizadas";

    if (tareasFiltradas.length === 0) {
      toast.info("No hay tareas para exportar 📭");
      return;
    }

    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const fecha = new Date().toLocaleString();
    const img = new Image();
    img.src = "/logosmall_old.png";
    doc.addImage(img, "PNG", 10, 8, 20, 20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("IC-SkyApp", 35, 16);
    doc.setFontSize(12);
    doc.setTextColor(60, 60, 60);
    doc.text(`Informe de tareas ${nombreLista}`, 35, 23);
    doc.line(10, 30, 287, 30);
    const dataExportar = tareasFiltradas.map((t) => [
      t.id,
      t.tarea,
      t.usuario,
      t.servicio || "",
      t.subservicio || "",
      t.area || "",
      t.reasignado_a || "",
      t.reasignado_por || "",
      t.solucion || "",
    ]);
    autoTable(doc, {
      startY: 35,
      head: [["ID", "Tarea", "Usuario", "Servicio", "Subservicio", "Área", "Reasignada a", "Reasignada por", "Solución"]],
      body: dataExportar,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [0, 102, 204], textColor: 255 },
    });
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(`IC-SkyApp – Sistema de gestión de tareas`, 14, 200);
      doc.text(`Fecha: ${fecha}`, 230, 200);
      doc.text(`Página ${i} de ${pageCount}`, 140, 200);
    }
    doc.save(`Tareas_${nombreLista}_${new Date().toISOString().slice(0, 10)}.pdf`);
    toast.success(`✅ Exportado en PDF (${nombreLista})`);
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <p className={`text-center mb-4 font-semibold ${notificacionesActivas ? "text-green-600" : "text-red-600"}`}>
        {notificacionesActivas ? "🔔 Notificaciones activadas" : "🔕 Notificaciones desactivadas"}
     <button
          onClick={() => toggleNotificaciones(personal.id)}
          className="bg-yellow-500 text-white px-3 py-1 rounded-xl text-sm"
        >
          {notificacionesActivas ? "🔕 Desactivar notificaciones" : "🔔 Activar notificaciones"}
        </button>
</p>

      <img src="/logosmall_old.png" alt="Logo" className="mx-auto mb-4 w-12 h-auto" />
      <h1 className="text-2xl font-bold mb-4 text-center">
        📌 Registro de tareas de{" "}
        <span className="text-blue-700">{personal?.nombre || personal?.mail || "Personal"}</span>
      </h1>

      <div className="flex space-x-2 mb-4 justify-center">
        <button onClick={fetchTareas} className="bg-blue-400 text-white px-3 py-1 rounded-xl text-sm">
          🔄 Actualizar lista
        </button>
        <div className="relative">
  <button
    onClick={() => setMenuAbierto((v) => !v)}
    className="bg-gray-700 text-white px-4 py-2 rounded-xl text-sm flex items-center gap-2"
  >
    ☰ Acciones
  </button>

  {menuAbierto && (
    <div className="absolute right-0 mt-2 w-56 bg-white border rounded-xl shadow-lg z-50">
      
      <button
        onClick={() => {
          handleExportarPDF();
          setMenuAbierto(false);
        }}
        className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
      >
        📄 Exportar lista en PDF
      </button>

      <button
        onClick={() => {
          setMostrarRegistro(true);
          setMenuAbierto(false);
        }}
        className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
      >
        ➕ Registrar usuario
      </button>

      <button
        onClick={() => {
          verUsuarios();
          setMenuAbierto(false);
        }}
        className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
      >
        👥 Ver usuarios
      </button>

      <div className="border-t my-1" />

      <button
        onClick={() => {
          setMenuAbierto(false);
          onLogout();
        }}
        className="w-full text-left px-4 py-2 hover:bg-red-100 text-red-600 text-sm"
      >
        🚪 Cerrar sesión
      </button>
    </div>
  )}
</div>
      </div>
{mostrarUsuarios && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-4 rounded-xl w-80 shadow-lg">
      <h2 className="text-xl font-bold mb-3">Usuarios Registrados</h2>

      <ul className="max-h-60 overflow-y-auto">
        {usuarios.map((u) => (
          <li
  key={u.id}
  className="border-b py-2 cursor-pointer hover:bg-gray-100"
  onClick={() => handleSeleccionUsuario(u)}
>
            <strong>{u.nombre}</strong>
            <br />
            <span className="text-gray-600 text-sm">{u.mail}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={() => setMostrarUsuarios(false)}
        className="mt-3 bg-red-500 text-white px-3 py-1 rounded-xl w-full"
      >
        Cerrar
      </button>
    </div>
  </div>
)}

{usuarioSeleccionado && (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded-2xl shadow-2xl w-96 animate-fadeIn">

      <h2 className="text-2xl font-bold mb-4 text-center text-blue-700">
        Editar Usuario
      </h2>

      <div className="space-y-3">
        <div>
          <label className="text-sm font-semibold">Nombre</label>
          <input
            className="border w-full p-2 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={editUsuario.nombre}
            onChange={(e) =>
              setEditUsuario({ ...editUsuario, nombre: e.target.value })
            }
          />
        </div>

        <div>
          <label className="text-sm font-semibold">Email</label>
          <input
            className="border w-full p-2 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={editUsuario.mail}
            onChange={(e) =>
              setEditUsuario({ ...editUsuario, mail: e.target.value })
            }
          />
        </div>

        <div>
          <label className="text-sm font-semibold">Área</label>
          <input
            className="border w-full p-2 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={editUsuario.area}
            onChange={(e) =>
              setEditUsuario({ ...editUsuario, area: e.target.value })
            }
          />
        </div>
      </div>

      <div className="mt-5 space-y-2">

        <button
          onClick={() => cambiarPassword(editUsuario.id)}
          className="w-full py-2 rounded-lg bg-yellow-500 text-white font-semibold hover:bg-yellow-600"
        >
          Cambiar contraseña
        </button>

        <button
          onClick={guardarCambiosUsuario}
          className="w-full py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700"
        >
          Guardar Cambios
        </button>

        <button
          onClick={() => setUsuarioSeleccionado(null)}
          className="w-full py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600"
        >
          Cerrar
        </button>

      </div>
    </div>
  </div>
)}

{/* 🔍 Cuadro de búsqueda global */}
<div className="relative my-3">
  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
  <input
    type="text"
    placeholder="Buscar en todas las columnas..."
    value={busqueda}
    onChange={(e) => setBusqueda(e.target.value.toLowerCase())}
    className="w-full pl-10 pr-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-400"
  />
</div>

 {/* Filtros */}
      <div className="flex justify-center space-x-2 mb-4">
        <button
          onClick={() => setFiltro("pendientes")}
          className={`px-3 py-1 rounded-xl ${filtro === "pendientes" ? "bg-yellow-400 text-white" : "bg-gray-200 text-gray-700"}`}
        >
          🕓 Pendientes ({pendientes.length})
        </button>
        <button
          onClick={() => setFiltro("enProceso")}
          className={`px-3 py-1 rounded-xl ${filtro === "enProceso" ? "bg-blue-400 text-white" : "bg-gray-200 text-gray-700"}`}
        >
          🧩 En proceso ({enProceso.length})
        </button>
        <button
          onClick={() => setFiltro("finalizadas")}
          className={`px-3 py-1 rounded-xl ${filtro === "finalizadas" ? "bg-green-500 text-white" : "bg-gray-200 text-gray-700"}`}
        >
          ✅ Finalizadas ({finalizadas.length})
        </button>
      </div>

      {/* Lista de tareas */}
      <ul className="space-y-3">
  {tareasFiltradas.length === 0 && (
    <p className="text-center text-gray-500 italic">
      No hay tareas en esta categoría.
    </p>
  )}

  {tareasFiltradas.map((t) => {
  const tieneObservacion =
    t.observacion && t.observacion.trim() !== "";

  return (
    <li key={t.id} className="p-3 rounded-xl shadow bg-white">
      <div className="flex items-start space-x-3">
        {/* Imagen clickeable para ampliar */}
        {t.imagen && (
          <img
            src={`data:image/jpeg;base64,${t.imagen}`}
            alt="Foto de tarea"
            className="w-14 h-14 rounded-lg object-cover cursor-pointer"
            onClick={() =>
              setImagenAmpliada(`data:image/jpeg;base64,${t.imagen}`)
            }
          />
        )}

        <div className="flex-1">
          <p className="font-semibold text-base">
            🆔 #{t.id} — 📝 {t.tarea}
          </p>

          <p className="text-sm text-gray-700">
  👤 Usuario: <span className="font-medium">{t.usuario}</span>
</p>

{t.movil && (
  <button
    onClick={() => {
      const mensaje = `Hola ${t.usuario}, soy ${personal.nombre} del Servicio de Ingeniería Clínica, te contacto respecto a tu pedido de tarea #${t.id}: '${t.tarea}'.`;
      const numero = t.movil.replace(/\D/g, ""); // limpia caracteres no numéricos
      const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
      window.open(url, "_blank");
    }}
    className="mt-1 flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs shadow-sm transition"
  >
    <FaWhatsapp size={14} />
    Contactar usuario
  </button>
)}
          <p className="text-sm text-gray-700">
            🏢 Área: <span className="font-medium">{t.area || "—"}</span>
          </p>
          <p className="text-sm text-gray-700">
            🧰 Servicio: <span className="font-medium">{t.servicio || "—"}</span>
          </p>
          {t.subservicio && (
            <p className="text-sm text-gray-700">
              🧩 Subservicio: <span className="font-medium">{t.subservicio}</span>
            </p>
          )}

          {t.reasignado_a && (
            <p className="text-sm text-purple-700 mt-1">
              🔄 Reasignada a <strong>{t.reasignado_a}</strong> por{" "}
              <strong>{t.reasignado_por}</strong> (desde {t.area})
            </p>
          )}

          {t.fecha && (
            <p className="text-sm text-gray-600 mt-1">
              📅 {formatTimestamp(t.fecha)}
            </p>
          )}

          {t.solucion && (
  <div className="mt-2 bg-gray-100 rounded p-2">
    <p className="text-sm font-semibold mb-1">💡 Historial de solución</p>

    <ul className="text-sm space-y-1 list-disc list-inside">
      {t.solucion
  .split("\n")
  .filter((l) => l.trim())
  .map((linea, idx) => (
    <li key={idx} className="text-gray-700">
      {linea}
    </li>
  ))}
    </ul>
  </div>
)}

          {t.fecha_comp && (
            <p className="text-xs text-gray-500 mt-1">
              ⏰ Solucionado el {formatTimestamp(t.fecha_comp)}
            </p>
          )}

{t.observacion && (
  <div className="mt-2 bg-blue-50 border border-blue-200 rounded p-2">
    <p className="text-sm font-semibold mb-1 text-blue-700">
      📝 Procesos administrativos
    </p>

    <ul className="text-sm space-y-1 list-disc list-inside">
      {t.observacion
        .split("\n")
        .filter((l) => l.trim())
        .map((linea, idx) => (
          <li key={idx} className="text-gray-700">
            {linea}
          </li>
        ))}
    </ul>
  </div>
)}
          {t.fecha_fin && (
            <p className="text-xs text-gray-500 mt-1">
              ⏰ Finalizado el {formatTimestamp(t.fecha_fin)}
            </p>
          )}

          {/* Botones según tipo de lista */}
          <div className="mt-3">
            {filtro === "pendientes" && (
  <>
    <button
      onClick={() => setModal(t)}
      className="px-3 py-1 bg-purple-500 text-white rounded text-sm mr-2"
    >
      🔄 Reasignar
    </button>

    <textarea
      className="w-full p-2 border rounded mt-2"
      placeholder="Escriba la solución..."
      value={soluciones[t.id] || t.solucion || ""}
      onChange={(e) => handleSolucionChange(t.id, e.target.value)}
      disabled={!!t.solucion}
    />

    {/* BOTONES */}
    <div className="flex gap-2 mt-2">
      <button
        onClick={() => setMostrarRic02(t.id)}
        className="bg-blue-500 text-white px-3 py-1 rounded"
      >
        Asociar a RIC02
      </button>

      <button
        onClick={() => handleCompletar(t.id)}
        className={`px-3 py-1 rounded text-white ${
          t.solucion
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-green-500"
        }`}
        disabled={!!t.solucion}
      >
        ✅ Completar
      </button>
    </div>

    {/* CUADRO RIC02 */}
    {mostrarRic02 === t.id && (
      <div className="mt-2 flex items-center gap-2">
        <input
          type="number"
          placeholder="Nº RIC02"
          value={valorRic02}
          onChange={(e) => setValorRic02(e.target.value)}
          className="border p-1 rounded w-32"
        />

        <button
          onClick={() => {
            const textoRic02 = `Asociado a RIC02 Nº ${valorRic02}`;
            handleSolucionChange(
              t.id,
              (soluciones[t.id] || t.solucion || "") +
                ((soluciones[t.id] || t.solucion) ? "\n" : "") +
                textoRic02
            );
            setValorRic02("");
            setMostrarRic02(null);
          }}
          className="bg-green-600 text-white px-3 py-1 rounded"
        >
          OK
        </button>
      </div>
    )}
  </>
)}

            {filtro === "enProceso" && !t.fin && (
  <>
    {/* BOTÓN ASOCIAR RIC02 */}
    <button
      onClick={() => setMostrarRic02(t.id)}
      className="bg-blue-500 text-white px-3 py-1 rounded mt-2"
    >
      Asociar a RIC02
    </button>

    {/* CUADRO RIC02 */}
    {mostrarRic02 === t.id && (
      <div className="mt-2 flex items-center gap-2">
        <input
          type="number"
          placeholder="Nº RIC02"
          value={valorRic02}
          onChange={(e) => setValorRic02(e.target.value)}
          className="border p-1 rounded w-32"
        />
        <button
          onClick={() => {
            const textoRic02 = `Asociado a RIC02 Nº ${valorRic02}`;
            handleSolucionChange(
              t.id,
              (soluciones[t.id] ?? t.solucion ?? "") +
                ((soluciones[t.id] ?? t.solucion) ? "\n" : "") +
                textoRic02
            );
            setValorRic02("");
            setMostrarRic02(null);
          }}
          className="bg-green-600 text-white px-3 py-1 rounded"
        >
          OK
        </button>
      </div>
    )}

    {/* EDICIÓN DE SOLUCIÓN */}
    {editando === t.id ? (
      <>
        <textarea
  className="w-full p-2 border rounded mt-2"
  placeholder="Agregar nueva entrada al historial..."
  value={soluciones[t.id] || ""}
  onChange={(e) => handleSolucionChange(t.id, e.target.value)}
/>
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => handleEditarSolucion(t.id)}
            className="px-3 py-1 rounded bg-blue-500 text-white text-sm"
          >
            💾 Guardar
          </button>
          <button
            onClick={() => setEditando(null)}
            className="px-3 py-1 rounded bg-gray-400 text-white text-sm"
          >
            ❌ Cancelar
          </button>
        </div>
      </>
    ) : (
      <div className="flex gap-2 mt-2">
  {!tieneObservacion ? (
  <button
    onClick={() => {
      setEditando(t.id);
      setSoluciones((prev) => ({ ...prev, [t.id]: "" }));
    }}
    className="mt-2 px-3 py-1 rounded bg-yellow-500 text-white"
  >
    ✏️ Editar solución
  </button>
) : (
  <p className="mt-2 text-sm text-red-600">
    🔒 Solución bloqueada por observaciones
  </p>
)}

  <button
  onClick={() => {
    setTareaObsId(t.id);
    setTareaObservacionActual(t.observacion || "");
    setObservacion("");
    setMostrarObservacion(true);
  }}
  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
>
  📝 Obs.
</button>
</div>
    )}
  </>
)}
          </div>
        </div>
      </div>
    </li>
  ))}
</ul>

{/* Modal de imagen ampliada */}
{imagenAmpliada && (
  <div
    className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
    onClick={() => setImagenAmpliada(null)}
  >
    <img
      src={imagenAmpliada}
      alt="Ampliada"
      className="max-w-full max-h-full rounded-lg shadow-lg"
    />
  </div>
)}

      {/* Modal de reasignación */}
      {modal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-80">
            <h2 className="text-lg font-bold mb-3">🔄 Reasignar tarea #{modal.id}</h2>
            <label className="block mb-2">Seleccionar nueva área:</label>
            <select className="border rounded p-2 w-full mb-4" value={nuevaArea} onChange={(e) => setNuevaArea(e.target.value)}>
              <option value="">Seleccione...</option>
              {areas.map((a) => (
                <option key={a.id} value={a.area}>{a.area}</option>
              ))}
            </select>
            <div className="flex justify-end space-x-2">
              <button onClick={() => setModal(null)} className="bg-gray-300 px-3 py-1 rounded">Cancelar</button>
              <button onClick={() => handleReasignar(modal.id)} className="bg-purple-600 text-white px-3 py-1 rounded">Confirmar</button>
            </div>
          </div>
        </div>
      )}

        {mostrarObservacion && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-4 rounded-lg w-full max-w-md">
      <h3 className="text-lg font-semibold mb-2">
        Observaciones
      </h3>

      <textarea
        value={observacion}
        onChange={(e) => setObservacion(e.target.value)}
        rows={5}
        className="w-full border rounded p-2 text-sm"
        placeholder="Escriba una observación..."
      />

      <div className="flex justify-end gap-2 mt-3">
        <button
          onClick={() => setMostrarObservacion(false)}
          className="px-3 py-1 text-sm bg-gray-300 rounded"
        >
          Cancelar
        </button>

        <button
          onClick={guardarObservacion}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded"
        >
          Guardar
        </button>
      </div>
    </div>
  </div>
)}

      <ToastContainer position="bottom-right" autoClose={2000} />
    </div>
  );
}





















